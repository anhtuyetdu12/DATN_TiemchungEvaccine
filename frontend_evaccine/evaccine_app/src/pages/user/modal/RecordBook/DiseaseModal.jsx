import { useState } from "react";  
import { useNavigate } from "react-router-dom";

export default function DiseaseModal({ selectedDisease, setShowDiseaseModal }) {
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState(false);

  if (!selectedDisease) return null;

  return (
    <div className="tw-fixed tw-inset-0 tw-flex tw-items-center tw-justify-center tw-bg-black/40 tw-z-50">
      <div className="tw-bg-white tw-rounded-2xl tw-shadow-lg tw-w-[400px] tw-h-[70vh] tw-p-6 tw-relative tw-flex tw-flex-col tw-mt-[100px]">
        <button onClick={() => setShowDiseaseModal(false)}
          className="tw-absolute tw-top-3 tw-right-3 tw-px-3 tw-py-1 tw-text-lg tw-text-gray-500 tw-bg-gray-100 tw-rounded-full hover:tw-text-red-500" >
          <i className="fa-solid fa-xmark tw-text-xl"></i>
        </button>

        <h2 className="tw-text-3xl tw-font-bold tw-mb-3 tw-flex-shrink-0">
          {selectedDisease.name}
        </h2>

        <div  className={`tw-flex-1 tw-overflow-y-auto tw-mb-4 tw-pr-2 tw-scrollbar 
                          [&::-webkit-scrollbar]:tw-w-2 [&::-webkit-scrollbar-thumb]:tw-rounded-full
                        [&::-webkit-scrollbar-track]:tw-bg-gray-100 [&::-webkit-scrollbar-thumb]:tw-bg-gradient-to-b
                        [&::-webkit-scrollbar-thumb]:tw-from-cyan-400 [&::-webkit-scrollbar-thumb]:tw-to-blue-400 " `} >
           <p className={`tw-text-gray-600 tw-text-justify tw-transition-all tw-duration-300
              ${!expanded ? 'tw-line-clamp-4' : ''}`}  >
            {selectedDisease.description || "Chưa có mô tả chi tiết."}
          </p>
        </div>

        {selectedDisease.description?.split(" ").length > 20 && (
          <button className="tw-flex tw-items-center tw-gap-2 tw-mb-2 tw-text-blue-500 tw-font-medium tw-self-center tw-justify-center"
            onClick={() => setExpanded(!expanded)}>
            {expanded ? "Thu gọn" : "Xem thêm"}
            <i className={`fa-solid ${expanded ? "fa-angles-up" : "fa-angles-down"}`}></i>
          </button>
        )}

        <div className="tw-mt-auto tw-flex-shrink-0">
          <button onClick={() => navigate("/vaccines")}
            className="tw-bg-[#0de9f7] hover:tw-bg-[#0dd4f7] tw-rounded-full tw-text-white tw-font-medium tw-w-full tw-px-6 tw-py-2">
            Danh mục vắc xin
          </button>
        </div>

      </div>
    </div>
  );
}
