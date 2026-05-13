from fastapi import (
    APIRouter,
    Depends,
    Query
)

from sqlalchemy.orm import Session

from app.database import get_db

from app.models.team import Team

from app.services.naukri_rules import (
    alert_message,
    status_for_team
)

router = APIRouter(prefix="/alerts")


# =====================================================
# GET ALL ALERTS
# =====================================================

@router.get("/")
def get_alerts(

    financial_year: str = Query(...),

    db: Session = Depends(get_db)

):

    alerts = []

    teams = (

        db.query(Team)

        .order_by(Team.name)

        .all()
    )

    for team in teams:

        status = status_for_team(

            team,

            db,

            financial_year
        )

        if status in {

            "Warning",

            "Critical",

            "Over limit"
        }:

            alert = alert_message(

                team,

                db,

                financial_year
            )

            alert["type"] = (

                "exceeded"

                if status == "Over limit"

                else status.lower()
            )

            alerts.append(alert)

    return alerts


# =====================================================
# ALERT PREVIEW
# =====================================================

@router.get("/{team_id}/preview")
def preview_alert(

    team_id: int,

    financial_year: str = Query(...),

    db: Session = Depends(get_db)
):

    team = (

        db.query(Team)

        .filter(
            Team.id == team_id
        )

        .first()
    )

    if not team:

        return {

            "status": "error",

            "message":
                "Team not found"
        }

    return alert_message(

        team,

        db,

        financial_year
    )

from app.services.email_service import send_email


@router.post("/{team_id}/send")
def send_alert(

    team_id: int,

    financial_year: str,

    db: Session = Depends(get_db)
):

    team = (

        db.query(Team)

        .filter(
            Team.id == team_id
        )

        .first()
    )

    if not team:

        return {

            "status": "error",

            "message": "Team not found"
        }

    alert = alert_message(

        team,

        db,

        financial_year
    )

    success = send_email(

        recipient=team.partner_email,

        subject="Naukri Usage Alert",

        body=alert["message"],

        attachment_path=invoice.pdf_path
    )

    return {

        "status":

            "success"

            if success

            else "error"
    }