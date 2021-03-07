from django.urls import path

from people.views import BasicPersonView, LoadMore

app_name = "people"
urlpatterns = [
    path('basic', BasicPersonView.as_view(), name="basic"),
    path('loadmore', LoadMore.as_view(), name="loadmore")
]
