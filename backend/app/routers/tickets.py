from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from .. import models, schemas
from ..config import FAKE_CURRENT_USER_ID
from ..db import get_db

router = APIRouter(prefix="/tickets", tags=["tickets"])


def _get_ticket_or_404(ticket_id: int, db: Session) -> models.Ticket:
    ticket = db.get(models.Ticket, ticket_id)
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    return ticket


def _user_name(db: Session, user_id: Optional[int]) -> str:
    if user_id is None:
        return "nobody"
    user = db.get(models.User, user_id)
    return user.name if user else f"user #{user_id}"


def _log_activity(db: Session, ticket_id: int, message: str) -> None:
    # TODO: replace FAKE_CURRENT_USER_ID with the authenticated user once auth lands
    db.add(
        models.TicketActivity(
            ticket_id=ticket_id, actor_id=FAKE_CURRENT_USER_ID, message=message
        )
    )


def _describe_changes(db: Session, ticket: models.Ticket, changes: dict) -> List[str]:
    messages = []
    if "status" in changes and changes["status"] != ticket.status:
        messages.append(f"changed status from {ticket.status.value} to {changes['status'].value}")
    if "priority" in changes and changes["priority"] != ticket.priority:
        messages.append(
            f"changed priority from {ticket.priority.value} to {changes['priority'].value}"
        )
    if "assigned_to_id" in changes and changes["assigned_to_id"] != ticket.assigned_to_id:
        new_name = _user_name(db, changes["assigned_to_id"])
        messages.append(
            "unassigned the ticket" if changes["assigned_to_id"] is None else f"assigned to {new_name}"
        )
    if "due_at" in changes and changes["due_at"] != ticket.due_at:
        messages.append(
            "removed the due date"
            if changes["due_at"] is None
            else f"set due date to {changes['due_at'].strftime('%b %d, %Y')}"
        )
    if "tags" in changes and changes["tags"] != ticket.tags:
        messages.append(
            f"updated tags to {', '.join(changes['tags']) or 'none'}"
        )
    return messages


@router.post("", response_model=schemas.TicketOut, status_code=201)
def create_ticket(ticket: schemas.TicketCreate, db: Session = Depends(get_db)):
    # TODO: replace FAKE_CURRENT_USER_ID with the authenticated user once auth lands
    db_ticket = models.Ticket(**ticket.model_dump(), created_by_id=FAKE_CURRENT_USER_ID)
    db.add(db_ticket)
    db.commit()
    db.refresh(db_ticket)
    return db_ticket


@router.get("", response_model=List[schemas.TicketOut])
def list_tickets(db: Session = Depends(get_db)):
    return db.query(models.Ticket).all()


@router.get("/{ticket_id}", response_model=schemas.TicketOut)
def get_ticket(ticket_id: int, db: Session = Depends(get_db)):
    return _get_ticket_or_404(ticket_id, db)


@router.patch("/{ticket_id}", response_model=schemas.TicketOut)
def update_ticket(
    ticket_id: int, update: schemas.TicketUpdate, db: Session = Depends(get_db)
):
    ticket = _get_ticket_or_404(ticket_id, db)
    changes = update.model_dump(exclude_unset=True)
    for message in _describe_changes(db, ticket, changes):
        _log_activity(db, ticket_id, message)
    for field, value in changes.items():
        setattr(ticket, field, value)
    db.commit()
    db.refresh(ticket)
    return ticket


@router.get("/{ticket_id}/comments", response_model=List[schemas.CommentOut])
def list_comments(ticket_id: int, db: Session = Depends(get_db)):
    _get_ticket_or_404(ticket_id, db)
    return (
        db.query(models.Comment)
        .filter(models.Comment.ticket_id == ticket_id)
        .order_by(models.Comment.created_at)
        .all()
    )


@router.post("/{ticket_id}/comments", response_model=schemas.CommentOut, status_code=201)
def create_comment(
    ticket_id: int, comment: schemas.CommentCreate, db: Session = Depends(get_db)
):
    _get_ticket_or_404(ticket_id, db)
    # TODO: replace FAKE_CURRENT_USER_ID with the authenticated user once auth lands
    db_comment = models.Comment(
        ticket_id=ticket_id,
        author_id=FAKE_CURRENT_USER_ID,
        body=comment.body,
        is_internal=comment.is_internal,
        mentioned_user_ids=comment.mentioned_user_ids,
    )
    db.add(db_comment)
    db.commit()
    db.refresh(db_comment)
    return db_comment


@router.get("/{ticket_id}/activity", response_model=List[schemas.ActivityOut])
def list_activity(ticket_id: int, db: Session = Depends(get_db)):
    _get_ticket_or_404(ticket_id, db)
    return (
        db.query(models.TicketActivity)
        .filter(models.TicketActivity.ticket_id == ticket_id)
        .order_by(models.TicketActivity.created_at)
        .all()
    )
