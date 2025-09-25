import { useState } from "react";

// Component tái sử dụng
export default function AccordionFilter({ title, options, withSearch = false }) {
  const [isOpen, setIsOpen] = useState(true);
  const [selected, setSelected] = useState(["all"]);
  const [search, setSearch] = useState("");

  const toggle = (id) => {
    if (id === "all") {
      setSelected(["all"]);
    } else {
      setSelected((prev) =>
        prev.includes(id)
          ? prev.filter((x) => x !== id)
          : [...prev.filter((x) => x !== "all"), id]
      );
    }
  };

  const filteredOptions = withSearch
    ? options.filter((opt) =>
        opt.label.toLowerCase().includes(search.toLowerCase())
      )
    : options;

  return (
    <div className="tw-border-b tw-py-4">
      {/* Nút toggle accordion */}
      <button  type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="tw-flex tw-w-full tw-items-center tw-gap-2" >
        <span className="tw-text-left tw-font-medium">{title}</span>
        <i
          className={`fa-solid ${
            isOpen ? "fa-angle-up" : "fa-angle-down"
          } tw-ml-auto tw-text-[14px] tw-transition-all`}
        ></i>
      </button>

      {/* Nội dung */}
      {isOpen && (
        <div className="tw--mx-1 tw-px-1 tw-pt-3">
          {withSearch && (
            <div className=" tw-relative tw-mb-3">
              <input type="text"  value={search} onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm theo quốc gia"
                className="tw-w-full tw-border tw-border-gray-300 tw-rounded-lg tw-pl-3 tw-pr-9 tw-py-2 
                        tw-text-sm focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-blue-400" />
                <i className="fa-solid fa-magnifying-glass tw-absolute tw-right-3 tw-top-1/2 -tw-translate-y-1/2 tw-text-gray-400"></i>
             
            </div>
          )}

          <ul className="tw-flex tw-flex-col tw-gap-2">
            {filteredOptions.map((opt) => {
              const checked = selected.includes(opt.id);
              return (
                <li key={opt.id}>
                  <div className="tw-flex tw-items-center tw-gap-3">
                    {/* Checkbox */}
                    <div className="tw-shrink-0 tw-p-0.5 tw-size-6">
                      <button type="button" role="checkbox" aria-checked={checked} data-state={checked ? "checked" : "unchecked"}
                        onClick={() => toggle(opt.id)}
                        className={`tw-block tw-w-6 tw-h-6 tw-rounded-md tw-border tw-transition-colors tw-duration-150
                          ${ checked
                              ? "tw-border-blue-500 tw-bg-blue-500"
                              : "tw-border-gray-300 hover:tw-border-cyan-500"
                          }`} >
                        {checked && (
                          <span className="tw-flex tw-items-center tw-justify-center tw-text-white tw-text-sm">
                            <i className="fa-solid fa-check"></i>
                          </span>
                        )}
                      </button>
                    </div>
                    <label className="tw-cursor-pointer tw-text-xl tw-font-medium tw-text-gray-800">
                      {opt.label}
                    </label>
                  </div>
                </li>
              );
            })}
          </ul>

          <button type="button"
            className="tw-mt-3 tw-flex tw-items-center tw-text-blue-600 tw-text-lg hover:tw-underline tw-gap-2"  >
            Xem thêm
            <i className="fa-solid fa-angles-down"></i>
          </button>
        </div>
      )}
    </div>
  );
}