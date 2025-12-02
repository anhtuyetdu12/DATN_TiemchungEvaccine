// Sổ tiêm chủng  
import { useState, useEffect, useCallback } from "react";
import UpdateDose from "./modal/RecordBook/UpdateDose";
import AddUserForm from "./modal/RecordBook/AddUserForm";
import DiseaseModal from "./modal/RecordBook/DiseaseModal";
import DetailDose from "./modal/RecordBook/DetailDose";
import { getFamilyMembers,  getVaccinationRecords , updateFamilyMember ,updateDiseaseHistory } from "../../services/recordBookService";
import { toast } from "react-toastify";
import { getVaccinesByAge } from "../../services/recordBookService";
import { useLocation , useNavigate  } from "react-router-dom";
import Pagination from "../../components/Pagination";
import ConfirmModal from "../../components/ConfirmModal";


// Nhóm danh sách vắc xin theo bệnh (từ API by-age)
const buildDiseasesByAge = (ageVaccines) => {
  const map = {};
  (ageVaccines || []).forEach((v) => {
    const d = v.disease;
    if (!d || !d.id) return;
    // số liều của vắc xin này (tuỳ BE, bạn đổi sang field đúng: doses_required / dose_count / regimen_doses...)
    const dosesRequired =
      Number(v.doses_required ?? v.doseCount ?? v.dose_count ?? d.doseCount ?? 1) || 1;
    if (!map[d.id]) {
      map[d.id] = {
        ...d,
        vaccines: [],
        // khởi tạo doseCount = số liều của vaccine đầu tiên
        doseCount: dosesRequired,
      };
    } else {
      // luôn lấy max số liều trong các loại vaccine của cùng bệnh
      map[d.id].doseCount = Math.max(map[d.id].doseCount || 1, dosesRequired);
    }
    map[d.id].vaccines.push(v);
  });
  return Object.values(map);
};


const buildVaccinationMap = (records) => {
  const structuredData = {};
  records.forEach((rec) => {
    if (!rec.vaccination_date && !rec.next_dose_date) return;
    const diseaseId =
      rec?.disease?.id ??
      rec?.disease_id ??
      rec?.vaccine?.disease?.id ??
      rec?.vaccine_name ??
      "";
    if (!diseaseId) return;

    if (!structuredData[diseaseId]) structuredData[diseaseId] = {};
    const rawDose = Number(rec?.dose_number);
    const doseIndex = Number.isFinite(rawDose) && rawDose > 0 ? rawDose - 1 : 0;
    const current = structuredData[diseaseId][doseIndex];
    const newDose = {
        date: rec.vaccination_date,
        vaccine: rec.vaccine?.name || rec.vaccine_name || "",
        location: rec.vaccine_lot,
        appointmentDate: rec.next_dose_date,
        note: rec.note,
        status_label: rec.status_label,
        locked: !!(rec.locked || rec.from_booking),
    };
    // Nếu chưa có gì thì nhận luôn
    if (!current) {
      structuredData[diseaseId][doseIndex] = newDose;
      return;
    }
    const currentHasShot = !!current.date;
    const newHasShot = !!newDose.date;
    // 1 Đã có mũi ĐÃ TIÊM rồi mà bản mới chỉ là lịch hẹn → bỏ qua
    if (currentHasShot && !newHasShot) {
      return;
    }
    // 2 Bản mới có ngày tiêm, bản cũ chưa có → cho ghi đè
    if (newHasShot && !currentHasShot) {
      structuredData[diseaseId][doseIndex] = newDose;
      return;
    }
    //3 Cả hai đều là đã tiêm → lấy ngày tiêm mới hơn
    if (newHasShot && currentHasShot) {
      if (
        newDose.date &&
        (!current.date || new Date(newDose.date) > new Date(current.date))
      ) {
        structuredData[diseaseId][doseIndex] = newDose;
      }
      return;
    }
    // 4 Cả hai đều là mũi CHƯA TIÊM (chỉ có hẹn)
    const isReschedule = rec.note && rec.note.includes("Đặt lại lịch");
    const hasNewerAppt =
      newDose.appointmentDate &&
      (!current.appointmentDate ||
        new Date(newDose.appointmentDate) > new Date(current.appointmentDate));

    if (isReschedule || hasNewerAppt) {
      structuredData[diseaseId][doseIndex] = newDose;
    }
  });
  return structuredData;
};


export default function RecordBook() {
    // Danh sách thành viên trong sổ tiêm chủng
    const [users, setUsers] = useState([]);
    const [activeUser, setActiveUser] = useState(null);
    const [showAddForm, setShowAddForm] = useState(false);
    const [showDetail, setShowDetail] = useState(false);
    const [isEditing, setIsEditing] = useState(false); // nút chỉnh sửa
    // Gợi ý vắc xin theo tuổi
    const [ageVaccines, setAgeVaccines] = useState([]);
    const [showMoreAgeVax, setShowMoreAgeVax] = useState(false);
    const navigate = useNavigate();
    const [editChronicNote, setEditChronicNote] = useState("");
    const [confirmDelete, setConfirmDelete] = useState({
        open: false,
        diseaseId: null,
        doseIndex: null,
    });

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
                chronic_note: m.chronic_note || "",
            }));
            setUsers(formatted);
            const params = new URLSearchParams(window.location.search);
            const queryId = params.get("member");
            if (!queryId) {
            const defaultUser = formatted.find((u) => u.relation === "Bản thân") || formatted[0];
            if (defaultUser) setActiveUser(defaultUser.id);
            }
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
            chronic_note: newMember.chronic_note || "",
        };
        setUsers((prev) => [...prev, formattedMember]);
        setActiveUser(newMember.id);
        const u = new URL(window.location.href);
        u.searchParams.set("member", String(newMember.id));
        window.history.replaceState({}, "", u);
        setShowAddForm(false);
    };
    const location = useLocation();

    useEffect(() => {
        if (!users.length) return;
        const params = new URLSearchParams(location.search);
        const queryId = params.get("member");
        const byQuery = queryId ? users.find(u => String(u.id) === String(queryId)) : null;
        if (byQuery) {
            setActiveUser(byQuery.id);
            return;
        }
        // fallback nếu chưa có activeUser (lần đầu) mới set
        if (!activeUser) {
            const fallback = users.find(u => u.relation === "Bản thân") || users[0];
            if (fallback) setActiveUser(fallback.id);
        }
    }, [users, location.search, activeUser]);

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
        setEditChronicNote(currentUser.chronic_note || ""); 
    }, [currentUser]);
    const genderOptions = [
        { label: "Nam", icon: "fa-solid fa-mars", color: "tw-text-teal-500" },
        { label: "Nữ", icon: "fa-solid fa-venus", color: "tw-text-pink-500" },
        { label: "Khác", icon: "fa-solid fa-venus-mars", color: "tw-text-orange-500" },
    ];

    //  DANH SÁCH PHÒNG BỆNH THEO ĐỘ TUỔI THÀNH VIÊN
    const [diseasesByAge, setDiseasesByAge] = useState([]);
    const [diseasePage, setDiseasePage] = useState(1);
    const DISEASES_PER_PAGE = 10;
    // gợi ý theo tuổi của activeUser
    useEffect(() => {
    if (!activeUser || !currentUser?.dob) return;
    (async () => {
        try {
        const data = await getVaccinesByAge(activeUser); // không truyền diseaseId -> list tổng quát
        setAgeVaccines(data?.vaccines || []);
        } catch (err) {
        console.error("by-age error:", err?.response || err);
        setAgeVaccines([]);
        const msg =
            err?.response?.data?.error ||
            err?.response?.data?.detail ||
            (err?.response ? `Lỗi ${err.response.status}` : "Lỗi mạng/CORS");
        toast.error(msg);
        }
    })();
    }, [activeUser, currentUser?.dob]);

    // từ danh sách vắc xin theo tuổi → group thành danh sách bệnh theo tuổi
    useEffect(() => {
        const grouped = buildDiseasesByAge(ageVaccines);
        //sxep len đầu bệnh mới
        grouped.sort((a, b) => {
            if (a.created_at && b.created_at) {
            return new Date(b.created_at) - new Date(a.created_at); // mới nhất trước
            }
            return (b.id || 0) - (a.id || 0);
        });
        setDiseasesByAge(grouped);
        setDiseasePage(1); 
    }, [ageVaccines]);

    // update  mũi 
    const [showUpdate, setShowUpdate] = useState(false);
    const [selectedDisease, setSelectedDisease] = useState(null);
    const [showDiseaseModal, setShowDiseaseModal] = useState(false);

    // bảng tiêm
    const [vaccinationData, setVaccinationData] = useState({}); 
    const reloadVaccinations = useCallback(async (memberId) => {
        if (!memberId) return;
        try {
        const records = await getVaccinationRecords(memberId);
        const structured = buildVaccinationMap(records);
        setVaccinationData((prev) => ({
            ...prev,
            [memberId]: structured,
        }));
        } catch (err) {
        console.error(err);
        toast.error("Không thể tải dữ liệu tiêm chủng");
        }
    }, []);

    useEffect(() => {
        if (!activeUser) return;
        // dùng đúng hàm chung
        reloadVaccinations(activeUser);
    }, [activeUser, reloadVaccinations]);

    // Trạng thái mũi
    const getDoseStatus = (dose) => {
        const shot = dose?.date ? toYMD(dose.date) : "";
        const appt = dose?.appointmentDate ? toYMD(dose.appointmentDate) : "";
        const todayYMD = toYMD(new Date());
        // 1. Mũi đã tiêm
        if (shot) return "Đã tiêm";
        // 2. Có ngày hẹn thì CLIENT tự tính luôn
        if (appt) {
            if (appt < todayYMD) return "Trễ hẹn";   // quá ngày hẹn
            return "Chờ tiêm";                       // hôm nay hoặc tương lai
        }
        // 3. Không có ngày hẹn → fallback theo status_label (cho dữ liệu cũ)
        if (dose?.status_label === "Trễ hẹn") return "Trễ hẹn";
        if (dose?.status_label === "Chờ tiêm") return "Chờ tiêm";
        // 4. Mặc định
        return "Chưa tiêm";
    };

    const handleSaveDose = (diseaseId, doses) => {
        const updated = {};
        doses.forEach((dose, i) => {
            if (dose.date || dose.vaccine || dose.location || dose.appointmentDate) {
            updated[i] = {
                date: dose.date,              // Ngày tiêm
                appointmentDate: dose.appointmentDate, // Ngày hẹn tiêm
                vaccine: dose.vaccine,
                location: dose.location,
                status: getDoseStatus(dose), 
                locked: !!dose.locked,
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

    // xoá 1 mũi trong CSDL khi đang ở chế độ Chỉnh sửa
    const deleteSingleDose = async (diseaseId, doseIndex) => {
        const memberId = activeUser;
        if (!memberId) return;

        const userMap = vaccinationData[memberId] || {};
        const diseaseKey = String(diseaseId);
        const diseaseMap = userMap[diseaseKey] || {};

        const dosesArray = Object.keys(diseaseMap)
            .map((k) => Number(k))
            .sort((a, b) => a - b)
            .map((k) => diseaseMap[k]);

        const targetDose = dosesArray[doseIndex];

        if (targetDose?.locked) {
            toast.warn(
            "Mũi này được ghi nhận từ cơ sở y tế / từ đơn đặt lịch, không thể xoá."
            );
            return;
        }

        // Mảng mũi sau khi xoá mũi target
        const newDoses = dosesArray.filter((_, idx) => idx !== doseIndex);

        try {
            // Gửi lại toàn bộ danh sách mũi còn lại, giữ nguyên cả ngày hẹn
            await updateDiseaseHistory({
            memberId,
            diseaseId,
            doses: newDoses.map((d) => ({
                // ngày tiêm
                date: d.date ? toYMD(d.date) : "",
                // ngày hẹn (sẽ được map sang next_dose_date trong service)
                appointmentDate: d.appointmentDate ? toYMD(d.appointmentDate) : "",
                vaccine: d.vaccine || "",
                location: d.location || "",
                note: d.note || "",
                status_label: d.status_label || "",
            })),
            });

            toast.success("Xoá mũi tiêm thành công!");

            // Cập nhật lại state local cho khớp với DB
            setVaccinationData((prev) => {
            const prevUserMap = { ...(prev[memberId] || {}) };
            const nextUserMap = { ...prevUserMap };

            if (newDoses.length === 0) {
                // Không còn mũi nào → xoá luôn bệnh này khỏi map
                delete nextUserMap[diseaseKey];
            } else {
                const compact = {};
                newDoses.forEach((d, idx) => {
                compact[idx] = d; // nén lại 0..n-1
                });
                nextUserMap[diseaseKey] = compact;
            }

            return {
                ...prev,
                [memberId]: nextUserMap,
            };
            });
        } catch (err) {
            console.error("Lỗi xoá mũi tiêm:", err);
            const msg =
            err?.response?.data?.detail ||
            err?.response?.data?.doses ||
            "Xoá mũi tiêm thất bại. Vui lòng thử lại.";
            toast.error(msg);
        }
    };


    const handleConfirmDeleteDose = async () => {
        const { diseaseId, doseIndex } = confirmDelete;
        // Đóng modal trước để UI phản hồi nhanh
        setConfirmDelete((prev) => ({ ...prev, open: false }));
        if (diseaseId == null || doseIndex == null) return;
        // Gọi hàm xoá thật sự (có gọi API + update state)
        await deleteSingleDose(diseaseId, doseIndex);
    };

    const handleCancelDeleteDose = () => {
        setConfirmDelete({
            open: false,
            diseaseId: null,
            doseIndex: null,
        });
    };


    const toYMD = (d) => {
        if (!d) return "";
        const t = new Date(d);
        const yyyy = t.getFullYear();
        const mm = String(t.getMonth() + 1).padStart(2, "0");
        const dd = String(t.getDate()).padStart(2, "0");
        return `${yyyy}-${mm}-${dd}`;
    };
    const fmtVN = (d) => d ? new Date(d).toLocaleDateString("vi-VN") : "";
    // Danh sách hiển thị 6 hoặc toàn bộ (gợi ý theo tuổi)
    const displayedVaccines = showMoreAgeVax ? ageVaccines : ageVaccines.slice(0, 6);

    //PHÂN TRANG CHO SỔ TIÊM DỰA THEO BỆNH PHÙ HỢP ĐỘ TUỔI
    const totalDiseases = diseasesByAge.length;
    const diseaseStartIndex = (diseasePage - 1) * DISEASES_PER_PAGE;
    const diseaseEndIndex = diseaseStartIndex + DISEASES_PER_PAGE;
    const pagedDiseases = diseasesByAge.slice(diseaseStartIndex, diseaseEndIndex);

  return (
    <section className="tw-bg-gray-100 tw-py-10 ">
        <div className=" tw-container tw-mx-auto tw-px-16 tw-max-w-[1300px] tw-mt-[100px] ">
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
            <div className="tw-container  tw-max-w-[1300px] tw-mx-auto tw-px-6 lg:tw-px-14">
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
                    <button key={user.id} onClick={() => {
                             setActiveUser(user.id);
                             const u = new URL(window.location.href);
                             u.searchParams.set("member", String(user.id));
                             window.history.replaceState({}, "", u);
                   }}
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
                            {/* thông tin hiển thị khi KHÔNG chỉnh sửa */}
                            {!isEditing && (
                            <>
                                <p className="tw-text-gray-700 tw-text-lg"> {currentUser.gender || "Khác"} · {getAgeText(currentUser.dob)} </p>
                                <p className="tw-text-gray-700 tw-text-lg"> {currentUser.relation} </p>
                                {currentUser.chronic_note && (
                                    <p className="tw-text-pink-700 tw-text-lg"> Bệnh nền: {currentUser.chronic_note}</p>
                                )}
                            </>
                            )}
                            {/* Form chỉnh sửa nhỏ */}
                            {isEditing && (
                                <div className="tw-mt-4 tw-pt-4 tw-border-t tw-border-blue-200">
                                    <div className="tw-w-[800px] tw-mx-auto tw-space-y-6">
                                    <p className="tw-text-base tw-font-semibold tw-text-blue-700 tw-text-center">
                                        Cập nhật thông tin cá nhân
                                    </p>
                                    <div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-2 tw-gap-8">
                                        {/* cột trái */}
                                        <div className="tw-space-y-4 tw-ml-[150px]">
                                            {/* Giới tính  */}
                                            <div className="tw-flex tw-flex-col tw-items-center tw-gap-2">
                                                <p className="tw-text-base tw-font-medium tw-text-gray-700"> Giới tính</p>
                                                <div className="tw-w-full tw-grid tw-grid-cols-3 tw-gap-2">
                                                {genderOptions.map((opt) => (
                                                    <button key={opt.label}  type="button"  onClick={() => setEditGender(opt.label)}
                                                        className={`tw-flex tw-items-center tw-justify-center tw-gap-1 tw-px-3 tw-py-2 tw-rounded-full tw-border tw-text-base
                                                            ${ editGender === opt.label
                                                                ? "tw-border-[#17bef0] tw-bg-[#e7feff]"
                                                                : "tw-border-gray-300 tw-bg-white hover:tw-border-[#56b6f7]"
                                                            }`}>
                                                        <i className={`${opt.icon} ${opt.color}`}></i>
                                                        <span>{opt.label}</span>
                                                    </button>
                                                ))}
                                                </div>
                                            </div>
                                            {/* Ngày sinh  */}
                                            <div className="tw-flex tw-flex-col tw-items-center ">
                                                <label htmlFor="dob" className="tw-text-base tw-font-medium tw-text-gray-700" >
                                                    Ngày sinh
                                                </label>
                                                <input id="dob" type="date" value={editDOB}
                                                    onChange={(e) => setEditDOB(e.target.value)}
                                                    className="tw-w-full tw-border tw-rounded-xl tw-px-3 tw-py-2 tw-text-base tw-text-gray-700 
                                                                hover:tw-border-[#56b6f7] hover:tw-ring-1 hover:tw-ring-[#56b6f7]
                                                                focus:tw-outline-none focus:tw-border-[#1999ee] focus:tw-ring-2 focus:tw-ring-[#1999ee]/40"
                                                />
                                            </div>
                                        </div>
                                        {/* CỘT PHẢI */}
                                        <div className="tw-flex tw-flex-col tw-h-full">
                                            <label className="tw-block tw-mb-2 tw-text-base tw-font-medium tw-text-gray-700 tw-text-center">
                                                Bệnh nền / tiền sử bệnh
                                            </label>
                                            <textarea value={editChronicNote}  onChange={(e) => setEditChronicNote(e.target.value)}
                                                placeholder="VD: Tăng huyết áp, đái tháo đường, hen suyễn..."
                                                className="tw-flex-1 tw-border tw-rounded-xl tw-px-3 tw-py-2 tw-text-base tw-text-gray-700  tw-resize-none 
                                                        tw-min-h-[75px] tw-w-[340px] hover:tw-border-[#56b6f7] hover:tw-ring-1 hover:tw-ring-[#56b6f7] 
                                                        focus:tw-outline-none focus:tw-border-[#1999ee] focus:tw-ring-2 focus:tw-ring-[#1999ee]/40"
                                            />                                       
                                        </div>
                                        {/* Nút hành động */}
                                        <div className="md:tw-col-span-2 tw-flex tw-justify-center tw-gap-3">
                                            <button onClick={async () => {
                                                try {
                                                    if (!editDOB) {
                                                        toast.error("Vui lòng chọn ngày sinh hợp lệ!");
                                                        return;
                                                    }
                                                    const payload = {
                                                        date_of_birth: editDOB,
                                                        gender:
                                                        editGender === "Nam" ? "male" : editGender === "Nữ" ? "female" : "other",
                                                        chronic_note: editChronicNote,
                                                    };
                                                    await updateFamilyMember(currentUser.id, payload);
                                                    toast.success("Cập nhật thông tin thành công!");
                                                    setUsers((prev) =>
                                                        prev.map((u) =>
                                                        u.id === currentUser.id
                                                            ? {  ...u,
                                                                dob: editDOB,
                                                                gender:
                                                                payload.gender === "male" ? "Nam" : payload.gender === "female" ? "Nữ": "Khác",
                                                                chronic_note: editChronicNote,
                                                            }: u
                                                        )
                                                    );
                                                    setIsEditing(false);
                                                    } catch (err) {
                                                        toast.error("Không thể cập nhật thông tin, vui lòng thử lại!");
                                                    }
                                                }}
                                                className="tw-inline-flex tw-items-center tw-justify-center
                                                            tw-min-w-[100px] tw-px-4 tw-py-2 tw-rounded-full
                                                            tw-bg-[#04cac0] tw-text-white tw-text-base tw-font-semibold
                                                            hover:tw-bg-[#2ae7de] hover:tw-shadow-md tw-transition-all tw-duration-200">
                                                Lưu
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setIsEditing(false);
                                                    setEditDOB(currentUser.dob || "");
                                                    setEditGender(currentUser.gender || "Khác");
                                                    setEditChronicNote(currentUser.chronic_note || "");
                                                }}
                                                className="tw-inline-flex tw-items-center tw-justify-center tw-min-w-[100px] tw-px-4 tw-py-2 tw-rounded-full
                                                            tw-bg-red-500 tw-text-white tw-text-base tw-font-semibold
                                                            hover:tw-bg-red-600 hover:tw-shadow-md tw-transition-all tw-duration-200" >
                                                Hủy
                                            </button>
                                        </div>
                                    </div>
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
                    {/* gợi ý theo tuổi của activeUser */}
                    <p className="tw-text-3xl tw-text-[#1a237e] tw-pt-8 tw-font-semibold">Gợi ý vắc xin phù hợp với độ tuổi</p>
                    <div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-2 lg:tw-grid-cols-3 tw-gap-5 tw-py-8 tw-px-5">
                        {displayedVaccines.map((v) => (
                            <div key={v.id} onClick={() => navigate(`/vaccines/${v.slug}`)}
                                className="tw-bg-white tw-rounded-xl tw-shadow-sm tw-p-3 tw-flex tw-items-center tw-gap-5 
                                        tw-cursor-pointer hover:tw-shadow-md hover:tw-scale-[1.02] tw-transition"  >
                                <div className="tw-w-[96px] tw-h-[64px] tw-flex tw-items-center tw-justify-center tw-rounded-lg tw-bg-white">
                                    <img  src={v.image || "/images/no-image.jpg"} alt={v.name}
                                        className="tw-max-w-full tw-max-h-full tw-object-contain tw-rounded-md" />
                                </div>

                                <div className="tw-text-left tw-min-w-0">
                                    <p className="tw-font-semibold tw-truncate">{v.name}</p>
                                    <p className="tw-text-gray-500 tw-truncate">{v.disease?.name}</p>
                                    {v.formatted_price && (
                                    <p className="tw-text-orange-500 tw-font-semibold">{v.formatted_price}</p>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* NÚT XEM THÊM / THU GỌN */}
                    {ageVaccines.length > 6 && (
                        <div className="tw-flex tw-justify-center tw-mb-4">
                            <button onClick={() => setShowMoreAgeVax(!showMoreAgeVax)}
                            className="tw-flex tw-items-center tw-gap-2 tw-px-6 tw-py-2 tw-rounded-full tw-text-blue-700 tw-font-medium  tw-transition">
                            {showMoreAgeVax ? ( <>
                                <span>Thu gọn</span>
                                <i className="fa-solid fa-angles-up"></i> </>
                            ) : ( <>
                                <span>Xem thêm</span>
                                <i className="fa-solid fa-angles-down"></i></>
                            )}
                            </button>
                        </div>
                    )}

                </div>
            )}
            {/* Lịch tiêm */}
            <div  id="record-book-schedule"  className="tw-bg-white  tw-my-[30px] tw-p-5  tw-shadow tw-rounded-2xl tw-px-[20px]">
                <div className="tw-grid tw-grid-cols-6 tw-text-center tw-font-medium tw-text-gray-600 tw-text-xl tw-pb-3 tw-border-b">
                    <span className="tw-text-left">Phòng bệnh</span>
                    <span>Mũi 1</span>
                    <span>Mũi 2</span>
                    <span>Mũi 3</span>
                    <span>Mũi 4</span>
                    <span>Mũi 5</span>
                </div>
                {pagedDiseases.map((disease) => (
                    <div  key={disease.id} className="tw-grid tw-grid-cols-6 tw-gap-4 tw-text-center tw-items-center tw-border-b tw-border-gray-200 tw-py-3">
                        <div className="tw-text-left tw-text-xl tw-font-medium tw-text-gray-700 tw-pr-2 tw-break-words tw-cursor-pointer hover:tw-text-blue-600"
                            onClick={() => {  setSelectedDisease(disease); setShowDiseaseModal(true);  }}>
                            <div>{disease.name}</div>
                        </div>
                        
                     {Array.from({ length: disease.doseCount || 1 }).map((_, i) => {
                        const doseInfo = vaccinationData[activeUser]?.[String(disease.id)]?.[i];
                        const status = getDoseStatus(doseInfo || {}); // nếu không có record → "Chưa tiêm"
                        const boxClass = status === "Đã tiêm" ? "tw-bg-green-100 tw-text-green-600"
                            : status === "Chờ tiêm" ? "tw-bg-[#ddf1f9] tw-text-blue-600"
                            : status === "Trễ hẹn" ? "tw-bg-red-100 tw-text-red-600"
                            : "tw-bg-orange-100 tw-text-orange-600";
                        const apptStr = doseInfo?.appointmentDate ? fmtVN(doseInfo.appointmentDate) : "";
                        const shotStr = doseInfo?.date ? fmtVN(doseInfo.date) : "";
                        const title = status === "Đã tiêm" ? "Đã tiêm"
                            : status === "Chờ tiêm" ? "Chờ tiêm"
                            : status === "Trễ hẹn"? "Trễ hẹn"  : "Chưa tiêm";
                        const dateLine = status === "Đã tiêm" ? shotStr
                            : status === "Chờ tiêm" ? apptStr
                            : status === "Trễ hẹn" ? apptStr: "";
                        const openUpdate = (e) => {
                            e?.stopPropagation?.();
                            setSelectedDisease({ ...disease, selectedDoseNumber: i + 1 });
                            setShowUpdate(true);
                        };
                        return (
                            <div key={i}  onClick={() => {
                                setSelectedDisease({
                                ...disease,
                                selectedDoseNumber: i + 1,
                                selectedDoseStatus: status,
                                });
                                isEditing ? setShowUpdate(true) : setShowDetail(true);
                            }}
                            className={`tw-relative tw-rounded-xl tw-h-[90px] tw-cursor-pointer ${boxClass}
                                        tw-flex tw-items-center tw-justify-center tw-text-center`}>
                            <div className="tw-flex tw-flex-col tw-items-center tw-justify-center">
                                {status === "Chưa tiêm" && !isEditing ? (
                                    <span className="tw-font-semibold tw-text-[14px]"> Chưa tiêm</span>
                                ) : isEditing && status === "Chưa tiêm" ? (
                                <div className="tw-w-10 tw-h-10 tw-flex tw-items-center tw-justify-center tw-rounded-full tw-border-2 tw-bg-orange-500 tw-border-orange-500">
                                    <i className="fa-solid fa-plus tw-text-lg tw-text-white"></i>
                                </div>
                                ) : (
                                <>
                                    <span className="tw-font-semibold tw-text-[14px]">  {title} </span>
                                    {dateLine && (
                                        <span className="tw-text-lg tw-font-medium tw-text-gray-700 tw-mt-0.5"> {dateLine} </span>
                                    )}
                                </>
                                )}
                            </div>

                            {isEditing && status !== "Chưa tiêm" && !doseInfo?.locked && (
                                <div className="tw-absolute tw-top-2 tw-right-2 tw-flex tw-gap-2">
                                <button title="Chỉnh sửa mũi này" onClick={openUpdate} className="tw-text-blue-600 hover:tw-text-blue-800">
                                    <i className="fa-solid fa-pen-to-square"></i>
                                </button>
                                <button title="Xoá mũi này"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setConfirmDelete({
                                        open: true,
                                        diseaseId: disease.id,
                                        doseIndex: i,
                                        });
                                    }}
                                    className="tw-text-red-600 hover:tw-text-red-700">
                                    <i className="fa-solid fa-trash-can"></i>
                                </button>
                                </div>
                            )}
                            </div>
                        );
                        })}

                       {Array.from({ length: Math.max(0, 5 - disease.doseCount) }).map((_, i) => (
                            <div key={`empty-${i}`} />
                        ))}
                    </div>
                ))}
                <Pagination
                    page={diseasePage}  totalItems={totalDiseases}
                    perPage={DISEASES_PER_PAGE}
                    onPageChange={(nextPage) => {
                        setDiseasePage(nextPage);
                        // cuộn lên đầu bảng mỗi khi đổi trang
                        const el = document.getElementById("record-book-schedule");
                        if (el) {
                            el.scrollIntoView({ behavior: "smooth", block: "start" });
                        }
                    }}
                />
               {showUpdate && selectedDisease && (
                <UpdateDose
                    disease={{ ...selectedDisease, maxDoses: selectedDisease.doseCount }}
                    memberId={currentUser.id}   
                    selectedDoseNumber={selectedDisease.selectedDoseNumber}
                    initialDoses={(() => {
                    const map = vaccinationData[activeUser]?.[String(selectedDisease.id)] || {};
                    // ép về mảng theo thứ tự chỉ số 0..n-1
                    return Object.keys(map)
                        .map(k => Number(k))
                        .sort((a,b) => a - b)
                        .map((k, idx) => ({
                        id: idx + 1,
                            date: map[k]?.date ? String(map[k].date).slice(0,10) : "",
                            vaccine: map[k]?.vaccine || "",
                            location: map[k]?.location || "",
                            locked: !!map[k]?.locked,   
                            open: false,
                        }));
                    })()}
                    onClose={() => setShowUpdate(false)}
                    onSave={handleSaveDose}
                />
                )}
                {showDiseaseModal && selectedDisease && currentUser && (
                    <DiseaseModal
                        selectedDisease={selectedDisease}
                        setShowDiseaseModal={setShowDiseaseModal} 
                        memberId={currentUser.id}  
                    />
                )}
                {showDetail && selectedDisease && currentUser && (
                    <DetailDose
                        disease={selectedDisease}
                        memberId={currentUser.id}   
                        onClose={() => setShowDetail(false)}
                    />
                )}

                <ConfirmModal
                    show={confirmDelete.open}  title="Xác nhận xoá mũi tiêm"
                    message="Bạn có chắc chắn muốn xoá mũi tiêm này khỏi sổ tiêm chủng? Thao tác này không thể hoàn tác."
                    confirmText="Xoá" cancelText="Hủy"
                    onConfirm={handleConfirmDeleteDose} onCancel={handleCancelDeleteDose}
                />

            </div>
            </div>
        </div>

    </section>
  );
}
