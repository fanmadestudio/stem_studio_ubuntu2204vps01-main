from django.urls import include, path
from rest_framework.routers import DefaultRouter

from users.views import ProfileView, UserViewSet

router = DefaultRouter()
router.register("users", UserViewSet, basename="user")

urlpatterns = [
    path("auth/profile/", ProfileView.as_view(), name="profile"),
    path("", include(router.urls)),
]
