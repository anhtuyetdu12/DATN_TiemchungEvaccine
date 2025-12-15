import React, { useState, useEffect } from "react";
import { v4 as uuidv4 } from "uuid";
import VaccineForm from "./modal/vaccines/VaccineForm"
import Dropdown from "../../components/Dropdown";
import { getStockSummary } from "../../services/inventoryService";
import Pagination from "../../components/Pagination";
import {  toast } from "react-toastify";
import ViewExpiryVCModal from "./modal/vaccines/ViewExpiryVCModal";
import ConfirmModal from "../../components/ConfirmModal";
import { getAllVaccines, exportVaccinesExcel } from "../../services/vaccineService";

const WARNING_STYLE = {
  "Hàng & Hạn đã hết": {
    bg: "tw-bg-red-100",
    text: "tw-text-red-700",
    icon: "fa-triangle-exclamation",
  },
  "Hàng & Hạn sắp hết": {
    bg: "tw-bg-amber-100",
    text: "tw-text-amber-800",
    icon: "fa-triangle-exclamation",
  },
  "Hết hạn": {
    bg: "tw-bg-rose-100",
    text: "tw-text-rose-700",
    icon: "fa-circle-xmark",
  },
  "Hết hàng": {
    bg: "tw-bg-red-100",
    text: "tw-text-red-700",
    icon: "fa-box-open",
  },
  "Hạn sử dụng sắp hết": {
    bg: "tw-bg-orange-100",
    text: "tw-text-orange-700",
    icon: "fa-clock",
  },
  "Số lượng sắp hết": {
    bg: "tw-bg-yellow-100",
    text: "tw-text-yellow-800",
    icon: "fa-boxes-stacked",
  },
};


export default function StaffVaccines() {
  const [activeTab, setActiveTab] = useState("manage");
  const [vaccines, setVaccines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState("");      
  const [appliedSearch, setAppliedSearch] = useState(""); 
  const [showModal, setShowModal] = useState(false);
  const [currentVaccine, setCurrentVaccine] = useState(null);
  const [confirmAction, setConfirmAction] = useState(null);

  // khi đổi từ khóa tìm kiếm → quay về trang 1
  useEffect(() => { setPageManage(1); }, [appliedSearch]);

  // Thêm hoặc sửa vắc xin
  const handleSaveVaccine = (vaccine) => {
    if (vaccine.id) {
      setVaccines((vs) => vs.map((v) => (v.id === vaccine.id ? { ...vaccine } : v)));
    } else {
      setVaccines((vs) => [...vs, { ...vaccine, id: uuidv4() }]);
    }
    setShowModal(false);
  };

  //============ phân trang=====================
  const [pageManage, setPageManage] = useState(1);
  const [pageExpiry, setPageExpiry] = useState(1);
  const perPage = 10;

  // lọc dữ liệu
  const term = appliedSearch.toLowerCase();
  const filteredVaccines = vaccines.filter(
    (v) => v.name?.toLowerCase().includes(term) ||
    v.manufacturer?.toLowerCase().includes(term) ||
    v.diseaseName?.toLowerCase().includes(term) ||
    v.country?.toLowerCase().includes(term) 
  );

  // slice dữ liệu theo trang
  const currentData = filteredVaccines.slice((pageManage - 1) * perPage, pageManage * perPage);

  useEffect(() => {
     const maxPage = Math.max(1, Math.ceil(filteredVaccines.length / perPage));
     if (pageManage > maxPage) setPageManage(maxPage);
  }, [filteredVaccines.length, pageManage]);
  
  // lấy ds vắc xin + tồn kho
  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        // 1) luôn lấy vaccine trước
        const list = await getAllVaccines();
        // Chuẩn hóa sơ bộ trước khi có stock
        let normalized = (list || []).map((v) => ({
          id: v.id,
          name: v.name,
          type: v.vaccine_type || "-",
          code: v.slug || String(v.id),
          quantity: 0,
          unit: v.unit || "liều",
          expiry: "-",
          manufacturer: v.manufacturer || "-",
          country: v.origin || "-",
          batch: "-",
          price: Number(v.price ?? 0),
          note: v.other_notes || "",
          diseaseName: v?.disease?.name || "-",
          categoryName: v?.category?.name || "-",
          image: v.image || null,
          lots: [],
        }));

        // 2) thử lấy stock-summary, nếu lỗi thì bỏ qua
        try {
          const stock = await getStockSummary(); // OPTIONAL
          const stockById = new Map(stock.map((s) => [s.vaccine_id, s]));
          normalized = normalized.map((v) => {
            const s = stockById.get(v.id);
            if (!s) return v;
            return {
              ...v,
              quantity: s?.available_total ?? 0,
              expiry: s?.soonest_expiry || "-",
              batch: s?.first_lot_number || "-",
              lots: s?.lots || [],
            };
          });
        } catch (err) {
          console.warn("Stock summary lỗi (bỏ qua):", err);
        }
        if (mounted) setVaccines(normalized);
      } catch (e) {
        console.error(e);
        toast.error("Không tải được danh sách vắc xin.");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);



  // ===========cảnh báo hết hạn sử dụng===============
  const [warningVaccines, setWarningVaccines] = useState([]);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [filterType, setFilterType] = useState(""); // lọc theo warningType
  const [searchTextInput, setSearchTextInput] = useState("");
  const [appliedExpirySearch, setAppliedExpirySearch] = useState("");

  const warningOptions = [
    { value: "", label: "Tất cả cảnh báo" },
    { value: "Hàng & Hạn đã hết", label: "Hàng & Hạn đã hết" },
    { value: "Hết hạn", label: "Hết hạn" },
    { value: "Hết hàng", label: "Hết hàng" },
    { value: "Hạn sử dụng sắp hết", label: "Hạn sử dụng sắp hết" },
    { value: "Số lượng sắp hết", label: "Số lượng sắp hết" },
  ];

  // lọc theo filterType + searchText
  const kw = appliedExpirySearch.trim().toLowerCase();
  const filteredWarnings = warningVaccines.filter((v) => {
    const typeMatch = !filterType || v.warningType === filterType;
    const haystack = [ v.name,  v.manufacturer, v.batch, v.diseaseName, v.country ]
      .filter(Boolean)
      .map(String)
      .map(s => s.toLowerCase())
      .join(" ");
    const searchMatch = !kw || haystack.includes(kw);
    return typeMatch && searchMatch;
  });

  const expiryPaged = filteredWarnings.slice((pageExpiry - 1) * perPage, pageExpiry * perPage);

  useEffect(() => {
    const maxPage = Math.max(1, Math.ceil(filteredWarnings.length / perPage));
    if (pageExpiry > maxPage) setPageExpiry(maxPage);
  }, [filteredWarnings.length, pageExpiry]);

  useEffect(() => { setPageExpiry(1); }, [appliedExpirySearch, filterType]);

  useEffect(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const soon = new Date(today);
    soon.setDate(soon.getDate() + 30);
    const warnings = [];
    vaccines.forEach((v) => {
      const threshold = Number(v.low_stock_threshold ?? 20);
      (Array.isArray(v.lots) ? v.lots : []).forEach((lot) => {
        // 1) tôn trọng is_active
        if (lot.is_active === false) return;
        const qty = Number(lot.quantity_available ?? 0);
        // 2) parse date an toàn timezone
        const exp = lot.expiry_date ? new Date(`${lot.expiry_date}T00:00:00`) : null;
        const isOutOfStock = qty <= 0;
        const isLowStock = qty > 0 && qty <= threshold;   // qty=0 để riêng
        const isExpired = exp && exp < today;
        const isExpSoon = exp && exp >= today && exp <= soon;

        if (!(isOutOfStock || isLowStock || isExpired || isExpSoon)) return;

        let warningType = "";
        if (isExpired && isOutOfStock) warningType = "Hàng & Hạn đã hết";
        else if (isExpSoon && isLowStock) warningType = "Hàng & Hạn sắp hết";
        else if (isExpired) warningType = "Hết hạn";
        else if (isOutOfStock) warningType = "Hết hàng";
        else if (isExpSoon) warningType = "Hạn sử dụng sắp hết";
        else if (isLowStock) warningType = "Số lượng sắp hết";

        warnings.push({
          ...v,
          batch: lot.lot_number,
          expiry: lot.expiry_date,
          quantity: qty,
          warningType,
        });
      });
    });

    setWarningVaccines(warnings);
  }, [vaccines]);

  // Xuất excel
  const downloadBlob = (blob, filename) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const handleExport = async () => {
    try {
      // Nếu muốn export theo từ khóa hiện tại:
      const params = {};
      if (appliedSearch) {
        params.search = appliedSearch.trim();
      }

      const blob = await exportVaccinesExcel(params);
      downloadBlob(blob, "danh-sach-vac-xin.xlsx");
    } catch (err) {
      console.error(err);
      toast.error("Xuất Excel thất bại");
    }
  };

  const fmtDate = (d) => {
    if (!d || d === "-") return "-";
    const t = new Date(d);
    return isNaN(t.getTime()) ? d : t.toLocaleDateString("vi-VN");
  };

  const fmtMoney = (n) => Number(n ?? 0).toLocaleString("vi-VN");
  

  return (
    <div className="tw-p-6 tw-bg-red-50 tw-min-h-screen tw-pt-[150px]">
      {loading && (
        <div className="tw-mb-4 tw-inline-flex tw-items-center tw-gap-2 tw-text-blue-700 tw-bg-blue-50 tw-border tw-border-blue-100 tw-rounded-full tw-px-3 tw-py-1">
          <i className="fa-solid fa-spinner fa-spin"></i>
          <span>Đang tải dữ liệu…</span>
        </div>
      )}
      <div className="tw-flex tw-justify-center tw-items-center  tw-mb-10 ">
          <h1 className="tw-text-[32px] tw-pb-5 tw-ml-3 tw-font-bold tw-bg-gradient-to-r tw-from-orange-500 tw-via-yellow-500
            tw-to-green-500 tw-bg-clip-text tw-text-transparent">
              <i className="fa-solid fa-vial-virus"></i>
              <span className="tw-ml-5">Quản lý vắc xin</span>
          </h1>
      </div>
      {/* Tabs */}
      <div className="tw-flex tw-justify-start">
        <div className="tw-inline-flex tw-bg-white tw-rounded-full tw-border tw-border-white tw-overflow-hidden tw-space-x-2 tw-mb-8">
            <button  onClick={() => setActiveTab("manage")}
            className={`tw-py-3 tw-px-5 tw-font-medium tw-rounded-full transition ${
                activeTab === "manage"  ? "tw-bg-[#ee1968] tw-text-white"
                : "tw-bg-white tw-text-gray-600 tw-border tw-border-white hover:tw-bg-white" 
            }`} >
                Quản lý vắc xin
            </button>
            <button onClick={() => setActiveTab("expiry")}
              className={`tw-py-3 tw-px-5 tw-font-medium tw-rounded-full transition ${
                activeTab === "expiry" ? "tw-bg-[#ee1968] tw-text-white"
                  : "tw-bg-white tw-text-gray-600 tw-border tw-border-white hover:tw-bg-white"
              }`}>
              Cảnh báo hết hạn
            </button>
        </div>
      </div>


      {/* Tab qly vaccine */}
      {activeTab === "manage" && (
        <div>
            {warningVaccines.length > 0 && (
              <div className="tw-bg-yellow-100 tw-text-yellow-700 tw-px-4 tw-py-3 tw-rounded-lg tw-mb-10 tw-cursor-pointer hover:tw-bg-yellow-200"
                  onClick={() => setActiveTab("expiry")}>
                <i className="fa-solid fa-triangle-exclamation tw-mr-2"></i>
                 Có {warningVaccines.length} loại vắc xin sắp hết hạn – bấm để xem chi tiết
              </div>
            )}

            <div className="tw-flex tw-justify-between tw-items-center tw-mb-16 tw-gap-4">
                <div className="tw-flex tw-items-center tw-gap-2 tw-w-1/2">
                    <input type="text"  placeholder="Tìm kiếm theo tên hoặc nhà sản xuất..."
                     value={searchInput}  onChange={(e) => setSearchInput(e.target.value)}
                     onKeyDown={(e) => { if (e.key === "Enter") setAppliedSearch(searchInput.trim()); }}
                     className="tw-border tw-border-gray-300 tw-px-4 tw-py-2 tw-rounded-lg tw-shadow-sm tw-flex-1
                        focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-blue-300 focus:tw-border-blue-800" />
                    <button   onClick={() => setAppliedSearch(searchInput.trim())}
                        className="tw-bg-blue-600 tw-text-white tw-px-4 tw-py-2 tw-rounded-full tw-font-medium hover:tw-bg-blue-700 tw-shadow"  >
                        <i className="fa-solid fa-magnifying-glass tw-mr-2"></i>
                        Tìm kiếm
                    </button>
                </div>
                <div className="tw-flex tw-gap-3">                
                    <button  onClick={handleExport}
                        className="tw-bg-orange-600 tw-text-white tw-px-6 tw-py-2 tw-rounded-full tw-font-medium hover:tw-bg-orange-700 tw-shadow" >
                        Xuất Excel
                    </button>
                </div>
            </div>


            <div className="tw-bg-white tw-rounded-xl tw-shadow-md tw-overflow-x-auto tw-mb-[30px]">
              <table className="tw-w-full tw-table-auto tw-border-collapse tw-text-left tw-mb-4">
                  <thead className="tw-bg-[#c4fffc] tw-text-xl">
                    <tr>
                        <th className="tw-px-4 tw-py-4 tw-w-1/13">Tên vắc xin</th>
                        <th className="tw-px-4 tw-py-4 tw-w-1/13">Phòng bệnh</th>
                        <th className="tw-px-4 tw-py-4 tw-w-1/13">Số lượng</th>
                        <th className="tw-px-4 tw-py-4 tw-w-1/13">Đơn vị</th>
                        <th className="tw-px-4 tw-py-4 tw-w-1/13">Hạn sử dụng</th>
                        <th className="tw-px-4 tw-py-4 tw-w-1/13">Nhà sản xuất</th>
                        <th className="tw-px-4 tw-py-4 tw-w-1/13">Quốc gia</th>
                        <th className="tw-px-4 tw-py-4 tw-w-1/13">Số lô</th>
                        <th className="tw-px-4 tw-py-4 tw-w-1/12">Giá</th>
                        <th className="tw-px-4 tw-py-4 tw-w-1/12">Trạng thái</th>
                        <th className="tw-px-4 tw-py-4 tw-w-1/8 tw-text-center">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                  {currentData.map((v) => {
                      return (
                      <tr key={v.id} className="tw-border-b hover:tw-bg-pink-100 tw-text-xl">
                          <td className="tw-px-4 tw-py-2">{v.name}</td>
                          <td className="tw-px-4 tw-py-2">{v.diseaseName}</td>
                          <td className="tw-px-4 tw-py-2">{v.quantity}</td>
                          <td className="tw-px-4 tw-py-2">{v.unit}</td>
                          <td className="tw-px-4 tw-py-2">{fmtDate(v.expiry)}</td>
                          <td className="tw-px-4 tw-py-2">{v.manufacturer}</td>
                          <td className="tw-px-4 tw-py-2">{v.country}</td>
                          <td className="tw-px-4 tw-py-2"  title={(Array.isArray(v.lots) ? v.lots : [])
                            .map((l) => `${l.lot_number} • ${fmtDate(l.expiry_date)} • ${l.quantity_available}`)
                            .join("\n")} >
                            {v.batch}
                          </td>
                          <td className="tw-px-4 tw-py-2">{fmtMoney(v.price)}</td>
                          <td className="tw-px-4 tw-py-2">
                            {v.quantity === 0 ? (
                              <span className="tw-bg-red-100 tw-text-red-600 tw-px-3 tw-py-2 tw-rounded-full"> Hết hàng  </span>
                            ) : v.quantity <= 20 ? (
                              <span className="tw-bg-yellow-100 tw-text-yellow-700 tw-px-3 tw-py-2 tw-rounded-full">  Sắp hết </span>
                            ) : (
                              <span className="tw-bg-green-100 tw-text-green-600 tw-px-3 tw-py-2 tw-rounded-full"> Còn hàng  </span>
                            )}
                          </td>
                          <td className="tw-px-4 tw-py-2 tw-flex tw-gap-3 tw-justify-center tw-items-center tw-text-lg">
                              <button  onClick={() => {
                                  setCurrentVaccine({ ...v });
                                  setShowDetailModal(true);
                                }} className="tw-bg-blue-100 tw-text-blue-600 tw-text-lg tw-rounded-full tw-px-2 tw-py-2 tw-border tw-border-transparent hover:tw-border-blue-600"  >
                                <i className="fa-solid fa-eye"></i>
                                <span className="tw-ml-2">Xem</span>
                              </button>
                          </td>
                      </tr>
                      );
                  })}
                  </tbody>
              </table>

              {/* phân trang */}
              <Pagination
                page={pageManage}
                totalItems={filteredVaccines.length}
                perPage={perPage}
                onPageChange={setPageManage}
              />
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
            <ConfirmModal show={!!confirmAction} title="Xác nhận xóa"
              message={
                confirmAction && (
                  <>Bạn có chắc muốn xóa vắc xin “<b>{confirmAction.item.name}</b>” không?</>
                )
              } onCancel={() => setConfirmAction(null)}
              onConfirm={() => {
                setVaccines((prev) => prev.filter((v) => v.id !== confirmAction.item.id));
                setConfirmAction(null);
              }}
            />


        </div>
      )}

      {/* Tab cảnh báo */}
      {activeTab === "expiry" && (
        <div>
            {/* Thanh tìm kiếm + bộ lọc */}
            <div className="tw-flex tw-justify-between tw-items-center tw-mb-16 tw-gap-4">
              <div className="tw-flex tw-items-center tw-gap-2 tw-w-1/2">
                <input type="text" placeholder="Nhập từ khóa tìm kiếm..."  value={searchTextInput}
                  onChange={(e) => setSearchTextInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") setAppliedExpirySearch(searchTextInput.trim()); }}
                  className="tw-border tw-border-gray-300 tw-px-4 tw-py-2 tw-rounded-lg tw-shadow-sm tw-flex-1 focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-blue-300 focus:tw-border-blue-800" />
                <button onClick={() => setAppliedExpirySearch(searchTextInput.trim())}
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
                      setSearchTextInput("");
                      setAppliedExpirySearch("");
                  }} className="tw-bg-orange-500 tw-text-white tw-px-5 tw-py-2 tw-rounded-full tw-font-medium hover:tw-bg-orange-600 tw-shadow-sm" >
                  <i className="fa-solid fa-xmark tw-mr-1"></i> Xoá bộ lọc
                </button>
              </div>
            </div>

            {/* bảng danh sách cảnh báo */}
            <div className="tw-bg-white tw-rounded-xl tw-shadow-md tw-my-[30px]">
              {filteredWarnings.length === 0 ? (
                <div className="tw-text-center tw-text-red-500 tw-py-10"><i className="fa-solid fa-circle-exclamation tw-mr-3"></i>Không có cảnh báo nào</div>
              ) : (
                <table className="tw-w-full tw-table-auto tw-border-collapse tw-text-left tw-mb-4">                 
                    <thead className="tw-bg-purple-200 tw-text-xl">
                      <tr>
                        <th className="tw-px-4 tw-py-4 tw-w-1/13">Tên vắc xin</th>
                        <th className="tw-px-4 tw-py-4 tw-w-1/13">Phòng bệnh</th>
                        <th className="tw-px-4 tw-py-4 tw-w-1/13">Số lượng</th>
                        <th className="tw-px-4 tw-py-4 tw-w-1/13">Đơn vị</th>
                        <th className="tw-px-4 tw-py-4 tw-w-1/13">Hạn sử dụng</th>
                        <th className="tw-px-4 tw-py-4 tw-w-1/13">Nhà sản xuất</th>
                        <th className="tw-px-4 tw-py-4 tw-w-1/13">Quốc gia</th>
                        <th className="tw-px-4 tw-py-4 tw-w-1/12">Số lô</th>
                        <th className="tw-px-4 tw-py-4 tw-w-1/12">Giá</th>
                        <th className="tw-px-4 tw-py-4 tw-w-1/6">Cảnh báo</th>
                        <th className="tw-px-4 tw-py-4 tw-w-1/12">Trạng thái</th>
                        <th className="tw-px-4 tw-py-4 tw-w-1/13 tw-text-center">Thao tác</th>
                      </tr>
                    </thead>
                    <tbody className=" tw-text-xl">
                    {expiryPaged.map((v) => {
                        return (
                        <tr key={v.id} className="tw-border-b hover:tw-bg-pink-100 ">
                          <td className="tw-px-4 tw-py-2">{v.name}</td>
                          <td className="tw-px-4 tw-py-2">{v.diseaseName}</td>
                          <td className="tw-px-4 tw-py-2">{v.quantity}</td>
                          <td className="tw-px-4 tw-py-2">{v.unit}</td>
                          <td className="tw-px-4 tw-py-2">{fmtDate(v.expiry)}</td>
                          <td className="tw-px-4 tw-py-2">{v.manufacturer}</td>
                          <td className="tw-px-4 tw-py-2">{v.country}</td>
                          <td className="tw-px-4 tw-py-2"  title={(Array.isArray(v.lots) ? v.lots : [])
                            .map((l) => `${l.lot_number} • ${fmtDate(l.expiry_date)} • ${l.quantity_available}`)
                            .join("\n")} >
                            {v.batch}
                          </td>
                          <td className="tw-px-4 tw-py-2">{fmtMoney(v.price)}</td>
                          <td className="tw-px-4 tw-py-2">
                            {(() => {
                              const style = WARNING_STYLE[v.warningType] || {
                                bg: "tw-bg-gray-100",
                                text: "tw-text-gray-600",
                                icon: "fa-circle-info",
                              };
                              return (
                                <span className={`tw-inline-flex tw-items-center tw-gap-2 tw-px-3 tw-py-2 tw-rounded-full tw-font-semibold 
                                  ${style.bg} ${style.text}`}>
                                  <i className={`fa-solid ${style.icon}`}></i>
                                  {v.warningType}
                                </span>
                              );
                            })()}
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
                          <td className="tw-px-4 tw-py-2 tw-flex tw-gap-3 tw-justify-center tw-items-center tw-mt-4">
                            <button  onClick={() => {
                                setCurrentVaccine({ ...v });
                                setShowDetailModal(true);
                              }} className="tw-bg-blue-100 tw-text-blue-600 tw-text-lg tw-rounded-full tw-px-3 tw-py-2 tw-border tw-border-transparent hover:tw-border-blue-600"  >
                              <i className="fa-solid fa-eye"></i>
                              <span className="tw-ml-2">Xem</span>
                            </button>
                          </td>
                        </tr>
                        );
                    })}
                    </tbody>
                </table>
              )}

              {/* phân trang */}
              <Pagination
                page={pageExpiry}  totalItems={filteredWarnings.length}
                perPage={perPage} onPageChange={setPageExpiry}
              />

            </div>
            
            {/* Modal xác nhận xoá */}
            <ConfirmModal  show={!!confirmAction} title="Xác nhận xóa"
              message={ confirmAction && ( <> Bạn có chắc muốn xóa thông báo “ <b>{confirmAction.item.name}</b>” không? </>
                  )} onCancel={() => setConfirmAction(null)}
                  onConfirm={() => {
                    setVaccines((prev) =>
                      prev.filter((v) => v.id !== confirmAction.item.id)
                    );
                    setConfirmAction(null);
                  }} confirmText="Đồng ý" cancelText="Hủy"
            />
          
        </div>
      )}
      {/* Modal xem chi tiết */}
      {showDetailModal && currentVaccine && (
        <ViewExpiryVCModal show={showDetailModal}
          onClose={() => {
            setShowDetailModal(false);
            setCurrentVaccine(null);
          }} vaccine={currentVaccine}
        />
      )}
    </div>
    
  );
}


