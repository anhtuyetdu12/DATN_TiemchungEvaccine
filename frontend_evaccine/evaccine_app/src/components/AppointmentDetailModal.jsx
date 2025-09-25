// src/components/ConfirmModal.jsx
import React from "react";

export default function AppointmentDetailModal({ detail, onClose }) {
  if (!detail) return null;

  return (
    <div className="tw-fixed tw-inset-0 tw-bg-black/50 tw-flex tw-items-center tw-justify-center tw-pt-[80px]">
      <div className="tw-bg-white tw-rounded-2xl tw-shadow-xl tw-p-8 tw-w-[550px] tw-animate-fadeIn">
        <div className="tw-relative tw-flex tw-items-center tw-justify-center tw-mb-6">
          <h2 className="tw-text-3xl tw-font-bold tw-text-blue-600">
            <i className="fa-solid fa-calendar-check tw-mr-2"></i> Chi tiết lịch hẹn
          </h2>
          <button
            onClick={onClose}
            className="tw-absolute tw-right-0 tw-top-0 tw-flex tw-items-center tw-justify-center 
                      tw-w-10 tw-h-10 tw-rounded-full tw-text-red-500 hover:tw-bg-gray-200 
                      hover:tw-text-red-600 transition-colors"
          >
            <i className="fa-solid fa-xmark tw-text-2xl"></i>
          </button>
        </div>

        <div className="tw-grid tw-grid-cols-2 tw-gap-y-4 tw-text-gray-700 tw-text-left tw-px-16 tw-pb-8">
          <div className="tw-font-semibold">Khách hàng:</div>
          <div>{detail.name}</div>

          <div className="tw-font-semibold">Ngày sinh:</div>
          <div>{detail.dob}</div>

          <div className="tw-font-semibold">Chiều cao / Cân nặng:</div>
          <div>
            {detail.height} cm / {detail.weight} kg
          </div>

          <div className="tw-font-semibold">Độ tuổi:</div>
          <div>{detail.age} tuổi</div>

          <div className="tw-font-semibold">Ngày giờ hẹn:</div>
          <div>{detail.time}</div>

          <div className="tw-font-semibold">Địa chỉ:</div>
          <div>{detail.address}</div>

          <div className="tw-font-semibold">Điện thoại:</div>
          <div>{detail.phone}</div>

          <div className="tw-font-semibold">Vắc xin:</div>
          <div className="tw-font-medium tw-text-green-600">
            <i className="fa-solid fa-syringe tw-mr-1"></i> {detail.vaccine}
          </div>

          <div className="tw-font-semibold">Bác sĩ:</div>
          <div>{detail.doctor}</div>

          <div className="tw-font-semibold">Ghi chú:</div>
          <div>{detail.note || "—"}</div>
        </div>
      </div>
    </div>
  );
}

