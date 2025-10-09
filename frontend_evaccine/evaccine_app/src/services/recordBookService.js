// src/services/recordBookService.js
import api from "./axios";

// ✅ Lấy danh sách thành viên
// export async function getFamilyMembers() {
//   const res = await api.get("/records/family-members/");
//   return res.data;
// }
export const getFamilyMembers = async () => {
  const token = localStorage.getItem("access");
  const res = await api.get("/records/family-members/", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return res.data;  // data phải là mảng member
};

// ✅ Thêm thành viên
export async function createFamilyMember(payload) {
  try {
    const res = await api.post("/records/family-members/", payload);
    return res.data;
  } catch (err) {
    console.error(" Lỗi khi tạo thành viên:", err.response?.data || err.message);
    throw err;
  }
}

// ✅ Lấy lịch sử tiêm của 1 thành viên
/**
 * Lấy lịch sử tiêm của 1 thành viên
 * @param {number} memberId - ID của FamilyMember
 * @returns {Promise<Array>} mảng VaccinationRecord
 */
export const getVaccinationRecords = async (memberId) => {
  if (!memberId) throw new Error("Thiếu memberId");

  try {
    const token = localStorage.getItem("access");
    const res = await api.get(`/records/vaccinations/?member_id=${memberId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    // res.data phải là mảng các VaccinationRecord
    return res.data;
  } catch (error) {
    console.error("Lỗi khi tải lịch sử tiêm:", error.response?.data || error.message);
    throw error;
  }
};

// cập nhật thông tin bản thân
export const updateFamilyMember = async (id, payload) => {
  const token = localStorage.getItem("access");
  if (!token) throw new Error("Missing access token");

  const res = await api.patch(`/records/family-members/${id}/`, payload, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
};

// ✅ Thêm mũi tiêm
export async function addVaccinationRecord(payload) {
  const res = await api.post("/records/vaccinations/", payload);
  return res.data;
}


// ✅ Lấy danh sách bệnh
export const getDiseases = async () => {
  try {
    const res = await api.get("/vaccines/diseases/");
    return res.data;
  } catch (error) {
    console.error("Lỗi khi tải danh sách bệnh:", error);
    throw error;
  }
};
