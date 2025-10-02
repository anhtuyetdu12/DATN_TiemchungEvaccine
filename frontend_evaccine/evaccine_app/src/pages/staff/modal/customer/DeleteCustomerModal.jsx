import React from "react";

export default function DeleteCustomerModal({ show, customer, onClose, onConfirm }) {
  if (!show) return null;

  return (
    <div className="tw-fixed tw-inset-0 tw-bg-black tw-bg-opacity-50 tw-flex tw-items-center tw-justify-center">
      <div className="tw-bg-white tw-p-6 tw-rounded-lg tw-shadow-lg tw-w-[400px]">
        <h2 className="tw-text-3xl tw-font-bold tw-mb-4 tw-text-blue-400">
          Xác nhận hủy lịch tiêm
        </h2>
        <p className="tw-mb-6 tw-text-gray-700">
          Bạn có chắc chắn muốn hủy lịch tiêm của <strong>{customer?.name}</strong> không?
        </p>
        <div className="tw-flex tw-justify-end tw-gap-3">
          <button onClick={onClose}
            className="tw-bg-red-600 tw-text-white tw-px-4 tw-py-2 tw-rounded hover:tw-bg-red-700" >
            Hủy
          </button>
          <button onClick={onConfirm}
            className="tw-bg-blue-600 tw-text-white tw-px-4 tw-py-2 tw-rounded hover:tw-bg-blue-700" >
            Đồng ý
          </button>
        </div>
      </div>
    </div>
  );
}
