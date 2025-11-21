import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
// import ChatWidget from "../../components/ChatWidget";
import { getPublicKnowledgeArticles } from "../../services/knowledgeService";
import { getAllVaccines, getAllDiseases } from "../../services/vaccineService";

export default function Home() {
  const [activeTab, setActiveTab] = useState(null);
  const [diseaseTabs, setDiseaseTabs] = useState([]);
  const [showMore, setShowMore] = useState(false);
  const navigate = useNavigate();
  const [knowledgePosts, setKnowledgePosts] = useState([]);
  const [loadingKnowledge, setLoadingKnowledge] = useState(true);
  const [loadingSeason, setLoadingSeason] = useState(true); 

  // ===== LOAD BÀI VIẾT KIẾN THỨC PUBLIC =====
  useEffect(() => {
    const loadKnowledge = async () => {
      try {
        setLoadingKnowledge(true);
        const [featured, latest] = await Promise.all([
          getPublicKnowledgeArticles({ visibility: "featured", limit: 5 }),
          getPublicKnowledgeArticles({ limit: 10 }),
        ]);
        let list = featured && featured.length > 0 ? featured : latest || [];
        list = list.slice(0, 5);
        setKnowledgePosts(list);
      } catch (err) {
        console.error("Load knowledge for Home failed", err);
      } finally {
        setLoadingKnowledge(false);
      }
    };
    loadKnowledge();
  }, []);

  // ===== LOAD DS VẮC XIN / BỆNH (CHO MÙA NÀY TIÊM GÌ) =====
  useEffect(() => {
    const loadSeasonData = async () => {
      try {
        setLoadingSeason(true);
        const [vaccines, diseases] = await Promise.all([
          getAllVaccines(),
          getAllDiseases(),
        ]);

        const vaccineList = Array.isArray(vaccines)
          ? vaccines
          : Array.isArray(vaccines?.results)
          ? vaccines.results
          : [];

        const diseaseList = Array.isArray(diseases)
          ? diseases
          : Array.isArray(diseases?.results)
          ? diseases.results
          : [];

        const tabs = diseaseList
          .map((d, index) => {
            const vaccinesOfDisease = vaccineList.filter((v) => {
              const dis = v.disease || {};
              return (
                (dis.slug && dis.slug === d.slug) ||
                (dis.name && dis.name === d.name)
              );
            });

            // Tạo key luôn có giá trị và duy nhất
            const tabKey =
              d.slug || (d.id ? `disease-${d.id}` : `disease-index-${index}`);

            return {
              key: tabKey,
              title: d.name,
              icon: d.icon || "💉",
              disease: d,
              vaccines: vaccinesOfDisease,
            };
          })
          .filter((t) => t.vaccines.length > 0)
          .slice(0, 5);

        setDiseaseTabs(tabs);
        if (tabs.length > 0) setActiveTab(tabs[0].key);
      } catch (err) {
        console.error("Load season vaccines failed", err);
      } finally {
        setLoadingSeason(false);
      }
    };
    loadSeasonData();
  }, []);

  // ===== UTIL =====
  const shortText = (text = "", len = 120) =>
    text.length > len ? text.slice(0, len - 3) + "..." : text;

  const formatDate = (iso) => {
    if (!iso) return "";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "";
    return d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
  };

  const getInitials = (title = "") => {
    const parts = title.trim().split(" ");
    if (parts.length === 0) return "KV";
    if (parts.length === 1) return parts[0][0]?.toUpperCase() || "K";
    return (parts[0][0] || "").toUpperCase() + (parts[parts.length - 1][0] || "").toUpperCase();
  };

  // ===== CARD VACCINE =====
  const renderSeasonCard = (vaccine) => {
    const origin = (vaccine.origin || "").trim();
    const priceNumber = typeof vaccine.price === "number" ? vaccine.price : Number(vaccine.price || 0);
    const price = priceNumber.toLocaleString("vi-VN");
    const unit = vaccine.unit || "Liều";
    const slug = vaccine.slug;
    const diseaseName = vaccine.disease?.name || "";

    return (
      <div key={vaccine.id} className="tw-flex-none tw-w-[230px] tw-h-[360px] tw-bg-white tw-rounded-xl tw-p-[15px] tw-shadow-md tw-flex tw-flex-col tw-justify-between tw-text-center">
        <span>{origin}</span>
        <img src={vaccine.image || "/images/no-image.jpg"} alt={vaccine.name} className="tw-w-full tw-max-h-[120px] tw-object-contain tw-my-[10px]" />
        <h4 className="tw-font-bold tw-text-[16px] tw-line-clamp-2">{vaccine.name}</h4>
        <p className="tw-text-[14px] tw-text-[#1d7dfc] tw-overflow-hidden tw-text-ellipsis tw-whitespace-nowrap tw-mt-1">
          {diseaseName}
        </p>
        <p className="tw-font-bold tw-text-[#ff6600]">{price}VNĐ / {unit}</p>

        <div className="tw-flex tw-gap-2 tw-justify-center">
          {slug ? (
            <Link to={`/vaccines/${slug}`} className="tw-inline-flex tw-items-center tw-bg-[#ffedcc] tw-text-[#ff6600] tw-font-medium tw-py-2 tw-px-8 tw-rounded-full hover:tw-bg-[#ff6600] hover:tw-text-white">
              Xem chi tiết
            </Link>
          ) : (
            <button disabled className="tw-inline-flex tw-items-center tw-bg-gray-200 tw-text-gray-500 tw-font-medium tw-py-2 tw-px-8 tw-rounded-full">
              Xem chi tiết
            </button>
          )}

          <button onClick={() => navigate("/bookingform")} className="tw-inline-flex tw-items-center tw-bg-[#abe0ff] tw-text-[#3267fa] tw-font-medium tw-py-2 tw-px-8 tw-rounded-full hover:tw-bg-[#3267fa] hover:tw-text-white">
            Đặt hẹn
          </button>
        </div>
      </div>
    );
  };

  // TÍNH TAB ĐANG ACTIVE + TAB HIỆN TẠI 
  const effectiveActiveKey =  activeTab || (diseaseTabs.length > 0 ? diseaseTabs[0].key : null);

  const currentTab = diseaseTabs.find((t) => t.key === effectiveActiveKey) || null;

  return (
    <div>
      {/* ========== ABOUT ========== */}
      <section id="about" className="tw-relative tw-bg-cover tw-bg-center tw-py-36 tw-px-4" style={{ backgroundImage: "url('/images/bac1.jpg')" }}>
        <div className="tw-max-w-7xl tw-mx-auto tw-mt-[100px]">
          <div className="tw-bg-white/40 tw-p-8 md:tw-p-12 tw-rounded-2xl tw-shadow-2xl">
            <h2 className="tw-m-0 tw-text-[40px] tw-font-bold tw-text-[#1a237e] tw-pb-[20px] tw-pt-[10px] tw-tracking-tight tw-text-center">
              Chào mừng đến với hệ thống tiêm chủng <i className="fa fa-medkit tw-text-[#1a237e] tw-ml-2"></i> EVaccine
            </h2>
            <p className="tw-text-black tw-text-[14px] tw-font-normal tw-leading-[24px] tw-mb-8">
              EVaccine giúp bạn quản lý lịch sử tiêm chủng một cách tiện lợi, chính xác và an toàn. Hệ thống hỗ trợ lưu trữ thông tin cá nhân, theo dõi mũi tiêm và nhắc lịch tự động.
              <br />Với EVaccine, việc đặt lịch, tra cứu danh mục vắc xin và cập nhật tin tức y tế trở nên dễ dàng hơn bao giờ hết. Bảo vệ sức khỏe cho bạn và gia đình ngay hôm nay!
            </p>
            <div className="tw-flex tw-justify-center tw-items-center tw-gap-4 tw-mt-6">
              <img src="/images/sy1.jpg" alt="BS Nguyễn Thành An" className="tw-w-[70px] tw-h-[70px] tw-rounded-full tw-object-cover tw-border-2 tw-border-indigo-200 tw-shadow-md" />
              <div>
                <h3 className="tw-text-xl md:tw-text-2xl tw-font-semibold tw-text-indigo-900">BS. Nguyễn Thành An</h3>
                <p className="tw-text-gray-700 tw-text-lg md:tw-text-xl">Chuyên gia tiêm chủng</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ==========  TIÊM CHỦNG + GIỚI THIỆU ========== */}
      <section className="tw-max-w-[1200px] tw-mx-auto tw-my-12 tw-px-4 tw-text-center">
        <div className="tw-grid tw-grid-cols-1 sm:tw-grid-cols-2 md:tw-grid-cols-3 tw-gap-8 tw-my-5">
          <img src="/images/w1.jpg" alt="Tiêm chủng 1" className="tw-w-full tw-h-[250px] tw-object-cover tw-rounded-[15px]" />
          <img src="/images/w2.jpg" alt="Tiêm chủng 2" className="tw-w-full tw-h-[250px] tw-object-cover tw-rounded-[15px]" />
          <img src="/images/w3.jpg" alt="Tiêm chủng 3" className="tw-w-full tw-h-[250px] tw-object-cover tw-rounded-[15px]" />
          <img src="/images/w4.jpg" alt="Tiêm chủng 4" className="tw-w-full tw-h-[250px] tw-object-cover tw-rounded-[15px]" />
          <img src="/images/w5.jpg" alt="Tiêm chủng 5" className="tw-w-full tw-h-[250px] tw-object-cover tw-rounded-[15px]" />
          <img src="/images/w6.jpg" alt="Tiêm chủng 6" className="tw-w-full tw-h-[250px] tw-object-cover tw-rounded-[15px]" />
        </div>

        <div className="tw-text-left">
          <h2 className="tw-text-[28px] tw-font-bold tw-text-indigo-900 tw-py-[20px] tw-text-center">HỆ THỐNG TRUNG TÂM TIÊM CHỦNG EVACCINE</h2>
          <h4 className="tw-text-[18px] tw-font-semibold tw-text-[#8b8b8bff] tw-mb-5 tw-pb-3 tw-text-center">Địa điểm tiêm vắc xin An toàn – Uy tín – Chất lượng cho người dân Việt Nam</h4>
          <p className="tw-text-[16px] tw-leading-[1.6] tw-mb-[15px] tw-text-black tw-text-justify">
            E-Vaccine sở hữu hệ thống quản lý tiêm chủng điện tử hiện đại, giúp người dân và trẻ em dễ dàng tiếp cận nguồn vắc xin chất lượng, minh bạch, giá hợp lý. Hệ thống hỗ trợ lưu trữ hồ sơ tiêm,
            đặt lịch và nhắc lịch tự động, mang lại sự tiện lợi và an toàn tối đa. Với đội ngũ y bác sĩ tận tâm cùng nền tảng công nghệ hiện đại, EVaccine khẳng định vị thế tiên phong trong lĩnh vực
            tiêm chủng điện tử, đảm bảo nguồn cung cấp vắc xin chính hãng, bảo quản đúng chuẩn, đáp ứng nhu cầu chăm sóc sức khỏe cộng đồng ngày càng tăng cao.
          </p>

          {showMore && ( 
            <div className="extra-content tw-space-y-6"> 
              <h3 className="tw-text-[20px] tw-font-bold tw-text-[#1a237e] tw-mb-5 tw-text-left"> 
                EVaccine đảm bảo nguồn cung vắc xin chất lượng cao 
              </h3> 
              <p className="tw-text-[16px] tw-leading-[1.6] tw-mb-[15px] tw-text-black tw-text-justify"> 
                Khẳng định vị thế tiên phong trong lĩnh vực tiêm chủng vắc xin dịch vụ, Hệ thống Trung tâm tiêm chủng EVaccine 
                mang đến nguồn cung vắc xin chính hãng, đa dạng và số lượng lớn, từ các loại vắc xin trong Chương trình Tiêm chủng mở 
                rộng quốc gia đến các loại vắc xin thế hệ mới thường xuyên khan hiếm. Nhờ uy tín vững mạnh và hợp tác chiến lược cùng hầu hết 
                các hãng dược phẩm hàng đầu thế giới, EVaccine đảm bảo nhập khẩu chính hãng, ổn định nguồn cung, đáp ứng nhu cầu tiêm phòng ngày càng tăng. 
              </p> 
              <h3 className="tw-text-[20px] tw-font-bold tw-text-[#1a237e] tw-mb-5 tw-text-left"> 
                Bảo quản vắc xin theo chuẩn Quốc tế 
              </h3> 
              <p className="tw-text-[16px] tw-leading-[1.6] tw-mb-[15px] tw-text-black tw-text-justify"> 
                EVaccine xây dựng và vận hành chuyên nghiệp hệ thống bảo quản vắc xin hiện đại, gồm mạng lưới hàng trăm kho lạnh GSP, cùng hệ thống xe lạnh 
                vận chuyển chuyên dụng. Ngoài ra, EVaccine còn có 3 kho lạnh âm sâu đến -86°C, lưu giữ được hàng triệu liều vắc xin đặc biệt. 
              </p> 
              <h3 className="tw-text-[20px] tw-font-bold tw-text-[#1a237e] tw-mb-5 tw-text-left"> Cam kết quy trình tiêm chủng an toàn </h3> 
              <p className="tw-text-[16px] tw-leading-[1.6] tw-mb-[15px] tw-text-black tw-text-justify"> 
                100% bác sĩ có chứng chỉ An toàn tiêm chủng, 90% điều dưỡng đạt tay nghề cao, cùng phòng xử trí phản ứng sau tiêm đầy đủ trang thiết bị. 
                EVaccine còn vận hành Tổng đài hỗ trợ xử trí phản ứng sau tiêm, mang đến sự an tâm tối đa.
              </p> 
              <h3 className="tw-text-[20px] tw-font-bold tw-text-[#1a237e] tw-mb-5 tw-text-left"> Mức giá hợp lý và nhiều ưu đãi </h3> 
              <p className="tw-text-[16px] tw-leading-[1.6] tw-mb-[15px] tw-text-black tw-text-justify"> 
                Khách hàng được miễn phí khám sàng lọc, hỗ trợ trả phí linh hoạt và hưởng nhiều tiện ích cao cấp như khu vui chơi, phòng mẹ và bé, wifi, nước uống, tã bỉm miễn phí. 
              </p> 
              <h3 className="tw-text-[20px] tw-font-bold tw-text-[#1a237e] tw-mb-5 tw-text-left"> Cơ sở vật chất hiện đại, tiện nghi </h3> 
              <p className="tw-text-[16px] tw-leading-[1.6] tw-mb-[15px] tw-text-black tw-text-justify"> 
                EVaccine cung cấp hệ thống phòng khám, phòng tiêm, phòng theo dõi sau tiêm đạt chuẩn quốc tế. Không gian sạch sẽ, thoáng mát, tiện nghi cho cả trẻ em và người lớn. 
              </p> 
              <h3 className="tw-text-[20px] tw-font-bold tw-text-[#1a237e] tw-mb-5 tw-text-left"> Dịch vụ tiêm chủng đa dạng </h3> 
              <p className="tw-text-[16px] tw-leading-[1.6] tw-mb-[15px] tw-text-black tw-text-justify"> 
                EVaccine cung cấp nhiều dịch vụ tiêm chủng đặc biệt, đáp ứng linh hoạt nhu cầu và chi phí của Khách hàng. 
              </p> 
              {/* Bảng dịch vụ */} 
              <table className="tw-w-full tw-border tw-border-gray-300 tw-mt-6"> 
                <thead> 
                  <tr className="tw-bg-gray-100"> 
                    <th className="tw-border tw-border-[#ccc] tw-p-[12px] tw-align-top tw-text-left"> Dịch vụ Tiêm chủng VIP </th> 
                    <th className="tw-border tw-border-[#ccc] tw-p-[12px] tw-align-top tw-text-left"> Dịch vụ Tiêm chủng Ưu tiên </th> 
                    <th className="tw-border tw-border-[#ccc] tw-p-[12px] tw-align-top tw-text-left"> Dịch vụ Tiêm chủng Lưu động </th> 
                    <th className="tw-border tw-border-[#ccc] tw-p-[12px] tw-align-top tw-text-left"> Dịch vụ Tiêm chủng theo Yêu cầu </th> 
                  </tr> 
                </thead> 
                <tbody> 
                  <tr> 
                    <td className="tw-border tw-border-[#ccc] tw-p-[12px] tw-text-left tw-align-top "> 
                      Mang đến không gian riêng tư, sang trọng với cơ sở vật chất cao cấp, khu vui chơi riêng biệt, tách biệt hoàn toàn với khu tiêm chủng tiêu chuẩn. 
                    </td> 
                    <td className="tw-border tw-border-[#ccc] tw-p-[12px] tw-text-left tw-align-top"> 
                      Hỗ trợ Khách hàng tham gia gói vắc xin và Khách hàng VIP, giảm thời gian chờ đợi, đồng thời nâng cao chất lượng dịch vụ. 
                    </td> 
                    <td className="tw-border tw-border-[#ccc] tw-p-[12px] tw-text-left tw-align-top"> 
                      Tận dụng hệ thống kho và xe bảo quản vắc xin chuyên nghiệp, cùng đội ngũ bác sĩ giàu kinh nghiệm, EVaccine triển khai tiêm chủng tại chỗ, quy mô lớn 
                      cho Doanh nghiệp, Cơ quan, Trường học... 
                    </td> 
                    <td className="tw-border tw-border-[#ccc] tw-p-[12px] tw-text-left tw-align-top"> 
                      Phù hợp cho nhiều nhóm Khách hàng: từ trẻ sơ sinh, trẻ nhỏ, thanh thiếu niên, người lớn, phụ nữ mang thai, đến người có bệnh 
                      nền hoặc những người cần tiêm phục vụ du lịch, du học... 
                    </td> 
                  </tr> 
                </tbody> 
              </table> 
            </div> 
          )}

          <div className="tw-flex tw-justify-center">
            <button onClick={() => setShowMore(!showMore)}
              className="tw-mt-[15px] tw-px-[22px] tw-py-[10px] tw-rounded-[30px] tw-bg-gradient-to-r tw-from-[#4facfe] tw-to-[#00f2fe] tw-text-[13px]
               tw-font-semibold tw-text-white tw-shadow-[0px_4px_12px_rgba(0,0,0,0.15)] tw-cursor-pointer tw-transition-all tw-duration-300 hover:-tw-translate-y-1 
               hover:tw-to-[#0061ff] hover:tw-from-[#00c6ff]" >
              {showMore ? "Thu gọn" : "Xem thêm"} <i className="fa fa-chevron-down tw-ml-2"></i>
            </button>
          </div>
        </div>
      </section>

 {/* ========== MÙA NÀY TIÊM GÌ ========== */}
      <section className="tw-bg-white tw-pt-[20px] tw-pb-[40px] tw-px-10 tw-text-center">
        <h2 className="tw-text-[38px] tw-mb-5 tw-font-bold">
          Mùa này cần <span className="tw-text-orange-500 tw-italic">tiêm gì?</span>
          <i className="fa fa-heart tw-text-red-500 tw-ml-4 tw-text-[20px] tw-align-middle"></i>
        </h2>

        {/* TABS */}
         <div className="tw-flex tw-justify-center tw-gap-[10px] tw-flex-wrap tw-mb-5">
            {(diseaseTabs.length ? diseaseTabs : [{ key: "none", title: "Danh mục", vaccines: [] }]).map(
              (tab, idx) => (
              <button key={`${tab.key}-${idx}`} onClick={() => setActiveTab(tab.key)}
                className={`tw-py-[10px] tw-px-[18px] tw-border tw-rounded-md tw-font-medium tw-transition-all tw-duration-300 
                  ${ effectiveActiveKey === tab.key
                      ? `tw-px-[22px] tw-py-[10px] tw-rounded-[30px]  tw-bg-gradient-to-r tw-from-[#4facfe] tw-to-[#00f2fe]
                        tw-text-[13px] tw-font-semibold tw-text-white  tw-shadow-[0px_4px_12px_rgba(0,0,0,0.15)]
                        hover:-tw-translate-y-1 hover:tw-to-[#0061ff] hover:tw-from-[#00c6ff] `
                      : `tw-py-[10px] tw-px-[18px] tw-border tw-rounded-md tw-font-medium tw-bg-white tw-text-black tw-border-gray-300 
                        hover:tw-border-[#54affa] hover:tw-text-[#54affa]`
                  }`} >
                {tab.title}
              </button>
              )
            )}
          </div>

        {!loadingSeason && diseaseTabs.length === 0 && <div className="tw-text-gray-500 tw-mt-4">Chưa có dữ liệu vắc xin để hiển thị.</div>}

        {!loadingSeason && currentTab && (
          <div className="tw-max-w-[1200px] tw-min-h-[400px] tw-border-2 tw-border-[#34b4ed] tw-rounded-2xl tw-flex tw-overflow-hidden tw-mx-auto">
            <div className="tw-flex-1 tw-bg-gradient-to-br tw-from-[#34b4ed] tw-to-[#0666f7] tw-text-white tw-p-[25px] tw-text-left">
              <h3 className="tw-font-bold tw-mb-3 tw-text-[22px]">
                <span className="tw-text-[44px] tw-mr-2 tw-align-middle">🌦️</span>
                {currentTab.title}
              </h3>
              <p className="tw-pt-[10px] tw-leading-[1.6] tw-text-justify tw-text-white">
                {currentTab.disease?.short_description || currentTab.disease?.description || "Danh mục vắc xin theo mùa. Lướt sang phải để xem chi tiết."}
              </p>
            </div>

            <div className="tw-w-[60%] tw-flex tw-gap-4 tw-p-[20px] tw-bg-gradient-to-br tw-from-[#0666f7] tw-to-[#34b4ed] tw-overflow-x-auto tw-scroll-smooth tw-whitespace-nowrap tw-overflow-y-hidden
                            [&::-webkit-scrollbar]:tw-h-3 [&::-webkit-scrollbar-thumb]:tw-rounded-full
                            [&::-webkit-scrollbar-track]:tw-bg-gradient-to-r [&::-webkit-scrollbar-track]:tw-from-blue-100 [&::-webkit-scrollbar-track]:tw-to-cyan-100
                            [&::-webkit-scrollbar-thumb]:tw-bg-gradient-to-r [&::-webkit-scrollbar-thumb]:tw-from-[#f1428b] [&::-webkit-scrollbar-thumb]:tw-to-[#51f34b]">
              {currentTab.vaccines && currentTab.vaccines.length > 0 ? (
                currentTab.vaccines.slice(0, 10).map((v) => renderSeasonCard(v))
              ) : (
                <div className="tw-flex tw-items-center tw-justify-center tw-w-full tw-text-white tw-opacity-90">Chưa có vắc xin cho danh mục này.</div>
              )}
            </div>
          </div>
        )}
      </section>


      {/* ==========  KIẾN THỨC TIÊM CHỦNG ========== */}
      <section className="tw-px-6 tw-py-20 tw-bg-white">
        <div className="tw-max-w-[1200px] tw-mx-auto">
          <div className="tw-flex tw-items-center tw-justify-between tw-mb-6 tw-py-4">
            <div className="tw-flex-1 tw-flex tw-flex-col tw-items-center tw-gap-1">
              <div className="tw-flex tw-items-center tw-gap-3">
                <span className="tw-text-[42px] tw-animate-pulse tw-drop-shadow-[0_0_10px_rgba(255,200,0,0.6)]"> 📖 </span>
                <h2 className="tw-text-[34px] md:tw-text-[38px] tw-font-extrabold tw-bg-gradient-to-r tw-from-[#003cff] tw-to-[#60efff]
                              tw-text-transparent tw-bg-clip-text tw-drop-shadow-[0_2px_4px_rgba(0,0,0,0.2)]">
                  Kiến thức tiêm chủng
                </h2>
              </div>
              <p className="tw-text-[11px] tw-text-slate-500 tw-text-center">Một vài bài viết nổi bật được chọn từ trang Kiến thức tiêm chủng.</p>
            </div>
            <Link to="/knowledge" className="tw-text-[12px] tw-font-semibold tw-text-pink-600 hover:tw-text-pink-500 hover:tw-underline tw-ml-4">
              Xem tất cả <i className="fa-solid fa-arrow-right tw-text-lg"></i>
            </Link>
          </div>

          <div className="tw-bg-gradient-to-r tw-from-blue-50 tw-via-pink-50 tw-to-blue-50 tw-rounded-3xl tw-p-5 md:tw-p-6">
            {loadingKnowledge ? (
              <div className="tw-text-center tw-text-slate-500 tw-py-10 tw-text-sm">Đang tải bài viết kiến thức...</div>
            ) : knowledgePosts.length === 0 ? (
              <div className="tw-text-center tw-text-slate-500 tw-py-10 tw-text-sm">Chưa có bài viết kiến thức để hiển thị.</div>
            ) : (
              <div className="tw-grid tw-grid-cols-2 md:tw-grid-cols-3 lg:tw-grid-cols-4 tw-gap-4 md:tw-gap-5">
                {knowledgePosts.map((a) => (
                  <div key={a.id} onClick={() => navigate("/kien-thuc-tiem-chung")}
                    className="tw-group tw-bg-white tw-rounded-2xl tw-overflow-hidden tw-shadow-sm tw-border tw-border-slate-100 tw-cursor-pointer tw-flex
                     tw-flex-col tw-transition hover:tw-shadow-lg hover:tw-border-sky-200 hover:tw-translate-y-0.5" >
                    <div className="tw-relative tw-w-full tw-h-[180px] md:tw-h-[220px] tw-bg-slate-100 tw-overflow-hidden">
                      {a.thumbnail ? (
                        <img src={a.thumbnail} alt={a.title} className="tw-w-full tw-h-full tw-object-cover tw-transition group-hover:tw-scale-105" />
                      ) : (
                        <div className="tw-w-full tw-h-full tw-flex tw-items-center tw-justify-center tw-bg-gradient-to-br tw-from-sky-100 tw-via-white tw-to-pink-100">
                          <span className="tw-text-[18px] tw-font-semibold tw-text-slate-500">{getInitials(a.title)}</span>
                        </div>
                      )}
                      {a.visibility === "featured" && (
                        <span className="tw-absolute tw-top-2 tw-right-2 tw-text-[9px] tw-px-2 tw-py-0.5 tw-rounded-full tw-bg-black/70 tw-text-white">Nổi bật</span>
                      )}
                    </div>

                    <div className="tw-px-3 tw-pt-2 tw-pb-3 tw-flex tw-flex-col tw-gap-1 tw-flex-1">
                      <div className="tw-flex tw-items-center tw-justify-between tw-gap-2">
                        <div className="tw-flex tw-items-center tw-gap-2">
                          <div className="tw-w-7 tw-h-7 tw-rounded-full tw-bg-gradient-to-tr tw-from-pink-500 tw-to-sky-400 tw-flex tw-items-center 
                          tw-justify-center tw-text-[9px] tw-font-semibold tw-text-white">KV</div>
                          <span className="tw-text-[10px] tw-font-semibold tw-text-slate-700">Kiến thức tiêm chủng</span>
                        </div>
                        <span className="tw-text-[9px] tw-text-slate-400">{formatDate(a.publishedAt)}</span>
                      </div>

                      <h3 className="tw-text-[14px] tw-font-semibold tw-text-slate-900 tw-line-clamp-2 tw-mt-1">{a.title}</h3>

                      <p className="tw-text-[10px] tw-text-slate-600 tw-line-clamp-3">{shortText(a.summary || a.content, 90)}</p>

                      <div className="tw-flex tw-items-center tw-justify-between tw-mt-1.5">
                        <div className="tw-flex tw-gap-1 tw-max-w-full">
                          {a.disease && (
                            <span className=" tw-flex-1  tw-text-[8px] tw-px-1.5 tw-py-0.5  tw-rounded-full 
                                tw-bg-sky-50 tw-text-sky-700 tw-overflow-hidden tw-text-ellipsis tw-whitespace-nowrap " >
                              #{a.disease}
                            </span>
                          )}

                          {a.vaccine && (
                            <span className=" tw-flex-1 tw-text-[8px] tw-px-1.5 tw-py-0.5 tw-rounded-full 
                                tw-bg-emerald-50 tw-text-emerald-700 tw-overflow-hidden tw-text-ellipsis tw-whitespace-nowrap " >
                              #{a.vaccine}
                            </span>
                          )}
                        </div>

                        <div className="tw-flex tw-items-center tw-gap-2 tw-text-[11px] tw-text-slate-400">
                          <i className="fa-regular fa-heart group-hover:tw-text-pink-500"></i>
                          <i className="fa-regular fa-comment-dots group-hover:tw-text-sky-500"></i>
                          <i className="fa-regular fa-bookmark group-hover:tw-text-amber-500"></i>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Danh sách bác sỹ */}
      <section className="tw-bg-gradient-to-r tw-from-blue-50 tw-via-blue-50 tw-to-blue-50 tw-py-16">
        <div className="tw-max-w-[1200px] tw-mx-auto tw-px-6">
          <div className="tw-text-center tw-mb-12">
            <h2 className="tw-text-3xl tw-font-bold tw-text-[38px] tw-text-gray-800 tw-py-[5px]">
              Đội ngũ <span className="tw-text-green-600 tw-italic">bác sĩ chuyên khoa</span>
            </h2>
            <p className="tw-text-gray-600 tw-mt-3 tw-text-[18px] tw-font-semibold tw-py-[5px]">
              Những bác sĩ hàng đầu trong lĩnh vực tiêm chủng và y tế dự phòng
            </p>
          </div>

          <div className="tw-grid tw-gap-8 tw-grid-cols-4 sm:grid-cols-2 lg:grid-cols-4">
            
            <div className="doctor-card tw-relative tw-bg-white tw-rounded-2xl tw-shadow-md tw-overflow-hidden tw-transition hover:tw-shadow-2xl">
              <div className="tw-h-72 tw-bg-white tw-flex tw-items-center tw-justify-center">
                <img src="/images/bs2.jpg" alt="Bác sĩ" className="tw-h-full tw-w-full tw-object-cover" />
              </div>
              <div className="tw-p-6">
                <h3 className="tw-text-2xl tw-font-semibold tw-text-gray-800">BS. Nguyễn Văn An</h3>
                <p className="tw-text-blue-600 tw-mb-2">Chuyên khoa Nhi - Tiêm chủng</p>
                <p className="tw-text-gray-600 tw-mb-4 tw-line-clamp-2">
                  Hơn 15 năm kinh nghiệm trong lĩnh vực tiêm chủng và tư vấn phòng bệnh cho trẻ em.
                </p>
                <button className="tw-bg-blue-600 tw-text-white tw-px-4 tw-py-2 tw-rounded-xl hover:tw-bg-blue-700 tw-transition">
                  Liên hệ
                </button>
              </div>
            </div>

            <div className="doctor-card tw-relative tw-bg-white tw-rounded-2xl tw-shadow-md tw-overflow-hidden tw-transition hover:tw-shadow-2xl">
              <div className="tw-h-72 tw-bg-white tw-flex tw-items-center tw-justify-center">
                <img src="/images/bs1.jpg" alt="Bác sĩ" className="tw-h-full tw-w-full tw-object-cover" />
              </div>
              <div className="tw-p-6">
                <h3 className="tw-text-2xl tw-font-semibold tw-text-gray-800">BS. Trần Thị Bình</h3>
                <p className="tw-text-blue-600 tw-mb-2">Chuyên khoa Dịch tễ</p>
                <p className="tw-text-gray-600 tw-mb-4 tw-line-clamp-2">
                  Tư vấn và quản lý lịch tiêm chủng điện tử, nghiên cứu dịch tễ học cộng đồng.
                </p>
                <button className="tw-bg-blue-600 tw-text-white tw-px-4 tw-py-2 tw-rounded-xl hover:tw-bg-blue-700 tw-transition">
                  Liên hệ
                </button>
              </div>
            </div>

            <div className="doctor-card tw-relative tw-bg-white tw-rounded-2xl tw-shadow-md tw-overflow-hidden tw-transition hover:tw-shadow-2xl">
              <div className="tw-h-72 tw-bg-white tw-flex tw-items-center tw-justify-center">
                <img src="/images/bs5.jpg" alt="Bác sĩ" className="tw-h-full tw-w-full tw-object-contain" />
              </div>
              <div className="tw-p-6">
                <h3 className="tw-text-2xl tw-font-semibold tw-text-gray-800">BS. Lê Minh Tuấn</h3>
                <p className="tw-text-blue-600 tw-mb-2">Chuyên khoa Miễn dịch</p>
                <p className="tw-text-gray-600 tw-mb-4 tw-line-clamp-2">
                  Nghiên cứu và tư vấn các loại vắc-xin, hướng dẫn an toàn tiêm chủng cho mọi đối tượng.
                </p>
                <button className="tw-bg-blue-600 tw-text-white tw-px-4 tw-py-2 tw-rounded-xl hover:tw-bg-blue-700 tw-transition">
                  Liên hệ
                </button>
              </div>
            </div>

            <div className="doctor-card tw-relative tw-bg-white tw-rounded-2xl tw-shadow-md tw-overflow-hidden tw-transition hover:tw-shadow-2xl">
              <div className="tw-h-72 tw-bg-white tw-flex tw-items-center tw-justify-center">
                <img src="/images/bs3.jpg" alt="Bác sĩ" className="tw-h-full tw-w-full tw-object-contain" />
              </div>
              <div className="tw-p-6">
                <h3 className="tw-text-2xl tw-font-semibold tw-text-gray-800">BS. Phạm Thị Hòa</h3>
                <p className="tw-text-blue-600 tw-mb-2">Chuyên khoa Nội tổng quát</p>
                <p className="tw-text-gray-600 tw-mb-4 tw-line-clamp-2">
                  Hỗ trợ chẩn đoán và tư vấn sức khỏe định kỳ, đảm bảo an toàn trong tiêm chủng.
                </p>
                <button className="tw-bg-blue-600 tw-text-white tw-px-4 tw-py-2 tw-rounded-xl hover:tw-bg-blue-700 tw-transition">
                  Liên hệ
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* <ChatWidget /> */}
    </div>
  );
}
