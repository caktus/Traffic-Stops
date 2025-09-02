from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path, re_path

from .views import index

admin.autodiscover()


urlpatterns = [  # noqa
    path("", include(("nc.urls", "nc"), namespace="nc"), name="home"),
    path("admin/", admin.site.urls),
    path("ckeditor5/", include("django_ckeditor_5.urls")),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

# React SPA must come last
urlpatterns.extend(
    [
        path(r"", index, name="index"),
        re_path(r"^(?:.*)/?$", index, name="index-others"),
    ]
)


if settings.DEBUG:  # pragma: no cover
    import debug_toolbar

    urlpatterns = [
        path("__debug__/", include(debug_toolbar.urls)),
    ] + urlpatterns
