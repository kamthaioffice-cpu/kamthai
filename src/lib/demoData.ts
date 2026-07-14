import { SalesRecord, InventoryItem, InventoryLog, ExpenseRecord, Employee, ActivityLog } from '../types';

export function generateDemoData() {
  const employees: Employee[] = [
    { id: 'e1', name: 'ป่าน', role: 'Manager', targetSales: 120000, active: true },
    { id: 'e2', name: 'เบนซ์', role: 'AssistantManager', targetSales: 100000, active: true },
    { id: 'e3', name: 'บีม', role: 'ShiftLeader', targetSales: 80000, active: true },
    { id: 'e4', name: 'เจมส์', role: 'ShiftLeader', targetSales: 80000, active: true }
  ];

  const inventory: InventoryItem[] = [
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

  const sales: SalesRecord[] = [];
  const expenses: ExpenseRecord[] = [];
  const inventoryLogs: InventoryLog[] = [];
  const activityLogs: ActivityLog[] = [];

  // Generate 30 days of historical data
  const today = new Date();

  // Generate some current week inventory usage and receipt history logs
  inventory.forEach(inv => {
    // Generate receive logs
    inventoryLogs.push({
      id: `invl-rec-${inv.id}`,
      date: new Date(today.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      product: inv.product,
      type: 'Receive',
      amount: Math.round(inv.beginningStock * 0.4),
      employeeName: 'Jane Smith',
      remark: 'Weekly stock restock',
      timestamp: new Date(today.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString()
    });

    // Generate use logs
    inventoryLogs.push({
      id: `invl-use-${inv.id}`,
      date: new Date(today.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      product: inv.product,
      type: 'Use',
      amount: Math.round(inv.beginningStock * 0.15),
      employeeName: 'Somchai Jaidee',
      remark: 'Daily restaurant operations use',
      timestamp: new Date(today.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString()
    });
    
    // Set actual remaining based on logs
    const recSum = Math.round(inv.beginningStock * 0.4);
    const useSum = Math.round(inv.beginningStock * 0.15);
    inv.receive = recSum;
    inv.use = useSum;
    inv.remaining = inv.beginningStock + recSum - useSum;
  });

  return {
    employees,
    inventory,
    sales,
    expenses,
    inventoryLogs,
    activityLogs
  };
}
