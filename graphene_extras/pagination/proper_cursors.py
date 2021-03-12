import datetime
import operator
from base64 import b64decode as _unbase64
from base64 import b64encode as _base64
from functools import reduce
from base64 import b64decode, b64encode

from django.db.models import Q

from graphene import relay
from graphql_relay.connection import connectiontypes

"""
The following module is taken from this source - https://gist.github.com/AndrewIngram/b1a6e66ce92d2d0befd2f2f65eb62ca5
The author explains that django graphene's cursor pagination is pointless.  It just encodes
the index position of the item in the queryset.  So it isn't an improvement upon the most
basic kind of pagination which is just offset and limit.
This module provides proper cursor based pagination for a queryset.
Such an approach assumes that the ordering of the queryset entails unique
items.  So this is always the case we use the pk field always as the last
ordering field.
"""


def base64(s):
    return _base64(s.encode('utf-8')).decode('utf-8')


def unbase64(s):
    return _unbase64(s).decode('utf-8')


def get_attribute(instance, name):
    if hasattr(instance, name):
        return getattr(instance, name)

    names = name.split("__")
    name = names.pop(0)
    if len(names) == 0:
        return None

    if hasattr(instance, name):
        value = getattr(instance, name)
        return get_attribute(value, "__".join(names))

    return None


def attr_from_sort(sort):
    if sort[0] == '-':
        return sort[1:]
    return sort


def build_q_objects(sort, cursor_parts):
    # Initially I found the mathematics here confusing
    # See explanation below marked *
    attr = attr_from_sort(sort[-1])
    sort_direction = 'lt' if sort[-1][0] == '-' else 'gt'

    kwargs = {
        f"{attr}__{sort_direction}": cursor_parts[attr],
    }

    for x in sort[0:-1]:
        x_attr = attr_from_sort(x)
        kwargs[x_attr] = cursor_parts[x_attr]

    q = Q(**kwargs)

    if len(sort) == 1:
        return [q]

    acc = build_q_objects(sort[0: -1], cursor_parts)
    acc.append(q)

    return acc


def cursor_string_from_parts(parts, sort):
    bits = []

    for x in sort:
        attr = attr_from_sort(x)
        bits.append(parts[attr])

    return base64('|'.join(bits))


def parts_from_cursor_string(cursor, sort):
    cursor_parts = {}
    bits = unbase64(cursor).split('|')

    for i, x in enumerate(sort):
        cursor_parts[attr_from_sort(x)] = bits[i]

    return cursor_parts


def cursor_string_from_obj(obj, sort):
    cursor_parts = {}

    for x in sort:
        attr_name = attr_from_sort(x)
        attr = get_attribute(obj, attr_name)

        if isinstance(attr, datetime.datetime):
            attr = attr.isoformat()
        else:
            attr = str(attr)

        cursor_parts[attr_name] = attr

    return cursor_string_from_parts(cursor_parts, sort)


def filter_queryset(qs, cursor, sort):
    cursor_parts = parts_from_cursor_string(cursor, sort)
    q_objects = build_q_objects(sort, cursor_parts)
    return qs.filter(reduce(operator.__or__, q_objects))


class QuerysetConnectionField(relay.ConnectionField):
    def __init__(self, type, *args, **kwargs):
        return_value = super().__init__(
            type,
            *args,
            **kwargs
        )

        # Validate class methods
        assert hasattr(
            type, 'get_queryset'), f'Connection type {type} needs a `get_queryset` method'
        assert hasattr(
            type, 'get_sort'), f'Connection type {type} needs a `get_sort` method'
        return return_value

    @classmethod
    def connection_resolver(cls, resolver, connection_type, root, info, **args):
        if hasattr(connection_type, 'of_type'):
            connection_type = connection_type.of_type

        first = args.get('first')
        last = args.get('last')
        after = args.get('after')
        # before = args.get('before')
        sort = connection_type.get_sort(**args)

        # Validate connection arguments
        assert first or last, (
            'You must provide a `first` or `last` value to properly paginate the `{}` connection.'
        ).format(info.field_name)
        assert not (first and last), (
            'You cannot define both `first` and `last` values on `{}` connection.'
        ).format(info.field_name)
        assert not last, 'last` argument is not supported'

        qs = connection_type.get_queryset(root, info, **args).order_by(*sort)

        if after:
            qs = filter_queryset(qs, after, sort)

        total_length = qs.count()

        if first:
            qs = qs[:first]

        edge_type = connection_type.Edge or connectiontypes.Edge

        edges = [
            edge_type(
                node=node,
                cursor=cursor_string_from_obj(node, sort)
            )
            for node in qs.iterator()
        ]

        first_edge_cursor = edges[0].cursor if edges else None
        last_edge_cursor = edges[-1].cursor if edges else None

        page_info = relay.PageInfo(
            start_cursor=first_edge_cursor,
            end_cursor=last_edge_cursor,
            has_previous_page=False,  # TODO
            has_next_page=isinstance(first, int) and (total_length > first),
        )

        return connection_type(
            edges=edges,
            page_info=page_info,
        )


"""
    *
    Let's assume the following data set where there are three columns,
    C1, C2 and C3.
    C1      C2      C3
    A       1       B
    B       3       A
    B       4       C
    B       4       D
    B       5       B
    C       6       A
    Say we wanted to find the subset which comes after row 2
    where we are ordering based on C1 ASC, C2 ASC AND C3 ASC.
    We'd need to get the following three subsets.
    First this -
        C1 = B
        and C2 = 3
        and C3 > A
    Second -
        C1 = B
        C2 > 3
    Third -
        C1 > B
    Which in SQL implies query of this form -
    SELECT * FROM
    WHERE (
        (
            C1 = B
            AND C2 > 3
        )
        OR
        (
            C1 = B
            AND C2 = 3
            AND C3 > A
        )
        OR
        (
            C1 > B
        )
    )
"""
