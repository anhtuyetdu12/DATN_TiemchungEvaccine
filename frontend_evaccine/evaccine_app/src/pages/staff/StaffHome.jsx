import { useState } from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend } from "recharts";
import AppointmentDetailModal from "./modal/AppointmentDetailModal";
import ConfirmModal from "../../components/ConfirmModal";
import { toast } from "react-toastify";

export default function StaffHome() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  // dropdown
  const [openStatus, setOpenStatus] = useState(false);

  // state modal chi tiết
  const [selected, setSelected] = useState(null);

  // state modal xác nhận/hủy
  const [confirmAction, setConfirmAction] = useState(null);

  const statusOptions = [
    { value: "all", label: "Tất cả trạng thái" },
    { value: "confirmed", label: "Đã xác nhận" },
    { value: "pending", label: "Chờ xác nhận" },
    { value: "canceled", label: "Đã hủy" },
  ];

  // Giả lập data ngẫu nhiên với chiều cao, cân nặng và độ tuổi
  const sampleAppointments = Array.from({ length: 20 }, (_, i) => {
    // Random chiều cao 150–190 cm và cân nặng 45–90 kg
    const height = Math.floor(Math.random() * (190 - 150 + 1)) + 150;
    const weight = Math.floor(Math.random() * (90 - 45 + 1)) + 45;

    // Random năm sinh 1990–2005 và tính tuổi
    const birthYear = 1990 + Math.floor(Math.random() * 16);
    const birthMonth = 1 + Math.floor(Math.random() * 12);
    const birthDay = 1 + Math.floor(Math.random() * 28);
    const dob = `${birthDay}/${birthMonth}/${birthYear}`;
    const today = new Date();
    let age = today.getFullYear() - birthYear;
    if (
      today.getMonth() + 1 < birthMonth ||
      (today.getMonth() + 1 === birthMonth && today.getDate() < birthDay)
    ) {
      age--;
    }

    return {
      id: i + 1,
      name: `Khách hàng ${i + 1}`,
      time: `${(i % 28) + 1}/09/2025 - ${8 + (i % 5)}:00`,
      dob,        // ngày sinh
      age,        // độ tuổi
      height,     // chiều cao
      weight,     // cân nặng
      vaccine: ["Pfizer", "Moderna", "AstraZeneca"][i % 3],
      status: ["pending", "confirmed", "canceled"][i % 3],
      phone: `09${Math.floor(10000000 + Math.random() * 89999999)}`,
      address: `Số ${i + 10} Lê Lợi, Q.${(i % 5) + 1}, TP.HCM`,
      doctor: `BS. ${["Trần Văn B", "Nguyễn Văn C", "Phạm Thị D"][i % 3]}`,
      note: i % 2 === 0 ? "Có tiền sử dị ứng nhẹ" : "Không có lưu ý đặc biệt",
    };
  });


  const [appointments, setAppointments] = useState(sampleAppointments);

  const filteredAppointments = appointments.filter(
    (a) =>
      a.name.toLowerCase().includes(search.toLowerCase()) &&
      (filter === "all" || a.status === filter)
  );

  // xử lý xác nhận / hủy
  const handleConfirm = (item) =>
    setConfirmAction({ action: "confirm", item });

  const handleCancel = (item) =>
    setConfirmAction({ action: "cancel", item });

  const doAction = () => {
    if (!confirmAction) return;
    const { action, item } = confirmAction;
    if (action === "confirm") {
      setAppointments((prev) =>
        prev.map((a) =>
          a.id === item.id ? { ...a, status: "confirmed" } : a
        )
      );
      toast.success(`Đã xác nhận lịch hẹn ID ${item.id}`);
    } else if (action === "cancel") {
      setAppointments((prev) =>
        prev.map((a) =>
          a.id === item.id ? { ...a, status: "canceled" } : a
        )
      );
      toast.error(` Đã hủy lịch hẹn ID ${item.id}`);
    }
    setConfirmAction(null);
  };

  const handleView = (item) => setSelected(item);

  // dữ liệu biểu đồ
  const customerData = [
    { name: "Tháng 7", customers: 320 },
    { name: "Tháng 8", customers: 410 },
    { name: "Tháng 9", customers: 290 },
  ];
  const vaccineData = [
    { name: "Pfizer", value: 2400 },
    { name: "Moderna", value: 1800 },
    { name: "AstraZeneca", value: 1200 },
  ];
  const COLORS = ["#1a237e", "#43a047", "#fb8c00"];

  // 👉 thêm state phân trang
  const [page, setPage] = useState(1);
  const perPage = 5; // số phần tử mỗi trang
  
  // 👉 tính phân trang
  const totalPages = Math.max(1, Math.ceil(filteredAppointments.length / perPage));
  const currentData = filteredAppointments.slice((page - 1) * perPage, page * perPage);

  return (
    <div className="tw-pt-[100px] tw-px-6 tw-bg-pink-50 tw-min-h-screen tw-mt-[50px] tw-pb-[50px]">
      {/* Header */}
      <div className="tw-flex tw-justify-center tw-items-center  tw-mb-10 ">
        <h1 className="tw-text-[30px] tw-font-bold tw-text-[#1a237e]">
          📊 <span className="tw-ml-5">Dashboard Nhân viên Y tế</span>
        </h1>

      </div>

      {/* Cards tổng quan */}
      <div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-3 tw-gap-6 tw-mb-12">
        <div className="tw-bg-white tw-rounded-xl tw-shadow-md tw-p-6 tw-flex tw-items-center tw-gap-6 hover:tw-shadow-lg tw-transition tw-px-[50px]">
          <div className="tw-bg-blue-100 tw-text-blue-600 tw-rounded-full tw-p-6">
            <i className="fa fa-users tw-text-2xl"></i>
          </div>
          <div className="tw-ml-10">
            <p className="tw-text-gray-500 tw-text-[15px]">Tổng khách hàng</p>
            <h2 className="tw-text-2xl tw-font-bold">1,254</h2>
          </div>
        </div>

        <div className="tw-bg-white tw-rounded-xl tw-shadow-md tw-p-6 tw-flex tw-items-center tw-gap-6 hover:tw-shadow-lg tw-transition tw-px-[50px]">
            <div className=" tw-bg-green-100 tw-text-green-600 tw-p-7 tw-rounded-full tw-flex tw-items-center tw-justify-center"> 
                <i className="fa-solid fa-calendar-check tw-text-3xl tw-leading-none"></i> 
            </div> 
            <div className="tw-ml-10"> 
                <p className="tw-text-gray-500 tw-text-[15px]">Lịch hẹn hôm nay</p> 
                <h2 className="tw-text-2xl tw-font-bold ">32</h2> 
            </div>
        </div>

        <div className="tw-bg-white tw-rounded-xl tw-shadow-md tw-p-6 tw-flex tw-items-center tw-gap-6 hover:tw-shadow-lg tw-transition tw-px-[50px]">
          <div className=" tw-bg-yellow-100 tw-text-yellow-600 tw-p-6 tw-rounded-full tw-flex tw-items-center tw-justify-center">
            <i className="fa-solid fa-syringe tw-text-3xl"></i>
          </div>
          <div className="tw-ml-10">
            <p className="tw-text-gray-500 tw-text-[15px]">Vắc xin tồn kho</p>
            <h2 className="tw-text-2xl tw-font-bold">5,842 liều</h2>
          </div>
        </div>
      </div>

      {/* Bộ lọc + tìm kiếm */}
      <div className="tw-flex tw-flex-col md:tw-flex-row tw-justify-between tw-mb-4 tw-gap-4">
            {/* Input có icon */}
            <div className="tw-flex tw-gap-2 tw-w-full md:tw-w-1/3">
              <div className="tw-relative tw-flex-1">
                <i className="fa-brands fa-searchengin tw-absolute tw-left-3 tw-top-1/2 -tw-translate-y-1/2 tw-text-gray-400"></i>
                <input type="text"  placeholder="Tìm theo tên khách hàng..."
                  className="tw-border tw-rounded-lg tw-pl-10 tw-pr-4 tw-py-2 tw-w-full focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-blue-300 focus:tw-border-blue-800"
                  value={search}  onChange={(e) => setSearch(e.target.value)} />
              </div>

              <button className="tw-bg-blue-600 tw-text-white tw-px-4 tw-py-2 tw-rounded-full tw-font-medium hover:tw-bg-blue-700 tw-shadow"
                onClick={() => console.log("Tìm kiếm:", search)} >
                <i className="fa-solid fa-magnifying-glass tw-mr-2"></i>
                Tìm kiếm
              </button>
            </div>


            {/* Dropdown lọc trạng thái */}
            <div className="tw-relative tw-w-full md:tw-w-1/4 tw-bg-white ">
              <button  type="button"  onClick={() => setOpenStatus(!openStatus)}
                className="tw-w-full tw-flex tw-justify-between tw-items-center 
                            tw-border tw-border-gray-300 tw-rounded-lg tw-px-4 tw-py-2 tw-text-gray-700 
                            hover:tw-border-[#56b6f7] hover:tw-ring-1 hover:tw-ring-[#56b6f7]
                            focus:tw-outline-none focus:tw-border-[#1999ee] focus:tw-ring-2 focus:tw-ring-[#1999ee]/40" >
                <span>{statusOptions.find(o => o.value === filter)?.label || 'Tất cả trạng thái'}</span>
                <i className={`fa-solid ${openStatus ? "fa-angle-up" : "fa-angle-down"}`}></i>
              </button>

              {openStatus && (
                <div className="tw-absolute tw-top-full tw-mt-2 tw-left-1/2 -tw-translate-x-1/2
                              tw-w-[95%] tw-bg-white tw-z-10 tw-text-xl tw-space-y-0.5
                              tw-border tw-border-gray-300 tw-rounded-lg tw-shadow-lg tw-py-2"  >
                  {statusOptions.map((item, i) => (
                    <div  key={i} onClick={() => {
                        setFilter(item.value);
                        setOpenStatus(false);
                      }}
                      className={`tw-flex tw-items-center tw-justify-between tw-px-3 tw-py-2 tw-cursor-pointer 
                            ${filter === item.value
                              ? "tw-bg-[#e6f7fa]"
                              : "hover:tw-bg-[#e6f7fa]"}`} >
                      <span>{item.label}</span>
                      {filter === item.value && (
                        <i className="fa-solid fa-check tw-text-[#1999ee]"></i>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

      </div>

      {/* Bảng lịch hẹn */}
      <div className="tw-bg-white tw-rounded-xl tw-shadow-md tw-p-6 tw-mb-12">
        <h2 className="tw-text-[18px] tw-font-semibold tw-mb-4 tw-text-[#1a237e]">
          📅 <span className="tw-ml-3">Lịch hẹn sắp tới</span>
        </h2>
        <table className="tw-w-full tw-table-fixed tw-text-xl tw-text-left tw-text-gray-600">
          <thead className="tw-bg-blue-100 tw-text-gray-700 tw-uppercase">
            <tr>
              <th className="tw-px-4 tw-py-4 tw-w-1/5">Khách hàng</th>
              <th className="tw-px-4 tw-py-4 tw-w-1/5">Ngày giờ</th>
              <th className="tw-px-4 tw-py-4 tw-w-1/5">Loại vắc xin</th>
              <th className="tw-px-4 tw-py-4 tw-w-1/5">Trạng thái</th>
              <th className="tw-px-4 tw-py-4 tw-w-1/5">Hành động</th>
            </tr>
          </thead>
          <tbody>
            {currentData.map((a) => (
              <tr key={a.id} className="tw-border-b hover:tw-bg-pink-100">
                <td className="tw-px-4 tw-py-3">{a.name}</td>
                <td className="tw-px-4 tw-py-3">{a.time}</td>
                <td className="tw-px-4 tw-py-3">{a.vaccine}</td>
                <td className="tw-px-4 tw-py-3">
                  {a.status === "confirmed" && (
                    <span className="tw-bg-green-100 tw-text-green-600 tw-px-3 tw-py-1 tw-rounded-full">
                      Đã xác nhận
                    </span>
                  )}
                  {a.status === "pending" && (
                    <span className="tw-bg-yellow-100 tw-text-yellow-600 tw-px-3 tw-py-1 tw-rounded-full">
                      Chờ xác nhận
                    </span>
                  )}
                  {a.status === "canceled" && (
                    <span className="tw-bg-red-100 tw-text-red-600 tw-px-3 tw-py-1 tw-rounded-full">
                      Đã hủy
                    </span>
                  )}
                </td>
                <td className="tw-px-4 tw-py-3 tw-flex tw-items-center tw-gap-3">
                  <button
                    onClick={() => handleConfirm(a)}
                    className="tw-bg-green-100 tw-text-green-600 tw-p-2 tw-px-3 tw-rounded-full hover:tw-bg-green-200 tw-transition tw-border tw-border-transparent 
                                      hover:tw-border-green-600" >
                    <i className="fa-solid fa-check-to-slot"></i>
                    <span className="tw-ml-2">Xác nhận</span>
                  </button>
                  <button onClick={() => handleCancel(a)}
                    className="tw-bg-red-100 tw-text-red-600 tw-p-2 tw-px-3 tw-rounded-full hover:tw-bg-red-200 tw-transition tw-border tw-border-transparent 
                                      hover:tw-border-red-600" >
                    <i className="fa-solid fa-trash"></i>
                    <span className="tw-ml-2">Hủy</span>
                  </button>
                  <button onClick={() => handleView(a)}
                    className="tw-bg-blue-100 tw-text-blue-600 tw-p-2 tw-px-3 tw-rounded-full hover:tw-bg-blue-200 tw-transition tw-border tw-border-transparent 
                                      hover:tw-border-blue-600"  >
                    <i className="fa-solid fa-eye"></i>
                    <span className="tw-ml-2">Xem</span>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/*  phân trang */}
        <div className="tw-flex tw-justify-center tw-items-center tw-gap-2 tw-pt-4">
          <button onClick={() => setPage((p) => Math.max(1, p - 1))}  disabled={page === 1}
            className="tw-px-3 tw-py-1 tw-rounded tw-text-blue-600 tw-bg-gray-100 hover:tw-bg-blue-200 disabled:tw-opacity-50" >
            <i className="fa-solid fa-angles-left"></i>
          </button>

          {Array.from({ length: totalPages }, (_, i) => i + 1).map((num) => (
            <button  key={num} onClick={() => setPage(num)}
              className={`tw-px-4 tw-py-1 tw-rounded ${
                  num === page
                  ? "tw-bg-blue-500 tw-text-white"
                  : "tw-bg-gray-100 hover:tw-bg-gray-200"
              }`} >
              {num}
            </button>
          ))}

          <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}
            className="tw-px-3 tw-py-1 tw-rounded tw-text-blue-600 tw-bg-gray-100 hover:tw-bg-blue-200 disabled:tw-opacity-50" >
            <i className="fa-solid fa-angles-right"></i>
          </button>
        </div>
    
      </div>

      {/* Biểu đồ */}
      <div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-2 tw-gap-6">
        <div className="tw-bg-white tw-rounded-xl tw-shadow-md tw-p-6">
          <h2 className="tw-text-[18px] tw-font-semibold tw-mb-4 tw-text-[#1a237e]">
            📈 <span className="tw-ml-3">Thống kê khách hàng</span>
          </h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={customerData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="customers" fill="#1a237e" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="tw-bg-white tw-rounded-xl tw-shadow-md tw-p-6">
          <h2 className="tw-text-[18px] tw-font-semibold tw-mb-4 tw-text-[#1a237e]">
            💉 <span className="tw-ml-3">Tình trạng vắc xin</span>
          </h2>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={vaccineData}  dataKey="value" nameKey="name"
                cx="50%" cy="50%" outerRadius={80}  label>
                {vaccineData.map((entry, index) => (
                  <Cell key={index} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      

       {/* Modal chi tiết */}
      {selected && (
        <AppointmentDetailModal detail={selected} onClose={() => setSelected(null)} />
      )}

      {/* Modal xác nhận/hủy */}
      <ConfirmModal
          confirmAction={confirmAction}
          onCancel={() => setConfirmAction(null)}
          onConfirm={doAction}
        />


    

    </div>
  );
}
