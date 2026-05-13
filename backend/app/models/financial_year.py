from datetime import datetime

from sqlalchemy import (
    Column,
    Integer,
    String,
    Date,
    Boolean,
    DateTime
)

from app.database import Base


class FinancialYear(Base):

    __tablename__ = "financial_years"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    label = Column(
        String,
        nullable=False,
        unique=True
    )

    start_date = Column(
        Date,
        nullable=False
    )

    end_date = Column(
        Date,
        nullable=False
    )

    is_active = Column(
        Boolean,
        default=False
    )

    created_at = Column(
        DateTime,
        default=datetime.utcnow
    )