import { useState ,useEffect, useRef } from "react";

export default function Dropdown({ label, value, options, onChange, className = ""   }) {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const btnRef = useRef(null);

  useEffect(() => {
    if (open && btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      setPosition({
        x: rect.left,
        y: rect.bottom + window.scrollY
      });
    }
  }, [open]);
  return (
    <div className={`tw-relative tw-bg-white tw-mb-3 ${className}`}>
      {label && ( <label className="tw-block tw-mb-2 tw-text-gray-700 tw-font-medium"> {label} </label> )}

      {/* Nút bấm mở dropdown */}
      <button type="button"
        onClick={() => setOpen(!open)}
        className="tw-w-full tw-flex tw-justify-between tw-items-center 
                   tw-border tw-border-gray-300 tw-rounded-lg tw-px-4 tw-py-3 tw-text-gray-700 
                   hover:tw-border-[#56b6f7] hover:tw-ring-1 hover:tw-ring-[#56b6f7]
                   focus:tw-outline-none focus:tw-border-[#1999ee] focus:tw-ring-2 focus:tw-ring-[#1999ee]/40" >
        <span className="tw-truncate">
          {value  ? options.find((opt) => opt.value === value)?.label  : "-- Chọn --"}
        </span>
        <i className={`fa-solid ${open ? "fa-angle-up" : "fa-angle-down"}`}></i>
      </button>

      {/* Danh sách dropdown */}
      {open && (
        <div className="tw-absolute tw-left-0 tw-right-0 tw-z-[60] tw-mt-1">
          <div
            className="tw-bg-white tw-rounded-lg tw-border tw-border-gray-300 tw-shadow-xl
                      tw-py-2 tw-max-h-60 tw-overflow-y-auto
                      tw-w-full [&::-webkit-scrollbar]:tw-hidden" >
            {options.map((opt) => (
              <div  key={opt.value} onClick={() => { onChange(opt.value); setOpen(false); }}
                className={`tw-flex tw-items-center tw-justify-between tw-px-4 tw-py-2 tw-cursor-pointer 
                            ${value === opt.value ? "tw-bg-[#e6f7fa]" : "hover:tw-bg-[#e6f7fa]"}`}>
                <span className="tw-truncate">{opt.label}</span>
                {value === opt.value && <i className="fa-solid fa-check tw-text-[#1999ee]" />}
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
