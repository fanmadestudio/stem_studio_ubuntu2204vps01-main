from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from django.utils.decorators import method_decorator
from django.utils import timezone
from django.views.decorators.cache import cache_page

from analytics.services import build_dashboard_payload, build_dashboard_trends, build_invoice_date_range, build_monthly_invoice_summary


@method_decorator(cache_page(60), name="dispatch")
class DashboardAnalyticsView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        return Response(build_dashboard_payload())


@method_decorator(cache_page(300), name="dispatch")
class MonthlyInvoiceSummaryView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        year_param = request.query_params.get("year")
        year = int(year_param) if year_param and year_param.isdigit() else None
        if year is None:
            year = timezone.localtime().year
        return Response(build_monthly_invoice_summary(year))


@method_decorator(cache_page(300), name="dispatch")
class InvoiceDateRangeView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        return Response(build_invoice_date_range())


@method_decorator(cache_page(300), name="dispatch")
class DashboardTrendsView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        return Response(build_dashboard_trends(12))
