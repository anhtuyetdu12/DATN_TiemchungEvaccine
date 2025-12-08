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
  doseCount: d.dose_count ?? d.doses_required ?? d.recommended_doses ?? 1,
});

const adaptMember = (m) => ({
  id: m.id,
  full_name: m.full_name,
  relation: m.relation,
  gender: m.gender,         
  date_of_birth: m.date_of_birth,
  phone: m.phone || "",
  chronic_note: m.chronic_note || "", 
});

const adaptRecord = (r) => ({
  id: r.id,
  disease: r.disease,
  disease_id: r.disease?.id ?? r.disease_id ?? null,
  vaccine: r.vaccine,
  vaccine_name: r.vaccine?.name || r.vaccine_name || "",
  vaccine_lot: r.vaccine_lot || "",
  dose_number: r.dose_number ?? null,
  vaccination_date: r.vaccination_date || null,
  next_dose_date: r.next_dose_date || null,
  note: r.note || "",
  status_label: r.status_label || null,
  from_booking: !!r.from_booking,            
  locked: !!(r.locked || r.from_booking),        
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
  let url = "/records/vaccinations/";
  const all = [];
  let firstCall = true;
  const params = memberId ? { member_id: memberId } : {};

  while (url) {
    const { data } = await api.get(
      url,
      firstCall ? { params } : undefined
    );

    all.push(...pickList(data));

    url = Array.isArray(data) ? null : data?.next || null;
    firstCall = false;
  }

  return all.map(adaptRecord);
};

export const getVaccinesByAge = async (memberId, diseaseId, doseNumber) => {
   const params = { member_id: memberId };
   if (diseaseId) params.disease_id = diseaseId;
   if (doseNumber) params.dose_number = doseNumber;
 
   const { data } = await api.get("/vaccines/by-age/", { params });
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

// cập nhật lịch sử tiêm từ khách hàng
export async function updateDiseaseHistory({ memberId, diseaseId, doses }) {
  const payload = {
    member_id: memberId,
    disease_id: diseaseId,
    doses: (doses || []).map((d) => ({
      date: d.date || "",
      next_dose_date: d.next_dose_date || d.appointmentDate || "",
      vaccine: d.vaccine || "",
      location: d.location || d.place || "",
      note: d.note || "",
      status_label: d.status_label || "",
    })),
  };
  const res = await api.post("/records/me/history/by-disease/", payload);
  // Chuẩn hóa results cho FE (nếu bạn dùng response này ở đâu đó)
  const raw = Array.isArray(res.data?.results) ? res.data.results : [];
  const normalizedResults = raw.map((d, idx) => ({
    id: d.id ?? idx + 1,
    date: d.date || "",
    vaccine: d.vaccine || "",
    location: d.place || d.location || "",
    appointmentDate: d.next_dose_date || d.appointmentDate || "",
    note: d.note || "",
    status_label: d.status_label || null,
    locked: !!(d.locked || d.from_booking),
  }));

  return {
    ...res.data,
    results: normalizedResults,
  };
}

