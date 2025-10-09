// Danh mục vaccine
import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import AccordionFilter from "../../components/AccordionFilter";
import { Link, useNavigate  } from "react-router-dom";
import api from "../../services/axios";
import Pagination from "../../components/Pagination";


export default function VaccinesList() {
  const banners = [
    "/images/banner1.jpg",
    "/images/banner2.jpg",
    "/images/banner3.jpg",
    "/images/banner4.jpg",
    "/images/banner5.jpg",
  ];

  const navigate = useNavigate();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [activeTab, setActiveTab] = useState("vacxin");

  // --- STATE CHO API ---
  const [vaccines, setVaccines] = useState([]);
  const [loading, setLoading] = useState(true);
  // const [vaccineGroups, setVaccineGroups] = useState([]);
  const [vaccinePackages, setVaccinePackages] = useState([]);
  const [vaccineCategories, setVaccineCategories] = useState([]);

   // --- Checkbox + Dropdown + Quantity ---
  const [openIndex, setOpenIndex] = useState(null);
  const [selectedItems, setSelectedItems] = useState({}); 
  const [checkedAll, setCheckedAll] = useState(false);
  const [checkedItems, setCheckedItems] = useState({});

  // --- Hiển thị giới hạn ---
  const [showAll, setShowAll] = useState(false);
  const [displayedVaccines, setDisplayedVaccines] = useState([]);
  const [selectedPackage, setSelectedPackage] = useState(null);


  /// --- Checkbox từng dòng ---
  const toggleCheck = (id) => {
    setCheckedItems((prev) => {
      const newState = { ...prev, [id]: !prev[id] };
      const allChecked = vaccines.every((v) => newState[v.id]);
      setCheckedAll(allChecked);
      return newState;
    });
  };

  // --- Checkbox chọn tất cả ---
  const toggleCheckAll = () => {
  // đảo trạng thái
  const newState = !checkedAll;
  setCheckedAll(newState);

  // cập nhật toàn bộ group trong selectedPackage
  if (selectedPackage) {
    const updated = { ...selectedPackage };
    updated.disease_groups = updated.disease_groups.map((group) => ({
      ...group,
      checked: newState,
    }));
    setSelectedPackage(updated);
  }
};


  const BASE_URL = "http://127.0.0.1:8000";
  
 // --- LẤY DỮ LIỆU TỪ BACKEND ---
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [vaccinesRes, packagesRes, categoriesRes] = await Promise.all([
          api.get("vaccines/vaccines/"),
          api.get("vaccines/packages/"),
          api.get("vaccines/categories/"),
        ]);
        // lấy vắc xin
        const fetchedVaccines = vaccinesRes.data.map((v) => ({
          ...v,
          img: v.image || "/images/no-image.jpg",
          title: v.name,
          quantity: 1,
          disease_name: v.disease?.name || "",
        }));

        //lấy gói vắc xin
        const fetchedPackages = packagesRes.data.map((p) => ({
          id: p.id,
          name: p.name,
          discount: p.discount,
          image: p.image ? `${BASE_URL}${p.image}` : "/images/no-image.jpg",
        }));

        //lấy danh mục vắc xin
        const fetchedCategories = categoriesRes.data.map((c) => ({
          ...c,
          name: c.name,
          image: c.image || "/images/no-image.jpg",
        }));

        setVaccines(fetchedVaccines);
        setDisplayedVaccines(fetchedVaccines); 
        setVaccinePackages(packagesRes.data || []);
        setVaccineCategories(fetchedCategories || []);
      } catch (err) {
        console.error("Lỗi lấy dữ liệu:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (selectedPackage?.disease_groups?.length) {
      const allChecked = selectedPackage.disease_groups.every((g) => g.checked);
      setCheckedAll(allChecked);
    }
  }, [selectedPackage]);

  useEffect(() => {
    const fetchPackage = async () => {
      try {
        const res = await api.get("vaccines/packages/1/");
        const data = res.data;

        // Gắn thêm các giá trị mặc định để hiển thị
        data.disease_groups.forEach((group) => {
          group.checked = true;
          group.selectedVaccine = group.vaccines[0];
          group.quantity = 1;
        });

        setSelectedPackage(data);
      } catch (err) {
        console.error("Lỗi khi lấy dữ liệu gói:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchPackage();
  }, []);
  
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

  // ----- phân trang ----------
  const [page, setPage] = useState(1);
  const perPage = 12;
  // Tính vị trí bắt đầu và kết thúc theo trang
  const startIndex = (page - 1) * perPage;
  const endIndex = startIndex + perPage;
  const paginatedVaccines = vaccines.slice(startIndex, endIndex);
   
  //--- AUTO SLIDE ---
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % banners.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [banners.length]);

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev === 0 ? banners.length - 1 : prev - 1));
  };
  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % banners.length);
  };

  if (loading) return <p className="tw-text-center tw-text-xl">Đang tải dữ liệu...</p>;

  return (
    <section className="tw-bg-gradient-to-r tw-from-blue-100 tw-to-pink-50 tw-py-10 tw-pb-40 ">
      <div className=" tw-container tw-mx-auto tw-px-14 tw-max-w-[1300px] tw-mt-[100px] ">    
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
            <div className="tw-grid tw-grid-cols-2 md:tw-grid-cols-4 tw-gap-5 tw-pt-10 tw-mb-20">
              {(showAll ? vaccineCategories : vaccineCategories.slice(0, 8)).map((category) => (
                <div key={category.id}
                  className="tw-bg-white tw-rounded-2xl tw-shadow-sm tw-flex tw-flex-row tw-items-center tw-p-2 tw-cursor-pointer hover:tw-shadow-md tw-h-36"
                  onClick={() => {
                    const filteredVaccines = vaccines.filter(v => v.category?.id === category.id);
                    setDisplayedVaccines(filteredVaccines);
                  }} >
                  <div className="tw-w-1/3 tw-h-full tw-flex tw-items-center tw-justify-center tw-overflow-hidden tw-rounded-lg">
                    <img src={category.image} alt={category.name} className="tw-w-full tw-h-full tw-object-cover" />
                  </div>

                  <div className="tw-w-2/3 tw-pl-5 tw-flex tw-items-center">
                    <p className="tw-text-gray-800 tw-text-2xl tw-font-semibold tw-text-left">{category.name}</p>
                  </div>
                </div>
              ))}
            </div>

            {vaccineCategories.length > 8 && (
              <div className="tw-flex tw-justify-center tw-mt-6 tw-pb-10">
                <span onClick={() => setShowAll(!showAll)}
                  className="tw-flex tw-items-center tw-gap-2 tw-text-blue-500 tw-font-medium tw-cursor-pointer
                            hover:tw-bg-gradient-to-r hover:tw-from-pink-500 hover:tw-to-blue-500 
                            hover:tw-text-transparent hover:tw-bg-clip-text transition-all duration-300" >
                  <span>{showAll ? "Thu gọn danh mục" : "Xem tất cả danh mục"}</span>
                  <i className={`fa-solid fa-angles-down tw-text-blue-500 tw-transition-transform ${showAll ? "tw-rotate-180" : ""}`}></i>
                </span>
              </div>
             )}
            <div className="tw-grid tw-grid-cols-[260px_1fr] tw-gap-5 tw-min-h-screen tw-pt-5 tw-px-6">

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
                              [&::-webkit-scrollbar]:tw-w-2 [&::-webkit-scrollbar]:tw-h-8 [&::-webkit-scrollbar-thumb]:tw-rounded-full
                            [&::-webkit-scrollbar-track]:tw-bg-gray-100 [&::-webkit-scrollbar-thumb]:tw-bg-gradient-to-b
                            [&::-webkit-scrollbar-thumb]:tw-from-cyan-400 [&::-webkit-scrollbar-thumb]:tw-to-blue-400" style={{ scrollbarGutter: "stable" }} >
                     <div className="tw-space-y-4">
                      <AccordionFilter title="Độ tuổi" options={ageOptions} />
                      <AccordionFilter title="Phòng bệnh" options={diseaseOptions} />
                      <AccordionFilter title="Nơi sản xuất" options={originOptions} withSearch={true} />
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
                     {paginatedVaccines.map((vaccine, index) => (
                      <div key={vaccine.id || index} className="tw-bg-white tw-rounded-xl tw-shadow-sm tw-p-4 hover:tw-shadow-md tw-transition tw-relative tw-text-left tw-flex tw-flex-col tw-whitespace-nowrap">
                        <img src={vaccine.image} alt={vaccine.title} className="tw-h-80 tw-mx-auto tw-mb-3" />
                        <div className="tw-flex tw-flex-col tw-h-full tw-pt-2 tw-pb-3">
                          <div className="tw-min-h-[40px]">
                            <p className="tw-text-xl tw-text-gray-500 tw-font-medium tw-line-clamp-2 tw-mb-1"> {vaccine.title} </p>
                            <p className="tw-text-2xl tw-text-black tw-font-semibold tw-line-clamp-2 tw-mb-3"> {vaccine.disease_name} </p>
                          </div>
                          <div className="tw-mt-auto">
                            <p className="mb-3 tw-text-[#fd8206] tw-font-semibold tw-text-3xl tw-my-[20px]">
                               {/* {(Number(vaccine.price) || 0).toLocaleString("vi-VN", { style: "currency", currency: "VND" })} */}
                               {Number(vaccine.price || 0).toLocaleString("vi-VN")} VNĐ
                               <span className="tw-text-2xl tw-text-gray-500 tw-font-normal" >/{vaccine.unit }</span>
                            </p>
                            <div className="tw-flex tw-gap-2 tw-justify-center">
                              <Link to={`/vaccines/${vaccine.slug}`}
                                className="tw-inline-flex tw-items-center tw-bg-[#ffedcc] tw-text-[#ff6600] tw-font-medium tw-py-2 tw-px-6 tw-rounded-full hover:tw-bg-[#ff6600] hover:tw-text-white" >
                                Xem chi tiết
                              </Link>
                              <button onClick={() => navigate("/bookingform")}
                                className="tw-inline-flex tw-items-center tw-bg-[#abe0ff] tw-text-[#3267fa] 
                                            tw-font-medium tw-py-2 tw-px-6 tw-rounded-full  hover:tw-bg-[#3267fa] hover:tw-text-white">
                                Đặt hẹn
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>

                  ))}
                  </div>

                  {vaccines.length > perPage && (
                    <Pagination
                      page={page}
                      totalItems={vaccines.length}
                      perPage={perPage}
                      onPageChange={setPage}
                    />
                  )}
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
                
                
              {/* <ul className="tw-space-y-6 tw-mt-3 tw-max-h-[480px] tw-overflow-y-auto tw-scrollbar-hide">
                {Object.entries(
                  vaccinePackages.reduce((groups, pkg) => {
                    const groupName = pkg.group_name || "Khác";
                    if (!groups[groupName]) groups[groupName] = [];
                    groups[groupName].push(pkg);
                    return groups;
                  }, {})
                ).map(([groupName, packages]) => (
                  <li key={groupName}>
                    <h3 className="tw-text-gray-600 tw-font-semibold tw-text-lg tw-text-left tw-px-4 tw-py-3 tw-bg-gray-100 tw-rounded-lg">
                      {groupName.toUpperCase()}
                    </h3>

                    <ul className="tw-space-y-3 tw-mt-3">
                      {packages.map((pkg) => (
                        <li key={pkg.id} onClick={() => setSelectedPackage(pkg)}
                          className="tw-flex tw-items-center tw-gap-[10px] tw-bg-white tw-rounded-xl tw-h-[72px] tw-p-[4px] tw-cursor-pointer
                                    tw-border tw-border-transparent hover:tw-border-blue-500 hover:tw-border-[3px]" >
                          <img src={pkg.image}  alt={pkg.name} className="tw-w-[65px] tw-h-[65px] tw-rounded-lg"/>
                          <div> <p className="tw-font-medium tw-text-black">{pkg.name}</p> </div>
                        </li>
                      ))}
                    </ul>

                    
                  </li>
                ))}
              </ul> */}

              <ul className="tw-space-y-6 tw-mt-3 tw-max-h-[480px] tw-overflow-y-auto tw-scrollbar-hide">
                {Object.entries(
                  vaccinePackages.reduce((groups, pkg) => {
                    const groupName = pkg.group_name || "Khác";
                    if (!groups[groupName]) groups[groupName] = [];
                    groups[groupName].push(pkg);
                    return groups;
                  }, {})
                ).map(([groupName, packages]) => (
                  <li key={groupName}>
                    <h3 className="tw-text-gray-600 tw-font-semibold tw-text-lg tw-text-left tw-px-4 tw-py-3 tw-bg-gray-100 tw-rounded-lg">
                      {groupName.toUpperCase()}
                    </h3>

                    <ul className="tw-space-y-3 tw-mt-3">
                      {packages.map((pkg) => (
                        <li key={pkg.id} onClick={() => setSelectedPackage(pkg)}
                          className={`tw-flex tw-items-center tw-gap-[10px] tw-bg-white tw-rounded-xl tw-h-[72px] tw-p-[4px] tw-cursor-pointer
                            tw-border tw-transition-all tw-duration-200
                            ${ selectedPackage?.id === pkg.id
                                ? "tw-border-[#3bd3f6] tw-border-[2px]"
                                : "tw-border-transparent hover:tw-border-[#3bd3f6] hover:tw-border-[2px]"
                            }`} >
                          <img src={pkg.image} alt={pkg.name} className="tw-w-[65px] tw-h-[65px] tw-rounded-lg" />
                          <div>
                            <p className="tw-font-medium tw-text-black">{pkg.name}</p>
 
                          </div>
                        </li>
                      ))}
                    </ul>

                    
                  </li>
                ))}
              </ul>



              </div>

              {/* Cột phải - chi tiết gói 3/4*/}
              <div className="tw-bg-white tw-box-border tw-rounded-2xl tw-shadow-sm tw-p-0 md:tw-col-span-3 tw-text-left tw-flex tw-flex-col tw-overflow-hidden">
                <div className="tw-w-full tw-text-[22px] tw-font-semibold tw-bg-[#e6f7fa] tw-p-4">
                  {selectedPackage ? selectedPackage.name : "Chọn gói vaccine"}
                </div>

                {/* Header bảng */}
                <div className="tw-px-6 tw-pt-4">
                  <div className="tw-grid tw-grid-cols-[2fr_1fr_1fr_1fr] tw-gap-4 tw-font-semibold tw-text-gray-700 tw-border-b tw-pb-2">
                    
                    {/* Cột Vắc xin với checkbox */}
                    <div className="tw-flex tw-items-center tw-gap-4">
                      <button type="button"  role="checkbox"
                          aria-checked={checkedAll} onClick={toggleCheckAll}
                          className={`tw-w-8 tw-h-8 tw-flex tw-items-center tw-justify-center 
                            tw-border tw-rounded-md tw-transition-colors tw-duration-150
                            ${checkedAll ? "tw-bg-blue-500 tw-border-blue-500" : "tw-border-gray-400" }
                            hover:tw-border-blue-500 hover:tw-ring-2 hover:tw-ring-cyan-400 hover:tw-ring-opacity-40`}>
                          {checkedAll && <i className="fa-solid fa-check tw-text-white tw-text-lg"></i>}
                        </button>
                      <span>Vắc xin</span>
                    </div>
                    <span className="tw-flex tw-items-center tw-justify-center">Phác đồ</span>
                    <span className="tw-flex tw-items-center tw-justify-center">Số lượng</span>
                    <span className="tw-flex tw-items-center tw-justify-end">Đơn giá</span>

                  </div>
                </div>



            {/* DANH SÁCH CHI TIẾT GÓI */}
            <div className="tw-flex-1 tw-max-h-[500px] tw-overflow-y-auto tw-scrollbar-hide tw-px-6 tw-py-4 tw-space-y-4">
              {selectedPackage?.disease_groups?.map((group, groupIndex) => {
                const key = `group-${groupIndex}`;
                const selectedVaccine = selectedItems[key] || group.selectedVaccine || group.vaccines?.[0];

                return (
                  <div key={group.id || groupIndex}
                    className="tw-grid tw-grid-cols-[2fr_1fr_1fr_1fr] tw-gap-4 tw-items-center tw-border-b tw-border-dashed tw-pb-4">
                    {/* --- Cột 1: Checkbox + Tên phòng bệnh + Dropdown vaccine --- */}
                    <div className="tw-flex tw-items-center tw-gap-4">
                      <button type="button" role="checkbox" aria-checked={group.checked}
                        onClick={() => {
                          const updated = { ...selectedPackage };
                          updated.disease_groups[groupIndex].checked = !group.checked;
                          setSelectedPackage(updated);
                        }} className={`tw-min-w-[20px] tw-min-h-[20px] tw-flex tw-items-center tw-justify-center 
                          tw-border tw-rounded-md tw-transition-colors tw-duration-150 tw-mr-2 tw-px-2
                          ${group.checked ? "tw-bg-blue-500 tw-border-blue-500" : "tw-border-gray-400"}
                          hover:tw-border-blue-500 hover:tw-ring-2 hover:tw-ring-cyan-400 hover:tw-ring-opacity-40`} >
                        {group.checked && <i className="fa-solid fa-check tw-text-white tw-text-lg"></i>}
                      </button>

                      <div className="tw-flex tw-flex-col tw-gap-2 tw-w-full">
                        {/* Tên phòng bệnh */}
                        <span className="tw-font-semibold tw-text-gray-800 tw-text-[14px]">
                          {group.disease?.name || "Không rõ tên bệnh"}
                        </span>

                        {/* Dropdown chọn vaccine */}
                        <div className="tw-relative">
                          <button onClick={() => setOpenIndex(openIndex === key ? null : key)}
                            className="tw-w-full tw-flex tw-justify-between tw-items-center 
                              tw-border tw-border-gray-300 tw-rounded-lg tw-px-3 tw-py-2 
                              tw-text-gray-700 tw-bg-white tw-hover:border-[#56b6f7] tw-hover:ring-1 tw-hover:ring-[#56b6f7]" >
                            <span>
                              {selectedVaccine?.origin_country
                                ? `${selectedVaccine.manufacturer} - ${selectedVaccine.name}`
                                : selectedVaccine?.name || "Chọn vắc xin"}
                            </span>
                            <i className={`fa-solid ${ openIndex === key ? "fa-angle-up" : "fa-angle-down" }`} ></i>
                          </button>

                          {openIndex === key && (
                            <div className="tw-absolute tw-top-full tw-mt-2 tw-w-full tw-bg-white tw-border tw-border-gray-200 tw-rounded-lg tw-shadow-lg tw-z-10">
                              {group.vaccines?.map((vaccine) => (
                                <div key={vaccine.id}
                                  onClick={() => {
                                    const updated = { ...selectedPackage };
                                    updated.disease_groups[groupIndex].selectedVaccine = vaccine;
                                    updated.disease_groups[groupIndex].quantity = 1;
                                    setSelectedPackage(updated);
                                    setSelectedItems((prev) => ({ ...prev, [key]: vaccine }));
                                    setOpenIndex(null);
                                  }}
                                  className={`tw-px-4 tw-py-2 tw-flex tw-justify-between tw-items-center tw-cursor-pointer ${
                                    selectedVaccine?.id === vaccine.id
                                      ? "tw-bg-[#e6f7fa]"
                                      : "hover:tw-bg-[#f2faff]"
                                  }`} >
                                  <div className="tw-flex tw-flex-col">
                                    <span className="tw-font-normal">
                                      {vaccine.origin
                                        ? `${vaccine.origin} - ${vaccine.name}`
                                        : vaccine.name}
                                    </span>
                                  </div>
                                  {selectedVaccine?.id === vaccine.id && (
                                    <i className="fa-solid fa-check tw-text-[#1999ee]"></i>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* --- Cột 2: Phác đồ --- */}
                    <div className="tw-flex tw-items-center tw-justify-center tw-text-gray-600 tw-text-[14px]">
                      {selectedVaccine?.doses_required  ? `${selectedVaccine.doses_required} liều` : "-"}
                    </div>

                   {/* --- Cột 3: Số lượng --- */}
                  <div className="tw-flex tw-items-center tw-justify-center">
                    <div className="tw-flex tw-items-center tw-justify-between tw-border tw-border-gray-300 
                                    tw-rounded-full tw-w-[100px] tw-bg-white tw-shadow-sm tw-overflow-hidden">
                      
                      {/* Nút trừ */}
                      <button onClick={() => {
                          const updated = { ...selectedPackage };
                          const current = updated.disease_groups[groupIndex].quantity;
                          updated.disease_groups[groupIndex].quantity =
                            current > 1 ? current - 1 : 1;
                          setSelectedPackage(updated);
                        }} disabled={(group.quantity || 1) <= 1}
                        className={`tw-w-10 tw-h-10 tw-flex tw-items-center tw-justify-center tw-rounded-full tw-transition-all tw-duration-200
                          ${(group.quantity || 1) <= 1
                            ? "tw-bg-gray-200 tw-text-gray-400 tw-cursor-not-allowed"
                            : "tw-bg-gradient-to-r tw-from-[#56b6f7] tw-to-[#1999ee] hover:tw-from-[#3aa9f0] hover:tw-to-[#1789d4] tw-text-white"
                          }`} >
                        <i className="fa-solid fa-minus"></i>
                      </button>

                      {/* Input */}
                      <input type="number" value={group.quantity || 1}
                        min={1} max={selectedVaccine?.doses_required || 1}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          const updated = { ...selectedPackage };
                          updated.disease_groups[groupIndex].quantity = Math.min(
                            val, selectedVaccine?.doses_required || 1 );
                          setSelectedPackage(updated);
                        }} className="tw-w-14 tw-h-10 tw-text-center tw-border-none tw-font-semibold 
                                  tw-text-gray-800 focus:tw-outline-none tw-bg-transparent" />

                      {/* Nút cộng */}
                      <button onClick={() => {
                          const updated = { ...selectedPackage };
                          const current = updated.disease_groups[groupIndex].quantity;
                          const max = selectedVaccine?.doses_required || 1;
                          updated.disease_groups[groupIndex].quantity =
                            current < max ? current + 1 : max;
                          setSelectedPackage(updated);
                        }}
                        disabled={(group.quantity || 1) >= (selectedVaccine?.doses_required || 1)}
                        className={`tw-w-10 tw-h-10 tw-flex tw-items-center tw-justify-center tw-rounded-full tw-transition-all tw-duration-200
                          ${(group.quantity || 1) >= (selectedVaccine?.doses_required || 1)
                            ? "tw-bg-gray-200 tw-text-gray-400 tw-cursor-not-allowed"
                            : "tw-bg-gradient-to-r tw-from-[#56b6f7] tw-to-[#1999ee] hover:tw-from-[#3aa9f0] hover:tw-to-[#1789d4] tw-text-white"
                          }`} >
                        <i className="fa-solid fa-plus"></i>
                      </button>
                    </div>
                  </div>

                    {/* --- Cột 4: Đơn giá --- */}
                    <div className="tw-flex tw-flex-col tw-items-end">
                      <span className="tw-text-[#fd8206] tw-font-semibold tw-text-[14px]">
                        {selectedVaccine?.price ? `${Number(selectedVaccine.price).toLocaleString("vi-VN")} VNĐ` : "—"}
                      </span>
                      {selectedVaccine?.original_price && (
                        <span className="tw-text-gray-400 tw-line-through">
                          {Number(selectedVaccine.original_price).toLocaleString("vi-VN")} VNĐ
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

               {/* Tổng tiền cố định */}
              <div className="tw-px-6 tw-py-4 tw-border-t tw-grid tw-grid-cols-[3fr_1fr] tw-gap-6 tw-items-start">
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
                      <i className="fa-solid fa-angles-right tw-ml-3"></i>
                    </button>
                  </div>

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
