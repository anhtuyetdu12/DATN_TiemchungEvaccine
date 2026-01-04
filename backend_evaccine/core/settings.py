
import os
from pathlib import Path
from datetime import timedelta
import uuid
from dotenv import load_dotenv
load_dotenv()

SERVER_INSTANCE_ID = str(uuid.uuid4())

BASE_DIR = Path(__file__).resolve().parent.parent

SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(minutes=20),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=30),
    "ROTATE_REFRESH_TOKENS": False, 
    "BLACKLIST_AFTER_ROTATION": False,  
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

SECRET_KEY = 'django-insecure-)ln9p$7$so&d+j2)li3ejb_6anrvo-e#n-9v#&uosyja@qy-f+'

DEBUG = True

ALLOWED_HOSTS = []

LANGUAGE_CODE = "vi"
TIME_ZONE = "Asia/Ho_Chi_Minh"
USE_I18N = True
USE_TZ = True


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
    "records.apps.RecordsConfig",
    "users.apps.UsersConfig",
    "vaccines.apps.VaccinesConfig",
    "inventory.apps.InventoryConfig",
    "knowledges.apps.KnowledgesConfig",
    "chat.apps.ChatConfig",  
    
  
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',  
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.locale.LocaleMiddleware', 
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
    'records.middleware.auto_run_rules.auto_run_daily_rules', 
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



DATABASES = {
    'default': {
        'ENGINE': 'mssql',
        'NAME': 'dtbtiemchung',       
        'USER': '',          
        'PASSWORD': '',      
        'HOST': r'DESKTOP-FOORN5L\SQLEXPRESS', 
        'PORT': '',                         
        'OPTIONS': {
            'driver': 'ODBC Driver 17 for SQL Server',  
            'trusted_connection': 'yes',                
        },
    }
}



AUTH_PASSWORD_VALIDATORS = [
   
]


STATIC_URL = '/static/'
STATICFILES_DIRS = [BASE_DIR / 'static']

MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'


FRONTEND_URL = "http://localhost:3000" 
ROOT_URLCONF = 'core.urls'

ENV = os.getenv("ENV", "dev")  

if ENV == "dev":
    CORS_ALLOW_ALL_ORIGINS = True
else:
    CORS_ALLOW_ALL_ORIGINS = False
    CORS_ALLOWED_ORIGINS = [
        "http://localhost:3000",       
   
    ]

    
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'
AUTH_USER_MODEL = 'users.CustomUser'

EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST = 'smtp.gmail.com'
EMAIL_PORT = 587
EMAIL_USE_TLS = True
EMAIL_HOST_USER = 'tiemchung.evaccine@gmail.com'     
EMAIL_HOST_PASSWORD = 'ysvy tont sltm hjre' 


APPT_REMINDER_DAYS_BEFORE = [3, 1]    
APPT_REMINDER_DAY_OF = True    


GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")