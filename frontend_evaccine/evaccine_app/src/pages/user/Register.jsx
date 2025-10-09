
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { EyeIcon, EyeOffIcon } from "lucide-react";
import axios from "axios";  
import { toast } from "react-toastify";

export default function Register({ onClose }) {
  const navigate = useNavigate();

  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [repassword, setRePassword] = useState("");
  const [role] = useState("customer"); // mặc định là customer
  const [showPassword, setShowPassword] = useState(false);
  const [showRePassword, setShowRePassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [identifier, setIdentifier] = useState("");

 // --- VALIDATE FUNCTIONS ---
  const validateFullName = (value) => {
    if (!/^[\p{L}\s]+$/u.test(value)) {
      return "Họ và tên chỉ được chứa chữ cái và khoảng trắng";
    }
    if (value.trim().length < 5) {
      return "Họ và tên phải có ít nhất 5 ký tự";
    }
    return "";
  };

  const validateIdentifier = (value) => {
    if (value.includes("@")) {
      // email
      if (!value.endsWith("@gmail.com")) return "Email phải có đuôi @gmail.com";
      if (/\s/.test(value)) return "Email không được chứa khoảng trắng";
    } else {
      // phone
      if (!/^\d{10}$/.test(value)) return "Số điện thoại phải gồm đúng 10 chữ số";
    }
    return "";
  };

  const validatePassword = (value) => {
    if (/\s/.test(value)) return "Mật khẩu không được chứa khoảng trắng";
    if (!/[A-Z]/.test(value)) return "Mật khẩu phải có ít nhất 1 chữ hoa";
    if (!/[a-z]/.test(value)) return "Mật khẩu phải có ít nhất 1 chữ thường";
    if (!/[\W_]/.test(value)) return "Mật khẩu phải có ít nhất 1 ký tự đặc biệt";
    if (value.length < 6) return "Mật khẩu phải có ít nhất 6 ký tự";
    return "";
  };

  const validateRePassword = (value) => {
    if (value !== password) return "Mật khẩu nhập lại không khớp";
    return "";
  };

  // --- HANDLERS ON BLUR ---
  const handleBlur = (field) => {
    let err = "";
    switch (field) {
      case "fullName": err = validateFullName(fullName); break;
      case "identifier": err = validateIdentifier(identifier); break;
      case "password": err = validatePassword(password); break;
      case "repassword": err = validateRePassword(repassword); break;
      default: break;
    }
    setErrors((prev) => ({ ...prev, [field]: err }));
  };

  // --- HANDLE SUBMIT ---
  const handleSubmit = async (e) => {
    e.preventDefault();

    // validate all fields trước khi gửi
    const newErrors = {
      fullName: validateFullName(fullName),
      identifier: validateIdentifier(identifier),
      password: validatePassword(password),
      repassword: validateRePassword(repassword),
    };
    setErrors(newErrors);

    // nếu có lỗi thì chặn submit
    if (Object.values(newErrors).some((v) => v)) return;

    try {
      const response = await axios.post("http://127.0.0.1:8000/api/users/register/", {
        full_name: fullName,
        identifier,
        password,
        repassword,
        role
      });

      toast.success(response.data.message || "Đăng ký thành công!");
      setTimeout(() => navigate("/login"), 2000);

    } catch (err) {
      const resErrors = err.response?.data || {};
      for (const key in resErrors) {
        const msg = Array.isArray(resErrors[key]) ? resErrors[key][0] : resErrors[key];
        toast.error(msg);
      }
    }
  };


  // Hàm đóng form → quay về trang chủ
  const handleClose = () => {
    onClose?.(); // nếu có truyền props onClose thì gọi
    navigate("/login"); // sau khi đóng sẽ về trang login
  };

  return (
    <div className="tw-fixed tw-inset-0 tw-bg-black/60 tw-flex tw-items-center tw-justify-center tw-z-30 " onClick={handleClose}>
      {/* Khung chứa ảnh + form */}
      <div className="tw-w-full tw-max-w-7xl tw-bg-white tw-rounded-2xl tw-shadow-2xl tw-flex tw-overflow-hidden tw-mt-[90px]"
        onClick={(e) => e.stopPropagation()} >
        
        {/* Cột form bên trái */}
        <div className="tw-w-full md:tw-w-1/2 tw-p-5 tw-mx-[5px] tw-text-center tw-relative">
          <button  onClick={handleClose} className="tw-absolute tw-top-4 tw-right-4 tw-text-gray-500 hover:tw-text-red-500 tw-text-3xl tw-font-bold tw-w-14 tw-h-14 tw-flex tw-items-center tw-justify-center tw-rounded-full hover:tw-bg-gray-100" >
            <i className="fa-solid fa-xmark"></i>
          </button>

          <h2 className="tw-text-4xl tw-font-bold tw-text-blue-600 tw-mb-8">
            Tạo tài khoản
          </h2>

          <form className="tw-space-y-6 tw-text-left"  onSubmit={handleSubmit}>
            <div>
              <label  htmlFor="fullname" className="tw-block tw-text-2xl tw-font-medium tw-text-gray-700 tw-mb-2" >
                Họ và tên
              </label>
              <input  type="fullname"  id="fullname" name="fullname" required  value={fullName} onChange={(e) => setFullName(e.target.value)}  onBlur={() => handleBlur("fullName")}
                className="tw-w-full tw-px-4 tw-py-3 tw-border tw-border-gray-300 tw-rounded-lg focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-blue-500"
                placeholder="Nhập họ và tên của bạn"/>
            </div>
            {errors.fullName && <p className="tw-text-red-600 tw-text-base">{errors.fullName}</p>}

            <div>
              <label htmlFor="identifier" className="tw-block tw-text-2xl tw-font-medium tw-text-gray-700 tw-mb-2">
                Email hoặc Số điện thoại
              </label>
              <input  type="text" id="identifier" name="identifier" required value={identifier} onChange={(e) => setIdentifier(e.target.value)}  onBlur={() => handleBlur("identifier")}
                placeholder="Nhập email hoặc số điện thoại"
                className="tw-w-full tw-px-4 tw-py-3 tw-border tw-border-gray-300 tw-rounded-lg focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-blue-500"
              />
            </div>
            {errors.identifier && <p className="tw-text-red-600 tw-text-base">{errors.identifier}</p>}

            <div>
              <label htmlFor="password" className="tw-block tw-text-2xl tw-font-medium tw-text-gray-700 tw-mb-2">
                Mật khẩu
              </label>
              <div className="tw-relative">
                <input  type={showPassword ? "text" : "password"} id="password" name="password" required  value={password} onChange={(e) => setPassword(e.target.value)}  onBlur={() => handleBlur("password")}
                  className="tw-w-full tw-px-4 tw-py-3 tw-pr-12 tw-border tw-border-gray-300 tw-rounded-lg focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-blue-500"
                  placeholder="Nhập mật khẩu"/>
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="tw-absolute tw-right-3 tw-top-1/2 -tw-translate-y-1/2 tw-text-gray-500 hover:tw-text-gray-700" >
                  {showPassword ? <EyeIcon size={19} /> : <EyeOffIcon size={19} />}
                </button>
              </div>
            </div>
            {errors.password && <p className="tw-text-red-600 tw-text-base">{errors.password}</p>}

            <div>
              <label htmlFor="repassword" className="tw-block tw-text-2xl tw-font-medium tw-text-gray-700 tw-mb-2">
                Nhập lại mật khẩu
              </label>
              <div className="tw-relative">
                <input  type={showRePassword ? "text" : "password"} id="repassword" name="repassword" required   value={repassword}  onChange={(e) => setRePassword(e.target.value)} onBlur={() => handleBlur("repassword")}
                  className="tw-w-full tw-px-4 tw-py-3 tw-pr-12 tw-border tw-border-gray-300 tw-rounded-lg focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-blue-500"
                  placeholder="Nhập mật khẩu"/>
                <button type="button" onClick={() => setShowRePassword(!showRePassword)}
                  className="tw-absolute tw-right-3 tw-top-1/2 -tw-translate-y-1/2 tw-text-gray-500 hover:tw-text-gray-700" >
                  {showRePassword ? <EyeIcon size={19} /> : <EyeOffIcon size={19} />}
                </button>
              </div>
            </div>
              {errors.repassword && <p className="tw-text-red-600 tw-text-base">{errors.repassword}</p>}

            <button type="submit" className="tw-w-full tw-mt-[10px] tw-bg-gradient-to-r tw-from-[#abe0ff] tw-to-[#7ecbff] tw-text-blue-600 
             tw-py-4 tw-rounded-full tw-shadow-lg hover:tw-from-[#00c6ff] hover:tw-to-[#0061ff] hover:tw-text-white
             tw-text-2xl tw-font-bold tw-tracking-wide tw-transition-all tw-duration-300">
              Đăng ký
            </button>
          </form>
          

          <p className="tw-mt-8 tw-text-xl tw-text-gray-600"> Bạn đã có tài khoản?
            <Link to="/login" className="tw-text-blue-600  tw-font-medium tw-ml-1" >
              Đăng nhập
            </Link>
          </p>
        </div>

        {/* Cột ảnh bên phải */}
        <div className="tw-hidden md:tw-flex tw-w-1/2 tw-items-center tw-justify-center tw-bg-blue-50">
          <img  src="images/logoimg.jpg" alt="Register" className="tw-max-w-full tw-max-h-full tw-object-contain tw-rounded-l-2xl" />
        </div>

      </div>
    </div>

  );
}
