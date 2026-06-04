import secrets

from rest_framework import serializers

from clients.models import Client
from users.models import User


class ClientSerializer(serializers.ModelSerializer):
    user_email = serializers.EmailField(source="user.email", read_only=True)
    first_name = serializers.CharField(source="user.first_name", required=False, allow_blank=True)
    last_name = serializers.CharField(source="user.last_name", required=False, allow_blank=True)
    user = serializers.PrimaryKeyRelatedField(queryset=User.objects.all(), required=False)
    email = serializers.EmailField(write_only=True, required=False)

    class Meta:
        model = Client
        fields = ["id", "user", "user_email", "email", "first_name", "last_name", "phone", "notes", "created_at"]
        read_only_fields = ["id", "created_at", "user_email"]

    def validate(self, attrs):
        if self.instance:
            return attrs
        if attrs.get("user"):
            return attrs
        if not attrs.get("email"):
            raise serializers.ValidationError({"email": "Email is required when user is not provided."})
        return attrs

    def create(self, validated_data):
        user_data = validated_data.pop("user", None)
        email = validated_data.pop("email", None)

        first_name = ""
        last_name = ""
        if isinstance(user_data, dict):
            first_name = user_data.get("first_name", "")
            last_name = user_data.get("last_name", "")

        if isinstance(user_data, User):
            user = user_data
        else:
            user = User.objects.create_user(
                email=email,
                password=secrets.token_urlsafe(24),
                first_name=first_name,
                last_name=last_name,
                role="client",
            )
        return Client.objects.create(user=user, **validated_data)
