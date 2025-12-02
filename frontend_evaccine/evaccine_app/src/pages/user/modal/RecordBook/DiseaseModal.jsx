// Trang khi click vào tên bệnh trong RecordBook
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getVaccinesByAge } from "../../../../services/recordBookService";
import { toast } from "react-toastify";

export default function DiseaseModal({
  selectedDisease,
  setShowDiseaseModal,
  memberId,
}) {
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState(false);
  const [loadingVaccines, setLoadingVaccines] = useState(false);
  const [vaccineData, setVaccineData] = useState(null);

  useEffect(() => {
    if (!memberId || !selectedDisease?.id) return;
    let mounted = true;
    setLoadingVaccines(true);

    getVaccinesByAge(memberId, selectedDisease.id)
      .then((data) => mounted && setVaccineData(data))
      .catch((err) =>
        toast.error(
          err?.response?.data?.error || "Không thể tải danh sách vắc xin phù hợp"
        )
      )
      .finally(() => mounted && setLoadingVaccines(false));

    return () => (mounted = false);
  }, [memberId, selectedDisease?.id]);

  if (!selectedDisease) return null;

  const description = selectedDisease.description || "Chưa có mô tả chi tiết.";

  return (
    <div className="tw-fixed tw-inset-0 tw-flex tw-items-center tw-justify-center tw-bg-black/40 tw-z-50">
      <div className="tw-bg-white tw-rounded-3xl tw-shadow-2xl tw-w-[460px] tw-h-[75vh] tw-px-6 tw-pt-7 tw-pb-5 tw-relative tw-flex tw-flex-col tw-mt-[100px]">
        {/* nút đóng */}
        <button onClick={() => setShowDiseaseModal(false)}
          className="tw-absolute tw-top-8 tw-right-8 tw-w-10 tw-h-10 tw-rounded-full tw-flex tw-items-center tw-justify-center
             tw-bg-gray-100 tw-text-gray-500 hover:tw-bg-red-50 hover:tw-text-red-500 tw-shadow-sm tw-transition-all">
          <i className="fa-solid fa-xmark tw-text-xl" />
        </button>
        <h2 className="tw-text-2xl tw-font-bold tw-text-center tw-mb-4 tw-text-gray-800">
          {selectedDisease.name}
        </h2>
        {/* nội dung scroll */}
        <div className="tw-flex-1 tw-overflow-y-auto tw-space-y-4 tw-pr-1 tw-scrollbar
            [&::-webkit-scrollbar]:tw-w-2 [&::-webkit-scrollbar-track]:tw-bg-gray-100
            [&::-webkit-scrollbar-thumb]:tw-rounded-full [&::-webkit-scrollbar-thumb]:tw-from-cyan-400
            [&::-webkit-scrollbar-thumb]:tw-to-blue-400[&::-webkit-scrollbar-thumb]:tw-bg-gradient-to-b">
          {/* mô tả */}
          <div className="tw-text-center">
            <p className={`tw-text-gray-600 tw-text-[15px] tw-leading-relaxed tw-text-justify tw-transition-all 
              ${!expanded ? "tw-line-clamp-4" : ""}`} >
              {description}
            </p>

            {description.split(" ").length > 20 && (
              <button onClick={() => setExpanded(!expanded)}
                className="tw-flex tw-items-center tw-justify-center tw-gap-1 tw-mt-2 tw-text-blue-500 tw-font-semibold tw-text-lg tw-mx-auto">
                {expanded ? "Thu gọn" : "Xem thêm"}{" "}
                <i className={`fa-solid ${expanded ? "fa-angle-up" : "fa-angle-down"}`} />
              </button>
            )}
          </div>

          {/* danh sách vắc xin */}
          <div>
            <h3 className="tw-text-[15px] tw-font-semibold tw-text-pink-700 tw-text-center tw-mb-1">
              Vắc xin phù hợp với độ tuổi
            </h3>
            {loadingVaccines ? (
              <p className="tw-text-gray-500 tw-text-sm tw-text-center">
                Đang tải danh sách vắc xin…
              </p>
            ) : (
              (() => {
                const vaccines = Array.isArray(vaccineData?.vaccines) ? vaccineData.vaccines : [];
                if (!vaccines.length)
                  return (
                    <p className="tw-text-red-400 tw-italic tw-text-sm tw-text-center">
                      Hiện chưa có vắc xin phù hợp với {selectedDisease.name}.
                    </p>
                  );
                return (
                  <>
                    <p className="tw-text-[13px] tw-text-gray-700 tw-text-center tw-mb-3">
                      Bác sĩ E-Vaccine đề xuất{" "}
                      <b className="tw-text-green-500">{vaccines.length}</b> loại
                      vắc xin phù hợp cho{" "}
                      <b className="tw-text-green-500">
                        {vaccineData?.member || "khách hàng"}
                      </b>
                    </p>

                    <div className="tw-bg-gray-50 tw-rounded-3xl tw-p-3 tw-space-y-2">
                      {vaccines.map((v) => (
                        <div key={v.slug} className="tw-flex tw-items-center tw-gap-3 tw-bg-white tw-rounded-2xl tw-border 
                        tw-border-gray-200 tw-p-3 hover:tw-shadow-md tw-transition-shadow">
                          <img src={v.image || "/images/lg3.jpg"} alt={v.name} className="tw-w-[70px] tw-h-[70px] tw-object-contain" />

                          <div className="tw-flex-1">
                            <p className="tw-text-[14px] tw-font-semibold tw-text-gray-800">  {v.name} </p>
                            <p className="tw-text-[12px] tw-text-gray-500"> Phòng {v?.disease?.name || selectedDisease.name}</p>
                            <p className="tw-text-[13px] tw-font-semibold tw-text-orange-500 tw-mt-1">
                              {v.formatted_price ?? v.price ?? ""}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                );
              })()
            )}
          </div>
        </div>

        {/* footer */}
        <button onClick={() => navigate("/vaccines")}
          className="tw-bg-[#00E3FF] hover:tw-bg-[#00c7e3] tw-text-white tw-font-semibold tw-rounded-full 
          tw-w-full tw-py-2.5 tw-text-[15px] tw-shadow-md tw-mt-4">
          Danh mục vắc xin
        </button>
      </div>
    </div>
  );
}
