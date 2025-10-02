// src/pages/staff/modal/vaccines/ViewExpiryVCModal.jsx
import React from "react";

export default function ViewExpiryVCModal({ show, onClose, vaccine }) {
  if (!show || !vaccine) return null;

  return (
    <div className="tw-fixed tw-inset-0 tw-bg-black/50 tw-flex tw-items-center tw-justify-center tw-pt-[80px]">
      <div className="tw-bg-white tw-rounded-2xl tw-shadow-xl tw-p-8 tw-w-[550px] tw-animate-fadeIn">
        {/* Header */}
        <div className="tw-relative tw-flex tw-items-center tw-justify-center tw-mb-6">
          <h2 className="tw-text-3xl tw-font-bold tw-text-blue-600">
            <i className="fa-solid fa-vial-virus tw-mr-2"></i> Chi tiết vắc xin
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

        {/* Body */}
        <div className="tw-grid tw-grid-cols-2 tw-gap-y-4 tw-text-gray-700 tw-text-left tw-px-20 tw-pb-8 tw-ml-20">
          <div className="tw-font-semibold">Tên vắc xin:</div>
          <div>{vaccine.name}</div>

          <div className="tw-font-semibold">Loại:</div>
          <div>{vaccine.type}</div>

          <div className="tw-font-semibold">Mã:</div>
          <div>{vaccine.code}</div>

          <div className="tw-font-semibold">Số lượng:</div>
          <div>
            {vaccine.quantity} {vaccine.unit}
          </div>

          <div className="tw-font-semibold">Hạn sử dụng:</div>
          <div>{vaccine.expiry}</div>

          <div className="tw-font-semibold">Nhà sản xuất:</div>
          <div>{vaccine.manufacturer}</div>

          <div className="tw-font-semibold">Quốc gia:</div>
          <div>{vaccine.country}</div>

          <div className="tw-font-semibold">Số lô:</div>
          <div>{vaccine.batch}</div>

          <div className="tw-font-semibold">Giá:</div>
          <div>{vaccine.price.toLocaleString()} VNĐ</div>

          <div className="tw-font-semibold">Cảnh báo:</div>
          <div
            className={`tw-font-medium ${
              vaccine.warningType === "Hàng & Hạn đã hết"
                ? "tw-text-red-600"
                : vaccine.warningType === "Hạn sử dụng sắp hết"
                ? "tw-text-orange-600"
                : vaccine.warningType === "Số lượng sắp hết"
                ? "tw-text-blue-600"
                : "tw-text-green-600"
            }`}
          >
            {vaccine.warningType}
          </div>

          <div className="tw-font-semibold">Ghi chú:</div>
          <div>{vaccine.note || "—"}</div>
        </div>
      </div>
    </div>
  );
}
