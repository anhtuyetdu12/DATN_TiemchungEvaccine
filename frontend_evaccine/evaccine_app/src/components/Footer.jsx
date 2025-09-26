export default function Footer() {
  return (
    <div>
      {/* Google Map */}
      <section id="google-map">
        <iframe
          src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d62714.211241851844!2d108.14778530488053!3d16.047165923582854!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x314219c792f2b4b5%3A0x20ee9e97e4c77ec2!2zxJDDoCBO4bqhbmc!5e0!3m2!1svi!2s!4v1690000000000"
          width="100%" height="350" style={{ border: 0 }} allowFullScreen={true} loading="lazy"  referrerPolicy="no-referrer-when-downgrade"
          title="Google Map of Da Nang, Vietnam"
        />
      </section>

      {/* Footer */}
      <footer className="tw-bg-[#f9f9f9] tw-pt-5 tw-pb-5 tw-mt-10 tw-border-t tw-border-[#ddd] tw-font-sans">
        <div className="tw-max-w-[1200px] tw-mx-auto tw-px-5">
          {/* Footer Row */}
          <div className="tw-flex tw-flex-wrap tw-justify-between tw-gap-[30px]">
            {/* Cột 1 */}
            <div className="tw-flex-1 tw-min-w-[220px] tw-text-left">
              <h4 className="tw-text-[16px] tw-font-bold tw-mb-[15px] tw-text-[#1a237e] tw-uppercase">
                VỀ CHÚNG TÔI
              </h4>
              <ul>
                <li className="tw-mb-[10px]">
                  <a href="#!" className="tw-text-[#555] tw-text-[14px] tw-font-medium hover:tw-text-[#0866ff] tw-transition-colors">
                    Giới thiệu Tiêm Chủng E-Vaccine
                  </a>
                </li>
                <li className="tw-mb-[10px]">
                  <a href="#!" className="tw-text-[#555] tw-text-[14px] tw-font-medium hover:tw-text-[#0866ff] tw-transition-colors" >
                    Quy chế hoạt động website/ứng dụng thương mại điện tử bán
                    hàng
                  </a>
                </li>
                <li className="tw-mb-[10px]">
                  <a href="#!" className="tw-text-[#555] tw-text-[14px] tw-font-medium hover:tw-text-[#0866ff] tw-transition-colors" >
                    Chính sách nội dung
                  </a>
                </li>
                <li className="tw-mb-[10px]">
                  <a href="#!" className="tw-text-[#555] tw-text-[14px] tw-font-medium hover:tw-text-[#0866ff] tw-transition-colors" >
                    Chính sách bảo mật dữ liệu cá nhân khách hàng
                  </a>
                </li>
              </ul>
            </div>

            {/* Cột 2 */}
            <div className="tw-flex-1 tw-min-w-[220px] tw-text-left">
              <h4 className="tw-text-[16px] tw-font-bold tw-mb-[15px] tw-text-[#1a237e] tw-uppercase">
                MỤC NỔI BẬT
              </h4>
              <ul>
                <li className="tw-mb-[10px]">
                  <a href="#!" className="tw-text-[#555] tw-text-[14px] tw-font-medium hover:tw-text-[#0866ff]" >
                    Danh mục vắc xin
                  </a>
                </li>
                <li className="tw-mb-[10px]">
                  <a  href="#!"  className="tw-text-[#555] tw-text-[14px] tw-font-medium hover:tw-text-[#0866ff]" >
                    Kiến thức tiêm chủng
                  </a>
                </li>
                <li className="tw-mb-[10px]">
                  <a href="#!" className="tw-text-[#555] tw-text-[14px] tw-font-medium hover:tw-text-[#0866ff]" >
                    Đội ngũ bác sĩ, chuyên gia
                  </a>
                </li>
                <li className="tw-mb-[10px]">
                  <a href="#!" className="tw-text-[#555] tw-text-[14px] tw-font-medium hover:tw-text-[#0866ff]" >
                    Lịch sử tiêm chủng
                  </a>
                </li>
              </ul>
            </div>

            {/* Cột 3 */}
            <div className="tw-flex-1 tw-min-w-[220px] tw-text-left">
              <h4 className="tw-text-[16px] tw-font-bold tw-mb-[15px] tw-text-[#1a237e] tw-uppercase">
                TÌM HIỂU THÊM
              </h4>
              <ul>
                <li className="tw-mb-[10px]">
                  <a  href="#!" className="tw-text-[#555] tw-text-[14px] tw-font-medium hover:tw-text-[#0866ff]" >
                    Khuyến mãi
                  </a>
                </li>
                <li className="tw-mb-[10px]">
                  <a href="#!" className="tw-text-[#555] tw-text-[14px] tw-font-medium hover:tw-text-[#0866ff]" >
                    Tôi nên tiêm gì?
                  </a>
                </li>
                <li className="tw-mb-[10px]">
                  <a href="#!" className="tw-text-[#555] tw-text-[14px] tw-font-medium hover:tw-text-[#0866ff]">
                    Tiêm chủng đi nước ngoài
                  </a>
                </li>
              </ul>
            </div>

            {/* Cột 4 */}
            <div className="tw-flex-1 tw-min-w-[220px] tw-text-left">
              <h4 className="tw-text-[16px] tw-font-bold tw-mb-[15px] tw-text-[#1a237e] tw-uppercase">
                THÔNG TIN LIÊN HỆ
              </h4>
              <ul className="tw-list-none tw-p-0 tw-m-0">
                <li className="tw-flex tw-items-center tw-mb-[10px] tw-text-[#555] tw-text-[14px] tw-font-medium">
                  <i className="fa-solid fa-phone-volume tw-text-[#1624b7] tw-mr-[10px] tw-min-w-[20px] tw-text-center"></i>
                  <span>+1800 6926</span>
                </li>
                <li className="tw-flex tw-items-center tw-mb-[10px] tw-text-[#555] tw-text-[14px] tw-font-medium">
                  <i className="fa fa-envelope tw-text-[#1624b7] tw-mr-[10px] tw-min-w-[20px] tw-text-center"></i>
                  <a href="mailto:tiemchung.evaccine@gmail.com" className="hover:tw-text-[#0866ff]">
                    tiemchung.evaccine@gmail.com
                  </a>
                </li>
                <li className="tw-flex tw-items-center tw-mb-[10px] tw-text-[#555] tw-text-[14px] tw-font-medium">
                  <i className="fa-solid fa-location-dot tw-text-[#1624b7] tw-mr-[10px] tw-min-w-[20px] tw-text-center"></i>
                  <span>255 Lê Duẩn, Thanh Khê, Tp. Đà Nẵng</span>
                </li>
              </ul>

              <h4 className="tw-text-[16px] tw-font-bold tw-mt-[20px] tw-mb-[10px] tw-text-[#1a237e] tw-uppercase">
                KẾT NỐI VỚI CHÚNG TÔI
              </h4>
              <div className="tw-flex tw-gap-[15px] tw-mt-[10px]">
                <a href="https://facebook.com" target="_blank" rel="noopener noreferrer"
                  className="tw-w-[30px] tw-h-[30px] tw-rounded-full tw-bg-[#0866ff] tw-text-white tw-flex tw-items-center tw-justify-center tw-text-[18px] hover:tw-bg-white hover:tw-text-[#0866ff] hover:tw-border hover:tw-border-[#0866ff] tw-transition-all" >
                  <i className="fab fa-facebook-f"></i>
                </a>
                <a href="https://tiktok.com" target="_blank" rel="noopener noreferrer"
                  className="tw-w-[30px] tw-h-[30px] tw-rounded-full tw-bg-[#0866ff] tw-text-white tw-flex tw-items-center tw-justify-center tw-text-[18px] hover:tw-bg-white hover:tw-text-[#0866ff] hover:tw-border hover:tw-border-[#0866ff] tw-transition-all" >
                  <i className="fab fa-tiktok"></i>
                </a>
                <a href="https://www.instagram.com" target="_blank" rel="noopener noreferrer"
                  className="tw-w-[30px] tw-h-[30px] tw-rounded-full tw-bg-[#0866ff] tw-text-white tw-flex tw-items-center tw-justify-center tw-text-[18px] hover:tw-bg-white hover:tw-text-[#0866ff] hover:tw-border hover:tw-border-[#0866ff] tw-transition-all" >
                  <i className="fa-brands fa-instagram"></i>
                </a>
                <a href="https://youtube.com" target="_blank" rel="noopener noreferrer"
                  className="tw-w-[30px] tw-h-[30px] tw-rounded-full tw-bg-[#0866ff] tw-text-white tw-flex tw-items-center tw-justify-center tw-text-[18px] hover:tw-bg-white hover:tw-text-[#0866ff] hover:tw-border hover:tw-border-[#0866ff] tw-transition-all" >
                  <i className="fab fa-youtube"></i>
                </a>
              </div>
            </div>
          </div>

          {/* Footer Bottom */}
          <div className="tw-mt-[20px] tw-pt-[15px] tw-border-t tw-border-[#ddd] tw-text-center tw-text-[12px] tw-text-[#888a8c]">
            <p className="tw-m-0 tw-text-[#888a8c] tw-text-[12px] tw-font-medium">
              Bản quyền ©2025 thuộc về{" "}
              <strong className="tw-uppercase tw-text-[#888a8c] tw-text-[12px]">
                công ty cổ phần vacxin việt nam
              </strong>
              , dành cho E-Vaccine
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
