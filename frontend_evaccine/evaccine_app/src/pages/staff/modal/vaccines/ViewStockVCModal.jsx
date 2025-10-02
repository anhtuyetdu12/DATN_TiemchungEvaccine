// src/pages/staff/modal/vaccines/ViewStockVCModal.jsx
import React from "react";

export default function ViewStockVCModal({ show, onClose, vaccine }) {
  if (!show || !vaccine) return null;

  return (
    <div className="tw-fixed tw-inset-0 tw-bg-black/50 tw-flex tw-items-center tw-justify-center tw-pt-[90px]">
      <div className="tw-bg-white tw-rounded-2xl tw-shadow-xl tw-p-8 tw-w-[550px] tw-animate-fadeIn">
        <div className="tw-relative tw-flex tw-items-center tw-justify-center tw-mb-6">
          <h2 className="tw-text-3xl tw-font-bold tw-text-blue-600">
            <i className="fa-solid fa-file-import tw-mr-3"></i>
            Chi tiết nhập / xuất
          </h2>
          <button
            onClick={onClose}
            className="tw-absolute tw-right-0 tw-top-0 tw-flex tw-items-center tw-justify-center tw-w-10 tw-h-10 
            tw-rounded-full tw-text-red-500 hover:tw-bg-gray-200 hover:tw-text-red-600 transition-colors"
          >
            <i className="fa-solid fa-xmark tw-text-2xl"></i>
          </button>
        </div>

        <div className="tw-grid tw-grid-cols-2 tw-gap-y-3 tw-text-gray-700 tw-text-left tw-px-10 tw-pb-8 tw-ml-12">
          <div className="tw-font-semibold">Tên vắc xin:</div>
          <div>
            <i className="fa-solid fa-syringe tw-mr-3 tw-text-green-500"></i>
            {vaccine.vaccineName}
          </div>

          <div className="tw-font-semibold">Phân loại:</div>
          <div>{vaccine.vaccineType || "-"}</div>

          <div className="tw-font-semibold">Ngày/giờ:</div>
          <div>
            <i className="fa-solid fa-clock tw-mr-3 tw-text-pink-500"></i>
            {vaccine.date}
          </div>

          <div className="tw-font-semibold">Số lượng:</div>
          <div>
            {vaccine.quantity}{" "}
            {vaccine.vaccineUnit || vaccine.unit || "liều"}
          </div>

          <div className="tw-font-semibold">Đơn giá:</div>
          <div>{vaccine.unitPrice?.toLocaleString() || 0} VNĐ</div>

          <div className="tw-font-semibold">Thành tiền:</div>
          <div>
            {(vaccine.quantity * (vaccine.unitPrice || 0)).toLocaleString()} VNĐ
          </div>

          <div className="tw-font-semibold">Loại giao dịch:</div>
          <div>{vaccine.type}</div>

          <div className="tw-font-semibold">Nhà cung cấp:</div>
          <div>
            <i className="fa-solid fa-house-chimney tw-mr-3 tw-text-blue-500"></i>
            {vaccine.source}
          </div>

          <div className="tw-font-semibold">Địa chỉ nhà cung cấp:</div>
          <div>
            <i className="fa-solid fa-location-dot tw-mr-3 tw-text-purple-500"></i>
            {vaccine.supplierAddress || "-"}
          </div>

          <div className="tw-font-semibold">Thông tin liên hệ:</div>
          <div>
            <i className="fa-solid fa-phone-volume tw-mr-3 tw-text-red-500"></i>
            {vaccine.supplierContact || "-"}
          </div>

          <div className="tw-font-semibold">Ghi chú:</div>
          <div>
            <i className="fa-solid fa-book tw-mr-3 tw-text-yellow-500"></i>
            {vaccine.note || "—"}
          </div>

          <div className="tw-font-semibold">Nhân viên:</div>
          <div>
            <i className="fa-solid fa-people-group tw-mr-3 tw-text-cyan-500"></i>
            {vaccine.staff}
          </div>
        </div>
      </div>
    </div>
  );
}
