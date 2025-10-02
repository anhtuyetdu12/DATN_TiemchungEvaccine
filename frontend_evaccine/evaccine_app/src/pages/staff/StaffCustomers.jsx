import { useEffect, useMemo, useState } from "react";
import EditCustomerModal from "./modal/customer/EditCustomerModal";
import Pagination from "../../components/Pagination"
import ViewCustomerDetailModal from "./modal/customer/ViewCustomerDetailModal"
import AddCustomerModal from "./modal/customer/AddCustomerModal";
import DeleteCustomerModal from "./modal/customer/DeleteCustomerModal";

export default function StaffCustomers() {
  // --- Mock data generator (replace by API in real app) ---
  const genCustomers = () =>
    Array.from({ length: 45 }, (_, i) => ({
      id: i + 1,
      code: `KH-${String(i + 1).padStart(4, "0")}`,
      name: ["Nguyễn Văn A", "Trần Thị B", "Lê Văn C", "Phạm Thị D"][i % 4] + ` ${i + 1}`,
      phone: `09${String(10000000 + i).slice(-8)}`,
      dob: `1990-0${(i % 9) + 1}-15`,
      email: `user${i + 1}@mail.test`,
      idNumber: i % 3 === 0 ? `CMND${1000 + i}` : "",
      address: `Phường ${i % 10}, Quận ${i % 5}`,
      country: ["Việt Nam", "Thái Lan", "Singapore", "Malaysia"][i % 4],
      center: i % 3 === 0 ? "Trung tâm A" : i % 3 === 1 ? "Trạm Y tế B" : "Bệnh viện C",
      status: i % 6 === 0 ? "inactive" : "active",
      category: i % 2 === 0 ? "Người lớn" : "Trẻ em",
      doses: Math.min((i % 6), 5), 
      gender: ["Nam", "Nữ", "Khác"][i % 3],
      appointments: [
        {
          id: `ap-${i}-1`,
          date: new Date(Date.now() + ((i % 2 === 0 ? -1 : 1) * (i % 5) * 86400000)).toISOString(),
          vaccine: i % 2 === 0 ? "Vắc xin A" : "Vắc xin B",
          center: i % 3 === 0 ? "Trung tâm A" : "Trạm Y tế B",
          status: i % 4 === 0 ? "cancelled" : i % 3 === 0 ? "done" : "pending",
          price: i % 2 === 0 ? 160000 : 200000, 
        },
      ],
      history: [
        { id: `h-${i}-1`, date: "2023-06-01", vaccine: "Vắc xin X", batch: "B001", note: "OK" },
      ],
    }));

      // --- Hàm tính trạng thái ---
    const STATUS = {
      NOT_VACCINATED: "Chưa tiêm",
      DONE: "Đã tiêm",
      LATE: "Trễ hẹn",
      CANCELED: "Hủy đăng ký",
    };
    const getAppointmentStatus = (appt) => {
      const today = new Date();
      const apptDate = new Date(appt.date);

      if (appt.status === "cancelled") return STATUS.CANCELED;
      if (appt.status === "done" && apptDate < today) return STATUS.DONE;
      if (appt.status === "pending" && apptDate.toDateString() === today.toDateString())
        return STATUS.NOT_VACCINATED;
      if (appt.status === "pending" && apptDate < today) return STATUS.LATE;
      return STATUS.NOT_VACCINATED;
    };

    // Hàm trả về class màu dựa theo trạng thái
    const getStatusClass = (status) => {
      switch (status) {
        case STATUS.DONE:
          return "tw-bg-green-100 tw-text-green-600 tw-rounded-full";
        case STATUS.LATE:
          return "tw-bg-purple-100 tw-text-purple-600 tw-rounded-full";
        case STATUS.NOT_VACCINATED:
          return "tw-bg-yellow-100 tw-text-yellow-700 tw-rounded-full";
        case STATUS.CANCELED:
          return "tw-bg-red-200 tw-text-red-600 tw-rounded-full";
        default:
          return "";
      }
    };



  const [customers, setCustomers] = useState(genCustomers());

  // --- UI state ---
  const [searchInput, setSearchInput] = useState(""); // ô nhập
  const [search, setSearch] = useState(""); // chỉ set khi bấm tìm kiếm
  const [showModal, setShowModal] = useState(false);
  const [activeTab, setActiveTab] = useState('history'); // history | appointments | insurance
  const [page, setPage] = useState(1);
  const perPage = 10;
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  // nút xem sửa xóa
  const [detail, setDetail] = useState(null);
  // State cho modal xác nhận hủy
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState(null);

  //add customer
  const [showAddModal, setShowAddModal] = useState(false);

  const handleAddCustomer = (newCust) => {
    setCustomers((prev) => [newCust, ...prev]);
  }
  // temporary forms inside modal
  const [newAppointment, setNewAppointment] = useState({ date: "", vaccine: "", center: "" });
  const [newVaccineRecord, setNewVaccineRecord] = useState({ date: "", vaccine: "", batch: "", note: "" });

  // --- Derived lists ---

  const filtered = useMemo(() => {
  const term = search.trim().toLowerCase();
  return customers.filter((c) => {
    if (!term) return true;
    return (
      c.name.toLowerCase().includes(term) ||
      (c.phone || "").includes(term) ||
      (c.email || "").includes(term) ||
      (c.code || "").toLowerCase().includes(term)
    );
  });
}, [customers, search]);

  //=== phân trang ===
  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [totalPages, page]);

  const pageData = filtered.slice((page - 1) * perPage, page * perPage);


  const confirmAppointment = (custId, apptId) => {
    setCustomers((prev) =>
      prev.map((c) =>
        c.id === custId
          ? {
              ...c,
              appointments: c.appointments.map((a) => (a.id === apptId ? { ...a, status: "confirmed" } : a)),
            }
          : c
      )
    );
  };

  // hủy đăng kí
  const handleCancelRegistration = (custId, apptId) => {
    setCustomers((prev) =>
      prev.map((c) =>
        c.id === custId
          ? {
              ...c,
              appointments: c.appointments.map((a) =>
                a.id === apptId ? { ...a, status: "cancelled" } : a
              ),
            }
          : c
      )
    );
  };

  const recordVaccine = (custId, record) => {
    setCustomers((prev) =>
      prev.map((c) => (c.id === custId ? { ...c, history: [record, ...c.history] } : c))
    );
  };

  const addAppointment = (custId, appt) => {
    setCustomers((prev) =>
      prev.map((c) => (c.id === custId ? { ...c, appointments: [appt, ...c.appointments] } : c))
    );
  };



  return (
    <div className="tw-min-h-screen tw-bg-green-100 tw-p-6 tw-font-sans ">
      <div className="tw-max-w-full tw-mx-auto tw-grid tw-gap-6 tw-py-[120px]">

          <div className="tw-flex tw-items-center tw-justify-center tw-gap-3 tw-text-[30px]">
            <i className ="fa-solid fa-person-military-pointing tw-mb-6 tw-bg-gradient-to-r tw-from-pink-600 tw-via-blue-400 tw-to-pink-500 tw-bg-clip-text tw-text-transparent"></i>
            <h1 className=" tw-pb-5 tw-ml-3 tw-font-bold tw-bg-gradient-to-r tw-from-pink-600 tw-via-blue-400 tw-to-pink-500 tw-bg-clip-text tw-text-transparent">
              Quản lý khách hàng
            </h1>
          </div>
          

        <div className="tw-p-6 ">
          {/* Thanh tìm kiếm + nút thêm mới */}
           <div className="tw-flex tw-justify-between tw-items-center tw-mb-16 tw-gap-4">
                <div className="tw-flex tw-items-center tw-gap-2 tw-w-1/2">
                    <input  type="text"  placeholder="Tìm kiếm theo tên, mã KH, email, SĐT..."
                         value={searchInput} onChange={(e) => setSearchInput(e.target.value)}
                        className="tw-border tw-border-gray-300 tw-px-4 tw-py-2 tw-rounded-lg tw-shadow-sm tw-flex-1 
                                  focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-blue-300 focus:tw-border-blue-800"
                      />
                    <button   onClick={() => setSearch(searchInput)} 
                        className="tw-bg-blue-600 tw-text-white tw-px-4 tw-py-2 tw-rounded-full tw-font-medium hover:tw-bg-blue-700 tw-shadow"  >
                        <i className="fa-solid fa-magnifying-glass tw-mr-2"></i>
                        Tìm kiếm
                    </button>
                </div>

            <button className="tw-bg-pink-600 tw-text-white tw-px-6 tw-py-2 tw-rounded-full tw-font-medium hover:tw-bg-pink-500 tw-shadow"
               onClick={() => setShowAddModal(true)} >
              <i className="fa-solid fa-plus tw-mr-2"></i> Thêm khách hàng
            </button>
          </div>

          {/* Bảng danh sách khách hàng */}
          <div className="tw-bg-white tw-rounded-xl tw-shadow-md tw-overflow-x-auto">
            <table className="tw-w-full tw-text-xl tw-border-collapse tw-py-5">
              <thead className="tw-bg-red-100 ">
                <tr>
                  <th className="tw-px-4 tw-py-4 tw-text-center">Mã KH</th>
                  <th className="tw-px-4 tw-py-4 tw-text-center">Họ tên</th>
                  <th className="tw-px-4 tw-py-4 tw-text-center">Giới tính</th>
                  <th className="tw-px-4 tw-py-4 tw-text-center">Ngày sinh</th>
                  <th className="tw-px-4 tw-py-4 tw-text-center">Điện thoại</th>
                  <th className="tw-px-4 tw-py-4 tw-text-center">Địa chỉ</th>
                  <th className="tw-px-4 tw-py-4 tw-text-center">Ngày hẹn</th>
                  <th className="tw-px-4 tw-py-4 tw-text-center">Tên vaccine</th>
                  <th className="tw-px-4 tw-py-4 tw-text-center">Quốc gia</th>
                  <th className="tw-px-4 tw-py-4 tw-text-center">Phân loại</th>
                  <th className="tw-px-4 tw-py-4 tw-text-center">Số mũi</th>
                  <th className="tw-px-4 tw-py-4 tw-text-center">Đơn giá</th>
                  <th className="tw-px-4 tw-py-4 tw-text-center">Trạng thái</th>
                  <th className="tw-px-4 tw-py-4 tw-text-center">Hành động</th>
                </tr>
              </thead>
              <tbody>
                {pageData.map((c) => {
                  const appt = c.appointments[0];
                  const statusText = appt ? getAppointmentStatus(appt) : "-";
                  return (
                    <tr key={c.id} className="tw-border-b hover:tw-bg-pink-50">
                      <td className="tw-px-4 tw-py-2">{c.code || "-"}</td>
                      <td className="tw-px-4 tw-py-2 tw-text-left tw-pl-20">{c.name || "-"}</td>
                      <td className="tw-px-4 tw-py-2">{c.gender || "-"}</td>
                      <td className="tw-px-4 tw-py-2">{c.dob ? new Date(c.dob).toLocaleDateString("vi-VN") : "-"}</td>
                      <td className="tw-px-4 tw-py-2">{c.phone || c.email || "-"}</td>
                      <td className="tw-px-4 tw-py-2">{c.address || "-"}</td>
                      <td>{appt?.date ? new Date(appt.date).toLocaleDateString("vi-VN") : "-"}</td>
                      <td>{appt?.vaccine || "-"}</td>
                      <td className="tw-px-4 tw-py-2">{c.country || "-"}</td>
                      <td>{c.category || "-"}</td>
                      <td>{c.doses != null ? c.doses : "-"}</td>
                      <td>{appt?.price != null ? appt.price.toLocaleString("vi-VN") : "-"}
                      </td>
                      <td>
                        <span className={`${getStatusClass(statusText)} tw-inline-block tw-px-3 tw-py-2`}>
                          {statusText}
                        </span>
                      </td>

                      <td className="tw-px-4 tw-py-2 tw-text-center">
                        <div className="tw-flex tw-justify-center tw-gap-2">
                          <button onClick={() => { 
                                    setSelectedCustomer(c); 
                                    setShowModal(true); 
                                  }} className="tw-bg-yellow-100 tw-text-yellow-600 tw-px-3 tw-py-2 tw-rounded-full hover:tw-bg-yellow-200 tw-border tw-border-transparent 
                                            hover:tw-border-yellow-600"  >
                            <i className="fa-solid fa-pencil tw-mr-2"></i>
                            Sửa
                          </button>
                          <button onClick={() => {
                                setCustomerToDelete(c);
                                setShowDeleteModal(true);
                              }}
                              className="tw-bg-red-100 tw-text-red-600 tw-px-3 tw-py-2 tw-rounded-full hover:tw-bg-red-200 tw-border tw-border-transparent hover:tw-border-red-600" >
                              <i className="fa-solid fa-ban tw-mr-2"></i> Hủy
                            </button>
                          <button onClick={() => setDetail(c)}
                            className=" tw-bg-blue-100 tw-text-blue-600 tw-px-3 tw-py-2 tw-rounded-full hover:tw-bg-blue-200 tw-border tw-border-transparent 
                                            hover:tw-border-blue-600" >
                            <i className="fa-solid fa-eye tw-mr-2"></i>
                            Xem
                          </button>
                              
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <Pagination page={page}  totalItems={filtered.length}  perPage={perPage}  onPageChange={(p) => setPage(p)}/>
          </div>

         <EditCustomerModal show={showModal}  onClose={() => setShowModal(false)}  
            activeTab={activeTab} setActiveTab={setActiveTab}
            newAppointment={newAppointment} setNewAppointment={setNewAppointment}
            newVaccineRecord={newVaccineRecord} setNewVaccineRecord={setNewVaccineRecord}
            confirmAppointment={confirmAppointment}  addAppointment={addAppointment}
            recordVaccine={recordVaccine}  customer={selectedCustomer}
            setCustomers={setCustomers}  setSelectedCustomer={setSelectedCustomer}
          />

          <ViewCustomerDetailModal   customer={detail}  onClose={() => setDetail(null)}  />

         <DeleteCustomerModal  show={showDeleteModal} customer={customerToDelete}
            onClose={() => setShowDeleteModal(false)}  onConfirm={() => {
              if (customerToDelete) {
                handleCancelRegistration(customerToDelete.id, customerToDelete.appointments[0].id); 
                setCustomerToDelete(null);
              } setShowDeleteModal(false);
            }}
          />


          <AddCustomerModal show={showAddModal} onClose={() => setShowAddModal(false)}
            onAdd={handleAddCustomer} nextId={customers.length + 1} />
        </div>
      </div>


     

    </div>
  );
}
