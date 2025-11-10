from django.urls import path
from . import views

urlpatterns = [
    path("start-session/", views.start_session, name="chat_start_session"),
    path("message/", views.send_message, name="chat_send_message"),
]
