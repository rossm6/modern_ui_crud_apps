import json

import graphene
from django.db.models import Case, CharField, Value, When, F
from django.db.models.functions import Concat, ExtractDay, ExtractMonth, ExtractYear
from django_filters import FilterSet, OrderingFilter
from graphene_django import DjangoObjectType
from graphene_django.filter import DjangoFilterConnectionField
from graphene_extras.pagination.ui import PaginationConnection

from squares.models import Product, Square
from squares.serializers import ProductSerializer


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


class SquareNode(DjangoObjectType):
    class Meta:
        model = Square
        fields = ('ad_url',)
        interfaces = (graphene.relay.Node,)
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


class ViewerNode(graphene.ObjectType):
    class Meta:
        interfaces = (graphene.relay.Node,)
    products = graphene.relay.ConnectionField(
        PaginateProductConnection, args={'orderBy': graphene.String()})

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
        q = order_queryset(q, **kwargs)
        return q


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
