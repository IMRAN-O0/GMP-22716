import { useState } from "react";
import { Building2 } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import {
  FACILITY_AREAS,
  RepeatableTable,
  FormActions,
  useQmFormSubmit,
  useEditLoader,
  type ColumnDef,
} from "./_shared/qmForm";

const STATUS3 = [
  { value: "مطابق", label: "مطابق" },
  { value: "ملاحظات", label: "ملاحظات" },
  { value: "غير مطابق", label: "غير مطابق" },
];
const YESNO = [
  { value: "لا", label: "لا" },
  { value: "نعم", label: "نعم" },
];

const COLUMNS: ColumnDef[] = [
  { key: "area", label: "المرفق / المنطقة", width: "20%", placeholder: "اسم المنطقة" },
  { key: "cleanliness", label: "النظافة العامة", type: "select", options: STATUS3 },
  { key: "pestControl", label: "مكافحة الآفات", type: "select", options: STATUS3 },
  { key: "maintenanceNeeded", label: "تحتاج صيانة؟", type: "select", options: YESNO },
  { key: "notes", label: "ملاحظات", placeholder: "—" },
];

const emptyRow = () => ({
  area: "",
  cleanliness: "مطابق",
  pestControl: "مطابق",
  maintenanceNeeded: "لا",
  notes: "",
});

const seededRows = () => FACILITY_AREAS.map((area) => ({ ...emptyRow(), area }));

export default function FormPRM001() {
  const { user } = useAuth();
  const { submit } = useQmFormSubmit("F-PRM-001", "تم حفظ تفتيش المباني والمرافق");

  const [formData, setFormData] = useState<any>({
    inspectionDate: new Date().toISOString().split("T")[0],
    inspectorName: user?.name || "",
    areas: seededRows(),
    generalNotes: "",
  });

  useEditLoader(setFormData);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center gap-3 mb-6 bg-white p-4 rounded-xl border border-sky-200 shadow-sm border-r-4 border-r-sky-500">
        <div className="p-3 bg-sky-50 rounded-lg text-sky-600">
          <Building2 className="w-8 h-8" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            تفتيش المباني والمرافق (Premises Inspection)
          </h1>
          <p className="text-slate-500">
            النموذج: F-PRM-001 | قائمة فحص شاملة لكل مرافق المصنع
          </p>
        </div>
      </div>

      <form
        onSubmit={(e) => e.preventDefault()}
        className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-6"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">تاريخ التفتيش</label>
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
          <label className="block text-sm font-semibold text-slate-700 mb-2">
            نتائج فحص المرافق
          </label>
          <RepeatableTable
            columns={COLUMNS}
            rows={formData.areas}
            onChange={(rows) => setFormData({ ...formData, areas: rows })}
            newRow={emptyRow}
            addLabel="إضافة منطقة"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">ملاحظات وتوجيهات عامة</label>
          <textarea
            rows={3}
            className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-sky-500"
            placeholder="ملاحظات حول التهوية، الإضاءة، الحالة العامة للمبنى..."
            value={formData.generalNotes}
            onChange={(e) => setFormData({ ...formData, generalNotes: e.target.value })}
          />
        </div>

        <FormActions onSubmit={(status) => submit(formData, status)} />
      </form>
    </div>
  );
}
