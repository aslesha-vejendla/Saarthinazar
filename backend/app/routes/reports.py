import re
import shutil

from pathlib import Path

import pandas as pd

from fastapi import (
    APIRouter,
    Depends,
    File,
    Form,
    HTTPException,
    UploadFile,
)

from sqlalchemy.orm import Session

from app.database import get_db

from app.models.report_upload import ReportUpload
from app.models.team import Team
from app.models.usage import SubUserUsage

from app.services.naukri_rules import (
    add_audit,
    create_team_from_upload,
)

from app.services.report_processor import ReportProcessor


router = APIRouter(prefix="/reports")

UPLOAD_DIR = Path("uploaded_reports")


# ---------------------------------------------------------------------------
# Canonical team name normalizer
# Used EVERYWHERE: building the map, looking up teams, creating new teams.
# "Talent Corner." / "TALENT CORNER" / "talent corner " → "talent corner"
# ---------------------------------------------------------------------------

def canonical(name: str) -> str:
    """Return a fully-normalized key used only for deduplication lookups."""
    s = str(name or "").lower().strip()
    s = re.sub(r"[^a-z0-9\s]", "", s)   # strip punctuation
    s = re.sub(r"\s+", " ", s).strip()  # collapse whitespace
    return s or "unassigned"


def display_name(name: str) -> str:
    """Return a clean title-cased display name stored in the DB."""
    return canonical(name).title() or "Unassigned"


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

@router.get("/")
def reports(db: Session = Depends(get_db)):
    uploads = (
        db.query(ReportUpload)
        .order_by(ReportUpload.created_at.desc())
        .all()
    )
    return [
        {
            "id": item.id,
            "financial_year": item.financial_year,
            "date": item.created_at.isoformat() if item.created_at else None,
            "resdex_file": item.resdex_file,
            "job_posting_file": item.job_posting_file,
            "uploaded_by": item.uploaded_by,
            "range_start": item.range_start.isoformat() if item.range_start else None,
            "range_end": item.range_end.isoformat() if item.range_end else None,
            "status": item.status,
            "message": item.message,
        }
        for item in uploads
    ]


@router.post("/upload")
def upload_reports(
    financial_year: str = Form(...),
    uploaded_by: str = Form("Kajal"),
    overwrite_existing: bool = Form(False),
    resdex_report: UploadFile = File(...),
    job_posting_report: UploadFile = File(...),
    db: Session = Depends(get_db),
):

    # =========================================================================
    # VALIDATION
    # =========================================================================

    if not resdex_report or not job_posting_report:
        raise HTTPException(
            status_code=400,
            detail="Please upload both reports together.",
        )

    # =========================================================================
    # SAVE FILES
    # =========================================================================

    UPLOAD_DIR.mkdir(exist_ok=True)

    resdex_path = UPLOAD_DIR / resdex_report.filename
    job_path = UPLOAD_DIR / job_posting_report.filename

    with resdex_path.open("wb") as target:
        shutil.copyfileobj(resdex_report.file, target)

    with job_path.open("wb") as target:
        shutil.copyfileobj(job_posting_report.file, target)

    # =========================================================================
    # PROCESS REPORTS
    # =========================================================================

    processor = ReportProcessor()

    try:
        result = processor.process_reports(
            str(resdex_path),
            str(job_path),
            financial_year,
        )
    except Exception as exc:
        db.add(
            ReportUpload(
                financial_year=financial_year,
                resdex_file=resdex_report.filename,
                job_posting_file=job_posting_report.filename,
                uploaded_by=uploaded_by,
                status="error",
                message=str(exc),
            )
        )
        db.commit()
        raise HTTPException(status_code=400, detail=str(exc))

    # =========================================================================
    # DUPLICATE CHECK
    # =========================================================================

    existing_upload = (
        db.query(ReportUpload)
        .filter(
            ReportUpload.financial_year == financial_year,
            ReportUpload.range_start == result["range_start"],
            ReportUpload.range_end == result["range_end"],
            ReportUpload.status == "success",
        )
        .first()
    )

    if existing_upload and not overwrite_existing:
        return {
            "status": "duplicate",
            "message": "Reports for this date range already exist.",
            "existing_upload_id": existing_upload.id,
        }

    # =========================================================================
    # OVERWRITE: DELETE OLD SUBUSER ROWS FOR THIS RANGE
    # =========================================================================

    if existing_upload and overwrite_existing:
        db.query(SubUserUsage).filter(
            SubUserUsage.financial_year == financial_year,
            SubUserUsage.upload_range_start == result["range_start"],
            SubUserUsage.upload_range_end == result["range_end"],
        ).delete()

    # =========================================================================
    # BUILD CANONICAL TEAM MAP
    # Key  : canonical(team.name)  → always "talent corner"  (no punctuation,
    #                                 lower, collapsed spaces)
    # Value: Team ORM object
    #
    # This means ALL of these map to the SAME team:
    #   "Talent Corner"  "talent corner"  "TALENT CORNER"  "Talent Corner."
    # =========================================================================

    all_teams = db.query(Team).all()

    team_map: dict[str, Team] = {
        canonical(t.name): t
        for t in all_teams
    }

    created_teams: list[dict] = []
    added_subusers = 0

    # =========================================================================
    # PROCESS EACH SUBUSER ROW
    # =========================================================================

    for row in result["rows"]:

        # ---------------------------------------------------------------------
        # 1. EMAIL — skip rows with no email
        # ---------------------------------------------------------------------

        email = str(row.get("email") or "").strip().lower()
        if not email or "@" not in email:
            continue

        # ---------------------------------------------------------------------
        # 2. CANONICAL TEAM NAME — used for map lookup and deduplication
        #    display_team_name   — stored in the DB (title-cased, clean)
        # ---------------------------------------------------------------------

        raw_team_name = row.get("team_name")

        if pd.isna(raw_team_name) if isinstance(raw_team_name, float) else not raw_team_name:
            raw_team_name = ""

        lookup_key = canonical(str(raw_team_name))          # e.g. "talent corner"
        stored_name = display_name(str(raw_team_name))      # e.g. "Talent Corner"

        # ---------------------------------------------------------------------
        # 3. FIND TEAM (canonical map lookup — NO DB query inside loop)
        # ---------------------------------------------------------------------

        team = team_map.get(lookup_key)

        # ---------------------------------------------------------------------
        # 4. CREATE TEAM if it doesn't exist yet
        # ---------------------------------------------------------------------

        if not team:
            licences = int(row.get("licences") or 1)

            # Per-licence base limits (Q1 New Partner defaults)
            BASE_CV     = 3000
            BASE_NVITES = 22500
            BASE_JOBS   = 100

            team = create_team_from_upload(
                db=db,
                team_name=stored_name,
                partner_name=str(row.get("name") or email),
                partner_email=email,
                licences=licences,
                partner_type="New Partner",
                join_period="Q1 (Apr-Jun)",
                licence_fee=80000,
                cv_limit=BASE_CV,        # create_team_from_upload multiplies by licences
                nvites_limit=BASE_NVITES,
                jobs_limit=BASE_JOBS,
            )

            db.flush()

            # Register under canonical key so subsequent rows in THIS upload
            # don't create duplicates either
            team_map[lookup_key] = team

            created_teams.append({
                "id":           team.id,
                "name":         team.name,
                "partner_email": team.partner_email,
                "licences":     licences,
                "cv_limit":     team.cv_limit,
                "nvites_limit": team.nvites_limit,
                "jobs_limit":   team.jobs_limit,
            })

        # ---------------------------------------------------------------------
        # 5. UPSERT SUBUSER USAGE
        # ---------------------------------------------------------------------

        existing_usage = (
            db.query(SubUserUsage)
            .filter(
                SubUserUsage.financial_year == financial_year,
                SubUserUsage.email == email,
            )
            .first()
        )

        if existing_usage:
            # UPDATE
            existing_usage.upload_range_start = result["range_start"]
            existing_usage.upload_range_end   = result["range_end"]
            existing_usage.team_id            = team.id
            existing_usage.team_name          = team.name
            existing_usage.name               = str(row.get("name") or email)
            existing_usage.cv_usage           = int(row.get("cv_usage") or 0)
            existing_usage.nvites_usage       = int(row.get("nvites_usage") or 0)
            existing_usage.jobs_usage         = int(row.get("jobs_usage") or 0)

        else:
            # INSERT
            db.add(
                SubUserUsage(
                    financial_year      = financial_year,
                    upload_range_start  = result["range_start"],
                    upload_range_end    = result["range_end"],
                    team_id             = team.id,
                    team_name           = team.name,
                    name                = str(row.get("name") or email),
                    email               = email,
                    cv_usage            = int(row.get("cv_usage") or 0),
                    nvites_usage        = int(row.get("nvites_usage") or 0),
                    jobs_usage          = int(row.get("jobs_usage") or 0),
                )
            )
            added_subusers += 1

    # =========================================================================
    # SAVE UPLOAD HISTORY
    # =========================================================================

    message = (
        "Reports uploaded, validated, "
        "matched by subuser email, "
        "and rolled up successfully."
    )
    if created_teams:
        message += f" {len(created_teams)} new team(s) created automatically."

    db.add(
        ReportUpload(
            financial_year   = financial_year,
            resdex_file      = resdex_report.filename,
            job_posting_file = job_posting_report.filename,
            uploaded_by      = uploaded_by,
            range_start      = result["range_start"],
            range_end        = result["range_end"],
            status           = "success",
            message          = message,
        )
    )

    # =========================================================================
    # AUDIT
    # =========================================================================

    add_audit(
        db,
        uploaded_by,
        "upload_reports",
        "report_upload",
        resdex_report.filename,
        {
            "warnings":      result["warnings"],
            "created_teams": created_teams,
            "financial_year": financial_year,
        },
    )

    db.commit()

    return {
        "status":         "success",
        "message":        message,
        "financial_year": financial_year,
        "warnings":       result["warnings"],
        "created_teams":  created_teams,
        "new_teams_added": len(created_teams),
        "subusers_added": added_subusers,
    }