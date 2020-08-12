from traffic_stops.settings.dev import *   # noqa

# Override settings here

# If you use a custom domain for development, set ALLOWED_HOSTS here.
# ALLOWED_HOSTS = ('local-trafficstops', )

# ------- UNCOMMENT BELOW IF USING DOCKER SETUP ------- #

# import dj_database_url
# DATABASES['default'] = dj_database_url.config(env='DATABASE_URL')
# DATABASES['traffic_stops_nc'] = dj_database_url.config(env='DATABASE_URL_NC')
