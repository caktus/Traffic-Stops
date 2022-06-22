from django.conf.urls import include, url
from django.urls import path
from django.views.decorators.csrf import csrf_exempt
from nc import views
from rest_framework.routers import DefaultRouter

router = DefaultRouter()
router.register(r"agency", views.AgencyViewSet, basename="agency-api")
router.register(r"driver-stops", views.DriverStopsViewSet, basename="driver-stops-api")
router.register(r"state-facts", views.StateFactsViewSet, basename="state-facts")


urlpatterns = [  # noqa
    url(r"^api/", include(router.urls)),
    path("api/about/contact/", csrf_exempt(views.ContactView.as_view()), name="contact-form"),
]
