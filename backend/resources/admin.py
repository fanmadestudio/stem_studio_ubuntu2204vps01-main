from django.contrib import admin

from resources.models import Engineer, Equipment, Room

admin.site.register(Room)
admin.site.register(Engineer)
admin.site.register(Equipment)

# Register your models here.
