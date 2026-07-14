import { SalesRecord, InventoryItem, InventoryLog, ExpenseRecord, Employee, ActivityLog } from '../types';

// Helper to make Google API requests
async function googleFetch(url: string, accessToken: string, options: RequestInit = {}) {
  const headers = new Headers(options.headers || {});
  headers.set('Authorization', `Bearer ${accessToken}`);
  headers.set('Content-Type', 'application/json');

  const response = await fetch(url, { ...options, headers });
  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Google API Error (${response.status}): ${errText}`);
  }
  return response.json();
}

// Convert sheet rows into array of objects
export function rowsToObjects<T>(rows: any[][]): T[] {
  if (!rows || rows.length <= 1) return [];
  const headers = rows[0];
  return rows.slice(1).map(row => {
    const obj: any = {};
    headers.forEach((header, index) => {
      let val = row[index];
      if (val === 'true') val = true;
      else if (val === 'false') val = false;
      else if (val !== undefined && val !== null && val !== '' && !isNaN(Number(val))) val = Number(val);
      obj[header] = val !== undefined && val !== null ? val : '';
    });
    return obj as T;
  });
}

// Convert array of objects into sheet rows
export function objectsToRows<T extends Record<string, any>>(objects: T[], headers: string[]): any[][] {
  const rows: any[][] = [headers];
  objects.forEach(obj => {
    const row = headers.map(header => {
      const val = obj[header];
      if (val === undefined || val === null) return '';
      return val;
    });
    rows.push(row);
  });
  return rows;
}

// Sheet headers mapping
export const SHEET_HEADERS = {
  Sales: [
    'id', 'date', 'employeeName', 'porkBeforeFry', 'porkAfterFry',
    'previousRemainingStock', 'totalStockAfterFry', 'remainingStockAfterSales',
    'weightSold', 'salesAmount', 'remark', 'fryingYieldPercent',
    'moneyTransfer', 'cash', 'thaiChuayThai', 'lineMan', 'grab',
    'onlineTotal', 'expense', 'autoTotal', 'difference', 'profit', 'timestamp'
  ],
  Inventory: [
    'id', 'product', 'beginningStock', 'receive', 'use', 'remaining', 'unit', 'lowStockThreshold'
  ],
  InventoryLog: [
    'id', 'date', 'product', 'type', 'amount', 'employeeName', 'remark', 'timestamp'
  ],
  Expenses: [
    'id', 'date', 'category', 'amount', 'employeeName', 'remark', 'timestamp'
  ],
  Employees: [
    'id', 'name', 'role', 'targetSales', 'active'
  ],
  ActivityLog: [
    'id', 'timestamp', 'userEmail', 'userName', 'action', 'details'
  ],
  WeeklyAudits: [
    'id', 'auditDate', 'weekRange', 'auditorName', 'items', 'remark', 'timestamp'
  ],
  MonthlyAudits: [
    'id', 'auditMonth', 'auditorName', 'items', 'rolloverProcessed', 'remark', 'timestamp'
  ]
};

// Find or Create Google Sheet Database
export async function getOrCreateSpreadsheet(accessToken: string): Promise<string> {
  try {
    // 1. Search for the spreadsheet
    const query = encodeURIComponent("name = 'Restaurant Daily Sales & Inventory' and mimeType = 'application/vnd.google-apps.spreadsheet' and trashed = false");
    const searchUrl = `https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name)`;
    const searchResult = await googleFetch(searchUrl, accessToken);

    if (searchResult.files && searchResult.files.length > 0) {
      console.log('Found existing spreadsheet:', searchResult.files[0].id);
      return searchResult.files[0].id;
    }

    // 2. Create a new spreadsheet if not found
    console.log('Creating new Restaurant Daily Sales spreadsheet...');
    const createUrl = 'https://sheets.googleapis.com/v4/spreadsheets';
    const requestBody = {
      properties: {
        title: 'Restaurant Daily Sales & Inventory'
      },
      sheets: Object.keys(SHEET_HEADERS).map(sheetName => ({
        properties: {
          title: sheetName
        }
      }))
    };

    const newSheet = await googleFetch(createUrl, accessToken, {
      method: 'POST',
      body: JSON.stringify(requestBody)
    });

    const spreadsheetId = newSheet.spreadsheetId;

    // 3. Populate headers for each sheet tab
    console.log('Initializing spreadsheet headers...');
    for (const [sheetName, headers] of Object.entries(SHEET_HEADERS)) {
      const updateUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${sheetName}!A1?valueInputOption=USER_ENTERED`;
      await googleFetch(updateUrl, accessToken, {
        method: 'PUT',
        body: JSON.stringify({
          values: [headers]
        })
      });
    }

    // 4. Populate default inventory products
    console.log('Adding default inventory products...');
    const defaultInventory: InventoryItem[] = [
      { id: 'p1', product: 'หมูกรอบ', beginningStock: 45, receive: 0, use: 0, remaining: 45, unit: 'กก.', lowStockThreshold: 10 },
      { id: 'p2', product: 'ซอสกะเพราขวดเล็ก', beginningStock: 60, receive: 0, use: 0, remaining: 60, unit: 'ขวด', lowStockThreshold: 15 },
      { id: 'p3', product: 'ถ้วยคราฟท์เล็ก', beginningStock: 200, receive: 0, use: 0, remaining: 200, unit: 'ใบ', lowStockThreshold: 50 },
      { id: 'p4', product: 'ซอสกะเพรา (แกลลอน)', beginningStock: 12, receive: 0, use: 0, remaining: 12, unit: 'แกลลอน', lowStockThreshold: 3 },
      { id: 'p5', product: 'หมูเด้ง', beginningStock: 30, receive: 0, use: 0, remaining: 30, unit: 'กก.', lowStockThreshold: 8 },
      { id: 'p6', product: 'ซอสกะเพราขวดใหญ่', beginningStock: 40, receive: 0, use: 0, remaining: 40, unit: 'ขวด', lowStockThreshold: 10 },
      { id: 'p7', product: 'ถ้วยคราฟท์ใหญ่', beginningStock: 150, receive: 0, use: 0, remaining: 150, unit: 'ใบ', lowStockThreshold: 40 },
      { id: 'p8', product: 'ซอสพริกแกง (แกลลอน)', beginningStock: 8, receive: 0, use: 0, remaining: 8, unit: 'แกลลอน', lowStockThreshold: 2 },
      { id: 'p9', product: 'อกไก่', beginningStock: 25, receive: 0, use: 0, remaining: 25, unit: 'กก.', lowStockThreshold: 6 },
      { id: 'p10', product: 'น้ำดื่ม', beginningStock: 120, receive: 0, use: 0, remaining: 120, unit: 'ขวด', lowStockThreshold: 30 },
      { id: 'p11', product: 'ช้อน', beginningStock: 50, receive: 0, use: 0, remaining: 50, unit: 'แพ็ค', lowStockThreshold: 10 },
      { id: 'p12', product: 'ซอสพริกเผา (แกลลอน)', beginningStock: 6, receive: 0, use: 0, remaining: 6, unit: 'แกลลอน', lowStockThreshold: 2 },
      { id: 'p13', product: 'หมูชิ้น', beginningStock: 35, receive: 0, use: 0, remaining: 35, unit: 'กก.', lowStockThreshold: 10 },
      { id: 'p14', product: 'แป๊บซี่', beginningStock: 96, receive: 0, use: 0, remaining: 96, unit: 'ขวด', lowStockThreshold: 24 },
      { id: 'p15', product: 'กล่องใสเล็ก', beginningStock: 80, receive: 0, use: 0, remaining: 80, unit: 'แพ็ค', lowStockThreshold: 15 },
      { id: 'p16', product: 'ซอสผัด (แกลลอน)', beginningStock: 10, receive: 0, use: 0, remaining: 10, unit: 'แกลลอน', lowStockThreshold: 3 },
      { id: 'p17', product: 'หมูสับ', beginningStock: 40, receive: 0, use: 0, remaining: 40, unit: 'กก.', lowStockThreshold: 10 },
      { id: 'p18', product: 'น้ำส้ม', beginningStock: 48, receive: 0, use: 0, remaining: 48, unit: 'ขวด', lowStockThreshold: 12 },
      { id: 'p19', product: 'กล่องใสใหญ่', beginningStock: 80, receive: 0, use: 0, remaining: 80, unit: 'ใบ', lowStockThreshold: 15 },
      { id: 'p20', product: 'ซอสคลุก', beginningStock: 24, receive: 0, use: 0, remaining: 24, unit: 'ขวด', lowStockThreshold: 6 },
      { id: 'p21', product: 'หมูตุ๋น', beginningStock: 20, receive: 0, use: 0, remaining: 20, unit: 'กก.', lowStockThreshold: 5 },
      { id: 'p22', product: 'น้ำแดง', beginningStock: 60, receive: 0, use: 0, remaining: 60, unit: 'ขวด', lowStockThreshold: 12 },
      { id: 'p23', product: 'กล่อง Pizza', beginningStock: 100, receive: 0, use: 0, remaining: 100, unit: 'แพ็ค', lowStockThreshold: 20 },
      { id: 'p24', product: 'น้ำจิ้มซีฟู๊ด', beginningStock: 30, receive: 0, use: 0, remaining: 30, unit: 'ขวด', lowStockThreshold: 8 },
      { id: 'p25', product: 'ลูกชิ้น', beginningStock: 25, receive: 0, use: 0, remaining: 25, unit: 'กก.', lowStockThreshold: 8 },
      { id: 'p26', product: 'น้ำเขียว', beginningStock: 60, receive: 0, use: 0, remaining: 60, unit: 'ขวด', lowStockThreshold: 12 },
      { id: 'p27', product: 'ไม้จิ้ม', beginningStock: 40, receive: 0, use: 0, remaining: 40, unit: 'แพ็ค', lowStockThreshold: 10 },
      { id: 'p28', product: 'น้ำจิ้มพริกเผา', beginningStock: 20, receive: 0, use: 0, remaining: 20, unit: 'ขวด', lowStockThreshold: 5 },
      { id: 'p29', product: 'น่องไก่', beginningStock: 30, receive: 0, use: 0, remaining: 30, unit: 'กก.', lowStockThreshold: 8 },
      { id: 'p30', product: 'หมี่เหลือง', beginningStock: 15, receive: 0, use: 0, remaining: 15, unit: 'ถุง', lowStockThreshold: 4 },
      { id: 'p31', product: 'ถ้วยน้ำจิ้ม', beginningStock: 50, receive: 0, use: 0, remaining: 50, unit: 'แพ็ค', lowStockThreshold: 10 },
      { id: 'p32', product: 'น้ำจิ้มหวาน (ถัง)', beginningStock: 5, receive: 0, use: 0, remaining: 5, unit: 'ถัง', lowStockThreshold: 1 },
      { id: 'p33', product: 'ตีนไก่', beginningStock: 15, receive: 0, use: 0, remaining: 15, unit: 'กก.', lowStockThreshold: 4 },
      { id: 'p34', product: 'หมี่ขาว', beginningStock: 15, receive: 0, use: 0, remaining: 15, unit: 'ถุง', lowStockThreshold: 4 },
      { id: 'p35', product: 'ถุง pizza', beginningStock: 100, receive: 0, use: 0, remaining: 100, unit: 'แพ็ค', lowStockThreshold: 20 },
      { id: 'p36', product: 'น้ำสต็อกก๋วยเตี๋ยว', beginningStock: 10, receive: 0, use: 0, remaining: 10, unit: 'แกลลอน', lowStockThreshold: 3 },
      { id: 'p37', product: 'เส้นเล็ก', beginningStock: 20, receive: 0, use: 0, remaining: 20, unit: 'ถุง', lowStockThreshold: 5 },
      { id: 'p38', product: 'ถุง 9*18', beginningStock: 30, receive: 0, use: 0, remaining: 30, unit: 'แพ็ค', lowStockThreshold: 8 },
      { id: 'p39', product: 'เครื่องตุ๋นใหญ่', beginningStock: 12, receive: 0, use: 0, remaining: 12, unit: 'อัน', lowStockThreshold: 3 },
      { id: 'p40', product: 'มาม่า', beginningStock: 10, receive: 0, use: 0, remaining: 10, unit: 'แพ็ค', lowStockThreshold: 3 },
      { id: 'p41', product: 'ถุง 7*15', beginningStock: 30, receive: 0, use: 0, remaining: 30, unit: 'แพ็ค', lowStockThreshold: 8 },
      { id: 'p42', product: 'เครื่องตุ๋นเล็ก', beginningStock: 12, receive: 0, use: 0, remaining: 12, unit: 'อัน', lowStockThreshold: 3 },
      { id: 'p43', product: 'ข้าวสาร', beginningStock: 100, receive: 0, use: 0, remaining: 100, unit: 'กก.', lowStockThreshold: 20 },
      { id: 'p44', product: 'ถุงมือ', beginningStock: 20, receive: 0, use: 0, remaining: 20, unit: 'แพ็ค', lowStockThreshold: 5 },
      { id: 'p45', product: 'ไข่ไก่', beginningStock: 300, receive: 0, use: 0, remaining: 300, unit: 'ฟอง', lowStockThreshold: 90 },
      { id: 'p46', product: 'ถุงขยะ', beginningStock: 25, receive: 0, use: 0, remaining: 25, unit: 'แพ็ค', lowStockThreshold: 6 },
      { id: 'p47', product: 'ไข่เค็ม', beginningStock: 150, receive: 0, use: 0, remaining: 150, unit: 'ฟอง', lowStockThreshold: 45 },
      { id: 'p48', product: 'กระดาษปริ้น', beginningStock: 15, receive: 0, use: 0, remaining: 15, unit: 'แพ็ค', lowStockThreshold: 4 },
      { id: 'p49', product: 'หมูเด้งแพ็ค', beginningStock: 20, receive: 0, use: 0, remaining: 20, unit: 'ถุง', lowStockThreshold: 5 }
    ];

    const inventoryRows = objectsToRows(defaultInventory, SHEET_HEADERS.Inventory);
    const invUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Inventory!A1?valueInputOption=USER_ENTERED`;
    await googleFetch(invUrl, accessToken, {
      method: 'PUT',
      body: JSON.stringify({ values: inventoryRows })
    });

    // 5. Populate default employees list
    console.log('Adding default employees...');
    const defaultEmployees: Employee[] = [
      { id: 'e1', name: 'John Doe', role: 'Admin', targetSales: 150000, active: true },
      { id: 'e2', name: 'Jane Smith', role: 'Manager', targetSales: 120000, active: true },
      { id: 'e3', name: 'Somchai Jaidee', role: 'Employee', targetSales: 80000, active: true },
      { id: 'e4', name: 'Anong Srisai', role: 'Employee', targetSales: 80000, active: true }
    ];
    const employeeRows = objectsToRows(defaultEmployees, SHEET_HEADERS.Employees);
    const empUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Employees!A1?valueInputOption=USER_ENTERED`;
    await googleFetch(empUrl, accessToken, {
      method: 'PUT',
      body: JSON.stringify({ values: employeeRows })
    });

    return spreadsheetId;
  } catch (error) {
    console.error('getOrCreateSpreadsheet error:', error);
    throw error;
  }
}

// Fetch general sheet values
export async function fetchSheetValues<T>(accessToken: string, spreadsheetId: string, sheetName: string): Promise<T[]> {
  try {
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${sheetName}!A1:Z5000`;
    const response = await googleFetch(url, accessToken);
    return rowsToObjects<T>(response.values);
  } catch (error) {
    console.error(`Error fetching sheet ${sheetName}:`, error);
    throw error;
  }
}

// Append a record to a sheet
export async function appendSheetRecord<T extends Record<string, any>>(
  accessToken: string,
  spreadsheetId: string,
  sheetName: string,
  record: T,
  headers: string[]
): Promise<any> {
  try {
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${sheetName}!A1:append?valueInputOption=USER_ENTERED`;
    const rows = objectsToRows([record], headers);
    // Remove the headers row for appends
    const dataRow = rows[1];
    return await googleFetch(url, accessToken, {
      method: 'POST',
      body: JSON.stringify({ values: [dataRow] })
    });
  } catch (error) {
    console.error(`Error appending to sheet ${sheetName}:`, error);
    throw error;
  }
}

// Rewrite entire sheet values (for updates/deletes)
export async function updateSheetValues<T extends Record<string, any>>(
  accessToken: string,
  spreadsheetId: string,
  sheetName: string,
  records: T[],
  headers: string[]
): Promise<any> {
  try {
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${sheetName}!A1?valueInputOption=USER_ENTERED`;
    const rows = objectsToRows(records, headers);
    return await googleFetch(url, accessToken, {
      method: 'PUT',
      body: JSON.stringify({ values: rows })
    });
  } catch (error) {
    console.error(`Error updating sheet ${sheetName}:`, error);
    throw error;
  }
}

const PRODUCT_NAMES_TH: Record<string, string> = {
  'Crispy Pork': 'หมูกรอบ',
  'Raw Pork': 'หมูดิบ',
  'Rice': 'ข้าวสาร',
  'Cooking Oil': 'น้ำมันพืช',
  'Packaging Box': 'กล่องบรรจุภัณฑ์',
  'Soft Drinks': 'เครื่องดื่ม'
};

// Export monthly summary to Google Sheets
export async function exportMonthlySummaryToSheets(
  accessToken: string,
  spreadsheetId: string,
  monthStr: string,
  metrics: {
    totalSales: number;
    totalProfit: number;
    totalExpense: number;
    totalPorkSold: number;
    avgYield: number;
    cash: number;
    transfer: number;
    thaiChuayThai: number;
    lineMan: number;
    grab: number;
  },
  records: SalesRecord[],
  inventoryItems?: InventoryItem[]
): Promise<string> {
  try {
    const sheetTitle = `สรุปรายเดือน - ${monthStr}`;

    // 1. Fetch spreadsheet to check if the tab already exists
    const getUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?fields=sheets.properties`;
    const spreadsheet = await googleFetch(getUrl, accessToken);
    const sheetTitles = spreadsheet.sheets?.map((s: any) => s.properties.title) || [];

    // 2. Create sheet if not exists
    if (!sheetTitles.includes(sheetTitle)) {
      const batchUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`;
      await googleFetch(batchUrl, accessToken, {
        method: 'POST',
        body: JSON.stringify({
          requests: [
            {
              addSheet: {
                properties: {
                  title: sheetTitle
                }
              }
            }
          ]
        })
      });
    }

    // 3. Prepare cells
    const rows: any[][] = [
      ['รายงานสรุปการขายรายเดือน - แก้มไทย'],
      ['ประจำเดือน', monthStr],
      [],
      ['สรุปภาพรวมทางการเงินและการขาย'],
      ['ยอดขายรวม', metrics.totalSales, 'บาท'],
      ['กำไรสุทธิ', metrics.totalProfit, 'บาท'],
      ['รายจ่ายย่อย', metrics.totalExpense, 'บาท'],
      ['น้ำหนักหมูที่ขายรวม', metrics.totalPorkSold, 'กก.'],
      ['อัตราผลผลิตเฉลี่ย', metrics.avgYield, '%'],
      [],
      ['สรุปรายได้แยกตามช่องทางชำระเงิน'],
      ['เงินสดในลิ้นชัก', metrics.cash, 'บาท'],
      ['เงินโอนผ่าน QR', metrics.transfer, 'บาท'],
      ['ไทยช่วยไทย', metrics.thaiChuayThai, 'บาท'],
      ['LINE MAN', metrics.lineMan, 'บาท'],
      ['Grab Food', metrics.grab, 'บาท'],
      []
    ];

    // Add inventory summary if provided
    if (inventoryItems && inventoryItems.length > 0) {
      rows.push(['สรุปความเคลื่อนไหวคลังสินค้าวัตถุดิบและของแห้ง']);
      rows.push(['รายการวัตถุดิบ / สินค้า', 'ยอดยกมาต้นเดือน', 'ยอดรับเข้าสะสม (+)', 'ยอดเบิกใช้สะสม (-)', 'ยอดคงเหลือจริงในคลัง', 'หน่วยนับ']);
      inventoryItems.forEach(item => {
        const thaiName = PRODUCT_NAMES_TH[item.product] || item.product;
        rows.push([
          thaiName,
          item.beginningStock,
          item.receive,
          item.use,
          item.remaining,
          item.unit
        ]);
      });
      rows.push([]);
    }

    rows.push(
      ['ตารางบันทึกการขายรายวัน'],
      [
        'วันที่', 'พนักงานผู้ปิดกะ', 'หมูดิบ (กก.)', 'หมูทอด (กก.)', 'หมูที่ขายได้ (กก.)',
        'ยอดขายรวม (บาท)', 'เงินสด (บาท)', 'เงินโอน (บาท)', 'ไทยช่วยไทย (บาท)', 'LINE MAN (บาท)', 'Grab (บาท)',
        'รายจ่ายย่อย (บาท)', 'อัตราผลผลิต %', 'ยอดต่างลิ้นชัก (บาท)', 'กำไรประเมิน (บาท)', 'หมายเหตุ'
      ]
    );

    // Append day-by-day records
    records.forEach(r => {
      rows.push([
        r.date,
        r.employeeName,
        r.porkBeforeFry,
        r.porkAfterFry,
        r.weightSold,
        r.salesAmount,
        r.cash,
        r.moneyTransfer,
        r.thaiChuayThai,
        r.lineMan,
        r.grab,
        r.expense,
        r.fryingYieldPercent,
        r.difference,
        r.profit,
        r.remark
      ]);
    });

    // 4. Write all to the sheet
    const updateUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/'${sheetTitle}'!A1?valueInputOption=USER_ENTERED`;
    await googleFetch(updateUrl, accessToken, {
      method: 'PUT',
      body: JSON.stringify({ values: rows })
    });

    return sheetTitle;
  } catch (error) {
    console.error('Error exporting monthly summary:', error);
    throw error;
  }
}

