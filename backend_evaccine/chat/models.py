import uuid
from django.db import models

class ChatSession(models.Model):
    """
    ChatSession

    Author: Du Thi Anh Tuyet
    Email: anhtuyetdu21@gmail.com

    Purpose:
        Lưu trữ thông tin phiên chat giữa người dùng và hệ thống AI.

    Business Meaning:
        Mỗi phiên chat đại diện cho một cuộc trò chuyện độc lập,
        dùng để:
            - lưu lịch sử hội thoại
            - giữ ngữ cảnh khi hỏi – đáp nhiều lần

    Notes:
        - Sử dụng UUID để tránh đoán session_id
        - Không phụ thuộc tài khoản đăng nhập
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    created_at = models.DateTimeField(auto_now_add=True)
    client_ip = models.CharField(max_length=50, blank=True, null=True)
    user_agent = models.CharField(max_length=255, blank=True, null=True)

    def __str__(self):
        return f"Session {self.id} - {self.created_at}"


class ChatMessage(models.Model):
    """
    ChatMessage

    Author: Du Thi Anh Tuyet
    Email: anhtuyetdu21@gmail.com

    Purpose:
        Lưu trữ từng tin nhắn trong một phiên chat.

    Business Meaning:
        Ghi nhận nội dung trao đổi giữa:
            - người dùng (user)
            - hệ thống AI tư vấn (bot)

    Notes:
        - Mỗi message gắn với một ChatSession
        - sender giúp phân biệt nguồn tin nhắn
    """
    SENDER_CHOICES = (
        ("user", "Người dùng"),
        ("bot", "Hệ thống"),
    )
    session = models.ForeignKey(ChatSession, on_delete=models.CASCADE, related_name="messages")
    sender = models.CharField(max_length=10, choices=SENDER_CHOICES)
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"[{self.sender}] {self.content[:30]}"
