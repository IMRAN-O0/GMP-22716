import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Printer,
  CheckCircle,
  XCircle,
  Send,
  AlertCircle,
  Trash2,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { getAuthHeaders, getJsonHeaders } from "../../lib/utils";
import {
  PKG_FIELD_LABELS,
  PKG_FORM_TITLES,
  getPackagingFormById,
  isPackagingFormId,
} from "../pkg/packagingForms.config";

const FIELD_LABELS: Record<string, string> = {
  // Common
  date: "التاريخ",
  notes: "الملاحظات",
  status: "الحالة",
  attachmentUrl: "المرفق",
  items: "البنود",
  description: "الوصف",
  responsiblePerson: "المسؤول",
  targetDate: "التاريخ المستهدف",
  department: "القسم",
  category: "الفئة",
  // PRQ
  requestId: "رقم الطلب",
  requestDate: "تاريخ الطلب",
  supplierName: "اسم المورد",
  warehouseId: "المستودع",
  expectedDeliveryDate: "تاريخ التسليم المتوقع",
  priority: "الأولوية",
  // PIN
  invoiceId: "رقم الفاتورة",
  invoiceDate: "تاريخ الفاتورة",
  linkedPrqId: "رقم طلب الشراء المرتبط",
  supplierCode: "كود المورد",
  taxRate: "نسبة الضريبة (%)",
  taxAmount: "مبلغ الضريبة",
  subTotal: "المجموع قبل الضريبة",
  netTotal: "الإجمالي شامل الضريبة",
  // Items columns
  materialCode: "كود المادة",
  materialName: "اسم المادة",
  unit: "الوحدة",
  quantity: "الكمية",
  unitPrice: "سعر الوحدة",
  expectedPrice: "السعر المتوقع",
  totalPrice: "الإجمالي",
  // RM-001 (Material Receipt / Registration)
  recordId: "رقم السجل",
  code: "كود المادة",
  name: "اسم المادة",
  warehouse_id: "المستودع",
  balance: "الرصيد الافتتاحي",
  barcode: "الباركود",
  scientificName: "الاسم العلمي",
  purchasePrice: "سعر الشراء",
  countryOfOrigin: "بلد المنشأ",
  coaFileUrl: "شهادة المطابقة (CoA)",
  msdsFileUrl: "بيانات السلامة (MSDS)",
  tdsFileUrl: "المواصفات الفنية (TDS)",
  allergyFileUrl: "تقرير الحساسية",
  // RM / Materials common
  batchNumber: "رقم الدفعة",
  expiryDate: "تاريخ الانتهاء",
  manufacturingDate: "تاريخ التصنيع",
  receivedDate: "تاريخ الاستلام",
  receivedQuantity: "الكمية المستلمة",
  receivedBy: "استلم بواسطة",
  inspectedBy: "فحص بواسطة",
  approvedBy: "اعتمد بواسطة",
  storageCondition: "شروط التخزين",
  inspectionResult: "نتيجة الفحص",
  certificate: "شهادة المطابقة",
  poNumber: "رقم أمر الشراء",
  // FP-001 (Batch Release)
  releaseId: "رقم سجل الإطلاق",
  productionOrderNo: "رقم أمر الإنتاج",
  productionOrderId: "رقم أمر الإنتاج",
  productName: "اسم المنتج",
  productCode: "كود المنتج",
  releasedQuantity: "الكمية المُفرج عنها",
  qcStatus: "حالة فحص الجودة",
  releaseDate: "تاريخ الإطلاق",
  productionQty: "كمية الإنتاج",
  productionUnit: "وحدة الإنتاج",
  itemNumber: "كود الصنف",
  requiredBatchSize: "حجم الدفعة",
  // PRD
  plannedQuantity: "الكمية المخططة",
  actualQuantity: "الكمية الفعلية",
  startDate: "تاريخ البدء",
  endDate: "تاريخ الانتهاء",
  productionStage: "مرحلة الإنتاج",
  rawMaterials: "المواد الخام",
  packagingMaterials: "مواد التعبئة",
  actualStartDateTime: "وقت بداية الإنتاج الفعلي",
  actualEndDateTime: "وقت نهاية الإنتاج الفعلي",
  supervisorName: "اسم المشرف",
  manufacturingSteps: "خطوات التصنيع",
  actualProducedQty: "الكمية المنتجة الفعلية",
  wasteAmount: "كمية الهدر",
  wasteReason: "سبب الهدر",
  plannedStartDate: "تاريخ البدء المخطط",
  plannedEndDate: "تاريخ الانتهاء المخطط",
  clientName: "اسم العميل",
  productionManagerName: "مدير الإنتاج",
  requiredQuantity: "الكمية المطلوبة",
  time: "الوقت",
  // QM / DEV / CMP / NCR / CAPA
  issueDate: "تاريخ الإصدار",
  rootCause: "السبب الجذري",
  correctiveAction: "الإجراء التصحيحي",
  preventiveAction: "الإجراء الوقائي",
  verificationDate: "تاريخ التحقق",
  effectivenessCheck: "فحص الفعالية",
  capaRequired: "هل CAPA مطلوب",
  sourceFormId: "النموذج المصدر",
  sourceDocumentNo: "رقم المستند المصدر",
  ncrId: "رقم NCR",
  nonConformityType: "نوع عدم المطابقة",
  severity: "الخطورة",
  immediateAction: "الإجراء الفوري",
  disposition: "القرار",
  reportedBy: "أبلغ بواسطة",
  deviationType: "نوع الانحراف",
  deviationDescription: "وصف الانحراف",
  impactAssessment: "تقييم التأثير",
  // Equipment / Maintenance
  equipmentId: "معرف المعدة",
  equipmentName: "اسم المعدة",
  maintenanceType: "نوع الصيانة",
  maintenanceDate: "تاريخ الصيانة",
  nextMaintenanceDate: "تاريخ الصيانة التالية",
  technicianName: "اسم الفني",
  // Training
  trainingTitle: "عنوان التدريب",
  trainingDate: "تاريخ التدريب",
  trainerName: "اسم المدرب",
  employeeName: "اسم الموظف",
  employeeId: "رقم الموظف",
  score: "الدرجة",
  result: "النتيجة",
  // PRD-003 Production Checklist
  auditorName: "اسم المراجع",
  checksBefore: "فحوصات قبل الإنتاج",
  checksDuring: "فحوصات أثناء الإنتاج",
  checksAfter: "فحوصات بعد الإنتاج",
  cleanMachine: "نظافة الآلة",
  materialsReady: "المواد جاهزة",
  areaClear: "المنطقة خالية",
  tempNormal: "درجة الحرارة طبيعية",
  noLeaks: "لا توجد تسربات",
  speedNormal: "السرعة طبيعية",
  machineOff: "إيقاف الآلة",
  areaCleaned: "تنظيف المنطقة",
  productHandedOver: "تسليم المنتج",
  // PRD-004 Process Monitoring
  readings: "القراءات",
  parameter: "المعامل / المعيار",
  requiredValue: "القيمة المطلوبة",
  actualValue: "القيمة الفعلية",
  withinLimits: "ضمن الحدود",
  // Lab
  sampleId: "رقم العينة",
  testDate: "تاريخ الفحص",
  testType: "نوع الفحص",
  testResult: "نتيجة الفحص",
  analyst: "المحلل",
  // HR
  requestType: "نوع الطلب",
  employeeNumber: "رقم الموظف",
  fullName: "الاسم الكامل",
  joiningDate: "تاريخ الالتحاق",
  contractType: "نوع العقد",
  // FP-002 (Finished Product Storage)
  storageId: "رقم سجل التخزين",
  warehouseLocation: "موقع التخزين / المستودع",
  quantityStored: "الكمية المخزنة",
  storageDate: "تاريخ التخزين",
  // FP-003 (Shipment)
  shipmentId: "رقم الشحنة",
  customerName: "اسم العميل / الوجهة",
  destinationAddress: "العنوان التفصيلي",
  shippedQuantity: "الكمية المشحونة",
  shipmentDate: "تاريخ الشحن",
  transporterName: "اسم الناقل / السائق",
  vehiclePlate: "رقم المركبة",
  // FP-004 (Return)
  returnId: "رقم الإرجاع",
  returnedQuantity: "الكمية المرتجعة",
  returnDate: "تاريخ الإرجاع",
  returnReason: "سبب الإرجاع",
  condition: "حالة المنتج المرتجع",
  actionTaken: "الإجراء المتخذ",
  // FP-005 (Disposal)
  disposalId: "رقم إذن الإتلاف",
  itemType: "نوع الصنف",
  batchOrCode: "رقم الدفعة / كود المنتج",
  disposalDate: "تاريخ الإتلاف",
  disposalReason: "سبب الإتلاف",
  disposalMethod: "طريقة الإتلاف",
  // RMT (Material Transfer / Issue / Receive)
  transactionId: "رقم الحركة",
  transactionType: "نوع الحركة",
  fromWarehouseId: "من المستودع",
  toWarehouseId: "إلى المستودع",
  // QM — Complaint (CMP-001)
  complaintId: "رقم الشكوى",
  complaintDate: "تاريخ الشكوى",
  contactInfo: "بيانات التواصل",
  complaintDetails: "تفاصيل الشكوى",
  investigationDetails: "تفاصيل التحقيق",
  responseToCustomer: "الرد على العميل",
  // QM — Deviation (DEV-001)
  deviationClassification: "تصنيف الانحراف",
  initialImpactAssessment: "التقييم الأولي للتأثير",
  // QM — RCA (DEV-002)
  analysisDate: "تاريخ التحليل",
  analysisMethod: "منهجية التحليل",
  rootCauseConclusion: "خلاصة السبب الجذري",
  analystName: "اسم المحلل",
  // QM — CAPA Plan (DEV-003)
  planDate: "تاريخ الخطة",
  sourceRCA: "رقم تقرير السبب الجذري",
  actionType: "نوع الإجراء",
  actionDescription: "وصف الإجراء",
  resourceRequirements: "الموارد المطلوبة",
  deadline: "الموعد النهائي",
  // QM — CAPA Review (DEV-004)
  reviewDate: "تاريخ المراجعة",
  sourceCapaPlan: "رقم خطة CAPA",
  effectivenessCriteria: "معايير قياس الفعالية",
  reviewResults: "نتائج المراجعة",
  isEffective: "هل الإجراء فعّال؟",
  furtherActionRequired: "هل تحتاج إجراء إضافياً؟",
  reviewerName: "اسم المراجع",
  // QM — Equipment Log (EQP-001)
  calibrationDate: "تاريخ المعايرة",
  nextCalibrationDate: "تاريخ المعايرة التالية",
  remarks: "ملاحظات",
  recorder: "المسجّل",
  // QM — Maintenance (MNT-001)
  partsReplaced: "القطع المستبدلة",
  results: "نتائج الصيانة",
  technician: "اسم الفني",
  // QM — Premises PRM-001 (Facility Inspection)
  inspectionArea: "منطقة الفحص",
  cleanlinessStatus: "حالة النظافة",
  pestControlStatus: "حالة مكافحة الآفات",
  maintenanceRequired: "هل تحتاج صيانة؟",
  maintenanceNotes: "ملاحظات الصيانة",
  generalNotes: "ملاحظات عامة",
  inspectorName: "اسم المفتش",
  // QM — PRM-002 (Temp & Humidity)
  logDate: "تاريخ التسجيل",
  logTime: "وقت التسجيل",
  monitoredArea: "المنطقة المراقَبة",
  recordedTemp: "درجة الحرارة المسجّلة (°C)",
  tempStatus: "حالة درجة الحرارة",
  recordedHumidity: "الرطوبة المسجّلة (%)",
  humidityStatus: "حالة الرطوبة",
  recordedBy: "سجّل بواسطة",
  // QM — PRM-003 (Lighting)
  luxReading: "قراءة اللوكس",
  lightCoversIntact: "أغطية الإضاءة سليمة",
  fixturesClean: "المصابيح نظيفة",
  // QM — PRM-004 (Air Quality)
  particulateCount: "عدد الجسيمات",
  microbialCount: "العدد الميكروبي",
  airPressureDiff: "فرق ضغط الهواء (Pa)",
  filterStatus: "حالة الفلتر",
  inspector: "المفتش",
  // QM — PRM-005 (Drainage)
  drainStatus: "حالة الصرف",
  odorsPresent: "وجود روائح",
  // QM — QM-001 (Management Review)
  meetingDate: "تاريخ الاجتماع",
  attendees: "الحضور",
  reviewInputs: "مدخلات المراجعة",
  qualityObjectivesStatus: "حالة أهداف الجودة",
  decisionsAndActions: "القرارات والإجراءات",
  nextMeetingDate: "تاريخ الاجتماع القادم",
  managerName: "اسم المدير",
  // QM — QM-002 (Risk Assessment)
  assessmentDate: "تاريخ تقييم المخاطر",
  departmentContext: "القسم / السياق",
  hazardDescription: "وصف الخطر",
  probability: "احتمالية الحدوث",
  currentControls: "ضوابط التحكم الحالية",
  mitigationPlan: "خطة التخفيف",
  assessorName: "اسم المقيّم",
  // QM — QM-003 (Supplier Evaluation)
  evaluationDate: "تاريخ التقييم",
  supplierContact: "جهة التواصل لدى المورد",
  suppliedMaterialCategory: "فئة المواد المورّدة",
  relatedMaterials: "المواد المرتبطة",
  qualityScore: "درجة الجودة",
  deliveryScore: "درجة الالتزام بالتسليم",
  documentationScore: "درجة التوثيق",
  issueHistory: "سجل المشكلات السابقة",
  overallDecision: "القرار الإجمالي",
  evaluatorName: "اسم المقيّم",
  // QM — QM-004 (KPI Report)
  reportDate: "تاريخ التقرير",
  departmentContext2: "القسم",
  metricName: "مؤشر الأداء",
  targetValue: "القيمة المستهدفة",
  analysis: "التحليل",
  actionPlan: "خطة الإجراء",
  preparedBy: "أعده",
  // QM — RCL-001 (Recall)
  recallId: "رقم أمر الاستدعاء",
  recallDate: "تاريخ الاستدعاء",
  affectedQuantity: "الكمية المتأثرة",
  recoveredQuantity: "الكمية المُستردة",
  reasonForRecall: "سبب الاستدعاء",
  communications: "الاتصالات والإشعارات",
  authorizedBy: "أذن بواسطة",
  // HR — HR-001 (Job Request)
  jobTitle: "المسمى الوظيفي",
  requestingDept: "القسم الطالب",
  reason: "سبب الطلب",
  vacancies: "عدد الوظائف الشاغرة",
  qualifications: "المؤهلات المطلوبة",
  experienceYears: "سنوات الخبرة",
  proposedSalary: "الراتب المقترح",
  dateNeeded: "تاريخ الحاجة",
  deptManagerName: "مدير القسم",
  // HR — HR-002 (Employee File)
  fullNameAr: "الاسم الكامل (عربي)",
  fullNameEn: "الاسم الكامل (إنجليزي)",
  idNumber: "رقم الهوية",
  dob: "تاريخ الميلاد",
  nationality: "الجنسية",
  maritalStatus: "الحالة الاجتماعية",
  phone: "رقم الهاتف",
  email: "البريد الإلكتروني",
  address: "العنوان",
  joinDate: "تاريخ الالتحاق",
  supervisor: "المشرف المباشر",
  basicSalary: "الراتب الأساسي",
  allowances: "البدلات",
  iqamaExpiry: "تاريخ انتهاء الإقامة",
  contractExpiry: "تاريخ انتهاء العقد",
  // HR — HR-003 (Medical Exam)
  examDate: "تاريخ الفحص",
  examType: "نوع الفحص",
  facilityName: "اسم المنشأة الطبية",
  medicalNotes: "الملاحظات الطبية",
  nextExamDate: "تاريخ الفحص القادم",
  officerName: "اسم الضابط الطبي",
  // HRT — merged HR + Training new forms
  pledgeId: "رقم الإقرار",
  pledgeDate: "تاريخ الإقرار",
  acknowledgements: "الإقرارات",
  declaration: "نص الإقرار",
  task: "البند",
  done: "تم",
  leaveType: "نوع الإجازة",
  daysCount: "عدد الأيام",
  coveringEmployee: "الموظف البديل",
  custodyId: "رقم العهدة",
  handoverType: "نوع العملية",
  serialNo: "الرقم التسلسلي",
  itemCondition: "الحالة",
  tnaId: "رقم التقرير",
  skillArea: "المهارة / المجال",
  currentLevel: "المستوى الحالي",
  requiredLevel: "المستوى المطلوب",
  suggestedCourse: "الدورة المقترحة",
  needs: "الاحتياجات التدريبية",
  onboardingId: "رقم الخطة",
  checklist: "بنود التهيئة",
  // HRT — Phase 3 (recruitment / performance / offboarding)
  interviewId: "رقم التقييم",
  candidateName: "اسم المرشح",
  interviewDate: "تاريخ المقابلة",
  interviewer: "اسم المُقابِل",
  criteria: "معايير التقييم",
  criterion: "المعيار",
  rating: "التقييم",
  recommendation: "التوصية",
  offerId: "رقم العرض",
  housingAllowance: "بدل السكن",
  transportAllowance: "بدل النقل",
  otherAllowances: "بدلات أخرى",
  totalSalary: "إجمالي الراتب",
  contractDuration: "مدة العقد",
  offerDate: "تاريخ العرض",
  warningId: "رقم الإشعار",
  warningType: "نوع الإجراء",
  violationDate: "تاريخ المخالفة",
  noticeDate: "تاريخ الإشعار",
  violationDescription: "وصف المخالفة / التقصير",
  actionRequired: "الإجراء المطلوب",
  issuedBy: "صادر عن",
  probationId: "رقم التقييم",
  decision: "القرار",
  reviewId: "رقم التقييم",
  reviewPeriod: "فترة التقييم",
  kpis: "مؤشرات الأداء",
  kpi: "المؤشر",
  target: "المستهدف",
  achieved: "المُنجز",
  weight: "الوزن %",
  overallRating: "التقييم العام",
  strengths: "نقاط القوة",
  improvements: "مجالات التحسين",
  resignationId: "رقم الطلب",
  submitDate: "تاريخ تقديم الطلب",
  lastWorkingDay: "آخر يوم عمل",
  exitInterviewId: "رقم المقابلة",
  exitDate: "تاريخ المغادرة",
  reasonForLeaving: "سبب ترك العمل",
  feedback: "التقييم",
  topic: "المحور",
  comment: "التعليق",
  suggestions: "اقتراحات للتحسين",
  wouldRecommend: "التوصية بالعمل في الشركة",
  clearanceId: "رقم إخلاء الطرف",
  clearanceItems: "بنود إخلاء الطرف",
  finalSettlement: "إجمالي مستحقات نهاية الخدمة",
  clearanceDate: "تاريخ إخلاء الطرف",
  // TRN — TRN-001 (Training Plan)
  planId: "رقم خطة التدريب",
  year: "السنة",
  trainingCourses: "الدورات التدريبية",
  courseName: "اسم الدورة",
  targetAudience: "الفئة المستهدفة",
  schedule: "الجدول الزمني",
  provider: "الجهة المقدِّمة",
  // TRN — TRN-002 (Training Record)
  trainingCourse: "الدورة التدريبية",
  totalHours: "إجمالي الساعات",
  // TRN — TRN-003 (Training Evaluation)
  evalId: "رقم التقييم",
  evalDate: "تاريخ التقييم",
  jobKnowledgeScore: "درجة المعرفة الوظيفية",
  qualityOfWorkScore: "درجة جودة العمل",
  productivityScore: "درجة الإنتاجية",
  overallScore: "الدرجة الإجمالية",
  evaluatorRemarks: "ملاحظات المقيّم",
  // TRN — TRN-004 (Certificate)
  certId: "رقم الشهادة",
  completionDate: "تاريخ الإتمام",
  providerName: "اسم الجهة المقدِّمة",
  hours: "عدد الساعات",
  grade: "التقدير",
  issuerName: "اسم مصدر الشهادة",
  // LAB — LAB-001 (Test Request)
  sampleType: "نوع العينة",
  itemCode: "كود الصنف",
  itemName: "اسم الصنف",
  requiredTests: "الفحوصات المطلوبة",
  requestedBy: "طلبه",
  // LAB — LAB-002 (Sample Receipt)
  receiveDate: "تاريخ الاستلام",
  testRequestId: "رقم طلب الفحص المرتبط",
  sampleQuantity: "كمية العينة",
  containerType: "نوع الوعاء",
  conditionOnReceipt: "حالة العينة عند الاستلام",
  // LAB — LAB-003 (Test Results)
  resultId: "رقم نتائج الفحص",
  overallStatus: "النتيجة الإجمالية",
  testedBy: "أجرى الفحص",
  specification: "المواصفة",
  resultValue: "القيمة الفعلية",
  passFail: "القبول / الرفض",
  // LAB — LAB-004 (CoA)
  coaId: "رقم شهادة المطابقة",
  testResultId: "رقم نتائج الفحص المرتبطة",
  productionDate: "تاريخ الإنتاج",
  finalStatus: "الحالة النهائية",
  // LAB — LAB-005 (Stability Study)
  studyId: "رقم دراسة الاستقرارية",
  studyType: "نوع الدراسة",
  storageConditions: "شروط التخزين",
  testIntervals: "فترات الفحص",
  studyStatus: "حالة الدراسة",
  // LAB — LAB-006 (Calibration)
  calibId: "رقم سجل المعايرة",
  calibrationType: "نوع المعايرة",
  vendorName: "اسم المورد / الجهة",
  // LAB — LAB-007 (Lab Issue Request)
  purpose: "الغرض من الطلب",
  // Misc
  reference: "المرجع",
  referenceDocument: "وثيقة المرجع",
  lowStockAlert: "تنبيه مخزون منخفض",
  lowStockAlertTriggered: "تم تفعيل تنبيه المخزون المنخفض",
  // QM — Cleaning / Premises / Maintenance (tabular forms)
  weekStartDate: "بداية الأسبوع",
  shift: "الوردية",
  cleaningLog: "جدول التنظيف",
  material: "مادة التنظيف",
  verifiedDate: "تاريخ التحقّق",
  sat: "السبت",
  sun: "الأحد",
  mon: "الاثنين",
  tue: "الثلاثاء",
  wed: "الأربعاء",
  thu: "الخميس",
  fri: "الجمعة",
  areas: "نتائج فحص المرافق",
  area: "المنطقة / المرفق",
  cleanliness: "النظافة العامة",
  pestControl: "مكافحة الآفات",
  maintenanceNeeded: "تحتاج صيانة؟",
  temp: "الحرارة °م",
  tempLimit: "حد الحرارة المسموح",
  humidity: "الرطوبة %",
  humidityLimit: "حد الرطوبة المسموح",
  zones: "المناطق الضوئية",
  minRequired: "الحد الأدنى المطلوب",
  coversIntact: "الأغطية سليمة؟",
  drains: "نقاط الصرف",
  trapIntact: "السيفون سليم؟",
  logMonth: "شهر السجل",
  tasks: "مهام الصيانة",
  scheduledDate: "التاريخ المخطط",
  completedDate: "تاريخ التنفيذ",
};

// Fields that are internal/redundant and should NOT appear in print
const HIDDEN_FIELDS = new Set([
  "coaFileUrl", "msdsFileUrl", "tdsFileUrl", "allergyFileUrl",
  "productionQty", "productionUnit", "itemNumber",
]);

// Translate known English values to Arabic
const VALUE_MAP: Record<string, Record<string, string>> = {
  qcStatus:              { Approved: "معتمد — مطابق للمواصفات", Rejected: "مرفوض — غير مطابق" },
  transactionType:       { Receive: "استلام", Issue: "صرف / إصدار", Transfer: "نقل داخلي" },
  priority:              { Normal: "عادي", High: "عالي", Urgent: "عاجل", Low: "منخفض" },
  category:              { "Raw Material": "مادة خام", "Finished Product": "منتج نهائي", "Packaging": "مواد تعبئة" },
  itemType:              { Product: "منتج نهائي", Material: "مادة خام" },
  inspectionResult:      { Pass: "مقبول", Fail: "مرفوض", Approved: "معتمد", Rejected: "مرفوض" },
  overallStatus:         { Pass: "مقبول", Fail: "مرفوض" },
  passFail:              { Pass: "مقبول", Fail: "مرفوض" },
  finalStatus:           { Approved: "معتمد", Rejected: "مرفوض", Quarantine: "عزل مؤقت" },
  overallDecision:       { Approved: "معتمد", Rejected: "مرفوض", "Approved with conditions": "معتمد بشروط" },
  sampleType:            { "Raw Material": "مادة خام", "Finished Product": "منتج نهائي", "In-Process": "أثناء الإنتاج", "Packaging": "مواد تعبئة" },
  storageCondition:      { "Room Temperature": "درجة حرارة الغرفة", Refrigerator: "ثلاجة", Freezer: "فريزر", Incubator: "حاضنة", Desiccator: "مجفف" },
  conditionOnReceipt:    { Intact: "سليم", "Damaged Container": "وعاء تالف", Insufficient: "كمية غير كافية", "Incorrect Labeling": "بطاقة خاطئة" },
  testType:              { "Physico-Chemical": "فيزيوكيميائي", Microbiological: "ميكروبيولوجي", "Heavy Metals": "معادن ثقيلة", Organoleptic: "حسي" },
  studyType:             { Accelerated: "مسرّع", "Real Time": "زمن حقيقي", Both: "كلاهما" },
  studyStatus:           { Ongoing: "جارٍ", Completed: "مكتمل", Discontinued: "موقوف" },
  calibrationType:       { Internal: "داخلي", External: "خارجي" },
  filterStatus:          { Good: "جيد", "Needs Replacement": "يحتاج استبدال" },
  drainStatus:           { Clean: "نظيف", Blocked: "مسدود", "Needs Maintenance": "يحتاج صيانة" },
  cleanlinessStatus:     { Pass: "مقبول", "Action Required": "تصرف مطلوب", Fail: "مرفوض" },
  pestControlStatus:     { Pass: "مقبول", "Action Required": "تصرف مطلوب", Fail: "مرفوض" },
  inspectionArea:        { "Production Area": "منطقة الإنتاج", Warehouse: "المستودع", "QC Lab": "مختبر الجودة" },
  area:                  { Production: "الإنتاج", "Production Area": "منطقة الإنتاج", Warehouse: "المستودع", "QC Lab": "مختبر الجودة" },
  maintenanceType:       { Preventive: "وقائية", Corrective: "تصحيحية" },
  status:                {
    Open: "مفتوح", Closed: "مغلق", Verified: "تم التحقق", Draft: "مسودة",
    "In Progress": "قيد التنفيذ", Operational: "يعمل", "Out of Order": "معطل",
    "Under Maintenance": "تحت الصيانة", Planned: "مخطط", "On Target": "في المسار",
    "Needs Attention": "يحتاج متابعة", Critical: "حرج",
  },
  actionType:            { Corrective: "تصحيحي", Preventive: "وقائي" },
  deviationClassification: { Minor: "بسيط", Major: "جوهري", Critical: "حرج" },
  deviationType:         { Process: "عملية", Equipment: "معدات", Material: "مواد", Documentation: "توثيق", Environment: "بيئة" },
  nonConformityType:     { Product: "منتج", Process: "عملية", Material: "مواد", Documentation: "توثيق" },
  severity:              { Minor: "بسيط", Major: "جوهري", Critical: "حرج" },
  disposition:           { Quarantine: "عزل", Rework: "إعادة تصنيع", Destroy: "إتلاف", "Use As Is": "استخدام كما هو", Return: "إرجاع" },
  analysisMethod:        { "5 Why": "5 لماذا", Ishikawa: "مخطط إيشيكاوا" },
  isEffective:           { Yes: "نعم — فعّال", No: "لا — غير فعّال", Partially: "جزئياً" },
  suppliedMaterialCategory: { "Raw Material": "مادة خام", Packaging: "تعبئة وتغليف", Services: "خدمات" },
  grade:                 { Passed: "ناجح", Failed: "راسب", Excellent: "ممتاز" },
  lightCoversIntact:     { Yes: "نعم", No: "لا" },
  fixturesClean:         { Yes: "نعم", No: "لا" },
  odorsPresent:          { Yes: "نعم", No: "لا" },
};

const translateValue = (key: string, val: any): string => {
  if (val === null || val === undefined) return "—";
  if (typeof val === "boolean") return val ? "نعم" : "لا";
  const str = String(val);
  if (str === "") return "—";
  if (VALUE_MAP[key]?.[str]) return VALUE_MAP[key][str];
  // Generic English-to-Arabic for unlisted common values
  const generic: Record<string, string> = {
    Approved: "معتمد", Rejected: "مرفوض", Pending: "قيد الانتظار",
    Active: "نشط", Inactive: "غير نشط", Pass: "مقبول", Fail: "مرفوض",
    Yes: "نعم", No: "لا", Normal: "عادي", High: "عالي", Low: "منخفض",
    Receive: "استلام", Issue: "صرف", Transfer: "نقل",
    Product: "منتج نهائي", Material: "مادة خام",
    Open: "مفتوح", Closed: "مغلق", Draft: "مسودة",
    Preventive: "وقائية", Corrective: "تصحيحية",
    Minor: "بسيط", Major: "جوهري", Critical: "حرج",
    Ongoing: "جارٍ", Completed: "مكتمل",
    Passed: "ناجح", Failed: "راسب",
    Internal: "داخلي", External: "خارجي",
  };
  return generic[str] ?? str;
};

const translateKey = (key: string): string => {
  if (FIELD_LABELS[key]) return FIELD_LABELS[key];
  if (PKG_FIELD_LABELS[key]) return PKG_FIELD_LABELS[key];
  // Convert camelCase to spaced Arabic-friendly fallback
  return key.replace(/([A-Z])/g, " $1").trim();
};

const triggerPrint = () => {
  const api = (window as any).electronAPI;
  if (api?.printPreview) { api.printPreview(); } else { window.print(); }
};

export default function FormViewer() {
  const { recordId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [record, setRecord] = useState<any>(null);
  const [company, setCompany] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [showNotesInput, setShowNotesInput] = useState<{ show: boolean; type: string }>({ show: false, type: "" });
  const [notes, setNotes] = useState("");

  useEffect(() => {
    fetch("/api/company", { headers: getAuthHeaders() })
      .then((r) => r.json())
      .then((d) => setCompany(d || {}))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!recordId) return;
    fetch(`/api/forms/record/${recordId}`, { headers: getAuthHeaders() })
      .then((r) => { if (!r.ok) throw new Error("Not found"); return r.json(); })
      .then((data) => { setRecord(data); setLoading(false); })
      .catch((err) => { console.error(err); setLoading(false); });
  }, [recordId]);

  if (loading) return <div className="p-8 text-center text-slate-500">جاري التحميل...</div>;

  if (!record) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-xl font-bold text-slate-800 mb-4">السجل غير موجود</h2>
        <button onClick={() => navigate(-1)} className="text-sky-500 hover:underline">العودة</button>
      </div>
    );
  }

  const { data } = record;

  const executeStatusChange = async (newStatus: string, reasonNotes: string = "") => {
    try {
      const res = await fetch(`/api/forms/record/${recordId}`, {
        method: "PUT",
        headers: getJsonHeaders(),
        body: JSON.stringify({ status: newStatus, userId: user?.id, notes: reasonNotes }),
      });
      if (res.ok) { setRecord({ ...record, status: newStatus }); setShowNotesInput({ show: false, type: "" }); setNotes(""); }
    } catch (err) { console.error(err); }
  };

  const handleStatusChange = (newStatus: string) => {
    if (newStatus === "returned" || newStatus === "rejected") {
      setShowNotesInput({ show: true, type: newStatus });
    } else {
      executeStatusChange(newStatus);
    }
  };

  const renderStatusBadge = (status: string) => {
    const map: Record<string, { label: string; cls: string }> = {
      approved:         { label: "معتمد",              cls: "bg-emerald-100 text-emerald-800" },
      rejected:         { label: "مرفوض",              cls: "bg-red-100 text-red-700" },
      returned:         { label: "مُعاد بملاحظات",     cls: "bg-orange-100 text-orange-700" },
      pending_review:   { label: "في انتظار المراجعة", cls: "bg-blue-100 text-blue-700" },
      pending_approval: { label: "في انتظار الاعتماد", cls: "bg-purple-100 text-purple-700" },
      draft:            { label: "مسودة",              cls: "bg-slate-100 text-slate-700" },
    };
    const s = map[status] || map.draft;
    return <span className={`px-3 py-1.5 rounded-lg text-[12px] font-bold ${s.cls}`}>{s.label}</span>;
  };

  const formRouteMap: Record<string, string> = {
    "F-HR-001": "/hr/new-request", "F-HR-002": "/hr/employee-file", "F-HR-003": "/hr/medical-exam",
    "F-HRT-001": "/hr/safety-pledge", "F-HRT-002": "/hr/leave-request", "F-HRT-003": "/hr/custody-handover",
    "F-HRT-004": "/hr/training-needs", "F-HRT-005": "/hr/onboarding",
    "F-HRT-006": "/hr/interview-eval", "F-HRT-007": "/hr/job-offer", "F-HRT-008": "/hr/warning-notice",
    "F-HRT-009": "/hr/probation-eval", "F-HRT-010": "/hr/performance-review",
    "F-HRT-011": "/hr/resignation", "F-HRT-012": "/hr/exit-interview", "F-HRT-013": "/hr/clearance",
    "F-PRD-001": "/prd/production-order", "F-PRD-002": "/prd/batch-record",
    "F-PRD-003": "/prd/production-checklist", "F-PRD-004": "/prd/process-monitoring",
    "F-INV-RMT-001": "/inv/rmt", "F-FP-001": "/inv/fp-001", "F-FP-002": "/inv/fp-002",
    "F-FP-003": "/inv/fp-003", "F-FP-004": "/inv/fp-004", "F-FP-005": "/inv/fp-005",
    "F-FP-006": "/inv/fp-006", "F-INV-BOM": "/inv/composition", "F-INV-RM-001": "/inv/rm-001",
    "F-INV-MAT": "/inv/create-material", "F-INV-WH": "/inv/create-warehouse",
    "F-INV-PRQ-001": "/inv/prq-001", "F-INV-PIN-001": "/inv/pin-001",
    "F-QM-001": "/qm/qm-001", "F-QM-002": "/qm/qm-002", "F-QM-003": "/qm/qm-003",
    "F-QM-004": "/qm/qm-004", "F-QM-005": "/qm/qm-005", "F-QM-006": "/qm/qm-006",
    "F-DEV-001": "/qm/dev-001", "F-DEV-002": "/qm/dev-002", "F-DEV-003": "/qm/dev-003",
    "F-DEV-004": "/qm/dev-004", "F-CMP-001": "/qm/cmp-001", "F-RCL-001": "/qm/rcl-001",
    "F-PRM-001": "/qm/prm-001", "F-PRM-002": "/qm/prm-002", "F-PRM-003": "/qm/prm-003",
    "F-PRM-004": "/qm/prm-004", "F-PRM-005": "/qm/prm-005", "F-EQP-001": "/qm/eqp-001",
    "F-MNT-001": "/qm/mnt-001", "F-CLN-001": "/qm/cln-001",
    "F-TRN-001": "/trn/trn-001", "F-TRN-002": "/trn/trn-002",
    "F-TRN-003": "/trn/trn-003", "F-TRN-004": "/trn/trn-004",
    "F-LAB-001": "/lab/lab-001", "F-LAB-002": "/lab/lab-002", "F-LAB-003": "/lab/lab-003",
    "F-LAB-004": "/lab/lab-004", "F-LAB-005": "/lab/lab-005", "F-LAB-006": "/lab/lab-006",
  };

  const todayHijri = new Date().toLocaleDateString("ar-SA-u-ca-islamic", { year: "numeric", month: "numeric", day: "numeric" });

  // Determine print orientation based on form type
  const landscapeForms = ["F-INV-PIN-001", "F-INV-PRQ-001", "F-PRD-002", "F-LAB-003", "F-PRD-004"];
  const isLandscape = landscapeForms.includes(record.form_id);

  const FORM_TITLES: Record<string, string> = {
    "F-INV-RM-001":    "سجل استلام وتسجيل المواد الخام",
    "F-INV-MAT":       "تسجيل مادة / صنف جديد",
    "F-INV-WH":        "تسجيل مستودع",
    "F-INV-PRQ-001":   "طلب الشراء",
    "F-INV-PIN-001":   "فاتورة الشراء",
    "F-INV-BOM":       "قائمة المكونات (BOM)",
    "F-INV-RMT-001":   "حركة مخزون — صرف / استلام / نقل",
    "F-FP-001":        "إطلاق الدفعة وتخزين المنتج النهائي",
    "F-FP-002":        "تخزين المنتج النهائي",
    "F-FP-003":        "شحن المنتج النهائي",
    "F-FP-004":        "إرجاع المنتج النهائي",
    "F-FP-005":        "إذن الإتلاف",
    "F-FP-006":        "تسوية المخزون",
    "F-PRD-001":       "أمر الإنتاج",
    "F-PRD-002":       "سجل الدفعة",
    "F-PRD-003":       "قائمة فحص الإنتاج",
    "F-PRD-004":       "مراقبة العملية",
    "F-QM-001":        "محضر مراجعة الإدارة",
    "F-QM-002":        "تقييم المخاطر",
    "F-QM-003":        "تقييم المورّد",
    "F-QM-004":        "تقرير مؤشرات الأداء (KPI)",
    "F-QM-005":        "تقرير عدم المطابقة (NCR)",
    "F-QM-006":        "إجراء تصحيحي ووقائي (CAPA)",
    "F-CMP-001":       "سجل شكوى العميل",
    "F-DEV-001":       "بلاغ انحراف",
    "F-DEV-002":       "تقرير تحليل السبب الجذري (RCA)",
    "F-DEV-003":       "خطة إجراء CAPA",
    "F-DEV-004":       "مراجعة فعالية CAPA",
    "F-RCL-001":       "أمر استدعاء المنتج",
    "F-PRM-001":       "سجل فحص المنشأة",
    "F-PRM-002":       "سجل درجة الحرارة والرطوبة",
    "F-PRM-003":       "سجل فحص الإضاءة",
    "F-PRM-004":       "سجل جودة الهواء",
    "F-PRM-005":       "سجل فحص الصرف الصحي",
    "F-EQP-001":       "سجل المعدة / المعايرة",
    "F-MNT-001":       "سجل الصيانة",
    "F-CLN-001":       "سجل التنظيف الأسبوعي للمرافق",
    "F-HR-001":        "طلب احتياج وظيفي",
    "F-HR-002":        "ملف الموظف",
    "F-HR-003":        "سجل الفحص الطبي",
    "F-HRT-001":       "إقرار الالتزام بالسلامة والصحة المهنية و GMP",
    "F-HRT-002":       "طلب إجازة",
    "F-HRT-003":       "تسليم واستلام عُهدة",
    "F-HRT-004":       "حصر الاحتياجات التدريبية (TNA)",
    "F-HRT-005":       "خطة تهيئة موظف جديد",
    "F-HRT-006":       "تقييم مقابلة شخصية",
    "F-HRT-007":       "عرض وظيفي",
    "F-HRT-008":       "لفت نظر / إنذار كتابي",
    "F-HRT-009":       "تقييم فترة التجربة (90 يوماً)",
    "F-HRT-010":       "تقييم الأداء السنوي / النصف سنوي",
    "F-HRT-011":       "قبول استقالة / إنهاء خدمات",
    "F-HRT-012":       "مقابلة خروج (Exit Interview)",
    "F-HRT-013":       "إخلاء طرف (Clearance)",
    "F-TRN-001":       "خطة التدريب السنوية",
    "F-TRN-002":       "سجل التدريب",
    "F-TRN-003":       "تقييم فعالية التدريب",
    "F-TRN-004":       "شهادة إتمام التدريب",
    "F-LAB-001":       "طلب فحص مختبري",
    "F-LAB-002":       "سجل استلام العينات",
    "F-LAB-003":       "نتائج الفحص المختبري",
    "F-LAB-004":       "شهادة مطابقة (CoA)",
    "F-LAB-005":       "دراسة الاستقرارية",
    "F-LAB-006":       "سجل معايرة المعدات",
    "F-LAB-007":       "طلب صرف مواد للمختبر",
  };
  const formTitle =
    FORM_TITLES[record.form_id] || PKG_FORM_TITLES[record.form_id] || record.form_id;

  return (
    <div className="max-w-4xl mx-auto space-y-4" dir="rtl">
      <style>{`
        @media print {
          @page {
            size: A4 ${isLandscape ? "landscape" : "portrait"};
            margin: 8mm 6mm;
          }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; font-size: 9pt !important; }
          .print\\:hidden { display: none !important; }
          .print\\:border-none { border: none !important; }
          .print\\:shadow-none { box-shadow: none !important; }
          .print\\:rounded-none { border-radius: 0 !important; }
          table { font-size: 8pt !important; }
          th, td { padding: 3px 5px !important; font-size: 8pt !important; }
          h1 { font-size: 13pt !important; }
          h2 { font-size: 11pt !important; }
          p, span, div { font-size: 9pt; }
          /* Keep signature block on same page */
          .px-8.pb-6 { page-break-inside: avoid; }
        }
      `}</style>
      {/* Action Bar - hidden on print */}
      <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm print:hidden flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="text-slate-400 hover:text-slate-600 bg-slate-50 p-2 rounded-lg">
            <ArrowRight className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-lg font-bold text-slate-900 m-0">تفاصيل النموذج: {record.record_id}</h1>
            <p className="text-[13px] font-semibold text-slate-500">{record.form_id}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {renderStatusBadge(record.status)}

          {(record.status === "draft" || record.status === "returned") && (
            <button onClick={() => handleStatusChange("pending_review")}
              className="flex items-center gap-2 px-4 py-2 bg-sky-500 text-white rounded-lg hover:bg-sky-600 font-semibold text-[13px]">
              <Send className="w-4 h-4" /> إرسال للمراجعة
            </button>
          )}

          {user?.level <= 3 && record.status === "pending_review" && (<>
            <button onClick={() => handleStatusChange("pending_approval")}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 font-semibold text-[13px]">
              <CheckCircle className="w-4 h-4" /> إرسال للمدير
            </button>
            <button onClick={() => handleStatusChange("returned")}
              className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 font-semibold text-[13px]">
              <AlertCircle className="w-4 h-4" /> إعادة للموظف
            </button>
          </>)}

          {user?.level <= 2 && record.status === "pending_approval" && (<>
            <button onClick={() => handleStatusChange("approved")}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 font-semibold text-[13px]">
              <CheckCircle className="w-4 h-4" /> اعتماد نهائي
            </button>
            <button onClick={() => handleStatusChange("rejected")}
              className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 font-semibold text-[13px]">
              <XCircle className="w-4 h-4" /> رفض
            </button>
          </>)}

          {(record.status === "draft" || record.status === "returned") && (
            <button onClick={() => {
                if (isPackagingFormId(record.form_id)) {
                  const key = getPackagingFormById(record.form_id)?.key;
                  if (key) navigate(`/pkg/form/${key}?edit=${record.record_id}`);
                  return;
                }
                const route = formRouteMap[record.form_id];
                if (route) navigate(`${route}?edit=${record.record_id}`);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 font-semibold text-[13px]">
              تعديل المسودة
            </button>
          )}

          <button onClick={triggerPrint}
            className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 font-semibold text-[13px]">
            <Printer className="w-4 h-4" /> طباعة PDF
          </button>

          {user?.level <= 2 && (
            <button
              onClick={async () => {
                const confirmMsg = record.status === "approved"
                  ? `تحذير: هذا النموذج معتمد. هل أنت متأكد من حذفه نهائياً؟`
                  : `هل أنت متأكد من حذف النموذج "${record.record_id}"؟`;
                if (!window.confirm(confirmMsg)) return;
                const res = await fetch(`/api/forms/record/${recordId}`, {
                  method: "DELETE",
                  headers: getAuthHeaders(),
                });
                if (res.ok) { alert("تم حذف النموذج بنجاح"); navigate(-1); }
                else { const e = await res.json().catch(() => ({ error: "خطأ" })); alert("فشل الحذف: " + e.error); }
              }}
              className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 font-semibold text-[13px]">
              <Trash2 className="w-4 h-4" /> حذف النموذج
            </button>
          )}
        </div>
      </div>

      {showNotesInput.show && (
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm print:hidden">
          <h3 className="text-sm font-bold text-slate-800 mb-2">
            {showNotesInput.type === "rejected" ? "سبب الرفض" : "ملاحظات الإعادة"}
          </h3>
          <textarea className="w-full border border-slate-300 rounded-lg p-3 outline-none focus:border-sky-500 mb-3" rows={2}
            placeholder="اكتب الأسباب والملاحظات هنا..." value={notes} onChange={(e) => setNotes(e.target.value)} />
          <div className="flex gap-2 justify-end">
            <button onClick={() => setShowNotesInput({ show: false, type: "" })}
              className="px-4 py-2 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg text-sm font-semibold">إلغاء</button>
            <button onClick={() => executeStatusChange(showNotesInput.type, notes)} disabled={!notes.trim()}
              className="px-4 py-2 text-white bg-sky-600 hover:bg-sky-700 rounded-lg text-sm font-semibold disabled:opacity-50">تأكيد</button>
          </div>
        </div>
      )}

      {/* Printable Document */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden print:border-none print:shadow-none print:rounded-none shadow-sm">
        {/* Company Header */}
        <div className="p-6 border-b border-slate-200">
          <div className="flex items-start justify-between gap-4">
            {/* Logo + Company Info */}
            <div className="flex items-center gap-4">
              {company.logo_url ? (
                <img src={company.logo_url} alt="شعار الشركة" className="h-20 w-20 object-contain border border-slate-200 rounded-xl p-1" />
              ) : (
                <div className="h-20 w-20 border-2 border-slate-300 rounded-xl flex items-center justify-center text-slate-400 text-xs text-center font-bold">شعار</div>
              )}
              <div>
                <h1 className="text-xl font-bold text-slate-900">{company.name_ar || "الشركة"}</h1>
                <p className="text-sm font-semibold text-slate-500">{company.name_en || ""}</p>
                {company.address && <p className="text-xs text-slate-400 mt-1">{company.address}</p>}
                {(company.phone || company.email) && (
                  <p className="text-xs text-slate-400">
                    {company.phone && `الهاتف: ${company.phone}`}
                    {company.phone && company.email && " | "}
                    {company.email && `البريد: ${company.email}`}
                  </p>
                )}
                {company.license_number && (
                  <p className="text-xs text-slate-400">رقم الترخيص: {company.license_number}</p>
                )}
              </div>
            </div>
            {/* Document Info Box */}
            <div className="border border-slate-300 rounded-lg overflow-hidden text-[12px] min-w-[200px]">
              <table className="w-full border-collapse">
                <tbody>
                  <tr className="border-b border-slate-200">
                    <td className="px-3 py-1.5 text-slate-500 border-l border-slate-200">رقم النموذج</td>
                    <td className="px-3 py-1.5 font-mono font-bold text-slate-800">{record.form_id}</td>
                  </tr>
                  <tr className="border-b border-slate-200">
                    <td className="px-3 py-1.5 text-slate-500 border-l border-slate-200">رقم السجل</td>
                    <td className="px-3 py-1.5 font-mono font-bold text-sky-700">{record.record_id}</td>
                  </tr>
                  <tr className="border-b border-slate-200">
                    <td className="px-3 py-1.5 text-slate-500 border-l border-slate-200">الإصدار</td>
                    <td className="px-3 py-1.5 font-bold text-slate-800">Rev.01</td>
                  </tr>
                  <tr>
                    <td className="px-3 py-1.5 text-slate-500 border-l border-slate-200">التاريخ</td>
                    <td className="px-3 py-1.5 font-bold text-slate-800">{todayHijri}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Section Label */}
        <div className="bg-slate-800 text-white text-center py-2 font-bold text-[15px] tracking-wide">
          {formTitle}
        </div>

        {/* Form Data */}
        <div className="p-8">
          <div className="grid grid-cols-2 gap-y-5 gap-x-8">
            {Object.entries(data).map(([key, val], idx) => {
              // Skip internal/file-only fields
              if (HIDDEN_FIELDS.has(key)) return null;

              // Attachment (image or PDF)
              if ((key === "attachmentUrl" || key.endsWith("FileUrl") || key.endsWith("Url")) && typeof val === "string" && val.startsWith("data:")) {
                return (
                  <div key={idx} className="col-span-2 border-b border-slate-100 pb-4">
                    <span className="block text-[12px] font-semibold text-slate-500 mb-2">{translateKey(key)}</span>
                    {val.startsWith("data:image/") ? (
                      <img src={val} alt="مرفق" className="max-h-48 object-contain border border-slate-200 rounded-lg" />
                    ) : (
                      <span className="text-sky-600 text-sm font-semibold">✓ مرفق موجود</span>
                    )}
                  </div>
                );
              }

              // Array of objects → table
              if (Array.isArray(val) && val.length > 0 && typeof val[0] === "object") {
                const visibleKeys = Object.keys(val[0]).filter(k => !HIDDEN_FIELDS.has(k));
                return (
                  <div key={idx} className="col-span-2 mt-2">
                    <div className="bg-slate-700 text-white px-4 py-2 font-bold text-[13px] rounded-t-lg">{translateKey(key)}</div>
                    <div className="overflow-x-auto border border-slate-200 rounded-b-lg">
                      <table className="w-full text-right border-collapse text-[13px]">
                        <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                          <tr>
                            {visibleKeys.map((k) => (
                              <th key={k} className="p-2.5 font-semibold border-l border-slate-200 last:border-l-0">{translateKey(k)}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {val.map((item: any, i: number) => (
                            <tr key={i} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                              {visibleKeys.map((k, j) => (
                                <td key={j} className="p-2.5 border-l border-slate-100 last:border-l-0">{translateValue(k, item[k])}</td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              }

              // Nested object → key-value table
              if (typeof val === "object" && val !== null && !Array.isArray(val)) {
                return (
                  <div key={idx} className="col-span-2 mt-2">
                    <div className="bg-slate-700 text-white px-4 py-2 font-bold text-[13px] rounded-t-lg">{translateKey(key)}</div>
                    <div className="border border-slate-200 rounded-b-lg overflow-hidden">
                      <table className="w-full text-right border-collapse text-[13px]">
                        <tbody>
                          {Object.entries(val as Record<string, any>)
                            .filter(([k]) => !HIDDEN_FIELDS.has(k))
                            .map(([k, v], j) => (
                              <tr key={j} className="border-b border-slate-100 last:border-0">
                                <td className="p-2.5 font-semibold text-slate-600 border-l border-slate-100 w-1/2">{translateKey(k)}</td>
                                <td className="p-2.5 font-bold text-slate-900">{translateValue(k, v)}</td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              }

              // Skip empty values
              const strVal = val === null || val === undefined ? "" : String(val);
              if (strVal === "" || strVal === "—") return null;

              return (
                <div key={idx} className="border-b border-slate-100 pb-3">
                  <span className="block text-[12px] font-semibold text-slate-500 mb-0.5">{translateKey(key)}</span>
                  <span className="block text-[14px] font-semibold text-slate-900 break-words whitespace-pre-wrap">{translateValue(key, val)}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Signature Blocks */}
        <div className="px-8 pb-6">
          <div className="grid grid-cols-4 gap-3 border border-slate-200 rounded-xl overflow-hidden">
            {["صاحب الطلب", "المنفذ", "المراجع", "المعتمد"].map((title) => (
              <div key={title} className="border-l border-slate-200 last:border-l-0 p-4">
                <div className="bg-slate-800 text-white text-center text-[12px] font-bold py-1.5 rounded mb-8">{title}</div>
                <div className="border-t border-slate-300 pt-2 space-y-1.5">
                  <p className="text-[11px] text-slate-500">التوقيع: <span className="inline-block w-20 border-b border-slate-300"></span></p>
                  <p className="text-[11px] text-slate-500">التاريخ: <span className="inline-block w-16 border-b border-slate-300"></span></p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 border-t border-slate-200 px-8 py-3 flex justify-between items-center text-[11px] text-slate-400">
          <span>{company.name_ar || ""} — {company.name_en || ""}</span>
          <span>وثيقة خاضعة لنظام الجودة — يُمنع التعديل بعد الاعتماد</span>
          <span>تاريخ الإنشاء: {new Date(record.created_at).toLocaleDateString("ar-EG")}</span>
        </div>
      </div>
    </div>
  );
}
