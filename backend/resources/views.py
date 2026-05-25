from rest_framework import viewsets

from resources.models import Engineer, Equipment, Room
from resources.serializers import EngineerSerializer, EquipmentSerializer, RoomSerializer
from users.permissions import IsAdminOrStaff


class RoomViewSet(viewsets.ModelViewSet):
    queryset = Room.objects.all().order_by("name")
    serializer_class = RoomSerializer
    permission_classes = [IsAdminOrStaff]


class EngineerViewSet(viewsets.ModelViewSet):
    queryset = Engineer.objects.select_related("user").all().order_by("name")
    serializer_class = EngineerSerializer
    permission_classes = [IsAdminOrStaff]


class EquipmentViewSet(viewsets.ModelViewSet):
    queryset = Equipment.objects.all().order_by("name")
    serializer_class = EquipmentSerializer
    permission_classes = [IsAdminOrStaff]

# Create your views here.
