import { useState } from "react";
export default function Header() {
    const [showMore, setShowMore] = useState(false);
    return (
    <div>
 
        <section id="home" className="slider" data-stellar-background-ratio="0.5">
          <div className="container">
               <div className="row">

                         <div className="owl-carousel owl-theme">
                              <div className="item item-first">
                                   <div className="caption">
                                        <div className="col-md-offset-1 col-md-10">
                                             <h3>Cùng chung tay vì sức khỏe cộng đồng</h3>
                                             <h1>Hệ thống tiêm chủng điện tử eVaccine</h1>
                                             <a href="#team" className="section-btn btn btn-default smoothScroll" aria-label="Xem đội ngũ bác sĩ">Xem đội ngũ y bác sĩ</a>
                                        </div>
                                   </div>
                              </div>

                              <div className="item item-second">
                                   <div className="caption">
                                        <div className="col-md-offset-1 col-md-10">
                                            <h3>Quản lý lịch sử tiêm chủng nhanh chóng, chính xác</h3>
                                             <h1>Sổ tiêm chủng điện tử</h1>
                                             <a href="#about" className="section-btn btn btn-default btn-gray smoothScroll">Tìm hiểu thêm</a>
                                        </div>
                                   </div>
                              </div>

                              <div className="item item-third">
                                   <div className="caption">
                                        <div className="col-md-offset-1 col-md-10">
                                             <h3>Đặt lịch và nhắc lịch tiêm dễ dàng</h3>
                                             <h1>Bảo vệ sức khỏe gia đình bạn</h1>
                                             <a href="#news" className="section-btn btn btn-default btn-blue smoothScroll">Xem tin tức tiêm chủng</a>
                                        </div>
                                   </div>
                              </div>
                         </div>

               </div>
          </div>
        </section>
     
        <section id="about">
            <div className="container">
                <div className="row">

                        <div className="col-md-6 col-sm-6">
                            <div className="about-info">
                                <h2 className="wow fadeInUp" data-wow-delay="0.6s">
                                   Chào mừng đến với hệ thống tiêm chủng <i className="fa fa-medkit"></i> EVaccine 
                                </h2>
                                <div className="wow fadeInUp" data-wow-delay="0.8s">
                                    <p>
                                    EVaccine giúp bạn quản lý lịch sử tiêm chủng một cách tiện lợi, chính xác và an toàn. 
                                    Hệ thống hỗ trợ lưu trữ thông tin cá nhân, theo dõi mũi tiêm và nhắc lịch tự động.
                                    <br />
                                    Với EVaccine, việc đặt lịch, tra cứu danh mục vắc xin và cập nhật tin tức y tế 
                                    trở nên dễ dàng hơn bao giờ hết. Bảo vệ sức khỏe cho bạn và gia đình ngay hôm nay!
                                    </p>
                                </div>
                                <figure className="profile wow fadeInUp" data-wow-delay="1s">
                                    <img src="images/sy1.jpg" className="img-responsive" alt="" />
                                    <figcaption>
                                        <h3>BS. Nguyễn Thành An</h3>
                                            <p>Chuyên gia tiêm chủng</p>
                                    </figcaption>
                                </figure>
                            </div>
                        </div>
                        
                </div>
            </div>
        </section>

        <section className="tiemchung-section">
          <div className="image-grid">
          <img src="images/w1.jpg" alt="Tiêm chủng 1" />
          <img src="images/w2.jpg" alt="Tiêm chủng 2" />
          <img src="images/w3.jpg" alt="Tiêm chủng 3" />
          <img src="images/w4.jpg" alt="Tiêm chủng 4" />
          <img src="images/w5.jpg" alt="Tiêm chủng 5" />
          <img src="images/w6.jpg" alt="Tiêm chủng 6" />
          </div>

          <div className="info-text">
          <h2>HỆ THỐNG TRUNG TÂM TIÊM CHỦNG EVACCINE</h2>
          <h4>Địa điểm tiêm vắc xin An toàn – Uy tín – Chất lượng cho người dân Việt Nam</h4>
          <p>
               E-Vaccine sở hữu hệ thống quản lý tiêm chủng điện tử hiện đại, giúp người dân và trẻ em dễ dàng 
               tiếp cận nguồn vắc xin chất lượng, minh bạch, giá hợp lý. Hệ thống hỗ trợ lưu trữ hồ sơ tiêm, 
               đặt lịch và nhắc lịch tự động, mang lại sự tiện lợi và an toàn tối đa.
               Với đội ngũ y bác sĩ tận tâm cùng nền tảng công nghệ hiện đại, EVaccine khẳng định vị thế tiên phong 
               trong lĩnh vực tiêm chủng điện tử, đảm bảo nguồn cung cấp vắc xin chính hãng, bảo quản đúng chuẩn, 
               đáp ứng nhu cầu chăm sóc sức khỏe cộng đồng ngày càng tăng cao.
          </p>
      
          {showMore && (
            <div className="extra-content">
              <h3>EVaccine đảm bảo nguồn cung vắc xin chất lượng cao</h3>
              <p>
                Khẳng định vị thế tiên phong trong lĩnh vực tiêm chủng vắc xin
                dịch vụ, Hệ thống Trung tâm tiêm chủng EVaccine mang đến nguồn cung
                vắc xin chính hãng, đa dạng và số lượng lớn, từ các loại vắc xin
                trong Chương trình Tiêm chủng mở rộng quốc gia đến các loại vắc
                xin thế hệ mới thường xuyên khan hiếm. Nhờ uy tín vững mạnh và
                hợp tác chiến lược cùng hầu hết các hãng dược phẩm hàng đầu thế
                giới, EVaccine đảm bảo nhập khẩu chính hãng, ổn định nguồn cung, đáp
                ứng nhu cầu tiêm phòng ngày càng tăng.
              </p>

              <h3>Bảo quản vắc xin theo chuẩn Quốc tế</h3>
              <p>
                EVaccine xây dựng và vận hành chuyên nghiệp hệ thống bảo quản vắc
                xin hiện đại, gồm mạng lưới hàng trăm kho lạnh GSP, cùng hệ thống
                xe lạnh vận chuyển chuyên dụng. Ngoài ra, EVaccine còn có 3 kho lạnh
                âm sâu đến -86°C, lưu giữ được hàng triệu liều vắc xin đặc biệt.
              </p>

              <h3>Cam kết quy trình tiêm chủng an toàn</h3>
              <p>
                100% bác sĩ có chứng chỉ An toàn tiêm chủng, 90% điều dưỡng đạt
                tay nghề cao, cùng phòng xử trí phản ứng sau tiêm đầy đủ trang
                thiết bị. EVaccine còn vận hành Tổng đài hỗ trợ xử trí phản ứng sau
                tiêm, mang đến sự an tâm tối đa.
              </p>

              <h3>Mức giá hợp lý và nhiều ưu đãi</h3>
              <p>
                Khách hàng được miễn phí khám sàng lọc, hỗ trợ trả phí linh hoạt
                và hưởng nhiều tiện ích cao cấp như khu vui chơi, phòng mẹ và bé,
                wifi, nước uống, tã bỉm miễn phí.
              </p>

              <h3>Cơ sở vật chất hiện đại, tiện nghi</h3>
              <p>
                EVaccine cung cấp hệ thống phòng khám, phòng tiêm, phòng theo dõi sau
                tiêm đạt chuẩn quốc tế. Không gian sạch sẽ, thoáng mát, tiện nghi
                cho cả trẻ em và người lớn.
              </p>

              <h3>Dịch vụ tiêm chủng đa dạng</h3>
              <p>
               EVaccine cung cấp nhiều dịch vụ tiêm chủng đặc biệt, đáp ứng linh hoạt nhu cầu và chi phí của Khách hàng.
               </p>

               <table className="service-table">
               <tr>
               <th>Dịch vụ Tiêm chủng VIP</th>
               <th>Dịch vụ Tiêm chủng Ưu tiên</th>
               <th>Dịch vụ Tiêm chủng Lưu động</th>
               <th>Dịch vụ Tiêm chủng theo Yêu cầu</th>
               </tr>
               <tr>
               <td>
                    Mang đến không gian riêng tư, sang trọng với cơ sở vật chất cao cấp, khu vui chơi riêng biệt, tách biệt hoàn toàn với khu tiêm chủng tiêu chuẩn.
               </td>
               <td>
                    Hỗ trợ Khách hàng tham gia gói vắc xin và Khách hàng VIP, giảm thời gian chờ đợi, đồng thời nâng cao chất lượng dịch vụ.
               </td>
               <td>
                    Tận dụng hệ thống kho và xe bảo quản vắc xin chuyên nghiệp, cùng đội ngũ bác sĩ giàu kinh nghiệm, EVaccine triển khai tiêm chủng tại chỗ, quy mô lớn cho Doanh nghiệp, Cơ quan, Trường học...
               </td>
               <td>
                    Phù hợp cho nhiều nhóm Khách hàng: từ trẻ sơ sinh, trẻ nhỏ, thanh thiếu niên, người lớn, phụ nữ mang thai, đến người có bệnh nền hoặc những người cần tiêm phục vụ du lịch, du học...
               </td>
               </tr>
               </table>
            </div>
          )}


          <button id="toggleBtn" className="custom-btn" onClick={() => setShowMore(!showMore)}>
            {showMore ? "Thu gọn" : "Xem thêm"} <i className="fa fa-chevron-down"></i>
          </button>
          </div>
        </section>
    </div>
    );
}