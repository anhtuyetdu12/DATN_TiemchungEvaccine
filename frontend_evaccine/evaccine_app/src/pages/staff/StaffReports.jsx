import { useState } from "react";
import { Bar, Pie, Line } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, ArcElement,  LineElement, PointElement, BarElement, Title, Tooltip, Legend } from "chart.js";

// Register các component cần thiết cho Chart.js
ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement,LineElement, PointElement, Title, Tooltip, Legend);


export default function StaffReports() {
  const [activeTab, setActiveTab] = useState("overview");

  // Dummy data
  const vaccines = [
    { name: "Pfizer", stock: 15, expiry: "2025-10-20" },
    { name: "Moderna", stock: 5, expiry: "2025-09-30" },
    { name: "VNVC", stock: 0, expiry: "2025-11-01" },
  ];

  const customers = [
    { name: "Nguyen Van A", phone: "0123456789", status: "Đã tiêm" },
    { name: "Tran Thi B", phone: "0987654321", status: "Chưa tiêm" },
    { name: "Le Van C", phone: "0912345678", status: "Lịch hôm nay" },
  ];

  const chartBarData = {
    labels: ["Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7", "Chủ nhật"],
    datasets: [
      {
        label: "Số mũi tiêm",
        data: [12, 19, 8, 15, 22, 10, 5],
        backgroundColor: "#3b82f6",
      },
    ],
  };

   const chartPieData = {
    labels: ["Còn hàng", "Sắp hết", "Hết hàng"],
    datasets: [
      {
        data: [
          vaccines.filter(v => v.stock > 20).length,
          vaccines.filter(v => v.stock <= 20 && v.stock > 0).length,
          vaccines.filter(v => v.stock === 0).length
        ],
        backgroundColor: ["#22c55e", "#facc15", "#ef4444"],
      },
    ],
  };

  const chartLineData = {
    labels: ["Tuần 1", "Tuần 2", "Tuần 3", "Tuần 4"],
    datasets: [
      {
        label: "Số mũi tiêm trong tháng",
        data: [50, 75, 60, 90],
        borderColor: "#3b82f6",
        backgroundColor: "#93c5fd",
        tension: 0.3
      },
    ],
  };


  return (
    <div className="tw-min-h-screen tw-bg-white tw-p-6 tw-font-sans">
      <div className="tw-max-w-full tw-mx-auto tw-grid tw-gap-6 tw-py-[120px]">
        <div className="tw-p-6 tw-space-y-6">
          {/* Banner cảnh báo */}
          <div className="tw-bg-yellow-100 tw-border-l-4 tw-border-yellow-500 tw-text-yellow-700 tw-p-4">
            <p className="tw-font-medium">
              Có {vaccines.filter(v => v.stock <= 20 && v.stock > 0).length} loại vaccine sắp hết hàng và{" "}
              {vaccines.filter(v => new Date(v.expiry) < new Date(Date.now() + 30*24*60*60*1000)).length} loại vaccine sắp hết hạn.
            </p>
          </div>

          {/* Thống kê nhanh */}
          <div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-3 tw-gap-4">
            <div className="tw-bg-blue-100 tw-p-4 tw-rounded-lg">
              <h2 className="tw-text-xl tw-font-semibold">Lịch hẹn hôm nay</h2>
              <p className="tw-text-3xl tw-font-bold">8</p>
            </div>
            <div className="tw-bg-green-100 tw-p-4 tw-rounded-lg">
              <h2 className="tw-text-xl tw-font-semibold">Khách đã tiêm</h2>
              <p className="tw-text-3xl tw-font-bold">25</p>
            </div>
            <div className="tw-bg-red-100 tw-p-4 tw-rounded-lg">
              <h2 className="tw-text-xl tw-font-semibold">Vaccine sắp hết</h2>
              <p className="tw-text-3xl tw-font-bold">{vaccines.filter(v => v.stock <= 20).length}</p>
            </div>
          </div>

          {/* Tabs */}
          <div>
            <div className="tw-flex tw-space-x-4 tw-border-b tw-border-gray-200">
              <button
                className={`tw-py-2 tw-px-4 ${activeTab === "overview" ? "tw-border-b-2 tw-border-blue-500 tw-font-bold" : ""}`}
                onClick={() => setActiveTab("overview")}
              >
                Tổng quan
              </button>
              <button
                className={`tw-py-2 tw-px-4 ${activeTab === "vaccines" ? "tw-border-b-2 tw-border-blue-500 tw-font-bold" : ""}`}
                onClick={() => setActiveTab("vaccines")}
              >
                Vaccine
              </button>
              <button
                className={`tw-py-2 tw-px-4 ${activeTab === "customers" ? "tw-border-b-2 tw-border-blue-500 tw-font-bold" : ""}`}
                onClick={() => setActiveTab("customers")}
              >
                Khách hàng
              </button>
            </div>

            <div className="tw-mt-4">
              {activeTab === "overview" && (
                <div className="tw-space-y-6">
                    {/* Flex container cho 2 biểu đồ */}
                    <div className="tw-flex tw-flex-col md:tw-flex-row tw-gap-6 md:tw-justify-between">
                        <div className="tw-flex-1 tw-min-w-0">
                            <h3 className="tw-text-lg tw-font-semibold tw-mb-2">Biểu đồ lịch tiêm tuần này</h3>
                            <Bar data={chartBarData} />
                        </div>
                        <div className="tw-flex-1 tw-min-w-0 tw-flex tw-justify-end">
                            <h3 className="tw-text-lg tw-font-semibold tw-mb-2">Tỷ lệ vaccine theo trạng thái kho</h3>
                             <div className="tw-h-[400px] tw-w-[400px]">
                                <Pie data={chartPieData} options={{ maintainAspectRatio: false }} />
                            </div>
                        </div>
                    </div>

                    {/* Biểu đồ Line vẫn nằm bên dưới */}
                    <div className="tw-flex tw-flex-col md:tw-flex-row tw-gap-6 md:tw-justify-between">
                        <div className="tw-flex-1 tw-min-w-0">
                            <h3 className="tw-text-lg tw-font-semibold tw-mb-2">Xu hướng tiêm trong tháng</h3>
                            <Line data={chartLineData} />
                        </div>
                        <div className="tw-flex-1 tw-min-w-0 tw-flex tw-justify-end">
                            <h3 className="tw-text-lg tw-font-semibold tw-mb-2">Tỷ lệ vaccine theo trạng thái kho</h3>
                            <div className="tw-h-[400px] tw-w-[400px]">
                                <Pie data={chartPieData} options={{ maintainAspectRatio: false }} />
                            </div>
                        </div>
                    </div>
                    
                </div>
                )}

              {activeTab === "vaccines" && (
                <div className="tw-overflow-x-auto">
                  <table className="tw-min-w-full tw-border tw-border-gray-200 tw-rounded-lg">
                    <thead className="tw-bg-gray-50">
                      <tr>
                        <th className="tw-px-4 tw-py-2 tw-border">Tên vaccine</th>
                        <th className="tw-px-4 tw-py-2 tw-border">Tồn kho</th>
                        <th className="tw-px-4 tw-py-2 tw-border">Hạn sử dụng</th>
                        <th className="tw-px-4 tw-py-2 tw-border">Trạng thái</th>
                      </tr>
                    </thead>
                    <tbody>
                      {vaccines.map((v, idx) => (
                        <tr key={idx} className="tw-text-center">
                          <td className="tw-px-4 tw-py-2 tw-border">{v.name}</td>
                          <td className="tw-px-4 tw-py-2 tw-border">{v.stock}</td>
                          <td className="tw-px-4 tw-py-2 tw-border">{v.expiry}</td>
                          <td className="tw-px-4 tw-py-2 tw-border">
                            {v.stock === 0 ? (
                              <span className="tw-bg-red-500 tw-text-white tw-px-2 tw-rounded">Hết hàng</span>
                            ) : v.stock <= 20 ? (
                              <span className="tw-bg-yellow-500 tw-text-white tw-px-2 tw-rounded">Sắp hết</span>
                            ) : (
                              <span className="tw-bg-green-500 tw-text-white tw-px-2 tw-rounded">Còn hàng</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {activeTab === "customers" && (
                <div className="tw-overflow-x-auto">
                  <table className="tw-min-w-full tw-border tw-border-gray-200 tw-rounded-lg">
                    <thead className="tw-bg-gray-50">
                      <tr>
                        <th className="tw-px-4 tw-py-2 tw-border">Tên khách hàng</th>
                        <th className="tw-px-4 tw-py-2 tw-border">SĐT</th>
                        <th className="tw-px-4 tw-py-2 tw-border">Trạng thái</th>
                        <th className="tw-px-4 tw-py-2 tw-border">Chi tiết</th>
                      </tr>
                    </thead>
                    <tbody>
                      {customers.map((c, idx) => (
                        <tr key={idx} className="tw-text-center">
                          <td className="tw-px-4 tw-py-2 tw-border">{c.name}</td>
                          <td className="tw-px-4 tw-py-2 tw-border">{c.phone}</td>
                          <td className="tw-px-4 tw-py-2 tw-border">{c.status}</td>
                          <td className="tw-px-4 tw-py-2 tw-border">
                            <button className="tw-bg-blue-500 tw-text-white tw-px-2 tw-py-1 tw-rounded">
                              Xem chi tiết
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>

  );
}
