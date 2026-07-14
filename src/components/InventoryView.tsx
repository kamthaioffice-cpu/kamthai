import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Package, Plus, ArrowUpRight, ArrowDownLeft, ClipboardList, AlertCircle, History, Check, X, Search, Filter,
  Calendar, ShieldAlert, CheckCircle2, BadgeAlert, ArrowRight, UserCheck, RefreshCw, FileCheck, Layers, ChevronDown, ChevronUp, Users, AlertTriangle, Settings
} from 'lucide-react';
import { useDatabase } from '../context/DatabaseContext';

const productNamesTh: Record<string, string> = {
  'Crispy Pork': 'หมูกรอบ',
  'Raw Pork': 'หมูดิบ',
  'Rice': 'ข้าวสาร',
  'Cooking Oil': 'น้ำมันพืช',
  'Packaging Box': 'กล่องบรรจุภัณฑ์',
  'Soft Drinks': 'เครื่องดื่ม'
};
const getProductTh = (name: string) => productNamesTh[name] || name;

export const InventoryView: React.FC = () => {
  const { 
    inventory, 
    inventoryLogs, 
    addInventoryTransaction, 
    updateInventoryThreshold,
    syncing,
    weeklyAudits,
    monthlyAudits,
    addWeeklyAudit,
    addMonthlyAudit,
    employees,
    profile
  } = useDatabase();

  const [activeTab, setActiveTab] = useState<'current' | 'weekly' | 'monthly'>('current');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'low' | 'normal'>('all');

  // Transaction Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState('');
  const [transactionType, setTransactionType] = useState<'Receive' | 'Use'>('Receive');
  const [amount, setAmount] = useState<string>('');
  const [remark, setRemark] = useState('');
  const [modalError, setModalError] = useState<string | null>(null);
  const [modalSuccess, setModalSuccess] = useState(false);

  // Threshold Modal State
  const [isThresholdModalOpen, setIsThresholdModalOpen] = useState(false);
  const [thresholdProduct, setThresholdProduct] = useState('');
  const [thresholdValue, setThresholdValue] = useState<string>('');
  const [thresholdError, setThresholdError] = useState<string | null>(null);
  const [thresholdSuccess, setThresholdSuccess] = useState(false);

  // --- Weekly Audit Form States ---
  const [weeklyAuditor, setWeeklyAuditor] = useState('');
  const [customWeeklyAuditor, setCustomWeeklyAuditor] = useState('');
  const [weeklyWeekRange, setWeeklyWeekRange] = useState('');
  const [weeklyCounts, setWeeklyCounts] = useState<Record<string, string>>({});
  const [weeklyRemark, setWeeklyRemark] = useState('');
  const [weeklyError, setWeeklyError] = useState<string | null>(null);
  const [weeklySuccess, setWeeklySuccess] = useState(false);
  const [expandedWeeklyId, setExpandedWeeklyId] = useState<string | null>(null);

  // --- Monthly Audit Form States ---
  const [monthlyAuditor, setMonthlyAuditor] = useState('');
  const [customMonthlyAuditor, setCustomMonthlyAuditor] = useState('');
  const [monthlyPeriod, setMonthlyPeriod] = useState('');
  const [monthlyCounts, setMonthlyCounts] = useState<Record<string, string>>({});
  const [monthlyRemark, setMonthlyRemark] = useState('');
  const [monthlyRollover, setMonthlyRollover] = useState(true);
  const [monthlyError, setMonthlyError] = useState<string | null>(null);
  const [monthlySuccess, setMonthlySuccess] = useState(false);
  const [expandedMonthlyId, setExpandedMonthlyId] = useState<string | null>(null);

  // Filtered inventory list
  const filteredInventory = inventory.filter(item => {
    const productNameTh = getProductTh(item.product);
    const matchesSearch = productNameTh.toLowerCase().includes(searchQuery.toLowerCase()) || item.product.toLowerCase().includes(searchQuery.toLowerCase());
    const isLow = item.remaining <= item.lowStockThreshold;
    if (filterType === 'low') return matchesSearch && isLow;
    if (filterType === 'normal') return matchesSearch && !isLow;
    return matchesSearch;
  });

  // Pre-fill audit counts when inventory loads or tab switches
  useEffect(() => {
    if (inventory.length > 0) {
      const initialCounts: Record<string, string> = {};
      inventory.forEach(item => {
        initialCounts[item.product] = item.remaining.toString();
      });
      
      // Only set if not already set by user
      if (Object.keys(weeklyCounts).length === 0) {
        setWeeklyCounts(initialCounts);
      }
      if (Object.keys(monthlyCounts).length === 0) {
        setMonthlyCounts(initialCounts);
      }
    }
  }, [inventory]);

  // Set default weekly range and month selection
  useEffect(() => {
    // Generate current week range (e.g., Mon - Sun)
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0 is Sunday, 1 is Monday, etc.
    const distanceToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    
    const monday = new Date(today);
    monday.setDate(today.getDate() + distanceToMonday);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);

    const formatDate = (d: Date) => {
      const dd = String(d.getDate()).padStart(2, '0');
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      return `${dd}/${mm}`;
    };

    const currentYear = today.getFullYear() + 543; // Thai year for display
    const weekStr = `สัปดาห์ที่ ${getWeekNumber(today)} (${formatDate(monday)} - ${formatDate(sunday)})`;
    setWeeklyWeekRange(weekStr);

    // Default monthly period
    const curMonth = String(today.getMonth() + 1).padStart(2, '0');
    setMonthlyPeriod(`${today.getFullYear()}-${curMonth}`);
  }, []);

  const getWeekNumber = (d: Date): number => {
    const target = new Date(d.valueOf());
    const dayNr = (d.getDay() + 6) % 7;
    target.setDate(target.getDate() - dayNr + 3);
    const firstThursday = target.valueOf();
    target.setMonth(0, 1);
    if (target.getDay() !== 4) {
      target.setMonth(0, 1 + ((4 - target.getDay()) + 7) % 7);
    }
    return 1 + Math.ceil((firstThursday - target.valueOf()) / 604800000);
  };

  // Helper to prefill from system stock for weekly/monthly
  const handlePrefillWeeklyFromSystem = () => {
    const initialCounts: Record<string, string> = {};
    inventory.forEach(item => {
      initialCounts[item.product] = item.remaining.toString();
    });
    setWeeklyCounts(initialCounts);
  };

  const handlePrefillMonthlyFromSystem = () => {
    const initialCounts: Record<string, string> = {};
    inventory.forEach(item => {
      initialCounts[item.product] = item.remaining.toString();
    });
    setMonthlyCounts(initialCounts);
  };

  // Open modal for specific product quick edit
  const handleOpenModal = (productName: string) => {
    setSelectedProduct(productName);
    setTransactionType('Receive');
    setAmount('');
    setRemark('');
    setModalError(null);
    setModalSuccess(false);
    setIsModalOpen(true);
  };

  // Submit quick stock transaction
  const handleTransactionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError(null);

    if (!selectedProduct) {
      setModalError('กรุณาเลือกรายการสินค้าวัตถุดิบ');
      return;
    }

    const parsedAmount = parseFloat(amount) || 0;

    if (parsedAmount <= 0) {
      setModalError('จำนวนต้องมีค่ามากกว่าศูนย์');
      return;
    }

    const item = inventory.find(i => i.product === selectedProduct);
    if (transactionType === 'Use' && item && item.remaining < parsedAmount) {
      const displayProd = getProductTh(selectedProduct);
      setModalError(`ข้อผิดพลาดการตรวจสอบ: วัตถุดิบ "${displayProd}" ในคลังมีไม่เพียงพอ! คงเหลือเพียง ${item.remaining} ${item.unit === 'KG' ? 'กก.' : item.unit} เท่านั้น!`);
      return;
    }

    try {
      await addInventoryTransaction(selectedProduct, transactionType, parsedAmount, remark);
      setModalSuccess(true);
      setTimeout(() => {
        setIsModalOpen(false);
        setModalSuccess(false);
      }, 1200);
    } catch (err: any) {
      setModalError(err.message || 'ไม่สามารถบันทึกการปรับปรุงคลังสินค้าได้');
    }
  };

  const handleOpenThresholdModal = (productName: string, currentThreshold: number) => {
    setThresholdProduct(productName);
    setThresholdValue(currentThreshold.toString());
    setThresholdError(null);
    setThresholdSuccess(false);
    setIsThresholdModalOpen(true);
  };

  const handleThresholdSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setThresholdError(null);
    setThresholdSuccess(false);

    if (!thresholdProduct) {
      setThresholdError('กรุณาเลือกรายการสินค้าวัตถุดิบ');
      return;
    }

    const parsedThreshold = parseFloat(thresholdValue);
    if (isNaN(parsedThreshold) || parsedThreshold < 0) {
      setThresholdError('ค่าเกณฑ์สต็อกต่ำสุดต้องเป็นตัวเลขมากกว่าหรือเท่ากับศูนย์');
      return;
    }

    try {
      await updateInventoryThreshold(thresholdProduct, parsedThreshold);
      setThresholdSuccess(true);
      setTimeout(() => {
        setIsThresholdModalOpen(false);
        setThresholdSuccess(false);
      }, 1200);
    } catch (err: any) {
      setThresholdError(err.message || 'ไม่สามารถบันทึกเกณฑ์แจ้งเตือนสต็อกได้');
    }
  };

  // --- SUBMIT WEEKLY AUDIT ---
  const handleWeeklyAuditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setWeeklyError(null);
    setWeeklySuccess(false);

    const auditor = weeklyAuditor === 'custom' ? customWeeklyAuditor : weeklyAuditor;
    if (!auditor.trim()) {
      setWeeklyError('กรุณาระบุชื่อผู้ตรวจสอบคลังสินค้า');
      return;
    }

    if (!weeklyWeekRange.trim()) {
      setWeeklyError('กรุณาระบุช่วงเวลาสัปดาห์ที่ตรวจสอบ');
      return;
    }

    // Prepare items list
    const auditItems = inventory.map(item => {
      const inputVal = weeklyCounts[item.product];
      const physicalVal = parseFloat(inputVal) || 0;
      const systemVal = item.remaining;
      const difference = Math.round((physicalVal - systemVal) * 100) / 100;
      return {
        product: item.product,
        systemStock: systemVal,
        physicalStock: physicalVal,
        difference
      };
    });

    try {
      await addWeeklyAudit({
        weekRange: weeklyWeekRange,
        auditorName: auditor,
        items: auditItems,
        remark: weeklyRemark
      });

      setWeeklySuccess(true);
      setWeeklyRemark('');
      // reset audit counts on next tick
      setTimeout(() => {
        setWeeklySuccess(false);
      }, 3000);
    } catch (err: any) {
      setWeeklyError(err.message || 'เกิดข้อผิดพลาดในการบันทึกตรวจนับรายสัปดาห์');
    }
  };

  // --- SUBMIT MONTHLY AUDIT ---
  const handleMonthlyAuditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMonthlyError(null);
    setMonthlySuccess(false);

    const auditor = monthlyAuditor === 'custom' ? customMonthlyAuditor : monthlyAuditor;
    if (!auditor.trim()) {
      setMonthlyError('กรุณาระบุชื่อผู้จัดการร้านผู้ตรวจสอบ');
      return;
    }

    if (!monthlyPeriod) {
      setMonthlyError('กรุณาเลือกเดือนที่ทำการปิดรอบ');
      return;
    }

    // Format display month name
    const [year, month] = monthlyPeriod.split('-');
    const thaiMonths = [
      'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
      'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
    ];
    const monthIndex = parseInt(month) - 1;
    const auditMonthDisplay = `${thaiMonths[monthIndex]} ${parseInt(year) + 543}`;

    // Prepare items list
    const auditItems = inventory.map(item => {
      const inputVal = monthlyCounts[item.product];
      const physicalVal = parseFloat(inputVal) || 0;
      const systemVal = item.remaining;
      const difference = Math.round((physicalVal - systemVal) * 100) / 100;
      return {
        product: item.product,
        systemStock: systemVal,
        physicalStock: physicalVal,
        difference
      };
    });

    try {
      await addMonthlyAudit({
        auditMonth: auditMonthDisplay,
        auditorName: auditor,
        items: auditItems,
        remark: monthlyRemark
      }, monthlyRollover);

      setMonthlySuccess(true);
      setMonthlyRemark('');
      setTimeout(() => {
        setMonthlySuccess(false);
      }, 3000);
    } catch (err: any) {
      setMonthlyError(err.message || 'เกิดข้อผิดพลาดในการบันทึกตรวจนับรายเดือน');
    }
  };

  // Filter employees for role dropdowns
  const assistantManagers = employees.filter(e => e.active && (e.role === 'AssistantManager' || e.role === 'Manager' || e.role === 'Admin'));
  const managers = employees.filter(e => e.active && (e.role === 'Manager' || e.role === 'Admin'));

  // Role gating helpers
  const isAssistantManagerOrHigher = profile?.role === 'AssistantManager' || profile?.role === 'Manager' || profile?.role === 'Admin';
  const isManagerOrHigher = profile?.role === 'Manager' || profile?.role === 'Admin';

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col gap-8 pb-16"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-mono font-bold uppercase tracking-widest text-brand-orange bg-brand-orange/10 px-3 py-1 rounded-full">
            สินทรัพย์และวัตถุดิบร้าน
          </span>
          <h1 className="text-3xl font-extrabold tracking-tight text-gray-950 mt-2">
            ระบบจัดการคลังสินค้าและวัตถุดิบ
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            ตรวจนับและบริหารสต็อกสินค้า จัดการการเบิกออก รายงานยอดขาดหาย และประมวลผลยกยอดปลายสัปดาห์/สิ้นเดือน
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={() => handleOpenModal(inventory[0]?.product || '')}
            className="py-2.5 px-4 orange-gradient text-white hover:opacity-90 active:scale-95 text-xs font-semibold rounded-xl flex items-center gap-2 shadow-md shadow-orange-500/10 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            ปรับปรุงยอดคลังสะสม
          </button>
        </div>
      </div>

      {/* Tabs Selector */}
      <div className="flex border-b border-orange-100/40 p-1 bg-gray-50 rounded-2xl gap-1 self-start">
        <button
          onClick={() => setActiveTab('current')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'current' 
              ? 'bg-white text-brand-orange shadow-xs' 
              : 'text-gray-500 hover:text-gray-900'
          }`}
        >
          <Package className="w-4 h-4" />
          คลังสินค้าปัจจุบัน
        </button>
        <button
          onClick={() => setActiveTab('weekly')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'weekly' 
              ? 'bg-white text-brand-orange shadow-xs' 
              : 'text-gray-500 hover:text-gray-900'
          }`}
        >
          <ClipboardList className="w-4 h-4" />
          ตรวจนับรายสัปดาห์ (รองผู้จัดการ)
        </button>
        <button
          onClick={() => setActiveTab('monthly')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'monthly' 
              ? 'bg-white text-brand-orange shadow-xs' 
              : 'text-gray-500 hover:text-gray-900'
          }`}
        >
          <Calendar className="w-4 h-4" />
          ปิดยอดสิ้นเดือน (ผู้จัดการ)
        </button>
      </div>

      {/* Active Tab rendering */}
      <AnimatePresence mode="wait">
        {activeTab === 'current' && (
          <motion.div
            key="current"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex flex-col gap-6"
          >
            {/* Stats Summary cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              <div className="bg-white rounded-2xl p-5 border border-orange-100/40 shadow-2xs flex items-center gap-4">
                <div className="p-3.5 bg-orange-50 text-brand-orange rounded-2xl">
                  <Package className="w-5 h-5" />
                </div>
                <div>
                  <span className="block text-[10px] font-mono font-bold text-gray-400 uppercase">รายการคลังทั้งหมด</span>
                  <span className="text-xl font-bold font-display text-gray-950">{inventory.length} รายการ</span>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-5 border border-orange-100/40 shadow-2xs flex items-center gap-4">
                <div className="p-3.5 bg-rose-50 text-rose-500 rounded-2xl">
                  <AlertCircle className="w-5 h-5" />
                </div>
                <div>
                  <span className="block text-[10px] font-mono font-bold text-gray-400 uppercase">แจ้งเตือนวัตถุดิบใกล้หมด</span>
                  <span className="text-xl font-bold font-display text-rose-600">
                    {inventory.filter(i => i.remaining <= i.lowStockThreshold).length} รายการ
                  </span>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-5 border border-orange-100/40 shadow-2xs flex items-center gap-4">
                <div className="p-3.5 bg-emerald-50 text-emerald-500 rounded-2xl">
                  <History className="w-5 h-5" />
                </div>
                <div>
                  <span className="block text-[10px] font-mono font-bold text-gray-400 uppercase">ประวัติปรับปรุงทั้งหมด</span>
                  <span className="text-xl font-bold font-display text-gray-950">{inventoryLogs.length} ครั้ง</span>
                </div>
              </div>
            </div>

            {/* Grid: Main Inventory List & History */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Column 1 & 2: Inventory Grid */}
              <div className="lg:col-span-2 flex flex-col gap-4">
                {/* Filters and search panel */}
                <div className="bg-white border border-orange-100/30 p-4 rounded-2xl shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="relative w-full sm:w-72">
                    <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input 
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full h-10 pl-9 pr-4 rounded-xl border border-orange-100/60 text-xs font-semibold focus:outline-none focus:border-brand-orange bg-orange-50/10"
                      placeholder="ค้นหาชื่อวัตถุดิบ..."
                    />
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                    <Filter className="w-3.5 h-3.5 text-gray-400" />
                    <select
                      value={filterType}
                      onChange={(e: any) => setFilterType(e.target.value)}
                      className="h-10 px-3 py-1 bg-white border border-orange-100/60 rounded-xl text-xs font-bold text-gray-600 focus:outline-none focus:border-brand-orange"
                    >
                      <option value="all">แสดงทั้งหมด</option>
                      <option value="low">ใกล้หมด (เหลือน้อย)</option>
                      <option value="normal">สต็อกปกติ</option>
                    </select>
                  </div>
                </div>

                {/* Inventory Grid List */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {filteredInventory.map(item => {
                    const isLow = item.remaining <= item.lowStockThreshold;
                    const displayProduct = getProductTh(item.product);
                    return (
                      <div 
                        key={item.id}
                        className={`bg-white border p-5 rounded-2xl shadow-2xs flex flex-col justify-between gap-4 transition-all hover:shadow-xs relative overflow-hidden ${isLow ? 'border-rose-100/80 bg-rose-50/5' : 'border-orange-100/30'}`}
                      >
                        {isLow && (
                          <div className="absolute top-0 right-0 bg-rose-500 text-white text-[8px] font-mono font-bold tracking-widest px-2.5 py-0.5 rounded-bl-lg uppercase">
                            Low Stock
                          </div>
                        )}

                        <div>
                          <div className="flex items-center gap-2">
                            <span className="p-2 bg-gray-50 rounded-lg text-gray-600">
                              <Package className="w-4 h-4" />
                            </span>
                            <div>
                              <h3 className="text-sm font-extrabold text-gray-950 leading-tight">{displayProduct}</h3>
                              <span className="text-[10px] font-mono font-bold text-gray-400 tracking-wider uppercase">{item.product}</span>
                            </div>
                          </div>

                          <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-dashed border-gray-100">
                            <div>
                              <span className="block text-[8px] font-mono font-bold text-gray-400 uppercase">ยอดยกมา</span>
                              <span className="text-xs font-bold font-mono text-gray-950">{item.beginningStock}</span>
                            </div>
                            <div>
                              <span className="block text-[8px] font-mono font-bold text-gray-400 uppercase text-emerald-600">รับเข้า (+)</span>
                              <span className="text-xs font-bold font-mono text-emerald-600">+{item.receive}</span>
                            </div>
                            <div>
                              <span className="block text-[8px] font-mono font-bold text-gray-400 uppercase text-rose-500">เบิกใช้ (-)</span>
                              <span className="text-xs font-bold font-mono text-rose-500">-{item.use}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col gap-2.5 mt-1 pt-3 border-t border-orange-100/20">
                          <div className="flex items-center justify-between">
                            <div>
                              <span className="block text-[9px] font-mono font-bold text-gray-400 uppercase">คงเหลือจริง</span>
                              <span className={`text-base font-extrabold font-mono ${isLow ? 'text-rose-600' : 'text-brand-orange'}`}>
                                {item.remaining} <span className="text-xs font-medium font-sans text-gray-500">{item.unit}</span>
                              </span>
                            </div>

                            <button 
                              onClick={() => handleOpenModal(item.product)}
                              className="py-1.5 px-3 bg-gray-50 hover:bg-orange-50 hover:text-brand-orange border border-gray-100 text-[10px] font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer"
                            >
                              <RefreshCw className="w-3 h-3" />
                              ปรับยอด
                            </button>
                          </div>

                          <div className="flex items-center justify-between text-[10px] bg-gray-50/60 hover:bg-orange-50/50 p-2 rounded-xl transition-all border border-gray-100/50">
                            <span className="text-gray-500 font-medium">เกณฑ์เตือนสต็อกต่ำ:</span>
                            <button
                              onClick={() => handleOpenThresholdModal(item.product, item.lowStockThreshold)}
                              className="font-mono font-bold text-gray-800 hover:text-brand-orange bg-white hover:bg-orange-100/20 px-2 py-0.5 rounded-lg border border-gray-200/60 shadow-2xs flex items-center gap-1 transition-all cursor-pointer"
                              title="คลิกเพื่อแก้ไขเกณฑ์แจ้งเตือนสต็อกต่ำ"
                            >
                              {item.lowStockThreshold} {item.unit}
                              <Settings className="w-3 h-3 text-gray-400 hover:text-brand-orange" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  {filteredInventory.length === 0 && (
                    <div className="col-span-2 py-12 text-center text-gray-400 font-medium text-xs">
                      ไม่พบคลังสินค้าหรือวัตถุดิบที่ค้นหา
                    </div>
                  )}
                </div>
              </div>

              {/* Column 3: History of transactions */}
              <div className="bg-white border border-orange-100/30 rounded-2xl p-5 shadow-2xs flex flex-col gap-4 self-start">
                <div className="flex items-center justify-between border-b border-orange-100/10 pb-3">
                  <h3 className="font-extrabold text-sm text-gray-950 flex items-center gap-2">
                    <History className="w-4 h-4 text-brand-orange" />
                    บันทึกการปรับปรุงล่าสุด
                  </h3>
                  <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded-full bg-orange-50 text-brand-orange">
                    {inventoryLogs.length} รายการ
                  </span>
                </div>

                <div className="flex flex-col gap-3.5 max-h-[460px] overflow-y-auto pr-1">
                  {inventoryLogs.slice().reverse().map((log) => {
                    const isReceive = log.type === 'Receive';
                    const isBeginning = log.type === 'Beginning';
                    const displayProd = getProductTh(log.product);
                    return (
                      <div key={log.id} className="border-b border-gray-50 pb-3 last:border-0 last:pb-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-start gap-2">
                            <span className={`p-1.5 rounded-lg mt-0.5 flex-shrink-0 ${
                              isBeginning 
                                ? 'bg-orange-50 text-brand-orange' 
                                : isReceive 
                                ? 'bg-emerald-50 text-emerald-600' 
                                : 'bg-rose-50 text-rose-500'
                            }`}>
                              {isBeginning ? <Layers className="w-3.5 h-3.5" /> : isReceive ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownLeft className="w-3.5 h-3.5" />}
                            </span>
                            <div>
                              <h4 className="text-xs font-bold text-gray-950">{displayProd}</h4>
                              <p className="text-[10px] text-gray-400 mt-0.5">
                                ผู้บันทึก: {log.employeeName}
                              </p>
                              {log.remark && (
                                <p className="text-[10px] text-gray-500 italic mt-0.5">"{log.remark}"</p>
                              )}
                            </div>
                          </div>

                          <div className="text-right">
                            <span className={`text-xs font-extrabold font-mono ${
                              isBeginning 
                                ? 'text-gray-800' 
                                : isReceive 
                                ? 'text-emerald-600' 
                                : 'text-rose-500'
                            }`}>
                              {isBeginning ? 'เริ่ม' : isReceive ? '+' : '-'}{log.amount}
                            </span>
                            <span className="block text-[8px] text-gray-400 font-mono mt-0.5">
                              {new Date(log.timestamp).toLocaleDateString('th-TH', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  {inventoryLogs.length === 0 && (
                    <div className="text-center py-8 text-gray-400 text-xs">
                      ไม่มีบันทึกประวัติการปรับปรุง
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Weekly Audit Tab */}
        {activeTab === 'weekly' && (
          <motion.div
            key="weekly"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-8"
          >
            {/* Form Column */}
            <div className="lg:col-span-2 flex flex-col gap-6">
              <div className="bg-white border border-orange-100/30 p-6 rounded-3xl shadow-2xs">
                <div className="flex items-center justify-between border-b border-orange-100/10 pb-4 mb-5">
                  <div>
                    <h2 className="text-lg font-extrabold text-gray-950 flex items-center gap-2">
                      <ClipboardList className="w-5 h-5 text-brand-orange" />
                      แบบฟอร์มบันทึกตรวจนับสต็อกรายสัปดาห์
                    </h2>
                    <p className="text-[11px] text-gray-500 mt-1">อ้างอิงยอดเหลือในระบบเพื่อตรวจหาจุดแตกต่างที่สูญหายหรือขาดสต็อก</p>
                  </div>
                  <button 
                    type="button"
                    onClick={handlePrefillWeeklyFromSystem}
                    className="py-1.5 px-3 bg-orange-50 text-brand-orange hover:bg-orange-100 text-[10px] font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    ดึงยอดเหลือจากระบบทั้งหมด
                  </button>
                </div>

                {/* Role Warning */}
                {!isAssistantManagerOrHigher && (
                  <div className="mb-5 p-3.5 bg-yellow-50/60 border border-yellow-200/50 rounded-2xl flex items-start gap-2.5">
                    <AlertTriangle className="w-4 h-4 text-yellow-600 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-xs font-bold text-yellow-800">สำหรับรองผู้จัดการขึ้นไป</h4>
                      <p className="text-[10px] text-yellow-700/80 mt-0.5">การตรวจสอบนับรายสัปดาห์ต้องดำเนินการโดย "รองผู้จัดการ" หรือ "ผู้จัดการร้าน" เป็นหลัก แต่ระบบอนุญาตให้ทดสอบและบันทึกได้</p>
                    </div>
                  </div>
                )}

                <form onSubmit={handleWeeklyAuditSubmit} className="flex flex-col gap-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Auditor Select */}
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-mono font-bold uppercase text-gray-400">ผู้ตรวจสอบรายสัปดาห์ (รองผู้จัดการขึ้นไป)</label>
                      <select
                        value={weeklyAuditor}
                        onChange={(e) => setWeeklyAuditor(e.target.value)}
                        required
                        className="w-full h-11 px-4 rounded-xl border border-orange-100/60 focus:border-brand-orange focus:outline-none text-xs font-bold text-gray-800 bg-orange-50/5"
                      >
                        <option value="">-- เลือกผู้ตรวจสอบ --</option>
                        {assistantManagers.map(emp => (
                          <option key={emp.id} value={emp.name}>{emp.name} ({emp.role === 'AssistantManager' ? 'รองผู้จัดการ' : emp.role === 'Manager' ? 'ผู้จัดการร้าน' : 'ผู้ดูแลระบบ'})</option>
                        ))}
                        <option value="custom">พิมพ์ระบุชื่อเอง...</option>
                      </select>
                    </div>

                    {/* Custom Auditor Input */}
                    {weeklyAuditor === 'custom' && (
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-mono font-bold uppercase text-gray-400">ระบุชื่อผู้ตรวจสอบคลัง</label>
                        <input
                          type="text"
                          required
                          value={customWeeklyAuditor}
                          onChange={(e) => setCustomWeeklyAuditor(e.target.value)}
                          placeholder="ชื่อผู้ตรวจสอบ..."
                          className="w-full h-11 px-4 rounded-xl border border-orange-100/60 focus:border-brand-orange focus:outline-none text-xs font-bold"
                        />
                      </div>
                    )}

                    {/* Week range */}
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-mono font-bold uppercase text-gray-400">รอบสัปดาห์ที่ตรวจสอบ</label>
                      <input
                        type="text"
                        required
                        value={weeklyWeekRange}
                        onChange={(e) => setWeeklyWeekRange(e.target.value)}
                        placeholder="เช่น สัปดาห์ที่ 28 (13/07 - 20/07)"
                        className="w-full h-11 px-4 rounded-xl border border-orange-100/60 focus:border-brand-orange focus:outline-none text-xs font-mono font-bold text-gray-800 bg-orange-50/5"
                      />
                    </div>
                  </div>

                  {/* Table of items to edit physical stock */}
                  <div className="mt-4">
                    <label className="text-[10px] font-mono font-bold uppercase text-gray-400 block mb-3">กรอกจำนวนวัตถุดิบที่นับจริงหน้างาน</label>
                    
                    <div className="flex flex-col gap-3">
                      {inventory.map(item => {
                        const displayProduct = getProductTh(item.product);
                        const currentVal = weeklyCounts[item.product] || '0';
                        const physicalVal = parseFloat(currentVal) || 0;
                        const systemVal = item.remaining;
                        const difference = Math.round((physicalVal - systemVal) * 10) / 10;

                        return (
                          <div 
                            key={item.id} 
                            className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-gray-50/60 border border-gray-100 rounded-2xl"
                          >
                            <div className="flex items-center gap-2.5">
                              <span className="p-1.5 bg-white border border-orange-50 rounded-lg text-gray-500">
                                <Package className="w-3.5 h-3.5" />
                              </span>
                              <div>
                                <h4 className="text-xs font-bold text-gray-950">{displayProduct}</h4>
                                <span className="text-[9px] font-mono font-semibold text-gray-400 tracking-wider uppercase">{item.product} ({item.unit})</span>
                              </div>
                            </div>

                            <div className="flex items-center gap-4 justify-between sm:justify-end">
                              {/* System Stock display */}
                              <div className="text-left sm:text-right">
                                <span className="block text-[8px] font-mono font-bold text-gray-400 uppercase">ยอดในระบบ</span>
                                <span className="text-xs font-bold font-mono text-gray-800">{systemVal} {item.unit}</span>
                              </div>

                              {/* Physical Count input */}
                              <div className="w-28 flex flex-col gap-0.5">
                                <span className="block text-[8px] font-mono font-bold text-gray-400 uppercase">นับได้จริง</span>
                                <input
                                  type="text"
                                  inputMode="decimal"
                                  required
                                  value={currentVal}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    if (val === '' || /^\d*\.?\d*$/.test(val)) {
                                      setWeeklyCounts(prev => ({ ...prev, [item.product]: val }));
                                    }
                                  }}
                                  className="h-9 px-3 w-full rounded-lg border border-orange-100 text-xs font-bold font-mono text-center text-gray-950 focus:outline-none focus:border-brand-orange bg-white shadow-3xs"
                                  placeholder="0.0"
                                />
                              </div>

                              {/* Difference badge */}
                              <div className="w-24 text-right">
                                <span className="block text-[8px] font-mono font-bold text-gray-400 uppercase">ผลต่างสต็อก</span>
                                {difference === 0 ? (
                                  <span className="text-xs font-bold font-mono text-gray-400">ครบถ้วน</span>
                                ) : difference < 0 ? (
                                  <span className="text-xs font-extrabold font-mono text-rose-500">ขาด {difference} {item.unit}</span>
                                ) : (
                                  <span className="text-xs font-extrabold font-mono text-emerald-600">เกิน +{difference} {item.unit}</span>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Remark input */}
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-mono font-bold uppercase text-gray-400">หมายเหตุการตรวจสอบ</label>
                    <textarea
                      rows={2}
                      value={weeklyRemark}
                      onChange={(e) => setWeeklyRemark(e.target.value)}
                      placeholder="ระบุข้อสังเกต เช่น พบของขาดชำรุด หรือจำนวนเสียหายจากการแพ็ค..."
                      className="w-full p-4 rounded-xl border border-orange-100/60 focus:border-brand-orange focus:outline-none text-xs font-semibold text-gray-800 bg-orange-50/5"
                    />
                  </div>

                  {/* Success & Error alerts */}
                  {weeklyError && (
                    <div className="p-3 bg-rose-50 border border-rose-200 text-rose-600 text-xs font-bold rounded-xl flex items-center gap-2">
                      <AlertCircle className="w-4 h-4" />
                      {weeklyError}
                    </div>
                  )}

                  {weeklySuccess && (
                    <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-600 text-xs font-bold rounded-xl flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4" />
                      บันทึกรายงานการตรวจนับสต็อกรายสัปดาห์สำเร็จ
                    </div>
                  )}

                  <div className="flex items-center justify-end gap-3 mt-4 pt-4 border-t border-orange-100/10">
                    <button
                      type="submit"
                      disabled={syncing}
                      className="py-2.5 px-6 rounded-xl orange-gradient text-white hover:opacity-90 font-bold text-xs shadow-md shadow-orange-500/10 cursor-pointer flex items-center gap-2"
                    >
                      {syncing && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                      ส่งบันทึกตรวจนับสต็อกรายสัปดาห์
                    </button>
                  </div>
                </form>
              </div>
            </div>

            {/* History Column */}
            <div className="flex flex-col gap-6">
              <div className="bg-white border border-orange-100/30 p-5 rounded-2xl shadow-2xs">
                <div className="flex items-center justify-between border-b border-orange-100/10 pb-3 mb-4">
                  <h3 className="font-extrabold text-sm text-gray-950 flex items-center gap-2">
                    <ClipboardList className="w-4 h-4 text-brand-orange" />
                    ประวัติตรวจสต็อกรายสัปดาห์
                  </h3>
                  <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded-full bg-orange-50 text-brand-orange">
                    {weeklyAudits.length} ครั้ง
                  </span>
                </div>

                <div className="flex flex-col gap-4 max-h-[640px] overflow-y-auto pr-1">
                  {weeklyAudits.map((audit) => {
                    const shortages = audit.items.filter(item => item.difference < 0);
                    const surpluses = audit.items.filter(item => item.difference > 0);
                    const isExpanded = expandedWeeklyId === audit.id;

                    return (
                      <div 
                        key={audit.id} 
                        className="p-4 bg-gray-50/50 border border-gray-100 rounded-2xl hover:border-orange-100/30 transition-all flex flex-col gap-2.5 cursor-pointer"
                        onClick={() => setExpandedWeeklyId(isExpanded ? null : audit.id)}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h4 className="text-xs font-bold text-gray-950">{audit.weekRange}</h4>
                            <p className="text-[10px] text-gray-400 mt-1 flex items-center gap-1">
                              <Users className="w-3 h-3 text-gray-300" />
                              ผู้ตรวจ: {audit.auditorName}
                            </p>
                          </div>
                          <span className="text-[8px] font-mono text-gray-400">
                            {new Date(audit.timestamp).toLocaleDateString('th-TH')}
                          </span>
                        </div>

                        {/* Summary Badges */}
                        <div className="flex flex-wrap gap-1.5">
                          {shortages.length > 0 ? (
                            <span className="text-[8px] font-bold px-1.5 py-0.5 rounded-md bg-rose-50 text-rose-500 flex items-center gap-1">
                              <BadgeAlert className="w-2.5 h-2.5" />
                              ของขาด {shortages.length} รายการ
                            </span>
                          ) : (
                            <span className="text-[8px] font-bold px-1.5 py-0.5 rounded-md bg-emerald-50 text-emerald-600 flex items-center gap-1">
                              <Check className="w-2.5 h-2.5" />
                              สต็อกตรงครบถ้วน
                            </span>
                          )}
                          {surpluses.length > 0 && (
                            <span className="text-[8px] font-bold px-1.5 py-0.5 rounded-md bg-indigo-50 text-indigo-500">
                              ของเกิน {surpluses.length} รายการ
                            </span>
                          )}
                        </div>

                        {/* Expanded details */}
                        {isExpanded && (
                          <motion.div 
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            className="mt-2 pt-3 border-t border-orange-100/20 flex flex-col gap-2"
                          >
                            <span className="text-[9px] font-mono font-bold text-gray-400 uppercase">รายละเอียดผลการตรวจนับ:</span>
                            <div className="flex flex-col gap-1.5">
                              {audit.items.map((it, idx) => (
                                <div key={idx} className="flex justify-between items-center text-[10px] bg-white p-2 rounded-lg border border-gray-100/50">
                                  <span className="font-bold text-gray-800">{getProductTh(it.product)}</span>
                                  <div className="flex items-center gap-3 font-mono">
                                    <span className="text-gray-400">นับจริง: {it.physicalStock}</span>
                                    <span className="text-gray-300">|</span>
                                    {it.difference === 0 ? (
                                      <span className="text-gray-400">ตรง</span>
                                    ) : it.difference < 0 ? (
                                      <span className="text-rose-500 font-bold">ขาด {it.difference}</span>
                                    ) : (
                                      <span className="text-emerald-600 font-bold">เกิน +{it.difference}</span>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                            {audit.remark && (
                              <div className="bg-orange-50/30 p-2.5 rounded-lg border border-orange-100/30 mt-1">
                                <span className="block text-[8px] font-mono font-bold text-gray-400 uppercase">บันทึกช่วยจำ:</span>
                                <p className="text-[10px] text-gray-600 mt-0.5 italic">"{audit.remark}"</p>
                              </div>
                            )}
                          </motion.div>
                        )}

                        <div className="flex justify-center mt-1 text-gray-300">
                          {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                        </div>
                      </div>
                    );
                  })}
                  {weeklyAudits.length === 0 && (
                    <div className="text-center py-12 text-gray-400 text-xs">
                      ไม่มีประวัติการบันทึกตรวจนับรายสัปดาห์
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Monthly Audit Tab */}
        {activeTab === 'monthly' && (
          <motion.div
            key="monthly"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-8"
          >
            {/* Form Column */}
            <div className="lg:col-span-2 flex flex-col gap-6">
              <div className="bg-white border border-orange-100/30 p-6 rounded-3xl shadow-2xs">
                <div className="flex items-center justify-between border-b border-orange-100/10 pb-4 mb-5">
                  <div>
                    <h2 className="text-lg font-extrabold text-gray-950 flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-brand-orange" />
                      ระบบปิดยอดและยกยอดสต็อกรายเดือน
                    </h2>
                    <p className="text-[11px] text-gray-500 mt-1">สรุปข้อมูลเบิกจ่ายตลอดเดือน ประมวลยอดใช้จริง และตั้งต้นสต็อกสำหรับเดือนใหม่</p>
                  </div>
                  <button 
                    type="button"
                    onClick={handlePrefillMonthlyFromSystem}
                    className="py-1.5 px-3 bg-orange-50 text-brand-orange hover:bg-orange-100 text-[10px] font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    ดึงยอดจากระบบทั้งหมด
                  </button>
                </div>

                {/* Role Warning */}
                {!isManagerOrHigher && (
                  <div className="mb-5 p-3.5 bg-yellow-50/60 border border-yellow-200/50 rounded-2xl flex items-start gap-2.5">
                    <AlertTriangle className="w-4 h-4 text-yellow-600 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-xs font-bold text-yellow-800">สำหรับผู้จัดการร้านขึ้นไป</h4>
                      <p className="text-[10px] text-yellow-700/80 mt-0.5">การตรวจนับคลังสินค้าสิ้นเดือนและการประมวลปิดยอด rollover ต้องดำเนินการโดย "ผู้จัดการร้าน" เป็นหลัก แต่ระบบเปิดให้ท่านทดสอบได้</p>
                    </div>
                  </div>
                )}

                <form onSubmit={handleMonthlyAuditSubmit} className="flex flex-col gap-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Manager Auditor Select */}
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-mono font-bold uppercase text-gray-400">ผู้ตรวจสอบปิดยอด (ผู้จัดการร้านขึ้นไป)</label>
                      <select
                        value={monthlyAuditor}
                        onChange={(e) => setMonthlyAuditor(e.target.value)}
                        required
                        className="w-full h-11 px-4 rounded-xl border border-orange-100/60 focus:border-brand-orange focus:outline-none text-xs font-bold text-gray-800 bg-orange-50/5"
                      >
                        <option value="">-- เลือกผู้จัดการร้าน --</option>
                        {managers.map(emp => (
                          <option key={emp.id} value={emp.name}>{emp.name} (ผู้จัดการร้าน / Admin)</option>
                        ))}
                        <option value="custom">พิมพ์ระบุชื่อเอง...</option>
                      </select>
                    </div>

                    {/* Custom Auditor Input */}
                    {monthlyAuditor === 'custom' && (
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-mono font-bold uppercase text-gray-400">ระบุชื่อผู้ตรวจสอบคลัง</label>
                        <input
                          type="text"
                          required
                          value={customMonthlyAuditor}
                          onChange={(e) => setCustomMonthlyAuditor(e.target.value)}
                          placeholder="ชื่อผู้ปิดยอด..."
                          className="w-full h-11 px-4 rounded-xl border border-orange-100/60 focus:border-brand-orange focus:outline-none text-xs font-bold"
                        />
                      </div>
                    )}

                    {/* Month Period selection */}
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-mono font-bold uppercase text-gray-400">เลือกเดือนที่จะปิดรอบ</label>
                      <input
                        type="month"
                        required
                        value={monthlyPeriod}
                        onChange={(e) => setMonthlyPeriod(e.target.value)}
                        className="w-full h-11 px-4 rounded-xl border border-orange-100/60 focus:border-brand-orange focus:outline-none text-xs font-mono font-bold text-gray-800 bg-orange-50/5"
                      />
                    </div>
                  </div>

                  {/* Stock Audit Detail Table */}
                  <div className="mt-4">
                    <label className="text-[10px] font-mono font-bold uppercase text-gray-400 block mb-3">กรอกยอดตรวจนับจริงปลายเดือน และรายงานการใช้จริงสะสม</label>

                    <div className="flex flex-col gap-3.5">
                      {inventory.map(item => {
                        const displayProduct = getProductTh(item.product);
                        const currentVal = monthlyCounts[item.product] || '0';
                        const physicalVal = parseFloat(currentVal) || 0;
                        const systemRemaining = item.remaining;

                        // Actual usage throughout the month = Beginning + Receive - PhysicalStock
                        const actualUsage = Math.max(0, Math.round((item.beginningStock + item.receive - physicalVal) * 10) / 10);
                        const difference = Math.round((physicalVal - systemRemaining) * 10) / 10;

                        return (
                          <div 
                            key={item.id} 
                            className="p-4 bg-gray-50/60 border border-gray-100 rounded-2xl flex flex-col gap-3"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className="p-1.5 bg-white border border-orange-50 rounded-lg text-gray-500">
                                  <Package className="w-3.5 h-3.5" />
                                </span>
                                <div>
                                  <h4 className="text-xs font-bold text-gray-950">{displayProduct}</h4>
                                  <span className="text-[9px] font-mono font-semibold text-gray-400 uppercase tracking-wider">{item.product} ({item.unit})</span>
                                </div>
                              </div>

                              <div className="text-right">
                                <span className="block text-[8px] font-mono font-bold text-gray-400 uppercase">ประมาณการใช้ในระบบ</span>
                                <span className="text-xs font-bold font-mono text-gray-600">{item.use} {item.unit}</span>
                              </div>
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-white p-3 rounded-xl border border-gray-100/60">
                              <div>
                                <span className="block text-[8px] font-mono text-gray-400 uppercase">ยอดยกมา (ต้นเดือน)</span>
                                <span className="text-xs font-bold font-mono text-gray-800">{item.beginningStock}</span>
                              </div>
                              <div>
                                <span className="block text-[8px] font-mono text-emerald-600 uppercase">ยอดรับเข้าสะสม (+)</span>
                                <span className="text-xs font-bold font-mono text-emerald-600">+{item.receive}</span>
                              </div>
                              <div>
                                <span className="block text-[8px] font-mono text-indigo-500 uppercase">ยอดเหลือในระบบ</span>
                                <span className="text-xs font-extrabold font-mono text-indigo-600">{systemRemaining}</span>
                              </div>
                              <div className="border-t sm:border-t-0 sm:border-l border-gray-100 pt-2 sm:pt-0 sm:pl-3">
                                <span className="block text-[8px] font-mono text-rose-500 font-bold uppercase">ปริมาณใช้จริงทั้งเดือน</span>
                                <span className="text-xs font-extrabold font-mono text-rose-600">{actualUsage} {item.unit}</span>
                              </div>
                            </div>

                            <div className="flex items-center justify-between gap-3 pt-1">
                              {/* Physical Count */}
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] font-bold text-gray-600">นับจริงสิ้นเดือน:</span>
                                <input
                                  type="text"
                                  inputMode="decimal"
                                  required
                                  value={currentVal}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    if (val === '' || /^\d*\.?\d*$/.test(val)) {
                                      setMonthlyCounts(prev => ({ ...prev, [item.product]: val }));
                                    }
                                  }}
                                  className="h-8 w-24 px-2 rounded-lg border border-orange-100 text-xs font-bold font-mono text-center text-gray-950 focus:outline-none focus:border-brand-orange bg-white shadow-3xs"
                                  placeholder="0.0"
                                />
                              </div>

                              {/* Difference */}
                              <div className="text-right text-xs">
                                <span className="text-gray-400 mr-1 text-[10px]">สต็อกขาด/เกิน:</span>
                                {difference === 0 ? (
                                  <span className="font-bold text-gray-400">ลงตัว</span>
                                ) : difference < 0 ? (
                                  <span className="font-extrabold text-rose-500">ขาด {difference} {item.unit}</span>
                                ) : (
                                  <span className="font-extrabold text-emerald-600">เกิน +{difference} {item.unit}</span>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Rollover Confirm Toggle */}
                  <div className="p-4 bg-orange-50/40 border border-orange-100/60 rounded-2xl flex items-start gap-3 mt-2">
                    <input
                      type="checkbox"
                      id="rolloverToggle"
                      checked={monthlyRollover}
                      onChange={(e) => setMonthlyRollover(e.target.checked)}
                      className="mt-1 w-4 h-4 rounded text-brand-orange focus:ring-brand-orange cursor-pointer border-orange-200"
                    />
                    <div className="flex flex-col">
                      <label htmlFor="rolloverToggle" className="text-xs font-bold text-gray-900 cursor-pointer flex items-center gap-1">
                        <RefreshCw className="w-3.5 h-3.5 text-brand-orange animate-spin-slow" />
                        ปิดรอบและยกยอดคงเหลือนี้ไปเดือนหน้าโดยอัตโนมัติ
                      </label>
                      <p className="text-[10px] text-gray-500 mt-1 leading-relaxed">
                        ระบบจะล้างค่ารับเข้า-เบิกใช้ สะสมในคลังทั้งหมดเป็น 0 และตั้งต้น ยอดยกมาต้นเดือนหน้า ด้วยค่าตรวจนับปลายเดือนนี้ทันที พร้อมบันทึกประวัติย้อนหลังใน Google Sheets
                      </p>
                    </div>
                  </div>

                  {/* Remark */}
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-mono font-bold uppercase text-gray-400">หมายเหตุปิดบัญชีรายเดือน</label>
                    <textarea
                      rows={2}
                      value={monthlyRemark}
                      onChange={(e) => setMonthlyRemark(e.target.value)}
                      placeholder="ระบุข้อสังเกตความสูญเสียสต็อก หรือการเบิกจ่ายปรับสมดุลสิ้นปีงบ..."
                      className="w-full p-4 rounded-xl border border-orange-100/60 focus:border-brand-orange focus:outline-none text-xs font-semibold text-gray-800 bg-orange-50/5"
                    />
                  </div>

                  {/* Error and Success states */}
                  {monthlyError && (
                    <div className="p-3 bg-rose-50 border border-rose-200 text-rose-600 text-xs font-bold rounded-xl flex items-center gap-2">
                      <AlertCircle className="w-4 h-4" />
                      {monthlyError}
                    </div>
                  )}

                  {monthlySuccess && (
                    <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-600 text-xs font-bold rounded-xl flex items-center gap-2">
                      <FileCheck className="w-4 h-4" />
                      ประมวลผลปิดรอบและย้ายยอดสต็อกไปยังเดือนหน้าเสร็จสมบูรณ์
                    </div>
                  )}

                  <div className="flex items-center justify-end gap-3 mt-4 pt-4 border-t border-orange-100/10">
                    <button
                      type="submit"
                      disabled={syncing}
                      className="py-2.5 px-6 rounded-xl bg-gray-900 hover:bg-gray-800 text-white font-bold text-xs shadow-md shadow-gray-900/10 cursor-pointer flex items-center gap-2 transition-all"
                    >
                      {syncing && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                      ประมวลผลและปิดรอบสต็อกรายเดือน
                    </button>
                  </div>
                </form>
              </div>
            </div>

            {/* History Column */}
            <div className="flex flex-col gap-6">
              <div className="bg-white border border-orange-100/30 p-5 rounded-2xl shadow-2xs">
                <div className="flex items-center justify-between border-b border-orange-100/10 pb-3 mb-4">
                  <h3 className="font-extrabold text-sm text-gray-950 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-brand-orange" />
                    ประวัติการปิดรอบรายเดือน
                  </h3>
                  <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded-full bg-orange-50 text-brand-orange">
                    {monthlyAudits.length} ครั้ง
                  </span>
                </div>

                <div className="flex flex-col gap-4 max-h-[640px] overflow-y-auto pr-1">
                  {monthlyAudits.map((audit) => {
                    const isExpanded = expandedMonthlyId === audit.id;
                    return (
                      <div 
                        key={audit.id} 
                        className="p-4 bg-gray-50/50 border border-gray-100 rounded-2xl hover:border-orange-100/30 transition-all flex flex-col gap-2.5 cursor-pointer"
                        onClick={() => setExpandedMonthlyId(isExpanded ? null : audit.id)}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h4 className="text-xs font-bold text-gray-950">ปิดยอดประจำเดือน {audit.auditMonth}</h4>
                            <p className="text-[10px] text-gray-400 mt-1 flex items-center gap-1">
                              <UserCheck className="w-3 h-3 text-gray-300" />
                              ผู้ปิดบัญชี: {audit.auditorName}
                            </p>
                          </div>
                          <span className="text-[8px] font-mono text-gray-400">
                            {new Date(audit.timestamp).toLocaleDateString('th-TH')}
                          </span>
                        </div>

                        {/* Rollover indicator */}
                        <div className="flex flex-wrap gap-1.5">
                          {audit.rolloverProcessed ? (
                            <span className="text-[8px] font-bold px-1.5 py-0.5 rounded-md bg-emerald-50 text-emerald-600 flex items-center gap-1">
                              <RefreshCw className="w-2.5 h-2.5 animate-spin-slow" />
                              Rollover เรียบร้อย
                            </span>
                          ) : (
                            <span className="text-[8px] font-bold px-1.5 py-0.5 rounded-md bg-gray-100 text-gray-500">
                              เก็บสถิติอย่างเดียว
                            </span>
                          )}
                        </div>

                        {/* Expanded details */}
                        {isExpanded && (
                          <motion.div 
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            className="mt-2 pt-3 border-t border-orange-100/20 flex flex-col gap-2"
                          >
                            <span className="text-[9px] font-mono font-bold text-gray-400 uppercase">ปริมาณสต็อกปิดยอดสะสม:</span>
                            <div className="flex flex-col gap-1.5">
                              {audit.items.map((it, idx) => (
                                <div key={idx} className="flex justify-between items-center text-[10px] bg-white p-2 rounded-lg border border-gray-100/50">
                                  <span className="font-bold text-gray-800">{getProductTh(it.product)}</span>
                                  <div className="flex items-center gap-3 font-mono">
                                    <span className="text-gray-400">นับจริง: {it.physicalStock}</span>
                                    <span className="text-gray-300">|</span>
                                    {it.difference === 0 ? (
                                      <span className="text-gray-400">ตรง</span>
                                    ) : it.difference < 0 ? (
                                      <span className="text-rose-500 font-bold">ขาด {it.difference}</span>
                                    ) : (
                                      <span className="text-emerald-600 font-bold">เกิน +{it.difference}</span>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                            {audit.remark && (
                              <div className="bg-orange-50/30 p-2.5 rounded-lg border border-orange-100/30 mt-1">
                                <span className="block text-[8px] font-mono font-bold text-gray-400 uppercase">บันทึกปิดรอบ:</span>
                                <p className="text-[10px] text-gray-600 mt-0.5 italic">"{audit.remark}"</p>
                              </div>
                            )}
                          </motion.div>
                        )}

                        <div className="flex justify-center mt-1 text-gray-300">
                          {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                        </div>
                      </div>
                    );
                  })}
                  {monthlyAudits.length === 0 && (
                    <div className="text-center py-12 text-gray-400 text-xs">
                      ไม่มีประวัติการบันทึกตรวจนับรายเดือน
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Quick transaction adjustment modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-xs">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl p-6 max-w-md w-full border border-orange-100 shadow-xl flex flex-col gap-4 relative"
            >
              <button 
                onClick={() => setIsModalOpen(false)}
                className="absolute top-4 right-4 p-1 rounded-lg hover:bg-gray-100 text-gray-400 transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-2.5 border-b border-orange-100/10 pb-3">
                <span className="p-2 bg-orange-50 text-brand-orange rounded-xl">
                  <Package className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="font-extrabold text-sm text-gray-950">ปรับปรุงปริมาณคลังสะสม</h3>
                  <p className="text-[10px] text-gray-500">บันทึกรายการรับเข้า หรือเบิกของใช้ออกไปจากสต็อก</p>
                </div>
              </div>

              {modalSuccess ? (
                <div className="py-8 flex flex-col items-center justify-center gap-3 text-center">
                  <div className="p-3 bg-emerald-50 text-emerald-500 rounded-full animate-bounce">
                    <Check className="w-8 h-8" />
                  </div>
                  <h4 className="text-sm font-bold text-gray-950">บันทึกปรับปรุงสต็อกสำเร็จแล้ว!</h4>
                  <p className="text-[10px] text-gray-500">ยอดคงเหลือจริงจะคำนวณและอัปเดตเรียบร้อย</p>
                </div>
              ) : (
                <form onSubmit={handleTransactionSubmit} className="flex flex-col gap-4">
                  
                  {/* Select product */}
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-mono font-bold uppercase text-gray-400">เลือกวัตถุดิบ / สินค้า</label>
                    <select
                      value={selectedProduct}
                      onChange={(e) => setSelectedProduct(e.target.value)}
                      required
                      className="w-full h-11 px-4 rounded-xl border border-orange-100/60 focus:border-brand-orange focus:outline-none text-xs font-bold text-gray-800 bg-orange-50/5"
                    >
                      <option value="">-- เลือกรายการ --</option>
                      {inventory.map(item => (
                        <option key={item.id} value={item.product}>{getProductTh(item.product)} ({item.product})</option>
                      ))}
                    </select>
                  </div>

                  {/* Transaction Type */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-mono font-bold uppercase text-gray-400">ประเภทรายการปรับปรุง</label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setTransactionType('Receive')}
                        className={`py-2 px-4 rounded-xl text-xs font-semibold cursor-pointer border flex items-center justify-center gap-1.5 transition-all ${transactionType === 'Receive' ? 'bg-emerald-500 border-emerald-500 text-white shadow-md shadow-emerald-500/10' : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'}`}
                      >
                        <ArrowUpRight className="w-4 h-4" />
                        รับสินค้าเข้าคลัง
                      </button>

                      <button
                        type="button"
                        onClick={() => setTransactionType('Use')}
                        className={`py-2 px-4 rounded-xl text-xs font-semibold cursor-pointer border flex items-center justify-center gap-1.5 transition-all ${transactionType === 'Use' ? 'bg-rose-500 border-rose-500 text-white shadow-md shadow-rose-500/10' : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'}`}
                      >
                        <ArrowDownLeft className="w-4 h-4" />
                        เบิกใช้/จ่ายออก
                      </button>
                    </div>
                  </div>

                  {/* Quantity input */}
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-mono font-bold uppercase text-gray-400">จำนวนที่ปรับปรุง</label>
                    <input 
                      type="text"
                      inputMode="decimal"
                      required
                      value={amount}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === '' || /^\d*\.?\d*$/.test(val)) {
                          setAmount(val);
                        }
                      }}
                      className="w-full h-11 px-4 rounded-xl border border-orange-100 glass-input text-sm font-bold font-mono text-gray-950"
                      placeholder="ระบุจำนวน..."
                    />
                  </div>

                  {/* Remarks input */}
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-mono font-bold uppercase text-gray-400">บันทึกช่วยจำ / หมายเหตุ</label>
                    <input 
                      type="text"
                      value={remark}
                      onChange={(e) => setRemark(e.target.value)}
                      className="w-full h-11 px-4 rounded-xl border border-orange-100 glass-input text-sm font-semibold"
                      placeholder="เช่น รับของเข้าจากแม็คโคร, เบิกข้าวสารเพิ่มรอบสัปดาห์..."
                    />
                  </div>

                  {modalError && (
                    <div className="p-3 bg-rose-50 border border-rose-200 text-rose-600 text-xs font-bold rounded-xl flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 animate-pulse" />
                      {modalError}
                    </div>
                  )}

                  <div className="flex items-center justify-end gap-3 mt-4 pt-3 border-t border-orange-100/30">
                    <button 
                      type="button" 
                      onClick={() => setIsModalOpen(false)}
                      className="py-2 px-4 rounded-xl hover:bg-gray-100 font-semibold text-xs text-gray-500 cursor-pointer"
                    >
                      ยกเลิก
                    </button>
                    <button 
                      type="submit"
                      disabled={syncing}
                      className="py-2 px-5 rounded-xl orange-gradient text-white hover:opacity-90 font-bold text-xs shadow-md shadow-orange-500/10 cursor-pointer"
                    >
                      บันทึกการปรับยอดสต็อก
                    </button>
                  </div>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Threshold adjustment modal */}
      <AnimatePresence>
        {isThresholdModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-xs">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl p-6 max-w-md w-full border border-orange-100 shadow-xl flex flex-col gap-4 relative"
            >
              <button 
                onClick={() => setIsThresholdModalOpen(false)}
                className="absolute top-4 right-4 p-1 rounded-lg hover:bg-gray-100 text-gray-400 transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-2.5 border-b border-orange-100/10 pb-3">
                <span className="p-2 bg-orange-50 text-brand-orange rounded-xl">
                  <Settings className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="font-extrabold text-sm text-gray-950">ตั้งเกณฑ์สต็อกขั้นต่ำ</h3>
                  <p className="text-[10px] text-gray-500">กำหนดจุดแจ้งเตือนเมื่อสินค้าใกล้หมดคลัง</p>
                </div>
              </div>

              {thresholdSuccess ? (
                <div className="py-8 flex flex-col items-center justify-center gap-3 text-center">
                  <div className="p-3 bg-emerald-50 text-emerald-500 rounded-full animate-bounce">
                    <Check className="w-8 h-8" />
                  </div>
                  <h4 className="text-sm font-bold text-gray-950">ตั้งเกณฑ์สต็อกสำเร็จ!</h4>
                  <p className="text-[10px] text-gray-500">ระบบจะส่งการแจ้งเตือนเมื่อของต่ำกว่าค่านี้</p>
                </div>
              ) : (
                <form onSubmit={handleThresholdSubmit} className="flex flex-col gap-4">
                  
                  {/* Display selected product name */}
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-mono font-bold uppercase text-gray-400">วัตถุดิบ / สินค้า</span>
                    <span className="text-xs font-bold text-gray-800 bg-gray-50 p-2.5 rounded-xl border border-gray-100">
                      {getProductTh(thresholdProduct)} ({thresholdProduct})
                    </span>
                  </div>

                  {/* Threshold value input */}
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-mono font-bold uppercase text-gray-400">เกณฑ์เตือนสต็อกต่ำสุด</label>
                    <div className="relative">
                      <input 
                        type="text"
                        inputMode="decimal"
                        required
                        value={thresholdValue}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val === '' || /^\d*\.?\d*$/.test(val)) {
                            setThresholdValue(val);
                          }
                        }}
                        className="w-full h-11 pl-4 pr-16 rounded-xl border border-orange-100 glass-input text-sm font-bold font-mono text-gray-950"
                        placeholder="ระบุเกณฑ์ขั้นต่ำ..."
                      />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400 font-mono">
                        {inventory.find(i => i.product === thresholdProduct)?.unit || ''}
                      </div>
                    </div>
                    <p className="text-[9px] text-gray-400 leading-relaxed mt-1">
                      เมื่อจำนวนคงเหลือจริง น้อยกว่าหรือเท่ากับ ค่านี้ ระบบจะทำการส่งแจ้งเตือนและไฮไลท์แถบเตือนสีแดงในหน้าคลังสินค้าและแดชบอร์ดทันที
                    </p>
                  </div>

                  {thresholdError && (
                    <div className="p-3 bg-rose-50 border border-rose-200 text-rose-600 text-xs font-bold rounded-xl flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 animate-pulse" />
                      {thresholdError}
                    </div>
                  )}

                  <div className="flex items-center justify-end gap-3 mt-4 pt-3 border-t border-orange-100/30">
                    <button 
                      type="button" 
                      onClick={() => setIsThresholdModalOpen(false)}
                      className="py-2 px-4 rounded-xl hover:bg-gray-100 font-semibold text-xs text-gray-500 cursor-pointer"
                    >
                      ยกเลิก
                    </button>
                    <button 
                      type="submit"
                      disabled={syncing}
                      className="py-2 px-5 rounded-xl orange-gradient text-white hover:opacity-90 font-bold text-xs shadow-md shadow-orange-500/10 cursor-pointer"
                    >
                      บันทึกเกณฑ์เตือนสต็อก
                    </button>
                  </div>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
