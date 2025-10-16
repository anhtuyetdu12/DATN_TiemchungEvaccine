// src/services/recordBookService.js
import api from "./axios";

// Lấy danh sách thành viên
export async function getFamilyMembers() {
  const res = await api.get("/records/family-members/");
  return res.data;
}
// export const getFamilyMembers = async () => {
//   const token = localStorage.getItem("access");
//   const res = await api.get("/records/family-members/", {
//     headers: {
//       Authorization: `Bearer ${token}`,
//     },
//   });
//   return res.data;  // data phải là mảng member
// };

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

// Lấy lịch sử tiêm của 1 thành viên

export const getVaccinationRecords = async (memberId) => {
  if (!memberId) throw new Error("Thiếu memberId");

  const res = await api.get(`/records/vaccinations/?member_id=${memberId}`);
   return res.data;
};

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


// Lấy danh sách bệnh
export const getDiseases = async () => {
  try {
    const res = await api.get("/vaccines/diseases/");
    return res.data;
  } catch (error) {
    console.error("Lỗi khi tải danh sách bệnh:", error);
    throw error;
  }
};

export const getVaccinesByAge = async (memberId, diseaseId, doseNumber) => {
  if (!memberId) throw new Error("Thiếu memberId");
  const params = new URLSearchParams({ member_id: String(memberId) });
  if (diseaseId) params.append("disease_id", String(diseaseId));
  if (doseNumber) params.append("dose_number", String(doseNumber)); // 🔧 thêm mũi

  // Lưu ý: axios instance `api` của bạn nên có baseURL = "/api"
  // -> endpoint này tương ứng /api/vaccines/by-age/
  const res = await api.get(`/vaccines/by-age/?${params.toString()}`);
  return res.data;
};