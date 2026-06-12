from rest_framework import viewsets

from bookings.models import Booking
from bookings.serializers import BookingSerializer
from users.permissions import IsAdminStaffOrReadOnly


class BookingViewSet(viewsets.ModelViewSet):
    queryset = Booking.objects.select_related("client", "room", "engineer").prefetch_related("equipment").all()
    serializer_class = BookingSerializer
    permission_classes = [IsAdminStaffOrReadOnly]

    def get_queryset(self):
        queryset = (
            Booking.objects.select_related("client", "client__user", "room", "engineer")
            .prefetch_related("equipment")
            .all()
        )
        status = self.request.query_params.get("status")
        start_date = self.request.query_params.get("start_date")
        end_date = self.request.query_params.get("end_date")

        if status:
            queryset = queryset.filter(status=status)
        if start_date:
            queryset = queryset.filter(start_time__date__gte=start_date)
        if end_date:
            queryset = queryset.filter(start_time__date__lte=end_date)
        return queryset

# Create your views here.
