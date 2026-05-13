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
# DASHBOARD SUMMARY
# =====================================================

@router.get("/summary")
def dashboard_summary(

    financial_year: str = Query(...),

    db: Session = Depends(get_db)

):

    teams = (
        db.query(Team)
        .order_by(Team.name)
        .all()
    )

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
# TEAM USAGE
# =====================================================

@router.get("/teams")
def dashboard_teams(

    financial_year: str = Query(...),

    db: Session = Depends(get_db)

):

    teams = (
        db.query(Team)
        .order_by(Team.name)
        .all()
    )

    return [

        team_payload(
            team,
            db,
            financial_year
        )

        for team in teams
    ]


# =====================================================
# CRITICAL / WARNING TEAMS
# =====================================================

@router.get("/critical")
def critical_teams(

    financial_year: str = Query(...),

    db: Session = Depends(get_db)

):

    teams = (

        db.query(Team)

        .order_by(Team.name)

        .all()
    )

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