// src/services/vaccineService.js
import api from "./axios";

/** Lấy chi tiết 1 vắc xin theo slug (BE của bạn lookup_field = "slug") */
export async function getVaccineBySlug(slug) {
  const { data } = await api.get(`/vaccines/vaccines/${slug}/`); // /api/vaccines/<slug>/
  return data; // có: name, disease{name}, price, formatted_price, image, origin,...
}

/** Nếu bạn lưu ID thay vì slug */
// vaccineService.js
export async function getVaccinesByIds(ids = []) {
  const { data } = await api.get(`/vaccines/vaccines/?ids=${ids.join(",")}`);
  return data;
}
/** ⬇️ NEW: Lấy chi tiết 1 gói theo slug
 * BE đã có router "packages" với lookup theo slug → /api/packages/{slug}/
 */
export async function getPackageBySlug(slug) {
  const { data } = await api.get(`/vaccines/packages/${slug}/`);
  return data;
}