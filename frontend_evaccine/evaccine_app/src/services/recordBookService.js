// src/services/recordBookService.js
import api from "./axios";


// Helper trả luôn mảng
const pickList = (data) => {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.results)) return data.results;
  return [];
};

// --- Adapters ---
const adaptDisease = (d) => ({
  id: d.id,
  name: d.name,
  description: d.description || "",
  // BE đã có dose_count trong serializer -> FE dùng camelCase
  doseCount: d.dose_count ?? d.doses_required ?? d.recommended_doses ?? 1,
});

const adaptMember = (m) => ({
  id: m.id,
  full_name: m.full_name,
  relation: m.relation,
  gender: m.gender,          // "male"/"female"/"other" (đổi text ở FE nếu cần)
  date_of_birth: m.date_of_birth,
  phone: m.phone || "",
});

const adaptRecord = (r) => ({
  id: r.id,
  disease: r.disease,              // có {id,name,...}
  disease_id: r.disease?.id ?? r.disease_id ?? null,
  vaccine: r.vaccine,              // có {id,name,...}
  vaccine_name: r.vaccine?.name || r.vaccine_name || "",
  vaccine_lot: r.vaccine_lot || "",
  dose_number: r.dose_number ?? null,
  vaccination_date: r.vaccination_date || null,
  next_dose_date: r.next_dose_date || null,
  note: r.note || "",
  status_label: r.status_label || null,
});

// --- Services ---
export const getDiseases = async () => {
  const { data } = await api.get("/vaccines/diseases/");
  return pickList(data).map(adaptDisease);
};

export const getFamilyMembers = async () => {
  const { data } = await api.get("/records/family-members/");
  return pickList(data).map(adaptMember);
};

export const getVaccinationRecords = async (memberId) => {
  const { data } = await api.get("/records/vaccinations/", {
    params: memberId ? { member_id: memberId } : {},
  });
  return pickList(data).map(adaptRecord);
};

export const getVaccinesByAge = async (memberId, diseaseId, doseNumber) => {
  const { data } = await api.get("/vaccines/by-age/", {
    params: { member_id: memberId, disease_id: diseaseId, dose_number: doseNumber },
  });
  // giữ nguyên structure, chỉ chuẩn hóa giá & ảnh của vaccines nếu muốn
  data.vaccines = pickList(data.vaccines).map(v => ({
    ...v,
    image: v.image || "/images/no-image.jpg",
    formatted_price: v.formatted_price ?? (v.price != null ? `${Number(v.price).toLocaleString("vi-VN")} VNĐ` : "0 VNĐ"),
  }));
  return data;
};


// Thêm thành viên
export async function createFamilyMember(payload) {
  try {
    const res = await api.post("/records/family-members/", payload);
    return res.data;
  } catch (err) {
    console.error(" Lỗi khi tạo thành viên:", err.response?.data || err.message);
    throw err;
  }
}


// cập nhật thông tin bản thân
export const updateFamilyMember = async (id, payload) => {
  const res = await api.patch(`/records/family-members/${id}/`, payload);
  return res.data;  
};

// Thêm mũi tiêm
export async function addVaccinationRecord(payload) {
  const res = await api.post("/records/vaccinations/", payload);
  return res.data;
}


