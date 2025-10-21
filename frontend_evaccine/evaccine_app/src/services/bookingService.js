// src/services/bookingService.js
import api from "./axios";

export async function createBooking(payload) {
  // payload: { member_id, appointment_date, appointment_time, location, notes, items: [{ vaccine_id, quantity }] }
  const { data } = await api.post("/records/bookings/", payload);
  return data;
}

export async function getRemainingDoses(memberId, vaccineId) {
  const { data } = await api.get(`/records/remaining-doses/`, {
    params: { member_id: memberId, vaccine_id: vaccineId },
  });
  return data; // { remaining, total, used }
}
