import React, { useEffect, useMemo, useState } from "react";
import { notifyAdmin } from "../../../../services/inventoryService";
import { toast } from "react-toastify";
import Dropdown from "../../../../components/Dropdown";

export default function NotifyForm({ vaccines = [], preset, onSent }) {
  const [form, setForm] = useState({
    vaccine_id: "",
    title: "",
    desired_qty: "",
    message: "",
    urgency: "normal", // low | normal | high
  });
  const [submitting, setSubmitting] = useState(false);
  const [touched, setTouched] = useState({});

  // preset
  useEffect(() => {
    if (preset) setForm((s) => ({ ...s, ...preset }));
  }, [preset]);
  

  // helpers
  const fmtDate = (d) => {
    if (!d || d === "-") return "-";
    const t = new Date(d);
    return Number.isNaN(t.getTime()) ? d : t.toLocaleDateString("vi-VN");
  };
  const fmtMoney = (n) => Number(n ?? 0).toLocaleString("vi-VN");

  const urgencyPrefix =
    form.urgency === "high" ? "[Khẩn cấp] " : form.urgency === "low" ? "[Thông tin] " : "";

  const handleChange = (k, v) => setForm((s) => ({ ...s, [k]: v }));
  const onBlur = (k) => setTouched((t) => ({ ...t, [k]: true }));

  // vaccine
  const selectedVaccine = useMemo(
    () => vaccines.find((v) => String(v.id) === String(form.vaccine_id)),
    [vaccines, form.vaccine_id]
  );

  const soonestExpiry = useMemo(() => {
    if (!selectedVaccine) return null;
    // ưu tiên selectedVaccine.expiry; nếu không có, lấy HSD sớm nhất từ lots
    const fromProp = selectedVaccine.expiry && selectedVaccine.expiry !== "-" ? selectedVaccine.expiry : null;
    if (fromProp) return fromProp;

    const lots = Array.isArray(selectedVaccine.lots) ? selectedVaccine.lots : [];
      if (!lots.length) return null;
      const valid = lots
        .map(l => l?.expiry_date)
        .filter(Boolean)
        .map(d => new Date(d))
        .filter(dt => !Number.isNaN(dt.getTime()))
        .sort((a, b) => a - b);
      return valid.length ? valid[0].toISOString().slice(0,10) : null;
    }, [selectedVaccine]);

    const computedWarningType = useMemo(() => {
      if (!selectedVaccine) return null;

      // ngưỡng HSD sắp hết = 30 ngày
      const now = new Date();
      const soon = new Date();
      soon.setDate(soon.getDate() + 30);

      const exp = soonestExpiry ? new Date(soonestExpiry) : null;
      const isExpiringSoon = exp ? (exp <= soon && exp >= now) : false;

      const qty = Number(selectedVaccine.quantity ?? 0);
      const isLowStock = qty === 0 || qty <= 20;

      if (isExpiringSoon && isLowStock) return "Hàng & Hạn đã hết";
      if (isExpiringSoon) return "Hạn sử dụng sắp hết";
      if (isLowStock) return "Số lượng sắp hết";
      return null;
  }, [selectedVaccine, soonestExpiry]);

  const vaccineOptions = useMemo(
    () =>
      vaccines.map((v) => ({
        value: String(v.id),
        label: `${v.name}${typeof v.quantity === "number" ? ` • tồn: ${v.quantity}` : ""}`,
      })),
    [vaccines]
  );

  // Số lượng kiểu QuantityPicker (giữ inline; nếu dùng component sẵn có thì thay block này bằng <QuantityPicker .../>)
  const MAX_QTY = 999999;
  const guardInt = (val) => {
    if (val === "") return "";
    const m = String(val).match(/^\d+$/);
    return m ? m[0] : "";
  };
  const incQty = (delta) => {
    setForm((s) => {
      const cur = Number(s.desired_qty || 0);
      const next = Math.max(0, Math.min(MAX_QTY, cur + delta));
      return { ...s, desired_qty: next === 0 ? "0" : String(next) };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;      
    
    if (!form.vaccine_id) {
      toast.warn("Vui lòng chọn vắc xin.");
      setTouched((t) => ({ ...t, vaccine_id: true }));
      return;
    }
    if (!form.title?.trim()) {
      toast.warn("Vui lòng nhập tiêu đề.");
      setTouched((t) => ({ ...t, title: true }));
      return;
    }

    setSubmitting(true);
    try {
      await notifyAdmin({
        vaccine_id: form.vaccine_id,
        title: (form.urgency === "high" ? "[Khẩn cấp] " : form.urgency === "low" ? "[Thông tin] " : "") + form.title.trim(),
        desired_qty: form.desired_qty ? Number(form.desired_qty) : undefined,
        message: form.message,
        urgency: form.urgency,
      });
      // CHỈ 1 nơi toast:
      toast.success("Đã gửi thông báo cho admin.", { toastId: "notify-admin-success" });
      onSent?.();
      setForm({ vaccine_id: "", title: "", desired_qty: "", message: "", urgency: "normal" });
      setTouched({});
    } catch (err) {
      console.error(err);
      toast.error("Gửi thông báo thất bại.");
    } finally {
      setSubmitting(false);
    }
  };

  const titlePresets = [
    "Đề nghị nhập thêm",
    "Báo cáo sắp hết hàng",
    "Cần xác minh chất lượng lô",
    "Điều chuyển tồn kho",
  ];
  const messageMax = 1000;
  const messageLen = form.message?.length || 0;

  const renderStockBadge = (qty) => {
    const q = Number(qty ?? 0);
    if (q === 0)
      return (
        <span className="tw-bg-red-100 tw-text-red-600 tw-px-2.5 tw-py-1 tw-rounded-full tw-text-base">
          Hết hàng
        </span>
      );
    if (q <= 20)
      return (
        <span className="tw-bg-yellow-100 tw-text-yellow-700 tw-px-2.5 tw-py-1 tw-rounded-full tw-text-base">
          Sắp hết
        </span>
      );
    return (
      <span className="tw-bg-green-100 tw-text-green-600 tw-px-2.5 tw-py-1 tw-rounded-full tw-text-base">
        Còn hàng
      </span>
    );
  };

  const renderWarningBadge = (type) => {
    if (!type) return null;
    if (type === "Hàng & Hạn đã hết")
      return <span className="tw-bg-red-100 tw-text-red-600 tw-px-3 tw-py-1 tw-rounded-full tw-text-base">⚠️ {type}</span>;
    if (type === "Hạn sử dụng sắp hết")
      return <span className="tw-bg-orange-100 tw-text-orange-600 tw-px-3 tw-py-1 tw-rounded-full tw-text-base">⏰ {type}</span>;
    if (type === "Số lượng sắp hết")
      return <span className="tw-bg-blue-100 tw-text-blue-700 tw-px-3 tw-py-1 tw-rounded-full tw-text-base">📦 {type}</span>;
    return <span className="tw-bg-green-100 tw-text-green-600 tw-px-3 tw-py-1 tw-rounded-full tw-text-base">{type}</span>;
  };

  return (
    <div className="tw-grid tw-grid-cols-1 lg:tw-grid-cols-3 tw-gap-6 tw-mb-10">
      <form onSubmit={handleSubmit} className="tw-col-span-2 tw-bg-white tw-rounded-2xl tw-shadow-md tw-border tw-border-gray-100 " >
        <div className="tw-flex tw-items-center tw-justify-between tw-px-5 tw-py-4 tw-border-b tw-border-gray-100 tw-bg-gradient-to-r tw-from-pink-50 tw-to-rose-50">
          <h3 className="tw-text-[14px] tw-font-bold tw-text-pink-700 tw-flex tw-items-center ">
            <i className="fa-solid fa-paper-plane tw-mr-2"></i> Gửi thông báo tới Admin
          </h3>
        </div>

        {/* Body */}
        <div className="tw-p-5 tw-space-y-6">
          <div className="tw-grid md:tw-grid-cols-2 tw-gap-4">
            <div>
              <label className="tw-block tw-text-xl tw-text-left tw-font-medium tw-mb-1">
                Chọn vắc xin <span className="tw-text-red-500">*</span>
              </label>
              <Dropdown
                value={form.vaccine_id ? String(form.vaccine_id) : ""}  options={vaccineOptions}
                onChange={(val) => {
                  handleChange("vaccine_id", val);
                  setTouched((t) => ({ ...t, vaccine_id: true }));
                }}
                className={ touched.vaccine_id && !form.vaccine_id ? "tw-[&>button]:tw-border-red-300 tw-[&>button]:focus:tw-ring-0" : ""  }
              />
              {touched.vaccine_id && !form.vaccine_id && (
                <p className="tw-text-base tw-text-red-500 tw-mt-1">Bạn chưa chọn vắc xin.</p>
              )}

              {/* Số lượng mong muốn */}
                <div>
                    <label className="tw-block tw-text-xl tw-text-left tw-font-medium tw-mb-1"> Số lượng mong muốn </label>
                    <div className="tw-flex tw-items-center tw-gap-2">
                    <button  aria-label="Giảm 1" type="button"  onClick={() => incQty(-1)}  disabled={Number(form.desired_qty || 0) <= 0}  title="-1" 
                        className="tw-bg-cyan-200 hover:tw-bg-cyan-300 tw-text-gray-800 tw-px-4 tw-py-2 tw-rounded-lg tw-border tw-border-cyan-300" >
                        <i className="fa-solid fa-minus"></i>
                    </button>

                    <input  type="text" value={form.desired_qty}
                        onChange={(e) => handleChange("desired_qty", guardInt(e.target.value))}  placeholder="0"
                        className="tw-border tw-border-gray-300 tw-px-3 tw-py-2 tw-w-28 tw-rounded-lg tw-text-center 
                        focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-cyan-300 focus:tw-border-cyan-800" 
                    />

                    <button   aria-label="Tăng 1" type="button"  onClick={() => incQty(1)}
                        className="tw-bg-cyan-200 hover:tw-bg-cyan-300 tw-text-gray-800 tw-px-4 tw-py-2 tw-rounded-lg tw-border tw-border-cyan-300"
                        disabled={Number(form.desired_qty || 0) >= MAX_QTY}   title="+1" >
                        <i className="fa-solid fa-plus"></i>
                    </button>

                    <div className="tw-flex tw-gap-2 tw-ml-2">
                        <button type="button" onClick={() => incQty(10)}
                            className="tw-text-[9px] tw-bg-cyan-50 hover:tw-bg-cyan-100 tw-text-cyan-700 tw-rounded-full tw-px-3 tw-py-3.5">
                            <i className="fa-solid fa-plus tw-text-sm tw-mr-1"></i>10
                        </button>
                        <button  type="button" onClick={() => incQty(100)}
                            className="tw-text-[9px] tw-bg-cyan-50 hover:tw-bg-cyan-100 tw-text-cyan-700 tw-rounded-full tw-px-3 tw-py-3.5" >
                            <i className="fa-solid fa-plus tw-text-sm tw-mr-1"></i>100
                        </button>
                    </div>
                    </div>
                </div>
            </div>

            {/* Tóm tắt vắc xin + lô: chống tràn chữ */}
            <div className="tw-border tw-border-gray-200 tw-rounded-lg tw-p-3 tw-bg-gray-50 tw-min-w-0">
              {selectedVaccine ? (
                <div className="tw-flex tw-items-start tw-justify-between tw-gap-3">
                  <div className="tw-min-w-0 tw-space-y-1">
                    <div className="tw-font-semibold tw-text-gray-800 tw-truncate" title={selectedVaccine.name}>
                      {selectedVaccine.name}
                    </div>

                    <div className="tw-text-base tw-text-gray-600 tw-break-words tw-text-left tw-font-medium">
                      <i className="fa-solid fa-circle-half-stroke tw-text-[5px] tw-mr-2"></i>Mã:{" "}
                      <span className="tw-font-medium tw-text-cyan-500"> {selectedVaccine.code || "-"} </span>{" "}                    
                    </div>
                    <div className="tw-text-base tw-text-gray-600 tw-break-words tw-text-left tw-font-medium tw-flex tw-flex-wrap tw-items-center">
                        <div className="tw-flex tw-items-center tw-mr-4">
                            <i className="fa-solid fa-circle-half-stroke tw-text-[5px] tw-mr-2"></i> HSD:{" "}
                            <span className="tw-font-medium tw-text-cyan-500 tw-ml-1">
                                {soonestExpiry ? fmtDate(soonestExpiry) : "-"}
                            </span>
                        </div>
                        <div className="tw-flex tw-items-center">
                            <i className="fa-solid fa-circle-half-stroke tw-text-[5px] tw-mr-2"></i> Giá:{" "}
                            <span className="tw-font-medium tw-text-cyan-500 tw-ml-1">
                                {typeof selectedVaccine.price === "number" ? `${fmtMoney(selectedVaccine.price)} VNĐ` : "-"}
                            </span>
                        </div>
                    </div>

                    <div className="tw-text-base tw-text-gray-600 tw-break-words tw-text-left tw-font-medium">
                        <i className="fa-solid fa-circle-half-stroke tw-text-[5px] tw-mr-2"></i>NSX:{" "}
                        <span className="tw-font-medium tw-text-cyan-500"> {selectedVaccine.manufacturer || "-"} </span>
                    </div>

                    <div className="tw-text-base tw-text-gray-600 tw-break-words tw-text-left tw-font-medium">
                        <i className="fa-solid fa-circle-half-stroke tw-text-[5px] tw-mr-2"></i>Danh sách lô:{" "}
                        {Array.isArray(selectedVaccine?.lots) && selectedVaccine.lots.length ? (
                            <span className="tw-inline-block tw-max-w-full tw-overflow-x-auto tw-whitespace-nowrap tw-align-top tw-font-medium tw-text-cyan-500" 
                                title={selectedVaccine.lots
                                    .map( (l) =>  `${l.lot_number || "—"} • HSD: ${fmtDate(l.expiry_date)} • SL: ${l.quantity_available ?? "—"}`  )
                                    .join("\n")}>
                                {selectedVaccine.lots.map((l) => l.lot_number || "—").join(", ")}
                            </span>
                        ) : (
                            <span className="tw-text-gray-500">— Không có thông tin lô —</span>
                        )}
                      </div>
                    {/* Cảnh báo nếu có */}
                    {computedWarningType  && (
                      <div className="tw-pt-1">{renderWarningBadge(computedWarningType )}</div>
                    )}
                  </div>
                  <div className="tw-flex-shrink-0">{renderStockBadge(selectedVaccine.quantity)}</div>
                </div>
              ) : (
                <div className="tw-text-sm tw-text-left tw-text-gray-500">Chưa chọn vắc xin.</div>
              )}
            </div>
          </div>

          <div className="tw-grid md:tw-grid-cols-3 tw-gap-4">
            <div className="md:tw-col-span-2">
              <label className="tw-block tw-text-xl tw-text-left tw-font-medium tw-mb-1">
                Tiêu đề <span className="tw-text-red-500">*</span>
              </label>
              <input type="text"  value={form.title} placeholder="Ví dụ: Đề nghị nhập thêm"
                onChange={(e) => handleChange("title", e.target.value)} onBlur={() => onBlur("title")}
                className={`tw-w-full tw-border tw-rounded-lg tw-px-3 tw-py-2 focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-blue-300 focus:tw-border-blue-800 
                ${ touched.title && !form.title?.trim() ? "tw-border-red-300" : "tw-border-gray-300"  }`}
              />
              {touched.title && !form.title?.trim() && (
                <p className="tw-text-base tw-text-red-500 tw-mt-2">Bạn chưa nhập tiêu đề.</p>
              )}
              <div className="tw-flex tw-flex-wrap tw-gap-2 tw-mt-3">
                {titlePresets.map((t) => (
                  <button type="button"   key={t} onClick={() => handleChange("title", t)}
                    className="tw-text-[9px] tw-bg-cyan-50 hover:tw-bg-cyan-100 tw-text-cyan-700 tw-rounded-full tw-px-3 tw-py-1" >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Mức độ */}
            <div>
              <label className="tw-block tw-text-xl tw-font-medium tw-mb-2">Mức độ</label>
              <div className="tw-flex tw-gap-2">
                {["low", "normal", "high"].map((val) => {
                  const map = {
                    low: "tw-bg-sky-50 tw-text-sky-700 tw-border-sky-200",
                    normal: "tw-bg-emerald-50 tw-text-emerald-700 tw-border-emerald-200",
                    high: "tw-bg-rose-50 tw-text-rose-700 tw-border-rose-200",
                  };
                  const active = form.urgency === val;
                  return (
                    <button  key={val}  type="button" onClick={() => handleChange("urgency", val)}
                      className={`tw-flex-1 tw-text-lg tw-py-2 tw-rounded-full tw-border ${map[val]} ${
                        active ? "tw-ring-2 tw-ring-offset-1 tw-ring-opacity-40" : ""
                      }`} >
                      {val === "low" ? "Nhẹ" : val === "normal" ? "Thường" : "Khẩn"}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div>
            <label className="tw-block tw-text-xl tw-text-left tw-font-medium tw-mb-1">Nội dung</label>
            <textarea  rows={5}  maxLength={messageMax}   value={form.message} onChange={(e) => handleChange("message", e.target.value)}
              className="tw-w-full tw-border tw-rounded-lg tw-px-3 tw-py-2 tw-border-gray-300 
                  tw-overflow-y-auto tw-scrollbar-thin tw-scrollbar-thumb-gray-300 tw-scrollbar-track-transparent 
                  [&::-webkit-scrollbar]:tw-w-2 [&::-webkit-scrollbar-thumb]:tw-rounded-full
                [&::-webkit-scrollbar-track]:tw-bg-gray-100 [&::-webkit-scrollbar-thumb]:tw-bg-gradient-to-b
                [&::-webkit-scrollbar-thumb]:tw-from-cyan-400 [&::-webkit-scrollbar-thumb]:tw-to-blue-400
                  focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-blue-300 focus:tw-border-blue-800 tw-break-words tw-resize-y"
              placeholder="Lý do, kho, lô, thời điểm cần hàng, hoặc thông tin cần admin xử lý..." />
            <div className="tw-text-right tw-text-sm tw-text-gray-500">{messageLen}/{messageMax}</div>

            <div className="tw-flex tw-flex-wrap tw-gap-2">
              {["Ưu tiên lô HSD dài", "Ưu tiên giá thấp", "Cần trước ngày …", "Lý do nhu cầu tăng"].map(
                (note) => (
                  <button key={note} type="button"
                    onClick={() =>  handleChange( "message", (form.message ? form.message + "\n" : "") + "• " + note )} 
                    className="tw-text-[9px] tw-bg-cyan-50 hover:tw-bg-cyan-100 tw-text-cyan-700 tw-rounded-full tw-px-3 tw-py-1" >
                    <i className="fa-solid fa-plus tw-text-sm tw-mr-1"></i> {note}
                  </button>
                )
              )}
            </div>
          </div>
        </div>

        <div className="tw-flex tw-justify-between tw-items-center tw-px-5 tw-py-4 tw-border-t tw-border-gray-100 tw-bg-gray-50">
          <div className="tw-text-base tw-text-gray-500">
            Tiêu đề sẽ gửi với tiền tố: <b>{urgencyPrefix || "(không)"}</b>
          </div>
          <div className="tw-flex tw-gap-3">
            <button type="button" onClick={() =>
                setForm({
                  vaccine_id: "",  title: "",
                  desired_qty: "",  message: "",  urgency: "normal",
                })}
              className="tw-bg-orange-400 tw-border tw-border-orange-200 tw-text-white tw-rounded-full tw-px-5 tw-py-2 hover:tw-bg-orange-500" >
              Xóa form
            </button>
            <button   type="submit"  disabled={submitting}
              className="tw-bg-[#ee1968] tw-text-white tw-rounded-full tw-px-6 tw-py-2 hover:tw-opacity-90 disabled:tw-opacity-60" >
              {submitting ? "Đang gửi..." : "Gửi thông báo"}
            </button>
          </div>
        </div>
      </form>

      {/* XEM TRƯỚC: chống tràn chữ + danh sách lô + cảnh báo */}
      <div className="tw-bg-white tw-rounded-2xl tw-shadow-md tw-border tw-border-gray-100 tw-p-5 tw-space-y-4 tw-min-w-0">
        <div className="tw-flex tw-items-center tw-justify-between">
          <h4 className="tw-text-[14px] tw-font-semibold tw-text-cyan-600">
            <i className="fa-regular fa-eye tw-mr-2"></i>Xem trước
          </h4>
        </div>

        <div className="tw-border tw-border-cyan-200 tw-rounded-xl tw-p-4 tw-space-y-3 tw-bg-gradient-to-br tw-from-white tw-to-cyan-50 tw-min-w-0">
          <div className="tw-flex tw-items-center tw-justify-between tw-gap-3 tw-min-w-0">
            <div  className="tw-font-semibold tw-text-gray-800 tw-min-w-0 tw-truncate"
              title={(urgencyPrefix + (form.title || "")).trim() || "— Tiêu đề —"} >
              {urgencyPrefix}
              {form.title || "— Tiêu đề —"}
            </div>
            {typeof selectedVaccine?.quantity === "number" &&
              renderStockBadge(selectedVaccine.quantity)}
          </div>

          {computedWarningType && <div>{renderWarningBadge(computedWarningType)}</div>}

          <div className="tw-text-lg tw-text-left tw-text-gray-600 tw-min-w-0 tw-truncate">
            Vắc xin:{" "}
            <span className="tw-font-medium tw-text-cyan-500 tw-text-base"> {selectedVaccine?.name || "—"} </span>
          </div>

          <div className="tw-grid tw-grid-cols-3 tw-gap-3  tw-text-left">
            <div className="tw-flex tw-flex-col tw-text-gray-600 tw-min-w-0">
              <span className="tw-text-lg tw-font-medium tw-text-cyan-600">Mã</span>
              <span className="tw-text-base tw-font-medium tw-text-gray-800 tw-truncate" title={selectedVaccine?.code || "—"}>
                {selectedVaccine?.code || "—"}
              </span>
            </div>
            <div className="tw-flex tw-flex-col tw-text-gray-600 tw-min-w-0">
              <span className="tw-text-lg tw-font-medium tw-text-cyan-600">HSD</span>
              <span className="tw-text-base tw-font-medium tw-text-gray-800 tw-truncate" title={soonestExpiry ? fmtDate(soonestExpiry) : "-"}>
                {soonestExpiry ? fmtDate(soonestExpiry) : "-"}
              </span>
            </div>
            <div className="tw-flex tw-flex-col tw-text-gray-600 tw-min-w-0">
              <span className="tw-text-lg tw-font-medium tw-text-cyan-600">Giá</span>
              <span className="tw-text-base tw-font-medium tw-text-gray-800 tw-truncate" title={selectedVaccine ? `${fmtMoney(selectedVaccine.price)}đ` : "—"}>
                {selectedVaccine ? `${fmtMoney(selectedVaccine.price)}đ` : "—"}
              </span>
            </div>
          </div>

          {/* Danh sách lô trong xem trước */}
            <div className="tw-text-lg tw-text-gray-700">
                <span className="tw-font-medium">Danh sách lô:</span>{" "}
                {Array.isArray(selectedVaccine?.lots) && selectedVaccine.lots.length ? (
                    <span  className="tw-inline-block tw-max-w-full tw-overflow-x-auto tw-whitespace-nowrap tw-align-top tw-text-cyan-500 tw-font-medium"
                    title={selectedVaccine.lots
                        .map( (l) => `${l.lot_number || "—"} • HSD: ${fmtDate(l.expiry_date)} • SL: ${l.quantity_available ?? "—"}` )
                        .join("\n")} >
                    {selectedVaccine.lots.map((l) => l.lot_number || "—").join(", ")}
                    </span>
                ) : (
                    <span className="tw-text-gray-500">— Không có thông tin lô —</span>
                )} 
            </div>

          {/* Số lượng */}
          <div className="tw-text-lg tw-text-left tw-text-gray-700">
            <span className="tw-font-medium">Số lượng mong muốn:</span>{" "}
            {form.desired_qty ? <b>{form.desired_qty}</b> : "—"}
          </div>

          {/* Nội dung: giới hạn chiều cao, tự cuộn */}
          <div className="tw-text-lg tw-text-left tw-text-gray-700 tw-whitespace-pre-line tw-border tw-border-dashed
                  tw-border-gray-300 tw-rounded-lg tw-p-3 tw-bg-white tw-max-h-48 tw-overflow-auto tw-break-words
                    tw-overflow-y-auto tw-scrollbar-thin tw-scrollbar-thumb-gray-300 tw-scrollbar-track-transparent          
                    [&::-webkit-scrollbar]:tw-w-2 [&::-webkit-scrollbar-thumb]:tw-rounded-full
                  [&::-webkit-scrollbar-track]:tw-bg-gray-100 [&::-webkit-scrollbar-thumb]:tw-bg-gradient-to-b
                  [&::-webkit-scrollbar-thumb]:tw-from-cyan-400 [&::-webkit-scrollbar-thumb]:tw-to-blue-400">
            {form.message || "— Nội dung sẽ hiển thị ở đây —"}
          </div>
        </div>
      </div>
    </div>
  );
}
