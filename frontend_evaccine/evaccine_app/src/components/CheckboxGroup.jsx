import { useState } from "react";

export default function CheckboxGroup({ options, title }) {
  const [selected, setSelected] = useState(null);

  return (
    <div className="tw-my-4">
      <h2 className="tw-font-bold tw-text-lg tw-mb-2">{title}</h2>
      <div className="tw-flex tw-flex-col tw-gap-4">
        {options.map((option, index) => (
          <div key={index} className="tw-flex tw-items-center tw-gap-4">
            <button
              type="button" role="checkbox"
              aria-checked={selected === index}
              onClick={() => setSelected(index)}
              className={`tw-w-6 tw-h-6 tw-flex tw-items-center tw-justify-center 
                          tw-border tw-rounded-md tw-transition-colors tw-duration-150
                          ${
                            selected === index
                              ? "tw-bg-blue-500 tw-border-blue-500"
                              : "tw-border-gray-400"
                          }
                          hover:tw-border-blue-500 hover:tw-ring-2 hover:tw-ring-cyan-400 hover:tw-ring-opacity-40
                          focus:tw-border-blue-600 focus:tw-ring-2 focus:tw-ring-cyan-400 focus:tw-ring-opacity-40`} >
              {selected === index && (
                <i className="fa-solid fa-check tw-text-white tw-text-xs"></i>
              )}
            </button>
            <p className="tw-font-medium tw-text-black tw-text-xl">{option}</p>
          </div>
        ))}
      </div>
    </div>
  );
}