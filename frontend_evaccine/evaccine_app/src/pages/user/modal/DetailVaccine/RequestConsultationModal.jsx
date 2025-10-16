import React, { useState } from "react";

export default function RequestConsultationModal({ show, onClose }) {
    const [tiemCho, setTiemCho] = useState("toi");

    const [openDropdown, setOpenDropdown] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedVaccines, setSelectedVaccines] = useState([]);

    const vaccineOptions = [
        "Phòng Cúm",
        "Phế Cầu",
        "HPV",
        "Cúm mùa",
        "Viêm gan B",
        "Bạch hầu - Ho gà - Uốn ván",
    ];

    const handleToggleVaccine = (vaccine) => {
        if (selectedVaccines.includes(vaccine)) {
        setSelectedVaccines(selectedVaccines.filter((v) => v !== vaccine));
        } else {
        setSelectedVaccines([...selectedVaccines, vaccine]);
        }
    };

    const filteredVaccines = vaccineOptions.filter((v) =>
        v.toLowerCase().includes(searchTerm.toLowerCase())
    );


    if (!show) return null;

  return (
    <div className="tw-fixed tw-inset-0 tw-bg-black/40 tw-flex tw-items-center tw-justify-center z-50">
      <div className="tw-bg-white tw-rounded-xl tw-shadow-lg tw-w-[550px] tw-max-h-[80vh] tw-flex tw-flex-col tw-mt-[100px]">
        
        <div className="tw-relative tw-flex tw-items-center tw-justify-center tw-p-4 tw-border-b tw-shrink-0">
            <h2 className="tw-text-2xl tw-font-bold tw-mt-2">Yêu cầu tư vấn</h2>
            <button onClick={onClose}
                className="tw-absolute tw-right-4 tw-text-gray-500 hover:tw-bg-gray-200 hover:tw-text-red-600 tw-rounded-full tw-py-2 tw-px-4 tw-transition">
                <i className="fa-solid fa-xmark tw-text-2xl"></i>
            </button>
        </div>

        {/* Nội dung cuộn */}
        <div className="tw-flex-1 tw-overflow-y-auto tw-scrollbar-hide tw-px-6 tw-py-4">
            <div className="tw-flex tw-justify-center tw-my-4"> 
                <img src="/images/tuvan.jpg" alt="tư vấn" className="tw-h-[180px] tw-object-contain" />
            </div>
            <form className="tw-space-y-4">
                {/* Label căn trái */}
                <label className="tw-block tw-text-left tw-text-xl">
                Thông tin liên hệ
                </label>
                <input type="text" placeholder="Họ và tên"
                className="tw-w-full tw-border tw-rounded-lg tw-p-2  focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-blue-300 focus:tw-border-blue-800"/>
                <input type="tel" placeholder="Số điện thoại"
                className="tw-w-full tw-border tw-rounded-lg tw-p-2  focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-blue-300 focus:tw-border-blue-800"/>
                <input type="email" placeholder="Email (không bắt buộc)"
                className="tw-w-full tw-border tw-rounded-lg tw-p-2  focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-blue-300 focus:tw-border-blue-800"/>

                {/* Loại tiêm */}
                <div className="tw-flex tw-gap-2">
                    {/* Tiêm cho tôi */}
                    <button type="button"  onClick={() => setTiemCho("toi")}
                        className={`tw-relative tw-flex tw-items-center tw-justify-center tw-rounded-full 
                        tw-border tw-bg-white tw-px-6 tw-py-2 tw-font-medium tw-min-w-[120px] tw-overflow-hidden 
                        ${tiemCho === "toi" ? "tw-border-[#47b8fa] tw-text-gray-800" : "tw-border-gray-300 tw-text-gray-600"}`}
                        aria-pressed={tiemCho === "toi"} >
                        <p className="tw-mx-1 tw-text-gray-700">Tiêm cho tôi</p>

                        {/* Góc gập */}
                        {tiemCho === "toi" && (
                        <span className="tw-absolute tw-right-[-1px] tw-top-[-1px] tw-w-[23px] tw-h-[23px] tw-bg-[#47b8fa]"
                            style={{ clipPath: "polygon(100% 0px, 0px 0px, 100% 100%)" }} >
                            <i className="fa-solid fa-check tw-text-white tw-text-[10px] tw-absolute tw-right-[4px] tw-top-[4px]"></i>
                        </span>
                        )}
                    </button>

                    {/* Tiêm cho người thân */}
                    <button type="button" onClick={() => setTiemCho("nguoithan")}
                        className={`tw-relative tw-flex tw-items-center tw-justify-center tw-rounded-full 
                        tw-border tw-bg-white tw-px-6 tw-py-2 tw-font-medium tw-min-w-[120px] tw-overflow-hidden
                        ${tiemCho === "nguoithan" ? "tw-border-[#47b8fa] tw-text-gray-800" : "tw-border-gray-300 tw-text-gray-600"}`}
                        aria-pressed={tiemCho === "nguoithan"}>
                        <p className="tw-mx-1 tw-text-gray-700">Tiêm cho người thân</p>

                        {/* Góc gập */}
                        {tiemCho === "nguoithan" && (
                        <span className="tw-absolute tw-right-[-1px] tw-top-[-1px] tw-w-[23px] tw-h-[23px] tw-bg-[#47b8fa]"
                            style={{ clipPath: "polygon(100% 0px, 0px 0px, 100% 100%)" }} >
                            <i className="fa-solid fa-check tw-text-white tw-text-[10px] tw-absolute tw-right-[4px] tw-top-[4px]"></i>
                        </span>
                        )}
                    </button>
                </div>


                <label className="tw-block tw-text-left tw-text-xl">
                Thông tin người tiêm
                </label>
                <input type="text" placeholder="Tên người tiêm"
                className="tw-w-full tw-border tw-rounded-lg tw-p-2  focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-blue-300 focus:tw-border-blue-800"/>
                <div className="tw-w-full">
                    <label htmlFor="ngaySinh" className="tw-block tw-mb-1 tw-text-gray-700 tw-font-normal tw-text-left"> Ngày sinh</label>
                    <input id="ngaySinh" type="date"
                        className="tw-w-full tw-border tw-rounded-lg tw-p-2 focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-blue-300 focus:tw-border-blue-800" />
                </div>

               
                <div className="tw-space-y-2">
                <label className="tw-block tw-mb-1 tw-text-gray-700 tw-font-normal tw-text-left">  Vắc xin cần tư vấn (Không bắt buộc) </label>

                {/* Chip hiển thị vaccine đã chọn */}
                {selectedVaccines.length > 0 && (
                    <div className="tw-flex tw-flex-wrap tw-gap-2">
                    {selectedVaccines.map((v) => (
                        <div key={v} className="tw-flex tw-items-center tw-gap-1 tw-bg-cyan-50 tw-text-cyan-600 tw-px-3 tw-py-2 tw-rounded-lg tw-text-xl" >
                        {v}
                        <button  type="button"  onClick={() => handleToggleVaccine(v)} className="tw-text-gray-500 tw-text-xl hover:tw-text-red-500">
                            <i className="fa-solid fa-xmark tw-ml-2"></i>
                        </button>
                        </div>
                    ))}
                    </div>
                )}

                {/* Nút mở dropdown */}
                <div className="tw-text-left">
                    <button type="button" onClick={() => setOpenDropdown(!openDropdown)}
                    className="tw-inline-flex tw-items-center tw-bg-[#daf1fd] tw-text-blue-500 tw-rounded-full tw-px-4 tw-py-2 
                                tw-font-medium hover:tw-bg-[#0ba4fd] hover:tw-text-white " >
                    <i className="fa-solid fa-plus tw-mr-2"></i> Thêm vắc xin
                    </button>
                </div>

                {/* Dropdown */}
                {openDropdown && (
                    <div className="tw-mt-2 tw-border tw-rounded-lg tw-shadow-md tw-bg-white tw-p-3 tw-space-y-2">
                    {/* Ô tìm kiếm */}
                    <div className="tw-relative">
                        <input  type="text"  placeholder="Tìm kiếm vắc xin"
                        value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                        className="tw-w-full tw-border tw-rounded-lg tw-p-2 focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-blue-300 focus:tw-border-blue-800"
                        />
                        <i className="fa-solid fa-search tw-absolute tw-right-3 tw-top-3 tw-text-gray-400"></i>
                    </div>

                    {/* Danh sách vaccine */}
                    <div className="tw-max-h-48 tw-overflow-y-auto tw-scrollbar-hide tw-space-y-1">
                        {filteredVaccines.map((v) => (
                            <label key={v} className="tw-flex tw-items-center tw-gap-4 tw-cursor-pointer hover:tw-bg-gray-50 tw-px-2 tw-py-1 tw-rounded" >
                                <input type="checkbox" checked={selectedVaccines.includes(v)}
                                onChange={() => handleToggleVaccine(v)} className="tw-form-checkbox tw-cursor-pointer tw-text-cyan-600 tw-transform tw-scale-125 " />
                                {v}
                            </label>
                        ))}
                        {filteredVaccines.length === 0 && (
                            <p className="tw-text-red-500 tw-text-xl tw-italic">Không tìm thấy</p>
                        )}
                    </div>
                    </div>
                )}
                </div>
                
                <textarea placeholder="Ghi chú bệnh nền (không bắt buộc)"
                className="tw-w-full tw-border tw-rounded-lg tw-p-2  focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-blue-300 focus:tw-border-blue-800"/>
            </form>
        </div>

        <div className="tw-px-6 tw-py-4 tw-border-t tw-shrink-0">
          <button type="submit"
            className="tw-w-full tw-bg-gradient-to-r tw-from-[#0ba4fd] tw-to-[#b0f1fb] tw-text-white tw-font-semibold tw-py-3 tw-rounded-full 
                    hover:tw-from-[#b0f1fb] hover:tw-to-[#0ba4fd]">
            Gửi yêu cầu
          </button>
        </div>
      </div>
    </div>
  );
}
