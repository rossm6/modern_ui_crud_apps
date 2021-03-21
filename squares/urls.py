from django.urls import path

from squares.views import (InfiniteScroll, MyTable, ProductSearchForm,
                           ProductsTableServerSide, ProductsView, Slider)

app_name = "products"
urlpatterns = [
    path('basic', ProductsView.as_view(), name="products"),
    path('server_side', ProductsTableServerSide.as_view(),
         name="products_server_side"),
    path('products_search_form', ProductSearchForm.as_view(),
         name="products_search_form"),
    path('slider', Slider.as_view(), name="slider"),
    path('my_table', MyTable.as_view(), name="my-table"),
    path('infinite_scroll', InfiniteScroll.as_view(), name="infinite_scroll")
]
