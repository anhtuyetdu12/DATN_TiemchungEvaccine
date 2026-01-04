// src/services/notificationService.js
import api from "./axios";
import qs from "qs";

export async function previewAudience(params) {
  const query = qs.stringify(params, { arrayFormat: "repeat" });
  const { data } = await api.get(`/records/staff/customers/notifications/preview?${query}`);
  return data;
}

export async function getMyNotifications() {
  const { data } = await api.get("/records/me/notifications/");
  return data;
}

export async function markMyNotificationRead(id) {
  const { data } = await api.post(`/records/me/notifications/${id}/read`);
  return data;
}