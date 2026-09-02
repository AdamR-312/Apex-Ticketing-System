import os

# Stand-in for the authenticated user until real auth (Milestone 2) lands.
# Every "current user" reference in the API funnels through this constant so
# swapping in a real session/JWT user later is a one-place change.
FAKE_CURRENT_USER_ID = 1

# --- Email-to-ticket integration (Mailgun) ---
# Mailgun's free tier includes 1 inbound route + 1 sending domain, unlike
# Postmark which gates inbound processing behind a paid plan.
# Empty by default: with no key set, email_service logs instead of sending,
# so local dev never needs real credentials.
MAILGUN_API_KEY = os.environ.get("MAILGUN_API_KEY", "")

# The domain configured (and verified) in Mailgun for both sending and the
# inbound route — e.g. tickets.louisvillerealtors.com.
MAILGUN_DOMAIN = os.environ.get("MAILGUN_DOMAIN", "tickets.example.com")

# Must be an address on MAILGUN_DOMAIN before real sends will work.
NOTIFICATION_FROM_EMAIL = os.environ.get("NOTIFICATION_FROM_EMAIL", f"tickets@{MAILGUN_DOMAIN}")

# Who gets emailed when a new ticket or customer reply comes in by email.
ADMIN_NOTIFICATION_EMAILS = [
    e.strip()
    for e in os.environ.get("ADMIN_NOTIFICATION_EMAILS", "glarclass@gmail.com").split(",")
    if e.strip()
]

# Domain used to build the per-ticket Reply-To address (ticket-<id>@<domain>).
# Must have Mailgun's inbound route pointed at our webhook before replies work.
TICKET_REPLY_DOMAIN = os.environ.get("TICKET_REPLY_DOMAIN", MAILGUN_DOMAIN)
