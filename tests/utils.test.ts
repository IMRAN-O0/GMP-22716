import { describe, it, expect } from 'vitest';
import {
  formatMaterialCode,
  formatProductCode,
  formatBOMCode,
  extractSupplierCode,
  generateSerialNumber,
  formatDate,
  cn,
} from '../src/lib/utils';

describe('formatMaterialCode', () => {
  it('keeps values containing letters when not strict', () => {
    expect(formatMaterialCode('ABC')).toBe('ABC');
    expect(formatMaterialCode('مادة')).toBe('مادة');
  });

  it('formats 6+ digits as XXXX-YY', () => {
    expect(formatMaterialCode('123456')).toBe('1234-56');
    expect(formatMaterialCode('1234567', true)).toBe('1234-56');
  });

  it('returns digits as-is when 4 or fewer', () => {
    expect(formatMaterialCode('12')).toBe('12');
    expect(formatMaterialCode('1234')).toBe('1234');
  });

  it('returns empty string when there are no digits in strict mode', () => {
    expect(formatMaterialCode('', true)).toBe('');
  });
});

describe('formatProductCode', () => {
  it('always prepends FD- and caps at 4 digits', () => {
    expect(formatProductCode('1234')).toBe('FD-1234');
    expect(formatProductCode('FD-99')).toBe('FD-99');
    expect(formatProductCode('1234567')).toBe('FD-1234');
  });

  it('returns FD- for empty input', () => {
    expect(formatProductCode('')).toBe('FD-');
  });
});

describe('formatBOMCode', () => {
  it('always prepends AH-', () => {
    expect(formatBOMCode('1234')).toBe('AH-1234');
    expect(formatBOMCode('AH-12')).toBe('AH-12');
    expect(formatBOMCode('')).toBe('AH-');
  });
});

describe('extractSupplierCode', () => {
  it('extracts the 2-digit supplier segment', () => {
    expect(extractSupplierCode('1234-56')).toBe('56');
  });

  it('returns empty string when no supplier segment present', () => {
    expect(extractSupplierCode('1234')).toBe('');
    expect(extractSupplierCode('ABC')).toBe('');
  });
});

describe('generateSerialNumber', () => {
  it('formats as DEPT-SEQ-YEAR with zero-padded sequence', () => {
    const year = new Date().getFullYear();
    expect(generateSerialNumber('LAB', 0)).toBe(`LAB-001-${year}`);
    expect(generateSerialNumber('QM', 41)).toBe(`QM-042-${year}`);
  });
});

describe('formatDate', () => {
  it('returns dash for empty values', () => {
    expect(formatDate(null)).toBe('—');
    expect(formatDate(undefined)).toBe('—');
  });

  it('returns a non-empty string for a valid ISO date', () => {
    expect(formatDate('2026-01-15', 'en-US')).not.toBe('—');
  });
});

describe('cn', () => {
  it('merges class names and de-duplicates tailwind conflicts', () => {
    expect(cn('p-2', 'p-4')).toBe('p-4');
    expect(cn('text-sm', false && 'hidden', 'font-bold')).toBe('text-sm font-bold');
  });
});
