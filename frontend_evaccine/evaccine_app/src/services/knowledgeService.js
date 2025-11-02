// src/services/knowledgeService.js
import api from "./axios";

// tiện: nếu BE paging thì vẫn trả mảng
const pickList = (data) => {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.results)) return data.results;
  return [];
};

const adaptCategory = (c) => ({
  id: c.id,
  name: c.name,
  code: c.code,
  order: c.order,
  isActive: c.is_active,
});

const adaptArticle = (a) => ({
  id: a.id,
  title: a.title,
  summary: a.summary || "",
  content: a.content || "",
  category: a.category || null,         // id
  categoryName: a.category_name || "",
  visibility: a.visibility || "normal",
  status: a.status,
  authorName: a.author_name || "",
  thumbnail: a.thumbnail || null,
  disease: a.disease || null,
  vaccine: a.vaccine || null,
  createdAt: a.created_at,
});
 
// ====== API ======

export async function getKnowledgeCategories() {
  const { data } = await api.get("/knowledges/categories/");
  return pickList(data).map(adaptCategory);
}

// params: { status, category, mine, limit }
export async function getKnowledgeArticles(params = {}) {
  const { data } = await api.get("/knowledges/articles/", { params });
  return pickList(data).map(adaptArticle);
}

export async function createKnowledgeArticle(payload) {
  const { data } = await api.post("/knowledges/articles/", payload);
  return adaptArticle(data);
}

export async function updateKnowledgeArticle(id, payload) {
  const { data } = await api.put(`/knowledges/articles/${id}/`, payload);
  return adaptArticle(data);
}

export async function submitKnowledgeArticle(id) {
  const { data } = await api.post(`/knowledges/articles/${id}/submit/`);
  return adaptArticle(data);
}

// dùng cho admin
export async function approveKnowledgeArticle(id) {
  const { data } = await api.post(`/knowledges/articles/${id}/approve/`);
  return adaptArticle(data);
}
export async function rejectKnowledgeArticle(id) {
  const { data } = await api.post(`/knowledges/articles/${id}/reject/`);
  return adaptArticle(data);
}

export async function getPublicKnowledgeArticles(params = {}) {
  const { data } = await api.get("/knowledges/articles/public/", { params });
  // tái dùng adaptArticle để đỡ viết lại
  return (Array.isArray(data) ? data : []).map(adaptArticle);
}