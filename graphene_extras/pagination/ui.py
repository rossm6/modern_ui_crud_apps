"""
This module helps with implementing pagination buttons in the UI
"""
from base64 import b64decode, b64encode

import graphene


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
    if page == 1:
        return 0
    return ((page - 1) * page_size) - 1


"""
Need to manually test this new class out
"""


class PaginationConnection(graphene.relay.Connection):
    """
    For each pagination button we want the cursor which is the last index of
    the page before.  Then the client just requests -

        first: $pageSize, after: "<cursor of last item on previous page>"

    """
    class Meta:
        abstract = True
    pages = graphene.Field(PageCursors, pageSize=graphene.Int())
    # page_size will force a reload and put the user back to page 1
    total_pages = graphene.Int()

    def get_page_number(self, index, page_size):
        return index // page_size + 1

    def get_page_cursor(self, page, is_current, page_size):
        if i := page_to_index(page, page_size):
            # cursor needs to be the index of the last item on the previous page
            c = create_cursor(i)
        else:
            c = ""  # first page needs to be empty string i.e. get first X items from beginning / ""
        return PageCursor(cursor=c, page_number=page, is_current=is_current)

    def get_page_cursors(self, first_page, last_page, previous_page, around_pages, current_page, page_size):
        if first_page:
            first_page = PageCursor(
                cursor="", page_number=first_page, is_current=current_page == first_page)
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
        current_page = self.get_page_number(
            current_page_start_index, page_size)
        first_page = 1
        # queryset should be the whole filtered or unfiltered set (before slice is taken)
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
        page_size = kwargs.get('pageSize', 10)
        return self.get_pages(page_size, page_info.start_cursor, page_info.end_cursor, queryset)

    def resolve_total_pages(self, info):
        page_info = self.page_info
        queryset = self.iterable
        return queryset.count()