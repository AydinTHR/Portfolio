#!/usr/bin/env python3
"""Generate an Argon2 hash for the admin password.

Usage:
    python scripts/hash_password.py            # prompts (hidden input)
    python scripts/hash_password.py 'mypass'   # arg (avoid in shared shells)

Copy the printed value into ADMIN_PASSWORD_HASH in your .env.
"""

import getpass
import sys

from argon2 import PasswordHasher


def main() -> None:
    if len(sys.argv) > 1:
        password = sys.argv[1]
    else:
        password = getpass.getpass("New admin password: ")
        confirm = getpass.getpass("Confirm password: ")
        if password != confirm:
            print("Passwords do not match.", file=sys.stderr)
            sys.exit(1)
    if not password:
        print("Password must not be empty.", file=sys.stderr)
        sys.exit(1)
    print(PasswordHasher().hash(password))


if __name__ == "__main__":
    main()
