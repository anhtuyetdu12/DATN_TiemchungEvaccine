import { useNavigate } from "react-router-dom";

export default function DiseaseModal({ selectedDisease, setShowDiseaseModal }) {
  const navigate = useNavigate();
    if (!selectedDisease) return null;
  return (
    <div className="tw-fixed tw-inset-0 tw-flex tw-items-center tw-justify-center tw-bg-black/40 tw-z-50">
        <div className="tw-bg-white tw-rounded-2xl tw-shadow-lg tw-w-[400px] tw-h-[200px] tw-p-6  tw-relative tw-flex tw-flex-col tw-justify-between">
        <button onClick={() => setShowDiseaseModal(false)}
            className="tw-absolute tw-top-3 tw-right-3 tw-px-3 tw-py-1 tw-text-lg tw-text-gray-500 tw-bg-gray-100 tw-rounded-full hover:tw-text-red-500" >
            <i className="fa-solid fa-xmark tw-text-xl"></i>
        </button>

        <h2 className="tw-text-3xl tw-font-bold tw-mb-3">
            {selectedDisease.name}
        </h2>

        <p className="tw-text-gray-600 tw-mb-6  tw-text-justify">
            {selectedDisease.description || "Chưa có mô tả chi tiết."}
        </p>

        <button
             onClick={() => navigate("/vaccines")}
            className="tw-bg-[#0de9f7] hover:tw-bg-[#0dd4f7] tw-rounded-full tw-text-white tw-font-medium tw-w-full tw-px-6 tw-py-2 ">
            Danh mục vắc xin
        </button>
        </div>
    </div>
  );
}
