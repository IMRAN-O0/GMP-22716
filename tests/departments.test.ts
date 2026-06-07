import { describe, it, expect } from 'vitest';
import {
  getAccessibleDepartments,
  DEPT_PERMISSIONS,
  DEPARTMENT_CODES,
} from '../src/constants/departments';
import { PACKAGING_FORMS, getPackagingForm } from '../src/pages/pkg/packagingForms.config';

describe('getAccessibleDepartments', () => {
  it('gives level-1 admins access to every department', () => {
    const depts = getAccessibleDepartments({ level: 1, department: 'INV' });
    for (const code of DEPARTMENT_CODES) expect(depts.has(code)).toBe(true);
  });

  it('gives the "ALL" department access to everything', () => {
    const depts = getAccessibleDepartments({ level: 4, department: 'ALL' });
    expect(depts.has('PKG')).toBe(true);
    expect(depts.has('QM')).toBe(true);
  });

  it('includes the primary department', () => {
    const depts = getAccessibleDepartments({ level: 4, department: 'INV', permissions: {} });
    expect(depts.has('INV')).toBe(true);
    expect(depts.has('QM')).toBe(false);
  });

  it('adds extra departments the user holds a permission in (multi-department)', () => {
    // An inventory employee who also has a Quality form permission.
    const depts = getAccessibleDepartments({
      level: 4,
      department: 'INV',
      permissions: { 'F-QM-005': true },
    });
    expect(depts.has('INV')).toBe(true);
    expect(depts.has('QM')).toBe(true);
  });

  it('returns an empty set for no user', () => {
    expect(getAccessibleDepartments(null).size).toBe(0);
  });
});

describe('packaging forms config', () => {
  it('defines 17 forms (8 filling + 9 packaging)', () => {
    const filling = PACKAGING_FORMS.filter((f) => f.group === 'filling');
    const packaging = PACKAGING_FORMS.filter((f) => f.group === 'packaging');
    expect(filling.length).toBe(8);
    expect(packaging.length).toBe(9);
    expect(PACKAGING_FORMS.length).toBe(17);
  });

  it('has unique form ids and unique url keys', () => {
    const ids = PACKAGING_FORMS.map((f) => f.formId);
    const keys = PACKAGING_FORMS.map((f) => f.key);
    expect(new Set(ids).size).toBe(ids.length);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it('exposes a PKG permission group built from the forms', () => {
    const pkgIds = DEPT_PERMISSIONS.PKG.flatMap((c) => c.items.map((i) => i.id));
    expect(pkgIds).toContain('F-PKG-009');
    expect(pkgIds.length).toBe(PACKAGING_FORMS.length);
  });

  it('can look up a form by its url key', () => {
    expect(getPackagingForm('pack-warehouse-delivery')?.formId).toBe('F-PKG-009');
    expect(getPackagingForm('does-not-exist')).toBeUndefined();
  });
});
