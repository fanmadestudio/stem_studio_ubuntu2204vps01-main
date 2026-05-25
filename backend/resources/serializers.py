from rest_framework import serializers

from resources.models import Engineer, Equipment, Room


class RoomSerializer(serializers.ModelSerializer):
    class Meta:
        model = Room
        fields = ["id", "name", "price"]


class EngineerSerializer(serializers.ModelSerializer):
    user_email = serializers.EmailField(source="user.email", read_only=True)

    class Meta:
        model = Engineer
        fields = ["id", "name", "role", "user", "user_email", "is_available"]


class EquipmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Equipment
        fields = ["id", "name", "status"]
