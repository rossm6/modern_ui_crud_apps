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


class ViewerNode(graphene.ObjectType):
    class Meta:
        interfaces = (graphene.relay.Node,)
    products = graphene.relay.ConnectionField(PaginateProductConnection)

    def resolve_products(root, info, **kwargs):
        return Product.objects.all()


class Query(graphene.ObjectType):
    viewer = graphene.Field(ViewerNode)

    def resolve_viewer(self, info, **kwargs):
        return ViewerNode()
