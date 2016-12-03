from django.conf.urls import url
from . import views

urlpatterns = [
    url(r'^$', views.index, name='index'),
    url(r'^getevents/(?P<month>[0-9]{1,2})/(?P<year>[0-9]{4})/$', views.getevents,name="getevents"),
    url(r'^addevent/$',views.addevent,name='addevent'),
    url(r'^addsynced/$',views.addsynced,name='addsynced'),
    url(r'^delevent/$',views.delevent)
    ]