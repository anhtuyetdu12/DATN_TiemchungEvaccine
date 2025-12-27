// DetailCustomerModal.jsx
import { useState, useEffect, useMemo, useCallback } from "react";
import Dropdown from "../../../../components/Dropdown";
import QuantityPicker from "../../../../components/QuantityPicker";
import ConfirmModal from "../../../../components/ConfirmModal";
import DeleteCustomerModal from "./DeleteCustomerModal";
import { getAllVaccines, getAllDiseases, } from "../../../../services/vaccineService";
import { getVaccinesByAge } from "../../../../services/recordBookService";
import { getRemainingDoses } from "../../../../services/bookingService";
import { staffUpdateCustomerProfile, createAppointment, setAppointmentStatus, staffUpdateMember,
  addHistory, staffCreateMember, staffDeleteMember,} from "../../../../services/customerService";
import { openPrintWindow, buildAppointmentConfirmationHtml, buildPostInjectionHtml, formatDateVi } from "../../../../utils/printHelpers";
import { toast } from "react-toastify";
import api from "../../../../services/axios";

export default function EditCustomerModal({
  show, customer, onClose, center,
  onConfirmAppointment = () => {},
  onCancelAppointment = () => {},
  setCustomers, setSelectedCustomer,
}) {
  // ---------------- Hooks: luôn khai báo trước mọi early return ----------------
  const [deleteModal, setDeleteModal] = useState({ open: false, member: null });
  const [deleting, setDeleting] = useState(false);
  const [vaccinesDb, setVaccinesDb] = useState([]);   
  const [diseasesDb, setDiseasesDb] = useState([]);  
  const [loadingDicts, setLoadingDicts] = useState(false);
  const [creating, setCreating] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null); 

  const [newAppointment, setNewAppointment] = useState({
    date: "",
    memberId: "",
    items: [],
    note: "",
    total: 0,
  });

  const [form, setForm] = useState({ doses: 1 });
  const [newMember, setNewMember] = useState({});
  const [editingMemberId, setEditingMemberId] = useState(null);
  const [detailTab, setDetailTab] = useState("info");
  const [newVaccineRecord, setNewVaccineRecord] = useState({
    date: "",
    memberId: "",
    diseaseId: "",   
    disease: "",    
    vaccine: "",    
    dose: "",        
    maxDose: 5,  
    price: "",
    batch: "",
    place: "",
    note: "",
  });
  const [ageFiltered, setAgeFiltered] = useState({
    loading: false,
    memberId: "",
    ageText: "",
    vaccines: [],   // list vaccine phù hợp độ tuổi
  });


  // Các list an toàn khi customer null
  const membersList = useMemo(() => customer?.members ?? [], [customer?.members]);
  const appointmentsList = useMemo(() => customer?.appointments ?? [], [customer?.appointments]);
  const historyList = useMemo(() => customer?.history ?? [], [customer?.history]);



  // Options chọn người tiêm (owner + members)
  const memberSelectOptions = useMemo(() => {
    const list = (membersList || []).map((m) => {
      const displayName = m.name || m.full_name || "";
      return {
        value: String(m.id),   // <- DÙ "Bản thân" cũng dùng id thật
        label: `${displayName}${m.relation ? ` (${m.relation})` : ""}`,
        title: `${displayName}${m.relation ? ` (${m.relation})` : ""}`,
      };
    });
    return list;
  }, [membersList]);

  // danh sách mối quan hệ — cũng đưa lên trước guard
  const relationships = useMemo(
    () =>
      [ "Vợ", "Chồng", "Con trai", "Con gái",
        "Bố", "Mẹ", "Ông ngoại", "Bà ngoại",
        "Ông nội", "Bà nội", "Bạn bè", "Khác",
      ].map((r) => ({ value: r, label: r })),
    []
  );

  // Tổng tiền tự động theo items
  useEffect(() => {
    const sum = (newAppointment.items || []).reduce(
      (s, it) => s + Number(it.price || 0) * Number(it.doseQty || 1),
      0
    );
    setNewAppointment((prev) => ({ ...prev, total: sum }));
  }, [newAppointment.items]);

  // Ưu tiên member đang chọn ở Lịch sử tiêm, nếu không có thì lấy ở Lịch hẹn
  const memberIdForAge = newVaccineRecord.memberId || newAppointment.memberId;

  useEffect(() => {
    if (!memberIdForAge) {
      setAgeFiltered({
        loading: false,
        memberId: "",
        ageText: "",
        vaccines: [],
      });
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        setAgeFiltered(prev => ({
          ...prev,
          loading: true,
          memberId: memberIdForAge,
        }));
        const data = await getVaccinesByAge(memberIdForAge);
        if (cancelled) return;
        setAgeFiltered({
          loading: false,
          memberId: memberIdForAge,
          ageText: data.age_text || "",
          vaccines: data.vaccines || [],
        });
      } catch (e) {
        console.error(e);
        if (!cancelled) {
          setAgeFiltered({
            loading: false,
            memberId: memberIdForAge,
            ageText: "",
            vaccines: [],
          });
        }
        toast.error(
          e?.response?.data?.error ||
            "Không lấy được danh sách vắc xin phù hợp độ tuổi"
        );
      }
    })();

    return () => { cancelled = true; };
  }, [memberIdForAge]);


  // Đồng bộ form khi customer thay đổi
  useEffect(() => {
    if (customer) {
      setForm((prev) => ({ ...prev, ...(customer || {}) }));
    }
  }, [customer]);

  // Khóa scroll khi mở modal
  useEffect(() => {
    document.body.style.overflow = show ? "hidden" : "auto";
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [show]);

    // LOASD ds vaccine bệnh
   useEffect(() => {
    if (!show) return;
    let mounted = true;
    (async () => {
      try {
        setLoadingDicts(true);
        const [vList, dList] = await Promise.all([getAllVaccines(), getAllDiseases()]);
        if (!mounted) return;
        setVaccinesDb(vList || []);
        setDiseasesDb(dList || []);
      } catch (e) {
        console.error(e);
        toast.error("Không tải được danh mục vắc xin/phòng bệnh");
      } finally {
        if (mounted) setLoadingDicts(false);
      }
    })();
    return () => { mounted = false; };
  }, [show]);

  // LẤY DS BỆNH (TOÀN BỘ)
  const diseaseOptions = useMemo(() => {
    return (diseasesDb || []).map((d) => ({
      value: String(d.id),
      label: d.name,
    }));
  }, [diseasesDb]);

  // BỆNH ĐÃ LỌC THEO ĐỘ TUỔI (DÙNG TRONG FORM TẠO LỊCH)
  const ageDiseaseOptions = useMemo(() => {
    // Chưa chọn người tiêm → dùng full danh sách
    if (!ageFiltered.memberId) {
      return diseaseOptions;
    }

    // ĐÃ chọn người tiêm:
    const map = new Map();
    (ageFiltered.vaccines || []).forEach((v) => {
      if (v.disease && v.disease.id && !map.has(v.disease.id)) {
        map.set(v.disease.id, {
          value: String(v.disease.id),
          label: v.disease.name,
        });
      }
    });

    // Nếu API trả rỗng → không có bệnh nào phù hợp → return []
    return Array.from(map.values());
  }, [ageFiltered, diseaseOptions]);


  const mapCodeToLabel = (c) => String(c).toLowerCase() === "male" ? "Nam" : String(c).toLowerCase() === "female" ? "Nữ" : "Khác";

  const mapLabelToCode = (l) => (l === "Nam" ? "male" : l === "Nữ" ? "female" : "other");

  // Chuẩn hóa gender & dob từ customer
  useEffect(() => {
    if (customer) {
      setForm((prev) => ({
        ...prev,
        ...customer,
        gender: ["male", "female", "other"].includes(
          (customer.gender || "").toLowerCase()
        )
          ? customer.gender
          : mapLabelToCode(customer.gender || "Khác"),
        dob: customer.dob || customer.date_of_birth || "",
        chronic_note: customer.chronic_note || "", 
      }));
    }
  }, [customer]);

  // 1) suy tên theo id trong membersList
  const resolveMemberNameById = useCallback((mid) => {
    if (mid == null || mid === "") return "";
    const m = (membersList || []).find(x => String(x.id) === String(mid));
    if (!m) return "";
    const base = m.name || m.full_name || "";
    return `${base}${m.relation ? ` (${m.relation})` : ""}`;
  }, [membersList]);

  // 2) lấy id nếu BE trả nhiều kiểu khác nhau
  const pickMemberId = useCallback((a) => {
    const m = a.member;
    if (a.memberId != null && a.memberId !== "") return a.memberId;
    if (a.member_id != null && a.member_id !== "") return a.member_id;
    if (m && typeof m === "object") return m.id ?? m.pk ?? null;
    if (typeof m === "number" || typeof m === "string") return m;
    return null;
  }, []);

  // 3) lấy tên nếu BE trả thẳng tên ở nhiều khóa khác nhau
  const pickMemberName = useCallback((a) => {
    const m = a.member;
    return (
      a.memberName ||
      a.member_name ||
      a.member_full_name ||
      (m && typeof m === "object" && (m.full_name || m.name)) ||
      ""
    );
  }, []);

  // 4) Chuẩn hoá danh sách lịch hẹn
  const normalizedAppointments = useMemo(() => {
    const list = (appointmentsList || []).map((a) => {
      const idFromAny = pickMemberId(a);
      const nameFromAny =
        pickMemberName(a) ||
        (idFromAny == null ? (customer?.name ? `${customer.name} (Chủ hồ sơ)` : "") : resolveMemberNameById(idFromAny));
      return { ...a, memberId: idFromAny, memberName: nameFromAny, };
    });

    return list
      .slice() // tránh mutate
      .sort((a, b) => {
        const da = new Date(a.date || a.appointment_date);
        const db = new Date(b.date || b.appointment_date);
        return db - da;
      });
  }, [ appointmentsList, customer, resolveMemberNameById, pickMemberId, pickMemberName,]);

  // Tìm vaccine theo id trong vaccinesDb
  const findVaccine = (id) =>
    (vaccinesDb || []).find((v) => String(v.id) === String(id));
  // Lấy vaccine theo disease_id
  const vaccinesByDiseaseId = (diseaseId) =>
    (vaccinesDb || []).filter((v) => String(v?.disease?.id) === String(diseaseId));
  //  lấy số mũi trong phác đồ
  const getMaxDose = (vId) => {
    const v = findVaccine(vId);
    const total = Number(v?.doses_required ?? 1);
    return Number.isFinite(total) && total > 0 ? total : 1;
  };

  // ---------------- Early return: đặt SAU khi đã khai báo tất cả hooks ----------------
  if (!show || !customer) return null;

  // ---------------- Helpers / Options (non-hook) ----------------
  const genderOptions = [
    { label: "Nam", icon: "fa-solid fa-mars", color: "tw-text-teal-500" },
    { label: "Nữ", icon: "fa-solid fa-venus", color: "tw-text-pink-500" },
    { label: "Khác", icon: "fa-solid fa-venus-mars", color: "tw-text-orange-500" },
  ];

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    const d = new Date(dateString);
    if (Number.isNaN(d.getTime())) return "-";
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const formatMoney = (n) => (n != null ? Number(n).toLocaleString("vi-VN") : "0");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    const toSave = {
      ...form,
      gender: mapLabelToCode(mapCodeToLabel(form.gender)),
      dob: form.dob || customer.dob || customer.date_of_birth || "",
    };
    try {
      await staffUpdateCustomerProfile(customer.id, {
        full_name: toSave.name,
        phone: toSave.phone,
        date_of_birth: toSave.dob,
        gender: toSave.gender, // "male" | "female" | "other"
        chronic_note: toSave.chronic_note || "", 
      });

      setCustomers((prev) =>
        prev.map((c) =>
          c.id === customer.id ? { ...c, ...toSave, 
            gender_text: mapCodeToLabel(toSave.gender),
            dob: toSave.dob,
          }: c
        )
      );
      setSelectedCustomer((prev) => ({
        ...prev,
        ...toSave,
        gender_text: mapCodeToLabel(toSave.gender),
        dob: toSave.dob,
      }));
      toast.success("Đã lưu thông tin khách hàng");
      onClose();
    } catch (e) {
      console.error(e);
      toast.error(e?.response?.data?.detail || "Không lưu được. Vui lòng thử lại!");
    }
  };

  const mapBookingToUi = (b) => {
    const price = (b.items_detail || []).reduce(
      (s, it) => s + Number(it.unit_price || 0) * Number(it.quantity || 0),
      0
    );
      const vaccineLabel = (b.items_summary || []).map((x) => `${x.name} x${x.qty}`).join(", ") ||
      (b.vaccine?.name || (b.package ? `Gói: ${b.package.name}` : ""));

      const memberIdRaw = b.member_id ?? b.member?.id ?? null;
      const memberNameRaw = b.member_name ?? b.member?.full_name ?? "";
      return {
        id: String(b.id),
        date: b.appointment_date,
        vaccine: vaccineLabel,
        center: b.location || "",
        status: b.status,
        price,
        memberId: memberIdRaw,
        memberName: memberNameRaw ||  (memberIdRaw == null ? (customer?.name ? `${customer.name} (Chủ hồ sơ)` : "") : resolveMemberNameById(memberIdRaw)),
      };
    };

    // Chọn lịch hẹn phù hợp để in phiếu
  const pickAppointmentForPrint = () => {
    if (!normalizedAppointments.length) return null;

    // Ưu tiên lịch đã xác nhận
    const confirmed = normalizedAppointments.filter(a => a.status === "confirmed");
    if (confirmed.length) {
      return confirmed.sort(
        (a, b) => new Date(a.date) - new Date(b.date)
      )[0];
    }

    // Nếu chưa có confirmed, lấy pending gần nhất
    const pending = normalizedAppointments.filter(a => a.status === "pending");
    if (pending.length) {
      return pending.sort(
        (a, b) => new Date(a.date) - new Date(b.date)
      )[0];
    }

    // Không thì lấy lịch mới nhất bất kỳ
    return normalizedAppointments.sort(
      (a, b) => new Date(b.date) - new Date(a.date)
    )[0];
  };

  const handlePrintConfirmation = (targetAppt) => {
    if (!customer) return;
    const appt = targetAppt || pickAppointmentForPrint();
    if (!appt) {
      toast.error("Khách hàng chưa có lịch hẹn để in phiếu xác nhận.");
      return;
    }
    try {
      const html = buildAppointmentConfirmationHtml({
        customer,
        center,
        appt,
        formatDate: formatDateVi,
      });
      openPrintWindow(html);
    } catch (err) {
      console.error(err);
      toast.error(err.message || "Không in được phiếu");
    }
  };

  const handlePrintPostInjection = (record) => {
    if (!customer || !record) return;
    const memberName =
      record.member_name ||
      resolveMemberNameById(record.member_id) ||
      customer.name ||
      "";
    const memberDob = (() => {
      if (!record.member_id) return customer.dob || customer.date_of_birth || "";
      const m = (membersList || []).find( (x) => String(x.id) === String(record.member_id) );
      return m?.dob || m?.date_of_birth || "";
    })();

    const regimenNote = record.dose 
    ? `Đã tiêm mũi ${record.dose}. Vui lòng theo dõi lịch hẹn hoặc tư vấn tại trung tâm để sắp xếp mũi tiếp theo phù hợp.`
    : "Vui lòng tham khảo phác đồ với bác sĩ để lên lịch mũi tiếp theo.";
    try {
      const html = buildPostInjectionHtml({
        customer,
        center,
        record,
        memberName,
        memberDob,
        regimenNote,
        formatDate: formatDateVi,
      });
      openPrintWindow(html);
    } catch (err) {
      console.error(err);
      toast.error(err.message || "Không in được phiếu sau tiêm");
    }
  };

  //cập nhật thông tin khách hàng
  const handleSaveMember = async () => {
    if (!newMember?.name) return;
    const payload = {
      full_name: newMember.name,
      nickname: newMember.nickname || "",
      relation: newMember.relation,
      gender: mapLabelToCode(newMember.sex || "Khác"),
      date_of_birth: newMember.dob || null,
      phone: newMember.phone || "",
      chronic_note: newMember.chronic_note || "",
    };
    try {
      let updatedMembers;
      if (editingMemberId) {
        // UPDATE
        const updatedFromApi = await staffUpdateMember(customer.id, editingMemberId, payload);
        updatedMembers = membersList.map((m) =>
          m.id === editingMemberId
            ? {
                ...m,
                id: updatedFromApi.id,
                name: updatedFromApi.full_name,
                nickname: updatedFromApi.nickname || "",
                relation: updatedFromApi.relation,
                sex: mapCodeToLabel(updatedFromApi.gender || newMember.sex || "Khác"),
                dob: updatedFromApi.date_of_birth,
                chronic_note: updatedFromApi.chronic_note || "",
              }
            : m
        );
        toast.success("Đã cập nhật thành viên");
      } else {
        //  CREATE (logic giống hiện tại)
        const created = await staffCreateMember(customer.id, payload);
        const member = {
          id: created.id,
          name: created.full_name,
          nickname: created.nickname || "", 
          relation: created.relation,
          sex: mapCodeToLabel(created.gender || newMember.sex || "Khác"),
          dob: created.date_of_birth,
          chronic_note: created.chronic_note || "",
          expanded: false,
        };
        updatedMembers = [...membersList, member];
        toast.success("Đã thêm thành viên");
      }
      setCustomers((prev) =>
        prev.map((c) => c.id === customer.id ? { ...c, members: updatedMembers } : c)
      );
      setSelectedCustomer((prev) => ({
        ...prev,
        members: updatedMembers,
      }));

      setNewMember({});
      setEditingMemberId(null);
    } catch (e) {
      toast.error(e?.response?.data?.detail || "Lưu thành viên thất bại");
    }
  };


  // thêm lịch hẹn mới (version cũ — nếu còn dùng)
  const handleCreateAppointments = async () => {
    try {
      setCreating(true);
      if (!newAppointment.date) {
        toast.error("Chọn ngày hẹn");
        return;
      }
      if (!newAppointment.memberId) {
        toast.error("Chọn người tiêm");
        return;
      }
      const apptDate = new Date(newAppointment.date);
      apptDate.setHours(0, 0, 0, 0);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (apptDate < today) {
        toast.error("Ngày hẹn phải lớn hơn hoặc bằng hôm nay.");
        return;
      }
      // Gom số mũi theo vaccine
      const want = {};
      for (const it of newAppointment.items || []) {
        if (!it.vaccineId) continue;
        const key = String(it.vaccineId);
        const qty = Number(it.doseQty || 1);
        if (qty <= 0) {
          toast.error("Số mũi phải lớn hơn 0.");
          return;
        }
        if (want[key] != null) {
          // Nếu có 2 item cùng 1 vaccine -> bắt user gộp lại
          toast.error("Mỗi vắc xin chỉ được chọn 1 dòng trong 1 lịch hẹn.");
          return;
        }
        want[key] = qty;
      }
      const entries = Object.entries(want); // [vaccine_id_str, quantity]
      if (!entries.length) {
        toast.error("Chọn ít nhất 1 vắc xin");
        return;
      }

      // CHECK PHÁC ĐỒ + KHOẢNG CÁCH CHO TỪNG VACCINE
      const checks = await Promise.all(
        entries.map(async ([vId, qty]) => {
          try {
            const res = await getRemainingDoses(newAppointment.memberId, vId);
            return { vId, qty, info: res };
          } catch (e) {
            console.error("getRemainingDoses error:", e);
            return { vId, qty, info: null };
          }
        })
      );

      for (const { vId, qty, info } of checks) {
        const vaccine = findVaccine(vId); // bạn đã có helper findVaccine ở trên
        const vName = vaccine?.name || `ID ${vId}`;

        // Nếu API trả được info
        if (info) {
          const remaining = Math.max(info.remaining ?? 0, 0);

          if (remaining <= 0) {
            toast.error( `Vắc xin ${vName}: khách đã tiêm đủ ${info.used}/${info.total} mũi theo phác đồ.`);
            return;
          }
          if (qty > remaining) {
            toast.error( `Vắc xin ${vName}: phác đồ còn tối đa ${remaining} mũi, ` +
              `nhưng bạn đang đặt tổng cộng ${qty} mũi.`);
            return;
          }

          if (info.next_dose_date) {
            const nd = new Date(info.next_dose_date);
            nd.setHours(0, 0, 0, 0);
            if (apptDate < nd) {
              toast.error( `Vắc xin ${vName}: mũi tiếp theo nên tiêm từ ngày ${nd.toLocaleDateString("vi-VN")}. `
                + `Vui lòng chọn ngày hẹn muộn hơn.` );
              return;
            }
          }
        } else {
          // Không gọi được API -> fallback: check với doses_required nếu muốn
          const maxByProtocol = getMaxDose(vId);
          if (qty > maxByProtocol) {
            toast.error( `Vắc xin ${vName}: phác đồ tối đa ${maxByProtocol} mũi trong một liệu trình. `
              + `Bạn đang đặt ${qty} mũi.` );
            return;
          }
        }
      }

      // Nếu qua hết validation -> build payload
      const items = entries.map(([vaccine_id, quantity]) => ({
        vaccine_id: Number(vaccine_id),
        quantity,
      }));

      const payload = {
        member_id: Number(newAppointment.memberId),
        appointment_date: newAppointment.date || "",
        items,
        location: center?.name || "",
        notes: newAppointment.note || "",
      };

      const created = await createAppointment(customer.id, payload);
      let slim = mapBookingToUi(created);

      if (!slim.memberName) {
        const opt = (memberSelectOptions || []).find(
          x => String(x.value) === String(newAppointment.memberId)
        );
        if (opt?.label) slim = { ...slim, memberName: opt.label };
      }

      const updated = [slim, ...(appointmentsList || [])];
      setCustomers((prev) =>
        prev.map((c) =>
          c.id === customer.id ? { ...c, appointments: updated } : c
        )
      );
      setSelectedCustomer((prev) =>
        prev ? { ...prev, appointments: updated } : prev
      );
      setNewAppointment({ date: "", memberId: "", items: [], note: "", total: 0 });
      toast.success("Đã tạo lịch hẹn");
    } catch (e) {
      const detail = e?.response?.data?.detail;
      if (detail) return toast.error(detail);
      const data = e?.response?.data;
      if (data && typeof data === "object") {
        try {
          const firstField = Object.keys(data)[0];
          const msg = Array.isArray(data[firstField])
            ? data[firstField][0]
            : String(data[firstField]);
          return toast.error(msg || "Không tạo được lịch hẹn");
        } catch {}
      }
      toast.error("Không tạo được lịch hẹn");
    } finally {
      setCreating(false);
    }
  };

  // update trạng thái lịch (confirm/cancel)
  const updateAppointmentStatus = async (customerId, apptId, action) => {
    try {
      let res;
      if (action === "confirm") {
        res = await api.post(`/records/bookings/${apptId}/confirm/`);
        const failed = res?.data?.failed_items || [];
        if (failed.length) {
          toast.warning( `Xác nhận không đầy đủ: có ${failed.length} mũi chưa giữ được vắc xin trong kho.`);
        }
      } else if (action === "cancel") {
        try {
          res = await api.post(`/records/bookings/${apptId}/cancel/`);
        } catch (err) {
          await setAppointmentStatus(customerId, apptId, "cancelled");
          res = { data: { status: "cancelled" } };
        }
      } else {
        throw new Error("Invalid action");
      }

      const newStatus = res?.data?.status || (action === "confirm" ? "confirmed" : "cancelled");
      // Update state
      setCustomers((prev) =>
        prev.map((c) =>
          c.id !== customerId
            ? c : {  ...c,
                appointments: (c.appointments || []).map((a) =>
                  String(a.id) === String(apptId) ? { ...a, status: newStatus } : a
                ),
              }
        )
      );
      setSelectedCustomer((prev) =>
        !prev ? prev
          : { ...prev,
              appointments: (prev.appointments || []).map((a) =>
                String(a.id) === String(apptId) ? { ...a, status: newStatus } : a
              ),
            }
      );
      toast.success(
        newStatus === "confirmed" ? "Đã xác nhận lịch hẹn"
        : newStatus === "cancelled" ? "Đã hủy lịch hẹn"
        : "Đã cập nhật trạng thái"
      );
    } catch (e) {
      toast.error(e?.response?.data?.detail || "Cập nhật trạng thái thất bại");
    }
  };

  // mở modal xác nhận cho 1 lịch hẹn
  const openConfirmAppointment = (action, appt) => {
    setConfirmAction({ action, appt });
  };

  // thực hiện confirm/cancel sau khi user bấm Đồng ý trong modal
  const doAppointmentAction = async () => {
    if (!confirmAction || !customer) return;
    const { action, appt } = confirmAction;
    try {
      await updateAppointmentStatus(customer.id, appt.id, action);
      if (action === "confirm") onConfirmAppointment(customer.id, appt.id);
      if (action === "cancel") onCancelAppointment(customer.id, appt.id);
    } finally {
      setConfirmAction(null);
    }
  };


  // ---------------- Render ----------------
  return (
    <div className="tw-fixed tw-inset-0 tw-flex tw-items-start tw-justify-center tw-pt-24 tw-bg-black/40">
      <div className="tw-bg-white tw-w-[700px] tw-h-[460px] tw-rounded-xl tw-shadow-xl tw-flex tw-flex-col tw-mt-[50px]">
        <div className="tw-flex tw-justify-between tw-items-center tw-p-4 tw-border-b">
          <div>
            <h3 className="tw-text-xl tw-font-semibold">Hồ sơ: {customer.name}</h3>
            <div className="tw-text-lg tw-text-gray-500">  {customer.code}   </div>
          </div>
          <button onClick={onClose}  className="tw-text-white tw-text-xl tw-bg-red-500 hover:tw-bg-red-600 tw-rounded-full tw-px-3 tw-py-2" >
            Đóng ✕
          </button>
        </div>

        <div className="tw-flex-1 tw-grid tw-grid-cols-3 tw-overflow-hidden ">
          <div className="tw-col-span-1 tw-border-r tw-p-4 ">
            <div className="tw-mb-4">
              <div className="tw-text-xl tw-text-gray-500">Thông tin cơ bản</div>
              <div className="tw-font-medium tw-text-[12px]">{customer.name}</div>
              <div className="tw-text-[10px] tw-text-gray-600">
                {customer.phone} • {formatDate(customer.dob || customer.date_of_birth)} •{" "}
                {mapCodeToLabel(form.gender)}
              </div>
            </div>

            <div className="tw-space-y-4 tw-mt-20">
              <button onClick={() => setDetailTab("info")}
                className={`tw-w-full tw-text-left tw-py-2 tw-px-2 tw-rounded ${ detailTab === "info" ? "tw-bg-cyan-200" : "hover:tw-bg-blue-50" }`} >
                Thông tin
              </button>
              <button onClick={() => setDetailTab("family")}
                className={`tw-w-full tw-text-left tw-py-2 tw-px-2 tw-rounded ${  detailTab === "family" ? "tw-bg-cyan-200" : "hover:tw-bg-blue-50"}`} >
                Gia đình
              </button>
              <button onClick={() => setDetailTab("appointments")}
                className={`tw-w-full tw-text-left tw-py-2 tw-px-2 tw-rounded ${ detailTab === "appointments" ? "tw-bg-cyan-200" : "hover:tw-bg-blue-50" }`} >
                Lịch hẹn
              </button>
              <button onClick={() => setDetailTab("history")}
                className={`tw-w-full tw-text-left tw-py-2 tw-px-2 tw-rounded ${ detailTab === "history" ? "tw-bg-cyan-200" : "hover:tw-bg-blue-50" }`} >
                Lịch sử tiêm
              </button>
            </div>
            <button onClick={handlePrintConfirmation} className="tw-bg-indigo-600 tw-text-white tw-px-4 tw-py-2 tw-rounded hover:tw-bg-indigo-500 tw-mt-10">
              In phiếu xác nhận
            </button>
          </div>

          <div className="tw-col-span-2 tw-p-4 tw-overflow-y-auto">
            {detailTab === "info" && (
              <div className="tw-flex tw-flex-col tw-min-h-full tw-text-left">
                <div className="tw-flex-1 tw-space-y-4">
                  <p className="tw-font-semibold tw-text-[17px] tw-text-center tw-text-blue-400">
                    <i className="fa-solid fa-circle-info tw-mr-3"></i>Thông tin cơ bản
                  </p>

                  <div className="tw-grid tw-grid-cols-2 tw-gap-4">
                    <div>
                      <label className="tw-text-lg tw-font-medium">Mã khách hàng</label>
                      <div className="tw-border tw-rounded-lg tw-px-3 tw-py-2 tw-bg-gray-50">{form.code}</div>
                    </div>
                    <div>
                      <label className="tw-text-lg tw-font-medium">Họ tên</label>
                      <input name="name" value={form.name || ""} onChange={handleChange} 
                      className="tw-text-lg tw-w-full tw-border tw-rounded-lg tw-px-3 tw-py-2 focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-blue-300 focus:tw-border-blue-800" />
                    </div>
                  </div>

                  <div className="tw-grid tw-grid-cols-2 tw-gap-4">
                    <div>
                      <label className="tw-text-lg tw-font-medium">Số điện thoại</label>
                      <input name="phone" value={form.phone || ""} onChange={handleChange} 
                      className="tw-text-lg tw-w-full tw-border tw-rounded-lg tw-px-3 tw-py-2 focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-blue-300 focus:tw-border-blue-800" />
                    </div>
                    <div>
                      <label className="tw-text-lg tw-font-medium">Email</label>
                      <input name="email" value={form.email || ""} onChange={handleChange} 
                      className="tw-text-lg tw-w-full tw-border tw-rounded-lg tw-px-3 tw-py-2 focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-blue-300 focus:tw-border-blue-800" />
                    </div>
                  </div>

                  <div className="tw-grid tw-grid-cols-2 tw-gap-4">
                    <div>
                      <label className="tw-text-lg tw-font-medium">Ngày sinh</label>
                      <input name="dob" type="date" max={new Date().toISOString().split("T")[0]} value={form.dob || ""} 
                      onChange={handleChange} className="tw-text-lg tw-w-full tw-border tw-rounded-lg tw-px-3 tw-py-2 focus:tw-outline-none focus:tw-ring-2
                                                     focus:tw-ring-blue-300 focus:tw-border-blue-800" />
                    </div>
                    <div>
                      <label className="tw-text-lg tw-font-medium">Giới tính</label>
                      <div className="tw-grid tw-grid-cols-3 tw-gap-3 tw-mt-2">
                        {genderOptions.map((opt) => {
                          const optCode = mapLabelToCode(opt.label);
                          const isActive = (form.gender || "").toLowerCase() === optCode;
                          return (
                            <button key={opt.label} type="button" onClick={() => setForm((prev) => ({ ...prev, gender: optCode }))} 
                                className={`tw-flex tw-items-center tw-justify-center tw-gap-2 tw-px-3 tw-py-2 tw-rounded-lg tw-border tw-transition tw-text-lg 
                                ${isActive ? "tw-border-cyan-500 tw-bg-cyan-50" : "tw-border-gray-300 tw-bg-white"}`}>
                              <i className={`${opt.icon} ${opt.color}`}></i>
                              <span>{opt.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                    <div>
                      <label className="tw-text-lg tw-font-medium">Bệnh nền / tiền sử bệnh</label>
                      <textarea
                        name="chronic_note"
                        value={form.chronic_note || ""}
                        onChange={handleChange}
                        className="tw-text-lg tw-w-full tw-border tw-rounded-lg tw-px-3 tw-py-2 tw-min-h-[55px] tw-resize-none 
                                  focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-blue-300 focus:tw-border-blue-800"
                        placeholder="VD: Tăng huyết áp, đái tháo đường, hen suyễn..."
                      />
                    </div>

                  </div>
                </div>

                <div className="tw-sticky tw-bottom-0 tw-mt-auto tw-pt-3 tw-pb-3 tw-bg-white tw-border-t">
                  <div className="tw-flex tw-justify-end tw-gap-3">
                    <button type="button" onClick={onClose} className="tw-bg-red-600 tw-text-white tw-text-xl tw-px-6 tw-py-2 tw-rounded-full hover:tw-bg-red-500">
                      Hủy
                    </button>
                    <button type="button" onClick={handleSave} className="tw-bg-green-600 tw-text-white tw-text-xl tw-px-6 tw-py-2 tw-rounded-full hover:tw-bg-green-500">
                      Lưu thay đổi
                    </button>
                  </div>
                </div>
              </div>
            )}

            {detailTab === "family" && (
              <div className="tw-h-full tw-overflow-y-auto tw-scrollbar-hide tw-pr-2 ">
                <h4 className="tw-font-semibold tw-mb-2 tw-text-[17px] tw-text-blue-400">
                  <i className="fa-solid fa-house-chimney-window tw-mr-3 "></i>
                  Thành viên gia đình
                </h4>

                {/* Form thêm thành viên mới */}
                <div className="tw-border tw-p-5 tw-mb-4 tw-space-y-2 tw-bg-pink-100 tw-rounded-lg tw-text-lg">
                  <div className="tw-grid tw-grid-cols-2 tw-gap-4">
                    <input placeholder="Tên thân mật"  value={newMember?.nickname || ""}
                      onChange={(e) => setNewMember((s) => ({ ...s, nickname: e.target.value })) }
                      className="tw-border tw-rounded-lg tw-px-3 tw-py-2 
                            focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-blue-300 focus:tw-border-blue-800"
                    />
                    <input  placeholder="Họ và tên"  value={newMember?.name || ""}
                      onChange={(e) => setNewMember((s) => ({ ...s, name: e.target.value })) }
                      className="tw-border tw-rounded-lg tw-px-3 tw-py-2 
                            focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-blue-300 focus:tw-border-blue-800"
                    />

                    {/* Dropdown Mối quan hệ */}
                    <div>
                      <label className="tw-block tw-mb-3 tw-text-lg tw-font-medium tw-text-left ">  Mối quan hệ  </label>
                      <Dropdown
                        className="tw-text-lg" value={newMember.relation}  options={relationships}
                        onChange={(val) =>setNewMember((s) => ({ ...s, relation: val })) }
                      />
                    </div>

                    {/* Nút chọn Giới tính */}
                    <div className="tw-flex tw-flex-col tw-items-start">
                      <label className="tw-block tw-text-lg tw-font-medium tw-text-left "> Giới tính  </label>
                      <div className="tw-grid tw-grid-cols-3 tw-gap-3 ">
                        {genderOptions.map((opt) => (
                          <button key={opt.label} type="button" onClick={() => setNewMember((s) => ({ ...s, sex: opt.label }))}
                            className={`tw-flex tw-items-center tw-justify-center tw-gap-2 tw-px-3 tw-py-2  tw-rounded-lg tw-border-2 tw-transition 
                                        ${ newMember?.sex === opt.label  ? "tw-border-cyan-500 tw-bg-cyan-50" : "tw-border-gray-300 tw-bg-white" }`} >
                            <i className={`${opt.icon} ${opt.color}`}></i>
                            <span>{opt.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="tw-flex tw-flex-col">
                      <label className=" tw-text-lg tw-font-medium tw-text-left">  Ngày sinh </label>
                      <input type="date" max={new Date().toISOString().split("T")[0]}
                        placeholder="Ngày sinh" value={newMember?.dob || ""}
                        onChange={(e) =>setNewMember((s) => ({ ...s, dob: e.target.value })) }
                        className="tw-border tw-rounded-lg tw-px-3 tw-py-2 tw-h-[35px] 
                                  focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-blue-300 focus:tw-border-blue-800"
                      />
                    </div>
                    <div className="tw-flex tw-flex-col">
                      <label className="tw-text-lg tw-font-medium tw-text-left">Bệnh nền / tiền sử bệnh</label>
                      <textarea
                        placeholder="VD: Tăng huyết áp, tiểu đường..."
                        value={newMember?.chronic_note || ""}
                        onChange={(e) => setNewMember((s) => ({ ...s, chronic_note: e.target.value }))}
                        className="tw-border tw-rounded-lg tw-px-3 tw-py-2 tw-min-h-[50px] tw-resize-none 
                          focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-blue-300 focus:tw-border-blue-800"
                      />
                     </div>
                  </div>
                  <div className="tw-flex tw-justify-between tw-items-center tw-mt-2">
                    <span className="tw-text-sm tw-italic tw-text-orange-500">
                      {editingMemberId
                        ? "Đang chỉnh sửa thành viên hiện tại"
                        : "Đang thêm mới thành viên"}
                    </span>
                    <button type="button"
                      onClick={() => {
                        setNewMember({});
                        setEditingMemberId(null);
                      }} className="tw-text-sm tw-text-red-600 tw-underline hover:tw-text-red-700">
                      Xóa bộ lọc
                    </button>
                  </div>

                  <button className="tw-bg-green-600 tw-text-white tw-px-6 tw-py-2 tw-rounded-full tw-mt-6"
                    onClick={handleSaveMember}>
                    {editingMemberId ? "Cập nhật thành viên" : "Thêm thành viên mới"}
                  </button>
                </div>

                {/* Danh sách thành viên */}
                <div className="tw-space-y-4">
                  {membersList
                    .filter((f) => f && (f.name || f.relation || f.dob))
                    .map((f) => (
                      <div key={f.id} className="tw-border tw-rounded tw-p-2">
                        <div className="tw-flex tw-justify-between tw-items-center ">
                          {/* Thông tin + toggle */}
                          <div className="tw-flex-1 tw-cursor-pointer tw-text-left tw-text-blue-600"
                            onClick={() => {
                              const updated = membersList.map((m) => m.id === f.id ? { ...m, expanded: !m.expanded } : m );
                              setCustomers((prev) =>
                                prev.map((c) => c.id === customer.id ? { ...c, members: updated } : c )
                              );
                              setSelectedCustomer((prev) => ({
                                ...prev,
                                members: updated,
                              }));
                              // Đổ dữ liệu lên form + vào chế độ chỉnh sửa
                              setNewMember({
                                id: f.id,
                                nickname: f.nickname || "",
                                name: f.name || f.full_name || "",
                                relation: f.relation || "",
                                sex: mapCodeToLabel(f.sex || f.gender || "Khác"),
                                dob: f.dob || f.date_of_birth || "",
                                chronic_note: f.chronic_note || "",
                              });
                              setEditingMemberId(f.id);
                            }} >
                            {(f.name || f.full_name) ?? ""} - {f.relation} -{" "}
                            {formatDate(f.dob || f.date_of_birth)}
                          </div>
                          {/* Nút xóa */}
                          <button
                            onClick={(e) => { e.stopPropagation(); setDeleteModal({ open: true, member: f }); }}
                            className="tw-text-red-500 hover:tw-text-red-700 tw-ml-3" title="Xóa thành viên" >
                            <i className="fa-solid fa-trash"></i>
                          </button>

                          {/* Icon expand */}
                          <div  className="tw-ml-3 tw-cursor-pointer"
                            onClick={() => {
                              const updated = membersList.map((m) => m.id === f.id ? { ...m, expanded: !m.expanded } : m );
                              setCustomers((prev) =>  prev.map((c) => c.id === customer.id ? { ...c, members: updated } : c ) );
                              setSelectedCustomer((prev) => ({ ...prev, members: updated, }));
                            }} >
                            {f.expanded ? ( <i className="fa-solid fa-angles-up  tw-text-blue-500"></i> ) : (
                              <i className="fa-solid fa-angles-down tw-text-blue-500"></i>
                            )}
                          </div>
                        </div>

                        {f.expanded && (
                          <div className="tw-mt-4 tw-space-y-2 tw-space-x-[100px]">
                            <div className="tw-flex tw-justify-start ">
                              <div className="tw-flex tw-items-center tw-gap-[15px] tw-ml-[100px]">
                                <span className="tw-w-[120px] tw-font-medium tw-text-left"> Tên thân mật: </span>
                                <span className="tw-text-left">{f.nickname}</span>
                              </div>
                            </div>
                            <div className="tw-flex tw-justify-start">
                              <div className="tw-flex tw-items-center tw-gap-[15px]">
                                <span className="tw-w-[120px] tw-font-medium tw-text-left">  Họ và tên:  </span>
                                <span className="tw-text-left">{f.name}</span>
                              </div>
                            </div>
                            <div className="tw-flex tw-justify-start">
                              <div className="tw-flex tw-items-center tw-gap-[15px]">
                                <span className="tw-w-[120px] tw-font-medium tw-text-left">  Ngày sinh:  </span>
                                <span className="tw-text-left"> {formatDate(f.dob)} </span>
                              </div>
                            </div>
                            <div className="tw-flex tw-justify-start">
                              <div className="tw-flex tw-items-center tw-gap-[15px]">
                                <span className="tw-w-[120px] tw-font-medium tw-text-left"> Giới tính:  </span>
                                <span className="tw-text-left">{f.sex}</span>
                              </div>
                            </div>
                            <div className="tw-flex tw-justify-start">
                              <div className="tw-flex tw-items-center tw-gap-[15px]">
                                <span className="tw-w-[120px] tw-font-medium tw-text-left"> Mối quan hệ: </span>
                                <span className="tw-text-left">{f.relation}</span>
                              </div>
                            </div>
                            <div className="tw-flex tw-justify-start">
                              <div className="tw-flex tw-items-center tw-gap-[15px]">
                                <span className="tw-w-[120px] tw-font-medium tw-text-left">Bệnh nền:</span>
                                <span className="tw-text-left">{f.chronic_note || "Không ghi nhận"}</span>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                </div>
              </div>
            )}

            {detailTab === "appointments" && (
              <div className="tw-space-y-4 tw-h-full tw-overflow-y-auto  tw-scrollbar-hide tw-pr-2">
                <p className="tw-font-semibold tw-text-[17px]  tw-text-blue-400">
                  <i className="fa-solid fa-calendar-week  tw-mr-3"></i> Tạo mới lịch hẹn
                </p>
                <div className="tw-space-y-4">
                  {/* --- TẠO LỊCH HẸN MỚI (đa vắc xin) --- */}
                  <div className="tw-border-t tw-pt-3">
                    <div className="tw-grid lg:tw-grid-cols-2 tw-grid-cols-1 tw-gap-6">
                      {/* Ngày */}
                      <div className="tw-flex tw-flex-col">
                        <label className="tw-text-lg tw-font-medium tw-mb-2">Ngày</label>
                        <input type="date"  min={new Date().toISOString().split("T")[0]}  value={newAppointment.date}
                          onChange={(e) => setNewAppointment((s) => ({ ...s, date: e.target.value }))  }
                          className="tw-border tw-rounded-lg tw-px-3 tw-py-2 tw-text-lg focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-blue-300 focus:tw-border-blue-800"
                        />
                      </div>

                      {/* Người tiêm */}
                      <div className="tw-flex tw-flex-col">
                        <label className="tw-text-lg tw-font-medium tw-mb-2">Người tiêm</label>
                        <Dropdown  value={newAppointment.memberId}  options={memberSelectOptions}
                          onChange={(val) => setNewAppointment((s) => ({ ...s, memberId: val }))}
                          className="tw-text-lg "
                        />
                        {newAppointment.memberId &&  !!ageFiltered.ageText &&  ageFiltered.memberId === newAppointment.memberId && (
                            <div className="tw-text-sm tw-text-pink-700 tw-mt-1">
                              Tuổi hiện tại: <span className="tw-font-semibold">{ageFiltered.ageText}</span>.  
                              Danh sách bệnh và vắc xin bên dưới đã được lọc theo độ tuổi.
                            </div>
                        )}
                        {ageFiltered.loading && (
                          <div className="tw-text-xs tw-text-gray-400 tw-mt-1">
                            Đang tính toán vắc xin phù hợp theo tuổi...
                          </div>
                        )}
                      </div>
                      
                    </div>

                    {/* Danh sách ITEMS vắc xin */}
                    <div className="tw-mt-2 tw-space-y-4">
                      <div className="tw-flex tw-items-center tw-justify-between">
                        <div className="tw-flex tw-items-baseline tw-gap-3">
                          <h6 className="tw-text-lg tw-font-semibold">Danh sách vắc xin sẽ tiêm</h6>
                          <span className="tw-text-base tw-text-gray-500">
                            Tổng tiền: <strong className="tw-text-orange-600">{formatMoney(newAppointment.total)} VNĐ</strong>
                          </span>
                        </div>

                        <button type="button"
                          onClick={() => {
                            if (!newAppointment.memberId) {
                              toast.error("Vui lòng chọn người tiêm trước khi thêm vắc xin");
                              return;
                            }
                            setNewAppointment((s) => ({
                              ...s,
                              items: [
                                ...(s.items || []),
                                {
                                  diseaseId: "",
                                  vaccineId: "",
                                  vaccineName: "",
                                  price: "",
                                  doseQty: 1,
                                  doseWarn: false,
                                  maxDoseByRecord: undefined,
                                  protocolInfo: null,
                                  nextDoseDate: null,
                                },
                              ],
                            }));

                          }} className="tw-inline-flex tw-items-center tw-gap-2 tw-bg-cyan-500 hover:tw-bg-cyan-600 tw-text-white tw-px-4 tw-py-2 tw-rounded-full tw-shadow" >
                          <i className="fa-solid fa-square-plus"></i>
                          Thêm vắc xin
                        </button>
                      </div>
                      {!newAppointment.items?.length && (
                        <div className="tw-text-gray-500 tw-italic tw-text-base">  Chưa có vắc xin nào — hãy bấm “ + Thêm vắc xin”. </div>
                      )}

                      {/* Items */}
                     {(newAppointment.items || []).map((it, idx) => {
                         const itemSubtotal =  Number(it.price || 0) * Number(it.doseQty || 1);
                        // Tổng số mũi của phác đồ cho vắc xin này
                        const totalProtocolDoses = it.protocolInfo?.total ?? (it.vaccineId ? findVaccine(it.vaccineId)?.doses_required : null);
                        const remainingByRecord = it.maxDoseByRecord;
                        const regimenMax = Number(it.maxDoseByRecord ?? getMaxDose(it.vaccineId) ?? 1) || 1;
                        // Số mũi đã tiêm 
                        const usedDoses =
                          it.protocolInfo?.used != null
                            ? it.protocolInfo.used
                            : totalProtocolDoses != null && remainingByRecord != null
                            ? totalProtocolDoses - remainingByRecord
                            : null;
                        // Nếu chưa tiêm mũi nào -> chỉ cho đặt tối đa 1 mũi trong 1 lịch hẹn
                        let uiMaxDose = regimenMax;
                        if (usedDoses === 0 || usedDoses == null) {
                          uiMaxDose = 1;
                        }
                        //  ngày mũi tiếp theo 
                        const nextDoseDateFormatted = it.nextDoseDate ? new Date(it.nextDoseDate).toLocaleDateString("vi-VN") : null;
                        const showNextSuggestion = nextDoseDateFormatted && usedDoses != null && usedDoses > 0;
                        //  TÍNH DS VACCINE CHO ITEM NÀY
                        const vaccinesForItem =
                          ageFiltered.memberId === newAppointment.memberId
                          ? (
                          // ĐÃ có data theo tuổi (kể cả rỗng)
                            ageFiltered.vaccines.length
                              ? (
                                  it.diseaseId
                                    ? ageFiltered.vaccines.filter(
                                        (v) => String(v.disease?.id) === String(it.diseaseId)
                                      )
                                    : ageFiltered.vaccines
                                )
                              : [] // API nói "0 vaccine phù hợp" → tôn trọng, không fallback
                          )
                        : (
                            // CHƯA có data theo tuổi (chưa chọn member, hoặc effect chưa chạy)
                            it.diseaseId
                              ? vaccinesByDiseaseId(it.diseaseId)
                              : vaccinesDb
                          );

                        return (
                          <div key={idx} className="tw-rounded-xl tw-border tw-bg-[#ffefe5] tw-shadow-sm tw-ring-1 tw-ring-gray-100 tw-p-4 tw-text-left" >
                            <div className="tw-flex tw-items-start tw-justify-between tw-mb-2">
                              <div className="tw-shrink-0 tw-w-6 tw-h-6 tw-rounded-full tw-text-base tw-bg-yellow-100 tw-text-yellow-700 tw-flex tw-items-center tw-justify-center tw-font-semibold tw-mt-[2px]">
                                {idx + 1}
                              </div>
                              <button  type="button"
                                onClick={() => {
                                  setNewAppointment((s) => {
                                    const clone = [...(s.items || [])];
                                    clone.splice(idx, 1);
                                    return { ...s, items: clone };
                                  });
                                }}
                                className="tw-text-red-600 hover:tw-text-red-700 tw-p-1 tw-mt-[1px]" title="Xoá vắc xin này">
                                <i className="fa-solid fa-trash tw-text-lg" />
                              </button>
                            </div>

                            <div className="tw-grid md:tw-grid-cols-2 tw-grid-cols-1 tw-gap-4">
                              {/* Phòng bệnh */}
                              <div>
                                <label className="tw-block tw-text-base tw-font-medium tw-text-gray-700 tw-mb-1"> Phòng bệnh  </label>
                                <Dropdown  disabled={!newAppointment.memberId || loadingDicts}
                                  value={it.diseaseId} options={ageDiseaseOptions} 
                                  onChange={(val) => {
                                    setNewAppointment((s) => {
                                      const clone = [...(s.items || [])];
                                      clone[idx] = {
                                        diseaseId: val,
                                        vaccineId: "",
                                        vaccineName: "",
                                        price: "",
                                        doseQty: 1,
                                        doseWarn: false,
                                        maxDoseByRecord: undefined,
                                        protocolInfo: null,
                                        nextDoseDate: null,
                                      };
                                      return { ...s, items: clone };
                                    });
                                  }}  className="tw-text-base"
                                />
                                {loadingDicts && ( <div className="tw-text-xs tw-text-gray-400 tw-mt-1"> Đang tải danh mục… </div> )}
                                {ageFiltered.memberId === newAppointment.memberId &&
                                  !ageFiltered.loading && !ageFiltered.vaccines.length && (
                                    <div className="tw-text-xs tw-text-red-500 tw-mt-1">
                                      Không tìm thấy vắc xin phù hợp với độ tuổi của người tiêm.
                                    </div>
                                  )}
                              </div>

                              {/* Vắc xin */}
                              <div>
                                <label className="tw-block tw-text-base tw-font-medium tw-text-gray-700 tw-mb-1"> Vắc xin </label>
                               <Dropdown
                                  disabled={!newAppointment.memberId || !it.diseaseId || loadingDicts}
                                  value={it.vaccineId}
                                  options={vaccinesForItem.map((v) => ({
                                    value: String(v.id),
                                    label: `${v.name} (${formatMoney(v.price || 0)} đ)`,
                                    title: v.name,
                                  }))}
                                  onChange={async (val) => {
                                    const v = vaccinesForItem.find((x) => String(x.id) === String(val));
                                    // 1. Cập nhật thông tin cơ bản ngay
                                    setNewAppointment((s) => {
                                      const clone = [...(s.items || [])];
                                      clone[idx] = {
                                        ...clone[idx],
                                        vaccineId: String(v?.id || ""),
                                        vaccineName: v?.name || "",
                                        price: v?.price || 0,
                                        doseQty: 1,
                                        doseWarn: false,
                                        maxDoseByRecord: undefined,
                                        protocolInfo: null,
                                        nextDoseDate: null,
                                      };
                                      return { ...s, items: clone };
                                    });
                                    // 2. Nếu chưa chọn người tiêm thì thôi
                                    if (!newAppointment.memberId || !v?.id) return;
                                    try {
                                      const info = await getRemainingDoses(newAppointment.memberId, v.id);
                                      const remaining = Math.max(info?.remaining ?? 0, 0);
                                      if (remaining <= 0) {
                                        toast.error(
                                          `Vắc xin ${v.name}: khách đã tiêm đủ phác đồ, không thể đặt thêm mũi.`
                                        );
                                        // reset lại vaccine ở item này
                                        setNewAppointment((s) => {
                                          const clone = [...(s.items || [])];
                                          const current = clone[idx];
                                          if (!current || current.vaccineId !== String(v.id)) return s;
                                          clone[idx] = {
                                            ...current,
                                            vaccineId: "",
                                            vaccineName: "",
                                            price: "",
                                            doseQty: 1,
                                            maxDoseByRecord: 0,
                                            protocolInfo: info || null,
                                            nextDoseDate: info?.next_dose_date || null,
                                            doseWarn: false,
                                          };
                                          return { ...s, items: clone };
                                        });
                                        return;
                                      }
                                      setNewAppointment((s) => {
                                        const clone = [...(s.items || [])];
                                        const current = clone[idx];
                                        if (!current || current.vaccineId !== String(v.id)) return s;
                                        const showWarn = remaining === 1; //  nếu chỉ còn 1 mũi thì bật cảnh báo ngay
                                        clone[idx] = {
                                          ...current,
                                          maxDoseByRecord: remaining,
                                          protocolInfo: info || null,
                                          nextDoseDate: info?.next_dose_date || info?.next_date || null,
                                          doseQty: 1,
                                          doseWarn: showWarn,      //  bật cảnh báo khi còn tối đa 1 mũi
                                        };
                                        return { ...s, items: clone };
                                      });
                                    } catch (err) {
                                      console.error(err?.response?.data || err);
                                      // fallback giống BookingForm: vẫn cho đặt 1 mũi
                                      setNewAppointment((s) => {
                                        const clone = [...(s.items || [])];
                                        const current = clone[idx];
                                        if (!current || current.vaccineId !== String(v.id)) return s;
                                        clone[idx] = {
                                          ...current,
                                          maxDoseByRecord: 1,
                                          protocolInfo: null,
                                          nextDoseDate: null,
                                          doseQty: 1,
                                          doseWarn: true, 
                                        };
                                        return { ...s, items: clone };
                                      });
                                    }
                                  }}

                                  className="tw-text-base"
                                />

                                {!it.diseaseId && ( <div className="tw-text-xs tw-text-orange-500 tw-mt-1"> Chọn phòng bệnh trước để lọc vắc xin phù hợp. </div> )}
                              </div>
                            </div>

                            <div className=" tw-grid md:tw-grid-cols-3 tw-grid-cols-1 tw-gap-4">
                              <div className="md:tw-col-span-1">
                                <label className="tw-block tw-text-base tw-font-medium tw-text-gray-700 tw-mb-1">  Đơn giá  </label>
                                <input  readOnly  value={it.price ? `${formatMoney(it.price)} VNĐ` : ""} placeholder="—"
                                  className="tw-w-full tw-border tw-rounded-lg tw-px-3 tw-py-2 tw-bg-cyan-100 tw-text-base focus:tw-outline-none"
                                />
                              </div>
                              <div className="md:tw-col-span-1">
                                <label className="tw-block tw-text-base tw-font-medium tw-text-gray-700 tw-mb-1">
                                  Số mũi
                                </label>
                                <QuantityPicker
                                  value={Number(it.doseQty || 1)}  min={1}
                                  max={uiMaxDose}  
                                  disabled={!it.vaccineId}
                                  onChange={(val) => {
                                    setNewAppointment((s) => {
                                      const clone = [...(s.items || [])];
                                      const current = clone[idx];
                                      if (!current) return s;
                                      const maxAllowed = uiMaxDose;
                                      const rawVal = Number(val || 1);
                                      const safeVal = Math.max(1, Math.min(maxAllowed, rawVal));
                                      // Hiện cảnh báo khi user cố vượt hoặc vừa chạm MAX
                                      const showWarn = safeVal >= maxAllowed;
                                      clone[idx] = {
                                        ...current,
                                        doseQty: safeVal,
                                        doseWarn: showWarn,  
                                      };
                                      return { ...s, items: clone };
                                    });
                                  }}
                                />
                              </div>
                              <div className="md:tw-col-span-1 tw-ml-10 tw-text-center">
                                <div>
                                  <div className="tw-text-base tw-text-gray-600 tw-mt-2">Tạm tính</div>
                                  <div className="tw-text-base tw-font-semibold tw-text-orange-500">  {formatMoney(itemSubtotal)} VNĐ </div>
                                </div>
                              </div>  
                              {(totalProtocolDoses != null || (usedDoses != null && remainingByRecord != null) || !!nextDoseDateFormatted) &&  (
                                <div className="tw-col-span-full tw-mt-2">
                                  <div className="tw-flex tw-items-center tw-gap-2 tw-rounded-lg tw-border tw-border-amber-300 tw-bg-amber-50 tw-px-3 tw-py-2 tw-shadow-sm">
                                    <span className="tw-inline-flex tw-h-6 tw-w-6 tw-items-center tw-justify-center tw-rounded-full tw-bg-amber-100 tw-text-amber-700">
                                      <i className="fa-solid fa-circle-exclamation tw-text-[10px]" />
                                    </span>

                                    <div className="tw-flex tw-flex-col tw-gap-0.5">
                                      <p className="tw-text-sm tw-text-amber-800">
                                        {totalProtocolDoses != null && (
                                          <>
                                            Phác đồ vắc xin này gồm tối đa{" "}
                                            <span className="tw-font-semibold">{totalProtocolDoses} mũi</span>
                                            {usedDoses != null && remainingByRecord != null ? ", " : "."}
                                          </>
                                        )}
                                        {usedDoses != null &&
                                          totalProtocolDoses != null &&
                                          remainingByRecord != null && (
                                            <>
                                              {" "}
                                              {remainingByRecord <= 0 || usedDoses >= totalProtocolDoses ? (
                                                // ĐÃ ĐỦ PHÁC ĐỒ
                                                <>
                                                  Khách hàng đã tiêm{" "}
                                                  <span className="tw-font-semibold"> {usedDoses}/{totalProtocolDoses} mũi</span>{" "}
                                                  và đã <span className="tw-font-semibold">hoàn thành phác đồ tiêm.</span>
                                                </>
                                              ) : (
                                                // CHƯA ĐỦ PHÁC ĐỒ
                                                <>
                                                  Khách hàng đã tiêm{" "}
                                                  <span className="tw-font-semibold"> {usedDoses}/{totalProtocolDoses} mũi </span>
                                                  , còn lại{" "}
                                                  <span className="tw-font-semibold"> {remainingByRecord} mũi chưa tiêm.</span>
                                                </>
                                              )}
                                            </>
                                          )}

                                      </p>
                                     {showNextSuggestion && (
                                        <p className="tw-text-[10px] tw-text-amber-700">
                                          Gợi ý: mũi tiếp theo nên tiêm từ ngày{" "}
                                          <span className="tw-font-semibold"> {nextDoseDateFormatted}</span>.
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              )}

                            </div>

                          </div>
                        );
                      })}
                      <div className="tw-flex tw-justify-center tw-pt-2 ">
                        <button  type="button" disabled={creating}  onClick={handleCreateAppointments}   title="Tạo lịch hẹn"
                          className="tw-inline-flex tw-items-center tw-gap-2 tw-px-5 tw-py-2 tw-rounded-full tw-shadow tw-bg-green-600 hover:tw-bg-green-700 tw-text-white disabled:tw-opacity-70" >
                          <i className="fa-solid fa-calendar-check"></i>
                          {creating ? "Đang tạo..." : "Tạo lịch hẹn"}
                        </button>
                      </div>
                    </div>

                  </div>

                  {/* Danh sách lịch hẹn */}
                  <div  className="tw-max-h-[300px] tw-overflow-y-auto tw-pr-2 tw-space-y-4 tw-mb-6 tw-mt-8 tw-border-t tw-pt-6 
                                    tw-scrollbar-thin tw-scrollbar-thumb-gray-300 tw-scrollbar-track-transparent
                                    [&::-webkit-scrollbar]:tw-h-2 [&::-webkit-scrollbar]:tw-w-2 [&::-webkit-scrollbar-thumb]:tw-rounded-full
                                    [&::-webkit-scrollbar-track]:tw-bg-gray-100 [&::-webkit-scrollbar-thumb]:tw-bg-gradient-to-b
                                  [&::-webkit-scrollbar-thumb]:tw-from-cyan-400 [&::-webkit-scrollbar-thumb]:tw-to-blue-400" >
                    {normalizedAppointments.length > 0 ? (
                      <div className="tw-space-y-4">
                        {normalizedAppointments.map((a) => (
                          <div  key={a.id} className="tw-p-4 tw-border tw-rounded-xl tw-bg-yellow-100 tw-shadow-sm hover:tw-shadow-md tw-transition">
                            <div className="tw-flex tw-justify-between tw-items-start">
                              <div>
                                <div className="tw-font-semibold tw-text-lg tw-text-gray-800">
                                  {a.vaccine} <span className="tw-text-gray-400"></span>
                                </div>
                                <div className="tw-text-sm tw-text-gray-600 tw-mt-1"> Ngày hẹn : {formatDate(a.date)} </div>
                                <div className="tw-text-sm tw-text-indigo-700 tw-mt-1">
                                  Người tiêm: <strong>{a.memberName || "— chưa rõ —"}</strong>
                                </div>
                                <span className={`tw-inline-block tw-mt-2 tw-text-base tw-font-semibold tw-px-3 tw-py-1 tw-rounded-full
                                 ${ a.status === "pending"   ? "tw-bg-orange-100 tw-text-orange-700" :
                                  a.status === "confirmed" ? "tw-bg-green-100 tw-text-green-700" :
                                  a.status === "cancelled" ? "tw-bg-red-100 tw-text-red-700" :
                                  a.status === "completed" ? "tw-bg-blue-100 tw-text-blue-600" :
                                                              "tw-bg-gray-100 tw-text-gray-600"
                                }`}>
                                  {a.status === "pending"   ? "Chờ xác nhận" :
                                  a.status === "confirmed" ? "Đã xác nhận" :
                                  a.status === "cancelled" ? "Đã hủy" :
                                  a.status === "completed" ? "Đã tiêm xong" :
                                  a.status}
                                </span>
                              </div>

                              <div className="tw-flex tw-gap-2">
                                {a.status === "pending" && (
                                <>
                                  <button onClick={() => openConfirmAppointment("confirm", a)}
                                    className="tw-bg-blue-600 hover:tw-bg-blue-700 tw-text-white tw-text-sm tw-px-4 tw-py-2 tw-rounded-lg tw-shadow">
                                    Xác nhận
                                  </button>

                                  <button onClick={() => openConfirmAppointment("cancel", a)}
                                    className="tw-bg-red-600 hover:tw-bg-red-700 tw-text-white tw-text-sm tw-px-4 tw-py-2 tw-rounded-lg tw-shadow">
                                    Hủy
                                  </button>

                                  <button onClick={() => handlePrintConfirmation(a)}
                                    className="tw-bg-indigo-500 hover:tw-bg-indigo-600 tw-text-white tw-text-sm tw-px-3 tw-py-2 tw-rounded-lg tw-shadow">
                                    <i className="fa-solid fa-print tw-mr-1" />
                                    In phiếu
                                  </button>
                                </>
                              )}

                              {a.status === "confirmed" && (
                                <button onClick={() => openConfirmAppointment("cancel", a)}
                                  className="tw-bg-red-600 hover:tw-bg-red-700 tw-text-white tw-text-sm tw-px-4 tw-py-2 tw-rounded-lg tw-shadow">
                                  Hủy
                                </button>
                              )}

                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="tw-text-center tw-text-red-500 tw-font-medium tw-py-4 tw-italic"> Chưa có lịch hẹn nào </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {detailTab === "history" && (
              <div className="tw-space-y-6 tw-h-full tw-overflow-y-auto  tw-scrollbar-hide tw-pr-2">
                <p className="tw-font-bold tw-text-[17px] tw-text-blue-400 tw-flex tw-items-center tw-justify-center tw-gap-2 tw-text-center">
                  <i className="fa-solid fa-syringe"></i>
                  Lịch sử tiêm <span className="tw-text-xl tw-mt-2">(Ghi nhận mũi tiêm)</span>
                </p>
                <div className="tw-border-t tw-pt-5">
                  <div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-3 tw-gap-3">
                    {/* Người tiêm */}
                    <div className="tw-flex tw-flex-col">
                      <label className="tw-text-lg tw-font-medium tw-mb-2">Người tiêm</label>
                      <Dropdown
                        value={newVaccineRecord.memberId}
                        options={memberSelectOptions}
                        onChange={(val) =>
                          setNewVaccineRecord((s) => ({ ...s, memberId: val }))
                        }
                        className="tw-text-lg"
                      />
                      {newVaccineRecord.memberId &&
                        !!ageFiltered.ageText &&
                        ageFiltered.memberId === newVaccineRecord.memberId && (
                          <div className="tw-text-sm tw-text-pink-700 tw-mt-1">
                            Tuổi hiện tại:{" "}
                            <span className="tw-font-semibold">{ageFiltered.ageText}</span>. Danh
                            sách phòng bệnh bên dưới đã được lọc theo độ tuổi.
                          </div>
                      )}
                      {ageFiltered.loading &&
                        ageFiltered.memberId === newVaccineRecord.memberId && (
                          <div className="tw-text-xs tw-text-gray-400 tw-mt-1">
                            Đang tính toán bệnh / vắc xin phù hợp theo tuổi...
                          </div>
                      )}
                    </div>

                    {/* Ngày tiêm */}
                    <div className="tw-flex tw-flex-col">
                      <label className="tw-text-lg tw-font-medium tw-mb-2">Ngày tiêm</label>
                      <input  type="date"  max={new Date().toISOString().split("T")[0]}
                        value={newVaccineRecord.date || ""}
                        onChange={(e) => setNewVaccineRecord((s) => ({ ...s, date: e.target.value })) }
                        className="tw-border tw-rounded-lg tw-px-3 tw-py-2 tw-h-[35px] tw-text-lg focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-blue-300 focus:tw-border-blue-800"
                      />
                    </div>

                    {/* Phòng bệnh */}
                    <div className="tw-flex tw-flex-col">
                      <label className="tw-text-lg tw-font-medium tw-mb-2">Phòng bệnh</label>
                      {/* <input value={newVaccineRecord.disease || ""}   placeholder="VD: Cúm, Viêm gan B..."
                          onChange={(e) => setNewVaccineRecord(s => ({ ...s, disease: e.target.value }))}
                          className="tw-border tw-rounded-lg tw-px-3 tw-py-2 tw-h-[35px] tw-text-lg focus:tw-outline-none  focus:tw-ring-2 focus:tw-ring-blue-300 focus:tw-border-blue-800"
                        /> */}
                       <Dropdown
                          disabled={!newVaccineRecord.memberId || loadingDicts}
                          value={newVaccineRecord.diseaseId}
                          options={ageDiseaseOptions}
                          onChange={(val) => {
                            const diseaseLabel =  ageDiseaseOptions.find((d) => d.value === String(val))?.label ||  "";
                            const relatedVaccines = vaccinesByDiseaseId(val);
                            const maxDoseByProtocol = relatedVaccines.length
                              ? relatedVaccines.reduce(
                                  (max, v) =>
                                    Math.max( max, Number(  v.doses_required != null ? v.doses_required : 1 ) ), 1
                                ) : 5;

                            let suggestedDose = "";
                            if (newVaccineRecord.memberId) {
                              const historySame = historyList.filter((h) => {
                                const mid = h.member_id;
                                const dId =
                                  h.disease_id ??
                                  (h.disease && h.disease.id != null ? h.disease.id : null);
                                return (
                                  String(mid || "") === String(newVaccineRecord.memberId) &&
                                  String(dId || "") === String(val)
                                );
                              });
                              const maxUsedDose = historySame.reduce(
                                (max, h) => Math.max(max, Number(h.dose || 0)),
                                0
                              );
                              if (maxUsedDose < maxDoseByProtocol && maxUsedDose >= 0) {
                                suggestedDose = String(maxUsedDose + 1);
                              }
                            }
                            setNewVaccineRecord((s) => ({
                              ...s,
                              diseaseId: val,
                              disease: diseaseLabel,
                              maxDose: maxDoseByProtocol,
                              dose: suggestedDose || "",
                            }));
                          }}
                          className="tw-text-lg"
                        />

                        {loadingDicts && (
                          <div className="tw-text-xs tw-text-gray-400 tw-mt-1">
                            Đang tải danh mục…
                          </div>
                        )}

                        {newVaccineRecord.memberId &&
                          ageFiltered.memberId === newVaccineRecord.memberId &&
                          !ageFiltered.loading &&
                          !ageFiltered.vaccines.length && (
                            <div className="tw-text-xs tw-text-red-500 tw-mt-1">
                              Không tìm thấy phòng bệnh / vắc xin phù hợp với độ tuổi của người tiêm.
                            </div>
                        )}
                    </div>

                    {/* Vắc xin */}
                    <div className="tw-flex tw-flex-col">
                      <label className="tw-text-lg tw-font-medium tw-mb-2">Vắc xin</label>
                      <input  value={newVaccineRecord.vaccine || ""}  placeholder="VD: Influvac Tetra, Engerix-B..."
                        onChange={(e) => setNewVaccineRecord(s => ({ ...s, vaccine: e.target.value }))}
                        className="tw-border tw-rounded-lg tw-px-3 tw-py-2 tw-h-[35px] tw-text-lg focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-blue-300 focus:tw-border-blue-800"
                      />
                    </div>

                    {/* Mũi thứ */}
                    <div className="tw-flex tw-flex-col">
                      <label className="tw-text-lg tw-font-medium tw-mb-2">Mũi thứ</label>
                     <Dropdown
                        value={String(newVaccineRecord.dose || "")}
                        onChange={(val) => setNewVaccineRecord((s) => ({ ...s, dose: val }))}
                        options={Array.from(
                          { length: Math.max(1, newVaccineRecord.maxDose || 5) },
                          (_, i) => ({
                            value: String(i + 1),
                            label: `Mũi ${i + 1}`,
                          })
                        )}
                        className="tw-text-lg"
                      />
                    </div>
                   
                    {/* Cơ sở tiêm */}
                    <div className="tw-flex tw-flex-col">
                      <label className="tw-text-lg tw-font-medium tw-mb-2">Cơ sở tiêm</label>
                      <input value={newVaccineRecord.place || ""}  
                        onChange={(e) => setNewVaccineRecord((s) => ({ ...s, place: e.target.value }))}
                        className="tw-border tw-rounded-lg tw-px-3 tw-py-2 tw-text-lg focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-blue-300 focus:tw-border-blue-800"
                      />
                    </div>

                    {/* Ghi chú */}
                    <div className="tw-flex tw-flex-col md:tw-col-span-2">
                      <label className="tw-text-lg tw-font-medium tw-mb-2"> Ghi chú (Bệnh nền)</label>
                      <textarea value={newVaccineRecord.note || ""}
                        onChange={(e) =>  setNewVaccineRecord((s) => ({ ...s, note: e.target.value })) }
                        className="tw-border tw-rounded-lg tw-px-3 tw-py-2 tw-h-[40px] tw-text-lg tw-resize-none 
                        focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-blue-300 focus:tw-border-blue-800"
                      />
                    </div>
                  </div>

                  {/* Nút ghi nhận */}
                  <div className="tw-mt-4">
                    <button
                      onClick={async () => {
                        if (!newVaccineRecord.memberId) return toast.error("Chọn người tiêm");
                        if (!newVaccineRecord.date) return toast.error("Chọn ngày tiêm");
                        if (!newVaccineRecord.diseaseId) return toast.error("Chọn phòng bệnh");
                        if (!newVaccineRecord.vaccine) return toast.error("Nhập tên vắc xin");
                        // Chuẩn hoá member_id: nếu chọn "owner:ID" thì bạn có thể để BE hiểu là owner
                        const isOwner = String(newVaccineRecord.memberId).startsWith("owner:");
                        const member_id = isOwner ? null : Number(newVaccineRecord.memberId);
                        const placeInput = newVaccineRecord.place?.trim();
                        const placeToShow = placeInput || center?.name || "Trung tâm tiêm chủng Evaccine";
                        const rec = {
                          member_id,                       
                          date: newVaccineRecord.date,
                          disease_id: newVaccineRecord.diseaseId ? Number(newVaccineRecord.diseaseId)  : null,
                          disease: newVaccineRecord.disease || "",
                          vaccine: newVaccineRecord.vaccine,
                          dose: newVaccineRecord.dose ? Number(newVaccineRecord.dose) : null,
                          price: newVaccineRecord.price ? Number(newVaccineRecord.price) : null,
                          batch: newVaccineRecord.batch || "",
                          note: newVaccineRecord.note || "",
                          location: placeInput || center?.name || "Trung tâm tiêm chủng Evaccine",
                        };
                        try {
                          const created = await addHistory(customer.id, rec);
                          // Ưu tiên dùng member_name do BE trả về; nếu không có, suy ra từ dropdown
                          const pickedName = (() => {
                            if (created?.member_name) return created.member_name;
                            if (isOwner) return customer?.name || "Chủ hồ sơ";
                            const opt = (memberSelectOptions || []).find(x => x.value === String(newVaccineRecord.memberId));
                            return opt?.label || "";
                          })();
                          const record = {
                            id: created.id,
                            ...created,
                            member_name: created?.member_name ?? pickedName,
                            member_id: created?.member_id ?? member_id ?? null,
                            place: created?.place ?? created?.location ?? placeToShow,
                          };
                          setCustomers((prev) =>
                            prev.map((c) =>
                              c.id === customer.id ? { ...c, history: [record, ...(c.history || [])] } : c
                            )
                          );
                          setSelectedCustomer((prev) => ({ ...prev, history: [record, ...(prev.history || [])], }));
                          setNewVaccineRecord({
                            date: "",
                            memberId: "",
                            diseaseId: "",
                            disease: "",
                            vaccine: "",
                            dose: "",
                            maxDose: 5,
                            price: "",
                            place: "",
                            note: "",
                            batch: "",
                          });
                          toast.success("Đã ghi nhận mũi tiêm");
                        } catch (e) {
                          toast.error(e?.response?.data?.detail || "Ghi nhận thất bại");
                        }
                      }}
                      className="tw-bg-blue-600 hover:tw-bg-blue-700 tw-text-xl tw-text-white tw-font-medium tw-px-6 tw-py-2 tw-rounded-full tw-shadow" >
                      <i className="fa-solid fa-save tw-mr-2"></i>Ghi nhận
                    </button>
                  </div>
                </div>

                {/* Danh sách lịch sử */}
                <div className="tw-max-h-[300px] tw-overflow-y-auto tw-space-y-3 tw-pr-2 tw-mt-8 tw-border-t tw-pt-6">
                  {historyList.length === 0 ? (
                    <div className="tw-text-center tw-text-red-500 tw-font-medium tw-py-4 tw-italic">
                      Chưa ghi nhận danh sách lịch sử tiêm chủng
                    </div>
                  ) : (
                    historyList.map((h) => (
                      <div key={h.id}
                        className="tw-bg-cyan-50 tw-shadow-md tw-rounded-xl tw-p-4 tw-flex tw-justify-between tw-items-center hover:tw-shadow-lg tw-transition" >
                        <div>
                          <div className="tw-text-lg tw-font-semibold tw-text-gray-800"> {h.vaccine}
                            <span className="tw-text-lg tw-text-gray-500"> ({h.date})</span>
                          </div>
                          {!!h.member_name && (
                            <div className="tw-text-sm tw-text-indigo-700 tw-mt-1">
                              Người tiêm: <strong>{h.member_name}</strong>
                            </div>
                          )}
                          <div className="tw-text-base tw-text-gray-600 tw-mt-1">
                            <span className="tw-inline-block tw-bg-green-100 tw-px-3 tw-py-1 tw-rounded-full tw-mr-2">
                              🏥 {h.place || "Trung tâm tiêm chủng Evaccine"}
                            </span>
                          </div>
                          <div className="tw-text-base tw-text-gray-600 mt-1">
                            {h.batch && (
                              <div className="tw-text-sm tw-text-gray-600 tw-mt-1">
                                Số lô: <strong>{h.batch}</strong>
                              </div>
                            )}
                            <span className="tw-inline-block tw-bg-yellow-100 tw-px-3 tw-py-1 tw-rounded-full tw-mr-2">
                              Mũi thứ {h.dose || "-"}
                            </span>
                            <span className="tw-text-gray-500 tw-text-base">
                              📝 {h.note || "Không có ghi chú"}
                            </span>
                          </div>
                        </div>
                        <div className="tw-flex tw-items-center tw-gap-3 tw-justify-start tw-py-2">
                          <div className="tw-flex tw-items-center tw-justify-center tw-w-10 tw-h-10 tw-bg-green-100 tw-rounded-full">
                            <i className="fa-solid fa-check-circle tw-text-green-500 tw-text-xl"></i>
                          </div>
                          <button onClick={() => handlePrintPostInjection(h)}
                            className="tw-flex tw-items-center tw-bg-indigo-600 hover:tw-bg-indigo-700 
                                      tw-text-white tw-text-sm tw-px-4 tw-py-2 tw-rounded-full tw-shadow-sm 
                                      tw-transition-all tw-duration-200 tw-gap-2" >
                            <i className="fa-solid fa-print" />
                            <span>In phiếu sau tiêm</span>
                          </button>
                        </div>

                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            <DeleteCustomerModal  show={deleteModal.open}  customer={{ name: deleteModal.member?.name }}
              title="Xác nhận xóa thành viên"
              description={
                <>
                  Bạn có chắc muốn <strong>xóa</strong> thành viên{" "}
                  <strong>{deleteModal.member?.name}</strong> khỏi hồ sơ không? Hành động
                  này không thể hoàn tác.
                </>
              }
              confirmText={deleting ? "Đang xóa..." : "Xóa"}
              cancelText="Hủy"
              onClose={() => !deleting && setDeleteModal({ open: false, member: null }) }
              onConfirm={async () => {
                if (!deleteModal.member || deleting) return;
                setDeleting(true);
                try {
                  await staffDeleteMember(customer.id, deleteModal.member.id);
                  const updated = (customer.members || []).filter( (m) => m.id !== deleteModal.member.id );
                  setCustomers((prev) =>  prev.map((c) => c.id === customer.id ? { ...c, members: updated } : c ) );
                  setSelectedCustomer((prev) => ({ ...prev, members: updated }));
                  toast.success("Đã xóa thành viên");
                  setDeleteModal({ open: false, member: null });
                } catch (err) {
                  toast.error( err?.response?.data?.detail || "Không thể xóa thành viên" );
                } finally {
                  setDeleting(false);
                }
              }}
            />

            <ConfirmModal
              show={!!confirmAction} title="Xác nhận hành động"
              message={
                confirmAction && (
                  <>
                    {confirmAction.action === "confirm" && (
                      <>
                        Bạn có chắc muốn <b>xác nhận</b> lịch hẹn ngày{" "}
                        <b> {formatDate( confirmAction.appt.date || confirmAction.appt.appointment_date )}</b>{" "}
                        cho {" "} <b> {confirmAction.appt.memberName || customer.name || "khách hàng"}</b>{" "} không?
                      </>
                    )}
                    {confirmAction.action === "cancel" && (
                      <>
                        Bạn có chắc muốn <b>hủy</b> lịch hẹn ngày{" "}
                        <b>{formatDate( confirmAction.appt.date || confirmAction.appt.appointment_date )} </b>{" "}
                        cho{" "}<b>{confirmAction.appt.memberName || customer.name || "khách hàng"} </b>{" "} không?
                      </>
                    )}
                  </>
                )
              }
              onCancel={() => setConfirmAction(null)} onConfirm={doAppointmentAction}
            />

          </div>
        </div>
      </div>
    </div>
  );
}
