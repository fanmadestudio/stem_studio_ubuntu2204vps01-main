import json
from dataclasses import dataclass
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

import jwt
from django.conf import settings
from rest_framework import authentication, exceptions

from users.models import User


@dataclass
class SupabaseIdentity:
    user_id: str
    email: str


def _normalize_supabase_url() -> str:
    return settings.SUPABASE_URL.rstrip("/")


def _fetch_jwt_payload(token: str) -> dict:
    unverified_header = jwt.get_unverified_header(token)
    algorithm = unverified_header.get("alg", "")

    if algorithm.startswith("HS"):
        return _fetch_user_via_auth_api(token)

    jwks_client = jwt.PyJWKClient(f"{_normalize_supabase_url()}/auth/v1/.well-known/jwks.json")
    signing_key = jwks_client.get_signing_key_from_jwt(token)
    return jwt.decode(
        token,
        signing_key.key,
        algorithms=[algorithm],
        issuer=f"{_normalize_supabase_url()}/auth/v1",
        options={"verify_aud": False},
    )


def _fetch_user_via_auth_api(token: str) -> dict:
    request = Request(
        f"{_normalize_supabase_url()}/auth/v1/user",
        headers={
            "apikey": settings.SUPABASE_PUBLISHABLE_KEY,
            "Authorization": f"Bearer {token}",
        },
    )
    try:
        with urlopen(request, timeout=10) as response:
            return json.loads(response.read().decode("utf-8"))
    except HTTPError as exc:
        raise exceptions.AuthenticationFailed("Supabase token is invalid.") from exc
    except URLError as exc:
        raise exceptions.AuthenticationFailed("Unable to reach Supabase Auth.") from exc


def _get_identity_from_payload(payload: dict) -> SupabaseIdentity:
    user_id = payload.get("sub") or payload.get("id")
    email = payload.get("email")
    if not user_id or not email:
        raise exceptions.AuthenticationFailed("Supabase token is missing required claims.")
    return SupabaseIdentity(user_id=str(user_id), email=str(email).strip().lower())


def _link_user(identity: SupabaseIdentity) -> User:
    user = User.objects.filter(supabase_user_id=identity.user_id).first()
    if user:
        return user

    user = User.objects.filter(email__iexact=identity.email).first()
    if not user:
        raise exceptions.AuthenticationFailed("No app account is linked to this Supabase user.")

    user.supabase_user_id = identity.user_id
    user.save(update_fields=["supabase_user_id"])
    return user


class SupabaseJWTAuthentication(authentication.BaseAuthentication):
    def authenticate(self, request):
        header = authentication.get_authorization_header(request).decode("utf-8")
        if not header:
            return None

        parts = header.split()
        if len(parts) != 2 or parts[0].lower() != "bearer":
            return None

        token = parts[1]
        try:
            payload = _fetch_jwt_payload(token)
        except jwt.PyJWTError as exc:
            raise exceptions.AuthenticationFailed("Supabase token verification failed.") from exc

        identity = _get_identity_from_payload(payload)
        user = _link_user(identity)
        if not user.is_active:
            raise exceptions.AuthenticationFailed("This account is inactive.")

        return (user, token)
