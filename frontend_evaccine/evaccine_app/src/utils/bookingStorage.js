// src/utils/bookingStorage.js
import { loadAuth } from "./authStorage";
import { SELECTED_EVENT } from "./selectedVaccines";

const keyFor = (userId) =>
  userId ? `booking_items_${userId}` : "booking_items_guest";

export const readBooking = () => {
  const { user } = loadAuth();
  const key = keyFor(user?.id);
  try {
    const arr = JSON.parse(localStorage.getItem(key) || "[]");
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
};

export const writeBooking = (items) => {
  const { user } = loadAuth();
  const key = keyFor(user?.id);
  const normalized = (items || [])
    .filter((it) => it?.slug && it?.qty > 0)
    .map((it) => ({ slug: String(it.slug), qty: Number(it.qty) || 1 }));

  const map = new Map();
  for (const it of normalized) {
    map.set(it.slug, (map.get(it.slug) || 0) + it.qty);
  }
  const unique = [...map.entries()].map(([slug, qty]) => ({ slug, qty }));

  localStorage.setItem(key, JSON.stringify(unique));
  window.dispatchEvent(new Event(SELECTED_EVENT));
};

export const addToBooking = (slug, qty = 1) => {
  const items = readBooking();
  const idx = items.findIndex((i) => i.slug === slug);
  if (idx >= 0) items[idx].qty += qty;
  else items.push({ slug, qty });
  writeBooking(items);
};

export const setBookingItemQty = (slug, qty) => {
  const items = readBooking();
  const idx = items.findIndex((i) => i.slug === slug);
  if (idx >= 0) {
    items[idx].qty = Math.max(1, Number(qty) || 1);
    writeBooking(items);
  }
};

export const removeFromBooking = (slug) => {
  writeBooking(readBooking().filter((i) => i.slug !== slug));
};

export const clearBooking = () => {
  writeBooking([]);
};

export const getBookingSlugs = () => readBooking().map((i) => i.slug);

export const migrateLegacyBooking = () => {
  const { user } = loadAuth();
  if (!user?.id) return;
  const legacyKey = "selectedVaccineSlugs";
  const legacy = localStorage.getItem(legacyKey);
  if (legacy) {
    try {
      const slugs = JSON.parse(legacy) || [];
      const newItems = (Array.isArray(slugs) ? slugs : [])
        .filter(Boolean)
        .map((slug) => ({ slug, qty: 1 }));
      writeBooking(newItems);
      localStorage.removeItem(legacyKey);
    } catch {}
  }
};
