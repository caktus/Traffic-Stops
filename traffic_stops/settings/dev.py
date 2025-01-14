import sys

from traffic_stops.settings.base import *  # noqa

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = True

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = "m-u!e0jum^(+nt1+6@31+jl_zwc6yltugtv7%!2k(6l!c@=0n@"

INSTALLED_APPS += [
    "django_extensions",
]

if os.getenv("DEBUG_TOOLBAR", "True") == "True":
    INSTALLED_APPS += [
        "debug_toolbar",
    ]
    MIDDLEWARE += ["debug_toolbar.middleware.DebugToolbarMiddleware"]

INTERNAL_IPS = ("127.0.0.1",)

EMAIL_BACKEND = "django.core.mail.backends.console.EmailBackend"

CELERY_ALWAYS_EAGER = os.getenv("CELERY_ALWAYS_EAGER", "True") == "True"
CELERY_EAGER_PROPAGATES_EXCEPTIONS = True

NC_AUTO_IMPORT_MONITORS = ("nc-monitor@example.com",)

ALLOWED_HOSTS = os.getenv("ALLOWED_HOSTS", "")
ALLOWED_HOSTS = ALLOWED_HOSTS.split(",") if ALLOWED_HOSTS else ["*"]

# Special test settings
if "test" in sys.argv:
    PASSWORD_HASHERS = (
        "django.contrib.auth.hashers.SHA1PasswordHasher",
        "django.contrib.auth.hashers.MD5PasswordHasher",
    )
    CACHES["cache_machine"] = {
        "BACKEND": "django.core.cache.backends.dummy.DummyCache",
    }
    EMAIL_BACKEND = "django.core.mail.backends.locmem.EmailBackend"
