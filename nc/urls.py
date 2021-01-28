from django.conf.urls import include, url
from nc import views
from rest_framework.routers import DefaultRouter

router = DefaultRouter()
router.register(r"agency", views.AgencyViewSet, basename="agency-api")
router.register(r"driver-stops", views.DriverStopsViewSet, basename="driver-stops-api")
router.register(r"state-facts", views.StateFactsViewSet, basename="state-facts-api")


urlpatterns = [  # noqa
    url(r"^api/", include(router.urls)),
]
