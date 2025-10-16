// src/utils/selectedVaccines.js (tạm thời – proxy)
import { readBooking, writeBooking, addToBooking, removeFromBooking } from "./bookingStorage";

export function getSelected() {
  return readBooking().map(i => i.slug);
}
export function setSelected(slugs) {
  writeBooking((slugs || []).map(slug => ({ slug, qty: 1 })));
}
export function addSelected(slug) { addToBooking(slug, 1); }
export function removeSelected(slug) { removeFromBooking(slug); }

export const SELECTED_EVENT = "vaccines:selected:changed"; // giữ event cũ nếu bạn đã lắng nghe
export const SELECTED_KEY = "selectedVaccineSlugs";        // không còn dùng, nhưng giữ nếu code cũ tham chiếu
