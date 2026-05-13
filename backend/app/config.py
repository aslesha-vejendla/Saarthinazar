"""
app/config.py
"""

import os

from dotenv import load_dotenv

load_dotenv()


# =====================================================
# AUTH
# =====================================================

SECRET_KEY = os.getenv(
    "SECRET_KEY",
    "super-secret-key"
)

ALGORITHM = os.getenv(
    "ALGORITHM",
    "HS256"
)

ACCESS_TOKEN_EXPIRE_MINUTES = int(
    os.getenv(
        "ACCESS_TOKEN_EXPIRE_MINUTES",
        "60"
    )
)


# =====================================================
# SUPABASE
# =====================================================

SUPABASE_URL = os.getenv(
    "SUPABASE_URL",
    ""
)

SUPABASE_ANON_KEY = os.getenv(
    "SUPABASE_ANON_KEY",
    ""
)

SUPABASE_SERVICE_KEY = os.getenv(
    "SUPABASE_SERVICE_KEY",
    ""
)


# =====================================================
# DATABASE
# =====================================================

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "sqlite:///./naukri_usage.db"
)


# =====================================================
# FILE STORAGE
# =====================================================

UPLOAD_DIR = os.getenv(
    "UPLOAD_DIR",
    "uploaded_reports"
)


# =====================================================
# DEFAULT FINANCIAL YEAR
# =====================================================

DEFAULT_FINANCIAL_YEAR = os.getenv(
    "DEFAULT_FINANCIAL_YEAR",
    "2026-2027"
)