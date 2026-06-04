from rest_framework import viewsets

from clients.models import Client
from clients.serializers import ClientSerializer
from users.permissions import IsAdminOrStaff


class ClientViewSet(viewsets.ModelViewSet):
    queryset = Client.objects.select_related("user").all().order_by("-created_at")
    serializer_class = ClientSerializer
    permission_classes = [IsAdminOrStaff]

# Create your views here.
