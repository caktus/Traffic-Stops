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
        "api/agency/<agency_id>/stops-by-percentage/",
        views.AgencyTrafficStopsByPercentageView.as_view(),
        name="stops-by-percentage",
    ),
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
        "api/agency/<agency_id>/search-rate/",
        views.AgencySearchRateView.as_view(),
        name="search-rate",
    ),
    path(
        "api/agency/<agency_id>/contraband/",
        views.AgencyContrabandView.as_view(),
        name="contraband-percentages",
    ),
    path(
        "api/agency/<agency_id>/contraband-types/",
        views.AgencyContrabandTypesView.as_view(),
        name="contraband-type-percentages",
    ),
    path(
        "api/agency/<agency_id>/contraband-stop-purpose/",
        views.AgencyContrabandStopPurposeView.as_view(),
        name="contraband-percentages-stop-purpose-groups",
    ),
    path(
        "api/agency/<agency_id>/contraband-grouped-stop-purpose/",
        views.AgencyContrabandGroupedStopPurposeView.as_view(),
        name="contraband-percentages-grouped-stop-purpose",
    ),
    path(
        "api/agency/<agency_id>/contraband-grouped-stop-purpose/modal/",
        views.AgencyContrabandStopGroupByPurposeModalView.as_view(),
        name="contraband-percentages-grouped-stop-purpose-modal",
    ),
    path(
        "api/agency/<agency_id>/use-of-force/",
        views.AgencyUseOfForceView.as_view(),
        name="use-of-force",
    ),
    path(
        "api/agency/<agency_id>/arrests-percentage-of-stops/",
        views.AgencyArrestsPercentageOfStopsView.as_view(),
        name="arrests-percentage-of-stops",
    ),
    path(
        "api/agency/<agency_id>/arrests-percentage-of-searches/",
        views.AgencyArrestsPercentageOfSearchesView.as_view(),
        name="arrests-percentage-of-searches",
    ),
    path(
        "api/agency/<agency_id>/arrests-stops-driver-arrested/",
        views.AgencyCountOfStopsAndArrests.as_view(),
        name="arrests-stops-driver-arrested",
    ),
    path(
        "api/agency/<agency_id>/arrests-percentage-of-stops-by-purpose-group/",
        views.AgencyArrestsPercentageOfStopsByGroupPurposeView.as_view(),
        name="arrests-percentage-of-stops-by-purpose-group",
    ),
    path(
        "api/agency/<agency_id>/arrests-percentage-of-stops-per-stop-purpose/",
        views.AgencyArrestsPercentageOfStopsPerStopPurposeView.as_view(),
        name="arrests-percentage-of-stops-per-stop-purpose",
    ),
    path(
        "api/agency/<agency_id>/arrests-percentage-of-searches-by-purpose-group/",
        views.AgencyArrestsPercentageOfSearchesByGroupPurposeView.as_view(),
        name="arrests-percentage-of-searches-by-purpose-group",
    ),
    path(
        "api/agency/<agency_id>/arrests-percentage-of-searches-per-stop-purpose/",
        views.AgencyArrestsPercentageOfSearchesPerStopPurposeView.as_view(),
        name="arrests-percentage-of-searches-per-stop-purpose",
    ),
    path(
        "api/agency/<agency_id>/arrests-percentage-of-stops-per-contraband-type/",
        views.AgencyArrestsPercentageOfStopsPerContrabandTypeView.as_view(),
        name="arrests-percentage-of-stops-per-contraband-type",
    ),
]
