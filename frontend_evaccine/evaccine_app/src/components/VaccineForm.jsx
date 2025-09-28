import React, { useState, useEffect } from "react";
import Dropdown from "./Dropdown";
import QuantityPicker from "./QuantityPicker";

export default function VaccineForm({ vaccine, onSave, onCancel }) {
  const typeOptions = ["Trẻ em", "Người lớn", "Người già", "Phụ nữ mang thai"];
  const countryOptions = ["Việt Nam", "Mỹ", "Nhật Bản", "Pháp"];
  const manufacturerOptions = ["Pfizer", "Moderna", "AstraZeneca", "Sinopharm"];
  const unitOptions = ["Liều", "Lọ", "Hộp"];

  const [formData, setFormData] = useState({
    name: "",
    type: "",
    code: "",
    quantity: 0,
    unit: "",
    expiry: "",
    manufacturer: "",
    country: "",
    batch: "",
    price: 0,
    note: "",
  });


  useEffect(() => {
    if (vaccine) setFormData(vaccine);
    else
      setFormData({
        name: "", type: "", code: "", quantity: 0, unit: "", expiry: "", 
        manufacturer: "",  country: "", batch: "", price: 0, note: "",
      });
  }, [vaccine]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        name === "quantity" || name === "price"
          ? Number(value)
          : value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({ ...formData, id: vaccine?.id });
  };

  return (
    <form onSubmit={handleSubmit} className="tw-grid tw-grid-cols-2 tw-gap-2 tw-text-left">
      {/* Tên */}
      <div>
        <label className="tw-block tw-font-medium tw-mb-1 tw-ml-1">Tên</label>
        <input type="text" name="name" value={formData.name} onChange={handleChange} placeholder="Tên vắc xin"
          className="tw-border tw-px-3 tw-py-2 tw-rounded-lg tw-w-full focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-blue-300 focus:tw-border-blue-800" />
      </div>

      {/* Loại dropdown */}
      <Dropdown
        label="Loại"
        value={formData.type}
        options={typeOptions.map((o) => ({ value: o, label: o }))}
        onChange={(val) => setFormData((prev) => ({ ...prev, type: val }))}
      />

      {/* Mã */}
      <div>
        <label className="tw-block tw-font-medium tw-mb-1 tw-ml-1">Mã</label>
        <input type="text" name="code" value={formData.code} onChange={handleChange} placeholder="Mã"
          className="tw-border tw-px-3 tw-py-2 tw-rounded-lg tw-w-full focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-blue-300 focus:tw-border-blue-800" />
      </div>

      {/* Số lượng + nút +/- */}
      <div className="tw-flex tw-items-center tw-gap-2">
        <label className="tw-block tw-font-medium tw-mb-1 tw-mr-8">Số lượng</label>
        <QuantityPicker
          value={formData.quantity}
          onChange={(value) => setFormData((prev) => ({ ...prev, quantity: value }))}
        />
      </div>

      {/* Đơn vị dropdown */}
      <Dropdown
        label="Đơn vị"
        value={formData.unit}
        options={unitOptions.map((o) => ({ value: o, label: o }))}
        onChange={(val) => setFormData((prev) => ({ ...prev, unit: val }))}
      />

      {/* Hạn sử dụng */}
      <div>
        <label className="tw-block tw-font-medium tw-mb-1 tw-ml-1">Hạn sử dụng</label>
        <input type="date" name="expiry" value={formData.expiry} onChange={handleChange} 
        className="tw-border tw-px-3 tw-py-2 tw-rounded-lg tw-w-full focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-blue-300 focus:tw-border-blue-800" />
      </div>

      {/* Nhà sản xuất dropdown */}
      <Dropdown
        label="Nhà sản xuất"
        value={formData.manufacturer}
        options={manufacturerOptions.map((o) => ({ value: o, label: o }))}
        onChange={(val) =>
          setFormData((prev) => ({ ...prev, manufacturer: val }))
        }
      />

      {/* Quốc gia dropdown */}
      <Dropdown
        label="Quốc gia"
        value={formData.country}
        options={countryOptions.map((o) => ({ value: o, label: o }))}
        onChange={(val) => setFormData((prev) => ({ ...prev, country: val }))}
      />

      {/* Số lô */}
      <div>
        <label className="tw-block tw-font-medium tw-mb-1 tw-ml-1">Số lô</label>
        <input type="text" name="batch" value={formData.batch} onChange={handleChange} placeholder="Số lô"
          className="tw-border tw-px-3 tw-py-2 tw-rounded-lg tw-w-full focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-blue-300 focus:tw-border-blue-800" />
      </div>

      {/* Giá (VNĐ) */}
      <div>
        <label className="tw-block tw-font-medium tw-mb-1 tw-ml-1">Giá (VNĐ)</label>
        <input type="text" name="price" value={formData.price} onChange={handleChange} placeholder="Giá"
          className="tw-border tw-px-3 tw-py-2 tw-rounded-lg tw-w-full focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-blue-300 focus:tw-border-blue-800" />
      </div>

      {/* Ghi chú */}
      <div>
        <label className="tw-block tw-font-medium tw-mb-1 tw-ml-1">Ghi chú</label>
        <input type="text" name="note" value={formData.note} onChange={handleChange} placeholder="Ghi chú"
          className="tw-border tw-px-3 tw-py-2 tw-rounded-lg tw-w-full focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-blue-300 focus:tw-border-blue-800" />
      </div>

      {/* Buttons */}
      <div className="tw-flex tw-justify-end tw-gap-2 tw-col-span-2">
        <button type="button" onClick={onCancel} className="tw-bg-red-600 tw-text-white tw-px-6 tw-py-2 tw-rounded-full">
          Hủy
        </button>
        <button type="submit" className="tw-bg-blue-600 tw-text-white tw-px-6 tw-py-2 tw-rounded-full">
          Lưu
        </button>
      </div>
    </form>
  );
}
