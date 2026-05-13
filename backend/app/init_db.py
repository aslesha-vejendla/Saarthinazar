from app.database import (
    engine,
    SessionLocal,
    Base
)

from app.models.user import User

from app.utils.security import (
    hash_password
)

# IMPORT ALL MODELS
from app.models.team import Team
from app.models.usage import SubUserUsage
from app.models.invoice import Invoice
from app.models.report_upload import ReportUpload
from app.models.financial_year import FinancialYear


# =====================================================
# CREATE TABLES
# =====================================================

Base.metadata.create_all(bind=engine)

db = SessionLocal()


def create_user(

    username: str,

    password: str,

    role: str

):

    existing = (

        db.query(User)

        .filter(
            User.username == username
        )

        .first()
    )

    if existing:

        print(
            f"✓ User already exists: {username}"
        )

        return

    user = User(

        username=username,

        password=hash_password(password),

        role=role
    )

    db.add(user)

    db.commit()

    print(
        f"✓ Created user: {username}"
    )


# =====================================================
# CREATE DEFAULT USERS
# =====================================================

create_user(

    "rashesh",

    "rashesh@123",

    "admin"
)

create_user(

    "kajal",

    "kajal@123",

    "employee"
)

print(
    "\n✓ Database initialized successfully"
)