from django.urls import path

from squares.views import ProductsView

app_name = "products"
urlpatterns = [
    path('basic', ProductsView.as_view(), name="products"),
]
