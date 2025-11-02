import { useEffect, useMemo, useState, useCallback, useRef  } from "react";
import { toast } from "react-toastify";
import { sendCustomerNotification, previewAudience } from "../../services/notificationService";
import api from "../../services/axios";
import Pagination from "../../components/Pagination";
import Dropdown from "../../components/Dropdown";

export default function StaffSendNotification() {
  const fetchIdRef = useRef(0);
  // ===== State chính =====
  const [audience, setAudience] = useState(""); // "", "upcoming", "nextdose", "custom"
  const [daysBefore, setDaysBefore] = useState(3);
  const [nextDoseDays, setNextDoseDays] = useState(3);
  const [selected, setSelected] = useState([]);

  const [channels, setChannels] = useState({ email: false, app: true, sms: false });
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [previewCount, setPreviewCount] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const [apptLoading, setApptLoading] = useState(false);
  const [appts, setAppts] = useState([]);
  const [apptCount, setApptCount] = useState(0);
  const [apptPage, setApptPage] = useState(1);
  const apptPerPage = 10;

  const [apptSearch, setApptSearch] = useState("");
  const [apptStatus, setApptStatus] = useState("all"); 
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const [sample, setSample] = useState({ name: "", date: "" });

  const selectedBookingIds = useMemo(
    () => selected.map(x => x.id).filter(Boolean),
    [selected]
  );

const upsertSelected = (items) => {
  setSelected((prev) => {
    const byId = new Map(prev.map(x => [x.id, x]));
    items.forEach(it => byId.set(it.id, it)); // ghi đè nếu trùng id
    return Array.from(byId.values());
  });
};

const removeSelected = (id) =>
  setSelected(prev => prev.filter(x => x.id !== id));

const clearSelected = () => setSelected([]);

const toDisplayDate = (iso) => formatDate(iso);

  // ===== Tiện ích/const nội bộ (không tạo component riêng) =====
  const displayUser = (u) => (u?.phone?.trim() ? u.phone.trim() : (u?.email || "—"));
  const statusCls = (s, label) => {
    if (label === "Trễ hẹn") {
      return "tw-bg-pink-100 tw-text-pink-700 tw-ring-1 tw-ring-pink-200";
    }
    const m = {
      pending: "tw-bg-amber-50 tw-text-amber-700 tw-ring-1 tw-ring-amber-200",
      confirmed: "tw-bg-green-50 tw-text-green-700 tw-ring-1 tw-ring-green-200",
      completed: "tw-bg-blue-50 tw-text-blue-700 tw-ring-1 tw-ring-blue-200",
      cancelled: "tw-bg-rose-50 tw-text-rose-700 tw-ring-1 tw-ring-rose-200",
      default: "tw-bg-purple-50 tw-text-purple-700 tw-ring-1 tw-ring-purple-200",
    };
    return m[s] || m.default;
  };

  // ===== Fetch lịch hẹn =====
  const fetchAppts = useCallback(async () => {
    setApptLoading(true);
    const fetchId = ++fetchIdRef.current; // đánh dấu request mới nhất
    try {
      if (audience === "custom") {
        const params = { page: apptPage };
        if (apptStatus && apptStatus !== "all") {
          params.status = apptStatus;
        }
        if (apptSearch) params.search = apptSearch.trim();
        if (dateFrom) params.date_from = dateFrom;
        if (dateTo) params.date_to = dateTo;

        const res = await api.get("/records/bookings/", { params });
        //  response này có còn là request mới nhất không?
        if (fetchId !== fetchIdRef.current) return;

        const data = res.data;
        let  rows = data.results || data;

        if (apptStatus === "pending") {
          const todayStr = new Date().toISOString().slice(0, 10); // yyyy-mm-dd
          rows = rows.filter((b) => {
            // nếu ngày hẹn < hôm nay và chưa completed/cancelled → coi như overdue → bỏ
            const appt = b.appointment_date;
            if (!appt) return true;
            const isPast = appt < todayStr;
            const isDone = b.status === "completed" || b.status === "cancelled";
            if (isPast && !isDone) return false; // loại ra khỏi danh sách pending
            return true;
          });
        }
        setAppts(rows);
        setApptCount(data.count ?? rows.length ?? 0);
        return;
      }

      // 2) audience = upcoming / nextdose / overdue -> gọi previewAudience
      const params = { audience, detail: 1 };
      if (audience === "upcoming") params.days_before = daysBefore;
      if (audience === "nextdose") {
        params.next_dose_days = nextDoseDays;
        params.only_unscheduled = 1;         
      }

      const data = await previewAudience(params);
      if (fetchId !== fetchIdRef.current) return;

      const rows = data.results || [];
      let cleanRows = rows.map((r) => {
        let statusCode = r.status || audience;
        let statusLabel;
        if (statusCode === "pending") statusLabel = "Chờ xác nhận";
        else if (statusCode === "confirmed") statusLabel = "Đã xác nhận";
        else if (statusCode === "overdue") statusLabel = "Trễ hẹn";
        else if (statusCode === "nextdose") statusLabel = "Mũi tiếp theo";
        else statusLabel = "Khác";

        return {
          id: r.booking_id || r.record_id,
          user: {
            phone: r.user_phone || "",
            email: r.user_email || "",
          },
          member: { full_name: r.member_name || "" },
          appointment_date: r.appointment_date || r.next_dose_date || "",
          status: statusCode,
          status_label: statusLabel,
          vaccine_name: r.vaccine || "",
          vaccine_interval_days: r.vaccine_interval_days,
          vaccine_doses_required: r.vaccine_doses_required,
          disease_name: r.disease_name,
          already_scheduled: r.already_scheduled ?? false,  
          items_detail: [],
        };
      });

      if (audience === "nextdose" && rows.length > 0) {
        const r = rows[0];
        setSample({
          name: r.member_name || "Khách hàng",
          dob: r.member_dob || "",
          date: r.next_dose_date || "",
          vaccine: r.vaccine || "",
          interval: r.vaccine_interval_days ?? null,
          total_doses: r.vaccine_doses_required ?? null,
          disease: r.disease_name || "",
        });
      }

      // chỗ lọc trạng thái của bạn vẫn giữ:
      if (apptStatus && apptStatus !== "all") {
        cleanRows = cleanRows.filter((row) => {
          if (row.status_label === "Trễ hẹn") return apptStatus === "overdue";
          return row.status === apptStatus;
        });
      }
      setAppts(cleanRows);
      setApptCount(cleanRows.length);
    } finally {
      // chỉ tắt loading nếu đây là request mới nhất
      if (fetchId === fetchIdRef.current) {
        setApptLoading(false);
      }
    }
  }, [ audience, apptPage, apptStatus,  apptSearch, dateFrom, dateTo, daysBefore, nextDoseDays,]);


  useEffect(() => {
    const delay = apptSearch ? 350 : 0;     // debounce khi gõ search, còn lại bắn ngay
    const t = setTimeout(() => { fetchAppts(); }, delay);
    return () => clearTimeout(t);
  }, [fetchAppts, apptSearch]);

  // ===== Đồng bộ audience upcoming => set khoảng ngày + trạng thái =====
  useEffect(() => {
    if (audience === "upcoming") {
      const today = new Date();
      const to = new Date();
      to.setDate(today.getDate() + Number(daysBefore || 0));
      const fmt = (d) =>
        `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      setDateFrom(fmt(today));
      setDateTo(fmt(to));
      setApptStatus("all");
    }
  }, [audience, daysBefore]);

  // ===== Options / template / preview =====
  const options = [
    // { value: "", label: "-- Chọn nhóm người nhận --" },
    { value: "upcoming", label: "Khách có lịch tiêm sắp tới (Booking)" },
    { value: "nextdose", label: "Khách đến kỳ mũi tiếp theo (Sổ tiêm)" },
    { value: "overdue", label: "Khách đã trễ hẹn" }, 
    { value: "custom", label: "Chọn danh sách cụ thể" },
  ];
  const templates = [
    { k: "t3", label: "Nhắc T-3", title: "Nhắc lịch tiêm sắp tới", msg: "Chào {{name}}, lịch tiêm của {{member}} là {{date}}. Vui lòng đến đúng giờ và mang theo giấy tờ cần thiết." },
    { k: "t1", label: "Nhắc T-1", title: "Nhắc lịch tiêm ngày mai", msg: "Chào {{name}}, ngày mai {{date}} {{member}}  có lịch tiêm. Nếu cần đổi lịch tiêm, xin liên hệ tổng đài - 18006926." },
    { k: "today", label: "Hôm nay", title: "Hôm nay bạn có lịch tiêm", msg: "Chào {{name}}, hôm nay {{date}} {{member}}  có lịch tiêm. Hẹn gặp bạn tại cơ sở tiêm chủng." },
    { k: "nextdose", label: "Theo phác đồ", title: "Nhắc lịch mũi tiêm tiếp theo",
      msg: "Chào {{name}}, {{member}}  đã đến lịch tiêm mũi tiếp theo vắc xin {{vaccine}} vào {{date}}. Phác đồ yêu cầu {{total_doses}} mũi, mỗi mũi cách nhau {{interval}} ngày. Vui lòng sắp xếp thời gian để tiêm đúng lịch."
  },
  ];
  
  const statusOptions = [
    { value: "all", label: "Tất cả" },
    { value: "pending", label: "Chờ xác nhận" },
    { value: "confirmed", label: "Đã xác nhận" },
    { value: "overdue", label: "Trễ hẹn" },
  ];

  const toggleChannel = (key) => setChannels((s) => ({ ...s, [key]: !s[key] }));

  useEffect(() => {
    let mounted = true;
    const run = async () => {
      setPreviewCount(null);
      if (!audience) return;
      try {
        const params = { audience };
        if (audience === "upcoming") params.days_before = daysBefore;
        if (audience === "nextdose") {
          params.next_dose_days = nextDoseDays;
          params.only_unscheduled = 1;
        }
        if (audience === "custom") params.customer_ids = selectedBookingIds;
        const data = await previewAudience(params);
        if (mounted) setPreviewCount(data?.count ?? 0);
      } catch {
        if (mounted) setPreviewCount(null);
      }
    };
    run();
    return () => { mounted = false; };
  }, [audience, daysBefore, nextDoseDays, selectedBookingIds]);


  const validate = () => {
    if (!audience) { toast.warn("Vui lòng chọn nhóm người nhận."); return false; }
    if (!channels.email && !channels.app && !channels.sms) { toast.warn("Chọn ít nhất 1 kênh gửi."); return false; }
    if (!title.trim()) { toast.warn("Vui lòng nhập tiêu đề."); return false; }
    if (!message.trim()) { toast.warn("Vui lòng nhập nội dung."); return false; }
    if (audience === "custom" && (!selectedBookingIds || selectedBookingIds.length === 0)) {
      toast.warn("Chưa chọn khách nào trong danh sách cụ thể."); return false;
    }
    if (channels.sms && message.length > 160) {
      toast.warn("Nội dung SMS nên ≤ 160 ký tự để tối ưu chi phí.");
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const submitter = e.nativeEvent?.submitter;
    if (!submitter || submitter.name !== "submitType" || submitter.value !== "send") {
      return; // submit phát sinh từ nút phân trang → bỏ qua
    }

    if (submitting) return;
    if (!validate()) return;

    setSubmitting(true);
    try {
      const payload = {
        audience,
        days_before: audience === "upcoming" ? Number(daysBefore) : undefined,
        next_dose_days: audience === "nextdose" ? Number(nextDoseDays) : undefined,
        customer_ids: audience === "custom" ? selectedBookingIds : undefined,
        channels,
        title: title.trim(),
        message: message.trim(),
        distinct_user: false, 
      };
      await sendCustomerNotification(payload);
      toast.success("Đã gửi thông báo nhắc lịch cho khách.", { toastId: "notify-customers-success" });
    } catch (err) {
      console.error(err);
      toast.error("Gửi thông báo thất bại.");
    } finally {
      setSubmitting(false);
    }
  };

  const previewRendered = useMemo(() => {
    const name = sample.name || "Khách hàng";
    const rawDate = sample.date;
    const date = rawDate || "dd/mm/yyyy";

    const interval = sample.interval != null ? String(sample.interval) : "…";
    const total = sample.total_doses != null ? String(sample.total_doses) : "…";
    const vaccine = sample.vaccine || "vắc xin";
    const disease = sample.disease || "";
    const dob = sample.dob
      ? new Date(sample.dob).toLocaleDateString("vi-VN")
      : "";

    return message
      .replaceAll("{{name}}", name)
      .replaceAll("{{member}}", sample.name || "Thành viên")
      .replaceAll("{{date}}", date)
      .replaceAll("{{interval}}", interval)
      .replaceAll("{{total_doses}}", total)
      .replaceAll("{{vaccine}}", vaccine)
      .replaceAll("{{disease}}", disease)
      .replaceAll("{{dob}}", dob);
  }, [message, sample]);


  const formatDate = (isoStr) => {
    if (!isoStr) return "—";
    const d = new Date(`${isoStr}T00:00:00`);
    if (Number.isNaN(d.getTime())) return isoStr;
    const dd = `${d.getDate()}`.padStart(2, "0");
    const mm = `${d.getMonth() + 1}`.padStart(2, "0");
    const yyyy = d.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  };

  return (
    <div className="tw-min-h-screen tw-bg-[#d5f9fa] tw-pt-[110px] tw-w-full  tw-pb-12 tw-mx-auto">
      <div className="tw-flex tw-items-center tw-justify-center tw-py-[20px]">
        <i className="fa-regular fa-bell tw-text-6xl tw-mr-3 tw-bg-gradient-to-r tw-from-[#8323e2] tw-to-pink-500 tw-bg-clip-text tw-text-transparent"></i>
        <h1 className="tw-text-[30px] tw-font-bold tw-bg-gradient-to-r tw-from-[#8323e2] tw-to-pink-500 tw-bg-clip-text tw-text-transparent tw-py-2">
          Nhắc lịch tiêm cho khách hàng
        </h1>
      </div>

      <div className="tw-sticky tw-top-0 tw-z-30 tw-backdrop-blur tw-bg-white/80 tw-border-b tw-border-gray-100  ">
        <div className=" tw-w-[95%] tw-mx-auto tw-px-4 lg:tw-px-6">
          <div className="tw-flex tw-items-center tw-justify-between tw-py-3">
            <div className="tw-flex tw-items-center tw-gap-3">
              <div className="tw-w-9 tw-h-9 tw-rounded-lg tw-bg-gradient-to-tr tw-from-sky-500 tw-to-emerald-500 tw-flex tw-items-center tw-justify-center">
               <i className="fa-solid fa-bell tw-text-white tw-text-[16px]" />
              </div>
              <div>
                <div className="tw-text-[15px] tw-font-semibold tw-text-gray-900">Nhắc lịch tiêm</div>
                <div className="tw-text-[12px] tw-text-gray-500">Soạn, lọc danh sách và gửi đa kênh</div>
              </div>
            </div>
            <div className="tw-hidden md:tw-flex tw-items-center tw-gap-4">
              <div className="tw-text-[12px] tw-text-gray-600">
                Dự kiến gửi: <b className="tw-text-gray-900">{previewCount !== null && audience ? previewCount : "—"}</b>
              </div>
              <button  form="notify-form"  type="submit"  disabled={submitting} name="submitType" value="send"
                className="tw-bg-emerald-600 tw-text-white tw-text-[13px] tw-font-semibold tw-rounded-lg tw-px-4 tw-py-2 hover:tw-bg-emerald-500" >
                Gửi nhắc lịch
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className=" tw-w-full tw-mx-auto tw-px-4 lg:tw-px-6 tw-pt-6 tw-pb-10">
        <form id="notify-form" onSubmit={handleSubmit} className="tw-grid lg:tw-grid-cols-[minmax(0,1fr)_minmax(320px,34vw)] xl:tw-grid-cols-[minmax(0,1fr)_360px] tw-gap-6">

          {/* LEFT column */}
          <div className="tw-space-y-6 tw-min-w-0">
            <section className="tw-bg-white tw-rounded-2xl tw-shadow-sm tw-border tw-border-gray-100">
              <header className="tw-flex tw-items-center tw-justify-between tw-border-b tw-border-gray-100 tw-px-4 md:tw-px-5 tw-pt-3">
                <div>
                  <h3 className="tw-text-[15px] tw-font-semibold tw-text-gray-900">Chọn nhóm người nhận</h3>
                  <p className="tw-text-[12px] tw-text-gray-500">Khoanh vùng đúng đối tượng trước khi gửi</p>
                </div>
                <div className="tw-ml-1">
                  <Dropdown  value={audience}  onChange={(v) => setAudience(v)} options={options}  className="tw-w-[260px] tw-text-xl"/>
                </div>
              </header>

              <div className="tw-p-4 md:tw-p-5">
                <div className="tw-grid  tw-gap-4">
                  {audience === "upcoming" && (
                    <div className="tw-flex tw-items-center tw-gap-2">
                      <i className="fa-regular fa-clock tw-text-sky-700 tw-text-[16px]" />
                      <label className="tw-text-[13px] tw-font-medium tw-text-gray-700">Nhắc trước</label>
                      <input  type="number" min={0} max={30} value={daysBefore}
                        onChange={(e) => setDaysBefore(e.target.value)}
                        className="tw-w-20 tw-text-center tw-border tw-rounded-lg tw-px-2 tw-py-1"
                      />
                      <span className="tw-text-[13px] tw-text-gray-600">ngày</span>
                    </div>
                  )}

                  {audience === "nextdose" && (
                    <div className="tw-flex tw-items-center tw-gap-2">
                      <i className="fa-solid fa-syringe tw-text-emerald-700 tw-text-[16px]" />
                      <label className="tw-text-[13px] tw-font-medium tw-text-gray-700">Nhắc trước</label>
                      <input  type="number" min={0} max={60} value={nextDoseDays}
                        onChange={(e) => setNextDoseDays(e.target.value)}
                        className="tw-w-20 tw-text-center tw-border tw-rounded-lg tw-px-2 tw-py-1"
                      />
                      <span className="tw-text-[13px] tw-text-gray-600">ngày (theo ngày mũi kế)</span>
                    </div>
                  )}

                  {audience === "custom" && (
                    <div className="tw-pt-3">
                      {selected.length === 0 ? (
                        <div className="tw-flex tw-items-center tw-gap-2">
                          <span className="tw-text-[13px] tw-text-red-600">  Chưa có khách hàng được chọn  </span>
                        </div>
                      ) : (
                        <>
                          <div className="tw-flex tw-items-center tw-justify-between tw-mb-2">
                            <div className="tw-text-[12px] tw-text-cyan-600">  Đã chọn <b>{selected.length}</b> khách </div>
                            <div className="tw-flex tw-gap-2">
                              <button  type="button" onClick={clearSelected}
                                className="tw-text-[12px] tw-underline tw-text-red-500 hover:tw-text-gray-700" >
                                Xoá tất cả
                              </button>
                            </div>
                          </div>
                          <div className="tw-max-h-48 tw-overflow-auto tw-pr-1">
                            <div className="tw-grid tw-grid-cols-2 md:tw-grid-cols-4 tw-gap-2">
                              {selected.map((it) => (
                                <div key={it.id}
                                  className="tw-flex tw-items-center tw-gap-3 tw-bg-sky-50 tw-border tw-border-sky-200 tw-rounded-xl tw-px-3 tw-py-2 tw-text-left" >
                                  <div className="tw-min-w-0 tw-flex-1">
                                    <div className="tw-text-[12px] tw-font-medium tw-text-sky-800 tw-truncate">  {it.name}  </div>
                                    <div className="tw-mt-0.5 tw-text-[8px] tw-text-sky-700 tw-inline-flex tw-items-center tw-gap-1">
                                      <i className="fa-regular fa-calendar tw-mr-1" />
                                      <span className="tw-bg-white tw-border tw-border-sky-200 tw-rounded-full tw-px-2 tw-py-[2px]">
                                        {it.date || "—"}
                                      </span>
                                    </div>
                                    <div className="tw-mt-0.5 tw-text-[8px] tw-text-cyan-600 tw-truncate">
                                      <i className="fa-solid fa-syringe tw-mr-1" />
                                      {it.vaccine_name || it.vaccine?.name || "Chưa rõ vắc xin"}
                                    </div>
                                  </div>
                                  <button type="button" onClick={() => removeSelected(it.id)}
                                    className="tw-text-red-500 hover:tw-text-red-600 tw-mb-[33px]" title="Xoá khỏi danh sách" >
                                    <i className="fa-solid fa-xmark" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>

                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </section>

            {/* Appointments card */}
            <section className="tw-bg-white tw-rounded-2xl tw-shadow-sm tw-border tw-border-gray-100">
              <header className="tw-flex tw-items-center tw-justify-center tw-border-b tw-border-gray-100 tw-px-4 md:tw-px-5 tw-py-3">
                <div className="tw-text-center">
                  <h3 className="tw-text-[15px] tw-font-semibold tw-text-gray-900">Lịch hẹn</h3>
                  <p className="tw-text-[12px] tw-text-gray-500">Lọc nhanh và thêm vào danh sách gửi</p>
                </div>
              </header>


              <div className="tw-p-4 md:tw-p-5">
                <div className="tw-grid tw-gap-2 md:tw-grid-cols-14 tw-mb-3 tw-text-xl">
                  <input
                    placeholder="Nhập thông tin tìm kiếm ..."
                    value={apptSearch}  onChange={(e) => setApptSearch(e.target.value)}
                    className="tw-col-span-12 md:tw-col-span-5 tw-min-w-0 tw-w-[250px] tw-border tw-rounded-lg tw-px-2 tw-py-1 tw-h-[34px]
                    focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-blue-300 focus:tw-border-blue-800"
                  />
                  <div className="tw-col-span-6 md:tw-col-span-2 tw-w-[140px] tw-ml-1 ">
                    <Dropdown value={apptStatus}  onChange={(v) => { setApptStatus(v); setApptPage(1); }}  options={statusOptions} />
                  </div>
                  <div className="tw-col-span-12 md:tw-col-span-5">
                    <div className="tw-flex tw-items-center tw-gap-2 tw-w-full">
                      <div className="tw-flex tw-items-center tw-gap-2 tw-w-full">
                        <input  type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)}  
                          className="tw-flex-1 tw-border tw-rounded-lg tw-px-3 tw-py-2 focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-blue-300 focus:tw-border-blue-800"  
                        />
                      </div>
                      <i className="fa-solid fa-arrow-right tw-text-gray-600 tw-text-sm" />
                      <div className="tw-flex tw-items-center tw-gap-2 tw-w-full">
                        <input  type="date"  value={dateTo}  onChange={(e) => setDateTo(e.target.value)}
                          className="tw-flex-1 tw-border tw-rounded-lg tw-px-3 tw-py-2 focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-blue-300 focus:tw-border-blue-800"
                        />
                      </div>
                    </div>
                  </div>
                 
                  <div className="tw-col-span-12 tw-flex tw-flex-wrap tw-justify-end tw-gap-2 tw-py-3">
                    <button type="button" onClick={() => { setApptPage(1); fetchAppts(); }}
                            className="tw-w-full sm:tw-w-auto tw-bg-sky-500 tw-text-white tw-rounded-lg tw-text-[13px] tw-px-3 tw-py-2 hover:tw-bg-sky-600">
                      Áp dụng
                    </button>
                    <button type="button" onClick={() => { setApptSearch(""); setApptStatus("all"); setDateFrom(""); setDateTo(""); setApptPage(1); fetchAppts(); }}
                            className="tw-w-full sm:tw-w-auto tw-bg-red-500 tw-text-white tw-rounded-lg tw-text-[13px] tw-px-3 tw-py-2 hover:tw-bg-red-600">
                      Reset
                    </button>
                    <button type="button"
                      onClick={() => {
                        setAudience((a) => a || "custom");
                        const items = appts 
                          .map(b => {
                            if (!b.id) return null;
                            return {
                              id: b.id,
                              user_id: b.user?.id ?? b.user_id,
                              name: b.member?.full_name || "Khách hàng",
                              date: toDisplayDate(b.appointment_date) || "",
                            };
                          })
                          .filter(Boolean);
                        upsertSelected(items);
                        toast.success(`Đã chọn ${items.length} khách trên trang`);
                      }} className="tw-w-full sm:tw-w-auto tw-bg-[#eca817] tw-text-white tw-rounded-lg tw-text-[13px] tw-px-3 tw-py-2 hover:tw-bg-[#e69f08]" >
                      Chọn tất cả trang này
                    </button>

                  </div>
                </div>

                <div className="tw-overflow-x-auto tw-rounded-lg tw-border tw-border-gray-100">
                  <table className="tw-w-full tw-table-fixed tw-text-left tw-text-[13px]">
                    <colgroup>
                      <col className="tw-w-[150px]" /> {/* Khách hàng */}
                      <col className="tw-w-[100px]" /> {/* Người tiêm */}
                      <col className="tw-w-[90px]" /> {/* Ngày hẹn */}
                      <col className="tw-w-[150px]"   /> {/* Vắc xin (cho lớn hơn) */}
                      <col className="tw-w-[100px]" /> {/* Trạng thái */}
                      <col className="tw-w-[60px]"  /> {/* Chọn */}
                    </colgroup>

                    <thead className="tw-bg-sky-50 tw-py-2">
                      <tr className="tw-text-gray-700">
                        <th className="tw-px-3 tw-py-2">Khách hàng</th>
                        <th className="tw-px-3 tw-py-2">Người tiêm</th>
                        <th className="tw-px-3 tw-py-2">Ngày hẹn</th>
                        <th className="tw-px-3 tw-py-2">Vắc xin</th>
                        <th className="tw-px-3 tw-py-2">Trạng thái</th>
                        <th className="tw-px-3 tw-py-2 tw-text-center">Chọn</th>
                      </tr>
                    </thead>
                    <tbody>
                      {apptLoading && (
                        <tr><td colSpan={6} className="tw-px-3 tw-py-6 tw-text-center">Đang tải…</td></tr>
                      )}
                      {!apptLoading && appts.length === 0 && (
                        <tr><td colSpan={6} className="tw-px-3 tw-py-6 tw-text-center tw-text-gray-500">Không có lịch hẹn</td></tr>
                      )}
                      {appts.map((b) => (
                        <tr key={b.id} className="tw-border-t tw-border-gray-100 hover:tw-bg-slate-50">
                          <td className="tw-px-3 tw-py-2">{displayUser(b.user)}</td>
                          <td className="tw-px-3 tw-py-2">{b.member?.full_name || "—"}</td>
                          <td className="tw-px-3 tw-py-2">{formatDate(b.appointment_date)}</td>
                          <td className="tw-px-3 tw-py-2">
                            {(b.items_detail?.length
                              ? b.items_detail.map((it) => it?.vaccine?.name).filter(Boolean).slice(0, 2).join(", ")
                              : b.vaccine_name || b.vaccine?.name || b.package?.name || "—")}
                            {b.items_detail?.length > 2 && " …"}
                          </td>
                          <td className="tw-px-3 tw-py-2">
                            <span className={`tw-inline-flex tw-items-center tw-gap-1 tw-text-[12px] tw-font-medium tw-px-2.5 tw-py-1 tw-rounded-full
                               ${statusCls(b.status, b.status_label)}`}>
                              {b.status_label || b.status}
                            </span>
                          </td>
                          <td className="tw-px-3 tw-py-2 tw-text-center">
                            <button type="button"
                              onClick={() => {
                                setAudience((a) => a || "custom");
                                if (!b.id) return;
                                // lấy tên vắc xin từ từng booking
                                const vaccineName =
                                  (b.items_detail?.length
                                    ? b.items_detail
                                        .map((it) => it?.vaccine?.name)
                                        .filter(Boolean)
                                        .slice(0, 2)
                                        .join(", ")
                                    : b.vaccine?.name || b.package?.name) || "";
                                const item = {
                                  id: b.id,                 // id lịch hẹn (unique)
                                  user_id: b.user?.id ?? b.user_id,
                                  name: b.member?.full_name || "Khách hàng",
                                  date: toDisplayDate(b.appointment_date) || "",
                                  vaccine_name: vaccineName, 
                                };
                                upsertSelected([item]);
                                setSample({ name: item.name, date: item.date });
                                toast.success("Đã thêm vào danh sách chọn");
                              }} className="tw-bg-emerald-50 tw-text-emerald-700 tw-rounded-full tw-text-[12px] tw-px-3 tw-py-1 hover:tw-bg-emerald-100">
                              Thêm
                            </button>

                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <Pagination page={apptPage} totalItems={apptCount} perPage={apptPerPage} onPageChange={setApptPage} />
                <div className="tw-text-[10px] tw-pt-4 tw-text-gray-500">Gợi ý: lọc “Chờ xác nhận” + khoảng ngày để tạo nhắc T-1/T-3 nhanh.</div>
              </div>
            </section>
          </div>

          {/* RIGHT column */}
          <div className="tw-space-y-6 tw-min-w-0">
            <section className="tw-bg-white tw-rounded-2xl tw-shadow-sm tw-border tw-border-gray-100">
              <header className="tw-flex tw-items-center tw-justify-center tw-border-b tw-border-gray-100 tw-px-4 md:tw-px-5 tw-py-3">
                <div className="tw-w-full tw-flex tw-flex-col tw-items-center tw-text-center">
                  <h3 className="tw-text-[15px] tw-font-semibold tw-text-gray-900">Kênh gửi</h3>
                  <p className="tw-text-[12px] tw-text-gray-500">Chọn 1 hoặc nhiều kênh</p>
                </div>
              </header>
              <div className="tw-p-4 md:tw-p-5">
                <div className="tw-flex tw-flex-wrap tw-gap-5 tw-justify-center tw-items-center">
                  <button type="button" role="checkbox" aria-checked={channels.email}
                          onClick={() => toggleChannel("email")}
                          className={`tw-flex tw-items-center tw-gap-2 tw-rounded-lg tw-border tw-px-3 tw-py-2 tw-text-[13px] ${channels.email ? "tw-bg-blue-50 tw-text-blue-600 tw-border-blue-600" : "tw-bg-gray-50 tw-border-gray-200 hover:tw-bg-gray-100"}`}>
                    <span className={`tw-w-6 tw-h-6 tw-flex tw-items-center tw-justify-center tw-rounded tw-border ${channels.email ? "tw-bg-blue-600 tw-border-blue-600" : "tw-border-gray-400"}`}>
                      {channels.email && <i className="fa-solid fa-check tw-text-white" />}
                    </span>
                    <i className="fa-regular fa-envelope tw-text-blue-600 tw-text-[20px]" />
                    <span className="tw-font-medium">Email</span>
                  </button>

                  <button type="button" role="checkbox" aria-checked={channels.app}
                          onClick={() => toggleChannel("app")}
                          className={`tw-flex tw-items-center tw-gap-2 tw-rounded-lg tw-border tw-px-3 tw-py-2 tw-text-[13px] ${channels.app ? "tw-bg-emerald-50 tw-text-emerald-700 tw-border-emerald-700" : "tw-bg-gray-50 tw-border-gray-200 hover:tw-bg-gray-100"}`}>
                    <span className={`tw-w-6 tw-h-6 tw-flex tw-items-center tw-justify-center tw-rounded tw-border ${channels.app ? "tw-bg-emerald-700 tw-border-emerald-700" : "tw-border-gray-400"}`}>
                      {channels.app && <i className="fa-solid fa-check tw-text-white" />}
                    </span>
                    <i className="fa-solid fa-bell tw-text-green-700 tw-text-[20px]" />
                    <span className="tw-font-medium">App / Web</span>
                  </button>

                  <button type="button" role="checkbox" aria-checked={channels.sms}
                          onClick={() => toggleChannel("sms")}
                          className={`tw-flex tw-items-center tw-gap-2 tw-rounded-lg tw-border tw-px-3 tw-py-2 tw-text-[13px] ${channels.sms ? "tw-bg-amber-50 tw-text-amber-600 tw-border-amber-600" : "tw-bg-gray-50 tw-border-gray-200 hover:tw-bg-gray-100"}`}>
                    <span className={`tw-w-6 tw-h-6 tw-flex tw-items-center tw-justify-center tw-rounded tw-border ${channels.sms ? "tw-bg-amber-600 tw-border-amber-600" : "tw-border-gray-400"}`}>
                      {channels.sms && <i className="fa-solid fa-check tw-text-white" />}
                    </span>
                    <i className="fa-solid fa-mobile-screen tw-text-amber-600 tw-text-[20px]" />
                    <span className="tw-font-medium tw-text-amber-600">SMS</span>
                  </button>
                </div>
              </div>
            </section>

            {/* Compose */}
            <section className="tw-bg-white tw-rounded-2xl tw-shadow-sm tw-border tw-border-gray-100">
              <header className="tw-flex tw-items-center tw-justify-center tw-border-b tw-border-gray-100 tw-px-4 md:tw-px-5 tw-py-3">
                <div className="tw-text-center">
                  <h3 className="tw-text-[15px] tw-font-semibold tw-text-gray-900">Soạn nội dung</h3>
                  <p className="tw-text-[12px] tw-text-gray-500">Dùng biến {"{{name}}"} và {"{{date}}"} để cá nhân hoá</p>
                </div>
              </header>
              <div className="tw-p-4 md:tw-p-5 tw-space-y-4">
                <div>
                  <label className="tw-text-[13px] tw-font-medium tw-text-gray-700">Tiêu đề</label>
                  <input
                    type="text" value={title} onChange={(e) => setTitle(e.target.value)}
                    placeholder="Ví dụ: Nhắc lịch tiêm vắc xin Viêm gan B"
                    className="tw-w-full tw-mt-1 tw-border tw-rounded-lg tw-px-3 tw-py-2 focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-sky-300 focus:tw-border-sky-700"
                  />
                  <div className="tw-flex tw-gap-2 tw-flex-wrap tw-mt-2">
                    {templates.map((t) => (
                      <button key={t.k} type="button" onClick={() => { setTitle(t.title); setMessage(t.msg); }}
                              className="tw-text-[11px] tw-bg-sky-50 hover:tw-bg-sky-100 tw-text-sky-700 tw-rounded-full tw-px-3 tw-py-1">
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="tw-text-[13px] tw-font-medium tw-text-gray-700">Nội dung</label>
                  <textarea rows={6} value={message} onChange={(e) => setMessage(e.target.value)}
                    placeholder="Bạn có thể dùng {{name}} và {{date}}"
                    className="tw-w-full tw-mt-1 tw-border tw-rounded-lg tw-px-3 tw-py-2 focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-sky-300 focus:tw-border-sky-700"
                  />
                  <div className="tw-text-[12px] tw-text-gray-500 tw-mt-1">
                    Biến hỗ trợ: <code className="tw-bg-gray-100 tw-px-1 tw-rounded">{"{{name}} || {{member}}"}</code>, <code className="tw-bg-gray-100 tw-px-1 tw-rounded">{"{{date}}"}</code>
                  </div>
                </div>
              </div>
            </section>

            {/* Preview */}
            <section className="tw-bg-white tw-rounded-2xl tw-shadow-sm tw-border tw-border-gray-100">
              <header className="tw-flex tw-items-center tw-justify-between tw-border-b tw-border-gray-100 tw-px-4 md:tw-px-5 tw-py-3">
                <div>
                  <h3 className="tw-text-[15px] tw-font-semibold tw-text-gray-900">Xem trước</h3>
                  <p className="tw-text-[12px] tw-text-gray-500">
                    {sample.name || sample.date ? <>Đang xem cho: <b>{sample.name || "—"}</b>{sample.date ? ` • ${sample.date}` : ""}</> : "Chưa chọn bản xem trước"}
                  </p>
                </div>
                <div className="tw-text-[12px] tw-text-gray-600">
                  Dự kiến gửi: <b className="tw-text-gray-900">{previewCount !== null && audience ? previewCount : "—"}</b>
                </div>
              </header>
              <div className="tw-p-4 md:tw-p-5">
                <div className="tw-border tw-border-sky-100 tw-rounded-xl tw-bg-gradient-to-br tw-from-white tw-to-sky-50 tw-p-4">
                  <div className="tw-font-semibold tw-text-gray-900 tw-mb-2">{title || "— Tiêu đề —"}</div>
                  <div className="tw-text-[14px] tw-whitespace-pre-wrap tw-text-gray-700">
                    {previewRendered || "— Nội dung —"}
                  </div>
                </div>
                <div className="tw-flex tw-justify-end tw-gap-3 tw-pt-4">
                  <button  type="button"
                    onClick={() => { setAudience(""); setTitle(""); setMessage(""); clearSelected(); setSample({ name: "", date: "" }); }}
                    className="tw-bg-red-600 tw-text-white tw-rounded-lg tw-px-4 tw-py-2 hover:tw-bg-red-500" >
                    Hủy
                  </button>
                  <button  type="submit" disabled={submitting}
                    className="tw-bg-emerald-600 tw-text-white tw-font-semibold tw-rounded-lg tw-px-5 tw-py-2 hover:tw-bg-emerald-500 disabled:tw-opacity-60" >
                    Gửi nhắc lịch
                  </button>
                </div>
              </div>
            </section>
          </div>
        </form>
      </div>

      
    </div>
  );
}
