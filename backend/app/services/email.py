"""Contact-form email delivery via Resend.

The Resend SDK is synchronous, so calls are dispatched to a threadpool to avoid
blocking the event loop. Sending is fault-tolerant: a failure is logged and
returns ``False`` rather than failing the request (the message is already
persisted in the database regardless).
"""

import html
import logging

import resend
from starlette.concurrency import run_in_threadpool

from ..config import settings

logger = logging.getLogger("portfolio.email")


def _render_html(name: str, email: str, message: str) -> str:
    safe_name = html.escape(name)
    safe_email = html.escape(email)
    safe_message = html.escape(message).replace("\n", "<br>")
    return f"""
    <div style="font-family: -apple-system, Segoe UI, Roboto, sans-serif; max-width: 560px;">
      <h2 style="margin:0 0 16px;">New portfolio message</h2>
      <p style="margin:0 0 4px;"><strong>From:</strong> {safe_name}</p>
      <p style="margin:0 0 16px;"><strong>Email:</strong>
        <a href="mailto:{safe_email}">{safe_email}</a></p>
      <div style="padding:16px;background:#f5f4f0;border-radius:8px;line-height:1.5;">
        {safe_message}
      </div>
    </div>
    """


async def send_contact_notification(name: str, email: str, message: str) -> bool:
    """Send a notification email about a new contact submission.

    Returns True if sent, False if skipped (not configured) or failed.
    """
    if not settings.resend_api_key or not settings.contact_to_email:
        logger.warning("Resend not configured (missing API key or recipient); skipping email")
        return False

    resend.api_key = settings.resend_api_key
    params = {
        "from": settings.contact_from_email,
        "to": [settings.contact_to_email],
        "reply_to": email,
        "subject": f"New portfolio message from {name}",
        "html": _render_html(name, email, message),
    }
    try:
        await run_in_threadpool(resend.Emails.send, params)
        return True
    except Exception:
        logger.exception("Failed to send contact notification email")
        return False
