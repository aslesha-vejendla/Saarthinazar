from datetime import datetime

from sqlalchemy import (
    Column,
    Integer,
    String,
    Float,
    DateTime,
    Text
)

from app.database import Base


class Invoice(Base):

    __tablename__ = "invoices"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    invoice_number = Column(
        String,
        nullable=False,
        unique=True
    )

    partner_name = Column(
        String,
        nullable=False
    )

    financial_year = Column(
        String,
        nullable=False
    )

    amount = Column(
        Float,
        default=0
    )

    gst_amount = Column(
        Float,
        default=0
    )

    total_amount = Column(
        Float,
        default=0
    )

    due_date = Column(
        DateTime,
        nullable=True
    )

    payment_status = Column(
        String,
        default="unpaid"
    )

    payment_date = Column(
        DateTime,
        nullable=True
    )

    notes = Column(
        Text,
        nullable=True
    )

    pdf_path = Column(
        String,
        nullable=True
    )

    created_at = Column(
        DateTime,
        default=datetime.utcnow
    )