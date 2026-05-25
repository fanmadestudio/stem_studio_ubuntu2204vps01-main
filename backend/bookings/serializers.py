from rest_framework import serializers

from billing.models import Invoice
from bookings.models import Booking


class BookingSerializer(serializers.ModelSerializer):
    class Meta:
        model = Booking
        fields = [
            "id",
            "client",
            "room",
            "engineer",
            "equipment",
            "start_time",
            "end_time",
            "notes",
            "status",
            "created_at",
        ]
        read_only_fields = ["id", "created_at"]

    def validate(self, attrs):
        # Support partial updates (e.g. PATCH status-only) by falling back
        # to current instance values when a scheduling field is not provided.
        instance = self.instance
        start_time = attrs.get("start_time", instance.start_time if instance else None)
        end_time = attrs.get("end_time", instance.end_time if instance else None)
        room = attrs.get("room", instance.room if instance else None)
        engineer = attrs.get("engineer", instance.engineer if instance else None)

        if not all([start_time, end_time, room, engineer]):
            raise serializers.ValidationError(
                "start_time, end_time, room, and engineer are required for booking validation."
            )

        if start_time >= end_time:
            raise serializers.ValidationError("end_time must be later than start_time.")

        queryset = Booking.objects.exclude(pk=instance.pk) if instance else Booking.objects.all()
        overlap = queryset.filter(start_time__lt=end_time, end_time__gt=start_time).filter(room=room)
        if overlap.exists():
            raise serializers.ValidationError("Booking conflict detected: room is already in use.")

        overlap_engineer = queryset.filter(start_time__lt=end_time, end_time__gt=start_time).filter(engineer=engineer)
        if overlap_engineer.exists():
            raise serializers.ValidationError("Booking conflict detected: engineer is already assigned.")

        return attrs

    def create(self, validated_data):
        booking = super().create(validated_data)
        Invoice.objects.get_or_create(
            booking=booking,
            defaults={
                "total": booking.room.price,
                "status": Invoice.InvoiceStatus.UNPAID,
            },
        )
        return booking
