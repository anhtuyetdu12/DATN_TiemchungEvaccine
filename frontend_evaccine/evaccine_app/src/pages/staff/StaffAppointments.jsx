import { useEffect, useState } from "react";
import AppointmentDetailModal from "./modal/appointment/AppointmentDetailModal";
import ConfirmModal from "../../components/ConfirmModal";
import CompleteBookingModal from "./modal/appointment/CompleteBookingModal";
import Pagination from "../../components/Pagination";
import { toast } from "react-toastify";
import api from "../../services/axios";

export default function StaffAppointments() {
  // --- state dữ liệu & điều khiển ---
  const [appointments, setAppointments] = useState([]); // list (page hiện tại)
  const [count, setCount] = useState(0); // tổng bản ghi
  const [page, setPage] = useState(1); // trang đang xem
  const perPage = 10; // cấu hình DRF của bạn

  // draft (UI đang gõ/chọn) vs applied (đã bấm Lọc)
  const [draftSearch, setDraftSearch] = useState("");
  const [draftFilter, setDraftFilter] = useState("all");
  const [draftDate, setDraftDate] = useState("");

  const [appliedSearch, setAppliedSearch] = useState("");
  const [appliedFilter, setAppliedFilter] = useState("all");
  const [appliedDate, setAppliedDate] = useState("");

  const [loading, setLoading] = useState(false);
  const [openStatus, setOpenStatus] = useState(false);

  const [detail, setDetail] = useState(null); // đối tượng booking để xem modal
  const [confirmAction, setConfirmAction] = useState(null); // { action: 'confirm'|'cancel', item }
  const [reactionNote, setReactionNote] = useState("");
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [completingItem, setCompletingItem] = useState(null);
  const [submittingComplete, setSubmittingComplete] = useState(false);

  
  const openCompleteModal = (item) => {
    setCompletingItem(item);
    setReactionNote("");
    setShowCompleteModal(true);
  };

  const statusOptions = [
    { value: "all", label: "Tất cả trạng thái" },
    { value: "confirmed", label: "Đã xác nhận" },
    { value: "pending", label: "Chờ xác nhận" },
    { value: "cancelled", label: "Đã hủy" },
    { value: "completed", label: "Đã tiêm xong" },
  ];

  const fetchAppointments = async () => {
     setLoading(true);
     try {
       const params = { page };
      if (appliedFilter !== "all") params.status = appliedFilter;
      if (appliedSearch) params.search = appliedSearch.trim();
      if (appliedDate) {
        params.date_from = appliedDate;   // lọc đúng 1 ngày
        params.date_to   = appliedDate;
        }
        const res = await api.get("/records/bookings/", { params });
        const data = res.data;
        const rows = data.results || data;
        setAppointments(rows);
        setCount(data.count ?? rows.length ?? 0);
      } catch (err) {
        console.error(err);
        toast.error("Không tải được danh sách lịch hẹn");
      } finally {
        setLoading(false);
      }
  };


  // Chỉ fetch khi đổi trang HOẶC có thay đổi đã-ap-dụng (sau khi bấm Lọc)
  useEffect(() => {
    fetchAppointments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, appliedFilter, appliedSearch, appliedDate]);

  const openConfirm = (action, item) => { setConfirmAction({ action, item });  };

  const doAction = async () => {
    if (!confirmAction) return;
    const { action, item } = confirmAction;
    try {
      if (action === "confirm") {
        await api.post(`/records/bookings/${item.id}/confirm/`);
        toast.success(`Đã xác nhận lịch #${item.id}`);
      } else if (action === "cancel") {
        await api.post(`/records/bookings/${item.id}/cancel/`);
        toast.warn(`Đã hủy lịch #${item.id}`);
      }
      await fetchAppointments();
    } catch (e) {
      const msg = e?.response?.data?.detail || "Thao tác thất bại";
      toast.error(msg);
    } finally {
      setConfirmAction(null);
    }
  };

  const statusPillFromLabel = (label) => {
    const map = {
      "Chờ xác nhận": "tw-bg-yellow-100 tw-text-yellow-700",
      "Đã xác nhận":  "tw-bg-green-100 tw-text-green-700",
      "Đã tiêm xong": "tw-bg-blue-100 tw-text-blue-700",
      "Đã hủy":       "tw-bg-red-100 tw-text-red-700",
      "Trễ hẹn":      "tw-bg-orange-100 tw-text-orange-700",
    };
    const cls = map[label] || "tw-bg-gray-100 tw-text-gray-700";
    return <span className={`${cls} tw-px-3 tw-py-1 tw-rounded-full`}>{label || "—"}</span>;
  };

  // --- util tải file từ blob ---
  const downloadBlob = (blob, filename) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const buildQuery = () => {
    const params = new URLSearchParams();
    if (appliedFilter !== "all") params.set("status", appliedFilter);
    if (appliedSearch) params.set("search", appliedSearch.trim());
    if (appliedDate) {
      params.set("date_from", appliedDate);
      params.set("date_to", appliedDate);
    }
    if (page) params.set("page", String(page));
    return params.toString();
  };

  // --- Xuất Excel ---
  const exportExcel = async () => {
    try {
      const qs = buildQuery(); // dùng appliedFilter, appliedSearch, appliedDate, page nếu bạn muốn
      const res = await api.get(`/records/bookings/export/excel/?${qs}`, {
        responseType: "blob",
      });

      downloadBlob(
        res.data,
        `lich-hen${appliedDate ? `-${appliedDate}` : ""}.xlsx`
      );
    } catch (e) {
      console.error(e);
      toast.error("Xuất Excel thất bại");
    }
  };


  const applyFilter = () => {
    setAppliedSearch(draftSearch);
    setAppliedFilter(draftFilter);
    setAppliedDate(draftDate);
    setPage(1);
  };
  const resetAll = () => {
    setDraftSearch("");
    setDraftFilter("all");
    setDraftDate("");
    setAppliedSearch("");
    setAppliedFilter("all");
    setAppliedDate("");
    setPage(1);
    // useEffect sẽ tự fetch
  };

 // Hiển thị danh sách vắc xin mà người dùng đã đặt trong lịch hẹn
  const getVaccineList = (booking) => {
    const items = booking?.items_detail || [];
    if (items.length) {
      return items
        .map(it => {
          const name = it?.vaccine?.name?.trim();
          const qty = it?.quantity ?? 1;
          return name ? `${name}${qty > 1 ? ` x${qty}` : ""}` : null;
        })
        .filter(Boolean);
    }
    // fallback: lịch cũ có 1 vaccine hoặc là gói
    if (booking?.vaccine?.name) return [booking.vaccine.name];
    if (booking?.package?.name) return [`Gói: ${booking.package.name}`];
    if (booking?.vaccine_type) return [booking.vaccine_type];
    if (booking?.vaccine_name) return [booking.vaccine_name];
    return [];
  };

  // Lấy danh sách "phòng bệnh" từ các item trong lịch hẹn
  const getDiseaseList = (booking) => {
    const items = booking?.items_detail || [];
    if (items.length) {
      return items
        .map((it) => {
          const diseaseName =
            it?.vaccine?.disease?.name ||  // kiểu mới: vaccine.disease.name
            it?.disease?.name ||           // nếu BE trả thẳng disease
            it?.disease_name ||            // hoặc text disease_name
            null;
          return diseaseName ? diseaseName.trim() : null;
        })
        .filter(Boolean);
    }

    // fallback cho dữ liệu cũ
    if (booking?.disease?.name) return [booking.disease.name];
    if (booking?.disease_name) return [booking.disease_name];
    return [];
  };

  // Chỉ hiển thị 2 dòng; còn lại là "…". Hover sẽ thấy đầy đủ qua title
  const VaccineCell = ({ booking }) => {
    const list = getVaccineList(booking);
    if (!list.length) return <>—</>;
    const preview = list.slice(0, 2);
    const hasMore = list.length > 2;
    const title = list.join("\n");
    return (
      <div className="tw-space-y-1" title={title}>
        {preview.map((line, idx) => (
          <div key={idx} className="tw-truncate">{line}</div>
        ))}
        {hasMore && <div className="tw-text-gray-400">…</div>}
      </div>
    );
  };

  const DiseaseCell = ({ booking }) => {
    const list = getDiseaseList(booking);
    if (!list.length) return <>—</>;
    const preview = list.slice(0, 2);
    const hasMore = list.length > 2;
    const title = list.join("\n");

    return (
      <div className="tw-space-y-1" title={title}>
        {preview.map((line, idx) => (
          <div key={idx} className="tw-truncate">
            {line}
          </div>
        ))}
        {hasMore && <div className="tw-text-gray-400">…</div>}
      </div>
    );
  };


  //xác nhận phản ứng sau tiêm
  const submitComplete = async () => {
    if (!completingItem || submittingComplete) return;
    setSubmittingComplete(true);
    try {
      await api.post(`/records/bookings/${completingItem.id}/complete/`, {
        reaction_note: reactionNote || undefined,
      });
      toast.success(`Đã tiêm xong lịch #${completingItem.id}`);
      await fetchAppointments();
    } catch (e) {
      toast.error(e?.response?.data?.detail || "Hoàn thành thất bại");
    } finally {
      setSubmittingComplete(false);
      setShowCompleteModal(false);
      setCompletingItem(null);
      setReactionNote("");
    }
  };


  // Định dạng ngày về dd/mm/yyyy
  const formatDate = (isoStr) => {
    if (!isoStr) return "—";
    const d = new Date(`${isoStr}T00:00:00`);
    if (Number.isNaN(d.getTime())) return isoStr; // fallback nếu chuỗi không phải ISO
    const dd = `${d.getDate()}`.padStart(2, "0");
    const mm = `${d.getMonth() + 1}`.padStart(2, "0");
    const yyyy = d.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  };

  return (
    <div className="tw-p-6 tw-space-y-6 tw-pt-[150px] tw-pb-[50px] tw-bg-cyan-50">
      {/* Header */}
      <div className="tw-flex tw-items-center tw-justify-center tw-gap-3">
        <i className="fa-solid fa-calendar-check tw-mb-4 tw-text-5xl tw-bg-gradient-to-r tw-from-purple-500 tw-via-blue-500 tw-to-pink-500 tw-bg-clip-text tw-text-transparent"></i>
        <h1 className="tw-text-[30px] tw-pb-5 tw-ml-3 tw-font-bold tw-bg-gradient-to-r tw-from-purple-500 tw-via-blue-500 tw-to-pink-500 tw-bg-clip-text tw-text-transparent">
          Quản lý lịch hẹn
        </h1>
      </div>

      {/* Bộ lọc */}
      <div className="tw-bg-white tw-rounded-xl tw-shadow-md tw-p-4 tw-space-y-4 tw-py-6">
        {/* Hàng trên: chỉ các bộ lọc */}
        <div className="tw-px-6">
          <div className="tw-grid md:tw-grid-cols-3 tw-gap-4">
            <input  type="text"  placeholder="Nhập thông tin tìm kiếm..."
              className="tw-border tw-rounded-lg tw-px-3 tw-py-2 focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-blue-300 focus:tw-border-blue-800"
              value={draftSearch} onChange={(e) => setDraftSearch(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') applyFilter(); }}
            />

            {/* Dropdown trạng thái */}
            <div className="tw-relative">
              <button type="button" onClick={() => setOpenStatus(!openStatus)}
                className="tw-w-full tw-flex tw-justify-between tw-items-center tw-border tw-border-gray-300 tw-rounded-lg tw-px-3 tw-py-2
                         tw-text-gray-700 hover:tw-border-[#56b6f7] hover:tw-ring-1 hover:tw-ring-[#56b6f7]" >
                 <span>{statusOptions.find((o) => o.value === draftFilter)?.label}</span>
                <i className={`fa-solid ${openStatus ? "fa-angle-up" : "fa-angle-down"}`}></i>
              </button>

              {openStatus && (
                <div className="tw-absolute tw-top-full tw-mt-2 tw-left-1/2 -tw-translate-x-1/2 tw-w-[95%] tw-bg-white tw-z-10 tw-text-xl tw-space-y-0.5 
                                tw-border tw-border-gray-300 tw-rounded-lg tw-shadow-lg tw-py-2">
                  {statusOptions.map((item) => (
                    <div key={item.value}
                      onClick={() => {
                        setDraftFilter(item.value);
                        setOpenStatus(false);
                      }}
                      className={`tw-flex tw-items-center tw-justify-between tw-px-3 tw-py-2 tw-cursor-pointer 
                       ${draftFilter === item.value ? "tw-bg-[#e6f7fa]" : "hover:tw-bg-[#e6f7fa]"}`} >
                      <span>{item.label}</span>
                      {draftFilter === item.value && (<i className="fa-solid fa-check tw-text-[#1999ee]"></i>)}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Chỉ 1 ngày hẹn */}
            <input  type="date" value={draftDate}
               onChange={(e) => setDraftDate(e.target.value)}  title="Chọn 1 ngày hẹn"
              className="tw-border tw-rounded-lg tw-px-3 tw-py-2 focus:tw-outline-none"/>
          </div>
        </div>

        {/* Hàng dưới: 4 nút chia 2 bên */}
        <div className="tw-flex tw-items-center tw-justify-between tw-gap-4 tw-pt-2 tw-px-6">
          {/* Bên trái: Lọc & Reset */}
          <div className="tw-flex tw-gap-3">
            <button onClick={applyFilter}  title="Áp dụng bộ lọc"
              className="tw-bg-blue-600 tw-text-white tw-px-6 tw-py-2 tw-rounded-full tw-font-medium hover:tw-bg-blue-500 tw-shadow" >
              <i className="fa-solid fa-filter tw-mr-2"></i>
              Lọc
            </button>
            <button onClick={resetAll}
              className="tw-bg-red-600 tw-text-white tw-px-6 tw-py-2 tw-rounded-full tw-font-medium hover:tw-bg-red-500 tw-shadow" >
              Reset
            </button>
          </div>

          {/* Bên phải: Xuất PFX & Xuất Excel */}
          <div className="tw-flex tw-gap-3 tw-flex-wrap">
            <button onClick={exportExcel}  title="Xuất Excel theo bộ lọc hiện tại"
              className="tw-bg-green-600 tw-text-white tw-px-5 tw-py-2 tw-rounded-full hover:tw-bg-green-500 tw-shadow">
              <i className="fa-solid fa-file-excel tw-mr-2"></i>
              Xuất Excel
            </button>
          </div>
        </div>
      </div>

      {/* Bảng */}
      <div className="tw-bg-white tw-rounded-xl tw-shadow-md tw-overflow-x-auto">
        <table className="tw-w-full tw-text-xl tw-border-collapse tw-py-5 tw-table-fixed">
          <thead>
            <tr className="tw-bg-green-100 tw-text-xl">
              <th className="tw-w-[180px] tw-py-4 tw-px-2 tw-text-center">Khách hàng</th>
              <th className="tw-w-[100px] tw-py-4 tw-px-2 tw-text-center ">Người tiêm</th>
              <th className="tw-w-[100px] tw-py-4 tw-px-2 tw-text-center">Ngày hẹn</th>
              <th className="tw-w-[150px] tw-py-4 tw-px-2 tw-text-center">Phòng bệnh</th>
              <th className="tw-w-[150px] tw-py-4 tw-px-2 tw-text-center">Loại vắc xin</th>
              <th className="tw-w-[100px] tw-py-4 tw-px-2 tw-text-center">Bệnh nền</th>
              <th className="tw-w-[100px] tw-py-4 tw-px-2 tw-text-center">Trạng thái</th>
              <th className="tw-w-[340px] tw-py-4 tw-px-2 tw-text-center">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {!loading && appointments.length === 0 && (
              <tr>
                <td colSpan={8} className="tw-text-center tw-text-red-500 tw-italic tw-p-6">
                  Không có lịch hẹn nào cả !
                </td>
              </tr>
            )}
            {loading && (
              <tr>
                <td colSpan={8} className="tw-text-center tw-text-gray-500 tw-p-6">Đang tải…</td>
              </tr>
            )}

            {appointments.map((item) => (
              <tr key={item.id} className="tw-border-b hover:tw-bg-pink-50 tw-text-xl">
                <td className="tw-p-2">{item.user?.email || "—"}</td>
                <td className="tw-p-2">{item.member?.full_name || "—"}</td>
                <td className="tw-p-2">{formatDate(item.appointment_date)}</td>
                <td className="tw-p-2 tw-text-center">
                  <DiseaseCell booking={item} />
                </td>
                <td className="tw-p-2 "><VaccineCell booking={item} /></td>
                <td className="tw-p-2  tw-text-slate-700 tw-max-w-[220px] tw-truncate"
                  title={item.chronic_note || item.member?.chronic_note || ""} >
                  {item.chronic_note || item.member?.chronic_note || "Không có"}
                </td>
                <td className="tw-p-2 tw-text-left">
                  <div className="tw-flex tw-items-center "> {statusPillFromLabel(item.status_label || item.status)}</div>
                </td>
                <td className="tw-p-2 tw-space-x-3">
                  <button onClick={() => openConfirm("confirm", item)} disabled={item.status !== "pending"}
                    className="tw-bg-green-100 tw-text-green-600 tw-px-3 tw-py-2 tw-rounded-full hover:tw-bg-green-200 disabled:tw-opacity-50">
                    <i className="fa-solid fa-check-to-slot tw-mr-2"></i>
                    Xác nhận
                  </button>
                  <button onClick={() => openConfirm("cancel", item)} disabled={item.status === "cancelled"}
                    className="tw-bg-red-100 tw-text-red-600 tw-px-3 tw-py-2 tw-rounded-full hover:tw-bg-red-200 disabled:tw-opacity-50" >
                    <i className="fa-solid fa-trash tw-mr-2"></i>
                    Hủy
                  </button>
                  <button onClick={() => setDetail(item)}
                    className="tw-bg-yellow-100 tw-text-yellow-600 tw-px-3 tw-py-2 tw-rounded-full hover:tw-bg-yellow-200" >
                    <i className="fa-solid fa-eye tw-mr-2"></i>
                    Xem
                  </button>
                  <button
                     onClick={() => openCompleteModal(item)}  disabled={item.status !== "confirmed"}
                    className="tw-bg-blue-100 tw-text-blue-600 tw-px-3 tw-py-2 tw-rounded-full hover:tw-bg-blue-200 disabled:tw-opacity-50" >
                    <i className="fa-solid fa-syringe tw-mr-2"></i>
                    Hoàn thành
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Phân trang */}
        {count > perPage && (
          <Pagination
            page={page}
            totalItems={count}      
            perPage={perPage}      
            onPageChange={setPage}
          />
        )}
      </div>

      {/* Modal chi tiết: truyền nguyên booking từ API */}
      <AppointmentDetailModal detail={detail} onClose={() => setDetail(null)} />

      {/* Modal xác nhận/hủy */}
      <ConfirmModal
        show={!!confirmAction} title="Xác nhận hành động"
        message={
          confirmAction && (
            <>
              {confirmAction.action === "confirm" && (
                <>
                  Bạn có chắc muốn <b>xác nhận</b> lịch hẹn #<b>{confirmAction.item.id}</b> không?
                  <br />
                  Người tiêm: <b className="tw-text-blue-500">{confirmAction.item.member?.full_name || "Không rõ"}</b> - 
                   <i className="tw-text-blue-500" >{formatDate(confirmAction.item.appointment_date)}</i>
                  <br />
                  Email khách hàng: <b>{confirmAction.item.user?.email || "Không rõ"}</b>
                </>
              )}
              {confirmAction.action === "cancel" && (
                <>
                  Bạn có chắc muốn <b>hủy</b> lịch hẹn #<b>{confirmAction.item.id}</b> không?
                  <br />
                  Người tiêm: <b className="tw-text-orange-500">{confirmAction.item.member?.full_name || "Không rõ"}</b> - 
                   <i className="tw-text-orange-500">{formatDate(confirmAction.item.appointment_date)}</i>
                  <br />
                  Email khách hàng: <b>{confirmAction.item.user?.email || "Không rõ"}</b>
                </>
              )}
            </>
          )
        }
        onCancel={() => setConfirmAction(null)}
        onConfirm={doAction}
      />

      <CompleteBookingModal
        show={showCompleteModal}
        booking={completingItem}
        note={reactionNote}
        setNote={setReactionNote}
        onCancel={() => { setShowCompleteModal(false); setCompletingItem(null); setReactionNote(""); }}
        onConfirm={submitComplete}
      />
    </div>
  );
}
