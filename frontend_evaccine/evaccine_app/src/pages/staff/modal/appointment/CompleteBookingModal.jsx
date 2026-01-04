import { useEffect, useRef, useMemo } from "react";

export default function CompleteBookingModal({
  show, booking, note, setNote, selectedItemIds,
  setSelectedItemIds, onConfirm, onCancel,
}) {
  const textareaRef = useRef(null);

  useEffect(() => {
    if (show && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [show]);

  const items = useMemo(
    () => (Array.isArray(booking?.items_detail) ? booking.items_detail : []),
    [booking?.items_detail]
  );

  const getDiseaseId = (it) => it?.vaccine?.disease?.id || it?.disease?.id || it?.disease_id || null;

  if (!show || !booking) return null;

  const toggleItem = (id) => {
    if (!setSelectedItemIds) return;
    const target = items.find((x) => x.id === id);
    if (!target) return;
    if (target.can_complete === false) {
      if (target.cannot_complete_reason) {
        alert(target.cannot_complete_reason);
      } else {
        alert("Mũi này không thể hoàn thành do không còn vắc xin hợp lệ trong kho.");
      }
      return;
    }
    setSelectedItemIds((prev) => {
      const already = prev.includes(id);
      if (already) {
        return prev.filter((x) => x !== id);
      }
      const currentItems = items.filter((it) => prev.includes(it.id));
      const currentCount = currentItems.length;
      if (currentCount >= 2) {
        alert("Mỗi buổi chỉ được xác nhận tối đa 2 mũi.");
        return prev;
      }
      const newDiseaseId = getDiseaseId(target);
      const currentDiseaseIds = new Set( currentItems.map(getDiseaseId).filter(Boolean) );
      if (currentDiseaseIds.has(newDiseaseId)) {
        alert("Không được xác nhận 2 mũi cùng một phòng bệnh trong cùng ngày.");
        return prev;
      }
      return [...prev, id];
    });
  };

  return (
    <div className="tw-fixed tw-inset-0 tw-bg-black/50 tw-flex tw-justify-center tw-items-center tw-z-50">
      <div className="tw-bg-white tw-p-6 tw-rounded-2xl tw-w-full md:tw-w-[720px] tw-shadow-xl tw-relative tw-max-h-[80vh] tw-flex tw-flex-col">
        <h2 className="tw-text-2xl md:tw-text-3xl tw-font-semibold tw-mb-4 tw-text-blue-600 tw-text-center">
          Hoàn thành buổi tiêm
        </h2>
        {/* Thông tin chung */}
        <div className="tw-text-gray-800 tw-text-lg tw-mb-4 tw-text-center">
          <div> Lịch hẹn #<b>{booking.id}</b> </div>
          <div className="tw-mt-1">
            Người tiêm:{" "}
            <b className="tw-text-pink-600"> {booking?.member?.full_name || "Không rõ"} </b>{" "}
            - Ngày hẹn:{" "}
            <i className="tw-text-pink-600">
              {booking?.appointment_date ? new Date(booking.appointment_date).toLocaleDateString("vi-VN") : "—"}
            </i>
          </div>
        </div>

        {/* Danh sách mũi trong buổi hẹn */}
        <div className="tw-flex-1 tw-border tw-rounded-xl tw-overflow-hidden tw-mb-4">
          <div className="tw-bg-blue-50 tw-px-4 tw-py-2 tw-text-sm md:tw-text-base tw-font-medium tw-flex tw-items-center tw-justify-between">
            <span className="tw-text-sky-600">Chọn những mũi đã TIÊM TRONG BUỔI NÀY</span>
            {items.length > 0 && (
              <span className="tw-text-xs tw-text-gray-500">(Mỗi buổi tối đa 2 mũi, 2 phòng bệnh khác nhau) </span>
            )}

          </div>

          {items.length === 0 ? (
            <div className="tw-p-4 tw-text-center tw-text-gray-500">
              Không có mũi vắc xin nào trong lịch hẹn này.
            </div>
          ) : (
            <div className="tw-max-h-[40vh] tw-overflow-y-auto tw-scrollbar-thin tw-scrollbar-thumb-gray-300 tw-scrollbar-track-gray-50">
              <table className="tw-w-full tw-text-base">
                <thead className="tw-sticky tw-top-0 tw-bg-white tw-border-b">
                  <tr className="tw-text-gray-700">
                    <th className="tw-w-[40px] tw-px-3 tw-py-2 tw-text-center">
                      <input type="checkbox" checked={false} disabled  />
                    </th>
                    <th className="tw-text-left tw-font-medium tw-px-3 tw-py-2"> Vắc xin </th>
                    <th className="tw-text-left tw-font-medium tw-px-3 tw-py-2"> Phòng bệnh </th>
                    <th className="tw-text-center tw-font-medium tw-px-3 tw-py-2"> Số lượng </th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((it) => {
                    const name = it?.vaccine?.name || "Vắc xin";
                    const diseaseName = it?.vaccine?.disease?.name || it?.disease?.name || it?.disease_name || "—";
                    const qty = it?.quantity ?? 1;
                    const checked = selectedItemIds?.includes(it.id);

                    const isCompleted = !!it.vaccination_date; 
                    const canComplete = !isCompleted && it.can_complete !== false;
                    const reason = it.cannot_complete_reason || "";

                    const rowBase = checked ? "tw-bg-blue-50" : "tw-bg-white";
                    const rowIfBad = !isCompleted && !canComplete ? "tw-bg-red-50" : "";
                    const textIfBad = !isCompleted && !canComplete ? "tw-text-red-600" : "tw-text-gray-800";
                     return (
                      <tr key={it.id} className={`tw-border-b tw-border-gray-100 ${rowBase} ${rowIfBad}`}>
                        <td className="tw-px-3 tw-py-2 tw-text-center">
                          <input type="checkbox" checked={checked} disabled={!canComplete}  
                            onChange={() => canComplete && toggleItem(it.id)}
                          />
                        </td>
                        <td className={`tw-px-3 tw-py-2 ${textIfBad} tw-text-left`}>
                          <div>{name}</div>
                          {reason && (
                            <div className={`tw-text-xs tw-mt-1 ${ isCompleted ? "tw-text-green-600" : "tw-text-red-500" }`} >
                              {reason}
                            </div>
                          )}
                        </td>
                        <td className={`tw-px-3 tw-py-2 tw-text-left ${!isCompleted && !canComplete ? "tw-text-red-600" : ""}`}>
                          {diseaseName}
                        </td>
                        <td className={`tw-px-3 tw-py-2 tw-text-center ${!isCompleted && !canComplete ? "tw-text-red-600" : ""}`}>
                          {qty}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>

              </table>
            </div>
          )}
        </div>

        {/* Ghi chú phản ứng sau tiêm */}
        <div className="tw-mb-3">
          <label className="tw-block tw-text-sm md:tw-text-lg tw-font-medium tw-text-left tw-mb-1">
            Ghi chú phản ứng sau tiêm (tuỳ chọn):
          </label>
          <textarea ref={textareaRef} rows={3} value={note} onChange={(e) => setNote(e.target.value)}
            className="tw-w-full tw-border tw-rounded-lg tw-text-lg tw-px-3 tw-py-2 focus:tw-outline-none 
            focus:tw-ring-2 focus:tw-ring-blue-300 focus:tw-border-blue-800"
            placeholder="VD: Sốt nhẹ 38.2°C, đau chỗ tiêm 1 ngày…"
          />
        </div>

        {/* Nút hành động */}
        <div className="tw-flex tw-justify-end tw-gap-3 tw-mt-2">
          <button onClick={onCancel}
            className="tw-bg-red-600 tw-text-white tw-px-4 tw-py-2 tw-rounded-full hover:tw-bg-red-500 tw-text-xl " >
            Hủy
          </button>
          <button onClick={onConfirm}
            className="tw-bg-green-600 tw-text-white tw-px-5 tw-py-2 tw-rounded-full hover:tw-bg-green-500 tw-text-xl ">
            Xác nhận mũi đã tiêm
          </button>
        </div>
      </div>
    </div>
  );
}
