import re
import secrets
from email.utils import parseaddr

from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session

from .. import email_service, models
from ..db import get_db
from ..security import hash_password

router = APIRouter(prefix="/webhooks", tags=["webhooks"])

REPLY_TO_PATTERN = re.compile(r"ticket-(\d+)@")


def _find_or_create_requester(db: Session, email: str, name: str) -> models.User:
    email = email.lower().strip()
    user = db.query(models.User).filter(models.User.email == email).first()
    if user:
        return user
    # Shadow account for an external emailer — no usable password, just a
    # place to hang the name/email so the rest of the UI (avatars, "My
    # Queue", Team page) works the same as it does for real accounts.
    user = models.User(
        name=name or email,
        email=email,
        password_hash=hash_password(secrets.token_urlsafe(32)),
        role=models.Role.user,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@router.post("/inbound-email", status_code=204)
async def inbound_email(request: Request, db: Session = Depends(get_db)):
    """Receives Mailgun's inbound route payload (multipart/form-data).

    Routes to either "new ticket" (mail sent to the support address) or
    "reply to ticket #N" (mail sent to ticket-<id>@<reply-domain>, matched
    via the Reply-To header set on our outbound notifications).

    TODO: verify Mailgun's signature (timestamp/token/signature fields)
    before trusting the payload — fine to skip while testing against a
    throwaway domain, not once this points at real support@ mail.
    """
    form = await request.form()

    from_name, from_email = parseaddr(form.get("from") or form.get("sender") or "")
    from_email = (from_email or form.get("sender") or "").lower().strip()
    to_field = form.get("recipient") or ""
    subject = form.get("subject") or "(no subject)"
    body = form.get("stripped-text") or form.get("body-plain") or ""

    if not from_email:
        return

    requester = _find_or_create_requester(db, from_email, from_name)

    match = REPLY_TO_PATTERN.search(to_field)
    if match:
        ticket_id = int(match.group(1))
        ticket = db.get(models.Ticket, ticket_id)
        if not ticket:
            return
        comment = models.Comment(
            ticket_id=ticket.id, author_id=requester.id, body=body, is_internal=False
        )
        db.add(comment)
        db.commit()
        # The ticket-side record of this reply is already saved — a failure
        # sending the admin heads-up email shouldn't turn into a 500 that
        # makes Mailgun think the whole webhook (and thus the reply) failed.
        try:
            email_service.notify_admins_new_reply(ticket.id, ticket.title, body, from_email)
        except Exception:
            pass
        return

    ticket = models.Ticket(title=subject, description=body, created_by_id=requester.id)
    db.add(ticket)
    db.commit()
    db.refresh(ticket)
    try:
        email_service.notify_admins_new_ticket(ticket.id, ticket.title, body, from_email)
    except Exception:
        pass
