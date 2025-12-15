// src/components/common/ConfirmModal.jsx
import React from "react";

export default function ConfirmModal({
  show, title = "Xác nhận",
  message, onConfirm, onCancel,
  confirmText = "Đồng ý",
  cancelText = "Hủy",
}) {
  if (!show) return null;

  return (
    <div className="tw-fixed tw-inset-0 tw-bg-black/50 tw-flex tw-justify-center tw-items-center">
      <div className="tw-bg-white tw-p-6 tw-rounded-xl tw-w-[400px] tw-shadow-xl tw-relative">
        {/* Tiêu đề */}
        <h2 className="tw-text-3xl tw-font-semibold tw-mb-4 tw-text-blue-600">
          {title}
        </h2>
        <p className="tw-mb-6 tw-text-gray-700">{message}</p>
        <div className="tw-flex tw-justify-end tw-space-x-3">
          <button onClick={onCancel}
            className="tw-bg-red-600 tw-text-white tw-px-4 tw-py-2 tw-rounded hover:tw-bg-red-500">
            {cancelText}
          </button>
          <button onClick={onConfirm}
            className="tw-bg-blue-600 tw-text-white tw-px-4 tw-py-2 tw-rounded hover:tw-bg-blue-500">
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
