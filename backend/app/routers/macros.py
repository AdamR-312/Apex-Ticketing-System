from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from .. import models, schemas
from ..db import get_db

router = APIRouter(prefix="/macros", tags=["macros"])


@router.get("", response_model=List[schemas.MacroOut])
def list_macros(db: Session = Depends(get_db)):
    return db.query(models.Macro).order_by(models.Macro.title).all()


@router.post("", response_model=schemas.MacroOut, status_code=201)
def create_macro(macro: schemas.MacroCreate, db: Session = Depends(get_db)):
    db_macro = models.Macro(**macro.model_dump())
    db.add(db_macro)
    db.commit()
    db.refresh(db_macro)
    return db_macro


@router.patch("/{macro_id}", response_model=schemas.MacroOut)
def update_macro(macro_id: int, update: schemas.MacroUpdate, db: Session = Depends(get_db)):
    macro = db.get(models.Macro, macro_id)
    if not macro:
        raise HTTPException(status_code=404, detail="Macro not found")
    for field, value in update.model_dump(exclude_unset=True).items():
        setattr(macro, field, value)
    db.commit()
    db.refresh(macro)
    return macro


@router.delete("/{macro_id}", status_code=204)
def delete_macro(macro_id: int, db: Session = Depends(get_db)):
    macro = db.get(models.Macro, macro_id)
    if not macro:
        raise HTTPException(status_code=404, detail="Macro not found")
    db.delete(macro)
    db.commit()
