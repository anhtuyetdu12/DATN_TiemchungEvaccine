// Sổ tiêm chủng  
import { useState, useEffect } from "react";
import UpdateDose from "./modal/RecordBook/UpdateDose";
import AddUserForm from "./modal/RecordBook/AddUserForm";
import DiseaseModal from "./modal/RecordBook/DiseaseModal";
import DetailDose from "./modal/RecordBook/DetailDose";
import { getFamilyMembers,  getDiseases , getVaccinationRecords , updateFamilyMember} from "../../services/recordBookService";
import { toast } from "react-toastify";
import { jwtDecode } from "jwt-decode";

export default function RecordBook() {
    useEffect(() => {
    const access = localStorage.getItem("access");
    if (!access) {
        // Không có token → redirect login
        window.location.href = "/login";
        return;
    }
    try {
        const decoded = jwtDecode(access);
        const now = Date.now() / 1000;
        if (!decoded.exp || decoded.exp < now) {
            localStorage.clear();
            window.location.href = "/login";
            return;
        }
    } catch (err) {
        console.warn("Token không hợp lệ:", err);
        localStorage.clear();
        window.location.href = "/login";
        return;
    }
    }, []);
    

    // Danh sách thành viên trong sổ tiêm chủng
  const [users, setUsers] = useState([]);
  const [activeUser, setActiveUser] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [isEditing, setIsEditing] = useState(false); // nút chỉnh sửa

    // Gọi API lấy danh sách thành viên
    useEffect(() => {
    const fetchMembers = async () => {
        try {
            const data = await getFamilyMembers();
            const formatted = data.map((m) => ({
                id: m.id,
                fullname: m.full_name,
                relation: m.relation,
                gender: m.gender === "male" ? "Nam" : m.gender === "female" ? "Nữ" : "Khác",
                dob: m.date_of_birth,
            }));
            setUsers(formatted);
            // Chọn mặc định "Bản thân" nếu có, nếu không lấy thành viên đầu tiên
            const defaultUser = formatted.find((u) => u.relation === "Bản thân") || formatted[0];
            if (defaultUser) setActiveUser(defaultUser.id);
        } catch (err) {
            toast.error("Không thể tải danh sách thành viên.");
        }
    };

    fetchMembers();
    }, []);

  //  Khi thêm thành viên mới (gọi từ AddUserForm)
    const handleSaveUser = async (newMember) => {
        if (!newMember?.id) {
            toast.error("Không nhận được dữ liệu thành viên hợp lệ từ server");
            return;
        }
        const formattedMember = {
            id: newMember.id,
            fullname: newMember.full_name,
            gender: newMember.gender === "male" ? "Nam" : newMember.gender === "female"? "Nữ" : "Khác",
            dob: newMember.date_of_birth,
            relation: newMember.relation || "Khác",
            nickname: newMember.nickname || newMember.full_name,
            phone: newMember.phone || "",
        };
        setUsers((prev) => [...prev, formattedMember]);
        setActiveUser(newMember.id);
        setShowAddForm(false);
    };

    // --- Load vaccination record khi activeUser thay đổi ---
    useEffect(() => {
        if (!activeUser) return;
        const fetchVaccinations = async () => {
            try {
            const records = await getVaccinationRecords(activeUser);
            // Chuyển dữ liệu từ API về dạng dễ render
            // structuredData[diseaseId][doseIndex] = { date, vaccine, location, appointmentDate }
            const structuredData = {};
            records.forEach((rec) => {
                // Nếu backend chưa trả disease_id thì có thể dùng rec.vaccine_name làm key tạm
                const diseaseId = rec.disease_id || rec.vaccine_name;
                if (!structuredData[diseaseId]) structuredData[diseaseId] = {};
                // Nếu backend chưa trả dose_number, có thể tự tính thứ tự dựa vào số lượng đã tiêm
                const doseIndex = rec.dose_number ? rec.dose_number - 1 : Object.keys(structuredData[diseaseId]).length;
                structuredData[diseaseId][doseIndex] = {
                    date: rec.vaccination_date,
                    vaccine: rec.vaccine_name,
                    location: rec.vaccine_lot,
                    appointmentDate: rec.next_dose_date,
                    note: rec.note,
                };
            });

            setVaccinationData((prev) => ({
                ...prev,
                [activeUser]: structuredData,
            }));

            } catch (err) {
            console.error("Lỗi khi tải lịch tiêm:", err);
            toast.error("Không thể tải dữ liệu tiêm chủng");
            }
        };

        fetchVaccinations();
    }, [activeUser]);

   

  //  Hàm tính tuổi hiển thị
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
    return `${years} tuổi ${months} tháng ${days} ngày`;
  };

  const currentUser = users.find((u) => u.id === activeUser);
   // chỉnh sửa ngày sinh của bản thân
    const [editGender, setEditGender] = useState("");
    const [editDOB, setEditDOB] = useState("");
    useEffect(() => {
        if (!currentUser) return;
        setEditGender(currentUser.gender || "Khác");
        setEditDOB(currentUser.dob || "");
    }, [currentUser]);
    const genderOptions = [
        { label: "Nam", icon: "fa-solid fa-mars", color: "tw-text-teal-500" },
        { label: "Nữ", icon: "fa-solid fa-venus", color: "tw-text-pink-500" },
        { label: "Khác", icon: "fa-solid fa-venus-mars", color: "tw-text-orange-500" },
    ];


  // Dữ liệu phòng bệnh
    const [diseases, setDiseases] = useState([]);

    useEffect(() => {
    const fetchDiseases = async () => {
        try {
            const data = await getDiseases();
            setDiseases(data);
        } catch (err) {
            toast.error("Không thể tải danh sách phòng bệnh");
        }
    };
    fetchDiseases();
    }, []);
    // update  mũi 
    const [showUpdate, setShowUpdate] = useState(false);
    const [selectedDisease, setSelectedDisease] = useState(null);
    const [showDiseaseModal, setShowDiseaseModal] = useState(false);

    // bảng tiêm
    const [vaccinationData, setVaccinationData] = useState({}); 

    const handleSaveDose = (diseaseId, doses) => {
        const updated = {};
        doses.forEach((dose, i) => {
            if (dose.date || dose.vaccine || dose.location || dose.appointmentDate) {
            updated[i] = {
                date: dose.date,              // Ngày tiêm
                appointmentDate: dose.appointmentDate, // Ngày hẹn tiêm
                vaccine: dose.vaccine,
                location: dose.location,
                status: getDoseStatus(dose),  // Gọi hàm xác định trạng thái
            }; }
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



    // trạng thái tiêm
    const getDoseStatus = (dose) => {
        const today = new Date();
        if (dose.date) return "Đã tiêm";
        if (dose.appointmentDate) {
            const appoint = new Date(dose.appointmentDate);
            if (appoint > today) return "Chờ tiêm";
            else return "Trễ hẹn";
        }
        return "Chưa tiêm";
    };
    const getStatusStyle = (status) => {
        switch (status) {
            case "Đã tiêm":
            return "tw-bg-green-100 tw-text-green-700";
            case "Chờ tiêm":
            return "tw-bg-blue-100 tw-text-blue-700";
            case "Trễ hẹn":
            return "tw-bg-red-100 tw-text-red-700";
            default:
            return "tw-bg-orange-100 tw-text-orange-700"; // Chưa tiêm
        }
    };

  return (
    <section className="tw-bg-gray-100 tw-py-10 ">
        <div className="tw-container tw-mx-auto tw-px-14 tw-mt-[100px]">
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
                    <div className=" tw-flex tw-justify-between tw-items-center">
                        <div className="tw-flex tw-flex-col">
                            <div className="tw-flex tw-items-center tw-gap-2">
                                <h2 className="tw-font-bold tw-text-2xl tw-bg-gradient-to-r tw-from-pink-500 tw-to-blue-600 tw-bg-clip-text tw-text-transparent tw-pl-16">
                                    {currentUser.fullname}
                                </h2>
                                <i className="fa-solid fa-user-pen tw-text-[#fd812e] tw-text-lg tw-pl-4 tw-mb-3 tw-cursor-pointer hover:tw-text-[#e77d03]"
                                    onClick={() => setIsEditing(true)} ></i>
                            </div>
                            {/* thông tin chỉnh sửa */}
                            {!isEditing && ( <p className="tw-text-gray-700 tw-text-lg"> {currentUser.gender === "male"  ? "Nam" : currentUser.gender === "female"  ? "Nữ" : "Khác"} 
                                · {getAgeText(currentUser.dob)}  </p> )}
                            <p className="tw-text-gray-700 tw-text-lg">{currentUser.relation}</p>

                            {/* Form chỉnh sửa nhỏ */}
                            {isEditing && (
                                <div className="tw-flex tw-gap-4 tw-mt-2 tw-items-center">
                                    {/* Giới tính */}
                                    <div className="tw-w-full">
                                        <p className="tw-mb-2 tw-text-lg tw-font-medium tw-text-gray-700 tw-text-left tw-px-1"> Giới tính </p>
                                        <div className="tw-grid tw-grid-cols-3 tw-gap-2">
                                            {genderOptions.map((opt) => (
                                            <button key={opt.label} type="button"
                                                onClick={() => setEditGender(opt.label)}
                                                className={`tw-flex tw-items-center tw-justify-center tw-gap-1 tw-px-4 tw-py-1 tw-rounded-full tw-border tw-w-full tw-text-lg
                                                ${  editGender === opt.label
                                                    ? "tw-border-[#17bef0] tw-bg-[#e7feff]"
                                                    : "tw-border-gray-300 tw-bg-white"
                                                }`} >
                                                <i className={`${opt.icon} ${opt.color}`}></i>
                                                <span>{opt.label}</span>
                                            </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Ngày sinh */}
                                     <div className="tw-w-full tw-text-left">
                                        <label htmlFor="dob" className="tw-block tw-mb-1 tw-font-medium tw-text-lg  tw-text-gray-700">Ngày sinh</label>
                                        <input  id="dob" type="date"  value={editDOB} onChange={(e) => setEditDOB(e.target.value)}
                                            className="tw-w-full tw-border tw-rounded-lg tw-px-2 tw-py-1 tw-text-gray-700 
                                            hover:tw-border-[#56b6f7] hover:tw-ring-1 hover:tw-ring-[#56b6f7]
                                            focus:tw-outline-none focus:tw-border-[#1999ee] focus:tw-ring-2 focus:tw-ring-[#1999ee]/40"/>
                                    </div>

                                    {/* Nút Lưu */}
                                    <div className="tw-flex tw-justify-end tw-gap-3 tw-mt-8">
                                        <button  onClick={async () => {
                                            try { 
                                                if (!editDOB) {
                                                    toast.error("Vui lòng chọn ngày sinh hợp lệ!");
                                                    return;
                                                }
                                                const payload = {
                                                    date_of_birth: editDOB,
                                                    gender:  editGender === "Nam" ? "male" : editGender === "Nữ"  ? "female" : "other",
                                                };
                                                await updateFamilyMember(currentUser.id, payload);
                                                toast.success("Cập nhật thông tin thành công!");
                                                setUsers((prev) =>
                                                    prev.map((u) =>  u.id === currentUser.id  
                                                    ? { ...u, dob: editDOB, gender: payload.gender,  }  
                                                    : u ) );
                                                setIsEditing(false);
                                            } catch (err) {
                                                toast.error("Không thể cập nhật thông tin, vui lòng thử lại!");
                                            } }} className="tw-px-4 tw-py-1 tw-rounded-lg tw-bg-[#04cac0] tw-text-white hover:tw-bg-[#2ae7de] hover:tw-shadow-md tw-transition-all tw-duration-200" >
                                            Lưu
                                        </button> 
                                        <button  onClick={() => {
                                            setIsEditing(false);
                                            setEditDOB(currentUser.dob || "");
                                            setEditGender(currentUser.gender || "Khác");
                                            }}
                                            className="tw-px-4 tw-py-1 tw-rounded-lg tw-bg-red-500 tw-text-white hover:tw-bg-red-600 hover:tw-shadow-md tw-transition-all tw-duration-200" >
                                            Hủy
                                        </button>                                   
                                    </div>
                                </div>
                            )}
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
                        Nhập  <i className="fa-solid fa-angle-right tw-ml-2"></i>
                    </button>
                </div>
            </div>
            )}

            

            {/* Lịch tiêm */}
            <div className="tw-bg-white  tw-my-[30px] tw-p-5  tw-shadow tw-rounded-2xl tw-px-[20px]">
                <div className="tw-grid tw-grid-cols-6 tw-text-center tw-font-medium tw-text-gray-600 tw-text-xl tw-pb-3 tw-border-b">
                    <span className="tw-text-left">Phòng bệnh</span>
                    <span>Mũi 1</span>
                    <span>Mũi 2</span>
                    <span>Mũi 3</span>
                    <span>Mũi 4</span>
                    <span>Mũi 5</span>
                </div>

                {diseases.map((disease) => (
                    <div
                        key={disease.id}
                        className="tw-grid tw-grid-cols-6 tw-gap-4 tw-text-center tw-items-center tw-border-b tw-border-gray-200 tw-py-3">
                        <div className="tw-text-left tw-text-xl tw-font-medium tw-text-gray-700 tw-pr-2 tw-break-words tw-cursor-pointer hover:tw-text-blue-600"
                            onClick={() => {
                                setSelectedDisease(disease);
                                setShowDiseaseModal(true);
                            }}>
                                {disease.name}
                        </div>
                        
                        {[...Array(disease.doseCount)].map((_, i) => {
                            const doseInfo = vaccinationData[activeUser]?.[disease.id]?.[i];
                            const isVaccinated = !!doseInfo;
                            return (
                                <div  key={i} onClick={() => {
                                    setSelectedDisease(disease);
                                    if (isEditing) {
                                    setShowUpdate(true);
                                    } else {
                                    setShowDetail(true);
                                    }
                                }}
                                className={`tw-rounded-xl tw-flex tw-flex-col tw-items-center tw-justify-center tw-h-[90px] tw-cursor-pointer
                                    ${isVaccinated ? "tw-bg-green-100 tw-text-green-600" : "tw-bg-orange-100 tw-text-orange-600"}`} >
                                {isVaccinated ? (
                                    <div className="tw-flex tw-flex-col tw-items-start">
                                        <span className="tw-font-semibold tw-text-xl">Đã tiêm</span>
                                        <span className="tw-text-lg tw-text-gray-500"> {new Date(doseInfo.date).toLocaleDateString("vi-VN")} </span>
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
                <DiseaseModal
                    selectedDisease={selectedDisease}
                    setShowDiseaseModal={setShowDiseaseModal}
                />
                )}

                {showDetail && selectedDisease && (
                    <DetailDose disease={selectedDisease} onClose={() => setShowDetail(false)} />
                )}


            </div>

            </div>
        </div>
    </section>
  );
}
