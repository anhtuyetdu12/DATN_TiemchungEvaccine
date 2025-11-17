import { useState, useRef, useEffect, useMemo } from "react";
import { useParams } from "react-router-dom";
import RequestConsultationModal from "./modal/DetailVaccine/RequestConsultationModal";
import api from "../../services/axios";
import { useNavigate } from "react-router-dom";
import { formatTargetAge } from "../../utils/schedule";
import { addToBooking, getBookingSlugs } from "../../utils/bookingStorage";
import { toast } from "react-toastify";

export default function DetailsVaccine() {
  const [showModal, setShowModal] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const { slug } = useParams();
  const [activeSection, setActiveSection] = useState("gioithieu");
  const sectionRefs = useRef({});
  const sidebarRef = useRef(null);
  const contentRef = useRef(null);
  const [sidebarTop, setSidebarTop] = useState(0);
  const [isSticky, setIsSticky] = useState(false);

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const handleBack = () => {
    // nếu có lịch sử thì quay lại, không thì về danh sách
    if (window.history.length > 1) navigate(-1);
    else navigate("/vaccines");
  };

  const handleBookNow = () => {
    if (!data?.slug) {
      toast.error("Không xác định được vắc xin để đặt hẹn.");
      return;
    }
    addToBooking(data.slug, 1);
    // Nếu booking form vẫn dùng ?v=... thì build từ storage:
    const slugs = getBookingSlugs();
    navigate(`/bookingform?v=${slugs.join(",")}`);
  };


  useEffect(() => {
    if (!slug) return; 
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        const resp = await api.get(`/vaccines/vaccines/${slug}/`);
        if (alive) setData(resp.data);
      } catch {
        if (alive) setData(null);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [slug]);


const buildIntro = (v) => {
  if (!v) return null;

  // Mặc định: dựng động từ dữ liệu BE (nếu có)
  const ageText = formatTargetAge(v);
  const prevention = v?.disease?.prevention || v?.disease?.description;
  const schedule = v?.schedule_text || (v?.doses_required ? `${v.doses_required} liều` : null);

  return (
    <div className="tw-space-y-2">
      <p className="tw-font-semibold">Giới thiệu {v.name}</p>
      <ul className="tw-list-disc tw-pl-6 tw-space-y-1">
        {prevention && ( <li> <span className="tw-font-medium">Phòng ngừa:</span> {prevention} </li>)}
        {ageText && ( <li> <span className="tw-font-medium">Độ tuổi:</span> {ageText}. </li>)}
        {schedule && ( <li> <span className="tw-font-medium">Lịch tiêm chủng:</span> {schedule} </li> )}
        {v.efficacy_text   && <li><span className="tw-font-medium">Hiệu quả bảo vệ:</span> {v.efficacy_text}</li>}
        {v.pregnancy_note  && <li><span className="tw-font-medium">Phụ nữ mang thai:</span> {v.pregnancy_note}</li>}
        {v.deferral_note   && <li><span className="tw-font-medium">Hoãn tiêm chủng:</span> {v.deferral_note}</li>}
        
      </ul>
    </div>
  );
};


  // 👉 Dùng useMemo để xây detailBlocks từ data
  const detailBlocks = useMemo(() => ([
    { id: "gioithieu",  title: "Giới thiệu vắc xin",        content: buildIntro(data)  },
    { id: "benhly",     title: "Thông tin bệnh lý",         content: data?.disease?.description },
    { id: "lichtiem",   title: "Phác đồ lịch tiêm",         content: data?.schedule_text },
    { id: "chongchidinh", title: "Chống chỉ định",          content: data?.contraindications },
    { id: "tuongtac",   title: "Tương tác vắc xin",         content: data?.side_effects },
    { id: "hieuqua",    title: "Hiệu quả bảo vệ",           content: data?.efficacy_text },        
    { id: "phunu",      title: "Phụ nữ mang thai",          content: data?.pregnancy_note },       
    { id: "hoantiem",   title: "Hoãn tiêm chủng",           content: data?.deferral_note },   
    { id: "khac", title: "Các chú ý khác", content: data?.other_notes || data?.storage_requirements }

  ]), [data]);

  // Scroll spy
  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => entry.isIntersecting && setActiveSection(entry.target.id));
    }, { root: null, rootMargin: "0px 0px -50% 0px", threshold: 0 });

    Object.values(sectionRefs.current).forEach((el) => el && observer.observe(el));
    return () => observer.disconnect();
  }, [detailBlocks]); // re-attach khi danh sách section thay đổi

  // Lấy vị trí sidebar để sticky
  useEffect(() => {
    if (sidebarRef.current) {
      const rect = sidebarRef.current.getBoundingClientRect();
      setSidebarTop(rect.top + window.scrollY);
    }
  }, []);

  useEffect(() => {
    const handleScroll = () => setIsSticky(window.scrollY >= sidebarTop - 100);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [sidebarTop]);

  const scrollToSection = (id) => {
    if (!expanded) setExpanded(true);
    setActiveSection(id);
    const section = sectionRefs.current[id];
    if (section && contentRef.current) {
      contentRef.current.scrollTo({ top: section.offsetTop - 10, behavior: "smooth" });
    }
  };

  if (loading) return <div className="tw-py-[150px] tw-text-center">Đang tải dữ liệu…</div>;
  if (!data)    return <div className="tw-py-[150px] tw-text-center">Không tìm thấy vắc xin.</div>;


  return (
    <div className="tw-bg-sky-100 tw-min-h-screen  ">
      <div className="tw-max-w-[1100px] tw-mx-auto tw-px-5 tw-py-[120px]">
        <div className="tw-flex tw-justify-start tw-mb-4">
          <button onClick={handleBack} aria-label="Quay lại"
            className="tw-inline-flex tw-items-center tw-gap-2 tw-text-blue-600 hover:tw-text-blue-800
                      tw-bg-white tw-border tw-border-blue-200 hover:tw-border-blue-400
                      tw-rounded-full tw-px-4 tw-py-2 tw-shadow-sm" >
            <i className="fa-solid fa-arrow-left"></i>
            <span className="tw-font-medium">Quay lại</span>
          </button>
        </div>
        {/* Khung thông tin sản phẩm */}
        <div className="tw-bg-white tw-rounded-2xl tw-shadow-md tw-p-8 tw-mb-8">
          <div className="tw-flex tw-gap-8">
            <div className="tw-w-1/3">
              <img   src={data.image || "/images/no-image.jpg"}  alt={data.name} className="tw-rounded-xl tw-shadow tw-w-full tw-object-contain"/>
                <p className="tw-text-base tw-text-gray-700  tw-bg-gray-200 tw-rounded-full tw-inline-block tw-px-4 tw-py-1 tw-mt-5">
                    Mẫu mã sản phẩm có thể thay đổi theo lô hàng
                </p>
            </div>
            <div className="tw-w-2/3 tw-text-left tw-ml-5  tw-space-y-5">
                <div className="tw-border-b tw-border-dashed tw-border-gray-300 tw-pb-3 tw-mb-8 tw-space-y-3">
                    <p className="tw-text-2xl tw-text-[#2b9efc] tw-font-semibold">  {data?.disease?.name || "—"} </p>
                    <h2 className="tw-text-[30px] tw-font-semibold"> {data.name}  </h2>
                    <p className="tw-text-[30px] tw-text-[#fd8206] tw-font-bold tw-pb-12">
                        {data.price != null  ? `${Number(data.price).toLocaleString("vi-VN")} VNĐ` : "Liên hệ"}
                        <span className="tw-text-2xl tw-text-gray-500 tw-font-medium">
                          {data.unit ? ` / ${data.unit}` : ""}
                        </span>
                    </p>
                </div>

                {/* Thông tin vắc xin */}
                <div className="tw-grid tw-grid-cols-[200px_1fr] tw-gap-y-3 tw-text-black tw-text-[16px] tw-mt-3 tw-text-xl">
                    <div className="tw-font-medium tw-text-gray-500">Đơn vị</div>
                    <div>
                        <button  className="tw-relative tw-flex tw-items-center tw-justify-center tw-rounded-full tw-border
                         tw-border-[#47b8fa] tw-bg-white tw-px-6 tw-py-2 tw-text-gray-800 tw-font-medium tw-min-w-[90px] tw-overflow-hidden"
                            aria-label="Chip Selection"  aria-pressed="true" >
                            <p className="tw-mx-1 tw-leading-[14px] tw-text-gray-800">{data.unit || "—"}</p>
                            {/* Góc gập */}
                            <span  className="tw-absolute tw-right-[-1px] tw-top-[-1px] tw-w-[23px] tw-h-[23px] tw-bg-[#47b8fa]"
                              style={{ clipPath: "polygon(100% 0px, 0px 0px, 100% 100%)" }} >
                              <i className="fa-solid fa-check tw-text-white tw-text-[10px] tw-absolute tw-right-[4px] tw-top-[4px]"></i>
                            </span>
                        </button>
                    </div> 
                    <div className="tw-font-medium tw-text-gray-500">Nhà sản xuất</div>
                    <div>{data.manufacturer || "—"}</div>

                    <div className="tw-font-medium tw-text-gray-500">Nơi sản xuất</div>
                    <div>{data.origin || "—"}</div>

                    <div className="tw-font-medium tw-text-gray-500">Đối tượng tiêm</div>
                    <div>{formatTargetAge(data) || "Theo khuyến cáo"}</div>

                    {/* Phác đồ (liều) – giữ hiển thị liều gọn gàng */}
                    <div className="tw-font-medium tw-text-gray-500">Phác đồ (liều)</div>
                    <div>{Number(data.doses_required || 0) > 0 ? `${data.doses_required} liều` : "—"}</div>
                </div>

            <p className="tw-text-gray-900 tw-mt-5 tw-leading-relaxed tw-text-justify tw-text-xl">
              {data.vaccine_type || data.schedule_text || "Chưa có mô tả."}
            </p>

          <div className="tw-flex tw-gap-4 tw-mt-6 tw-w-full">
            {/* <button onClick={() => setShowModal(true)} className="tw-flex-1 tw-bg-pink-100 tw-text-pink-700 tw-font-medium tw-py-4 tw-text-[18px] tw-rounded-full hover:tw-bg-pink-200">
              Yêu cầu tư vấn
            </button> */}
            <button onClick={handleBookNow} className="tw-flex-1 tw-bg-gradient-to-r tw-from-[#0798ec] tw-to-[#b0f1fb] tw-text-white tw-py-3 tw-rounded-full 
                    hover:tw-from-[#b0f1fb] hover:tw-to-[#0798ec] tw-font-semibold tw-text-[18px] hover:tw-bg-blue-500">
              Đặt hẹn
            </button>
          </div>


            </div>
          </div>
        </div>

        {/* Khung trắng bao quanh nội dung + sidebar */}
        <div className="tw-bg-white tw-rounded-2xl tw-shadow-md tw-p-6 tw-mb-8">

         {/* Sidebar + Nội dung */}
          <div className="tw-flex tw-gap-6 ">
            <div className="tw-w-1/3" ref={sidebarRef}>
              <ul className={`tw-space-y-2 tw-text-gray-700 tw-font-medium tw-cursor-pointer tw-text-left ${ isSticky ? "tw-sticky tw-top-[100px]" : "" }`} >
                {detailBlocks.map((sec) => (
                  <li key={sec.id} onClick={() => scrollToSection(sec.id)}
                    className={`tw-rounded-lg tw-p-3 cursor-pointer ${
                      activeSection === sec.id
                        ? "tw-bg-[#e3f9ff] tw-text-blue-500 tw-border-l-4 tw-border-blue-700"
                        : "hover:tw-bg-gray-50"
                    }`} >
                    {sec.title}
                  </li>
                ))}
              </ul>
            </div>

            <div className="tw-w-2/3 tw-space-y-6 tw-px-5 tw-h-[600px] tw-overflow-y-auto tw-text-justify tw-scrollbar 
                          [&::-webkit-scrollbar]:tw-w-2 [&::-webkit-scrollbar-thumb]:tw-rounded-full
                        [&::-webkit-scrollbar-track]:tw-bg-gray-100 [&::-webkit-scrollbar-thumb]:tw-bg-gradient-to-b
                        [&::-webkit-scrollbar-thumb]:tw-from-cyan-400 [&::-webkit-scrollbar-thumb]:tw-to-blue-400" ref={contentRef}>
              {detailBlocks.map((sec) => (
                <div key={sec.id} id={sec.id}
                  ref={(el) => (sectionRefs.current[sec.id] = el)}
                  className={`${!expanded && sec.id !== "gioithieu" ? "tw-hidden" : ""} tw-expandable`}>
                  <h3 className="tw-text-2xl tw-font-bold tw-mb-3">{sec.title}</h3>
                  {sec.content ? (
                    typeof sec.content === "string" ? (
                      <div className="tw-text-gray-700 tw-leading-relaxed whitespace-pre-line">
                        {sec.content}
                      </div>
                    ) : (
                      <div className="tw-text-gray-700 tw-leading-relaxed">{sec.content}</div>
                    )
                  ) : (
                    <p className="tw-text-gray-400 italic">Đang cập nhật…</p>
                  )}
                </div>
              ))}

              {/* Nút Xem tất cả / Thu gọn trực tiếp */}
              <div className="tw-flex tw-justify-center tw-mt-4">
                <button type="button"  aria-label="Xem tất cả / Thu gọn"
                  onClick={() => setExpanded(!expanded)}
                  className="tw-flex tw-items-center tw-justify-center tw-gap-2 tw-px-9 tw-py-2 tw-h-13 tw-rounded-full
                            tw-border tw-border-blue-300 tw-bg-white tw-text-blue-500
                            hover:tw-bg-blue-50 hover:tw-border-blue-200 hover:tw-text-blue-700
                            active:tw-bg-blue-100 active:tw-border-blue-300 active:tw-text-blue-900
                            transition-all tw-duration-300" >
                  <span className="tw-font-medium">{expanded ? "Thu gọn" : "Xem tất cả"}</span>
                  <i className={`fa-solid ${
                      expanded ? "fa-angle-up" : "fa-angle-down"
                    } tw-transition-transform tw-duration-300`}
                  ></i>
                </button>
              </div>
            </div>
          </div>


          {/* Miễn trừ trách nhiệm  */}
          <div className="tw-mt-8">
            <div className="tw-bg-gray-50 tw-border tw-border-gray-200 tw-p-4 tw-rounded-lg tw-text-gray-700 tw-text-sm tw-w-full">
              
              {/* Hàng trên: icon + tiêu đề */}
              <div className="tw-flex tw-items-center tw-gap-2 tw-mb-2">
                <i className="fa-solid fa-circle-exclamation tw-text-[#fd8206] tw-text-2xl"></i>
                <p className="tw-font-semibold tw-text-2xl tw-text-black tw-uppercase">Miễn trừ trách nhiệm</p>
              </div>

              {/* Nội dung bên dưới */}
              <p className="tw-text-gray-600 tw-text-left">
                Thông tin này chỉ có tính tham khảo, không dùng để thay thế ý kiến tham
                vấn của chuyên viên Y tế. Người bệnh cần được bác sĩ thăm khám, chẩn đoán
                và điều trị trực tiếp. Bác sĩ tư vấn:{" "}
                <span className="tw-font-semibold tw-text-blue-500">1800 6928</span>
              </p>
            </div>
          </div>


        </div>

      </div>

      {/* Modal yêu cầu tư vấn*/}
      <RequestConsultationModal show={showModal} onClose={() => setShowModal(false)}   vaccine={data}   />

    </div>
  );
}
