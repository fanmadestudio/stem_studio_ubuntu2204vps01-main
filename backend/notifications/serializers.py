from rest_framework import serializers

from notifications.models import Notification


class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = [
            "id",
            "user",
            "title",
            "message",
            "notification_type",
            "status",
            "scheduled_for",
            "created_at",
        ]
        read_only_fields = ["id", "created_at"]
