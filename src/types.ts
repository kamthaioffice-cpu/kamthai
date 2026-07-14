export type UserRole = 'Admin' | 'Manager' | 'AssistantManager' | 'ShiftLeader' | 'AssistantShiftLeader' | 'Employee';

export interface UserProfile {
  email: string;
  role: UserRole;
  name: string;
}

export interface SalesRecord {
  id: string;
  date: string; // YYYY-MM-DD
  employeeName: string;
  porkBeforeFry: number; // kg
  porkAfterFry: number; // kg
  previousRemainingStock: number; // kg
  totalStockAfterFry: number; // kg (porkAfterFry + previousRemainingStock)
  remainingStockAfterSales: number; // kg (physical count)
  weightSold: number; // kg (totalStockAfterFry - remainingStockAfterSales)
  salesAmount: number; // THB
  remark: string;
  fryingYieldPercent: number; // % ((porkAfterFry / porkBeforeFry) * 100)
  moneyTransfer: number; // THB
  cash: number; // THB
  thaiChuayThai: number; // THB
  lineMan: number; // THB
  grab: number; // THB
  onlineTotal: number; // THB (moneyTransfer + lineMan + grab)
  expense: number; // Daily petty expenses (THB)
  autoTotal: number; // THB (cash + moneyTransfer + thaiChuayThai + lineMan + grab - expense)
  difference: number; // THB (autoTotal - salesAmount)
  profit: number; // THB (salesAmount - expense - COGS estimate)
  timestamp: string;
  withdrawals?: { product: string; amount: number; }[];
  shiftExpensesDetail?: { description: string; amount: number; }[];
  promoDiscounts?: { description: string; amount: number; }[];
}

export interface InventoryItem {
  id: string;
  product: string;
  beginningStock: number;
  receive: number;
  use: number;
  remaining: number;
  unit: string;
  lowStockThreshold: number;
}

export interface InventoryLog {
  id: string;
  date: string;
  product: string;
  type: 'Beginning' | 'Receive' | 'Use';
  amount: number;
  employeeName: string;
  remark?: string;
  timestamp: string;
}

export interface ExpenseRecord {
  id: string;
  date: string;
  category: 'Oil' | 'Gas' | 'Packaging' | 'Vegetables' | 'Salary' | 'Electricity' | 'Water' | 'Other';
  amount: number;
  employeeName: string;
  remark?: string;
  timestamp: string;
}

export interface Employee {
  id: string;
  name: string;
  role: UserRole;
  targetSales: number; // Monthly target (THB)
  active: boolean;
}

export interface ActivityLog {
  id: string;
  timestamp: string;
  userEmail: string;
  userName: string;
  action: string;
  details: string;
}

export interface AppNotification {
  id: string;
  type: 'low_stock' | 'high_expense' | 'negative_diff' | 'target_achieved' | 'info';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
}

export interface WeeklyAuditItem {
  product: string;
  systemStock: number;
  physicalStock: number;
  difference: number;
}

export interface WeeklyAudit {
  id: string;
  auditDate: string; // YYYY-MM-DD
  weekRange: string; // e.g. "2026-W28"
  auditorName: string; // รองผู้จัดการ
  items: WeeklyAuditItem[];
  remark?: string;
  timestamp: string;
}

export interface MonthlyAuditItem {
  product: string;
  beginningStock: number;
  receive: number;
  use: number;
  systemStock: number;
  physicalStock: number;
  difference: number;
  actualMonthlyUsage: number;
}

export interface MonthlyAudit {
  id: string;
  auditMonth: string; // YYYY-MM
  auditorName: string; // ผู้จัดการร้าน
  items: MonthlyAuditItem[];
  rolloverProcessed: boolean;
  remark?: string;
  timestamp: string;
}

export const getRoleTh = (role: string): string => {
  switch (role) {
    case 'Admin': return 'ผู้ดูแลระบบ';
    case 'Manager': return 'ผู้จัดการร้าน';
    case 'AssistantManager': return 'รองผู้จัดการร้าน';
    case 'ShiftLeader': return 'หัวหน้ากะ';
    case 'AssistantShiftLeader': return 'รองหัวหน้ากะ';
    case 'Employee': return 'พนักงานทั่วไป';
    default: return role;
  }
};
