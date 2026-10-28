from fastapi import Request
from slowapi import Limiter
from slowapi.util import get_remote_address

from .config import settings


def client_ip(request: Request) -> str:
    """The visitor's IP address, for rate limits, analytics, and messages.

    Behind a proxy the connecting address is the proxy's, shared by every
    visitor. CLIENT_IP_HEADER names a header the proxy sets to the visitor's
    address instead. Name only a header the proxy overwrites: a visitor can
    send any header they like.
    """
    if settings.client_ip_header:
        value = request.headers.get(settings.client_ip_header, "").strip()
        if value:
            return value
    return get_remote_address(request)


# Shared limiter instance. Routes opt in via the @limiter.limit(...) decorator.
limiter = Limiter(key_func=client_ip)
