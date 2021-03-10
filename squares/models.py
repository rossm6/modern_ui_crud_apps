from datetime import timedelta
from django.db import models


class Square(models.Model):
    ad_url = models.URLField()


class Product(models.Model):
    durations = [
        (timedelta(days=1), "1 day"),
        (timedelta(days=2), "2 days"),
        (timedelta(days=3), "3 days"),
        (timedelta(days=4), "4 days"),
        (timedelta(days=5), "5 days"),
        (timedelta(days=6), "6 days"),
        (timedelta(days=7), "7 days"),
    ]
    listings = [
        ('l', "lease"),
        ('s', "sale"),
    ]
    square = models.ForeignKey(Square, on_delete=models.CASCADE, null=True)
    price = models.PositiveIntegerField()
    start = models.DateTimeField()
    duration = models.DurationField(choices=durations)
    end = models.DateTimeField()
    listing = models.CharField(choices=listings, max_length=1)
