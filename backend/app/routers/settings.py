from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from .. import models, schemas
from ..config import TICKET_REPLY_DOMAIN
from ..db import get_db

router = APIRouter(prefix="/settings", tags=["settings"])


def _get_or_create_settings(db: Session) -> models.AppSettings:
    settings = db.get(models.AppSettings, 1)
    if not settings:
        settings = models.AppSettings(id=1)
        db.add(settings)
        db.commit()
        db.refresh(settings)
    return settings


def _to_out(settings: models.AppSettings) -> schemas.SettingsOut:
    return schemas.SettingsOut(
        site_name=settings.site_name,
        support_email=settings.support_email,
        default_priority=settings.default_priority,
        ticket_reply_domain=TICKET_REPLY_DOMAIN,
    )


@router.get("", response_model=schemas.SettingsOut)
def get_settings(db: Session = Depends(get_db)):
    return _to_out(_get_or_create_settings(db))


@router.patch("", response_model=schemas.SettingsOut)
def update_settings(update: schemas.SettingsUpdate, db: Session = Depends(get_db)):
    settings = _get_or_create_settings(db)
    for field, value in update.model_dump(exclude_unset=True).items():
        setattr(settings, field, value)
    db.commit()
    db.refresh(settings)
    return _to_out(settings)
