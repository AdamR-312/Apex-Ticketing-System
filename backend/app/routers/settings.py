from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from .. import models, schemas
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


@router.get("", response_model=schemas.SettingsOut)
def get_settings(db: Session = Depends(get_db)):
    return _get_or_create_settings(db)


@router.patch("", response_model=schemas.SettingsOut)
def update_settings(update: schemas.SettingsUpdate, db: Session = Depends(get_db)):
    settings = _get_or_create_settings(db)
    for field, value in update.model_dump(exclude_unset=True).items():
        setattr(settings, field, value)
    db.commit()
    db.refresh(settings)
    return settings
