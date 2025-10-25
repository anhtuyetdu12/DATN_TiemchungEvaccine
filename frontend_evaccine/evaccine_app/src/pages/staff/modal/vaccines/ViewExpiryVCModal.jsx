// src/pages/staff/modal/vaccines/ViewExpiryVCModal.jsx
import React from "react";

export default function ViewExpiryVCModal({ show, onClose, vaccine }) {
  if (!show || !vaccine) return null;

  const fmtDate = (d) => {
    if (!d || d === "-") return "-";
    const t = new Date(d);
    return Number.isNaN(t.getTime()) ? d : t.toLocaleDateString("vi-VN");
  };
  const fmtMoney = (n) => Number(n ?? 0).toLocaleString("vi-VN");

  const lots = Array.isArray(vaccine.lots) ? vaccine.lots : [];

  return (
    <div className="tw-fixed tw-inset-0 tw-z-[100] tw-bg-black/40 tw-backdrop-blur-sm tw-flex tw-items-center tw-justify-center">
      <div className="tw-bg-white tw-rounded-2xl tw-shadow-2xl tw-w-[80%] tw-h-[75vh] tw-flex tw-flex-col tw-overflow-hidden tw-animate-fadeIn tw-mt-[100px]">
        {/* Header */}
        <div className="tw-bg-gradient-to-r tw-from-blue-50 tw-to-cyan-50 tw-px-6 tw-py-5 tw-border-b tw-border-gray-100 tw-flex tw-items-center tw-justify-between">
          <h2 className="tw-text-2xl tw-font-bold tw-text-blue-600 tw-flex tw-items-center">
            <i className="fa-solid fa-vial-virus tw-mr-3"></i>
            Chi tiết vắc xin
          </h2>
          <button
            onClick={onClose}
            aria-label="Đóng"
            className="tw-w-10 tw-h-10 tw-rounded-full tw-flex tw-items-center tw-justify-center tw-text-gray-500 hover:tw-bg-gray-100 hover:tw-text-red-700 tw-transition"
          >
            <i className="fa-solid fa-xmark tw-text-2xl"></i>
          </button>
        </div>

        {/* Body */}
        <div className="tw-flex-1 tw-px-6 tw-py-6">
          <div className="tw-grid md:tw-grid-cols-2 tw-gap-6 ">
            {/* Cột trái */}
            <section className="tw-border tw-border-gray-100 tw-rounded-2xl tw-shadow-sm tw-flex tw-flex-col tw-max-h-[60vh] ">
              <div className="tw-bg-pink-50 tw-px-4 tw-py-3 tw-font-semibold tw-text-pink-700 tw-border-b tw-border-pink-100">
                Thông tin vắc xin
              </div>
              <div className="tw-p-2 tw-flex-1 tw-overflow-auto tw-scrollbar-thin tw-scrollbar-thumb-gray-300 tw-scrollbar-track-transparent
                          tw-overflow-y-auto tw-scrollbar-thin tw-scrollbar-thumb-gray-300 tw-scrollbar-track-transparent tw-rounded-xl  
                          [&::-webkit-scrollbar]:tw-w-2 [&::-webkit-scrollbar-thumb]:tw-rounded-full
                        [&::-webkit-scrollbar-track]:tw-bg-gray-100 [&::-webkit-scrollbar-thumb]:tw-bg-gradient-to-b
                        [&::-webkit-scrollbar-thumb]:tw-from-pink-400 [&::-webkit-scrollbar-thumb]:tw-to-purple-400">
                <table className="tw-w-full tw-text-left tw-text-[15px] tw-table-fixed tw-text-xl">
                  <colgroup>
                    <col className="tw-w-[42%]" />
                    <col className="tw-w-[58%]" />
                  </colgroup>
                  <tbody>
                    <tr className="tw-border-b tw-border-dashed tw-border-gray-300 last:tw-border-b-0">
                      <td className="tw-px-4 tw-py-3 tw-text-pink-600 tw-font-medium">Tên vắc xin</td>
                      <td className="tw-px-4 tw-py-3 tw-text-gray-800 tw-font-semibold tw-break-words">{vaccine.name ?? "—"}</td>
                    </tr>
                    <tr className="tw-border-b tw-border-dashed tw-border-gray-300 last:tw-border-b-0">
                      <td className="tw-px-4 tw-py-3 tw-text-pink-600 tw-font-medium">Phòng bệnh</td>
                      <td className="tw-px-4 tw-py-3 tw-text-gray-800 tw-font-semibold tw-break-words">{vaccine.diseaseName || vaccine.type || "—"}</td>
                    </tr>
                    <tr className="tw-border-b tw-border-dashed tw-border-gray-300 last:tw-border-b-0">
                      <td className="tw-px-4 tw-py-3 tw-text-pink-600 tw-font-medium">Mã</td>
                      <td className="tw-px-4 tw-py-3 tw-text-gray-800 tw-font-semibold">{vaccine.code ?? "—"}</td>
                    </tr>
                    <tr className="tw-border-b tw-border-dashed tw-border-gray-300 last:tw-border-b-0">
                      <td className="tw-px-4 tw-py-3 tw-text-pink-600 tw-font-medium">Số lượng</td>
                      <td className="tw-px-4 tw-py-3 tw-text-gray-800 tw-font-semibold">
                        {vaccine.quantity} {vaccine.unit || ""}
                      </td>
                    </tr>
                    <tr className="tw-border-b tw-border-dashed tw-border-gray-300 last:tw-border-b-0">
                      <td className="tw-px-4 tw-py-3 tw-text-pink-600 tw-font-medium">Hạn sử dụng</td>
                      <td className="tw-px-4 tw-py-3 tw-text-gray-800 tw-font-semibold">{fmtDate(vaccine.expiry)}</td>
                    </tr>
                    <tr className="tw-border-b tw-border-dashed tw-border-gray-300 last:tw-border-b-0">
                      <td className="tw-px-4 tw-py-3 tw-text-pink-600 tw-font-medium">Giá</td>
                      <td className="tw-px-4 tw-py-3 tw-text-gray-800 tw-font-semibold">{`${fmtMoney(vaccine.price)} VNĐ`}</td>
                    </tr>
                    <tr className="tw-border-b tw-border-dashed tw-border-gray-300 last:tw-border-b-0">
                      <td className="tw-px-4 tw-py-3 tw-text-pink-600 tw-font-medium">Nhà sản xuất</td>
                      <td className="tw-px-4 tw-py-3 tw-text-gray-800 tw-font-semibold">{vaccine.manufacturer ?? "—"}</td>
                    </tr>
                    <tr className="tw-border-b tw-border-dashed tw-border-gray-300 last:tw-border-b-0">
                      <td className="tw-px-4 tw-py-3 tw-text-pink-600 tw-font-medium">Quốc gia</td>
                      <td className="tw-px-4 tw-py-3 tw-text-gray-800 tw-font-semibold">{vaccine.country ?? "—"}</td>
                    </tr>
                    <tr className="tw-border-b tw-border-dashed tw-border-gray-300 last:tw-border-b-0">
                      <td className="tw-px-4 tw-py-3 tw-text-pink-600 tw-font-medium">Số lô (ưu tiên)</td>
                      <td className="tw-px-4 tw-py-3 tw-text-gray-800 tw-font-semibold">{vaccine.batch || "—"}</td>
                    </tr>
                    <tr className="tw-border-b tw-border-dashed tw-border-gray-300 last:tw-border-b-0">
                      <td className="tw-px-4 tw-py-3 tw-text-pink-600 tw-font-medium">Trạng thái</td>
                      <td className="tw-px-4 tw-py-3">
                        {vaccine.quantity === 0 ? (
                          <span className="tw-bg-red-100 tw-text-red-600 tw-px-3 tw-py-1.5 tw-rounded-full tw-text-base">Hết hàng</span>
                        ) : vaccine.quantity <= 20 ? (
                          <span className="tw-bg-yellow-100 tw-text-yellow-700 tw-px-3 tw-py-1.5 tw-rounded-full tw-text-base">Sắp hết</span>
                        ) : (
                          <span className="tw-bg-green-100 tw-text-green-600 tw-px-3 tw-py-1.5 tw-rounded-full tw-text-base">Còn hàng</span>
                        )}
                      </td>
                    </tr>
                    <tr className="tw-border-b tw-border-dashed tw-border-gray-300 last:tw-border-b-0">
                      <td className="tw-px-4 tw-py-3 tw-text-pink-600 tw-font-medium">Cảnh báo</td>
                      <td className="tw-px-4 tw-py-3">
                        {vaccine.warningType === "Hàng & Hạn đã hết" ? (
                          <span className="tw-px-3 tw-py-1.5 tw-rounded-full tw-text-base tw-inline-flex tw-items-center tw-gap-1 tw-bg-red-100 tw-text-red-600">
                            ⚠️ Hàng & Hạn đã hết
                          </span>
                        ) : vaccine.warningType === "Hạn sử dụng sắp hết" ? (
                          <span className="tw-px-3 tw-py-1.5 tw-rounded-full tw-text-base tw-inline-flex tw-items-center tw-gap-1 tw-bg-orange-100 tw-text-orange-700">
                            ⏰ Hạn sử dụng sắp hết
                          </span>
                        ) : vaccine.warningType === "Số lượng sắp hết" ? (
                          <span className="tw-px-3 tw-py-1.5 tw-rounded-full tw-text-base tw-inline-flex tw-items-center tw-gap-1 tw-bg-blue-100 tw-text-blue-700">
                            📦 Số lượng sắp hết
                          </span>
                        ) : (
                          <span className="tw-px-3 tw-py-1.5 tw-rounded-full tw-text-base tw-inline-flex tw-items-center tw-gap-1 tw-bg-green-100 tw-text-green-600">
                            {vaccine.warningType || "—"}
                          </span>
                        )}
                      </td>
                    </tr>
                    <tr className="tw-border-b tw-border-dashed tw-border-gray-300 last:tw-border-b-0">
                      <td className="tw-px-4 tw-py-3 tw-text-pink-600 tw-font-medium">Ghi chú</td>
                      <td className="tw-px-4 tw-py-3 tw-text-gray-800 tw-font-semibold tw-break-words">
                        {vaccine.note || "—"}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            {/* Cột phải */}
            <section className="tw-border tw-border-gray-100 tw-rounded-2xl tw-shadow-sm tw-flex tw-flex-col">
              <div className="tw-bg-cyan-50 tw-px-4 tw-py-3 tw-font-semibold tw-text-cyan-700 tw-border-b tw-border-cyan-100">
                Danh sách lô
              </div>

              {lots.length === 0 ? (
                <div className="tw-px-4 tw-py-6 tw-text-gray-500">Không có thông tin lô.</div>
              ) : (
                <div className="tw-flex-1 tw-overflow-auto">
                  <table className="tw-w-full tw-text-left tw-text-xl">
                    <thead className="tw-sticky tw-top-0 tw-bg-white tw-text-cyan-600 tw-border-b tw-border-gray-100">
                      <tr>
                        <th className="tw-px-4 tw-py-3 tw-w-[40%]">Số lô</th>
                        <th className="tw-px-4 tw-py-3 tw-w-[35%]">Hạn sử dụng</th>
                        <th className="tw-px-4 tw-py-3 tw-w-[25%]">SL khả dụng</th>
                      </tr>
                    </thead>
                    <tbody>
                      {lots.map((l, idx) => (
                        <tr
                          key={`${l.lot_number ?? "lot"}-${idx}`}
                          className={`tw-border-b tw-border-dashed tw-border-gray-300 last:tw-border-b-0 ${
                            idx % 2 ? "tw-bg-gray-50/50" : "tw-bg-white"
                          } hover:tw-bg-gray-50/80`}
                        >
                          <td className="tw-px-4 tw-py-3 tw-font-medium">{l.lot_number || "—"}</td>
                          <td className="tw-px-4 tw-py-3">{fmtDate(l.expiry_date)}</td>
                          <td className="tw-px-4 tw-py-3">{l.quantity_available ?? "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
