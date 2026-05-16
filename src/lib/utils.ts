import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const formatMaterialCode = (value: string, strictCode: boolean = false) => {
    if (!strictCode) {
        const hasLetters = /[a-zA-Z\u0600-\u06FF]/.test(value);
        if (hasLetters) return value;
    }
    const digits = value.replace(/\D/g, '');
    if (digits.length === 0) return '';
    if (digits.length <= 3) return digits;
    return `${digits.slice(0, 3)}-${digits.slice(3, 7)}`;
};
export const generateSerialNumber = (departmentCode: string, currentCount: number) => {
    const year = new Date().getFullYear();
    const sequence = (currentCount + 1).toString().padStart(3, '0');
    return `${departmentCode}-${sequence}-${year}`;
};
