import React, { useState, useEffect } from "react";
import { v4 as uuidv4 } from "uuid";
import VaccineForm from "../../components/VaccineForm"
import Dropdown from "../../components/Dropdown";
import QuantityPicker from "../../components/QuantityPicker";
import Pagination from "../../components/Pagination";
import {  toast } from "react-toastify";


// mẫu nhà cung cấp (có address & contact)
  const suppliers = [
    {
      value: "A",
      label: "Công ty Dược A",
      address: "123 Nguyễn Huệ, Q.1, TP.HCM",
      contact: "0909 111 222",
    },
    {
      value: "B",
      label: "Công ty Dược B",
      address: "45 Trần Hưng Đạo, Hoàn Kiếm, Hà Nội",
      contact: "024 8888 9999",
    },
    {
      value: "C",
      label: "Công ty Dược C",
      address: "67 Lê Lợi, Hải Châu, Đà Nẵng",
      contact: "0236 222 333",
    },
  ];

  // mẫu nơi xuất
  const consumers = [
    { name: "Trạm Y tế Phường 1", address: "Số 1, Đường A", contact: "028 1111 2222" },
    { name: "Trạm Y tế B", address: "Số 2, Đường B", contact: "028 3333 4444" },
    { name: "Bệnh viện Nhi Đồng", address: "Số 3, Đường C", contact: "028 5555 6666" },
  ];


export default function StaffVaccines() {
  const [activeTab, setActiveTab] = useState("manage"); // "manage" hoặc "stock"
  const [vaccines, setVaccines] = useState(
    Array.from({ length: 30 }, (_, i) => {
      // random số lượng (0 → 200)
      const quantity = Math.floor(Math.random() * 201);

      // random hạn sử dụng (0 → 365 ngày kể từ hôm nay)
      const today = new Date();
      const randomDays = Math.floor(Math.random() * 366); 
      const expiryDate = new Date(today);
      expiryDate.setDate(today.getDate() + randomDays);

      // format yyyy-mm-dd
      const expiry = expiryDate.toISOString().split("T")[0];

      return {
        id: i + 1,
        name: `Vắc xin ${i + 1}`,
        type: i % 2 === 0 ? "Trẻ em" : "Người lớn",
        code: `VX${String(i + 1).padStart(3, "0")}`,
        quantity,
        unit: "liều",
        expiry,
        manufacturer: i % 3 === 0 ? "Pfizer" : i % 3 === 1 ? "Moderna" : "AstraZeneca",
        country: i % 3 === 0 ? "USA" : i % 3 === 1 ? "UK" : "Japan",
        batch: `B${String(i + 1).padStart(3, "0")}`,
        price: 200000 + i * 5000,
        note: i % 4 === 0 ? "Chống chỉ định với người dị ứng" : "",
      };
    })
  );

  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [currentVaccine, setCurrentVaccine] = useState(null);

  const [confirmAction, setConfirmAction] = useState(null);

  // Thêm hoặc sửa vắc xin
  const handleSaveVaccine = (vaccine) => {
    if (vaccine.id) {
      setVaccines(vaccines.map((v) => (v.id === vaccine.id ? { ...vaccine } : v)));
    } else {
      setVaccines([...vaccines, { ...vaccine, id: uuidv4() }]);
    }
    setShowModal(false);
  };

  //============ phân trang=====================
    const [page, setPage] = useState(1);
  const perPage = 10;

  // lọc dữ liệu
  const term = searchTerm.toLowerCase();
  const filteredVaccines = vaccines.filter(
    (v) => v.name.toLowerCase().includes(term) ||    v.manufacturer.toLowerCase().includes(term) );

  // slice dữ liệu theo trang
  const currentData = filteredVaccines.slice( (page - 1) * perPage, page * perPage );

  useEffect(() => {
    // nếu số trang thay đổi mà page lớn hơn totalPages thì về cuối cùng
    const maxPage = Math.min(3, Math.ceil(filteredVaccines.length / perPage));
    if (page > maxPage) setPage(maxPage);
  }, [filteredVaccines.length, page]);
  
  // ===========cảnh báo hết hạn sử dụng===============
    const [warningVaccines, setWarningVaccines] = useState([]);
    const [processedWarnings, setProcessedWarnings] = useState([]); // xóa cho cảnh báo
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [filterType, setFilterType] = useState(""); // lọc theo warningType
    const [searchText, setSearchText] = useState("");

    const warningOptions = [
      { value: "", label: "Tất cả cảnh báo" },
      { value: "Hàng & Hạn đã hết", label: "Hàng & Hạn đã hết" },
      { value: "Hạn sử dụng sắp hết", label: "Hạn sử dụng sắp hết" },
      { value: "Số lượng sắp hết", label: "Số lượng sắp hết" },
    ];


    const unprocessedWarnings = warningVaccines.filter(
      (v) => !processedWarnings.includes(v.id)
    );
    // lọc theo filterType + searchText
    const filteredWarnings = unprocessedWarnings.filter((v) => {
      // lọc theo loại cảnh báo
      const typeMatch = !filterType || v.warningType === filterType;

      // lọc theo ô tìm kiếm (vd: theo tên vắc xin, kho, nhân viên…)
      const keyword = searchText.toLowerCase();
      const searchMatch =
        !keyword ||
        v.name?.toLowerCase().includes(keyword) ||
        v.manufacturer?.toLowerCase().includes(keyword) ||
        v.warehouse?.toLowerCase().includes(keyword);

      return typeMatch && searchMatch;
    });



    useEffect(() => {
      const now = new Date(); 
      const soon = new Date();
      soon.setDate(soon.getDate() + 30); // ngưỡng cảnh báo 30 ngày

      const warnList = vaccines.map((v) => {
        const exp = new Date(v.expiry);
        const isExpiringSoon = exp <= soon && exp >= now;
        const isLowStock = v.quantity === 0 || v.quantity <= 20;

        if (isExpiringSoon && isLowStock) {
          return { ...v, warningType: "Hàng & Hạn đã hết" };
        } else if (isExpiringSoon) {
          return { ...v, warningType: "Hạn sử dụng sắp hết" };
        } else if (isLowStock) {
          return { ...v, warningType: "Số lượng sắp hết" };
        }
        return null;
      }).filter(v => v !== null);

      setWarningVaccines(warnList);
    }, [vaccines]);

  // Xuất CSV
  const handleExport = () => {
    let csv =
      "Tên,Loại,Mã,Số lượng,Đơn vị,Hạn sử dụng,Nhà sản xuất,Nước,Số lô,Giá,Ghi chú\n";
    vaccines.forEach((v) => {
      csv += `${v.name},${v.type},${v.code},${v.quantity},${v.unit},${v.expiry},${v.manufacturer},${v.country},${v.batch},${v.price},${v.note}\n`;
    });
    
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "vaccines.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };



  // ===============tab nhập xuất=========================
  const [stockHistory, setStockHistory] = useState(
    Array.from({ length: 30 }, (_, i) => {

      const today = new Date();
      const randomDays = Math.floor(Math.random() * 60); // trong 60 ngày gần đây
      const randomHours = Math.floor(Math.random() * 24);
      const randomMinutes = Math.floor(Math.random() * 60);
      const date = new Date(today);
      date.setDate(today.getDate() - randomDays);
      date.setHours(randomHours, randomMinutes);

    

       // chọn transaction type
      const type = i % 2 === 0 ? "nhập" : "xuất";

      // chọn supplier/consumer
      let chosen;
      if (type === "nhập") {
        chosen = suppliers[Math.floor(Math.random() * suppliers.length)];
      } else {
        chosen = consumers[Math.floor(Math.random() * consumers.length)];
      }

      const vaccine = vaccines[i % vaccines.length];

      return {
          id: uuidv4(),
          vaccineId: vaccine.id, // khớp với id vắc xin
          type, // "nhập" | "xuất"
          quantity: Math.floor(Math.random() * 50) + 1, // 1 → 50
          unit: "liều", // đơn vị tính
          unitPrice: vaccine.price,
          source: chosen.name,
          supplierAddress: chosen.address || "-",
          supplierContact: chosen.contact || "-",
          staff: i % 3 === 0 ? "Nguyễn Văn A" : i % 3 === 1 ? "Trần Thị B" : "Lê Văn C",
          date: date.toLocaleString("vi-VN", { hour12: false }), // hiển thị ngày + giờ
          note:
            i % 5 === 0
              ? "Điều chỉnh tồn kho"
              : i % 5 === 1
              ? "Nhập bổ sung"
              : i % 5 === 2
              ? "Xuất tiêm cho trẻ em"
              : i % 5 === 3
              ? "Xuất tiêm cho thai phụ"
              : "Xuất tiêm cho người lớn",
        };
      })
    );

  const [showStockModal, setShowStockModal] = useState(false);
  const [stockForm, setStockForm] = useState({
    vaccineId: "",
    type: "nhập",
    quantity: "",
    price: "",
    source: "",
    note: "",
    staff: "Nhân viên A",
    supplierAddress: "",
    supplierContact: "",
  });


  // ==== Lưu nhập/xuất ====
  const handleSaveStock = () => {
    if (!stockForm.vaccineId || !stockForm.quantity) {
      toast.error("Vui lòng nhập đủ thông tin!");
      return;
    }
    const qty = parseInt(stockForm.quantity, 10);
    if (isNaN(qty) || qty <= 0) {
      toast.warning("Số lượng phải lớn hơn 0!");
      return;
    }
    if (new Date(stockForm.expiryDate) < new Date()) {
      toast.error("Hạn sử dụng không được nhỏ hơn ngày hiện tại!");
      return;
    }
     // cập nhật tồn kho (validate không cho âm)
    try {
      setVaccines((prev) => prev.map((v) => {
          if (v.id === parseInt(stockForm.vaccineId)) {
            if (stockForm.type === "xuất" && v.quantity < qty) {
              toast.error("Không đủ số lượng để xuất!");
              throw new Error("Không đủ số lượng");
            }
            return {
              ...v,
              quantity: stockForm.type === "nhập" ? v.quantity + qty : v.quantity - qty,
            };
          }
          return v;
        })
      );
    } catch (e) {
      return; // đã alert phía trên
    }

    setStockHistory((prev) => [
      ...prev,
      {
        id: uuidv4(),
        vaccineId: parseInt(stockForm.vaccineId),
        type: stockForm.type,
        quantity: qty,
        source: stockForm.source,
        note: stockForm.note,
        staff: stockForm.staff,
        date: new Date().toLocaleString("vi-VN", { hour12: false }),
        supplierAddress: stockForm.supplierAddress || "-",
        supplierContact: stockForm.supplierContact || "-",
      },
    ]);

    setShowStockModal(false);
    // reset form
    setStockForm({
      vaccineId: "",
      type: "nhập",
      quantity: "",
      source: "",
      note: "",
      staff: "Nhân viên A",
      supplierAddress: "",
      supplierContact: "",
    });
  };

  // ==== Xuất CSV (fix lỗi ,,) ====
  const handleExportStock = () => {
    let csv = "Ngày,Tên vắc xin,Loại,Số lượng,Đơn vị,Nguồn,Địa chỉ,Ngoại:Liên hệ,Ghi chú,Nhân viên\n";
    stockHistory.forEach((h) => {
      const vaccine = vaccines.find((v) => v.id === h.vaccineId) || {};
      // wrap fields that may contain comma in quotes
      csv += `"${h.date}","${vaccine.name || ""}","${h.type}",${h.quantity},"${
        vaccine.unit || ""
      }","${h.source || ""}","${h.supplierAddress || ""}","${h.supplierContact || ""}","${h.note || ""}","${h.staff}"\n`;
    });
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "stock-history.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // ==== Filter data ====
  const filteredStock = stockHistory.filter((h) => {
    const vaccine = vaccines.find((v) => v.id === h.vaccineId) || {};
    return (
      vaccine.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      h.staff?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });


  return (
    <div className="tw-p-6 tw-bg-red-50 tw-min-h-screen tw-pt-[150px]">
        <div className="tw-flex tw-justify-center tw-items-center  tw-mb-10 ">
            <h1 className="tw-text-[32px] tw-pb-5 tw-ml-3 tw-font-bold tw-bg-gradient-to-r tw-from-orange-500 tw-via-yellow-500 tw-to-green-500 tw-bg-clip-text tw-text-transparent">
                <i className="fa-solid fa-vial-virus"></i>
                <span className="tw-ml-5">Quản lý vắc xin</span>
            </h1>
        </div>
      {/* Tabs */}
      <div className="tw-flex tw-justify-start">
        <div className="tw-inline-flex tw-bg-white tw-rounded-full tw-border tw-border-white tw-overflow-hidden tw-space-x-2 tw-mb-8">
            <button  onClick={() => setActiveTab("manage")}
            className={`tw-py-3 tw-px-5 tw-font-medium tw-rounded-full transition ${
                activeTab === "manage"
                ? "tw-bg-[#ee1968] tw-text-white"
                : "tw-bg-white tw-text-gray-600 tw-border tw-border-white hover:tw-bg-white" 
            }`} >
                Quản lý vắc xin
            </button>
            <button onClick={() => setActiveTab("stock")}
              className={`tw-py-3 tw-px-5 tw-font-medium tw-rounded-full transition ${
                activeTab === "stock"
                ? "tw-bg-[#ee1968] tw-text-white"
                : "tw-bg-white tw-text-gray-600 tw-border tw-border-white hover:tw-bg-white"
              }`} >
                 Nhập / Xuất
            </button>
            <button onClick={() => setActiveTab("expiry")}
                className={`tw-py-3 tw-px-5 tw-font-medium tw-rounded-full transition ${
                  activeTab === "expiry"
                    ? "tw-bg-[#ee1968] tw-text-white"
                    : "tw-bg-white tw-text-gray-600 tw-border tw-border-white hover:tw-bg-white"
                }`}>
                Cảnh báo hết hạn
            </button>
        </div>
      </div>


      {/* Tab qly vaccine */}
      {activeTab === "manage" && (
        <div>
            {warningVaccines.filter(v => !processedWarnings.includes(v.id)).length > 0 && (
              <div className="tw-bg-yellow-100 tw-text-yellow-700 tw-px-4 tw-py-3 tw-rounded-lg tw-mb-10 tw-cursor-pointer hover:tw-bg-yellow-200"
                  onClick={() => setActiveTab("expiry")}>
                <i className="fa-solid fa-triangle-exclamation tw-mr-2"></i>
                Có {warningVaccines.filter(v => !processedWarnings.includes(v.id)).length} loại vắc xin sắp hết hạn – bấm để xem chi tiết
              </div>
            )}

            <div className="tw-flex tw-justify-between tw-items-center tw-mb-16 tw-gap-4">
                <div className="tw-flex tw-items-center tw-gap-2 tw-w-1/2">
                    <input type="text"  placeholder="Tìm kiếm theo tên hoặc nhà sản xuất..."
                    value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                    className="tw-border tw-border-gray-300 tw-px-4 tw-py-2 tw-rounded-lg tw-shadow-sm tw-flex-1 focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-blue-300 focus:tw-border-blue-800" />
                    <button  onClick={() => console.log("Tìm kiếm:", searchTerm)}
                        className="tw-bg-blue-600 tw-text-white tw-px-4 tw-py-2 tw-rounded-full tw-font-medium hover:tw-bg-blue-700 tw-shadow"  >
                        <i className="fa-solid fa-magnifying-glass tw-mr-2"></i>
                        Tìm kiếm
                    </button>
                </div>
                <div className="tw-flex tw-gap-3">
                    <button  onClick={() => {
                            setCurrentVaccine(null);
                            setShowModal(true);
                        }}  className="tw-bg-green-600 tw-text-white tw-px-6 tw-py-2 tw-rounded-full tw-font-medium hover:tw-bg-green-700 tw-shadow" >
                        <i className="fa-solid fa-plus tw-mr-2"></i>
                        Thêm vắc xin
                    </button>
                    <button  onClick={handleExport}
                        className="tw-bg-orange-600 tw-text-white tw-px-6 tw-py-2 tw-rounded-full tw-font-medium hover:tw-bg-orange-700 tw-shadow" >
                        Xuất Excel
                    </button>
                </div>
            </div>


            <div className="tw-bg-white tw-rounded-xl tw-shadow-md tw-overflow-x-auto tw-mb-[30px]">
              <table className="tw-w-full tw-table-auto tw-border-collapse tw-text-left tw-mb-4">
                  <colgroup>
                    <col /> {/* Tên */}
                    <col /> {/* Loại */}
                    <col /> {/* Mã */}
                    <col /> {/* Số lượng */}
                    <col /> {/* Đơn vị */}
                    <col /> {/* Hạn sử dụng */}
                    <col /> {/* Nhà sản xuất */}
                    <col /> {/* Quốc gia */}
                    <col /> {/* Số lô */}
                    <col /> {/* Giá */}
                    <col className="tw-w-[150px]" /> {/* Ghi chú (ép nhỏ lại, ví dụ 120px) */}
                    <col /> {/* Trạng thái */}
                    <col /> {/* Thao tác */}
                  </colgroup>
                  <thead className="tw-bg-[#c4fffc]">
                    <tr>
                        <th className="tw-px-4 tw-py-4 tw-w-1/13">Tên</th>
                        <th className="tw-px-4 tw-py-4 tw-w-1/13">Phân loại</th>
                        <th className="tw-px-4 tw-py-4 tw-w-1/13">Mã</th>
                        <th className="tw-px-4 tw-py-4 tw-w-1/13">Số lượng</th>
                        <th className="tw-px-4 tw-py-4 tw-w-1/13">Đơn vị</th>
                        <th className="tw-px-4 tw-py-4 tw-w-1/13">Hạn sử dụng</th>
                        <th className="tw-px-4 tw-py-4 tw-w-1/13">Nhà sản xuất</th>
                        <th className="tw-px-4 tw-py-4 tw-w-1/13">Quốc gia</th>
                        <th className="tw-px-4 tw-py-4 tw-w-1/13">Số lô</th>
                        <th className="tw-px-4 tw-py-4 tw-w-1/13">Giá</th>
                        <th className="tw-px-4 tw-py-4 tw-w-1/13">Ghi chú</th>
                        <th className="tw-px-4 tw-py-4 tw-w-1/13">Trạng thái</th>
                        <th className="tw-px-4 tw-py-4 tw-w-1/11 tw-text-center">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                  {currentData.map((v) => {
                      return (
                      <tr key={v.id} className="tw-border-b hover:tw-bg-pink-100 ">
                          <td className="tw-px-4 tw-py-2">{v.name}</td>
                          <td className="tw-px-4 tw-py-2">{v.type}</td>
                          <td className="tw-px-4 tw-py-2">{v.code}</td>
                          <td className="tw-px-4 tw-py-2">{v.quantity}</td>
                          <td className="tw-px-4 tw-py-2">{v.unit}</td>
                          <td className="tw-px-4 tw-py-2">{v.expiry}</td>
                          <td className="tw-px-4 tw-py-2">{v.manufacturer}</td>
                          <td className="tw-px-4 tw-py-2">{v.country}</td>
                          <td className="tw-px-4 tw-py-2">{v.batch}</td>
                          <td className="tw-px-4 tw-py-2">{v.price.toLocaleString()}</td>
                          <td className="tw-px-4 tw-py-2">{v.note}</td>
                          <td className="tw-px-4 tw-py-2">
                            {v.quantity === 0 ? (
                              <span className="tw-bg-red-100 tw-text-red-600 tw-px-3 tw-py-2 tw-rounded-full">
                                Hết hàng
                              </span>
                            ) : v.quantity <= 20 ? (
                              <span className="tw-bg-yellow-100 tw-text-yellow-700 tw-px-3 tw-py-2 tw-rounded-full">
                                Sắp hết
                              </span>
                            ) : (
                              <span className="tw-bg-green-100 tw-text-green-600 tw-px-3 tw-py-2 tw-rounded-full">
                                Còn hàng
                              </span>
                            )}
                          </td>
                          <td className="tw-px-4 tw-py-2 tw-flex tw-gap-3 tw-justify-center tw-items-center ">
                              <button onClick={() => {
                                          setCurrentVaccine(v);
                                          setShowModal(true);
                                      }}  className="tw-bg-yellow-100 tw-text-yellow-600 tw-rounded-full tw-px-3 tw-py-2 tw-border tw-border-transparent 
                                      hover:tw-border-yellow-600"  >
                                  <i className="fa-solid fa-pencil"></i>
                                  <span className="tw-ml-2">Sửa</span>                               
                              </button>
                              <button onClick={() => { setConfirmAction({
                                    action: "delete", // mình đặt delete
                                    item: v           // lưu item đang xóa
                                  }); }} className="tw-bg-red-100 tw-text-red-600 tw-rounded-full tw-px-3 tw-py-2 tw-border tw-border-transparent 
                                      hover:tw-border-red-600"  >
                                <i className="fa-solid fa-eraser"></i>
                                <span className="tw-ml-2">Xóa</span>
                              </button>
                          </td>
                      </tr>
                      );
                  })}
                  </tbody>
              </table>

               {/* phân trang */}
                 <Pagination  page={page}  totalItems={filteredVaccines.length} perPage={perPage} onPageChange={setPage} />

            </div>

            {/* Modal thêm vaccin- sửa vaccin */}
            {showModal && (
              <div className="tw-fixed tw-inset-0 tw-bg-black tw-bg-opacity-50 tw-flex tw-justify-center tw-items-center tw-mt-[100px]">
                <div className="tw-bg-white tw-p-4  tw-rounded-xl tw-w-1/2 tw-relative ">
                  <h2 className="tw-text-3xl tw-font-semibold  tw-text-blue-600">
                    {currentVaccine ? "Sửa vắc xin" : "Thêm vắc xin"}
                  </h2>
                  <VaccineForm
                    vaccine={currentVaccine}
                    onSave={handleSaveVaccine}
                    onCancel={() => setShowModal(false)}
                  />
                </div>
              </div>
            )}
        
            {/* Modal xác nhận xoá */}
            {confirmAction && (
              <div className="tw-fixed tw-inset-0 tw-bg-black tw-bg-opacity-50 tw-flex tw-justify-center tw-items-center">
                <div className="tw-bg-white tw-p-6 tw-rounded-xl tw-w-[400px] tw-shadow-xl tw-relative">
                  <h2 className="tw-text-3xl tw-font-semibold tw-mb-4 tw-text-blue-600"> Xác nhận xóa </h2>
                  <p className="tw-mb-6 tw-text-gray-600">
                    Bạn có chắc muốn xóa vắc xin “<b>{confirmAction.item.name}</b>” không?
                  </p>
                  <div className="tw-flex tw-justify-end tw-space-x-3">
                    <button  onClick={() => setConfirmAction(null)}
                      className="tw-bg-red-600 tw-text-white tw-px-4 tw-py-2 tw-rounded hover:tw-bg-red-500" >
                      Hủy
                    </button>
                    <button onClick={() => {
                        setVaccines((prev) =>
                          prev.filter((v) => v.id !== confirmAction.item.id)
                        ); setConfirmAction(null);
                      }} className="tw-bg-blue-600 tw-text-white tw-px-4 tw-py-2 tw-rounded hover:tw-bg-blue-500" >
                      Đồng ý
                    </button>
                  </div>
                </div>
              </div>
            )}

        </div>
      )}

      {/* Tab nhập xuất */}     
      {activeTab === "stock" && (
        <div>
          {/* Thanh tìm kiếm + Xuất Excel */}
          <div className="tw-flex tw-justify-between tw-items-center tw-mb-16 tw-gap-4">
            <div className="tw-flex tw-items-center tw-gap-2 tw-w-1/2">
              <input
                type="text"
                placeholder="Tìm kiếm theo tên vắc xin hoặc nhân viên..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="tw-border tw-border-gray-300 tw-px-4 tw-py-2 tw-rounded-lg tw-shadow-sm tw-flex-1 focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-blue-300 focus:tw-border-blue-800" />
              <button onClick={() => console.log("Tìm kiếm:", searchTerm)}
                className="tw-bg-blue-600 tw-text-white tw-px-4 tw-py-2 tw-rounded-full tw-font-medium hover:tw-bg-blue-700 tw-shadow" >
                <i className="fa-solid fa-magnifying-glass tw-mr-2"></i>
                Tìm kiếm
              </button>
            </div>
            <div className="tw-flex tw-gap-3">
              <button   onClick={() => setShowStockModal(true)}
                  className="tw-bg-green-600 tw-text-white tw-px-6 tw-py-2 tw-rounded-full tw-font-medium hover:tw-bg-green-700 tw-shadow">
                <i className="fa-solid fa-plus tw-mr-2"></i>
                Nhập/Xuất vắc xin
              </button>
              <button  onClick={handleExportStock}
                className="tw-bg-orange-600 tw-text-white tw-px-6 tw-py-2 tw-rounded-full tw-font-medium hover:tw-bg-orange-700 tw-shadow" >
                Xuất Excel
              </button>
            </div>
          </div>

          {/* Bảng lịch sử nhập/xuất */}
          <div className="tw-bg-white tw-rounded-xl tw-shadow-md tw-overflow-x-auto tw-mb-[30px]">
            <table className="tw-w-full tw-table-auto tw-border-collapse tw-text-left   tw-mb-4">
              <thead className="tw-bg-yellow-100">
                <tr>
                  <th className="tw-w-[8%] tw-px-4 tw-py-4">Tên vắc xin</th>
                  <th className="tw-w-[6%] tw-px-4 tw-py-4">Phân loại</th>
                  <th className="tw-w-[6%] tw-px-4 tw-py-4">Ngày</th>
                  <th className="tw-w-[5%] tw-px-4 tw-py-4">Số lượng</th>
                  <th className="tw-w-[5%] tw-px-4 tw-py-4">Đơn vị</th>
                  <th className="tw-w-[6%] tw-px-4 tw-py-4">Đơn giá</th>
                  <th className="tw-w-[7%] tw-px-4 tw-py-4">Thành tiền</th>
                  <th className="tw-w-[8%] tw-px-4 tw-py-4">Loại giao dịch</th>
                  <th className="tw-w-[10%] tw-px-4 tw-py-4">Nhà cung cấp</th>
                  <th className="tw-w-[12%] tw-px-4 tw-py-4">Ghi chú</th>
                  <th className="tw-w-[8%] tw-px-4 tw-py-4">Nhân viên</th>
                  <th className="tw-w-[9%] tw-px-4 tw-py-4">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                 {filteredStock.slice((page - 1) * perPage, page * perPage).map((h, index) => {
                    const vaccine = vaccines.find((v) => v.id === h.vaccineId) || {};
                    const total = h.quantity * (h.unitPrice || 0);
                    return (
                      <tr key={index} className="tw-border-b hover:tw-bg-pink-100">
                        <td className="tw-px-4 tw-py-2">{vaccine.name || "Unknown"}</td>
                        <td className="tw-px-4 tw-py-2">{vaccine.type || "-"}</td>
                        <td className="tw-px-4 tw-py-2">{h.date}</td>
                        <td className="tw-px-4 tw-py-2">{h.quantity}</td>
                        <td className="tw-px-4 tw-py-2">{vaccine.unit || "liều"}</td>
                        <td className="tw-px-4 tw-py-2">{h.unitPrice?.toLocaleString() || "0"} đ</td>
                        <td className="tw-px-4 tw-py-2">{total.toLocaleString()} </td>
                        <td className="tw-px-4 tw-py-2">
                          <span className={`tw-px-5 tw-py-1 tw-rounded-full tw-font-medium tw-border ${
                              h.type === "nhập"
                                ? "tw-bg-green-100 tw-text-green-700 tw-border-green-400"
                                : h.type === "xuất"
                                ? "tw-bg-purple-100 tw-text-purple-700 tw-border-purple-400"
                                : "tw-bg-gray-100 tw-text-gray-700 tw-border-gray-300"
                            }`} >
                            {h.type}
                          </span>
                        </td>
                        <td className="tw-px-4 tw-py-2">{h.source}</td>
                        <td className="tw-px-4 tw-py-2">{h.note || "-"}</td>
                        <td className="tw-px-4 tw-py-2">{h.staff}</td>
                        <td className="tw-px-4 tw-py-2 tw-text-center">
                          <button onClick={() => setCurrentVaccine({ ...h, vaccineName: vaccine.name, vaccineType: vaccine.type, vaccineUnit: vaccine.unit })}
                            className="tw-bg-blue-100 tw-text-blue-600 tw-rounded-full tw-px-3 tw-py-1 tw-border tw-border-transparent 
                                      hover:tw-border-blue-600">
                            <i className="fa-solid fa-eye tw-mr-1"></i> Xem
                          </button>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>

             {/* Phân trang */}
              <Pagination  page={page}  totalItems={filteredStock.length} perPage={perPage} onPageChange={setPage} />

          </div>
          
         {/* Modal nhập/xuất/điều chỉnh */}
          {showStockModal && (
            <div className="tw-fixed tw-inset-0 tw-bg-black/50 tw-flex tw-justify-center tw-items-center tw-pt-[100px]">
              <div className="tw-bg-white tw-rounded-xl tw-p-6 tw-w-[550px] tw-text-left">
                <h2 className="tw-text-3xl tw-font-bold tw-text-blue-600  tw-text-center">
                  Quản lý giao dịch vắc xin
                </h2>

                {/* Chọn vắc xin (Dropdown) */}
                <Dropdown label="Chọn vắc xin" value={stockForm.vaccineId}
                  options={vaccines.map((v) => ({ value: v.id, label: v.name }))}
                  onChange={(val) => setStockForm({ ...stockForm, vaccineId: val })}
                />

                {/* Loại giao dịch + Số lượng */}
                <div className="tw-grid tw-grid-cols-2 tw-gap-24 ">
                    <Dropdown label="Loại giao dịch" value={stockForm.type}
                      options={[
                        { value: "nhập", label: "nhập" },
                        { value: "xuất", label: "xuất" },
                        { value: "điều chỉnh", label: "điều chỉnh" },
                      ]} onChange={(val) => setStockForm({ ...stockForm, type: val })} className="tw-w-full" 
                    />

                   <div>
                      <label className="tw-block tw-mb-2 tw-text-gray-700 tw-font-medium">Số lượng</label>
                      <QuantityPicker
                        value={stockForm.quantity}
                        onChange={(value) => setStockForm({ ...stockForm, quantity: value })}
                      />
                    </div>                   
                </div>
                {/* Mã vaccine + Số lô */}
                <div className="tw-grid tw-grid-cols-2 tw-gap-4">
                  <div>
                    <label className="tw-block tw-mb-2 tw-text-gray-700 tw-font-medium">Mã vaccine</label>
                    <input
                      type="text"
                      className="tw-w-full tw-border tw-rounded tw-px-3 tw-py-2 focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-blue-300 focus:tw-border-blue-800"
                      value={stockForm.vaccineCode || ""}
                      onChange={(e) => setStockForm({ ...stockForm, vaccineCode: e.target.value })}
                    />
                  </div>
                  {stockForm.type === "nhập" && (
                    <div>
                      <label className="tw-block tw-mb-2 tw-text-gray-700 tw-font-medium">Số lô</label>
                      <input
                        type="text"
                        className="tw-w-full tw-border tw-rounded tw-px-3 tw-py-2 focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-blue-300 focus:tw-border-blue-800"
                        value={stockForm.batchNumber || ""}
                        onChange={(e) => setStockForm({ ...stockForm, batchNumber: e.target.value })}
                      />
                    </div>
                  )}
                </div>

                {/* Hạn sử dụng + Đơn vị */}
                {stockForm.type === "nhập" && (
                  <div className="tw-grid tw-grid-cols-2 tw-gap-4 tw-mt-2">
                    <div>
                      <label className="tw-block tw-mb-2 tw-text-gray-700 tw-font-medium">Hạn sử dụng</label>
                       <input type="date" className="tw-w-full tw-border tw-rounded tw-px-3 tw-py-2 focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-blue-300 focus:tw-border-blue-800"
                        value={stockForm.expiryDate || ""} min={new Date().toISOString().split("T")[0]}
                        onChange={(e) => setStockForm({ ...stockForm, expiryDate: e.target.value })} />
                    </div>
                    <div>
                      <label className="tw-block tw-mb-2 tw-text-gray-700 tw-font-medium">Đơn vị</label>
                      <input type="text" placeholder="Ví dụ: liều, lọ…"
                        className="tw-w-full tw-border tw-rounded tw-px-3 tw-py-2 focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-blue-300 focus:tw-border-blue-800"
                        value={stockForm.unit || ""}  onChange={(e) => setStockForm({ ...stockForm, unit: e.target.value })}
                      />
                    </div>
                  </div>
                )}

                <div className="tw-flex tw-gap-4 tw-mt-2">
                    {/* Đơn giá */}
                    <div className="tw-flex-1">
                      <label className="tw-block tw-mb-2 tw-text-gray-700 tw-font-medium">Đơn giá (VNĐ)</label>
                      <input 
                        type="number" 
                        min="0" 
                        className="tw-w-full tw-border tw-rounded tw-px-3 tw-py-2 focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-blue-300 focus:tw-border-blue-800"
                        value={stockForm.unitPrice || ""}
                        onChange={(e) => setStockForm({ ...stockForm, unitPrice: Number(e.target.value) })}
                      />
                    </div>

                    {/* Nhà cung cấp */}
                    {stockForm.type === "nhập" && (
                      <Dropdown
                        label="Nhà cung cấp" value={stockForm.source}
                        options={suppliers.map((s) => ({ value: s.value, label: s.label }))}
                        onChange={(val) => {
                          const selected = suppliers.find((s) => s.value === val);
                          setStockForm({
                            ...stockForm,
                            source: val, // lưu value
                            supplierAddress: selected?.address || "",
                            supplierContact: selected?.contact || "",
                          });
                        }}
                        className="tw-flex-1"
                      />
                    )}


                    {stockForm.type === "xuất" && (
                      <div className="tw-flex-1">
                        <label className="tw-block tw-mb-2 tw-text-gray-700 tw-font-medium">Nơi nhận</label>
                        <input type="text"
                          className="tw-w-full tw-border tw-rounded tw-px-3 tw-py-2 tw-mb-3 focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-blue-300 focus:tw-border-blue-800"
                          value={stockForm.source}
                          onChange={(e) => setStockForm({ ...stockForm, source: e.target.value })}
                        />
                      </div>
                    )}
                  </div>
                

                {/* Địa chỉ + Liên hệ (cùng một hàng) */}
                {(stockForm.type === "nhập" || stockForm.type === "xuất") && (
                  <div className="tw-grid tw-grid-cols-2 tw-gap-4 tw-mt-2">
                    <div>
                      <label className="tw-block tw-mb-2 tw-text-gray-700 tw-font-medium">Địa chỉ</label>
                      <input type="text"
                        className="tw-w-full tw-border tw-rounded tw-px-3 tw-py-2 tw-mb-3 focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-blue-300 focus:tw-border-blue-800"
                        value={stockForm.supplierAddress}
                        onChange={(e) =>
                          setStockForm({ ...stockForm, supplierAddress: e.target.value })
                        }
                      />
                    </div>
                    <div>
                      <label className="tw-block tw-mb-2 tw-text-gray-700 tw-font-medium">Liên hệ</label>
                      <input type="text"
                        className="tw-w-full tw-border tw-rounded tw-px-3 tw-py-2 tw-mb-3 focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-blue-300 focus:tw-border-blue-800"
                        value={stockForm.supplierContact}
                        onChange={(e) =>
                          setStockForm({ ...stockForm, supplierContact: e.target.value })
                        }
                      />
                    </div>
                  </div>
                )}

                {/* Ghi chú */}
                <label className="tw-block tw-mb-2 tw-text-gray-700 tw-font-medium">Ghi chú</label>
                <textarea  className="tw-w-full tw-border tw-rounded tw-px-3 tw-py-2 tw-mb-3 focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-blue-300 focus:tw-border-blue-800"
                  value={stockForm.note}  onChange={(e) => setStockForm({ ...stockForm, note: e.target.value })} />

                {/* Buttons */}
                <div className="tw-flex tw-justify-end tw-gap-2">
                  <button  onClick={() => setShowStockModal(false)} className="tw-bg-red-600 tw-text-white tw-rounded-full tw-px-6 tw-py-2" >
                    Hủy
                  </button>
                  <button onClick={handleSaveStock} className="tw-bg-blue-600 tw-text-white tw-rounded-full tw-px-6 tw-py-2" >
                    Lưu
                  </button>
                </div>
              </div>
            </div>
          )}



          {/* modal xem chi tiết */}
          {currentVaccine && (
            <div className="tw-fixed tw-inset-0 tw-bg-black/50 tw-flex tw-items-center tw-justify-center tw-pt-[90px]">
              <div className="tw-bg-white tw-rounded-2xl tw-shadow-xl tw-p-8 tw-w-[550px] tw-animate-fadeIn">
                <div className="tw-relative tw-flex tw-items-center tw-justify-center tw-mb-6">
                  <h2 className="tw-text-3xl tw-font-bold tw-text-blue-600">
                    <i className="fa-solid fa-file-import tw-mr-3"></i>Chi tiết nhập / xuất
                  </h2>
                  <button onClick={() => setCurrentVaccine(null)}
                    className="tw-absolute tw-right-0 tw-top-0 tw-flex tw-items-center tw-justify-center tw-w-10 tw-h-10 
                    tw-rounded-full tw-text-red-500 hover:tw-bg-gray-200 hover:tw-text-red-600 transition-colors" >
                    <i className="fa-solid fa-xmark tw-text-2xl"></i>
                  </button>
                </div>

                <div className="tw-grid tw-grid-cols-2 tw-gap-y-3 tw-text-gray-700 tw-text-left tw-px-10 tw-pb-8 tw-ml-12 " >
                  <div className="tw-font-semibold">Tên vắc xin:</div>
                  <div><i className="fa-solid fa-syringe tw-mr-3 tw-text-green-500"></i>{currentVaccine.vaccineName}</div>

                  <div className="tw-font-semibold">Phân loại:</div>
                  <div>{currentVaccine.vaccineType || "-"}</div>

                  <div className="tw-font-semibold">Ngày/giờ:</div>
                  <div><i className="fa-solid fa-clock  tw-mr-3 tw-text-pink-500"></i>{currentVaccine.date}</div>

                  <div className="tw-font-semibold">Số lượng:</div>
                  <div>
                    {currentVaccine.quantity} {currentVaccine.vaccineUnit || currentVaccine.unit || "liều"}
                  </div>

                  <div className="tw-font-semibold">Đơn giá:</div>
                  <div>{currentVaccine.unitPrice?.toLocaleString() || 0} VNĐ</div>

                  <div className="tw-font-semibold">Thành tiền:</div>
                  <div>{(currentVaccine.quantity * (currentVaccine.unitPrice || 0)).toLocaleString()} VNĐ</div>

                  <div className="tw-font-semibold">Loại giao dịch:</div>
                  <div>{currentVaccine.type}</div>

                  <div className="tw-font-semibold">Nhà cung cấp:</div>
                  <div><i className="fa-solid fa-house-chimney tw-mr-3 tw-text-blue-500"></i>{currentVaccine.source}</div>

                  <div className="tw-font-semibold">Địa chỉ nhà cung cấp:</div>
                  <div><i className="fa-solid fa-location-dot tw-mr-3 tw-text-purple-500"></i>{currentVaccine.supplierAddress || "-"}</div>

                  <div className="tw-font-semibold">Thông tin liên hệ:</div>
                  <div><i className="fa-solid fa-phone-volume tw-mr-3 tw-text-red-500"></i>{currentVaccine.supplierContact || "-"}</div>

                  <div className="tw-font-semibold">Ghi chú:</div>
                  <div><i className="fa-solid fa-book tw-mr-3 tw-text-yellow-500"></i>{currentVaccine.note || "—"}</div>

                  <div className="tw-font-semibold">Nhân viên:</div>
                  <div><i className="fa-solid fa-people-group tw-mr-3 tw-text-cyan-500"></i>{currentVaccine.staff}</div>
                </div>
              </div>
            </div>
          )}

         
        </div>
      )}


      {/* Tab cảnh báo */}
      {activeTab === "expiry" && (
        <div>
            {/* Thanh tìm kiếm + bộ lọc */}
            <div className="tw-flex tw-justify-between tw-items-center tw-mb-16 tw-gap-4">
              <div className="tw-flex tw-items-center tw-gap-2 tw-w-1/2">
                <input type="text" placeholder="Nhập từ khóa tìm kiếm..." value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  className="tw-border tw-border-gray-300 tw-px-4 tw-py-2 tw-rounded-lg tw-shadow-sm tw-flex-1 focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-blue-300 focus:tw-border-blue-800" />
                <button onClick={() => console.log("Tìm kiếm:", searchText)}
                  className="tw-bg-blue-600 tw-text-white tw-px-4 tw-py-2 tw-rounded-full tw-font-medium hover:tw-bg-blue-700 tw-shadow" >
                  <i className="fa-solid fa-magnifying-glass tw-mr-2"></i>
                  Tìm kiếm
                </button>
              </div>
              <div className="tw-flex tw-gap-3  tw-items-center">
                <div className="tw-flex tw-justify-between tw-items-center tw-px-4 tw-py-2">
                  <Dropdown value={filterType} options={warningOptions}
                    onChange={(val) => setFilterType(val)} className="tw-w-[250px]"
                  />
                </div>
                <button onClick={() => {
                    setFilterType("");
                    setSearchText("");
                  }} className="tw-bg-orange-500 tw-text-white tw-px-5 tw-py-2 tw-rounded-full tw-font-medium hover:tw-bg-orange-600 tw-shadow-sm" >
                  <i className="fa-solid fa-xmark tw-mr-1"></i> Xoá bộ lọc
                </button>
              </div>
            </div>

            {/* bảng danh sách cảnh báo */}
            <div className="tw-bg-white tw-rounded-xl tw-shadow-md tw-overflow-x-auto tw-my-[30px]">
              {unprocessedWarnings.length === 0 ? (
                <div className="tw-text-center tw-text-red-500 tw-py-10"><i className="fa-solid fa-circle-exclamation tw-mr-3"></i>Không có cảnh báo nào</div>
              ) : (
                <table className="tw-w-full tw-table-auto tw-border-collapse tw-text-left tw-mb-4">                 
                    <thead className="tw-bg-purple-200">
                      <tr>
                          <th className="tw-px-4 tw-py-4 tw-w-1/13">Tên</th>
                          <th className="tw-px-4 tw-py-4 tw-w-1/13">Phân loại</th>
                          <th className="tw-px-4 tw-py-4 tw-w-1/13">Mã</th>
                          <th className="tw-px-4 tw-py-4 tw-w-1/13">Số lượng</th>
                          <th className="tw-px-4 tw-py-4 tw-w-1/13">Đơn vị</th>
                          <th className="tw-px-4 tw-py-4 tw-w-1/13">Hạn sử dụng</th>
                          <th className="tw-px-4 tw-py-4 tw-w-1/13">Nhà sản xuất</th>
                          <th className="tw-px-4 tw-py-4 tw-w-1/13">Quốc gia</th>
                          <th className="tw-px-4 tw-py-4 tw-w-1/13">Số lô</th>
                          <th className="tw-px-4 tw-py-4 tw-w-1/13">Giá</th>
                          <th className="tw-px-4 tw-py-4 tw-w-1/10">Cảnh báo</th>
                          <th className="tw-px-4 tw-py-4 tw-w-1/13">Trạng thái</th>
                          <th className="tw-px-4 tw-py-4 tw-w-1/11 tw-text-center">Thao tác</th>
                      </tr>
                    </thead>
                    <tbody>
                    {filteredWarnings.map((v) => {
                        return (
                        <tr key={v.id} className="tw-border-b hover:tw-bg-pink-100 ">
                            <td className="tw-px-4 tw-py-2">{v.name}</td>
                            <td className="tw-px-4 tw-py-2">{v.type}</td>
                            <td className="tw-px-4 tw-py-2">{v.code}</td>
                            <td className="tw-px-4 tw-py-2">{v.quantity}</td>
                            <td className="tw-px-4 tw-py-2">{v.unit}</td>
                            <td className="tw-px-4 tw-py-2">{v.expiry}</td>
                            <td className="tw-px-4 tw-py-2">{v.manufacturer}</td>
                            <td className="tw-px-4 tw-py-2">{v.country}</td>
                            <td className="tw-px-4 tw-py-2">{v.batch}</td>
                            <td className="tw-px-4 tw-py-2">{v.price.toLocaleString()}</td>
                            <td className="tw-px-4 tw-py-2">
                              <span className={`tw-px-3 tw-py-2 tw-rounded-full ${
                                  v.warningType === "Hàng & Hạn đã hết"
                                    ? "tw-bg-red-100 tw-text-red-600"
                                    : v.warningType === "Hạn sử dụng sắp hết"
                                    ? "tw-bg-orange-100 tw-text-orange-700"
                                    : v.warningType === "Số lượng sắp hết"
                                    ? "tw-bg-blue-100 tw-text-blue-700"
                                    : "tw-bg-green-100 tw-text-green-600"
                                }`} >
                                {v.warningType === "Hàng & Hạn đã hết" && "⚠️ "}
                                {v.warningType === "Hạn sử dụng sắp hết" && "⏰ "} 
                                {v.warningType === "Số lượng sắp hết" && "📦 "} 
                                {v.warningType}
                              </span>
                            </td>
                            <td className="tw-px-4 tw-py-2">
                              {v.quantity === 0 ? (
                                <span className="tw-bg-red-100 tw-text-red-600 tw-px-3 tw-py-2 tw-rounded-full">
                                  Hết hàng
                                </span>
                              ) : v.quantity <= 20 ? (
                                <span className="tw-bg-yellow-100 tw-text-yellow-700 tw-px-3 tw-py-2 tw-rounded-full">
                                  Sắp hết
                                </span>
                              ) : (
                                <span className="tw-bg-green-100 tw-text-green-600 tw-px-3 tw-py-2 tw-rounded-full">
                                  Còn hàng
                                </span>
                              )}
                            </td>
                            <td className="tw-px-4 tw-py-2 tw-flex tw-gap-3 tw-justify-center tw-items-center ">
                              <button onClick={() => setActiveTab("stock")}
                                      className="tw-bg-pink-100 tw-text-pink-600 tw-border tw-border-transparent 
                                      hover:tw-border-pink-600 tw-rounded-full tw-px-3 tw-py-2"  >
                                  <i className="fa-solid fa-file-import"></i>
                                  <span className="tw-ml-2">Nhập thêm</span>                               
                              </button>
                              <button   onClick={() => {
                                        setCurrentVaccine({ ...v });
                                        setShowDetailModal(true);
                                      }} 
                                className="tw-bg-blue-100 tw-text-blue-600 tw-rounded-full tw-px-3 tw-py-2 tw-border tw-border-transparent 
                                      hover:tw-border-blue-600" >
                                <i className="fa-solid fa-eye"></i>
                                <span className="tw-ml-2">Xem</span>
                              </button>
                            
                              <button onClick={() => setProcessedWarnings([...processedWarnings, v.id])}
                                className="tw-bg-green-100 tw-text-green-600 tw-rounded-full tw-px-3 tw-py-2 tw-border tw-border-transparent 
                                      hover:tw-border-green-600" >
                                <i className="fa-solid fa-check-circle"></i>
                              </button>

                              <button onClick={() => { setConfirmAction({
                                    action: "delete", // mình đặt delete
                                    item: v           // lưu item đang xóa
                                  }); }} className="tw-bg-red-100 tw-text-red-600 tw-rounded-full tw-px-3 tw-py-2 tw-border tw-border-transparent 
                                      hover:tw-border-red-600"  >
                                <i className="fa-solid fa-trash"></i>
                              </button> 
                            </td>
                        </tr>
                        );
                    })}
                    </tbody>
                </table>
              )}

              {/* phân trang */}
              <Pagination  page={page}  totalItems={filteredWarnings.length} perPage={perPage} onPageChange={setPage} />


            </div>
            
            {/* Modal xác nhận xoá */}
            {confirmAction && (
              <div className="tw-fixed tw-inset-0 tw-bg-black tw-bg-opacity-50 tw-flex tw-justify-center tw-items-center">
                <div className="tw-bg-white tw-p-6 tw-rounded-xl tw-w-[400px] tw-shadow-xl tw-relative">
                  <h2 className="tw-text-3xl tw-font-semibold tw-mb-4 tw-text-blue-600"> Xác nhận xóa </h2>
                  <p className="tw-mb-6 tw-text-gray-600">
                    Bạn có chắc muốn xóa thông báo “<b>{confirmAction.item.name}</b>” không?
                  </p>
                  <div className="tw-flex tw-justify-end tw-space-x-3">
                    <button  onClick={() => setConfirmAction(null)}
                      className="tw-bg-red-600 tw-text-white tw-px-4 tw-py-2 tw-rounded hover:tw-bg-red-500" >
                      Hủy
                    </button>
                    <button onClick={() => {
                        setVaccines((prev) =>
                          prev.filter((v) => v.id !== confirmAction.item.id)
                        ); setConfirmAction(null);
                      }} className="tw-bg-blue-600 tw-text-white tw-px-4 tw-py-2 tw-rounded hover:tw-bg-blue-500" >
                      Đồng ý
                    </button>
                  </div>
                </div>
              </div>
            )}

            {showDetailModal && currentVaccine && (
              <div className="tw-fixed tw-inset-0 tw-bg-black/50 tw-flex tw-items-center tw-justify-center tw-pt-[80px]">
                <div className="tw-bg-white tw-rounded-2xl tw-shadow-xl tw-p-8 tw-w-[550px] tw-animate-fadeIn">
                  
                  {/* Header */}
                  <div className="tw-relative tw-flex tw-items-center tw-justify-center tw-mb-6">
                    <h2 className="tw-text-3xl tw-font-bold tw-text-blue-600">
                      <i className="fa-solid fa-vial-virus tw-mr-2"></i> Chi tiết vắc xin
                    </h2>
                    <button onClick={() => setCurrentVaccine(null)}
                      className="tw-absolute tw-right-0 tw-top-0 tw-flex tw-items-center tw-justify-center 
                                tw-w-10 tw-h-10 tw-rounded-full tw-text-red-500 hover:tw-bg-gray-200 
                                hover:tw-text-red-600 transition-colors">
                      <i className="fa-solid fa-xmark tw-text-2xl"></i>
                    </button>
                  </div>

                  {/* Body */}
                  <div className="tw-grid tw-grid-cols-2 tw-gap-y-4 tw-text-gray-700 tw-text-left tw-px-20 tw-pb-8 tw-ml-20">
                    <div className="tw-font-semibold">Tên vắc xin:</div>
                    <div>{currentVaccine.name}</div>

                    <div className="tw-font-semibold">Loại:</div>
                    <div>{currentVaccine.type}</div>

                    <div className="tw-font-semibold">Mã:</div>
                    <div>{currentVaccine.code}</div>

                    <div className="tw-font-semibold">Số lượng:</div>
                    <div>{currentVaccine.quantity} {currentVaccine.unit}</div>

                    <div className="tw-font-semibold">Hạn sử dụng:</div>
                    <div>{currentVaccine.expiry}</div>

                    <div className="tw-font-semibold">Nhà sản xuất:</div>
                    <div>{currentVaccine.manufacturer}</div>

                    <div className="tw-font-semibold">Quốc gia:</div>
                    <div>{currentVaccine.country}</div>

                    <div className="tw-font-semibold">Số lô:</div>
                    <div>{currentVaccine.batch}</div>

                    <div className="tw-font-semibold">Giá:</div>
                    <div>{currentVaccine.price.toLocaleString()} VNĐ</div>

                    <div className="tw-font-semibold">Cảnh báo:</div>
                    <div className={`tw-font-medium ${
                      currentVaccine.warningType === "Hàng & Hạn đã hết" ? "tw-text-red-600" :
                      currentVaccine.warningType === "Hạn sử dụng sắp hết" ? "tw-text-orange-600" :
                      currentVaccine.warningType === "Số lượng sắp hết" ? "tw-text-blue-600" :
                      "tw-text-green-600"
                    }`}>
                      {currentVaccine.warningType}
                    </div>
                    <div className="tw-font-semibold">Ghi chú:</div>
                    <div>{currentVaccine.note || "—"}</div>
                  </div>
                </div>
              </div>
            )}



        </div>
      )}


    </div>
  );
}


