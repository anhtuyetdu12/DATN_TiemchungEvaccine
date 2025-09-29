import { useState } from "react";
import AppointmentDetailModal from "./modal/AppointmentDetailModal";
import ConfirmModal from "../../components/ConfirmModal";
import {  toast } from "react-toastify";


const getRandomHeightWeight = () => {
  const height = Math.floor(Math.random() * (190 - 150 + 1)) + 150; // 150–190 cm
  const weight = Math.floor(Math.random() * (90 - 45 + 1)) + 45;   // 45–90 kg
  return { height, weight };
};

// Hàm tính tuổi từ dob (định dạng dd/MM/yyyy)
const getAgeFromDob = (dob) => {
  const [day, month, year] = dob.split("/").map(Number);
  const birthDate = new Date(year, month - 1, day);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
};
// Dữ liệu mẫu
const sampleAppointments = Array.from({ length: 30 }, (_, i) => {
  const { height, weight } = getRandomHeightWeight();
  const dob = `${(i % 28) + 1}/01/1990`; // ngày sinh
  const age = getAgeFromDob(dob); // tính tuổi từ dob
  return {
    id: i + 1,
    name: `Khách hàng ${i + 1}`,
    time: `${(i % 28) + 1}/09/2025 - ${8 + (i % 5)}:00`,
    phone: `09${Math.floor(10000000 + Math.random() * 89999999)}`,
    vaccine: ["Vắc xin A", "Vắc xin B", "Vắc xin C"][i % 3],
    date: `${(i % 28) + 1}/09/2025 – ${8 + (i % 5)}:00`,
    location: `Cơ sở Quận ${1 + (i % 5)}`,
    status: ["pending", "confirmed", "canceled"][i % 3],
    cmnd: `${100000000 + i}`,
    dob,
    age, // độ tuổi tính tự động
    address: `Số ${i + 10} Lê Lợi, Q.${(i % 5) + 1}, TP.HCM`,
    doctor: `BS. ${["Trần Văn B", "Nguyễn Văn C", "Phạm Thị D"][i % 3]}`,
    note: i % 2 === 0 ? "Khách có tiền sử dị ứng nhẹ" : "Không có lưu ý đặc biệt",
    height, // chiều cao random
    weight, // cân nặng random
  };
});


export default function StaffAppointments() {
    const [appointments, setAppointments] = useState(sampleAppointments);
    const [filter, setFilter] = useState("all");       // filter đang áp dụng
    const [filterDraft, setFilterDraft] = useState("all"); // filter đang chọn trong select
    const [page, setPage] = useState(1);
    const [detail, setDetail] = useState(null);
    const [confirmAction, setConfirmAction] = useState(null);

   
    const [search, setSearch] = useState("");
    const filteredAppointments = appointments.filter((item) => {
        const matchesStatus = filter === "all" || item.status === filter;
        const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase())
            || item.phone.includes(search)
            || item.vaccine.toLowerCase().includes(search.toLowerCase());
        return matchesStatus && matchesSearch;
    });

    // phân trang
    const perPage = 10;
    const totalPages = Math.max(1, Math.ceil(filteredAppointments.length / perPage));
    const currentData = filteredAppointments.slice((page - 1) * perPage, page * perPage);
    if (page > totalPages) setPage(totalPages);

    // Fake export
    const handleExport = (type) => {
        alert(`Xuất dữ liệu ra ${type}`);
    };

    // reset filter
    const handleReset = () => {
        setFilter("all");
        setPage(1);
        // nếu muốn reset nội dung dữ liệu về sample ban đầu:
        // setAppointments(sampleAppointments);
    };

    // Confirm action (show dialog)
    const handleConfirm = (action, item) => {
        setConfirmAction({ action, item });
    };

    // Do action (update state + feedback)
    const doAction = () => {
        if (!confirmAction) return;
        const { action, item } = confirmAction;

        if (action === "confirm") {
        // cập nhật state: set status = confirmed
        setAppointments((prev) => prev.map((a) => (a.id === item.id ? { ...a, status: "confirmed" } : a)));
          toast.success("Đã xác nhận lịch hẹn!");
        } else if (action === "cancel") {
        setAppointments((prev) => prev.map((a) => (a.id === item.id ? { ...a, status: "canceled" } : a)));
          toast.error("Đã hủy lịch hẹn!");
        }
        setConfirmAction(null);
    };

    
    
    // dropdown
    const [openStatus, setOpenStatus] = useState(false);
    const statusOptions = [
      { value: "all", label: "Tất cả trạng thái" },
      { value: "confirmed", label: "Đã xác nhận" },
      { value: "pending", label: "Chờ xác nhận" },
      { value: "canceled", label: "Đã hủy" },
    ];


  return (
    <div className="tw-p-6 tw-space-y-6 tw-pt-[150px] tw-pb-[50px] tw-bg-cyan-50">
        <div className="tw-flex tw-items-center tw-justify-center tw-gap-3">
          <i className="fa-solid fa-calendar-check tw-mb-4 tw-text-5xl tw-bg-gradient-to-r tw-from-purple-500 tw-via-blue-500 tw-to-pink-500 tw-bg-clip-text tw-text-transparent"></i>
          <h1 className="tw-text-[30px] tw-pb-5 tw-ml-3 tw-font-bold tw-bg-gradient-to-r tw-from-purple-500 tw-via-blue-500 tw-to-pink-500 tw-bg-clip-text tw-text-transparent">
              Quản lý lịch hẹn
          </h1>
        </div>

       
      <div className="tw-bg-white tw-rounded-xl tw-shadow-md tw-p-4 tw-space-y-6 tw-py-10">
        {/* Khối cha chứa cả bộ lọc và nút */}
        <div className="tw-flex tw-flex-col md:tw-flex-row md:tw-items-center md:tw-justify-between tw-gap-6 tw-px-10">
          
          {/* BÊN TRÁI: Bộ lọc */}
          <div className="tw-grid md:tw-grid-cols-3 tw-gap-6 tw-flex-1">  
            <input
              type="text"
              placeholder="Nhập thông tin tìm kiếm..."
              className="tw-border tw-rounded-lg tw-px-3 tw-py-2 focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-blue-300 focus:tw-border-blue-800"
            />

            {/* Dropdown trạng thái */}
            <div className="tw-relative">
              <button
                type="button"
                onClick={() => setOpenStatus(!openStatus)}
                className="tw-w-full tw-flex tw-justify-between tw-items-center 
                            tw-border tw-border-gray-300 tw-rounded-lg tw-px-3 tw-py-2 tw-text-gray-700 
                            hover:tw-border-[#56b6f7] hover:tw-ring-1 hover:tw-ring-[#56b6f7]
                            focus:tw-outline-none focus:tw-border-[#1999ee] focus:tw-ring-2 focus:tw-ring-[#1999ee]/40">
                <span>
                  {statusOptions.find(o => o.value === filterDraft)?.label || 'Tất cả trạng thái'}
                </span>
                <i className={`fa-solid ${openStatus ? "fa-angle-up" : "fa-angle-down"}`}></i>
              </button>

              {openStatus && (
                <div className="tw-absolute tw-top-full tw-mt-2 tw-left-1/2 -tw-translate-x-1/2
                                tw-w-[95%] tw-bg-white tw-z-10 tw-text-xl tw-space-y-0.5
                                tw-border tw-border-gray-300 tw-rounded-lg tw-shadow-lg tw-py-2">
                  {statusOptions.map((item, i) => (
                    <div
                      key={i}
                      onClick={() => {
                        setFilterDraft(item.value);
                        setFilter(item.value);
                        setOpenStatus(false);
                      }}
                      className={`tw-flex tw-items-center tw-justify-between tw-px-3 tw-py-2 tw-cursor-pointer 
                                    ${filterDraft === item.value
                          ? "tw-bg-[#e6f7fa]"
                          : "hover:tw-bg-[#e6f7fa]"}`}>
                      <span>{item.label}</span>
                      {filterDraft === item.value && (
                        <i className="fa-solid fa-check tw-text-[#1999ee]"></i>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <input
              type="date"
              className="tw-border tw-rounded-lg tw-px-3 tw-py-2 focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-blue-300 focus:tw-border-blue-800"
            />
          </div>

          {/* BÊN PHẢI: Nút chức năng */}
          <div className="tw-flex tw-gap-3">
            <button
              onClick={handleReset}
              className="tw-bg-red-600 tw-text-white tw-px-6 tw-py-2 tw-rounded-full tw-font-medium hover:tw-bg-red-500 tw-shadow">
              Reset
            </button>
            <button className="tw-bg-blue-600 tw-text-white tw-px-6 tw-py-2 tw-rounded-full tw-font-medium hover:tw-bg-blue-500 tw-shadow">
              <i className="fa-solid fa-filter tw-mr-2"></i>
              Lọc
            </button>
          </div>

          <div className="tw-flex tw-gap-3">
                <button onClick={() => handleExport("Excel")}
                    className="tw-bg-green-600 tw-text-white tw-px-6 tw-py-2 tw-rounded-full tw-font-medium hover:tw-bg-green-500 tw-shadow" >
                    Xuất Excel
                </button>
                <button onClick={() => handleExport("PDF")}
                    className="tw-bg-orange-600 tw-text-white tw-px-6 tw-py-2 tw-rounded-full tw-font-medium hover:tw-bg-orange-500 tw-shadow"  >
                    Xuất PDF
                </button>
                </div>
        </div>
      </div>


      {/* Empty state */}
      {appointments.length === 0 ? (
        <div className="tw-flex tw-flex-col tw-items-center tw-justify-center tw-bg-white tw-rounded-xl tw-shadow-md ">
          <img src="/images/lichtrong.jpg"  alt="No data"  className="tw-w-80 tw-h-80 tw-mb-4" />
          <p className="tw-text-gray-500">Chưa có lịch hẹn nào!</p>
        </div>
      ) : (
        <div className="tw-bg-white tw-rounded-xl tw-shadow-md tw-overflow-x-auto">
          <table className="tw-w-full tw-text-xl tw-border-collapse tw-py-5 tw-table-fixed">
            <thead>
                <tr className="tw-bg-green-100 tw-text-2xl ">
                <th className="tw-w-1/7 tw-py-4 tw-px-2 tw-text-center">Khách hàng</th>
                <th className="tw-w-1/7 tw-py-4 tw-px-2 tw-text-center">Điện thoại</th>
                <th className="tw-w-1/7 tw-py-4 tw-px-2 tw-text-center">Vắc xin</th>
                <th className="tw-w-1/7 tw-py-4 tw-px-2 tw-text-center">Ngày giờ</th>
                <th className="tw-w-1/7 tw-py-4 tw-px-2 tw-text-center">Cơ sở</th>
                <th className="tw-w-1/6 tw-py-4 tw-px-2 tw-text-center">Trạng thái</th>
                <th className="tw-w-1/3 tw-py-4 tw-px-2 tw-text-center">Thao tác</th>
                </tr>
            </thead>
            <tbody>
              {currentData.map((item) => (
                <tr key={item.id} className="tw-border-b hover:tw-bg-pink-50">
                  <td className="tw-p-2">{item.name}</td>
                  <td className="tw-p-2">{item.phone}</td>
                  <td className="tw-p-2">{item.vaccine}</td>
                  <td className="tw-p-2">{item.date}</td>
                  <td className="tw-p-2">{item.location}</td>
                  <td className="tw-p-2 tw-text-left">
                        <div className="tw-flex tw-items-center tw-ml-[50px]">
                            {item.status === "pending" && (
                            <span className="tw-bg-yellow-100 tw-text-yellow-700 tw-px-3 tw-py-1 tw-rounded-full">
                                Chờ xác nhận
                            </span>
                            )}
                            {item.status === "confirmed" && (
                            <span className="tw-bg-green-100 tw-text-green-700 tw-px-3 tw-py-1 tw-rounded-full">
                                Đã xác nhận
                            </span>
                            )}
                            {item.status === "canceled" && (
                            <span className="tw-bg-red-100 tw-text-red-700 tw-px-3 tw-py-1 tw-rounded-full">
                                Đã hủy
                            </span>
                            )}
                        </div>
                  </td>
                  <td className="tw-p-2 tw-space-x-4">
                    <button onClick={() => handleConfirm("confirm", item)}
                      className="tw-bg-green-100 tw-text-green-600 tw-px-3 tw-py-2 tw-rounded-full hover:tw-bg-green-200 tw-border tw-border-transparent 
                                      hover:tw-border-green-600"  >
                      <i className="fa-solid fa-check-to-slot tw-mr-2"></i>
                      Xác nhận
                    </button>
                    <button onClick={() => handleConfirm("cancel", item)}
                      className="tw-bg-red-100 tw-text-red-600 tw-px-3 tw-py-2 tw-rounded-full hover:tw-bg-red-200 tw-border tw-border-transparent 
                                      hover:tw-border-red-600" >
                      <i className="fa-solid fa-trash tw-mr-2"></i>
                      Hủy
                    </button>
                    <button onClick={() => setDetail(item)}
                      className=" tw-bg-blue-100 tw-text-blue-600 tw-px-3 tw-py-2 tw-rounded-full hover:tw-bg-blue-200 tw-border tw-border-transparent 
                                      hover:tw-border-blue-600" >
                      <i className="fa-solid fa-eye tw-mr-2"></i>
                      Xem
                    </button>
                    <a  href="/staff/notifications"
                      className="tw-bg-orange-100 tw-text-orange-600 tw-px-3 tw-py-2 tw-rounded-full hover:tw-bg-orange-200 hover:tw-text-orange-600 tw-border tw-border-transparent 
                                      hover:tw-border-orange-600" >
                      <i className="fa-solid fa-bell tw-mr-2"></i>
                      Gửi thông báo
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* phân trang */}
          {appointments.length > perPage && (
          <div className="tw-flex tw-justify-center tw-items-center tw-gap-2 tw-py-4">
              {/* nút lùi */}
              <button  onClick={() => setPage((prev) => Math.max(1, prev - 1))}  disabled={page === 1}
                  className="tw-px-3 tw-py-1 tw-rounded tw-text-blue-600 tw-bg-gray-100 hover:tw-bg-blue-200 disabled:tw-opacity-50" >
                  <i className="fa-solid fa-angles-left"></i>
              </button>

              {/* số trang */}
              {Array.from({ length: totalPages }, (_, i) => i + 1)
              .slice(
                  Math.max(0, page - 2),
                  Math.min(totalPages, page + 1) + 1
              )
              .map((num) => (
                  <button  key={num}  onClick={() => setPage(num)}
                      className={`tw-px-4 tw-py-1 tw-rounded ${
                          num === page ? "tw-bg-blue-500 tw-text-white"
                          : "tw-bg-gray-100 hover:tw-bg-gray-200"
                      }`} >  
                      {num}
                  </button>
              ))}

              {/* nút tiến */}
              <button onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                  disabled={page === totalPages}
                  className="tw-px-3 tw-py-1 tw-rounded tw-text-blue-600 tw-bg-gray-100 hover:tw-bg-blue-200 disabled:tw-opacity-50" >
                  <i className="fa-solid fa-angles-right"></i>
              </button>
          </div>
          )}
        </div>
      )}

      {/* Modal chi tiết */}
      <AppointmentDetailModal detail={detail} onClose={() => setDetail(null)} />

      {/* Modal confirm */}
      <ConfirmModal
        confirmAction={confirmAction}
        onCancel={() => setConfirmAction(null)}
        onConfirm={doAction}
      />


    </div>
  );
}
