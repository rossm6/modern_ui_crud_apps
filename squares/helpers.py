import random
from datetime import datetime, timedelta
from squares.models import Square, Product


def create_squares(n):
    squares = []
    for i in range(n):
        squares.append(Square(ad_url="www.google.com"))
    return Square.objects.bulk_create(squares)

def create_products(squares):
    products = []
    listings = ['l', 's']
    for i, s in enumerate(squares):
        start = start = datetime.now()
        duration = timedelta(days=1)
        end = start + duration
        p = Product(
            square=s,
            start=start,
            duration=duration,
            end=end,
            listing=listings[i % 2],
            price=random.randint(1, 1000000)
        )
        products.append(p)
    return Product.objects.bulk_create(products)
