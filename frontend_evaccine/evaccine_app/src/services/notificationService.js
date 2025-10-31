// src/services/notificationService.js
import api from "./axios";
import qs from "qs";

export async function sendCustomerNotification(payload) {
  const { data } = await api.post("/records/staff/customers/notifications/send", payload);
  return data;
}

export async function previewAudience(params) {
  const query = qs.stringify(params, { arrayFormat: "repeat" });
  const { data } = await api.get(`/records/staff/customers/notifications/preview?${query}`);
  return data;
}
