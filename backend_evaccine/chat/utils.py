"""
SYSTEM_PROMPT

Purpose:
    Prompt hệ thống cho trợ lý y khoa EVaccine.

Business Meaning:
    Định hướng hành vi AI:
        - chỉ tư vấn tiêm chủng
        - không chẩn đoán, không kê đơn
        - trả lời thân thiện, dễ hiểu
        - đảm bảo an toàn y khoa

Notes:
    - Prompt này mang tính pháp lý & đạo đức
    - Không chỉnh sửa tuỳ tiện
"""

import logging
from django.conf import settings
from google import genai
from google.genai import types

logger = logging.getLogger(__name__)
# PROMPT HỆ THỐNG CHO TRỢ LÝ Y KHOA EVACCINE
SYSTEM_PROMPT = """
Bạn là trợ lý y khoa của hệ thống tiêm chủng điện tử EVaccine.

YÊU CẦU:
- Trả lời bằng TIẾNG VIỆT, ngắn gọn, dễ hiểu, thân thiện.
- Tập trung vào: tiêm chủng, vắc xin, lịch tiêm, chỉ định & chống chỉ định, theo dõi sau tiêm, an toàn tiêm chủng.
- Không chẩn đoán bệnh, không kê đơn, không khẳng định điều trị.
- Luôn nhắc: quyết định tiêm/chữa bệnh cần tham khảo bác sĩ hoặc cơ sở y tế.
- Nếu câu hỏi ngoài tiêm chủng/y khoa, trả lời ngắn gọn hoặc từ chối lịch sự.
- Khi trả lời, hãy trình bày rõ ràng:
  + Mở đầu 1–2 câu ngắn.
  + Các ý chính xuống dòng, dùng gạch đầu dòng (-) hoặc đánh số.
  + Giữa các nhóm ý nên có dòng trống.
- Không dùng bảng, không dùng ký hiệu markdown phức tạp.
"""


def get_client():
    """
    Khởi tạo client Gemini AI.
    Purpose:
        Tạo kết nối đến dịch vụ AI Gemini bằng API key.
    Notes:
        - Trả về None nếu thiếu API key
        - Không raise exception ra ngoài
    """
    api_key = getattr(settings, "GEMINI_API_KEY", None)
    if not api_key:
        logger.error("GEMINI_API_KEY is missing.")
        return None
    try:
        return genai.Client(api_key=api_key)
    except Exception as e:
        logger.exception("Failed to init Gemini client: %s", e)
        return None


def build_history_contents(session, user_text: str):
    """
    Build lịch sử hội thoại cho AI Gemini.
    Purpose:
        Chuyển dữ liệu chat trong database
        sang format input của Gemini API.

    Business Rule:
        - Chỉ lấy N tin nhắn gần nhất (hiện tại: 8)
        - Giữ đúng vai trò user / bot

    Notes:
        - SYSTEM_PROMPT luôn đứng đầu
        - Tin nhắn mới nhất luôn được append cuối
    """
    last_msgs = list(session.messages.order_by("-created_at")[:8])[::-1]

    contents = []
    contents.append({ "role": "user", "parts": [{"text": SYSTEM_PROMPT.strip()}],})
    for m in last_msgs:
        role = "model" if m.sender == "bot" else "user"
        contents.append({ "role": role, "parts": [{"text": m.content}], })
    contents.append({ "role": "user", "parts": [{"text": user_text}], })
    return contents


def generate_bot_reply(session, user_text: str) -> str:
    """
    Generate phản hồi AI cho một tin nhắn người dùng.

    Purpose:
        Gửi câu hỏi + lịch sử chat tới Gemini
        và nhận phản hồi từ AI.

    Business Meaning:
        Đóng vai trò "bác sĩ tư vấn ảo" cho EVaccine,
        nhưng KHÔNG thay thế tư vấn y tế thực tế.

    Error Handling:
        - Fallback khi AI không phản hồi
        - Trả thông báo thân thiện khi lỗi hệ thống

    Notes:
        - Không raise exception ra API layer
        - Luôn trả về string an toàn cho FE
    """
    client = get_client()
    if client is None:
        return (
            "Hiện hệ thống chưa cấu hình hoặc kích hoạt dịch vụ AI tư vấn tự động. "
            "Vui lòng liên hệ trực tiếp nhân viên y tế EVaccine để được hỗ trợ chi tiết nhé."
        )
    try:
        contents = build_history_contents(session, user_text)
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=contents,
            config=types.GenerateContentConfig(
                temperature=0.3,
                max_output_tokens=2048,   # hoặc 1024/1536/2048
            ),
        )
        reply = (getattr(response, "text", "") or "").strip()
        if not reply:
            candidate = (response.candidates or [None])[0]
            content = getattr(candidate, "content", None)
            parts = getattr(content, "parts", []) if content else []
            reply = "".join(
                getattr(p, "text", "")
                for p in parts
                if getattr(p, "text", "")
            ).strip()
        if not reply:
            raise ValueError("Empty reply from Gemini")
        return reply
    except Exception as e:
        logger.exception("Gemini chat error: %s", e)
        return (
            "Xin lỗi, hệ thống tư vấn tự động đang gặp sự cố kỹ thuật. "
            "Bạn vui lòng thử lại sau hoặc hỏi trực tiếp bác sĩ tại cơ sở tiêm chủng nhé."
        )
