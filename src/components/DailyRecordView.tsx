import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Flame, Calendar, Users, Scale, DollarSign, Calculator, ChevronRight, CheckCircle, AlertTriangle, ArrowLeftRight, HelpCircle, Plus, Trash2, Percent, Receipt
} from 'lucide-react';
import { useDatabase } from '../context/DatabaseContext';
import { getRoleTh } from '../types';

interface DailyRecordViewProps {
  setView: (view: 'dashboard' | 'daily-record' | 'inventory' | 'expenses' | 'reports' | 'employees' | 'analytics') => void;
}

export const DailyRecordView: React.FC<DailyRecordViewProps> = ({ setView }) => {
  const { employees, salesRecords, inventory, addSalesRecord } = useDatabase();
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [employeeName, setEmployeeName] = useState<string>('');
  const [remark, setRemark] = useState<string>('');

  // Pork stats (using string states to allow typing decimals)
  const [porkBeforeFry, setPorkBeforeFry] = useState<string>('');
  const [porkAfterFry, setPorkAfterFry] = useState<string>('');
  const [previousRemainingStock, setPreviousRemainingStock] = useState<string>('0');
  const [remainingStockAfterSales, setRemainingStockAfterSales] = useState<string>('');

  // Finances
  const [salesAmount, setSalesAmount] = useState<number>(0);
  const [cash, setCash] = useState<number>(0);
  const [moneyTransfer, setMoneyTransfer] = useState<number>(0);
  const [thaiChuayThai, setThaiChuayThai] = useState<number>(0);
  const [lineMan, setLineMan] = useState<number>(0);
  const [grab, setGrab] = useState<number>(0);
  const [expense, setExpense] = useState<number>(0);

  // Shift Petty Cash Expenses states
  const [shiftExpensesDetail, setShiftExpensesDetail] = useState<{ description: string; amount: string; }[]>([]);
  // Promotional Discounts states
  const [promoDiscounts, setPromoDiscounts] = useState<{ description: string; amount: string; }[]>([]);

  const handleAddShiftExpense = () => {
    setShiftExpensesDetail([...shiftExpensesDetail, { description: '', amount: '' }]);
  };

  const handleUpdateShiftExpense = (index: number, field: 'description' | 'amount', value: string) => {
    const updated = [...shiftExpensesDetail];
    updated[index] = {
      ...updated[index],
      [field]: value
    };
    setShiftExpensesDetail(updated);
  };

  const handleRemoveShiftExpense = (index: number) => {
    setShiftExpensesDetail(shiftExpensesDetail.filter((_, i) => i !== index));
  };

  const handleAddPromoDiscount = () => {
    setPromoDiscounts([...promoDiscounts, { description: '', amount: '' }]);
  };

  const handleUpdatePromoDiscount = (index: number, field: 'description' | 'amount', value: string) => {
    const updated = [...promoDiscounts];
    updated[index] = {
      ...updated[index],
      [field]: value
    };
    setPromoDiscounts(updated);
  };

  const handleRemovePromoDiscount = (index: number) => {
    setPromoDiscounts(promoDiscounts.filter((_, i) => i !== index));
  };

  // Shift Withdrawals states
  const [withdrawals, setWithdrawals] = useState<{ product: string; amount: string; }[]>([]);

  const handleAddWithdrawal = () => {
    const availableProducts = inventory.filter(item => item.product !== 'Crispy Pork' && item.product !== 'หมูกรอบ');
    if (availableProducts.length === 0) return;
    setWithdrawals([...withdrawals, { product: availableProducts[0].product, amount: '' }]);
  };

  const handleUpdateWithdrawal = (index: number, field: 'product' | 'amount', value: string) => {
    const updated = [...withdrawals];
    updated[index] = {
      ...updated[index],
      [field]: value
    };
    setWithdrawals(updated);
  };

  const handleRemoveWithdrawal = (index: number) => {
    setWithdrawals(withdrawals.filter((_, i) => i !== index));
  };

  const getProductUnit = (productName: string) => {
    const item = inventory.find(i => i.product === productName);
    return item ? item.unit : '';
  };

  const getProductRemaining = (productName: string) => {
    const item = inventory.find(i => i.product === productName);
    return item ? item.remaining : 0;
  };

  // Initialize form default values: fetch yesterday's remaining stock as previousRemainingStock
  useEffect(() => {
    // Set default active employee
    const activeEmps = employees.filter(e => e.active);
    if (activeEmps.length > 0 && !employeeName) {
      setEmployeeName(activeEmps[0].name);
    }

    // Try to pre-populate previous remaining stock from yesterday's closing stock
    if (salesRecords.length > 0) {
      const sorted = [...salesRecords].sort((a, b) => b.date.localeCompare(a.date));
      const latest = sorted[0];
      setPreviousRemainingStock(latest.remainingStockAfterSales.toString());
    }
  }, [salesRecords, employees]);

  // Real-time calculated properties
  const numPorkBeforeFry = parseFloat(porkBeforeFry) || 0;
  const numPorkAfterFry = parseFloat(porkAfterFry) || 0;
  const numPreviousRemainingStock = parseFloat(previousRemainingStock) || 0;
  const numRemainingStockAfterSales = parseFloat(remainingStockAfterSales) || 0;

  const totalStockAfterFry = Math.round((numPorkAfterFry + numPreviousRemainingStock) * 10) / 10;
  const weightSold = Math.max(0, Math.round((totalStockAfterFry - numRemainingStockAfterSales) * 10) / 10);
  const fryingYieldPercent = numPorkBeforeFry > 0 
    ? Math.round((numPorkAfterFry / numPorkBeforeFry) * 100 * 10) / 10 
    : 0;

  const totalShiftExpense = shiftExpensesDetail.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
  const totalPromoDiscount = promoDiscounts.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);

  const onlineTotal = moneyTransfer + lineMan + grab;
  const autoTotal = cash + moneyTransfer + thaiChuayThai + lineMan + grab;
  const difference = autoTotal - salesAmount;

  // Handles form submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!employeeName) {
      setError('กรุณาเลือกชื่อพนักงานผู้รับผิดชอบกะ');
      return;
    }

    if (numPorkBeforeFry <= 0 || numPorkAfterFry <= 0) {
      setError('น้ำหนักหมูก่อนทอดและหลังทอดต้องมากกว่า 0 กิโลกรัม');
      return;
    }

    if (totalStockAfterFry < numRemainingStockAfterSales) {
      setError('ข้อผิดพลาดการตรวจสอบ: น้ำหนักหมูกรอบที่เหลืออยู่จริงต้องไม่มากกว่าน้ำหนักหมูกรอบทั้งหมดหลังทอด!');
      return;
    }

    if (salesAmount <= 0) {
      setError('กรุณากรอกยอดขายรวมตอนปิดกะที่เป็นจำนวนบวก');
      return;
    }

    // Validate withdrawals
    const parsedWithdrawals: { product: string; amount: number; }[] = [];
    const seenProducts = new Set<string>();

    for (const w of withdrawals) {
      if (!w.product) {
        setError('กรุณาเลือกรายการวัตถุดิบในการเบิกใช้');
        return;
      }
      if (seenProducts.has(w.product)) {
        setError(`คุณเลือกรายการวัตถุดิบ "${w.product}" ซ้ำซ้อน กรุณารวมยอดเข้าด้วยกันหรือปรับปรุงรายการ`);
        return;
      }
      seenProducts.add(w.product);

      const amt = parseFloat(w.amount) || 0;
      if (amt <= 0) {
        setError(`กรุณากรอกจำนวนการเบิกของ "${w.product}" ให้ถูกต้อง และมากกว่า 0`);
        return;
      }
      
      const remaining = getProductRemaining(w.product);
      if (remaining < amt) {
        setError(`ข้อผิดพลาดการเบิกคลัง: "${w.product}" ในคลังคงเหลือไม่เพียงพอสำหรับการเบิกใช้! (คงเหลือในระบบ: ${remaining} ${getProductUnit(w.product)})`);
        return;
      }

      parsedWithdrawals.push({ product: w.product, amount: amt });
    }

    // Filter valid shift expenses
    const parsedExpenses = shiftExpensesDetail
      .filter(item => item.description.trim() !== '' && (parseFloat(item.amount) || 0) > 0)
      .map(item => ({
        description: item.description.trim(),
        amount: parseFloat(item.amount) || 0
      }));

    // Filter valid promo discounts
    const parsedPromos = promoDiscounts
      .filter(item => item.description.trim() !== '' && (parseFloat(item.amount) || 0) > 0)
      .map(item => ({
        description: item.description.trim(),
        amount: parseFloat(item.amount) || 0
      }));

    try {
      // Append itemized shift expenses and promo discounts to the Google Sheets remark
      let finalRemark = remark;
      const expenseDetailsText = parsedExpenses
        .map(e => `${e.description} ฿${e.amount}`)
        .join(', ');
      
      const promoDetailsText = parsedPromos
        .map(d => `${d.description} ฿${d.amount}`)
        .join(', ');

      const detailParts: string[] = [];
      if (expenseDetailsText) {
        detailParts.push(`[ค่าใช้จ่ายลิ้นชัก: ${expenseDetailsText}]`);
      }
      if (promoDetailsText) {
        detailParts.push(`[ส่วนลดโปรโมชัน: ${promoDetailsText}]`);
      }

      if (detailParts.length > 0) {
        const joinedDetails = detailParts.join(' ');
        finalRemark = remark.trim() ? `${remark} ${joinedDetails}` : joinedDetails;
      }

      await addSalesRecord({
        date,
        employeeName,
        porkBeforeFry: numPorkBeforeFry,
        porkAfterFry: numPorkAfterFry,
        previousRemainingStock: numPreviousRemainingStock,
        remainingStockAfterSales: numRemainingStockAfterSales,
        salesAmount,
        remark: finalRemark,
        moneyTransfer,
        cash,
        thaiChuayThai,
        lineMan,
        grab,
        expense: totalShiftExpense,
        withdrawals: parsedWithdrawals,
        shiftExpensesDetail: parsedExpenses,
        promoDiscounts: parsedPromos
      });

      setSuccess(true);
      window.scrollTo(0, 0);
      setTimeout(() => {
        setSuccess(false);
        setView('dashboard');
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'เกิดข้อผิดพลาดขณะพยายามบันทึกข้อมูลปิดยอดกะ');
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto pb-16"
    >
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold tracking-tight text-gray-950">
          แบบฟอร์มบันทึกปิดยอดกะประจำวัน
        </h1>
        <p className="text-xs text-gray-500 mt-1">
          ทำการตรวจสอบและบันทึกปิดยอดกะการทำงานประจำวัน บันทึกนี้จะปิดยอดลิ้นชักแคชเชียร์ อัปเดตคลังสินค้าสต็อกหมูกรอบ และคำนวณอัตราผลผลิต
        </p>
      </div>

      {success && (
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="w-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-800 rounded-2xl p-6 mb-8 text-center flex flex-col items-center justify-center gap-3"
        >
          <CheckCircle className="w-12 h-12 text-emerald-500 animate-bounce" />
          <div>
            <h3 className="font-display font-bold text-base">บันทึกข้อมูลเรียบร้อยแล้ว!</h3>
            <p className="text-xs text-emerald-700/80 mt-1">
              กำลังซิงโครไนซ์ข้อมูลกับ Google Sheets และปรับปรุงยอดสินค้าคงคลังคงเหลือ...
            </p>
          </div>
        </motion.div>
      )}

      {error && (
        <div className="w-full bg-rose-50 border border-rose-100 text-rose-800 rounded-2xl p-4 mb-8 flex items-start gap-3 shadow-2xs">
          <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
          <div>
            <h4 className="text-xs font-bold">กรุณาตรวจสอบข้อมูลในฟอร์มอีกครั้ง</h4>
            <p className="text-[11px] text-rose-700 mt-0.5 leading-relaxed">{error}</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-8">
        
        {/* Section 1: Session Parameters */}
        <div className="glass-card rounded-3xl p-6 relative overflow-hidden">
          <div className="flex items-center gap-2 mb-6 pb-3 border-b border-orange-100/30">
            <Calendar className="w-5 h-5 text-brand-orange" />
            <h3 className="font-display font-bold text-base text-gray-900">ข้อมูลรอบกะการทำงาน</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-mono font-bold uppercase tracking-wider text-gray-500">
                วันที่ทำรายการ
              </label>
              <input 
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full h-11 px-4 py-2 rounded-xl border border-orange-100 glass-input text-sm font-semibold"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-mono font-bold uppercase tracking-wider text-gray-500">
                ผู้ควบคุมกะ / พนักงานผู้รับผิดชอบ (พิมพ์ชื่อตนเองก่อนกรอกข้อมูล)
              </label>
              <input
                type="text"
                required
                value={employeeName}
                onChange={(e) => setEmployeeName(e.target.value)}
                list="daily-employee-names"
                className="w-full h-11 px-4 py-2 rounded-xl border border-orange-100 glass-input text-sm font-semibold"
                placeholder="พิมพ์ชื่อ-นามสกุลของคุณ..."
              />
              <datalist id="daily-employee-names">
                {employees.map(emp => (
                  <option key={emp.id} value={emp.name}>{getRoleTh(emp.role)}</option>
                ))}
              </datalist>
            </div>
          </div>
        </div>

        {/* Section 2: Frying Yield & Crispy Pork Weights */}
        <div className="glass-card rounded-3xl p-6 relative overflow-hidden">
          <div className="flex items-center justify-between mb-6 pb-3 border-b border-orange-100/30">
            <div className="flex items-center gap-2">
              <Scale className="w-5 h-5 text-brand-orange" />
              <h3 className="font-display font-bold text-base text-gray-900">ข้อมูลน้ำหนักและอัตราการผลิตหมูกรอบ</h3>
            </div>
            <span className="text-[10px] font-mono font-bold text-brand-orange bg-orange-50 px-2 py-1 rounded-lg">
              ระบบคำนวณผลผลิตอัตโนมัติ
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-5">
            
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-mono font-semibold text-gray-500">
                น้ำหนักหมูดิบ (ก่อนทอด)
              </label>
              <div className="relative">
                <input 
                  type="text" 
                  inputMode="decimal"
                  required
                  value={porkBeforeFry}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === '' || /^\d*\.?\d*$/.test(val)) {
                      setPorkBeforeFry(val);
                    }
                  }}
                  className="w-full h-11 pl-4 pr-12 rounded-xl border border-orange-100 glass-input text-sm font-bold font-mono text-gray-950"
                  placeholder="0.0"
                />
                <span className="absolute right-4 top-3 text-xs font-bold text-gray-400">กก.</span>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-mono font-semibold text-gray-500">
                น้ำหนักหมูกรอบ (หลังทอด)
              </label>
              <div className="relative">
                <input 
                  type="text" 
                  inputMode="decimal"
                  required
                  value={porkAfterFry}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === '' || /^\d*\.?\d*$/.test(val)) {
                      setPorkAfterFry(val);
                    }
                  }}
                  className="w-full h-11 pl-4 pr-12 rounded-xl border border-orange-100 glass-input text-sm font-bold font-mono text-gray-950"
                  placeholder="0.0"
                />
                <span className="absolute right-4 top-3 text-xs font-bold text-gray-400">กก.</span>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-mono font-semibold text-gray-500">
                ยอดยกมา / สต็อกก่อนหน้า
              </label>
              <div className="relative">
                <input 
                  type="text" 
                  inputMode="decimal"
                  required
                  value={previousRemainingStock}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === '' || /^\d*\.?\d*$/.test(val)) {
                      setPreviousRemainingStock(val);
                    }
                  }}
                  className="w-full h-11 pl-4 pr-12 rounded-xl border border-orange-100 glass-input text-sm font-bold font-mono text-gray-950"
                  placeholder="0.0"
                />
                <span className="absolute right-4 top-3 text-xs font-bold text-gray-400">กก.</span>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-mono font-semibold text-gray-500">
                สต็อกคงเหลือจริง ณ เวลาปิดกะ
              </label>
              <div className="relative">
                <input 
                  type="text" 
                  inputMode="decimal"
                  required
                  value={remainingStockAfterSales}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === '' || /^\d*\.?\d*$/.test(val)) {
                      setRemainingStockAfterSales(val);
                    }
                  }}
                  className="w-full h-11 pl-4 pr-12 rounded-xl border border-orange-100 glass-input text-sm font-bold font-mono text-gray-950"
                  placeholder="0.0"
                />
                <span className="absolute right-4 top-3 text-xs font-bold text-gray-400">กก.</span>
              </div>
            </div>

          </div>

          {/* Pork Yield & Stock Indicators Dashboard Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6 p-4 bg-orange-50/40 rounded-2xl border border-orange-100/50">
            
            <div className="flex flex-col">
              <span className="text-[10px] font-mono font-bold text-gray-400 uppercase">เปอร์เซ็นต์ผลผลิตการทอด (%)</span>
              <span className={`text-xl font-black font-display mt-0.5 ${fryingYieldPercent > 70 ? 'text-rose-600' : fryingYieldPercent < 50 && fryingYieldPercent > 0 ? 'text-amber-600' : 'text-gray-900'}`}>
                {fryingYieldPercent}%
              </span>
              <span className="text-[9px] text-gray-400 mt-0.5">สัดส่วนเป้าหมายมาตรฐานอยู่ที่ ~58% - 62%</span>
            </div>

            <div className="flex flex-col">
              <span className="text-[10px] font-mono font-bold text-gray-400 uppercase">สต็อกทั้งหมดก่อนขาย</span>
              <span className="text-xl font-black font-display text-gray-900 mt-0.5">
                {totalStockAfterFry} กก.
              </span>
              <span className="text-[9px] text-gray-400 mt-0.5">หมูทอดใหม่ ({porkAfterFry} กก.) + สต็อกยกมา ({previousRemainingStock} กก.)</span>
            </div>

            <div className="flex flex-col">
              <span className="text-[10px] font-mono font-bold text-gray-400 uppercase">น้ำหนักที่จำหน่ายออก</span>
              <span className="text-xl font-black font-display text-brand-orange mt-0.5">
                {weightSold} กก.
              </span>
              <span className="text-[9px] text-gray-400 mt-0.5">น้ำหนักส่วนนี้จะถูกตัดออกจากบัญชีสินค้าคงคลัง</span>
            </div>

          </div>
        </div>

        {/* Section 2.5: Shift Inventory Withdrawals */}
        <div className="glass-card rounded-3xl p-6 relative overflow-hidden">
          <div className="flex items-center justify-between mb-6 pb-3 border-b border-orange-100/30">
            <div className="flex items-center gap-2">
              <Plus className="w-5 h-5 text-brand-orange" />
              <h3 className="font-display font-bold text-base text-gray-900">รายละเอียดการเบิกวัตถุดิบและอุปกรณ์มาใช้งานในกะ (โดยหัวหน้ากะ)</h3>
            </div>
            <button
              type="button"
              onClick={handleAddWithdrawal}
              className="py-1.5 px-3 rounded-xl bg-orange-50 hover:bg-orange-100/80 text-brand-orange text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              เพิ่มรายการเบิกใช้
            </button>
          </div>

          <p className="text-[11px] text-gray-500 mb-4 leading-relaxed">
            ระบุรายการวัตถุดิบ ซอสปรุงรส บรรจุภัณฑ์ และอุปกรณ์อื่น ๆ ที่ถูกเบิกนำมาใช้งานในช่วงเวลากะนี้ โดยหัวหน้ากะ ระบบจะทำการหักลดจำนวนคงเหลือในคลังสินค้า (คลังส่วนกลาง) ให้โดยอัตโนมัติเมื่อทำการส่งรายงานปิดกะ
          </p>

          {withdrawals.length === 0 ? (
            <div className="text-center py-8 px-4 border border-dashed border-orange-100 bg-orange-50/20 rounded-2xl">
              <span className="text-xs text-gray-400 font-medium">ยังไม่มีรายการเบิกของในรอบกะนี้</span>
              <button
                type="button"
                onClick={handleAddWithdrawal}
                className="block mx-auto mt-2 text-xs font-bold text-brand-orange hover:underline cursor-pointer"
              >
                + คลิกที่นี่เพื่อเพิ่มรายการเบิกของครั้งแรก
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {withdrawals.map((w, index) => {
                const currentRemaining = getProductRemaining(w.product);
                const currentUnit = getProductUnit(w.product);
                return (
                  <div key={index} className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center p-3.5 bg-orange-50/20 border border-orange-100/40 rounded-2xl relative">
                    
                    {/* Select Product */}
                    <div className="md:col-span-6 flex flex-col gap-1">
                      <label className="text-[9px] font-mono font-bold uppercase text-gray-400">เลือกวัตถุดิบ/รายการในคลัง</label>
                      <select
                        required
                        value={w.product}
                        onChange={(e) => handleUpdateWithdrawal(index, 'product', e.target.value)}
                        className="w-full h-11 px-3 rounded-xl border border-orange-100 bg-white text-xs font-semibold text-gray-900 focus:border-brand-orange focus:ring-1 focus:ring-brand-orange"
                      >
                        {inventory
                          .filter(item => item.product !== 'Crispy Pork' && item.product !== 'หมูกรอบ')
                          .map(item => (
                            <option key={item.id} value={item.product}>
                              {item.product} (คงเหลือในคลัง: {item.remaining} {item.unit})
                            </option>
                          ))
                        }
                      </select>
                    </div>

                    {/* Quantity input */}
                    <div className="md:col-span-4 flex flex-col gap-1">
                      <label className="text-[9px] font-mono font-bold uppercase text-gray-400">จำนวนที่เบิกออก</label>
                      <div className="relative">
                        <input
                          type="text"
                          inputMode="decimal"
                          required
                          value={w.amount}
                          placeholder="ระบุจำนวน..."
                          onChange={(e) => {
                            const val = e.target.value;
                            if (val === '' || /^\d*\.?\d*$/.test(val)) {
                              handleUpdateWithdrawal(index, 'amount', val);
                            }
                          }}
                          className="w-full h-11 pl-3 pr-12 rounded-xl border border-orange-100 bg-white text-xs font-bold font-mono text-gray-950 focus:border-brand-orange focus:ring-1 focus:ring-brand-orange"
                        />
                        <span className="absolute right-3 top-3 text-[10px] font-bold text-gray-400">
                          {currentUnit}
                        </span>
                      </div>
                    </div>

                    {/* Delete button */}
                    <div className="md:col-span-2 flex items-end justify-end h-full pt-4 md:pt-0">
                      <button
                        type="button"
                        onClick={() => handleRemoveWithdrawal(index)}
                        className="h-11 px-3 rounded-xl hover:bg-rose-50 text-rose-500 hover:text-rose-600 transition-all cursor-pointer flex items-center justify-center border border-transparent hover:border-rose-100"
                        title="ลบรายการนี้"
                      >
                        <Trash2 className="w-4 h-4 mr-1 md:mr-0" />
                        <span className="text-xs font-bold md:hidden">ลบรายการ</span>
                      </button>
                    </div>

                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Section 3: Register Close & Payment Breakdown */}
        <div className="glass-card rounded-3xl p-6 relative overflow-hidden">
          <div className="flex items-center gap-2 mb-6 pb-3 border-b border-orange-100/30">
            <Calculator className="w-5 h-5 text-brand-orange" />
            <h3 className="font-display font-bold text-base text-gray-900">สรุปยอดขายลิ้นชักเก็บเงินและการชำระเงิน</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            
            <div className="flex flex-col gap-1.5 md:col-span-2 lg:col-span-3 mb-2">
              <label className="text-xs font-mono font-bold text-brand-orange flex items-center gap-1.5">
                <DollarSign className="w-4 h-4" />
                ยอดขายรวมตอนปิดกะตามเครื่อง POS / แคชเชียร์ (บาท)
              </label>
              <input 
                type="number"
                required
                min="0"
                value={salesAmount || ''}
                onChange={(e) => setSalesAmount(parseInt(e.target.value) || 0)}
                className="w-full h-12 px-4 rounded-xl border border-brand-orange/30 focus:border-brand-orange text-lg font-black font-mono text-gray-950 focus:ring-3 focus:ring-brand-orange/15"
                placeholder="฿ ระบุยอดขายรวมจากใบเสร็จ POS"
              />
              <span className="text-[10px] text-gray-400 mt-0.5">ระบุยอดขายปิดกะสะสมจากเครื่องขายหน้าร้าน (POS) หรือยอดใบรวมของวัน</span>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-mono font-semibold text-gray-500">
                1. เงินสดที่นับได้จริง (บาท)
              </label>
              <input 
                type="number"
                min="0"
                value={cash || ''}
                onChange={(e) => setCash(parseInt(e.target.value) || 0)}
                className="w-full h-11 px-4 rounded-xl border border-orange-100 glass-input text-sm font-semibold font-mono"
                placeholder="0"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-mono font-semibold text-gray-500">
                2. ยอดโอนเงินบัญชี/QR (บาท)
              </label>
              <input 
                type="number"
                min="0"
                value={moneyTransfer || ''}
                onChange={(e) => setMoneyTransfer(parseInt(e.target.value) || 0)}
                className="w-full h-11 px-4 rounded-xl border border-orange-100 glass-input text-sm font-semibold font-mono"
                placeholder="0"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-mono font-semibold text-gray-500">
                3. โครงการคนละครึ่ง/ไทยช่วยไทย (บาท)
              </label>
              <input 
                type="number"
                min="0"
                value={thaiChuayThai || ''}
                onChange={(e) => setThaiChuayThai(parseInt(e.target.value) || 0)}
                className="w-full h-11 px-4 rounded-xl border border-orange-100 glass-input text-sm font-semibold font-mono"
                placeholder="0"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-mono font-semibold text-gray-500">
                4. ยอดขาย LINE MAN (บาท)
              </label>
              <input 
                type="number"
                min="0"
                value={lineMan || ''}
                onChange={(e) => setLineMan(parseInt(e.target.value) || 0)}
                className="w-full h-11 px-4 rounded-xl border border-orange-100 glass-input text-sm font-semibold font-mono"
                placeholder="0"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-mono font-semibold text-gray-500">
                5. ยอดขาย Grab Food (บาท)
              </label>
              <input 
                type="number"
                min="0"
                value={grab || ''}
                onChange={(e) => setGrab(parseInt(e.target.value) || 0)}
                className="w-full h-11 px-4 rounded-xl border border-orange-100 glass-input text-sm font-semibold font-mono"
                placeholder="0"
              />
            </div>

            <div className="flex flex-col gap-1.5 md:col-span-2">
              <label className="text-[11px] font-mono font-bold text-gray-600 flex items-center gap-1.5">
                <Receipt className="w-3.5 h-3.5 text-brand-orange" />
                รายจ่ายเงินสดย่อยจากลิ้นชักประจำกะ (บาท)
              </label>
              <div className="w-full h-11 px-4 rounded-xl border border-orange-100 bg-orange-50/50 flex items-center justify-between text-sm font-bold font-mono text-gray-950">
                <span>฿{totalShiftExpense.toLocaleString()}</span>
                <span className="text-[10px] font-sans font-medium text-orange-600 bg-orange-100/60 px-2 py-0.5 rounded-full">
                  คำนวณอัตโนมัติจากรายการด้านล่าง
                </span>
              </div>
            </div>

          </div>

          {/* Itemized Petty Cash Drawer Expenses Section */}
          <div className="mt-6 border-t border-orange-100/60 pt-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-orange-50 border border-orange-100 flex items-center justify-center text-brand-orange">
                  <Receipt className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-gray-900">
                    รายละเอียดรายจ่ายเงินสดจากลิ้นชัก (Shift Cash Expenses)
                  </h4>
                  <p className="text-[10px] text-gray-400">
                    ระบุรายการค่าใช้จ่ายย่อยที่ใช้เงินสดจากลิ้นชักโดยตรง (เช่น ซื้อผักหน้าร้าน, ซื้อของจิปาถะ)
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleAddShiftExpense}
                className="h-8 px-3 rounded-lg border border-brand-orange/30 text-brand-orange hover:bg-brand-orange/5 font-semibold text-xs flex items-center gap-1 cursor-pointer transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                เพิ่มรายการค่าใช้จ่าย
              </button>
            </div>

            {shiftExpensesDetail.length === 0 ? (
              <div className="bg-gray-50/55 border border-dashed border-gray-200 rounded-2xl p-6 text-center text-xs text-gray-400">
                ไม่มีรายการค่าใช้จ่ายจากลิ้นชักสดสำหรับกะนี้ (หากมี กรุณากดปุ่มเพิ่มรายการด้านบน)
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {shiftExpensesDetail.map((item, index) => (
                  <div key={index} className="flex gap-2 items-center">
                    <input
                      type="text"
                      required
                      placeholder="เช่น ซื้อพริกแดงหน้าร้าน, ค่าขนส่งด่วน"
                      value={item.description}
                      onChange={(e) => handleUpdateShiftExpense(index, 'description', e.target.value)}
                      className="flex-1 h-10 px-3 rounded-xl border border-orange-100 glass-input text-xs font-semibold"
                    />
                    <div className="w-36 relative">
                      <input
                        type="number"
                        required
                        min="1"
                        placeholder="จำนวนเงิน"
                        value={item.amount}
                        onChange={(e) => handleUpdateShiftExpense(index, 'amount', e.target.value)}
                        className="w-full h-10 pl-3 pr-8 rounded-xl border border-orange-100 glass-input text-xs font-bold font-mono text-right"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-sans font-bold text-gray-400">฿</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveShiftExpense(index)}
                      className="p-2 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50 cursor-pointer transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Itemized Promo & Discount Section */}
          <div className="mt-6 border-t border-orange-100/60 pt-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-orange-50 border border-orange-100 flex items-center justify-center text-brand-orange">
                  <Percent className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-gray-900">
                    รายการโปรโมชันและส่วนลดพิเศษประจำกะ (Promotional Discounts)
                  </h4>
                  <p className="text-[10px] text-gray-400">
                    ระบุส่วนลดที่มอบให้ลูกค้าเพื่อประกอบการตรวจสอบยอดขาย เช่น ส่วนลดแชร์โพสต์, คูปองลดราคา
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleAddPromoDiscount}
                className="h-8 px-3 rounded-lg border border-brand-orange/30 text-brand-orange hover:bg-brand-orange/5 font-semibold text-xs flex items-center gap-1 cursor-pointer transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                เพิ่มรายการส่วนลด
              </button>
            </div>

            {promoDiscounts.length === 0 ? (
              <div className="bg-gray-50/55 border border-dashed border-gray-200 rounded-2xl p-6 text-center text-xs text-gray-400">
                ไม่มีบันทึกส่วนลดจัดโปรโมชันสำหรับกะนี้ (หากมี กรุณากดปุ่มเพิ่มรายการด้านบน)
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {promoDiscounts.map((item, index) => (
                  <div key={index} className="flex gap-2 items-center">
                    <input
                      type="text"
                      required
                      placeholder="เช่น โปรแถมเครื่องดื่มประจำเดือน, คูปองเปิดร้านใหม่"
                      value={item.description}
                      onChange={(e) => handleUpdatePromoDiscount(index, 'description', e.target.value)}
                      className="flex-1 h-10 px-3 rounded-xl border border-orange-100 glass-input text-xs font-semibold"
                    />
                    <div className="w-36 relative">
                      <input
                        type="number"
                        required
                        min="1"
                        placeholder="ยอดส่วนลด"
                        value={item.amount}
                        onChange={(e) => handleUpdatePromoDiscount(index, 'amount', e.target.value)}
                        className="w-full h-10 pl-3 pr-8 rounded-xl border border-orange-100 glass-input text-xs font-bold font-mono text-right"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-sans font-bold text-gray-400">฿</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemovePromoDiscount(index)}
                      className="p-2 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50 cursor-pointer transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                
                <div className="flex justify-end items-center gap-2 mt-2 px-3 text-xs">
                  <span className="text-gray-500 font-semibold">ยอดรวมส่วนลดโปรโมชัน:</span>
                  <span className="font-extrabold font-mono text-brand-orange text-sm">
                    ฿{totalPromoDiscount.toLocaleString()}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Financial calculations preview block */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6 p-5 bg-orange-950 text-white rounded-2xl relative overflow-hidden">
            <div className="absolute right-[-20px] bottom-[-20px] opacity-10">
              <ArrowLeftRight className="w-32 h-32" />
            </div>

            <div className="flex flex-col">
              <span className="text-[9px] font-mono uppercase tracking-wider text-orange-200">ยอดรวมช่องทางดิจิทัล</span>
              <span className="text-xl font-extrabold font-display mt-0.5 text-orange-100">
                ฿{onlineTotal.toLocaleString()}
              </span>
              <span className="text-[9px] text-orange-300 mt-0.5">ยอดโอน + LINE MAN + Grab</span>
            </div>

            <div className="flex flex-col">
              <span className="text-[9px] font-mono uppercase tracking-wider text-orange-200">ยอดคำนวณเงินเข้าทั้งหมด</span>
              <span className="text-xl font-extrabold font-display mt-0.5 text-orange-100">
                ฿{autoTotal.toLocaleString()}
              </span>
              <span className="text-[9px] text-orange-300 mt-0.5">ผลรวมเงินสด + ยอดช่องทางดิจิทัล</span>
            </div>

            <div className="flex flex-col">
              <span className="text-[9px] font-mono uppercase tracking-wider text-orange-200">ยอดเงินขาด / เกินลิ้นชัก</span>
              <span className={`text-xl font-black font-display mt-0.5 ${difference < 0 ? 'text-red-400 font-black' : difference > 0 ? 'text-emerald-400' : 'text-emerald-300'}`}>
                {difference > 0 ? '+' : ''}{difference.toLocaleString()} บาท
              </span>
              <span className="text-[9px] text-orange-300 mt-0.5">ยอดรับชำระจริง หักลบด้วย ยอดเครื่อง POS</span>
            </div>

          </div>
        </div>

        {/* Remarks and Save */}
        <div className="glass-card rounded-3xl p-6 relative overflow-hidden">
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-mono font-bold uppercase tracking-wider text-gray-500">
              หมายเหตุการปิดยอดรอบกะ และ รายงานเพิ่มเติม
            </label>
            <textarea
              value={remark}
              onChange={(e) => setRemark(e.target.value)}
              rows={3}
              placeholder="เช่น เตาทอดความร้อนต่ำในช่วงเช้า, ล็อตกล่องใส่อาหารพลาสติกกำลังจะหมด, ลูกค้าเยอะเนื่องจากโปรโมชัน..."
              className="w-full p-4 rounded-xl border border-orange-100 glass-input text-sm font-semibold"
            />
          </div>

          <div className="flex items-center justify-end gap-3 mt-6">
            <button 
              type="button" 
              onClick={() => setView('dashboard')}
              className="py-2.5 px-5 rounded-xl hover:bg-gray-100 font-semibold text-xs text-gray-600 transition-all cursor-pointer"
            >
              ยกเลิก
            </button>
            <button 
              type="submit"
              className="py-2.5 px-6 rounded-xl orange-gradient text-white hover:opacity-90 font-bold text-xs shadow-md shadow-orange-500/10 cursor-pointer"
            >
              ตรวจสอบและส่งรายงานปิดรอบกะ
            </button>
          </div>
        </div>

      </form>
    </motion.div>
  );
};
