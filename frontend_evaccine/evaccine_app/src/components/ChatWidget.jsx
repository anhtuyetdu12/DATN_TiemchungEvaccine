// src/components/ChatWidget.jsx
import { useEffect, useState, useRef } from "react";
import { startChatSession, sendChatMessage } from "../services/chatService";

const getSessionKey = (user) =>
  user?.id ? `evaccine_chat_session_id_${user.id}` : "evaccine_chat_session_id_guest";

const getMessagesKey = (user) =>
  user?.id ? `evaccine_chat_messages_${user.id}` : "evaccine_chat_messages_guest";

const WELCOME_MESSAGE = {
  sender: "bot",
  text: "Xin chào 👋, tôi là trợ lý tiêm chủng EVaccine. Bạn cần tư vấn về lịch tiêm, vắc xin hay đặt hẹn?",
  timestamp: new Date().toISOString(),
};

export default function ChatWidget({ user }) {
  const [isOpen, setIsOpen] = useState(false);

  const [sessionId, setSessionId] = useState(() => {
    if (typeof window === "undefined") return null;
    const key = getSessionKey(user);
    return localStorage.getItem(key) || null;
  });

  const [messages, setMessages] = useState(() => {
    if (typeof window === "undefined") return [WELCOME_MESSAGE];
    const key = getMessagesKey(user);
    const saved = localStorage.getItem(key);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      } catch (e) {
        console.error("Cannot parse saved chat messages", e);
      }
    }
    return [WELCOME_MESSAGE];
  });

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const sessionKey = getSessionKey(user);
    const messagesKey = getMessagesKey(user);

    const storedSession = localStorage.getItem(sessionKey);
    const storedMessages = localStorage.getItem(messagesKey);

    setSessionId(storedSession || null);

    if (storedMessages) {
      try {
        const parsed = JSON.parse(storedMessages);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setMessages(parsed);
        } else {
          setMessages([WELCOME_MESSAGE]);
        }
      } catch (e) {
        console.error("Cannot parse saved chat messages", e);
        setMessages([WELCOME_MESSAGE]);
      }
    } else {
      setMessages([WELCOME_MESSAGE]);
    }

    if (!user) {
      setIsOpen(false);
    }
  }, [user]); 

  const createSession = async () => {
    try {
      const data = await startChatSession();
      if (data?.session_id) {
        setSessionId(data.session_id);
        if (typeof window !== "undefined") {
          localStorage.setItem(getSessionKey(user), data.session_id);
        }
        return data.session_id;
      }
      console.error("No session_id returned from API");
      return null;
    } catch (err) {
      console.error("Cannot start chat session", err);
      return null;
    }
  };

  useEffect(() => {
    if (!sessionId) {
      createSession();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "smooth", block: "end" });
    }
  }, [messages, loading]);

    // Lưu history chat theo user / guest
  useEffect(() => {
    try {
      if (typeof window !== "undefined") {
        localStorage.setItem(getMessagesKey(user), JSON.stringify(messages));
      }
    } catch (e) {
      console.error("Cannot save chat messages", e);
    }
  }, [messages, user]);

  const sendMessageWithText = async (rawText) => {
    const text = (rawText || "").trim();
    if (!text || loading) return;

    setLoading(true);
    let currentSessionId = sessionId;
    if (!currentSessionId) {
      currentSessionId = await createSession();
      if (!currentSessionId) {
        setMessages((prev) => [
          ...prev,
          {
            sender: "bot",
            text: "🛠 Xin lỗi, hệ thống chưa khởi tạo được phiên tư vấn. Vui lòng thử lại sau hoặc liên hệ trực tiếp cơ sở tiêm chủng.",
            timestamp: new Date().toISOString(),
          },
        ]);
        setLoading(false);
        return;
      }
    }

    setMessages((prev) => [
      ...prev,
      { sender: "user", text, timestamp: new Date().toISOString() },
    ]);
    setInput("");

    try {
      const data = await sendChatMessage(currentSessionId, text);

      if (data?.reply) {
        setMessages((prev) => [
          ...prev,
          {
            sender: "bot",
            text: data.reply,
            timestamp: new Date().toISOString(),
          },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            sender: "bot",
            text: "Xin lỗi, hiện tôi chưa xử lý được câu hỏi này. Bạn có thể hỏi lại theo cách khác hoặc liên hệ bác sĩ tại EVaccine nhé.",
            timestamp: new Date().toISOString(),
          },
        ]);
      }
    } catch (err) {
      console.error("Send message error:", err);
      setMessages((prev) => [
        ...prev,
        {
          sender: "bot",
          text: "⚠️ Đang có lỗi kết nối đến hệ thống tư vấn. Bạn vui lòng thử lại sau.",
          timestamp: new Date().toISOString(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessageWithText(input);
    }
  };

  const quickQuestions = [
    "Tra cứu lịch tiêm phù hợp cho bé 2 tuổi",
    "Vắc xin cúm người lớn nên tiêm khi nào?",
    "Tư vấn tiêm HPV cho nữ 24 tuổi",
    "Sau tiêm bị sốt nhẹ có sao không?",
  ];

  return (
    <>
      {!isOpen && (
        <div className="tw-fixed tw-bottom-6 tw-right-6 tw-z-[9999] tw-flex tw-flex-col tw-items-end tw-gap-2">
          <div className="tw-bg-white tw-text-[#2563eb] tw-text-[11px] tw-px-3 tw-py-1.5 tw-rounded-full tw-shadow-lg tw-border tw-border-blue-100 tw-flex tw-items-center tw-gap-1">
            <span className="tw-w-2 tw-h-2 tw-bg-green-400 tw-rounded-full" />
            Trợ lý EVaccine đang sẵn sàng hỗ trợ
          </div>
          <button  onClick={() => setIsOpen(true)}
            className="tw-w-16 tw-h-16 tw-rounded-full tw-bg-gradient-to-br tw-from-[#38bdf8] tw-to-[#2563eb]
                       tw-flex tw-items-center tw-justify-center tw-shadow-2xl tw-border-[3px] tw-border-white
                       tw-transition-all tw-duration-300 hover:-tw-translate-y-1 hover:tw-scale-105" >
            <i className="fa-solid fa-headset tw-text-3xl tw-text-white"></i>
          </button>
        </div>
      )}

      {/* Cửa sổ chat */}
      {isOpen && (
        <div className="tw-fixed tw-bottom-6 tw-right-6 tw-w-[340px] tw-h-[490px] tw-z-[10000] tw-flex tw-flex-col">
          <div className="tw-w-full tw-h-full tw-backdrop-blur-2xl tw-bg-white/90 tw-rounded-3xl tw-shadow-[0_18px_60px_rgba(15,23,42,0.25)]
                          tw-border tw-border-sky-100 tw-flex tw-flex-col tw-overflow-hidden tw-relative">
            {/* Header */}
            <div className="tw-px-4 tw-pt-3 tw-pb-2 tw-flex tw-items-center tw-justify-between tw-bg-gradient-to-r tw-from-[#38bdf8] tw-to-[#2563eb]">
              <div className="tw-flex tw-items-center tw-gap-2">
                <div className="tw-relative">
                  <img  src="/images/sy1.jpg"  alt="EVaccine Assistant"
                    className="tw-w-12 tw-h-12 tw-rounded-full tw-object-cover tw-border tw-border-white"/>
                  <span className="tw-absolute tw-bottom-0 tw-right-0 tw-w-2.5 tw-h-2.5 tw-bg-green-400 tw-rounded-full tw-border tw-border-white" />
                </div>
                <div>
                  <div className="tw-text-lg tw-font-semibold tw-text-white">
                    Trợ lý EVaccine
                  </div>
                  <div className="tw-text-[10px] tw-text-blue-100">
                    Bác sĩ ảo tư vấn tiêm chủng • 24/7
                  </div>
                </div>
              </div>
              <div className="tw-flex tw-items-center tw-gap-2">
                <button onClick={() => setIsOpen(false)}
                  className="tw-w-10 tw-h-10 tw-flex tw-items-center tw-justify-center tw-rounded-full tw-bg-white/15 hover:tw-bg-white/30 tw-text-white tw-text-sm tw-font-bold" >
                  <i className="fa-solid fa-xmark tw-text-xl tw-text-white"></i>
                </button>
              </div>
            </div>

            {/* Thanh info nhỏ */}
            <div className="tw-px-4 tw-py-2 tw-bg-gradient-to-r tw-from-sky-50 tw-to-sky-100 tw-flex tw-items-center tw-gap-2 tw-text-[11px] tw-text-slate-600">
              <i className="fa fa-shield-heart tw-text-sky-500 tw-text-3xl" />
              <span>
                Thông tin chỉ mang tính chất tham khảo. Quyết định tiêm chủng cần
                theo tư vấn của bác sĩ.
              </span>
            </div>

            {/* Danh sách messages */}
            <div className="tw-flex-1 tw-px-3 tw-py-2 tw-space-y-1.5 tw-overflow-y-auto tw-bg-slate-50/60">
              {messages.map((m, i) => {
                const isUser = m.sender === "user";
                return (
                  <div key={i} className={`tw-flex tw-w-full tw-mt-1 ${ isUser ? "tw-justify-end" : "tw-justify-start" }`} >
                    {!isUser && (
                      <div className="tw-w-9 tw-mr-3 tw-flex tw-items-start tw-justify-center tw-mt-1">
                        <img src="/images/sy1.jpg" alt="bot"  className="tw-w-9 tw-h-9 tw-rounded-full tw-object-cover tw-border tw-border-sky-100" />
                      </div>
                    )}

                    {/* Bubble */}
                    <div  className={ "tw-max-w-[78%] tw-px-3 tw-py-2 tw-rounded-2xl tw-text-[12px] tw-shadow-sm " +
                        (isUser
                          ? "tw-bg-gradient-to-br tw-from-[#38bdf8] tw-to-[#2563eb] tw-text-white tw-rounded-br-none tw-leading-snug"
                          : "tw-bg-white tw-text-slate-800 tw-border tw-border-slate-100 tw-rounded-bl-none " +
                            "tw-whitespace-pre-wrap tw-text-justify tw-leading-relaxed")
                      }>
                      {m.text}
                    </div>
                  </div>
                );
              })}

              {loading && (
                <div className="tw-flex tw-items-center tw-gap-2 tw-ml-7 tw-mt-1 tw-text-[10px] tw-text-slate-500">
                  <span className="tw-w-2 tw-h-2 tw-rounded-full tw-bg-sky-400 tw-animate-bounce" />
                  <span className="tw-w-2 tw-h-2 tw-rounded-full tw-bg-sky-300 tw-animate-bounce tw-[animation-delay:0.1s]" />
                  <span className="tw-w-2 tw-h-2 tw-rounded-full tw-bg-sky-200 tw-animate-bounce tw-[animation-delay:0.2s]" />
                  <span>Trợ lý EVaccine đang soạn câu trả lời...</span>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            {/* Quick suggestions */}
            <div className="tw-px-3 tw-pt-2 tw-pb-2 tw-bg-white/90 tw-border-t tw-border-slate-100">
              <div className="tw-flex tw-items-center tw-justify-between tw-mb-1">
                <span className="tw-text-[8px] tw-font-semibold tw-text-slate-500 tw-uppercase tw-tracking-wide">
                  Gợi ý nhanh
                </span>
                <span className="tw-text-[9px] tw-text-sky-500"> Chạm để gửi  </span>
              </div>

              {/* 2 nút trên 1 dòng – tối đa 2 hàng, có thể cuộn (ẩn scrollbar) */}
              <div  className="tw-grid tw-grid-cols-2 tw-gap-1.5 tw-max-h-[52px] tw-overflow-y-auto tw-scroll-smooth tw-scrollbar-hide">
                {quickQuestions.map((q) => (
                  <button key={q} onClick={() => sendMessageWithText(q)}  disabled={loading}
                    className="tw-w-full tw-text-[9px] tw-px-2 tw-py-1.5 tw-rounded-2xl tw-bg-sky-50 tw-text-sky-700 tw-border tw-border-sky-100
                               hover:tw-bg-sky-100 hover:tw-border-sky-200 tw-shadow-sm tw-text-left tw-transition disabled:tw-opacity-60 disabled:tw-cursor-not-allowed" >
                    {q}
                  </button>
                ))}
              </div>
            </div>

            {/* Input */}
            <div className="tw-px-3 tw-py-2 tw-bg-white tw-border-t tw-border-slate-100 tw-flex tw-items-end tw-gap-2">
              <textarea value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={handleKeyDown}  disabled={loading} rows={1}
                className="tw-flex-1 tw-max-h-20 tw-resize-none tw-text-[12px] tw-border tw-border-slate-200 tw-rounded-2xl tw-px-3 tw-py-2
                           focus:tw-outline-none focus:tw-border-sky-400 focus:tw-shadow-[0_0_0_1px_rgba(56,189,248,0.35)]
                           disabled:tw-bg-slate-100 disabled:tw-cursor-not-allowed"
                placeholder="Nhập câu hỏi về vắc xin, lịch tiêm, theo dõi sau tiêm..." />
              <button  onClick={() => sendMessageWithText(input)} disabled={loading || !input.trim()}
                className={`tw-w-10 tw-h-10 tw-rounded-full tw-flex tw-items-center tw-justify-center tw-transition-all
                  ${  loading || !input.trim()
                      ? "tw-bg-slate-200 tw-text-slate-400 tw-cursor-not-allowed"
                      : "tw-bg-gradient-to-br tw-from-[#38bdf8] tw-to-[#2563eb] tw-text-white tw-shadow-md hover:tw-scale-105"
                  }`} >
                <i  className={`fa fa-paper-plane tw-text-lg ${ loading || !input.trim() ? "tw-text-blue-500" : "tw-text-white" }`}/>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
