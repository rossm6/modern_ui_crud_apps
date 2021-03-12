from base64 import b64decode, b64encode

import graphene
from django_filters import FilterSet, OrderingFilter
from graphene_django import DjangoObjectType
from graphene_django.filter import DjangoFilterConnectionField
from graphene_django.forms.mutation import DjangoModelFormMutation
from graphene_extras.pagination.ui import PaginationConnection
from graphql_relay import from_global_id
from graphql_relay.connection.arrayconnection import offset_to_cursor

from people.forms import PersonForm
from people.models import Person

"""
python3 manage.py graphql_schema --schema proj.schema.schema --out schema.json
"""


class PersonFilter(FilterSet):
    class Meta:
        model = Person
        fields = ('first_name', 'last_name', 'age',
                  'sex', 'alive', 'unique_identifier', 'random_number')

    order_by = OrderingFilter(
        fields=(
            ('first_name', 'last_name',)
        )
    )


SEXES_ENUM = graphene.Enum(
    'Sexes',
    [(value, value) for value, _ in Person.sexes]
)

# The graphql implementation in capitalizes the
# django choice values.  No option but to either override
# like this or declare the model attribute a string.
# I prefer this even though more code.


class PeopleConnection(graphene.relay.Connection):
    class Meta:
        abstract = True
    id = graphene.GlobalID()


class PersonNode(DjangoObjectType):
    class Meta:
        model = Person
        fields = ('first_name', 'last_name', 'age',
                  'sex', 'alive', 'unique_identifier', 'random_number',)
        filterset_class = PersonFilter
        interfaces = (graphene.relay.Node,)
        connection_class = PeopleConnection
    sex = SEXES_ENUM()
    pk = graphene.ID(source='pk', required=True)


"""
query A {
 viewer {
  peoplePages(first:5, after:"") {
    edges {
      node {
        firstName
        randomNumber
      }
      cursor
    }
    pages (pageSize: 5) {
      first {
        cursor
        pageNumber
        isCurrent
      }
      last {
        cursor
        pageNumber
        isCurrent
      }
      around {
        cursor
        pageNumber
        isCurrent
      }
      previous {
        cursor
        pageNumber
        isCurrent
      }
    }
  }
} 
}
"""


class PaginatePeopleConnection(PaginationConnection):
    class Meta:
        node = PersonNode


class ViewerNode(graphene.ObjectType):
    class Meta:
        interfaces = (graphene.relay.Node,)
    people = DjangoFilterConnectionField(PersonNode)
    people_pages = graphene.relay.ConnectionField(
        PaginatePeopleConnection)

    def resolve_people_pages(root, info, **kwargs):
        return Person.objects.all()


class Query(graphene.ObjectType):
    viewer = graphene.Field(ViewerNode)

    def resolve_viewer(self, info, **kwargs):
        return ViewerNode()


"""
python3 manage.py graphql_schema --schema proj.schema.schema --out schema.json
"""

PersonNodeEdge = PersonNode._meta.connection.Edge


class UpdatePersonMutation(DjangoModelFormMutation):
    class Meta:
        form_class = PersonForm
        fields = ('id', 'first_name', 'last_name', 'age',
                  'sex', 'alive', 'unique_identifier')
        # remember id is obviously pk for the model
        # on the client relay understands id as it's own global id for the object
        # so we need to expose the pk to the client so we can update from the clientside


class CreatePersonMutation(DjangoModelFormMutation):
    class Meta:
        form_class = PersonForm
        fields = ('first_name', 'last_name', 'age',
                  'sex', 'alive', 'unique_identifier', 'random_number',)
    person_node_edge = graphene.Field(PersonNodeEdge)
    # remember this line!
    # if you want to add an item to a connection list on the client
    # with replay

    @classmethod
    def perform_mutate(cls, form, info):
        obj = form.save()
        # if ordering and filtering we'll need to
        # check that the object created is within the queryset
        # used on the client
        # s = client_queryset
        # Person.objects.filter(pk__in=Subquery(s.values('pk')))
        # asssuming the item should be shown on the client
        kwargs = {
            cls._meta.return_field_name: obj,
            "person_node_edge": PersonNodeEdge(cursor=offset_to_cursor(0), node=obj)
        }
        return cls(errors=[], **kwargs)


class DeletePersonMutation(graphene.relay.ClientIDMutation):
    class Input:
        id = graphene.ID()
    deleted_person_id = graphene.ID()

    @classmethod
    def mutate_and_get_payload(cls, root, info, id):
        Person.objects.filter(pk=from_global_id(id)[1]).delete()
        return cls(deleted_person_id=id)


class Mutation(graphene.ObjectType):
    create_person = CreatePersonMutation.Field()
    update_person = UpdatePersonMutation.Field()
    delete_person = DeletePersonMutation.Field()
