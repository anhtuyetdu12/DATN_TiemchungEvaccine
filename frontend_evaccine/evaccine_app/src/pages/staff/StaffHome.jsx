// StaffHomeDB.jsx
import { useEffect, useMemo, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import api from "../../services/axios"; // <-- đã có sẵn trong app

export default function StaffHomeDB() {
  /* ========= Theme ========= */
  const [dark, setDark] = useState(() => localStorage.getItem("dark") === "1");
  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    localStorage.setItem("dark", dark ? "1" : "0");
  }, [dark]);

  /* ========= Clock ========= */
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  const viDate = now.toLocaleString("vi-VN", {
    weekday: "long",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  /* ========= Filters & View ========= */
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all"); // all|pending|confirmed|cancelled|completed
  const [view, setView] = useState("calendar"); // calendar | list | kanban
  const [selectedDate, setSelectedDate] = useState(""); // dd/MM/yyyy
  const [monthCursor, setMonthCursor] = useState(new Date());
  const todayStr = useMemo(() => {
    const d = now;
    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const yy = d.getFullYear();
    return `${dd}/${mm}/${yy}`;
  }, [now]);
  const monthInputValue = useMemo(() => {
    const y = monthCursor.getFullYear();
    const m = String(monthCursor.getMonth() + 1).padStart(2, "0");
    return `${y}-${m}`; // yyyy-MM
  }, [monthCursor]);

  /* ========= Data from BE ========= */
  const [loading, setLoading] = useState(false);
  const [appointments, setAppointments] = useState([]); // <== dùng cùng shape với bản demo

  // utils cần "ổn định" để làm deps
  const fmtDMY = useCallback((d) => {
    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const yy = d.getFullYear();
    return `${dd}/${mm}/${yy}`;
  }, []);

  const parseISO = useCallback((yyyy_mm_dd) => {
    const [y, m, d] = yyyy_mm_dd.split("-").map(Number);
    return new Date(y, m - 1, d);
  }, []);

  const toDMY = useCallback(
    (iso) => {
      try {
        return fmtDMY(parseISO(iso));
      } catch {
        return iso;
      }
    },
    [fmtDMY, parseISO]
  );

  // Map 1 booking BE -> 1 appointment card cho UI StaffHome
  const adaptBooking = useCallback(
    (b) => {
      // Lấy label vắc xin giống StaffAppointments
      const items = b.items_detail || [];
      let vaccineLabel = "—";
      if (items.length) {
        vaccineLabel = items
          .map((it) => {
            const name = it?.vaccine?.name?.trim();
            const qty = it?.quantity ?? 1;
            return name ? `${name}${qty > 1 ? ` x${qty}` : ""}` : null;
          })
          .filter(Boolean)
          .join(", ");
      } else if (b.vaccine?.name) {
        vaccineLabel = b.vaccine.name;
      } else if (b.package?.name) {
        vaccineLabel = `Gói: ${b.package.name}`;
      } else if (b.vaccine_name) {
        vaccineLabel = b.vaccine_name;
      }

      // map status -> 3 cột cho kanban StaffHome (pending/confirmed/canceled)
      const status = b.status === "cancelled" ? "canceled" : b.status; // completed sẽ không hiện ở 3 cột cũ

      return {
        id: b.id,
        date: toDMY(b.appointment_date),
        name: b.member?.full_name || b.user?.email || "Khách hàng",
        vaccine: vaccineLabel,
        status,
        address: b.location || "Trung tâm tiêm chủng E-Vaccines",
        note: b.notes || "—",
        priority: b.is_overdue
          ? "high"
          : b.appointment_date === new Date().toISOString().slice(0, 10)
          ? "medium"
          : "normal",
        checkedIn: false, // có thể lấy từ server nếu có cờ
      };
    },
    [toDMY]
  );

  // Tính khoảng ngày của tháng đang xem
  const monthRangeISO = useMemo(() => {
    const y = monthCursor.getFullYear();
    const m = monthCursor.getMonth(); // 0-based
    const first = new Date(y, m, 1);
    const last = new Date(y, m + 1, 0);
    const toISO = (d) =>
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
        d.getDate()
      ).padStart(2, "0")}`;
    return { from: toISO(first), to: toISO(last) };
  }, [monthCursor]);

  // Gọi API bookings cho THÁNG hiện tại (gộp tất cả trang)
  const fetchMonth = useCallback(async () => {
    setLoading(true);
    try {
      const paramsBase = {
        date_from: monthRangeISO.from,
        date_to: monthRangeISO.to,
      };
      if (search) paramsBase.search = search.trim();
      if (statusFilter !== "all") {
        // BE nhận: pending|confirmed|completed|cancelled|overdue
        paramsBase.status = statusFilter === "canceled" ? "cancelled" : statusFilter;
      }

      // Thử yêu cầu page_size lớn để hạn chế vòng lặp (nếu BE hỗ trợ)
      let url = "/records/bookings/";
      let params = { ...paramsBase, page: 1, page_size: 500 };
      let all = [];
      while (true) {
        const res = await api.get(url, { params });
        const data = res.data;
        if (Array.isArray(data)) {
          all = data;
          break;
        }
        const rows = data.results || [];
        all = all.concat(rows);
        if (!data.next) break;

        // parse next để lấy page tiếp theo
        const nextUrl = new URL(data.next);
        params = Object.fromEntries(nextUrl.searchParams.entries());
        url = nextUrl.pathname.replace(/^.*\/api\//, "/") || "/records/bookings/";
      }

      // Map về shape UI
      const mapped = all.map(adaptBooking);
      setAppointments(mapped);
    } catch (err) {
      console.error(err);
      toast.error("Không tải được lịch hẹn theo tháng");
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  }, [monthRangeISO, search, statusFilter, adaptBooking]);

  useEffect(() => {
    fetchMonth();
  }, [fetchMonth]);

  // Jump controls giống bản gốc
  const jumpToMonth = (e) => {
    const v = e.target.value; // yyyy-MM
    if (!v) return;
    const [y, m] = v.split("-").map(Number);
    setMonthCursor(new Date(y, m - 1, 1));
    setSelectedDate("");
  };
  const jumpToDate = (e) => {
    const v = e.target.value; // yyyy-MM-dd
    if (!v) return;
    const [y, m, d] = v.split("-").map(Number);
    const dStr = `${String(d).padStart(2, "0")}/${String(m).padStart(2, "0")}/${y}`;
    setMonthCursor(new Date(y, m - 1, 1));
    setSelectedDate(dStr);
  };

  // Parse dd/MM/yyyy
  const parseDMY = (s) => {
    const [dd, mm, yyyy] = s.split("/").map(Number);
    return { d: dd, m: mm, y: yyyy };
  };

  /* ========= Derived lists ========= */
  const filtered = useMemo(() => {
    let list = appointments.filter(
      (a) =>
        a.name.toLowerCase().includes(search.toLowerCase()) ||
        String(a.vaccine || "").toLowerCase().includes(search.toLowerCase())
    );
    if (statusFilter !== "all") {
      const key = statusFilter === "canceled" ? "canceled" : statusFilter;
      list = list.filter((a) => a.status === key);
    }
    if (selectedDate) list = list.filter((a) => a.date === selectedDate);

    const key = (s) => {
      const { d, m, y } = parseDMY(s);
      return new Date(y, m - 1, d).getTime();
    };
    return [...list].sort((a, b) => key(a.date) - key(b.date));
  }, [appointments, search, statusFilter, selectedDate]);

  const groupsByDay = useMemo(() => {
    const g = {};
    filtered.forEach((a) => {
      (g[a.date] ||= []).push(a);
    });
    const order = Object.keys(g).sort((A, B) => {
      const a = parseDMY(A),
        b = parseDMY(B);
      return new Date(a.y, a.m - 1, a.d) - new Date(b.y, b.m - 1, b.d);
    });
    return order.map((k) => ({ date: k, items: g[k] }));
  }, [filtered]);

  // KPI
  const total = appointments.length;
  const confirmed = appointments.filter((a) => a.status === "confirmed").length;
  const pending = appointments.filter((a) => a.status === "pending").length;
  const canceled = appointments.filter((a) => a.status === "canceled").length;

  /* ========= Right column (alerts demo) ========= */
  const alerts = [
    { color: "amber", text: "3 vắc xin sắp hết hạn", href: "/staff/vaccines?tab=expiry" },
    { color: "rose", text: "5 nhắc lịch quá hạn", href: "/staff/notifications?filter=overdue" },
    { color: "cyan", text: "2 khách có lưu ý dị ứng", href: "/staff/customers?tag=allergy" },
  ];
  const [activities, setActivities] = useState([]);
  const pushActivity = (text) =>
    setActivities((prev) => [{ id: Date.now(), text }, ...prev].slice(0, 12));

  /* ========= Actions (call BE) ========= */
  const doCheckIn = (item) => {
    // Nếu có API check-in riêng thì gọi; tạm thời chỉ đánh dấu UI
    setAppointments((prev) =>
      prev.map((a) =>
        a.id === item.id
          ? { ...a, checkedIn: true, status: a.status === "pending" ? "confirmed" : a.status }
          : a
      )
    );
    toast.success(`Đã check-in #${item.id} • ${item.name}`);
    pushActivity(`🟢 Check-in #${item.id} (${item.date})`);
  };

  const postAndRefresh = async (url, okMsg, actMsg) => {
    try {
      await api.post(url);
      toast.success(okMsg);
      await fetchMonth();
      pushActivity(actMsg);
    } catch (e) {
      const msg = e?.response?.data?.detail || "Thao tác thất bại";
      toast.error(msg);
    }
  };

  const doConfirm = (item) =>
    postAndRefresh(
      `/records/bookings/${item.id}/confirm/`,
      `Đã xác nhận #${item.id}`,
      `✅ Xác nhận #${item.id} (${item.date})`
    );

  const doCancel = (item) =>
    postAndRefresh(
      `/records/bookings/${item.id}/cancel/`,
      `Đã hủy #${item.id}`,
      `🗑️ Hủy #${item.id} (${item.date})`
    );

  /* ========= Kanban ========= */
  const kanbanCols = useMemo(
    () =>
      [ { key: "pending", title: "Chờ xác nhận", color: "tw-bg-amber-50 tw-border-amber-100" },
        { key: "confirmed", title: "Đã xác nhận", color: "tw-bg-emerald-50 tw-border-emerald-100" },
        { key: "canceled", title: "Đã hủy", color: "tw-bg-rose-50 tw-border-rose-100" },
      ].map((col) => ({ ...col, items: filtered.filter((a) => a.status === col.key) })),
    [filtered]
  );

  /* ========= Calendar Month (heat) ========= */
  const monthMeta = useMemo(() => {
    const y = monthCursor.getFullYear();
    const m = monthCursor.getMonth();
    const firstDay = new Date(y, m, 1);
    const startWeekDay = (firstDay.getDay() + 6) % 7; // Mon=0..Sun=6
    const daysInMonth = new Date(y, m + 1, 0).getDate();

    const count = {};
    appointments.forEach((a) => {
      const { d, m: mm, y: yy } = parseDMY(a.date);
      if (yy === y && mm === m + 1) count[d] = (count[d] || 0) + 1;
    });

    const cells = [];
    for (let i = 0; i < startWeekDay; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push({ d, n: count[d] || 0 });
    while (cells.length % 7 !== 0) cells.push(null);
    if (cells.length < 42) while (cells.length < 42) cells.push(null);

    const max = Math.max(0, ...Object.values(count));
    return { y, m, daysInMonth, cells, counts: count, max };
  }, [monthCursor, appointments]);

  const isSameDMY = (a, b) => a && b && a === b;

  /* ========= UI helpers (giữ gần như bản gốc) ========= */
  const renderSegmented = () => (
    <div className={`tw-rounded-full tw-p-1 tw-flex tw-gap-1 tw-border ${
        dark ? "tw-border-white/10 tw-bg-white/10" : "tw-bg-white tw-border-gray-200"
      }`} >
      {[
        { key: "calendar", label: "Lịch" },
        { key: "list", label: "Danh sách" },
        { key: "kanban", label: "Trạng thái" }, // đổi "status" -> "kanban" cho rõ ràng
      ].map((opt) => {
        const active = view === opt.key;
        return (
          <button  key={opt.key} onClick={() => setView(opt.key)}
            className={`tw-text-lg tw-font-medium tw-rounded-full tw-px-3 tw-py-1.5 transition-all
            ${  active
                ? dark
                  ? "tw-bg-white tw-text-[#0b1220]"
                  : "tw-bg-[#1999ee] tw-text-white"
                : dark
                ? "tw-text-white/80 hover:tw-bg-white/10"
                : "tw-text-gray-700 hover:tw-bg-gray-100"
            }`}>
            {opt.label}
          </button>
        );
      })}
    </div>
  );

  const renderStatusChips = () => (
    <div className="tw-flex tw-items-center tw-gap-2 tw-flex-wrap ">
      {[
        { key: "all", label: "Tất cả" },
        { key: "pending", label: "Chờ" },
        { key: "confirmed", label: "Xác nhận" },
        { key: "canceled", label: "Hủy" },
        { key: "completed", label: "Đã tiêm xong" },
      ].map((o) => {
        const active = statusFilter === o.key;
        return (
          <button  key={o.key}  onClick={() => setStatusFilter(o.key)}
            className={`tw-text-base tw-rounded-full tw-px-3 tw-py-1 tw-border transition
              ${ active
                  ? dark
                    ? "tw-border-white/10 tw-bg-white tw-text-[#0b1220]"
                    : "tw-bg-[#1999ee] tw-border-[#1999ee] tw-text-white"
                  : dark
                  ? "tw-border-white/10 tw-bg-white/5 tw-text-white/80 hover:tw-bg-white/10"
                  : "tw-bg-white tw-border-gray-200 tw-text-gray-700 hover:tw-bg-gray-50"
              }`}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );

  const renderStatCard = (title, value, icon, tone) => {
    const toneMap = {
      blue: { text: "tw-text-blue-700", bg: "tw-bg-blue-50" },
      amber: { text: "tw-text-amber-700", bg: "tw-bg-amber-50" },
      emerald: { text: "tw-text-emerald-700", bg: "tw-bg-emerald-50" },
      rose: { text: "tw-text-rose-700", bg: "tw-bg-rose-50" },
    };
    const t = toneMap[tone] || toneMap.blue;
    return (
      <div className={`tw-rounded-2xl tw-p-4 tw-flex tw-items-center tw-justify-between tw-border
        ${dark ? "tw-bg-white/5 tw-border-white/10 tw-text-white" : "tw-bg-white tw-border-gray-100 tw-shadow-sm"}`}>
        <div>
          <p className={`${dark ? "tw-text-white/70" : "tw-text-gray-500"} tw-text-base`}>{title}</p>
          <h3 className="tw-text-2xl tw-font-extrabold">{value}</h3>
        </div>
        <div className={`tw-rounded-full tw-px-4 tw-py-2 ${dark ? "tw-bg-white/10 tw-text-white" : `${t.bg} ${t.text}`}`}>
          <i className={`fa ${icon} tw-text-lg`}></i>
        </div>
      </div>
    );
  };

  const renderEmpty = (title, subtitle) => (
    <div className="tw-py-16 tw-flex tw-flex-col tw-items-center tw-justify-center tw-text-center">
      <div className="tw-text-5xl">📅</div>
      <h4 className={`tw-mt-3 tw-text-lg tw-font-semibold ${dark ? "tw-text-white" : "tw-text-gray-800"}`}>
        {title}
      </h4>
      <p className={`${dark ? "tw-text-white/70" : "tw-text-gray-500"} tw-text-base tw-mt-1`}>{subtitle}</p>
    </div>
  );

  const pillForStatus = (s) =>
    s === "confirmed"
      ? "tw-bg-emerald-100 tw-text-emerald-700"
      : s === "pending"
      ? "tw-bg-amber-100 tw-text-amber-700"
      : s === "completed"
      ? "tw-bg-blue-100 tw-text-blue-700"
      : "tw-bg-rose-100 tw-text-rose-700";

  const dotForPriority = (p) =>
    p === "high" ? "tw-text-rose-500" : p === "medium" ? "tw-text-amber-500" : "tw-text-purple-400";

  const renderCardAppointment = (a, compact = false) => (
    <div key={a.id}
      className={`tw-rounded-xl tw-p-4 tw-flex tw-flex-col tw-gap-3 tw-border hover:tw-shadow-md transition
      ${dark ? "tw-bg-white/5 tw-border-white/10 tw-text-white" : "tw-bg-white tw-border-gray-100 tw-shadow-sm"}`} >
      <div className="tw-flex tw-items-center tw-justify-between">
        <div className="tw-flex tw-items-center tw-gap-3">
          <span className={`tw-text-lg ${dotForPriority(a.priority)}`}>●</span>
          <div className="tw-font-semibold tw-truncate" title={a.name}>
            {a.name}
          </div>
        </div>
        <span className={`tw-text-base tw-rounded-full tw-px-2.5 tw-py-1 ${pillForStatus(a.status)}`}>
          {a.status === "confirmed"
            ? "Đã xác nhận"
            : a.status === "pending"
            ? "Chờ xác nhận"
            : a.status === "completed"
            ? "Đã tiêm xong"
            : "Đã hủy"}
        </span>
      </div>

      <div className={`tw-grid ${compact ? "tw-grid-cols-1" : "tw-grid-cols-2"} tw-gap-2 tw-text-base 
          ${ dark ? "tw-text-white/80" : "tw-text-gray-600" }`} >
        <div className="tw-text-base">
          <i className="fa-regular fa-calendar tw-mr-2"></i>
          {a.date}
        </div>
        {!compact && (
          <div className="tw-text-base">
            <i className="fa-solid fa-syringe tw-mr-2"></i>
            {a.vaccine}
          </div>
        )}
        <div className={`${compact ? "" : "tw-col-span-2"} tw-truncate tw-text-base`} title={a.address}>
          <i className="fa-solid fa-location-dot tw-mr-2"></i>
          {a.address}
        </div>
        {a.note && a.note !== "—" && (
          <div className={`tw-col-span-2 tw-text-base tw-rounded tw-px-2 tw-py-1 
            ${  dark ? "tw-bg-amber-500/15 tw-text-amber-300" : "tw-text-amber-700 tw-bg-amber-50" }`}  >
            <i className="fa-regular fa-note-sticky tw-mr-2"></i>
            {a.note}
          </div>
        )}
      </div>

      <div className="tw-flex tw-items-center tw-justify-between">
        <div className="tw-flex tw-items-center tw-gap-2">
          {a.checkedIn ? (
            <span  className={`tw-text-base tw-rounded-full tw-px-2.5 tw-py-1 
              ${ dark ? "tw-bg-emerald-500/20 tw-text-emerald-200" : "tw-bg-emerald-50 tw-text-emerald-700" }`} >
              Đã check-in
            </span>
          ) : (
            <button
              onClick={() => doCheckIn(a)}
              className="tw-text-base tw-bg-blue-600 tw-text-white tw-rounded-full tw-px-3 tw-py-1 hover:tw-opacity-90" >
              Check-in
            </button>
          )}
        </div>
        <div className="tw-flex tw-items-center tw-gap-2">
          <button
            onClick={() => doConfirm(a)}
            disabled={a.status !== "pending"}
            className={`tw-text-base tw-px-3 tw-py-1.5 tw-rounded-full tw-border hover:tw-scale-[1.02] transition disabled:tw-opacity-50
            ${
              dark
                ? "tw-bg-emerald-500/15 tw-text-emerald-200 tw-border-emerald-500/30"
                : "tw-bg-emerald-100 tw-text-emerald-700 tw-border-emerald-200"
            }`}
          >
            <i className="fa-solid fa-check-to-slot"></i>
            <span className="tw-ml-1">Xác nhận</span>
          </button>
          <button
            onClick={() => doCancel(a)}
            disabled={a.status === "canceled" || a.status === "completed"}
            className={`tw-text-base tw-px-3 tw-py-1.5 tw-rounded-full tw-border hover:tw-scale-[1.02] transition disabled:tw-opacity-50
            ${dark ? "tw-bg-rose-500/15 tw-text-rose-200 tw-border-rose-500/30" : "tw-bg-rose-100 tw-text-rose-700 tw-border-rose-200"}`}
          >
            <i className="fa-solid fa-xmark"></i>
            <span className="tw-ml-1">Hủy</span>
          </button>
        </div>
      </div>
    </div>
  );

  /* ========= RENDER (khung y như bản gốc) ========= */
  return (
    <div className={`tw-pt-[125px] tw-pb-16 tw-min-h-screen 
      ${ dark ? "tw-bg-[#0b1220]"
          : "tw-bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] tw-from-blue-50 tw-via-pink-50 tw-to-white"
      }`} >
      <div className="tw-w-full tw-px-4 sm:tw-px-6 lg:tw-px-8">
        <div className={`tw-relative tw-rounded-[28px] 
        ${ dark ? "tw-bg-white/5 tw-backdrop-blur" : "tw-bg-gradient-to-r tw-from-[#e6f3ff] tw-via-[#fdf2f8] tw-to-[#fff]"
          } tw-border tw-border-gray-100/50 tw-shadow-sm tw-overflow-hidden`}>
          <div className="tw-p-6 md:tw-p-8 tw-flex tw-flex-col xl:tw-flex-row tw-items-center tw-justify-between tw-gap-6">
            <div className="tw-text-center xl:tw-text-left">
              <div className="tw-flex tw-items-center tw-justify-center xl:tw-justify-start tw-gap-3">
                <span className="tw-text-[25px]">🩺</span>
                <h1 className={`tw-text-[26px] md:tw-text-[30px] tw-font-extrabold 
                ${dark ? "tw-text-white" : "tw-text-[#163b6b]" }`} >
                  Trang chủ nhân viên y tế
                </h1>
              </div>
              <div className="tw-flex tw-justify-center xl:tw-justify-start">
                <p className={`tw-text-xl tw-border tw-rounded-full tw-mt-6 tw-px-3 tw-py-3 tw-w-[200px]  tw-flex tw-items-center tw-justify-center
                    ${dark ? "tw-text-white tw-bg-[#3f87ec]" : "tw-text-white tw-bg-pink-500"}`} >
                  {viDate.charAt(0).toUpperCase() + viDate.slice(1)}
                </p>
              </div>
            </div>

            {/* Toggles */}
            <div className="tw-flex tw-items-center tw-gap-3">
              {renderSegmented()}
              <button onClick={() => setDark((s) => !s)}
                className={`tw-rounded-full tw-px-3 tw-py-2 tw-flex tw-items-center tw-gap-2 tw-border 
                ${dark ? "tw-text-white tw-border-white/10 tw-bg-white/10" : "tw-text-gray-700 tw-border-gray-200 tw-bg-white hover:tw-bg-gray-50"}`} >
                <i className={dark ? "fa-regular fa-moon" : "fa-regular fa-sun"}></i>
                <span className="tw-text-lg">{dark ? "Tối" : "Sáng"}</span>
              </button>
            </div>
          </div>

          {/* KPI */}
          <div className="tw-grid tw-grid-cols-2 md:tw-grid-cols-4 tw-gap-3 tw-px-4 sm:tw-px-6 lg:tw-px-8 tw-pb-6">
            {renderStatCard("Tổng lịch tháng này", total, "fa-calendar-check", "blue")}
            {renderStatCard("Đang chờ", pending, "fa-hourglass-half", "amber")}
            {renderStatCard("Đã xác nhận", confirmed, "fa-circle-check", "emerald")}
            {renderStatCard("Đã hủy", canceled, "fa-ban", "rose")}
          </div>
        </div>

        <div className="tw-grid tw-grid-cols-1 xl:tw-grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_360px] tw-gap-6 tw-mt-6">
          <section
            className={`tw-rounded-2xl tw-border tw-overflow-hidden ${
              dark ? "tw-bg-white/5 tw-border-white/10" : "tw-bg-white tw-border-gray-100 tw-shadow-sm"
            }`}
          >
            <div
              className={`tw-flex tw-items-center tw-justify-between tw-px-5 tw-py-4 tw-border-b ${
                dark ? "tw-border-white/10 tw-bg-white/[0.02]" : "tw-bg-gradient-to-r tw-from-pink-50 tw-to-cyan-50 tw-border-gray-100"
              }`}
            >
              <div className="tw-flex tw-items-center tw-gap-3">
                <h2 className={`tw-text-[18px] tw-font-semibold ${dark ? "tw-text-white" : "tw-text-[#163b6b]"}`}>
                  {view === "calendar" ? "📆 Lịch theo tháng" : view === "list" ? "🗒️ Danh sách theo ngày" : "🧩 Trạng thái"}
                </h2>
                <span className={`tw-text-base tw-mb-3 ${dark ? "tw-text-white/60" : "tw-text-gray-500"}`}>
                  {loading ? "(đang tải…)" : `(${filtered.length})`}
                </span>
              </div>
              <div className="tw-flex tw-items-center tw-gap-2">
                <div className="tw-relative">
                  <i
                    className={`fa-solid fa-magnifying-glass tw-absolute tw-left-3 tw-top-1/2 -tw-translate-y-1/2 ${
                      dark ? "tw-text-white/50" : "tw-text-gray-400"
                    }`}
                  ></i>
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className={`tw-w-[220px] tw-rounded-full tw-py-1.5 tw-pl-9 tw-text-xl tw-pr-3 focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-blue-300 focus:tw-border-blue-800
                       ${dark
                           ? "tw-bg-white/10 tw-text-white tw-border tw-border-white/10"
                           : "tw-bg-white tw-border tw-border-gray-300 focus:tw-ring-blue-200"
                       }`}
                    placeholder="Tìm tên/email/vị trí…"
                  />
                </div>
                {renderStatusChips()}
              </div>
            </div>

            {/* Body */}
            {view === "calendar" ? (
              <div className="tw-p-4">
                {/* Nav + clock */}
                <div className="tw-flex tw-items-center tw-justify-between tw-gap-3 tw-mb-3">
                  <div className="tw-flex tw-items-center tw-gap-3">
                    <div className={`tw-font-semibold ${dark ? "tw-text-white" : "tw-text-gray-800"}`}>
                      Tháng {monthMeta.m + 1}/{monthMeta.y}
                    </div>
                    <div className={`tw-text-sm ${dark ? "tw-text-white/70" : "tw-text-gray-500"}`}>
                      Bây giờ: {now.toLocaleTimeString("vi-VN")}
                    </div>
                  </div>

                  {/* Controls */}
                  <div className="tw-flex tw-items-center tw-gap-2 tw-mb-5">
                    <input
                      type="month"
                      value={monthInputValue}
                      onChange={jumpToMonth}
                      title="Chọn tháng/năm"
                      className={`tw-hidden md:tw-block tw-rounded-full tw-px-3 tw-py-1 tw-text-lg tw-border
                        ${dark ? "tw-bg-white/10 tw-text-white tw-border-white/10" : "tw-bg-white tw-border-gray-200"}`}
                    />
                    <input
                      type="date"
                      onChange={jumpToDate}
                      title="Chọn ngày"
                      className={`tw-hidden md:tw-block tw-rounded-full tw-px-3 tw-py-1 tw-text-lg tw-border
                        ${dark ? "tw-bg-white/10 tw-text-white tw-border-white/10" : "tw-bg-white tw-border-gray-200"}`}
                    />
                    <button
                      onClick={() =>
                        setMonthCursor(new Date(monthCursor.getFullYear(), monthCursor.getMonth() - 1, 1))
                      }
                      className={`tw-rounded-full tw-px-3 tw-py-1 tw-border 
                        ${dark ? "tw-text-white tw-border-white/10 tw-bg-white/10" : "tw-bg-white tw-border-gray-200 hover:tw-bg-gray-50"}`}
                      aria-label="Tháng trước"
                    >
                      <i className="fa fa-angle-left"></i>
                    </button>

                    <button
                      onClick={() => {
                        setMonthCursor(new Date());
                        setSelectedDate(todayStr);
                      }}
                      className="tw-rounded-full tw-px-3 tw-py-1 tw-bg-[#1999ee] tw-text-white"
                    >
                      Hôm nay
                    </button>

                    <button
                      onClick={() =>
                        setMonthCursor(new Date(monthCursor.getFullYear(), monthCursor.getMonth() + 1, 1))
                      }
                      className={`tw-rounded-full tw-px-3 tw-py-1 tw-border 
                        ${dark ? "tw-text-white tw-border-white/10 tw-bg-white/10" : "tw-bg-white tw-border-gray-200 hover:tw-bg-gray-50"}`}
                      aria-label="Tháng sau"
                    >
                      <i className="fa fa-angle-right"></i>
                    </button>
                  </div>
                </div>

                {/* Week header */}
                <div className={`tw-grid tw-grid-cols-7 tw-text-base tw-font-medium tw-mb-1 
                  ${ dark ? "tw-text-white/70" : "tw-text-gray-500"  }`}>
                  {["T2", "T3", "T4", "T5", "T6", "T7", "CN"].map((d) => (
                    <div key={d} className="tw-py-1 tw-text-center">
                      {d}
                    </div>
                  ))}
                </div>

                {/* Grid days */}
                <div className="tw-grid tw-grid-cols-7 tw-gap-[6px] tw-mb-5">
                  {monthMeta.cells.map((cell, idx) => {
                    if (!cell)
                      return (
                        <div key={idx} className={`tw-h-[90px] tw-rounded-xl tw-border
                        ${dark ? "tw-bg-white/5 tw-border-white/5" : "tw-bg-gray-50 tw-border-gray-200" } `}
                        ></div>
                      );
                    const dStr = `${String(cell.d).padStart(2, "0")}/${String(monthMeta.m + 1).padStart( 2, "0" )}/${monthMeta.y}`;
                    const isActive = isSameDMY(selectedDate, dStr);
                    const isToday = dStr === todayStr;
                    const lvl = monthMeta.max ? Math.min(4, Math.ceil((cell.n / monthMeta.max) * 4)) : 0;
                    const heat = [
                      dark ? "tw-bg-white" : "tw-bg-white",
                      "tw-bg-sky-50",
                      "tw-bg-sky-100",
                      "tw-bg-sky-200",
                      "tw-bg-sky-300",
                    ][lvl];

                    return (
                      <button
                        key={idx}
                        onClick={() => setSelectedDate(isActive ? "" : dStr)}
                        className={`tw-h-[90px] tw-w-full tw-rounded-xl tw-border tw-flex tw-flex-col tw-justify-between tw-p-2 tw-relative
                          ${dark ? `tw-border-white/10 ${heat}` : `tw-border-gray-200 ${heat}`}
                          ${isActive ? "tw-ring-2 tw-ring-[#053bee]" : ""}
                          ${
                            isToday
                              ? dark
                                ? "tw-shadow-[inset_0_0_0_1px_rgba(25,153,238,.6)]"
                                : "tw-shadow-[inset_0_0_0_1px_rgba(25,153,238,1)]"
                              : ""
                          }
                        `} title={`Ngày ${dStr}`}>
                        <div className="tw-flex tw-items-baseline tw-justify-between">
                          <span className={`tw-text-sm ${dark ? "tw-text-white" : "tw-text-blue-800"}`}>{cell.d}</span>
                          <span className={`tw-text-[11px] ${dark ? "tw-text-white" : "tw-text-blue-800"}`}>
                            {String(cell.d).padStart(2, "0")}/{String(monthMeta.m + 1).padStart(2, "0")}
                          </span>
                        </div>
                        <span
                          className={`tw-text-[11px] tw-rounded-full tw-px-2 tw-py-[2px] tw-self-end
                            ${
                              cell.n > 0
                                ? "tw-bg-[#1999ee] tw-text-white"
                                : dark
                                ? "tw-bg-white/10 tw-text-white/60"
                                : "tw-bg-gray-100 tw-text-gray-500"
                            }`} >
                          {cell.n} lịch
                        </span>

                        {isToday && (
                          <span  className={`tw-absolute tw-bottom-2 tw-left-2 tw-text-[11px] tw-rounded-full tw-px-2 tw-py-[2px]
                              ${  dark ? "tw-bg-emerald-500/20 tw-text-emerald-200" : "tw-bg-emerald-50 tw-text-emerald-700" }`}>
                            {now.toLocaleTimeString("vi-VN", {
                              hour: "2-digit",
                              minute: "2-digit",
                              second: "2-digit",
                            })}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Selected day preview */}
                <div className="tw-mt-4">
                  {selectedDate ? (
                    <>
                      <div className="tw-flex tw-items-center tw-justify-between tw-mb-2">
                        <h3 className={`tw-font-semibold ${dark ? "tw-text-white" : "tw-text-gray-800"}`}>
                          Lịch ngày {selectedDate}
                        </h3>
                        <button onClick={() => setSelectedDate("")}
                          className={`tw-text-base tw-rounded-full tw-px-3 tw-py-1 tw-border 
                            ${ dark ? "tw-text-white/80 tw-bg-white/10 tw-border-white/10"
                                : "tw-text-pink-700 tw-bg-pink-100 hover:tw-bg-pink-200"
                            }`} >
                          Bỏ lọc ngày
                        </button>
                      </div>
                      {filtered.length === 0 ? (
                        renderEmpty("Không có lịch cho ngày này", "Điều chỉnh bộ lọc hoặc chọn ngày khác.")
                      ) : (
                        <div className="tw-grid sm:tw-grid-cols-2 2xl:tw-grid-cols-3 tw-gap-3">
                          {filtered.map((a) => renderCardAppointment(a))}
                        </div>
                      )}
                    </>
                  ) : (
                    <div className={`${dark ? "tw-text-white/60" : "tw-text-gray-500"} tw-text-sm tw-italic`}>
                      Chọn một ngày để xem chi tiết.
                    </div>
                  )}
                </div>
              </div>
            ) : view === "list" ? (
              groupsByDay.length === 0 ? (
                renderEmpty("Không có lịch phù hợp", "Điều chỉnh bộ lọc hoặc tạo lịch mới.")
              ) : (
                <div className="tw-divide-y tw-divide-blue-100 dark:tw-divide-white">
                  {groupsByDay.map(({ date, items }) => (
                    <section key={date} className="tw-px-5 tw-py-4">
                      <div className="tw-flex tw-items-center tw-justify-between tw-mb-3">
                        <h3 className={`tw-font-semibold ${dark ? "tw-text-white" : "tw-text-[#163b6b]"}`}>{date}</h3>
                        <span className={`tw-text-base ${dark ? "tw-text-white/50" : "tw-text-gray-500"}`}>
                          {items.length} lịch
                        </span>
                      </div>
                      <div className="tw-grid sm:tw-grid-cols-2 2xl:tw-grid-cols-3 tw-gap-3">
                        {items.map((a) => renderCardAppointment(a))}
                      </div>
                    </section>
                  ))}
                </div>
              )
            ) : (
              <div className="tw-p-4 tw-grid md:tw-grid-cols-3 tw-gap-4">
                {kanbanCols.map((col) => (
                  <div key={col.key}
                    className={`tw-rounded-xl tw-border tw-p-3 ${col.color} ${dark ? "tw-bg-white/5 tw-border-white/10" : ""}`} >
                    <div className="tw-flex tw-items-center tw-justify-between tw-mb-2">
                      <h4 className={`tw-font-semibold ${dark ? "tw-text-white" : "tw-text-gray-800"}`}>{col.title}</h4>
                      <span className="tw-text-base tw-text-gray-500">{col.items.length}</span>
                    </div>
                    {col.items.length === 0 ? (
                      <div className="tw-text-sm tw-text-gray-500 tw-italic tw-p-3">Trống</div>
                    ) : (
                      <div className="tw-space-y-2">{col.items.map((a) => renderCardAppointment(a, true))}</div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Cảnh báo + hoạt động (giữ nguyên) */}
          <div className="tw-grid tw-grid-cols-1 lg:tw-grid-cols-2 tw-gap-6 tw-py-10">
            <section>
              <div className={`tw-rounded-2xl tw-border 
                ${ dark ? "tw-bg-white/5 tw-border-white/10" : "tw-bg-white tw-border-gray-100 tw-shadow-sm"}`} >
                <div  className={`tw-flex tw-items-center tw-justify-between tw-px-5 tw-py-4 tw-border-b  
                ${ dark ? "tw-border-white/10" : "tw-border-gray-100" }`}>
                  <h3 className={`tw-font-semibold ${dark ? "tw-text-white" : "tw-text-[#163b6b]"}`}>⚠️ Cảnh báo</h3>
                  <Link to="/staff/vaccines" className="tw-text-base tw-text-blue-700 hover:tw-underline">
                    Xem kho
                  </Link>
                </div>
                <ul className="tw-p-4 tw-space-y-2">
                  {alerts.map((a, i) => {
                    const tone = a.color === "amber"
                        ? "tw-text-amber-700 tw-bg-amber-50 tw-border-amber-100"
                        : a.color === "rose"
                        ? "tw-text-rose-700 tw-bg-rose-50 tw-border-rose-100"
                        : "tw-text-cyan-700 tw-bg-cyan-50 tw-border-cyan-100";
                    return (
                      <li key={i} className={`tw-flex tw-justify-between tw-items-center tw-rounded-xl tw-px-3 tw-py-2 tw-border
                         ${dark ? "tw-bg-white/5 tw-border-white/10 tw-text-white" : tone}`} >
                        <span className="tw-text-lg">{a.text}</span>
                        <Link to={a.href} className={`tw-text-lg ${dark ? "tw-text-blue-300" : "tw-text-blue-700"} tw-underline`}>
                          Xem
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </section>

            <section>
              <div  className={`tw-rounded-2xl tw-border tw-flex-1 tw-min-h-[260px]  
              ${ dark ? "tw-bg-white/5 tw-border-white/10" : "tw-bg-white tw-border-gray-100 tw-shadow-sm"}`} >
                <div  className={`tw-flex tw-items-center tw-justify-between tw-px-5 tw-py-4 tw-border-b  
                ${ dark ? "tw-border-white/10" : "tw-border-gray-100"  }`}>
                  <h3 className={`tw-font-semibold ${dark ? "tw-text-white" : "tw-text-[#163b6b]"}`}>🕒 Hoạt động gần đây</h3>
                </div>
                <div className="tw-p-4 tw-space-y-2 tw-max-h-[320px] tw-overflow-auto">
                  {activities.length === 0 && <div className={dark ? "tw-text-white/70" : "tw-text-gray-500"}>Chưa có hoạt động.</div>}
                  {activities.map((a) => (
                    <div  key={a.id}
                      className={`tw-flex tw-items-center tw-justify-between tw-text-sm tw-rounded-lg tw-px-3 tw-py-2 tw-border 
                        ${dark ? "tw-bg-white/5 tw-border-white/10 tw-text-white" : "tw-bg-gray-50 tw-border-gray-100"}`} >
                      <span className="tw-truncate">{a.text}</span>
                      <span className={dark ? "tw-text-white/50" : "tw-text-gray-400"}>
                        {new Date(a.id).toLocaleTimeString("vi-VN")}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          </div>
        </div>

        {/* FAB */}
        <Link to="/staff/customers"
          className="tw-fixed tw-bottom-6 tw-right-6 tw-rounded-full tw-shadow-lg tw-px-4 tw-py-3 
          tw-flex tw-items-center tw-gap-2 tw-z-50 tw-bg-[#1999ee] tw-text-white hover:tw-scale-105 tw-transition-transform">
          <i className="fa fa-calendar-plus"></i>
          <span className="tw-hidden sm:tw-inline">Tạo lịch hẹn</span>
        </Link>
      </div>
    </div>
  );
}
