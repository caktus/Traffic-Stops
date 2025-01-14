import json
import logging

from django.http import HttpRequest, HttpResponse
from django.utils.timezone import now

logger = logging.getLogger(__name__)


class RequestLoggingMiddleware:
    """Log request and response headers"""

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request: HttpRequest):
        headers = {"_type": "request", "_path": request.get_full_path(), "_now": now().isoformat()}
        headers.update(request.headers)
        for header in ("wsgi.input", "wsgi.errors", "wsgi.file_wrapper"):
            headers.pop(header, None)
        print(json.dumps(headers))
        return self.get_response(request)


class ResponseLoggingMiddleware:
    """Log response headers"""

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request: HttpRequest):
        response: HttpResponse = self.get_response(request)
        headers = {"_type": "response", "_path": request.get_full_path(), "_now": now().isoformat()}
        headers.update(response.headers)
        print(json.dumps(headers))
        return response
