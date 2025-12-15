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

//hoàn thành 1 số mũi trong booking
export async function completeBookingItems(bookingId, { itemIds, reactionNote }) {
  const { data } = await api.post(`/records/bookings/${bookingId}/complete/`, {
    item_ids: itemIds,
    reaction_note: reactionNote || "",
  });
  return data;
}