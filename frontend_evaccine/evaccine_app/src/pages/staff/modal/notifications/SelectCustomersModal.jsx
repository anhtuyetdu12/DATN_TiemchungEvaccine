// src/pages/staff/notifications/SelectCustomersModal.jsx
import { useEffect, useMemo, useState } from "react";
import { fetchCustomers } from "../../../../services/customerService";

export default function SelectCustomersModal({
  show,
  onClose,
  onConfirm,
  preselectedIds = [],
}) {
  const [loading, setLoading] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const perPage = 10;
  const [selected, setSelected] = useState(new Set(preselectedIds));


  useEffect(() => {
    if (!show) return;
    (async () => {
      setLoading(true);
      try {
        const list = await fetchCustomers(); // trả đúng shape bạn đang xài
        setCustomers(list || []);
      } finally {
        setLoading(false);
      }
    })();
  }, [show]);

  useEffect(() => {
    setSelected(new Set(preselectedIds));
  }, [preselectedIds]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return customers;
    return customers.filter((c) =>
      [c.name, c.email, c.phone, c.code].filter(Boolean).join(" ").toLowerCase().includes(q)
    );
  }, [customers, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const pageData = filtered.slice((page - 1) * perPage, page * perPage);

  const toggle = (id) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const allOnPageIds = pageData.map((c) => c.id);
  const allOnPageChecked = allOnPageIds.every((id) => selected.has(id)) && allOnPageIds.length > 0;
  const someOnPageChecked = allOnPageIds.some((id) => selected.has(id)) && !allOnPageChecked;

  const togglePage = () => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (allOnPageChecked) {
        allOnPageIds.forEach((id) => next.delete(id));
      } else {
        allOnPageIds.forEach((id) => next.add(id));
      }
      return next;
    });
  };

  

  if (!show) return null;

  return (
    <div className="tw-fixed tw-inset-0 tw-z-50 tw-flex tw-items-center tw-justify-center">
      <div className="tw-absolute tw-inset-0 tw-bg-black/30" onClick={onClose} />
      <div className="tw-relative tw-bg-white tw-w-[95%] md:tw-w-4/5 lg:tw-w-2/3 tw-rounded-2xl tw-shadow-xl tw-p-6 tw-max-h-[80vh] tw-overflow-hidden">
        <div className="tw-flex tw-items-center tw-justify-between tw-mb-4">
          <h3 className="tw-text-2xl tw-font-semibold tw-text-gray-800">Chọn khách hàng</h3>
          <button onClick={onClose} className="tw-text-gray-500 hover:tw-text-gray-700">
            <i className="fa-solid fa-xmark tw-text-2xl"></i>
          </button>
        </div>

        <div className="tw-flex tw-gap-2 tw-mb-3">
          <input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { setSearch(searchInput.trim()); setPage(1); } }}
            placeholder="Tìm theo tên, email, SĐT, mã KH…"
            className="tw-flex-1 tw-border tw-border-gray-300 tw-rounded-lg tw-px-3 tw-py-2 focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-blue-300 focus:tw-border-blue-800"
          />
          <button
            onClick={() => { setSearch(searchInput.trim()); setPage(1); }}
            className="tw-bg-blue-600 tw-text-white tw-rounded-lg tw-px-4 tw-py-2 hover:tw-bg-blue-500"
          >
            <i className="fa-solid fa-magnifying-glass tw-mr-2"></i>Tìm
          </button>
        </div>

        <div className="tw-border tw-rounded-xl tw-overflow-hidden">
          <table className="tw-w-full tw-text-left">
            <thead className="tw-bg-gray-50">
              <tr>
                <th className="tw-px-4 tw-py-3 tw-w-12">
                  {/* chọn tất cả trang hiện tại */}
                  <input
                    type="checkbox"
                    checked={allOnPageChecked}
                    ref={(el) => { if (el) el.indeterminate = someOnPageChecked; }}
                    onChange={togglePage}
                  />
                </th>
                <th className="tw-px-4 tw-py-3">Họ tên</th>
                <th className="tw-px-4 tw-py-3">Điện thoại</th>
                <th className="tw-px-4 tw-py-3">Email</th>
                <th className="tw-px-4 tw-py-3">Mã KH</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} className="tw-px-4 tw-py-6 tw-text-center">Đang tải…</td></tr>
              ) : pageData.length === 0 ? (
                <tr><td colSpan={5} className="tw-px-4 tw-py-6 tw-text-center tw-text-gray-500">Không có dữ liệu</td></tr>
              ) : (
                pageData.map((c) => (
                  <tr key={c.id} className="hover:tw-bg-gray-50">
                    <td className="tw-px-4 tw-py-2">
                      <input
                        type="checkbox"
                        checked={selected.has(c.id)}
                        onChange={() => toggle(c.id)}
                      />
                    </td>
                    <td className="tw-px-4 tw-py-2">{c.name || "-"}</td>
                    <td className="tw-px-4 tw-py-2">{c.phone || "-"}</td>
                    <td className="tw-px-4 tw-py-2">{c.email || "-"}</td>
                    <td className="tw-px-4 tw-py-2">{c.code || `KH-${c.id}`}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* pagination + footer */}
        <div className="tw-flex tw-items-center tw-justify-between tw-mt-4">
          <div className="tw-text-sm tw-text-gray-600">
            Đã chọn: <b>{selected.size}</b> khách
          </div>
          <div className="tw-flex tw-items-center tw-gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="tw-border tw-rounded-lg tw-px-3 tw-py-1 disabled:tw-opacity-50"
            >
              Trước
            </button>
            <span className="tw-text-sm">Trang {page}/{totalPages}</span>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="tw-border tw-rounded-lg tw-px-3 tw-py-1 disabled:tw-opacity-50"
            >
              Sau
            </button>
          </div>
        </div>

        <div className="tw-flex tw-justify-end tw-gap-3 tw-mt-4">
          <button onClick={onClose} className="tw-border tw-rounded-xl tw-px-5 tw-py-2">Đóng</button>
          <button
            onClick={() => onConfirm(Array.from(selected))}
            className="tw-bg-emerald-600 tw-text-white tw-rounded-xl tw-px-5 tw-py-2 hover:tw-bg-emerald-500"
          >
            Xác nhận
          </button>
        </div>
      </div>
    </div>
  );
}
