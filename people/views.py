from django.shortcuts import render
from django.views.generic import TemplateView

class BasicPersonView(TemplateView):
    template_name = "basic.html"

class LoadMore(TemplateView):
    template_name = "load_more.html"

class Pagination(TemplateView):
    template_name = "pagination.html"