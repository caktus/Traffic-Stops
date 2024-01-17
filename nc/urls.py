from django.conf.urls import include
from django.urls import path, re_path
from django.views.decorators.csrf import csrf_exempt
from rest_framework.routers import DefaultRouter

from nc import views

router = DefaultRouter()
router.register(r"agency", views.AgencyViewSet, basename="agency-api")
router.register(r"driver-stops", views.DriverStopsViewSet, basename="driver-stops-api")
router.register(r"state-facts", views.StateFactsViewSet, basename="state-facts")
router.register(r"resources", views.ResourcesViewSet, basename="resources")


urlpatterns = [  # noqa
    re_path(r"^api/", include(router.urls)),
    path("api/about/contact/", csrf_exempt(views.ContactView.as_view()), name="contact-form"),
    path(
        "api/agency/<agency_id>/stops-by-count/",
        views.AgencyTrafficStopsByCountView.as_view(),
        name="stops-by-count",
    ),
    path(
        "api/agency/<agency_id>/stop-purpose-groups/",
        views.AgencyStopPurposeGroupView.as_view(),
        name="stop-purpose-groups",
    ),
    path(
        "api/agency/<agency_id>/stops-grouped-by-purpose/",
        views.AgencyStopGroupByPurposeView.as_view(),
        name="stops-grouped-by-purpose",
    ),
    path(
        "api/agency/<agency_id>/searches-by-percentage/",
        views.AgencySearchesByPercentageView.as_view(),
        name="searches-by-percentage",
    ),
    path(
        "api/agency/<agency_id>/searches-by-count/",
        views.AgencySearchesByCountView.as_view(),
        name="searches-by-count",
    ),
    path(
        "api/agency/<int:agency_id>/contraband/",
        views.AgencyContrabandView.as_view(),
        name="contraband-percentages",
    ),
    path(
        "api/agency/<int:agency_id>/contraband-types/",
        views.AgencyContrabandTypesView.as_view(),
        name="contraband-type-percentages",
    ),
    path(
        "api/agency/<int:agency_id>/contraband-stop-purpose/",
        views.AgencyContrabandStopPurposeView.as_view(),
        name="contraband-percentages-stop-purpose-groups",
    ),
    path(
        "api/agency/<int:agency_id>/contraband-grouped-stop-purpose/",
        views.AgencyContrabandGroupedStopPurposeView.as_view(),
        name="contraband-percentages-grouped-stop-purpose",
    ),
    path(
        "api/agency/<int:agency_id>/contraband-grouped-stop-purpose/modal/",
        views.AgencyContrabandStopGroupByPurposeModalView.as_view(),
        name="contraband-percentages-grouped-stop-purpose-modal",
    ),
]
