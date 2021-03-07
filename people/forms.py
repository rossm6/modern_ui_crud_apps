from django import forms
from django.utils.translation import ugettext_lazy as _

from people.models import Person

class PersonForm(forms.ModelForm):
    class Meta:
        model = Person
        fields = (
            'first_name', 'last_name', 'age', 
            'sex', 'alive', 'unique_identifier',
            'random_number',
        )