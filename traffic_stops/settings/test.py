from traffic_stops.settings.base import *  # noqa

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = "m-u!e0jum^(+nt1+6@31+jl_zwc6yltugtv7%!2k(6l!c@=0n@"
INTERNAL_IPS = ("127.0.0.1",)

EMAIL_BACKEND = "django.core.mail.backends.console.EmailBackend"

CACHES = {
    "default": {"BACKEND": "django.core.cache.backends.locmem.LocMemCache",},
}

NC_AUTO_IMPORT_MONITORS = ("nc-monitor@example.com",)


PASSWORD_HASHERS = (
    "django.contrib.auth.hashers.SHA1PasswordHasher",
    "django.contrib.auth.hashers.MD5PasswordHasher",
)
CACHES["default"] = {
    "BACKEND": "django.core.cache.backends.dummy.DummyCache",
}
EMAIL_BACKEND = "django.core.mail.backends.locmem.EmailBackend"
