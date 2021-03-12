import graphene
from django_filters import FilterSet, OrderingFilter
from graphene_django import DjangoObjectType
from graphene_django.filter import DjangoFilterConnectionField
from graphene_extras.pagination.ui import PaginationConnection

from squares.models import Product, Square


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


class ProductNode(DjangoObjectType):
    class Meta:
        model = Product
        fields = ('square', 'start', 'duration', 'end', 'listing', 'price')
        filterset_class = ProductFilter
        interfaces = (graphene.relay.Node,)
        connection_class = ProductConnection
    pk = graphene.ID(source='pk', required=True)


class PaginateProductConnection(PaginationConnection):
    class Meta:
        node = ProductNode


def order_queryset(q, **kwargs):
    if order_by := kwargs.get('orderBy'):
        order_by = order_by.split(',')
        q = q.order_by(*order_by)
    return q


"""
Django Graphene out of the box provides ordering with DjangoFilterConnectionField.
I'm already using a workaround though so am avoiding this field.  Easiest
thing to do here is implement ordering ourselves.
"""


class ViewerNode(graphene.ObjectType):
    class Meta:
        interfaces = (graphene.relay.Node,)
    products = graphene.relay.ConnectionField(
        PaginateProductConnection, args={'orderBy': graphene.String()})

    def resolve_products(root, info, **kwargs):
        q = Product.objects.all()
        return order_queryset(q, **kwargs)


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
