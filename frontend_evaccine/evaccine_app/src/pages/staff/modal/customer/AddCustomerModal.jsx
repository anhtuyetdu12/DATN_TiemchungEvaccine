// src/pages/staff/modal/AddCustomerModal.jsx
import { useState } from "react";


export default function AddCustomerModal({ show, onClose, onAdd, nextId }) {
  const [form, setForm] = useState({
    name: "",
    dob: "",
    phone: "",
    email: "",
    idNumber: "",
    address: "",
    country: "Việt Nam",
    category: "Người lớn",
    gender: "Nam",        
    relationship: "Khác", 
    doses: 0,
  });

  const genderOptions = [
    { label: "Nam", icon: "fa-solid fa-mars", color: "tw-text-teal-500" },
    { label: "Nữ", icon: "fa-solid fa-venus", color: "tw-text-pink-500" },
    { label: "Khác", icon: "fa-solid fa-venus-mars", color: "tw-text-orange-500" },
  ];

 
  const [error, setError] = useState("");

  if (!show) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const validate = () => {
    if (!form.name.trim()) return "Vui lòng nhập họ tên";
    if (!form.phone.trim()) return "Vui lòng nhập số điện thoại";
    if (form.email && !/\S+@\S+\.\S+/.test(form.email)) return "Email không hợp lệ";
    if (form.dob && new Date(form.dob) > new Date()) return "Ngày sinh không hợp lệ";
    return "";
  };



  const handleSubmit = (e) => {
    e.preventDefault();
    const err = validate();
    if (err) {
      setError(err);
      return;
    }
    const newCustomer = {
      id: nextId,
      code: `KH-${String(nextId).padStart(4, "0")}`,
      ...form,
      status: "active",
      appointments: [],
      history: [],
    };
    onAdd(newCustomer);
    onClose();
  };

  return (
    <div className="tw-fixed tw-inset-0 tw-bg-black/40 tw-flex tw-items-center tw-justify-center tw-z-50">
      <div className="tw-bg-white tw-rounded-xl tw-shadow-lg tw-w-[700px] tw-p-6 tw-mt-[100px]">
        <h2 className="tw-text-3xl tw-font-bold tw-mb-4 tw-text-blue-500">
            <i className ="fa-solid fa-address-book tw-mr-3"></i> 
            Thêm khách hàng mới
        </h2>
        {error && <div className="tw-bg-red-100 tw-text-red-600 tw-px-3 tw-py-2 tw-rounded mb-3">{error}</div>}
        <form onSubmit={handleSubmit} className="tw-grid tw-grid-cols-2 tw-gap-x-4 tw-gap-y-2  tw-text-left">
          <div>
            <label className="tw-text-xl tw-font-medium">Họ tên <i className="fa-solid fa-star-of-life tw-ml-2 tw-text-[7px]  tw-text-red-600"></i></label>
            <input name="name" type="text"
              className="tw-w-full tw-border tw-rounded-lg tw-px-3 tw-py-2 focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-blue-300 focus:tw-border-blue-800"
              value={form.name}  onChange={handleChange} />
          </div>
          <div>
            <label className="tw-text-xl tw-font-medium">Ngày sinh</label>
            <input name="dob" type="date" max={new Date().toISOString().split("T")[0]} 
              className="tw-w-full tw-border tw-rounded-lg tw-px-3 tw-py-2 focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-blue-300 focus:tw-border-blue-800"
              value={form.dob}  onChange={handleChange}  />
          </div>
          <div>
            <label className="tw-text-xl tw-font-medium">Số điện thoại <i className="fa-solid fa-star-of-life tw-ml-2 tw-text-[7px]  tw-text-red-600"></i></label>
            <input name="phone" type="text"
              className="tw-w-full tw-border tw-rounded-lg tw-px-3 tw-py-2 focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-blue-300 focus:tw-border-blue-800"
              value={form.phone}  onChange={handleChange} />
          </div>
          <div>
            <label className="tw-text-xl tw-font-medium">Email</label>
            <input name="email" type="email"
              className="tw-w-full tw-border tw-rounded-lg tw-px-3 tw-py-2 focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-blue-300 focus:tw-border-blue-800"
              value={form.email} onChange={handleChange} />
          </div>
          
          <div>
                <label className="tw-text-xl tw-font-medium">Giới tính</label>
                <div className="tw-grid tw-grid-cols-3 tw-gap-3 mt-2">
                    {genderOptions.map((opt) => (
                    <button key={opt.label} type="button"
                        onClick={() => setForm((prev) => ({ ...prev, gender: opt.label }))}
                        className={`tw-flex tw-items-center tw-justify-center tw-gap-2 tw-px-3 tw-py-2 
                        tw-rounded-lg tw-border tw-transition 
                        ${form.gender === opt.label 
                            ? "tw-border-cyan-500 tw-bg-cyan-50" 
                            : "tw-border-gray-300 tw-bg-white"}`}  >
                        <i className={`${opt.icon} ${opt.color}`}></i>
                        <span>{opt.label}</span>
                    </button>
                    ))}
                </div>
            </div>
          <div>
            <label className="tw-text-xl tw-font-medium">Địa chỉ</label>
            <input name="address" type="text"
              className="tw-w-full tw-border tw-rounded-lg tw-px-3 tw-py-2 focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-blue-300 focus:tw-border-blue-800"
              value={form.address} onChange={handleChange} />
          </div>

          {/* Nút hành động */}
          <div className="tw-col-span-2 tw-flex tw-justify-end tw-gap-3 tw-mt-4">
            <button  type="button" onClick={onClose}
              className="tw-bg-red-600 tw-text-white tw-px-4 tw-py-2 tw-rounded-lg hover:tw-bg-red-500" >
              Hủy
            </button>
            <button type="submit"
              className="tw-bg-blue-600 tw-text-white tw-px-4 tw-py-2 tw-rounded-lg hover:tw-bg-blue-500" >
              Lưu
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
