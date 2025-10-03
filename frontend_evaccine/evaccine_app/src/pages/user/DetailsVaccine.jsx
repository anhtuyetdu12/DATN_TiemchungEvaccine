import { useState, useRef, useEffect } from "react";
import { useParams } from "react-router-dom";
import RequestConsultationModal from "./modal/DetailVaccine/RequestConsultationModal";


// Scroll spy
  const sections = [
    { id: "gioithieu", title: "Giới thiệu" },
    { id: "benhly", title: "Thông tin bệnh lý" },
    { id: "lichtiem", title: "Phác đồ lịch tiêm" },
    { id: "chongchidinh", title: "Chống chỉ định" },
    { id: "tuongtac", title: "Tương tác" },
    { id: "phunu", title: "Lưu ý cho thai phụ" },
    { id: "hoantiem", title: "Hoãn tiêm" },
    { id: "khac", title: "Khác" },
  ];

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

   // Scroll spy
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        });
      },
      {
        root: null, // viewport
        rootMargin: "0px 0px -50% 0px", // khi section chiếm hơn 50% viewport
        threshold: 0,
      }
    );

    Object.values(sectionRefs.current).forEach((el) => {
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  // Lấy vị trí sidebar để sticky
  useEffect(() => {
    if (sidebarRef.current) {
      const rect = sidebarRef.current.getBoundingClientRect();
      setSidebarTop(rect.top + window.scrollY);
    }
  }, []);

  // Sticky sidebar
  useEffect(() => {
    const handleScroll = () => {
      setIsSticky(window.scrollY >= sidebarTop - 100); // offset navbar 100px
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [sidebarTop]);

  const scrollToSection = (id) => {
    if (!expanded) setExpanded(true);
    setActiveSection(id);

    const section = sectionRefs.current[id];
    if (section && contentRef.current) {
      const container = contentRef.current;
      const sectionTop = section.offsetTop;
      container.scrollTo({
        top: sectionTop - 10,
        behavior: "smooth",
      });
    }
  };

  return (
    <div className="tw-bg-gray-100 tw-min-h-screen  tw-py-[150px]">
      <div className="tw-max-w-[1100px] tw-mx-auto tw-px-5">
        {/* Khung thông tin sản phẩm */}
        <div className="tw-bg-white tw-rounded-2xl tw-shadow-md tw-p-8 tw-mb-8">
          <div className="tw-flex tw-gap-8">
            {/* Ảnh */}
            <div className="tw-w-1/3">
              <img  src="/images/vac1.jpg" alt="Vắc xin" className="tw-rounded-xl tw-shadow tw-w-full tw-object-contain"/>
                <p className="tw-text-base tw-text-gray-700  tw-bg-gray-200 tw-rounded-full tw-inline-block tw-px-4 tw-py-1 tw-mt-5">
                    Mẫu mã sản phẩm có thể thay đổi theo lô hàng
                </p>
            </div>

            {/* Nội dung */}
            <div className="tw-w-2/3 tw-text-left tw-ml-5  tw-space-y-5">
                <div className="tw-border-b tw-border-dashed tw-border-gray-300 tw-pb-3 tw-mb-8 tw-space-y-3">
                    <p className="tw-text-2xl tw-text-[#2b9efc] tw-font-semibold">  Phòng Sốt xuất huyết </p>
                    <h2 className="tw-text-[30px] tw-font-semibold"> Vắc xin Influvac Tetra {slug} </h2>
                    <p className="tw-text-[30px] tw-text-[#fd8206] tw-font-bold tw-pb-12">
                        333.000VNĐ  <span className="tw-text-2xl tw-text-gray-500 tw-font-medium">/ Liều</span>
                    </p>
                </div>


                {/* Thông tin vắc xin */}
                <div className="tw-grid tw-grid-cols-[200px_1fr] tw-gap-y-3 tw-gap-x-[10px] tw-text-black tw-text-[16px] tw-mt-4 tw-text-xl">
                    <div className="tw-font-medium tw-text-gray-500">Đơn vị</div>
                    <div>
                        <button  className="tw-relative tw-flex tw-items-center tw-justify-center tw-rounded-full tw-border
                         tw-border-[#47b8fa] tw-bg-white tw-px-6 tw-py-2 tw-text-gray-800 tw-font-medium tw-min-w-[90px] tw-overflow-hidden"
                            aria-label="Chip Selection"  aria-pressed="true" >
                            <p className="tw-mx-1 tw-leading-[14px] tw-text-gray-800">Liều</p>
                            {/* Góc gập */}
                            <span
                            className="tw-absolute tw-right-[-1px] tw-top-[-1px] tw-w-[23px] tw-h-[23px] tw-bg-[#47b8fa]"
                            style={{ clipPath: "polygon(100% 0px, 0px 0px, 100% 100%)" }}
                            >
                            <i className="fa-solid fa-check tw-text-white tw-text-[10px] tw-absolute tw-right-[4px] tw-top-[4px]"></i>
                            </span>
                        </button>
                    </div> 
                    <div className="tw-font-medium tw-text-gray-500">Đối tượng tiêm</div>
                    <div>Trẻ ≥ 6 tháng và người lớn</div>
                    <div className="tw-font-medium tw-text-gray-500">Nước sản xuất</div>
                    <div>Hà Lan</div>
                    <div className="tw-font-medium tw-text-gray-500">Nhà sản xuất</div>
                    <div>Abbott</div>
                </div>



            {/* Mô tả */}
            <p className="tw-text-gray-900 tw-mt-5 tw-leading-relaxed tw-text-justify tw-text-xl">
            Vắc xin Qdenga (Đức) là vắc xin sống giảm độc lực, được chỉ định tiêm cho trẻ em từ 4 tuổi trở lên và người 
            lớn khoẻ mạnh nhằm phòng ngừa bệnh sốt xuất huyết. Vắc xin này giúp tạo miễn dịch chủ động đối với tất cả 4 
            tuýp virus Dengue và giảm nguy cơ biến chứng nặng của bệnh.
            </p>

            {/* Nút */}
           
          <div className="tw-flex tw-gap-4 tw-mt-6 tw-w-full">
            <button onClick={() => setShowModal(true)} className="tw-flex-1 tw-bg-pink-100 tw-text-pink-700 tw-font-medium tw-py-4 tw-text-[18px] tw-rounded-full hover:tw-bg-pink-200">
              Yêu cầu tư vấn
            </button>
            <button className="tw-flex-1 tw-bg-blue-600 tw-text-white tw-font-medium tw-py-4 tw-text-[18px] tw-rounded-full hover:tw-bg-blue-500">
              Đặt hẹn
            </button>
          </div>


            </div>
          </div>
        </div>

        {/* Khung trắng bao quanh nội dung + sidebar */}
        <div className="tw-bg-white tw-rounded-2xl tw-shadow-md tw-p-6 tw-mb-8">

         {/* Sidebar + Nội dung */}
          <div className="tw-flex tw-gap-6">
            <div className="tw-w-1/3" ref={sidebarRef}>
              <ul className={`tw-space-y-2 tw-text-gray-700 tw-font-medium tw-cursor-pointer tw-text-left ${ isSticky ? "tw-sticky tw-top-[100px]" : "" }`} >
                {sections.map((sec) => (
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

            <div className="tw-w-2/3 tw-space-y-6 tw-text-left tw-h-[600px] tw-overflow-y-auto" ref={contentRef}>
              {sections.map((sec) => (
                <div key={sec.id} id={sec.id}
                  ref={(el) => (sectionRefs.current[sec.id] = el)}
                  className={`${!expanded && sec.id !== "gioithieu" ? "tw-hidden" : ""} tw-expandable`}>
                  <h3 className="tw-text-2xl tw-font-bold tw-mb-3">{sec.title}</h3>
                  <p className="tw-text-gray-700 tw-leading-relaxed">
                    Nội dung chi tiết của mục {sec.title}...
                  </p>
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
      <RequestConsultationModal show={showModal} onClose={() => setShowModal(false)} />

    </div>
  );
}
