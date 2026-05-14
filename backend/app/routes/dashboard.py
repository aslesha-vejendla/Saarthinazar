from datetime import date

from fastapi import (
    APIRouter,
    Depends,
    Query
)

from sqlalchemy.orm import Session

from app.database import get_db

from app.models.invoice import Invoice
from app.models.report_upload import ReportUpload
from app.models.team import Team
from app.models.usage import SubUserUsage

from app.services.naukri_rules import (
    invoice_summary,
    status_for_team,
    team_payload
)

router = APIRouter(prefix="/dashboard")


# =====================================================
# HELPER — TEAMS ACTIVE IN A FINANCIAL YEAR
# Ensures we only show teams that have actual usage
# data uploaded for the selected financial year.
# Teams from other years are excluded entirely.
# =====================================================

def _teams_for_fy(db: Session, financial_year: str) -> list[Team]:
    """
    Return teams that have at least one SubUserUsage
    record for the given financial year, ordered by name.
    """
    team_ids = (
        db.query(SubUserUsage.team_id)
        .filter(SubUserUsage.financial_year == financial_year)
        .distinct()
        .subquery()
    )

    return (
        db.query(Team)
        .filter(Team.id.in_(team_ids))
        .order_by(Team.name)
        .all()
    )


# =====================================================
# DASHBOARD SUMMARY
# =====================================================

@router.get("/summary")
def dashboard_summary(

    financial_year: str = Query(...),

    db: Session = Depends(get_db)

):

    # Only teams with usage in this financial year
    teams = _teams_for_fy(db, financial_year)

    usages = (
        db.query(SubUserUsage)
        .filter(
            SubUserUsage.financial_year == financial_year
        )
        .all()
    )

    invoices = db.query(Invoice).all()

    latest_upload = (
        db.query(ReportUpload)
        .filter(
            ReportUpload.financial_year == financial_year
        )
        .order_by(ReportUpload.created_at.desc())
        .first()
    )

    invoice_stats = invoice_summary(invoices)

    total_cv = sum(
        row.cv_usage or 0
        for row in usages
    )

    total_nvites = sum(
        row.nvites_usage or 0
        for row in usages
    )

    total_jobs = sum(
        row.jobs_usage or 0
        for row in usages
    )

    statuses = [
        status_for_team(
            team,
            db,
            financial_year
        )
        for team in teams
    ]

    return {

        "financial_year": financial_year,

        "total_teams": len(teams),

        "total_cv_usage": total_cv,

        "total_nvites_usage": total_nvites,

        "total_job_postings": total_jobs,

        "critical_teams": len([
            value
            for value in statuses
            if value in {
                "Critical",
                "Over limit"
            }
        ]),

        "warning_teams": len([
            value
            for value in statuses
            if value == "Warning"
        ]),

        "outstanding_invoices":
            invoice_stats["outstanding"],

        "outstanding_invoice_count":
            invoice_stats["pending_count"],

        "last_upload_date":
            latest_upload.created_at.date().isoformat()
            if latest_upload and latest_upload.created_at
            else None,

        "date_range": {

            "start":
                latest_upload.range_start.isoformat()
                if latest_upload and latest_upload.range_start
                else None,

            "end":
                latest_upload.range_end.isoformat()
                if latest_upload and latest_upload.range_end
                else None,
        },

        "upload_reminder":

            not latest_upload

            or

            not latest_upload.created_at

            or

            (
                date.today()
                -
                latest_upload.created_at.date()
            ).days > 8,
    }


# =====================================================
# TEAM USAGE — grouped by team, scoped to FY
# Only teams that appear in the uploaded report
# for the selected financial year are returned.
# Members shown are only those with usage in that FY.
# =====================================================

@router.get("/teams")
def dashboard_teams(

    financial_year: str = Query(...),

    db: Session = Depends(get_db)

):

    teams = _teams_for_fy(db, financial_year)

    return [

        team_payload(
            team,
            db,
            financial_year
        )

        for team in teams
    ]


# =====================================================
# SINGLE TEAM DETAIL
# Full breakdown: limits, usage, members, invoices
# =====================================================

@router.get("/teams/{team_id}")
def team_detail(

    team_id: int,

    financial_year: str = Query(...),

    db: Session = Depends(get_db)

):

    team = db.query(Team).filter(Team.id == team_id).first()

    if not team:

        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Team not found")

    # Verify team has data in this FY
    has_usage = (
        db.query(SubUserUsage)
        .filter(
            SubUserUsage.team_id == team_id,
            SubUserUsage.financial_year == financial_year
        )
        .first()
    )

    if not has_usage:

        from fastapi import HTTPException
        raise HTTPException(
            status_code=404,
            detail=f"No data found for this team in financial year {financial_year}"
        )

    return team_payload(team, db, financial_year, include_financial=True)


# =====================================================
# CRITICAL / WARNING TEAMS — scoped to FY
# =====================================================

@router.get("/critical")
def critical_teams(

    financial_year: str = Query(...),

    db: Session = Depends(get_db)

):

    teams = _teams_for_fy(db, financial_year)

    payload = [

        team_payload(
            team,
            db,
            financial_year
        )

        for team in teams
    ]

    return [

        team

        for team in payload

        if team["status"] in {
            "Warning",
            "Critical",
            "Over limit"
        }
    ]


# =====================================================
# FINANCIAL YEAR LIST
# Returns all available financial years for dropdown
# =====================================================

@router.get("/financial-years")
def list_financial_years(

    db: Session = Depends(get_db)

):

    from app.models.financial_year import FinancialYear

    years = (
        db.query(FinancialYear)
        .order_by(FinancialYear.start_date.desc())
        .all()
    )

    return [
        {
            "id": fy.id,
            "label": fy.label,
            "start_date": fy.start_date.isoformat(),
            "end_date": fy.end_date.isoformat(),
            "is_active": fy.is_active,
        }
        for fy in years
    ]
