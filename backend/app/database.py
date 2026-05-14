"""
app/database.py
"""

from sqlalchemy import create_engine

from sqlalchemy.orm import (
    DeclarativeBase,
    sessionmaker
)

from app.config import DATABASE_URL


# =====================================================
# SQLITE
# =====================================================

if DATABASE_URL.startswith("sqlite"):

    engine = create_engine(

        DATABASE_URL,

        connect_args={
            "check_same_thread": False
        }
    )

# =====================================================
# SUPABASE / POSTGRES
# =====================================================

else:

    engine = create_engine(

        DATABASE_URL,

        pool_pre_ping=True,

        pool_recycle=300,

        pool_size=5,

        max_overflow=10,

        echo=False,
    )


SessionLocal = sessionmaker(

    autocommit=False,

    autoflush=False,

    bind=engine
)


class Base(DeclarativeBase):

    pass


# =====================================================
# DB DEPENDENCY
# =====================================================

def get_db():

    db = SessionLocal()

    try:

        yield db

    finally:

        db.close()