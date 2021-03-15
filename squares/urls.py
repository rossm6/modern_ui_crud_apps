from django.urls import path

from squares.views import ProductsView, ProductsTableServerSide, ProductSearchForm, Slider

app_name = "products"
urlpatterns = [
    path('basic', ProductsView.as_view(), name="products"),
    path('server_side', ProductsTableServerSide.as_view(),
         name="products_server_side"),
    path('products_search_form', ProductSearchForm.as_view(),
         name="products_search_form"),
	path('slider', Slider.as_view(), name="slider")
]
