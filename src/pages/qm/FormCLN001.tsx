import { useState } from "react";
import { Sparkles } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import {
  FACILITY_AREAS,
  RepeatableTable,
  FormActions,
  useQmFormSubmit,
  useEditLoader,
  type ColumnDef,
} from "./_shared/qmForm";

// Weekly facility cleaning log: a row per facility area, a column per weekday.
// Each day cell holds the cleaner's name/initials — a filled cell means "cleaned".
const DAY_COLUMNS: ColumnDef[] = [
  { key: "area", label: "المرفق", width: "18%", placeholder: "اسم المرفق" },
  { key: "material", label: "مادة التنظيف", width: "12%", placeholder: "المطهّر المستخدم" },
  { key: "sat", label: "السبت", placeholder: "اسم المنظّف" },
  { key: "sun", label: "الأحد", placeholder: "اسم المنظّف" },
  { key: "mon", label: "الاثنين", placeholder: "اسم المنظّف" },
  { key: "tue", label: "الثلاثاء", placeholder: "اسم المنظّف" },
  { key: "wed", label: "الأربعاء", placeholder: "اسم المنظّف" },
  { key: "thu", label: "الخميس", placeholder: "اسم المنظّف" },
  { key: "fri", label: "الجمعة", placeholder: "اسم المنظّف" },
];

const emptyRow = () => ({
  area: "",
  material: "",
  sat: "",
  sun: "",
  mon: "",
  tue: "",
  wed: "",
  thu: "",
  fri: "",
});

const seededRows = () =>
  FACILITY_AREAS.map((area) => ({ ...emptyRow(), area }));

export default function FormCLN001() {
  const { user } = useAuth();
  const { submit } = useQmFormSubmit("F-CLN-001", "تم حفظ سجل التنظيف الأسبوعي");

  const [formData, setFormData] = useState<any>({
    weekStartDate: new Date().toISOString().split("T")[0],
    shift: "صباحية",
    cleaningLog: seededRows(),
    supervisorName: user?.name || "",
    verifiedDate: "",
    notes: "",
  });

  useEditLoader(setFormData);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center gap-3 mb-6 bg-white p-4 rounded-xl border border-cyan-200 shadow-sm border-r-4 border-r-cyan-500">
        <div className="p-3 bg-cyan-50 rounded-lg text-cyan-600">
          <Sparkles className="w-8 h-8" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            سجل التنظيف الأسبوعي للمرافق (Weekly Cleaning Log)
          </h1>
          <p className="text-slate-500">
            النموذج: F-CLN-001 | قسم الجودة — يُملأ أسبوعياً لكل مرافق المصنع
          </p>
        </div>
      </div>

      <form
        onSubmit={(e) => e.preventDefault()}
        className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-6"
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">بداية الأسبوع (السبت)</label>
            <input
              type="date"
              required
              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-cyan-500"
              value={formData.weekStartDate}
              onChange={(e) => setFormData({ ...formData, weekStartDate: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">الوردية</label>
            <select
              className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg"
              value={formData.shift}
              onChange={(e) => setFormData({ ...formData, shift: e.target.value })}
            >
              <option value="صباحية">صباحية</option>
              <option value="مسائية">مسائية</option>
              <option value="كامل اليوم">كامل اليوم</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">المشرف المسؤول</label>
            <input
              type="text"
              readOnly
              className="w-full px-4 py-2 bg-slate-100 border border-slate-200 rounded-lg text-slate-500"
              value={formData.supervisorName}
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-semibold text-slate-700">
              جدول التنظيف — اكتب اسم/أحرف من نظّف في خانة اليوم (الخانة الفارغة = لم يُنظَّف)
            </label>
          </div>
          <RepeatableTable
            columns={DAY_COLUMNS}
            rows={formData.cleaningLog}
            onChange={(rows) => setFormData({ ...formData, cleaningLog: rows })}
            newRow={emptyRow}
            addLabel="إضافة مرفق"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">تاريخ تحقّق المشرف</label>
            <input
              type="date"
              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-cyan-500"
              value={formData.verifiedDate}
              onChange={(e) => setFormData({ ...formData, verifiedDate: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">ملاحظات عامة</label>
            <textarea
              rows={2}
              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-cyan-500"
              placeholder="أي ملاحظات حول التنظيف، نواقص، أو مرافق تحتاج عناية..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            />
          </div>
        </div>

        <FormActions onSubmit={(status) => submit(formData, status)} />
      </form>
    </div>
  );
}
