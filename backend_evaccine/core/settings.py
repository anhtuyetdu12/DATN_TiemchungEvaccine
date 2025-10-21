
import os
from pathlib import Path
from datetime import timedelta
import uuid

# Sinh mã định danh duy nhất mỗi khi server khởi động
SERVER_INSTANCE_ID = str(uuid.uuid4())

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent

SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(minutes=20),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=30),
    "ROTATE_REFRESH_TOKENS": False,  # không luân phiên refresh
    "BLACKLIST_AFTER_ROTATION": False,  # không cần blacklist khi không rotate
     "AUTH_HEADER_TYPES": ("Bearer",),
}

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ),
    "DEFAULT_FILTER_BACKENDS": ["django_filters.rest_framework.DjangoFilterBackend"],
    'DEFAULT_RENDERER_CLASSES': (
        'rest_framework.renderers.JSONRenderer',
    ),
    "DEFAULT_PAGINATION_CLASS": "rest_framework.pagination.PageNumberPagination",
    "PAGE_SIZE": 10,
}

DEFAULT_CHARSET = 'utf-8'

# Quick-start development settings - unsuitable for production
# See https://docs.djangoproject.com/en/5.2/howto/deployment/checklist/

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = 'django-insecure-)ln9p$7$so&d+j2)li3ejb_6anrvo-e#n-9v#&uosyja@qy-f+'

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = True

ALLOWED_HOSTS = []

LANGUAGE_CODE = "vi"
TIME_ZONE = "Asia/Ho_Chi_Minh"
USE_I18N = True
USE_TZ = True

# Application definition

INSTALLED_APPS = [
    'corsheaders',
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'rest_framework',
    'rest_framework_simplejwt.token_blacklist',
    "django_filters", 
    "nested_admin",
    # 'patients',
    "records.apps.RecordsConfig",
    "users.apps.UsersConfig",
    "vaccines.apps.VaccinesConfig",
    "inventory.apps.InventoryConfig",
    
  
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',  
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'core.wsgi.application'


# Database
# https://docs.djangoproject.com/en/5.2/ref/settings/#databases

DATABASES = {
    'default': {
        'ENGINE': 'mssql',
        'NAME': 'dtbtiemchung',       # Tên database trên SQL Server  EvaccineDB   dtbvaccine
        'USER': '',           # Nếu dùng SQL Auth
        'PASSWORD': '',       # Nếu dùng SQL Auth
        'HOST': r'DESKTOP-FOORN5L\SQLEXPRESS', # Server name
        'PORT': '',                             # SQL Server thường dùng port mặc định 1433
        'OPTIONS': {
            'driver': 'ODBC Driver 17 for SQL Server',  # Hoặc version driver bạn cài
            'trusted_connection': 'yes',                 # Dùng Windows Authentication
        },
    }
}


# Password validation
# https://docs.djangoproject.com/en/5.2/ref/settings/#auth-password-validators

AUTH_PASSWORD_VALIDATORS = [
   
]


# Internationalization
# https://docs.djangoproject.com/en/5.2/topics/i18n/

LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True


# Static files (CSS, JavaScript, Images)
STATIC_URL = 'static/'
STATICFILES_DIRS = [BASE_DIR / 'static']

MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'


FRONTEND_URL = "http://localhost:3000" 
ROOT_URLCONF = 'core.urls'

# ===== CORS theo môi trường =====
ENV = os.getenv("ENV", "dev")  # dev | staging | prod

if ENV == "dev":
    CORS_ALLOW_ALL_ORIGINS = True
else:
    CORS_ALLOW_ALL_ORIGINS = False
    CORS_ALLOWED_ORIGINS = [
        "http://localhost:3000",        # nếu vẫn cần truy cập từ máy dev
        "https://app.evaccine.vn",      # domain production (ví dụ)
        "https://staging.evaccine.vn",  # domain staging (ví dụ)
    ]
    # Nếu bạn dùng cookie/CSRF thì bật thêm:
    # CORS_ALLOW_CREDENTIALS = True
    # CSRF_TRUSTED_ORIGINS = [
    #     "https://app.evaccine.vn",
    #     "https://staging.evaccine.vn",
    # ]
    
# Default primary key field type
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'
AUTH_USER_MODEL = 'users.CustomUser'

# Email config
EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST = 'smtp.gmail.com'
EMAIL_PORT = 587
EMAIL_USE_TLS = True
EMAIL_HOST_USER = 'tiemchung.evaccine@gmail.com'      # email gửi
EMAIL_HOST_PASSWORD = 'ysvy tont sltm hjre'  # app password

