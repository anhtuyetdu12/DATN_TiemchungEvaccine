// utils/schedule.js
export const formatSchedule = (v) => {
  const min = Number.isFinite(Number(v?.min_age)) ? Number(v.min_age) : null;
  const max = Number.isFinite(Number(v?.max_age)) ? Number(v.max_age) : null;
  const unit = (v?.age_unit || "tuổi").toLowerCase();
  const doses = Number(v?.doses_required) || 1;

  const renderVal = (val) => {
    if (val == null) return null;
    if (unit === "tháng") {
      // đổi ra tuổi nếu tròn năm (>= 24 tháng)
      if (val >= 24 && val % 12 === 0) return `${val / 12} tuổi`;
      return `${val} tháng`;
    }
    return `${val} tuổi`;
  };

  const minStr = renderVal(min);
  const maxStr = renderVal(max);

  let rangeText = "";
  if (minStr && maxStr) rangeText = `Từ ${minStr} - ${maxStr}`;
  else if (minStr && !maxStr) rangeText = `Từ ${minStr} trở lên`;
  else if (!minStr && maxStr) rangeText = `Đến ${maxStr}`;
  else rangeText = "Theo khuyến cáo";

  return `${rangeText} (${doses} Liều)`;
};


// utils/schedule.js
export const formatTargetAge = (v) => {
  const min = Number.isFinite(Number(v?.min_age)) ? Number(v.min_age) : null;
  const max = Number.isFinite(Number(v?.max_age)) ? Number(v.max_age) : null;
  const unit = (v?.age_unit || "tuổi").toLowerCase(); // "tuổi" | "tháng"

  const renderVal = (val) => {
    if (val == null) return null;
    if (unit === "tháng") {
      // nếu >=24 tháng và chia hết cho 12 thì hiển thị tuổi cho dễ đọc
      if (val >= 24 && val % 12 === 0) return `${val / 12} tuổi`;
      return `${val} tháng`;
    }
    return `${val} tuổi`;
  };

  const minStr = renderVal(min);
  const maxStr = renderVal(max);

  if (minStr && maxStr) return `Từ ${minStr} đến dưới ${maxStr}`;
  if (minStr && !maxStr) return `Từ ${minStr} trở lên`;
  if (!minStr && maxStr) return `Dưới ${maxStr}`;
  return null; // để FE fallback "Theo khuyến cáo"
};
