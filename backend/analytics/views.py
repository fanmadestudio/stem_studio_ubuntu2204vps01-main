from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from analytics.services import build_dashboard_payload


class DashboardAnalyticsView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        return Response(build_dashboard_payload())
