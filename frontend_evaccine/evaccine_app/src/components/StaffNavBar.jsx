import { Link  } from "react-router-dom";
import { useEffect, useState } from "react";
// import api from "../services/axios";

export default function StaffNavBar({ user, setUser }) {
  const [loading, setLoading] = useState(true);
  const [showDropdown, setShowDropdown] = useState(false);
  // const navigate = useNavigate(); 
  // Tự động đóng khi click ra ngoài
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
    localStorage.removeItem("user");
    setUser(null);
  };
   

  useEffect(() => {
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
      {/* Header top bar */}
      <div className="tw-fixed tw-top-0 tw-left-0 tw-w-full tw-z-[1000] tw-bg-white tw-shadow-md">
        <header className="tw-flex tw-justify-between tw-items-center tw-h-[35px] tw-border-b tw-border-[#f2f2f2]  tw-px-[30px]">
          <p className="tw-text-[12px] tw-leading-[24px] tw-pt-3 tw-text-[#2e95ef]">
            EVaccine: Giải pháp Quản lý Tiêm chủng Toàn diện
          </p>
          <div className="tw-flex tw-items-center tw-gap-x-4">
            <span className="tw-text-[12px] tw-font-medium tw-text-[#2e95ef] tw-flex tw-items-center">
              <i className="fa fa-phone tw-text-[#2e95ef] tw-mr-2 "></i> +1800 6926
            </span>
            <span className="tw-text-[12px] tw-font-medium tw-text-[#2e95ef] tw-border-x tw-border-[#f2f2f2] tw-px-4 tw-flex tw-items-center">
              <i className="fa fa-calendar-plus-o tw-text-[#2e95ef] tw-mr-2 "></i>
              7:00 AM - 10:00 PM (Mon-Fri)
            </span>
            <span className="tw-text-[12px] tw-font-medium tw-text-[#2e95ef] tw-flex tw-items-center">
              <i className="fa fa-envelope-o tw-text-[#2e95ef] tw-mr-2 "></i>
              <a href="mailto:tiemchung.evaccine@gmail.com" className="hover:tw-underline">
                tiemchung.evaccine@gmail.com
              </a>
            </span>
          </div>
        </header>

        {/* Navbar */}
        <nav className="tw-bg-white tw-shadow-md tw-p-3">
          <div className="tw-flex tw-justify-between tw-items-center tw-mx-auto tw-px-[40px]">
            {/* Logo */}
            <div className="tw-flex tw-items-center">
              <Link  to="/" className="tw-text-[#1a237e] tw-font-bold tw-text-[24px] tw-no-underline tw-flex tw-items-center" >
                <i className="fa fa-medkit tw-text-[#1a237e] tw-mr-2"></i> E-Vaccine
              </Link>
            </div>

            {/* Menu */}
            <div className="tw-flex tw-items-center tw-justify-end">
              <ul className="tw-flex tw-items-center tw-space-x-[22px]">
                {user?.role === "staff" ? (
                  <>
                    {/* Menu cho staff */}
                    <li> <Link to="/staff/home"
                        className="tw-text-[#333] tw-text-[14px] tw-font-semibold hover:tw-text-[#1999ee]" >
                        Trang chủ
                      </Link>
                    </li>
                    <li> <Link to="/staff/appointments"
                        className="tw-text-[#333] tw-text-[14px] tw-font-semibold hover:tw-text-[#1999ee]" >
                        Quản lý lịch hẹn
                      </Link>
                    </li>
                    <li> <Link to="/staff/vaccines"
                        className="tw-text-[#333] tw-text-[14px] tw-font-semibold hover:tw-text-[#1999ee]" >
                        Quản lý vắc xin
                      </Link>
                    </li>
                    <li> <Link to="/staff/customers"
                        className="tw-text-[#333] tw-text-[14px] tw-font-semibold hover:tw-text-[#1999ee]"  >
                        Quản lý khách hàng
                      </Link>
                    </li>
                    <li>
                        <Link to="/staff/notifications"
                            className="tw-text-[#333] tw-text-[14px] tw-font-semibold hover:tw-text-[#1999ee]">
                            Gửi thông báo
                        </Link>
                    </li>
                    <li>
                        <Link to="/staff/reports"
                            className="tw-text-[#333] tw-text-[14px] tw-font-semibold hover:tw-text-[#1999ee]">
                            Thống kê
                        </Link>
                    </li>
                  </>
                ) : (
                  <>
                    {/* Menu cho user */}
                    <li> <Link  to="/"
                        className="tw-text-[#333] tw-text-[14px] tw-font-semibold hover:tw-text-[#1999ee]"  >
                        Trang chủ
                      </Link>
                    </li>
                    <li> <Link to="/recordbook"
                        className="tw-text-[#333] tw-text-[14px] tw-font-semibold hover:tw-text-[#1999ee]" >
                        Sổ tiêm chủng
                      </Link>
                    </li>
                    <li>  <Link to="/appointments"
                        className="tw-text-[#333] tw-text-[14px] tw-font-semibold hover:tw-text-[#1999ee]" >
                        Lịch tiêm
                      </Link>
                    </li>
                    <li> <Link to="/vaccines"
                        className="tw-text-[#333] tw-text-[14px] tw-font-semibold hover:tw-text-[#1999ee]"  >
                        Danh mục vắc xin
                      </Link>
                    </li>
                    <li> <Link to="/knowledge"
                        className="tw-text-[#333] tw-text-[14px] tw-font-semibold hover:tw-text-[#1999ee]" >
                        Kiến thức tiêm chủng
                      </Link>
                    </li>
                  </>
                )}

                {/* Dropdown user */}
                <li className="tw-relative">
                  {user ? (
                    <div className="user-dropdown tw-flex tw-items-center tw-gap-2">
                      <span
                        onClick={() => setShowDropdown((prev) => !prev)}
                        className="tw-text-[#333] tw-text-[14px] tw-font-semibold tw-cursor-pointer hover:tw-text-[#1999ee]" >
                        Xin chào, {user.full_name}
                      </span>
                      {showDropdown && (
                        <div className="tw-absolute tw-left-7 tw-top-full tw-mt-2 tw-bg-white tw-rounded-lg tw-shadow-lg">
                          <button
                            onClick={handleLogout}
                            className="tw-block tw-w-full tw-border-lg tw-text-left tw-px-4 tw-py-2 tw-text-red-600 hover:tw-bg-red-100 hover:tw-border-lg "  >
                            Đăng xuất
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <Link to="/login"
                      className="tw-bg-[#1999ee] tw-text-white tw-py-2 tw-px-4 tw-rounded-full hover:tw-bg-white hover:tw-text-[#1999ee] hover:tw-border-[#1999ee] tw-border-2 tw-border-transparent tw-transition-all" >
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
