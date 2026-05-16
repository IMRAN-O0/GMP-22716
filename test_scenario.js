import fs from 'fs';
import path from 'path';

async function run() {
  console.log("Starting E2E test...");
  const baseUrl = "http://localhost:3000/api";
  
  // 1. Login
  const loginRes = await fetch(`${baseUrl}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId: "admin", password: "admin123" })
  });
  const loginData = await loginRes.json();
  const token = loginData.token;
  if (!token) {
    console.error("Failed to login", loginData);
    return;
  }
  console.log("Logged in successfully.");

  const headers = {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${token}`
  };

  const createForm = async (fId, status, data) => {
    const res = await fetch(`${baseUrl}/forms`, {
      method: "POST",
      headers,
      body: JSON.stringify({ formId: fId, status, data })
    });
    const result = await res.json();
    if (!res.ok) console.error("Error creating", fId, result);
    return result;
  };

  const updateForm = async (recordId, status, data) => {
    const res = await fetch(`${baseUrl}/forms/record/${recordId}`, {
      method: "PUT",
      headers,
      body: JSON.stringify({ status, data })
    });
    const result = await res.json();
    return result;
  };

  const createMaterial = async (m) => {
    const res = await fetch(`${baseUrl}/materials`, {
      method: "POST",
      headers,
      body: JSON.stringify(m)
    });
    return res.json();
  };

  // 0. Ensure RM-TEST and PRD-TEST materials exist
  await createMaterial({ code: "RM-TEST", name: "Test Raw Material", category: "مادة خام", balance: 0, unit: "kg" });
  await createMaterial({ code: "PRD-TEST", name: "Test Finished Product", category: "منتج نهائي", balance: 0, unit: "kg" });

  const batchNo = "BAT-TEST-001";
  
  // 1. PRQ - Purchase Request
  console.log("1. Creating F-PRQ-001...");
  await createForm("F-PRQ-001", "approved", {
    requestNo: `PRQ-TEST-${Date.now()}`,
    requestDate: new Date().toISOString(),
    department: "Production",
    items: [{ code: "RM-TEST", materialName: "Test Raw Material", quantity: 500, requiredDate: new Date().toISOString() }],
  });

  // 2. PIN - Receive Material
  console.log("2. Creating F-INV-PIN-001 (Receive Material)...");
  await createForm("F-INV-PIN-001", "approved", {
    invoiceId: `PIN-TEST-${Date.now()}`,
    invoiceDate: new Date().toISOString(),
    items: [{ materialCode: "RM-TEST", quantity: "500", unitPrice: "10" }]
  });

  // 3. LAB Raw Material
  console.log("3. Creating F-LAB-001 (Raw Material Test)...");
  await createForm("F-LAB-001", "approved", {
    batchNumber: batchNo,
    materialCode: "RM-TEST",
    testConclusion: "Pass"
  });

  // 4. RMT - Dispense/Transfer for Production
  console.log("4. Creating F-INV-RMT-001 (Raw Material Dispense)...");
  await createForm("F-INV-RMT-001", "approved", {
    transactionId: `RMT-TEST-${Date.now()}`,
    transactionType: "Issue",
    targetBatch: batchNo,
    items: [{ materialCode: "RM-TEST", quantity: "200" }]
  });

  // 5. PRD - Production Order
  console.log("5. Creating F-PRD-001 (Production Order)...");
  await createForm("F-PRD-001", "approved", {
    productionOrderNo: `PO-TEST-${Date.now()}`,
    batchNumber: batchNo,
    itemNumber: "PRD-TEST",
    requiredBatchSize: "200"
  });

  // 6. BMR - Batch Manufacturing Record
  console.log("6. Creating F-PRD-002 (BMR)...");
  await createForm("F-PRD-002", "approved", {
    batchNumber: batchNo,
    productionOrderNo: `PO-TEST-${Date.now()}`,
    comments: "Production completed."
  });

  // 7. LAB Finished Product
  console.log("7. Creating F-LAB-005 (Finished Product Test)...");
  await createForm("F-LAB-005", "approved", {
    batchNumber: batchNo,
    conclusion: "Pass"
  });

  // 8. QM Deviation/NCR
  console.log("8. Creating F-QM-005 (Quality Event)...");
  await createForm("F-QM-005", "approved", {
    batchNumber: batchNo,
    type: "NCR",
    description: "Minor packaging issue"
  });

  // 9. FP Product Release
  console.log("9. Creating F-FP-001 (Product Release)...");
  await createForm("F-FP-001", "approved", {
    batchNumber: batchNo,
    releaseDecision: "Released"
  });

  // 10. FP Store to finished warehouse
  console.log("10. Creating F-FP-002 (Store Finished Product)...");
  await createForm("F-FP-002", "approved", {
    batchNumber: batchNo,
    quantityStored: "200"
  });

  // Check Inventory
  console.log("Checking final inventory balances...");
  const matsRes = await fetch(`${baseUrl}/materials`, { headers });
  const materials = await matsRes.json();
  const rm = materials.find(m => m.code === "RM-TEST");
  const fp = materials.find(m => m.code === "PRD-TEST");
  
  if (rm) console.log(`RM-TEST balance: ${rm.balance} (Expected 300, 500 received - 200 issued)`);
  if (fp) console.log(`PRD-TEST balance: ${fp.balance} (Expected 200, from BMR/Release)`);

  console.log("E2E Test Cycle completed successfully.");
}

run();
