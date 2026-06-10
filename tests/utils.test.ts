import { describe, it, expect } from 'vitest';
import {
  formatMaterialCode,
  formatProductCode,
  formatBOMCode,
  extractSupplierCode,
  generateSerialNumber,
  buildBatchNumber,
  nextSequentialId,
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

describe('buildBatchNumber', () => {
  it('takes the first letter of each word + YYYYMMDD', () => {
    expect(buildBatchNumber('Candy Body Scrub', '2026-06-07')).toBe('CBS20260607');
  });

  it('uppercases and handles 2-word and 4-word names', () => {
    expect(buildBatchNumber('aloe gel', '2026-06-07')).toBe('AG20260607');
    expect(buildBatchNumber('Deep Sea Mud Mask', '2026-06-07')).toBe('DSMM20260607');
  });

  it('ignores extra whitespace and punctuation when taking initials', () => {
    expect(buildBatchNumber('  Candy   Body  Scrub ', '2026-06-07')).toBe('CBS20260607');
    expect(buildBatchNumber('Vitamin-C Serum', '2026-06-07')).toBe('VS20260607');
  });

  it('appends F, then F2, F3 on collisions', () => {
    const existing = ['CBS20260607'];
    expect(buildBatchNumber('Candy Body Scrub', '2026-06-07', existing)).toBe('CBS20260607F');
    existing.push('CBS20260607F');
    expect(buildBatchNumber('Candy Body Scrub', '2026-06-07', existing)).toBe('CBS20260607F2');
    existing.push('CBS20260607F2');
    expect(buildBatchNumber('Candy Body Scrub', '2026-06-07', existing)).toBe('CBS20260607F3');
  });

  it('does not collide across different days', () => {
    const existing = ['CBS20260607'];
    expect(buildBatchNumber('Candy Body Scrub', '2026-06-08', existing)).toBe('CBS20260608');
  });
});

describe('nextSequentialId', () => {
  it('starts at 0001 when none exist', () => {
    expect(nextSequentialId('HR', [])).toBe('HR-0001');
  });

  it('increments past the highest existing numeric suffix', () => {
    expect(nextSequentialId('HR', ['HR-0001', 'HR-0003', 'HR-0002'])).toBe('HR-0004');
  });

  it('handles non-padded and prefix-only ids, ignoring unrelated ones', () => {
    expect(nextSequentialId('EMP', ['EMP-101', 'EMP-105', 'HR-0009'], 3)).toBe('EMP-106');
  });

  it('respects custom zero-padding width', () => {
    expect(nextSequentialId('EMP', [], 3)).toBe('EMP-001');
  });

  it('works with multi-segment prefixes', () => {
    expect(nextSequentialId('TRN-PLN', ['TRN-PLN-0007'])).toBe('TRN-PLN-0008');
  });
});
