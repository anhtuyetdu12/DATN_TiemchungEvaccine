import { useMemo, useState , useEffect} from "react";
import { toast } from "react-toastify";
import { Link, useLocation } from "react-router-dom";
import { SELECTED_EVENT } from "../../utils/selectedVaccines";
import SelectCustomerModal from "./modal/bookingVaccine/SelectCustomerModal";
import QuantityPillBooking from "../../components/QuantityPillBooking";
import { createBooking, getRemainingDoses } from "../../services/bookingService";
import { getFamilyMembers } from "../../services/recordBookService";
import { getVaccineBySlug , getPackageBySlug } from "../../services/vaccineService";
import {formatSchedule} from "../../utils/schedule";
import ConfirmModal from "../../components/ConfirmModal";
import { useNavigate } from "react-router-dom";
import { loadAuth } from "../../utils/authStorage";
// import ChatWidget from "../../components/ChatWidget";
import {readBooking, writeBooking, clearBooking, migrateLegacyBooking, getBookingSlugs} from "../../utils/bookingStorage";

const EMPTY_BOOKING_TOAST_ID = "empty-booking";

export default function BookingForm() {
  const [openModal, setOpenModal] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const location = useLocation();
  const [items, setItems] = useState([]);               
  const [loading, setLoading] = useState(true);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState(null);
  const navigate = useNavigate();
  const { user, access } = loadAuth();

  // Guard: chưa đăng nhập -> chuyển sang /login và giữ lại URL để quay về
  useEffect(() => {
    if (!access || !user) {
      const ret = encodeURIComponent(window.location.pathname + window.location.search);
      navigate(`/login?next=${ret}`, { replace: true });
    } else {
      // Nếu vừa đăng nhập, gom cart cũ (nếu có) sang key theo user
      migrateLegacyBooking();
    }
  }, [access, user, navigate]);


  // Helper hiển thị tuổi
  const calculateAgeDetail = (dob) => {
    const birthDate = new Date(dob); const today = new Date();
    let years = today.getFullYear() - birthDate.getFullYear();
    let months = today.getMonth() - birthDate.getMonth();
    let days = today.getDate() - birthDate.getDate();
    if (days < 0) { months -= 1; days += new Date(today.getFullYear(), today.getMonth(), 0).getDate(); }
    if (months < 0) { years -= 1; months += 12; }
    return `${years} Tuổi ${months} Tháng ${days} Ngày`;
  };

  // tuổi tính theo THÁNG (dễ so min/max)
  const getAgeInMonths = (dobStr) => {
    if (!dobStr) return null;
    const dob = new Date(dobStr);
    const today = new Date();

    let years = today.getFullYear() - dob.getFullYear();
    let months = today.getMonth() - dob.getMonth();
    if (today.getDate() < dob.getDate()) months -= 1;

    const totalMonths = years * 12 + months;
    return Math.max(totalMonths, 0);
  };

  // v: 1 item vắc xin trong state items (đã có min_age, max_age, age_unit)
  const isVaccineAllowedForAge = (v, ageMonths) => {
    if (ageMonths == null) return true; // chưa biết tuổi -> tạm cho qua

    const unit = v.age_unit || "tuổi";               // "tháng" | "tuổi"
    const min = v.min_age != null ? Number(v.min_age) : null;
    const max = v.max_age != null ? Number(v.max_age) : null;

    const minMonths = min == null ? null : (unit === "tháng" ? min : min * 12);
    const maxMonths = max == null ? null : (unit === "tháng" ? max : max * 12);

    if (minMonths != null && ageMonths < minMonths) return false;
    if (maxMonths != null && ageMonths > maxMonths) return false;
    return true;
  };


  const selectedAgeMonths = useMemo(
    () => selectedCustomer?.dob ? getAgeInMonths(selectedCustomer.dob) : null,
    [selectedCustomer?.dob]
  );

  // Khi đổi người tiêm -> đánh dấu vắc xin có phù hợp độ tuổi không
  useEffect(() => {
    if (selectedAgeMonths == null || items.length === 0) return;

    setItems(prev =>
      prev.map(it => {
        const ok = isVaccineAllowedForAge(it, selectedAgeMonths);
        return {
          ...it,
          ageEligible: ok,
          // nếu không phù hợp tuổi thì không cho tăng liều
          maxDoses: ok ? it.maxDoses : 0,
          note: !ok
            ? "Vắc xin này không phù hợp với độ tuổi hiện tại của người tiêm."
            : it.note,
        };
      })
    );
  }, [selectedAgeMonths, items.length]);

  const todayLocal = new Date(Date.now() - new Date().getTimezoneOffset()*60000).toISOString().slice(0,10);
  
  // tính tổng tiền
  const fmt = (n) => (Number(n) || 0).toLocaleString("vi-VN");

  // ---- Tính tiền theo items (chỉ tính những mục còn được đặt: maxDoses !== 0)
  const lineItems = useMemo(() => {
    return (items || [])
      .filter(it => (it.maxDoses ?? 1) !== 0)                 // nếu đã đủ liều thì không tính
      .map(it => ({
        id: it.id,
        lineTotal: (Number(it.price) || 0) * (it.qty || 1),   // đơn giá * số liều
      }));
  }, [items]);

  const subtotal = useMemo(() => {
    return lineItems.reduce((s, v) => s + v.lineTotal, 0);
  }, [lineItems]);

  const total = useMemo(() => subtotal, [subtotal]);

  // Load danh sách người tiêm (thành viên)
    useEffect(() => {
      (async () => {
        try {
          const list = await getFamilyMembers(); // [{id, full_name, gender, date_of_birth,...}]
          const mapped = (list || []).map(m => ({
            id: m.id,
            name: m.full_name,
            gender: m.gender === "male" ? "Nam" : m.gender === "female" ? "Nữ" : "Khác",
            dob: m.date_of_birth,
          }));
          setCustomers(mapped);
          // ƯU TIÊN id từ URL (?member=)
          const params = new URLSearchParams(location.search);
          const memberParam = params.get("member");
          const wanted = memberParam  ? mapped.find(x => String(x.id) === String(memberParam)) : null;
          setSelectedCustomer(prev => wanted ?? prev ?? (mapped[0] || null));
        } catch (e) {
          console.error(e);
          // Không chặn booking nếu lỗi – chỉ thông báo
          toast.error("Không tải được danh sách người tiêm.");
        }
        })();
    }, [location.search])

  // ===== NEW: đọc giỏ + URL và fetch chi tiết
  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams(window.location.search);
        const urlSlugs = (params.get("v") || "")
          .split(",").map(s => s.trim()).filter(Boolean);

        // Đọc giỏ chuẩn {slug, qty}
        const lsItems = readBooking();                 // [{slug, qty}]
        const lsMap = new Map(lsItems.map(i => [i.slug, i.qty]));
 
        // Từ URL chỉ có slug => mặc định qty=1
        urlSlugs.forEach(s => {
          if (!lsMap.has(s)) lsMap.set(s, 1);
        });
        const mergedItems = [...lsMap.entries()].map(([slug, qty]) => ({ slug, qty }));

        // Map thời điểm thêm (để sort)
        const base = Date.now();
        const addedAtMap = new Map(mergedItems.map((it, i) => [it.slug, base +  i]));

        // (tuỳ chọn) nếu còn dùng ?pkg=..., giữ nguyên code hiện tại để flatten
        const pkgSlugs = (params.get("pkg") || "")
          .split(",").map(s => s.trim()).filter(Boolean);

        let packageVaccines = [];
        if (pkgSlugs.length > 0) {
          const pkgs = await Promise.all(pkgSlugs.map(getPackageBySlug));
          const newItems = [];
          pkgs.forEach((p, idx) => {
            (p?.disease_groups || []).forEach(g => {
              (g?.vaccines || []).forEach(v => {
                const add = base + mergedItems.length + idx;
                packageVaccines.push({ ...v, __addedAt: add, __diseaseName: g?.disease?.name || "" });
                if (v.slug && !lsMap.has(v.slug)) {
                  // gói thêm vào mặc định qty=1
                  newItems.push({ slug: v.slug, qty: 1 });
                }
              });
            });
          });

          newItems.forEach((it, i) => {
            if (!lsMap.has(it.slug)) {
              lsMap.set(it.slug, it.qty);
              addedAtMap.set(it.slug, base  +  mergedItems.length + i);
            }
          });
        }
        const finalItems = [...lsMap.entries()].map(([slug, qty]) => ({ slug, qty }));
        if (finalItems.length === 0) {
          setItems([]);
          toast.info("Chưa có vắc xin nào được chọn.", { toastId: EMPTY_BOOKING_TOAST_ID });
          return;
        }

        // Lấy chi tiết vaccine theo slug
        const singleVaccines = (await Promise.all(
          finalItems.map(async ({ slug }) => {
            try { return await getVaccineBySlug(slug); } catch { return null; }
          })
        )).filter(Boolean);

        const all = [
          ...singleVaccines.map(v => ({
            ...v,
            __addedAt: addedAtMap.get(v.slug) ?? base,
            __diseaseName: v?.disease?.name || ""
          })),
          ...packageVaccines,
        ];
        const uniq = Array.from(new Map(all.map(v => [v.id, v])).values())
                          .sort((a, b) => (b.__addedAt || 0) - (a.__addedAt || 0));

        // Map qty từ storage vào item
        setItems(uniq.map(v => ({
          id: v.id, slug: v.slug, name: v.name,
          country: v.origin || "—",
          diseaseText: v.__diseaseName ? v.__diseaseName : (v.disease ? v.disease.name : ""),
          price: Number(v.price || 0),
          formatted_price: v.formatted_price,
          qty: 1,
          img: v.image || "/images/nhac1.jpg",
          doses_required: v.doses_required,
          min_age: v.min_age, max_age: v.max_age, age_unit: v.age_unit,
          schedule_text: formatSchedule(v),
          maxDoses: undefined, note: "",
        })));

        // Đồng bộ **giỏ** + URL (?v=…) + bắn event
        writeBooking(finalItems);                         // lưu {slug, qty}
        const u = new URL(window.location.href);
        u.searchParams.set("v", getBookingSlugs().join(","));  // dùng helper từ storage
        u.searchParams.delete("pkg");
        window.history.replaceState({}, "", u);
        window.dispatchEvent(new Event(SELECTED_EVENT));
      } catch (e) {
        console.error(e);
        toast.error("Không tải được thông tin vắc xin/gói tiêm.");
      } finally {
        setLoading(false);
      }
    })();
  }, [location.search]);

  // Khi đổi người tiêm → tính max theo sổ & sinh thông báo theo phác đồ
  useEffect(() => {
    if (!selectedCustomer?.id || items.length === 0) return;
    const pending = items.filter(it => typeof it.maxDoses === "undefined");
    if (pending.length === 0) return;
    let canceled = false;
    (async () => {
      try {
        const results = await Promise.all(
          pending.map(async (it) => {
            try {
              const res = await getRemainingDoses(selectedCustomer.id, it.id);
              const max = Math.max(res?.remaining ?? 0, 0);
              return { id: it.id, maxDoses: max, info: res };
            } catch {
              return {
                id: it.id,
                maxDoses: it.doses_required ?? 5,
                info: null,
              };
            }
          })
        );
        if (canceled) return;
        setItems(prev =>
          prev.map(it => {
            const found = results.find(r => r.id === it.id);
            if (!found) return it;
            const { maxDoses: max, info } = found;
            let note = it.note || "";
            let nextDoseDate = null;

            if (info) {
              nextDoseDate = info.next_dose_date || null;
              const nextDateStr = info.next_dose_date
                ? new Date(info.next_dose_date).toLocaleDateString("vi-VN")
                : null;

              if (info.status_code === "completed" || max === 0) {
                note = `Quý khách đã tiêm đủ ${info.used}/${info.total} mũi cho vắc xin này.`;
              } else if (info.status_code === "not_started") {
                note = `Phác đồ gồm ${info.total} mũi. Bạn đang đặt mũi đầu tiên.`;
              } else if (info.status_code === "in_progress") {
                note = `Đã tiêm ${info.used}/${info.total} mũi.`;
                if (nextDateStr && info.next_dose_number) {
                  note += ` Mũi tiếp theo (mũi ${info.next_dose_number}) nên tiêm từ ngày ${nextDateStr}.`;
                }
              }
            } else if (max === 0) {
              note = "Quý khách đã chọn tối đa số liều có thể đặt cho vắc xin này.";
            }

            return {
              ...it,
              maxDoses: max,
              qty: Math.min(it.qty || 1, Math.max(1, max || 1)),
              note,
              nextDoseDate,    // 👈 LƯU THÊM
            };
          })
        );
      } catch (err) {
        console.error(err);
        toast.error("Không kiểm tra được phác đồ tiêm. Vui lòng thử lại sau.");
      }
    })();
    return () => {
      canceled = true;
    };
  }, [selectedCustomer?.id, items]);


  // Submit:
  const onConfirmBooking = async () => {
    if (!selectedCustomer?.id) return toast.error("Vui lòng chọn người tiêm");
    const dateEl = document.querySelector('input[type="date"]');
    const notesEl = document.querySelector('textarea');
    if (!dateEl?.value) {
      return toast.error("Vui lòng chọn ngày hẹn tiêm trước khi đặt lịch.");
    }

    const apptDate = new Date(dateEl.value);
    apptDate.setHours(0, 0, 0, 0);

    const invalidAgeItems = (items || []).filter(it => it.ageEligible === false);
    if (invalidAgeItems.length) {
      toast.error(
        "Có vắc xin không phù hợp với độ tuổi người tiêm: " +
        invalidAgeItems.map(i => i.name).join(", ")
      );
      return;
    }

    // ⚠️ KIỂM TRA KHOẢNG CÁCH MŨI
    for (const it of items || []) {
      if (it.ageEligible === false) continue;
      if ((it.maxDoses ?? 1) <= 0) continue; // đã đủ mũi
      if (!it.nextDoseDate) continue;        // chưa có mũi kế tiếp dự kiến

      const nd = new Date(it.nextDoseDate);
      nd.setHours(0, 0, 0, 0);
      if (apptDate < nd) {
        return toast.error(
          `Vắc xin ${it.name}: mũi tiếp theo nên tiêm từ ngày ${nd.toLocaleDateString("vi-VN")}. ` +
          `Vui lòng chọn ngày hẹn muộn hơn.`
        );
      }
    }

    const itemsPayload = (items || [])
      .filter(it => it.ageEligible !== false && (it.maxDoses ?? 1) > 0)
      .map(it => ({ vaccine_id: it.id, quantity: 1 }));

    if (itemsPayload.length === 0) return toast.warn("Không có vắc xin hợp lệ để đặt.");

    let payload = {
      member_id: selectedCustomer.id,
      appointment_date: dateEl.value,
      location: null,
      notes: notesEl?.value || "",
    };

    if (items.length === 1 && (items[0].qty || 1) === 1) {
      payload.vaccine_id = items[0].id;
    } else {
      payload.items = itemsPayload;
    }

    try {
      await createBooking(payload);
      clearBooking();
      toast.success("Đặt lịch thành công! Đã ghi vào Sổ tiêm (Chờ tiêm).", {
        icon: "🎉",
        autoClose: 2500,
        pauseOnHover: true,
        onClose: () => {
          window.location.href = `/recordbook?member=${selectedCustomer.id}`;
        }
      });
    } catch (e) {
      const msg = e?.response?.data?.items || e?.response?.data?.detail || "Không thể đặt lịch.";
      toast.error(msg);
    }
  };


  //xóa
  // mở modal
  const askRemove = (item) => {
    setPendingDelete(item);
    setConfirmOpen(true);
  };

  // huỷ
  const cancelRemove = () => {
    setConfirmOpen(false);
    setPendingDelete(null);
  };

  // xoá thật sự + cập nhật localStorage, URL, và bắn SELECTED_EVENT
  const doRemove = () => {
    const item = pendingDelete;
    if (!item) return;

    // 1) Cập nhật UI
    setItems(prev => prev.filter(it => it.id !== item.id));

    // 2) localStorage
    const curr = readBooking().filter(it => it.slug !== item.slug);
    writeBooking(curr);

    // 3) URL
    const u = new URL(window.location.href);
    if (curr.length) u.searchParams.set("v", curr.map(it => it.slug).join(","));
    else u.searchParams.delete("v");
    window.history.replaceState({}, "", u);

    // 4) Báo NavBar cập nhật badge
    window.dispatchEvent(new Event(SELECTED_EVENT));

    // 5) Toast & đóng modal
    toast.success("Đã xoá vắc xin khỏi danh sách.");
    setConfirmOpen(false);
    setPendingDelete(null);
  };

  return (
    <section className="tw-min-h-screen tw-bg-cyan-50 tw-pt-[120px] tw-pb-20">
      <div className="tw-max-w-[1200px] tw-mx-auto tw-px-5">
        {/* Header & Progress */}
        <div className="tw-flex tw-items-center tw-justify-between tw-mb-6">
          <div className="tw-flex tw-items-center tw-gap-3">
            <button  onClick={() => window.history.length > 1 ? window.history.back() : (window.location.href = "/vaccines")}
              aria-label="Quay lại"
              className="tw-inline-flex tw-items-center tw-gap-2 tw-text-blue-600 hover:tw-text-blue-800 tw-bg-white tw-border tw-border-blue-200 hover:tw-border-blue-400 tw-rounded-full tw-px-4 tw-py-2 tw-shadow-sm" >
              <i className="fa-solid fa-arrow-left" />
              <span className="tw-font-medium">Quay lại</span>
            </button>
            <h1 className="tw-text-[22px] tw-ml-[200px] tw-font-bold tw-text-pink-600 tw-uppercase">Đặt hẹn tiêm vắc xin</h1>
          </div>

          <ol className="tw-flex tw-items-center tw-gap-3 tw-mr-20">
            {[
              { label: "Chọn người tiêm", done: true },
              { label: "Chọn vắc xin", done: true },
              { label: "Đặt lịch", done: false },
            ].map((s, idx) => (
              <li key={idx} className="tw-flex tw-items-center tw-gap-2">
                <span className={`tw-w-7 tw-h-7 tw-rounded-full tw-flex tw-items-center tw-justify-center tw-text-sm ${s.done ? "tw-bg-green-500 tw-text-white" : "tw-bg-gray-200 tw-text-gray-600"}`}>
                  {s.done ? <i className="fa-solid fa-check" /> : idx + 1}
                </span>
                <span className={`tw-text-sm ${s.done ? "tw-text-gray-800 tw-font-medium" : "tw-text-gray-500"}`}>{s.label}</span>
                {idx < 2 && <span className="tw-w-6 tw-h-[2px] tw-bg-gray-200 tw-inline-block" />}
              </li>
            ))}
          </ol>
        </div>

        {/* Layout */}
        <div className="tw-grid tw-grid-cols-1 lg:tw-grid-cols-3 tw-gap-6">
          {/* LEFT */}
          <div className="lg:tw-col-span-2 tw-space-y-6">
            <div className="tw-bg-white tw-rounded-2xl tw-shadow-sm tw-p-5 tw-pb-10">
              <div className="tw-flex tw-items-center tw-justify-between tw-mb-4 tw-border-b tw-pb-4">
                <div className="tw-flex tw-items-center tw-gap-3">
                  <span className="tw-w-10 tw-h-10 tw-rounded-full tw-bg-blue-100 tw-text-blue-600 tw-flex tw-items-center tw-justify-center">
                    <i className="fa-solid fa-user" />
                  </span>
                  <div className="tw-text-left">
                    <p className="tw-font-semibold tw-text-2xl">{selectedCustomer?.name ?? "—"}</p>
                    <p className="tw-text-gray-500 tw-text-xl">
                       {selectedCustomer?.gender || "—"}
                      <span className="tw-mx-2">•</span>
                        {selectedCustomer?.dob ? new Date(selectedCustomer.dob).toLocaleDateString("vi-VN") : "—"}
                        {selectedCustomer?.dob && (
                          <span className="tw-ml-2 tw-text-[9px] tw-text-gray-500">
                            ({calculateAgeDetail(selectedCustomer.dob)})
                          </span>
                        )}
                    </p>
                  </div>
                </div>
                <button onClick={() => setOpenModal(true)} className="tw-text-blue-500 hover:tw-text-blue-600 tw-text-xl tw-font-medium">
                  Chọn lại người tiêm
                </button>
              </div>

               <SelectCustomerModal
                   open={openModal} onClose={() => setOpenModal(false)}
                    customers={customers} onSelect={(c) => {   
                      setSelectedCustomer(c);   setOpenModal(false);   
                      const u = new URL(window.location.href);   
                      u.searchParams.set("member", String(c.id));   
                      window.history.replaceState({}, "", u); 
                    }}
                />

              {/* Vaccines */}
              <div className="tw-space-y-4">
                {loading && <p className="tw-text-gray-500">Đang tải vắc xin...</p>}

                {!loading && items.length === 0 && (
                  <div className="tw-flex tw-flex-col tw-items-center tw-justify-center tw-py-10 tw-text-center">
                    <img  src="/images/novaccine.jpg" alt="Không có vắc xin được chọn" className="tw-w-48 tw-h-48 tw-object-contain tw-opacity-80 tw-mb-4"  />
                    <p className="tw-text-red-500 tw-italic tw-text-2xl">
                      Chưa có vắc xin chọn đặt trước
                    </p>
                    <p className="tw-text-gray-500 tw-text-lg">
                      Khám phá và đặt trước vắc xin phù hợp với nhu cầu của bạn tại Tiêm chủng E-Vaccine ngay hôm nay!
                    </p>

                    {/* Nút hành động */}
                    <div className="tw-mt-5 tw-flex tw-flex-wrap tw-gap-3">
                      <Link to="/vaccines" className="  tw-inline-flex tw-items-center tw-gap-2 tw-rounded-full tw-px-5 tw-py-3 tw-text-white tw-font-semibold
                          tw-bg-[#1999ee] hover:tw-bg-[#0d79c9] hover:tw-text-white tw-shadow-sm tw-transition-colors " >
                        <i className="fa-solid fa-list" />
                        Xem danh mục vắc xin
                      </Link>
                      <Link to="/knowledge" className=" tw-inline-flex tw-items-center tw-gap-2 tw-rounded-full tw-px-5 tw-py-3 tw-text-[#1999ee] tw-font-semibold
                          tw-bg-[#e8f4ff] hover:tw-bg-[#d8eeff] tw-border hover:tw-text-[#1999ee] tw-border-[#bfe0ff] tw-transition-colors ">
                        <i className="fa-regular fa-circle-question" />
                        Tôi nên tiêm gì?
                      </Link>
                    </div>
                  </div>
                )}


                {items.map((v) => (
                  <div key={v.id} className="tw-rounded-xl tw-border tw-border-gray-200 hover:tw-border-blue-300 tw-bg-white tw-p-4 tw-shadow-sm hover:tw-shadow-md tw-transition">
                    <div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-[110px_1fr_auto] tw-gap-4 tw-items-start">
                      <div className="tw-flex tw-items-center tw-justify-center tw-rounded-2xl tw-border tw-border-gray-300 tw-bg-white tw-p-1">
                        <img src={v.img} alt={v.name} className="tw-w-[110px] tw-h-[80px] tw-object-contain" />
                      </div>

                      <div className="tw-text-left">
                        <div className="tw-flex tw-items-center tw-gap-2 tw-mb-1">
                          <span className="tw-text-lg tw-bg-orange-100 tw-text-orange-700 tw-px-3 tw-py-1 tw-rounded-full">
                            {v.country || "—"}
                          </span>
                          <h3 className="tw-font-semibold tw-text-[18px] tw-leading-snug tw-text-[#38cff5]">
                            {v.name}
                          </h3>
                           {v.ageEligible === false && (
                              <span className="tw-ml-2 tw-text-xs tw-text-red-600 tw-font-semibold tw-border tw-border-red-300 tw-rounded-full tw-px-2 tw-py-[2px]">
                                Không phù hợp tuổi
                              </span>
                            )}
                        </div>
                        <p className="tw-text-gray-800 tw-font-medium">{v.diseaseText}</p>
                        {v.schedule_text && (
                          <p className="tw-text-gray-500 tw-text-lg">
                            Phác đồ: {v.schedule_text}
                          </p>
                        )}
                      </div>

                      <div className="tw-flex tw-items-center md:tw-items-start tw-justify-end md:tw-flex-col md:tw-justify-start tw-gap-2">
                        <div className="tw-text-right md:tw-mb-4">
                          <p className="tw-text-[#f60] tw-font-bold tw-text-2xl">
                            {(v.price || 0).toLocaleString()} VNĐ
                          </p>
                          <p className="tw-text-gray-500 tw-text-sm">
                            Thành tiền: {fmt((Number(v.price) || 0) * (v.qty || 1))} VNĐ
                          </p>
                        </div>

                        <div className="tw-flex tw-items-center tw-gap-2">
                          <QuantityPillBooking  value={v.qty ?? 1}  min={1}  max={1}
                            disabled={v.ageEligible === false}
                            onChange={(val) =>
                              setItems(prev => {
                                let warning = "";
                                if (val > 1) {
                                  warning = "Mỗi lần đặt lịch chỉ được chọn tối đa 1 liều cho mỗi vắc xin.";
                                  val = 1;
                                }
                                const next = prev.map(it =>  it.id === v.id ? { ...it, qty: val, localWarning: warning } : it );
                                writeBooking(next.map(x => ({ slug: x.slug, qty: x.qty })));
                                const u = new URL(window.location.href);
                                u.searchParams.set("v", getBookingSlugs().join(","));
                                window.history.replaceState({}, "", u);
                                return next;
                              })
                            }
                          />
                          <span className="tw-text-gray-500 tw-ml-4">Liều</span>                         
                          <button onClick={() => askRemove(v)} className="tw-text-red-500 hover:tw-text-red-600 tw-ml-3" title="Xoá">
                            <i className="fa-solid fa-trash" />
                          </button>
                        </div>
                        {v.localWarning && (
                            <div className="tw-mt-2 tw-text-sm tw-text-red-600 tw-font-medium">
                              ⚠ {v.localWarning}
                            </div>
                          )}
                      </div>
                    </div>

                    {v.note && (
                      <div className="md:tw-col-start-2 md:tw-col-span-2 tw-mt-3">
                        <div className="tw-flex tw-items-start tw-gap-2 tw-rounded-lg tw-border tw-border-orange-200 tw-bg-orange-50 tw-px-4 tw-py-2 tw-shadow-sm">
                          <span className="tw-inline-flex tw-h-5 tw-w-5 tw-items-center tw-justify-center tw-rounded-full tw-bg-orange-100 tw-text-[#f5861e]">
                            <i className="fa-solid fa-circle-exclamation tw-text-[12px]" />
                          </span>
                          <p className="tw-text-sm tw-leading-5 tw-text-gray-800">{v.note}</p>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

            </div>
          </div>

          {/* RIGHT (sticky) */}
          <div className="tw-space-y-4 lg:tw-sticky lg:tw-top-[96px] lg:tw-self-start">
            <div className="tw-bg-white tw-rounded-2xl tw-shadow-sm tw-p-5">
              <h2 className="tw-font-semibold tw-text-2xl tw-mb-3 tw-flex tw-items-center tw-gap-2">
                <i className="fa-solid fa-location-dot tw-text-red-500" />
                Địa điểm & thời gian hẹn
              </h2>

              <div className="tw-space-y-3">
                <div className="tw-grid tw-grid-cols-2 tw-gap-3 tw-text-left">
                  <label className="tw-block">
                    <span className="tw-text-xl  tw-text-gray-600">Ngày hẹn</span>
                    <input type="date" required min={todayLocal} className="tw-mt-1 tw-w-full tw-border tw-border-gray-300 tw-rounded-lg  tw-font-normal tw-px-3 tw-py-2 focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-blue-300 focus:tw-border-blue-800" />
                  </label>
                  
                </div>

                <label className="tw-block tw-text-left">
                  <span className="tw-text-xl tw-text-gray-600">Ghi chú cho trung tâm (tuỳ chọn)</span>
                  <textarea rows={3} className="tw-mt-1 tw-w-full tw-border tw-border-gray-300 tw-text-lg tw-font-normal tw-rounded-lg tw-px-3 tw-py-2 focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-blue-300 focus:tw-border-blue-800" 
                  placeholder="VD: Mong muốn tiêm chung với người nhà, lưu ý sức khoẻ..." />
                </label>
              </div>
            </div>

            {/* Summary */}
            <div className="tw-bg-white tw-rounded-2xl tw-shadow-sm tw-p-5">
              <h2 className="tw-font-semibold tw-text-2xl tw-mb-3 tw-flex tw-items-center tw-gap-2">
                <i className="fa-solid fa-wallet tw-text-pink-500" />
                Thanh toán
              </h2>

              <div className="tw-space-y-2">
                <div className="tw-flex tw-justify-between tw-text-gray-700">
                  <span>Tổng tiền</span>
                  <span>{fmt(subtotal)} VNĐ</span>
                  
                </div>
                
                <div className="tw-border-t tw-my-2" />
                <div className="tw-flex tw-justify-between tw-font-bold tw-text-xl">
                  <span>Tạm tính</span>
                  <span className="tw-text-red-600">{fmt(total)} VNĐ</span>
                </div>

                <button onClick={onConfirmBooking} className="tw-w-full tw-mt-4 tw-bg-gradient-to-r tw-from-blue-500 tw-to-cyan-400 hover:tw-from-cyan-300 hover:tw-to-blue-500 tw-text-white tw-py-3 tw-rounded-xl tw-font-semibold tw-shadow">
                  Xác nhận đặt trước
                </button>
                <p className="tw-text-sm tw-text-blue-400 tw-mt-2">Bằng việc xác nhận đặt hẹn, Quý khách đồng ý với Điều khoản dịch vụ & Chính sách xử lý dữ liệu cá nhân của Tiêm chủng E-Vaccine.</p>
              </div>
            </div>

            <div className="tw-bg-white tw-rounded-2xl tw-shadow-sm tw-p-5 tw-flex tw-items-start tw-gap-3">
              <span className="tw-w-9 tw-h-9 tw-rounded-full tw-bg-amber-100 tw-text-amber-600 tw-px-3 tw-py-2 tw-flex tw-items-center tw-justify-center">
                <i className="fa-solid fa-lightbulb" />
              </span>
              <p className="tw-text-sm tw-text-gray-600 tw-leading-relaxed">
                Lưu ý: Giá hiển thị là tạm tính theo số liều đã chọn. Giá thực tế tại trung tâm có thể thay đổi theo chương trình khuyến mãi tại thời điểm tiêm.
              </p>
            </div>
          </div>
        </div>
      </div>

      <ConfirmModal
        show={confirmOpen} title="Xác nhận xoá"
         message={
          pendingDelete ? (
            <> Bạn có chắc muốn xoá “<strong>{pendingDelete.name}</strong>” khỏi danh sách đặt trước?</>
          ) : ( "" )}
        confirmText="Xoá" cancelText="Hủy"
        onConfirm={doRemove} onCancel={cancelRemove}
      />

      {/* <ChatWidget /> */}
    </section>
  );
}