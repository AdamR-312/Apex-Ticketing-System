from sqlalchemy import create_engine, inspect, text
from sqlalchemy.orm import declarative_base, sessionmaker

SQLALCHEMY_DATABASE_URL = "sqlite:///./ticket_system.db"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# Columns added after the database was first deployed. There's no Alembic
# here, and Base.metadata.create_all() only creates missing tables — it
# never alters existing ones — so a plain new Column on a model would 404
# in prod with "no such column" against the already-populated sqlite file.
# This runs once at startup and is a no-op once the column exists.
ADDED_COLUMNS = [
    ("users", "is_active", "BOOLEAN DEFAULT 1"),
    ("tickets", "watcher_ids", "JSON DEFAULT '[]'"),
    ("comments", "attachment_url", "VARCHAR"),
    ("comments", "attachment_name", "VARCHAR"),
    ("comments", "emailed", "BOOLEAN DEFAULT 0"),
]


def run_light_migrations():
    inspector = inspect(engine)
    existing_tables = set(inspector.get_table_names())
    with engine.begin() as conn:
        for table, column, ddl_type in ADDED_COLUMNS:
            if table not in existing_tables:
                continue
            existing_columns = {c["name"] for c in inspector.get_columns(table)}
            if column not in existing_columns:
                conn.execute(text(f"ALTER TABLE {table} ADD COLUMN {column} {ddl_type}"))


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
