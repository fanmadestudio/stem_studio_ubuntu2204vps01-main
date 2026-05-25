from rest_framework import viewsets

from bookings.models import Booking
from bookings.serializers import BookingSerializer
from users.permissions import IsAdminStaffOrReadOnly


class BookingViewSet(viewsets.ModelViewSet):
    queryset = Booking.objects.select_related("client", "room", "engineer").prefetch_related("equipment").all()
    serializer_class = BookingSerializer
    permission_classes = [IsAdminStaffOrReadOnly]

# Create your views here.
