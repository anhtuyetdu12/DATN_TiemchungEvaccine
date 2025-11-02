// src/pages/user/NotificationsUser.jsx
import { useEffect, useMemo, useState } from "react";
import { getMyNotifications, markMyNotificationRead } from "../../services/notificationService";
import Pagination from "../../components/Pagination";
import { toast } from "react-toastify";

const PAGE_SIZE = 12;

export default function NotificationsUser() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedIds, setExpandedIds] = useState(() => new Set());

  const formatDateTime = (iso) => {
    if (!iso) return "";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const yyyy = d.getFullYear();
    const hh = String(d.getHours()).padStart(2, "0");
    const mi = String(d.getMinutes()).padStart(2, "0");
    return `${dd}/${mm}/${yyyy} ${hh}:${mi}`;
  };

  const formatDate = (iso) => {
    if (!iso) return "";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const yyyy = d.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  };

  const formatPrice = (v) => {
    if (v == null) return "—";
    return v.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".") + " VNĐ";
  };

  const fetchNoti = async () => {
    try {
      setLoading(true);
      const data = await getMyNotifications();
      const list = Array.isArray(data) ? data : data.results || [];
      setItems(list);
      setPage(1);
      setExpandedIds(new Set());
    } catch (err) {
      console.error("fetch notifications failed:", err);
      toast.error("Không tải được danh sách thông báo.");
    } finally {
      setLoading(false);
    }
  };

  const refresh = async () => {
    try {
      setRefreshing(true);
      const data = await getMyNotifications();
      const list = Array.isArray(data) ? data : data.results || [];
      setItems(list);
      setPage(1);
      setExpandedIds(new Set());
      toast.success("Đã làm mới thông báo.");
    } catch (err) {
      console.error(err);
      toast.error("Làm mới thất bại.");
    } finally {
      setRefreshing(false);
    }
  };

  const markRead = async (id) => {
    try {
      await markMyNotificationRead(id);
      setItems((prev) => prev.map((it) => (it.id === id ? { ...it, is_read: true } : it)));
    } catch (err) {
      console.error(err);
      toast.error("Không đánh dấu được thông báo này.");
    }
  };

  const toggleExpand = (id) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  useEffect(() => { fetchNoti(); }, []);

  const filtered = useMemo(() => {
    if (filter === "unread") return items.filter((i) => !i.is_read);
    if (filter === "read") return items.filter((i) => i.is_read);
    return items;
  }, [items, filter]);

  const view = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="tw-min-h-screen tw-bg-cyan-50 tw-flex tw-flex-col tw-mt-[95px] tw-py-8">
      {/* Header */}
      <div className="tw-sticky tw-top-0 tw-z-10 tw-bg-cyan-50/80 tw-backdrop-blur tw-border-b tw-border-slate-200 
      tw-px-4 md:tw-px-8 tw-py-3 tw-flex tw-items-center tw-justify-between">
        <div className="tw-flex tw-items-center tw-gap-3">
          <div className="tw-w-16 tw-h-16 tw-rounded-xl tw-bg-emerald-100 tw-flex tw-items-center tw-justify-center">
            <i className="fa-regular fa-bell tw-text-emerald-600 tw-text-3xl" />
          </div>
          <div>
            <h1 className="tw-text-[20px] tw-font-semibold tw-text-[#0e0681]">Thông báo</h1>
            <p className="tw-text-[12px] tw-text-slate-500">Các nhắc lịch tiêm và thông báo từ cơ sở</p>
          </div>
        </div>
        <div className="tw-flex tw-items-center tw-gap-3">
          <button onClick={refresh} className="tw-flex tw-items-center tw-gap-1 tw-text-[12px] tw-bg-white tw-border 
          tw-border-slate-200 tw-rounded-lg tw-px-3 tw-py-1.5 hover:tw-bg-slate-100">
            <i className={`fa-solid fa-rotate ${refreshing ? "tw-animate-spin" : ""}`} />
            Làm mới
          </button>
          <button onClick={async () => {
              const unread = items.filter((i) => !i.is_read);
              if (!unread.length) { toast.info("Không còn thông báo chưa đọc."); return; }
              for (const it of unread) { try { await markMyNotificationRead(it.id); } catch (e) {} }
              setItems((prev) => prev.map((it) => ({ ...it, is_read: true })));
              toast.success("Đã đánh dấu tất cả đã đọc.");
            }} className="tw-hidden sm:tw-flex tw-items-center tw-gap-1 tw-text-[12px] tw-bg-emerald-500 
            tw-text-white tw-rounded-lg tw-px-3 tw-py-1.5 hover:tw-bg-emerald-600">
            <i className="fa-regular fa-circle-check" />
            Đánh dấu tất cả đã đọc
          </button>
        </div>
      </div>

      {/* Filter bar */}
      <div className="tw-px-4 md:tw-px-8 tw-pt-4 tw-pb-2">
        <div className="tw-flex tw-gap-2 tw-flex-wrap">
            <button onClick={() => { setFilter("all"); setPage(1); }} className={`tw-text-[12px] tw-rounded-full tw-px-3 tw-py-1.5 
                ${filter === "all" ? "tw-bg-yellow-500 tw-text-white" : "tw-bg-white tw-text-slate-700 tw-border tw-border-slate-200"}`}>
                    Tất cả ({items.length})
            </button>
            <button onClick={() => { setFilter("unread"); setPage(1); }} className={`tw-text-[12px] tw-rounded-full tw-px-3 tw-py-1.5 
                ${filter === "unread" ? "tw-bg-cyan-500 tw-text-white" : "tw-bg-white tw-text-slate-700 tw-border tw-border-slate-200"}`}>
                    Chưa đọc ({items.filter((i) => !i.is_read).length})
            </button>
            <button onClick={() => { setFilter("read"); setPage(1); }} className={`tw-text-[12px] tw-rounded-full tw-px-3 tw-py-1.5 
                ${filter === "read" ? "tw-bg-slate-900/80 tw-text-white" : "tw-bg-white tw-text-slate-700 tw-border tw-border-slate-200"}`}>
                    Đã đọc ({items.filter((i) => i.is_read).length})
            </button>
            <div className="tw-flex-1" />
            <span className="tw-text-[11px] tw-text-slate-400 tw-self-center">{filtered.length} thông báo</span>
        </div>
      </div>

      {/* Content */}
      <div className="tw-flex-1 tw-px-4 md:tw-px-8 tw-pb-10">
        {loading ? (
          <div className="tw-space-y-3 tw-mt-4">
            {Array.from({ length: 4 }).map((_, i) => (<div key={i} className="tw-h-[76px] tw-bg-white tw-rounded-xl tw-border tw-border-slate-100 tw-animate-pulse" />))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="tw-mt-6 tw-flex tw-flex-col tw-items-center tw-justify-center tw-text-slate-400">
            <img src="/images/tbao.jpg" alt="Không có thông báo" className="tw-w-[200px] tw-h-[200px] tw-object-contain tw-mb-3 tw-rounded-full" />
            <span className="tw-text-xl">Chưa có thông báo.</span>
          </div>
        ) : (
          <div className="tw-space-y-3 tw-mt-4">
            {view.map((n) => {
              const meta = n.meta || {};
              const memberName = meta.member_name || "—";
              const apptDate = meta.appointment_date ? formatDate(meta.appointment_date) : "";
              const vaccines = Array.isArray(meta.vaccines) ? meta.vaccines : [];
              const diseases = Array.isArray(meta.diseases) ? meta.diseases : [];
              const price = meta.price;
              const location = meta.location || "";
              const status = meta.status || "";
              const bookingId = meta.booking_id || n.related_booking_id || null;
              const vaccineDetails = Array.isArray(meta.vaccine_details) ? meta.vaccine_details : [];
              const sentAt = n.sent_at || n.created_at;
              const isExpanded = expandedIds.has(n.id);

              return (
                <div key={n.id} className={`tw-rounded-xl tw-border tw-px-4 tw-py-3 tw-bg-white tw-flex tw-gap-3 
                ${!n.is_read ? "tw-border-emerald-200" : "tw-border-slate-100"}`}>
                  <div className="tw-pt-1">
                    <div className={`tw-w-9 tw-h-9 tw-rounded-full tw-flex tw-items-center tw-justify-center 
                        ${!n.is_read ? "tw-bg-emerald-100 tw-text-emerald-700" : "tw-bg-pink-100 tw-text-pink-500"}`}>
                        <i className="fa-solid fa-bell" />
                    </div>
                  </div>
                  <div className="tw-flex-1 tw-min-w-0">
                    <div className="tw-flex tw-items-center tw-justify-between tw-gap-2">
                      <div className="tw-flex tw-flex-wrap tw-gap-2 tw-items-center tw-min-w-0">
                        <div className="tw-text-[13px] tw-font-semibold tw-text-slate-900 tw-truncate">{n.title || "Thông báo"}</div>
                            {memberName && memberName !== "—" && (
                                <span className="tw-bg-sky-50 tw-text-sky-700 tw-text-[11px] tw-font-medium tw-px-2 tw-py-[2px] tw-rounded-full">
                                    {memberName}
                                </span>
                            )}
                            {vaccines.map((v, idx) => (
                                <span key={idx} className="tw-bg-emerald-50 tw-text-emerald-700 tw-text-[10px] tw-px-2 tw-py-[1px] tw-rounded-full">
                                    {v}
                                </span>)
                            )}
                            {diseases.map((d, idx) => (
                                <span key={idx} className="tw-bg-amber-50 tw-text-amber-700 tw-text-[10px] tw-px-2 tw-py-[1px] tw-rounded-full">
                                    {d}
                                </span>)
                            )}
                            {status && (
                                <span className="tw-bg-purple-50 tw-text-purple-700 tw-text-[10px] tw-px-2 tw-py-[1px] tw-rounded-full">
                                    {status === "pending" ? "Chờ xác nhận" 
                                    : status === "confirmed" ? "Đã xác nhận" 
                                    : status === "completed" ? "Đã tiêm xong" 
                                    : status === "cancelled" ? "Đã hủy" : status}
                                </span>
                            )}
                      </div>
                      <div className="tw-text-[10px] tw-text-slate-500 tw-text-right tw-whitespace-nowrap">{sentAt ? formatDateTime(sentAt) : ""}</div>
                    </div>

                    <div className="tw-text-[11px] tw-text-slate-500 tw-mt-1 tw-flex tw-flex-wrap tw-gap-x-3 tw-gap-y-1">
                        {apptDate && (
                            <span className="tw-flex tw-items-center tw-gap-1 tw-text-cyan-500">
                                <i className="fa-regular fa-calendar" /><b>{apptDate}</b>
                            </span>
                        )}
                        {location && (
                            <span className="tw-flex tw-items-center tw-gap-1">
                                <i className="fa-solid fa-location-dot" />{location}
                            </span>
                        )}
                        {price != null && price !== "" && (
                            <span className="tw-flex tw-items-center tw-gap-1 tw-text-orange-500">
                                <i className="fa-solid fa-money-bill" />{formatPrice(price)}
                            </span>                      
                        )}
                        {n.audience && (
                            <span className="tw-flex tw-items-center tw-gap-1">
                                <i className="fa-solid fa-users" />{n.audience}
                            </span>
                        )}
                        {Array.isArray(n.channels) ? null : n.channels && (
                            <span className="tw-flex tw-items-center tw-gap-1">
                                <i className="fa-solid fa-bullhorn" />{Object.keys(n.channels).filter((k) => n.channels[k]).join(", ")}
                            </span>
                        )}
                    </div>

                    <div className="tw-text-[14px] tw-text-slate-600 tw-my-5 tw-whitespace-pre-line">{n.message || ""}</div>

                    {vaccineDetails.length > 0 && isExpanded && (
                        <div className="tw-mt-2 tw-w-[80%] tw-mx-auto tw-border tw-border-emerald-100 tw-rounded-lg tw-bg-emerald-50/40">
                            <div className="tw-text-[12px] tw-font-semibold tw-text-slate-700 tw-text-center tw-px-4 tw-pt-3"> Chi tiết mũi tiêm  </div>
                            <div className="tw-px-4 tw-pb-3 tw-pt-3 tw-space-y-2">
                            {vaccineDetails.map((vd, i) => {
                                const doseDate = vd.date || meta.appointment_date || meta.date || n.appointment_date || null;
                                return (
                                <div key={i} className="tw-grid tw-grid-cols-[170px,80px,210px,140px,130px] tw-gap-x-3 tw-items-center">
                                    <span className="tw-text-[11px] tw-font-medium tw-text-cyan-800 tw-truncate">{vd.vaccine_name || "Vắc xin"}</span>
                                    <span className="tw-h-[26px] tw-flex tw-items-center">
                                    {vd.dose_number ? (
                                        <span className="tw-inline-flex tw-items-center tw-text-[10px] tw-bg-pink-50 tw-text-pink-700 tw-rounded-full tw-px-2 tw-py-[3px]">
                                            Mũi {vd.dose_number}
                                        </span>
                                    ) : null}
                                    </span>
                                    <span className="tw-h-[26px] tw-flex tw-items-center">
                                    {vd.disease_name ? (
                                        <span className="tw-inline-flex tw-items-center tw-text-[10px] tw-text-amber-700 tw-bg-amber-50 tw-rounded-full tw-px-2 tw-py-[3px]">
                                            Phòng: {vd.disease_name}
                                        </span>
                                    ) : null}
                                    </span>
                                    <span className="tw-h-[26px] tw-flex tw-items-center">
                                    {doseDate ? (
                                        <span className="tw-inline-flex tw-items-center tw-gap-1 tw-text-[10px] tw-text-slate-500 tw-bg-white/40 tw-rounded-full tw-px-2 tw-py-[3px]">
                                            <i className="fa-regular fa-calendar" />{formatDate(doseDate)}
                                        </span>
                                    ) : null}
                                    </span>
                                    <span className="tw-h-[26px] tw-flex tw-items-center">
                                    {vd.unit_price ? (
                                        <span className="tw-inline-flex tw-items-center tw-gap-1 tw-text-[10px] tw-text-slate-500 tw-bg-white/40 tw-rounded-full tw-px-2 tw-py-[3px]">
                                            <i className="fa-solid fa-money-bill" />{formatPrice(vd.unit_price)}
                                        </span>
                                    ) : null}
                                    </span>
                                </div>
                                );
                            })}
                            </div>
                        </div>
                    )}

                    <div className="tw-flex tw-gap-2 tw-mt-3">
                      <button type="button" onClick={() => {
                        if (vaccineDetails.length > 0) { toggleExpand(n.id); }
                        else { 
                            if (bookingId) toast.info("Xem chi tiết lịch hẹn #" + bookingId); 
                            else toast.info("Không có lịch hẹn gắn kèm."); 
                        }
                        }} className="tw-text-[11px] tw-bg-orange-100 hover:tw-bg-orange-200 tw-text-orange-700 tw-rounded-lg tw-px-3 tw-py-1.5">
                        {vaccineDetails.length > 0 ? (isExpanded ? "Ẩn xem chi tiết" : "Xem chi tiết") : "Xem chi tiết"}
                      </button>
                      {!n.is_read && (
                        <button type="button" onClick={() => markRead(n.id)} 
                        className="tw-text-[11px] tw-bg-emerald-100 hover:tw-bg-emerald-200 tw-text-emerald-600 tw-rounded-lg tw-px-3 tw-py-1.5">
                            Đã đọc
                        </button>)}
                        {/* <button type="button" onClick={() => setItems((prev) => prev.filter((it) => it.id !== n.id))} 
                            className="tw-text-[11px] tw-bg-rose-100 hover:tw-bg-rose-200 tw-text-rose-500 tw-rounded-lg tw-px-3 tw-py-1.5">
                                Hủy
                        </button> */}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {!loading && filtered.length > PAGE_SIZE && (
            <Pagination page={page} totalItems={filtered.length} perPage={PAGE_SIZE} onPageChange={setPage}  />
        )}
      </div>
    </div>
  );
}
