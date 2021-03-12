from django.urls import path

from squares.views import ProductsView, ProductsTableServerSide

app_name = "products"
urlpatterns = [
    path('basic', ProductsView.as_view(), name="products"),
    path('server_side', ProductsTableServerSide.as_view(), name="products_server_side"),
]
