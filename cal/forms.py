from django import forms
from django.forms import ModelForm

from cal.models import Event

class EventForm(ModelForm):
    class Meta:
        model = Event
        fields = ['name', 'location', 'start_datetime',
                 'end_datetime',"allday","description"]
        widgets = {
            'name': forms.TextInput(attrs={'placeholder': "Event Name"}),
            'start_datetime': forms.DateInput(attrs={'class':'datepicker'}),
        }