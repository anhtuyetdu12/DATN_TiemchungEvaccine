import { useState } from "react";
import { Link, useNavigate  } from "react-router-dom";

export default function Home() {
  const [activeTab, setActiveTab] = useState("cum");
  const [showMore, setShowMore] = useState(false);
  const navigate = useNavigate();

  return (
    <div>
      
      <div>
        {/* ---------- ABOUT ---------- */}
        <section id="about" className="tw-relative tw-bg-cover tw-bg-center tw-py-36 tw-px-4 tw-mt-[100px]"  style={{ backgroundImage: "url('/images/bac1.jpg')" }} >
          <div className="tw-max-w-7xl tw-mx-auto">
            {/* Khung trắng mờ */}
            <div className="tw-bg-white/40 tw-p-8 md:tw-p-12 tw-rounded-2xl tw-shadow-2xl">
              <h2 className="tw-m-0 tw-text-[40px] tw-font-bold tw-text-[#1a237e] tw-pb-[20px] tw-pt-[10px] tw-tracking-tight tw-text-center">
                Chào mừng đến với hệ thống tiêm chủng{" "}
                <i className="fa fa-medkit tw-text-[#1a237e]  tw-ml-2"></i> EVaccine
              </h2>
              <p className="tw-text-black tw-text-[14px] tw-font-normal tw-leading-[24px] tw-mb-8">
              EVaccine giúp bạn quản lý lịch sử tiêm chủng một cách tiện lợi, chính
              xác và an toàn. Hệ thống hỗ trợ lưu trữ thông tin cá nhân, theo dõi mũi
              tiêm và nhắc lịch tự động.
              <br />
              Với EVaccine, việc đặt lịch, tra cứu danh mục vắc xin và cập nhật tin
              tức y tế trở nên dễ dàng hơn bao giờ hết. Bảo vệ sức khỏe cho bạn và gia
              đình ngay hôm nay!
              </p>
              <div className="tw-flex tw-justify-center tw-items-center tw-gap-4 tw-mt-6">
                <img src="/images/sy1.jpg"  alt="BS Nguyễn Thành An"
                  className="tw-w-[70px] tw-h-[70px] tw-rounded-full tw-object-cover tw-border-2 tw-border-indigo-200 tw-shadow-md"/>
                <div>
                  <h3 className="tw-text-xl md:tw-text-2xl tw-font-semibold tw-text-indigo-900">
                    BS. Nguyễn Thành An
                  </h3>
                  <p className="tw-text-gray-700 tw-text-lg md:tw-text-xl">
                    Chuyên gia tiêm chủng
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ---------- TIÊM CHỦNG SECTION ---------- */}
        <section className="tw-max-w-[1200px]  tw-mx-auto tw-my-12 tw-px-4 tw-text-center">
          <div className="tw-grid tw-grid-cols-1 sm:tw-grid-cols-2 md:tw-grid-cols-3 tw-gap-8 tw-my-5">
            <img src="/images/w1.jpg" alt="Tiêm chủng 1" className="tw-w-full tw-h-[250px] tw-object-cover tw-rounded-[15px]" />
            <img src="/images/w2.jpg" alt="Tiêm chủng 2" className="tw-w-full tw-h-[250px] tw-object-cover tw-rounded-[15px]" />
            <img src="/images/w3.jpg" alt="Tiêm chủng 3" className="tw-w-full tw-h-[250px] tw-object-cover tw-rounded-[15px]" />
            <img src="/images/w4.jpg" alt="Tiêm chủng 4" className="tw-w-full tw-h-[250px] tw-object-cover tw-rounded-[15px]" />
            <img src="/images/w5.jpg" alt="Tiêm chủng 5" className="tw-w-full tw-h-[250px] tw-object-cover tw-rounded-[15px]" />
            <img src="/images/w6.jpg" alt="Tiêm chủng 6" className="tw-w-full tw-h-[250px] tw-object-cover tw-rounded-[15px]" />
          </div>

          <div className="tw-text-left">
            <h2 className="tw-text-[28px] tw-font-bold tw-text-indigo-900 tw-py-[20px] tw-text-center">
              HỆ THỐNG TRUNG TÂM TIÊM CHỦNG EVACCINE
            </h2>
            <h4 className="tw-text-[18px] tw-font-semibold tw-text-[#8b8b8bff] tw-mb-5 tw-pb-3 tw-text-center">
              Địa điểm tiêm vắc xin An toàn – Uy tín – Chất lượng cho người dân Việt Nam
            </h4>
            <p className="tw-text-[16px] tw-leading-[1.6] tw-mb-[15px] tw-text-black tw-text-justify">
              E-Vaccine sở hữu hệ thống quản lý tiêm chủng điện tử hiện đại, giúp
              người dân và trẻ em dễ dàng tiếp cận nguồn vắc xin chất lượng, minh
              bạch, giá hợp lý. Hệ thống hỗ trợ lưu trữ hồ sơ tiêm, đặt lịch và
              nhắc lịch tự động, mang lại sự tiện lợi và an toàn tối đa. Với đội
              ngũ y bác sĩ tận tâm cùng nền tảng công nghệ hiện đại, EVaccine khẳng
              định vị thế tiên phong trong lĩnh vực tiêm chủng điện tử, đảm bảo
              nguồn cung cấp vắc xin chính hãng, bảo quản đúng chuẩn, đáp ứng nhu
              cầu chăm sóc sức khỏe cộng đồng ngày càng tăng cao.
            </p>

            {showMore && (
              <div className="extra-content tw-space-y-6">
                <h3 className="tw-text-[20px] tw-font-bold tw-text-[#1a237e] tw-mb-5 tw-text-left">
                  EVaccine đảm bảo nguồn cung vắc xin chất lượng cao
                </h3>
                <p className="tw-text-[16px] tw-leading-[1.6] tw-mb-[15px] tw-text-black tw-text-justify">
                  Khẳng định vị thế tiên phong trong lĩnh vực tiêm chủng vắc xin dịch vụ, Hệ thống Trung tâm tiêm chủng EVaccine mang đến nguồn cung vắc xin chính hãng, đa dạng và số lượng lớn, từ các loại vắc xin trong Chương trình Tiêm chủng mở rộng quốc gia đến các loại vắc xin thế hệ mới thường xuyên khan hiếm. Nhờ uy tín vững mạnh và hợp tác chiến lược cùng hầu hết các hãng dược phẩm hàng đầu thế giới, EVaccine đảm bảo nhập khẩu chính hãng, ổn định nguồn cung, đáp ứng nhu cầu tiêm phòng ngày càng tăng.
                </p>

                <h3 className="tw-text-[20px] tw-font-bold tw-text-[#1a237e] tw-mb-5 tw-text-left">
                  Bảo quản vắc xin theo chuẩn Quốc tế
                </h3>
                <p className="tw-text-[16px] tw-leading-[1.6] tw-mb-[15px] tw-text-black tw-text-justify">
                  EVaccine xây dựng và vận hành chuyên nghiệp hệ thống bảo quản vắc xin hiện đại, gồm mạng lưới hàng trăm kho lạnh GSP, cùng hệ thống xe lạnh vận chuyển chuyên dụng. Ngoài ra, EVaccine còn có 3 kho lạnh âm sâu đến -86°C, lưu giữ được hàng triệu liều vắc xin đặc biệt.
                </p>

                <h3 className="tw-text-[20px] tw-font-bold tw-text-[#1a237e] tw-mb-5 tw-text-left">
                  Cam kết quy trình tiêm chủng an toàn
                </h3>
                <p className="tw-text-[16px] tw-leading-[1.6] tw-mb-[15px] tw-text-black tw-text-justify">
                 100% bác sĩ có chứng chỉ An toàn tiêm chủng, 90% điều dưỡng đạt tay nghề cao, cùng phòng xử trí phản ứng sau tiêm đầy đủ trang thiết bị. EVaccine còn vận hành Tổng đài hỗ trợ xử trí phản ứng sau tiêm, mang đến sự an tâm tối đa.
                </p>

                <h3 className="tw-text-[20px] tw-font-bold tw-text-[#1a237e] tw-mb-5 tw-text-left">
                  Mức giá hợp lý và nhiều ưu đãi
                </h3>
                <p className="tw-text-[16px] tw-leading-[1.6] tw-mb-[15px] tw-text-black tw-text-justify">
                  Khách hàng được miễn phí khám sàng lọc, hỗ trợ trả phí linh hoạt và hưởng nhiều tiện ích cao cấp như khu vui chơi, phòng mẹ và bé, wifi, nước uống, tã bỉm miễn phí.
                </p>

                <h3 className="tw-text-[20px] tw-font-bold tw-text-[#1a237e] tw-mb-5 tw-text-left">
                  Cơ sở vật chất hiện đại, tiện nghi
                </h3>
                <p className="tw-text-[16px] tw-leading-[1.6] tw-mb-[15px] tw-text-black tw-text-justify">
                  EVaccine cung cấp hệ thống phòng khám, phòng tiêm, phòng theo dõi sau tiêm đạt chuẩn quốc tế. Không gian sạch sẽ, thoáng mát, tiện nghi cho cả trẻ em và người lớn.
                </p>

                <h3 className="tw-text-[20px] tw-font-bold tw-text-[#1a237e] tw-mb-5 tw-text-left">
                  Dịch vụ tiêm chủng đa dạng
                </h3>
                <p className="tw-text-[16px] tw-leading-[1.6] tw-mb-[15px] tw-text-black tw-text-justify">
                 EVaccine cung cấp nhiều dịch vụ tiêm chủng đặc biệt, đáp ứng linh hoạt nhu cầu và chi phí của Khách hàng.
                </p>

                {/* Bảng dịch vụ */}
                <table className="tw-w-full tw-border tw-border-gray-300 tw-mt-6">
                  <thead>
                    <tr className="tw-bg-gray-100">
                      <th className="tw-border tw-border-[#ccc] tw-p-[12px] tw-align-top tw-text-left">
                        Dịch vụ Tiêm chủng VIP
                      </th>
                      <th className="tw-border tw-border-[#ccc] tw-p-[12px] tw-align-top tw-text-left">
                        Dịch vụ Tiêm chủng Ưu tiên
                      </th>
                      <th className="tw-border tw-border-[#ccc] tw-p-[12px] tw-align-top tw-text-left">
                        Dịch vụ Tiêm chủng Lưu động
                      </th>
                      <th className="tw-border tw-border-[#ccc] tw-p-[12px] tw-align-top tw-text-left">
                        Dịch vụ Tiêm chủng theo Yêu cầu
                      </th>
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
                        Tận dụng hệ thống kho và xe bảo quản vắc xin chuyên nghiệp, cùng đội ngũ bác sĩ giàu kinh nghiệm, EVaccine triển khai tiêm chủng tại chỗ, quy mô lớn cho Doanh nghiệp, Cơ quan, Trường học...
                      </td>
                      <td className="tw-border tw-border-[#ccc] tw-p-[12px] tw-text-left tw-align-top">
                        Phù hợp cho nhiều nhóm Khách hàng: từ trẻ sơ sinh, trẻ nhỏ, thanh thiếu niên, người lớn, phụ nữ mang thai, đến người có bệnh nền hoặc những người cần tiêm phục vụ du lịch, du học...
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
            <div className="tw-flex tw-justify-center">
            <button onClick={() => setShowMore(!showMore)}
              className="tw-mt-[15px] tw-px-[22px] tw-py-[10px] tw-rounded-[30px] 
                        tw-bg-gradient-to-r tw-from-[#4facfe] tw-to-[#00f2fe] 
                        tw-text-[13px] tw-font-semibold tw-text-white 
                        tw-shadow-[0px_4px_12px_rgba(0,0,0,0.15)] tw-cursor-pointer 
                        tw-transition-all tw-duration-300 hover:-tw-translate-y-1
                        hover:tw-to-[#0061ff] hover:tw-from-[#00c6ff]">
              {showMore ? "Thu gọn" : "Xem thêm"}{" "}
              <i className="fa fa-chevron-down tw-ml-2"></i>
            </button>
          </div>
          </div>
        </section>
      </div>


        {/* Mùa này tiêm gì */}
      <section className="tw-bg-white tw-pt-[20px] tw-pb-[40px] tw-px-10 tw-text-center">
        {/* Tiêu đề */}
        <h2 className="tw-text-[38px] tw-mb-5 tw-font-bold">
          Mùa này cần{" "}
          <span className="tw-text-orange-500 tw-italic">tiêm gì?</span>
          <i className="fa fa-heart tw-text-red-500 tw-ml-4 tw-text-[20px] tw-align-middle"></i>
        </h2>

        {/* Tabs */}
        <div className="tw-flex tw-justify-center tw-gap-[10px] tw-flex-wrap tw-mb-5">
          <button
            onClick={() => setActiveTab("cum")}
            className={`tw-py-[10px] tw-px-[18px] tw-border tw-rounded-md tw-font-medium tw-transition-all tw-duration-300 ${
              activeTab === "cum"
                ? "tw-bg-[#54affa] tw-text-white tw-border-[#54affa]"
                : "tw-bg-white tw-text-black tw-border-gray-300 hover:tw-border-[#54affa] hover:tw-text-[#54affa]"
            }`}
          >
            Cúm
          </button>
          <button
            onClick={() => setActiveTab("hpv")}
            className={`tw-py-[10px] tw-px-[18px] tw-border tw-rounded-md tw-font-medium tw-transition-all tw-duration-300 ${
              activeTab === "hpv"
                ? "tw-bg-[#54affa] tw-text-white tw-border-[#54affa]"
                : "tw-bg-white tw-text-black tw-border-gray-300 hover:tw-border-[#54affa] hover:tw-text-[#54affa]"
            }`}
          >
            HPV
          </button>
          <button
            onClick={() => setActiveTab("sotxh")}
            className={`tw-py-[10px] tw-px-[18px] tw-border tw-rounded-md tw-font-medium tw-transition-all tw-duration-300 ${
              activeTab === "sotxh"
                ? "tw-bg-[#54affa] tw-text-white tw-border-[#54affa]"
                : "tw-bg-white tw-text-black tw-border-gray-300 hover:tw-border-[#54affa] hover:tw-text-[#54affa]"
            }`}
          >
            Sốt Xuất Huyết
          </button>
          <button
            onClick={() => setActiveTab("mocaub")}
            className={`tw-py-[10px] tw-px-[18px] tw-border tw-rounded-md tw-font-medium tw-transition-all tw-duration-300 ${
              activeTab === "mocaub"
                ? "tw-bg-[#54affa] tw-text-white tw-border-[#54affa]"
                : "tw-bg-white tw-text-black tw-border-gray-300 hover:tw-border-[#54affa] hover:tw-text-[#54affa]"
            }`}
          >
            Viêm Não Mô Cầu B
          </button>
          <button
            onClick={() => setActiveTab("mocauacyw")}
            className={`tw-py-[10px] tw-px-[18px] tw-border tw-rounded-md tw-font-medium tw-transition-all tw-duration-300 ${
              activeTab === "mocauacyw"
                ? "tw-bg-[#54affa] tw-text-white tw-border-[#54affa]"
                : "tw-bg-white tw-text-black tw-border-gray-300 hover:tw-border-[#54affa] hover:tw-text-[#54affa]"
            }`}
          >
            Viêm Não Mô Cầu ACYW
          </button>
          <button
            onClick={() => setActiveTab("naonb")}
            className={`tw-py-[10px] tw-px-[18px] tw-border tw-rounded-md tw-font-medium tw-transition-all tw-duration-300 ${
              activeTab === "naonb"
                ? "tw-bg-[#54affa] tw-text-white tw-border-[#54affa]"
                : "tw-bg-white tw-text-black tw-border-gray-300 hover:tw-border-[#54affa] hover:tw-text-[#54affa]"
            }`}
          >
            Viêm Não Nhật Bản
          </button>
        </div>

        {/* ---------------- TAB CÚM ---------------- */}
        {activeTab === "cum" && (
          <div className="tw-max-w-[1200px] tw-min-h-[400px] tw-border-2 tw-border-[#34b4ed] tw-rounded-2xl tw-flex tw-overflow-hidden tw-mx-auto">
            {/* Bên trái */}
            <div className="tw-flex-1 tw-w-[40%] tw-bg-gradient-to-br tw-from-[#34b4ed] tw-to-[#0666f7] tw-text-white tw-p-[25px] tw-text-left">
              <h3 className="tw-font-bold tw-mb-3 tw-text-[22px]">
                <span className="tw-text-[44px] tw-mr-2 tw-align-middle">🌦️</span>
                Tiêm phòng cúm có thật sự quan trọng?
              </h3>
              <p className="tw-pt-[10px] tw-leading-[1.6] tw-text-justify tw-text-white">
                Cúm là bệnh lý đường hô hấp cấp tính do virus cúm gây ra, với khả năng lây lan nhanh và dễ bùng phát thành dịch. 
                Bệnh thường biểu hiện qua các triệu chứng như sốt, ho, đau đầu, mệt mỏi, và có thể gây ra các biến chứng nguy hiểm như viêm phổi hoặc viêm não. 
                Tiêm vắc xin cúm hằng năm được coi là phương pháp hiệu quả nhất để phòng ngừa cúm và giảm thiểu nguy cơ biến chứng, đặc biệt ở trẻ em và nhóm nguy cơ cao. 
              </p>
            </div>
            {/* Bên phải */}
            <div className="tw-flex-2 tw-w-[60%] tw-flex tw-gap-4 tw-p-[20px] tw-bg-gradient-to-br tw-from-[#0666f7] tw-to-[#34b4ed] tw-overflow-x-auto tw-scroll-smooth tw-whitespace-nowrap tw-overflow-y-hidden ">
              {/* Card 1 */}
              <div className="tw-flex-none tw-w-[230px] tw-h-[360px] tw-bg-white tw-rounded-xl tw-p-[15px] tw-shadow-md tw-flex tw-flex-col tw-justify-between tw-text-center">
                <span>🇳🇱 Hà Lan</span>
                <img src="images/vac1.jpg" alt="" className="tw-w-full tw-max-h-[120px] tw-object-contain tw-my-[10px]" />
                <h4 className="tw-font-bold tw-text-[16px]">Vắc xin Influvac Tetra</h4>
                <p>Phòng Cúm</p>
                <p className="tw-font-bold tw-text-[#ff6600]">333.000đ / Liều</p>
                <div className="tw-flex tw-gap-2 tw-justify-center">
                  <Link  to={`/vaccines/influvac-tetra`}
                    className="tw-inline-flex tw-items-center tw-bg-[#ffedcc] tw-text-[#ff6600] tw-font-medium tw-py-2 tw-px-8 tw-rounded-full hover:tw-bg-[#ff6600] hover:tw-text-white" >
                    Xem chi tiết
                  </Link>
                  <button  onClick={() => navigate("/bookingform")}
                    className="tw-inline-flex tw-items-center tw-bg-[#abe0ff] tw-text-[#3267fa] 
                              tw-font-medium tw-py-2 tw-px-8 tw-rounded-full  hover:tw-bg-[#3267fa] hover:tw-text-white">
                    Đặt hẹn
                  </button>
                </div>

              </div>
              {/* Card 2 */}
              <div className="tw-flex-none tw-w-[230px] tw-h-[360px] tw-bg-white tw-rounded-xl tw-p-[15px] tw-shadow-md tw-flex tw-flex-col tw-justify-between tw-text-center">
                <span>🇫🇷 Pháp</span>
                <img src="images/vac2.jpg" alt="" className="tw-w-full tw-max-h-[120px] tw-object-contain tw-my-[10px]" />
                <h4 className="tw-font-bold tw-text-[16px]">Vắc xin Vaxigrip Tetra</h4>
                <p>Phòng Cúm</p>
                <p className="tw-font-bold tw-text-[#ff6600]">333.000đ / Liều</p>
                <div className="tw-flex tw-gap-2 tw-justify-center">
                  <Link  to={`/vaccines/influvac-tetra`}
                    className="tw-inline-flex tw-items-center tw-bg-[#ffedcc] tw-text-[#ff6600] tw-font-medium tw-py-2 tw-px-8 tw-rounded-full hover:tw-bg-[#ff6600] hover:tw-text-white" >
                    Xem chi tiết
                  </Link>
                  <button  onClick={() => navigate("/bookingform")}
                    className="tw-inline-flex tw-items-center tw-bg-[#abe0ff] tw-text-[#3267fa] 
                              tw-font-medium tw-py-2 tw-px-8 tw-rounded-full  hover:tw-bg-[#3267fa] hover:tw-text-white">
                    Đặt hẹn
                  </button>
                </div>
              </div>
              {/* Card 3 */}
              <div className="tw-flex-none tw-w-[230px] tw-h-[360px] tw-bg-white tw-rounded-xl tw-p-[15px] tw-shadow-md tw-flex tw-flex-col tw-justify-between tw-text-center">
                <span>🇻🇳 Việt Nam</span>
                <img src="images/vac3.jpg" alt="" className="tw-w-full tw-max-h-[120px] tw-object-contain tw-my-[10px]" />
                <h4 className="tw-font-bold tw-text-[16px]">Vắc xin Ivacflu-s 0.5ml</h4>
                <p>Phòng Cúm</p>
                <p className="tw-font-bold tw-text-[#ff6600]">260.000đ / Liều</p>
                <div className="tw-flex tw-gap-2 tw-justify-center">
                  <Link  to={`/vaccines/influvac-tetra`}
                    className="tw-inline-flex tw-items-center tw-bg-[#ffedcc] tw-text-[#ff6600] tw-font-medium tw-py-2 tw-px-8 tw-rounded-full hover:tw-bg-[#ff6600] hover:tw-text-white" >
                    Xem chi tiết
                  </Link>
                  <button  onClick={() => navigate("/bookingform")}
                    className="tw-inline-flex tw-items-center tw-bg-[#abe0ff] tw-text-[#3267fa] 
                              tw-font-medium tw-py-2 tw-px-8 tw-rounded-full  hover:tw-bg-[#3267fa] hover:tw-text-white">
                    Đặt hẹn
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ---------------- TAB HPV ---------------- */}
        {activeTab === "hpv" && (
          <div className="tw-max-w-[1200px] tw-min-h-[400px] tw-border-2 tw-border-[#34b4ed] tw-rounded-2xl tw-flex tw-overflow-hidden tw-mx-auto">
            <div className="tw-flex-1 tw-w-[40%] tw-bg-gradient-to-br tw-from-[#34b4ed] tw-to-[#0666f7] tw-text-white tw-p-[25px] tw-text-left">
              <h3 className="tw-font-bold tw-mb-3 tw-text-[22px]">
                <span className="tw-text-[44px] tw-mr-2 tw-align-middle">🧬</span>
                Phòng ngừa ung thư do HPV thế nào cho hiệu quả?
              </h3>
              <p className="tw-pt-[10px] tw-leading-[1.6] tw-text-justify tw-text-white">
                HPV (Human Papillomavirus) là nguyên nhân chính gây ung thư cổ tử cung, với 70% trường hợp liên quan đến chủng 16 và 18, 
                cùng các ung thư khác như âm đạo, âm hộ, dương vật, hậu môn và hầu họng. Hai vắc xin phòng ngừa HPV phổ biến là Gardasil 
                (bảo vệ 4 chủng 6, 11, 16, 18; khuyến cáo cho nữ từ 9 - 26 tuổi) và Gardasil 9 (mở rộng bảo vệ cho cả nam và nữ từ 9 đến 45 tuổi). 
                Tiêm vắc xin đúng lịch là biện pháp phòng ngừa hiệu quả các bệnh liên quan đến HPV, đặc biệt là ung thư cổ tử cung.
              </p>
            </div>
            <div className="tw-flex-2 tw-w-[60%] tw-flex tw-gap-4 tw-p-[20px] tw-bg-gradient-to-br tw-from-[#0666f7] tw-to-[#34b4ed] tw-overflow-x-auto tw-scroll-smooth tw-whitespace-nowrap tw-overflow-y-hidden">
              {/* Card 1 */}
              <div className="tw-flex-none tw-w-[230px] tw-h-[360px] tw-bg-white tw-rounded-xl tw-p-[15px] tw-shadow-md tw-flex tw-flex-col tw-justify-between tw-text-center">
                <span>🇺🇸 Mỹ</span>
                <img src="images/hpv1.jpg" alt="" className="tw-w-full tw-max-h-[120px] tw-object-contain" />
                <h4 className="tw-font-bold tw-text-[16px]">Vắc xin Gardasil 9</h4>
                <p>Phòng HPV</p>
                <p className="tw-font-bold tw-text-[#ff6600]">1.600.000đ / Liều</p>
                <div className="tw-flex tw-gap-2 tw-justify-center">
                  <Link  to={`/vaccines/influvac-tetra`}
                    className="tw-inline-flex tw-items-center tw-bg-[#ffedcc] tw-text-[#ff6600] tw-font-medium tw-py-2 tw-px-8 tw-rounded-full hover:tw-bg-[#ff6600] hover:tw-text-white" >
                    Xem chi tiết
                  </Link>
                  <button  onClick={() => navigate("/bookingform")}
                    className="tw-inline-flex tw-items-center tw-bg-[#abe0ff] tw-text-[#3267fa] 
                              tw-font-medium tw-py-2 tw-px-8 tw-rounded-full  hover:tw-bg-[#3267fa] hover:tw-text-white">
                    Đặt hẹn
                  </button>
                </div>
              </div>
              {/* Card 2 */}
              <div className="tw-flex-none tw-w-[230px] tw-h-[360px] tw-bg-white tw-rounded-xl tw-p-[15px] tw-shadow-md tw-flex tw-flex-col tw-justify-between tw-text-center">
                <span>🇬🇧 Anh</span>
                <img src="images/hpv2.jpg" alt="" className="tw-w-full tw-max-h-[120px] tw-object-contain" />
                <h4 className="tw-font-bold tw-text-[16px]">Vắc xin Cervarix</h4>
                <p>Phòng HPV</p>
                <p className="tw-font-bold tw-text-[#ff6600]">950.000đ / Liều</p>
                <div className="tw-flex tw-gap-2 tw-justify-center">
                  <Link  to={`/vaccines/influvac-tetra`}
                    className="tw-inline-flex tw-items-center tw-bg-[#ffedcc] tw-text-[#ff6600] tw-font-medium tw-py-2 tw-px-8 tw-rounded-full hover:tw-bg-[#ff6600] hover:tw-text-white" >
                    Xem chi tiết
                  </Link>
                  <button  onClick={() => navigate("/bookingform")}
                    className="tw-inline-flex tw-items-center tw-bg-[#abe0ff] tw-text-[#3267fa] 
                              tw-font-medium tw-py-2 tw-px-8 tw-rounded-full  hover:tw-bg-[#3267fa] hover:tw-text-white">
                    Đặt hẹn
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ---------------- TAB SỐT XUẤT HUYẾT ---------------- */}
        {activeTab === "sotxh" && (
          <div className="tw-max-w-[1200px] tw-min-h-[400px] tw-border-2 tw-border-[#34b4ed] tw-rounded-2xl tw-flex tw-overflow-hidden tw-mx-auto">
            <div className="tw-flex-1 tw-w-[40%] tw-bg-gradient-to-br tw-from-[#34b4ed] tw-to-[#0666f7] tw-text-white tw-p-[25px] tw-text-left">
              <h3 className="tw-font-bold tw-mb-3 tw-text-[22px]">
                <span className="tw-text-[44px] tw-mr-2 tw-align-middle">🦟</span>
                Vắc xin phòng Sốt Xuất Huyết</h3>
              <p className="tw-pt-[10px] tw-leading-[1.6] tw-text-justify tw-text-white">
                Sốt xuất huyết Dengue là bệnh truyền nhiễm cấp tính do virus Dengue gây ra, lây truyền qua vết đốt của muỗi vằn Aedes. 
                Bệnh có thể gây sốt cao, đau đầu, đau cơ, buồn nôn, nôn, phát ban và có thể dẫn đến các biến chứng nguy hiểm như xuất huyết, sốc, suy tạng, 
                thậm chí tử vong. Hiện nay, vắc xin Qdenga là loại vắc xin sống, giảm độc lực được sử dụng để phòng ngừa bệnh sốt xuất huyết, dành cho trẻ từ 4 tuổi và người lớn. 
                Tiêm phòng vắc xin là biện pháp hiệu quả giúp bảo vệ sức khỏe cho bạn và cộng đồng.
              </p>
            </div>
            <div className="tw-flex-2 tw-w-[60%] tw-flex tw-gap-4 tw-p-[20px] tw-bg-gradient-to-br tw-from-[#0666f7] tw-to-[#34b4ed] tw-overflow-x-auto tw-scroll-smooth tw-whitespace-nowrap tw-overflow-y-hidden">
              <div className="tw-flex-none tw-w-[230px] tw-h-[360px] tw-bg-white tw-rounded-xl tw-p-[15px] tw-text-center tw-shadow-md tw-flex tw-flex-col tw-justify-between">
                <span>🇫🇷 Pháp</span>
                <img src="images/sot1.jpg" alt="" className="tw-w-full tw-max-h-[120px] tw-object-contain" />
                <h4 className="tw-font-bold tw-text-[16px]">Vắc xin Dengvaxia</h4>
                <p>Phòng Sốt Xuất Huyết</p>
                <p className="tw-font-bold tw-text-[#ff6600]">1.200.000đ / Liều</p>
                <div className="tw-flex tw-gap-2 tw-justify-center">
                  <Link  to={`/vaccines/influvac-tetra`}
                    className="tw-inline-flex tw-items-center tw-bg-[#ffedcc] tw-text-[#ff6600] tw-font-medium tw-py-2 tw-px-8 tw-rounded-full hover:tw-bg-[#ff6600] hover:tw-text-white" >
                    Xem chi tiết
                  </Link>
                  <button  onClick={() => navigate("/bookingform")}
                    className="tw-inline-flex tw-items-center tw-bg-[#abe0ff] tw-text-[#3267fa] 
                              tw-font-medium tw-py-2 tw-px-8 tw-rounded-full  hover:tw-bg-[#3267fa] hover:tw-text-white">
                    Đặt hẹn
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ---------------- TAB MÔ CẦU B ---------------- */}
        {activeTab === "mocaub" && (
          <div className="tw-max-w-[1200px] tw-min-h-[400px] tw-border-2 tw-border-[#34b4ed] tw-rounded-2xl tw-flex tw-overflow-hidden tw-mx-auto">
            <div className="tw-flex-1 tw-w-[40%] tw-bg-gradient-to-br tw-from-[#34b4ed] tw-to-[#0666f7] tw-text-white tw-p-[25px] tw-text-left">
              <h3 className="tw-font-bold tw-mb-3 tw-text-[22px]">
                <span className="tw-text-[44px] tw-mr-2 tw-align-middle">🧠</span>
                Vắc xin phòng Viêm Não Mô Cầu B</h3>
              <p className="tw-pt-[10px] tw-leading-[1.6] tw-text-justify tw-text-white ">
                Viêm màng não do não mô cầu B là một bệnh nhiễm trùng nguy hiểm do vi khuẩn Neisseria meningitidis nhóm B gây ra. 
                Bệnh có thể gây viêm màng não, nhiễm trùng máu và dẫn đến tử vong, đặc biệt nguy hiểm ở trẻ nhỏ. Để chủ động phòng ngừa bệnh, nên tiêm vắc xin Bexsero, 
                loại vắc xin tái tổ hợp dành cho trẻ từ 2 tháng tuổi đến người lớn tròn 50 tuổi.
              </p>
            </div>
            <div className="tw-flex-2 tw-w-[60%] tw-flex tw-gap-4 tw-p-[20px] tw-bg-gradient-to-br tw-from-[#0666f7] tw-to-[#34b4ed] tw-overflow-x-auto tw-scroll-smooth tw-whitespace-nowrap tw-overflow-y-hidden">
              <div className="tw-flex-none tw-w-[230px] tw-h-[360px] tw-bg-white tw-rounded-xl tw-p-[15px] tw-shadow-md tw-flex tw-flex-col tw-justify-between tw-text-center">
                <span>🇬🇧 Anh</span>
                <img src="images/caub1.jpg" alt="" className="tw-w-full tw-max-h-[120px] tw-object-contain" />
                <h4 className="tw-font-bold tw-text-[16px]">Vắc xin Bexsero</h4>
                <p>Phòng Mô Cầu B</p>
                <p className="tw-font-bold tw-text-[#ff6600]">2.100.000đ / Liều</p>
                <div className="tw-flex tw-gap-2 tw-justify-center">
                  <Link  to={`/vaccines/influvac-tetra`}
                    className="tw-inline-flex tw-items-center tw-bg-[#ffedcc] tw-text-[#ff6600] tw-font-medium tw-py-2 tw-px-8 tw-rounded-full hover:tw-bg-[#ff6600] hover:tw-text-white" >
                    Xem chi tiết
                  </Link>
                  <button  onClick={() => navigate("/bookingform")}
                    className="tw-inline-flex tw-items-center tw-bg-[#abe0ff] tw-text-[#3267fa] 
                              tw-font-medium tw-py-2 tw-px-8 tw-rounded-full  hover:tw-bg-[#3267fa] hover:tw-text-white">
                    Đặt hẹn
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ---------------- TAB MÔ CẦU ACYW ---------------- */}
        {activeTab === "mocauacyw" && (
          <div className="tw-max-w-[1200px] tw-min-h-[400px] tw-border-2 tw-border-[#34b4ed] tw-rounded-2xl tw-flex tw-overflow-hidden tw-mx-auto">
            <div className="tw-flex-1 tw-w-[40%] tw-bg-gradient-to-br tw-from-[#34b4ed] tw-to-[#0666f7] tw-text-white tw-p-[25px] tw-text-left">
              <h3 className="tw-font-bold tw-mb-3 tw-text-[22px]">
                <span className="tw-text-[44px] tw-mr-2 tw-align-middle">🛡️</span>
                Vắc xin phòng Viêm Não Mô Cầu ACYW</h3>
              <p className="tw-pt-[10px] tw-leading-[1.6] tw-text-justify tw-text-white ">
                Viêm màng não do não mô cầu ACYW là bệnh nhiễm trùng nguy hiểm do vi khuẩn Neisseria meningitidis gây ra, 
                      có thể dẫn đến viêm màng não, nhiễm trùng máu, thậm chí tử vong, đặc biệt nguy hiểm ở trẻ nhỏ. Chủ động tiêm vắc xin phòng bệnh 
                      là cách để bảo vệ bản thân và gia đình, giúp ngăn ngừa nguy cơ mắc bệnh và biến chứng nghiêm trọng.
              </p>
            </div>
            <div className="tw-flex-2 tw-w-[60%] tw-flex tw-gap-4 tw-p-[20px] tw-bg-gradient-to-br tw-from-[#0666f7] tw-to-[#34b4ed] tw-overflow-x-auto tw-scroll-smooth tw-whitespace-nowrap tw-overflow-y-hidden">
              {/* card1 */}
              <div className="tw-flex-none tw-w-[230px] tw-h-[360px] tw-bg-white tw-rounded-xl tw-p-[15px] tw-shadow-md tw-flex tw-flex-col tw-justify-between tw-text-center">
                <span>🇫🇷 Pháp</span>
                <img src="images/caua1.jpg" alt="" className="tw-w-full tw-max-h-[120px] tw-object-contain" />
                <h4 className="tw-font-bold tw-text-[16px]">Vắc xin Menactra</h4>
                <p>Phòng Mô Cầu ACYW</p>
                <p className="tw-font-bold tw-text-[#ff6600]">1.360.000đ / Liều</p>
                <div className="tw-flex tw-gap-2 tw-justify-center">
                  <Link  to={`/vaccines/influvac-tetra`}
                    className="tw-inline-flex tw-items-center tw-bg-[#ffedcc] tw-text-[#ff6600] tw-font-medium tw-py-2 tw-px-8 tw-rounded-full hover:tw-bg-[#ff6600] hover:tw-text-white" >
                    Xem chi tiết
                  </Link>
                  <button  onClick={() => navigate("/bookingform")}
                    className="tw-inline-flex tw-items-center tw-bg-[#abe0ff] tw-text-[#3267fa] 
                              tw-font-medium tw-py-2 tw-px-8 tw-rounded-full  hover:tw-bg-[#3267fa] hover:tw-text-white">
                    Đặt hẹn
                  </button>
                </div>
              </div>
              {/* card2 */}
              <div className="tw-flex-none tw-w-[230px] tw-h-[360px] tw-bg-white tw-rounded-xl tw-p-[15px] tw-shadow-md tw-flex tw-flex-col tw-justify-between tw-text-center">
                <span>🇺🇸 Hoa kỳ</span>
                <img src="images/caua2.jpg" alt="" className="tw-w-full tw-max-h-[120px] tw-object-contain" />
                <h4 className="tw-font-bold tw-text-[16px]">Vắc xin MenQuadfi</h4>
                <p>Phòng Mô Cầu ACYW</p>
                <p className="tw-font-bold tw-text-[#ff6600]">1.900.000đ / Liều</p>
                <div className="tw-flex tw-gap-2 tw-justify-center">
                  <Link  to={`/vaccines/influvac-tetra`}
                    className="tw-inline-flex tw-items-center tw-bg-[#ffedcc] tw-text-[#ff6600] tw-font-medium tw-py-2 tw-px-8 tw-rounded-full hover:tw-bg-[#ff6600] hover:tw-text-white" >
                    Xem chi tiết
                  </Link>
                  <button  onClick={() => navigate("/bookingform")}
                    className="tw-inline-flex tw-items-center tw-bg-[#abe0ff] tw-text-[#3267fa] 
                              tw-font-medium tw-py-2 tw-px-8 tw-rounded-full  hover:tw-bg-[#3267fa] hover:tw-text-white">
                    Đặt hẹn
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ---------------- TAB NÃO NB ---------------- */}
        {activeTab === "naonb" && (
          <div className="tw-max-w-[1200px] tw-min-h-[400px] tw-border-2 tw-border-[#34b4ed] tw-rounded-2xl tw-flex tw-overflow-hidden tw-mx-auto">
            <div className="tw-flex-1 tw-w-[40%] tw-bg-gradient-to-br tw-from-[#34b4ed] tw-to-[#0666f7] tw-text-white tw-p-[25px] tw-text-left">
              <h3 className="tw-font-bold tw-mb-3 tw-text-[22px]">
                <span className="tw-text-[44px] tw-mr-2 tw-align-middle">🌸</span>
                Vắc xin phòng Viêm Não Nhật Bản</h3>
              <p className="tw-pt-[10px] tw-leading-[1.6] tw-text-justify tw-text-white ">
                Viêm não Nhật Bản là bệnh do virus gây ra làm tổn thương hệ thần kinh trung ương, có thể dẫn đến di chứng thần kinh nặng nề, 
                      thậm chí tử vong. Tiêm vắc xin là biện pháp phòng ngừa hiệu quả nhất đối với bệnh Viêm não Nhật Bản.
              </p>
            </div>
            <div className="tw-flex-2 tw-flex tw-w-[60%] tw-gap-4 tw-p-[20px] tw-bg-gradient-to-br tw-from-[#0666f7] tw-to-[#34b4ed] tw-overflow-x-auto ">
              {/* card1 */}
              <div className="tw-flex-none tw-w-[230px] tw-h-[360px] tw-bg-white tw-rounded-xl tw-p-[15px] tw-shadow-md tw-flex tw-flex-col tw-justify-between tw-text-center">
                <span>🇯🇵 Nhật Bản</span>
                <img src="images/nao1.jpg" alt="" className="tw-w-full tw-max-h-[120px] tw-object-contain" />
                <h4 className="tw-font-bold tw-text-[16px]">Vắc xin Imojev</h4>
                <p>Phòng Viêm Não Nhật Bản</p>
                <p className="tw-font-bold tw-text-[#ff6600]">1.700.000đ / Liều</p>
                <div className="tw-flex tw-gap-2 tw-justify-center">
                  <Link  to={`/vaccines/influvac-tetra`}
                    className="tw-inline-flex tw-items-center tw-bg-[#ffedcc] tw-text-[#ff6600] tw-font-medium tw-py-2 tw-px-8 tw-rounded-full hover:tw-bg-[#ff6600] hover:tw-text-white" >
                    Xem chi tiết
                  </Link>
                  <button  onClick={() => navigate("/bookingform")}
                    className="tw-inline-flex tw-items-center tw-bg-[#abe0ff] tw-text-[#3267fa] 
                              tw-font-medium tw-py-2 tw-px-8 tw-rounded-full  hover:tw-bg-[#3267fa] hover:tw-text-white">
                    Đặt hẹn
                  </button>
                </div>
              </div>
              {/* card2 */}
              <div className="tw-flex-none tw-w-[230px] tw-h-[360px] tw-bg-white tw-rounded-xl tw-p-[15px] tw-shadow-md tw-flex tw-flex-col tw-justify-between tw-text-center">
                <span>🇻🇳 Việt Nam</span>
                <img src="images/nao2.jpg" alt="" className="tw-w-full tw-max-h-[120px] tw-object-contain" />
                <h4 className="tw-font-bold tw-text-[16px]">Vắc xin JEVAX</h4>
                <p>Phòng Viêm Não Nhật Bản</p>
                <p className="tw-font-bold tw-text-[#ff6600]">850.000đ / Liều</p>
                <div className="tw-flex tw-gap-2 tw-justify-center">
                  <Link  to={`/vaccines/influvac-tetra`}
                    className="tw-inline-flex tw-items-center tw-bg-[#ffedcc] tw-text-[#ff6600] tw-font-medium tw-py-2 tw-px-8 tw-rounded-full hover:tw-bg-[#ff6600] hover:tw-text-white" >
                    Xem chi tiết
                  </Link>
                  <button  onClick={() => navigate("/bookingform")}
                    className="tw-inline-flex tw-items-center tw-bg-[#abe0ff] tw-text-[#3267fa] 
                              tw-font-medium tw-py-2 tw-px-8 tw-rounded-full  hover:tw-bg-[#3267fa] hover:tw-text-white">
                    Đặt hẹn
                  </button>
                </div>
              </div>
              {/* card3*/}
              <div className="tw-flex-none tw-w-[230px] tw-h-[360px] tw-bg-white tw-rounded-xl tw-p-[15px] tw-shadow-md tw-flex tw-flex-col tw-justify-between tw-text-center">
                <span>🇻🇳 Việt Nam</span>
                <img src="images/nao3.jpg" alt="" className="tw-w-full tw-max-h-[120px] tw-object-contain" />
                <h4 className="tw-font-bold tw-text-[16px]">Vắc xin Jeev 6mcg/0.5ml</h4>
                <p>Phòng Viêm Não Nhật Bản</p>
                <p className="tw-font-bold tw-text-[#ff6600]">520.000đ / Liều</p>
                <div className="tw-flex tw-gap-2 tw-justify-center">
                  <Link  to={`/vaccines/influvac-tetra`}
                    className="tw-inline-flex tw-items-center tw-bg-[#ffedcc] tw-text-[#ff6600] tw-font-medium tw-py-2 tw-px-8 tw-rounded-full hover:tw-bg-[#ff6600] hover:tw-text-white" >
                    Xem chi tiết
                  </Link>
                  <button  onClick={() => navigate("/bookingform")}
                    className="tw-inline-flex tw-items-center tw-bg-[#abe0ff] tw-text-[#3267fa] 
                              tw-font-medium tw-py-2 tw-px-8 tw-rounded-full  hover:tw-bg-[#3267fa] hover:tw-text-white">
                    Đặt hẹn
                  </button>
                </div>
              </div>
              {/* card4 */}
              <div className="tw-flex-none tw-w-[230px] tw-h-[360px] tw-bg-white tw-rounded-xl tw-p-[15px] tw-shadow-md tw-flex tw-flex-col tw-justify-between tw-text-center">
                <span>🇨🇳 Trung Quốc</span>
                <img src="images/nao4.jpg" alt="" className="tw-w-full tw-max-h-[120px] tw-object-contain" />
                <h4 className="tw-font-bold tw-text-[16px]">Vắc xin JEVAX</h4>
                <p>Phòng Viêm Não Nhật Bản</p>
                <p className="tw-font-bold tw-text-[#ff6600]">350.000đ / Liều</p>
                <div className="tw-flex tw-gap-2 tw-justify-center">
                  <Link  to={`/vaccines/influvac-tetra`}
                    className="tw-inline-flex tw-items-center tw-bg-[#ffedcc] tw-text-[#ff6600] tw-font-medium tw-py-2 tw-px-8 tw-rounded-full hover:tw-bg-[#ff6600] hover:tw-text-white" >
                    Xem chi tiết
                  </Link>
                  <button  onClick={() => navigate("/bookingform")}
                    className="tw-inline-flex tw-items-center tw-bg-[#abe0ff] tw-text-[#3267fa] 
                              tw-font-medium tw-py-2 tw-px-8 tw-rounded-full  hover:tw-bg-[#3267fa] hover:tw-text-white">
                    Đặt hẹn
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </section>
    
      {/* Kiến thức tiêm chủng */}
      <section className="tw-px-6 tw-py-20 tw-bg-white ">
        <div className="tw-max-w-[1200px] tw-mx-auto">
          {/* Tiêu đề */}
          <h2 className="tw-text-3xl tw-justify-center tw-font-bold tw-mb-6  tw-py-10 tw-text-[38px] tw-flex tw-items-center">
            <span className="tw-text-pink-600 tw-text-[38px] tw-mr-2">📖</span>
            <span className="tw-text-pink-600 tw-ml-[5px] tw-italic">Kiến thức</span>
            <span className="tw-ml-2 tw-text-gray-800">tiêm chủng</span>
          </h2>

          {/* Khung nền xanh dương nhạt */}
          <div className="tw-bg-blue-50  tw-rounded-[16px] tw-p-6 tw-mt-10">
            {/* Tabs */}
            <div className="tw-flex tw-gap-6 tw-border-b tw-mb-6 tw-text-gray-600 tw-font-medium">
              <div className="tw-text-pink-600 tw-border-b-2 tw-border-pink-600 tw-pb-2 tw-cursor-pointer">  MULTIMEDIA </div>
              <div className="hover:tw-text-pink-600 tw-cursor-pointer">Video</div>
              <div className="hover:tw-text-pink-600 tw-cursor-pointer">LongForm</div>
              <div className="hover:tw-text-pink-600 tw-cursor-pointer">  Trắc nghiệm sức khoẻ </div>
            </div>

            {/* nội dung bài viết */}
            <div className="tw-grid tw-grid-cols-4 tw-gap-6">
              {/* Cột trái  */}
              <div className="tw-col-span-1 tw-bg-white tw-rounded-xl tw-overflow-hidden">
               
                <img src="/images/news1.jpg" alt="tin tức 1" className="tw-w-full tw-h-[260px] tw-object-cover" />
                <div className="tw-flex tw-flex-col tw-items-center tw-justify-center tw-text-center tw-p-4">
                    <p className="tw-text-yellow-500 tw-font-bold tw-text-3xl tw-pb-2">CẢNH BÁO</p>
                    <h4  className="tw-text-gray-900 tw-text-2xl tw-font-semibold  tw-line-clamp-2 tw-overflow-hidden  tw-[display:-webkit-box] 
                                tw-[-webkit-line-clamp:2]  tw-[-webkit-box-orient:vertical]" >
                    Mụn cóc sinh dục – Một trong những bệnh lý da liễu nhiều người gặp phải 
                    </h4>
                </div>
               
              </div>
               

               {/* Bài lớn chính giữa */}
              
              <div className="tw-col-span-2 tw-bg-white tw-rounded-xl tw-overflow-hidden tw-relative">
                  <img  src="/images/ankieng.jpg"  alt="tin tức 2" className="tw-w-full tw-h-[260px] tw-object-cover"/>
                  <span className="tw-absolute tw-top-2 tw-left-2 tw-bg-black tw-text-white tw-text-xs tw-px-2 tw-rounded">Article</span>
                  <div className="tw-p-10 tw-flex tw-items-center tw-justify-center tw-text-center">                          
                      <div className="tw-flex-1 tw-w-0">
                          <h4 className="tw-m-0 tw-text-2xl tw-font-semibold tw-text-gray-900
                                          tw-line-clamp-2 tw-overflow-hidden tw-[display:-webkit-box]
                                          tw-[-webkit-line-clamp:2] tw-[-webkit-box-orient:vertical]
                                          tw-break-normal">
                              Vì một Việt Nam khỏe mạnh hơn, Long Châu hợp tác chiến lược cùng Bệnh viện Đại học Y Dược TP.HCM  
                          </h4>
                      </div>
                  </div>
                </div>
              
              {/* Cột phải (bài nhỏ) */}
              <div className="tw-col-span-1 tw-flex tw-flex-col tw-gap-6">
                <div className="tw-bg-white tw-rounded-xl tw-flex tw-gap-4 tw-pr-2 tw-items-center tw-overflow-hidden ">
                  <img src="/images/tin1.jpg" alt="tin nhỏ 1" className="tw-w-[100px] tw-h-[80px] tw-object-cover tw-flex-shrink-0"/>
                  <div className="tw-flex-1 tw-w-0">
                      <p className="tw-m-0 tw-text-lg tw-font-medium tw-text-gray-900
                                      tw-line-clamp-2 tw-overflow-hidden tw-[display:-webkit-box]
                                      tw-[-webkit-line-clamp:2] tw-[-webkit-box-orient:vertical]
                                      tw-break-normal">
                           Bệnh tiểu đường có ăn bún được không? Cách ăn uống hợp lý để đảm bảo 
                           kiểm soát đường huyết và vẫn duy trì chế độ ăn cân bằng mỗi ngày.
                      </p>
                  </div>
                </div>
                
                <div className="tw-bg-white tw-rounded-xl tw-flex tw-gap-4 tw-pr-2 tw-items-center tw-overflow-hidden ">
                  <img  src="/images/tin3.jpg" alt="tin nhỏ 2" className="tw-w-[100px] tw-h-[80px] tw-object-cover tw-flex-shrink-0"/>
                  <div className="tw-flex-1 tw-w-0">
                      <p className="tw-m-0 tw-text-lg tw-font-medium tw-text-gray-900
                                      tw-line-clamp-2 tw-overflow-hidden tw-[display:-webkit-box]
                                      tw-[-webkit-line-clamp:2] tw-[-webkit-box-orient:vertical]
                                      tw-break-normal">
                          Bị tiểu đường có sinh mổ được không? Các yếu tố quan trọng cần lưu ý để bảo vệ 
                          cả mẹ và bé trong suốt thai kỳ cũng như khi sinh nở.
                      </p>
                  </div>
                </div>

                <div className="tw-bg-white tw-rounded-xl tw-flex tw-gap-4 tw-pr-2 tw-items-center tw-overflow-hidden ">
                  <img src="/images/tin2.jpg" alt="tin nhỏ 3" className="tw-w-[100px] tw-h-[80px] tw-object-cover tw-flex-shrink-0"/>
                  <div className="tw-flex-1 tw-w-0">
                      <p className="tw-m-0 tw-text-lg tw-font-medium tw-text-gray-900
                                      tw-line-clamp-2 tw-overflow-hidden tw-[display:-webkit-box]
                                      tw-[-webkit-line-clamp:2] tw-[-webkit-box-orient:vertical]
                                      tw-break-normal">
                          Tiểu đường uống nước dừa được không? Lợi ích và rủi ro khi bổ sung nước dừa vào thực đơn hằng ngày cho người bệnh tiểu đường.
                      </p>
                  </div>
                </div>

                <div className="tw-bg-white tw-rounded-xl tw-flex tw-gap-4 tw-pr-2 tw-items-center tw-overflow-hidden">
                  <img src="/images/tin4.jpg" alt="tin nhỏ 4" className="tw-w-[100px] tw-h-[80px] tw-object-cover tw-flex-shrink-0 "/>
                  <div className="tw-flex-1 tw-w-0">
                      <p className="tw-m-0 tw-text-lg tw-font-medium tw-text-gray-900
                                      tw-line-clamp-2 tw-overflow-hidden tw-[display:-webkit-box]
                                      tw-[-webkit-line-clamp:2] tw-[-webkit-box-orient:vertical]
                                      tw-break-normal">
                           Ăn nhiều đường có bị tiểu đường không? Mối liên hệ khoa học giữa lượng đường nạp vào cơ thể, 
                           cân nặng và nguy cơ phát triển bệnh tiểu đường.
                      </p>
                  </div>
                </div>

                
              </div>

            </div>
          </div>
        </div>
        
      </section>

      {/* Danh sách bác sỹ */}
      <section class="tw-bg-gradient-to-r tw-from-blue-50 tw-via-blue-50 tw-to-blue-50 tw-py-16">
        <div class="tw-max-w-[1200px] tw-mx-auto tw-px-6">
          <div class="tw-text-center tw-mb-12">
            <h2 class="tw-text-3xl tw-font-bold tw-text-[38px] tw-text-gray-800 tw-py-[5px]">
              Đội ngũ <span class="tw-text-green-600 tw-italic">bác sĩ chuyên khoa</span>
            </h2>
            <p class="tw-text-gray-600 tw-mt-3 tw-text-[18px] tw-font-semibold tw-py-[5px]">
              Những bác sĩ hàng đầu trong lĩnh vực tiêm chủng và y tế dự phòng
            </p>
          </div>

          <div class="tw-grid tw-gap-8 tw-grid-cols-4 sm:grid-cols-2 lg:grid-cols-4">
            
            <div class="doctor-card tw-relative tw-bg-white tw-rounded-2xl tw-shadow-md tw-overflow-hidden tw-transition hover:tw-shadow-2xl">
              <div class="tw-h-72 tw-bg-white tw-flex tw-items-center tw-justify-center">
                <img src="/images/bs2.jpg" alt="Bác sĩ" class="tw-h-full tw-w-full tw-object-cover" />
              </div>
              <div class="tw-p-6">
                <h3 class="tw-text-2xl tw-font-semibold tw-text-gray-800">BS. Nguyễn Văn An</h3>
                <p class="tw-text-blue-600 tw-mb-2">Chuyên khoa Nhi - Tiêm chủng</p>
                <p class="tw-text-gray-600 tw-mb-4 tw-line-clamp-2">
                  Hơn 15 năm kinh nghiệm trong lĩnh vực tiêm chủng và tư vấn phòng bệnh cho trẻ em.
                </p>
                <button class="tw-bg-blue-600 tw-text-white tw-px-4 tw-py-2 tw-rounded-xl hover:tw-bg-blue-700 tw-transition">
                  Liên hệ
                </button>
              </div>
            </div>

            <div class="doctor-card tw-relative tw-bg-white tw-rounded-2xl tw-shadow-md tw-overflow-hidden tw-transition hover:tw-shadow-2xl">
              <div class="tw-h-72 tw-bg-white tw-flex tw-items-center tw-justify-center">
                <img src="/images/bs1.jpg" alt="Bác sĩ" class="tw-h-full tw-w-full tw-object-cover" />
              </div>
              <div class="tw-p-6">
                <h3 class="tw-text-2xl tw-font-semibold tw-text-gray-800">BS. Trần Thị Bình</h3>
                <p class="tw-text-blue-600 tw-mb-2">Chuyên khoa Dịch tễ</p>
                <p class="tw-text-gray-600 tw-mb-4 tw-line-clamp-2">
                  Tư vấn và quản lý lịch tiêm chủng điện tử, nghiên cứu dịch tễ học cộng đồng.
                </p>
                <button class="tw-bg-blue-600 tw-text-white tw-px-4 tw-py-2 tw-rounded-xl hover:tw-bg-blue-700 tw-transition">
                  Liên hệ
                </button>
              </div>
            </div>

            <div class="doctor-card tw-relative tw-bg-white tw-rounded-2xl tw-shadow-md tw-overflow-hidden tw-transition hover:tw-shadow-2xl">
              <div class="tw-h-72 tw-bg-white tw-flex tw-items-center tw-justify-center">
                <img src="/images/bs5.jpg" alt="Bác sĩ" class="tw-h-full tw-w-full tw-object-contain" />
              </div>
              <div class="tw-p-6">
                <h3 class="tw-text-2xl tw-font-semibold tw-text-gray-800">BS. Lê Minh Tuấn</h3>
                <p class="tw-text-blue-600 tw-mb-2">Chuyên khoa Miễn dịch</p>
                <p class="tw-text-gray-600 tw-mb-4 tw-line-clamp-2">
                  Nghiên cứu và tư vấn các loại vắc-xin, hướng dẫn an toàn tiêm chủng cho mọi đối tượng.
                </p>
                <button class="tw-bg-blue-600 tw-text-white tw-px-4 tw-py-2 tw-rounded-xl hover:tw-bg-blue-700 tw-transition">
                  Liên hệ
                </button>
              </div>
            </div>

            <div class="doctor-card tw-relative tw-bg-white tw-rounded-2xl tw-shadow-md tw-overflow-hidden tw-transition hover:tw-shadow-2xl">
              <div class="tw-h-72 tw-bg-white tw-flex tw-items-center tw-justify-center">
                <img src="/images/bs3.jpg" alt="Bác sĩ" class="tw-h-full tw-w-full tw-object-contain" />
              </div>
              <div class="tw-p-6">
                <h3 class="tw-text-2xl tw-font-semibold tw-text-gray-800">BS. Phạm Thị Hòa</h3>
                <p class="tw-text-blue-600 tw-mb-2">Chuyên khoa Nội tổng quát</p>
                <p class="tw-text-gray-600 tw-mb-4 tw-line-clamp-2">
                  Hỗ trợ chẩn đoán và tư vấn sức khỏe định kỳ, đảm bảo an toàn trong tiêm chủng.
                </p>
                <button class="tw-bg-blue-600 tw-text-white tw-px-4 tw-py-2 tw-rounded-xl hover:tw-bg-blue-700 tw-transition">
                  Liên hệ
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>


   
    </div>

    
  );
}
