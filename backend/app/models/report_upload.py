from datetime import datetime

from sqlalchemy import (
    Column,
    Integer,
    String,
    DateTime,
    Text
)

from app.database import Base


class ReportUpload(Base):

    __tablename__ = "report_uploads"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    financial_year = Column(
        String,
        nullable=False
    )

    resdex_file = Column(
        String,
        nullable=False
    )

    job_posting_file = Column(
        String,
        nullable=False
    )

    uploaded_by = Column(
        String,
        nullable=False
    )

    status = Column(
        String,
        default="success"
    )

    message = Column(
        Text,
        nullable=True
    )

    range_start = Column(
        DateTime,
        nullable=True
    )

    range_end = Column(
        DateTime,
        nullable=True
    )

    created_at = Column(
        DateTime,
        default=datetime.utcnow
    )