from base64 import b64decode, b64encode

import graphene
from django_filters import FilterSet, OrderingFilter
from graphene_django import DjangoObjectType
from graphene_django.filter import DjangoFilterConnectionField
from graphene_django.forms.mutation import DjangoModelFormMutation
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
# the graphql implementation in capitalizes the
# django choice values.  No option but to either override
# like this or declare the model attribute a string.
# i prefer this even though more code.


class PeopleConnection(graphene.relay.Connection):
    class Meta:
        abstract = True
    id = graphene.GlobalID()


class PersonNode(DjangoObjectType):
    class Meta:
        model = Person
        fields = ('first_name', 'last_name', 'age',
                  'sex', 'alive', 'unique_identifier', 'random_number')
        filterset_class = PersonFilter
        interfaces = (graphene.relay.Node,)
        connection_class = PeopleConnection
    sex = SEXES_ENUM()
    pk = graphene.ID(source='pk', required=True)


class PageCursor(graphene.ObjectType):
    cursor = graphene.String()
    page_number = graphene.Int()
    is_current = graphene.Boolean()


class PageCursors(graphene.ObjectType):
    first = graphene.Field(PageCursor)
    around = graphene.NonNull(graphene.List(graphene.NonNull(PageCursor)))
    last = graphene.Field(PageCursor)
    previous = graphene.Field(PageCursor)


def decode_cursor(cursor):
    # cursor is just a masked index
    # see graphene_extras.pagination for proper cursors
    try:
        decoded_cursor = b64decode(cursor.encode('ascii')).decode('utf8')
        # e.g. 'arrayconnection:0'
        # we just want the index
        i = decoded_cursor.split(':')[1]
        return int(i)
    except (TypeError, ValueError):
        pass


def encode_cursor(index):
    return b64encode(
        index.encode('utf8')
    ).decode('ascii')


# See the graphql_relay package - https://github.com/graphql-python/graphql-relay-py/blob/master/src/graphql_relay/connection/arrayconnection.py
PREFIX = 'arrayconnection:'


def create_cursor(index):
    return encode_cursor(PREFIX + str(index))


def page_to_index(page, page_size):
    return (page - 1) * page_size - 1


"""
Need to manually test this new class out
"""


class PaginationConnection(graphene.relay.Connection):
    class Meta:
        abstract = True
    pages = graphene.Field(PageCursors, pageSize=graphene.Int())
    # page_size will force a reload and put the user back to page 1

    def get_page_number(self, index, page_size):
        return index // page_size + 1

    def get_page_cursor(self, page, is_current, page_size):
        i = page_to_index(page, page_size)
        c = create_cursor(i)
        return PageCursor(cursor=c, page_number=page, is_current=is_current)

    def get_page_cursors(self, first_page, last_page, previous_page, around_pages, current_page, page_size):
        if first_page:
            first_page = self.get_page_cursor(
                first_page, first_page == current_page, page_size)
        if last_page:
            last_page = self.get_page_cursor(
                last_page, last_page == current_page, page_size)
        if previous_page:
            previous_page = self.get_page_cursor(
                previous_page, previous_page == current_page, page_size)
        if around_pages:
            around_pages_ = []
            for p in around_pages:
                around_pages_.append(self.get_page_cursor(
                    p, p == current_page, page_size))
            around_pages = around_pages_
        return PageCursors(first=first_page, last=last_page, around=around_pages, previous=previous_page)

    def get_pages(self, page_size, current_page_start_cursor, current_page_end_cursor, queryset):
        if not current_page_end_cursor:
            return
        current_page_start_index = decode_cursor(current_page_start_cursor)
        current_page_end_index = decode_cursor(current_page_end_cursor)
        current_page = self.get_page_number(
            current_page_start_index, page_size)
        first_page = 1
        last_page = self.get_page_number(len(queryset) - 1, page_size)
        previous_page = current_page - 1 if current_page > 1 else None
        around_pages = []
        for i in range(-2, 3):
            if (current_page + i >= 1
                    and current_page + i <= last_page):
                around_pages.append(current_page + i)
        return self.get_page_cursors(first_page, last_page, previous_page, around_pages, current_page, page_size)

    def resolve_pages(self, info, **kwargs):
        # Note that page_size is an argument for pages which is on the connection field
        # This feels a little odd but I don't see a way around this.  Really I wanted to pass pageSize,
        # along with the other parameters for peoplePages
        page_info = self.page_info
        queryset = self.iterable
        page_size = kwargs.get('page_size', 10)
        return self.get_pages(page_size, page_info.start_cursor, page_info.end_cursor, queryset)


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
