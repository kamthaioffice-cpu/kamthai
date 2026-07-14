import React from 'react';
import { motion } from 'motion/react';
import { 
  LayoutDashboard, 
  FileText, 
  ClipboardList, 
  Receipt, 
  Users, 
  BarChart3, 
  LogOut, 
  Database, 
  RefreshCw,
  Lock,
  Flame,
  Globe
} from 'lucide-react';
import { useDatabase } from '../context/DatabaseContext';
import { getRoleTh } from '../types';

type ViewType = 'dashboard' | 'daily-record' | 'inventory' | 'expenses' | 'reports' | 'employees' | 'analytics';

interface SidebarProps {
  currentView: ViewType;
  setView: (view: ViewType) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentView, setView }) => {
  const { 
    user, 
    profile, 
    isGoogleLinked, 
    spreadsheetId, 
    loginWithGoogle, 
    unlinkGoogle, 
    syncing, 
    refreshData 
  } = useDatabase();

  const menuItems = [
    { id: 'dashboard' as const, label: 'แดชบอร์ด', icon: LayoutDashboard, minRole: 'Employee' },
    { id: 'daily-record' as const, label: 'บันทึกรายวัน', icon: Flame, minRole: 'Employee' },
    { id: 'inventory' as const, label: 'คลังสินค้า', icon: ClipboardList, minRole: 'Employee' },
    { id: 'expenses' as const, label: 'ค่าใช้จ่าย', icon: Receipt, minRole: 'Manager' },
    { id: 'employees' as const, label: 'พนักงาน', icon: Users, minRole: 'Manager' },
    { id: 'reports' as const, label: 'รายงาน', icon: FileText, minRole: 'Manager' },
    { id: 'analytics' as const, label: 'วิเคราะห์ข้อมูล', icon: BarChart3, minRole: 'Admin' },
  ];

  const getRoleLevel = (role: string): number => {
    switch (role) {
      case 'Admin': return 3;
      case 'Manager': return 2;
      case 'Employee': return 1;
      default: return 1;
    }
  };

  const userRoleLevel = getRoleLevel(profile?.role || 'Employee');

  const checkPermission = (itemMinRole: string): boolean => {
    return userRoleLevel >= getRoleLevel(itemMinRole);
  };

  return (
    <aside className="w-80 h-screen fixed left-0 top-0 glass-panel border-r border-orange-100 flex flex-col justify-between py-6 px-5 z-40">
      <div className="flex flex-col gap-6 w-full">
        {/* Brand Header */}
        <div className="flex items-center gap-3 px-2">
          <div className="w-10 h-10 rounded-xl orange-gradient flex items-center justify-center shadow-lg shadow-orange-500/20">
            <Flame className="w-5 h-5 text-white animate-pulse" />
          </div>
          <div>
            <span className="font-display font-extrabold text-xl tracking-tight bg-linear-to-r from-brand-orange to-brand-red bg-clip-text text-transparent">
              Kam Thai
            </span>
            <span className="block text-[10px] uppercase font-mono font-bold tracking-widest text-[#FF6B35] -mt-1">
              ยอดขายและคลังสินค้า
            </span>
          </div>
        </div>

        {/* Database Sync Status Panel */}
        <div className="w-full bg-orange-50/50 rounded-2xl p-4 border border-orange-100/60 relative overflow-hidden">
          <div className="absolute right-[-10px] bottom-[-10px] opacity-5">
            <Database className="w-24 h-24 text-brand-orange" />
          </div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-mono uppercase font-bold tracking-wider text-orange-700/80 flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5" />
              ฐานข้อมูลระบบคลาวด์
            </span>
            <span className="flex items-center gap-1">
              <span className={`w-2 h-2 rounded-full ${isGoogleLinked ? 'bg-emerald-500 animate-ping' : 'bg-amber-500'}`} />
              <span className={`w-2 h-2 rounded-full absolute ${isGoogleLinked ? 'bg-emerald-500' : 'bg-amber-500'}`} />
            </span>
          </div>

          {isGoogleLinked ? (
            <div className="flex flex-col gap-2">
              <div className="text-xs text-orange-950/80 font-medium truncate">
                เชื่อมต่อ Google Sheets แล้ว
              </div>
              <div className="text-[10px] font-mono text-orange-800/60 truncate max-w-full">
                ไอดี: {spreadsheetId?.substring(0, 12)}...
              </div>
              <div className="flex items-center gap-2 mt-1">
                <button 
                  onClick={refreshData}
                  disabled={syncing}
                  className="flex-1 py-1 px-2 bg-orange-100 hover:bg-orange-200/80 active:scale-95 text-[10px] font-medium text-orange-900 rounded-lg flex items-center justify-center gap-1 transition-all"
                >
                  <RefreshCw className={`w-3 h-3 ${syncing ? 'animate-spin' : ''}`} />
                  ซิงก์ข้อมูล
                </button>
                <button 
                  onClick={unlinkGoogle}
                  className="py-1 px-2 border border-orange-200 hover:bg-orange-100/40 text-[10px] font-medium text-orange-800 rounded-lg transition-all"
                >
                  ยกเลิกเชื่อมต่อ
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <div className="text-[11px] text-orange-950/70 leading-relaxed">
                เชื่อมต่อ Google Sheets เพื่อบันทึกข้อมูลอย่างปลอดภัยและถาวร
              </div>
              <button
                onClick={loginWithGoogle}
                disabled={syncing}
                className="w-full py-1.5 px-2 orange-gradient text-white hover:opacity-90 active:scale-95 text-xs font-medium rounded-xl flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer animate-none"
              >
                <Globe className="w-4 h-4" />
                {syncing ? 'กำลังเชื่อมต่อ...' : 'เชื่อมต่อ Google Sheets'}
              </button>
            </div>
          )}
        </div>

        {/* Navigation Links */}
        <nav className="flex flex-col gap-1.5 w-full mt-2">
          {menuItems.map((item) => {
            const hasPermission = checkPermission(item.minRole);
            const isSelected = currentView === item.id;

            return (
              <div key={item.id} className="relative group">
                <button
                  onClick={() => hasPermission && setView(item.id)}
                  disabled={!hasPermission}
                  className={`w-full flex items-center justify-between py-3 px-5 transition-all text-sm rounded-r-xl ${
                    !hasPermission 
                      ? 'text-gray-400 opacity-50 cursor-not-allowed'
                      : isSelected 
                        ? 'bg-[rgba(255,107,53,0.15)] border-l-4 border-[#FF6B35] text-[#FF6B35] font-semibold'
                        : 'text-gray-600 border-l-4 border-transparent hover:bg-[rgba(255,107,53,0.1)] hover:border-l-4 hover:border-[#FF6B35] hover:text-[#FF6B35] cursor-pointer'
                  }`}
                >
                  <span className="flex items-center gap-3">
                    <item.icon className={`w-4.5 h-4.5 ${isSelected ? 'text-[#FF6B35]' : 'text-gray-400 group-hover:text-[#FF6B35]/80'}`} />
                    {item.label}
                  </span>
                  
                  {!hasPermission && (
                    <Lock className="w-3.5 h-3.5 text-gray-400/80" />
                  )}
                </button>
              </div>
            );
          })}
        </nav>
      </div>

      {/* User Session Profile Card */}
      <div className="w-full border-t border-orange-100/60 pt-4 flex flex-col gap-3">
        <div className="flex items-center gap-3 px-2">
          <div className="w-10 h-10 rounded-full orange-gradient flex items-center justify-center text-white font-display font-bold shadow-md shadow-orange-500/10">
            {profile?.name ? profile.name.charAt(0).toUpperCase() : 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <span className="block text-sm font-semibold text-gray-950 truncate">
              {profile?.name || 'พนักงานร้าน'}
            </span>
            <span className="block text-[11px] font-mono text-gray-500 truncate">
              {profile?.email}
            </span>
          </div>
          <div className="px-1.5 py-0.5 bg-[rgba(255,107,53,0.1)] border border-[rgba(255,107,53,0.1)] rounded-md text-[9px] font-mono font-extrabold text-[#FF6B35] tracking-wider uppercase">
            {profile ? getRoleTh(profile.role) : 'พนักงาน'}
          </div>
        </div>

        {isGoogleLinked && (
          <button
            onClick={unlinkGoogle}
            className="w-full py-2 px-4 rounded-xl border border-gray-200 hover:bg-gray-50 hover:text-brand-red active:scale-98 text-xs font-semibold text-gray-600 flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            ออกจากระบบ
          </button>
        )}
      </div>
    </aside>
  );
};
