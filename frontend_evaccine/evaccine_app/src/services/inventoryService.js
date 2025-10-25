// src/services/inventoryService.js
import api from "./axios";

/** Tổng hợp tồn kho theo vaccine (gợi ý dùng) */
export async function getStockSummary() {
  const { data } = await api.get("/inventory/stock/stock-summary/");
  return Array.isArray(data) ? data : [];
}

/** Cảnh báo sắp hết hạn */
export async function getExpiringSoon(days = 30) {
  const { data } = await api.get("/inventory/stock/expiring-soon/", { params: { days } });
  return Array.isArray(data) ? data : [];
}

/** Cảnh báo tồn thấp */
export async function getLowStock(threshold) {
  const { data } = await api.get("/inventory/stock/low-stock/", { params: { threshold } });
  return Array.isArray(data) ? data : [];
}

/** Gửi thông báo cho admin */
export async function notifyAdmin(payload) {
  const { data } = await api.post("/inventory/stock/notify-admin/", payload);
  return data;
}
