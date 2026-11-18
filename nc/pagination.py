from collections import OrderedDict

from rest_framework.pagination import LimitOffsetPagination
from rest_framework.response import Response


class NoCountPagination(LimitOffsetPagination):
    """LimitOffsetPagination without queryset counting"""

    default_limit = 100
    max_limit = 100

    def get_count(self, queryset):
        return 0

    def paginate_queryset(self, queryset, request, view=None):
        self.count = self.get_count(queryset)
        self.limit = self.get_limit(request)
        if self.limit is None:
            return None

        self.offset = self.get_offset(request)
        self.request = request
        if self.template is not None:
            self.display_page_controls = True

        return list(queryset[self.offset : self.offset + self.limit])

    def get_paginated_response(self, data):
        return Response(
            OrderedDict(
                [
                    ("results", data),
                ]
            )
        )
