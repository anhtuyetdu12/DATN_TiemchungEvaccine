import React, { useEffect, useRef } from "react";

export default function CompleteBookingModal({
  show,
  booking,             // { id, member, appointment_date, ... }
  note,
  setNote,
  onConfirm,
  onCancel,
}) {
  const textareaRef = useRef(null);

  useEffect(() => {
    if (show && textareaRef.current) {
      textareaRef.current.focus(); // UX: auto focus
    }
  }, [show]);

  if (!show) return null;

  return (
    <div className="tw-fixed tw-inset-0 tw-bg-black/50 tw-flex tw-justify-center tw-items-center tw-z-50">
      <div className="tw-bg-white tw-p-6 tw-rounded-xl tw-w-[520px] tw-shadow-xl tw-relative">
        <h2 className="tw-text-3xl tw-font-semibold tw-mb-4 tw-text-blue-600">
          Hoàn thành lịch hẹn
        </h2>

        <div className="tw-space-y-3 tw-text-gray-800">
          <div>  Xác nhận <b>hoàn thành</b> lịch hẹn #{booking?.id}?  </div>
          <div className="tw-text-lg tw-text-gray-600">
            Người tiêm: <b className="tw-text-pink-600">{booking?.member?.full_name || "Không rõ"}</b>
            {" · "}Ngày hẹn:{" "}
            <i className="tw-text-pink-600">
              {booking?.appointment_date ? new Date(booking.appointment_date).toLocaleDateString("vi-VN")  : "—"}
            </i>
          </div>

          <label className="tw-block tw-text-lg tw-font-medium tw-text-left tw-pt-2">
            Ghi chú phản ứng sau tiêm (tuỳ chọn):
          </label>
          <textarea   ref={textareaRef}   rows={5}   value={note}    onChange={(e) => setNote(e.target.value)}
            className="tw-w-full tw-border tw-rounded-lg tw-text-lg tw-px-3 tw-py-2 focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-blue-300 focus:tw-border-blue-800"
            placeholder="VD: Sốt nhẹ 38.2°C, đau chỗ tiêm 1 ngày…"
          />
        </div>

        <div className="tw-flex tw-justify-end tw-space-x-3 tw-mt-6">
          <button  onClick={onCancel}
            className="tw-bg-red-600 tw-text-white tw-px-4 tw-py-2 tw-rounded hover:tw-bg-red-500" >
            Hủy
          </button>
          <button   onClick={onConfirm}
            className="tw-bg-green-600 tw-text-white tw-px-4 tw-py-2 tw-rounded hover:tw-bg-green-500" >
            Xác nhận 
          </button>
        </div>
      </div>
    </div>
  );
}
