import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { EyeIcon, EyeOffIcon } from "lucide-react";
import axios from "axios";
import { toast } from "react-toastify";

export default function Login({ setUser }) {
  const navigate = useNavigate();
  const [identifier, setIdentifier] = useState(""); // email hoặc phone
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});


  // --- VALIDATE FUNCTIONS ---
  const validateIdentifier = (value) => {
    if (value.includes("@")) {
      // email
      if (!/@gmail\.com$/.test(value) && !/@evaccine\.com$/.test(value))
        return "Email phải có đuôi @gmail.com hoặc @evaccine.com";
      if (/\s/.test(value)) return "Email không được chứa khoảng trắng";
    } else {
      // phone
      if (!/^\d{10}$/.test(value)) return "Số điện thoại phải gồm đúng 10 chữ số";
    }
    return "";
  };

  const validatePassword = (value) => {
    if (/\s/.test(value)) return "Mật khẩu không được chứa khoảng trắng";
    if (value.trim() === "") return "Mật khẩu không được để trống";
    return "";
  };

  const handleBlur = (field) => {
    let err = "";
    if (field === "identifier") err = validateIdentifier(identifier);
    if (field === "password") err = validatePassword(password);
    setErrors((prev) => ({ ...prev, [field]: err }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); // ngăn chặn load trang 

    // validate trước khi submit
    const newErrors = {
      identifier: validateIdentifier(identifier),
      password: validatePassword(password),
    };

    if (Object.values(newErrors).some((v) => v)) {
      Object.values(newErrors).forEach(err => { if (err) toast.error(err); });
      return;
    }
    try {
      const response = await axios.post("http://127.0.0.1:8000/api/users/login/", {
        identifier,
        password,
        remember: true 
      });

       // kiểm tra cờ require_change_password từ API
      if (response.data.require_change_password) {
        localStorage.setItem("identifier", identifier);
        navigate("/change-password");
        return;
      }

      const userData = {
        ...response.data.user,
        role: response.data.user.role.toLowerCase().trim(), // chuẩn hóa lowercasse
      };
      localStorage.setItem("user", JSON.stringify(userData));
      setUser(userData);

      // --- redirect theo role ---
      if (userData.role === "customer") {
        navigate("/user/home");
      } else if (userData.role === "staff") {
        navigate("/staff/home");
      } else {
        navigate("/"); // mặc định trang home user
      }

      toast.success("Đăng nhập thành công!");

    } catch (err) {
      toast.error(err.response?.data?.detail || "Đăng nhập thất bại");
    }
  };

  // Hàm đóng form → quay về trang chủ
  const handleClose = () => {
    navigate("/"); 
  };
  return (
    <div className="tw-fixed tw-inset-0 tw-bg-black/60 tw-flex tw-items-center tw-justify-center tw-z-40 tw-mt-[100px] " onClick={handleClose}>
      {/* Khung chứa ảnh + form */}
      <div className="tw-w-full tw-max-w-7xl tw-bg-white tw-rounded-2xl tw-shadow-2xl tw-flex tw-overflow-hidden"
        onClick={(e) => e.stopPropagation()} >
        {/* Cột ảnh bên trái */}
        <div className="tw-hidden md:tw-flex tw-w-1/2 tw-items-center tw-justify-center tw-bg-blue-50">
          <img  src="images/logoimg.jpg" alt="Login" className="tw-max-w-full tw-max-h-full tw-object-contain tw-rounded-l-2xl" />
        </div>

        {/* Cột form bên phải */}
        <div className="tw-w-full md:tw-w-1/2 tw-p-10 tw-text-center tw-relative">
          <button  onClick={handleClose} className="tw-absolute tw-top-4 tw-right-4 tw-text-gray-500 hover:tw-text-red-500 tw-text-3xl tw-font-bold tw-w-14 tw-h-14 tw-flex tw-items-center tw-justify-center tw-rounded-full hover:tw-bg-gray-100" >
            <i className="fa-solid fa-xmark"></i>
          </button>

          <h2 className="tw-text-4xl tw-font-bold tw-text-blue-600 tw-mb-8">
            Đăng nhập tài khoản
          </h2>
          <form className="tw-space-y-6 tw-text-left" onSubmit={handleSubmit}>
            <div>
              <label  htmlFor="identifier" className="tw-block tw-text-2xl tw-font-medium tw-text-gray-700 tw-mb-2" >
                Email hoặc Số điện thoại
              </label>
              <input type="text"  id="identifier" name="identifier" required  value={identifier}
                onChange={(e) => setIdentifier(e.target.value)} onBlur={() => handleBlur("identifier")}
                className="tw-w-full tw-px-4 tw-py-3 tw-border tw-border-gray-300 tw-rounded-lg focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-blue-500"
                placeholder="Nhập email hoặc số điện thoại"/>
                {errors.identifier && <p className="tw-text-red-600 tw-text-base">{errors.identifier}</p>}
            </div>

            <div>
              <label htmlFor="password" className="tw-block tw-text-2xl tw-font-medium tw-text-gray-700 tw-mb-4">
                Mật khẩu
              </label>
              <div className="tw-relative">
                <input  type={showPassword ? "text" : "password"} id="password" name="password" required  value={password} onChange={(e) => setPassword(e.target.value)}
                      onBlur={() => handleBlur("password")}
                  className="tw-w-full tw-px-4 tw-py-3 tw-pr-12 tw-border tw-border-gray-300 tw-rounded-lg focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-blue-500"
                  placeholder="Nhập mật khẩu"/>
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="tw-absolute tw-right-3 tw-top-1/2 -tw-translate-y-1/2 tw-text-gray-500 hover:tw-text-gray-700" >
                  {showPassword ? <EyeOffIcon size={19} /> : <EyeIcon  size={19} />}
                </button>
              </div>
            </div>

            <div className="tw-flex tw-items-center tw-justify-between tw-mt-2">
              <label className="tw-flex tw-items-center tw-space-x-2 tw-text-gray-500 tw-text-lg tw-cursor-pointer">
                <input type="checkbox" className="tw-h-5 tw-w-5 tw-text-blue-500 focus:tw-ring-blue-500 tw-rounded tw-cursor-pointer" />
                <span>Ghi nhớ đăng nhập</span>
              </label>
              <Link to="/forgot-password" className="tw-text-blue-600  tw-text-lg tw-cursor-pointer" >
                Quên mật khẩu?
              </Link>
            </div>

            <button type="submit" className="tw-w-full tw-mt-[10px] tw-bg-gradient-to-r tw-from-[#abe0ff] tw-to-[#7ecbff] tw-text-blue-600 
             tw-py-4 tw-rounded-full tw-shadow-lg hover:tw-from-[#00c6ff] hover:tw-to-[#0061ff] hover:tw-text-white
             tw-text-2xl tw-font-bold tw-tracking-wide tw-transition-all tw-duration-300">
              Đăng nhập
            </button>
          </form>
          <p className="tw-mt-8 tw-text-xl tw-text-gray-600"> Chưa có tài khoản?
            <Link to="/register" className="tw-text-blue-600 tw-font-medium tw-ml-1" >
              Đăng ký ngay
            </Link>
          </p>
        </div>
      </div>
    </div>

  );
}
