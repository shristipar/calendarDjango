from __future__ import unicode_literals

from django.db import models

class Event(models.Model):
    name = models.CharField(max_length = 50)
    location =models.CharField(max_length = 50)
    start_datetime = models.DateTimeField(blank=False)
    end_datetime = models.DateTimeField(blank=False)
    allday = models.BooleanField()
    description = models.TextField()
    synced= models.BooleanField(default= False)
    