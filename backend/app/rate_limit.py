from slowapi import Limiter
from slowapi.util import get_remote_address

# Shared limiter instance. Routes opt in via the @limiter.limit(...) decorator.
limiter = Limiter(key_func=get_remote_address)
