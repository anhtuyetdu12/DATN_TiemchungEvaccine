// BookingForm.jsx
import { useState } from "react";
import SelectCustomerModal from "./bookingVaccine/SelectCustomerModal";


export default function BookingForm() {
  const vaccines = [
    {
      id: 1,
      country: "Ý",
      name: "Vắc xin Bexsero",
      disease: "Phòng bệnh Não mô cầu B",
      price: 3230000,
      oldPrice: 3400000,
      qty: 2,
      note: "Quý khách đã chọn tối đa số liều có thể đặt cho vắc xin này",
      promo: "Gói Vaccine Viêm não mô cầu nhóm B - giảm ngay 5%",
      img: "/images/vac1.jpg",
    },
    {
      id: 2,
      country: "Hoa Kỳ",
      name: "Vắc xin MenQuadfi",
      disease: "Phòng bệnh Não mô cầu ACYW",
      price: 1746000,
      oldPrice: 1800000,
      qty: 1,
      note: "Quý khách đã chọn tối đa số liều có thể đặt cho vắc xin này",
      promo: "Giảm 3% khi mua gói",
      img: "/images/vac2.jpg",
    },
  ];
   const [openModal, setOpenModal] = useState(false);
   const [selectedCustomer, setSelectedCustomer] = useState({
    id: 1,
    name: "Chị Tuyết",
    gender: "Nữ",
    dob: "12/11/2003",

  });

  const customers = [
    { id: 1, name: "Chị Tuyết", gender: "Nữ", dob: "12/11/2003", relation: "Khác" },
    { id: 2, name: "Minh Anh", gender: "Nữ", dob: "24/09/2003", relation: "Bạn bè" },
  ];

  // 👉 Hàm tính tuổi chi tiết
  const calculateAgeDetail = (dob) => {
    const birthDate = new Date(dob);
    const today = new Date();

    let years = today.getFullYear() - birthDate.getFullYear();
    let months = today.getMonth() - birthDate.getMonth();
    let days = today.getDate() - birthDate.getDate();

    if (days < 0) {
      months -= 1;
      const prevMonth = new Date(today.getFullYear(), today.getMonth(), 0).getDate();
      days += prevMonth;
    }

    if (months < 0) {
      years -= 1;
      months += 12;
    }

    return `${years} Tuổi ${months} Tháng ${days} Ngày`;
  };


  const total = vaccines.reduce((sum, v) => sum + v.price * v.qty, 0);
  const fee = 974100;
  const discount = 414230;

  return (
    <div className="tw-max-w-[1100px] tw-mx-auto tw-my-6 tw-grid tw-grid-cols-3 tw-gap-6 tw-mt-[150px] tw-bg-gray-50">
      {/* LEFT */}
      <div className="tw-col-span-2">
        <div className="tw-bg-white tw-rounded-lg tw-shadow tw-p-4">
            {/* Thông tin người tiêm */}
            <div className="tw-flex tw-items-center tw-justify-between tw-pb-4 tw-mb-4 tw-border-b">
            <div className="tw-flex tw-items-center tw-gap-2">
                <i className="fa-solid fa-user tw-text-blue-400"></i>
                <p className="tw-text-gray-700 tw-flex tw-items-center tw-flex-wrap">
                <span className="tw-font-semibold">{selectedCustomer.name}</span>
                <span className="tw-border-l tw-border-gray-400 tw-h-6 tw-mx-6"></span>
                <span>{selectedCustomer.gender}</span>  
                <span className="tw-mx-6">•</span>
                <span>{new Date(selectedCustomer.dob).toLocaleDateString("vi-VN")}</span>
                <span className="tw-text-xl tw-text-gray-500 tw-ml-2">
                    ({calculateAgeDetail(selectedCustomer.dob)})
                </span>
                </p>
            </div>
            <button  onClick={() => setOpenModal(true)} className="tw-text-blue-500 tw-text-xl hover:tw-underline" >
                Chọn lại người tiêm
            </button>
            </div>

            {/* Modal */}
            <SelectCustomerModal open={openModal} onClose={() => setOpenModal(false)}
                customers={customers}  onSelect={(c) => {
                    setSelectedCustomer(c);
                    setOpenModal(false);
                }}
            />

            {/* Danh sách vắc xin */}
            <div className="tw-space-y-4">
            {vaccines.map((v) => (
                <div key={v.id} className="tw-grid tw-grid-cols-[100px_1fr_auto_auto] tw-items-center tw-gap-4 tw-border-b tw-pb-4 last:tw-border-b-0" >
                {/* Ảnh */}
                <img src={v.img} alt={v.name}
                    className="tw-w-[100px] tw-h-[100px] tw-object-cover tw-rounded-lg tw-border tw-border-gray-300" />

                {/* Thông tin */}
                <div className="tw-space-y-1 tw-text-left tw-text-2xl">
                    <p className="tw-font-semibold">{v.country}</p>
                    <h3 className="tw-font-bold">{v.name}</h3>
                    <p className="tw-text-gray-700">{v.disease}</p>
                    <p className="tw-text-xl tw-text-gray-500">
                        Phác đồ: Từ 12 tháng tuổi trở lên (1 liều)
                    </p>

                    {v.note && (
                    <p className="tw-text-orange-600 tw-text-xl">⚠️ {v.note}</p>
                    )}
                  
                </div>

                {/* Giá */}
                <div className="tw-text-right">
                    <p className="tw-text-red-600 tw-font-bold">
                    {v.price.toLocaleString()}đ
                    </p>
                    <p className="tw-line-through tw-text-gray-400">
                    {v.oldPrice.toLocaleString()}đ
                    </p>
                </div>

                {/* Số lượng + xóa */}
                <div className="tw-flex tw-items-center tw-gap-2">
                    <button className="tw-border tw-rounded tw-px-2">-</button>
                    <span>{v.qty}</span>
                    <button className="tw-border tw-rounded tw-px-2">+</button>
                    <button className="tw-text-red-500 hover:tw-text-red-700">
                    <i className="fa-solid fa-trash"></i>
                    </button>
                </div>
                </div>
            ))}
            </div>
        </div>
      </div>


      {/* RIGHT */}
      <div className="tw-space-y-4">
        {/* Địa điểm & thời gian */}
        <div className="tw-bg-white tw-rounded-lg tw-shadow tw-p-4">
          <h2 className="tw-font-bold tw-text-lg mb-2">📍 Địa điểm & thời gian hẹn</h2>
          
          <button className="tw-w-full tw-border tw-rounded-lg tw-p-2 tw-text-left">
            Thời gian hẹn: <span className="tw-font-medium">Thứ Sáu, 3/10/2025</span>
          </button>
        </div>

        {/* Tổng tiền */}
        <div className="tw-bg-white tw-rounded-lg tw-shadow tw-p-4 tw-space-y-2">
          <h2 className="tw-font-bold tw-text-lg">💰 Thanh toán</h2>
          <div className="tw-flex tw-justify-between">
            <span>Tổng tiền</span>
            <span>{total.toLocaleString()}đ</span>
          </div>
          <div className="tw-flex tw-justify-between">
            <span>Phí quản lý</span>
            <span>{fee.toLocaleString()}đ</span>
          </div>
          <div className="tw-flex tw-justify-between tw-text-green-600">
            <span>Giảm giá</span>
            <span>-{discount.toLocaleString()}đ</span>
          </div>
          <div className="tw-border-t tw-my-2"></div>
          <div className="tw-flex tw-justify-between tw-font-bold tw-text-xl">
            <span>Tạm tính</span>
            <span className="tw-text-red-600">
              {(total + fee - discount).toLocaleString()}đ
            </span>
          </div>
          <button className="tw-w-full tw-mt-4 tw-bg-cyan-600 tw-text-white tw-py-3 tw-rounded-lg tw-font-semibold hover:tw-bg-cyan-500">
            Xác nhận đặt trước
          </button>
        </div>
      </div>
    </div>
  );
}
