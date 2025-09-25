import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { EyeIcon, EyeOffIcon} from "lucide-react";
import axios from "axios";
import { toast } from "react-toastify";

export default function ResetPassword() {
  const [params] = useSearchParams();
  const identifier = params.get("identifier"); // từ query
  const token = params.get("token"); // chỉ có khi email

  const [newPassword, setNewPassword] = useState("");
  const [rePassword, setRePassword] = useState("");
  const navigate = useNavigate();

  const [showPassword1, setShowPassword1] = useState(false);
  const [showPassword2, setShowPassword2] = useState(false);
  const [errors, setErrors] = useState({});

  // Validation trả về chuỗi lỗi ("" nếu OK)
  const validatePassword = (value) => {
    if (!value || value.trim() === "") return "Mật khẩu không được để trống";
    if (/\s/.test(value)) return "Mật khẩu không được chứa khoảng trắng";
    if (!/[A-Z]/.test(value)) return "Mật khẩu phải có ít nhất 1 chữ hoa";
    if (!/[a-z]/.test(value)) return "Mật khẩu phải có ít nhất 1 chữ thường";
    if (!/[\W_]/.test(value)) return "Mật khẩu phải có ít nhất 1 ký tự đặc biệt";
    if (value.length < 6) return "Mật khẩu phải có ít nhất 6 ký tự";
    return "";
  };

  const validateRePassword = (pwd, rePwd) => {
    if (!rePwd || rePwd.trim() === "") return "Vui lòng nhập lại mật khẩu";
    if (pwd !== rePwd) return "Mật khẩu nhập lại không khớp";
    return "";
  };

  // Blur handlers
  const handleBlurNew = () => {
    const err = validatePassword(newPassword);
    setErrors((p) => ({ ...p, newPassword: err }));
    // cũng cập nhật lỗi rePassword nếu đã nhập
    if (rePassword) {
      setErrors((p) => ({ ...p, rePassword: validateRePassword(newPassword, rePassword) }));
    }
  };
  const handleBlurRe = () => {
    const err = validateRePassword(newPassword, rePassword);
    setErrors((p) => ({ ...p, rePassword: err }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Kiểm tra trước khi gửi
    const errNew = validatePassword(newPassword);
    const errRe = validateRePassword(newPassword, rePassword);
    setErrors({ newPassword: errNew, rePassword: errRe });

    if (errNew || errRe) return; // nếu còn lỗi thì dừng

    try {
      await axios.post("http://127.0.0.1:8000/api/users/reset-password/", {
        identifier,
        token,
        password: newPassword,
        repassword: rePassword,
      });
      toast.success("Đổi mật khẩu thành công!");
      setTimeout(() => navigate("/login"), 1500);
    } catch (err) {
      toast.error(err.response?.data?.detail || "Có lỗi xảy ra");
    }
  };

  const handleClose = () => navigate("/login");

  return (
    <div className="tw-fixed tw-inset-0 tw-bg-black/60 tw-flex tw-items-center tw-justify-center tw-z-40 tw-p-4">
      <form onSubmit={handleSubmit}
        className="tw-relative tw-w-full tw-max-w-3xl tw-bg-white tw-p-8 tw-rounded-lg tw-shadow">
        <button  type="button" onClick={handleClose}   aria-label="Đóng"
          className="tw-absolute tw-top-4 tw-right-4 tw-text-gray-500 hover:tw-text-red-500 tw-p-2 tw-rounded-full" >
          <i className="fa-solid fa-xmark"></i>
        </button>

        <h2 className="tw-text-3xl tw-font-bold tw-text-blue-700 tw-mb-4">Đặt lại mật khẩu</h2>

        {/* Mật khẩu mới */}
        <div className="tw-relative tw-mb-5">
           <label  htmlFor="identifier" className="tw-block tw-text-2xl tw-font-medium tw-text-gray-700 tw-mb-3 tw-text-left" >
                Nhập mật khẩu mới
            </label>
          <input type={showPassword1 ? "text" : "password"} placeholder="Mật khẩu mới"
            value={newPassword}  onChange={(e) => setNewPassword(e.target.value)} onBlur={handleBlurNew}
            className="tw-w-full tw-p-3 tw-text-xl tw-border tw-rounded-lg focus:tw-ring-2 focus:tw-ring-blue-400 focus:tw-outline-none" />
          <button type="button"  onClick={() => setShowPassword1((s) => !s)}
            className="tw-absolute tw-mt-6 tw-right-3 tw-top-1/2 -tw-translate-y-1/2 tw-text-gray-500"
            aria-label="Hiện/ẩn mật khẩu" >
            {showPassword1 ? <EyeOffIcon size={18} /> : <EyeIcon size={18} />}
          </button>
        </div>
        {errors.newPassword && <p className="tw-text-red-500 tw-text-lg tw-mb-2">{errors.newPassword}</p>}

        {/* Nhập lại mật khẩu */}
        <div className="tw-relative tw-mb-5">
          <label  htmlFor="identifier" className="tw-block tw-text-2xl tw-font-medium tw-text-gray-700 tw-mb-3 tw-text-left" >
                Nhập lại mật khẩu mới
          </label>
          <input  type={showPassword2 ? "text" : "password"}  placeholder="Nhập lại mật khẩu mới"
            value={rePassword} onChange={(e) => setRePassword(e.target.value)}  onBlur={handleBlurRe}
            className="tw-w-full tw-p-3 tw-text-xl tw-border tw-rounded-lg focus:tw-ring-2 focus:tw-ring-blue-400 focus:tw-outline-none" />
          <button type="button" onClick={() => setShowPassword2((s) => !s)}
            className="tw-absolute tw-mt-6 tw-right-3 tw-top-1/2 -tw-translate-y-1/2 tw-text-gray-500"
            aria-label="Hiện/ẩn mật khẩu" >
            {showPassword2 ? <EyeOffIcon size={18} /> : <EyeIcon size={18} />}
          </button>
        </div>
        {errors.rePassword && <p className="tw-text-red-500 tw-text-lg tw-mb-2">{errors.rePassword}</p>}

        <button type="submit" className="tw-w-full tw-bg-blue-500 tw-text-white tw-p-3 tw-rounded tw-mt-2">
          Đổi mật khẩu
        </button>

      </form>
    </div>
  );
}
