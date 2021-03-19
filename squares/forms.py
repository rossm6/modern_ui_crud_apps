from django import forms
from squares.models import Product

"""
Example Input -

d = {
    'from_square': 1, 
    'to_square': 2, 
    'from_price': 10, 
    'to_price': 100, 
    'from_start_date': '02/10/1990', 
    'to_start_date': '02/10/1991', 
    'from_end_date': '02/05/15', 
    'to_end_date': '02/05/16', 
    'duration': ['1 day, 0:00:00'],
    'listing': ['l']
}

"""

class ProductSearchForm(forms.Form):
    from_square = forms.IntegerField()
    to_square = forms.IntegerField()
    from_price = forms.IntegerField()
    to_price = forms.IntegerField()
    from_start_date = forms.DateField()
    to_start_date = forms.DateField()
    from_end_date = forms.DateField()
    to_end_date = forms.DateField()
    duration = forms.MultipleChoiceField(choices=Product.durations)
    listing = forms.MultipleChoiceField(choices=Product.listings)

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        for k, field in self.fields.items():
            field.required = False