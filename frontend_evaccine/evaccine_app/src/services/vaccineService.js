// src/services/vaccineService.js
import api from "./axios";

/** Lấy chi tiết 1 vắc xin theo slug (BE của bạn lookup_field = "slug") */
export async function getVaccineBySlug(slug) {
  const { data } = await api.get(`/vaccines/vaccines/${slug}/`); // /api/vaccines/<slug>/
  return data; // có: name, disease{name}, price, formatted_price, image, origin,...
}


export async function getVaccinesByIds(ids = []) {
  const { data } = await api.get(`/vaccines/vaccines/by-ids/?ids=${ids.join(",")}`);
  return data;
}
/**  Lấy chi tiết 1 gói theo slug
 * BE đã có router "packages" với lookup theo slug → /api/packages/{slug}/
 */
export async function getPackageBySlug(slug) {
  const { data } = await api.get(`/vaccines/packages/${slug}/`);
  return data;
}

/** LẤY TOÀN BỘ VACCINE: tự động chạy qua tất cả các trang (DRF) */
export async function getAllVaccines(params = {}) {
  let url = "/vaccines/vaccines/";
  let firstCall = true;
  const all = [];

  while (url) {
    const { data } = await api.get(url, firstCall ? { params } : undefined);
    // data có thể là array (không phân trang) hoặc object (có results, next, count)
    const items = Array.isArray(data) ? data : (data?.results || []);
    all.push(...items);

    // next có thể là absolute URL; axios chấp nhận absolute URL với instance
    url = (Array.isArray(data) ? null : data?.next) || null;
    firstCall = false;
  }

  return all;
}

/**  LẤY TOÀN BỘ DISEASES  */
export async function getAllDiseases() {
  const { data } = await api.get("/vaccines/diseases/");
  const list = Array.isArray(data) ? data : Array.isArray(data?.results) ? data.results : [];
  return list;
}

export async function getAllVaccinePackages() {
  const { data } = await api.get("/vaccines/packages/");
  return Array.isArray(data) ? data : (data?.results || []);
}

// export async function getAllVaccineCategories() {
//   const { data } = await api.get("/vaccines/categories/");
//   return Array.isArray(data) ? data : (data?.results || []);
// }
export async function getAllVaccineCategories(params = {}) {
  let url = "/vaccines/categories/";
  let firstCall = true;
  const all = [];

  while (url) {
    const { data } = await api.get(url, firstCall ? { params } : undefined);
    const items = Array.isArray(data) ? data : (data?.results || []);
    all.push(...items);

    url = (Array.isArray(data) ? null : data?.next) || null;
    firstCall = false;
  }

  return all;
}


export const exportVaccinesExcel = async (params = {}) => {
  const qs = new URLSearchParams(params).toString();
  const res = await api.get(`/vaccines/vaccines/export/excel/?${qs}`, {
    responseType: "blob",
  });
  return res.data; 
};