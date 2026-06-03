import { describe, it, expect } from 'vitest';
import { matchesReference, buildTransactionId } from '../server/helpers';

describe('matchesReference', () => {
  it('returns false for missing inputs', () => {
    expect(matchesReference(null, 'PO-1')).toBe(false);
    expect(matchesReference({ poNumber: 'PO-1' }, '')).toBe(false);
    expect(matchesReference(undefined, undefined as unknown as string)).toBe(false);
  });

  it('matches on any of the known reference fields', () => {
    expect(matchesReference({ referenceDocument: 'DOC-1' }, 'DOC-1')).toBe(true);
    expect(matchesReference({ poNumber: 'PO-9' }, 'PO-9')).toBe(true);
    expect(matchesReference({ reference: 'R-3' }, 'R-3')).toBe(true);
    expect(matchesReference({ sourceDocumentNo: 'S-2' }, 'S-2')).toBe(true);
    expect(matchesReference({ productionOrderNo: 'PRD-7' }, 'PRD-7')).toBe(true);
    expect(matchesReference({ productionOrderId: 'PRD-ID' }, 'PRD-ID')).toBe(true);
  });

  it('returns false when no field matches the target', () => {
    expect(matchesReference({ poNumber: 'PO-1' }, 'PO-2')).toBe(false);
    expect(matchesReference({ unrelated: 'x' }, 'PO-1')).toBe(false);
  });
});

describe('buildTransactionId', () => {
  it('starts with the given type', () => {
    expect(buildTransactionId('IN')).toMatch(/^IN-\d+-[a-z0-9]+$/);
  });

  it('produces unique ids across calls', () => {
    const ids = new Set(Array.from({ length: 50 }, () => buildTransactionId('OUT')));
    expect(ids.size).toBe(50);
  });
});
