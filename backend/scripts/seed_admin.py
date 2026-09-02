"""Local dev convenience: seed an admin user in the local SQLite db.

Not wired into the app, not run on deploy. Credentials are intentionally
'admin'/'admin' for local testing only — never use this against a
publicly reachable database.
"""

from app.db import Base, SessionLocal, engine
from app.models import Role, User
from app.security import hash_password

ADMIN_EMAIL = "support@louisvillerealtors.com"
ADMIN_PASSWORD = "admin"


def main():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        existing = db.query(User).filter(User.email == ADMIN_EMAIL).first()
        if existing:
            existing.password_hash = hash_password(ADMIN_PASSWORD)
            existing.role = Role.admin
            db.commit()
            print(f"Updated existing admin user: {ADMIN_EMAIL}")
        else:
            user = User(
                name="admin",
                email=ADMIN_EMAIL,
                password_hash=hash_password(ADMIN_PASSWORD),
                role=Role.admin,
            )
            db.add(user)
            db.commit()
            print(f"Created admin user: {ADMIN_EMAIL} / password: {ADMIN_PASSWORD}")
    finally:
        db.close()


if __name__ == "__main__":
    main()
