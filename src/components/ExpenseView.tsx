import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  Receipt, Plus, Search, Filter, Trash2, Calendar, FileText, TrendingUp, AlertTriangle, Landmark, Sparkles
} from 'lucide-react';
import { useDatabase } from '../context/DatabaseContext';
import { getRoleTh } from '../types';

const categoryNamesTh: Record<string, string> = {
  Oil: 'น้ำมันทอด',
  Gas: 'แก๊สหุงต้ม',
  Packaging: 'บรรจุภัณฑ์',
  Vegetables: 'ผักและของสด',
  Salary: 'ค่าแรงพนักงาน',
  Electricity: 'ค่าไฟฟ้า',
  Water: 'ค่าน้ำประปา',
  Other: 'ค่าใช้จ่ายอื่นๆ'
};
const getCategoryTh = (cat: string) => categoryNamesTh[cat] || cat;

export const ExpenseView: React.FC = () => {
  const { expenses, addExpense, employees, profile } = useDatabase();
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  // New Expense Form State
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [category, setCategory] = useState<'Oil' | 'Gas' | 'Packaging' | 'Vegetables' | 'Salary' | 'Electricity' | 'Water' | 'Other'>('Oil');
  const [amount, setAmount] = useState<number>(0);
  const [employeeName, setEmployeeName] = useState(profile?.name || '');
  const [remark, setRemark] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState(false);

  // Itemized List State
  const [isItemized, setIsItemized] = useState(false);
  const [itemizedList, setItemizedList] = useState<{ id: string; name: string; cost: number }[]>([
    { id: '1', name: '', cost: 0 }
  ]);

  const calculateTotalAmount = (list: { id: string; name: string; cost: number }[]) => {
    return list.reduce((sum, item) => sum + (item.cost || 0), 0);
  };

  const handleAddItem = () => {
    const newList = [...itemizedList, { id: Date.now().toString(), name: '', cost: 0 }];
    setItemizedList(newList);
  };

  const handleRemoveItem = (id: string) => {
    const newList = itemizedList.filter(item => item.id !== id);
    setItemizedList(newList);
    setAmount(calculateTotalAmount(newList));
  };

  const handleUpdateItem = (id: string, field: 'name' | 'cost', value: any) => {
    const newList = itemizedList.map(item => {
      if (item.id === id) {
        if (field === 'cost') {
          const costVal = parseInt(value) || 0;
          return { ...item, cost: costVal };
        }
        return { ...item, [field]: value };
      }
      return item;
    });
    setItemizedList(newList);
    if (field === 'cost') {
      setAmount(calculateTotalAmount(newList));
    }
  };

  // Group Expenses by Category for stats
  const expensesByCategory = expenses.reduce((acc, curr) => {
    acc[curr.category] = (acc[curr.category] || 0) + curr.amount;
    return acc;
  }, {} as Record<string, number>);

  const totalExpenseAmount = expenses.reduce((sum, curr) => sum + curr.amount, 0);

  const categoriesList = ['Oil', 'Gas', 'Packaging', 'Vegetables', 'Salary', 'Electricity', 'Water', 'Other'];

  // Handle Submit Expense
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(false);

    if (amount <= 0) {
      setFormError('จำนวนเงินค่าใช้จ่ายต้องมากกว่าศูนย์');
      return;
    }

    if (!employeeName) {
      setFormError('กรุณาเลือกชื่อพนักงานผู้บันทึกรายการ');
      return;
    }

    try {
      let finalRemark = remark;
      if (isItemized) {
        const validItems = itemizedList.filter(item => item.name.trim() !== '' && item.cost > 0);
        if (validItems.length === 0) {
          setFormError('กรุณากรอกรายการค่าใช้จ่ายแยกรายการอย่างน้อย 1 รายการ');
          return;
        }
        const itemizedStr = validItems.map(item => `${item.name} ${item.cost}`).join(', ');
        finalRemark = remark.trim() ? `${itemizedStr} (${remark})` : itemizedStr;
      }

      await addExpense({
        date,
        category,
        amount,
        employeeName,
        remark: finalRemark
      });

      setFormSuccess(true);
      setAmount(0);
      setRemark('');
      setItemizedList([{ id: '1', name: '', cost: 0 }]);
      setIsItemized(false);
      setTimeout(() => setFormSuccess(false), 2000);
    } catch (err: any) {
      setFormError(err.message || 'ไม่สามารถบันทึกรายการค่าใช้จ่ายได้');
    }
  };

  // Filtered Expense Records
  const filteredExpenses = expenses.filter(exp => {
    const matchesSearch = exp.employeeName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (exp.remark && exp.remark.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = categoryFilter === 'all' || exp.category === categoryFilter;
    return matchesSearch && matchesCategory;
  }).sort((a, b) => b.date.localeCompare(a.date));

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col gap-8 pb-16"
    >
      {/* Header */}
      <div>
        <span className="text-xs font-mono font-bold uppercase tracking-widest text-brand-orange bg-brand-orange/10 px-3 py-1 rounded-full">
          บันทึกรายจ่ายร้าน
        </span>
        <h1 className="text-3xl font-extrabold tracking-tight text-gray-950 mt-2">
          ระบบบันทึกค่าใช้จ่ายและเงินสดย่อย
        </h1>
        <p className="text-xs text-gray-500 mt-1">
          บันทึกค่าใช้จ่ายการดำเนินงานรายวัน (แก๊สหุงต้ม น้ำมันทอดอาหาร บรรจุภัณฑ์ ค่าจ้าง และสาธารณูปโภค) เพื่อตรวจสอบเงินสดย่อยในระบบอย่างถูกต้อง
        </p>
      </div>

      {/* Disclaimer banner clarifying split between shift expenses and shop expenses */}
      <div className="bg-amber-50/70 border border-amber-200/60 rounded-2xl p-4 flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <h4 className="text-xs font-bold text-amber-900">
            ระบบแยกประเภทค่าใช้จ่ายของร้าน (Expense Category Guidelines)
          </h4>
          <p className="text-[11px] text-amber-800/90 mt-1 leading-relaxed">
            ระบบแบ่งรายจ่ายออกเป็น <strong className="text-amber-950">2 ส่วนแยกกันเด็ดขาด</strong> เพื่อความโปร่งใสและถูกต้องทางการเงิน:
          </p>
          <ul className="list-disc pl-4 text-[10.5px] text-amber-800/85 mt-1.5 space-y-1.5 leading-relaxed">
            <li>
              <strong className="text-amber-950">ส่วนที่ 1: ค่าใช้จ่ายประจำกะ (พนักงานเป็นคนระบุ)</strong> — ค่าใช้จ่ายประจำวันที่จ่ายด้วยเงินสดในลิ้นชักหน้าร้านหน้าร้าน ให้ระบุในตอนปิดยอดกะหน้า <strong>"บันทึกรายวัน"</strong> เท่านั้น โดยระบุรายการและส่วนลดการจัดโปรโมชันต่าง ๆ ให้ละเอียด
            </li>
            <li>
              <strong className="text-amber-950">ส่วนที่ 2: ค่าใช้จ่ายส่วนต่าง ๆ ของร้าน (ผู้จัดการเป็นคนระบุ)</strong> — ค่าใช้จ่ายหน้านี้เป็นค่าใช้จ่ายการดำเนินงานส่วนกลาง (เช่น ค่าแก๊ส, ค่าน้ำมันพืชล็อตใหญ่, ค่าจ้าง, ค่าไฟฟ้า, ค่าน้ำประปา) ที่ <strong className="text-amber-950">ไม่ได้จ่ายด้วยเงินในลิ้นชักประจำกะ</strong> (เช่น จ่ายจากบัญชีโอนหลักของร้าน หรือเงินทุนส่วนตัวผู้จัดการ) ซึ่งต้องบันทึกในหน้านี้โดยตรง
            </li>
          </ul>
        </div>
      </div>

      {/* Outflows Category Dashboard */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-4">
        {categoriesList.map((cat) => {
          const catTotal = expensesByCategory[cat] || 0;
          return (
            <div key={cat} className="bg-white border border-orange-100/30 rounded-2xl p-4 flex flex-col justify-between shadow-3xs hover:border-orange-200 transition-all">
              <span className="text-[10px] font-mono font-semibold text-gray-400 uppercase tracking-tight truncate">{getCategoryTh(cat)}</span>
              <span className="text-sm font-extrabold font-mono text-gray-950 mt-2">฿{catTotal.toLocaleString()}</span>
            </div>
          );
        })}
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Column 1: Record New Expense Form */}
        <div className="flex flex-col gap-4">
          <div className="glass-card rounded-3xl p-6 border border-orange-100/50">
            <div className="flex items-center gap-2 mb-6 pb-3 border-b border-orange-100/30">
              <Receipt className="w-5 h-5 text-brand-orange" />
              <h3 className="font-display font-bold text-base text-gray-900">บันทึกรายจ่ายใหม่</h3>
            </div>

            {formSuccess && (
              <div className="bg-emerald-50 text-emerald-800 border border-emerald-100 p-3 rounded-xl text-xs font-medium mb-4 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-500" />
                บันทึกค่าใช้จ่ายเรียบร้อยแล้ว!
              </div>
            )}

            {formError && (
              <div className="bg-rose-50 border border-rose-100 text-rose-800 p-3 rounded-xl text-xs font-medium mb-4">
                {formError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-mono font-bold uppercase text-gray-400">วันที่ทำรายการ</label>
                <input 
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full h-11 px-4 py-2 rounded-xl border border-orange-100 glass-input text-xs font-semibold"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-mono font-bold uppercase text-gray-400">หมวดหมู่ค่าใช้จ่าย</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as any)}
                  className="w-full h-11 px-4 py-2 rounded-xl border border-orange-100 glass-input text-xs font-semibold cursor-pointer"
                >
                  {categoriesList.map(cat => (
                    <option key={cat} value={cat}>{getCategoryTh(cat)}</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-mono font-bold uppercase text-gray-400">จำนวนเงิน (บาท)</label>
                  <button 
                    type="button"
                    onClick={() => {
                      const newIsItemized = !isItemized;
                      setIsItemized(newIsItemized);
                      if (newIsItemized) {
                        setAmount(calculateTotalAmount(itemizedList));
                      }
                    }}
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border transition-all cursor-pointer ${isItemized ? 'bg-orange-50 text-brand-orange border-orange-200' : 'bg-gray-50 border-gray-200 text-gray-500 hover:text-gray-900'}`}
                  >
                    {isItemized ? '✨ คีย์แบบแยกรายการ (เปิดอยู่)' : '➕ แยกรายการสินค้า/บริการ'}
                  </button>
                </div>

                {isItemized ? (
                  <div className="flex flex-col gap-2 p-3 bg-orange-50/20 rounded-2xl border border-orange-100/30">
                    <div className="flex justify-between items-center text-[9px] font-mono font-bold text-gray-400 uppercase pb-1 border-b border-orange-100/10 mb-1">
                      <span>รายการค่าใช้จ่าย</span>
                      <span>บาท</span>
                    </div>
                    
                    <div className="flex flex-col gap-2 max-h-48 overflow-y-auto pr-1">
                      {itemizedList.map((item, idx) => (
                        <div key={item.id} className="flex items-center gap-1.5">
                          <input 
                            type="text"
                            required
                            value={item.name}
                            onChange={(e) => handleUpdateItem(item.id, 'name', e.target.value)}
                            className="flex-1 h-9 px-3 rounded-lg border border-orange-100/60 bg-white text-xs font-semibold"
                            placeholder={idx === 0 ? "เช่น ค่าไข่" : idx === 1 ? "เช่น ค่าผัก" : "ชื่อรายการ..."}
                          />
                          <input 
                            type="number"
                            required
                            min="0"
                            value={item.cost || ''}
                            onChange={(e) => handleUpdateItem(item.id, 'cost', e.target.value)}
                            className="w-20 h-9 px-2 rounded-lg border border-orange-100/60 bg-white text-xs font-bold font-mono text-right"
                            placeholder="0"
                          />
                          {itemizedList.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveItem(item.id)}
                              className="p-1.5 hover:bg-rose-50 hover:text-rose-600 text-gray-400 rounded-lg transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>

                    <button
                      type="button"
                      onClick={handleAddItem}
                      className="mt-1 py-1.5 px-3 border border-dashed border-orange-200 hover:border-brand-orange bg-white hover:bg-orange-50 text-brand-orange text-[10px] font-bold rounded-lg flex items-center justify-center gap-1 transition-all cursor-pointer"
                    >
                      <Plus className="w-3 h-3" /> เพิ่มรายการอื่น
                    </button>

                    <div className="flex items-center justify-between pt-2 border-t border-orange-100/20 mt-1 text-[11px]">
                      <span className="font-semibold text-gray-500">ยอดรวมอัตโนมัติ:</span>
                      <span className="font-extrabold font-mono text-brand-orange text-xs bg-brand-orange/10 px-2 py-0.5 rounded-md">฿{amount.toLocaleString()}</span>
                    </div>
                  </div>
                ) : (
                  <input 
                    type="number"
                    required
                    min="0"
                    value={amount || ''}
                    onChange={(e) => setAmount(parseInt(e.target.value) || 0)}
                    className="w-full h-11 px-4 rounded-xl border border-orange-100 glass-input text-sm font-bold font-mono text-gray-950"
                    placeholder="฿ 0"
                  />
                )}
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-mono font-bold uppercase text-gray-400">ผู้จ่ายเงิน / ผู้บันทึก (พิมพ์ชื่อตนเอง)</label>
                <input
                  type="text"
                  required
                  value={employeeName}
                  onChange={(e) => setEmployeeName(e.target.value)}
                  list="expense-employee-names"
                  className="w-full h-11 px-4 py-2 rounded-xl border border-orange-100 glass-input text-xs font-semibold"
                  placeholder="พิมพ์ชื่อของคุณ..."
                />
                <datalist id="expense-employee-names">
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.name}>{getRoleTh(emp.role)}</option>
                  ))}
                </datalist>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-mono font-bold uppercase text-gray-400">บันทึกเพิ่มเติม / หมายเหตุ</label>
                <input 
                  type="text"
                  value={remark}
                  onChange={(e) => setRemark(e.target.value)}
                  className="w-full h-11 px-4 rounded-xl border border-orange-100 glass-input text-xs font-semibold"
                  placeholder="เช่น เติมแก๊ส 15 กก., ซื้อกระดาษทิชชู..."
                />
              </div>

              <button
                type="submit"
                className="w-full mt-2 py-2.5 orange-gradient text-white hover:opacity-90 active:scale-95 font-bold text-xs rounded-xl shadow-md shadow-orange-500/10 cursor-pointer transition-all"
              >
                บันทึกใบเสร็จรายจ่าย
              </button>

            </form>
          </div>
        </div>

        {/* Column 2 & 3: Expense Ledger list */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          
          {/* Controls Bar */}
          <div className="bg-white border border-orange-100/30 p-4 rounded-2xl shadow-3xs flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="relative w-full sm:w-72">
              <input 
                type="text" 
                placeholder="ค้นหาตามหมายเหตุหรือชื่อพนักงาน..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-10 pl-10 pr-4 text-xs font-semibold rounded-xl border border-orange-100/60 bg-gray-50/50 focus:bg-white outline-none focus:ring-3 focus:ring-brand-orange/10 focus:border-brand-orange transition-all"
              />
              <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
            </div>

            <div className="flex items-center gap-2 self-end sm:self-auto">
              <span className="text-[10px] font-mono font-bold text-gray-400 uppercase mr-1 flex items-center gap-1">
                <Filter className="w-3.5 h-3.5" /> หมวดหมู่:
              </span>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="h-9 px-3 border border-orange-100 rounded-lg text-xs font-semibold bg-white cursor-pointer"
              >
                <option value="all">รายจ่ายทั้งหมด</option>
                {categoriesList.map(cat => (
                  <option key={cat} value={cat}>{getCategoryTh(cat)}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Ledger Cards */}
          <div className="bg-white border border-orange-100/40 rounded-3xl overflow-hidden shadow-xs flex flex-col justify-between">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-orange-50/30 border-b border-orange-100/40 text-[10px] font-mono uppercase font-bold text-gray-400">
                    <th className="py-3 px-5">วันที่</th>
                    <th className="py-3 px-5">หมวดหมู่</th>
                    <th className="py-3 px-5">จำนวนเงิน</th>
                    <th className="py-3 px-5">ผู้จ่ายเงิน</th>
                    <th className="py-3 px-5">หมายเหตุ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredExpenses.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-xs font-medium text-gray-400">
                        ไม่พบรายการค่าใช้จ่ายที่ตรงตามตัวกรอง
                      </td>
                    </tr>
                  ) : (
                    filteredExpenses.map((exp) => (
                      <tr key={exp.id} className="text-xs hover:bg-orange-50/5 transition-colors">
                        <td className="py-3.5 px-5 font-mono text-gray-500 whitespace-nowrap">
                          {exp.date}
                        </td>
                        <td className="py-3.5 px-5 whitespace-nowrap">
                          <span className="px-2 py-1 rounded-lg text-[10px] font-semibold bg-orange-50 border border-orange-100/30 text-brand-orange">
                            {getCategoryTh(exp.category)}
                          </span>
                        </td>
                        <td className="py-3.5 px-5 font-bold font-mono text-gray-950 whitespace-nowrap">
                          ฿{exp.amount.toLocaleString()}
                        </td>
                        <td className="py-3.5 px-5 text-gray-700 whitespace-nowrap">
                          {exp.employeeName}
                        </td>
                        <td className="py-3.5 px-5 text-gray-500 font-medium max-w-[200px] truncate" title={exp.remark}>
                          {exp.remark || '-'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Total Footer */}
            <div className="p-4 bg-orange-50/10 border-t border-orange-100/30 flex items-center justify-between text-xs font-semibold">
              <span className="text-gray-500 uppercase tracking-wider text-[10px] font-mono">ยอดรวมค่าใช้จ่ายตามตัวกรอง</span>
              <span className="text-base font-extrabold font-mono text-brand-orange">
                ฿{filteredExpenses.reduce((sum, e) => sum + e.amount, 0).toLocaleString()}
              </span>
            </div>
          </div>
        </div>

      </div>
    </motion.div>
  );
};
