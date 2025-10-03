// Sổ tiêm chủng  
import { useState } from "react";
import UpdateDose from "./modal/RecordBook/UpdateDose";
import AddUserForm from "./modal/AddUserForm";


export default function RecordBook() {
    // người dùng
  const [users, setUsers] = useState([
    { id: 1, fullname: "Chị Tuyết", gender: "Nữ", dob: "2003-01-01" },
    { id: 2, fullname: "Minh Anh", gender: "Nam", dob: "2010-05-20" },
  ]);
  const [activeUser, setActiveUser] = useState(1);
  const [showAddForm, setShowAddForm] = useState(false);
  

  const handleSaveUser = (newUser) => {
    const newId = users.length + 1;
    // lưu đủ thông tin
    setUsers([...users, { id: newId, ...newUser }]);
    setActiveUser(newId); // tự động chuyển sang tab mới
  };
  // hàm tính tuổi
  const getAgeText = (dob) => {
    if (!dob) return "";
    const birth = new Date(dob);
    const now = new Date();
    let years = now.getFullYear() - birth.getFullYear();
    let months = now.getMonth() - birth.getMonth();
    let days = now.getDate() - birth.getDate();
    if (days < 0) {
      months -= 1;
      const prevMonth = new Date(now.getFullYear(), now.getMonth(), 0).getDate();
      days += prevMonth;
    }
    if (months < 0) {
      years -= 1;
      months += 12;
    }
    return `${years} Tuổi ${months} Tháng ${days} Ngày`;
  };

  const currentUser = users.find((u) => u.id === activeUser);


    //   nút chỉnh sửa
  const [isEditing, setIsEditing] = useState(false);

  // Dữ liệu phòng bệnh
    const diseases = [
        { id: 1, name: "Sốt xuất huyết", doseCount: 3, description: "Phòng bệnh sốt xuất huyết" },
    { id: 2, name: "Viêm gan B", doseCount: 5, description: "Phòng bệnh viêm gan B" },
        { id: 3, name: "Cúm mùa", doseCount: 2, description: "Phòng cúm mùa " },
    ];
    // update  mũi 
    const [showUpdate, setShowUpdate] = useState(false);
    const [selectedDisease, setSelectedDisease] = useState(null);
    const [showDiseaseModal, setShowDiseaseModal] = useState(false);

    // bảng tiêm
    const [vaccinationData, setVaccinationData] = useState({}); 

    const handleSaveDose = (diseaseId, doses) => {
        const updated = {};
        doses.forEach((dose, i) => {
            if (dose.date || dose.vaccine || dose.location) {
            updated[i] = {
                date: dose.date,
                vaccine: dose.vaccine,
                location: dose.location,
            };
            }
        });

        setVaccinationData((prev) => ({
            ...prev,
            [activeUser]: {
            ...prev[activeUser],
            [diseaseId]: updated,
            },
        }));

        setShowUpdate(false);
    };

   

  return (
    <section className="tw-bg-gray-100 tw-py-10 tw-mt-[100px]">
        <div className="tw-container tw-mx-auto tw-px-14">
            {/* Banner duy nhất */}
            <div className="tw-relative tw-w-full tw-h-[200px] tw-overflow-hidden tw-rounded-2xl tw-mb-12">
                <img src="/images/banner1.jpg" alt="Banner"
                    className="tw-w-full tw-h-full tw-object-cover tw-flex-shrink-0" />
                <div className="tw-absolute tw-top-[10px] tw-left-1/2 tw-transform -tw-translate-x-1/2">   
                           {/* tw-absolute tw-inset-0 tw-flex tw-items-center tw-justify-center */}
                    <h1 className="tw-bg-gradient-to-r tw-from-yellow-400 tw-to-orange-600 
                                tw-bg-clip-text tw-text-transparent tw-text-[38px] tw-font-bold tw-text-shadow">
                    Sổ tiêm chủng cá nhân
                    </h1>
                </div>
            </div>


        {/* Khung nội dung chính */}       
        <div className="tw-container tw-mx-auto tw-px-6 lg:tw-px-14">
            {/* Tabs người dùng */}
            <div className="tw-flex tw-items-center tw-gap-3 tw-overflow-x-auto tw-px-3 tw-mb-[5px]">
                <button
                    onClick={() => setShowAddForm(true)}
                    className="tw-flex tw-items-center tw-gap-2 tw-px-4 tw-py-2 tw-rounded-full tw-bg-[#1999ee] tw-text-white 
                            hover:tw-bg-gradient-to-r hover:tw-from-[#93c5fd] hover:tw-to-[#fbcfe8] hover:tw-text-blue-500">
                    <div className="tw-relative ">
                    <div className="tw-w-8 tw-h-8 tw-rounded-full tw-border-2 tw-border-white tw-flex tw-items-center tw-justify-center tw-bg-[#1999ee]">
                        <i className="fa-solid fa-user tw-text-sm "></i>
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
                    ${
                        activeUser === user.id
                        ? "tw-bg-[#1999ee] tw-text-white tw-rounded-full hover:tw-bg-gradient-to-r hover:tw-from-[#93c5fd] hover:tw-to-[#fbcfe8] hover:tw-text-blue-600"
                        : "tw-bg-[#e1eef8] tw-text-blue-600 tw-rounded-t-2xl tw-font-semibold hover:tw-bg-gradient-to-r hover:tw-from-[#93c5fd] hover:tw-to-[#fbcfe8]"
                    }`} >
                    <div className={`tw-w-6 tw-h-6 tw-rounded-full tw-flex tw-items-center tw-justify-center tw-border 
                        ${  activeUser === user.id
                            ? "  tw-border-white"
                            : " tw-bg-white tw-border-blue-600 tw-text-blue-600"
                        }`}>
                        <i className="fa-solid fa-user tw-text-xs "></i>
                    </div>
                    <span>{user.fullname}</span>
                    </button>
                ))}
            </div>
            {showAddForm && (
                <AddUserForm  onSave={handleSaveUser}  onClose={() => setShowAddForm(false)} />
            )}

            {currentUser && (
            <div className="tw-bg-[#e1eef8] tw-shadow tw-rounded-b-2xl tw-overflow-hidden tw-px-[10px]">
                {/* Thông tin cá nhân */}
                <div className="tw-p-5 tw-flex tw-justify-between tw-items-center">
                    <div className="tw-p-5 tw-flex tw-justify-between tw-items-center">
                    <div>
                        <h2 className="tw-font-bold tw-text-2xl tw-bg-gradient-to-r tw-from-pink-500 tw-to-blue-600 tw-bg-clip-text tw-text-transparent">
                        {currentUser.fullname}
                        </h2>
                        <p className="tw-text-gray-700 tw-text-lg">
                        {currentUser.gender} · {getAgeText(currentUser.dob)}
                        </p>
                    </div>
                    </div>
                    
                    <button onClick={() => setIsEditing(!isEditing)}
                        className={`tw-flex tw-items-center tw-font-semibold tw-gap-1 tw-text-lg tw-px-4 tw-py-2 tw-rounded-full
                            ${ isEditing
                                ? "tw-bg-pink-500 tw-text-white hover:tw-bg-pink-600 "
                                : "tw-text-blue-600"
                            }`}>
                        {isEditing ? "Hoàn thành" : "Chỉnh sửa"}
                        <i className={`fa ${isEditing ? "fa-check" : "fa-pen"} tw-ml-3`}></i>
                    </button>
                </div>
                <div className="tw-border-t-2 tw-border-solid tw-border-blue-200"></div>
                {/* Thông báo nhập mã */}
                <div className="tw-p-5 tw-flex tw-items-center tw-justify-between">
                    <div className="tw-flex tw-items-center">
                        <div className="tw-bg-gray-200 tw-rounded-full tw-w-8 tw-h-8 tw-flex tw-items-center tw-justify-center tw-mr-[5px]">
                            <i className="fa fa-lightbulb tw-text-yellow-500"></i>
                        </div>
                        <p className="tw-text-lg tw-text-gray-700">
                            Nhập mã TCQG để đồng bộ lịch sử tiêm chủng của bản thân và gia đình
                        </p>
                    </div>
                    <button className="tw-text-blue-600 tw-font-semibold tw-text-lg">
                        Nhập  <i class="fa-solid fa-angle-right tw-ml-2"></i>
                    </button>
                </div>
            </div>
            )}

            

            {/* Lịch tiêm */}
            <div className="tw-bg-white  tw-my-[30px] tw-p-5  tw-shadow tw-rounded-2xl tw-px-[20px]">
                {/* Header */}
                <div className="tw-grid tw-grid-cols-6 tw-text-center tw-font-medium tw-text-gray-600 tw-text-xl tw-pb-3 tw-border-b">
                    <span className="tw-text-left">Phòng bệnh</span>
                    <span>Mũi 1</span>
                    <span>Mũi 2</span>
                    <span>Mũi 3</span>
                    <span>Mũi 4</span>
                    <span>Mũi 5</span>
                </div>

                {/* Danh sách phòng bệnh */}
                {diseases.map((disease) => (
                    <div
                        key={disease.id}
                        className="tw-grid tw-grid-cols-6 tw-gap-4 tw-text-center tw-items-center tw-border-b tw-border-gray-200 tw-py-3">
                        {/* Tên phòng bệnh */}
                        <div className="tw-text-left tw-text-xl tw-font-medium tw-text-gray-700 tw-pr-2 tw-break-words tw-cursor-pointer hover:tw-text-blue-600"
                            onClick={() => {
                                setSelectedDisease(disease);
                                setShowDiseaseModal(true);
                            }}>
                                {disease.name}
                        </div>

                        {/* Render số mũi thực tế */}
                        
                        {[...Array(disease.doseCount)].map((_, i) => {
                            const doseInfo = vaccinationData[activeUser]?.[disease.id]?.[i];
                            const isVaccinated = !!doseInfo;
                            return (
                                <div  key={i} onClick={() => {
                                    setSelectedDisease(disease);
                                    setShowUpdate(true);
                                }}
                                className={`tw-rounded-xl tw-flex tw-flex-col tw-items-center tw-justify-center tw-h-[90px] tw-cursor-pointer
                                    ${isVaccinated ? "tw-bg-green-100 tw-text-green-600" : "tw-bg-orange-100 tw-text-orange-600"}`} >
                                {isVaccinated ? (
                                    <div className="tw-flex tw-flex-col tw-items-start">
                                        <span className="tw-font-semibold tw-text-xl">Đã tiêm</span>
                                        <span className="tw-text-lg tw-text-gray-500">
                                            {new Date(doseInfo.date).toLocaleDateString("vi-VN")}
                                        </span>
                                    </div>
                                ) : isEditing ? (
                                    <div className="tw-w-10 tw-h-10 tw-flex tw-items-center tw-justify-center tw-rounded-full tw-border-2 tw-bg-orange-500 tw-border-orange-500">
                                        <i className="fa-solid fa-plus tw-text-lg tw-text-white"></i>
                                    </div>
                                ) : (
                                    "Chưa tiêm"
                                )}
                                </div>
                            );
                        })}


                        {/* Các mũi còn lại (nếu < 5) thì để trống */}
                        {Array.from({ length: 5 - disease.doseCount }).map((_, i) => (
                        <div key={`empty-${i}`} />
                        ))}
                    </div>
                ))}

                {showUpdate && (
                    <UpdateDose  disease={{ 
                        ...selectedDisease, 
                        maxDoses: selectedDisease.doseCount 
                        }} 
                        onClose={() => setShowUpdate(false)}  
                        onSave={handleSaveDose}/>
                )}

                {showDiseaseModal && selectedDisease && (
                    <div className="tw-fixed tw-inset-0 tw-flex tw-items-center tw-justify-center tw-bg-black/40 tw-z-50">
                        <div className="tw-bg-white tw-rounded-2xl tw-shadow-lg tw-w-[400px] tw-p-6 tw-relative">
                        <button onClick={() => setShowDiseaseModal(false)}
                            className="tw-absolute tw-top-3 tw-right-3 tw-text-gray-500 hover:tw-text-red-500" >
                            <i className="fa-solid fa-xmark tw-text-xl"></i>
                        </button>

                        <h2 className="tw-text-2xl tw-font-bold tw-mb-3">
                            {selectedDisease.name}
                        </h2>

                        <p className="tw-text-gray-600 tw-mb-6">
                            {selectedDisease.description || "Chưa có mô tả chi tiết."}
                        </p>

                        <button
                            onClick={() => alert("Mở danh mục vắc xin cho " + selectedDisease.name)}
                            className="tw-bg-blue-500 hover:tw-bg-blue-600 tw-text-white tw-font-medium tw-px-4 tw-py-2 tw-rounded-lg">
                            Danh mục vắc xin
                        </button>
                        </div>
                    </div>
                    )}


            </div>

            </div>
        </div>
    </section>
  );
}
