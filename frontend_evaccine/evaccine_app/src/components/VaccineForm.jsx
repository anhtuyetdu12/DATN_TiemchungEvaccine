import React, { useState, useEffect } from "react";

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

  const [openType, setOpenType] = useState(false);
  const [openCountry, setOpenCountry] = useState(false);
  const [openManufacturer, setOpenManufacturer] = useState(false);
  const [openUnit, setOpenUnit] = useState(false);

  useEffect(() => {
    if (vaccine) setFormData(vaccine);
    else
      setFormData({
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
    <form onSubmit={handleSubmit} className="tw-grid tw-grid-cols-2 tw-gap-3 tw-text-left">
      {/* Tên */}
      <div>
        <label className="tw-block tw-font-medium tw-mb-1 tw-ml-1">Tên</label>
        <input type="text" name="name" value={formData.name} onChange={handleChange} placeholder="Tên vắc xin"
          className="tw-border tw-px-3 tw-py-2 tw-rounded tw-w-full focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-blue-300 focus:tw-border-blue-800" />
      </div>

      {/* Loại dropdown */}
      <div className="tw-relative">
        <label className="tw-block tw-font-medium tw-mb-1 tw-ml-1">Loại</label>
        <button type="button" onClick={() => setOpenType(!openType)}
          className="tw-w-full tw-flex tw-justify-between tw-items-center tw-border tw-px-3 tw-py-2 tw-rounded
           focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-blue-300 focus:tw-border-blue-800">
          {formData.type || "Chọn loại"}
          <i className={`fa-solid ${openType ? "fa-angle-up" : "fa-angle-down"}`}></i>
        </button>
        {openType && (
          <div className="tw-absolute tw-top-full tw-w-full tw-bg-white tw-border tw-rounded tw-z-10">
            {typeOptions.map((item) => (
              <div key={item} onClick={() => { setFormData(prev => ({ ...prev, type: item })); setOpenType(false); }}
                className="tw-px-3 tw-py-2 hover:tw-bg-blue-100 tw-cursor-pointer">
                {item}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Mã */}
      <div>
        <label className="tw-block tw-font-medium tw-mb-1 tw-ml-1">Mã</label>
        <input type="text" name="code" value={formData.code} onChange={handleChange} placeholder="Mã"
          className="tw-border tw-px-3 tw-py-2 tw-rounded tw-w-full focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-blue-300 focus:tw-border-blue-800" />
      </div>

      {/* Số lượng + nút +/- */}
      <div className="tw-flex tw-items-center tw-gap-2">
        <label className="tw-block tw-font-medium tw-mb-1 tw-ml-1">Số lượng</label>
        {/* <button type="button" onClick={() => setFormData(prev => ({ ...prev, quantity: prev.quantity - 1 }))}>
            <i class="fa-solid fa-minus"></i>
        </button>
        <input type="number" name="quantity" value={formData.quantity} onChange={handleChange}
          className="tw-border tw-px-3 tw-py-2 tw-rounded tw-w-1/2 focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-blue-300 focus:tw-border-blue-800" />
        <button type="button" onClick={() => setFormData(prev => ({ ...prev, quantity: prev.quantity + 1 }))}>
            <i class="fa-solid fa-plus"></i>
        </button> */}
        <div className="tw-flex tw-items-center tw-gap-2">
            {/* Nút trừ */}
            <button type="button"  onClick={() => setFormData((prev) => ({ ...prev, quantity: Math.max(prev.quantity - 1, 0) })) }
                className="tw-bg-gray-200 hover:tw-bg-gray-300 tw-text-gray-800 tw-px-4 tw-py-2 tw-rounded-lg tw-border tw-border-gray-300">
                <i className="fa-solid fa-minus"></i>
            </button>

            {/* Input số lượng */}
            <input  type="text"  name="quantity" value={formData.quantity} onChange={handleChange}
                className="tw-border tw-border-gray-300 tw-px-3 tw-py-2 tw-w-24 tw-text-center focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-blue-300 focus:tw-border-blue-800" />

            {/* Nút cộng */}
            <button type="button" onClick={() =>  setFormData((prev) => ({ ...prev, quantity: prev.quantity + 1 })) }
                className="tw-bg-gray-200 hover:tw-bg-gray-300 tw-text-gray-800 tw-px-4 tw-py-2 tw-rounded-lg tw-border tw-border-gray-300" >
                <i className="fa-solid fa-plus"></i>
            </button>
          </div>
      </div>

      {/* Đơn vị dropdown */}
      <div className="tw-relative">
        <label className="tw-block tw-font-medium tw-mb-1 tw-ml-1">Đơn vị</label>
        <button type="button" onClick={() => setOpenUnit(!openUnit)}
          className="tw-w-full tw-flex tw-justify-between tw-items-center tw-border tw-px-3 tw-py-2 tw-rounded
           focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-blue-300 focus:tw-border-blue-800">
          {formData.unit || "Chọn đơn vị"}
          <i className={`fa-solid ${openUnit ? "fa-angle-up" : "fa-angle-down"}`}></i>
        </button>
        {openUnit && (
          <div className="tw-absolute tw-top-full tw-w-full tw-bg-white tw-border tw-rounded tw-z-10">
            {unitOptions.map((item) => (
              <div key={item} onClick={() => { setFormData(prev => ({ ...prev, unit: item })); setOpenUnit(false); }}
                className="tw-px-3 tw-py-2 hover:tw-bg-blue-100 tw-cursor-pointer">
                {item}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Hạn sử dụng */}
      <div>
        <label className="tw-block tw-font-medium tw-mb-1 tw-ml-1">Hạn sử dụng</label>
        <input type="date" name="expiry" value={formData.expiry} onChange={handleChange} 
        className="tw-border tw-px-3 tw-py-2 tw-rounded tw-w-full focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-blue-300 focus:tw-border-blue-800" />
      </div>

      {/* Nhà sản xuất dropdown */}
      <div className="tw-relative">
        <label className="tw-block tw-font-medium tw-mb-1 tw-ml-1">Nhà sản xuất</label>
        <button type="button" onClick={() => setOpenManufacturer(!openManufacturer)}
          className="tw-w-full tw-flex tw-justify-between tw-items-center tw-border tw-px-3 tw-py-2 tw-rounded
           focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-blue-300 focus:tw-border-blue-800">
          {formData.manufacturer || "Chọn nhà sản xuất"}
          <i className={`fa-solid ${openManufacturer ? "fa-angle-up" : "fa-angle-down"}`}></i>
        </button>
        {openManufacturer && (
          <div className="tw-absolute tw-top-full tw-w-full tw-bg-white tw-border tw-rounded tw-z-10">
            {manufacturerOptions.map((item) => (
              <div key={item} onClick={() => { setFormData(prev => ({ ...prev, manufacturer: item })); setOpenManufacturer(false); }}
                className="tw-px-3 tw-py-2 hover:tw-bg-blue-100 tw-cursor-pointer">
                {item}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quốc gia dropdown */}
      <div className="tw-relative">
        <label className="tw-block tw-font-medium tw-mb-1 tw-ml-1">Quốc gia</label>
        <button type="button" onClick={() => setOpenCountry(!openCountry)}
          className="tw-w-full tw-flex tw-justify-between tw-items-center tw-border tw-px-3 tw-py-2 tw-rounded
           focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-blue-300 focus:tw-border-blue-800">
          {formData.country || "Chọn quốc gia"}
          <i className={`fa-solid ${openCountry ? "fa-angle-up" : "fa-angle-down"}`}></i>
        </button>
        {openCountry && (
          <div className="tw-absolute tw-top-full tw-w-full tw-bg-white tw-border tw-rounded tw-z-10">
            {countryOptions.map((item) => (
              <div key={item} onClick={() => { setFormData(prev => ({ ...prev, country: item })); setOpenCountry(false); }}
                className="tw-px-3 tw-py-2 hover:tw-bg-blue-100 tw-cursor-pointer">
                {item}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Số lô */}
      <div>
        <label className="tw-block tw-font-medium tw-mb-1 tw-ml-1">Số lô</label>
        <input type="text" name="batch" value={formData.batch} onChange={handleChange} placeholder="Số lô"
          className="tw-border tw-px-3 tw-py-2 tw-rounded tw-w-full focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-blue-300 focus:tw-border-blue-800" />
      </div>

      {/* Giá (VNĐ) */}
      <div>
        <label className="tw-block tw-font-medium tw-mb-1 tw-ml-1">Giá (VNĐ)</label>
        <input type="number" name="price" value={formData.price} onChange={handleChange} placeholder="Giá"
          className="tw-border tw-px-3 tw-py-2 tw-rounded tw-w-full focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-blue-300 focus:tw-border-blue-800" />
      </div>

      {/* Ghi chú */}
      <div>
        <label className="tw-block tw-font-medium tw-mb-1 tw-ml-1">Ghi chú</label>
        <input type="text" name="note" value={formData.note} onChange={handleChange} placeholder="Ghi chú"
          className="tw-border tw-px-3 tw-py-2 tw-rounded tw-w-full focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-blue-300 focus:tw-border-blue-800" />
      </div>

      {/* Buttons */}
      <div className="tw-flex tw-justify-end tw-gap-2 tw-col-span-2">
        <button type="button" onClick={onCancel} className="tw-bg-red-600 tw-text-white tw-px-4 tw-py-2 tw-rounded">
          Hủy
        </button>
        <button type="submit" className="tw-bg-blue-600 tw-text-white tw-px-4 tw-py-2 tw-rounded">
          Lưu
        </button>
      </div>
    </form>
  );
}
