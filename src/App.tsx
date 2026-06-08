/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import HRIndex from './pages/hr/HRIndex';
import FormHR001 from './pages/hr/FormHR001';
import FormHR002 from './pages/hr/FormHR002';
import FormHR003 from './pages/hr/FormHR003';
import FormHRT001 from './pages/hr/FormHRT001';
import FormHRT002 from './pages/hr/FormHRT002';
import FormHRT003 from './pages/hr/FormHRT003';
import FormHRT004 from './pages/hr/FormHRT004';
import FormHRT005 from './pages/hr/FormHRT005';
import FormViewer from './pages/hr/FormViewer';
import UsersManagement from './pages/UsersManagement';
import AuditLog from './pages/AuditLog';
import Reports from './pages/Reports';
import CompanySettings from './pages/CompanySettings';
import ArchivePage from './pages/archive/ArchivePage';

import PRDIndex from './pages/prd/PRDIndex';
import FormPRD001 from './pages/prd/FormPRD001';
import FormPRD002 from './pages/prd/FormPRD002';
import FormPRD003 from './pages/prd/FormPRD003';
import FormPRD004 from './pages/prd/FormPRD004';

import INVIndex from './pages/inv/INVIndex';
import CreateWarehouse from './pages/inv/CreateWarehouse';
import CreateMaterial from './pages/inv/CreateMaterial';
import CreateSupplier from './pages/inv/CreateSupplier';
import CreateCustomer from './pages/inv/CreateCustomer';
import CreateFinalProduct from './pages/inv/CreateFinalProduct';
import FormRM001 from './pages/inv/FormRM001';
import FormPRQ001 from './pages/inv/FormPRQ001';
import FormPIN001 from './pages/inv/FormPIN001';
import FormRMT from './pages/inv/FormRMT';
import FormFP001 from './pages/inv/FormFP001';
import FormFP003 from './pages/inv/FormFP003';
import FormFP004 from './pages/inv/FormFP004';
import FormFP005 from './pages/inv/FormFP005';
import FormFP006 from './pages/inv/FormFP006';
import FormComposition from './pages/inv/FormComposition';

import QMIndex from './pages/qm/QMIndex';
import FormQM001 from './pages/qm/FormQM001';
import FormQM002 from './pages/qm/FormQM002';
import FormQM003 from './pages/qm/FormQM003';
import FormQM004 from './pages/qm/FormQM004';
import FormQM005 from './pages/qm/FormQM005';
import FormQM006 from './pages/qm/FormQM006';
import FormDEV001 from './pages/qm/FormDEV001';
import FormDEV002 from './pages/qm/FormDEV002';
import FormDEV003 from './pages/qm/FormDEV003';
import FormDEV004 from './pages/qm/FormDEV004';
import FormCMP001 from './pages/qm/FormCMP001';
import FormRCL001 from './pages/qm/FormRCL001';
import FormPRM001 from './pages/qm/FormPRM001';
import FormPRM002 from './pages/qm/FormPRM002';
import FormPRM003 from './pages/qm/FormPRM003';
import FormPRM004 from './pages/qm/FormPRM004';
import FormPRM005 from './pages/qm/FormPRM005';
import FormEQP001 from './pages/qm/FormEQP001';
import FormMNT001 from './pages/qm/FormMNT001';
import FormCLN001 from './pages/qm/FormCLN001';

// TRN (Training) form imports — department merged into HRT, hub at /hr
import FormTRN001 from './pages/trn/FormTRN001';
import FormTRN002 from './pages/trn/FormTRN002';
import FormTRN003 from './pages/trn/FormTRN003';
import FormTRN004 from './pages/trn/FormTRN004';

// LAB (Laboratory) Imports
import LABIndex from './pages/lab/LABIndex';
import FormLAB001 from './pages/lab/FormLAB001';
import FormLAB002 from './pages/lab/FormLAB002';
import FormLAB003 from './pages/lab/FormLAB003';
import FormLAB004 from './pages/lab/FormLAB004';
import FormLAB005 from './pages/lab/FormLAB005';
import FormLAB006 from './pages/lab/FormLAB006';
import FormLAB007 from './pages/lab/FormLAB007';

// PKG (Packaging & Filling) Imports
import PKGIndex from './pages/pkg/PKGIndex';
import PackagingFormRenderer from './pages/pkg/PackagingFormRenderer';

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="users" element={<UsersManagement />} />
            <Route path="audit" element={<AuditLog />} />
            <Route path="settings" element={<CompanySettings />} />
            <Route path="reports" element={<Reports />} />
            <Route path="archive" element={<ArchivePage />} />
            {/* Human Resources & Training (merged: HRT) */}
            <Route path="hr" element={<HRIndex />} />
            <Route path="hr/new-request" element={<FormHR001 />} />
            <Route path="hr/employee-file" element={<FormHR002 />} />
            <Route path="hr/medical-exam" element={<FormHR003 />} />
            <Route path="hr/safety-pledge" element={<FormHRT001 />} />
            <Route path="hr/leave-request" element={<FormHRT002 />} />
            <Route path="hr/custody-handover" element={<FormHRT003 />} />
            <Route path="hr/training-needs" element={<FormHRT004 />} />
            <Route path="hr/onboarding" element={<FormHRT005 />} />
            <Route path="hr/view/:recordId" element={<FormViewer />} />

            {/* Packaging & Filling Routes */}
            <Route path="pkg" element={<PKGIndex />} />
            <Route path="pkg/form/:formKey" element={<PackagingFormRenderer />} />
            <Route path="pkg/view/:recordId" element={<FormViewer />} />

            {/* Production Routes */}
            <Route path="prd" element={<PRDIndex />} />
            <Route path="prd/production-order" element={<FormPRD001 />} />
            <Route path="prd/batch-record" element={<FormPRD002 />} />
            <Route path="prd/production-checklist" element={<FormPRD003 />} />
            <Route path="prd/process-monitoring" element={<FormPRD004 />} />
            <Route path="prd/view/:recordId" element={<FormViewer />} />

            {/* Inventory Routes */}
            <Route path="inv" element={<INVIndex />} />
            <Route path="inv/create-warehouse" element={<CreateWarehouse />} />
            <Route path="inv/create-material" element={<CreateMaterial />} />
            <Route path="inv/create-supplier" element={<CreateSupplier />} />
            <Route path="inv/create-customer" element={<CreateCustomer />} />
            <Route path="inv/create-final-product" element={<CreateFinalProduct />} />
            <Route path="inv/rm-001" element={<FormRM001 />} />
            <Route path="inv/prq-001" element={<FormPRQ001 />} />
            <Route path="inv/pin-001" element={<FormPIN001 />} />
            <Route path="inv/rmt" element={<FormRMT />} />
            <Route path="inv/fp-001" element={<FormFP001 />} />
            <Route path="inv/fp-003" element={<FormFP003 />} />
            <Route path="inv/fp-004" element={<FormFP004 />} />
            <Route path="inv/fp-005" element={<FormFP005 />} />
            <Route path="inv/fp-006" element={<FormFP006 />} />
            <Route path="inv/composition" element={<FormComposition />} />
            <Route path="inv/view/:recordId" element={<FormViewer />} />

            {/* Quality Management Routes */}
            <Route path="qm" element={<QMIndex />} />
            <Route path="qm/qm-001" element={<FormQM001 />} />
            <Route path="qm/qm-002" element={<FormQM002 />} />
            <Route path="qm/qm-003" element={<FormQM003 />} />
            <Route path="qm/qm-004" element={<FormQM004 />} />
            <Route path="qm/qm-005" element={<FormQM005 />} />
            <Route path="qm/qm-006" element={<FormQM006 />} />
            <Route path="qm/dev-001" element={<FormDEV001 />} />
            <Route path="qm/dev-002" element={<FormDEV002 />} />
            <Route path="qm/dev-003" element={<FormDEV003 />} />
            <Route path="qm/dev-004" element={<FormDEV004 />} />
            <Route path="qm/cmp-001" element={<FormCMP001 />} />
            <Route path="qm/rcl-001" element={<FormRCL001 />} />
            <Route path="qm/prm-001" element={<FormPRM001 />} />
            <Route path="qm/prm-002" element={<FormPRM002 />} />
            <Route path="qm/prm-003" element={<FormPRM003 />} />
            <Route path="qm/prm-004" element={<FormPRM004 />} />
            <Route path="qm/prm-005" element={<FormPRM005 />} />
            <Route path="qm/eqp-001" element={<FormEQP001 />} />
            <Route path="qm/mnt-001" element={<FormMNT001 />} />
            <Route path="qm/cln-001" element={<FormCLN001 />} />
            {/* Make sure we can view QM records using the same viewer */}
            <Route path="qm/view/:recordId" element={<FormViewer />} />

            {/* Training Routes (department merged into HRT; hub redirects to /hr) */}
            <Route path="trn" element={<Navigate to="/hr" replace />} />
            <Route path="trn/trn-001" element={<FormTRN001 />} />
            <Route path="trn/trn-002" element={<FormTRN002 />} />
            <Route path="trn/trn-003" element={<FormTRN003 />} />
            <Route path="trn/trn-004" element={<FormTRN004 />} />
            <Route path="trn/view/:recordId" element={<FormViewer />} />

            {/* Laboratory (LAB) Routes */}
            <Route path="lab" element={<LABIndex />} />
            <Route path="lab/lab-001" element={<FormLAB001 />} />
            <Route path="lab/lab-002" element={<FormLAB002 />} />
            <Route path="lab/lab-003" element={<FormLAB003 />} />
            <Route path="lab/lab-004" element={<FormLAB004 />} />
            <Route path="lab/lab-005" element={<FormLAB005 />} />
            <Route path="lab/lab-006" element={<FormLAB006 />} />
            <Route path="lab/lab-007" element={<FormLAB007 />} />
            <Route path="lab/view/:recordId" element={<FormViewer />} />

            <Route path="*" element={<div className="p-8 text-center text-gray-500">هذه الصفحة قيد التطوير (Under Construction)</div>} />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}
