from django.conf.urls import include, url
from nc import views
from rest_framework.routers import DefaultRouter

router = DefaultRouter()
router.register(r"agency", views.AgencyViewSet, basename="agency-api")


urlpatterns = [  # noqa
    url(r"^api/", include(router.urls)),
]
