import { useEffect, useState } from "react";
import { createCustomerByStaff } from "../../../../services/customerService";


export default function AddCustomerModal({ show, onClose, onAdd }) {
  const [form, setForm] = useState({
    full_name: "",
    dob: "",
    phone: "",
    email: "",
    address: "",
    gender: "Nam",
  });
  const [setPassword, setSetPassword] = useState("");
  const [repassword, setRepassword] = useState("");
  const [error, setError] = useState("");
  const [creating, setCreating] = useState(false);
  const [result, setResult] = useState(null);
  const [showPwd, setShowPwd] = useState(false);
  const [showRePwd, setShowRePwd] = useState(false);
  const [allowLogin, setAllowLogin] = useState(true); // mặc định: có tài khoản đăng nhập


  const validate = () => {
    if (!form.full_name.trim()) return "Vui lòng nhập họ tên";
    if (!form.email && !form.phone) return "Cần ít nhất email hoặc số điện thoại";
    if (form.email && !/\S+@\S+\.\S+/.test(form.email)) return "Email không hợp lệ";
    // Chỉ bắt mật khẩu nếu allowLogin = true
    if (allowLogin) {
      if (!setPassword) return "Vui lòng nhập mật khẩu cho khách";
      if (!repassword) return "Vui lòng nhập lại mật khẩu";
      if (setPassword !== repassword) return "Mật khẩu nhập lại không khớp";
      if (/\s/.test(setPassword)) return "Mật khẩu không được chứa khoảng trắng";
      if (!/[A-Z]/.test(setPassword)) return "Mật khẩu phải có ít nhất 1 chữ hoa";
      if (!/[a-z]/.test(setPassword)) return "Mật khẩu phải có ít nhất 1 chữ thường";
      if (!/[\W_]/.test(setPassword)) return "Mật khẩu phải có ít nhất 1 ký tự đặc biệt";
      if (setPassword.length < 6) return "Mật khẩu phải có ít nhất 6 ký tự";
    }
    return "";
  };

  // đóng bằng phím ESC cho tiện
  useEffect(() => {
    if (!show) return;
    const handler = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [show, onClose]);

  if (!show) return null;

  const genderOptions = [
    { label: "Nam", icon: "fa-solid fa-mars", color: "tw-text-teal-500" },
    { label: "Nữ", icon: "fa-solid fa-venus", color: "tw-text-pink-500" },
    { label: "Khác", icon: "fa-solid fa-venus-mars", color: "tw-text-orange-500" },
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const mapGender = (g) => (g === "Nam" ? "male" : g === "Nữ" ? "female" : "other");

  const handleSubmit = async (e) => {
    e.preventDefault();
    const err = validate();
    if (err) { setError(err); return; }

    try {
      setCreating(true);
      setError("");
      setResult(null);

      const payload = {
        full_name: form.full_name,
        email: form.email || undefined,
        phone: form.phone || undefined,
        date_of_birth: form.dob || undefined,       
        gender: mapGender(form.gender),         
        address: form.address || undefined,         
        ...(allowLogin && { set_password: setPassword, repassword,}),                               
      };

      const res = await createCustomerByStaff(payload);
      setResult(res);

      const newRow = {
        id: res.user.id,
        code: res.user.code,
        name: res.user.full_name,
        phone: res.user.phone || "",
        email: res.user.email,
        dob: res.user.date_of_birth || form.dob || null,   
        gender: res.user.gender || mapGender(form.gender),
        address: res.user.address || form.address || "",
        country: "Việt Nam",
        category: "",
        doses: 0,
        appointments: [],
        history: [],
        members: [],
      };

      onAdd(newRow);
    } catch (e2) {
      const msg =
        e2?.response?.data?.detail ||
        e2?.response?.data?.email ||
        e2?.response?.data?.phone ||
        "Lỗi tạo khách hàng";
      setError(typeof msg === "string" ? msg : JSON.stringify(msg));
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="tw-fixed tw-inset-0 tw-bg-black/40 tw-flex tw-items-center tw-justify-center tw-z-50"  onClick={onClose} >
      <div  onClick={(e) => e.stopPropagation()}
            className="tw-bg-white tw-rounded-xl tw-shadow-lg tw-w-full sm:tw-w-[520px] tw-max-h-[75vh] tw-flex tw-flex-col tw-px-4 tw-py-2 tw-mt-[80px]" >
       <div className="tw-sticky tw-top-0 tw-z-10 tw-bg-white tw-px-4 tw-pt-4 tw-pb-3 tw-border-b tw-flex tw-items-center tw-justify-between">
        <h2 className="tw-text-2xl tw-font-bold tw-text-[#0ecfdd]">
          <i className="fa-solid fa-address-book tw-mr-2" />
          Thêm mới khách hàng
        </h2>
        <button  onClick={onClose}  aria-label="Đóng"
          className="tw-inline-flex tw-items-center tw-justify-center tw-rounded-full tw-p-2 tw-text-gray-500 hover:tw-text-red-600 hover:tw-bg-red-50 tw-transition" >
          <i className="fa-solid fa-xmark tw-text-lg tw-w-6 tw-h-6 tw-pb-2" />
        </button>
      </div>

        {error && (
          <div className="tw-bg-red-100 tw-text-red-700 tw-px-2.5 tw-py-2 tw-rounded tw-mb-3 tw-text-lg">
            {error}
          </div>
        )}

        {result && (
          <div className="tw-bg-green-50 tw-border tw-border-green-300 tw-rounded tw-p-2.5 tw-mb-3 tw-text-lg">
            <div className="tw-font-semibold tw-text-green-800">Tạo tài khoản thành công!</div>
            <div>Mã KH: <b>{result.user.code}</b></div>
            <div>Email: <b>{result.user.email || "-"}</b> | SĐT: <b>{result.user.phone || "-"}</b></div>

            {/* Nếu BE đã gửi email, thường set_password_url sẽ là null */}
            {result.set_password_url ? (
              <div className="tw-mt-2">
                <div className="tw-text-slate-700 tw-text-base tw-mb-1">Link đặt mật khẩu lần đầu (gửi cho khách):</div>
                <div className="tw-text-sm tw-break-all tw-bg-white tw-border tw-rounded tw-px-2 tw-py-1">
                  {result.set_password_url}
                </div>
              </div>
            ) : (
              <div className="tw-mt-2 tw-text-base">
                Đã gửi link đặt mật khẩu tới email khách hàng (nếu có).
              </div>
            )}
          </div>
        )}


        <div className=" tw-flex-1 tw-overflow-y-auto tw-px-4 tw-pt-3 tw-pb-0 tw-scrollbar-hide">
          <form id="add-customer-form" onSubmit={handleSubmit} className="tw-grid tw-grid-cols-1 sm:tw-grid-cols-2 tw-gap-3 tw-text-left">
            {/* Họ tên */}
            <div>
              <label className="tw-text-lg tw-font-medium">
                Họ tên <span className="tw-text-red-600">*</span>
              </label>
              <input  name="full_name" type="text"  value={form.full_name}  onChange={handleChange}  autoFocus
                className="tw-w-full tw-border tw-rounded-lg tw-px-3 tw-py-1.5 tw-text-lg 
                focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-blue-300 focus:tw-border-blue-800"
              />
            </div>

            {/* Ngày sinh */}
            <div>
              <label className="tw-text-lg tw-font-medium">Ngày sinh</label>
              <input  name="dob"  type="date"  value={form.dob}  onChange={handleChange}
                className="tw-w-full tw-border tw-rounded-lg tw-px-3 tw-py-1.5 tw-text-lg 
                focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-blue-300 focus:tw-border-blue-800"
              />
            </div>

            {/* Giới tính */}
            <div>
              <label className="tw-text-lg tw-font-medium">Giới tính</label>
              <div className="tw-grid tw-grid-cols-3 tw-gap-1.5 tw-mt-1">
                {genderOptions.map((opt) => (
                  <button  key={opt.label} type="button" onClick={() => setForm((p) => ({ ...p, gender: opt.label }))}
                    className={`tw-flex tw-items-center tw-justify-center tw-gap-1.5 tw-px-2 tw-py-1.5 tw-text-base tw-rounded-md tw-border
                      ${  form.gender === opt.label
                          ? "tw-border-cyan-500 tw-bg-cyan-50"
                          : "tw-border-gray-300 tw-bg-white"
                      }`}
                    title={opt.label} >
                    <i className={`${opt.icon} ${opt.color}`} />
                    <span>{opt.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Số điện thoại */}
            <div>
              <label className="tw-text-lg tw-font-medium">Số điện thoại</label>
              <input name="phone"  type="text"  value={form.phone} onChange={handleChange}
                className="tw-w-full tw-border tw-rounded-lg tw-px-3 tw-py-1.5 tw-text-lg 
                focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-blue-300 focus:tw-border-blue-800"
              />
            </div>

            {/* Email */}
            <div>
              <label className="tw-text-lg tw-font-medium">Email</label>
              <input  name="email"  type="email" value={form.email} onChange={handleChange}
                className="tw-w-full tw-border tw-rounded-lg tw-px-3 tw-py-1.5 tw-text-lg 
                focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-blue-300 focus:tw-border-blue-800"
              />
            </div>

            {/* Địa chỉ */}
            <div>
              <label className="tw-text-lg tw-font-medium">Địa chỉ</label>
              <input name="address"  type="text"  value={form.address}  onChange={handleChange}
                className="tw-w-full tw-border tw-rounded-lg tw-px-3 tw-py-1.5 tw-text-lg 
                focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-blue-300 focus:tw-border-blue-800"
              />
            </div>

           {/* Đăng nhập cho khách hàng */}
           <div className="tw-col-span-1 sm:tw-col-span-2 tw-mt-1 tw-bg-slate-50 tw-border tw-rounded-lg tw-p-2.5">
            <div className="tw-flex tw-items-center tw-justify-between tw-mb-2">
              <label className="tw-text-base tw-font-medium tw-text-sky-500">
                Khách có sử dụng app / web để đăng nhập không?
              </label>
              <label className="tw-flex tw-items-center tw-gap-2 tw-text-sm">
                <input type="checkbox" checked={allowLogin}
                  onChange={(e) => setAllowLogin(e.target.checked)}
                  className="tw-w-5 tw-h-5 "
                />
                <span className="tw-text-base tw-font-medium tw-mt-1 tw-text-sky-500">Cho phép khách đăng nhập</span>
              </label>
            </div>
            {allowLogin && (
              <div className="tw-flex tw-flex-col tw-gap-2">
                <label className="tw-text-base tw-font-medium">Đặt mật khẩu đăng nhập cho khách hàng</label>

                <div className="tw-grid tw-grid-cols-1 sm:tw-grid-cols-2 tw-gap-2">
                  {/* Password */}
                  <div className="tw-flex tw-flex-col">
                    <label className="tw-text-base tw-font-medium">Mật khẩu</label>
                    <div className="tw-relative">
                      <input  type={showPwd ? "text" : "password"} value={setPassword}
                        onChange={(e) => setSetPassword(e.target.value)} required
                        placeholder="Nhập mật khẩu"  autoComplete="new-password"
                        className="tw-w-full tw-border tw-rounded-lg tw-px-3 tw-py-1.5 tw-text-base focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-blue-300 focus:tw-border-blue-800" />
                      <button  type="button" aria-label={showPwd ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                        onClick={() => setShowPwd((s) => !s)}
                        className="tw-absolute tw-right-3 tw-top-1/2 -tw-translate-y-1/2 tw-text-gray-500 hover:tw-text-gray-700" >
                        <i className={`fa-solid ${showPwd ? "fa-eye-slash" : "fa-eye"} tw-text-lg`}></i>
                      </button>
                    </div>
                  </div>

                  {/* Re-password */}
                  <div className="tw-flex tw-flex-col">
                    <label className="tw-text-base tw-font-medium">Nhập lại mật khẩu</label>
                    <div className="tw-relative">
                      <input  type={showRePwd ? "text" : "password"} value={repassword}
                        onChange={(e) => setRepassword(e.target.value)}  required
                        placeholder="Nhập lại mật khẩu"  autoComplete="new-password"
                        className="tw-w-full tw-border tw-rounded-lg tw-px-3 tw-py-1.5 tw-text-base focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-blue-300 focus:tw-border-blue-800"  />
                      <button type="button" aria-label={showRePwd ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                        onClick={() => setShowRePwd((s) => !s)}
                        className="tw-absolute tw-right-3 tw-top-1/2 -tw-translate-y-1/2 tw-text-gray-500 hover:tw-text-gray-700" >
                        <i className={`fa-solid ${showRePwd ? "fa-eye-slash" : "fa-eye"} tw-text-lg`}></i>
                      </button>
                    </div>
                  </div>
                </div>

                <p className="tw-text-[10px] tw-text-slate-600">
                  Khách hàng sẽ đăng nhập bằng <b>Email</b> (nếu có) hoặc <b>Số điện thoại</b> kèm mật khẩu vừa đặt.
                </p>
              </div>
            )}
            {!allowLogin && (
              <p className="tw-text-[10px] tw-text-red-600 tw-italic tw-mt-1">
                Khách hàng không sử dụng app. Hệ thống chỉ lưu thông tin để đặt lịch và quản lý tiêm chủng.
                Nếu sau này khách muốn dùng app, có thể gửi link đặt mật khẩu / quên mật khẩu cho họ.
              </p>
            )} 
          </div>



            <div className="tw-col-span-1 sm:tw-col-span-2 tw-mt-3 tw-sticky tw-bottom-0 tw-z-10 tw-bg-white tw-p-3 tw-border-t">
              <button  type="submit" disabled={creating}
                className="tw-bg-[#0ecfdd] tw-text-white tw-px-3 tw-py-2 tw-rounded-full tw-w-full hover:tw-bg-[#08b7c4] tw-text-lg tw-font-semibold" >
                {creating ? "Đang lưu..." : "Lưu"}
              </button>
            </div>
          </form>
        </div>

      </div>
    </div>
  );
}
