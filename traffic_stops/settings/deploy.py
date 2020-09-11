# Settings for live deployed environments: staging, production, etc
from .base import *  # noqa

# This is NOT a complete production settings file. For more, see:
# See https://docs.djangoproject.com/en/dev/howto/deployment/checklist/

#### Critical settings

SECRET_KEY = os.environ["DJANGO_SECRET_KEY"]

### Environment-specific settings

ALLOWED_HOSTS = os.getenv("ALLOWED_HOSTS", "localhost").split(":")

# Disable Django's own staticfiles handling in favour of WhiteNoise, for
# greater consistency between gunicorn and `./manage.py runserver`. See:
# http://whitenoise.evans.io/en/stable/django.html#using-whitenoise-in-development
INSTALLED_APPS.remove("django.contrib.staticfiles")
INSTALLED_APPS.extend(
    ["whitenoise.runserver_nostatic", "django.contrib.staticfiles",]
)

MIDDLEWARE.remove("django.middleware.security.SecurityMiddleware")
MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "whitenoise.middleware.WhiteNoiseMiddleware",
] + MIDDLEWARE

STATICFILES_STORAGE = "django.contrib.staticfiles.storage.ManifestStaticFilesStorage"

EMAIL_HOST = os.getenv("EMAIL_HOST", "localhost")
EMAIL_HOST_USER = os.getenv("EMAIL_HOST_USER", "")
EMAIL_HOST_PASSWORD = os.getenv("EMAIL_HOST_PASSWORD", "")
EMAIL_USE_TLS = os.getenv("EMAIL_USE_TLS", False)
EMAIL_USE_SSL = os.getenv("EMAIL_USE_SSL", False)
# use TLS or SSL, not both:
assert not (EMAIL_USE_TLS and EMAIL_USE_SSL)
if EMAIL_USE_TLS:
    default_smtp_port = 587
elif EMAIL_USE_SSL:
    default_smtp_port = 465
else:
    default_smtp_port = 25
EMAIL_PORT = os.getenv("EMAIL_PORT", default_smtp_port)
EMAIL_SUBJECT_PREFIX = "[trafficstops %s] " % ENVIRONMENT.title()
DEFAULT_FROM_EMAIL = f"noreply@{os.getenv('DOMAIN', os.environ)}"
SERVER_EMAIL = DEFAULT_FROM_EMAIL

### HTTPS

CSRF_COOKIE_SECURE = True
SESSION_COOKIE_SECURE = os.getenv("SESSION_COOKIE_SECURE", "True") == "True"

### Performance optimizations

# Use template caching on deployed servers
for backend in TEMPLATES:
    if backend["BACKEND"] == "django.template.backends.django.DjangoTemplates":
        default_loaders = ["django.template.loaders.filesystem.Loader"]
        if backend.get("APP_DIRS", False):
            default_loaders.append("django.template.loaders.app_directories.Loader")
            # Django gets annoyed if you both set APP_DIRS True and specify your own loaders
            backend["APP_DIRS"] = False
        loaders = backend["OPTIONS"].get("loaders", default_loaders)
        for loader in loaders:
            if len(loader) == 2 and loader[0] == "django.template.loaders.cached.Loader":
                # We're already caching our templates
                break
        else:
            backend["OPTIONS"]["loaders"] = [("django.template.loaders.cached.Loader", loaders)]

### ADMINS and MANAGERS
ADMINS = (("trafficstops team", "forwardjustice-team@caktusgroup.com"),)
MANAGERS = ADMINS

### 3rd-party applications

SENTRY_DSN = os.getenv("SENTRY_DSN")
if SENTRY_DSN:
    import sentry_sdk
    from sentry_sdk.integrations.django import DjangoIntegration
    from sentry_sdk.integrations.celery import CeleryIntegration
    from sentry_sdk.integrations.redis import RedisIntegration

    sentry_sdk.init(
        dsn=SENTRY_DSN,
        integrations=[DjangoIntegration(), CeleryIntegration(), RedisIntegration()],
        environment=ENVIRONMENT,
    )

DATABASE_ETL_USER = "etl"

BROKER_URL = os.getenv("BROKER_URL", "redis://redis:6379/0")

REST_FRAMEWORK = {"DEFAULT_AUTHENTICATION_CLASSES": []}

if ENVIRONMENT.upper() == "PRODUCTION":
    CELERYBEAT_SCHEDULE["automatic-nc-import"]["schedule"] = crontab(
        day_of_month="1", hour=3, minute=0
    )

    # List of email addresses that receive the report of non-compliance of
    # traffic stop reporting.
    COMPLIANCE_REPORT_LIST = ("forwardjustice-team@caktusgroup.com",)
