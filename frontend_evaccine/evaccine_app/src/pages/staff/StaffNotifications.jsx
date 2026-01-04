import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { previewAudience } from "../../services/notificationService";
import Pagination from "../../components/Pagination";

const audienceOptions = [
  {
    value: "upcoming_today",
    label: "Lịch hẹn hôm nay",
    backend: { audience: "upcoming", days_before: 0 },
  },
  {
    value: "upcoming_1",
    label: "Lịch hẹn ngày mai",
    backend: { audience: "upcoming", days_before: 1 },
  },
  {
    value: "upcoming_3",
    label: "Lịch hẹn sắp tới (3 ngày)",
    backend: { audience: "upcoming", days_before: 3 },
  },
  {
    value: "nextdose",
    label: "Mũi tiếp theo (theo sổ tiêm)",
    backend: { audience: "nextdose", next_dose_days: 7 }, // số ngày tới muốn nhắc
  },
  {
    value: "overdue",
    label: "Khách trễ hẹn",
    backend: { audience: "overdue" },
  },
];

export default function StaffAutoReminderDashboard() {
  const fetchIdRef = useRef(0);

  const [audience, setAudience] = useState("upcoming_today");
  const [apptLoading, setApptLoading] = useState(false);
  const [appts, setAppts] = useState([]);
  const [apptCount, setApptCount] = useState(0);
  const [apptPage, setApptPage] = useState(1);
  const apptPerPage = 10;

  const [summary, setSummary] = useState({
    upcoming_today: null,
    upcoming_1: null,
    upcoming_3: null,
    nextdose: null,
    overdue: null,
    loadedAt: null,
  });

  const [sample, setSample] = useState({
    customer_name: "",
    member_name: "",
    date: "",
    vaccine: "",
    interval: null,
    total_doses: null,
    disease: "",
    dob: "",
  });

  const formatDate = (isoStr) => {
    if (!isoStr) return "—";
    const d = new Date(`${isoStr}T00:00:00`);
    if (Number.isNaN(d.getTime())) return isoStr;
    const dd = `${d.getDate()}`.padStart(2, "0");
    const mm = `${d.getMonth() + 1}`.padStart(2, "0");
    const yyyy = d.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  };

  const toDisplayDate = (iso) => formatDate(iso);
  const displayUser = (u) => (u?.phone?.trim() ? u.phone.trim() : u?.email || "—");

  const statusCls = (s, label) => {
    if (label === "Trễ hẹn") return "tw-bg-pink-100 tw-text-pink-700 tw-ring-1 tw-ring-pink-200";
    const m = {
      pending: "tw-bg-amber-50 tw-text-amber-700 tw-ring-1 tw-ring-amber-200",
      confirmed: "tw-bg-green-50 tw-text-green-700 tw-ring-1 tw-ring-green-200",
      completed: "tw-bg-blue-50 tw-text-blue-700 tw-ring-1 tw-ring-blue-200",
      cancelled: "tw-bg-rose-50 tw-text-rose-700 tw-ring-1 tw-ring-rose-200",
      nextdose: "tw-bg-emerald-50 tw-text-emerald-700 tw-ring-1 tw-ring-emerald-200",
      overdue: "tw-bg-pink-50 tw-text-pink-700 tw-ring-1 tw-ring-pink-200",
      default: "tw-bg-purple-50 tw-text-purple-700 tw-ring-1 tw-ring-purple-200",
    };
    return m[s] || m.default;
  };

  const templates = {
    upcoming_today: {
      title: "Nhắc lịch tiêm hôm nay",
      msg:
        "Chào {{name}}, hôm nay ({{date}}) {{member}} có lịch tiêm {{vaccine}}. "
        + "Vui lòng đến cơ sở tiêm chủng đúng giờ và mang theo giấy tờ cần thiết."
    },

    upcoming_1: {
      title: "Nhắc lịch tiêm ngày mai",
      msg:
        "Chào {{name}}, vào ngày mai ({{date}}) {{member}} có lịch tiêm {{vaccine}}. "
        + "Anh/chị vui lòng thu xếp thời gian để đến đúng lịch hẹn."
    },

    upcoming_3: {
      title: "Nhắc lịch tiêm trong 3 ngày tới",
      msg:
        "Chào {{name}}, trong 3 ngày tới {{member}} sẽ có lịch tiêm {{vaccine}} vào ngày {{date}}. "
        + "Quý khách vui lòng ghi nhớ thời gian và chuẩn bị đầy đủ khi đến tiêm."
    },

    nextdose: {
      title: "Nhắc lịch mũi tiêm tiếp theo",
      msg:
        "Chào {{name}}, {{member}} đã đến hạn tiêm mũi tiếp theo của vắc xin {{vaccine}} vào ngày {{date}}. "
        + "Phác đồ yêu cầu {{total_doses}} mũi, mỗi mũi cách nhau {{interval}} ngày. "
        + "Vui lòng thu xếp thời gian để tiêm đúng lịch nhằm đảm bảo hiệu quả phòng bệnh."
    },

    overdue: {
      title: "Nhắc lịch tiêm đang trễ",
      msg:
        "Chào {{name}}, lịch tiêm của {{member}} vào ngày {{date}} đang bị trễ so với kế hoạch. "
        + "Để bảo đảm hiệu quả tiêm chủng, vui lòng sắp xếp đến cơ sở tiêm chủng trong thời gian sớm nhất."
    },
  };

  const currentTemplate = templates[audience];

  const previewRendered = useMemo(() => {
    if (!currentTemplate) return "";
    const tpl = currentTemplate.msg || "";
    const date = sample.date ? formatDate(sample.date) : "dd/mm/yyyy";
    const interval = sample.interval != null ? String(sample.interval) : "…";
    const total = sample.total_doses != null ? String(sample.total_doses) : "…";
    const vaccine = sample.vaccine || "vắc xin";
    const disease = sample.disease || "";
    const dob = sample.dob ? new Date(sample.dob).toLocaleDateString("vi-VN") : "";

    return tpl
      .replaceAll("{{name}}", sample.customer_name || "Khách hàng")
      .replaceAll("{{member}}", sample.member_name || "")
      .replaceAll("{{date}}", date)
      .replaceAll("{{interval}}", interval)
      .replaceAll("{{total_doses}}", total)
      .replaceAll("{{vaccine}}", vaccine)
      .replaceAll("{{disease}}", disease)
      .replaceAll("{{dob}}", dob);
  }, [currentTemplate, sample]);


  const fetchSummary = useCallback(async () => {
    try {
      const [
        today,
        tomorrow,
        in3days,
        nextdose,
        overdue,
      ] = await Promise.all([
        previewAudience({ audience: "upcoming", days_before: 0 }),
        previewAudience({ audience: "upcoming", days_before: 1 }),
        previewAudience({ audience: "upcoming", days_before: 3 }),
        previewAudience({ audience: "nextdose", next_dose_days: 7, only_unscheduled: 1 }), 
        previewAudience({ audience: "overdue" }),
      ]);

      setSummary({
        upcoming_today: today?.count ?? 0,
        upcoming_1: tomorrow?.count ?? 0,
        upcoming_3: in3days?.count ?? 0,
        nextdose: nextdose?.count ?? 0,
        overdue: overdue?.count ?? 0,
        loadedAt: new Date(),
      });
    } catch (err) {
      console.error(err);
      setSummary((prev) => ({ ...prev, loadedAt: new Date() }));
    }
  }, []);

  const currentPageAppts = useMemo(() => {
    const start = (apptPage - 1) * apptPerPage;
    return appts.slice(start, start + apptPerPage);
  }, [appts, apptPage]);

  const audienceLabel = audienceOptions.find((o) => o.value === audience)?.label || "";

  const fetchAppts = useCallback(async () => {
    setApptLoading(true);
    const fetchId = ++fetchIdRef.current;
    try {
      const baseCfg =
        audienceOptions.find((o) => o.value === audience)?.backend || {};

      const params = {
        audience: baseCfg.audience,
        detail: 1,
      };

      if (baseCfg.days_before != null) {
        params.days_before = baseCfg.days_before;
      }
      if (baseCfg.next_dose_days != null) {
        params.next_dose_days = baseCfg.next_dose_days;
        params.only_unscheduled = 1;
      }

      const data = await previewAudience(params);
      if (fetchId !== fetchIdRef.current) return;

      const rows = data.results || [];
      const mapped = rows.map((r) => {
        let statusCode = r.status || audience;
        let statusLabel;
        if (statusCode === "pending") statusLabel = "Chờ xác nhận";
        else if (statusCode === "confirmed") statusLabel = "Đã xác nhận";
        else if (statusCode === "overdue") statusLabel = "Trễ hẹn";
        else if (statusCode === "nextdose") statusLabel = "Mũi tiếp theo";
        else if (statusCode === "completed") statusLabel = "Đã tiêm xong";
        else statusLabel = "Khác";

        return {
          id: r.booking_id || r.record_id,
          type: r.type,
          user: { phone: r.user_phone || "", email: r.user_email || "" },
          member_name: r.member_name || "",
          appointment_date: r.appointment_date || r.next_dose_date || "",
          status: statusCode,
          status_label: statusLabel,
          vaccine: r.vaccine || "",
          disease_name: r.disease_name || "",
          interval: r.interval ?? null,
          total_doses: r.total_doses ?? null,
        };
      });

      setAppts(mapped);
      setApptCount(mapped.length);

      if (mapped.length > 0) {
        const first = mapped[0];
        setSample({
          customer_name: first.user.phone || first.user.email,
          member_name: first.member_name,
          date: first.appointment_date || "",
          vaccine: first.vaccine || "",
          interval: first.interval ?? null,
          total_doses: first.total_doses ?? null,
          disease: first.disease_name || "",
          dob: "",
        });
      } else {
        setSample({
          customer_name: "", member_name: "", date: "",
          vaccine: "", interval: null, total_doses: null,
          disease: "", dob: "",
        });
      }
    } finally {
      if (fetchId === fetchIdRef.current) setApptLoading(false);
    }
  }, [audience]);

  useEffect(() => { fetchSummary(); }, [fetchSummary]);
  useEffect(() => { setApptPage(1); fetchAppts(); }, [fetchAppts]);

  return (
    <div className="tw-min-h-screen tw-bg-[#d5f9fa] tw-pt-[110px] tw-w-full tw-pb-12 tw-mx-auto">
      {/* Header */}
      <div className="tw-flex tw-flex-col tw-items-center tw-justify-center tw-py-[20px]">
        <div className="tw-flex tw-items-center tw-justify-center">
          <i className="fa-regular fa-bell tw-text-6xl tw-mr-4 tw-bg-gradient-to-r tw-from-[#8323e2] tw-to-pink-500 tw-bg-clip-text tw-text-transparent" />
          <h1 className="tw-text-[30px] tw-font-bold tw-bg-gradient-to-r tw-from-[#8323e2] tw-to-pink-500 tw-bg-clip-text tw-text-transparent">
            Nhắc lịch tiêm tự động
          </h1>
        </div>
        <p className="tw-text-[11px] tw-text-slate-600 tw-text-center tw-mt-2">
          Hệ thống tự động lấy lịch hẹn và gửi nhắc qua App/Web &amp; Email (nếu tài khoản có email). Nhân viên chỉ xem, không thao tác gửi.
        </p>
      </div>

      {/* Sticky bar với summary */}
      <div className="tw-sticky tw-top-0 tw-z-30 tw-backdrop-blur tw-bg-white/80 tw-border-b tw-border-gray-100">
        <div className="tw-w-[95%] tw-mx-auto tw-px-4 lg:tw-px-6">
          <div className="tw-flex tw-flex-col md:tw-flex-row tw-items-start md:tw-items-center tw-justify-between tw-gap-3 tw-py-3">
            <div className="tw-flex tw-items-center tw-gap-3">
              <div className="tw-w-9 tw-h-9 tw-rounded-lg tw-bg-gradient-to-tr tw-from-sky-500 tw-to-emerald-500 tw-flex tw-items-center tw-justify-center">
                <i className="fa-solid fa-bell tw-text-white tw-text-[16px]" />
              </div>
              <div>
                <div className="tw-text-[15px] tw-font-semibold tw-text-gray-900">Tổng quan nhắc lịch hôm nay</div>
              </div>
            </div>

            <div className="tw-flex tw-flex-wrap tw-gap-2 md:tw-gap-4">
              <div className="tw-flex tw-items-center tw-gap-2 tw-border tw-rounded-xl tw-px-3 tw-py-1.5 tw-shadow-sm tw-bg-sky-50 tw-border-sky-200">
                <span className="tw-w-2 tw-h-2 tw-rounded-full tw-bg-sky-500" />
                <span className="tw-text-[11px] tw-text-sky-600">
                  Hôm nay: <b className="tw-text-sky-700">{summary.upcoming_today ?? "—"}</b>
                </span>
              </div>
              <div className="tw-flex tw-items-center tw-gap-2 tw-border tw-rounded-xl tw-px-3 tw-py-1.5 tw-shadow-sm tw-bg-purple-50 tw-border-purple-200">
                <span className="tw-w-2 tw-h-2 tw-rounded-full tw-bg-purple-500" />
                <span className="tw-text-[11px] tw-text-purple-600">
                  Ngày mai: <b className="tw-text-purple-700">{summary.upcoming_1 ?? "—"}</b>
                </span>
              </div>
              <div className="tw-flex tw-items-center tw-gap-2 tw-border tw-rounded-xl tw-px-3 tw-py-1.5 tw-shadow-sm tw-bg-yellow-50 tw-border-yellow-200">
                <span className="tw-w-2 tw-h-2 tw-rounded-full tw-bg-yellow-500" />
                <span className="tw-text-[11px] tw-text-yellow-600">
                  Sắp tới: <b className="tw-text-yellow-700">{summary.upcoming_3 ?? "—"}</b>
                </span>
              </div>
              <div className="tw-flex tw-items-center tw-gap-2 tw-border tw-rounded-xl tw-px-3 tw-py-1.5 tw-shadow-sm tw-bg-emerald-50 tw-border-emerald-200">
                <span className="tw-w-2 tw-h-2 tw-rounded-full tw-bg-emerald-500" />
                <span className="tw-text-[11px] tw-text-emerald-600">
                  Mũi tiếp theo: <b className="tw-text-emerald-700">{summary.nextdose ?? "—"}</b>
                </span>
              </div>
              <div className="tw-flex tw-items-center tw-gap-2 tw-border tw-rounded-xl tw-px-3 tw-py-1.5 tw-shadow-sm tw-bg-rose-50 tw-border-rose-200">
                <span className="tw-w-2 tw-h-2 tw-rounded-full tw-bg-rose-500" />
                <span className="tw-text-[11px] tw-text-rose-600">
                  Trễ hẹn: <b className="tw-text-rose-700">{summary.overdue ?? "—"}</b>
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="tw-w-full tw-mx-auto tw-px-4 lg:tw-px-6 tw-pt-6 tw-pb-10">
        <div className="tw-grid lg:tw-grid-cols-[minmax(0,3fr)_minmax(320px,1fr)] tw-gap-6">
          {/* LEFT: Danh sách chi tiết (card) */}
          <div className="tw-space-y-6 tw-min-w-0">
            <section className="tw-bg-white tw-rounded-2xl tw-shadow-sm tw-border tw-border-gray-100">
              <header className="tw-flex tw-flex-wrap tw-items-center tw-justify-between tw-border-b tw-border-gray-100 tw-px-4 md:tw-px-5 tw-pt-3 tw-pb-2">
                <div>
                  <h3 className="tw-text-[14px] tw-font-semibold tw-text-gray-900">Danh sách khách hàng</h3>
                  <p className="tw-text-[9px] tw-text-gray-500">Hệ thống tự động chọn nhóm khách theo quy tắc bên phải.</p>
                </div>
                <div className="tw-flex tw-items-center tw-gap-2 tw-mt-2 md:tw-mt-0">
                  {audienceOptions.map((opt) => (
                    <button key={opt.value} type="button" onClick={() => setAudience(opt.value)}
                      className={`tw-text-[11px] tw-px-3 tw-py-1.5 tw-rounded-full tw-border tw-transition ${
                        audience === opt.value ? "tw-bg-[#3ebecf] tw-border-[#3ebecf] tw-text-white" : "tw-bg-slate-50 tw-border-slate-200 tw-text-slate-600 hover:tw-bg-slate-100"
                      }`} >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </header>

              <div className="tw-p-4 md:tw-p-5">
                <div className="tw-flex tw-items-center tw-justify-between tw-mb-3">
                  <div className="tw-text-[12px] tw-text-slate-600">Nhóm đang xem: <b className="tw-text-slate-900">{audienceLabel}</b></div>
                  <div className="tw-text-[12px] tw-text-slate-600">Tổng: <b className="tw-text-slate-900">{apptCount ?? 0} khách</b></div>
                </div>

                {apptLoading && <div className="tw-py-6 tw-text-center tw-text-slate-500">Đang tải danh sách…</div>}
                {!apptLoading && currentPageAppts.length === 0 && (
                  <div className="tw-py-6 tw-text-center tw-text-red-500 tw-italic">Không có khách nào trong nhóm này.</div>
                )}

                {!apptLoading && currentPageAppts.length > 0 && (
                  <div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-2 tw-gap-6">
                    {currentPageAppts.map((b, idx) => {
                      const hasEmail = !!b.user.email;
                      return (
                        <div key={b.id || idx} className="tw-relative tw-bg-white tw-rounded-2xl tw-border tw-border-slate-200 tw-shadow-sm tw-p-3 md:tw-p-4 tw-flex tw-flex-col tw-gap-3">
                          <span className="tw-absolute tw-left-[-2px] tw-top-2 tw-bottom-2 tw-w-[3px] tw-rounded-full tw-bg-sky-400" />
                          {/* Hàng trên: thông tin + trạng thái */}
                          <div className="tw-flex tw-items-start tw-justify-between tw-gap-3">
                            <div className="tw-flex tw-items-start tw-gap-3">
                              <div className="tw-w-8 tw-h-8 tw-rounded-full tw-bg-slate-100 tw-flex tw-items-center tw-justify-center">
                                <i className="fa-regular fa-user tw-text-slate-500" />
                              </div>
                              <div className="tw-flex tw-flex-col tw-gap-0.5 tw-min-w-0">
                                <div className="tw-text-[14px] tw-font-semibold tw-text-slate-900 tw-truncate">{displayUser(b.user)}</div>
                                {b.user.email && <div className="tw-text-[11px] tw-text-slate-500 tw-truncate tw-max-w-[220px]">{b.user.email}</div>}
                                <div className="tw-text-[12px] tw-text-purple-600">Người tiêm: <b className="tw-text-purple-700">{b.member_name || "—"}</b></div>
                              </div>
                            </div>
                            <div className={`tw-inline-flex tw-items-center tw-gap-1 tw-text-[10px] tw-font-medium tw-px-3 tw-py-1 tw-rounded-full ${statusCls(b.status, b.status_label)}`}>
                              <span className="tw-w-2 tw-h-2 tw-rounded-full tw-bg-current" />
                              <span>{b.status_label || b.status}</span>
                            </div>
                          </div>

                         {/* Hàng dưới: chip ngày, vaccine, kênh */}
                          <div className="tw-flex tw-flex-col lg:tw-flex-row tw-items-start lg:tw-items-center tw-justify-between tw-gap-2">
                            <div className="tw-flex tw-flex-wrap tw-gap-2 tw-flex-1 tw-min-w-0">
                              <div className="tw-inline-flex tw-items-center tw-gap-1 tw-text-[10px] tw-px-3 tw-py-1 tw-rounded-full tw-border tw-border-purple-200 tw-bg-purple-50">
                                <i className="fa-regular fa-calendar-days tw-text-[11px] tw-text-purple-700" />
                                <span className="tw-text-purple-700">{toDisplayDate(b.appointment_date)}</span>
                              </div>
                              {/* chip vắc xin + bệnh, có truncate */}
                              <div className="tw-inline-flex tw-items-center tw-gap-1 tw-text-[10px] tw-px-3 tw-py-1 tw-rounded-full tw-border tw-border-purple-200 tw-bg-purple-50 tw-max-w-full lg:tw-max-w-[260px] tw-overflow-hidden">
                                <i className="fa-solid fa-syringe tw-text-[11px] tw-text-purple-700" />
                                <span className="tw-text-purple-700 tw-truncate">
                                  {b.vaccine || "—"}
                                  {b.disease_name ? ` • ${b.disease_name}` : ""}
                                </span>
                              </div>
                            </div>
                            <div className="tw-flex tw-flex-wrap tw-gap-2 tw-flex-shrink-0">
                              <span className="tw-inline-flex tw-items-center tw-gap-1 tw-text-[10px] tw-px-3 tw-py-[5px] tw-rounded-full tw-bg-emerald-50 tw-text-emerald-700 tw-border tw-border-emerald-200">
                                <i className="fa-solid fa-bell tw-text-[10px]" /> App / Web
                              </span>
                              {hasEmail && (
                                <span className="tw-inline-flex tw-items-center tw-gap-1 tw-text-[10px] tw-px-3 tw-py-[5px] tw-rounded-full tw-bg-blue-50 tw-text-blue-700 tw-border tw-border-blue-200">
                                  <i className="fa-regular fa-envelope tw-text-[10px]" /> Email
                                </span>
                              )}
                            </div>
                          </div>

                        </div>
                      );
                    })}
                  </div>
                )}

                <Pagination page={apptPage} totalItems={apptCount} perPage={apptPerPage} onPageChange={setApptPage} />

                <div className="tw-text-[10px] tw-pt-4 tw-text-gray-500">
                  Gợi ý: Nhân viên có thể mở chi tiết khách hàng để xem thêm lịch sử tiêm / lịch hẹn, nhưng việc nhắc lịch được hệ thống xử lý tự động.
                </div>
              </div>
            </section>
          </div>

          {/* RIGHT: Quy tắc & xem trước nội dung hệ thống */}
          <div className="tw-space-y-6 tw-min-w-0">
            {/* Quy tắc nhắc tự động */}
            <section className="tw-bg-white tw-rounded-2xl tw-shadow-sm tw-border tw-border-gray-100">
              <header className="tw-flex tw-items-center tw-justify-center tw-border-b tw-border-gray-100 tw-px-4 md:tw-px-5 tw-py-3">
                <div className="tw-text-center">
                  <h3 className="tw-text-[14px] tw-font-semibold tw-text-gray-900">Quy tắc nhắc lịch tự động</h3>
                  <p className="tw-text-[9px] tw-text-gray-500">Được cấu hình ở hệ thống trung tâm – nhân viên chỉ xem.</p>
                </div>
              </header>
              <div className="tw-p-4 md:tw-p-5 tw-space-y-3">
                {/* Rule 1 */}
                <div className="tw-flex tw-items-start tw-gap-3 tw-rounded-xl tw-border tw-px-3 tw-py-3 tw-bg-sky-50 tw-border-sky-200">
                  <i className="fa-regular fa-clock tw-text-sky-700 tw-text-[15px] tw-mt-[2px]" />
                  <div>
                    <div className="tw-text-[12px] tw-font-semibold tw-text-sky-700 tw-text-left">Lịch tiêm sắp tới (Booking)</div>
                    <div className="tw-text-[10px] tw-text-justify tw-text-sky-700 tw-mt-1">
                      Hệ thống tự động lấy các lịch tiêm có trạng thái <b>Chờ xác nhận </b> và{" "}
                      <b>nhắc trước 3 ngày</b> qua App/Web và Email (nếu tài khoản có email).
                    </div>
                  </div>
                </div>
                {/* Rule 2 */}
                <div className="tw-flex tw-items-start tw-gap-3 tw-rounded-xl tw-border tw-px-3 tw-py-3 tw-bg-emerald-50 tw-border-emerald-200">
                  <i className="fa-solid fa-syringe tw-text-emerald-700 tw-text-[15px] tw-mt-[2px]" />
                  <div>
                    <div className="tw-text-[12px] tw-font-semibold tw-text-emerald-700 tw-text-left">Mũi tiếp theo (Sổ tiêm)</div>
                    <div className="tw-text-[10px] tw-text-justify tw-text-emerald-700 tw-mt-1">
                      Dựa trên <b>Mũi tiêm tiếp theo</b>, hệ thống tự chọn các mũi đến hạn trong{" "}
                      <b>lịch tiêm chủng</b> và gửi nhắc lịch mũi tiếp theo.
                    </div>
                  </div>
                </div>
                {/* Rule 3 */}
                <div className="tw-flex tw-items-start tw-gap-3 tw-rounded-xl tw-border tw-px-3 tw-py-3 tw-bg-rose-50 tw-border-rose-200">
                  <i className="fa-solid fa-triangle-exclamation tw-text-rose-600 tw-text-[15px] tw-mt-[2px]" />
                  <div>
                    <div className="tw-text-[12px] tw-font-semibold tw-text-rose-700 tw-text-left">Khách trễ hẹn</div>
                    <div className="tw-text-[10px] tw-text-justify tw-text-rose-700 tw-mt-1">
                      Lấy các lịch hẹn có ngày &lt; hôm nay và chưa chuyển sang <b>Đã tiêm / Đã hủy</b>, gửi nhắc lịch trễ để khách đặt lại/thực hiện tiêm.
                    </div>
                  </div>
                </div>

                <div className="tw-text-[9px] tw-text-gray-500 tw-pt-1">
                  * Nếu cần thay đổi quy tắc (ví dụ nhắc trước 5 ngày thay vì 3 ngày), admin hệ thống điều chỉnh ở cấu hình BE, màn hình này sẽ tự cập nhật theo.
                </div>
              </div>
            </section>

            {/* Nội dung nhắc (ví dụ hệ thống gửi) */}
            <section className="tw-bg-white tw-rounded-2xl tw-shadow-sm tw-border tw-border-gray-100">
              <header className="tw-flex tw-items-center tw-justify-center tw-border-b tw-border-gray-100 tw-px-4 md:tw-px-5 tw-py-3">
                <div className="tw-text-center">
                  <h3 className="tw-text-[14px] tw-font-semibold tw-text-gray-900">Nội dung nhắc hệ thống gửi</h3>
                </div>
              </header>
              <div className="tw-p-4 md:tw-p-5 tw-space-y-4">
                <div>
                  <div className="tw-text-[12px] tw-text-pink-600 tw-mb-1">Nhóm hiện tại: <b className="tw-text-pink-700">{audienceLabel}</b></div>
                  <div className="tw-border tw-border-sky-100 tw-rounded-xl tw-bg-gradient-to-br tw-from-white tw-to-sky-50 tw-p-4">
                    <div className="tw-text-[12px] tw-font-semibold tw-text-sky-900 tw-mb-2">{currentTemplate?.title || "— Tiêu đề —"}</div>
                    <div className="tw-text-[11px] tw-text-justify tw-whitespace-pre-wrap tw-text-sky-700">{previewRendered || "— Nội dung xem trước —"}</div>
                  </div>
                  <div className="tw-text-[9px] tw-text-gray-500 tw-mt-2">* Nội dung này được cấu hình ở hệ thống, nhân viên không chỉnh sửa tại màn hình này.</div>
                </div>
              </div>
            </section>

            {/* Ghi chú dành cho nhân viên */}
            <section className="tw-bg-white tw-rounded-2xl tw-shadow-sm tw-border tw-border-gray-100">
              <header className="tw-flex tw-items-center tw-justify-center tw-border-b tw-border-gray-100 tw-px-4 md:tw-px-5 tw-py-3">
                <div className="tw-text-center">
                  <h3 className="tw-text-[15px] tw-font-semibold tw-text-orange-700">Ghi chú cho nhân viên y tế</h3>
                </div>
              </header>
              <div className="tw-p-2 md:tw-p-3 tw-bg-yellow-50 tw-space-y-1 tw-text-justify tw-rounded-r-xl">
                <p className="tw-text-yellow-700 tw-text-[9px]">• Hệ thống tự động gửi nhắc lịch qua App/Web cho tất cả khách có tài khoản, và gửi thêm Email nếu tài khoản có email.</p>
                <p className="tw-text-yellow-700 tw-text-[9px]">• Nhân viên có thể dùng màn hình này để kiểm tra hôm nay hệ thống đang nhắc cho những ai, trong khoảng ngày nào.</p>
                <p className="tw-text-yellow-700 tw-text-[9px]">• Nếu phát hiện sai lệch (khách không nên được nhắc / thiếu khách), hãy kiểm tra lại lịch hẹn, sổ tiêm hoặc báo cho quản trị hệ thống.</p>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
