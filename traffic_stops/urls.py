from django.conf import settings
from django.conf.urls import include
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import path, re_path

from .views import index

admin.autodiscover()


urlpatterns = [  # noqa
    re_path(r"^", include(("nc.urls", "nc"), namespace="nc"), name="home"),
    re_path(r"^admin/", admin.site.urls),
    # React SPA:
    path(r"", index, name="index"),
    re_path(r"^(?:.*)/?$", index, name="index-others"),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

if settings.DEBUG:  # pragma: no cover
    import debug_toolbar

    urlpatterns = [path("__debug__/", include(debug_toolbar.urls)),] + urlpatterns
