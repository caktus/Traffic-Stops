from django.conf.urls import include, url
from nc import api, views
from rest_framework.routers import DefaultRouter

router = DefaultRouter()
router.register(r"agency", api.AgencyViewSet, basename="agency-api")


urlpatterns = [  # noqa
    url(r"^$", views.Home.as_view(), name="home"),
    url(r"^search/$", views.search, name="stops-search"),
    url(r"^agency/$", views.AgencyList.as_view(), name="agency-list"),
    url(r"^agency/(?P<pk>\d+)/$", views.AgencyDetail.as_view(), name="agency-detail"),
    url(r"^api/", include(router.urls)),
]
