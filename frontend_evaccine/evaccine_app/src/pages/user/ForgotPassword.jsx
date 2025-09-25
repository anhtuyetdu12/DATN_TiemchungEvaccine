import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

export default function ForgotPassword() {
  const [identifier, setIdentifier] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post("http://127.0.0.1:8000/api/users/forgot-password/", {
        identifier,
      });
      toast.success("Đã gửi email đặt lại mật khẩu, vui lòng kiểm tra hộp thư");
      navigate(`/reset-password?identifier=${encodeURIComponent(identifier)}`);
    } catch (err) {
      toast.error(err.response?.data?.message || err.response?.data?.error || "Có lỗi xảy ra");
    }
  };

   // Hàm đóng form → quay về login
  const handleClose = () => {
    navigate("/login"); 
  };

  return (
    <div className="tw-fixed tw-inset-0 tw-bg-black/60 tw-flex tw-items-center tw-justify-center tw-z-40 tw-mt-[100px] " >
        <div className="tw-flex tw-items-center tw-justify-center ">
        <form  onSubmit={handleSubmit}  className="tw-relative tw-w-full tw-max-w-7xl  tw-bg-gradient-to-br tw-from-blue-50 tw-to-blue-100 tw-p-8 
                    tw-rounded-2xl tw-shadow-xl tw-space-y-6" >
           <button  onClick={handleClose} className="tw-absolute tw-top-4 tw-right-4 tw-text-gray-500 hover:tw-text-red-500 
                  tw-text-3xl tw-font-bold tw-w-14 tw-h-14 tw-flex tw-items-center tw-justify-center tw-rounded-full hover:tw-bg-gray-100" >
                    <i className="fa-solid fa-xmark"></i>
            </button>
            <div className="tw-text-center">
                <h2 className="tw-text-3xl tw-font-bold tw-text-blue-700 tw-mb-6">
                    Quên mật khẩu
                </h2>
                 
                <p className="tw-text-gray-500 tw-mt-1">
                    Nhập email hoặc số điện thoại của bạn để nhận liên kết đặt lại mật
                    khẩu.
                </p>
            </div>

            <div className="tw-relative">
                <input type="text" placeholder="Email hoặc số điện thoại"
                    value={identifier} onChange={(e) => setIdentifier(e.target.value)}
                    className="tw-w-full tw-pl-10 tw-pr-3 tw-py-3 tw-border tw-border-gray-300 tw-rounded-lg focus:tw-ring-2 focus:tw-ring-blue-400 focus:tw-outline-none" />
                
            </div>

            <button type="submit"
                className="tw-w-full tw-bg-blue-600 hover:tw-bg-blue-700 tw-text-white tw-font-semibold tw-py-3 tw-rounded-lg tw-transition tw-duration-200"  >
                Gửi yêu cầu
            </button>

            
        </form>
        </div>
    </div>
  );
}
