from django.urls import include, path
from rest_framework.routers import DefaultRouter

from resources.views import EngineerViewSet, EquipmentViewSet, RoomViewSet

router = DefaultRouter()
router.register("rooms", RoomViewSet, basename="room")
router.register("engineers", EngineerViewSet, basename="engineer")
router.register("equipment", EquipmentViewSet, basename="equipment")

urlpatterns = [path("", include(router.urls))]
