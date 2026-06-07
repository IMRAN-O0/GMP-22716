import { useState } from "react";
import { ThermometerSun } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import {
  RepeatableTable,
  FormActions,
  useQmFormSubmit,
  useEditLoader,
  type ColumnDef,
} from "./_shared/qmForm";

const STATUS = [
  { value: "ضمن الحدود", label: "ضمن الحدود" },
  { value: "خارج الحدود", label: "خارج الحدود" },
];

const COLUMNS: ColumnDef[] = [
  { key: "time", label: "الوقت", type: "time", width: "12%" },
  { key: "area", label: "المنطقة", placeholder: "المنطقة" },
  { key: "temp", label: "الحرارة °م", type: "number" },
  { key: "tempLimit", label: "حد الحرارة المسموح", placeholder: "مثال: 15-25" },
  { key: "humidity", label: "الرطوبة %", type: "number" },
  { key: "humidityLimit", label: "حد الرطوبة المسموح", placeholder: "مثال: ≥65" },
  { key: "status", label: "الحالة", type: "select", options: STATUS },
];

const emptyRow = () => ({
  time: "",
  area: "",
  temp: "",
  tempLimit: "",
  humidity: "",
  humidityLimit: "",
  status: "ضمن الحدود",
});

export default function FormPRM002() {
  const { user } = useAuth();
  const { submit } = useQmFormSubmit("F-PRM-002", "تم حفظ سجل الحرارة والرطوبة");

  const [formData, setFormData] = useState<any>({
    logDate: new Date().toISOString().split("T")[0],
    recordedBy: user?.name || "",
    readings: [emptyRow(), emptyRow()],
    remarks: "",
  });

  useEditLoader(setFormData);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center gap-3 mb-6 bg-white p-4 rounded-xl border border-sky-200 shadow-sm border-r-4 border-r-sky-500">
        <div className="p-3 bg-sky-50 rounded-lg text-sky-600">
          <ThermometerSun className="w-8 h-8" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            مراقبة الحرارة والرطوبة (Temperature & Humidity Log)
          </h1>
          <p className="text-slate-500">النموذج: F-PRM-002 | سجل قراءات يومي متعدّد المناطق</p>
        </div>
      </div>

      <form
        onSubmit={(e) => e.preventDefault()}
        className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-6"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">تاريخ السجل</label>
            <input
              type="date"
              required
              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-sky-500"
              value={formData.logDate}
              onChange={(e) => setFormData({ ...formData, logDate: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">القائم بالتسجيل</label>
            <input
              type="text"
              readOnly
              className="w-full px-4 py-2 bg-slate-100 border border-slate-200 rounded-lg text-slate-500"
              value={formData.recordedBy}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">قراءات الحرارة والرطوبة</label>
          <RepeatableTable
            columns={COLUMNS}
            rows={formData.readings}
            onChange={(rows) => setFormData({ ...formData, readings: rows })}
            newRow={emptyRow}
            addLabel="إضافة قراءة"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">ملاحظات / إجراءات تصحيحية</label>
          <textarea
            rows={2}
            className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-sky-500"
            value={formData.remarks}
            onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
          />
        </div>

        <FormActions onSubmit={(status) => submit(formData, status)} />
      </form>
    </div>
  );
}
