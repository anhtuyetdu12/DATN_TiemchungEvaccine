// src/components/ConfirmModal.jsx
import React from "react";

export default function ConfirmModal({ confirmAction, onCancel, onConfirm }) {
  if (!confirmAction) return null;
  return (
    <div className="tw-fixed tw-inset-0 tw-bg-black/50 tw-flex tw-items-center tw-justify-center">
      <div className="tw-bg-white tw-rounded-xl tw-shadow-lg tw-p-6 tw-w-[400px]">
        <h2 className="tw-text-3xl tw-font-semibold tw-mb-4 tw-text-blue-600">
          Xác nhận thao tác
        </h2>
        <p className="tw-text-gray-600">
          Bạn có chắc muốn{" "}
          {confirmAction.action === "confirm" ? "xác nhận" : "hủy"} lịch
          hẹn của <b>{confirmAction.item.name}</b> không?
        </p>
        <div className="tw-flex tw-justify-end tw-gap-2 tw-mt-4">
          <button onClick={onCancel}
            className="tw-bg-red-600 tw-text-white tw-px-4 tw-py-2 tw-rounded hover:tw-bg-red-500" >
            Hủy
          </button>
          <button onClick={onConfirm}
            className="tw-bg-blue-600 tw-text-white tw-px-4 tw-py-2 tw-rounded hover:tw-bg-blue-500" >
            Đồng ý
          </button>
        </div>
      </div>
    </div>
  );
}
