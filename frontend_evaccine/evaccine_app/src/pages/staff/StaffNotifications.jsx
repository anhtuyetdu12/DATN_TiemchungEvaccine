import { Bell, Mail, Smartphone } from "lucide-react";
import { useState } from "react";

export default function StaffSendNotification() {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState("");

  const options = [
    { value: "", label: "-- Chọn khách hàng --" },
    { value: "all", label: "Tất cả khách hàng" },
    { value: "upcoming", label: "Khách có lịch tiêm sắp tới" },
    { value: "custom", label: "Chọn danh sách cụ thể" },
  ];

  const selectedLabel =
    options.find((o) => o.value === selected)?.label ||
    "-- Chọn khách hàng --";
  
  const [selectedbtn, setSelectedbtn] = useState({
    email: false,
    app: false,
    sms: false,
  });

  const toggle = (key) =>
    setSelectedbtn((prev) => ({ ...prev, [key]: !prev[key] }));

  return (
    <div className="tw-mt-[100px] tw-flex tw-justify-center tw-items-start tw-w-full tw-py-[50px] 
                  tw-bg-gradient-to-r tw-from-green-200 tw-to-orange-300">
      <div className="tw-w-full md:tw-w-3/4 lg:tw-w-2/3 xl:tw-w-1/2">
        {/* Header */}
        <div className="tw-flex tw-items-center tw-space-x-3 tw-mb-16 tw-justify-center">
          <i class="fa-regular fa-bell  tw-text-6xl tw-mr-3 tw-bg-gradient-to-r tw-from-[#8323e2] tw-to-pink-500 
                      tw-bg-clip-text tw-text-transparent"></i>
          <h1 className="tw-text-[30px] tw-font-bold tw-bg-gradient-to-r tw-from-[#8323e2] tw-to-pink-500
                          tw-bg-clip-text tw-text-transparent tw-pb-2">
            Gửi thông báo cho khách hàng
          </h1>
        </div>

        {/* Card */}
        <div className="tw-bg-white tw-rounded-2xl tw-shadow-lg tw-p-8 tw-space-y-6 tw-justify-center tw-items-center">
          <div className="tw-space-y-1">
            <label className="tw-block tw-text-2xl tw-text-left tw-mb-4 tw-font-semibold tw-text-gray-700">
              Chọn khách hàng / nhóm khách hàng
            </label>

            <div className="tw-relative">
              <button  type="button" onClick={() => setOpen(!open)}
                className="tw-w-full tw-flex tw-justify-between tw-items-center 
                            tw-border tw-border-gray-300 tw-rounded-lg tw-px-3 tw-py-2 tw-text-gray-700 
                            hover:tw-border-[#56b6f7] hover:tw-ring-1 hover:tw-ring-[#56b6f7]
                            focus:tw-outline-none focus:tw-border-[#1999ee] focus:tw-ring-2 focus:tw-ring-[#1999ee]/40" >
                <span>{selectedLabel}</span>
                <i className={`fa-solid ${ open ? "fa-angle-up" : "fa-angle-down" }`}></i>
              </button>

              {open && (
                <div className="tw-absolute tw-top-full tw-mt-2 tw-left-1/2 -tw-translate-x-1/2
                                tw-w-[95%] tw-bg-white tw-z-10 tw-text-xl tw-space-y-0.5
                                tw-border tw-border-gray-300 tw-rounded-lg tw-shadow-lg tw-py-2">
                  {options.map((item, i) => (
                    <div key={i} onClick={() => {
                        setSelected(item.value);
                        setOpen(false);
                      }}
                      className={`tw-flex tw-items-center tw-justify-between tw-px-3 tw-py-2 tw-cursor-pointer 
                      ${ selected === item.value
                          ? "tw-bg-[#e6f7fa]"
                          : "hover:tw-bg-[#e6f7fa]"
                      }`}>
                      <span>{item.label}</span>
                      {selected === item.value && (
                        <i className="fa-solid fa-check tw-text-[#1999ee]"></i>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="tw-space-y-1">
            <label className="tw-block tw-text-2xl tw-text-left tw-mb-4 tw-font-semibold tw-text-gray-700">
              Tiêu đề thông báo
            </label>
            <input type="text" placeholder="Ví dụ: Nhắc lịch tiêm vắc xin Viêm gan B"
              className="tw-w-full tw-border tw-rounded-xl tw-px-3 tw-py-2 focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-blue-300 focus:tw-border-blue-800" />
          </div>

          <div className="tw-space-y-1">
            <label className="tw-block tw-text-2xl tw-text-left tw-mb-4 tw-font-semibold tw-text-gray-700">
              Nội dung thông báo
            </label>
            <textarea rows="5" placeholder="Nhập nội dung thông báo chi tiết..."
              className="tw-w-full tw-border tw-rounded-xl tw-px-3 tw-py-2 
              focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-blue-300 focus:tw-border-blue-800" >
            </textarea>
          </div>

          {/* Kênh gửi */}
          <div className="tw-flex tw-flex-wrap tw-gap-6">
            {/* Email */}
            <button  type="button" role="checkbox" aria-checked={selectedbtn.email}
                  onClick={() => toggle("email")}
                  className={`tw-flex tw-items-center tw-space-x-2 tw-rounded-lg tw-px-3 tw-py-2   tw-transition-colors tw-duration-150 
                  ${selectedbtn.email ? "tw-bg-blue-50 tw-border tw-border-blue-500" : "tw-bg-gray-50 hover:tw-bg-gray-100 tw-border tw-border-gray-200"}`} >
              <span className={`tw-w-8 tw-h-8 tw-flex tw-items-center tw-justify-center tw-rounded tw-border 
                  ${selectedbtn.email ? "tw-bg-blue-500 tw-border-blue-500" : "tw-border-gray-400"}`} >
                  {selectedbtn.email && ( <i className="fa-solid fa-check tw-text-white tw-text-xl"></i> )}
              </span>
              <Mail className="tw-w-8 tw-h-8 tw-text-blue-500" />
              <span>Email</span>
            </button>

            {/* App/Web */}
            <button type="button" role="checkbox" aria-checked={selectedbtn.app} onClick={() => toggle("app")}
                className={`tw-flex tw-items-center tw-space-x-2 tw-rounded-lg tw-px-3 tw-py-2 
                  tw-transition-colors tw-duration-150 
                ${selectedbtn.app ? "tw-bg-green-50 tw-border tw-border-green-500" : "tw-bg-gray-50 hover:tw-bg-gray-100 tw-border tw-border-gray-200"}`} >
              <span  className={`tw-w-8 tw-h-8 tw-flex tw-items-center tw-justify-center tw-rounded tw-border 
                  ${selectedbtn.app ? "tw-bg-green-500 tw-border-green-500" : "tw-border-gray-400"}`} >
                  {selectedbtn.app && (
                    <i className="fa-solid fa-check tw-text-white tw-text-xl"></i>
                  )}
              </span>
              <Bell className="tw-w-8 tw-h-8 tw-text-green-500" />
              <span>App / Web</span>
            </button>

            {/* SMS */}
            <button type="button" role="checkbox" aria-checked={selectedbtn.sms} onClick={() => toggle("sms")}
                className={`tw-flex tw-items-center tw-space-x-2 tw-rounded-lg tw-px-3 tw-py-2 
                tw-transition-colors tw-duration-150 
                ${selectedbtn.sms ? "tw-bg-yellow-50 tw-border tw-border-yellow-500" : "tw-bg-gray-50 hover:tw-bg-gray-100 tw-border tw-border-gray-200"}`} >
              <span  className={`tw-w-8 tw-h-8 tw-flex tw-items-center tw-justify-center tw-rounded tw-border 
                  ${selectedbtn.sms ? "tw-bg-yellow-500 tw-border-yellow-500" : "tw-border-gray-400"}`} >
                {selectedbtn.sms && ( <i className="fa-solid fa-check tw-text-white tw-text-xl"></i> )}
              </span>
              <Smartphone className="tw-w-8 tw-h-8 tw-text-yellow-500" />
              <span>SMS</span>
            </button>
          </div>

          {/* gửi/ hủy  */}
          <div className="tw-flex tw-gap-4 tw-pt-4">
            <button type="submit"
              className="tw-flex-1 tw-bg-green-600 tw-text-white tw-font-semibold tw-rounded-xl tw-px-6 tw-py-3 hover:tw-bg-green-500 focus:tw-ring-2 focus:tw-ring-green-400" >
              Gửi ngay
            </button>
            <button type="button"
              className="tw-flex-1 tw-border tw-bg-red-600 tw-text-white tw-font-semibold tw-rounded-xl tw-px-6 tw-py-3 hover:tw-bg-red-500 focus:tw-ring-2 focus:tw-ring-red-300" >
              Hủy
            </button>
          </div>
        </div>

      </div>
    </div>
   
  );
}
