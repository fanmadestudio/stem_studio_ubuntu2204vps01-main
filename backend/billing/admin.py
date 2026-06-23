from django.contrib import admin

from billing.models import Invoice, Payment


class PaymentInline(admin.TabularInline):
    model = Payment
    extra = 0
    readonly_fields = ["paid_at"]
    fields = ["amount", "paid_at", "note"]


@admin.register(Invoice)
class InvoiceAdmin(admin.ModelAdmin):
    list_display = ["id", "booking", "total", "paid_amount_display", "balance_due_display", "status", "issued_at"]
    list_filter = ["status", "issued_at"]
    search_fields = [
        "id",
        "booking__client__user__email",
        "booking__client__user__first_name",
        "booking__client__user__last_name",
        "booking__room__name",
    ]
    ordering = ["-issued_at"]
    readonly_fields = ["issued_at", "paid_amount_display", "balance_due_display"]
    date_hierarchy = "issued_at"
    inlines = [PaymentInline]
    actions = ["recalculate_statuses", "mark_cancelled"]
    fieldsets = (
        (None, {"fields": ("booking", "total", "status")}),
        ("Payment Summary", {"fields": ("paid_amount_display", "balance_due_display")}),
        ("Audit", {"fields": ("issued_at",)}),
    )

    def get_queryset(self, request):
        return super().get_queryset(request).select_related("booking__client__user", "booking__room", "booking__engineer")

    @admin.display(description="Paid")
    def paid_amount_display(self, obj):
        return obj.paid_amount

    @admin.display(description="Balance due")
    def balance_due_display(self, obj):
        return obj.balance_due

    @admin.action(description="Recalculate selected invoice statuses")
    def recalculate_statuses(self, request, queryset):
        for invoice in queryset:
            invoice.recalculate_status()
        self.message_user(request, f"{queryset.count()} invoice status value(s) recalculated.")

    @admin.action(description="Cancel selected unpaid/partial invoices")
    def mark_cancelled(self, request, queryset):
        cancellable = queryset.exclude(status=Invoice.InvoiceStatus.PAID)
        updated = cancellable.update(status=Invoice.InvoiceStatus.CANCELLED)
        self.message_user(request, f"{updated} invoice(s) cancelled. Paid invoices were skipped.")


@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = ["id", "invoice", "amount", "paid_at", "note"]
    list_filter = ["paid_at"]
    search_fields = ["invoice__id", "invoice__booking__client__user__email", "note"]
    ordering = ["-paid_at"]
    readonly_fields = ["paid_at"]
    date_hierarchy = "paid_at"

# Register your models here.
