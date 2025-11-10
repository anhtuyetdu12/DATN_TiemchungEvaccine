import logging
from django.conf import settings
from google import genai
from google.genai import types

logger = logging.getLogger(__name__)

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
    Chuyển lịch sử chat trong DB sang format contents của Gemini.
    """
    last_msgs = list(session.messages.order_by("-created_at")[:8])[::-1]

    contents = []
    contents.append({
        "role": "user",
        "parts": [{"text": SYSTEM_PROMPT.strip()}],
    })

    for m in last_msgs:
        role = "model" if m.sender == "bot" else "user"
        contents.append({
            "role": role,
            "parts": [{"text": m.content}],
        })

    contents.append({
        "role": "user",
        "parts": [{"text": user_text}],
    })

    return contents

def generate_bot_reply(session, user_text: str) -> str:
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

        # Cách 1: dùng thuộc tính tiện lợi của SDK
        reply = (getattr(response, "text", "") or "").strip()

        # Nếu vì lý do gì đó response.text trống, fallback join thủ công
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
