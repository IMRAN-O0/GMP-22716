import { describe, it, expect } from 'vitest';
import {
  getAccessibleDepartments,
  DEPT_PERMISSIONS,
  DEPARTMENT_CODES,
} from '../src/constants/departments';
import {
  PACKAGING_FORMS,
  getPackagingForm,
  getPackagingFormById,
  isPackagingFormId,
  PKG_FIELD_LABELS,
  PKG_FORM_TITLES,
} from '../src/pages/pkg/packagingForms.config';

describe('QM permissions include cleaning, premises & maintenance forms', () => {
  it('exposes F-CLN-001 and the premises/maintenance forms in the QM group', () => {
    const qmIds = DEPT_PERMISSIONS.QM.flatMap((c) => c.items.map((i) => i.id));
    for (const id of [
      'F-CLN-001',
      'F-PRM-001',
      'F-PRM-002',
      'F-PRM-003',
      'F-PRM-004',
      'F-PRM-005',
      'F-EQP-001',
      'F-MNT-001',
    ]) {
      expect(qmIds).toContain(id);
    }
  });
});

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

  it('exposes a PKG permission group built from the forms plus reports', () => {
    const pkgIds = DEPT_PERMISSIONS.PKG.flatMap((c) => c.items.map((i) => i.id));
    // every form id is present
    for (const f of PACKAGING_FORMS) expect(pkgIds).toContain(f.formId);
    // plus the four PKG report permissions
    expect(pkgIds).toContain('pkg_release_ready');
    expect(pkgIds).toContain('pkg_reconciliation');
    expect(pkgIds).toContain('pkg_batch_log');
    expect(pkgIds).toContain('pkg_downtime');
    expect(pkgIds.length).toBe(PACKAGING_FORMS.length + 4);
  });

  it('can look up a form by its url key', () => {
    expect(getPackagingForm('pack-warehouse-delivery')?.formId).toBe('F-PKG-009');
    expect(getPackagingForm('does-not-exist')).toBeUndefined();
  });
});

describe('FormViewer integration helpers', () => {
  it('recognises packaging form ids', () => {
    expect(isPackagingFormId('F-FIL-001')).toBe(true);
    expect(isPackagingFormId('F-PKG-009')).toBe(true);
    expect(isPackagingFormId('F-FP-001')).toBe(false);
    expect(isPackagingFormId('')).toBe(false);
  });

  it('maps every form id to a title and back to its url key', () => {
    for (const f of PACKAGING_FORMS) {
      expect(PKG_FORM_TITLES[f.formId]).toBe(f.title);
      expect(getPackagingFormById(f.formId)?.key).toBe(f.key);
    }
  });

  it('builds field labels for header, fields, checklist items and table columns', () => {
    expect(PKG_FIELD_LABELS.batchNumber).toBe('رقم التشغيلة');
    // a checklist item label
    expect(PKG_FIELD_LABELS.noPreviousProduct).toBeTruthy();
    // a table column label
    expect(PKG_FIELD_LABELS.netWeight).toBeTruthy();
  });
});
