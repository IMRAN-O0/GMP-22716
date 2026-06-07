import { useState } from "react";
import { Lightbulb } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import {
  RepeatableTable,
  FormActions,
  useQmFormSubmit,
  useEditLoader,
  type ColumnDef,
} from "./_shared/qmForm";

const YESNO = [
  { value: "نعم", label: "نعم" },
  { value: "لا", label: "لا" },
];
const STATUS = [
  { value: "مطابق", label: "مطابق" },
  { value: "غير مطابق", label: "غير مطابق" },
];

const COLUMNS: ColumnDef[] = [
  { key: "area", label: "المنطقة / المنطقة الضوئية", width: "22%", placeholder: "المنطقة" },
  { key: "luxReading", label: "شدة الإضاءة (Lux)", type: "number" },
  { key: "minRequired", label: "الحد الأدنى المطلوب", type: "number" },
  { key: "coversIntact", label: "الأغطية سليمة؟", type: "select", options: YESNO },
  { key: "fixturesClean", label: "الوحدات نظيفة؟", type: "select", options: YESNO },
  { key: "status", label: "النتيجة", type: "select", options: STATUS },
];

const emptyRow = () => ({
  area: "",
  luxReading: "",
  minRequired: "",
  coversIntact: "نعم",
  fixturesClean: "نعم",
  status: "مطابق",
});

export default function FormPRM003() {
  const { user } = useAuth();
  const { submit } = useQmFormSubmit("F-PRM-003", "تم حفظ فحص أنظمة الإضاءة");

  const [formData, setFormData] = useState<any>({
    inspectionDate: new Date().toISOString().split("T")[0],
    inspectorName: user?.name || "",
    zones: [emptyRow(), emptyRow()],
    notes: "",
  });

  useEditLoader(setFormData);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center gap-3 mb-6 bg-white p-4 rounded-xl border border-sky-200 shadow-sm border-r-4 border-r-sky-500">
        <div className="p-3 bg-sky-50 rounded-lg text-sky-600">
          <Lightbulb className="w-8 h-8" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            فحص أنظمة الإضاءة (Lighting Inspection)
          </h1>
          <p className="text-slate-500">النموذج: F-PRM-003 | فحص متعدّد المناطق</p>
        </div>
      </div>

      <form
        onSubmit={(e) => e.preventDefault()}
        className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-6"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">تاريخ الفحص</label>
            <input
              type="date"
              required
              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-sky-500"
              value={formData.inspectionDate}
              onChange={(e) => setFormData({ ...formData, inspectionDate: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">المفتش</label>
            <input
              type="text"
              readOnly
              className="w-full px-4 py-2 bg-slate-100 border border-slate-200 rounded-lg text-slate-500"
              value={formData.inspectorName}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">قراءات الإضاءة لكل منطقة</label>
          <RepeatableTable
            columns={COLUMNS}
            rows={formData.zones}
            onChange={(rows) => setFormData({ ...formData, zones: rows })}
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
