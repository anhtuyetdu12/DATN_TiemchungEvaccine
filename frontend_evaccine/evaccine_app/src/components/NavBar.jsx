import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
export default function NavBar({ user, setUser }) {

    const [loading, setLoading] = useState(true);
    const [showDropdown, setShowDropdown] = useState(false);

    // tự động đóng khi click ra phía ngoài 
    useEffect(() => {
      const handleClickOutside = (e) => {
        if (!e.target.closest(".user-dropdown")) {
          setShowDropdown(false);
        }
      };
      document.addEventListener("click", handleClickOutside);
      return () => document.removeEventListener("click", handleClickOutside);
    }, []);



    const handleLogout = () => {
        localStorage.removeItem("user"); // xóa dữ liệu user
        setUser(null);
    };

    useEffect(() => {
        // giả lập load xong sau 1.5 giây
        const timer = setTimeout(() => setLoading(false), 1500);
        return () => clearTimeout(timer);
    }, []);
    if (loading) {
        return (
        <section className="tw-fixed tw-inset-0 tw-z-[9999] tw-flex tw-items-center tw-justify-center tw-bg-white">
            <div className="tw-relative tw-rounded tw-border tw-border-transparent">
            <span className="tw-block tw-w-[45px] tw-h-[45px] tw-border tw-border-gray-500 tw-border-t-white tw-rounded-full tw-animate-spin"></span>
            </div>
        </section>
        );
    }
  return (
    <div>
      
      <div className="tw-fixed tw-top-0 tw-left-0 tw-w-full tw-z-[1000] tw-bg-white tw-shadow-md">
        <header className="tw-flex tw-justify-between tw-items-center tw-h-[45px] tw-border-b tw-border-[#f2f2f2]  tw-px-[30px]">
          <p className="tw-text-[12px] tw-leading-[24px] tw-pt-3 tw-text-[#2e95ef]">
            EVaccine: Giải pháp Quản lý Tiêm chủng Toàn diện
          </p>

          <div className="tw-flex tw-items-center tw-gap-x-4">
            <span className="tw-text-[12px] tw-leading-[24px] tw-pt-3 tw-font-medium tw-text-[#2e95ef] tw-flex tw-items-center">
              <i className="fa fa-phone tw-text-[#222fc4] tw-mr-2 "></i> +1800 6926
            </span>
            <span className="tw-text-[12px] tw-leading-[24px] tw-pt-3 tw-font-medium tw-text-[#2e95ef] tw-border-x tw-border-[#f2f2f2] tw-px-4 tw-flex tw-items-center">
              <i className="fa fa-calendar-plus-o tw-text-[#222fc4] tw-mr-2 "></i>
              7:00 AM - 10:00 PM (Mon-Fri)
            </span>
            <span className="tw-text-[12px] tw-leading-[24px] tw-pt-3 tw-font-medium tw-text-[#2e95ef] tw-flex tw-items-center">
              <i className="fa fa-envelope-o tw-text-[#222fc4] tw-mr-2 "></i>
              <a  href="mailto:evaccine@gmail.com"
                className="hover:tw-underline" >
                evaccine@gmail.com
              </a>
            </span>
          </div>
        </header>

        <nav className="tw-bg-white tw-shadow-md tw-p-3">
          <div className="tw-flex tw-justify-between tw-items-center tw-mx-auto tw-px-[40px]">
            <div className="tw-flex tw-items-center tw-justify-start tw-ml-[22px]">
                <a  href="/" className="tw-text-[#1a237e] tw-font-bold tw-text-[24px] tw-no-underline tw-flex tw-items-center"  >
                <i className="fa fa-medkit tw-text-[#1a237e] tw-mr-2"></i> E-Vaccine
                </a>
            </div>

            <div className="tw-flex tw-items-center tw-justify-end tw-mr-[22px]">
                <ul className="tw-flex tw-items-center tw-space-x-[22px]">
                  <li> <Link  to="/"  className="tw-text-[#333] tw-text-[14px] tw-font-semibold hover:tw-text-[#1999ee] tw-transition-colors" >
                      Trang chủ
                      </Link>
                  </li>
                  <li>
                      <Link  to="/recordbook" className="tw-text-[#333] tw-text-[14px] tw-font-semibold hover:tw-text-[#1999ee] tw-transition-colors"  >
                      Sổ tiêm chủng
                      </Link>
                  </li>
                  <li>
                      <Link to="/appointments"
                      className="tw-text-[#333] tw-text-[14px] tw-font-semibold hover:tw-text-[#1999ee] tw-transition-colors" >
                      Lịch tiêm
                      </Link>
                  </li>
                  <li>
                      <Link to="/vaccines"
                      className="tw-text-[#333] tw-text-[14px] tw-font-semibold hover:tw-text-[#1999ee] tw-transition-colors"  >
                      Danh mục vắc xin
                      </Link>
                  </li>
                  <li>
                      <Link to="/knowledge"
                      className="tw-text-[#333] tw-text-[14px] tw-font-semibold hover:tw-text-[#1999ee] tw-transition-colors" >
                      Kiến thức tiêm chủng
                      </Link>
                  </li>
                  <li className="tw-relative">
                    {user ? (
                      <div className="user-dropdown tw-relative tw-flex tw-items-center tw-gap-2">
                        {/* Trigger */}
                        <span
                          onClick={() => setShowDropdown((prev) => !prev)}
                          className="tw-text-[#333] tw-text-[14px] tw-font-semibold tw-cursor-pointer hover:tw-text-[#1999ee] tw-transition-colors" >
                          Xin chào, {user.full_name}
                        </span>

                        {/* Dropdown */}
                        {showDropdown && (
                          <div className="tw-absolute tw-left-7 tw-top-full tw-mt-2 tw-bg-white tw-rounded-lg tw-shadow-lg tw-transition-all tw-duration-200 tw-ease-in-out">
                            <button
                              onClick={handleLogout}
                              className="tw-block tw-w-full tw-text-left tw-px-4 tw-py-2 tw-text-red-600 hover:tw-bg-red-100 tw-rounded-lg" >
                              Đăng xuất
                            </button>
                          </div>
                        )}
                      </div>
                    ) : (
                      <Link
                        to="/login"
                        className="tw-bg-[#1999ee] tw-text-white tw-py-2 tw-px-4 tw-rounded-full tw-inline-flex tw-items-center tw-border-2 
                                  tw-border-transparent hover:tw-bg-white hover:tw-text-[#1999ee] hover:tw-border-[#1999ee] tw-transition-all" >
                        <i className="fa fa-user tw-mr-[5px]"></i> Đăng nhập
                      </Link>
                    )}
                  </li>

                </ul>
            </div>
          </div>
        </nav>
      </div>
    </div>
  );
}
