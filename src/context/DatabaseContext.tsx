import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { 
  initAuth, googleSignIn, logout, getAccessToken, getUserProfile 
} from '../lib/firebase';
import { 
  getOrCreateSpreadsheet, fetchSheetValues, appendSheetRecord, updateSheetValues, exportMonthlySummaryToSheets, SHEET_HEADERS 
} from '../lib/sheets';
import { generateDemoData } from '../lib/demoData';
import { 
  SalesRecord, InventoryItem, InventoryLog, ExpenseRecord, Employee, ActivityLog, AppNotification, UserProfile, WeeklyAudit, MonthlyAudit 
} from '../types';

interface DatabaseContextType {
  user: User | null;
  profile: UserProfile | null;
  isGoogleLinked: boolean;
  spreadsheetId: string | null;
  loading: boolean;
  syncing: boolean;
  salesRecords: SalesRecord[];
  inventory: InventoryItem[];
  inventoryLogs: InventoryLog[];
  expenses: ExpenseRecord[];
  employees: Employee[];
  activityLogs: ActivityLog[];
  notifications: AppNotification[];
  weeklyAudits: WeeklyAudit[];
  monthlyAudits: MonthlyAudit[];
  loginWithGoogle: () => Promise<void>;
  unlinkGoogle: () => Promise<void>;
  addSalesRecord: (record: Omit<SalesRecord, 'id' | 'timestamp' | 'totalStockAfterFry' | 'weightSold' | 'fryingYieldPercent' | 'onlineTotal' | 'autoTotal' | 'difference' | 'profit'>) => Promise<void>;
  addInventoryTransaction: (product: string, type: 'Beginning' | 'Receive' | 'Use', amount: number, remark?: string) => Promise<void>;
  updateInventoryThreshold: (product: string, threshold: number) => Promise<void>;
  addExpense: (expense: Omit<ExpenseRecord, 'id' | 'timestamp'>) => Promise<void>;
  addEmployee: (employee: Omit<Employee, 'id'>) => Promise<void>;
  updateEmployee: (employee: Employee) => Promise<void>;
  deleteEmployee: (id: string) => Promise<void>;
  markNotificationRead: (id: string) => void;
  clearAllNotifications: () => void;
  refreshData: () => Promise<void>;
  addWeeklyAudit: (audit: Omit<WeeklyAudit, 'id' | 'timestamp'>) => Promise<void>;
  addMonthlyAudit: (audit: Omit<MonthlyAudit, 'id' | 'timestamp'>, shouldRollover: boolean) => Promise<void>;
  exportMonthlySummary: (
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
    records: SalesRecord[]
  ) => Promise<string>;
}

const DatabaseContext = createContext<DatabaseContextType | undefined>(undefined);

export const useDatabase = () => {
  const context = useContext(DatabaseContext);
  if (!context) throw new Error('useDatabase must be used within a DatabaseProvider');
  return context;
};

export const DatabaseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isGoogleLinked, setIsGoogleLinked] = useState<boolean>(false);
  const [spreadsheetId, setSpreadsheetId] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [syncing, setSyncing] = useState<boolean>(false);

  // Core tables state
  const [salesRecords, setSalesRecords] = useState<SalesRecord[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [inventoryLogs, setInventoryLogs] = useState<InventoryLog[]>([]);
  const [expenses, setExpenses] = useState<ExpenseRecord[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [weeklyAudits, setWeeklyAudits] = useState<WeeklyAudit[]>([]);
  const [monthlyAudits, setMonthlyAudits] = useState<MonthlyAudit[]>([]);

  // 1. Initial State: Load Auth state and fallback to LocalStorage
  useEffect(() => {
    // Synchronize authentication
    const unsubscribe = initAuth(
      async (firebaseUser, token, userProfile) => {
        setUser(firebaseUser);
        setProfile(userProfile);
        setIsGoogleLinked(true);
        try {
          setSyncing(true);
          const sheetId = await getOrCreateSpreadsheet(token);
          setSpreadsheetId(sheetId);
          await loadGoogleData(token, sheetId);
        } catch (error) {
          console.error('Failed to link Google Sheet database, falling back to local cache:', error);
          loadLocalData();
        } finally {
          setSyncing(false);
          setLoading(false);
        }
      },
      () => {
        // Not logged in, load Local Storage
        setUser(null);
        setProfile({ email: 'demo@restaurant.com', role: 'Admin', name: 'Demo Admin' });
        setIsGoogleLinked(false);
        setSpreadsheetId(null);
        loadLocalData();
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // 2. Load Local Data from LocalStorage (or populate with realistic demo data if empty)
  const loadLocalData = () => {
    const cachedSales = localStorage.getItem('r_sales');
    const cachedInventory = localStorage.getItem('r_inventory');
    const cachedInvLogs = localStorage.getItem('r_inv_logs');
    const cachedExpenses = localStorage.getItem('r_expenses');
    const cachedEmployees = localStorage.getItem('r_employees');
    const cachedActivity = localStorage.getItem('r_activity');
    const cachedNotifications = localStorage.getItem('r_notifications');

    if (cachedSales && cachedInventory) {
      const parsedInv = JSON.parse(cachedInventory);
      if (parsedInv.length < 20 || parsedInv.some((item: any) => item.product === 'Crispy Pork')) {
        console.log("Migrating inventory to the new 49 Thai products...");
        const demo = generateDemoData();
        setSalesRecords(demo.sales);
        setInventory(demo.inventory);
        setInventoryLogs(demo.inventoryLogs);
        setExpenses(demo.expenses);
        setEmployees(demo.employees);
        setActivityLogs(demo.activityLogs);
        setNotifications(JSON.parse(cachedNotifications || '[]'));
        
        saveAllToLocal(
          demo.sales,
          demo.inventory,
          demo.inventoryLogs,
          demo.expenses,
          demo.employees,
          demo.activityLogs,
          JSON.parse(cachedNotifications || '[]')
        );
      } else {
        const parsedSales = JSON.parse(cachedSales);
        const filteredSales = parsedSales.filter((r: any) => !r.id.toString().startsWith('s-'));
        setSalesRecords(filteredSales);
        localStorage.setItem('r_sales', JSON.stringify(filteredSales));

        setInventory(parsedInv);
        setInventoryLogs(JSON.parse(cachedInvLogs || '[]'));

        const parsedExpenses = JSON.parse(cachedExpenses || '[]');
        const filteredExpenses = parsedExpenses.filter((e: any) => !e.id.toString().startsWith('exp-'));
        setExpenses(filteredExpenses);
        localStorage.setItem('r_expenses', JSON.stringify(filteredExpenses));
        
        const loadedEmps = JSON.parse(cachedEmployees || '[]');
        if (!loadedEmps || loadedEmps.length === 0 || loadedEmps.some((e: any) => e.name === 'John Doe' || e.name === 'Jane Smith')) {
          console.log("Migrating employee list to new Thai employee names...");
          const demo = generateDemoData();
          setEmployees(demo.employees);
          localStorage.setItem('r_employees', JSON.stringify(demo.employees));
        } else {
          setEmployees(loadedEmps);
        }

        const parsedActivity = JSON.parse(cachedActivity || '[]');
        const filteredActivity = parsedActivity.filter((a: any) => !a.id.toString().startsWith('act-'));
        setActivityLogs(filteredActivity);
        localStorage.setItem('r_activity', JSON.stringify(filteredActivity));

        setNotifications(JSON.parse(cachedNotifications || '[]'));
        
        const cachedWeekly = localStorage.getItem('r_weekly_audits');
        const cachedMonthly = localStorage.getItem('r_monthly_audits');
        setWeeklyAudits(JSON.parse(cachedWeekly || '[]'));
        setMonthlyAudits(JSON.parse(cachedMonthly || '[]'));
      }
    } else {
      // First run, populate with gorgeous realistic data
      const demo = generateDemoData();
      setSalesRecords(demo.sales);
      setInventory(demo.inventory);
      setInventoryLogs(demo.inventoryLogs);
      setExpenses(demo.expenses);
      setEmployees(demo.employees);
      setActivityLogs(demo.activityLogs);
      setWeeklyAudits([]);
      setMonthlyAudits([]);
      
      // Seed initial notifications
      const initialNotifs: AppNotification[] = [
        {
          id: 'n1',
          type: 'info',
          title: 'Welcome to Daily Sales',
          message: 'Explore the live dashboard! Connect with Google Drive in the sidebar to sync directly with Google Sheets.',
          timestamp: new Date().toISOString(),
          read: false
        }
      ];
      setNotifications(initialNotifs);

      saveAllToLocal(
        demo.sales,
        demo.inventory,
        demo.inventoryLogs,
        demo.expenses,
        demo.employees,
        demo.activityLogs,
        initialNotifs,
        [],
        []
      );
    }
  };

  // 3. Load Data from Google Sheets
  const loadGoogleData = async (token: string, sheetId: string) => {
    try {
      const [salesData, invData, invLogsData, expData, empData, actData] = await Promise.all([
        fetchSheetValues<SalesRecord>(token, sheetId, 'Sales'),
        fetchSheetValues<InventoryItem>(token, sheetId, 'Inventory'),
        fetchSheetValues<InventoryLog>(token, sheetId, 'InventoryLog'),
        fetchSheetValues<ExpenseRecord>(token, sheetId, 'Expenses'),
        fetchSheetValues<Employee>(token, sheetId, 'Employees'),
        fetchSheetValues<ActivityLog>(token, sheetId, 'ActivityLog')
      ]);

      setSalesRecords(salesData);
      setInventory(invData);
      setInventoryLogs(invLogsData);
      setExpenses(expData);
      setEmployees(empData);
      setActivityLogs(actData);

      // Safe fetch for Weekly and Monthly Audits
      let weeklyData: WeeklyAudit[] = [];
      try {
        const rawWeekly = await fetchSheetValues<any>(token, sheetId, 'WeeklyAudits');
        weeklyData = rawWeekly.map((w: any) => ({
          ...w,
          items: typeof w.items === 'string' ? JSON.parse(w.items) : (w.items || [])
        }));
      } catch (err) {
        console.warn('WeeklyAudits sheet tab not available or empty yet:', err);
      }
      setWeeklyAudits(weeklyData);

      let monthlyData: MonthlyAudit[] = [];
      try {
        const rawMonthly = await fetchSheetValues<any>(token, sheetId, 'MonthlyAudits');
        monthlyData = rawMonthly.map((m: any) => ({
          ...m,
          rolloverProcessed: m.rolloverProcessed === 'true' || m.rolloverProcessed === true,
          items: typeof m.items === 'string' ? JSON.parse(m.items) : (m.items || [])
        }));
      } catch (err) {
        console.warn('MonthlyAudits sheet tab not available or empty yet:', err);
      }
      setMonthlyAudits(monthlyData);

      // Trigger safety notifications scan
      runSafetyChecks(invData, expData, salesData);

      // Keep local storage as a robust offline cache
      saveAllToLocal(salesData, invData, invLogsData, expData, empData, actData, notifications, weeklyData, monthlyData);
    } catch (error) {
      console.error('Error fetching Google Sheet values:', error);
      throw error;
    }
  };

  // 4. Save to Local Cache Helper
  const saveAllToLocal = (
    sales: SalesRecord[],
    inv: InventoryItem[],
    invLogs: InventoryLog[],
    exp: ExpenseRecord[],
    emp: Employee[],
    act: ActivityLog[],
    notifs: AppNotification[],
    weekly: WeeklyAudit[] = weeklyAudits,
    monthly: MonthlyAudit[] = monthlyAudits
  ) => {
    localStorage.setItem('r_sales', JSON.stringify(sales));
    localStorage.setItem('r_inventory', JSON.stringify(inv));
    localStorage.setItem('r_inv_logs', JSON.stringify(invLogs));
    localStorage.setItem('r_expenses', JSON.stringify(exp));
    localStorage.setItem('r_employees', JSON.stringify(emp));
    localStorage.setItem('r_activity', JSON.stringify(act));
    localStorage.setItem('r_notifications', JSON.stringify(notifs));
    localStorage.setItem('r_weekly_audits', JSON.stringify(weekly));
    localStorage.setItem('r_monthly_audits', JSON.stringify(monthly));
  };

  // 5. Auth Action Methods
  const loginWithGoogle = async () => {
    setSyncing(true);
    try {
      const result = await googleSignIn();
      if (result) {
        setUser(result.user);
        setProfile(result.profile);
        setIsGoogleLinked(true);
        const sheetId = await getOrCreateSpreadsheet(result.accessToken);
        setSpreadsheetId(sheetId);
        await loadGoogleData(result.accessToken, sheetId);
        
        // Log activity
        await addActivityLogAction(
          result.profile.email, 
          result.profile.name, 
          'Link Google Sheets', 
          'Linked application to Google Drive database successfully.'
        );
      }
    } catch (error) {
      console.error('Google link failed:', error);
      throw error;
    } finally {
      setSyncing(false);
    }
  };

  const unlinkGoogle = async () => {
    setSyncing(true);
    try {
      const email = profile?.email || 'User';
      const name = profile?.name || 'User';
      await logout();
      setUser(null);
      setProfile({ email: 'demo@restaurant.com', role: 'Admin', name: 'Demo Admin' });
      setIsGoogleLinked(false);
      setSpreadsheetId(null);
      
      // Load from local storage
      loadLocalData();

      // Log activity in offline local storage
      await addActivityLogAction(
        email, 
        name, 
        'Unlink Google Sheets', 
        'Unlinked Google Account and switched back to offline cache.'
      );
    } catch (error) {
      console.error('Google unlink failed:', error);
    } finally {
      setSyncing(false);
    }
  };

  // 6. Refresh Data Action
  const refreshData = async () => {
    if (!isGoogleLinked || !spreadsheetId) {
      loadLocalData();
      return;
    }
    setSyncing(true);
    try {
      const token = await getAccessToken();
      if (token) {
        await loadGoogleData(token, spreadsheetId);
      }
    } catch (error) {
      console.error('Refresh data error:', error);
    } finally {
      setSyncing(false);
    }
  };

  // 7. Safety Notifications Scan Engine
  const runSafetyChecks = (
    inv: InventoryItem[],
    exp: ExpenseRecord[],
    sales: SalesRecord[]
  ) => {
    const newNotifs: AppNotification[] = [...notifications];
    let changed = false;

    // Check 1: Low stock
    inv.forEach(item => {
      if (item.remaining <= item.lowStockThreshold) {
        const id = `low-stock-${item.product}`;
        if (!newNotifs.some(n => n.id === id)) {
          newNotifs.unshift({
            id,
            type: 'low_stock',
            title: 'Low Inventory Alert',
            message: `Product "${item.product}" has only ${item.remaining} ${item.unit} left (Threshold: ${item.lowStockThreshold}).`,
            timestamp: new Date().toISOString(),
            read: false
          });
          changed = true;
        }
      }
    });

    // Check 2: Negative difference
    if (sales.length > 0) {
      const latest = sales[sales.length - 1];
      if (latest.difference < -100) {
        const id = `neg-diff-${latest.date}`;
        if (!newNotifs.some(n => n.id === id)) {
          newNotifs.unshift({
            id,
            type: 'negative_diff',
            title: 'Cash Shortage Warning',
            message: `Discrepancy of ฿${latest.difference.toLocaleString()} detected on ${latest.date}. Received: ฿${latest.autoTotal.toLocaleString()} vs Registered: ฿${latest.salesAmount.toLocaleString()}.`,
            timestamp: new Date().toISOString(),
            read: false
          });
          changed = true;
        }
      }
    }

    if (changed) {
      setNotifications(newNotifs);
      localStorage.setItem('r_notifications', JSON.stringify(newNotifs));
    }
  };

  // Helper to log actions
  const addActivityLogAction = async (email: string, name: string, action: string, details: string) => {
    const newLog: ActivityLog = {
      id: `act-${Date.now()}`,
      timestamp: new Date().toISOString(),
      userEmail: email,
      userName: name,
      action,
      details
    };

    const updatedLogs = [newLog, ...activityLogs].slice(0, 500); // limit local cache
    setActivityLogs(updatedLogs);

    if (isGoogleLinked && spreadsheetId) {
      try {
        const token = await getAccessToken();
        if (token) {
          await appendSheetRecord(token, spreadsheetId, 'ActivityLog', newLog, SHEET_HEADERS.ActivityLog);
        }
      } catch (e) {
        console.error('Google Sheets logging error:', e);
      }
    }
    
    // Save locally
    localStorage.setItem('r_activity', JSON.stringify(updatedLogs));
  };

  // 8. Core Data Mutation Methods

  // A. Create/Save Daily Record Form
  const addSalesRecord = async (form: Omit<SalesRecord, 'id' | 'timestamp' | 'totalStockAfterFry' | 'weightSold' | 'fryingYieldPercent' | 'onlineTotal' | 'autoTotal' | 'difference' | 'profit'>) => {
    setSyncing(true);
    try {
      // Perform automated calculations
      const totalStockAfterFry = Math.round((form.porkAfterFry + form.previousRemainingStock) * 10) / 10;
      const weightSold = Math.round((totalStockAfterFry - form.remainingStockAfterSales) * 10) / 10;
      
      // Frying yield = (pork after fry / pork before fry) * 100
      const fryingYieldPercent = form.porkBeforeFry > 0 
        ? Math.round((form.porkAfterFry / form.porkBeforeFry) * 100 * 10) / 10 
        : 0;
      
      // Online Total = Money Transfer + LINE MAN + Grab
      const onlineTotal = form.moneyTransfer + form.lineMan + form.grab;
      
      // Auto Total = Cash + Money Transfer + Thai Chuay Thai + LINE MAN + Grab
      // Difference = Auto Total - Sales Amount
      const autoTotal = form.cash + form.moneyTransfer + form.thaiChuayThai + form.lineMan + form.grab;
      const difference = autoTotal - form.salesAmount;
      
      // Estimated Profit
      // Pork cost raw: 160 THB/kg. Side expenses, oil, etc is covered in 'expense' and raw cost
      const rawCostOfPork = form.porkBeforeFry * 160;
      const profit = form.salesAmount - form.expense - rawCostOfPork;

      // Check stock levels to prevent negative remaining stock
      if (totalStockAfterFry < form.remainingStockAfterSales) {
        throw new Error('Stock Validation Error: Remaining physical stock cannot exceed total stock after fry!');
      }

      const newRecord: SalesRecord = {
        ...form,
        id: `s-${Date.now()}`,
        totalStockAfterFry,
        weightSold,
        fryingYieldPercent,
        onlineTotal,
        autoTotal,
        difference,
        profit: Math.round(profit),
        timestamp: new Date().toISOString()
      };

      // Update State
      const updatedSales = [...salesRecords, newRecord];
      setSalesRecords(updatedSales);

      // Automated Inventory Deduction for Crispy Pork / หมูกรอบ AND manually withdrawn ingredients!
      const updatedInventory = inventory.map(item => {
        let additionalUse = 0;
        
        if (item.product === 'Crispy Pork' || item.product === 'หมูกรอบ') {
          additionalUse += weightSold;
        }

        // Add any manual withdrawals from shift leader
        const matchedWithdrawal = form.withdrawals?.find(w => w.product === item.product);
        if (matchedWithdrawal) {
          additionalUse += matchedWithdrawal.amount;
        }

        if (additionalUse > 0) {
          const used = Math.round((item.use + additionalUse) * 10) / 10;
          const remaining = Math.max(0, Math.round((item.beginningStock + item.receive - used) * 10) / 10);
          return { ...item, use: used, remaining };
        }
        return item;
      });
      setInventory(updatedInventory);

      // Create inventory use logs
      const newLogs: InventoryLog[] = [];
      
      // 1. Crispy Pork log
      const targetItem = inventory.find(item => item.product === 'Crispy Pork' || item.product === 'หมูกรอบ');
      newLogs.push({
        id: `invl-${Date.now()}-pork`,
        date: form.date,
        product: targetItem?.product || 'หมูกรอบ',
        type: 'Use',
        amount: weightSold,
        employeeName: form.employeeName,
        remark: 'ตัดสต็อกหมูกรอบอัตโนมัติจากบันทึกยอดขาย',
        timestamp: new Date().toISOString()
      });

      // 2. Add manual withdrawals
      if (form.withdrawals && form.withdrawals.length > 0) {
        form.withdrawals.forEach((w, index) => {
          newLogs.push({
            id: `invl-${Date.now()}-w-${index}`,
            date: form.date,
            product: w.product,
            type: 'Use',
            amount: w.amount,
            employeeName: form.employeeName,
            remark: `เบิกใช้ในกะ (หัวหน้ากะ: ${form.employeeName})`,
            timestamp: new Date().toISOString()
          });
        });
      }

      const updatedInvLogs = [...inventoryLogs, ...newLogs];
      setInventoryLogs(updatedInvLogs);

      // Sync with Google Sheets if connected
      if (isGoogleLinked && spreadsheetId) {
        const token = await getAccessToken();
        if (token) {
          // Append sales record
          await appendSheetRecord(token, spreadsheetId, 'Sales', newRecord, SHEET_HEADERS.Sales);
          // Sync modified Inventory table (completely rewrite to stay accurate)
          await updateSheetValues(token, spreadsheetId, 'Inventory', updatedInventory, SHEET_HEADERS.Inventory);
          // Append all inventory logs
          for (const log of newLogs) {
            await appendSheetRecord(token, spreadsheetId, 'InventoryLog', log, SHEET_HEADERS.InventoryLog);
          }
        }
      }

      // Log activity
      await addActivityLogAction(
        profile?.email || 'User',
        profile?.name || 'User',
        'Add Daily Record',
        `Submitted daily sales record for ${form.date}. Total Sales: ฿${form.salesAmount.toLocaleString()}, Pork sold: ${weightSold}kg, Cash difference: ฿${difference}.`
      );

      // Run safety checks to trigger low stock or difference alerts
      runSafetyChecks(updatedInventory, expenses, updatedSales);

      // Save locally
      saveAllToLocal(updatedSales, updatedInventory, updatedInvLogs, expenses, employees, activityLogs, notifications);

    } catch (error: any) {
      console.error('Error adding sales record:', error);
      throw error;
    } finally {
      setSyncing(false);
    }
  };

  // B. Add Inventory Log (Receive, Use, Beginning adjustments)
  const addInventoryTransaction = async (product: string, type: 'Beginning' | 'Receive' | 'Use', amount: number, remark?: string) => {
    setSyncing(true);
    try {
      const todayStr = new Date().toISOString().split('T')[0];
      const newLog: InventoryLog = {
        id: `invl-${Date.now()}`,
        date: todayStr,
        product,
        type,
        amount,
        employeeName: profile?.name || 'Manager',
        remark: remark || `Manual inventory ${type}`,
        timestamp: new Date().toISOString()
      };

      const updatedInventory = inventory.map(item => {
        if (item.product === product) {
          let beginningStock = item.beginningStock;
          let receive = item.receive;
          let use = item.use;

          if (type === 'Beginning') beginningStock = amount;
          else if (type === 'Receive') receive = Math.round((receive + amount) * 10) / 10;
          else if (type === 'Use') use = Math.round((use + amount) * 10) / 10;

          const remaining = Math.max(0, Math.round((beginningStock + receive - use) * 10) / 10);
          return { ...item, beginningStock, receive, use, remaining };
        }
        return item;
      });

      // Stock validation to prevent negative remaining stocks
      const targetItem = updatedInventory.find(item => item.product === product);
      if (targetItem && targetItem.remaining < 0) {
        throw new Error(`Inventory Validation Error: "${product}" remaining stock cannot be negative!`);
      }

      const updatedLogs = [...inventoryLogs, newLog];
      setInventoryLogs(updatedLogs);
      setInventory(updatedInventory);

      // Sync with Google Sheets
      if (isGoogleLinked && spreadsheetId) {
        const token = await getAccessToken();
        if (token) {
          await appendSheetRecord(token, spreadsheetId, 'InventoryLog', newLog, SHEET_HEADERS.InventoryLog);
          await updateSheetValues(token, spreadsheetId, 'Inventory', updatedInventory, SHEET_HEADERS.Inventory);
        }
      }

      // Log activity
      await addActivityLogAction(
        profile?.email || 'User',
        profile?.name || 'User',
        'Inventory Update',
        `Adjusted stock for "${product}": Type - ${type}, Amount - ${amount}.`
      );

      // Run safety scans
      runSafetyChecks(updatedInventory, expenses, salesRecords);

      // Cache locally
      saveAllToLocal(salesRecords, updatedInventory, updatedLogs, expenses, employees, activityLogs, notifications);

    } catch (error: any) {
      console.error('Error adding inventory log:', error);
      throw error;
    } finally {
      setSyncing(false);
    }
  };

  const updateInventoryThreshold = async (product: string, threshold: number) => {
    setSyncing(true);
    try {
      const updatedInventory = inventory.map(item => {
        if (item.product === product) {
          return { ...item, lowStockThreshold: threshold };
        }
        return item;
      });

      setInventory(updatedInventory);

      // Sync with Google Sheets
      if (isGoogleLinked && spreadsheetId) {
        const token = await getAccessToken();
        if (token) {
          await updateSheetValues(token, spreadsheetId, 'Inventory', updatedInventory, SHEET_HEADERS.Inventory);
        }
      }

      // Log activity
      await addActivityLogAction(
        profile?.email || 'User',
        profile?.name || 'User',
        'Update Stock Threshold',
        `ตั้งเกณฑ์สต็อกขั้นต่ำสำหรับ "${product}" เป็น ${threshold} ${inventory.find(i => i.product === product)?.unit || ''}`
      );

      // Run safety scans (this will trigger alerts if stock is below new threshold)
      runSafetyChecks(updatedInventory, expenses, salesRecords);

      // Cache locally
      saveAllToLocal(salesRecords, updatedInventory, inventoryLogs, expenses, employees, activityLogs, notifications);

    } catch (error: any) {
      console.error('Error updating inventory threshold:', error);
      throw error;
    } finally {
      setSyncing(false);
    }
  };

  // C. Add Expense Record
  const addExpense = async (form: Omit<ExpenseRecord, 'id' | 'timestamp'>) => {
    setSyncing(true);
    try {
      const newRecord: ExpenseRecord = {
        ...form,
        id: `exp-${Date.now()}`,
        timestamp: new Date().toISOString()
      };

      const updatedExpenses = [...expenses, newRecord];
      setExpenses(updatedExpenses);

      // Trigger high expense notification
      const newNotifs = [...notifications];
      if (form.amount > 1500) {
        newNotifs.unshift({
          id: `high-exp-${newRecord.id}`,
          type: 'high_expense',
          title: 'High Expense Recorded',
          message: `Category "${form.category}" logged a significant expense of ฿${form.amount.toLocaleString()} by ${form.employeeName}.`,
          timestamp: new Date().toISOString(),
          read: false
        });
        setNotifications(newNotifs);
      }

      // Sync with Google Sheets
      if (isGoogleLinked && spreadsheetId) {
        const token = await getAccessToken();
        if (token) {
          await appendSheetRecord(token, spreadsheetId, 'Expenses', newRecord, SHEET_HEADERS.Expenses);
        }
      }

      // Log activity
      await addActivityLogAction(
        profile?.email || 'User',
        profile?.name || 'User',
        'Add Expense',
        `Recorded store expense: Category - ${form.category}, Amount - ฿${form.amount.toLocaleString()} (${form.remark || 'no remark'}).`
      );

      // Save locally
      saveAllToLocal(salesRecords, inventory, inventoryLogs, updatedExpenses, employees, activityLogs, newNotifs);

    } catch (error) {
      console.error('Error adding expense:', error);
    } finally {
      setSyncing(false);
    }
  };

  // D. Add/Update/Delete Employee Records
  const addEmployee = async (form: Omit<Employee, 'id'>) => {
    setSyncing(true);
    try {
      const newEmp: Employee = {
        ...form,
        id: `e-${Date.now()}`,
        active: true
      };

      const updatedEmps = [...employees, newEmp];
      setEmployees(updatedEmps);

      if (isGoogleLinked && spreadsheetId) {
        const token = await getAccessToken();
        if (token) {
          await appendSheetRecord(token, spreadsheetId, 'Employees', newEmp, SHEET_HEADERS.Employees);
        }
      }

      await addActivityLogAction(
        profile?.email || 'User',
        profile?.name || 'User',
        'Create Employee',
        `Added new employee "${form.name}" as ${form.role}.`
      );

      saveAllToLocal(salesRecords, inventory, inventoryLogs, expenses, updatedEmps, activityLogs, notifications);
    } catch (error) {
      console.error('Error adding employee:', error);
    } finally {
      setSyncing(false);
    }
  };

  const updateEmployee = async (emp: Employee) => {
    setSyncing(true);
    try {
      const updatedEmps = employees.map(e => e.id === emp.id ? emp : e);
      setEmployees(updatedEmps);

      if (isGoogleLinked && spreadsheetId) {
        const token = await getAccessToken();
        if (token) {
          await updateSheetValues(token, spreadsheetId, 'Employees', updatedEmps, SHEET_HEADERS.Employees);
        }
      }

      await addActivityLogAction(
        profile?.email || 'User',
        profile?.name || 'User',
        'Update Employee',
        `Modified details for employee "${emp.name}".`
      );

      saveAllToLocal(salesRecords, inventory, inventoryLogs, expenses, updatedEmps, activityLogs, notifications);
    } catch (error) {
      console.error('Error updating employee:', error);
    } finally {
      setSyncing(false);
    }
  };

  const deleteEmployee = async (id: string) => {
    setSyncing(true);
    try {
      const emp = employees.find(e => e.id === id);
      const updatedEmps = employees.filter(e => e.id !== id);
      setEmployees(updatedEmps);

      if (isGoogleLinked && spreadsheetId) {
        const token = await getAccessToken();
        if (token) {
          await updateSheetValues(token, spreadsheetId, 'Employees', updatedEmps, SHEET_HEADERS.Employees);
        }
      }

      await addActivityLogAction(
        profile?.email || 'User',
        profile?.name || 'User',
        'Delete Employee',
        `Removed employee "${emp?.name || 'Unknown'}" from active register.`
      );

      saveAllToLocal(salesRecords, inventory, inventoryLogs, expenses, updatedEmps, activityLogs, notifications);
    } catch (error) {
      console.error('Error deleting employee:', error);
    } finally {
      setSyncing(false);
    }
  };

  // E. Notification Actions
  const markNotificationRead = (id: string) => {
    const updated = notifications.map(n => n.id === id ? { ...n, read: true } : n);
    setNotifications(updated);
    localStorage.setItem('r_notifications', JSON.stringify(updated));
  };

  const clearAllNotifications = () => {
    setNotifications([]);
    localStorage.setItem('r_notifications', JSON.stringify([]));
  };

  // G. Add Weekly Stock Audit
  const addWeeklyAudit = async (audit: Omit<WeeklyAudit, 'id' | 'timestamp'>) => {
    setSyncing(true);
    try {
      const newAudit: WeeklyAudit = {
        ...audit,
        id: `audw-${Date.now()}`,
        timestamp: new Date().toISOString()
      };

      const updatedWeekly = [newAudit, ...weeklyAudits];
      setWeeklyAudits(updatedWeekly);

      // Sync to Google Sheets
      if (isGoogleLinked && spreadsheetId) {
        const token = await getAccessToken();
        if (token) {
          const serialized = {
            ...newAudit,
            items: JSON.stringify(newAudit.items)
          };
          await appendSheetRecord(token, spreadsheetId, 'WeeklyAudits', serialized, SHEET_HEADERS.WeeklyAudits);
        }
      }

      // Activity logging
      await addActivityLogAction(
        profile?.email || 'User',
        profile?.name || 'User',
        'Weekly Stock Audit',
        `Completed weekly stock count for range ${audit.weekRange}. Auditor: ${audit.auditorName}.`
      );

      // Notifications scan: check for shortages
      const missingItems = audit.items.filter(item => item.difference < 0);
      if (missingItems.length > 0) {
        const itemNames = missingItems.map(item => item.product).join(', ');
        const newNotif: AppNotification = {
          id: `n-audw-${Date.now()}`,
          type: 'low_stock',
          title: 'ตรวจพบสต็อกขาดหายรายสัปดาห์',
          message: `ผลการตรวจนับรายสัปดาห์พบสต็อกขาดหายสำหรับ: ${itemNames} โดยผู้ตรวจสอบ ${audit.auditorName}`,
          timestamp: new Date().toISOString(),
          read: false
        };
        const updatedNotifs = [newNotif, ...notifications];
        setNotifications(updatedNotifs);
        saveAllToLocal(salesRecords, inventory, inventoryLogs, expenses, employees, activityLogs, updatedNotifs, updatedWeekly, monthlyAudits);
      } else {
        saveAllToLocal(salesRecords, inventory, inventoryLogs, expenses, employees, activityLogs, notifications, updatedWeekly, monthlyAudits);
      }

    } catch (error) {
      console.error('Error adding weekly stock audit:', error);
      throw error;
    } finally {
      setSyncing(false);
    }
  };

  // H. Add Monthly Stock Audit & Rollover
  const addMonthlyAudit = async (audit: Omit<MonthlyAudit, 'id' | 'timestamp'>, shouldRollover: boolean) => {
    setSyncing(true);
    try {
      const newAudit: MonthlyAudit = {
        ...audit,
        id: `audm-${Date.now()}`,
        rolloverProcessed: shouldRollover,
        timestamp: new Date().toISOString()
      };

      const updatedMonthly = [newAudit, ...monthlyAudits];
      setMonthlyAudits(updatedMonthly);

      let updatedInventory = inventory;
      let updatedInvLogs = inventoryLogs;

      if (shouldRollover) {
        // Carry over audited physical stock as the new Beginning Stock for next month
        // Reset receive and use back to 0
        const todayStr = new Date().toISOString().split('T')[0];
        
        // Let's create beginning stock logs for each item
        const newRolloverLogs: InventoryLog[] = audit.items.map((item, idx) => ({
          id: `invl-rollover-${item.product}-${Date.now()}-${idx}`,
          date: todayStr,
          product: item.product,
          type: 'Beginning',
          amount: item.physicalStock,
          employeeName: audit.auditorName,
          remark: `ยอดยกมาต้นเดือนใหม่ (ปิดสต็อกสิ้นเดือน ${audit.auditMonth} โดยผู้จัดการ)`,
          timestamp: new Date().toISOString()
        }));

        updatedInventory = inventory.map(item => {
          const auditedItem = audit.items.find(ai => ai.product === item.product);
          if (auditedItem) {
            return {
              ...item,
              beginningStock: auditedItem.physicalStock,
              receive: 0,
              use: 0,
              remaining: auditedItem.physicalStock
            };
          }
          return item;
        });

        updatedInvLogs = [...inventoryLogs, ...newRolloverLogs];
        setInventory(updatedInventory);
        setInventoryLogs(updatedInvLogs);
      }

      // Sync to Google Sheets
      if (isGoogleLinked && spreadsheetId) {
        const token = await getAccessToken();
        if (token) {
          // Sync monthly audit row
          const serialized = {
            ...newAudit,
            rolloverProcessed: shouldRollover ? 'true' : 'false',
            items: JSON.stringify(newAudit.items)
          };
          await appendSheetRecord(token, spreadsheetId, 'MonthlyAudits', serialized, SHEET_HEADERS.MonthlyAudits);

          if (shouldRollover) {
            // Push updated inventory to sheets
            await updateSheetValues(token, spreadsheetId, 'Inventory', updatedInventory, SHEET_HEADERS.Inventory);
            
            // Append the new Beginning logs to sheet
            const rolloverLogs = updatedInvLogs.filter(l => l.id.startsWith('invl-rollover-'));
            for (const log of rolloverLogs) {
              await appendSheetRecord(token, spreadsheetId, 'InventoryLog', log, SHEET_HEADERS.InventoryLog);
            }
          }
        }
      }

      // Activity logging
      await addActivityLogAction(
        profile?.email || 'User',
        profile?.name || 'User',
        'Monthly Stock Audit',
        `Completed month-end count for ${audit.auditMonth}. Rollover processed: ${shouldRollover ? 'Yes' : 'No'}. Auditor: ${audit.auditorName}.`
      );

      // Save locally
      saveAllToLocal(salesRecords, updatedInventory, updatedInvLogs, expenses, employees, activityLogs, notifications, weeklyAudits, updatedMonthly);

    } catch (error) {
      console.error('Error adding monthly stock audit:', error);
      throw error;
    } finally {
      setSyncing(false);
    }
  };

  // F. Export Monthly Summary
  const exportMonthlySummary = async (
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
    records: SalesRecord[]
  ): Promise<string> => {
    if (!isGoogleLinked || !spreadsheetId) {
      throw new Error('กรุณาเชื่อมต่อ Google Sheets ก่อนส่งออกข้อมูลสรุปรายเดือน');
    }
    const token = await getAccessToken();
    if (!token) {
      throw new Error('ไม่พบสิทธิ์การเชื่อมต่อ Google Sheets กรุณาเข้าสู่ระบบอีกครั้ง');
    }
    const sheetTitle = await exportMonthlySummaryToSheets(token, spreadsheetId, monthStr, metrics, records, inventory);
    
    // Log activity
    await addActivityLogAction(
      profile?.email || 'User', 
      profile?.name || 'User', 
      'ส่งออกสรุปรายเดือน', 
      `ส่งออกข้อมูลสรุปยอดขายรายเดือนประจำเดือน ${monthStr} ไปยังแท็บ "${sheetTitle}" สำเร็จ`
    );

    return sheetTitle;
  };

  return (
    <DatabaseContext.Provider value={{
      user,
      profile,
      isGoogleLinked,
      spreadsheetId,
      loading,
      syncing,
      salesRecords,
      inventory,
      inventoryLogs,
      expenses,
      employees,
      activityLogs,
      notifications,
      weeklyAudits,
      monthlyAudits,
      loginWithGoogle,
      unlinkGoogle,
      addSalesRecord,
      addInventoryTransaction,
      updateInventoryThreshold,
      addExpense,
      addEmployee,
      updateEmployee,
      deleteEmployee,
      markNotificationRead,
      clearAllNotifications,
      refreshData,
      addWeeklyAudit,
      addMonthlyAudit,
      exportMonthlySummary
    }}>
      {children}
    </DatabaseContext.Provider>
  );
};
