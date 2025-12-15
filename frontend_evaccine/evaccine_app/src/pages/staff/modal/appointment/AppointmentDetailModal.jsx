// src/pages/staff/modal/AppointmentDetailModal.jsx
import { useEffect, useMemo } from "react";

// === Helpers ===
const formatDate = (isoStr) => {
  if (!isoStr) return "—";
  const d = new Date(isoStr);
  if (Number.isNaN(d.getTime())) return String(isoStr);
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
};

const formatVND = (n) => {
  if (n == null || isNaN(n)) return "—";
  return `${Number(n).toLocaleString("vi-VN")} VNĐ`;
};
const STATUS_VN = {
  // dùng cho booking (status code từ BE)
  pending: "Chờ xác nhận",
  confirmed: "Đã xác nhận",
  cancelled: "Đã hủy",
  completed: "Đã tiêm xong",
  overdue: "Trễ hẹn",
};

// Màu cho TRẠNG THÁI BOOKING (tổng buổi tiêm)
const BOOKING_STATUS_CLASS = {
  "Chờ xác nhận": "tw-bg-yellow-100 tw-text-yellow-700",
  "Đã xác nhận":  "tw-bg-sky-100 tw-text-sky-700",
  "Đã tiêm xong": "tw-bg-blue-100 tw-text-blue-700",
  "Đã hủy":       "tw-bg-red-100 tw-text-red-700",
  "Trễ hẹn":      "tw-bg-orange-100 tw-text-orange-700",
};

// Màu cho TRẠNG THÁI TỪNG MŨI (sổ tiêm)
const ITEM_STATUS_CLASS = {
  // trạng thái sổ tiêm
  "Đã tiêm":   "tw-bg-green-100 tw-text-green-700",
  "Chờ tiêm":  "tw-bg-sky-100 tw-text-sky-700",
  "Trễ hẹn":   "tw-bg-orange-100 tw-text-orange-700",
  "Chưa tiêm": "tw-bg-red-100 tw-text-red-700",
  // fallback: nếu vì lý do gì status_label của item là label booking
  "Chờ xác nhận": "tw-bg-yellow-100 tw-text-yellow-700",
  "Đã xác nhận":  "tw-bg-sky-100 tw-text-sky-700",
  "Đã tiêm xong": "tw-bg-blue-100 tw-text-blue-700",
  "Đã hủy":       "tw-bg-red-100 tw-text-red-700",
};


// --- trạng thái từng mũi: dùng chung nhãn với staff ---
const getItemStatus = (booking, item) => {
  // 0) ƯU TIÊN STATUS TỪ BE (item-level)
  const raw = item?.status_label || item?.status || "";
  if (raw) {
    const normalized = STATUS_VN[raw] || raw;
    const shot = item?.vaccination_date || item?.injected_at;
    // const appt = item?.next_dose_date || booking?.appointment_date;
    // dateLabel ưu tiên theo dữ liệu thật
    const dateLabel = shot
      ? formatDate(shot)
      : (item?.next_dose_date ? formatDate(item.next_dose_date)
        : (booking?.appointment_date ? formatDate(booking.appointment_date) : "—"));

    // Nếu BE đã nói "Đã tiêm" thì phải hiển thị "Đã tiêm"
    if (normalized === "Đã tiêm") return { label: "Đã tiêm", dateLabel };

    // Nếu BE trả "Chờ tiêm/Trễ hẹn/..." thì dùng luôn
    if (["Chờ tiêm", "Trễ hẹn", "Chưa tiêm"].includes(normalized)) {
      return { label: normalized, dateLabel };
    }
  }
  // 1) fallback nếu BE không trả status_label
  const shot = item?.vaccination_date || item?.injected_at;
  if (shot) return { label: "Đã tiêm", dateLabel: formatDate(shot) };
  const appt = item?.next_dose_date || booking?.appointment_date;
  if (appt) {
    const todayYMD = new Date().toISOString().slice(0, 10);
    const apptYMD = new Date(appt).toISOString().slice(0, 10);
    return { label: apptYMD < todayYMD ? "Trễ hẹn" : "Chờ tiêm", dateLabel: formatDate(appt) };
  }
  return { label: "Chưa tiêm", dateLabel: "—" };
};


// Trạng thái tổng của booking: lấy đúng theo DB
const StatusPill = ({ booking }) => {
  if (!booking) {
    return (
      <span className="tw-bg-gray-100 tw-text-gray-700 tw-px-4 tw-py-1 tw-text-xl tw-mt-3 tw-rounded-full">
        —
      </span>
    );
  }
  const raw   = booking.status_label || booking.status || "";
  const label = STATUS_VN[raw] || raw || "—"; 
  const cls   = BOOKING_STATUS_CLASS[label] || "tw-bg-gray-100 tw-text-gray-700";
  return (
    <span className={`${cls} tw-px-4 tw-py-1 tw-text-xl tw-mt-3 tw-rounded-full`}>
      {label}
    </span>
  );
};


export default function AppointmentDetailModal({ detail, onClose }) {
  // Gọi hook MỖI LẦN render (dùng dữ liệu an toàn)
  const dob = detail?.member?.date_of_birth;
  const age = useMemo(() => {
    if (!dob) return null;
    const d = new Date(dob);
    if (Number.isNaN(d.getTime())) return null;
    const today = new Date();
    let a = today.getFullYear() - d.getFullYear();
    const m = today.getMonth() - d.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < d.getDate())) a--;
    return a;
  }, [dob]);

  const items = useMemo(
    () => (Array.isArray(detail?.items_detail) ? detail.items_detail : []),
    [detail?.items_detail]
  );

  const total = useMemo(
    () =>
      items.reduce(
        (sum, it) => sum + Number(it.unit_price || 0) * Number(it.quantity || 0),
        0
      ),
    [items]
  );

  useEffect(() => {
    if (!detail) return;
    const handler = (e) => e.key === "Escape" && onClose?.();
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [detail, onClose]);

  if (!detail) return null;




  return (
    <div className="tw-fixed tw-inset-0 tw-bg-black/50 tw-backdrop-blur-[1px] tw-z-[999] tw-flex tw-items-start md:tw-items-center tw-justify-center tw-px-4 tw-py-6">
      <div className="tw-bg-white tw-rounded-2xl tw-shadow-2xl tw-w-full md:tw-w-[980px] tw-max-w-[98vw] tw-animate-fadeIn tw-border tw-border-gray-100 tw-mt-[80px] tw-h-[70vh] tw-flex tw-flex-col">
        {/* Header */}
        <div className="tw-px-6 tw-pt-4 tw-pb-2 tw-border-b tw-border-gray-100 tw-flex tw-items-center tw-justify-between">
          <div className="tw-flex tw-items-center tw-gap-3">
            <div className="tw-w-10 tw-h-10 tw-rounded-xl tw-bg-gradient-to-tr tw-from-blue-500 tw-to-purple-500 tw-flex tw-items-center tw-justify-center tw-text-white">
              <i className="fa-solid fa-calendar-check"></i>
            </div>
            <h2 className="tw-text-2xl tw-font-semibold tw-text-gray-800 tw-mt-3">
              Chi tiết lịch hẹn # {detail.id}
            </h2>
          </div>
          <div className="tw-flex-1 tw-flex tw-justify-center">
            <StatusPill booking={detail} />
          </div>

          <button onClick={onClose} aria-label="Đóng"
            className="tw-w-10 tw-h-10 tw-rounded-full tw-text-gray-500 hover:tw-bg-gray-100 hover:tw-text-red-500 tw-transition" >
            <i className="fa-solid fa-xmark tw-text-2xl"></i>
          </button>
        </div>

        {/* Body: 2 khung */}
        <div className="tw-grid md:tw-grid-cols-12 tw-gap-5 tw-p-6 tw-flex-1 tw-overflow-hidden">
          {/* Khung trái: Thông tin khách hàng */}
          <section className="md:tw-col-span-5 tw-rounded-2xl tw-border tw-border-pink-100 tw-bg-pink-50 tw-p-5">
            <div className="tw-flex tw-items-center tw-justify-between tw-mb-4">
              <h3 className="tw-text-[16px] tw-font-semibold tw-text-pink-700">
                <i className="fa-solid fa-user tw-mr-2"></i> Thông tin khách hàng
              </h3>
            </div>

            <div className="tw-space-y-4 tw-text-left tw-text-xl tw-mt-8">
              <InfoRow label="Khách đặt" value={detail?.user?.email || "—"} />
              <InfoRow label="Người tiêm" value={detail?.member?.full_name || "—"} />
              <InfoRow  label="Ngày sinh"
                value={  detail?.member?.date_of_birth ? formatDate(detail.member.date_of_birth) : "—"}
              />
              <InfoRow label="Tuổi" value={age != null ? `${age} tuổi` : "—"} />
              <InfoRow label="Điện thoại"
                value={detail?.member?.phone || detail?.user?.phone || "—"}
              />
              <InfoRow  label="Ngày hẹn"
                value={formatDate(detail?.appointment_date)}
              />
              <InfoRow label="Cơ sở"
                value={detail?.location || "255 Lê Duẩn, Thanh Khê, Tp. Đà Nẵng"}
              />
              <InfoRow label="Ghi chú"
                value={detail?.notes || "Không có"}  multiline
              />
            </div>
          </section>

          {/* Khung phải: Thông tin vắc xin */}
          <section className="md:tw-col-span-7 tw-rounded-2xl tw-border tw-border-gray-100 tw-bg-blue-50 tw-p-5 tw-flex tw-flex-col">
            <div className="tw-flex tw-items-center tw-justify-between tw-mb-4">
              <h3 className="tw-text-[16px] tw-font-semibold tw-text-[#46cbf3]">
                <i className="fa-solid fa-syringe tw-mr-2"></i> Thông tin vắc xin
              </h3>
              {detail?.package ? (
                <span className="tw-text-[10px] tw-bg-indigo-50 tw-text-indigo-600 tw-px-3 tw-py-1 tw-rounded-full">
                  Gói: {detail.package.name}
                </span>
              ) : detail?.vaccine ? (
                <span className="tw-text-[10px] tw-bg-emerald-50 tw-text-emerald-600 tw-px-3 tw-py-1 tw-rounded-full">
                  {detail.vaccine.name}
                </span>
              ) : null}
            </div>

            {/* Danh sách cuộn khi dài */}
            <div className="tw-rounded-xl tw-border tw-border-gray-100 tw-overflow-hidden">
              <div className="tw-px-4 tw-py-2 tw-text-xl tw-font-medium tw-text-gray-600">
                Danh sách vắc xin đã đặt
              </div>

              {items.length > 0 ? (
                <div className="tw-max-h-[40vh] tw-overflow-y-auto tw-scrollbar-thin tw-scrollbar-thumb-gray-300 tw-scrollbar-track-transparent tw-rounded-xl  
                          [&::-webkit-scrollbar]:tw-w-2 [&::-webkit-scrollbar-thumb]:tw-rounded-full
                          [&::-webkit-scrollbar-track]:tw-bg-gray-100 [&::-webkit-scrollbar-thumb]:tw-bg-gradient-to-b
                          [&::-webkit-scrollbar-thumb]:tw-from-cyan-400 [&::-webkit-scrollbar-thumb]:tw-to-blue-400">
                  <table className="tw-w-full tw-text-[10px] ">
                    <thead className="tw-sticky tw-top-0 tw-bg-[#a6edf7] tw-border-gray-100">
                      <tr className="tw-text-gray-700 ">
                        <th className="tw-text-left tw-font-medium tw-px-4 tw-py-3 tw-w-1/7">Vắc xin</th>
                        <th className="tw-text-left tw-font-medium tw-px-4 tw-py-3 tw-w-1/7">Phòng bệnh</th>
                        <th className="tw-text-left tw-font-medium tw-px-4 tw-py-3 tw-w-1/7">Số lượng</th>
                        <th className="tw-text-right tw-font-medium tw-px-4 tw-py-3 tw-w-1/7">Đơn giá</th>
                        <th className="tw-text-right tw-font-medium tw-px-4 tw-py-3 tw-w-1/7">Thành tiền</th>
                        <th className="tw-text-center tw-font-medium tw-px-4 tw-py-3 tw-w-1/5">Trạng thái</th>
                        <th className="tw-text-center tw-font-medium tw-px-4 tw-py-3 tw-w-1/7">Ngày tiêm </th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((it) => {
                        const name = it?.vaccine?.name || "Vắc xin";
                        const diseaseName =
                          it?.vaccine?.disease?.name ||
                          it?.disease?.name ||
                          it?.disease_name ||
                          "—";
                        const qty   = Number(it?.quantity || 0);
                        const price = Number(it?.unit_price || 0);
                        const line  = qty * price;

                        const { label: itemStatus, dateLabel } = getItemStatus(detail, it);
                        const pillCls = ITEM_STATUS_CLASS[itemStatus] || "tw-bg-gray-100 tw-text-gray-700";

                        return (
                          <tr key={it.id} className="tw-border-b tw-border-gray-50 tw-bg-white hover:tw-bg-blue-100">
                            <td className="tw-px-4 tw-py-3 tw-text-gray-800 tw-text-left">{name}</td>
                            <td className="tw-px-4 tw-py-3 tw-text-left">{diseaseName}</td>
                            <td className="tw-px-4 tw-py-3 tw-text-left">{qty}</td>
                            <td className="tw-px-4 tw-py-3 tw-text-right">{formatVND(price)}</td>
                            <td className="tw-px-4 tw-py-3 tw-text-right tw-font-medium">{formatVND(line)}</td>
                            <td className="tw-px-4 tw-py-3 tw-text-center">
                              <span className={`${pillCls} tw-px-3 tw-py-1 tw-rounded-full`}>{itemStatus}</span>
                            </td>
                            <td className="tw-px-4 tw-py-3 tw-text-center tw-text-gray-700">
                              {dateLabel || "—"}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>

                  </table>
                </div>
              ) : (
                <div className="tw-px-4 tw-py-6 tw-text-gray-500"> Không có mục vắc xin. </div>
              )}
            </div>

            {/* Tổng tiền */}
            <div className="tw-flex tw-justify-end tw-items-center tw-gap-4 tw-mt-4">
              <div className="tw-text-gray-600">Tổng tiền : </div>
              <div className="tw-text-2xl tw-font-semibold tw-text-orange-600"> {formatVND(total)} </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

// Nhãn - Giá trị (đẹp, gọn, hỗ trợ đa dòng)
function InfoRow({ label, value, multiline = false }) {
  return (
    <div className="tw-grid tw-grid-cols-5 tw-gap-2">
      <div className="tw-col-span-2 tw-text-gray-500">{label}</div>
      <div className={`tw-col-span-3 tw-text-gray-800 
        ${ multiline ? "" : "tw-truncate" }`}>
        {value}
      </div>
    </div>
  );
}
