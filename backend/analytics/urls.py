from django.urls import path

from analytics.views import DashboardAnalyticsView, DashboardTrendsView, InvoiceDateRangeView, MonthlyInvoiceSummaryView

urlpatterns = [
    path("analytics/dashboard/", DashboardAnalyticsView.as_view(), name="analytics-dashboard"),
    path("analytics/monthly-invoice-summary/", MonthlyInvoiceSummaryView.as_view(), name="analytics-monthly-invoice-summary"),
    path("analytics/invoice-date-range/", InvoiceDateRangeView.as_view(), name="analytics-invoice-date-range"),
    path("analytics/dashboard-trends/", DashboardTrendsView.as_view(), name="analytics-dashboard-trends"),
]
