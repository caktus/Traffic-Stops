import logging

from django.http import HttpRequest

logger = logging.getLogger(__name__)


class RequestLoggingMiddleware:
    """Log request and response headers"""

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request: HttpRequest):
        headers = {"_type": "request", "_path": request.get_full_path()}
        headers.update(request.headers)
        logger.info(headers)
        response = self.get_response(request)
        headers = {"_type": "response", "_path": request.get_full_path()}
        headers.update(response.headers)
        logger.info(headers)
        return response
