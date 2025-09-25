import { useState, useEffect } from "react";

export default function AddUserForm({ onSave, onClose }) {
  const [nickname, setNickname] = useState("");
  const [fullname, setFullname] = useState("");
  // relationship mặc định là "Khác"
  const [relationship, setRelationship] = useState("Khác");
  const [gender, setGender] = useState("Nam");
  const [dob, setDob] = useState("");
  const [phone, setPhone] = useState("");

  // lấy ngày hôm nay theo local (YYYY-MM-DD)
  const [today, setToday] = useState("");
  useEffect(() => {
    const t = new Date();
    const yyyy = t.getFullYear();
    const mm = String(t.getMonth() + 1).padStart(2, "0");
    const dd = String(t.getDate()).padStart(2, "0");
    setToday(`${yyyy}-${mm}-${dd}`);
  }, []);

  const handleSubmit = () => {
    if (!fullname.trim() || !dob.trim()) {
      alert("Vui lòng nhập Họ & tên và Ngày sinh");
      return;
    }
    onSave({ nickname, fullname, relationship, gender, dob, phone });
    onClose();
  };

  const options = [
    { label: "Nam", icon: "fa-solid fa-mars", color: "tw-text-teal-500" },
    { label: "Nữ", icon: "fa-solid fa-venus", color: "tw-text-pink-500" },
    { label: "Khác", icon: "fa-solid fa-venus-mars", color: "tw-text-orange-500" },
  ];

  // danh sách mối quan hệ
  const relationships = [
    "Vợ",
    "Chồng",
    "Con trai",
    "Con gái",
    "Bố",
    "Mẹ",
    "Ông ngoại",
    "Bà ngoại",
    "Ông nội",
    "Bà nội",
    "Bạn bè",
    "Khác"
  ];

  const [openRelationship, setOpenRelationship] = useState(false);
  const toggleRelationship = () => setOpenRelationship(!openRelationship);
  const handleSelectRelationship = (value) => {
    setRelationship(value);
    setOpenRelationship(false);
  };

  return (
    <div className="tw-fixed tw-inset-0 tw-bg-black/40 tw-flex tw-items-center tw-justify-center tw-mt-[100px]">
      <div className="tw-bg-white tw-rounded-2xl tw-w-[400px] tw-p-6 tw-space-y-3">
        <h2 className="tw-text-[20px] tw-text-[#1999ee] tw-font-bold tw-mb-2">Thêm thành viên</h2>

        <input
          className="tw-w-full tw-border tw-rounded-lg tw-px-3 tw-py-2 tw-text-gray-700 
            hover:tw-border-[#56b6f7] hover:tw-ring-1 hover:tw-ring-[#56b6f7]
            focus:tw-outline-none focus:tw-border-[#1999ee] focus:tw-ring-2 focus:tw-ring-[#1999ee]/40"
          placeholder="Tên thân mật"
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
        />

        <input
          className="tw-w-full tw-border tw-rounded-lg tw-px-3 tw-py-2 tw-text-gray-700 
            hover:tw-border-[#56b6f7] hover:tw-ring-1 hover:tw-ring-[#56b6f7]
            focus:tw-outline-none focus:tw-border-[#1999ee] focus:tw-ring-2 focus:tw-ring-[#1999ee]/40"
          placeholder="Họ & tên *"
          value={fullname}
          onChange={(e) => setFullname(e.target.value)}
        />

        {/* Dropdown chọn mối quan hệ */}
        <div className="tw-relative">
          <button
            type="button"
            onClick={toggleRelationship}
            className="tw-w-full tw-flex tw-justify-between tw-items-center 
              tw-border tw-border-gray-300 tw-rounded-lg tw-px-3 tw-py-2 tw-text-gray-700 
              hover:tw-border-[#56b6f7] hover:tw-ring-1 hover:tw-ring-[#56b6f7]
              focus:tw-outline-none focus:tw-border-[#1999ee] focus:tw-ring-2 focus:tw-ring-[#1999ee]/40"
          >
            <span>{relationship || "Mối quan hệ"}</span>
            <i className={`fa-solid ${openRelationship ? "fa-angle-up" : "fa-angle-down"}`}></i>
          </button>

          {openRelationship && (
            <div
                className="tw-absolute tw-top-full tw-mt-2 tw-left-1/2 -tw-translate-x-1/2 
                tw-w-[95%] tw-bg-white tw-z-10 tw-text-xl tw-space-y-0.5
                tw-border tw-border-gray-300 tw-rounded-lg tw-shadow-lg tw-py-2 
                tw-max-h-48 tw-overflow-y-auto tw-scrollbar-hide" >
                {relationships.map((item, i) => (
                <div
                    key={i}
                    onClick={() => handleSelectRelationship(item)}
                    className={`tw-flex tw-items-center tw-justify-between tw-px-3 tw-py-2 tw-cursor-pointer 
                    ${relationship === item ? "tw-bg-[#e6f7fa]" : "hover:tw-bg-[#e6f7fa]"}`} >
                    <span>{item}</span>
                    {relationship === item && (
                    <i className="fa-solid fa-check tw-text-[#1999ee]"></i>
                    )}
                </div>
                ))}
            </div>
            )}
        </div>

        {/* Giới tính */}
        <div className="tw-w-full ">
          <p className="tw-mb-2 tw-text-2xl tw-text-gray-700 tw-text-left tw-px-3">Giới tính</p>
          <div className="tw-grid tw-grid-cols-3 tw-gap-3">
            {options.map((opt) => (
              <button
                key={opt.label}
                type="button"
                onClick={() => setGender(opt.label)}
                className={`tw-flex tw-items-center tw-justify-center tw-gap-2 tw-px-4 tw-py-2 tw-rounded-full tw-border tw-w-full tw-text-2xl
                  ${
                    gender === opt.label
                      ? "tw-border-[#17bef0] tw-bg-[#e7feff]"
                      : "tw-border-gray-300 tw-bg-white"
                  }`}
              >
                <i className={`${opt.icon} ${opt.color}`}></i>
                <span className="tw-text-xl">{opt.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Input ngày sinh */}
        <input
          type="date"
          max={today}
          className="tw-w-full tw-border tw-rounded-lg tw-px-3 tw-py-2 tw-text-gray-700 
            hover:tw-border-[#56b6f7] hover:tw-ring-1 hover:tw-ring-[#56b6f7]
            focus:tw-outline-none focus:tw-border-[#1999ee] focus:tw-ring-2 focus:tw-ring-[#1999ee]/40"
          value={dob}
          onChange={(e) => setDob(e.target.value)}
        />

        <input
          className="tw-w-full tw-border tw-rounded-lg tw-px-3 tw-py-2 tw-text-gray-700 
            hover:tw-border-[#56b6f7] hover:tw-ring-1 hover:tw-ring-[#56b6f7]
            focus:tw-outline-none focus:tw-border-[#1999ee] focus:tw-ring-2 focus:tw-ring-[#1999ee]/40"
          placeholder="Số điện thoại (Không bắt buộc)"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />

        <div className="tw-flex tw-justify-end tw-gap-3 tw-pt-2">
          <button
            className="tw-px-4 tw-py-2 tw-rounded-lg tw-bg-gray-200 hover:tw-bg-red-600 hover:tw-text-white"
            onClick={onClose}
          >
            Hủy
          </button>
          <button
            className="tw-px-4 tw-py-2 tw-rounded-lg tw-bg-[#1999ee] tw-text-white hover:tw-bg-[#68bdf7] 
              hover:tw-shadow-lg  hover:tw-scale-105  tw-transition-all tw-duration-300"
            onClick={handleSubmit}
          >
            Xác nhận
          </button>
        </div>
      </div>
    </div>
  );
}
