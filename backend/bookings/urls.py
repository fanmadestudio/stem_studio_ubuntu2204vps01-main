from django.urls import include, path
from rest_framework.routers import DefaultRouter

from bookings.views import BookingViewSet

router = DefaultRouter()
router.register("bookings", BookingViewSet, basename="booking")

urlpatterns = [path("", include(router.urls))]
