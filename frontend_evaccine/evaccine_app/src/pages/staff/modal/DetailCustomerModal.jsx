// DetailCustomerModal.jsx
import React, { useState } from "react";

export default function DetailCustomerModal({
  show,
  customer,
  onClose,
  onConfirmAppointment,
  onAddAppointment,
  onRecordVaccine,
  activeTab,
  setActiveTab,
  setCustomers,
  setSelectedCustomer
}) {
  const [detailTab, setDetailTab] = useState("info");
  const [newAppointment, setNewAppointment] = useState({ date: "", vaccine: "", center: "" });
  const [newVaccineRecord, setNewVaccineRecord] = useState({ date: "", vaccine: "", batch: "", note: "" });

  if (!show || !customer) return null;

  // fallback các mảng nếu undefined
  const familyList = customer.family || [];
  const appointmentsList = customer.appointments || [];
  const historyList = customer.history || [];

  return (
    <div className="tw-fixed tw-inset-0 tw-flex tw-items-start tw-justify-center tw-pt-24 tw-bg-black/40">
      <div className="tw-bg-white tw-w-[900px] tw-rounded-xl tw-shadow-xl tw-overflow-hidden tw-mt-[150px]">
        <div className="tw-flex tw-justify-between tw-items-center tw-p-4 tw-border-b">
          <div>
            <h3 className="tw-text-2xl tw-font-semibold">Hồ sơ: {customer.name}</h3>
            <div className="tw-text-lg tw-text-gray-500">
              {customer.code} — {customer.center}
            </div>
          </div>
          <button onClick={onClose} className="tw-text-white tw-bg-red-500 hover:tw-bg-red-600 tw-rounded-full tw-px-3 tw-py-2">Đóng ✕</button>
        </div>

        <div className="tw-p-4 tw-grid tw-grid-cols-3 tw-gap-6">
          <div className="tw-col-span-1 tw-border-r tw-pr-4">
            <div className="tw-mb-4">
              <div className="tw-text-xl tw-text-gray-500">Thông tin cơ bản</div>
              <div className="tw-font-medium">{customer.name}</div>
              <div className="tw-text-lg tw-text-gray-600">{customer.phone} • {customer.email}</div>
              <div className="tw-text-lg tw-text-gray-600">{customer.address}</div>
            </div>

            <div className="tw-space-y-2">
              <button onClick={() => setDetailTab('info')} className={`tw-w-full tw-text-left tw-py-2 tw-rounded ${detailTab==='info' ? 'tw-bg-blue-50' : 'hover:tw-bg-gray-50'}`}>Thông tin</button>
              <button onClick={() => setDetailTab('family')} className={`tw-w-full tw-text-left tw-py-2 tw-rounded ${detailTab==='family' ? 'tw-bg-blue-50' : 'hover:tw-bg-gray-50'}`}>Gia đình</button>
              <button onClick={() => setDetailTab('appointments')} className={`tw-w-full tw-text-left tw-py-2 tw-rounded ${detailTab==='appointments' ? 'tw-bg-blue-50' : 'hover:tw-bg-gray-50'}`}>Lịch hẹn</button>
              <button onClick={() => setDetailTab('history')} className={`tw-w-full tw-text-left tw-py-2 tw-rounded ${detailTab==='history' ? 'tw-bg-blue-50' : 'hover:tw-bg-gray-50'}`}>Lịch sử tiêm</button>
              <button className="tw-bg-indigo-600 tw-text-white tw-px-4 tw-py-2 tw-rounded hover:tw-bg-indigo-500">In phiếu xác nhận</button>
            </div>
          </div>

          <div className="tw-col-span-2">
            {detailTab === 'info' && (
              <div className="tw-justify-center tw-items-center tw-px-20">
                <h4 className="tw-font-semibold tw-text-3xl tw-mb-4">Thông tin chi tiết</h4>
                <div className="tw-grid tw-grid-cols-2 tw-gap-3">
                  <div className="tw-text-xl tw-font-bold tw-text-blue-600">Mã khách hàng</div>
                  <div className="tw-font-medium">{customer.code}</div>
                  <div className="tw-text-xl tw-font-bold tw-text-blue-600">Họ tên</div>
                  <div className="tw-font-medium">{customer.name}</div>
                  <div className="tw-text-xl tw-font-bold tw-text-blue-600">SĐT</div>
                  <div>{customer.phone}</div>
                  <div className="tw-text-xl tw-font-bold tw-text-blue-600">Email</div>
                  <div>{customer.email}</div>
                  <div className="tw-text-xl tw-font-bold tw-text-blue-600">Cơ sở</div>
                  <div>{customer.center}</div>
                  <div className="tw-text-xl tw-font-bold tw-text-blue-600">Địa chỉ</div>
                  <div>{customer.address}</div>
                </div>
              </div>
            )}

            {detailTab === 'family' && (
              <div>
                <h4 className="tw-font-semibold tw-mb-2">Thành viên gia đình</h4>
                <div className="tw-space-y-3">
                  {familyList.map(f => (
                    <div key={f.id} className="tw-p-3 tw-border tw-rounded">
                      <div className="tw-font-medium">{f.name}</div>
                      <div className="tw-text-sm tw-text-gray-600">Ngày sinh: {f.dob} • Giới tính: {f.sex}</div>
                    </div>
                  ))}
                  <button className="tw-mt-2 tw-bg-green-600 tw-text-white tw-px-3 tw-py-2 tw-rounded" onClick={() => {
                    const newMember = { id: `f-${Date.now()}`, name: 'Thành viên mới', dob: '', sex: '' };
                    setCustomers(prev => prev.map(c => c.id === customer.id ? { ...c, family: [...familyList, newMember] } : c));
                    setSelectedCustomer(prev => ({ ...prev, family: [...familyList, newMember] }));
                  }}>Thêm thành viên</button>
                </div>
              </div>

              
            )}

            {detailTab === 'appointments' && (
              <div>
                <h4 className="tw-font-semibold tw-mb-2">Lịch hẹn</h4>
                {appointmentsList.map(a => (
                  <div key={a.id} className="tw-p-3 tw-border tw-rounded tw-flex tw-justify-between">
                    <div>
                      <div className="tw-font-medium">{a.vaccine} — {a.center}</div>
                      <div className="tw-text-sm tw-text-gray-600">{a.date} • Trạng thái: {a.status}</div>
                    </div>
                    <div className="tw-flex tw-gap-2">
                      {a.status === 'pending' && <button onClick={() => onConfirmAppointment(customer.id, a.id)} className="tw-bg-blue-600 tw-text-white tw-px-3 tw-py-1 tw-rounded">Xác nhận</button>}
                    </div>
                  </div>
                ))}

                <div className="tw-mt-4 tw-border-t pt-4">
                  <h5 className="tw-font-medium">Tạo lịch hẹn mới</h5>
                  <div className="tw-grid tw-grid-cols-3 tw-gap-2 tw-mt-2">
                    <input placeholder="Ngày/giờ" value={newAppointment.date} onChange={(e)=>setNewAppointment(s=>({...s,date:e.target.value}))} className="tw-border tw-px-2 tw-py-1 tw-rounded" />
                    <input placeholder="Vaccine" value={newAppointment.vaccine} onChange={(e)=>setNewAppointment(s=>({...s,vaccine:e.target.value}))} className="tw-border tw-px-2 tw-py-1 tw-rounded" />
                    <input placeholder="Cơ sở" value={newAppointment.center} onChange={(e)=>setNewAppointment(s=>({...s,center:e.target.value}))} className="tw-border tw-px-2 tw-py-1 tw-rounded" />
                  </div>
                  <div className="tw-mt-2">
                    <button onClick={()=> {
                      const appt={id:`ap-${Date.now()}`, ...newAppointment, status:'pending'};
                      onAddAppointment(customer.id, appt);
                      setNewAppointment({date:'', vaccine:'', center:''});
                    }} className="tw-bg-green-600 tw-text-white tw-px-3 tw-py-1 tw-rounded">Lưu lịch</button>
                  </div>
                </div>
              </div>
            )}

            {detailTab === 'history' && (
              <div>
                <h4 className="tw-font-semibold tw-mb-2">Lịch sử tiêm</h4>
                {historyList.map(h => (
                  <div key={h.id} className="tw-p-3 tw-border tw-rounded">
                    <div className="tw-font-medium">{h.vaccine} — {h.date}</div>
                    <div className="tw-text-sm tw-text-gray-600">Lô: {h.batch} • Ghi chú: {h.note}</div>
                  </div>
                ))}
                <div className="tw-mt-4 tw-border-t pt-4">
                  <h5 className="tw-font-medium">Ghi nhận mũi tiêm mới</h5>
                  <div className="tw-grid tw-grid-cols-4 tw-gap-2 tw-mt-2">
                    <input placeholder="Ngày" value={newVaccineRecord.date} onChange={(e)=>setNewVaccineRecord(s=>({...s,date:e.target.value}))} className="tw-border tw-px-2 tw-py-1 tw-rounded" />
                    <input placeholder="Vaccine" value={newVaccineRecord.vaccine} onChange={(e)=>setNewVaccineRecord(s=>({...s,vaccine:e.target.value}))} className="tw-border tw-px-2 tw-py-1 tw-rounded" />
                    <input placeholder="Số lô" value={newVaccineRecord.batch} onChange={(e)=>setNewVaccineRecord(s=>({...s,batch:e.target.value}))} className="tw-border tw-px-2 tw-py-1 tw-rounded" />
                    <input placeholder="Ghi chú" value={newVaccineRecord.note} onChange={(e)=>setNewVaccineRecord(s=>({...s,note:e.target.value}))} className="tw-border tw-px-2 tw-py-1 tw-rounded" />
                  </div>
                  <div className="tw-mt-2">
                    <button onClick={()=> {
                      const rec={id:`rec-${Date.now()}`, ...newVaccineRecord};
                      onRecordVaccine(customer.id, rec);
                      setNewVaccineRecord({date:'', vaccine:'', batch:'', note:''});
                    }} className="tw-bg-blue-600 tw-text-white tw-px-3 tw-py-1 tw-rounded">Ghi nhận</button>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}
