from django.shortcuts import render
from django.views.generic import TemplateView

class BasicPersonView(TemplateView):
    template_name = "basic.html"