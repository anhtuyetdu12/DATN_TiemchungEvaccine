import React, { useState, useEffect, useRef } from "react";
import { getVaccinesByAge, getVaccinationRecords  } from "../../../../services/recordBookService";
import {  toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { addToBooking, getBookingSlugs } from "../../../../utils/bookingStorage";


export default function DetailDose({ disease, onClose, memberId }) {
  const [activeTab, setActiveTab] = useState(disease?.selectedDoseNumber || 1);
  const [expanded, setExpanded] = useState(false);
  const [vaccineData, setVaccineData] = useState(null);      // { member, age, vaccines: [...] }
  const [suggestedVaccine, setSuggestedVaccine] = useState(null);
  const [loading, setLoading] = useState(false);
  const [doseStatuses, setDoseStatuses] = useState([]); // ["Đã tiêm", "Chờ tiêm", ...]
  const [selectedVaccine, setSelectedVaccine] = useState(null);
  // mô tả bệnh
  const description = disease.description || "Chưa có mô tả về bệnh này. Vui lòng tham khảo ý kiến bác sĩ để biết thêm chi tiết.";
  const navigate = useNavigate();

  const handleBookFromDose = () => {
    // Ưu tiên vắc xin đang được user chọn, fallback sang suggested
    const target = selectedVaccine || suggestedVaccine;
    const slug = target?.slug;

    if (!slug) {
      toast.error("Chưa có vắc xin phù hợp để đặt hẹn.");
      return;
    }

    addToBooking(slug, 1);
    const all = getBookingSlugs();
    onClose?.();
    const u = new URL(window.location.href);
    u.pathname = "/bookingform";
    u.searchParams.set("v", all.join(","));
    u.searchParams.set("member", String(memberId));
    u.searchParams.delete("pkg");
    navigate(u.pathname + u.search);
  };

  // Tải lịch sử tiêm và tính trạng thái theo mũi
  useEffect(() => {
    if (!memberId || !disease?.id) return;
    let mounted = true;
    (async () => {
      try {
        const records = await getVaccinationRecords(memberId);
        // Bảo đảm records là mảng dù service chưa chuẩn hoá
        const list = Array.isArray(records)
          ? records
          : Array.isArray(records?.results) ? records.results : [];
        // so sánh id phải “nới” kiểu (string/number)
        const rows = list.filter(r => String(r?.disease?.id ?? r?.disease_id ?? "") === String(disease.id));
        // map mũi -> list bản ghi (phòng trường hợp có nhiều bản ghi)
        const byDose = new Map(); // key: doseNumber(1-based) -> array
        rows.forEach(r => {
          const dn = r?.dose_number || 0;
          if (!dn) return; // bỏ qua nếu không có số mũi
          if (!byDose.has(dn)) byDose.set(dn, []);
          byDose.get(dn).push(r);
        });

        const getStatus = (rec) => {
          if (rec?.vaccination_date) return "Đã tiêm";
          if (rec?.next_dose_date) {
          const toYMD = (d) => {
            const t = new Date(d);
            const yyyy = t.getFullYear();
            const mm = String(t.getMonth()  + 1).padStart(2, "0");
            const dd = String(t.getDate()).padStart(2, "0");
            return `${yyyy}-${mm}-${dd}`;
          };
          const appt = toYMD(rec.next_dose_date);
          const todayYMD = toYMD(new Date());
          if (appt > todayYMD) return "Chờ tiêm";   
          if (appt < todayYMD) return "Trễ hẹn";  
          return "Chờ tiêm";                       
        }
          return "Chưa tiêm";
        };

        // Tính cho từng mũi từ 1..doseCount
        const maxDoses = disease?.doseCount || 1;
        const statuses = Array.from({ length: maxDoses }).map((_, idx) => {
          const doseIdx = idx  + 1;
          const arr = byDose.get(doseIdx) || [];
          if (arr.length === 0) return "Chưa tiêm";
          // Ưu tiên: Đã tiêm > Chờ tiêm > Trễ hẹn > Chưa tiêm
          const ranking = { "Đã tiêm": 3, "Chờ tiêm": 2, "Trễ hẹn": 1, "Chưa tiêm": 0 };
          let best = "Chưa tiêm";
          arr.forEach(r => {
            const st = getStatus(r);
            if (ranking[st] > ranking[best]) best = st;
          });
          return best;
        });

        if (mounted) setDoseStatuses(statuses);
      } catch (err) {
        if (mounted) setDoseStatuses([]);
        // không cần toast ở đây để tránh ồn, vì view này vẫn chạy được
      }
    })();
    return () => { mounted = false; };
  }, [memberId, disease?.id, disease?.doseCount]);

  // tính xem có cần nút “xem thêm”
  const [showButton, setShowButton] = useState(false);
  const paragraphRef = useRef(null);
  useEffect(() => {
    const el = paragraphRef.current;
    if (el) {
      const lineHeight = parseFloat(getComputedStyle(el).lineHeight);
      const maxLines = 2;
      setShowButton(el.scrollHeight > lineHeight * maxLines);
    }
  }, [description]);

  // Đồng bộ lại tab nếu đổi disease khi mở modal khác
  useEffect(() => {
    setActiveTab(disease?.selectedDoseNumber || 1);
  }, [disease?.selectedDoseNumber]);

  // tải gợi ý vắc xin theo độ tuổi
  useEffect(() => {
    if (!memberId || !disease?.id) return;
    let mounted = true;
    setLoading(true);

    getVaccinesByAge(memberId, disease.id)
      .then((data) => {
        if (!mounted) return;
        setVaccineData(data);

        const list = Array.isArray(data?.vaccines) ? data.vaccines : [];

        const first = list[0] || null;
        setSuggestedVaccine(first);
        setSelectedVaccine(first); // mặc định chọn vắc xin đầu tiên
      })
      .catch((err) => {
        toast.error(
          err?.response?.data?.error || "Không thể tải gợi ý vắc xin"
        );
      })
      .finally(() => mounted && setLoading(false));

    return () => {
      mounted = false;
    };
  }, [memberId, disease?.id, activeTab]);

  const currentDoseStatus = doseStatuses[activeTab - 1] || "Chưa tiêm";
  const statusClass = {
    "Đã tiêm": "tw-bg-green-100 tw-text-green-600",
    "Chờ tiêm": "tw-bg-blue-100 tw-text-blue-600",
    "Trễ hẹn": "tw-bg-red-100 tw-text-red-600",
    "Chưa tiêm": "tw-bg-orange-100 tw-text-orange-600",
  }[currentDoseStatus];

  return (
    <div className="tw-fixed tw-inset-0 tw-bg-black/50 tw-flex tw-items-center tw-justify-center tw-z-50">
      <div className="tw-relative tw-w-[450px] tw-h-[80vh] tw-bg-white tw-rounded-3xl tw-shadow-2xl tw-overflow-hidden tw-animate-fadeInUp tw-mt-[90px] tw-flex tw-flex-col">
        {/* Header */}
        <div className="tw-relative tw-h-[100px] tw-bg-gradient-to-r tw-from-blue-100 tw-to-blue-200">
          <img src="/images/bg6.jpg" alt="background" className="tw-absolute tw-inset-0 tw-w-full tw-h-full tw-object-cover" />
          <button onClick={onClose}
            className="tw-absolute tw-top-4 tw-left-4 tw-bg-white/70 tw-text-red-600 tw-rounded-full tw-w-10 tw-h-10 tw-flex tw-items-center tw-justify-center hover:tw-bg-white">
            <i className="fa-solid fa-arrow-left"></i>
          </button>
          <div className="tw-absolute tw-bottom-4 tw-left-0 tw-w-full tw-flex tw-justify-center">
            <div className="tw-bg-[#46cff1]/80 tw-text-white tw-rounded-full tw-shadow-lg tw-inline-block">
              <h2 className="tw-text-2xl tw-font-bold tw-pt-3 tw-px-10">{disease.name}</h2>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="tw-sticky tw-top-0 tw-bg-gray-50 tw-px-10 tw-py-3 tw-z-10 tw-border-b tw-border-gray-200">
          <div className="tw-flex tw-justify-center tw-space-x-12">
            {[...Array(disease.doseCount || 2)].map((_, i) => (
              <button key={i} onClick={() => setActiveTab(i + 1)}
                className={`tw-font-semibold tw-pb-2 tw-text-lg ${activeTab === i + 1 ? "tw-text-blue-600 tw-border-b-2 tw-border-blue-600" : "tw-text-gray-500"}`}>
                Mũi {i + 1}
              </button>
            ))}
          </div>
        </div>

        {/* Body */}
        <div className="tw-flex-1 tw-overflow-y-auto tw-space-y-5 tw-px-6 tw-py-4 tw-bg-gray-50 tw-scrollbar 
                          [&::-webkit-scrollbar]:tw-w-2 [&::-webkit-scrollbar-thumb]:tw-rounded-full
                        [&::-webkit-scrollbar-track]:tw-bg-gray-100 [&::-webkit-scrollbar-thumb]:tw-bg-gradient-to-b
                        [&::-webkit-scrollbar-thumb]:tw-from-cyan-400 [&::-webkit-scrollbar-thumb]:tw-to-blue-400">
          {/* Thông tin bệnh */}
          <div className="tw-bg-white tw-rounded-2xl tw-p-4 tw-shadow-sm">
            <div className="tw-flex tw-items-center tw-justify-between tw-mb-2">
              <h3 className="tw-font-semibold tw-text-[14px]">Thông tin bệnh</h3>
               <span className={`tw-text-xl tw-font-semibold tw-px-3 tw-py-1 tw-rounded-full ${statusClass}`}>  {currentDoseStatus}  </span>
            </div>

            <p ref={paragraphRef} className={`tw-text-gray-700 tw-text-xl tw-leading-relaxed tw-text-justify ${!expanded ? "tw-line-clamp-2" : ""}`}>
              {description}
            </p>
            {showButton && (
              <div className="tw-flex tw-justify-center tw-items-center tw-mt-3">
                <button onClick={() => setExpanded(!expanded)}
                  className="tw-flex tw-items-center tw-justify-center tw-gap-1 tw-text-blue-600 tw-text-xl tw-font-medium hover:tw-text-blue-500">
                  {expanded ? (<><i className="fa-solid fa-angle-up"></i><span>Thu gọn</span></>) :
                             (<><i className="fa-solid fa-angle-down"></i><span>Xem thêm</span></>)}
                </button>
              </div>
            )}
          </div>

          {/* Danh sách vắc xin có thể chọn */}
          <div className="tw-bg-white tw-rounded-2xl tw-shadow-md tw-p-4">
            {loading ? (
              <div className="tw-text-center tw-text-gray-500"> Đang tải gợi ý vắc xin… </div>
            ) : (
              (() => {
                const vaccines = Array.isArray(vaccineData?.vaccines) ? vaccineData.vaccines : [];
                if (!vaccines.length) {
                  return (
                    <div className="tw-text-red-400 tw-italic tw-text-center">
                      Hiện chưa có vắc xin phù hợp với {disease.name} cho độ tuổi này.
                    </div>
                  );
                }
                return (
                  <>
                    <p className="tw-text-gray-700 tw-mb-3 tw-text-xl tw-text-left">
                      Bác sĩ E-Vaccine đề xuất{" "}
                      <b className="tw-text-green-500">{vaccines.length}</b> 
                      loại vắc xin phù hợp với khách hàng{" "}
                      <b className="tw-text-green-500"> {vaccineData?.member || "khách hàng"}</b>{" "} bên dưới:
                    </p>
                    <div className="tw-space-y-3">
                      {vaccines.map((v) => {
                        const isSelected = selectedVaccine?.slug === v.slug;
                        const price = v.formatted_price ?? v.price ?? "";
                        const image = v.image || "/images/lg3.jpg";
                        return (
                          <button key={v.slug} type="button" onClick={() => setSelectedVaccine(v)}
                            className={`tw-w-full tw-text-left tw-flex tw-items-center tw-gap-4 tw-border tw-rounded-2xl tw-p-3 hover:tw-shadow-md
                              ${ isSelected
                                  ? "tw-border-cyan-500 tw-bg-cyan-50 tw-ring-1 tw-ring-cyan-400"
                                  : "tw-border-gray-200 tw-bg-white"
                              }`}>
                            <img  src={image}  alt={v.name}  className="tw-w-[90px] tw-h-[90px] tw-object-contain" />
                            <div className="tw-flex-1 tw-text-left">
                              <p className="tw-text-gray-500 tw-font-semibold tw-text-lg"> {v.name} </p>
                              <p className="tw-text-[14px] tw-font-bold tw-text-gray-800">
                                Phòng {v?.disease?.name || disease.name}
                              </p>
                              <p className="tw-text-orange-500 tw-font-semibold"> {price}  </p>
                            </div>

                            {/* Indicator đã chọn */}
                            <div className={`tw-w-6 tw-h-6 tw-rounded-full tw-border-2 tw-flex tw-items-center tw-justify-center
                                ${  isSelected
                                    ? "tw-border-cyan-500 tw-bg-cyan-500"
                                    : "tw-border-gray-300 tw-bg-white"
                                }`} >
                              {isSelected && (
                                <i className="fa-solid fa-check tw-text-white tw-text-xs"></i>
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </>
                );
              })()
            )}
          </div>
        </div>

        <div className="tw-sticky tw-bottom-0 tw-bg-white tw-border-t tw-border-gray-200 tw-p-4 tw-flex tw-gap-3">
          <button onClick={handleBookFromDose} className="tw-flex-1 tw-bg-[#50e8f3] tw-text-white tw-font-semibold tw-rounded-full tw-py-2 hover:tw-bg-[#0ce1f0]">
            Đặt hẹn ngay
          </button>
        </div>
      </div>
    </div>
  );
}
