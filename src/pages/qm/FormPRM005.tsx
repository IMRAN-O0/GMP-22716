import { useState } from "react";
import { Droplets } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import {
  RepeatableTable,
  FormActions,
  useQmFormSubmit,
  useEditLoader,
  type ColumnDef,
} from "./_shared/qmForm";

const DRAIN = [
  { value: "نظيف وانسياب جيد", label: "نظيف وانسياب جيد" },
  { value: "انسداد جزئي", label: "انسداد جزئي" },
  { value: "مسدود", label: "مسدود" },
];
const YESNO = [
  { value: "لا", label: "لا" },
  { value: "نعم", label: "نعم" },
];

const COLUMNS: ColumnDef[] = [
  { key: "location", label: "موقع نقطة الصرف", width: "26%", placeholder: "الموقع" },
  { key: "drainStatus", label: "حالة الصرف", type: "select", options: DRAIN },
  { key: "odorsPresent", label: "وجود روائح؟", type: "select", options: YESNO },
  { key: "trapIntact", label: "السيفون سليم؟", type: "select", options: YESNO },
  { key: "notes", label: "ملاحظات", placeholder: "—" },
];

const emptyRow = () => ({
  location: "",
  drainStatus: "نظيف وانسياب جيد",
  odorsPresent: "لا",
  trapIntact: "نعم",
  notes: "",
});

export default function FormPRM005() {
  const { user } = useAuth();
  const { submit } = useQmFormSubmit("F-PRM-005", "تم حفظ فحص أنظمة الصرف");

  const [formData, setFormData] = useState<any>({
    date: new Date().toISOString().split("T")[0],
    inspector: user?.name || "",
    drains: [emptyRow(), emptyRow()],
    notes: "",
  });

  useEditLoader(setFormData);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center gap-3 mb-6 bg-white p-4 rounded-xl border border-sky-200 shadow-sm border-r-4 border-r-sky-500">
        <div className="p-3 bg-sky-50 rounded-lg text-sky-600">
          <Droplets className="w-8 h-8" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            فحص أنظمة الصرف (Drainage Inspection)
          </h1>
          <p className="text-slate-500">النموذج: F-PRM-005 | فحص متعدّد لنقاط الصرف</p>
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
          <label className="block text-sm font-semibold text-slate-700 mb-2">فحص نقاط الصرف</label>
          <RepeatableTable
            columns={COLUMNS}
            rows={formData.drains}
            onChange={(rows) => setFormData({ ...formData, drains: rows })}
            newRow={emptyRow}
            addLabel="إضافة نقطة صرف"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">ملاحظات عامة</label>
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
