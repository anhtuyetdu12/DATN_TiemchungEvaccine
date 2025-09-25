// Danh mục vaccine
import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import AccordionFilter from "../../components/AccordionFilter"

export default function VaccinesList() {
  const banners = [
    "/images/banner1.jpg",
    "/images/banner2.jpg",
    "/images/banner3.jpg",
    "/images/banner4.jpg",
    "/images/banner5.jpg",
  ];

  const [currentIndex, setCurrentIndex] = useState(0);
    //tab
  const [activeTab, setActiveTab] = useState("vacxin");

  const vaccines = [
    { img: "/images/sun1.jpg", title: "Vắc xin phòng Cúm" },
    { img: "/images/vaccine-sxh.png", title: "Vắc xin phòng Sốt xuất huyết" },
    { img: "/images/vaccine-4in1.png", title: "Vắc xin 4 trong 1" },
    { img: "/images/vaccine-6in1.png", title: "Vắc xin 6 trong 1" },
    { img: "/images/vaccine-ho-ga.png", title: "Vắc xin Bạch hầu Ho gà Uốn ván" },
    { img: "/images/vaccine-rota.png", title: "Vắc xin Tiêu chảy do Rota virus" },
    { img: "/images/vaccine-nhatban.png", title: "Vắc xin Viêm não Nhật Bản" },
    { img: "/images/vaccine-phecau.png", title: "Vắc xin Phế cầu" },
    { img: "/images/vaccine-6in1.png", title: "Vắc xin 6 trong 1" },
    { img: "/images/vaccine-ho-ga.png", title: "Vắc xin Bạch hầu Ho gà Uốn ván" },
    { img: "/images/vaccine-rota.png", title: "Vắc xin Tiêu chảy do Rota virus" },
    { img: "/images/vaccine-nhatban.png", title: "Vắc xin Viêm não Nhật Bản" },
    { img: "/images/vaccine-phecau.png", title: "Vắc xin Phế cầu" },
    { img: "/images/vaccine-extra.png", title: "Vắc xin Extra" },
  ];

  const [showAll, setShowAll] = useState(false);

  // Giới hạn hiển thị 8 phần tử nếu chưa showAll
  const displayedVaccines = showAll ? vaccines : vaccines.slice(0, 8);

  // check
   const [checked, setChecked] = useState(false);

   // dropdown
  const [openIndex, setOpenIndex] = useState(null);   // theo dõi dropdown nào đang mở
  const [selectedItems, setSelectedItems] = useState({}); // lưu lựa chọn từng vaccine

  const toggleDropdown = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  const handleSelect = (index, item) => {
    setSelectedItems((prev) => ({ ...prev, [index]: item }));
    setOpenIndex(null); // đóng dropdown sau khi chọn
  };
  const vaccines_dropdown = [
    {
      name: "Phòng bệnh Sởi - Quai bị - Rubella",
      options: [
        "Bỉ - VẮC XIN SYNFLORIX INJ 0.5ML",
        "Pháp - VẮC XIN PREVENAR 13",
        "Mỹ - VẮC XIN PNEUMOVAX 23",
      ],
    },
    {
      name: "Phòng bệnh Cúm",
      options: [
        "Mỹ - FLUZONE",
        "Nhật - INFLUVAC",
      ],
    },
    {
      name: "Phòng bệnh Viêm gan B",
      options: [
        "Hàn Quốc - ENGERIX B",
        "Mỹ - RECOMBIVAX HB",
        "Cuba - HEPLISAV-B",
      ],
    },
    {
      name: "Phòng bệnh Thủy đậu",
      options: [
        "Mỹ - VARIVAX",
        "Hàn Quốc - VARILRIX",
      ],
    },
    {
      name: "Phòng bệnh Viêm não Nhật Bản",
      options: [
        "Nhật - IMOJEV",
        "Việt Nam - JEVAX",
      ],
    },
    {
      name: "Phòng bệnh Ung thư cổ tử cung (HPV)",
      options: [
        "Mỹ - GARDASIL",
        "Mỹ - CERVARIX",
      ],
    },
    {
      name: "Phòng bệnh Bạch hầu - Ho gà - Uốn ván",
      options: [
        "Pháp - TETRAXIM",
        "Mỹ - DAPTACEL",
        "Bỉ - INFANRIX",
      ],
    },
    {
      name: "Phòng bệnh Viêm màng não mô cầu",
      options: [
        "Mỹ - MENVEO",
        "Anh - NIMENRIX",
      ],
    },
  ];
  
  // Mảng tĩnh giả lập danh mục
  // const [categories, setCategories] = useState([]);
  // const [selected, setSelected] = useState([]); // mảng ID được chọn
  
  // // Toggle chọn/bỏ chọn
  // const toggleCategory = (id) => {
  //   setSelected((prev) =>
  //     prev.includes(id)
  //       ? prev.filter((item) => item !== id)
  //       : [...prev, id]
  //   );
  // };
  // useEffect(() => {
  //   // Gọi API lấy danh mục
  //   fetch("http://localhost:3000/api/categories")
  //     .then((res) => res.json())
  //     .then((data) => setCategories(data))
  //     .catch((err) => console.error(err));
  // }, []);


  // dữ liệu tĩnh cho 3 nhóm
  const ageOptions = [
    { id: "all", label: "Tất cả" },
    { id: "0-6", label: "Từ 0 đến < 6 tháng tuổi" },
    { id: "6-12", label: "Từ 6 đến < 12 tháng tuổi" },
    { id: "12-24", label: "Từ 12 đến < 24 tháng tuổi" },
    { id: "2-9", label: "Từ 2 tuổi đến < 9 tuổi" },
  ];

  const diseaseOptions = [
    { id: "all", label: "Tất cả" },
    { id: "6in1", label: "6 trong 1" },
    { id: "bh-hg-uv", label: "Bạch hầu, Ho gà, Uốn ván" },
    { id: "4in1", label: "4 trong 1" },
  ];

  const originOptions = [
    { id: "all", label: "Tất cả" },
    { id: "india", label: "Ấn Độ" },
    { id: "belgium", label: "Bỉ" },
    { id: "canada", label: "Canada" },
  ];

  

   
  // Auto slide sau 5s
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % banners.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [banners.length]);

  const prevSlide = () => {
    setCurrentIndex((prev) =>
      prev === 0 ? banners.length - 1 : prev - 1
    );
  };

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % banners.length);
  };
  return (
    <section className="tw-bg-gradient-to-r tw-from-blue-100 tw-to-pink-50 tw-py-10 tw-mt-[100px] ">
      <div className="tw-container tw-mx-auto tw-px-14 ">    
        {/* Banner */}
        <div className="tw-relative tw-w-full tw-h-[200px] tw-overflow-hidden tw-rounded-2xl tw-mb-12">
          <div  className="tw-flex tw-h-full tw-transition-transform tw-duration-700 tw-ease-in-out"
            style={{ transform: `translateX(-${currentIndex * 100}%)` }}>
            {banners.map((src, index) => (
              <img key={index} src={src} alt={`Banner ${index + 1}`}
               className="tw-w-full tw-h-full tw-object-cover tw-flex-shrink-0"/>
            ))}
          </div>

          {/* Nút trái */}
          <button onClick={prevSlide}
            className="tw-absolute tw-top-1/2 -tw-translate-y-1/2 tw-left-3 tw-bg-black/40 tw-text-white tw-p-2 tw-rounded-full hover:tw-bg-black/70">
            <ChevronLeft size={24} />
          </button>

          {/* Nút phải */}
          <button onClick={nextSlide}
            className="tw-absolute tw-top-1/2 -tw-translate-y-1/2 tw-right-3 tw-bg-black/40 tw-text-white tw-p-2 tw-rounded-full hover:tw-bg-black/70">
            <ChevronRight size={24} />
          </button>

          {/* Dấu chấm chỉ số */}
          <div className="tw-absolute tw-bottom-3 tw-w-full tw-flex tw-justify-center tw-space-x-3">
            {banners.map((_, index) => (
              <button key={index} onClick={() => setCurrentIndex(index)}
                className={`tw-w-3 tw-h-3 tw-rounded-full ${
                  index === currentIndex ? "tw-bg-blue-500" : "tw-bg-gray-300"
                }`} />
            ))}
          </div>
        </div>

        <h2 className="tw-text-[32px] tw-font-semibold  tw-text-gray-800 tw-text-left tw-my-[20px]">
            Danh mục vắc xin
        </h2>
        <div className="tw-flex tw-justify-start">
            <div className="tw-inline-flex tw-bg-white tw-rounded-full tw-border tw-border-white tw-overflow-hidden tw-space-x-2 tw-mb-8">
                <button onClick={() => setActiveTab("vacxin")}
                    className={`tw-py-3 tw-px-5 tw-font-medium tw-rounded-full transition ${
                    activeTab === "vacxin" ? "tw-bg-[#1999ee] tw-text-white"
                        : "tw-bg-white tw-text-gray-600 tw-border tw-border-white hover:tw-bg-white"
                    }`}>
                    Vắc xin phòng bệnh
                </button>
                <button onClick={() => setActiveTab("goi")}
                    className={`tw-py-3 tw-px-5 tw-font-medium tw-rounded-full transition ${
                    activeTab === "goi" ? "tw-bg-[#1999ee] tw-text-white"
                        : "tw-bg-white tw-text-gray-600 tw-border tw-border-white hover:tw-bg-white"
                    }`}>
                    Gói vắc xin
                </button>
            </div>
        </div>

        {/* Grid danh mục */}
        {activeTab === "vacxin" ? (
          <div>
            {/* Các danh mục nhỏ */}
            <div class="tw-grid tw-grid-cols-2 md:tw-grid-cols-4 tw-gap-5  tw-pt-10 tw-mb-6">
              {displayedVaccines.map((item, index) => (
                <div key={index} className="tw-bg-white tw-rounded-2xl tw-shadow-sm tw-flex tw-items-center tw-p-4 tw-cursor-pointer hover:tw-shadow-md tw-h-36">
                  <div className="tw-w-1/3 tw-h-full tw-flex tw-items-center tw-justify-center tw-overflow-hidden tw-rounded-2xl">
                    <img src={item.img} alt={item.title} className="tw-w-full tw-h-full tw-object-cover"/>
                  </div>
                  <div className="tw-w-2/3 tw-pl-4">
                    <p className="tw-text-gray-800 tw-text-2xl tw-font-semibold tw-text-left">{item.title}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="tw-flex tw-justify-center tw-mt-6 tw-pb-10">
              <span onClick={() => setShowAll(!showAll)}
                className="tw-flex tw-items-center tw-gap-2 tw-text-blue-500 tw-font-medium tw-cursor-pointer
                          hover:tw-bg-gradient-to-r hover:tw-from-pink-500 hover:tw-to-blue-500 
                          hover:tw-text-transparent hover:tw-bg-clip-text transition-all duration-300" >
                <span>{showAll ? "Thu gọn danh mục" : "Xem tất cả danh mục"}</span>
                <i className={`fa-solid fa-angles-down tw-text-blue-500 tw-transition-transform ${showAll ? "tw-rotate-180" : ""}`}></i>
              </span>
            </div>

            <div className="tw-grid tw-grid-cols-[260px_1fr] tw-gap-5 tw-h-screen tw-pt-5 tw-px-6">

              {/* Bộ lọc bên trái */}
              <div className=" tw-sticky tw-top-5 tw-self-start tw-h-[450px] tw-pr-2">

                <div className=" tw-bg-white tw-rounded-xl tw-shadow-sm tw-text-left tw-h-full tw-flex tw-flex-col ">
                  {/* Header cố định */}
                  <div className="tw-flex tw-h-14 tw-items-center tw-gap-2 tw-border-b tw-border-gray-200 tw-px-4 tw-py-4">
                    <i className="fa-solid fa-filter tw-text-blue-600 tw-text-[18px]"></i>
                    <h3 className="tw-text-blue-600 tw-font-semibold tw-text-[18px]">
                      Bộ lọc vắc xin
                    </h3>
                  </div>
                


                  {/* Phần nội dung cuộn */}
                  <div className="tw-max-h-[calc(100vmin-48px-2*20px-16px)] tw-overflow-auto tw-px-4 tw-scrollbar 
                              [&::-webkit-scrollbar]:tw-w-1" style={{ scrollbarGutter: "stable" }} >

                      <div className="tw-space-y-4">
                      <AccordionFilter title="Độ tuổi" options={ageOptions} />
                      <AccordionFilter title="Phòng bệnh" options={diseaseOptions} />
                      <AccordionFilter
                        title="Nơi sản xuất"
                        options={originOptions}
                        withSearch={true}
                      />
                    </div>
                  </div>

                </div>

              </div>

              {/* Danh sách vắc xin bên phải */}
              <div className="tw-flex tw-flex-col tw-overflow-hidden ">
                  <div className="tw-flex tw-items-center tw-justify-between tw-mb-4">
                      <h3 className="tw-text-3xl tw-font-semibold tw-mb-[5px]">Danh sách vắc xin</h3>                  
                  </div>

                  <div className="tw-grid tw-grid-cols-1 sm:tw-grid-cols-2 lg:tw-grid-cols-4 tw-gap-6">
                      <div className="tw-bg-white tw-rounded-xl tw-shadow-sm tw-p-4 hover:tw-shadow-md tw-transition tw-relative tw-text-left tw-flex tw-flex-col">
                          <img src="/images/vcprevanar.jpg" alt="Prevenar" className="tw-h-80 tw-mx-auto tw-mb-3" />
                          <div class="tw-flex tw-flex-col tw-h-full tw-pt-2 tw-pb-3">
                            <div class="tw-min-h-[80px]">
                              <p className="tw-text-lg tw-text-gray-500 tw-font-medium tw-line-clamp-2 tw-mb-1">Vắc xin Prevenar 13 0.5ml Inj</p>
                              <p className="tw-text-xl tw-text-black tw-font-semibold tw-line-clamp-2 tw-mb-3">Phòng bệnh do Phế cầu</p>
                            </div>
                            <div class="tw-mt-auto">
                              <p className="mb-3 tw-text-[#fd8206] tw-font-semibold tw-text-2xl tw-mb-[15px]">1.180.000đ <span className="tw-text-2xl tw-text-gray-500 tw-font-normal">/Liều</span></p>
                              <button className="tw-w-full tw-mt-3 tw-bg-[#b8def6] tw-text-[#1999ee] tw-font-medium tw-rounded-full tw-py-[8px] hover:tw-bg-[#1999ee] hover:tw-text-white transition">
                                Đặt hẹn
                              </button>
                            </div>
                          </div>  
                      </div>

                      <div className="tw-bg-white tw-rounded-xl tw-shadow-sm tw-p-4 hover:tw-shadow-md tw-transition tw-relative tw-text-left tw-flex tw-flex-col">
                        <img src="/images/vcprevanar.jpg" alt="MenQuadfi" className="tw-h-80 tw-mx-auto tw-mb-3" />
                        <div class="tw-flex tw-flex-col tw-h-full tw-pt-2 tw-pb-3">
                            <div class="tw-min-h-[80px]">
                              <p className="tw-text-lg tw-text-gray-500 tw-font-medium tw-line-clamp-2 tw-mb-1">Vắc xin MenQuadfi</p>
                              <p className="tw-text-xl tw-text-black tw-font-semibold tw-line-clamp-2 tw-mb-3">Phòng bệnh Não mô cầu ACYW</p>
                            </div>
                            <div class="tw-mt-auto">
                              <p className="mb-3 tw-text-[#fd8206] tw-font-semibold tw-text-2xl tw-mb-[15px]">1.800.000đ <span className="tw-text-2xl tw-text-gray-500 tw-font-normal">/Liều</span></p>
                              <button className="tw-w-full tw-mt-3 tw-bg-[#b8def6] tw-text-[#1999ee] tw-font-medium tw-rounded-full tw-py-[8px] hover:tw-bg-[#1999ee] hover:tw-text-white transition">
                                Đặt hẹn
                              </button>
                            </div>
                        </div>  
                      </div>

                    <div className="tw-bg-white tw-rounded-xl tw-shadow-sm tw-p-4 hover:tw-shadow-md tw-transition tw-relative tw-text-left tw-flex tw-flex-col">
                      <img src="/images/vcprevanar.jpg" alt="Influvac" className="tw-h-80 tw-mx-auto tw-mb-3" />
                      <div class="tw-flex tw-flex-col tw-h-full tw-pt-2 tw-pb-3">
                        <div class="tw-min-h-[80px]">
                          <p className="tw-text-lg tw-text-gray-500 tw-font-medium tw-line-clamp-2 tw-mb-1">Vắc xin Influvac Tetra</p>
                          <p className="tw-text-xl tw-text-black tw-font-semibold tw-line-clamp-2 tw-mb-3">Phòng Cúm</p>
                        </div>
                        <div class="tw-mt-auto">
                          <p className="mb-3 tw-text-[#fd8206] tw-font-semibold tw-text-2xl tw-mb-[15px]">350.000đ <span className="tw-text-2xl tw-text-gray-500 tw-font-normal">/Liều</span></p>
                          <button className="tw-w-full tw-mt-3 tw-bg-[#b8def6] tw-text-[#1999ee] tw-font-medium tw-rounded-full tw-py-[8px] hover:tw-bg-[#1999ee] hover:tw-text-white transition">
                            Đặt hẹn
                          </button>
                        </div>
                      </div>  
                    </div>

                      <div className="tw-bg-white tw-rounded-xl tw-shadow-sm tw-p-4 hover:tw-shadow-md tw-transition tw-relative tw-text-left tw-flex tw-flex-col">
                        <img src="/images/vcprevanar.jpg" alt="Gardasil" className="tw-h-80 tw-mx-auto tw-mb-3" />
                        <div class="tw-flex tw-flex-col tw-h-full tw-pt-2 tw-pb-3">
                          <div class="tw-min-h-[80px]">
                            <p className="tw-text-lg tw-text-gray-500 tw-font-medium tw-line-clamp-2 tw-mb-1">Vắc xin Gardasil 9 0.5ml</p>
                            <p className="tw-text-xl tw-text-black tw-font-semibold tw-line-clamp-2 tw-mb-3">Phòng bệnh ung thư do HPV 9 chủng</p>
                          </div>
                          <div class="tw-mt-auto">
                            <p className="mb-3 tw-text-[#fd8206] tw-font-semibold tw-text-2xl tw-mb-[15px]">2.940.000đ <span className="tw-text-2xl tw-text-gray-500 tw-font-normal">/Liều</span></p>
                            <button className="tw-w-full tw-mt-3 tw-bg-[#b8def6] tw-text-[#1999ee] tw-font-medium tw-rounded-full tw-py-[8px] hover:tw-bg-[#1999ee] hover:tw-text-white transition">
                              Đặt hẹn
                            </button>
                          </div>
                        </div> 
                      </div>
                  </div>
              </div>
            </div>
      </div>
         
        ) : (
        <div>
          
          <div className="tw-bg-[#cbf3f8] tw-py-10 tw-my-[10px] tw-rounded-xl">
            <div className="tw-max-w-[1000px] tw-mx-auto px-6 tw-grid tw-grid-cols-1 md:tw-grid-cols-3 tw-gap-20 tw-items-start tw-text-left">
              
              <div className="tw-flex tw-items-center tw-space-x-4">
                <div className="tw-flex-shrink-0">
                  <img src="/images/lg1.jpg" alt="Miễn phí nhắc lịch hẹn" className="tw-w-24 tw-h-24 tw-rounded-full" />
                </div>
                <div>
                  <h3 className="tw-text-2xl tw-mb-1 tw-font-semibold tw-text-gray-900">Miễn phí nhắc lịch hẹn</h3>
                  <p className="tw-text-gray-500 tw-font-medium tw-text-lg">Chính xác và khoa học cho cả gia đình</p>
                </div>
              </div>

              <div className="tw-flex tw-items-center tw-space-x-4">
                <div className="tw-flex-shrink-0">
                  <img src="/images/lg4.jpg" alt="Cam kết giữ giá vắc xin" className="tw-w-24 tw-h-24 tw-rounded-full" />
                </div>
                <div>
                  <h3 className="tw-text-2xl tw-mb-1 tw-font-semibold tw-text-gray-900">Cam kết giữ giá vắc xin</h3>
                  <p className="tw-text-gray-500 tw-font-medium tw-text-lg">Suốt thời gian tiêm theo phác đồ</p>
                </div>
              </div>

              <div className="tw-flex tw-items-center tw-space-x-4">
                <div className="tw-flex-shrink-0">
                  <img src="/images/lg3.jpg" alt="Cam kết luôn đủ vắc xin" className="tw-w-24 tw-h-24 tw-rounded-full" />
                </div>
                <div>
                  <h3 className="tw-text-2xl tw-mb-1 tw-font-semibold tw-text-gray-900">Cam kết luôn đủ vắc xin</h3>
                  <p className="tw-text-gray-500 tw-font-medium tw-text-lg">Không lo hàng khan hiếm</p>
                </div>
              </div>

            </div>
          </div>

          <div className="tw-bg-[#fed8ea] tw-p-[5px] tw-rounded-xl tw-my-10 tw-max-w-full">
            <div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-4 tw-gap-6  tw-mx-auto">
              
              {/* Cột trái - danh sách gói 1/4 */}
              <div className="tw-bg-gray-100 tw-text-left tw-rounded-xl tw-shadow-sm tw-p-4 md:tw-col-span-1">
                
                <ul className="tw-space-y-3 tw-mt-3 tw-max-h-[480px] tw-overflow-y-auto tw-scrollbar-hide">
                  <li>
                    <h3 className=" tw-text-gray-600 tw-font-semibold tw-text-lg tw-text-left tw-px-4 tw-py-3 tw-rounded-t-xl">
                      6 GÓI VẮC XIN THEO ĐỘ TUỔI
                    </h3>
                  </li>

                  <li className="tw-flex tw-items-center tw-gap-[10px] tw-bg-white tw-rounded-xl tw-h-[72px] tw-p-[4px] tw-cursor-pointer
                                tw-border tw-border-transparent hover:tw-border-blue-500 hover:tw-border-[3px]">
                    <img src="/images/be1.jpg" alt="" className="tw-w-[65px] tw-h-[65px]  tw-rounded-lg" />
                    <div>
                      <p className="tw-font-medium tw-text-black">Gói vắc xin 6 tháng</p>
                      <p className="tw-flex tw-items-center tw-w-fit tw-max-w-full tw-gap-1 tw-cursor-pointer 
                                  tw-rounded-full tw-h-6 tw-px-3 tw-text-sm tw-font-medium tw-mt-[3px]
                                  tw-text-white tw-bg-gradient-to-b tw-from-[#ffbb14] tw-to-[#f26f23]">
                        Giảm tới 551.550đ</p>
                    </div>
                  </li>

                  <li className="tw-flex tw-items-center tw-gap-[10px] tw-bg-white tw-rounded-xl tw-h-[72px] tw-p-[4px] tw-cursor-pointer
                                tw-border tw-border-transparent hover:tw-border-blue-500 hover:tw-border-[3px]">
                    <img src="/images/icon-12thang.jpg" alt="" className="tw-w-[65px] tw-h-[65px] tw-rounded-lg" />
                    <div>
                      <p className="tw-font-medium tw-text-black">Gói vắc xin 12 tháng</p>
                      <p className="tw-flex tw-items-center tw-w-fit tw-max-w-full tw-gap-1 tw-cursor-pointer 
                                  tw-rounded-full tw-h-6 tw-px-3 tw-text-sm tw-font-medium tw-mt-[3px]
                                  tw-text-white tw-bg-gradient-to-b tw-from-[#ffbb14] tw-to-[#f26f23]">
                                    Giảm tới 852.660đ</p>
                    </div>
                  </li>

                  <li className="tw-flex tw-items-center tw-gap-[10px] tw-bg-white tw-rounded-xl tw-h-[72px] tw-p-[4px] tw-cursor-pointer
                                tw-border tw-border-transparent hover:tw-border-blue-500 hover:tw-border-[3px]">
                    <img src="/images/icon-12thang.jpg" alt="" className="tw-w-[65px] tw-h-[65px] tw-rounded-lg" />
                    <div>
                      <p className="tw-font-medium tw-text-black">Gói vắc xin 12 tháng</p>
                      <p className="tw-flex tw-items-center tw-w-fit tw-max-w-full tw-gap-1 tw-cursor-pointer 
                                  tw-rounded-full tw-h-6 tw-px-3 tw-text-sm tw-font-medium tw-mt-[3px]
                                  tw-text-white tw-bg-gradient-to-b tw-from-[#ffbb14] tw-to-[#f26f23]">
                                    Giảm tới 852.660đ</p>
                    </div>
                  </li>

                  <li className="tw-flex tw-items-center tw-gap-[10px] tw-bg-white tw-rounded-xl tw-h-[72px] tw-p-[4px] tw-cursor-pointer
                                tw-border tw-border-transparent hover:tw-border-blue-500 hover:tw-border-[3px]">
                    <img src="/images/icon-12thang.jpg" alt="" className="tw-w-[65px] tw-h-[65px] tw-rounded-lg" />
                    <div>
                      <p className="tw-font-medium tw-text-black">Gói vắc xin 12 tháng</p>
                      <p className="tw-flex tw-items-center tw-w-fit tw-max-w-full tw-gap-1 tw-cursor-pointer 
                                  tw-rounded-full tw-h-6 tw-px-3 tw-text-sm tw-font-medium tw-mt-[3px]
                                  tw-text-white tw-bg-gradient-to-b tw-from-[#ffbb14] tw-to-[#f26f23]">
                                    Giảm tới 852.660đ</p>
                    </div>
                  </li>

                  <li className="tw-flex tw-items-center tw-gap-[10px] tw-bg-white tw-rounded-xl tw-h-[72px] tw-p-[4px] tw-cursor-pointer
                                tw-border tw-border-transparent hover:tw-border-blue-500 hover:tw-border-[3px]">
                    <img src="/images/icon-12thang.jpg" alt="" className="tw-w-[65px] tw-h-[65px] tw-rounded-lg" />
                    <div>
                      <p className="tw-font-medium tw-text-black">Gói vắc xin 12 tháng</p>
                      <p className="tw-flex tw-items-center tw-w-fit tw-max-w-full tw-gap-1 tw-cursor-pointer 
                                  tw-rounded-full tw-h-6 tw-px-3 tw-text-sm tw-font-medium tw-mt-[3px]
                                  tw-text-white tw-bg-gradient-to-b tw-from-[#ffbb14] tw-to-[#f26f23]">
                                    Giảm tới 852.660đ</p>
                    </div>
                  </li>

                  <li className="tw-flex tw-items-center tw-gap-[10px] tw-bg-white tw-rounded-xl tw-h-[72px] tw-p-[4px] tw-cursor-pointer
                                tw-border tw-border-transparent hover:tw-border-blue-500 hover:tw-border-[3px]">
                    <img src="/images/icon-12thang.jpg" alt="" className="tw-w-[65px] tw-h-[65px] tw-rounded-lg" />
                    <div>
                      <p className="tw-font-medium tw-text-black">Gói vắc xin 12 tháng</p>
                      <p className="tw-flex tw-items-center tw-w-fit tw-max-w-full tw-gap-1 tw-cursor-pointer 
                                  tw-rounded-full tw-h-6 tw-px-3 tw-text-sm tw-font-medium tw-mt-[3px]
                                  tw-text-white tw-bg-gradient-to-b tw-from-[#ffbb14] tw-to-[#f26f23]">
                                    Giảm tới 852.660đ</p>
                    </div>
                  </li>

                  <li>
                    <h3 className=" tw-text-gray-600 tw-font-semibold tw-text-lg tw-text-left tw-px-4 tw-py-3 tw-rounded-t-xl">
                      3 GÓI VẮC XIN THEO ĐỐI TƯỢNG
                    </h3>
                  </li>

                  <li className="tw-flex tw-items-center tw-gap-[10px] tw-bg-white tw-rounded-xl tw-h-[72px] tw-p-[4px] tw-cursor-pointer
                                tw-border tw-border-transparent hover:tw-border-blue-500 hover:tw-border-[3px]">
                    <img src="/images/icon-18thang.jpg" alt="" className="tw-w-[65px] tw-h-[65px] tw-rounded-lg" />
                    <div>
                      <p className="tw-font-medium tw-text-black">Gói vắc xin 18 tháng</p>
                      <p className="tw-flex tw-items-center tw-w-fit tw-max-w-full tw-gap-1 tw-cursor-pointer 
                                  tw-rounded-full tw-h-6 tw-px-3 tw-text-sm tw-font-medium tw-mt-[3px]
                                  tw-text-white tw-bg-gradient-to-b tw-from-[#ffbb14] tw-to-[#f26f23]">
                                    Giảm tới 923.000đ</p>
                    </div>
                  </li>

                  <li className="tw-flex tw-items-center tw-gap-[10px] tw-bg-white tw-rounded-xl tw-h-[72px] tw-p-[4px] tw-cursor-pointer
                                tw-border tw-border-transparent hover:tw-border-blue-500 hover:tw-border-[3px]">
                    <img src="/images/icon-24thang.jpg" alt="" className="tw-w-[65px] tw-h-[65px] tw-rounded-lg" />
                    <div>
                      <p className="tw-font-medium tw-text-black">Gói vắc xin 24 tháng</p>
                      <p className="tw-flex tw-items-center tw-w-fit tw-max-w-full tw-gap-1 tw-cursor-pointer 
                                  tw-rounded-full tw-h-6 tw-px-3 tw-text-sm tw-font-medium tw-mt-[3px]
                                  tw-text-white tw-bg-gradient-to-b tw-from-[#ffbb14] tw-to-[#f26f23]">
                                    Giảm tới 1.050.000đ</p>
                    </div>
                  </li>

                  <li className="tw-flex tw-items-center tw-gap-[10px] tw-bg-white tw-rounded-xl tw-h-[72px] tw-p-[4px] tw-cursor-pointer
                                tw-border tw-border-transparent hover:tw-border-blue-500 hover:tw-border-[3px]">
                    <img src="/images/icon-36thang.jpg" alt="" className="tw-w-[65px] tw-h-[65px] tw-rounded-lg" />
                    <div>
                      <p className="tw-font-medium tw-text-black">Gói vắc xin 36 tháng</p>
                      <p className="tw-flex tw-items-center tw-w-fit tw-max-w-full tw-gap-1 tw-cursor-pointer 
                                  tw-rounded-full tw-h-6 tw-px-3 tw-text-sm tw-font-medium tw-mt-[3px]
                                  tw-text-white tw-bg-gradient-to-b tw-from-[#ffbb14] tw-to-[#f26f23]">
                                    Giảm tới 1.350.000đ</p>
                    </div>
                  </li>

                  <li className="tw-flex tw-items-center tw-gap-[10px] tw-bg-white tw-rounded-xl tw-h-[72px] tw-p-[4px] tw-cursor-pointer
                                tw-border tw-border-transparent hover:tw-border-blue-500 hover:tw-border-[3px]">
                    <img src="/images/icon-60thang.jpg" alt="" className="tw-w-[65px] tw-h-[65px] tw-rounded-lg" />
                    <div>
                      <p className="tw-font-medium tw-text-black">Gói vắc xin 60 tháng</p>
                      <p className="tw-flex tw-items-center tw-w-fit tw-max-w-full tw-gap-1 tw-cursor-pointer 
                                  tw-rounded-full tw-h-6 tw-px-3 tw-text-sm tw-font-medium tw-mt-[3px]
                                  tw-text-white tw-bg-gradient-to-b tw-from-[#ffbb14] tw-to-[#f26f23]">
                                    Giảm tới 1.850.000đ</p>
                    </div>
                  </li>
                </ul>
              </div>

              {/* Cột phải - chi tiết gói 3/4*/}
              <div className="tw-bg-white tw-box-border tw-rounded-2xl tw-shadow-sm tw-p-0 md:tw-col-span-3 tw-text-left tw-flex tw-flex-col tw-overflow-hidden">
                <div className="tw-w-full tw-text-[22px] tw-font-semibold tw-bg-[#e6f7fa] tw-p-4">
                  Gói vắc xin 12 tháng
                </div>

                {/* Header bảng */}
                <div className="tw-px-6 tw-pt-4">
                  <div className="tw-grid tw-grid-cols-[2fr_1fr_1fr_1fr] tw-gap-4 tw-font-semibold tw-text-gray-700 tw-border-b tw-pb-2">
                    
                    {/* Cột Vắc xin với checkbox */}
                    <div className="tw-flex tw-items-center tw-gap-4">
                      <button type="button" role="checkbox" aria-checked={checked} onClick={() => setChecked(!checked)}
                        className={`tw-w-6 tw-h-6 tw-flex tw-items-center tw-justify-center 
                                    tw-border tw-rounded-md tw-transition-colors tw-duration-150
                                    ${checked ? "tw-bg-blue-500 tw-border-blue-500" : "tw-border-gray-400" }
                                    hover:tw-border-blue-500 hover:tw-ring-2 hover:tw-ring-cyan-400 hover:tw-ring-opacity-40
                                    focus:tw-border-blue-600 focus:tw-ring-2 focus:tw-ring-cyan-400 focus:tw-ring-opacity-40`} >
                          {checked && <i className="fa-solid fa-check tw-text-white tw-text-xs"></i>}
                      </button>
                      <span>Vắc xin</span>
                    </div>
                    <span className="tw-flex tw-items-center tw-justify-center">Phác đồ</span>
                    <span className="tw-flex tw-items-center tw-justify-center">Số lượng</span>
                    <span className="tw-flex tw-items-center tw-justify-end">Đơn giá</span>

                  </div>
                </div>

                {/* Danh sách vaccine */}
              <div className="tw-flex-1 tw-max-h-[300px] tw-px-6 tw-py-4 tw-space-y-4 tw-overflow-y-auto tw-scrollbar-hide">
                {vaccines_dropdown.map((vaccine, index) => (
                  <div key={index} className="tw-grid tw-grid-cols-[2fr_1fr_1fr_1fr] tw-gap-4 tw-items-center 
                              tw-border-b tw-border-dashed tw-pb-5 tw-mb-5">
                    {/* Cột Vaccine */}
                    <div className="tw-flex tw-flex-col tw-gap-4">
                      {/* Label vaccine */}
                      <div className="tw-flex tw-items-center tw-gap-4">
                        <button type="button" role="checkbox" aria-checked={checked} onClick={() => setChecked(!checked)}
                          className={`tw-w-6 tw-h-6 tw-flex tw-items-center tw-justify-center 
                            tw-border tw-rounded-md tw-transition-colors tw-duration-150
                            ${ checked ? "tw-bg-blue-500 tw-border-blue-500" : "tw-border-gray-400" }
                            hover:tw-border-blue-500 hover:tw-ring-2 hover:tw-ring-cyan-400 hover:tw-ring-opacity-40
                            focus:tw-border-blue-600 focus:tw-ring-2 focus:tw-ring-cyan-400 focus:tw-ring-opacity-40`}>
                          {checked && ( <i className="fa-solid fa-check tw-text-white tw-text-xs"></i> )}
                        </button>
                        <p className="tw-font-medium tw-text-black tw-text-xl">
                          {vaccine.name}
                        </p>
                      </div>

                      {/* Dropdown chọn vaccine */}
                      <div className="tw-relative tw-w-full">
                        <button onClick={() => toggleDropdown(index)} className="tw-w-full tw-flex tw-justify-between tw-items-center 
                            tw-border tw-border-gray-300 tw-rounded-lg tw-px-3 tw-py-2 tw-text-gray-700 tw-text-xl
                            hover:tw-border-[#56b6f7] hover:tw-ring-1 hover:tw-ring-[#56b6f7]
                            focus:tw-outline-none focus:tw-border-[#1999ee] focus:tw-ring-2 focus:tw-ring-[#1999ee]/40">
                          <span>{selectedItems[index] || "Chọn vaccine"}</span>
                          <i className={`fa-solid ${ openIndex === index ? "fa-angle-up" : "fa-angle-down"}`} ></i>
                        </button>

                        {/* Dropdown list */}
                        {openIndex === index && (
                          <div className="tw-absolute tw-top-full tw-mt-2 tw-w-full tw-bg-white  
                                          tw-border tw-border-gray-300 tw-rounded-lg tw-shadow-lg tw-py-2 
                                          tw-z-10 tw-text-lg tw-space-y-0.5">
                            {vaccine.options.map((item, i) => (
                              <div key={i} onClick={() => handleSelect(index, item)}
                                className={`tw-flex tw-items-center tw-justify-between tw-px-3 tw-py-2 tw-cursor-pointer ${
                                  selectedItems[index] === item  ? "tw-bg-[#e6f7fa]" : "hover:tw-bg-[#e6f7fa]"  }`} >
                                <span>{item}</span>
                                {selectedItems[index] === item && (
                                  <i className="fa-solid fa-check tw-text-[#1999ee]"></i>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Cột Phác đồ */}
                    <div className="tw-flex tw-items-center tw-justify-center">
                      <span className="tw-text-gray-500 tw-text-center tw-font-normal tw-text-xl">
                        2 Liều
                      </span>
                    </div>

                    {/* Cột Số lượng */}
                    <div className="tw-flex tw-items-center tw-justify-center tw-h-full ">
                      <div className="tw-flex tw-items-center tw-border tw-rounded-lg tw-overflow-hidden tw-w-36 tw-h-12">
                        <button className="tw-w-12 tw-h-14 tw-flex tw-items-center tw-justify-center tw-text-2xl tw-text-gray-600 hover:tw-bg-gray-100">
                          −
                        </button>
                        <span className="tw-flex-1 tw-text-center tw-font-medium tw-text-xl">
                          2
                        </span>
                        <button className="tw-w-12 tw-h-14 tw-flex tw-items-center tw-justify-center tw-text-2xl tw-text-gray-600 hover:tw-bg-gray-100">
                          +
                        </button>
                      </div>
                    </div>

                    {/* Cột Đơn giá */}
                    <div className="tw-text-right">
                      <p className="tw-font-semibold tw-text-xl">1.250.000đ</p>
                      <p className="tw-text-xl tw-line-through tw-text-gray-400">
                        1.350.000đ
                      </p>
                    </div>
                  </div>
                ))}

                 
                 

                
                </div>

               {/* Tổng tiền cố định */}
              <div className="tw-px-6 tw-py-4 tw-border-t tw-grid tw-grid-cols-[3fr_1fr] tw-gap-6 tw-items-start">
                {/* Cột trái */}
                <div>
                  <div className="tw-flex tw-gap-3 tw-mb-[10px]">
                    <button className="tw-bg-gradient-to-r tw-from-[#1999ee] tw-to-[#56b6f7]
                              tw-text-white tw-font-medium tw-rounded-full tw-px-6 tw-py-3
                                tw-transition-all tw-duration-300 tw-shadow-md
                              hover:tw-from-[#1789d4] hover:tw-to-[#3aa9f0] hover:tw-shadow-lg hover:tw-scale-105" >
                      <i className="fa-solid fa-calendar-days tw-mr-5"></i>
                      Đặt hẹn
                    </button>
                    <button className="tw-border tw-border-blue-500 tw-text-blue-500 tw-font-medium tw-rounded-full  tw-px-6 tw-py-3 hover:tw-bg-blue-100">
                      Xem chi tiết gói
                      <i class="fa-solid fa-angles-right tw-ml-3"></i>
                    </button>
                  </div>

                  {/* Nội dung chú thích dưới nút */}
                  <div className="tw-px-6 tw-mt-2 tw-space-y-[5px]">
                    <div className="tw-flex tw-items-center tw-gap-2">
                      <div className="tw-bg-gray-200 tw-rounded-full tw-w-8 tw-h-8 tw-flex tw-items-center tw-justify-center tw-mr-[5px]">
                        <i className="fa fa-lightbulb tw-text-yellow-500"></i>
                      </div>
                      <p className="tw-text-lg tw-text-medium tw-text-gray-600 tw-leading-snug">
                        Quý khách có thể bỏ chọn các Liều đã tiêm để tùy chỉnh gói tiêm phù hợp với nhu cầu.
                      </p>
                    </div>

                    <div className="tw-flex tw-items-center tw-gap-2">
                      <div className="tw-bg-gray-200 tw-rounded-full tw-w-8 tw-h-8 tw-flex tw-items-center tw-justify-center  tw-mr-[5px] tw-flex-shrink-0">
                        <i className="fa fa-lightbulb tw-text-yellow-500"></i>
                      </div>
                      <p className="tw-text-lg tw-text-medium tw-text-gray-600 tw-leading-snug">
                        Giá tạm tính đã bao gồm 10% phí quản lý cho tất cả các mũi, giá thực tế tại trung tâm sẽ rẻ hơn phụ thuộc vào những mũi tiêm ngay không có phí quản lý và giá khuyến mãi tại shop theo từng thời điểm.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Cột phải */}
                <div className="tw-text-right tw-space-y-1">
                  <p className="tw-inline-flex tw-items-center tw-gap-1 tw-cursor-pointer 
                        tw-rounded-full tw-h-6 tw-px-5 tw-text-sm tw-font-medium tw-mb-1
                        tw-text-white tw-bg-gradient-to-b tw-from-[#ffbb14] tw-to-[#f26f23] tw-py-[10px]">
                    Giảm tới 852.660đ
                  </p>
                  <p className="tw-text-2xl tw-font-bold tw-text-gray-800">10.250.000đ</p>
                  <p className="tw-text-gray-400 tw-line-through">11.102.660đ</p>
                </div>
              </div>


              </div>
            </div>


          </div>
        </div>

    
        

        )}

      </div>
    </section>
  );
}
