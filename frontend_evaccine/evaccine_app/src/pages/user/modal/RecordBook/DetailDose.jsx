import React, { useState, useEffect, useRef } from "react";

export default function DetailDose({ disease, onClose }) {
  const [activeTab, setActiveTab] = useState(1);
  const [expanded, setExpanded] = useState(false);

  const description =
    disease.description ||
    "Sốt xuất huyết Dengue là bệnh truyền nhiễm nguy hiểm do virus Dengue gây ra, bao gồm bốn tuýp virus: DEN-1, DEN-2, DEN-3, DEN-4. Bệnh có thể gây biến chứng nguy hiểm nếu không được phát hiện và điều trị kịp thời.";

  // Giả lập vắc xin gợi ý
  const vaccineInfo = {
    country: "Đức",
    name: "Vắc xin Qdenga",
    disease: disease.name,
    price: "1.390.000đ / liều",
    image: "/images/vaccine_sample.png", // bạn thay bằng ảnh thật
  };

    // hiển thi nút xem thêm
    const [showButton, setShowButton] = useState(false);
    const paragraphRef = useRef(null);

    // const shortText = description.split(" ").slice(0, 25).join(" ") + "...";

    useEffect(() => {
        const el = paragraphRef.current;
        if (el) {
        const lineHeight = parseFloat(getComputedStyle(el).lineHeight);
        const maxLines = 2;
        setShowButton(el.scrollHeight > lineHeight * maxLines);
        }
    }, [description]);

  return (
    <div className="tw-fixed tw-inset-0 tw-bg-black/50 tw-flex tw-items-center tw-justify-center tw-z-50">
        <div className="tw-relative tw-w-[450px] tw-h-[80vh] tw-bg-white tw-rounded-3xl tw-shadow-2xl tw-overflow-hidden tw-animate-fadeInUp tw-mt-[90px] tw-flex tw-flex-col">
            {/* Hình nền */}
            <div className="tw-relative tw-h-[100px] tw-bg-gradient-to-r tw-from-blue-100 tw-to-blue-200">
                <img src="/images/bg6.jpg" alt="background"  className="tw-absolute tw-inset-0 tw-w-full tw-h-full tw-object-cover" />
                <button onClick={onClose}
                    className="tw-absolute tw-top-4 tw-left-4 tw-bg-white/70 tw-text-red-600 tw-rounded-full tw-w-10 tw-h-10 tw-flex tw-items-center tw-justify-center hover:tw-bg-white" >
                    <i className="fa-solid fa-arrow-left"></i>
                </button>
                <div className="tw-absolute tw-bottom-4 tw-left-0 tw-w-full tw-flex tw-justify-center">
                    <div className="tw-bg-[#46cff1]/80 tw-text-white tw-rounded-full tw-shadow-lg tw-inline-block">
                        <h2 className="tw-text-2xl tw-font-bold tw-pt-3 tw-px-10">{disease.name}</h2>
                    </div>
                </div>
            </div>

            {/* Tabs cố định */}
            <div className="tw-sticky tw-top-0 tw-bg-gray-50 tw-px-10 tw-py-3 tw-z-10 tw-border-b tw-border-gray-200">
                <div className="tw-flex tw-justify-center tw-space-x-12">
                {[...Array(disease.doseCount || 2)].map((_, i) => (
                    <button key={i} onClick={() => setActiveTab(i + 1)}
                        className={`tw-font-semibold tw-pb-2 tw-text-lg ${
                            activeTab === i + 1
                            ? "tw-text-blue-600 tw-border-b-2 tw-border-blue-600"
                            : "tw-text-gray-500"
                        }`}>  Mũi {i + 1}
                    </button>
                ))}
                </div>
            </div>

            {/* Nội dung cuộn */}
            <div className="tw-flex-1 tw-overflow-y-auto tw-space-y-5 tw-px-6 tw-py-4 tw-bg-gray-50 tw-scrollbar 
                          [&::-webkit-scrollbar]:tw-w-2 [&::-webkit-scrollbar-thumb]:tw-rounded-full
                        [&::-webkit-scrollbar-track]:tw-bg-gray-100 [&::-webkit-scrollbar-thumb]:tw-bg-gradient-to-b
                        [&::-webkit-scrollbar-thumb]:tw-from-cyan-400 [&::-webkit-scrollbar-thumb]:tw-to-blue-400 " style={{ scrollbarGutter: "stable" }}>
                <div className="tw-bg-white tw-rounded-2xl tw-p-4 tw-shadow-sm">
                <div className="tw-flex tw-items-center tw-justify-between tw-mb-2">
                    <h3 className="tw-font-semibold tw-text-[14px]">Thông tin bệnh</h3>
                    <span className={`tw-text-xl tw-font-semibold tw-px-3 tw-py-1 tw-rounded-full ${
                        disease.status === "Đã tiêm"
                        ? "tw-bg-green-100 tw-text-green-600"
                        : "tw-bg-orange-100 tw-text-orange-600"
                        }`} > {disease.status || "Chưa tiêm"}
                    </span>
                </div>

                <p  ref={paragraphRef} className={`tw-text-gray-700 tw-text-xl tw-leading-relaxed tw-text-justify ${ !expanded ? "tw-line-clamp-2" : "" }`} >  {description} </p>

                {showButton && (
                    <div className="tw-flex tw-justify-center tw-items-center tw-mt-3">
                        <button onClick={() => setExpanded(!expanded)}
                            className="tw-flex tw-items-center tw-justify-center tw-gap-1 tw-text-blue-600 tw-text-xl tw-font-medium hover:tw-text-blue-500 focus:tw-outline-none" >
                            {expanded ? (
                            <> <i className="fa-solid fa-angle-up"></i> <span>Thu gọn</span> <i className="fa-solid fa-angle-up tw-opacity-0"></i> </>
                            ) : (
                            <> <i className="fa-solid fa-angle-down"></i> <span>Xem thêm</span> <i className="fa-solid fa-angle-down tw-opacity-0"></i> </> )}
                        </button>
                    </div>
                )}
                </div>


                <div className="tw-bg-white tw-rounded-2xl tw-shadow-md tw-p-4">
                    <p className="tw-text-gray-700 tw-mb-2 tw-text-xl tw-text-left"> Bác sĩ E-Vaccine đề xuất 1 loại vắc xin phù hợp với Quý khách bên dưới: </p>
                    <div className="tw-flex tw-items-center tw-gap-4 tw-border tw-border-gray-200 tw-rounded-2xl tw-p-3 hover:tw-shadow-md">
                        <img src={vaccineInfo.image} alt={vaccineInfo.name} className="tw-w-34 tw-h-34 tw-object-contain"  />
                        <div className="tw-flex-1 tw-text-left">
                            <p className="tw-text-gray-500 tw-font-semibold tw-text-lg">{vaccineInfo.name}</p>
                            <p className="tw-text-[14px] tw-font-bold tw-text-gray-800">{vaccineInfo.disease}</p>
                            <p className="tw-text-orange-500 tw-font-semibold">  {vaccineInfo.price}
                                <span className="tw-text-gray-400 tw-font-normal tw-text-base"> {vaccineInfo.unit}</span>
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Nút đặt hẹn cố định */}
            <div className="tw-sticky tw-bottom-0 tw-bg-white tw-border-t tw-border-gray-200 tw-p-4 tw-flex tw-gap-3">
            {/* <button className="tw-flex-1 tw-bg-gray-100 tw-text-gray-700 tw-font-semibold tw-rounded-full tw-py-2 hover:tw-bg-gray-200">
                Gửi yêu cầu tư vấn
            </button> */}
            <button className="tw-flex-1 tw-bg-[#50e8f3] tw-text-white tw-font-semibold tw-rounded-full tw-py-2 hover:tw-bg-[#0ce1f0] ">
                Đặt hẹn ngay
            </button>
            </div>

        </div>
    </div>
    );

}
