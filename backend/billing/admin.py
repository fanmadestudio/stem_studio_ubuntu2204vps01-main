from django.contrib import admin

from billing.models import Invoice, Payment

admin.site.register(Invoice)
admin.site.register(Payment)

# Register your models here.
