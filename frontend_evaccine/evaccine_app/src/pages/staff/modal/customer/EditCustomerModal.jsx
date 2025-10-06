// DetailCustomerModal.jsx
import  { useState , useEffect} from "react";
import Dropdown from "../../../../components/Dropdown"
import QuantityPicker from "../../../../components/QuantityPicker"

export default function EditCustomerModal({
  show,
  customer,
  vaccines = [],
  onClose,
  center,
  onConfirmAppointment = () => {},  // fallback
  onCancelAppointment = () => {},
  onAddAppointment = () => {},      // fallback
  onRecordVaccine = () => {},
  setCustomers,
  setSelectedCustomer
}) {

  // State cho lịch hẹn mới
  const [newAppointment, setNewAppointment] = useState({
    date: '',
    vaccine: '',
    center: '',
    category: '',
    price: '',
    doses: 1,
    note: '',
    total: 0,
  });

  const [form, setForm] = useState({
    doses: 1
  });
  // const [form, setForm] = useState(customer || {});
  useEffect(() => {
    if (customer) {
      setForm(customer); // Khi customer thay đổi, cập nhật form
    }
  }, [customer]);
  const [newMember, setNewMember] = useState({});  // gia đình
  useEffect(() => {
    if (show) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }
    return () => { document.body.style.overflow = "auto"; };
  }, [show]);
  //tính tiền
  useEffect(() => {
    if (newAppointment.price && form.doses) {
      setNewAppointment(s => ({
        ...s,
        total: s.price * form.doses
      }));
    }
  }, [newAppointment.price, form.doses]);

  const [detailTab, setDetailTab] = useState("info");
  const [newVaccineRecord, setNewVaccineRecord] = useState({ date: "", vaccine: "", batch: "", note: "" });

  if (!show || !customer) return null;

  // fallback các mảng nếu undefined
  const familyList = customer.family || [];
  const appointmentsList = customer.appointments || [];
  const historyList = customer.history || [];

  // thông tin khách hàng 
  const genderOptions = [
    { label: "Nam", icon: "fa-solid fa-mars", color: "tw-text-teal-500" },
    { label: "Nữ", icon: "fa-solid fa-venus", color: "tw-text-pink-500" },
    { label: "Khác", icon: "fa-solid fa-venus-mars", color: "tw-text-orange-500" },
  ];

  if (!show || !customer) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = () => {
    setCustomers((prev) =>
      prev.map((c) => (c.id === customer.id ? { ...c, ...form } : c))
    );
    setSelectedCustomer((prev) => ({ ...prev, ...form }));
    onClose();
  };

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    const d = new Date(dateString);
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, "0");
    const minutes = String(d.getMinutes()).padStart(2, "0");
    return `${day}/${month}/${year} ${hours}:${minutes}`;
  };

  // danh sách mối quan hệ
  const relationships = [
    "Vợ", "Chồng",
    "Con trai", "Con gái",
    "Bố", "Mẹ",
    "Ông ngoại", "Bà ngoại",
    "Ông nội", "Bà nội",
    "Bạn bè", "Khác"
  ].map((r) => ({ value: r, label: r })); // chuẩn hóa để dùng trong Dropdown

  // thêm lịch hẹn mới (frontend only)
  const handleAddAppointment = () => {
    if (!newAppointment.date || !newAppointment.vaccineId) return;
    const appt = { id: `ap-${Date.now()}`, ...newAppointment, status: "pending" };
    const updated = [...appointmentsList, appt];
    setCustomers(prev => prev.map(c => c.id === customer.id ? { ...c, appointments: updated } : c));
    setSelectedCustomer(prev => ({ ...prev, appointments: updated }));
    setNewAppointment({
      date: "",
      vaccine: "",
      vaccineId: "",
      center: "",
      category: "",
      price: "",
      doses: 1,
      note: "",
      total: 0,
    });
    if (onAddAppointment) onAddAppointment(customer.id, appt);
  };

  // update trạng thái lịch (confirm/cancel)
  const updateAppointmentStatus = (customerId, apptId, status) => {
    setCustomers(prev => prev.map(c => {
      if (c.id !== customerId) return c;
      const appointments = (c.appointments || []).map(a => a.id === apptId ? { ...a, status } : a);
      return { ...c, appointments };
    }));
    setSelectedCustomer(prev => {
      if (!prev) return prev;
      const appointments = (prev.appointments || []).map(a => a.id === apptId ? { ...a, status } : a);
      return { ...prev, appointments };
    });
  };

  const handleConfirmAppointmentLocal = (customerId, apptId) => {
    updateAppointmentStatus(customerId, apptId, "confirmed");
    // gọi callback parent nếu cần
    try { onConfirmAppointment(customerId, apptId); } catch (e) { /* ignore */ }
  };

  const handleCancelAppointmentLocal = (customerId, apptId) => {
    updateAppointmentStatus(customerId, apptId, "cancelled");
    try { onCancelAppointment(customerId, apptId); } catch (e) { /* ignore */ }
  };

  
  // Tính số mũi đã tiêm
  const MAX_DAILY_DOSES = 5;  // số mũi tối đa tiêm trên ngày
  const getDosesTaken = (vaccineId) => {
    return historyList.filter(h => h.vaccineId === vaccineId).length;
  };

  return (
    <div className="tw-fixed tw-inset-0 tw-flex tw-items-start tw-justify-center tw-pt-24 tw-bg-black/40">
      <div className="tw-bg-white tw-w-[900px] tw-h-[430px] tw-rounded-xl tw-shadow-xl tw-flex tw-flex-col tw-mt-[100px]">
        <div className="tw-flex tw-justify-between tw-items-center tw-p-4 tw-border-b">
          <div>
            <h3 className="tw-text-2xl tw-font-semibold">Hồ sơ: {customer.name}</h3>
            <div className="tw-text-lg tw-text-gray-500">
              {customer.code} — {customer.address}
            </div>
          </div>
          <button onClick={onClose} className="tw-text-white tw-bg-red-500 hover:tw-bg-red-600 tw-rounded-full tw-px-3 tw-py-2">Đóng ✕</button>
        </div>

        <div className="tw-flex-1 tw-grid tw-grid-cols-3 tw-overflow-hidden ">
          <div className="tw-col-span-1 tw-border-r tw-p-4 tw-overflow-y-auto">
            <div className="tw-mb-4">
              <div className="tw-text-xl tw-text-gray-500">Thông tin cơ bản</div>
              <div className="tw-font-medium">{customer.name}</div>
              <div className="tw-text-lg tw-text-gray-600">{customer.phone} • {formatDate(customer.dob)}</div>
              <div className="tw-text-lg tw-text-gray-600">{customer.address}</div>
            </div>

            <div className="tw-space-y-4 tw-mt-20">
              <button onClick={() => setDetailTab('info')} className={`tw-w-full tw-text-left tw-py-2 tw-px-2 tw-rounded ${detailTab==='info' ? 'tw-bg-cyan-200' : 'hover:tw-bg-blue-50'}`}>Thông tin</button>
              <button onClick={() => setDetailTab('family')} className={`tw-w-full tw-text-left tw-py-2 tw-px-2 tw-rounded ${detailTab==='family' ? 'tw-bg-cyan-200' : 'hover:tw-bg-blue-50'}`}>Gia đình</button>
              <button onClick={() => setDetailTab('appointments')} className={`tw-w-full tw-text-left tw-py-2 tw-px-2 tw-rounded ${detailTab==='appointments' ? 'tw-bg-cyan-200' : 'hover:tw-bg-blue-50'}`}>Lịch hẹn</button>
              <button onClick={() => setDetailTab('history')} className={`tw-w-full tw-text-left tw-py-2 tw-px-2 tw-rounded ${detailTab==='history' ? 'tw-bg-cyan-200' : 'hover:tw-bg-blue-50'}`}>Lịch sử tiêm</button>
         
            </div>
              <button className="tw-bg-indigo-600 tw-text-white tw-px-4 tw-py-2 tw-rounded hover:tw-bg-indigo-500 tw-mt-10">In phiếu xác nhận</button> 
          </div>

          <div className="tw-col-span-2 tw-p-4 tw-overflow-y-auto">
            {detailTab === 'info' && (
              <div className="tw-space-y-4 tw-text-left">
                <h4 className="tw-font-semibold tw-text-3xl tw-text-center tw-text-blue-400">
                  <i className="fa-solid fa-circle-info tw-mr-3"></i>Thông tin cơ bản</h4>
                <div className="tw-grid tw-grid-cols-2 tw-gap-4">
                  <div>
                    <label className="tw-text-xl tw-font-medium">Mã khách hàng</label>
                    <div className="tw-border tw-rounded-lg tw-px-3 tw-py-2 tw-bg-gray-50">
                      {form.code}
                    </div>
                  </div>

                  <div>
                    <label className="tw-text-xl tw-font-medium">Họ tên</label>
                    <input name="name"  value={form.name || ""}  onChange={handleChange}
                      className="tw-w-full tw-border tw-rounded-lg tw-px-3 tw-py-2 
                              focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-blue-300 focus:tw-border-blue-800"
                    />
                  </div>
                </div>

                <div className="tw-grid tw-grid-cols-2 tw-gap-4">
                  <div>
                    <label className="tw-text-xl tw-font-medium">Số điện thoại</label>
                    <input name="phone"  value={form.phone || ""} onChange={handleChange}
                      className="tw-w-full tw-border tw-rounded-lg tw-px-3 tw-py-2 
                              focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-blue-300 focus:tw-border-blue-800"
                    />
                  </div>

                  <div>
                    <label className="tw-text-xl tw-font-medium">Email</label>
                    <input name="email" value={form.email || ""}  onChange={handleChange}
                      className="tw-w-full tw-border tw-rounded-lg tw-px-3 tw-py-2 
                              focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-blue-300 focus:tw-border-blue-800"
                    />
                  </div>
                </div>

                <div className="tw-grid tw-grid-cols-2 tw-gap-4">
                  <div>
                    <label className="tw-text-xl tw-font-medium">Địa chỉ</label>
                    <input name="address"  value={form.address || ""} onChange={handleChange}
                      className="tw-w-full tw-border tw-rounded-lg tw-px-3 tw-py-2 
                              focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-blue-300 focus:tw-border-blue-800"
                    />
                  </div>

                  <div>
                    <label className="tw-text-xl tw-font-medium">Giới tính</label>
                    <div className="tw-grid tw-grid-cols-3 tw-gap-3 mt-2">
                      {genderOptions.map((opt) => (
                        <button
                          key={opt.label}
                          type="button"
                          onClick={() =>
                            setForm((prev) => ({ ...prev, gender: opt.label }))
                          }
                          className={`tw-flex tw-items-center tw-justify-center tw-gap-2 tw-px-3 tw-py-2 
                            tw-rounded-lg tw-border tw-transition 
                            ${
                              form.gender === opt.label
                                ? "tw-border-cyan-500 tw-bg-cyan-50"
                                : "tw-border-gray-300 tw-bg-white"
                            }`} >
                          <i className={`${opt.icon} ${opt.color}`}></i>
                          <span>{opt.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
              </div>
              <div className="tw-grid tw-grid-cols-2 tw-gap-4">
                <div>
                  <label className="tw-text-xl tw-font-medium">Ngày sinh</label>
                  <input name="dob" type="date" max={new Date().toISOString().split("T")[0]} 
                    className="tw-w-full tw-border tw-rounded-lg tw-px-3 tw-py-2 focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-blue-300 focus:tw-border-blue-800"
                    value={form.dob}  onChange={handleChange}  />
                </div>
              </div>

                {/* Save button */}
                <div className="tw-flex tw-justify-end tw-gap-3 tw-mt-6 tw-py-3">
                  <button  type="button" onClick={onClose} 
                        className="tw-bg-red-600 tw-text-white tw-px-6 tw-py-2 tw-rounded-full hover:tw-bg-red-500" >
                    Hủy
                  </button>
                  <button type="button" onClick={handleSave}
                    className="tw-bg-green-600 tw-text-white tw-px-6 tw-py-2 tw-rounded-full hover:tw-bg-green-500">
                    Lưu thay đổi
                  </button>
                </div>
              </div>
            )}

            
            {detailTab === 'family' && (
              <div className="tw-h-full tw-overflow-y-auto  tw-scrollbar-hide tw-pr-2 tw-space-y-4">
                <h4 className="tw-font-semibold tw-mb-2 tw-text-3xl tw-text-blue-400">
                  <i className="fa-solid fa-house-chimney-window tw-mr-3 "></i>
                  Thành viên gia đình</h4>

                {/* Form thêm thành viên mới */}
                <div className="tw-border tw-p-5 tw-mb-4 tw-space-y-4 tw-bg-pink-100 tw-rounded-lg ">
                  <div className="tw-grid tw-grid-cols-2 tw-gap-4">
                    <input placeholder="Tên thân mật"  value={newMember?.nickname || ''}
                      onChange={(e) => setNewMember(s => ({ ...s, nickname: e.target.value }))}
                      className="tw-border-2 tw-rounded-lg tw-px-3 tw-py-2 
                            focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-blue-300 focus:tw-border-blue-800"
                    />
                    <input  placeholder="Họ và tên" value={newMember?.name || ''}
                      onChange={(e) => setNewMember(s => ({ ...s, name: e.target.value }))}
                      className="tw-border-2 tw-rounded-lg tw-px-3 tw-py-2 
                            focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-blue-300 focus:tw-border-blue-800"
                    />
                  
                    {/* Dropdown Mối quan hệ */}
                    <div>
                      <label className="tw-block tw-mb-3 tw-text-xl tw-font-medium ">Mối quan hệ</label>
                      <Dropdown className="tw-text-xl"  value={newMember.relation} 
                        options={relationships}
                        onChange={(val) => setNewMember(s => ({ ...s, relation: val }))}
                      />
                    </div>

                    {/* Nút chọn Giới tính */}
                    <div>
                      <label className="tw-text-xl tw-font-medium ">Giới tính</label>
                      <div className="tw-grid tw-grid-cols-3 tw-gap-3 ">
                        {genderOptions.map((opt) => (
                          <button key={opt.label} type="button"
                            onClick={() => setNewMember(s => ({ ...s, sex: opt.label }))}
                            className={`tw-flex tw-items-center tw-justify-center tw-gap-2 tw-px-3 tw-py-2 
                                        tw-rounded-lg tw-border-2 tw-transition 
                                        ${newMember?.sex === opt.label 
                                          ? "tw-border-cyan-500 tw-bg-cyan-50" 
                                          : "tw-border-gray-300 tw-bg-white"}`} >
                            <i className={`${opt.icon} ${opt.color}`}></i>
                            <span>{opt.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="tw-flex tw-flex-col">
                      <label className=" tw-text-xl tw-font-medium">Ngày sinh</label>
                      <input type="date" max={new Date().toISOString().split("T")[0]} 
                          placeholder="Ngày sinh" value={newMember?.dob || ''} 
                          onChange={(e)=>setNewMember(s=>({...s,dob:e.target.value}))} 
                          className="tw-border tw-rounded-lg tw-px-3 tw-py-2 tw-h-[35px] 
                                  focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-blue-300 focus:tw-border-blue-800" 
                      />
                    </div>

                  </div>

                  <button
                    className="tw-bg-green-600 tw-text-white tw-px-6 tw-py-2 tw-rounded-full tw-mt-4"
                    onClick={() => {
                      if (newMember?.name) {
                        const member = { id: `f-${Date.now()}`, ...newMember, expanded: false };
                        setCustomers(prev =>
                          prev.map(c =>
                            c.id === customer.id ? { ...c, family: [...familyList, member] } : c
                          )
                        );
                        setSelectedCustomer(prev => ({ ...prev, family: [...familyList, member] }));
                        setNewMember({}); // reset form
                      }
                    }} >
                    Thêm thành viên mới
                  </button>
                </div>

                {/* Danh sách thành viên */}
                <div className="tw-space-y-4">
                  {familyList
                    .filter(f => f && (f.name || f.relation || f.dob))
                    .map(f => (
                      <div key={f.id} className="tw-border tw-rounded tw-p-2">
                        <div className="tw-flex tw-justify-between tw-items-center ">
                          {/* Thông tin + toggle */}
                          <div className="tw-flex-1 tw-cursor-pointer tw-text-left tw-pl-10 tw-text-blue-600"
                            onClick={() => {
                              const updated = familyList.map(m =>
                                m.id === f.id ? { ...m, expanded: !m.expanded } : m
                              );
                              setCustomers(prev =>
                                prev.map(c =>
                                  c.id === customer.id ? { ...c, family: updated } : c
                                )
                              );
                              setSelectedCustomer(prev => ({ ...prev, family: updated }));
                            }} >
                            {f.name} - {f.relation} - {formatDate(f.dob)}
                          </div>

                          {/* Nút xóa */}
                          <button  onClick={(e) => {
                              e.stopPropagation(); // ngăn không cho toggle expand
                              const updated = familyList.filter(m => m.id !== f.id);
                              setCustomers(prev =>
                                prev.map(c => c.id === customer.id ? { ...c, family: updated } : c )
                              );
                              setSelectedCustomer(prev => ({ ...prev, family: updated }));
                            }}
                            className="tw-text-red-500 hover:tw-text-red-700 tw-ml-3"
                            title="Xóa thành viên" >
                            <i className="fa-solid fa-trash"></i>
                          </button>

                          {/* Icon expand */}
                          <div className="tw-ml-3 tw-cursor-pointer"
                            onClick={() => {
                              const updated = familyList.map(m => m.id === f.id ? { ...m, expanded: !m.expanded } : m );
                              setCustomers(prev =>
                                prev.map(c =>
                                  c.id === customer.id ? { ...c, family: updated } : c
                                )
                              );
                              setSelectedCustomer(prev => ({ ...prev, family: updated }));
                            }} >
                            {f.expanded ? (
                              <i className="fa-solid fa-angles-up  tw-text-blue-500"></i>
                            ) : (
                              <i className="fa-solid fa-angles-down tw-text-blue-500"></i>
                            )}
                          </div>
                        </div>

                        {f.expanded && (
                          <div className="tw-mt-4 tw-space-y-2 tw-space-x-[180px]">
                            <div className="tw-flex tw-justify-start ">
                              <div className="tw-flex tw-items-center tw-gap-[15px] tw-ml-[180px]">
                                <span className="tw-w-[120px] tw-font-medium tw-text-left">Tên thân mật:</span>
                                <span className="tw-text-left">{f.nickname}</span>
                              </div>
                            </div>
                            <div className="tw-flex tw-justify-start">
                              <div className="tw-flex tw-items-center tw-gap-[15px]">
                                <span className="tw-w-[120px] tw-font-medium tw-text-left">Họ và tên:</span>
                                <span className="tw-text-left">{f.name}</span>
                              </div>
                            </div>
                            <div className="tw-flex tw-justify-start">
                              <div className="tw-flex tw-items-center tw-gap-[15px]">
                                <span className="tw-w-[120px] tw-font-medium tw-text-left">Ngày sinh:</span>
                                <span className="tw-text-left">{formatDate(f.dob)}</span>
                              </div>
                            </div>
                            <div className="tw-flex tw-justify-start">
                              <div className="tw-flex tw-items-center tw-gap-[15px]">
                                <span className="tw-w-[120px] tw-font-medium tw-text-left">Giới tính:</span>
                                <span className="tw-text-left">{f.sex}</span>
                              </div>
                            </div>
                            <div className="tw-flex tw-justify-start">
                              <div className="tw-flex tw-items-center tw-gap-[15px]">
                                <span className="tw-w-[120px] tw-font-medium tw-text-left">Mối quan hệ:</span>
                                <span className="tw-text-left">{f.relation}</span>
                              </div>
                            </div>
                          </div>
                        )}


                      </div>
                    ))}
                </div>

              </div>
            )}


            {detailTab === 'appointments' && (
              <div className="tw-space-y-6">
                <h4 className="tw-font-semibold tw-text-3xl  tw-text-blue-400">
                  <i className="fa-solid fa-calendar-week  tw-mr-3"></i> Lịch hẹn</h4>
                <div className="tw-space-y-4">

                 {/* form tạo lịch hẹn */}
                <div className="tw-border-t tw-pt-5">
                  <h5 className="tw-font-semibold tw-text-2xl tw-mb-6 tw-text-green-600 flex items-center">
                    <i className="fa-solid fa-calendar-plus tw-mr-3"></i>Tạo lịch hẹn mới
                  </h5>

                  <div className="tw-grid md:tw-grid-cols-2 lg:tw-grid-cols-3 tw-gap-6">
                    <div className="tw-flex tw-flex-col">
                      <label className="tw-text-xl tw-text-left tw-font-medium tw-mb-2">Ngày/Giờ</label>
                      <input  type="datetime-local" min={new Date().toISOString().slice(0,16)}
                        value={newAppointment.date}
                        onChange={(e)=>setNewAppointment(s=>({...s,date:e.target.value}))} 
                        className="tw-border tw-rounded-lg tw-px-3 tw-py-2 focus:tw-outline-none 
                                  focus:tw-ring-2 focus:tw-ring-blue-300 focus:tw-border-blue-800" 
                      />
                    </div>

                    <div className="tw-flex tw-flex-col">
                      <label className="tw-text-xl tw-text-left tw-font-medium tw-mb-2">Loại Vaccine</label>
                      <Dropdown value={newAppointment.vaccine}
                        options={vaccines.map(v => ({
                          value: v.id,
                          label: `${v.name} (${v.price?.toLocaleString()} đ)`
                        }))} onChange={(val) => {
                          const selected = vaccines.find(v => v.id === val);
                          setNewAppointment(s => ({
                            ...s,
                            vaccineId: selected?.id,
                            vaccine: selected?.name || "",
                            price: selected?.price || "",
                            category: selected?.category || ""
                          }));
                        }}
                      />
                    </div>

                    <div className="tw-flex tw-flex-col">
                      <label className="tw-text-xl tw-text-left tw-font-medium tw-mb-2">Phân loại</label>
                      <Dropdown
                        value={newAppointment.category}
                        options={[
                          { value: "adult", label: "Người lớn" },
                          { value: "child", label: "Trẻ em" },
                          { value: "pregnant", label: "Phụ nữ mang thai" },
                          { value: "other", label: "Khác" }
                        ]}
                        onChange={(val) => setNewAppointment(s => ({ ...s, category: val }))}
                      />
                    </div>

                    <div className="tw-flex tw-flex-col">
                      <label className="tw-text-xl tw-text-left tw-font-medium tw-mb-2">Đơn giá</label>
                      <input   type="text" readOnly   placeholder="VNĐ" 
                        value={newAppointment.price || ""} 
                        onChange={(e)=>setNewAppointment(s=>({...s,price:e.target.value}))} 
                        className="tw-border tw-rounded-lg tw-px-3 tw-py-2 focus:tw-outline-none 
                                  focus:tw-ring-2 focus:tw-ring-blue-300 focus:tw-border-blue-800" 
                      />
                    </div>

                    <div className="tw-flex tw-flex-col">
                      <label className="tw-text-xl tw-font-medium">Số mũi tiêm</label>
                      <QuantityPicker
                          value={newAppointment.doses}
                          max={
                            newAppointment.vaccineId
                              ? Math.min(
                                  vaccines.find(v => v.id === newAppointment.vaccineId)?.protocolDoses -
                                    getDosesTaken(newAppointment.vaccineId),
                                  MAX_DAILY_DOSES
                                )
                              : MAX_DAILY_DOSES
                          }
                          onChange={(val) =>
                            setNewAppointment(prev => ({
                              ...prev,
                              doses: val,
                              total: prev.price * val
                            }))
                          }
                        />

                        {/* Thông báo số mũi còn lại */}
                        {newAppointment.vaccineId && (() => {
                          const selected = vaccines.find(v => v.id === newAppointment.vaccineId);
                          if (!selected) return null;
                          const taken = getDosesTaken(selected.id);
                          if (taken >= selected.protocolDoses) {
                            return (
                              <p className="tw-text-sm tw-text-red-600 tw-mt-1">
                                Đã tiêm đủ phác đồ cho {selected.name}
                              </p>
                            );
                          }
                          return (
                            <p className="tw-text-sm tw-text-gray-500 tw-mt-1">
                              Đã tiêm {taken}/{selected.protocolDoses} mũi. 
                              Còn thiếu {selected.protocolDoses - taken} mũi.
                            </p>
                          );
                        })()}
                    </div>
                    <div className="tw-flex tw-flex-col">
                      <label className="tw-text-xl tw-text-left tw-font-medium tw-mb-2">Thành tiền</label>
                      <input
                        type="text" placeholder="VNĐ"    readOnly
                        value={newAppointment.total ? `${newAppointment.total.toLocaleString()} VNĐ` : ""}
                        className="tw-border tw-rounded-lg tw-px-3 tw-py-2 bg-gray-100 tw-font-semibold focus:tw-outline-none 
                                  focus:tw-ring-2 focus:tw-ring-blue-300 focus:tw-border-blue-800"
                      />
                    </div>

                    <div className="tw-flex tw-flex-col lg:tw-col-span-2">
                      <label className="tw-text-xl tw-text-left tw-font-medium tw-mb-2">Ghi chú (Bệnh nền)</label>
                      <textarea 
                        placeholder="Ví dụ: Tiểu đường, tim mạch..." 
                        value={newAppointment.note || ""} 
                        onChange={(e)=>setNewAppointment(s=>({...s,note:e.target.value}))} 
                        className="tw-border tw-rounded-lg tw-px-3 tw-py-2 tw-min-h-[80px] focus:tw-outline-none 
                                  focus:tw-ring-2 focus:tw-ring-blue-300 focus:tw-border-blue-800"
                      />
                    </div>
                  </div>

                  <div className="tw-mt-6">
                  <button   onClick={handleAddAppointment} className="tw-bg-green-600 hover:tw-bg-green-500 tw-text-white tw-px-6 tw-py-3 tw-rounded-full tw-shadow-md tw-text-xl" >
                        💾 Lưu lịch hẹn
                    </button>

                  </div>
                </div>

                {/* danh sách lịch hẹn */}
                <div className="tw-max-h-[300px] tw-overflow-y-auto tw-pr-2 tw-space-y-4 tw-mb-6 tw-mt-8 tw-border-t tw-pt-6">
                  {appointmentsList.length > 0 ? (
                    <div className="tw-space-y-4">
                      {appointmentsList.map(a => (
                        <div key={a.id} className="tw-p-4 tw-border tw-rounded-xl tw-bg-yellow-100 tw-shadow-sm hover:tw-shadow-md tw-transition">
                          <div className="tw-flex tw-justify-between tw-items-start">
                            <div>
                              <div className="tw-font-semibold tw-text-lg tw-text-gray-800">
                                {a.vaccine} <span className="tw-text-gray-400"> — {a.center}</span>
                              </div>
                              <div className="tw-text-sm tw-text-gray-600 tw-mt-1">
                                {formatDate(a.date)}
                              </div>

                              <span className={`tw-inline-block tw-mt-2 tw-text-base tw-font-semibold tw-px-2 tw-py-1 tw-rounded
                                ${a.status === 'pending' ? 'tw-bg-orange-100 tw-text-orange-700' :
                                  a.status === 'confirmed' ? 'tw-bg-green-100 tw-text-green-700' :
                                  a.status === 'cancelled' ? 'tw-bg-red-100 tw-text-red-700' :
                                  a.status === 'done' ? 'tw-bg-blue-100 tw-text-blue-600' :
      '                         tw-bg-gray-100 tw-text-gray-600'}`}>
                                {a.status === 'pending' ? 'Chờ xác nhận' :
                                  a.status === 'confirmed' ? 'Đã xác nhận' :
                                  a.status === 'cancelled' ? 'Đã hủy'   : 
                                  a.status === 'done' ?  'Thành công': a.status}
                              </span>
                            </div>

                            {/* action buttons */}
                            <div className="tw-flex tw-gap-2">
                              {a.status === 'pending' && (
                                <>
                                  <button  onClick={() => handleConfirmAppointmentLocal(customer.id, a.id)}
                                    className="tw-bg-blue-600 hover:tw-bg-blue-700 tw-text-white tw-text-sm tw-px-4 tw-py-2 tw-rounded-lg tw-shadow" >
                                    Xác nhận
                                  </button>

                                  <button  onClick={() => handleCancelAppointmentLocal(customer.id, a.id)}
                                    className="tw-bg-red-600 hover:tw-bg-red-700 tw-text-white tw-text-sm tw-px-4 tw-py-2 tw-rounded-lg tw-shadow" >
                                    Hủy
                                  </button>
                                </>
                              )}

                              {a.status === 'confirmed' && (
                                <button onClick={() => handleCancelAppointmentLocal(customer.id, a.id)}
                                  className="tw-bg-red-600 hover:tw-bg-red-700 tw-text-white tw-text-sm tw-px-4 tw-py-2 tw-rounded-lg tw-shadow" >
                                  Hủy
                                </button>
                              )}
                              {/* nếu đã cancelled: không hiện nút */}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="tw-text-center tw-text-red-500 tw-font-medium tw-py-4 tw-italic">Chưa có lịch hẹn nào</p>                   
                  )}
                </div>


                 

                  
                </div>

              </div>
            )}
            
            


           {detailTab === 'history' && (
            <div className="tw-space-y-6">
              {/* Tiêu đề */}
              <h4 className="tw-font-bold tw-text-3xl tw-text-blue-400 tw-flex tw-items-center tw-justify-center tw-gap-2 tw-text-center">
                <i className="fa-solid fa-syringe"></i>
                Lịch sử tiêm
              </h4>

              {/* Form thêm mũi tiêm mới */}
              <div className="tw-border-t tw-pt-5">
                <h5 className="tw-font-semibold tw-text-2xl tw-mb-3 tw-text-blue-600">
                  <i className="fa-solid fa-plus"></i> Ghi nhận mũi tiêm mới
                </h5>

                <div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-3 tw-gap-3">
                  
                  {/* Ngày tiêm */}
                  <div className="tw-flex tw-flex-col">
                    <label className="tw-text-xl tw-text-left tw-font-medium tw-mb-2">Ngày tiêm</label>
                    <input type="date" max={new Date().toISOString().split("T")[0]} 
                      value={newVaccineRecord.date}
                      onChange={(e)=>setNewVaccineRecord(s=>({...s,date:e.target.value}))}
                      className="tw-border tw-rounded-lg tw-px-3 tw-py-2 tw-h-[35px]
                                focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-blue-300 focus:tw-border-blue-800" 
                    />
                  </div>

                  {/* Tên vaccine */}
                  <div className="tw-flex tw-flex-col">
                    <label className="tw-text-xl tw-text-left tw-font-medium tw-mb-2">Tên Vaccine</label>
                    <input 
                      value={newVaccineRecord.vaccine} 
                      onChange={(e)=>setNewVaccineRecord(s=>({...s,vaccine:e.target.value}))} 
                      className="tw-border tw-px-3 tw-py-2 tw-rounded-lg 
                                focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-blue-300 focus:tw-border-blue-800" 
                    />
                  </div>

                  {/* Cơ sở tiêm chủng */}
                  <div className="tw-flex tw-flex-col">
                    <label className="tw-text-xl tw-text-left tw-font-medium tw-mb-2">Cơ sở tiêm chủng</label>
                    <input 
                      value={newVaccineRecord.place} 
                      onChange={(e)=>setNewVaccineRecord(s=>({...s,place:e.target.value}))} 
                      className="tw-border tw-px-3 tw-py-2 tw-rounded-lg 
                                focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-blue-300 focus:tw-border-blue-800" 
                    />
                  </div>

                  {/* Số mũi tiêm */}
                  <div className="tw-flex tw-flex-col">
                    <label className="tw-text-xl tw-text-left tw-font-medium tw-mb-2">Số mũi tiêm</label>
                    <Dropdown  
                      value={newVaccineRecord.dose} 
                      onChange={(val)=>setNewVaccineRecord(s=>({...s,dose:val}))}
                      options={[
                        { value: "1", label: "Mũi 1" },
                        { value: "2", label: "Mũi 2" },
                        { value: "3", label: "Mũi 3" },
                        { value: "4", label: "Mũi 4" },
                        { value: "5", label: "Mũi 5" }
                      ]}
                      className="tw-col-span-1"
                    />
                  </div>
                  {/* Ghi chú */}
                  <div className="tw-flex tw-flex-col lg:tw-col-span-2">
                    <label className="tw-text-xl tw-text-left tw-font-medium tw-mb-2">Ghi chú (Bệnh nền)</label>
                    <textarea 
                      placeholder="Ví dụ: Tiểu đường, tim mạch..." 
                      value={newVaccineRecord.note || ""} 
                      onChange={(e)=>setNewVaccineRecord(s=>({...s,note:e.target.value}))} 
                      className="tw-border tw-rounded-lg tw-px-3 tw-py-2 tw-h-[40px] tw-resize-none focus:tw-outline-none 
                                focus:tw-ring-2 focus:tw-ring-blue-300 focus:tw-border-blue-800"
                    />
                  </div>
                </div>

                {/* Nút ghi nhận */}
                <div className="tw-mt-4">
                  <button  
                      onClick={()=>{
                       const rec = { 
                          id:`rec-${Date.now()}`, 
                          ...newVaccineRecord,
                          place: newVaccineRecord.place || center?.name || "Trung tâm tiêm chủng Evaccine" 
                        };


                        // 1. Gọi callback để hệ thống (parent) ghi nhận
                        onRecordVaccine(customer.id, rec);

                        // 2. Cập nhật local state để hiển thị ngay
                        setCustomers(prev => prev.map(c =>
                          c.id === customer.id
                            ? { ...c, history: [rec, ...(c.history || [])] } // prepend vào đầu
                            : c
                        ));
                        setSelectedCustomer(prev => ({
                          ...prev,
                          history: [rec, ...(prev.history || [])]
                        }));

                        // 3. Reset form
                        setNewVaccineRecord({date:'', vaccine:'', place:'', dose:'', batch:'', note:''});
                      }} 
                      className="tw-bg-blue-600 hover:tw-bg-blue-700 tw-text-white tw-font-medium tw-px-6 tw-py-2 tw-rounded-full tw-shadow" 
                    >
                      <i className="fa-solid fa-save tw-mr-2"></i>Ghi nhận
                    </button>

                </div>
              </div>


              {/* Danh sách lịch sử */}
              <div className="tw-max-h-[300px] tw-overflow-y-auto tw-space-y-3 tw-pr-2 tw-mt-8 tw-border-t tw-pt-6">
                {historyList.length === 0 ? (
                  <div className="tw-text-center tw-text-red-500 tw-font-medium tw-py-4 tw-italic">
                    Chưa ghi nhận danh sách lịch sử tiêm chủng
                  </div>
                ) : (
                  historyList.map(h => (
                    <div
                      key={h.id}
                      className="tw-bg-cyan-50 tw-shadow-md tw-rounded-xl tw-p-4 tw-flex tw-justify-between tw-items-center hover:tw-shadow-lg tw-transition"
                    >
                      <div>
                        <div className="tw-font-semibold tw-text-gray-800">
                          {h.vaccine} 
                          <span className="tw-text-lg tw-text-gray-500"> ({h.date})</span>
                        </div>
                        <div className="tw-text-base tw-text-gray-600 tw-mt-1">
                          <span className="tw-inline-block tw-bg-green-100 tw-px-3 tw-py-1 tw-rounded-full tw-mr-2">
                            🏥 {h.place || "Trung tâm tiêm chủng Evaccine"}
                          </span>
                        </div>
                        <div className="tw-text-base tw-text-gray-600 mt-1">
                          <span className="tw-inline-block tw-bg-yellow-100 tw-px-3 tw-py-1 tw-rounded-full tw-mr-2">
                            Lô: {h.batch}
                          </span>
                          <span className="tw-text-gray-500 tw-text-base">
                            📝 {h.note || "Không có ghi chú"}
                          </span>
                        </div>
                      </div>
                      <div className="tw-text-green-500 tw-text-2xl">
                        <i className="fa-solid fa-check-circle"></i>
                      </div>
                    </div>
                  ))
                )}
              </div>



              
            </div>
          )}


          </div>
        </div>
      </div>
    </div>
  );
}
