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
    if (digits.length <= 4) return digits;
    // Format: XXXX-YY  (4-digit material + 2-digit supplier)
    return `${digits.slice(0, 4)}-${digits.slice(4, 6)}`;
};

// Final product code: FD-XXXX (user types 4 digits, FD- is always prepended)
export const formatProductCode = (value: string): string => {
    const withoutPrefix = value.replace(/^FD-?/i, '');
    const digits = withoutPrefix.replace(/\D/g, '');
    if (digits.length === 0) return 'FD-';
    return `FD-${digits.slice(0, 4)}`;
};

// BOM/Composition code: AH-XXXX (user types 4 digits, AH- is always prepended)
export const formatBOMCode = (value: string): string => {
    const withoutPrefix = value.replace(/^AH-?/i, '');
    const digits = withoutPrefix.replace(/\D/g, '');
    if (digits.length === 0) return 'AH-';
    return `AH-${digits.slice(0, 4)}`;
};

// Extract supplier code (last 2 digits after dash) from material code XXXX-YY
export const extractSupplierCode = (code: string): string => {
    const match = code.match(/\d{4}-(\d{2})$/);
    return match ? match[1] : "";
};

export const generateSerialNumber = (departmentCode: string, currentCount: number) => {
    const year = new Date().getFullYear();
    const sequence = (currentCount + 1).toString().padStart(3, '0');
    return `${departmentCode}-${sequence}-${year}`;
};

// Shared auth headers — avoids duplicating localStorage.getItem("token") everywhere
export const getAuthHeaders = (): HeadersInit => ({
  Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
});

export const getJsonHeaders = (): HeadersInit => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
});

// Shared date formatter
export const formatDate = (iso: string | undefined | null, locale = "ar-SA"): string => {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString(locale, { year: "numeric", month: "short", day: "numeric" });
  } catch { return iso; }
};
