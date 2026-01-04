// utils/printHelpers.js

const defaultCenterInfo = {
  name: "Trung tâm tiêm chủng eVaccine",
  address: "Địa chỉ: 255 Lê Duẩn, Thanh Khê, Tp. Đà Nẵng",
  hotline: "Hotline: 1800 6926",
};

export const formatDateVi = (dateString) => {
  if (!dateString) return "-";
  const d = new Date(dateString);
  if (Number.isNaN(d.getTime())) return "-";
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
};

export const openPrintWindow = (html) => {
  const win = window.open("", "_blank");
  if (!win) {
    throw new Error(
      "Trình duyệt đang chặn cửa sổ in. Hãy tắt chặn popup và thử lại."
    );
  }
  win.document.open();
  win.document.write(html);
  win.document.close();
  win.focus();
  win.print();
};

const baseStyles = `
  <style>
    body {
      font-family: Arial, sans-serif;
      margin: 40px;
      color: #222;
    }
    .sheet {
      width: 100%;
      max-width: 800px;
      margin: 0 auto;
      padding: 24px 28px;
      border: 1px solid #ddd;
      border-radius: 12px;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 16px;
    }
    .brand {
      font-size: 18px;
      font-weight: bold;
      color: #0d6efd;
      text-transform: uppercase;
    }
    .sub {
      font-size: 12px;
      color: #555;
      line-height: 1.5;
    }
    .info-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 13px;
      margin-bottom: 8px;
    }
    .info-table td {
      padding: 4px 0;
      vertical-align: top;
    }
    .label {
      width: 160px;
      color: #555;
    }
    .value {
      font-weight: 500;
      color: #222;
    }
    .footer {
      display: flex;
      justify-content: space-between;
      margin-top: 32px;
      font-size: 12px;
    }
    .sign-col {
      text-align: center;
      width: 48%;
    }
    .sign-label {
      font-weight: 500;
      margin-bottom: 60px;
    }
    @media print {
      body {
        margin: 10mm;
      }
      .sheet {
        border: none;
        box-shadow: none;
      }
    }
  </style>
`;

// ---- Phiếu xác nhận lịch hẹn ----
export const buildAppointmentConfirmationHtml = ({
  customer,
  center,
  appt,
  formatDate = formatDateVi,
}) => {
  const centerInfo = {
    ...defaultCenterInfo,
    ...(center || {}),
  };

  const statusMap = {
    confirmed: {
      label: "ĐÃ XÁC NHẬN",
      className: "status-confirmed",
      bg: "#d1e7dd",
      color: "#0f5132",
    },
    completed: {
      label: "ĐÃ HOÀN TẤT",
      className: "status-completed",
      bg: "#cfe2ff",
      color: "#084298",
    },
    cancelled: {
      label: "ĐÃ HỦY (KHÔNG CÒN HIỆU LỰC)",
      className: "status-cancelled",
      bg: "#f8d7da",
      color: "#842029",
    },
    pending: {
      label: "CHỜ XÁC NHẬN",
      className: "status-pending",
      bg: "#fff3cd",
      color: "#664d03",
    },
  };

  const st = statusMap[appt.status] || statusMap.pending;

  return `
    <html>
      <head>
        <meta charset="UTF-8" />
        <title>Phiếu xác nhận lịch hẹn tiêm chủng</title>
        ${baseStyles}
        <style>
          .title {
            text-align: center;
            font-size: 20px;
            font-weight: 700;
            margin: 12px 0 4px 0;
            text-transform: uppercase;
            color: #d63384;
          }
          .code {
            text-align: center;
            font-size: 13px;
            color: #666;
            margin-bottom: 16px;
          }
          .section-title {
            font-weight: 600;
            font-size: 14px;
            margin: 12px 0 4px 0;
            text-transform: uppercase;
            color: #0d6efd;
          }
          .box {
            margin-top: 8px;
            padding: 10px 12px;
            background: #f8f9fa;
            border-radius: 8px;
            font-size: 13px;
          }
          .status {
            display: inline-block;
            padding: 4px 10px;
            border-radius: 999px;
            font-size: 11px;
            font-weight: 600;
            margin-top: 4px;
            background: ${st.bg};
            color: ${st.color};
          }
        </style>
      </head>
      <body>
        <div class="sheet">
          <div class="header">
            <div>
              <div class="brand">${centerInfo.name}</div>
              <div class="sub">
                ${centerInfo.address || ""}<br />
                ${centerInfo.hotline || ""}
              </div>
            </div>
            <div class="sub" style="text-align:right">
              Mã hồ sơ: <strong>${customer.code || "-"}</strong><br/>
              Ngày in: ${new Date().toLocaleDateString("vi-VN")}
            </div>
          </div>

          <div class="title">PHIẾU XÁC NHẬN LỊCH HẸN TIÊM CHỦNG</div>
          <div class="code">(Áp dụng cho lịch hẹn bên dưới)</div>

          <div class="section-title">1. Thông tin khách hàng</div>
          <table class="info-table">
            <tr><td class="label">Chủ hồ sơ:</td><td class="value">${customer.name || ""}</td></tr>
            <tr><td class="label">Số điện thoại:</td><td class="value">${customer.phone || ""}</td></tr>
            <tr><td class="label">Email:</td><td class="value">${customer.email || ""}</td></tr>
            <tr><td class="label">Người tiêm:</td><td class="value">${appt.memberName || customer.name || ""}</td></tr>
          </table>

          <div class="section-title">2. Thông tin lịch hẹn</div>
          <div class="box">
            <table class="info-table">
              <tr><td class="label">Ngày tiêm dự kiến:</td><td class="value">${formatDate(appt.date)}</td></tr>
              <tr><td class="label">Địa điểm:</td><td class="value">${appt.center || centerInfo.name}</td></tr>
              <tr><td class="label">Vắc xin / Gói tiêm:</td><td class="value">${appt.vaccine || "-"}</td></tr>
              <tr>
                <td class="label">Tổng chi phí dự kiến:</td>
                <td class="value">${
                  appt.price
                    ? appt.price.toLocaleString("vi-VN") + " VNĐ"
                    : "Sẽ được tư vấn tại quầy"
                }</td>
              </tr>
            </table>
            <div class="status">${st.label}</div>
          </div>

          <div class="section-title">3. Ghi chú</div>
          <div class="sub">
            - Phiếu dùng để xác nhận lịch hẹn tiêm chủng cho người tiêm nêu trên, không thay thế giấy tờ tùy thân.<br/>
            - Vui lòng đến trước giờ hẹn 10-15 phút để làm thủ tục và sàng lọc trước tiêm.<br/>
            - Nếu cần thay đổi lịch hẹn, liên hệ hotline trung tâm trước ngày tiêm.
          </div>

          <div class="footer">
            <div class="sign-col">
              <div class="sign-label">KHÁCH HÀNG</div>
              <div>(Ký và ghi rõ họ tên)</div>
            </div>
            <div class="sign-col">
              <div class="sign-label">XÁC NHẬN CỦA TRUNG TÂM</div>
              <div>(Ký, ghi rõ họ tên và đóng dấu)</div>
            </div>
          </div>
        </div>
      </body>
    </html>
  `;
};

// ---- Phiếu sau tiêm ----
export const buildPostInjectionHtml = ({
  customer,
  center,
  record,
  memberName,
  memberDob,
  regimenNote,
  formatDate = formatDateVi,
}) => {
  const centerInfo = {
    ...defaultCenterInfo,
    ...(center || {}),
  };

  return `
    <html>
      <head>
        <meta charset="UTF-8" />
        <title>Phiếu thông tin sau tiêm</title>
        ${baseStyles}
        <style>
          .title {
            text-align: center;
            font-size: 20px;
            font-weight: 700;
            margin: 12px 0 4px 0;
            text-transform: uppercase;
            color: #198754;
          }
          .code {
            text-align: center;
            font-size: 13px;
            color: #666;
            margin-bottom: 16px;
          }
          .section-title {
            font-weight: 600;
            font-size: 14px;
            margin: 12px 0 4px 0;
            text-transform: uppercase;
            color: #0d6efd;
          }
          .note {
            font-size: 11px;
            color: #777;
            margin-top: 10px;
            line-height: 1.5;
          }
          .status {
            display: inline-block;
            padding: 4px 10px;
            border-radius: 999px;
            font-size: 11px;
            font-weight: 700;
            margin-top: 4px;
            background: #d1e7dd;
            color: #0f5132;
          }
        </style>
      </head>
      <body>
        <div class="sheet">
          <div class="header">
            <div>
              <div class="brand">${centerInfo.name}</div>
              <div class="sub">
                ${centerInfo.address || ""}<br />
                ${centerInfo.hotline || ""}
              </div>
            </div>
            <div class="sub" style="text-align:right">
              Mã hồ sơ: <strong>${customer.code || "-"}</strong><br/>
              Ngày in: ${new Date().toLocaleDateString("vi-VN")}
            </div>
          </div>

          <div class="title">PHIẾU THÔNG TIN SAU TIÊM</div>
          <div class="code">(Xác nhận mũi tiêm đã thực hiện tại trung tâm)</div>

          <div class="section-title">1. Thông tin người tiêm</div>
          <table class="info-table">
            <tr><td class="label">Họ tên người tiêm:</td><td class="value">${memberName}</td></tr>
            <tr><td class="label">Ngày sinh:</td><td class="value">${memberDob ? formatDate(memberDob) : "-"}</td></tr>
            <tr><td class="label">Chủ hồ sơ:</td><td class="value">${customer.name || ""}</td></tr>
            <tr><td class="label">Số điện thoại liên hệ:</td><td class="value">${customer.phone || ""}</td></tr>
          </table>

          <div class="section-title">2. Thông tin mũi tiêm</div>
          <table class="info-table">
            <tr><td class="label">Ngày tiêm:</td><td class="value">${record.date ? formatDate(record.date) : "-"}</td></tr>
            <tr><td class="label">Vắc xin:</td><td class="value">${record.vaccine || "-"}</td></tr>
            <tr><td class="label">Phòng bệnh:</td><td class="value">${record.disease || "-"}</td></tr>
            <tr><td class="label">Mũi thứ:</td><td class="value">${record.dose || "-"}</td></tr>
            <tr><td class="label">Số lô:</td><td class="value">${record.batch || "-"}</td></tr>
            <tr><td class="label">Cơ sở tiêm:</td><td class="value">${record.place || centerInfo.name}</td></tr>
          </table>

          <div class="status">ĐÃ TIÊM</div>

          <div class="section-title">3. Thông tin về mũi tiếp theo</div>
          <div class="note">${regimenNote}</div>

          <div class="section-title">4. Lưu ý sau tiêm</div>
          <div class="note">
            - Theo dõi tại cơ sở y tế tối thiểu 30 phút sau tiêm.<br/>
            - Trong 24-48 giờ đầu, nếu có sốt cao, co giật, khó thở, tím tái, phát ban toàn thân hoặc bất thường khác, cần đến ngay cơ sở y tế gần nhất.<br/>
            - Mang theo phiếu này (hoặc hình ảnh) khi đến tiêm các mũi tiếp theo.
          </div>

          <div class="footer">
            <div class="sign-col">
              <div class="sign-label">NGƯỜI TIÊM / NGƯỜI GIÁM HỘ</div>
              <div>(Ký và ghi rõ họ tên)</div>
            </div>
            <div class="sign-col">
              <div class="sign-label">BÁC SĨ/ĐIỀU DƯỠNG TIÊM</div>
              <div>(Ký, ghi rõ họ tên)</div>
            </div>
          </div>
        </div>
      </body>
    </html>
  `;
};
