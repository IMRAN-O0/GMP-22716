import { useState } from "react";
import { Wrench } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import {
  RepeatableTable,
  FormActions,
  useQmFormSubmit,
  useEditLoader,
  type ColumnDef,
} from "./_shared/qmForm";

const TYPE = [
  { value: "وقائية", label: "وقائية (دورية)" },
  { value: "تصحيحية", label: "تصحيحية (عطل)" },
];
const STATUS = [
  { value: "مكتملة", label: "مكتملة" },
  { value: "قيد التنفيذ", label: "قيد التنفيذ" },
  { value: "مؤجلة", label: "مؤجلة" },
];

const COLUMNS: ColumnDef[] = [
  { key: "equipmentId", label: "رمز المعدة", width: "10%", placeholder: "EQ-" },
  { key: "equipmentName", label: "اسم المعدة", placeholder: "المعدة" },
  { key: "maintenanceType", label: "النوع", type: "select", options: TYPE },
  { key: "scheduledDate", label: "التاريخ المخطط", type: "date" },
  { key: "completedDate", label: "تاريخ التنفيذ", type: "date" },
  { key: "status", label: "الحالة", type: "select", options: STATUS },
  { key: "partsReplaced", label: "القطع المستبدلة", placeholder: "—" },
  { key: "notes", label: "ملاحظات", placeholder: "—" },
];

const emptyRow = () => ({
  equipmentId: "",
  equipmentName: "",
  maintenanceType: "وقائية",
  scheduledDate: "",
  completedDate: "",
  status: "مكتملة",
  partsReplaced: "",
  notes: "",
});

export default function FormMNT001() {
  const { user } = useAuth();
  const { submit } = useQmFormSubmit("F-MNT-001", "تم حفظ سجل الصيانة");

  const [formData, setFormData] = useState<any>({
    logMonth: new Date().toISOString().slice(0, 7),
    technician: user?.name || "",
    tasks: [emptyRow()],
    notes: "",
  });

  useEditLoader(setFormData);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center gap-3 mb-6 bg-white p-4 rounded-xl border border-emerald-200 shadow-sm border-r-4 border-r-emerald-500">
        <div className="p-3 bg-emerald-50 rounded-lg text-emerald-600">
          <Wrench className="w-8 h-8" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            خطط وسجلات الصيانة (Maintenance Log)
          </h1>
          <p className="text-slate-500">النموذج: F-MNT-001 | سجل صيانة متعدّد المهام</p>
        </div>
      </div>

      <form
        onSubmit={(e) => e.preventDefault()}
        className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-6"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">شهر السجل</label>
            <input
              type="month"
              required
              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500"
              value={formData.logMonth}
              onChange={(e) => setFormData({ ...formData, logMonth: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">الفني المسؤول</label>
            <input
              type="text"
              readOnly
              className="w-full px-4 py-2 bg-slate-100 border border-slate-200 rounded-lg text-slate-500"
              value={formData.technician}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">مهام الصيانة</label>
          <RepeatableTable
            columns={COLUMNS}
            rows={formData.tasks}
            onChange={(rows) => setFormData({ ...formData, tasks: rows })}
            newRow={emptyRow}
            addLabel="إضافة مهمة"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">ملاحظات عامة</label>
          <textarea
            rows={2}
            className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500"
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          />
        </div>

        <FormActions onSubmit={(status) => submit(formData, status)} />
      </form>
    </div>
  );
}
