from django.urls import path

from people.views import BasicPersonView

app_name = "people"
urlpatterns = [
    path('basic', BasicPersonView.as_view(), name="basic")
]