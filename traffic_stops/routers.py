import logging

from django.conf import settings

logger = logging.getLogger(__name__)


class StateDatasetRouter(object):
    """Read/write from speciic State databases"""

    def _db_name(self, model):
        return f"traffic_stops_{model._meta.app_label}"

    def _db_name_from_label(self, app_label):
        return f"traffic_stops_{app_label}"

    def db_for_read(self, model, **hints):
        """Return state DB if model's app name is a database"""
        state_db = self._db_name(model)
        if state_db in settings.DATABASES:
            name = state_db
        else:
            name = "default"
        logger.debug(f"db_for_read({state_db}): {name}")
        return name

    def db_for_write(self, model, **hints):
        """Return state DB if model's app name is a database"""
        state_db = self._db_name(model)
        if state_db in settings.DATABASES:
            name = state_db
        else:
            name = "default"
        logger.debug(f"db_for_write({state_db}): {name}")
        return name

    def allow_migrate(self, db, app_label, model_name=None, **hints):
        # scenarios:
        #
        # default           traffic_stops_nc    False
        # default           traffic_stops_admin True
        # traffic_stops_nc  traffic_stops_admin False
        # traffic_stops_nc  traffic_stops_nc    True
        #
        state_db = self._db_name_from_label(app_label)
        app_is_state = state_db in settings.DATABASES
        if app_is_state:
            ret = db == state_db
        elif db == "default":
            ret = True
        else:
            ret = False
        logger.debug(f"allow_syncdb({db}, {app_label} {model_name}): {ret}")
        return ret
