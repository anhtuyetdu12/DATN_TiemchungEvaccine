// QuantityPillBooking.jsx
export default function QuantityPillBooking({
  value,
  onChange,
  min = 1,
  max = 1,
  className = "",
}) {
  const clamp = (n) => Math.max(min, Math.min(max, Number.isFinite(n) ? n : min));
  const dec   = () => onChange(clamp(value - 1));
  const inc   = () => onChange(clamp(value + 1));

  return (
    <div
      className={`tw-flex tw-items-center tw-justify-between tw-border tw-border-gray-300
                  tw-rounded-full tw-w-[100px] tw-bg-white tw-shadow-sm tw-overflow-hidden ${className}`}
      role="group" aria-label="Điều chỉnh số liều"
    >
      {/* nút trừ (xám) */}
      <button
        type="button"
        onClick={dec}
        disabled={value <= min}
        aria-label="Giảm"
        className={`tw-w-10 tw-h-10 tw-flex tw-items-center tw-justify-center tw-rounded-full tw-transition-all
          ${value <= min ? "tw-bg-gray-200 tw-text-gray-400 tw-cursor-not-allowed"
                         : "tw-bg-gray-100 hover:tw-bg-gray-200 tw-text-gray-700"}`}
      >
        <i className="fa-solid fa-minus" />
      </button>

      {/* số */}
      <input
        type="number"
        inputMode="numeric"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(clamp(parseInt(e.target.value, 10)))}
        onBlur={(e) => onChange(clamp(parseInt(e.target.value, 10)))}
        onWheel={(e) => e.currentTarget.blur()}  // tránh cuộn chuột đổi số
        className="tw-w-14 tw-h-10 tw-text-center tw-border-none tw-font-semibold
                   tw-text-gray-800 focus:tw-outline-none tw-bg-transparent"
      />

      {/* nút cộng (gradient xanh) */}
      <button
        type="button"
        onClick={inc}
        disabled={value >= max}
        aria-label="Tăng"
        className={`tw-w-10 tw-h-10 tw-flex tw-items-center tw-justify-center tw-rounded-full tw-transition-all
          ${value >= max
            ? "tw-bg-gray-200 tw-text-gray-400 tw-cursor-not-allowed"
            : "tw-bg-gradient-to-r tw-from-[#56b6f7] tw-to-[#1999ee] hover:tw-from-[#3aa9f0] hover:tw-to-[#1789d4] tw-text-white"}`}
      >
        <i className="fa-solid fa-plus" />
      </button>
    </div>
  );
}
