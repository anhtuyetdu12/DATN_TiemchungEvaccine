// StaffCustomers.jsx
import { useEffect, useMemo, useState } from "react";
import EditCustomerModal from "./modal/customer/EditCustomerModal";
import Pagination from "../../components/Pagination";
import ViewCustomerDetailModal from "./modal/customer/ViewCustomerDetailModal";
import AddCustomerModal from "./modal/customer/AddCustomerModal";
import DeleteCustomerModal from "./modal/customer/DeleteCustomerModal";
import { fetchCustomers, fetchCustomerMembers } from "../../services/customerService";

// util: parse YYYY-MM-DD an toàn theo local
const toLocalDate = (d) => (d ? new Date(`${d}T00:00:00`) : null);

// --- highlight helper (tô đậm từ khóa) ---
const Highlight = ({ text = "", q = "" }) => {
  if (!text) return "-";
  if (!q) return text;
  const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const parts = String(text).split(new RegExp(`(${escaped})`, "gi"));
  return parts.map((p, i) =>
    p.toLowerCase() === q.toLowerCase() ? (
      <mark key={i} className="tw-bg-yellow-200 tw-rounded">{p}</mark>
    ) : (
      <span key={i}>{p}</span>
    )
  );
};


function MemberPanel({ members = [], searchGlobal = "" }) {
  const effectiveQ = (searchGlobal || "").trim().toLowerCase();

  const filtered = useMemo(() => {
    if (!effectiveQ) return members;
    return members.filter(m =>
      [m.name, m.nickname, m.relation, m.phone]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(effectiveQ)
    );
  }, [members, effectiveQ]);

  return (
    <div className="tw-space-y-3">
      <div className="tw-flex tw-items-center tw-justify-between tw-gap-2 tw-rounded-xl tw-border tw-border-indigo-100 tw-bg-indigo-50/60 tw-px-4 tw-py-2">
        <div className="tw-flex tw-items-center tw-gap-2">
          <i className="fa-solid fa-users tw-text-indigo-600" />
          <span className="tw-font-semibold tw-text-indigo-900">Thành viên gia đình</span>
        </div>
        <span className="tw-text-base tw-text-indigo-700">
          {filtered.length} / {members.length} thành viên
        </span>
      </div>

      {filtered.length === 0 ? (
        <div className="tw-text-center tw-text-gray-500 tw-bg-white tw-border tw-rounded-lg tw-py-6">
          {effectiveQ ? "Không có thành viên khớp từ khóa" : "Chưa có thành viên"}
        </div>
      ) : (
        <ul className="tw-grid tw-gap-3 tw-grid-cols-1 sm:tw-grid-cols-2 lg:tw-grid-cols-3 xl:tw-grid-cols-4">
          {filtered.map((m) => (
            <li key={m.id} className="tw-bg-white tw-border tw-rounded-xl tw-p-3 tw-shadow-sm hover:tw-shadow-md tw-transition-shadow tw-flex tw-flex-col tw-h-full"  >
              {/* Hàng 1: tên + quan hệ + SĐT */}
              <div className="tw-flex tw-items-start tw-justify-between tw-gap-3">
                <div className="tw-min-w-0">
                  <div className="tw-font-semibold tw-truncate tw-text-[12px] tw-text-left">
                    <Highlight text={`${m.name}${m.nickname ? ` (${m.nickname})` : ""}`} q={effectiveQ} />
                  </div>
                  <div className="tw-mt-0.5 tw-text-[10px] tw-text-gray-600 tw-flex tw-items-center tw-gap-2">
                    <span className="tw-inline-flex tw-items-center tw-gap-1">
                      <i className="fa-regular fa-user" /> {m.sex || "-"}
                    </span>
                    <span className="tw-text-gray-500">•</span>
                    <span className="tw-inline-flex tw-items-center tw-gap-1">
                      <i className="fa-regular fa-calendar" /> {m.dob ? toLocalDate(m.dob).toLocaleDateString("vi-VN") : "-"}
                    </span>
                  </div>
                </div>

                <div className="tw-flex tw-flex-col tw-items-end tw-gap-2 tw-shrink-0">
                  <span className="tw-bg-pink-100 tw-text-pink-700 tw-px-2.5 tw-py-0.5 tw-rounded-full tw-text-[11px] tw-font-medium tw-max-w-[120px] tw-truncate">
                    <Highlight text={m.relation || "-"} q={effectiveQ} />
                  </span>
                  <div className="tw-text-[10px] tw-text-gray-700 tw-inline-flex tw-items-center tw-gap-1">
                    <i className="fa-solid fa-phone tw-text-indigo-500" />
                    <span className="tw-truncate tw-max-w-[120px]">
                      <Highlight text={m.phone || "Không có"} q={effectiveQ} />
                    </span>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}


export default function StaffCustomers() {
  const STATUS = {
    NOT_VACCINATED: "Chưa tiêm",
    DONE: "Đã tiêm",
    LATE: "Trễ hẹn",
    CANCELED: "Hủy đăng ký",
  };

  const getAppointmentStatus = (appt) => {
    const today = new Date();
    const apptDate = appt?.date ? toLocalDate(appt.date) : null;
    if (!apptDate) return "-";
    if (appt.status === "cancelled") return STATUS.CANCELED;
    if (appt.status === "completed") return STATUS.DONE;
    if (appt.status === "confirmed" && apptDate >= today) return STATUS.NOT_VACCINATED;
    if (appt.status === "pending" && apptDate.toDateString() === today.toDateString()) return STATUS.NOT_VACCINATED;
    if (appt.status === "pending" && apptDate < today) return STATUS.LATE;
    return STATUS.NOT_VACCINATED;
  };

  const getStatusClass = (status) => {
    switch (status) {
      case STATUS.DONE: return "tw-bg-green-100 tw-text-green-600 tw-rounded-full";
      case STATUS.LATE: return "tw-bg-purple-100 tw-text-purple-600 tw-rounded-full";
      case STATUS.NOT_VACCINATED: return "tw-bg-yellow-100 tw-text-yellow-700 tw-rounded-full";
      case STATUS.CANCELED: return "tw-bg-red-200 tw-text-red-600 tw-rounded-full";
      default: return "";
    }
  };

  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const base = await fetchCustomers();
      const enriched = await Promise.all(
        (base || []).map(async (c) => {
          try {
            const membersRaw = await fetchCustomerMembers(c.id);
            const members = (membersRaw || []).map(m => ({
              id: m.id,
              name: m.full_name,
              nickname: m.nickname || "",
              relation: m.relation || "",
              sex: m.gender || "",
              dob: m.date_of_birth || "",
              phone: m.phone || "",
            }));
            return { ...c, members, showMembers: false };
          } catch {
            return { ...c, members: [], showMembers: false };
          }
        })
      );
      setCustomers(enriched);
      setLoading(false);
    })();
  }, []);

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [activeTab, setActiveTab] = useState('history');
  const [page, setPage] = useState(1);
  const perPage = 10;
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [detail, setDetail] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);

  const handleAddCustomer = (newCust) => setCustomers((prev) => [newCust, ...prev]);
  const [newAppointment, setNewAppointment] = useState({ date: "", vaccine: "", center: "" });
  const [newVaccineRecord, setNewVaccineRecord] = useState({ date: "", vaccine: "", batch: "", note: "" });

  // 🔎 Tìm kiếm KH + cả THÀNH VIÊN gia đình (ô tìm kiếm chung)
  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return customers.filter((c) => {
      if (!term) return true;
      const inCustomer =
        (c.name || "").toLowerCase().includes(term) ||
        (c.phone || "").toLowerCase().includes(term) ||
        (c.email || "").toLowerCase().includes(term) ||
        (c.code || "").toLowerCase().includes(term);
      const inMembers = (c.members || []).some((m) =>
        [m.name, m.nickname, m.relation, m.phone]
          .filter(Boolean).join(" ").toLowerCase().includes(term)
      );
      return inCustomer || inMembers;
    });
  }, [customers, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  useEffect(() => { if (page > totalPages) setPage(totalPages); }, [totalPages, page]);
  const pageData = filtered.slice((page - 1) * perPage, page * perPage);

  const confirmAppointment = (custId, apptId) => {
    setCustomers((prev) =>
      prev.map((c) =>
        c.id === custId
          ? { ...c, appointments: c.appointments.map((a) => (a.id === apptId ? { ...a, status: "confirmed" } : a)) }
          : c
      )
    );
  };

  const handleCancelRegistration = (custId, apptId) => {
    setCustomers((prev) =>
      prev.map((c) =>
        c.id === custId
          ? { ...c, appointments: c.appointments.map((a) => (a.id === apptId ? { ...a, status: "cancelled" } : a)) }
          : c
      )
    );
  };

  const recordVaccine = (custId, record) => {
    setCustomers((prev) => prev.map((c) => (c.id === custId ? { ...c, history: [record, ...c.history] } : c)));
  };

  const addAppointment = (custId, appt) => {
    setCustomers((prev) => prev.map((c) => (c.id === custId ? { ...c, appointments: [appt, ...c.appointments] } : c)));
  };

  // helper: tìm danh sách thành viên khớp theo từ khóa chung
  const getMemberHits = (c, term) => {
    if (!term) return [];
    const t = term.toLowerCase();
    return (c.members || []).filter(m =>
      [m.name, m.nickname, m.relation, m.phone].filter(Boolean).join(" ").toLowerCase().includes(t)
    );
  };

  return (
    <div className="tw-min-h-screen tw-bg-green-100 tw-p-6 tw-font-sans ">
      <div className="tw-max-w-full tw-mx-auto tw-grid tw-gap-6 tw-py-[120px]">
        <div className="tw-flex tw-items-center tw-justify-center tw-gap-3 tw-text-[30px]">
          <i className="fa-solid fa-person-military-pointing tw-mb-6 tw-bg-gradient-to-r tw-from-pink-600 tw-via-blue-400 tw-to-pink-500 tw-bg-clip-text tw-text-transparent"></i>
          <h1 className="tw-pb-5 tw-ml-3 tw-font-bold tw-bg-gradient-to-r tw-from-pink-600 tw-via-blue-400 tw-to-pink-500 tw-bg-clip-text tw-text-transparent">
            Quản lý khách hàng
          </h1>
        </div>

        <div className="tw-p-6 ">
          {/* Search + Add */}
          <div className="tw-flex tw-justify-between tw-items-center tw-mb-16 tw-gap-4">
            <div className="tw-flex tw-items-center tw-gap-2 tw-w-1/2">
              <input  type="text"  placeholder="Tìm KH hoặc thành viên: tên, bí danh, quan hệ, mã KH, email, SĐT…"  value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}  onKeyDown={(e) => { if (e.key === 'Enter') { setSearch(searchInput.trim()); setPage(1); }}}
                className="tw-border tw-border-gray-300 tw-px-4 tw-py-2 tw-rounded-lg tw-shadow-sm tw-flex-1 focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-blue-300 focus:tw-border-blue-800" />
              <button onClick={() => { setSearch(searchInput.trim()); setPage(1); }}
                className="tw-bg-blue-600 tw-text-white tw-px-4 tw-py-2 tw-rounded-full tw-font-medium hover:tw-bg-blue-700 tw-shadow" >
                <i className="fa-solid fa-magnifying-glass tw-mr-2"></i>
                Tìm kiếm
              </button>
            </div>

            <button className="tw-bg-pink-600 tw-text-white tw-px-6 tw-py-2 tw-rounded-full tw-font-medium hover:tw-bg-pink-500 tw-shadow"
              onClick={() => setShowAddModal(true)} >
              <i className="fa-solid fa-plus tw-mr-2"></i> Thêm khách hàng
            </button>
          </div>

          {/* Table */}
          <div className="tw-bg-white tw-rounded-xl tw-shadow-md tw-overflow-x-auto">
            <table className="tw-w-full tw-text-xl tw-border-collapse tw-py-5 tw-mb-5 tw-table-fixed">
              <thead className="tw-bg-red-100 ">
                <tr>
                  <th className="tw-px-4 tw-py-4 tw-w-1/10 tw-text-center">Họ tên</th>
                  <th className="tw-px-4 tw-py-4 tw-w-1/10 tw-text-center">Thành viên</th>
                  <th className="tw-px-4 tw-py-4 tw-w-1/10 tw-text-center">Điện thoại</th>
                  <th className="tw-px-4 tw-py-4 tw-w-1/10 tw-text-center">Ngày hẹn</th>
                  <th className="tw-px-4 tw-py-4 tw-w-1/10 tw-text-center">Tên vaccine</th>
                  <th className="tw-px-4 tw-py-4 tw-w-1/10 tw-text-center">Quốc gia</th>
                  <th className="tw-px-4 tw-py-4 tw-w-1/10 tw-text-center">Số mũi</th>
                  <th className="tw-px-4 tw-py-4 tw-w-1/10 tw-text-center">Đơn giá</th>
                  <th className="tw-px-4 tw-py-4 tw-w-1/10 tw-text-center">Trạng thái</th>
                  <th className="tw-px-4 tw-py-4 tw-w-1/5 tw-text-center">Hành động</th>
                </tr>
              </thead>
              <tbody>
                {pageData.map((c) => {
                  const appt = c.appointments?.[0];
                  const statusText = appt ? getAppointmentStatus(appt) : "-";

                  // ⬇️ Tính các thành viên khớp theo từ khóa TỔNG
                  const term = search.trim();
                  const memberHits = getMemberHits(c, term);
                  // ⬇️ Auto mở panel khi có kết quả khớp (không cần bấm nút)
                  const isOpen = c.showMembers || (term && memberHits.length > 0);

                  return (
                    <>
                      <tr key={`row-${c.id}`} className="tw-border-b hover:tw-bg-pink-50">
                        <td className="tw-px-4 tw-py-2 tw-text-left ">
                          {term ? <Highlight text={c.name || "-"} q={term} /> : (c.name || "-")}
                        </td>

                        <td className="tw-px-4 tw-py-2 tw-text-center">
                          <button
                            onClick={() =>
                              setCustomers(prev => prev.map(x => x.id === c.id ? { ...x, showMembers: !x.showMembers } : x))
                            }
                            className="tw-bg-indigo-100 tw-text-indigo-700 tw-px-3 tw-py-1 tw-rounded-full hover:tw-bg-indigo-200">
                            {/* khi đang tìm: hiển thị số KHỚP; không thì tổng */}
                            Thành viên ({term ? (memberHits.length) : (c.members?.length || 0)})
                          </button>

                          {/* chip preview tên thành viên khớp (tối đa 2) */}
                          {term && memberHits.length > 0 && (
                            <div className="tw-mt-2 tw-flex tw-flex-wrap tw-justify-center tw-gap-1">
                              {memberHits.slice(0, 2).map(m => (
                                <span key={m.id} title={m.name}
                                  className="tw-inline-block tw-bg-indigo-50 tw-text-indigo-700 tw-text-xs tw-rounded-full tw-px-2 tw-py-0.5 tw-max-w-[140px] tw-truncate" >
                                  <Highlight text={m.name} q={term} />
                                </span>
                              ))}
                              {memberHits.length > 2 && (
                                <span className="tw-text-xs tw-text-gray-500">+{memberHits.length - 2}</span>
                              )}
                            </div>
                          )}
                        </td>

                        <td className="tw-px-4 tw-py-2">
                          {term ? <Highlight text={c.phone || c.email || "-"} q={term} /> : (c.phone || c.email || "-")}
                        </td>
                        <td>{appt?.date ? toLocalDate(appt.date).toLocaleDateString("vi-VN") : "-"}</td>
                        <td>{appt?.vaccine || "-"}</td>
                        <td className="tw-px-4 tw-py-2">{c.country || "-"}</td>
                        <td>{c.doses != null ? c.doses : "-"}</td>
                        <td>{appt?.price != null ? appt.price.toLocaleString("vi-VN") : "-"}</td>
                        <td>
                          <span className={`${getStatusClass(statusText)} tw-inline-block tw-px-3 tw-py-2`}>
                            {statusText}
                          </span>
                        </td>

                        <td className="tw-px-4 tw-py-2 tw-text-center">
                          <div className="tw-flex tw-justify-center tw-gap-2">
                            <button onClick={() => { setSelectedCustomer(c); setShowModal(true); }}
                              className="tw-bg-yellow-100 tw-text-yellow-600 tw-px-3 tw-py-2 tw-rounded-full hover:tw-bg-yellow-200 tw-border hover:tw-border-yellow-600">
                              <i className="fa-solid fa-pencil tw-mr-2"></i>Sửa
                            </button>
                            <button  onClick={() => { setCustomerToDelete(c); setShowDeleteModal(true); }}
                              className="tw-bg-red-100 tw-text-red-600 tw-px-3 tw-py-2 tw-rounded-full hover:tw-bg-red-200 tw-border hover:tw-border-red-600" >
                              <i className="fa-solid fa-ban tw-mr-2"></i>Hủy
                            </button>
                            <button  onClick={() => setDetail(c)}
                              className="tw-bg-blue-100 tw-text-blue-600 tw-px-3 tw-py-2 tw-rounded-full hover:tw-bg-blue-200 tw-border hover:tw-border-blue-600" >
                              <i className="fa-solid fa-eye tw-mr-2"></i>Xem
                            </button>
                          </div>
                        </td>
                      </tr>

                      {/* HÀNG MỞ RỘNG: auto mở khi có match thành viên */}
                      {isOpen && (
                        <tr key={`members-${c.id}`} className="tw-bg-slate-50">
                          <td colSpan={10} className="tw-px-6 tw-py-4">
                            <MemberPanel members={c.members} searchGlobal={search} />
                          </td>
                        </tr>
                      )}
                    </>
                  );
                })}
              </tbody>
            </table>
            <Pagination page={page} totalItems={filtered.length} perPage={perPage} onPageChange={(p) => setPage(p)} />
          </div>

          <EditCustomerModal
            show={showModal} onClose={() => setShowModal(false)}
            activeTab={activeTab} setActiveTab={setActiveTab}
            newAppointment={newAppointment} setNewAppointment={setNewAppointment}
            newVaccineRecord={newVaccineRecord} setNewVaccineRecord={setNewVaccineRecord}
            confirmAppointment={confirmAppointment} addAppointment={addAppointment}
            recordVaccine={recordVaccine} customer={selectedCustomer}
            setCustomers={setCustomers} setSelectedCustomer={setSelectedCustomer}
          />

          {detail && ( <ViewCustomerDetailModal customer={detail} onClose={() => setDetail(null)} /> )}

          <DeleteCustomerModal
            show={showDeleteModal} customer={customerToDelete}
            onClose={() => setShowDeleteModal(false)}
            onConfirm={() => {
              if (customerToDelete) {
                const apptId = customerToDelete.appointments?.[0]?.id;
                if (apptId) handleCancelRegistration(customerToDelete.id, apptId);
                setCustomerToDelete(null);
              }
              setShowDeleteModal(false);
            }}
          />

          <AddCustomerModal
            show={showAddModal}
            onClose={() => setShowAddModal(false)}
            onAdd={handleAddCustomer}
            nextId={customers.length + 1}
          />
        </div>
      </div>
    </div>
  );
}
