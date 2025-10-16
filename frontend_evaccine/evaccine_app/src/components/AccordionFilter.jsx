// src/components/AccordionFilter.jsx
import { useMemo, useState } from "react";

export default function AccordionFilter({
  title,
  options = [],
  selected = ["all"],
  onChange = () => {},
  withSearch = false,
  showMoreAt = 4,
  searchPlaceholder = "Nhập thông tin tìm kiếm ...",
}) {
  const [isOpen, setIsOpen] = useState(true);
  const [expanded, setExpanded] = useState(false);
  const [search, setSearch] = useState("");
  // Lọc theo từ khoá (nếu bật withSearch)
  const filteredOptions = useMemo(() => {
    if (!withSearch || !search.trim()) return options;
    const kw = search.trim().toLowerCase();
    return options.filter((opt) => (opt.label || "").toLowerCase().includes(kw));
  }, [options, withSearch, search]);

  // Danh sách hiển thị khi chưa bấm "Xem thêm"
  const visibleOptions = useMemo(() => {
    // luôn ưu tiên render “Tất cả” (nếu có) ở trên
    const allOpt = filteredOptions.find((o) => o.id === "all");
    const rest = filteredOptions.filter((o) => o.id !== "all");
    const sliced = expanded ? rest : rest.slice(0, showMoreAt);
    return { allOpt, list: sliced, totalNonAll: rest.length };
  }, [filteredOptions, expanded, showMoreAt]);

  const isChecked = (id) =>
    selected.includes("all") ? id === "all" : selected.includes(id);

  const toggle = (id) => {
    if (id === "all") {
      onChange(["all"]);
      return;
    }
    const current = new Set(selected.includes("all") ? [] : selected);
    if (current.has(id)) current.delete(id);
    else current.add(id);

    const next = Array.from(current);
    onChange(next.length ? next : ["all"]);
  };

  return (
    <div className="tw-border tw-border-gray-200 tw-rounded-xl tw-overflow-hidden tw-my-3 ">
      {/* Header */}
      <button  type="button" onClick={() => setIsOpen(!isOpen)}
        className="tw-flex tw-w-full tw-items-center tw-gap-2 tw-bg-gray-50 tw-px-4 tw-py-3">
        <span className="tw-text-left tw-font-semibold tw-text-gray-700">{title}</span>
        <i className={`fa-solid ${ isOpen ? "fa-angle-up" : "fa-angle-down" } tw-ml-auto tw-text-[14px] tw-text-gray-500 tw-transition-all`} />
      </button>

      {/* Body */}
      {isOpen && (
        <div className="tw-px-4 tw-pt-3 tw-pb-4">
          {withSearch && (
            <div className="tw-relative tw-mb-3">
              <input type="text" value={search}
                onChange={(e) => setSearch(e.target.value)}  placeholder={searchPlaceholder}
                className="tw-w-full tw-border tw-border-gray-300 tw-rounded-lg tw-pl-3 tw-pr-9 tw-py-2 
                           tw-text-sm focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-blue-400" />
              <i className="fa-solid fa-magnifying-glass tw-absolute tw-right-3 tw-top-1/2 -tw-translate-y-1/2 tw-text-gray-400" />
            </div>
          )}

          <ul className="tw-flex tw-flex-col tw-gap-2">
            {/* Tất cả (nếu có) */}
            {visibleOptions.allOpt && (
              <li key="all">
                <button type="button" onClick={() => toggle("all")}
                  className="tw-flex tw-items-center tw-gap-3 tw-w-full" >
                  <span aria-checked={isChecked("all")} role="checkbox"
                    className={`tw-block tw-w-8 tw-h-8 tw-rounded-md tw-border tw-transition-colors tw-duration-150 ${
                      isChecked("all")
                        ? "tw-border-blue-500 tw-bg-blue-500"
                        : "tw-border-gray-300 hover:tw-border-cyan-500"
                    }`} >
                    {isChecked("all") && (
                      <span className="tw-flex tw-items-center tw-justify-center tw-text-white tw-text-lg tw-mt-1.5">
                        <i className="fa-solid fa-check" />
                      </span>
                    )}
                  </span>
                  <span className="tw-cursor-pointer tw-text-[12px] tw-text-left tw-font-medium tw-text-gray-800">
                    {visibleOptions.allOpt.label}
                  </span>
                </button>
              </li>
            )}

            {/* Các option khác */}
            {visibleOptions.list.map((opt) => (
              <li key={opt.id}>
                <button type="button" onClick={() => toggle(opt.id)} className="tw-flex tw-items-center tw-gap-3 tw-w-full"  >
                  <span aria-checked={isChecked(opt.id)} role="checkbox"
                    className={`tw-block tw-w-8 tw-h-8 tw-rounded-md tw-border tw-transition-colors tw-duration-150 ${
                      isChecked(opt.id)
                        ? "tw-border-blue-500 tw-bg-blue-500"
                        : "tw-border-gray-300 hover:tw-border-cyan-500"
                    }`}>
                    {isChecked(opt.id) && (
                      <span className="tw-flex tw-items-center tw-justify-center tw-text-white tw-text-lg tw-mt-1.5">
                        <i className="fa-solid fa-check" />
                      </span>
                    )}
                  </span>
                  <span className="tw-cursor-pointer tw-text-[12px] tw-text-left tw-font-medium tw-text-gray-800"> {opt.label} </span>
                </button>
              </li>
            ))}
          </ul>

          {/* Xem thêm / Thu gọn */}
          {visibleOptions.totalNonAll > showMoreAt && (
            <button type="button" onClick={() => setExpanded(!expanded)}
              className="tw-mt-3 tw-flex tw-items-center tw-text-blue-600 tw-text-lg hover:tw-underline tw-gap-2" >
              {expanded ? "Thu gọn" : "Xem thêm"}
              <i className={`fa-solid ${expanded ? "fa-angles-up" : "fa-angles-down"} tw-text-sm tw-leading-none`} />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
