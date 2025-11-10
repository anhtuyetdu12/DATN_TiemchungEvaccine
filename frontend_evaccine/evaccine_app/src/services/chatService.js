// src/services/chatService.js
import axios from "axios";

const CHAT_BASE = "http://localhost:8000/api/chat";

export async function startChatSession() {
  const res = await axios.post(`${CHAT_BASE}/start-session/`, {});
  return res.data;
}

export async function sendChatMessage(sessionId, content) {
  const res = await axios.post(`${CHAT_BASE}/message/`, {
    session_id: sessionId,
    content,
  });
  return res.data;
}
