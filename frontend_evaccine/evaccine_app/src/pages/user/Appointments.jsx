// lịch hẹn tiêm chủng Appointments

import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Appointments() {

  const navigate = useNavigate();

  const [users, setUsers] = useState([
    { id: 1, name: "Chị Tuyết" },
    { id: 2, name: "Minh Anh" },
  ]);
  const [activeUser, setActiveUser] = useState(1);

  const handleAddUser = () => {
    const newId = users.length + 1;
    const newUser = { id: newId, name: `Người dùng ${newId}` };
    setUsers([...users, newUser]);
    setActiveUser(newId);
  };

  // Giả lập dữ liệu lịch tiêm sắp tới
  // const schedules = [
  //   {
  //     id: 1,
  //     date: "20/09/2025",
  //     vaccine: "Vắc xin Cúm mùa",
  //     location: "Trung tâm tiêm chủng Quận 1",
  //     status: "Sắp tới",
  //   },
  //   {
  //     id: 2,
  //     date: "05/10/2025",
  //     vaccine: "Vắc xin Viêm gan B - Mũi 2",
  //     location: "Bệnh viện Nhi Đồng",
  //     status: "Đã đặt lịch",
  //   },
  //   {
  //     id: 3,
  //     date: "15/10/2025",
  //     vaccine: "Vắc xin Sốt xuất huyết",
  //     location: "Phòng khám Đa khoa Hòa Hảo",
  //     status: "Nhắc nhở",
  //   },
  // ];
  const schedules = [];

  return (
    <section className="tw-bg-gray-100 tw-py-10 tw-mt-[100px]">
      <div className="tw-container tw-mx-auto tw-px-14">
        {/* Banner */}
        <div className="tw-relative tw-w-full tw-h-[200px] tw-overflow-hidden tw-rounded-2xl tw-mb-12">
          <img
            src="/images/banner1.jpg"
            alt="Banner"
            className="tw-w-full tw-h-full tw-object-cover"
          />
          <div className="tw-absolute tw-top-[10px] tw-left-1/2 tw-transform -tw-translate-x-1/2">
            <h1 className="tw-bg-gradient-to-r tw-from-blue-500 tw-to-cyan-400 
                           tw-bg-clip-text tw-text-transparent tw-text-[38px] tw-font-bold tw-drop-shadow-lg">
              Lịch tiêm sắp tới
            </h1>
          </div>
        </div>

        {/* Tabs người dùng */}
        <div className="tw-flex tw-items-center tw-gap-3 tw-overflow-x-auto tw-px-3 tw-mb-[20px]">
          <button onClick={handleAddUser}
            className="tw-flex tw-items-center tw-gap-2 tw-px-4 tw-py-2 tw-rounded-full tw-bg-[#1999ee]
                       tw-text-white hover:tw-bg-gradient-to-r hover:tw-from-[#93c5fd] hover:tw-to-[#fbcfe8] hover:tw-text-blue-500" >
            <div className="tw-relative">
              <div className="tw-w-8 tw-h-8 tw-rounded-full tw-border-2 tw-border-white tw-flex tw-items-center tw-justify-center tw-bg-[#1999ee]">
                <i className="fa-solid fa-user tw-text-sm"></i>
              </div>
              <span className="tw-absolute tw-bottom-0 tw-right-0 tw-w-4 tw-h-4 tw-rounded-full tw-bg-white 
                               tw-flex tw-items-center tw-justify-center tw-text-[#1999ee] tw-text-xs tw-font-bold tw-border tw-border-[#1999ee]">
                <i className="fa-solid fa-plus"></i>
              </span>
            </div>
            <span>Thêm</span>
          </button>

          {users.map((user) => (
            <button key={user.id} onClick={() => setActiveUser(user.id)}
              className={`tw-flex tw-items-center tw-gap-2 tw-px-4 tw-py-2 tw-whitespace-nowrap transition-colors duration-200
                ${  activeUser === user.id
                    ? "tw-bg-[#1999ee] tw-text-white tw-rounded-full hover:tw-bg-gradient-to-r hover:tw-from-[#93c5fd] hover:tw-to-[#fbcfe8] hover:tw-text-blue-600"
                    : "tw-bg-[#e1eef8] tw-text-blue-600 tw-rounded-t-2xl tw-font-semibold hover:tw-bg-gradient-to-r hover:tw-from-[#93c5fd] hover:tw-to-[#fbcfe8]"
                }`} >
              <div className={`tw-w-6 tw-h-6 tw-rounded-full tw-flex tw-items-center tw-justify-center tw-border 
                  ${ activeUser === user.id
                      ? "tw-border-white"
                      : "tw-bg-white tw-border-blue-600 tw-text-blue-600"
                  }`} >
                <i className="fa-solid fa-user tw-text-xs"></i>
              </div>
              <span>{user.name}</span>
            </button>
          ))}
        </div>

        {/* Danh sách lịch tiêm */}
        <div className="tw-bg-white tw-shadow tw-rounded-2xl tw-p-6">
          <h2 className="tw-text-[20px] tw-font-bold tw-text-blue-600 tw-mb-4 tw-italic">
            Danh sách lịch tiêm
          </h2>

          {schedules.length === 0 ? (
            <div className="tw-flex tw-flex-col tw-items-center tw-justify-center tw-py-10">
              <img src="/images/lichtrong.jpg" alt="Lịch trống" className="tw-w-80 tw-h-80 tw-mb-4" />
              <p className="tw-text-gray-500 tw-mb-4">Bạn hiện chưa có lịch tiêm sắp tới nào</p>
              <button onClick={() => navigate("/vaccines")}
                className="tw-px-6 tw-w-[120px] tw-mt-3 tw-bg-[#b8def6] tw-text-[#1999ee] tw-font-medium tw-rounded-full 
                tw-py-[8px] hover:tw-bg-[#1999ee] hover:tw-text-white transition" >
                <i className="fa-solid fa-calendar-days tw-mr-2"></i> Đặt hẹn 
              </button>
            </div>
          ) : (
            <div className="tw-space-y-4">
              {schedules.map((item) => (
                <div  key={item.id}
                  className="tw-flex tw-items-center tw-justify-between tw-bg-gradient-to-r tw-from-blue-50 tw-to-cyan-50
                             tw-rounded-xl tw-p-5 tw-border tw-border-blue-100 hover:tw-shadow-lg transition">
                  <div>
                    <p className="tw-text-lg tw-font-semibold tw-text-gray-800">
                      {item.vaccine}
                    </p>
                    <p className="tw-text-gray-600">{item.location}</p>
                    <p className="tw-text-sm tw-text-gray-500">Ngày: {item.date}</p>
                  </div>
                  <span
                    className={`tw-px-4 tw-py-2 tw-rounded-full tw-font-medium
                      ${ item.status === "Sắp tới"
                          ? "tw-bg-yellow-100 tw-text-yellow-600"
                          : item.status === "Đã đặt lịch"
                          ? "tw-bg-green-100 tw-text-green-600"
                          : "tw-bg-pink-100 tw-text-pink-600"
                      }`} >
                    {item.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </section>
  );
}

