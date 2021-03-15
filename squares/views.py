from django.shortcuts import render
from django.views.generic import TemplateView
from squares.models import Product

def model_dict_for_ui(product):
    product["start"] = product["start"].strftime("%d %m %Y")

class ProductsView(TemplateView):
    template_name = "products.html"

    def get_context_data(self, **kwargs):
        ctx = super().get_context_data(**kwargs)
        ctx["products"] = list(Product.objects.all().values('square', 'start', 'duration', 'end', 'listing', 'price'))
        print(ctx["products"])
        return ctx


class ProductsTableServerSide(TemplateView):
    template_name = "products_table_server_side.html"


class ProductSearchForm(TemplateView):
    template_name = "products_search_form.html"

class Slider(TemplateView):
    template_name = "slider.html"