from django.db import models

class Person(models.Model):
    sexes = [
        ("m", "Male"),
        ("f", "Female")
    ]
    first_name = models.CharField(max_length=30)
    last_name = models.CharField(max_length=30)
    age = models.SmallIntegerField()
    sex = models.CharField(choices=sexes, max_length=1)
    alive = models.BooleanField(default=True)
    unique_identifier = models.CharField(unique=True, max_length=30)
    random_number = models.PositiveIntegerField()