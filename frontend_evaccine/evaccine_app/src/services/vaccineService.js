// src/services/vaccineService.js
import api from "./axios";

export async function getVaccineBySlug(slug) {
  const { data } = await api.get(`/vaccines/vaccines/${slug}/`); 
  return data; 
}


export async function getVaccinesByIds(ids = []) {
  const { data } = await api.get(`/vaccines/vaccines/by-ids/?ids=${ids.join(",")}`);
  return data;
}
export async function getPackageBySlug(slug) {
  const { data } = await api.get(`/vaccines/packages/${slug}/`);
  return data;
}

export async function getAllVaccines(params = {}) {
  let url = "/vaccines/vaccines/";
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

export async function getAllDiseases() {
  const { data } = await api.get("/vaccines/diseases/");
  const list = Array.isArray(data) ? data : Array.isArray(data?.results) ? data.results : [];
  return list;
}

export async function getAllVaccinePackages() {
  const { data } = await api.get("/vaccines/packages/");
  return Array.isArray(data) ? data : (data?.results || []);
}

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