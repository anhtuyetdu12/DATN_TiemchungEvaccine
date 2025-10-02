import { useState } from "react";

export default function ViewCustomerDetailModal({ customer, onClose }) {
  const [activeTab, setActiveTab] = useState("info");

  if (!customer) return null; // Nếu chưa chọn khách thì không hiển thị modal

  return (
    <div className="tw-fixed tw-inset-0 tw-bg-black/50 tw-flex tw-items-center tw-justify-center tw-z-50">
      <div className="tw-bg-white tw-rounded-xl tw-shadow-lg tw-w-[800px] tw-max-h-[90vh] tw-overflow-y-auto tw-p-6">
        
        {/* Header */}
        <div className="tw-flex tw-justify-between tw-items-center tw-mb-4">
          <h2 className="tw-text-xl tw-font-bold">Chi tiết khách hàng</h2>
          <button 
            onClick={onClose} 
            className="tw-text-gray-500 hover:tw-text-red-500"
          >
            ✕
          </button>
        </div>

        {/* Tabs */}
        <div className="tw-flex tw-space-x-4 tw-border-b tw-mb-4">
          <button 
            onClick={() => setActiveTab("info")} 
            className={`tw-px-4 tw-py-2 ${activeTab==="info" ? "tw-border-b-2 tw-border-blue-600 tw-font-semibold" : "tw-text-gray-500"}`}
          >
            Thông tin
          </button>
          <button 
            onClick={() => setActiveTab("history")} 
            className={`tw-px-4 tw-py-2 ${activeTab==="history" ? "tw-border-b-2 tw-border-blue-600 tw-font-semibold" : "tw-text-gray-500"}`}
          >
            Lịch sử tiêm
          </button>
          <button 
            onClick={() => setActiveTab("appointments")} 
            className={`tw-px-4 tw-py-2 ${activeTab==="appointments" ? "tw-border-b-2 tw-border-blue-600 tw-font-semibold" : "tw-text-gray-500"}`}
          >
            Lịch hẹn
          </button>
        </div>

        {/* Tab content */}
        {activeTab === "info" && (
          <div className="tw-space-y-2">
            <p><b>Mã KH:</b> {customer.code}</p>
            <p><b>Họ tên:</b> {customer.name}</p>
            <p><b>Ngày sinh:</b> {customer.dob ? new Date(customer.dob).toLocaleDateString("vi-VN") : "-"}</p>
            <p><b>Điện thoại:</b> {customer.phone}</p>
            <p><b>Email:</b> {customer.email}</p>
            <p><b>Địa chỉ:</b> {customer.address}</p>
            <p><b>Quốc gia:</b> {customer.country}</p>
          </div>
        )}

        {activeTab === "history" && (
          <div className="tw-space-y-2">
            {customer.history?.length ? (
              customer.history.map((h) => (
                <p key={h.id}><b>{h.date}:</b> {h.vaccine} (Lô: {h.batch}) - {h.note}</p>
              ))
            ) : (
              <p className="tw-text-gray-500">Chưa có lịch sử tiêm</p>
            )}
          </div>
        )}

        {activeTab === "appointments" && (
          <div className="tw-space-y-2">
            {customer.appointments?.length ? (
              customer.appointments.map((a) => (
                <p key={a.id}><b>{new Date(a.date).toLocaleDateString("vi-VN")}</b> - {a.vaccine} tại {a.center}</p>
              ))
            ) : (
              <p className="tw-text-gray-500">Chưa có lịch hẹn</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
