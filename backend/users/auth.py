from rest_framework.authentication import TokenAuthentication, get_authorization_header


class DjangoBearerTokenAuthentication(TokenAuthentication):
    keyword = "Bearer"

    def authenticate(self, request):
        auth = get_authorization_header(request).split()
        if not auth:
            return None

        if auth[0].lower() not in {b"bearer", b"token"}:
            return None

        return super().authenticate(request)
