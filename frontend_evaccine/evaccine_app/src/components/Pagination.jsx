import React from "react";

export default function Pagination({ page, totalItems, perPage = 10, onPageChange }) {
  const totalPages = Math.max(1, Math.ceil(totalItems / perPage));

  // nếu <= perPage phần tử thì không hiện phân trang
  if (totalItems <= perPage) return null;

  const goFirst = () => onPageChange(1);
  const goPrev  = () => onPageChange(Math.max(1, page - 1));
  const goNext  = () => onPageChange(Math.min(totalPages, page + 1));
  const goLast  = () => onPageChange(totalPages);

  // tạo dải số trang có ellipsis
  const getPageList = () => {
    const pages = new Set([1, totalPages, page - 1, page, page + 1]);
    // lọc các số hợp lệ
    const sorted = [...pages].filter(n => n >= 1 && n <= totalPages).sort((a, b) => a - b);
    // chèn "…" giữa các khoảng hở
    const result = [];
    for (let i = 0; i < sorted.length; i++) {
      const curr = sorted[i];
      const prev = sorted[i - 1];
      if (i > 0 && curr - prev > 1) {
        result.push("ellipsis-" + i);
      }
      result.push(curr);
    }
    return result;
  };

  const pageList = getPageList();

  return (
    <div className="tw-flex tw-justify-center tw-items-center tw-gap-2 tw-py-4">
      {/* First */}
      <button onClick={goFirst} disabled={page === 1}  title="Trang đầu"
        className="tw-px-3 tw-py-1 tw-rounded tw-text-blue-600 tw-bg-gray-100 hover:tw-bg-blue-200 disabled:tw-opacity-50" >
        <i className="fa-solid fa-angles-left"></i>
      </button>

      {/* Prev */}
      <button onClick={goPrev} disabled={page === 1}  title="Trang trước"
        className="tw-px-3 tw-py-1 tw-rounded tw-text-blue-600 tw-bg-gray-100 hover:tw-bg-blue-200 disabled:tw-opacity-50">
        <i className="fa-solid fa-angle-left"></i>
      </button>

      {/* Số trang + … */}
      {pageList.map((item) => {
        if (typeof item === "string" && item.startsWith("ellipsis")) {
          return ( <span key={item} className="tw-px-2 tw-text-gray-500">…</span> );
        }
        return (
          <button key={item} onClick={() => onPageChange(item)}
            className={`tw-px-4 tw-py-1 tw-rounded
               ${ item === page  ? "tw-bg-blue-500 tw-text-white" : "tw-bg-gray-100 hover:tw-bg-gray-200" }`}>
            {item}
          </button>
        );
      })}

      {/* Next */} 
      <button onClick={goNext} disabled={page === totalPages}  title="Trang sau"
        className="tw-px-3 tw-py-1 tw-rounded tw-text-blue-600 tw-bg-gray-100 hover:tw-bg-blue-200 disabled:tw-opacity-50" >
        <i className="fa-solid fa-angle-right"></i>
      </button>

      {/* Last */}
      <button onClick={goLast} disabled={page === totalPages}  title="Trang cuối"
        className="tw-px-3 tw-py-1 tw-rounded tw-text-blue-600 tw-bg-gray-100 hover:tw-bg-blue-200 disabled:tw-opacity-50" >
        <i className="fa-solid fa-angles-right"></i>
      </button>
    </div>
  );
}
