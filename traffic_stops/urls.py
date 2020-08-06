from django.conf import settings
from django.conf.urls import include, url
from django.urls import path
from django.conf.urls.static import static
from django.contrib import admin

from .views import HomeView, About, UpdateSession


admin.autodiscover()


urlpatterns = [  # noqa
    url(r'^', include(('nc.urls', 'nc'), namespace='nc'), name='home'),
    url(r'^admin/', admin.site.urls),
    url(r'^selectable/', include('selectable.urls')),
    url(r'^about$', About.as_view(), name='about'),
    url(r'^update-session/', UpdateSession.as_view(), name='update_session'),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

if settings.DEBUG:
    import debug_toolbar
    urlpatterns = [
        path('__debug__/', include(debug_toolbar.urls)),
    ] + urlpatterns
