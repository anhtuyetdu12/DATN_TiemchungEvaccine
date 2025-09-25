import React, { useState } from "react";
import { v4 as uuidv4 } from "uuid";
import VaccineForm from "../../components/VaccineForm"

export default function StaffVaccines() {
  const [activeTab, setActiveTab] = useState("manage"); // "manage" hoặc "stock"
  const [vaccines, setVaccines] = useState([
    {
      id: 1,
      name: "Vắc xin A",
      type: "Trẻ em",
      code: "VX001",
      quantity: 100,
      unit: "liều",
      expiry: "2025-12-31",
      manufacturer: "Pfizer",
      country: "USA",
      batch: "B001",
      price: 200000,
      note: "Chống chỉ định với người dị ứng",
    },
    {
      id: 2,
      name: "Vắc xin B",
      type: "Người lớn",
      code: "VX002",
      quantity: 10,
      unit: "liều",
      expiry: "2025-09-30",
      manufacturer: "Moderna",
      country: "USA",
      batch: "B002",
      price: 250000,
      note: "",
    },
  ]);

  const [stockHistory, setStockHistory] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [currentVaccine, setCurrentVaccine] = useState(null);

  // Thêm hoặc sửa vắc xin
  const handleSaveVaccine = (vaccine) => {
    if (vaccine.id) {
      setVaccines(vaccines.map((v) => (v.id === vaccine.id ? { ...vaccine } : v)));
    } else {
      setVaccines([...vaccines, { ...vaccine, id: uuidv4() }]);
    }
    setShowModal(false);
  };

  // Xóa vắc xin
  const handleDeleteVaccine = (id) => {
    if (window.confirm("Bạn có chắc muốn xóa vắc xin này?")) {
      setVaccines(vaccines.filter((v) => v.id !== id));
    }
  };

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

    const term = searchTerm.toLowerCase();
    const filteredVaccines = vaccines.filter(
    (v) => v.name.toLowerCase().includes(term) || v.manufacturer.toLowerCase().includes(term)
    );

  // Nhập/Xuất vắc xin
  const handleStock = () => {
    const vaccineId = parseInt(prompt("ID vắc xin:"));
    const type = prompt("Loại thao tác (nhập/xuất):").toLowerCase();
    const quantity = parseInt(prompt("Số lượng:"));
    const source = prompt("Nhà cung cấp / Ghi chú:");
    const staff = prompt("Nhân viên thực hiện:");
    const date = new Date().toISOString().split("T")[0];

    const vaccine = vaccines.find((v) => v.id === vaccineId);
    if (!vaccine) return alert("Không tìm thấy vắc xin");

    let newQuantity = vaccine.quantity;
    if (type === "nhập") newQuantity += quantity;
    else if (type === "xuất") newQuantity -= quantity;

    setVaccines(vaccines.map((v) => (v.id === vaccineId ? { ...v, quantity: newQuantity } : v)));
    setStockHistory([...stockHistory, { vaccineId, type, quantity, source, staff, date }]);
  };

  return (
    <div className="tw-p-6 tw-bg-red-50 tw-min-h-screen tw-pt-[150px]">
        <div className="tw-flex tw-justify-center tw-items-center  tw-mb-10 ">
            <h1 className="tw-text-[30px] tw-pb-5 tw-ml-3 tw-font-bold tw-bg-gradient-to-r tw-from-orange-500 tw-via-yellow-500 tw-to-green-500 tw-bg-clip-text tw-text-transparent">
                <i class="fa-solid fa-vial-virus"></i>
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
        </div>
      </div>


      {/* Tab Content */}
      {activeTab === "manage" && (
        <div>
            <div className="tw-flex tw-justify-between tw-items-center tw-mb-16 tw-gap-4">
                <div className="tw-flex tw-items-center tw-gap-2 tw-w-1/2">
                    <input type="text"  placeholder="Tìm kiếm theo tên hoặc nhà sản xuất..."
                    value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                    className="tw-border tw-border-gray-300 tw-px-4 tw-py-2 tw-rounded-lg tw-shadow-sm tw-flex-1 focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-blue-300 focus:tw-border-blue-800" />
                    <button  onClick={() => console.log("Tìm kiếm:", searchTerm)}
                        className="tw-bg-blue-600 tw-text-white tw-px-4 tw-py-2 tw-rounded-full tw-font-medium hover:tw-bg-blue-700 tw-shadow"  >
                        <i class="fa-solid fa-magnifying-glass tw-mr-2"></i>
                        Tìm kiếm
                    </button>
                </div>
                <div className="tw-flex tw-gap-3">
                    <button  onClick={() => {
                            setCurrentVaccine(null);
                            setShowModal(true);
                        }}  className="tw-bg-green-600 tw-text-white tw-px-6 tw-py-2 tw-rounded-full tw-font-medium hover:tw-bg-green-700 tw-shadow" >
                        <i class="fa-solid fa-plus tw-mr-2"></i>
                        Thêm vắc xin
                    </button>
                    <button  onClick={handleExport}
                        className="tw-bg-orange-600 tw-text-white tw-px-6 tw-py-2 tw-rounded-full tw-font-medium hover:tw-bg-orange-700 tw-shadow" >
                        Xuất Excel
                    </button>
                </div>
            </div>


            <div className="tw-bg-white tw-rounded-xl tw-shadow-md tw-overflow-x-auto ">
            <table className="tw-w-full tw-table-auto tw-border-collapse tw-text-left tw-mb-4">
                <thead className="tw-bg-[#c4fffc]">
                <tr>
                    <th className="tw-px-4 tw-py-4 tw-w-1/13">Tên</th>
                    <th className="tw-px-4 tw-py-4 tw-w-1/13">Loại</th>
                    <th className="tw-px-4 tw-py-4 tw-w-1/13">Mã</th>
                    <th className="tw-px-4 tw-py-4 tw-w-1/13">Số lượng</th>
                    <th className="tw-px-4 tw-py-4 tw-w-1/13">Đơn vị</th>
                    <th className="tw-px-4 tw-py-4 tw-w-1/13">Hạn sử dụng</th>
                    <th className="tw-px-4 tw-py-4 tw-w-1/13">Nhà sản xuất</th>
                    <th className="tw-px-4 tw-py-4 tw-w-1/13">Quốc gia</th>
                    <th className="tw-px-4 tw-py-4 tw-w-1/13">Số lô</th>
                    <th className="tw-px-4 tw-py-4 tw-w-1/13">Giá</th>
                    <th className="tw-px-4 tw-py-4 tw-w-1/13">Ghi chú</th>
                    <th className="tw-px-4 tw-py-4 tw-w-1/12">Trạng thái</th>
                    <th className="tw-px-4 tw-py-4 tw-w-1/11 tw-text-center">Thao tác</th>
                </tr>
                </thead>
                <tbody>
                {filteredVaccines.map((v) => {
                    const isLowStock = v.quantity <= 20;
                    const isExpired = new Date(v.expiry) < new Date();
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
                        {isExpired ? (
                            <span className="tw-bg-red-100 tw-text-red-600 tw-px-3 tw-py-1 tw-rounded-full">
                            Hết hạn
                            </span>
                        ) : isLowStock ? (
                            <span className="tw-bg-yellow-100 tw-text-yellow-700 tw-px-3 tw-py-1 tw-rounded-full">
                            Sắp hết
                            </span>
                        ) : (
                            <span className="tw-bg-green-100 tw-text-green-600 tw-px-3 tw-py-1 tw-rounded-full">
                            Còn hàng
                            </span>
                        )}
                        </td>
                        <td className="tw-px-4 tw-py-2 tw-flex tw-gap-3 ">
                            <button onClick={() => {
                                        setCurrentVaccine(v);
                                        setShowModal(true);
                                    }} 
                                className="tw-bg-yellow-100 tw-text-yellow-600 tw-rounded-full tw-px-3 tw-py-2"  >
                                <i class="fa-solid fa-pencil"></i>
                                <span className="tw-ml-2">Sửa</span>                               
                            </button>
                            <button
                                onClick={() => {
                                    if (window.confirm(`Bạn có chắc muốn xóa vắc xin ${v.name}?`)) {
                                    handleDeleteVaccine(v.id);
                                    }
                                }} className="tw-bg-red-100 tw-text-red-600 tw-rounded-full tw-px-3 tw-py-2" >
                                <i className="fa-solid fa-eraser"></i>
                                <span className="tw-ml-2">Xóa</span>
                            </button>
                        </td>
                    </tr>
                    );
                })}
                </tbody>
            </table>
            </div>
        </div>
      )}

      {activeTab === "stock" && (
        <div>
          <div className="tw-flex tw-justify-end tw-mb-4">
            <button
              onClick={handleStock}
              className="tw-bg-purple-600 tw-text-white tw-px-4 tw-py-2 tw-rounded hover:tw-bg-purple-700"
            >
              Nhập / Xuất vắc xin
            </button>
          </div>
          <div className="tw-bg-white tw-rounded-xl tw-shadow-md tw-overflow-x-auto">
            <table className="tw-w-full tw-table-auto tw-border-collapse tw-text-left">
              <thead className="tw-bg-gray-100">
                <tr>
                  <th className="tw-px-4 tw-py-2">Ngày</th>
                  <th className="tw-px-4 tw-py-2">Tên vắc xin</th>
                  <th className="tw-px-4 tw-py-2">Loại thao tác</th>
                  <th className="tw-px-4 tw-py-2">Số lượng</th>
                  <th className="tw-px-4 tw-py-2">Nhà cung cấp / Ghi chú</th>
                  <th className="tw-px-4 tw-py-2">Nhân viên</th>
                </tr>
              </thead>
              <tbody>
                {stockHistory.map((h, index) => {
                  const vaccine = vaccines.find((v) => v.id === h.vaccineId) || {};
                  return (
                    <tr key={index} className="hover:tw-bg-gray-50">
                      <td className="tw-px-4 tw-py-2">{h.date}</td>
                      <td className="tw-px-4 tw-py-2">{vaccine.name || "Unknown"}</td>
                      <td className="tw-px-4 tw-py-2">{h.type}</td>
                      <td className="tw-px-4 tw-py-2">{h.quantity}</td>
                      <td className="tw-px-4 tw-py-2">{h.source}</td>
                      <td className="tw-px-4 tw-py-2">{h.staff}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal chỉnh sửa */}
      {showModal && (
        <div className="tw-fixed tw-inset-0 tw-bg-black tw-bg-opacity-50 tw-flex tw-justify-center tw-items-center tw-mt-[100px]">
          <div className="tw-bg-white tw-p-6 tw-rounded-xl tw-w-1/2 tw-relative">
            <h2 className="tw-text-3xl tw-font-semibold tw-mb-2 tw-text-blue-600">
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
    </div>
  );
}


