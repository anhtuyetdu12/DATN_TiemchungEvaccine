// components/QuantityPicker.jsx
export default function QuantityPicker({
  value,
  onChange,
  min = 0,
  max = 5,
  disabled = false,
  className = "",
}) {
  const clamp = (n) => {
    const num = Number.isFinite(n) ? n : min;
    return Math.max(min, Math.min(max, num));
  };

  const dec = () => {
    if (disabled) return;
    onChange(clamp(value - 1));
  };

  const inc = () => {
    if (disabled) return;
    onChange(clamp(value + 1));
  };

  const handleInput = (e) => {
    if (disabled) return;
    let raw = e.target.value.replace(/[^\d]/g, "");
    if (raw === "") {
      onChange(min);
      return;
    }
    onChange(clamp(parseInt(raw, 10)));
  };

  return (
    <div className={`tw-flex tw-items-center tw-gap-2 ${className}`}>
      <button
        type="button"
        onClick={dec}
        disabled={disabled || value <= min}
        className={`tw-bg-blue-200 hover:tw-bg-blue-300 tw-text-gray-800 tw-px-4 tw-py-2 tw-rounded-lg tw-border tw-border-blue-300 
          ${disabled || value <= min ? "tw-opacity-50 tw-cursor-not-allowed" : ""}`}
      >
        <i className="fa-solid fa-minus" />
      </button>

      <input
        type="text"
        value={value}
        onChange={handleInput}
        disabled={disabled}
        className="tw-border tw-border-gray-300 tw-px-3 tw-py-2 tw-w-16 tw-rounded-lg tw-text-center focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-blue-300 focus:tw-border-blue-800"
      />

      <button
        type="button"
        onClick={inc}
        disabled={disabled || value >= max}
        className={`tw-bg-blue-200 hover:tw-bg-blue-300 tw-text-gray-800 tw-px-4 tw-py-2 tw-rounded-lg tw-border tw-border-blue-300 
          ${disabled || value >= max ? "tw-opacity-50 tw-cursor-not-allowed" : ""}`}
      >
        <i className="fa-solid fa-plus" />
      </button>
    </div>
  );
}
