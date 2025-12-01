import api from "./axios";

// services/customerService.js

// Tạo khách hàng bởi staff
export const createCustomerByStaff = async (payload) => {
  // payload: { full_name, email?, phone?, set_password?, send_email? }
  const { data } = await api.post("users/staff/create-customer/", payload);
  return data;
};

// (đã có) lấy danh sách khách hàng (staff)
export const fetchCustomers = async () => {
  const { data } = await api.get("records/staff/customers/?include=members");
  return data;
};

// (đã có) lấy members của 1 khách hàng
export const fetchCustomerMembers = async (userId) => {
  const { data } = await api.get(`records/staff/customers/${userId}/members/`);
  return data;
};

// Lấy danh sách lịch hẹn của 1 khách hàng
export async function fetchCustomerAppointments(customerId, params = {}) {
  const res = await api.get(`/records/staff/customers/${customerId}/appointments/list`, { params });
  return res.data || [];
}


export async function createAppointment(customerId, payload) {
  // payload giống customer: { member_id, appointment_date, items, location?, notes? }
  const { data } = await api.post(`/records/staff/customers/${customerId}/appointments`, payload);
  return data;
}

export async function setAppointmentStatus(customerId, apptId, status) {
  const ALLOWED = ["pending","confirmed","cancelled","completed"];
  if (!ALLOWED.includes(status)) throw new Error("Trạng thái không hợp lệ");
  const res = await api.patch(`/records/staff/customers/${customerId}/appointments/${apptId}`, { status });
  return res.data;
}

export async function addHistory(customerId, payload) {
  const res = await api.post(`/records/staff/customers/${customerId}/history`, payload);
  return res.data;
}

// ----------cập nhật hồ sơ cá nhân (STAFF)-------------
export async function staffUpdateCustomerProfile(userId, payload) {
  const { data } = await api.patch(`/records/staff/customers/${userId}/profile`, payload);
  return data;
}

// -----------thêm /sửa/xoá thành viên cho KH (STAFF)-----------
export async function staffCreateMember(userId, payload) {
  const { data } = await api.post(`/records/staff/customers/${userId}/members`, payload);
  return data;
}
export async function staffUpdateMember(userId, memberId, payload) {
  const { data } = await api.patch(`/records/staff/customers/${userId}/members/${memberId}`, payload);
  return data;
}
export async function staffDeleteMember(userId, memberId) {
  await api.delete(`/records/staff/customers/${userId}/members/${memberId}`);
  return true;
}

