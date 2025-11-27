import { useEffect, useMemo, useRef, useState } from "react";
import Dropdown from "../../../../components/Dropdown";
import { fetchCustomerAppointments } from "../../../../services/customerService";
import { toast } from "react-toastify";

export default function ViewCustomerDetailModal({ customer, onClose }) {
  const [activeTab, setActiveTab] = useState("info");
  const overlayRef = useRef(null);

  //click chọn thông tin cá nhân
  const [selectedMemberId, setSelectedMemberId] = useState(null);
  // tìm member đang chọn
  const selectedMember = useMemo(() => {
    const arr = customer?.members || [];
    return arr.find(m => String(m.id) === String(selectedMemberId)) || null;
  }, [customer, selectedMemberId]);

  // chuẩn hoá trường hiển thị bên trái
  const displayName   = selectedMember ? (selectedMember.name || selectedMember.full_name || "-") 
                                      : (customer?.name || "-");
  const displayDOB    = selectedMember ? (selectedMember.dob || selectedMember.date_of_birth || null)
                                      : (customer?.dob || customer?.date_of_birth || null);
  const displayPhone  = selectedMember?.phone ?? customer?.phone ?? "-";
  const displayEmail  = selectedMember?.email ?? customer?.email ?? "-";
  const displayRelation = selectedMember?.relation || null; // để gắn badge nếu muốn

  // initials nên lấy theo displayName
  const initials = useMemo(() => {
    const parts = (displayName || "").trim().split(/\s+/);
    return parts.slice(0, 2).map(p => p[0]).join("").toUpperCase() || "?";
  }, [displayName]);

  const dobText = displayDOB;
  const toVNStatus = (s) => STATUS_VN[(s || "").toLowerCase()] || "-";
  


  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose?.();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const safeDate = (d) => {
    try {
      if (!d) return "-";
      const dt = new Date(d);
      return Number.isNaN(dt.getTime()) ? String(d) : dt.toLocaleDateString("vi-VN");
    } catch {
      return String(d || "-");
    }
  };

  const STATUS_VN = {
    pending:   "Chờ xác nhận",
    confirmed: "Đã xác nhận",
    cancelled: "Đã hủy",
    completed: "Hoàn thành",
  };

  // danh sách lịch sử tiêm chủng
  const [historyMember, setHistoryMember] = useState("ALL");
  // số đếm 
  const historyFiltered = useMemo(() => {
    const list = customer?.history || [];
    if (historyMember === "ALL") return list;
    return list.filter(h => String(h.member_id) === String(historyMember));
  }, [customer, historyMember]); 

  //lọc dsach người tiêm
  const memberOptions = useMemo(() => {
    const base = [{ value: "ALL", label: "Tất cả thành viên" }];
    const items = (customer?.members || []).map(m => ({
      value: String(m.id),
      label: `${m.name || m.full_name || "-"}${m.relation ? ` (${m.relation})` : ""}`,
    }));
    return [...base, ...items];
  }, [customer]);

  // danh sách lịch hẹn 
  const [fullCustomer, setFullCustomer] = useState(customer); 
  const [apptMember, setApptMember] = useState("ALL");

  //lọc dsach thành viên lịch hẹn
  const apptFiltered = useMemo(() => {
    const list = fullCustomer?.appointments || [];
    if (apptMember === "ALL") return list;
    return list.filter(a => String(a.member_id) === String(apptMember));
  }, [fullCustomer?.appointments, apptMember]);
  
  useEffect(() => setFullCustomer(customer), [customer]);   

  useEffect(() => {
    if (activeTab !== "appointments" || !fullCustomer?.id) return;
    let isMounted = true; // tránh setState khi unmount

    (async () => {
      try {
        const data = await fetchCustomerAppointments(fullCustomer.id, {
          status: "pending,confirmed",
        });
        if (!isMounted) return;
        setFullCustomer(prev => ({ ...prev, appointments: data }));
        // nếu muốn: console.log("Loaded appointments", data);
      } catch (err) {
        toast.error("Không tải được lịch hẹn");
      }
    })();
    return () => { isMounted = false; };
  }, [activeTab, fullCustomer?.id]);

  const HISTORY_BADGE = {
    "Đã tiêm": "tw-bg-green-100 tw-text-green-700",
    "Chờ tiêm": "tw-bg-yellow-100 tw-text-yellow-700",
    "Trễ hẹn": "tw-bg-purple-100 tw-text-purple-700",
    "Chưa tiêm": "tw-bg-gray-100 tw-text-gray-700",
  };

  if (!customer) return null;

  return (
    <div ref={overlayRef} onClick={(e) => e.target === overlayRef.current && onClose?.()}
      className="tw-fixed tw-inset-0 tw-bg-black/50 tw-backdrop-blur-[2px] tw-flex tw-items-center tw-justify-center tw-z-50 tw-px-4 ">
      <div className="tw-bg-white tw-rounded-2xl tw-shadow-2xl tw-w-[920px] tw-max-w-[95vw] tw-h-[65vh] tw-ring-1 tw-ring-black/5 tw-flex tw-flex-col tw-mt-[100px]">
        
        {/* Header */}
        <div className="tw-flex tw-items-center tw-justify-between  tw-rounded-2xl tw-px-6 tw-pt-5 tw-pb-4 tw-border-b tw-border-gray-100 tw-bg-gradient-to-b tw-from-gray-50 tw-to-white">
          <div className="tw-flex tw-items-center tw-gap-4">
            <div className="tw-w-12 tw-h-12 tw-rounded-full tw-bg-yellow-500 tw-text-white tw-flex tw-items-center tw-justify-center tw-font-semibold">
              {initials}
            </div>
            <div>
              <p className="tw-text-lg md:tw-text-[12px] tw-font-bold tw-text-gray-900">Chi tiết khách hàng</p>
              <p className="tw-text-base tw-text-gray-500 tw-mt-0.5">
                Mã KH: <span className="tw-font-medium tw-text-gray-700">{customer.code || "-"}</span>
              </p>
            </div>
          </div>

          <button onClick={onClose} aria-label="Đóng"
            className="tw-inline-flex tw-items-center tw-justify-center tw-rounded-full tw-p-2 tw-text-gray-500 hover:tw-text-red-600 hover:tw-bg-red-50 tw-transition" >
            <i className="fa-solid fa-xmark tw-text-[20px] fa-fw" />
          </button>
        </div> 

        {/* Tabs (giữ sticky) */}
        <div className="tw-sticky tw-top-0 tw-z-10 tw-bg-white/90 tw-backdrop-blur tw-border-b tw-border-gray-100">
          <div className="tw-flex tw-items-center tw-justify-between tw-px-6 tw-py-2">
            <div className="tw-flex tw-gap-1 tw-overflow-auto">
              <button onClick={() => setActiveTab("info")}
                className={
                  "tw-inline-flex tw-items-center tw-gap-2 tw-rounded-full tw-px-4 tw-py-2 tw-text-base " +
                  (activeTab === "info" ? "tw-bg-blue-600 tw-text-white" : "tw-text-gray-600 hover:tw-bg-gray-100")
                }  >
                 <i className="fa-solid fa-user tw-text-[12px] fa-fw" />
                <span>Thông tin</span>
              </button>

              <button  onClick={() => setActiveTab("history")}
                className={
                  "tw-inline-flex tw-items-center tw-gap-2 tw-rounded-full tw-px-4 tw-py-2 tw-text-base " +
                  (activeTab === "history" ? "tw-bg-blue-600 tw-text-white" : "tw-text-gray-600 hover:tw-bg-gray-100")
                }>
                 <i className="fa-solid fa-clock-rotate-left tw-text-[12px] fa-fw" />
                <span>Lịch sử tiêm</span>
                <span className={
                  "tw-ml-1 tw-inline-flex tw-items-center tw-justify-center tw-text-[11px] tw-font-semibold tw-min-w-[1.5rem] tw-h-6 tw-rounded-full " +
                  (activeTab === "history" ? "tw-bg-white/20" : "tw-bg-gray-200 tw-text-gray-700")
                }>
                  {customer?.history?.length || 0}
                </span>
              </button>

              <button
                onClick={() => setActiveTab("appointments")}
                className={
                  "tw-inline-flex tw-items-center tw-gap-2 tw-rounded-full tw-px-4 tw-py-2 tw-text-base " +
                  (activeTab === "appointments" ? "tw-bg-blue-600 tw-text-white" : "tw-text-gray-600 hover:tw-bg-gray-100")
                } >
                <i className="fa-solid fa-clock tw-text-[12px] fa-fw" />
                <span>Lịch hẹn</span>
                <span className={
                  "tw-ml-1 tw-inline-flex tw-items-center tw-justify-center tw-text-[11px] tw-font-semibold tw-min-w-[1.5rem] tw-h-6 tw-rounded-full " +
                  (activeTab === "appointments" ? "tw-bg-white/20" : "tw-bg-gray-200 tw-text-gray-700")
                }>
                  {(fullCustomer?.appointments?.length ?? customer?.appointments?.length) || 0}
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* ⬇️ Content: phần này sẽ cuộn khi dài */}
        <div className="tw-flex-1 tw-min-h-0 tw-overflow-y-auto tw-p-6 tw-space-y-6 tw-scrollbar tw-scrollbar-thin tw-scrollbar-thumb-gray-300 tw-scrollbar-track-transparent
                    [&::-webkit-scrollbar]:tw-h-2 [&::-webkit-scrollbar]:tw-w-2 [&::-webkit-scrollbar-thumb]:tw-rounded-full
                    [&::-webkit-scrollbar-track]:tw-bg-gray-100 [&::-webkit-scrollbar-thumb]:tw-bg-gradient-to-b
                    [&::-webkit-scrollbar-thumb]:tw-from-cyan-400  [&::-webkit-scrollbar-thumb]:tw-to-blue-400 tw-overscroll-contain">
          {activeTab === "info" && (
            <div className="tw-grid md:tw-grid-cols-2 tw-gap-4">
              <div className="tw-rounded-2xl tw-border tw-border-gray-100 tw-shadow-sm tw-p-4 tw-bg-[#fbfbe1]">
                <h3 className="tw-text-xl tw-font-semibold tw-text-gray-700 tw-mb-3">Thông tin cá nhân</h3>
                <div className="tw-text-base">
                  <div className="tw-grid tw-grid-cols-3 tw-gap-3 tw-py-2 tw-border-b tw-border-gray-50">
                    <div className="tw-col-span-1 tw-flex tw-items-center tw-gap-2 tw-text-gray-500">
                      <i className="fa-solid fa-user tw-text-[12px] fa-fw" /> Họ tên
                    </div>
                    <div className="tw-col-span-2 tw-text-gray-900 tw-font-medium">
                      {displayName}
                      {displayRelation && (
                        <span className="tw-ml-2 tw-text-xs tw-text-pink-700 tw-bg-pink-50 tw-rounded-full tw-px-2 tw-py-0.5">
                          {displayRelation}
                        </span>
                      )}
                    </div>
                  </div>
                  {/* Mã KH */}
                  <div className="tw-grid tw-grid-cols-3 tw-gap-3 tw-py-2 tw-border-b tw-border-gray-50">
                    <div className="tw-col-span-1 tw-flex tw-items-center tw-gap-2 tw-text-gray-500">
                      <i className="fa-solid fa-rectangle-list tw-text-[12px] fa-fw "></i>Mã KH
                    </div>
                    <div className="tw-col-span-2 tw-text-gray-900 tw-font-medium">{customer.code || '-'}</div>
                  </div>
                  {/* Ngày sinh */}
                  <div className="tw-grid tw-grid-cols-3 tw-gap-3 tw-py-2 tw-border-b tw-border-gray-50">
                    <div className="tw-col-span-1 tw-flex tw-items-center tw-gap-2 tw-text-gray-500">
                      <i className="fa-solid fa-calendar-days tw-text-[12px] fa-fw" /> Ngày sinh
                    </div>
                    <div className="tw-col-span-2 tw-text-gray-900 tw-font-medium">
                      {dobText ? new Date(dobText).toLocaleDateString('vi-VN') : '-'}
                    </div>
                  </div>
                  {/* Điện thoại */}
                  <div className="tw-grid tw-grid-cols-3 tw-gap-3 tw-py-2 tw-border-b tw-border-gray-50">
                    <div className="tw-col-span-1 tw-flex tw-items-center tw-gap-2 tw-text-gray-500">
                      <i className="fa-solid fa-phone tw-text-[12px] fa-fw" /> Điện thoại
                    </div>
                    <div className="tw-col-span-2 tw-text-gray-900 tw-font-medium">{displayPhone || '-'}</div>
                  </div>
                  {/* Email */}
                  <div className="tw-grid tw-grid-cols-3 tw-gap-3 tw-py-2">
                    <div className="tw-col-span-1 tw-flex tw-items-center tw-gap-2 tw-text-gray-500">
                      <i className="fa-solid fa-envelope tw-text-[12px] fa-fw" /> Email
                    </div>
                    <div className="tw-col-span-2 tw-text-gray-900 tw-font-medium">{displayEmail || '-'}</div>
                  </div>
                </div>
              </div>

              <div className="tw-rounded-2xl tw-border tw-border-gray-100 tw-shadow-sm tw-p-4 tw-bg-[#fbfbe1]">
                <h3 className="tw-text-xl tw-font-semibold tw-text-gray-700 tw-mb-3">
                  Thành viên gia đình
                  <span className="tw-text-sm tw-text-pink-700 tw-bg-pink-50 tw-rounded-full tw-px-2 tw-py-0.5 tw-ml-2">
                    {customer.members?.length || 0}
                  </span>
                </h3>
                {selectedMember && (
                  <div className="tw-text-right tw-mb-3">
                    <button  onClick={() => setSelectedMemberId(null)}
                      className="tw-text-sm tw-text-blue-600 hover:tw-underline" >
                      <i className="fa-solid fa-left-long"></i> Xem hồ sơ chủ tài khoản
                    </button>
                  </div>
                )}
                {!customer.members?.length ? (
                  <div className="tw-text-red-500 tw-text-base tw-py-6 tw-text-center tw-border tw-border-dashed tw-rounded-lg">
                    Chưa có thành viên nào !
                  </div>
                ) : (
                  <div
                    className="  tw-max-h-[32vh] tw-overflow-y-auto tw-pr-1 tw-rounded-xl tw-scrollbar-thin tw-scrollbar-thumb-gray-300 tw-scrollbar-track-transparent
                      [&::-webkit-scrollbar]:tw-w-2 [&::-webkit-scrollbar-thumb]:tw-rounded-full
                      [&::-webkit-scrollbar-track]:tw-bg-gray-100 [&::-webkit-scrollbar-thumb]:tw-bg-gradient-to-b
                      [&::-webkit-scrollbar-thumb]:tw-from-cyan-400 [&::-webkit-scrollbar-thumb]:tw-to-blue-400 tw-overscroll-contain " >
                    <ul className="tw-grid tw-gap-3 tw-grid-cols-1 sm:tw-grid-cols-2">
                      {customer.members.map((m) => {
                        const isActive = String(selectedMemberId) === String(m.id);
                        return (
                          <li key={m.id} onClick={() => {
                              setSelectedMemberId(m.id);
                              setHistoryMember(String(m.id));
                              setApptMember(String(m.id));
                            }}  className={ "tw-border tw-rounded-xl tw-bg-white tw-p-3 tw-shadow-sm hover:tw-shadow-md tw-transition-shadow tw-cursor-pointer " +
                              (isActive ? "tw-ring-2 tw-ring-[#f7ee49] tw-border-[#f7d149] " : "") } >
                            <div className="tw-flex tw-items-start tw-justify-between tw-gap-3">
                              <div className="tw-min-w-0">
                                <div className="tw-font-semibold tw-text-gray-900 tw-truncate">
                                  {m.name || m.full_name || "-"}
                                  {m.nickname ? (
                                    <span className="tw-ml-1 tw-text-pink-500 tw-text-lg">({m.nickname})</span>
                                  ) : null}
                                </div>
                                <div className="tw-mt-1 tw-text-sm tw-text-gray-600 tw-flex tw-items-center tw-gap-3">
                                  <span className="tw-inline-flex tw-items-center tw-gap-1">
                                    <i className="fa-solid fa-calendar-days tw-text-[12px] tw-text-gray-400 fa-fw" />
                                    {m.dob ? safeDate(m.dob) : (m.date_of_birth ? safeDate(m.date_of_birth) : "-")}
                                  </span>
                                </div>
                              </div>

                              <span className="tw-shrink-0 tw-bg-pink-50 tw-text-pink-700 tw-px-2.5 tw-py-0.5 tw-rounded-full tw-text-xs tw-font-medium tw-max-w-[140px] tw-truncate">
                                {m.relation || "-"}
                              </span>
                            </div>
                          </li>
                        );
                      })}

                    </ul>
                  </div>
                )}
              </div>

            </div>
          )}

          {activeTab === "history" && (
            <div className="tw-rounded-2xl tw-border tw-border-gray-100 tw-shadow-sm tw-bg-[#e5fafa] tw-space-y-4 tw-h-full tw-overflow-y-auto  tw-scrollbar-hide tw-pr-2">
              <div className="tw-flex tw-items-center tw-justify-between tw-px-4 md:tw-px-6 tw-pt-4">
                <div className="tw-flex tw-items-center tw-gap-2 tw-text-gray-700">
                  <i className="fa-solid fa-clock-rotate-left tw-text-[12px] fa-fw" />
                  <h3 className="tw-font-semibold tw-text-lg">Lịch sử tiêm</h3>
                  <span className="tw-text-base tw-text-gray-500">({historyFiltered.length})</span>
                </div>

                {/* Lọc theo thành viên */}
                <div className="tw-flex tw-items-center tw-gap-4">
                  <i className="fa-solid fa-users tw-w-5 tw-h-5 tw-text-gray-500" />
                  <div className="tw-text-lg">
                    <Dropdown
                      label={null} value={String(historyMember)}  
                      options={memberOptions} className="tw-w-[160px]"
                      onChange={(val) => setHistoryMember(val)}  // val là "ALL" hoặc "{id}"
                    />
                  </div>
                </div>
              </div>

              {historyFiltered.length > 0 ? (
                <div className="tw-p-4 md:tw-p-6"> 
                  <div className="  tw-overflow-x-auto tw-max-h-[40vh] tw-overflow-y-auto tw-rounded-xl tw-pr-1  
                    tw-scrollbar-thin tw-scrollbar-thumb-gray-300 tw-scrollbar-track-transparent
                    [&::-webkit-scrollbar]:tw-h-2 [&::-webkit-scrollbar]:tw-w-2 [&::-webkit-scrollbar-thumb]:tw-rounded-full
                    [&::-webkit-scrollbar-track]:tw-bg-gray-100 [&::-webkit-scrollbar-thumb]:tw-bg-gradient-to-b
                    [&::-webkit-scrollbar-thumb]:tw-from-purple-400 [&::-webkit-scrollbar-thumb]:tw-to-pink-400 ">
                    <table className="tw-w-full tw-text-base tw-border-collapse ">
                      <thead>
                        <tr className="tw-text-left tw-text-blue-600 tw-text-lg">
                          <th className="tw-font-medium tw-px-3 tw-py-2 tw-border-b tw-border-gray-100">Người tiêm</th>
                          <th className="tw-font-medium tw-px-3 tw-py-2 tw-border-b tw-border-gray-100">Mối quan hệ</th>
                          <th className="tw-font-medium tw-px-3 tw-py-2 tw-border-b tw-border-gray-100">Ngày tiêm</th>
                          <th className="tw-font-medium tw-px-3 tw-py-2 tw-border-b tw-border-gray-100">Phòng bệnh</th>
                          <th className="tw-font-medium tw-px-3 tw-py-2 tw-border-b tw-border-gray-100">Vắc xin</th>
                          <th className="tw-font-medium tw-px-3 tw-py-2 tw-border-b tw-border-gray-100">Số mũi</th>
                          <th className="tw-font-medium tw-px-3 tw-py-2 tw-border-b tw-border-gray-100">Đơn giá</th>
                          <th className="tw-font-medium tw-px-3 tw-py-2 tw-border-b tw-border-gray-100">Trạng thái</th>
                          <th className="tw-font-medium tw-px-3 tw-py-2 tw-border-b tw-border-gray-100">Ghi chú (bệnh)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {historyFiltered.map(h => (
                          <tr key={h.id} className="hover:tw-bg-gray-50 tw-text-left">
                            <td className="tw-px-3 tw-py-2 tw-text-gray-900 tw-border-b tw-border-gray-50">
                              {h.member_name || "-"}
                            </td>
                            <td className="tw-px-3 tw-py-2 tw-text-gray-900 tw-border-b tw-border-gray-50">
                              {h.relation || "-"}
                            </td>
                            <td className="tw-px-3 tw-py-2 tw-text-gray-900 tw-border-b tw-border-gray-50">
                              {safeDate(h.date)}
                            </td>
                            <td className="tw-px-3 tw-py-2 tw-text-gray-900 tw-border-b tw-border-gray-50">
                              {h.disease || "-"}
                            </td>
                            <td className="tw-px-3 tw-py-2 tw-text-gray-900 tw-border-b tw-border-gray-50">
                              {h.vaccine || "-"}
                            </td>
                            <td className="tw-px-3 tw-py-2 tw-text-gray-900 tw-border-b tw-border-gray-50">
                              {h.dose ?? "-"}
                            </td>
                            <td className="tw-px-3 tw-py-2 tw-text-gray-900 tw-border-b tw-border-gray-50">
                              {typeof h.price === "number" ? h.price.toLocaleString("vi-VN") : "-"}
                            </td>
                           <td className="tw-px-3 tw-py-2 tw-text-gray-900 tw-border-b tw-border-gray-50">
                              <span className={`tw-inline-block tw-px-2.5 tw-py-1 tw-rounded-full tw-text-sm tw-font-semibold ${HISTORY_BADGE[h.status_label] || "tw-bg-green-100 tw-text-green-700"}`}>
                                {h.status_label || "Đã tiêm"}
                              </span>
                            </td>
                            <td className="tw-px-3 tw-py-2 tw-text-gray-900 tw-border-b tw-border-gray-50">
                              {h.note || "-"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="tw-px-6 tw-py-12 tw-text-center">
                  <div className="tw-inline-flex tw-items-center tw-justify-center tw-w-16 tw-h-16 tw-rounded-full tw-bg-gray-100 tw-text-gray-500 tw-mb-3">
                    <i className="fa-solid fa-clock-rotate-left tw-text-[12px] fa-fw" />
                  </div>
                  <div className="tw-text-gray-900 tw-font-medium">Chưa có lịch sử tiêm chủng</div>
                  <div className="tw-text-gray-500 tw-text-base tw-mt-1">Khi có mũi tiêm, thông tin sẽ hiển thị tại đây.</div>
                </div>
              )}
            </div>
          )}

          {activeTab === "appointments" && (
            <div className="tw-rounded-2xl tw-border tw-border-gray-100 tw-shadow-sm tw-bg-[#e4fbe1] tw-space-y-4 tw-h-full tw-overflow-y-auto  tw-scrollbar-hide tw-pr-2">
              <div className="tw-flex tw-items-center tw-justify-between tw-px-4 md:tw-px-6 tw-pt-4">
                <div className="tw-flex tw-items-center tw-gap-2 tw-text-gray-700">
                  <i className="fa-solid fa-clock tw-text-[12px] fa-fw" />
                  <h3 className="tw-font-semibold tw-text-lg">Lịch hẹn</h3>
                  <span className="tw-text-base tw-text-gray-500">
                    ({apptFiltered.length})
                  </span>
                </div>

                <div className="tw-flex tw-items-center tw-gap-4">
                  <i className="fa-solid fa-users tw-text-[12px] fa-fw tw-text-gray-500" />
                  <Dropdown
                    label={null} value={String(apptMember)}
                    options={memberOptions}  onChange={(val) => setApptMember(val)}
                    className="tw-w-[160px] tw-text-lg"
                  />
                </div>
              </div>

              {apptFiltered.length > 0 ? (
                <div className="tw-p-4">
                  <div className="tw-overflow-x-auto tw-rounded-xl tw-pr-1 tw-max-h-[40vh] tw-overflow-y-auto
                                  tw-scrollbar-thin tw-scrollbar-thumb-gray-300 tw-scrollbar-track-transparent
                                  [&::-webkit-scrollbar]:tw-h-2 [&::-webkit-scrollbar]:tw-w-2 [&::-webkit-scrollbar-thumb]:tw-rounded-full
                                  [&::-webkit-scrollbar-track]:tw-bg-gray-100 [&::-webkit-scrollbar-thumb]:tw-bg-gradient-to-b
                                [&::-webkit-scrollbar-thumb]:tw-from-cyan-400 [&::-webkit-scrollbar-thumb]:tw-to-blue-400">
                    <table className="tw-w-full tw-text-sm tw-border-collapse">
                      <thead>
                        <tr className="tw-text-left tw-text-green-700 tw-text-lg">
                          <th className="tw-font-medium tw-px-3 tw-py-2 tw-border-b tw-border-gray-100 tw-w-1/9">Người tiêm</th>
                          <th className="tw-font-medium tw-px-3 tw-py-2 tw-border-b tw-border-gray-100 tw-w-1/9">Mối quan hệ</th>
                          <th className="tw-font-medium tw-px-3 tw-py-2 tw-border-b tw-border-gray-100 tw-w-1/9">Ngày hẹn</th>
                          <th className="tw-font-medium tw-px-3 tw-py-2 tw-border-b tw-border-gray-100 tw-w-1/9">Phòng bệnh</th>
                          <th className="tw-font-medium tw-px-3 tw-py-2 tw-border-b tw-border-gray-100 tw-w-1/9">Vắc xin</th>
                          <th className="tw-font-medium tw-px-3 tw-py-2 tw-border-b tw-border-gray-100 tw-w-1/9">Mũi thứ</th>
                          <th className="tw-font-medium tw-px-3 tw-py-2 tw-border-b tw-border-gray-100 tw-w-1/9">Đơn giá</th>
                          <th className="tw-font-medium tw-px-3 tw-py-2 tw-border-b tw-border-gray-100 tw-w-1/8">Trạng thái</th>
                          <th className="tw-font-medium tw-px-3 tw-py-2 tw-border-b tw-border-gray-100 tw-w-1/9">Ghi chú</th>
                        </tr>
                      </thead>
                      <tbody>
                        {apptFiltered.map((a) => {
                          const fm = (fullCustomer.members || []).find(m => String(m.id) === String(a.member_id));
                          const memberName = a.member_name || fm?.full_name || fm?.name || "-";
                          const relation   = a.relation || fm?.relation || "-";

                          const statusMap = {
                            completed: "tw-bg-green-100 tw-text-green-700",
                            confirmed: "tw-bg-blue-100 tw-text-blue-700",
                            pending:   "tw-bg-yellow-100 tw-text-yellow-700",
                            cancelled: "tw-bg-red-100 tw-text-red-700",
                            overdue:   "tw-bg-purple-100 tw-text-purple-700",
                          };
                          const eff = a.effective_status || a.status;
                          const stClass = statusMap[eff] || "tw-bg-gray-100 tw-text-gray-700";

                          return (
                            <tr key={a.id} className="hover:tw-bg-gray-50 tw-text-base tw-text-left">
                              <td className="tw-px-3 tw-py-2 tw-border-b tw-border-gray-50">{memberName}</td>
                              <td className="tw-px-3 tw-py-2 tw-border-b tw-border-gray-50">{relation}</td>
                              <td className="tw-px-3 tw-py-2 tw-border-b tw-border-gray-50">{safeDate(a.date)}</td>
                              <td className="tw-px-3 tw-py-2 tw-border-b tw-border-gray-50">{a.disease || "-"}</td>
                              <td className="tw-px-3 tw-py-2 tw-border-b tw-border-gray-50">
                                {a.items_summary?.length
                                  ? a.items_summary.map(it => `${it.name} x${it.qty}`).join(", ")
                                  : (a.vaccine || "-")}
                              </td>
                              <td className="tw-px-3 tw-py-2 tw-border-b tw-border-gray-50">{a.dose ?? "-"}</td>
                              <td className="tw-px-3 tw-py-2 tw-border-b tw-border-gray-50">
                                {typeof a.price === "number" ? a.price.toLocaleString("vi-VN") : "-"}
                              </td>
                              <td className="tw-px-3 tw-py-2 tw-border-b tw-border-gray-50">
                                <span className={`tw-inline-block tw-px-2.5 tw-py-1 tw-rounded-full tw-text-sm tw-font-semibold ${stClass}`}>
                                  {a.status_label || toVNStatus(a.status)}
                                </span>
                              </td>
                              <td className="tw-px-3 tw-py-2 tw-border-b tw-border-gray-50">{a.note || a.notes || "-"}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="tw-px-6 tw-py-12 tw-text-center">
                  <div className="tw-inline-flex tw-items-center tw-justify-center tw-w-16 tw-h-16 tw-rounded-full tw-bg-gray-100 tw-text-gray-500 tw-mb-3">
                    <i className="fa-solid fa-calendar-days tw-text-[12px] tw-text-gray-400 fa-fw" />
                  </div>
                  <div className="tw-text-gray-900 tw-font-medium">Chưa có lịch hẹn</div>
                  <div className="tw-text-gray-500 tw-text-base tw-mt-1">Tạo lịch hẹn mới để theo dõi tiến độ.</div>
                </div>
              )}
            </div>
          )}


        </div>
      </div>
    </div>
  );
}
