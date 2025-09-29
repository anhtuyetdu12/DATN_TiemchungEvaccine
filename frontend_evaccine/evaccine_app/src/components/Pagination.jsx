import React from "react";

export default function Pagination({ page, totalItems, perPage = 10, onPageChange }) {
  // tính tổng số trang
  let totalPages = Math.ceil(totalItems / perPage);
  // tối đa 3 trang
  if (totalPages > 3) totalPages = 3;

  // nếu <= 10 phần tử thì không hiện phân trang
  if (totalItems <= perPage) return null;

  return (
    <div className="tw-flex tw-justify-center tw-items-center tw-gap-2 tw-py-4">
      {/* Nút Prev */}
      <button onClick={() => onPageChange(Math.max(1, page - 1))} disabled={page === 1}
        className="tw-px-3 tw-py-1 tw-rounded tw-text-blue-600 tw-bg-gray-100 hover:tw-bg-blue-200 disabled:tw-opacity-50">
        <i className="fa-solid fa-angles-left"></i>
      </button>

      {/* Nút số trang */}
      {Array.from({ length: totalPages }, (_, i) => i + 1).map((num) => (
        <button key={num} onClick={() => onPageChange(num)}
          className={`tw-px-4 tw-py-1 tw-rounded ${
            num === page
              ? "tw-bg-blue-500 tw-text-white"
              : "tw-bg-gray-100 hover:tw-bg-gray-200"
          }`} >
          {num}
        </button>
      ))}

      {/* Nút Next */}
      <button onClick={() => onPageChange(Math.min(totalPages, page + 1))}
        disabled={page === totalPages}
        className="tw-px-3 tw-py-1 tw-rounded tw-text-blue-600 tw-bg-gray-100 hover:tw-bg-blue-200 disabled:tw-opacity-50" >
        <i className="fa-solid fa-angles-right"></i>
      </button>
    </div>
  );
}
