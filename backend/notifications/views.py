from rest_framework import viewsets

from notifications.models import Notification
from notifications.serializers import NotificationSerializer
from users.permissions import IsAdminOrStaff


class NotificationViewSet(viewsets.ModelViewSet):
    queryset = Notification.objects.select_related("user").all().order_by("-created_at")
    serializer_class = NotificationSerializer
    permission_classes = [IsAdminOrStaff]

# Create your views here.
