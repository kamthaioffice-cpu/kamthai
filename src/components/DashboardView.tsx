import React from 'react';
import { motion } from 'motion/react';
import { 
  DollarSign, TrendingUp, Receipt, Package, Check, AlertCircle, Plus, RefreshCw, ShoppingCart, ArrowRight
} from 'lucide-react';
import { useDatabase } from '../context/DatabaseContext';

// Product name translation dictionary for Thai localization
const productNamesTh: Record<string, string> = {
  'Crispy Pork': 'หมูกรอบ',
  'Raw Pork': 'หมูดิบ',
  'Rice': 'ข้าวสาร',
  'Cooking Oil': 'น้ำมันพืช',
  'Packaging Box': 'กล่องบรรจุภัณฑ์',
  'Soft Drinks': 'เครื่องดื่ม'
};

const getProductTh = (name: string) => productNamesTh[name] || name;

// Smart suggestion helper to guide employees on what action to take when stock is low
const getRecommendation = (product: string) => {
  const norm = product.toLowerCase();
  if (norm.includes('crispy') || norm.includes('หมูกรอบ')) {
    return 'ควรทอดหมูกรอบเพิ่มหรือเบิกจากสต็อกเตรียมด่วน';
  }
  if (norm.includes('raw') || norm.includes('หมูดิบ')) {
    return 'ควรสั่งซื้อหมูดิบเพิ่มเพื่อเตรียมพร้อมสำหรับรอบถัดไป';
  }
  if (norm.includes('oil') || norm.includes('น้ำมัน')) {
    return 'ควรเบิกน้ำมันพืชสำรองหรือสั่งซื้อด่วน';
  }
  if (norm.includes('box') || norm.includes('กล่อง') || norm.includes('package')) {
    return 'ควรเบิกกล่องบรรจุภัณฑ์เพิ่มเติมเข้าร้าน';
  }
  return 'ควรเบิกหรือสั่งซื้อวัตถุดิบเพิ่มเติมเข้าร้านโดยด่วน';
};

interface DashboardViewProps {
  setView: (view: 'dashboard' | 'daily-record' | 'inventory' | 'expenses' | 'reports' | 'employees' | 'analytics') => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ setView }) => {
  const { salesRecords, inventory, syncing, refreshData } = useDatabase();

  // Find the latest logged day/shift
  const latestRecord = salesRecords.length > 0 
    ? [...salesRecords].sort((a, b) => b.date.localeCompare(a.date))[0] 
    : null;

  // Filter inventory items that have fallen below or equal to their low stock threshold
  const lowStockItems = inventory.filter(i => i.remaining <= i.lowStockThreshold);

  // Formatting currency helper
  const formatTHB = (val: number) => {
    return '฿' + Math.round(val).toLocaleString();
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col gap-8 pb-12"
      id="dashboard-root"
    >
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4" id="dashboard-header">
        <div>
          <span className="text-xs font-mono font-bold uppercase tracking-widest text-brand-orange bg-brand-orange/10 px-3 py-1 rounded-full">
            ภาพรวมด่วนประจำวัน
          </span>
          <h1 className="text-3xl font-extrabold tracking-tight text-gray-950 mt-2">
            แดชบอร์ดร้านอาหาร
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            {latestRecord 
              ? `ข้อมูลล่าสุด ณ วันที่ปิดกะรอบ ${new Date(latestRecord.date).toLocaleDateString('th-TH', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`
              : 'ยังไม่มีประวัติบันทึกยอดขายในระบบ'}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={refreshData}
            disabled={syncing}
            className="w-10 h-10 rounded-xl bg-white hover:bg-orange-50/20 active:scale-95 border border-orange-100 flex items-center justify-center transition-all cursor-pointer shadow-xs"
            title="ดึงข้อมูลใหม่"
            id="refresh-dashboard-btn"
          >
            <RefreshCw className={`w-4.5 h-4.5 text-gray-600 ${syncing ? 'animate-spin' : ''}`} />
          </button>
          
          <button
            onClick={() => setView('daily-record')}
            className="py-2.5 px-4 orange-gradient text-white hover:opacity-90 active:scale-95 text-xs font-semibold rounded-xl flex items-center gap-2 shadow-md shadow-orange-500/10 transition-all cursor-pointer"
            id="go-to-daily-record-btn"
          >
            <Plus className="w-4 h-4" />
            บันทึกปิดยอดกะประจำวัน
          </button>
        </div>
      </div>

      {/* Primary KPI Summary Row - strictly displaying Daily Sales, Daily Expenses, Net Profit */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6" id="dashboard-kpi-grid">
        
        {/* Metric 1: Daily Sales (ยอดขายประจำวัน) */}
        <div className="glass-card rounded-3xl p-6 border border-orange-100/40 relative overflow-hidden flex flex-col" id="kpi-daily-sales">
          <div className="absolute right-[-15px] top-[-15px] opacity-5">
            <DollarSign className="w-32 h-32 text-brand-orange" />
          </div>
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-gray-500">
              ยอดขายประจำวัน
            </span>
            <div className="p-2 bg-orange-50 border border-orange-100 rounded-xl text-brand-orange">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <h2 className="text-3xl font-black font-display text-gray-900 leading-none">
            {latestRecord ? formatTHB(latestRecord.salesAmount) : '฿0'}
          </h2>
          <div className="flex items-center gap-1.5 mt-4 pt-3 border-t border-gray-100/50">
            <span className="text-[10px] text-gray-400 font-medium">
              ยอดรวมจากการปิดกะรอบล่าสุด
            </span>
          </div>
        </div>

        {/* Metric 2: Daily Expenses (ค่าใช้จ่ายประจำวัน) */}
        <div className="glass-card rounded-3xl p-6 border border-orange-100/40 relative overflow-hidden flex flex-col" id="kpi-daily-expenses">
          <div className="absolute right-[-15px] top-[-15px] opacity-5">
            <Receipt className="w-32 h-32 text-amber-500" />
          </div>
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-gray-500">
              ค่าใช้จ่ายประจำวัน
            </span>
            <div className="p-2 bg-amber-50 border border-amber-100 rounded-xl text-amber-500">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <h2 className="text-3xl font-black font-display text-gray-900 leading-none">
            {latestRecord ? formatTHB(latestRecord.expense) : '฿0'}
          </h2>
          <div className="flex items-center gap-1.5 mt-4 pt-3 border-t border-gray-100/50">
            <span className="text-[10px] text-gray-400 font-medium">
              รายจ่ายเงินสดย่อยจากลิ้นชักหน้าร้าน
            </span>
          </div>
        </div>

        {/* Metric 3: Net Profit (กำไรสุทธิประจำวัน) */}
        <div className="glass-card rounded-3xl p-6 border border-emerald-100/40 relative overflow-hidden flex flex-col" id="kpi-net-profit">
          <div className="absolute right-[-15px] top-[-15px] opacity-5">
            <TrendingUp className="w-32 h-32 text-emerald-500" />
          </div>
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-gray-500">
              กำไรสุทธิรอบกะ
            </span>
            <div className="p-2 bg-emerald-50 border border-emerald-100 rounded-xl text-emerald-500">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <h2 className={`text-3xl font-black font-display leading-none ${latestRecord && latestRecord.profit < 0 ? 'text-red-600' : 'text-gray-900'}`}>
            {latestRecord ? formatTHB(latestRecord.profit) : '฿0'}
          </h2>
          <div className="flex items-center gap-1.5 mt-4 pt-3 border-t border-gray-100/50">
            <span className="text-[10px] text-gray-400 font-medium">
              หักลบค่าวัตถุดิบและค่าใช้จ่ายในร้านแล้ว
            </span>
          </div>
        </div>

      </div>

      {/* Stock Items Below Threshold Section (สต็อกที่ควรสั่งซื้อหรือควรเบิก เมื่อต่ำกว่าเกณฑ์) */}
      <div className="bg-white border border-orange-100/50 rounded-3xl p-6 shadow-xs flex flex-col gap-5" id="low-stock-section">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-50 pb-4">
          <div>
            <h3 className="text-base font-extrabold text-gray-950 flex items-center gap-2">
              <Package className="w-5 h-5 text-brand-orange" />
              วัตถุดิบและสต็อกที่ควรสั่งซื้อหรือควรเบิก
            </h3>
            <p className="text-[11px] text-gray-400 mt-0.5">รายการสิ่งของที่จำนวนเหลือน้อยกว่าเกณฑ์ที่กำหนดไว้ในระบบ</p>
          </div>
          
          <button 
            onClick={() => setView('inventory')} 
            className="text-xs font-bold text-brand-orange hover:text-brand-orange/80 transition-colors flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
            id="manage-inventory-link"
          >
            จัดการคลังสินค้า
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {lowStockItems.length === 0 ? (
          <div className="py-12 flex flex-col items-center justify-center text-center gap-3" id="stock-healthy-state">
            <div className="w-12 h-12 bg-emerald-50 border border-emerald-100 rounded-full flex items-center justify-center text-emerald-500 shadow-sm animate-pulse">
              <Check className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-gray-900">คลังสินค้าทุกรายการปกติ</h4>
              <p className="text-[11px] text-gray-400 mt-0.5">ไม่มีวัตถุดิบชิ้นใดต่ำกว่าเกณฑ์ ไม่จำเป็นต้องสั่งซื้อหรือเบิกเพิ่มในขณะนี้</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" id="low-stock-grid">
            {lowStockItems.map((item) => {
              const pctOfThreshold = Math.round((item.remaining / Math.max(1, item.lowStockThreshold)) * 100);
              return (
                <div 
                  key={item.id} 
                  className="p-4 bg-rose-50/20 border border-rose-100 rounded-2xl flex flex-col gap-3.5 relative overflow-hidden shadow-2xs hover:shadow-xs transition-all"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="text-xs font-extrabold text-gray-900 font-display">
                        {getProductTh(item.product)}
                      </h4>
                      <span className="text-[9px] font-mono text-gray-400">
                        {item.product}
                      </span>
                    </div>

                    <span className="text-[9px] font-bold font-sans bg-rose-50 text-rose-700 border border-rose-100/50 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      ควรเบิก / ควรสั่งเพิ่ม
                    </span>
                  </div>

                  <div className="flex items-baseline justify-between mt-1">
                    <div>
                      <span className="block text-[8px] font-mono uppercase tracking-wider text-gray-400">คงเหลือจริง</span>
                      <span className="text-xl font-black font-mono text-rose-600">
                        {item.remaining} <span className="text-xs font-semibold text-gray-500 font-sans">{item.unit}</span>
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="block text-[8px] font-mono uppercase tracking-wider text-gray-400">เกณฑ์ขั้นต่ำ</span>
                      <span className="text-xs font-bold font-mono text-gray-700">
                        {item.lowStockThreshold} {item.unit}
                      </span>
                    </div>
                  </div>

                  {/* Visual remaining bar */}
                  <div className="flex flex-col gap-1">
                    <div className="w-full h-1.5 rounded-full bg-gray-100 overflow-hidden">
                      <div 
                        className="h-full bg-rose-500 rounded-full"
                        style={{ width: `${Math.min(100, pctOfThreshold)}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[8px] font-mono font-bold text-gray-400">
                      <span>เทียบกับเกณฑ์เตือน</span>
                      <span className="text-rose-600">{pctOfThreshold}%</span>
                    </div>
                  </div>

                  <div className="mt-1 pt-2.5 border-t border-rose-100/40 text-[10px] text-rose-700 font-medium flex items-center gap-1.5">
                    <ShoppingCart className="w-3.5 h-3.5 text-rose-500" />
                    <span>{getRecommendation(item.product)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </motion.div>
  );
};
