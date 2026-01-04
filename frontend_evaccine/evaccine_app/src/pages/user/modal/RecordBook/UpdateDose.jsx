// cập nhật mũi tiêm 
import { useState, useEffect  } from "react";
import { toast } from "react-toastify";
import { updateDiseaseHistory } from "../../../../services/recordBookService";

export default function UpdateDose({ disease,  memberId, selectedDoseNumber = 1, initialDoses = [], onClose, onSave }) {
  const [doses, setDoses] = useState([]);
  const [expanded, setExpanded] = useState(false); 

  useEffect(() => {
    const base = (Array.isArray(initialDoses) && initialDoses.length > 0)
      ? initialDoses.map((d, idx) => ({
          id: d.id ?? idx + 1,
          date: d.date || "",
          vaccine: d.vaccine || "",
          location: d.location || d.place || "",
          open: false,
          locked: !!(d.locked || d.from_booking),
        }))
      : [{ id: 1, date: "", vaccine: "", location: "", open: false, locked: false }];
    const openIndex = Math.min(Math.max(1, selectedDoseNumber), base.length) - 1;
    base[openIndex].open = true;
    setDoses(base);
  }, [disease, initialDoses, selectedDoseNumber]);


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
    if (field === "date" && today) {
      if (value > today) {
        value = today;
      }
    }
    newDoses[index][field] = value;
    setDoses(newDoses);
  };

  const handleAddDose = () => {
    const limit = disease?.doseCount || 1;     
    if (doses.length >= limit) {
      toast && toast.warn
        ? toast.warn(`Chỉ được thêm tối đa ${limit} mũi tiêm`)
        : void 0;
      return;
    }
    setDoses((prev) => [
      ...prev,
      { id: prev.length + 1, date: "", vaccine: "", location: "", open: true },
    ]);
  };


  const toggleOpen = (index) => {
    const newDoses = [...doses];
    newDoses[index].open = !newDoses[index].open;
    setDoses(newDoses);
  };

  const handleConfirm = async () => {
    try {
      const cleaned = doses.filter((d) => {
        if (d.locked) return true;
        return (
          (d.date && d.date.trim() !== "") ||
          (d.vaccine && d.vaccine.trim() !== "") ||
          (d.location && d.location.trim() !== "")
        );
      });
      if (!cleaned.length) {
        toast.warn("Vui lòng nhập ít nhất 1 mũi tiêm.");
        return;
      }
      const res = await updateDiseaseHistory({
        memberId,
        diseaseId: disease.id,
        doses: cleaned.map((d) => ({
          date: d.date || "",
          vaccine: d.vaccine || "",
          location: d.location || "",
          locked: !!d.locked,      
        })),
      });
      toast.success("Cập nhật lịch sử tiêm thành công!");
      if (onSave) {
        onSave(disease.id, res.results || cleaned);
      }
      onClose();
    } catch (err) {
      console.error("Lỗi cập nhật lịch sử tiêm:", err);
      const msg =
        err?.response?.data?.detail ||
        err?.response?.data?.doses ||
        "Cập nhật thất bại. Vui lòng thử lại.";
      toast.error(msg);
    }
  };

  return (
    <div className="tw-fixed tw-inset-0 tw-bg-black/50 tw-flex tw-items-center tw-justify-center tw-z-50 ">
      <div className="tw-bg-white tw-rounded-2xl tw-w-full md:tw-w-[600px] tw-min-h-[400px] tw-max-h-[80vh] tw-flex tw-flex-col tw-mt-[90px]">
        {/* Header */}
        <div className="tw-flex tw-items-center tw-justify-between tw-p-4 tw-border-b">
          <h2 className="tw-text-[20px] tw-font-bold">Cập nhật mũi đã tiêm</h2>
          <button onClick={onClose} className="tw-text-red-600 hover:tw-text-red-400" >
            <i className="fa-solid fa-delete-left tw-text-3xl"></i>
          </button>
        </div>

        {/* Thông tin bệnh */}
        <div className="tw-px-4 tw-py-2 tw-border-b">
          <p className="tw-font-semibold tw-text-2xl">{disease?.name}</p>
          <div className="tw-relative tw-mt-2">
            <p className={`tw-text-gray-600 tw-text-base tw-px-3 tw-text-justify tw-transition-all tw-duration-300 ${!expanded ? 'tw-line-clamp-3' : ''}`}>
              {disease?.description || "Không có mô tả"}
            </p>
            {disease?.description?.split(" ").length > 10 && (
              <div className="tw-flex tw-justify-center tw-mt-2">
                <button  className="tw-flex tw-items-center tw-gap-1 tw-text-blue-500 tw-text-lg tw-font-medium" 
                  onClick={() => setExpanded(!expanded)}>
                  {expanded ? "Thu gọn" : "Xem thêm"}
                  <i className={`fa-solid ${expanded ? "fa-angles-up" : "fa-angles-down"}`} 
                    style={{ fontSize: "0.9rem", marginTop: "2px" }} ></i>
                </button>
              </div>
            )}
          </div>
        </div>



        {/* Danh sách mũi */}
        <div className="tw-flex-1 tw-overflow-y-auto tw-px-4 tw-py-2 tw-bg-gray-100 tw-scrollbar 
                          [&::-webkit-scrollbar]:tw-w-2 [&::-webkit-scrollbar-thumb]:tw-rounded-full
                        [&::-webkit-scrollbar-track]:tw-bg-gray-100 [&::-webkit-scrollbar-thumb]:tw-bg-gradient-to-b
                        [&::-webkit-scrollbar-thumb]:tw-from-cyan-400 [&::-webkit-scrollbar-thumb]:tw-to-blue-400 ">
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
                  {!dose.locked && (
                    <button onClick={(e) => {
                        e.stopPropagation();  setDoses(prev => prev.filter((_, i) => i !== index));
                      }}  className="tw-text-red-600 hover:tw-text-red-700"  title="Xoá mũi này" >
                      <i className="fa-solid fa-trash-can"></i>
                    </button>
                  )}
                </div>
              </div>

              {/* Nội dung mũi */}
              {dose.open && (
                <div className="tw-px-4 tw-pb-4 tw-flex tw-flex-col tw-gap-3">
                  {/* Ngày tiêm */}
                  <div className="tw-relative">
                    <input type="date" value={dose.date || ""} max={today}  disabled={dose.locked}
                      onChange={(e) => handleDoseChange(index, "date", e.target.value)}
                      className="tw-w-full tw-border tw-rounded-lg tw-px-3 tw-py-2 pr-10 tw-border-gray-300 tw-text-gray-700
                        hover:tw-border-[#56b6f7] hover:tw-ring-1 hover:tw-ring-[#56b6f7]
                        focus:tw-outline-none focus:tw-border-[#1999ee] focus:tw-ring-2 focus:tw-ring-[#1999ee]/40
                        disabled:tw-bg-gray-100 disabled:tw-text-gray-500"
                      placeholder="Ngày tiêm "
                    />
                  </div>

                  {/* Chọn vắc xin */}
                  <div className="tw-relative">
                    <input  type="text" placeholder="Tên vắc xin "  value={dose.vaccine || ""}
                      onChange={(e) => handleDoseChange(index, "vaccine", e.target.value)}
                      className="tw-w-full tw-border tw-border-gray-300 tw-rounded-lg tw-px-3 tw-py-2 tw-text-gray-700
                                hover:tw-border-[#56b6f7] hover:tw-ring-1 hover:tw-ring-[#56b6f7]
                                focus:tw-outline-none focus:tw-border-[#1999ee] focus:tw-ring-2 focus:tw-ring-[#1999ee]/40"
                    />
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
          {doses.length < (disease?.doseCount || 1) && (  
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
