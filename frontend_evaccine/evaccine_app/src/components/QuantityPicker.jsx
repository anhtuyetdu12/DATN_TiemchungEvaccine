import { useState } from "react";

export default function QuantityPicker() {
  const [formData, setFormData] = useState({ quantity: 0 });

  const handleChange = (e) => {
    const value = e.target.value;
    // Chỉ cho phép số nguyên >= 0
    if (/^\d*$/.test(value)) {
      setFormData((prev) => ({ ...prev, quantity: value === "" ? 0 : parseInt(value) }));
    }
  };

  const increment = () => {
    setFormData((prev) => ({ ...prev, quantity: prev.quantity + 1 }));
  };

  const decrement = () => {
    setFormData((prev) => ({ ...prev, quantity: Math.max(prev.quantity - 1, 0) }));
  };

  return (
    <div>
      <div className="tw-flex tw-items-center tw-gap-2">
        {/* Nút trừ */}
        <button
          type="button"
          onClick={decrement}
          className="tw-bg-blue-200 hover:tw-bg-blue-300 tw-text-gray-800 tw-px-4 tw-py-2 tw-rounded-lg tw-border tw-border-blue-300"
        >
          <i className="fa-solid fa-minus"></i>
        </button>

        {/* Input số lượng */}
        <input
          type="text"
          name="quantity"
          value={formData.quantity}
          onChange={handleChange}
          className="tw-border tw-border-gray-300 tw-px-3 tw-py-2 tw-w-24 tw-rounded-lg tw-text-center focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-blue-300 focus:tw-border-blue-800"
        />

        {/* Nút cộng */}
        <button
          type="button"
          onClick={increment}
          className="tw-bg-blue-200 hover:tw-bg-blue-300 tw-text-gray-800 tw-px-4 tw-py-2 tw-rounded-lg tw-border tw-border-blue-300"
        >
          <i className="fa-solid fa-plus"></i>
        </button>
      </div>
    </div>
  );
}
