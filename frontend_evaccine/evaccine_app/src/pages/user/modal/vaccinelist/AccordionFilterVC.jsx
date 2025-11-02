import { useState } from "react";

export default function AccordionFilterVC({ title, options = [], selectedValue = [], onChange, withSearch = false }) {
  const [open, setOpen] = useState(false);
  const [searchText, setSearchText] = useState("");

  const filteredOptions = withSearch
  ? options.filter((opt) =>
      opt.label.toLowerCase().includes(searchText.toLowerCase())
    )
  : options;

  const handleToggle = (value) => {
  if (selectedValue.includes(value)) {
    onChange(selectedValue.filter((v) => v !== value));
  } else {
    onChange([...selectedValue, value]);
  }
};

  return (
    <div className="tw-border-b tw-border-gray-200">
      <button onClick={() => setOpen(!open)}
        className="tw-w-full tw-flex tw-justify-between tw-items-center tw-py-2 tw-font-medium">
        {title}
        <i className={`fa-solid ${open ? "fa-angle-up" : "fa-angle-down"}`}></i>
      </button>

      {open && (
        <div className="tw-pt-2 tw-space-y-2">
          {withSearch && (
            <input type="text" value={searchText}  onChange={(e) => setSearchText(e.target.value)}
              placeholder={`Tìm ${title.toLowerCase()}...`}
              className="tw-w-full tw-px-2 tw-py-1 tw-border tw-border-gray-300 tw-rounded"
            />
          )}

          <div className="tw-flex tw-flex-wrap tw-gap-2">
            {filteredOptions.map((opt) => {
              const checked = selectedValue.includes(opt.id);
              return (
                <button key={opt.id}  type="button" onClick={() => handleToggle(opt.id)}
                  className={`tw-w-[90px] tw-h-10 tw-flex tw-items-center tw-justify-center tw-border tw-rounded-md tw-font-medium
                    ${checked ? "tw-bg-blue-500 tw-border-blue-500 tw-text-white" : "tw-border-gray-300 tw-bg-white tw-text-black"}
                  `} >
                  {opt.label}   {/* render label thay vì object */}
                  {checked && <i className="fa-solid fa-check tw-ml-1"></i>}
                </button>
              );
            })}

          </div>
        </div>
      )}
    </div>
  );
}
