import React from 'react';

interface StatusBadgeProps {
  status: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  switch(status) {
    case 'approved': return <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-[#DCFCE7] text-[#166534]">معتمد</span>;
    case 'rejected': return <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-red-100 text-red-700">مرفوض</span>;
    case 'returned': return <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-orange-100 text-orange-700">مُعاد بملاحظات</span>;
    case 'pending_review': return <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-100 text-blue-700">في انتظار المراجعة</span>;
    case 'pending_approval': return <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-purple-100 text-purple-700">في انتظار الاعتماد</span>;
    default: return <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-[#FEF9C3] text-[#854D0E]">مسودة</span>;
  }
};
