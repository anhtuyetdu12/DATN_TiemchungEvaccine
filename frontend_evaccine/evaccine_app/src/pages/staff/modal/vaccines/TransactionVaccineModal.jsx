import React from "react";
import Dropdown from "../../../../components/Dropdown";
import QuantityPicker from "../../../../components/QuantityPicker";

export default function TransactionVaccineModal({
  show,
  onClose,
  onSave,
  stockForm,
  setStockForm,
  vaccines,
  suppliers,
}) {
  if (!show) return null;

  return (
    <div className="tw-fixed tw-inset-0 tw-bg-black/50 tw-flex tw-justify-center tw-items-center tw-pt-[100px]">
      <div className="tw-bg-white tw-rounded-xl tw-p-6 tw-w-[550px] tw-text-left">
        <h2 className="tw-text-3xl tw-font-bold tw-text-blue-600 tw-text-center">
          Quản lý giao dịch vắc xin
        </h2>

        {/* Chọn vắc xin */}
        <Dropdown  label="Chọn vắc xin" value={stockForm.vaccineId}
          options={vaccines.map((v) => ({ value: v.id, label: v.name }))}
          onChange={(val) => setStockForm({ ...stockForm, vaccineId: val })}
        />

        {/* Loại giao dịch + số lượng */}
        <div className="tw-grid tw-grid-cols-2 tw-gap-24 ">
          <Dropdown label="Loại giao dịch"
            value={stockForm.type}
            options={[
              { value: "nhập", label: "nhập" },
              { value: "xuất", label: "xuất" },
              { value: "điều chỉnh", label: "điều chỉnh" },
            ]}
            onChange={(val) => setStockForm({ ...stockForm, type: val })}
          />

          <div>
            <label className="tw-block tw-mb-2 tw-text-gray-700 tw-font-medium">  Số lượng </label>
            <QuantityPicker  value={stockForm.quantity}
              onChange={(value) => setStockForm({ ...stockForm, quantity: value })}
            />
          </div>
        </div>

        {/* Mã vaccine + Số lô */}
        {stockForm.type === "nhập" && (
        <div className="tw-grid tw-grid-cols-2 tw-gap-4">
          <div>
            <label className="tw-block tw-mb-2 tw-text-gray-700 tw-font-medium">
              Mã vaccine
            </label>
            <input type="text"  className="tw-w-full tw-border tw-rounded tw-px-3 tw-py-2 
                  focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-blue-300 focus:tw-border-blue-800"
              value={stockForm.vaccineCode || ""}
              onChange={(e) =>
                setStockForm({ ...stockForm, vaccineCode: e.target.value })
              }
            />
          </div>
          
            <div>
              <label className="tw-block tw-mb-2 tw-text-gray-700 tw-font-medium"> Số lô </label>
              <input  type="text" className="tw-w-full tw-border tw-rounded tw-px-3 tw-py-2 
                      focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-blue-300 focus:tw-border-blue-800"
                value={stockForm.batchNumber || ""}
                onChange={(e) =>
                  setStockForm({ ...stockForm, batchNumber: e.target.value })
                }
              />
            </div>
          
        </div>
        )}

        {/* Hạn sử dụng + Đơn vị (chỉ nhập) */}
        {stockForm.type === "nhập" && (
          <div className="tw-grid tw-grid-cols-2 tw-gap-4 tw-mt-2">
            <div>
              <label className="tw-block tw-mb-2 tw-text-gray-700 tw-font-medium">  Hạn sử dụng  </label>
              <input  type="date"  className="tw-w-full tw-border tw-rounded tw-px-3 tw-py-2 
                      focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-blue-300 focus:tw-border-blue-800"
                value={stockForm.expiryDate || ""} min={new Date().toISOString().split("T")[0]}
                onChange={(e) =>
                  setStockForm({ ...stockForm, expiryDate: e.target.value })
                }
              />
            </div>
            <div>
              <label className="tw-block tw-mb-2 tw-text-gray-700 tw-font-medium">  Đơn vị </label>
              <input type="text" placeholder="Ví dụ: liều, lọ…"
                className="tw-w-full tw-border tw-rounded tw-px-3 tw-py-2 
                        focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-blue-300 focus:tw-border-blue-800"
                value={stockForm.unit || ""}
                onChange={(e) =>
                  setStockForm({ ...stockForm, unit: e.target.value })
                }
              />
            </div>
          </div>
        )}

        {/* Đơn giá + Nguồn */}
        <div className="tw-flex tw-gap-4 tw-mt-2">
          <div className="tw-flex-1">
            <label className="tw-block tw-mb-2 tw-text-gray-700 tw-font-medium">
              Đơn giá (VNĐ)
            </label>
            <input  type="number" min="0" className="tw-w-full tw-border tw-rounded tw-px-3 tw-py-2 
                    focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-blue-300 focus:tw-border-blue-800"
              value={stockForm.unitPrice || ""}
              onChange={(e) =>
                setStockForm({ ...stockForm, unitPrice: Number(e.target.value) })
              }
            />
          </div>

          {stockForm.type === "nhập" && (
            <Dropdown  label="Nhà cung cấp" value={stockForm.source}
              options={suppliers.map((s) => ({ value: s.value, label: s.label }))}
              onChange={(val) => {
                const selected = suppliers.find((s) => s.value === val);
                setStockForm({
                  ...stockForm,
                  source: val,
                  supplierAddress: selected?.address || "",
                  supplierContact: selected?.contact || "",
                });
              }}  className="tw-flex-1"
            />
          )}

          {stockForm.type === "xuất" && (
            <div className="tw-flex-1">
              <label className="tw-block tw-mb-2 tw-text-gray-700 tw-font-medium">  Nơi nhận </label>
              <input type="text" className="tw-w-full tw-border tw-rounded tw-px-3 tw-py-2"
                value={stockForm.source}
                onChange={(e) =>
                  setStockForm({ ...stockForm, source: e.target.value })
                }
              />
            </div>
          )}
        </div>

        {/* Địa chỉ + Liên hệ */}
        {(stockForm.type === "nhập" || stockForm.type === "xuất") && (
          <div className="tw-grid tw-grid-cols-2 tw-gap-4 tw-mt-2">
            <div>
              <label className="tw-block tw-mb-2 tw-text-gray-700 tw-font-medium">  Địa chỉ </label>
              <input
                type="text"
                className="tw-w-full tw-border tw-rounded tw-px-3 tw-py-2"
                value={stockForm.supplierAddress}
                onChange={(e) =>
                  setStockForm({ ...stockForm, supplierAddress: e.target.value })
                }
              />
            </div>
            <div>
              <label className="tw-block tw-mb-2 tw-text-gray-700 tw-font-medium"> Liên hệ </label>
              <input  type="text"  className="tw-w-full tw-border tw-rounded tw-px-3 tw-py-2
                    focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-blue-300 focus:tw-border-blue-800"
                value={stockForm.supplierContact}
                onChange={(e) =>
                  setStockForm({ ...stockForm, supplierContact: e.target.value })
                }
              />
            </div>
          </div>
        )}

        {/* Ghi chú */}
        <label className="tw-block tw-mb-2 tw-text-gray-700 tw-font-medium mt-2"> Ghi chú </label>
        <textarea className="tw-w-full tw-border tw-rounded tw-px-3 tw-py-2 tw-mb-3
                focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-blue-300 focus:tw-border-blue-800"
          value={stockForm.note}
          onChange={(e) => setStockForm({ ...stockForm, note: e.target.value })}
        />

        {/* Buttons */}
        <div className="tw-flex tw-justify-end tw-gap-2">
          <button onClick={onClose} className="tw-bg-red-600 tw-text-white tw-rounded-full tw-px-6 tw-py-2" >
            Hủy
          </button>
          <button  onClick={onSave} className="tw-bg-blue-600 tw-text-white tw-rounded-full tw-px-6 tw-py-2"  >
            Lưu
          </button>
        </div>
      </div>
    </div>
  );
}
