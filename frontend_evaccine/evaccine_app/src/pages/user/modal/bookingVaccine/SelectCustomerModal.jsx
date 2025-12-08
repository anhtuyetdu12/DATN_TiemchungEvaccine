import { useState, useEffect } from "react";

export default function SelectCustomerModal({ open, onClose, customers, onSelect }) {
  const [pendingCustomer, setPendingCustomer] = useState(null);

  // Mỗi lần mở modal thì reset lựa chọn tạm
  useEffect(() => {
    if (open) {
      setPendingCustomer(null);
    }
  }, [open]);

  if (!open) return null;

  const handleConfirm = () => {
    if (!pendingCustomer) {
      // chưa chọn ai thì chỉ đóng modal (hoặc bạn có thể cho alert/ttoast ở đây nếu muốn)
      return onClose();
    }
    // Gửi customer đã chọn ra ngoài
    onSelect(pendingCustomer);
  };

  return (
    <div className="tw-fixed tw-inset-0 tw-bg-black/40 tw-flex tw-items-center tw-justify-center tw-z-50 tw-pt-[90px]">
      <div className="tw-bg-white tw-rounded-lg tw-shadow-lg tw-w-[450px] tw-max-w-full tw-p-5">
        {/* Header */}
        <div className="tw-flex tw-justify-between tw-items-center tw-mb-4">
          <h2 className="tw-font-bold tw-text-2xl tw-mt-2">Chọn người tiêm</h2>
          <button  onClick={onClose}
            className="tw-w-10 tw-h-10 tw-flex tw-items-center tw-justify-center 
             tw-rounded-full tw-text-gray-500 hover:tw-text-red-500  tw-mb-2
             hover:tw-bg-gray-100 transition-colors"  >
            <i className="fa-solid fa-xmark "></i>
          </button>
        </div>

        <div className="tw-flex tw-items-center tw-gap-3 tw-text-[10px] tw-font-medium tw-text-gray-700 tw-mb-4 tw-bg-[#ccfff8] tw-py-2 tw-px-8 tw-rounded-lg tw-text-left">
          <img  src="images/quen.jpg"  alt="chu ý"
            className="tw-w-10 tw-h-10 tw-object-contain tw-my-[10px] tw-rounded-full"
          />
          <span> Để đảm bảo quyền lợi và theo dõi chính xác, mỗi lần đặt lịch chỉ áp dụng cho một người.  </span>
        </div>

        {/* Danh sách người tiêm */}
        <div className="tw-space-y-3">
          {customers.map((c) => {
            const isSelected = pendingCustomer?.id === c.id;
            return (
              <div key={c.id} className={ "tw-border tw-rounded-lg tw-p-3 tw-flex tw-justify-between tw-items-center cursor-pointer " +
                  (isSelected ? "tw-border-cyan-500 tw-bg-cyan-50" : "tw-border-gray-200 hover:tw-border-cyan-500")}
                  onClick={() => setPendingCustomer(c)}>
                <div>
                  <p className="tw-font-semibold">
                    {c.name}{" "} 
                    <span className="tw-ml-2">
                      {c.gender === "Nam" && ( <i className="fa-solid fa-mars tw-text-blue-500" /> )}
                      {c.gender === "Nữ" && ( <i className="fa-solid fa-venus tw-text-pink-500" /> )}
                      {c.gender !== "Nam" && c.gender !== "Nữ" && ( <i className="fa-solid fa-user tw-text-gray-400" /> )}
                    </span>
                  </p>
                  <p className="tw-text-sm tw-text-gray-500"> {c.relation} | {c.dob} </p>
                </div>

                {/* icon tick nhỏ để dễ nhận biết */}
                {isSelected && (
                  <span className="tw-text-cyan-600">
                    <i className="fa-solid fa-check-circle" />
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {/* Notes */}
        <div className="tw-text-lg tw-text-gray-600 tw-mt-3 tw-space-y-1">
          <div className="tw-flex tw-items-center tw-gap-2">
            <div className="tw-bg-gray-200 tw-rounded-full tw-w-8 tw-h-8 tw-flex tw-items-center tw-justify-center  tw-mr-[5px] tw-flex-shrink-0">
              <i className="fa fa-lightbulb tw-text-yellow-500"></i>
            </div>
            <p className="tw-text-sm tw-text-medium tw-text-gray-600 tw-leading-snug tw-text-left">
              Đổi người tiêm đồng nghĩa với việc vắc xin được chọn sẽ xoá khỏi lịch hẹn.
            </p>
          </div>
          <div className="tw-flex tw-items-center tw-gap-2">
            <div className="tw-bg-gray-200 tw-rounded-full tw-w-8 tw-h-8 tw-flex tw-items-center tw-justify-center  tw-mr-[5px] tw-flex-shrink-0">
              <i className="fa fa-lightbulb tw-text-yellow-500 "></i>
            </div>
            <p className="tw-text-sm tw-text-medium tw-text-gray-600 tw-leading-snug tw-text-left">
              Hồ sơ của Quý khách đã được lưu tại EVaccine và hệ thống Tiêm chủng Quốc gia. Nếu cần chỉnh sửa
              thông tin hồ sơ, vui lòng đến Tiêm chủng EVaccine để được hỗ trợ.
            </p>
          </div>
        </div>

        {/* Confirm */}
        <div className="tw-mt-5 tw-text-right">
          <button onClick={handleConfirm} disabled={!pendingCustomer}
            className={ "tw-px-5 tw-py-2 tw-rounded-lg tw-text-white " +
              (pendingCustomer? "tw-bg-cyan-600 hover:tw-bg-cyan-500": "tw-bg-gray-300 tw-cursor-not-allowed")
            } >
            Xác nhận
          </button>
        </div>
      </div>
    </div>
  );
}
