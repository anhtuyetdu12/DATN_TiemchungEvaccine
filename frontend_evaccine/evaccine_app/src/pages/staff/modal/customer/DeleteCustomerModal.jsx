// DeleteCustomerModal.jsx
import React from "react";

export default function DeleteCustomerModal({
  show,
  customer,                 // vẫn giữ để tương thích (dùng .name nếu không truyền text)
  onClose,
  onConfirm,
  title = "Xác nhận",
  description,              // nếu không truyền sẽ fallback theo customer?.name
  confirmText = "Đồng ý",
  cancelText = "Hủy",
}) {
  if (!show) return null;

  return (
    <div className="tw-fixed tw-inset-0 tw-bg-black tw-bg-opacity-50 tw-flex tw-items-center tw-justify-center">
      <div className="tw-bg-white tw-p-6 tw-rounded-lg tw-shadow-lg tw-w-[400px]">
        <h2 className="tw-text-3xl tw-font-bold tw-mb-4 tw-text-blue-400">
          {title}
        </h2>
        <p className="tw-mb-6 tw-text-gray-700">
          {description ?? (
            <>Bạn có chắc chắn muốn thao tác với <strong>{customer?.name}</strong> không?</>
          )}
        </p>
        <div className="tw-flex tw-justify-end tw-gap-3">
          <button onClick={onClose}
            className="tw-bg-red-600 tw-text-white tw-px-4 tw-py-2 tw-rounded hover:tw-bg-red-700">
            {cancelText}
          </button>
          <button onClick={onConfirm}
            className="tw-bg-blue-600 tw-text-white tw-px-4 tw-py-2 tw-rounded hover:tw-bg-blue-700">
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
