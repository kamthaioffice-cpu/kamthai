import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Menu, X, Sparkles, Database, ShieldAlert, KeyRound, ArrowRight, UserCheck, Flame
} from 'lucide-react';
import { DatabaseProvider, useDatabase } from './context/DatabaseContext';
import { Sidebar } from './components/Sidebar';
import { DashboardView } from './components/DashboardView';
import { DailyRecordView } from './components/DailyRecordView';
import { InventoryView } from './components/InventoryView';
import { ExpenseView } from './components/ExpenseView';
import { EmployeeView } from './components/EmployeeView';
import { ReportsView } from './components/ReportsView';
import { AnalyticsView } from './components/AnalyticsView';
import { NotificationCenter } from './components/NotificationCenter';
import { getRoleTh } from './types';

type ViewType = 'dashboard' | 'daily-record' | 'inventory' | 'expenses' | 'reports' | 'employees' | 'analytics';

const viewNamesTh: Record<ViewType, string> = {
  'dashboard': 'แดชบอร์ดสรุปผล',
  'daily-record': 'บันทึกรายวัน',
  'inventory': 'คลังสินค้าและวัตถุดิบ',
  'expenses': 'ค่าใช้จ่าย',
  'employees': 'พนักงาน',
  'reports': 'รายงาน',
  'analytics': 'วิเคราะห์ข้อมูลขั้นสูง'
};

function AppContent() {
  const { 
    profile, 
    loading, 
    syncing, 
    isGoogleLinked, 
    employees, 
    loginWithGoogle,
    salesRecords
  } = useDatabase();
  
  const [currentView, setView] = useState<ViewType>('dashboard');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [simulatedEmployeeId, setSimulatedEmployeeId] = useState<string>('');

  // Local state to override role/name when simulating cashier terminals
  const [activeProfile, setActiveProfile] = useState<{ name: string; role: 'Admin' | 'Manager' | 'Employee'; email: string } | null>(null);

  // Sync active profile with DB profile by default
  useEffect(() => {
    if (profile) {
      setActiveProfile({
        name: profile.name,
        role: profile.role,
        email: profile.email
      });
    }
  }, [profile]);

  // Handle staff login simulation
  const handleSimulateLogin = (empId: string) => {
    setSimulatedEmployeeId(empId);
    if (!empId) {
      if (profile) {
        setActiveProfile({ name: profile.name, role: profile.role, email: profile.email });
      }
      return;
    }

    const matched = employees.find(e => e.id === empId);
    if (matched) {
      setActiveProfile({
        name: matched.name,
        role: matched.role as any,
        email: `${matched.name.toLowerCase().replace(/\s+/g, '')}@kamthai.com`
      });
      // Redirect to dashboard if the simulated role doesn't have access to the current view
      const roleLevel = getRoleLevel(matched.role);
      const minRoleForView = getMinRoleForView(currentView);
      if (roleLevel < getRoleLevel(minRoleForView)) {
        setView('dashboard');
      }
    }
  };

  const getRoleLevel = (role: string): number => {
    switch (role) {
      case 'Admin': return 3;
      case 'Manager': return 2;
      case 'Employee': return 1;
      default: return 1;
    }
  };

  const getMinRoleForView = (view: ViewType): 'Admin' | 'Manager' | 'Employee' => {
    switch (view) {
      case 'expenses':
      case 'employees':
      case 'reports':
        return 'Manager';
      case 'analytics':
        return 'Admin';
      default:
        return 'Employee';
    }
  };

  if (loading) {
    return (
      <div className="w-screen h-screen flex flex-col items-center justify-center bg-gray-50/50">
        <div className="relative flex flex-col items-center">
          <div className="w-16 h-16 rounded-2xl bg-linear-to-tr from-brand-orange to-brand-red flex items-center justify-center shadow-2xl shadow-orange-500/25 animate-bounce mb-6">
            <Flame className="w-8 h-8 text-white animate-pulse" />
          </div>
          <h2 className="font-display font-extrabold text-xl text-gray-950 tracking-tight">Kam Thai</h2>
          <p className="text-xs text-gray-400 font-mono mt-1">กำลังเปิดใช้งานระบบฐานข้อมูล...</p>
          <div className="w-40 h-1 bg-gray-100 rounded-full mt-4 overflow-hidden relative">
            <div className="h-full bg-brand-orange rounded-full animate-infinite-loading absolute" />
          </div>
        </div>
      </div>
    );
  }

  // Intercept views based on simulated active profile
  const userRoleLevel = getRoleLevel(activeProfile?.role || 'Employee');
  const activeMinRole = getMinRoleForView(currentView);
  const isLocked = userRoleLevel < getRoleLevel(activeMinRole);

  return (
    <div className="min-h-screen bg-[#faf8f6]/70 flex text-gray-950">
      
      {/* Desktop Sidebar */}
      <div className="hidden lg:block shrink-0">
        <Sidebar 
          currentView={currentView} 
          setView={setView} 
        />
      </div>

      {/* Mobile Sidebar Drawer Overlay */}
      <AnimatePresence>
        {mobileSidebarOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.4 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileSidebarOpen(false)}
              className="fixed inset-0 bg-black z-40 lg:hidden"
            />
            <motion.div
              initial={{ x: -320 }}
              animate={{ x: 0 }}
              exit={{ x: -320 }}
              transition={{ type: 'spring', damping: 20 }}
              className="fixed left-0 top-0 h-screen w-80 bg-white z-50 lg:hidden"
            >
              <Sidebar 
                currentView={currentView} 
                setView={(v) => {
                  setView(v);
                  setMobileSidebarOpen(false);
                }} 
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main Workspace Frame */}
      <div className="flex-1 min-w-0 lg:ml-80 flex flex-col relative">
        
        {/* Dynamic Top Bar Navigation Dashboard */}
        <header className="h-20 border-b border-orange-100/50 px-6 sm:px-8 flex items-center justify-between bg-white/70 backdrop-blur-md sticky top-0 z-30">
          
          <div className="flex items-center gap-3">
            {/* Hamburger trigger for small layouts */}
            <button
              onClick={() => setMobileSidebarOpen(true)}
              className="p-2 -ml-2 rounded-xl hover:bg-gray-100 text-gray-500 lg:hidden cursor-pointer"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div>
              <h2 className="font-display font-extrabold text-sm sm:text-base text-gray-950 uppercase tracking-wide">
                หน้า: {viewNamesTh[currentView]}
              </h2>
              <span className="hidden sm:block text-[10px] text-gray-400 font-mono">
                {new Date().toLocaleDateString('th-TH', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            
            {/* Staff Simulation Gateway Panel (Visible only when offline) */}
            {!isGoogleLinked && (
              <div className="hidden md:flex items-center gap-2 bg-orange-50 border border-orange-100 px-3 py-1.5 rounded-xl">
                <span className="text-[9px] font-mono font-bold text-orange-600 uppercase flex items-center gap-1 shrink-0">
                  <KeyRound className="w-3.5 h-3.5" /> เครื่องทดสอบพนักงาน:
                </span>
                <select
                  value={simulatedEmployeeId}
                  onChange={(e) => handleSimulateLogin(e.target.value)}
                  className="bg-transparent text-xs font-bold text-orange-950 focus:outline-none cursor-pointer"
                >
                  <option value="">ทดสอบระบบ (ผู้ดูแลระบบ)</option>
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>{emp.name} ({getRoleTh(emp.role)})</option>
                  ))}
                </select>
              </div>
            )}

            {/* Notification Center Trigger bell */}
            <NotificationCenter />

            {/* Display active simulated or logged in profile badge */}
            <div className="flex items-center gap-2 border-l border-orange-100/60 pl-4">
              <div className="hidden sm:block text-right">
                <span className="block text-xs font-bold text-gray-900 leading-tight">
                  {activeProfile?.name || 'ผู้ใช้งานทั่วไป'}
                </span>
                <span className="block text-[9px] font-mono font-extrabold uppercase tracking-wider text-brand-orange leading-none mt-0.5">
                  สิทธิ์ {activeProfile ? getRoleTh(activeProfile.role) : 'ผู้ดูแลระบบ'}
                </span>
              </div>
            </div>

          </div>
        </header>

        {/* Syncing overlay feedback indicator */}
        {syncing && (
          <div className="absolute top-20 left-0 right-0 h-1 bg-orange-100/50 overflow-hidden z-40">
            <div className="h-full bg-linear-to-r from-brand-orange to-brand-red w-1/3 rounded-full animate-infinite-loading" />
          </div>
        )}

        {/* View Frame Container */}
        <main className="flex-1 p-6 sm:p-8">
          <AnimatePresence mode="wait">
            {isLocked ? (
              <motion.div 
                key="permission-locked"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className="max-w-md mx-auto py-16 text-center flex flex-col items-center justify-center gap-4 bg-white border border-rose-100 p-8 rounded-3xl shadow-sm"
              >
                <div className="w-14 h-14 bg-rose-50 border border-rose-100 rounded-full flex items-center justify-center text-rose-500 mb-2">
                  <ShieldAlert className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="font-display font-extrabold text-base text-gray-950 uppercase tracking-wide">
                    สิทธิ์การเข้าถึงถูกจำกัด
                  </h3>
                  <p className="text-xs text-gray-500 mt-2 leading-relaxed">
                    บัญชีผู้ใช้งานจำลองสำหรับ <strong>{activeProfile?.name}</strong> มีสิทธิ์จำกัดและไม่สามารถเข้าถึงหน้าจอ <strong>{viewNamesTh[currentView]}</strong> ได้
                  </p>
                </div>
                
                {!isGoogleLinked && (
                  <div className="mt-4 p-4 bg-orange-50 rounded-2xl border border-orange-100/50 text-left w-full">
                    <span className="text-[9px] font-mono font-bold text-brand-orange uppercase block mb-1">สลับผู้ใช้งานจำลองด่วนเพื่อทดสอบสิทธิ์:</span>
                    <p className="text-[10px] text-orange-950 leading-relaxed mb-3">
                      ใช้เมนูด้านบนเพื่อเลือกบัญชีผู้ใช้งานจำลองอื่น เช่น สิทธิ์ผู้จัดการ หรือ ผู้ดูแลระบบ
                    </p>
                    <select
                      value={simulatedEmployeeId}
                      onChange={(e) => handleSimulateLogin(e.target.value)}
                      className="w-full h-9 px-3 border border-orange-200 rounded-xl bg-white text-xs font-bold text-gray-900 cursor-pointer focus:outline-none"
                    >
                      <option value="">ผู้ใช้งานจำลอง (รีเซ็ตกลับเป็นผู้ดูแลระบบเริ่มต้น)</option>
                      {employees.map(emp => (
                        <option key={emp.id} value={emp.id}>{emp.name} ({getRoleTh(emp.role)})</option>
                      ))}
                    </select>
                  </div>
                )}
              </motion.div>
            ) : (
              <motion.div
                key={currentView}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.15 }}
                className="w-full"
              >
                {currentView === 'dashboard' && <DashboardView setView={setView} />}
                {currentView === 'daily-record' && <DailyRecordView setView={setView} />}
                {currentView === 'inventory' && <InventoryView />}
                {currentView === 'expenses' && <ExpenseView />}
                {currentView === 'employees' && <EmployeeView />}
                {currentView === 'reports' && <ReportsView />}
                {currentView === 'analytics' && <AnalyticsView />}
              </motion.div>
            )}
          </AnimatePresence>
        </main>

      </div>
    </div>
  );
}

export default function App() {
  return (
    <DatabaseProvider>
      <AppContent />
    </DatabaseProvider>
  );
}
