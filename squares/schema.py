import json
from collections.abc import Iterable
from datetime import date, timedelta
from functools import partial

import graphene
from django.db.models import Case, CharField, F, Value, When
from django.db.models.functions import (Concat, ExtractDay, ExtractMonth,
                                        ExtractYear)
from django_filters import FilterSet, OrderingFilter
from graphene_django import DjangoObjectType
from graphene_django.filter import DjangoFilterConnectionField
from graphene_extras.pagination.ui import PaginationConnection
from graphql_relay import connection_from_list
from graphene.relay.connection import PageInfo

from squares.forms import ProductSearchForm
from squares.models import Product, Square
from squares.serializers import ProductSerializer

"""
query A ($formData: ProductNodeInput) {
  viewer {
    products (formData: $formData) {
      edges {
        node {
          square {
            pk
          }
          durationUi
          startUi
          start
          duration
        }
        cursor
      }
      pages {
        first {
          isCurrent
        }
      }
    }
  }
}
"""

class ProductFilter(FilterSet):
    class Meta:
        model = Product
        fields = ('square', 'start', 'duration', 'end', 'listing', 'price')

    order_by = OrderingFilter(
        fields=(
            ('square', 'start', 'duration', 'end', 'listing', 'price')
        )
    )

class ProductConnection(graphene.relay.Connection):
    class Meta:
        abstract = True
    id = graphene.GlobalID()


class SquareFilter(FilterSet):
    class Meta:
        model = Square
        fields = ('ad_url',)


class SquareNode(DjangoObjectType):
    class Meta:
        model = Square
        fields = ('ad_url',)
        interfaces = (graphene.relay.Node,)
        filterset_class = SquareFilter
    pk = graphene.ID(source='pk', required=True)


"""
The UI values for fields start, end and duration are different to the DB values.
We need to create extra fields on the db query which map to the same field
names on the DjangoObjectType.
"""


def get_month_name_for_field(field_name):
    months = {
        'Jan': 1,
        'Feb': 2,
        'Mar': 3,
        'Apr': 4,
        'May': 5,
        'Jun': 6,
        'Jul': 7,
        'Aug': 8,
        'Sep': 9,
        'Oct': 10,
        'Nov': 11,
        'Dec': 12
    }
    whens = []
    for m, i in months.items():
        kwargs = {
            field_name: i,
            'then': Value(m, output_field=CharField())
        }
        whens.append(When(**kwargs))
    return Case(*whens)


class ProductNode(DjangoObjectType):
    class Meta:
        model = Product
        fields = ('square', 'start', 'duration', 'end', 'listing', 'price')
        filterset_class = ProductFilter
        interfaces = (graphene.relay.Node,)
        connection_class = ProductConnection
    pk = graphene.ID(source='pk', required=True)
    start_ui = graphene.String()
    duration_ui = graphene.String()
    end_ui = graphene.String()

    def resolve_start_ui(root, info, **kwargs):
        return root.start.strftime('%d %b %y')

    def resolve_end_ui(root, info, **kwargs):
        return root.start.strftime('%d %b %y')


class PaginateProductConnection(PaginationConnection):
    class Meta:
        node = ProductNode


def order_queryset(q, **kwargs):
    if order_by := kwargs.get('orderBy'):
        order_by = order_by.split(',')
        q = q.order_by(*order_by)
    return q


# This approach does not work because django_graphene wants a model instance
# not a dict
# def get_dicts_from_serializer(serialized_data):
#     # drf serialiser.data will returns a list of OrderedDicts
#     # json.dumps will give us json
#     # json.loads will give us a list of dicts
#     return json.loads(json.dumps(serialized_data))

"""
    Django Graphene out of the box provides ordering with DjangoFilterConnectionField.
    I'm already using a workaround though so am avoiding this field.  Easiest
    thing to do here is implement ordering ourselves.

    We need to format the values pulled out of sql because it won't accept dicts;
    it needs a model object instance instead.
"""


def choices_display(field_name, choices):
    whens = []
    for value, label in choices:
        kwargs = {
            field_name: value,
            "then": Value(label, output_field=CharField())
        }
        whens.append(When(**kwargs))
    return Case(*whens)


class Duration(graphene.Enum):
    d1 = timedelta(days=1).total_seconds()
    d2 = timedelta(days=2).total_seconds()
    d3 = timedelta(days=3).total_seconds()
    d4 = timedelta(days=4).total_seconds()
    d5 = timedelta(days=5).total_seconds()
    d6 = timedelta(days=6).total_seconds()
    d7 = timedelta(days=7).total_seconds()


class Listing(graphene.Enum):
    l = "l"
    s = "s"


class ProductNodeInput(graphene.InputObjectType):
    from_square = graphene.Int()
    to_square = graphene.Int()
    from_price = graphene.Int()
    to_price = graphene.Int()
    from_start = graphene.Date()
    to_start = graphene.Date()
    from_end = graphene.Date()
    to_end = graphene.Date()
    duration = graphene.List(Duration)
    listing = graphene.List(Listing)


class ConnectionFieldWithErrors(graphene.relay.ConnectionField):

    @classmethod
    def resolve_connection(cls, connection_type, args, resolved):
        if isinstance(resolved, connection_type):
            return resolved

        assert isinstance(resolved, Iterable), (
            "Resolved value from the connection field have to be iterable or instance of {}. "
            'Received "{}"'
        ).format(connection_type, resolved)

        queryset = resolved["queryset"]
        form_errors = resolved["form_errors"]

        connection = connection_from_list(
            queryset,
            args,
            connection_type=connection_type,
            edge_type=connection_type.Edge,
            pageinfo_type=PageInfo,
        )
        connection.iterable = queryset
        connection.form_errors = form_errors
        return connection


class ViewerNode(graphene.ObjectType):
    class Meta:
        interfaces = (graphene.relay.Node,)
    products = ConnectionFieldWithErrors(
        PaginateProductConnection,
        args={
            'orderBy': graphene.String(),
            'searchText': graphene.String(),
            'formData': ProductNodeInput(),
        }
    )
    squares = DjangoFilterConnectionField(SquareNode)

    def resolve_products(root, info, **kwargs):
        """
        After writing this I remembered the django object field value can be
        overwritten with resolve_<field_name> lol

        Anyway, we still need the three fields -

            start_ui
            duration_ui
            end_ui

        Because we want to return a str and start and end have to return
        datetime objects.  And obj.duration is not nice.  Easier to just
        return the right value from the DB.

        So the start_ui and end_ui fields are now obsolete in this query.
        I still include them for the sake of learning.
        """

        form_errors = {}

        if formData := kwargs.get('formData'):
            form = ProductSearchForm(data=formData)

        q = (
            Product
            .objects
            .annotate(start_month=ExtractMonth('start'))
            .annotate(end_month=ExtractMonth('end'))
            .annotate(start_month_name=get_month_name_for_field('start_month'))
            .annotate(end_month_name=get_month_name_for_field('end_month'))
            .annotate(start_ui=Concat(
                ExtractDay('start'),
                Value('-'),
                F('start_month_name'),
                Value('-'),
                ExtractYear('start'),
                output_field=CharField()
            )
            )
            .annotate(end_ui=Concat(
                ExtractDay('end'),
                Value('-'),
                F('end_month_name'),
                Value('-'),
                ExtractYear('end'),
                output_field=CharField()
            )
            )
            .annotate(duration_ui=choices_display('duration', Product.durations))
        )

        if formData := kwargs.get('formData'):
            form = ProductSearchForm(data=formData)
            if form.is_valid():
                default_search = {
                    "from_square": 1,
                    "to_square": 1000,
                    "from_price": 0,
                    "to_price": 1000000,
                    "from_start_date": date(1900, 1, 1),
                    "to_start_date": date(2030, 1, 1),
                    "from_end_date": date(1900, 1, 1),
                    "to_end_date": date(2030, 1, 1),
                    "duration": [str(d[0]) for d in Product.durations],
                    "listing": [l[0] for l in Product.listings]
                }
                cleaned_data = {k: v for k,
                                v in form.cleaned_data.items() if v}
                filters = {}
                filters.update(default_search)
                filters.update(cleaned_data)

                duration = []
                for d in filters["duration"]:
                    duration.append(timedelta(seconds=float(d)))
                filters["duration"] = duration

                q = (
                    q
                    .filter(square_id__gte=filters["from_square"])
                    .filter(square_id__lte=filters["to_square"])
                    .filter(price__gte=filters["from_price"])
                    .filter(price__lte=filters["to_price"])
                    .filter(start__gte=filters["from_start_date"])
                    .filter(start__lte=filters["to_start_date"])
                    .filter(end__gte=filters["from_end_date"])
                    .filter(end__lte=filters["to_end_date"])
                    .filter(duration__in=filters["duration"])
                    .filter(listing__in=filters["listing"])
                )
            else:
                form_errors = form.errors
                q = q.none()
        q = order_queryset(q, **kwargs)
        return {
            "queryset": q,
            "form_errors": form_errors
        }


class Query(graphene.ObjectType):
    viewer = graphene.Field(ViewerNode)

    def resolve_viewer(self, info, **kwargs):
        return ViewerNode()


"""
query A {
  viewer {
    products {
      edges {
        node {
          square {
            pk
          }
        }
        cursor
      }
      pages {
        first {
          isCurrent
        }
      }
    }
  }
}
"""
