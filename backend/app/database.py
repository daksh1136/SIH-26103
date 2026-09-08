import os
from pathlib import Path
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

# 1. Check environment variable first
DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    # Resolve relative to backend/app -> repo_root/database/projectpulse.db
    current_dir = Path(__file__).resolve().parent
    repo_root = current_dir.parent.parent
    db_file = repo_root / "database" / "projectpulse.db"

    if not db_file.parent.exists():
        db_file.parent.mkdir(parents=True, exist_ok=True)

    DATABASE_URL = f"sqlite:///{db_file}"

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False},
)

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
)

Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
