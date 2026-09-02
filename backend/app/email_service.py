import httpx

from . import config

MAILGUN_BASE_URL = "https://api.mailgun.net/v3"


def send_email(to: str, subject: str, text_body: str, reply_to: str | None = None) -> None:
    if not config.MAILGUN_API_KEY:
        # No credentials configured yet — log instead of sending so local
        # dev and webhook testing work without a real Mailgun account.
        print(
            f"[email stub] to={to} reply_to={reply_to} subject={subject!r}\n{text_body}\n"
        )
        return

    data = {
        "from": config.NOTIFICATION_FROM_EMAIL,
        "to": to,
        "subject": subject,
        "text": text_body,
    }
    if reply_to:
        data["h:Reply-To"] = reply_to

    response = httpx.post(
        f"{MAILGUN_BASE_URL}/{config.MAILGUN_DOMAIN}/messages",
        auth=("api", config.MAILGUN_API_KEY),
        data=data,
        timeout=10,
    )
    response.raise_for_status()


def notify_admins_new_ticket(ticket_id: int, ticket_title: str, description: str, requester_email: str) -> None:
    reply_to = f"ticket-{ticket_id}@{config.TICKET_REPLY_DOMAIN}"
    subject = f"[Ticket #{ticket_id}] {ticket_title}"
    body = (
        f"New ticket from {requester_email}:\n\n{description}\n\n"
        "Reply to this email to respond, or open it in the ticket queue."
    )
    for admin_email in config.ADMIN_NOTIFICATION_EMAILS:
        send_email(admin_email, subject, body, reply_to=reply_to)


def notify_admins_new_reply(ticket_id: int, ticket_title: str, reply_body: str, requester_email: str) -> None:
    reply_to = f"ticket-{ticket_id}@{config.TICKET_REPLY_DOMAIN}"
    subject = f"Re: [Ticket #{ticket_id}] {ticket_title}"
    body = (
        f"{requester_email} replied:\n\n{reply_body}\n\n"
        "Reply to this email to respond, or open it in the ticket queue."
    )
    for admin_email in config.ADMIN_NOTIFICATION_EMAILS:
        send_email(admin_email, subject, body, reply_to=reply_to)
