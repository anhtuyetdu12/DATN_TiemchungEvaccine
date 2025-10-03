// cập nhật mũi tiêm 
import { useState, useEffect  } from "react";

export default function UpdateDose({ disease, onClose, onSave }) {
   const [doses, setDoses] = useState([]);

  useEffect(() => {
    setDoses([
      { id: 1, date: "", vaccine: "", location: "", open: true },
    ]); //set trạng thái ban đầu
  }, [disease]);


  // Lấy ngày hôm nay theo local (YYYY-MM-DD)
  const [today, setToday] = useState("");

  useEffect(() => {
    const t = new Date();
    const yyyy = t.getFullYear();
    const mm = String(t.getMonth() + 1).padStart(2, "0");
    const dd = String(t.getDate()).padStart(2, "0");
    setToday(`${yyyy}-${mm}-${dd}`);
  }, []);

  const handleDoseChange = (index, field, value) => {
    const newDoses = [...doses];

    // Nếu là field date, chặn ngày lớn hơn today (nếu today đã có)
    if (field === "date" && today) {
      if (value > today) {
        value = today;
      }
    }

    newDoses[index][field] = value;
    setDoses(newDoses);
  };

  // thêm mũi 
  const handleAddDose = () => {
    if (doses.length >= (disease?.maxDoses || 1)) {
      alert(`Chỉ được thêm tối đa ${disease?.maxDoses} mũi tiêm`);
      return;
    }
    setDoses([
      ...doses,
      { id: doses.length + 1, date: "", vaccine: "", location: "", open: true },
    ]);
  };

  const handleRemoveDose = (index) => {
    const newDoses = doses.filter((_, i) => i !== index);
    setDoses(newDoses);
  };

  const toggleOpen = (index) => {
    const newDoses = [...doses];
    newDoses[index].open = !newDoses[index].open;
    setDoses(newDoses);
  };

  const handleConfirm = () => {
    console.log("Dữ liệu cập nhật:", doses);
    if (onSave) {
      onSave(disease.id, doses);
    }
    onClose();
  };
  // dropdown chọn vacxin
  const [openIndex, setOpenIndex] = useState(null);

  const toggleDropdown = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  const handleSelectVaccine = (index, value) => {
    const newDoses = [...doses];
    newDoses[index].vaccine = value;
    setDoses(newDoses);
    setOpenIndex(null);
  };

  return (
    <div className="tw-fixed tw-inset-0 tw-bg-black/50 tw-flex tw-items-center tw-justify-center tw-z-50 tw-mt-[100px]">
      <div className="tw-bg-white tw-rounded-2xl tw-w-full md:tw-w-[600px] tw-min-h-[400px] tw-max-h-[80vh] tw-flex tw-flex-col">
        {/* Header */}
        <div className="tw-flex tw-items-center tw-justify-between tw-p-4 tw-border-b">
          <h2 className="tw-text-[20px] tw-font-bold">Cập nhật mũi đã tiêm</h2>
          <button
            onClick={onClose}
            className="tw-text-red-600 hover:tw-text-red-400"
          >
            <i className="fa-solid fa-delete-left tw-text-3xl"></i>
          </button>
        </div>

        {/* Thông tin bệnh */}
        <div className="tw-px-4 tw-py-2 tw-border-b">
          <p className="tw-font-semibold tw-text-2xl">{disease?.name}</p>
          <p className="tw-text-gray-600 tw-text-base">
            {disease?.description || "Không có mô tả"}
          </p>
        </div>

        {/* Danh sách mũi */}
        <div className="tw-flex-1 tw-overflow-y-auto tw-px-4 tw-py-2 tw-bg-gray-100">
          {doses.map((dose, index) => (
            <div key={index} className="tw-border tw-rounded-xl tw-mb-4 tw-bg-white">
              {/* Header của mũi */}
              <div className="tw-flex tw-items-center tw-justify-between tw-p-6 tw-cursor-pointer"
                   onClick={() => toggleOpen(index)}>
                <div className="tw-flex tw-items-center tw-gap-2">
                  {dose.open ? ( <i className="fa-solid fa-angle-up tw-text-lg"></i>
                    ) : ( <i className="fa-solid fa-angle-down tw-text-lg"></i> )}
                  <span className="tw-font-semibold">Mũi thứ</span>
                  <span className="tw-bg-gray-200 tw-px-3 tw-rounded-full">
                    {index + 1}
                  </span>
                </div>
                <div className="tw-flex tw-items-center tw-gap-3">
                  <button onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveDose(index);
                    }} className="tw-text-red-500 hover:tw-underline" >
                    <i className="fa-solid fa-trash"></i>
                  </button> 
                </div>
              </div>

              {/* Nội dung mũi */}
              {dose.open && (
                <div className="tw-px-4 tw-pb-4 tw-flex tw-flex-col tw-gap-3">
                  {/* Ngày tiêm */}
                  <div className="tw-relative">
                    <input type="date" value={dose.date}
                      onChange={(e) => handleDoseChange(index, "date", e.target.value)}
                      max={today}                                   // <-- khóa không cho chọn ngày lớn hơn
                      className="tw-w-full tw-border tw-rounded-lg tw-px-3 tw-py-2 pr-10 tw-border-gray-300 tw-text-gray-700
                                hover:tw-border-[#56b6f7] hover:tw-ring-1 hover:tw-ring-[#56b6f7]
                                focus:tw-outline-none focus:tw-border-[#1999ee] focus:tw-ring-2 focus:tw-ring-[#1999ee]/40"
                      placeholder="Ngày tiêm (không bắt buộc)"
                    />
                  </div>

                  {/* Chọn vắc xin */}
                  <div className="tw-relative">
                    <button type="button" onClick={() => toggleDropdown(index)}
                      className="tw-w-full tw-flex tw-justify-between tw-items-center 
                                tw-border tw-border-gray-300 tw-rounded-lg tw-px-3 tw-py-2 tw-text-gray-700 
                                hover:tw-border-[#56b6f7] hover:tw-ring-1 hover:tw-ring-[#56b6f7]
                                focus:tw-outline-none focus:tw-border-[#1999ee] focus:tw-ring-2 focus:tw-ring-[#1999ee]/40" >
                      <span>{dose.vaccine || "Chọn vắc xin (không bắt buộc)"}</span>
                      <i className={`fa-solid ${openIndex === index ? "fa-angle-up" : "fa-angle-down"}`}></i>
                    </button>

                    {/* Dropdown list */}
                    {openIndex === index && (
                      <div className="tw-absolute tw-top-full tw-mt-2 tw-left-1/2 -tw-translate-x-1/2
                                      tw-w-[95%] tw-bg-white  tw-z-10 tw-text-xl tw-space-y-0.5
                                      tw-border tw-border-gray-300 tw-rounded-lg tw-shadow-lg tw-py-2  ">
                        {["Vaccine A", "Vaccine B"].map((item, i) => (
                          <div key={i} onClick={() => handleSelectVaccine(index, item)}
                            className={`tw-flex tw-items-center tw-justify-between tw-px-3 tw-py-2 tw-cursor-pointer 
                              ${dose.vaccine === item ? "tw-bg-[#e6f7fa]" : "hover:tw-bg-[#e6f7fa]"}`} >
                            <span>{item}</span>
                            {dose.vaccine === item && (
                              <i className="fa-solid fa-check tw-text-[#1999ee]"></i>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Cơ sở tiêm */}
                  <input type="text" placeholder="Cơ sở tiêm chủng (không bắt buộc)"
                    value={dose.location} onChange={(e) =>
                      handleDoseChange(index, "location", e.target.value)
                    } className="tw-w-full tw-flex tw-justify-between tw-items-center 
                                tw-border tw-border-gray-300 tw-rounded-lg tw-px-3 tw-py-2 tw-text-gray-700 
                                hover:tw-border-[#56b6f7] hover:tw-ring-1 hover:tw-ring-[#56b6f7]
                                focus:tw-outline-none focus:tw-border-[#1999ee] focus:tw-ring-2 focus:tw-ring-[#1999ee]/40"/>
                </div>
              )}
            </div>
          ))}

          {/* Nút thêm mũi */}
          {doses.length < (disease?.maxDoses || 1) && (
            <button onClick={handleAddDose}
              className="tw-flex tw-items-center tw-gap-2 tw-text-blue-600 tw-font-semibold tw-mt-2" >
              <span className="tw-flex tw-items-center tw-text-xl tw-text-white tw-bg-blue-500 tw-w-10 tw-h-10 tw-rounded-full tw-justify-center tw-border">
                <i className="fa-solid fa-plus tw-text-xl "></i>
              </span>
              Thêm mũi
            </button>
          )}
        </div>

        {/* Footer */}
        <div className="tw-p-4 tw-border-t ">
          <p className="tw-text-gray-700 tw-text-lg tw-mb-3 tw-text-center">
            Tôi xác nhận tính chính xác thông tin mà tôi đã cung cấp
          </p>
          <button onClick={handleConfirm}
            className="tw-w-full tw-bg-blue-500 tw-text-white tw-py-3 tw-rounded-full tw-font-bold hover:tw-bg-blue-600 transition">
            Xác nhận
          </button>
        </div>
      </div>
    </div>
  );
}
