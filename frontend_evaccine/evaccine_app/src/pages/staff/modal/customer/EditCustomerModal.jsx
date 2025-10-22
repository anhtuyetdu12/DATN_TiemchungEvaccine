// DetailCustomerModal.jsx
import { useState, useEffect, useMemo } from "react";
import Dropdown from "../../../../components/Dropdown";
// import QuantityPicker from "../../../../components/QuantityPicker";
import DeleteCustomerModal from "./DeleteCustomerModal";
import {
  staffUpdateCustomerProfile,
  createAppointment,
  setAppointmentStatus,
  addHistory,
  staffCreateMember,
  staffDeleteMember,
} from "../../../../services/customerService";
import { toast } from "react-toastify";

export default function EditCustomerModal({
  show,
  customer,
  vaccines = [],
  onClose,
  center,
  onConfirmAppointment = () => {},
  onCancelAppointment = () => {},
  onAddAppointment = () => {},
  onRecordVaccine = () => {},
  setCustomers,
  setSelectedCustomer,
}) {
  // ---------------- Hooks: luôn khai báo trước mọi early return ----------------
  const [deleteModal, setDeleteModal] = useState({ open: false, member: null });
  const [deleting, setDeleting] = useState(false);

  const [newAppointment, setNewAppointment] = useState({
    date: "",
    memberId: "",
    items: [], // [{ disease, vaccineId, vaccineName, price, doseQty }]
    note: "",
    total: 0,
  });

  const [form, setForm] = useState({ doses: 1 });
  const [newMember, setNewMember] = useState({});
  const [detailTab, setDetailTab] = useState("info");
  const [newVaccineRecord, setNewVaccineRecord] = useState({
    date: "",
    vaccine: "",
    batch: "",
    note: "",
  });

  // Các list an toàn khi customer null
  const membersList = customer?.members ?? [];
  const appointmentsList = customer?.appointments ?? [];
  const historyList = customer?.history ?? [];

  // Options chọn người tiêm (owner + members) — dùng useMemo và KHÔNG đặt sau early return
  const memberSelectOptions = useMemo(() => {
    if (!customer) return [];
    const owner = {
      value: String(customer.id),
      label: `${customer.name} (Chủ TK)`,
    };
    const others = membersList.map((m) => ({
      value: String(m.id),
      label: `${m.name}${m.relation ? ` (${m.relation})` : ""}`,
    }));
    return [owner, ...others];
  }, [customer, membersList]);

  // danh sách mối quan hệ — cũng đưa lên trước guard
  const relationships = useMemo(
    () =>
      [
        "Vợ",
        "Chồng",
        "Con trai",
        "Con gái",
        "Bố",
        "Mẹ",
        "Ông ngoại",
        "Bà ngoại",
        "Ông nội",
        "Bà nội",
        "Bạn bè",
        "Khác",
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

  const mapCodeToLabel = (c) =>
    String(c).toLowerCase() === "male"
      ? "Nam"
      : String(c).toLowerCase() === "female"
      ? "Nữ"
      : "Khác";

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
      }));
    }
  }, [customer]);

  // diseaseOptions — PHẢI ở trước early return (là một Hook)
  const diseaseOptions = useMemo(
    () =>
      Array.from(
        new Set((vaccines || []).map((v) => v.disease || v.category).filter(Boolean))
      ).map((d) => ({ value: d, label: d })),
    [vaccines]
  );

  // ---------------- Early return: đặt SAU khi đã khai báo tất cả hooks ----------------
  if (!show || !customer) return null;

  // ---------------- Helpers / Options (non-hook) ----------------
  const genderOptions = [
    { label: "Nam", icon: "fa-solid fa-mars", color: "tw-text-teal-500" },
    { label: "Nữ", icon: "fa-solid fa-venus", color: "tw-text-pink-500" },
    { label: "Khác", icon: "fa-solid fa-venus-mars", color: "tw-text-orange-500" },
  ];

  const vaccinesByDisease = (d) =>
    (vaccines || []).filter((v) => (v.disease || v.category) === d);
  const findVaccine = (id) =>
    (vaccines || []).find((v) => String(v.id) === String(id));

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    const d = new Date(dateString);
    if (Number.isNaN(d.getTime())) return "-";
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    const toSave = {
      ...form,
      gender: mapLabelToCode(mapCodeToLabel(form.gender)),
    };
    try {
      await staffUpdateCustomerProfile(customer.id, {
        full_name: toSave.name,
        phone: toSave.phone,
        date_of_birth: toSave.dob,
        gender: toSave.gender, // "male" | "female" | "other"
      });

      setCustomers((prev) =>
        prev.map((c) =>
          c.id === customer.id
            ? {
                ...c,
                ...toSave,
                gender_text: mapCodeToLabel(toSave.gender),
                dob: toSave.dob,
              }
            : c
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

  // thêm lịch hẹn mới (version cũ — nếu còn dùng)
  const handleAddAppointment = async () => {
    if (!newAppointment.date || !newAppointment.vaccineId) return;
    try {
      const payload = {
        date: new Date(newAppointment.date).toISOString(),
        vaccineId: String(newAppointment.vaccineId),
        vaccine: newAppointment.vaccine,
        center: newAppointment.center || "",
        category: newAppointment.category || "",
        price: Number(newAppointment.price || 0),
        doses: Number(newAppointment.doses || 1),
        note: newAppointment.note || "",
      };
      const appt = await createAppointment(customer.id, payload);

      const updated = [...appointmentsList, appt];
      setCustomers((prev) =>
        prev.map((c) => (c.id === customer.id ? { ...c, appointments: updated } : c))
      );
      setSelectedCustomer((prev) => ({ ...prev, appointments: updated }));
      setNewAppointment({
        date: "",
        vaccine: "",
        vaccineId: "",
        center: "",
        category: "",
        price: "",
        doses: 1,
        note: "",
        total: 0,
      });
      toast.success("Đã tạo lịch hẹn");
    } catch (e) {
      toast.error(e?.detail || e?.response?.data?.detail || "Không tạo được lịch hẹn");
    }
  };

  // update trạng thái lịch (confirm/cancel)
  const updateAppointmentStatus = async (customerId, apptId, status) => {
    try {
      await setAppointmentStatus(customerId, apptId, status); // PATCH staff
      setCustomers((prev) =>
        prev.map((c) =>
          c.id !== customerId
            ? c
            : {
                ...c,
                appointments: (c.appointments || []).map((a) =>
                  a.id === apptId ? { ...a, status } : a
                ),
              }
        )
      );
      setSelectedCustomer((prev) =>
        !prev
          ? prev
          : {
              ...prev,
              appointments: (prev.appointments || []).map((a) =>
                a.id === apptId ? { ...a, status } : a
              ),
            }
      );
      toast.success(
        status === "confirmed"
          ? "Đã xác nhận lịch hẹn"
          : status === "cancelled"
          ? "Đã hủy lịch hẹn"
          : status === "completed"
          ? "Đã hoàn tất lịch hẹn"
          : "Đã cập nhật trạng thái"
      );
    } catch (e) {
      toast.error(e?.response?.data?.detail || "Cập nhật trạng thái thất bại");
    }
  };

  const handleConfirmAppointmentLocal = (customerId, apptId) => {
    updateAppointmentStatus(customerId, apptId, "confirmed");
    try {
      onConfirmAppointment(customerId, apptId);
    } catch {}
  };

  const handleCancelAppointmentLocal = (customerId, apptId) => {
    updateAppointmentStatus(customerId, apptId, "cancelled");
    try {
      onCancelAppointment(customerId, apptId);
    } catch {}
  };

  // ---------------- Render ----------------
  return (
    <div className="tw-fixed tw-inset-0 tw-flex tw-items-start tw-justify-center tw-pt-24 tw-bg-black/40">
      <div className="tw-bg-white tw-w-[700px] tw-h-[400px] tw-rounded-xl tw-shadow-xl tw-flex tw-flex-col tw-mt-[50px]">
        <div className="tw-flex tw-justify-between tw-items-center tw-p-4 tw-border-b">
          <div>
            <h3 className="tw-text-2xl tw-font-semibold">Hồ sơ: {customer.name}</h3>
            <div className="tw-text-lg tw-text-gray-500">
              {customer.code} — {customer.address}
            </div>
          </div>
          <button
            onClick={onClose}
            className="tw-text-white tw-bg-red-500 hover:tw-bg-red-600 tw-rounded-full tw-px-3 tw-py-2"
          >
            Đóng ✕
          </button>
        </div>

        <div className="tw-flex-1 tw-grid tw-grid-cols-3 tw-overflow-hidden ">
          <div className="tw-col-span-1 tw-border-r tw-p-4 ">
            <div className="tw-mb-4">
              <div className="tw-text-xl tw-text-gray-500">Thông tin cơ bản</div>
              <div className="tw-font-medium">{customer.name}</div>
              <div className="tw-text-lg tw-text-gray-600">
                {customer.phone} • {formatDate(customer.dob || customer.date_of_birth)} •{" "}
                {mapCodeToLabel(form.gender)}
              </div>
              <div className="tw-text-lg tw-text-gray-600">{customer.address}</div>
            </div>

            <div className="tw-space-y-4 tw-mt-20">
              <button
                onClick={() => setDetailTab("info")}
                className={`tw-w-full tw-text-left tw-py-2 tw-px-2 tw-rounded ${
                  detailTab === "info" ? "tw-bg-cyan-200" : "hover:tw-bg-blue-50"
                }`}
              >
                Thông tin
              </button>
              <button
                onClick={() => setDetailTab("family")}
                className={`tw-w-full tw-text-left tw-py-2 tw-px-2 tw-rounded ${
                  detailTab === "family" ? "tw-bg-cyan-200" : "hover:tw-bg-blue-50"
                }`}
              >
                Gia đình
              </button>
              <button
                onClick={() => setDetailTab("appointments")}
                className={`tw-w-full tw-text-left tw-py-2 tw-px-2 tw-rounded ${
                  detailTab === "appointments" ? "tw-bg-cyan-200" : "hover:tw-bg-blue-50"
                }`}
              >
                Lịch hẹn
              </button>
              <button
                onClick={() => setDetailTab("history")}
                className={`tw-w-full tw-text-left tw-py-2 tw-px-2 tw-rounded ${
                  detailTab === "history" ? "tw-bg-cyan-200" : "hover:tw-bg-blue-50"
                }`}
              >
                Lịch sử tiêm
              </button>
            </div>
            <button className="tw-bg-indigo-600 tw-text-white tw-px-4 tw-py-2 tw-rounded hover:tw-bg-indigo-500 tw-mt-10">
              In phiếu xác nhận
            </button>
          </div>

          <div className="tw-col-span-2 tw-p-4 tw-overflow-y-auto">
            {detailTab === "info" && (
              <div className="tw-space-y-2 tw-text-left">
                <p className="tw-font-semibold tw-text-[17px] tw-text-center tw-text-blue-400">
                  <i className="fa-solid fa-circle-info tw-mr-3"></i>Thông tin cơ bản
                </p>
                <div className="tw-grid tw-grid-cols-2 tw-gap-4">
                  <div>
                    <label className="tw-text-lg tw-font-medium">Mã khách hàng</label>
                    <div className="tw-border tw-rounded-lg tw-px-3 tw-py-2 tw-bg-gray-50">
                      {form.code}
                    </div>
                  </div>

                  <div>
                    <label className="tw-text-lg tw-font-medium">Họ tên</label>
                    <input
                      name="name"
                      value={form.name || ""}
                      onChange={handleChange}
                      className="tw-text-lg tw-w-full tw-border tw-rounded-lg tw-px-3 tw-py-2 
                              focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-blue-300 focus:tw-border-blue-800"
                    />
                  </div>
                </div>

                <div className="tw-grid tw-grid-cols-2 tw-gap-4">
                  <div>
                    <label className="tw-text-lg tw-font-medium">Số điện thoại</label>
                    <input
                      name="phone"
                      value={form.phone || ""}
                      onChange={handleChange}
                      className="tw-text-lg tw-w-full tw-border tw-rounded-lg tw-px-3 tw-py-2 
                              focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-blue-300 focus:tw-border-blue-800"
                    />
                  </div>

                  <div>
                    <label className="tw-text-lg tw-font-medium">Email</label>
                    <input
                      name="email"
                      value={form.email || ""}
                      onChange={handleChange}
                      className="tw-text-lg tw-w-full tw-border tw-rounded-lg tw-px-3 tw-py-2 
                              focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-blue-300 focus:tw-border-blue-800"
                    />
                  </div>
                </div>

                <div className="tw-grid tw-grid-cols-2 tw-gap-4">
                  <div>
                    <label className="tw-text-lg tw-font-medium">Địa chỉ</label>
                    <input
                      name="address"
                      value={form.address || ""}
                      onChange={handleChange}
                      className="tw-text-lg tw-w-full tw-border tw-rounded-lg tw-px-3 tw-py-2 
                              focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-blue-300 focus:tw-border-blue-800"
                    />
                  </div>

                  <div>
                    <label className="tw-text-lg tw-font-medium">Giới tính</label>
                    <div className="tw-grid tw-grid-cols-3 tw-gap-3 mt-2">
                      {genderOptions.map((opt) => {
                        const optCode = mapLabelToCode(opt.label);
                        const isActive = (form.gender || "").toLowerCase() === optCode;

                        return (
                          <button
                            key={opt.label}
                            type="button"
                            onClick={() =>
                              setForm((prev) => ({ ...prev, gender: optCode }))
                            }
                            className={`tw-flex tw-items-center tw-justify-center tw-gap-2 tw-px-3 tw-py-2 
                                        tw-rounded-lg tw-border tw-transition tw-text-lg
                                        ${
                                          isActive
                                            ? "tw-border-cyan-500 tw-bg-cyan-50"
                                            : "tw-border-gray-300 tw-bg-white"
                                        }`}
                          >
                            <i className={`${opt.icon} ${opt.color}`}></i>
                            <span>{opt.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className="tw-grid tw-grid-cols-2 tw-gap-4">
                  <div>
                    <label className="tw-text-lg tw-font-medium">Ngày sinh</label>
                    <input
                      name="dob"
                      type="date"
                      max={new Date().toISOString().split("T")[0]}
                      className="tw-text-lg tw-w-full tw-border tw-rounded-lg tw-px-3 tw-py-2 focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-blue-300 focus:tw-border-blue-800"
                      value={form.dob || ""}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <div className="tw-flex tw-justify-end tw-gap-3 tw-mt-6 tw-py-3">
                  <button
                    type="button"
                    onClick={onClose}
                    className="tw-bg-red-600 tw-text-white tw-text-xl tw-px-6 tw-py-2 tw-rounded-full hover:tw-bg-red-500"
                  >
                    Hủy
                  </button>
                  <button
                    type="button"
                    onClick={handleSave}
                    className="tw-bg-green-600 tw-text-white tw-text-xl tw-px-6 tw-py-2 tw-rounded-full hover:tw-bg-green-500"
                  >
                    Lưu thay đổi
                  </button>
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
                    <input
                      placeholder="Tên thân mật"
                      value={newMember?.nickname || ""}
                      onChange={(e) =>
                        setNewMember((s) => ({ ...s, nickname: e.target.value }))
                      }
                      className="tw-border tw-rounded-lg tw-px-3 tw-py-2 
                            focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-blue-300 focus:tw-border-blue-800"
                    />
                    <input
                      placeholder="Họ và tên"
                      value={newMember?.name || ""}
                      onChange={(e) =>
                        setNewMember((s) => ({ ...s, name: e.target.value }))
                      }
                      className="tw-border tw-rounded-lg tw-px-3 tw-py-2 
                            focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-blue-300 focus:tw-border-blue-800"
                    />

                    {/* Dropdown Mối quan hệ */}
                    <div>
                      <label className="tw-block tw-mb-3 tw-text-lg tw-font-medium tw-text-left ">
                        Mối quan hệ
                      </label>
                      <Dropdown
                        className="tw-text-lg"
                        value={newMember.relation}
                        options={relationships}
                        onChange={(val) =>
                          setNewMember((s) => ({ ...s, relation: val }))
                        }
                      />
                    </div>

                    {/* Nút chọn Giới tính */}
                    <div className="tw-flex tw-flex-col tw-items-start">
                      <label className="tw-block tw-text-lg tw-font-medium tw-text-left ">
                        Giới tính
                      </label>
                      <div className="tw-grid tw-grid-cols-3 tw-gap-3 ">
                        {genderOptions.map((opt) => (
                          <button
                            key={opt.label}
                            type="button"
                            onClick={() =>
                              setNewMember((s) => ({ ...s, sex: opt.label }))
                            }
                            className={`tw-flex tw-items-center tw-justify-center tw-gap-2 tw-px-3 tw-py-2 
                                        tw-rounded-lg tw-border-2 tw-transition 
                                        ${
                                          newMember?.sex === opt.label
                                            ? "tw-border-cyan-500 tw-bg-cyan-50"
                                            : "tw-border-gray-300 tw-bg-white"
                                        }`}
                          >
                            <i className={`${opt.icon} ${opt.color}`}></i>
                            <span>{opt.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="tw-flex tw-flex-col">
                      <label className=" tw-text-lg tw-font-medium tw-text-left">
                        Ngày sinh
                      </label>
                      <input
                        type="date"
                        max={new Date().toISOString().split("T")[0]}
                        placeholder="Ngày sinh"
                        value={newMember?.dob || ""}
                        onChange={(e) =>
                          setNewMember((s) => ({ ...s, dob: e.target.value }))
                        }
                        className="tw-border tw-rounded-lg tw-px-3 tw-py-2 tw-h-[35px] 
                                  focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-blue-300 focus:tw-border-blue-800"
                      />
                    </div>
                  </div>

                  <button
                    className="tw-bg-green-600 tw-text-white tw-px-6 tw-py-2 tw-rounded-full tw-mt-4"
                    onClick={async () => {
                      if (!newMember?.name) return;
                      try {
                        const payload = {
                          full_name: newMember.name,
                          nickname: newMember.nickname || newMember.name,
                          relation: newMember.relation,
                          gender: mapLabelToCode(newMember.sex || "Khác"),
                          date_of_birth: newMember.dob || null,
                          phone: newMember.phone || "",
                        };
                        const created = await staffCreateMember(customer.id, payload);
                        const member = {
                          id: created.id,
                          name: created.full_name,
                          nickname: created.nickname || created.full_name,
                          relation: created.relation,
                          sex: newMember.sex || "Khác",
                          dob: created.date_of_birth,
                          expanded: false,
                        };
                        const updated = [...membersList, member];
                        setCustomers((prev) =>
                          prev.map((c) =>
                            c.id === customer.id ? { ...c, members: updated } : c
                          )
                        );
                        setSelectedCustomer((prev) => ({
                          ...prev,
                          members: updated,
                        }));
                        setNewMember({});
                        toast.success("Đã thêm thành viên");
                      } catch (e) {
                        toast.error(
                          e?.response?.data?.detail || "Không thêm được thành viên"
                        );
                      }
                    }}
                  >
                    Thêm thành viên mới
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
                          <div
                            className="tw-flex-1 tw-cursor-pointer tw-text-left  tw-text-blue-600"
                            onClick={() => {
                              const updated = membersList.map((m) =>
                                m.id === f.id ? { ...m, expanded: !m.expanded } : m
                              );
                              setCustomers((prev) =>
                                prev.map((c) =>
                                  c.id === customer.id
                                    ? { ...c, members: updated }
                                    : c
                                )
                              );
                            }}
                          >
                            {f.name} - {f.relation} - {formatDate(f.dob)}
                          </div>

                          {/* Nút xóa */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteModal({ open: true, member: f });
                            }}
                            className="tw-text-red-500 hover:tw-text-red-700 tw-ml-3"
                            title="Xóa thành viên"
                          >
                            <i className="fa-solid fa-trash"></i>
                          </button>

                          {/* Icon expand */}
                          <div
                            className="tw-ml-3 tw-cursor-pointer"
                            onClick={() => {
                              const updated = membersList.map((m) =>
                                m.id === f.id ? { ...m, expanded: !m.expanded } : m
                              );
                              setCustomers((prev) =>
                                prev.map((c) =>
                                  c.id === customer.id
                                    ? { ...c, members: updated }
                                    : c
                                )
                              );
                              setSelectedCustomer((prev) => ({
                                ...prev,
                                members: updated,
                              }));
                            }}
                          >
                            {f.expanded ? (
                              <i className="fa-solid fa-angles-up  tw-text-blue-500"></i>
                            ) : (
                              <i className="fa-solid fa-angles-down tw-text-blue-500"></i>
                            )}
                          </div>
                        </div>

                        {f.expanded && (
                          <div className="tw-mt-4 tw-space-y-2 tw-space-x-[100px]">
                            <div className="tw-flex tw-justify-start ">
                              <div className="tw-flex tw-items-center tw-gap-[15px] tw-ml-[100px]">
                                <span className="tw-w-[120px] tw-font-medium tw-text-left">
                                  Tên thân mật:
                                </span>
                                <span className="tw-text-left">{f.nickname}</span>
                              </div>
                            </div>
                            <div className="tw-flex tw-justify-start">
                              <div className="tw-flex tw-items-center tw-gap-[15px]">
                                <span className="tw-w-[120px] tw-font-medium tw-text-left">
                                  Họ và tên:
                                </span>
                                <span className="tw-text-left">{f.name}</span>
                              </div>
                            </div>
                            <div className="tw-flex tw-justify-start">
                              <div className="tw-flex tw-items-center tw-gap-[15px]">
                                <span className="tw-w-[120px] tw-font-medium tw-text-left">
                                  Ngày sinh:
                                </span>
                                <span className="tw-text-left">
                                  {formatDate(f.dob)}
                                </span>
                              </div>
                            </div>
                            <div className="tw-flex tw-justify-start">
                              <div className="tw-flex tw-items-center tw-gap-[15px]">
                                <span className="tw-w-[120px] tw-font-medium tw-text-left">
                                  Giới tính:
                                </span>
                                <span className="tw-text-left">{f.sex}</span>
                              </div>
                            </div>
                            <div className="tw-flex tw-justify-start">
                              <div className="tw-flex tw-items-center tw-gap-[15px]">
                                <span className="tw-w-[120px] tw-font-medium tw-text-left">
                                  Mối quan hệ:
                                </span>
                                <span className="tw-text-left">{f.relation}</span>
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
                  <i className="fa-solid fa-calendar-week  tw-mr-3"></i> Lịch hẹn
                </p>
                <div className="tw-space-y-4">
                  {/* --- TẠO LỊCH HẸN MỚI (đa vắc xin) --- */}
                  <div className="tw-border-t tw-pt-5">
                    <h5 className="tw-font-semibold tw-text-xl tw-mb-6 tw-text-green-600 flex items-center">
                      <i className="fa-solid fa-calendar-plus tw-mr-3"></i>Tạo lịch hẹn mới
                    </h5>

                    <div className="tw-grid lg:tw-grid-cols-3 md:tw-grid-cols-2 tw-grid-cols-1 tw-gap-6">
                      {/* Ngày */}
                      <div className="tw-flex tw-flex-col">
                        <label className="tw-text-lg tw-font-medium tw-mb-2">Ngày</label>
                        <input
                          type="date"
                          min={new Date().toISOString().split("T")[0]}
                          value={newAppointment.date}
                          onChange={(e) =>
                            setNewAppointment((s) => ({ ...s, date: e.target.value }))
                          }
                          className="tw-border tw-rounded-lg tw-px-3 tw-py-2 tw-text-lg focus:tw-ring-2 focus:tw-ring-blue-300"
                        />
                      </div>

                      {/* Người tiêm */}
                      <div className="tw-flex tw-flex-col">
                        <label className="tw-text-lg tw-font-medium tw-mb-2">Người tiêm</label>
                        <Dropdown
                          value={newAppointment.memberId}
                          options={memberSelectOptions}
                          onChange={(val) =>
                            setNewAppointment((s) => ({ ...s, memberId: val }))
                          }
                          className="tw-text-lg"
                        />
                      </div>
                    </div>

                    {/* Danh sách ITEMS vắc xin */}
                    <div className="tw-mt-6 tw-space-y-3">
                      <div className="tw-flex tw-justify-between tw-items-center">
                        <div className="tw-text-lg tw-font-semibold">
                          Danh sách vắc xin sẽ tiêm
                        </div>
                        <button
                          onClick={() => {
                            setNewAppointment((s) => ({
                              ...s,
                              items: [
                                ...(s.items || []),
                                {
                                  disease: "",
                                  vaccineId: "",
                                  vaccineName: "",
                                  price: "",
                                  doseQty: 1,
                                },
                              ],
                            }));
                          }}
                          className="tw-bg-blue-600 tw-text-white tw-px-4 tw-py-2 tw-rounded hover:tw-bg-blue-700"
                        >
                          + Thêm vắc xin
                        </button>
                      </div>

                      {!newAppointment.items?.length && (
                        <div className="tw-text-gray-500 tw-italic">
                          Chưa có vắc xin nào — bấm “+ Thêm vắc xin”.
                        </div>
                      )}

                      {(newAppointment.items || []).map((it, idx) => (
                        <div
                          key={idx}
                          className="tw-grid lg:tw-grid-cols-5 md:tw-grid-cols-4 tw-grid-cols-1 tw-gap-3 tw-p-3 tw-border tw-rounded-xl tw-bg-yellow-50"
                        >
                          {/* Phòng bệnh */}
                          <div className="tw-flex tw-flex-col">
                            <label className="tw-text-left tw-text-lg tw-font-medium tw-mb-1">
                              Phòng bệnh
                            </label>
                            <Dropdown
                              value={it.disease}
                              options={diseaseOptions}
                              onChange={(val) => {
                                setNewAppointment((s) => {
                                  const clone = [...(s.items || [])];
                                  clone[idx] = {
                                    ...clone[idx],
                                    disease: val,
                                    vaccineId: "",
                                    vaccineName: "",
                                    price: "",
                                  };
                                  return { ...s, items: clone };
                                });
                              }}
                              className="tw-text-lg"
                            />
                          </div>

                          {/* Vắc xin */}
                          <div className="tw-flex tw-flex-col">
                            <label className="tw-text-left tw-text-lg tw-font-medium tw-mb-1">
                              Vắc xin
                            </label>
                            <Dropdown
                              value={it.vaccineId}
                              options={(
                                it.disease ? vaccinesByDisease(it.disease) : vaccines
                              ).map((v) => ({
                                value: String(v.id),
                                label: `${v.name} (${(v.price || 0).toLocaleString()} đ)`,
                              }))}
                              onChange={(val) => {
                                const v = findVaccine(val);
                                setNewAppointment((s) => {
                                  const clone = [...(s.items || [])];
                                  clone[idx] = {
                                    ...clone[idx],
                                    vaccineId: String(v?.id || ""),
                                    vaccineName: v?.name || "",
                                    price: v?.price || 0,
                                  };
                                  return { ...s, items: clone };
                                });
                              }}
                              className="tw-text-lg"
                            />
                          </div>

                          {/* Đơn giá */}
                          <div className="tw-flex tw-flex-col">
                            <label className="tw-text-left tw-text-lg tw-font-medium tw-mb-1">
                              Đơn giá
                            </label>
                            <input
                              readOnly
                              className="tw-border tw-rounded-lg tw-px-3 tw-py-2 tw-bg-gray-100 tw-text-lg"
                              value={
                                it.price ? Number(it.price).toLocaleString("vi-VN") : ""
                              }
                            />
                          </div>

                          {/* Số mũi */}
                          <div className="tw-flex tw-flex-col">
                            <label className="tw-text-left tw-text-lg tw-font-medium tw-mb-1">
                              Số mũi
                            </label>
                            <input
                              type="number"
                              min={1}
                              className="tw-border tw-rounded-lg tw-px-3 tw-py-2 tw-text-lg"
                              value={it.doseQty || 1}
                              onChange={(e) => {
                                const val = Math.max(1, Number(e.target.value || 1));
                                setNewAppointment((s) => {
                                  const clone = [...(s.items || [])];
                                  clone[idx] = { ...clone[idx], doseQty: val };
                                  return { ...s, items: clone };
                                });
                              }}
                            />
                          </div>

                          {/* Xoá item */}
                          <div className="tw-flex tw-items-end">
                            <button
                              onClick={() => {
                                setNewAppointment((s) => {
                                  const clone = [...(s.items || [])];
                                  clone.splice(idx, 1);
                                  return { ...s, items: clone };
                                });
                              }}
                              className="tw-text-red-600 hover:tw-text-red-700 tw-ml-auto"
                              title="Xoá vắc xin này"
                            >
                              <i className="fa-solid fa-trash"></i>
                            </button>
                          </div>
                        </div>
                      ))}

                      {/* Ghi chú + Thành tiền */}
                      <div className="tw-grid md:tw-grid-cols-3 tw-gap-4 tw-mt-2">
                        <div className="md:tw-col-span-2 tw-flex tw-flex-col">
                          <label className="tw-text-lg tw-text-left tw-font-medium tw-mb-2">
                            Ghi chú (Bệnh nền)
                          </label>
                          <textarea
                            value={newAppointment.note || ""}
                            onChange={(e) =>
                              setNewAppointment((s) => ({ ...s, note: e.target.value }))
                            }
                            className="tw-border tw-rounded-lg tw-px-3 tw-py-2 tw-min-h-[80px] tw-text-lg focus:tw-ring-2 focus:tw-ring-blue-300"
                          />
                        </div>
                        <div className="tw-flex tw-flex-col">
                          <label className="tw-text-lg tw-text-left tw-font-medium tw-mb-2">
                            Thành tiền
                          </label>
                          <input
                            readOnly
                            className="tw-border tw-rounded-lg tw-px-3 tw-py-2 tw-text-lg tw-bg-gray-100 tw-font-semibold"
                            value={
                              newAppointment.total
                                ? `${newAppointment.total.toLocaleString("vi-VN")} VNĐ`
                                : ""
                            }
                          />
                        </div>
                      </div>

                      <div className="tw-mt-4">
                        <button
                          onClick={async () => {
                            if (!newAppointment.date) return toast.error("Chọn ngày hẹn");
                            if (!newAppointment.memberId)
                              return toast.error("Chọn người tiêm");
                            if (!newAppointment.items?.length)
                              return toast.error("Thêm ít nhất 1 vắc xin");

                            try {
                              const payload = {
                                date: new Date(newAppointment.date).toISOString(),
                                member_id: String(newAppointment.memberId),
                                items: newAppointment.items.map((it) => ({
                                  disease: it.disease || "",
                                  vaccine_id: String(it.vaccineId),
                                  vaccine: it.vaccineName,
                                  price: Number(it.price || 0),
                                  qty: Number(it.doseQty || 1),
                                })),
                                note: newAppointment.note || "",
                              };
                              const appt = await createAppointment(customer.id, payload);

                              const updated = [...appointmentsList, appt];
                              setCustomers((prev) =>
                                prev.map((c) =>
                                  c.id === customer.id
                                    ? { ...c, appointments: updated }
                                    : c
                                )
                              );
                              setSelectedCustomer((prev) => ({
                                ...prev,
                                appointments: updated,
                              }));
                              setNewAppointment({
                                date: "",
                                memberId: "",
                                items: [],
                                note: "",
                                total: 0,
                              });
                              toast.success("Đã tạo lịch hẹn");
                            } catch (e) {
                              toast.error(
                                e?.response?.data?.detail || "Không tạo được lịch hẹn"
                              );
                            }
                          }}
                          className="tw-bg-green-600 hover:tw-bg-green-500 tw-text-white tw-px-6 tw-py-3 tw-rounded-full tw-shadow-md tw-text-xl"
                        >
                          💾 Lưu lịch hẹn
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Danh sách lịch hẹn */}
                  <div
                    className="tw-max-h-[300px] tw-overflow-y-auto tw-pr-2 tw-space-y-4 tw-mb-6 tw-mt-8 tw-border-t tw-pt-6 
                                    tw-scrollbar-thin tw-scrollbar-thumb-gray-300 tw-scrollbar-track-transparent
                                    [&::-webkit-scrollbar]:tw-h-2 [&::-webkit-scrollbar]:tw-w-2 [&::-webkit-scrollbar-thumb]:tw-rounded-full
                                    [&::-webkit-scrollbar-track]:tw-bg-gray-100 [&::-webkit-scrollbar-thumb]:tw-bg-gradient-to-b
                                  [&::-webkit-scrollbar-thumb]:tw-from-cyan-400 [&::-webkit-scrollbar-thumb]:tw-to-blue-400"
                  >
                    {appointmentsList.length > 0 ? (
                      <div className="tw-space-y-4">
                        {appointmentsList.map((a) => (
                          <div
                            key={a.id}
                            className="tw-p-4 tw-border tw-rounded-xl tw-bg-yellow-100 tw-shadow-sm hover:tw-shadow-md tw-transition"
                          >
                            <div className="tw-flex tw-justify-between tw-items-start">
                              <div>
                                <div className="tw-font-semibold tw-text-lg tw-text-gray-800">
                                  {a.vaccine} <span className="tw-text-gray-400"></span>
                                </div>
                                <div className="tw-text-sm tw-text-gray-600 tw-mt-1">
                                  Ngày hẹn : {formatDate(a.date)}
                                </div>

                                <span
                                  className={`tw-inline-block tw-mt-2 tw-text-base tw-font-semibold tw-px-3 tw-py-1 tw-rounded-full
                                  ${
                                    a.status === "pending"
                                      ? "tw-bg-cyan-100 tw-text-cyan-700"
                                      : a.status === "confirmed"
                                      ? "tw-bg-green-100 tw-text-green-700"
                                      : a.status === "cancelled"
                                      ? "tw-bg-red-100 tw-text-red-700"
                                      : a.status === "done"
                                      ? "tw-bg-blue-100 tw-text-blue-600"
                                      : "tw-bg-gray-100 tw-text-gray-600"
                                  }`}
                                >
                                  {a.status === "pending"
                                    ? "Chờ xác nhận"
                                    : a.status === "confirmed"
                                    ? "Đã xác nhận"
                                    : a.status === "cancelled"
                                    ? "Đã hủy"
                                    : a.status === "done"
                                    ? "Thành công"
                                    : a.status}
                                </span>
                              </div>

                              <div className="tw-flex tw-gap-2">
                                {a.status === "pending" && (
                                  <>
                                    <button
                                      onClick={() =>
                                        handleConfirmAppointmentLocal(customer.id, a.id)
                                      }
                                      className="tw-bg-blue-600 hover:tw-bg-blue-700 tw-text-white tw-text-sm tw-px-4 tw-py-2 tw-rounded-lg tw-shadow"
                                    >
                                      Xác nhận
                                    </button>

                                    <button
                                      onClick={() =>
                                        handleCancelAppointmentLocal(customer.id, a.id)
                                      }
                                      className="tw-bg-red-600 hover:tw-bg-red-700 tw-text-white tw-text-sm tw-px-4 tw-py-2 tw-rounded-lg tw-shadow"
                                    >
                                      Hủy
                                    </button>
                                  </>
                                )}

                                {a.status === "confirmed" && (
                                  <button
                                    onClick={() =>
                                      handleCancelAppointmentLocal(customer.id, a.id)
                                    }
                                    className="tw-bg-red-600 hover:tw-bg-red-700 tw-text-white tw-text-sm tw-px-4 tw-py-2 tw-rounded-lg tw-shadow"
                                  >
                                    Hủy
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="tw-text-center tw-text-red-500 tw-font-medium tw-py-4 tw-italic">
                        Chưa có lịch hẹn nào
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {detailTab === "history" && (
              <div className="tw-space-y-6 tw-h-full tw-overflow-y-auto  tw-scrollbar-hide tw-pr-2">
                <p className="tw-font-bold tw-text-[17px] tw-text-blue-400 tw-flex tw-items-center tw-justify-center tw-gap-2 tw-text-center">
                  <i className="fa-solid fa-syringe"></i>
                  Lịch sử tiêm
                </p>

                {/* --- Ghi nhận mũi tiêm mới --- */}
                <div className="tw-border-t tw-pt-5">
                  <h5 className="tw-font-semibold tw-text-xl tw-mb-3 tw-text-orange-600">
                    <i className="fa-solid fa-plus"></i> Ghi nhận mũi tiêm mới
                  </h5>

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
                    </div>

                    {/* Ngày tiêm */}
                    <div className="tw-flex tw-flex-col">
                      <label className="tw-text-lg tw-font-medium tw-mb-2">Ngày tiêm</label>
                      <input
                        type="date"
                        max={new Date().toISOString().split("T")[0]}
                        value={newVaccineRecord.date || ""}
                        onChange={(e) =>
                          setNewVaccineRecord((s) => ({ ...s, date: e.target.value }))
                        }
                        className="tw-border tw-rounded-lg tw-px-3 tw-py-2 tw-h-[35px] tw-text-lg focus:tw-ring-2 focus:tw-ring-blue-300"
                      />
                    </div>

                    {/* Phòng bệnh */}
                    <div className="tw-flex tw-flex-col">
                      <label className="tw-text-lg tw-font-medium tw-mb-2">Phòng bệnh</label>
                      <Dropdown
                        value={newVaccineRecord.disease}
                        options={diseaseOptions}
                        onChange={(val) =>
                          setNewVaccineRecord((s) => ({
                            ...s,
                            disease: val,
                            vaccineId: "",
                            vaccine: "",
                            price: "",
                          }))
                        }
                        className="tw-text-lg"
                      />
                    </div>

                    {/* Vắc xin */}
                    <div className="tw-flex tw-flex-col">
                      <label className="tw-text-lg tw-font-medium tw-mb-2">Vắc xin</label>
                      <Dropdown
                        value={newVaccineRecord.vaccineId}
                        options={(
                          newVaccineRecord.disease
                            ? vaccinesByDisease(newVaccineRecord.disease)
                            : vaccines
                        ).map((v) => ({
                          value: String(v.id),
                          label: `${v.name} (${(v.price || 0).toLocaleString()} đ)`,
                        }))}
                        onChange={(val) => {
                          const v = findVaccine(val);
                          setNewVaccineRecord((s) => ({
                            ...s,
                            vaccineId: String(v?.id || ""),
                            vaccine: v?.name || "",
                            price: v?.price || 0,
                          }));
                        }}
                        className="tw-text-lg"
                      />
                    </div>

                    {/* Mũi thứ */}
                    <div className="tw-flex tw-flex-col">
                      <label className="tw-text-lg tw-font-medium tw-mb-2">Mũi thứ</label>
                      <Dropdown
                        value={newVaccineRecord.dose}
                        onChange={(val) =>
                          setNewVaccineRecord((s) => ({ ...s, dose: val }))
                        }
                        options={[1, 2, 3, 4, 5].map((n) => ({
                          value: String(n),
                          label: `Mũi ${n}`,
                        }))}
                        className="tw-text-lg"
                      />
                    </div>

                    {/* Đơn giá */}
                    <div className="tw-flex tw-flex-col">
                      <label className="tw-text-lg tw-font-medium tw-mb-2">Đơn giá</label>
                      <input
                        readOnly
                        value={
                          newVaccineRecord.price
                            ? Number(newVaccineRecord.price).toLocaleString("vi-VN")
                            : ""
                        }
                        className="tw-border tw-rounded-lg tw-px-3 tw-py-2 tw-h-[35px] tw-text-lg tw-bg-gray-100"
                      />
                    </div>

                    {/* Cơ sở tiêm */}
                    <div className="tw-flex tw-flex-col">
                      <label className="tw-text-lg tw-font-medium tw-mb-2">Cơ sở tiêm</label>
                      <input
                        value={newVaccineRecord.place || ""}
                        onChange={(e) =>
                          setNewVaccineRecord((s) => ({ ...s, place: e.target.value }))
                        }
                        className="tw-border tw-rounded-lg tw-px-3 tw-py-2 tw-text-lg focus:tw-ring-2 focus:tw-ring-blue-300"
                      />
                    </div>

                    {/* Ghi chú */}
                    <div className="tw-flex tw-flex-col md:tw-col-span-2">
                      <label className="tw-text-lg tw-font-medium tw-mb-2">
                        Ghi chú (Bệnh nền)
                      </label>
                      <textarea
                        value={newVaccineRecord.note || ""}
                        onChange={(e) =>
                          setNewVaccineRecord((s) => ({ ...s, note: e.target.value }))
                        }
                        className="tw-border tw-rounded-lg tw-px-3 tw-py-2 tw-h-[60px] tw-text-lg tw-resize-none focus:tw-ring-2 focus:tw-ring-blue-300"
                      />
                    </div>
                  </div>

                  {/* Nút ghi nhận */}
                  <div className="tw-mt-4">
                    <button
                      onClick={async () => {
                        if (!newVaccineRecord.memberId)
                          return toast.error("Chọn người tiêm");
                        if (!newVaccineRecord.date)
                          return toast.error("Chọn ngày tiêm");
                        if (!newVaccineRecord.vaccineId)
                          return toast.error("Chọn vắc xin");

                        const rec = {
                          member_id: String(newVaccineRecord.memberId),
                          date: newVaccineRecord.date,
                          disease: newVaccineRecord.disease || "",
                          vaccine_id: String(newVaccineRecord.vaccineId),
                          vaccine: newVaccineRecord.vaccine,
                          dose: Number(newVaccineRecord.dose || 1),
                          price: Number(newVaccineRecord.price || 0),
                          batch: newVaccineRecord.batch || "",
                          note: newVaccineRecord.note || "",
                          place:
                            newVaccineRecord.place ||
                            center?.name ||
                            "Trung tâm tiêm chủng Evaccine",
                        };

                        try {
                          const created = await addHistory(customer.id, rec);
                          const record = { id: created.id, ...created };

                          setCustomers((prev) =>
                            prev.map((c) =>
                              c.id === customer.id
                                ? { ...c, history: [record, ...(c.history || [])] }
                                : c
                            )
                          );
                          setSelectedCustomer((prev) => ({
                            ...prev,
                            history: [record, ...(prev.history || [])],
                          }));
                          setNewVaccineRecord({
                            date: "",
                            memberId: "",
                            disease: "",
                            vaccineId: "",
                            vaccine: "",
                            dose: "",
                            price: "",
                            place: "",
                            note: "",
                            batch: "",
                          });
                          toast.success("Đã ghi nhận mũi tiêm");
                        } catch (e) {
                          toast.error(
                            e?.response?.data?.detail || "Ghi nhận thất bại"
                          );
                        }
                      }}
                      className="tw-bg-blue-600 hover:tw-bg-blue-700 tw-text-xl tw-text-white tw-font-medium tw-px-6 tw-py-2 tw-rounded-full tw-shadow"
                    >
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
                      <div
                        key={h.id}
                        className="tw-bg-cyan-50 tw-shadow-md tw-rounded-xl tw-p-4 tw-flex tw-justify-between tw-items-center hover:tw-shadow-lg tw-transition"
                      >
                        <div>
                          <div className="tw-text-lg tw-font-semibold tw-text-gray-800">
                            {h.vaccine}
                            <span className="tw-text-lg tw-text-gray-500"> ({h.date})</span>
                          </div>
                          <div className="tw-text-base tw-text-gray-600 tw-mt-1">
                            <span className="tw-inline-block tw-bg-green-100 tw-px-3 tw-py-1 tw-rounded-full tw-mr-2">
                              🏥 {h.place || "Trung tâm tiêm chủng Evaccine"}
                            </span>
                          </div>
                          <div className="tw-text-base tw-text-gray-600 mt-1">
                            <span className="tw-inline-block tw-bg-yellow-100 tw-px-3 tw-py-1 tw-rounded-full tw-mr-2">
                              Lô: {h.batch} - Mũi thứ
                            </span>
                            <span className="tw-text-gray-500 tw-text-base">
                              📝 {h.note || "Không có ghi chú"}
                            </span>
                          </div>
                        </div>
                        <div className="tw-text-green-500 tw-text-2xl">
                          <i className="fa-solid fa-check-circle"></i>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            <DeleteCustomerModal
              show={deleteModal.open}
              customer={{ name: deleteModal.member?.name }}
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
              onClose={() =>
                !deleting && setDeleteModal({ open: false, member: null })
              }
              onConfirm={async () => {
                if (!deleteModal.member || deleting) return;
                setDeleting(true);
                try {
                  await staffDeleteMember(customer.id, deleteModal.member.id);
                  const updated = (customer.members || []).filter(
                    (m) => m.id !== deleteModal.member.id
                  );
                  setCustomers((prev) =>
                    prev.map((c) =>
                      c.id === customer.id ? { ...c, members: updated } : c
                    )
                  );
                  setSelectedCustomer((prev) => ({ ...prev, members: updated }));
                  toast.success("Đã xóa thành viên");
                  setDeleteModal({ open: false, member: null });
                } catch (err) {
                  toast.error(
                    err?.response?.data?.detail || "Không thể xóa thành viên"
                  );
                } finally {
                  setDeleting(false);
                }
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
