import { useState } from "react";
import { Wind } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import {
  RepeatableTable,
  FormActions,
  useQmFormSubmit,
  useEditLoader,
  type ColumnDef,
} from "./_shared/qmForm";

const FILTER = [
  { value: "نظيف", label: "نظيف" },
  { value: "يحتاج تغيير", label: "يحتاج تغيير" },
];
const STATUS = [
  { value: "مطابق", label: "مطابق" },
  { value: "غير مطابق", label: "غير مطابق" },
];

const COLUMNS: ColumnDef[] = [
  { key: "area", label: "المنطقة", width: "20%", placeholder: "المنطقة" },
  { key: "particulateCount", label: "عدّ الجسيمات", placeholder: "—" },
  { key: "microbialCount", label: "العدّ الميكروبي", placeholder: "—" },
  { key: "airPressureDiff", label: "فرق الضغط (Pa)", placeholder: "—" },
  { key: "filterStatus", label: "حالة الفلتر", type: "select", options: FILTER },
  { key: "status", label: "النتيجة", type: "select", options: STATUS },
];

const emptyRow = () => ({
  area: "",
  particulateCount: "",
  microbialCount: "",
  airPressureDiff: "",
  filterStatus: "نظيف",
  status: "مطابق",
});

export default function FormPRM004() {
  const { user } = useAuth();
  const { submit } = useQmFormSubmit("F-PRM-004", "تم حفظ مراقبة جودة الهواء");

  const [formData, setFormData] = useState<any>({
    date: new Date().toISOString().split("T")[0],
    inspector: user?.name || "",
    readings: [emptyRow(), emptyRow()],
    notes: "",
  });

  useEditLoader(setFormData);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center gap-3 mb-6 bg-white p-4 rounded-xl border border-sky-200 shadow-sm border-r-4 border-r-sky-500">
        <div className="p-3 bg-sky-50 rounded-lg text-sky-600">
          <Wind className="w-8 h-8" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            مراقبة جودة الهواء (Air Quality Monitoring)
          </h1>
          <p className="text-slate-500">النموذج: F-PRM-004 | قياسات متعدّدة المناطق</p>
        </div>
      </div>

      <form
        onSubmit={(e) => e.preventDefault()}
        className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-6"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">التاريخ</label>
            <input
              type="date"
              required
              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-sky-500"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">المفتش</label>
            <input
              type="text"
              readOnly
              className="w-full px-4 py-2 bg-slate-100 border border-slate-200 rounded-lg text-slate-500"
              value={formData.inspector}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">قياسات جودة الهواء</label>
          <RepeatableTable
            columns={COLUMNS}
            rows={formData.readings}
            onChange={(rows) => setFormData({ ...formData, readings: rows })}
            newRow={emptyRow}
            addLabel="إضافة منطقة"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">ملاحظات</label>
          <textarea
            rows={2}
            className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-sky-500"
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          />
        </div>

        <FormActions onSubmit={(status) => submit(formData, status)} />
      </form>
    </div>
  );
}
