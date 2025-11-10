from rest_framework.decorators import api_view, permission_classes, authentication_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status

from .models import ChatSession, ChatMessage
from .utils import generate_bot_reply


@api_view(["POST"])
@permission_classes([AllowAny])
@authentication_classes([])  # QUAN TRỌNG: không chạy JWT / Session cho endpoint này
def start_session(request):
    session = ChatSession.objects.create(
        client_ip=request.META.get("REMOTE_ADDR"),
        user_agent=request.META.get("HTTP_USER_AGENT", "")[:255],
    )
    return Response({"session_id": str(session.id)})


@api_view(["POST"])
@permission_classes([AllowAny])
@authentication_classes([])  # tương tự
def send_message(request):
    session_id = request.data.get("session_id")
    content = (request.data.get("content") or "").strip()

    if not session_id or not content:
        return Response({"error": "Missing session_id or content"}, status=status.HTTP_400_BAD_REQUEST)

    try:
        session = ChatSession.objects.get(id=session_id)
    except ChatSession.DoesNotExist:
        return Response({"error": "Invalid session"}, status=status.HTTP_404_NOT_FOUND)

    # lưu tin nhắn user
    ChatMessage.objects.create(session=session, sender="user", content=content)

    # gọi OpenAI dựa trên session + câu hỏi mới
    reply = generate_bot_reply(session, content)

    # lưu tin nhắn bot
    ChatMessage.objects.create(session=session, sender="bot", content=reply)

    return Response({"reply": reply}, status=status.HTTP_200_OK)
