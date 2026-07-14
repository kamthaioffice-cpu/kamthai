import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, Plus, Edit3, Trash2, Award, Target, CheckCircle2, XCircle, Search, Sparkles, Check, X, ShieldAlert,
  Calendar, Briefcase, Info, Clock, CheckCircle, AlertCircle, RefreshCw
} from 'lucide-react';
import { useDatabase } from '../context/DatabaseContext';
import { Employee, UserRole, getRoleTh } from '../types';

export const EmployeeView: React.FC = () => {
  const { employees, salesRecords, addEmployee, updateEmployee, deleteEmployee, syncing } = useDatabase();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMonth, setSelectedMonth] = useState<string>('all'); // YYYY-MM
  const [selectedEmployeeName, setSelectedEmployeeName] = useState<string>('all');

  // Modals / Editor States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEmp, setEditingEmp] = useState<Employee | null>(null);
  const [name, setName] = useState('');
  const [role, setRole] = useState<UserRole>('Employee');
  const [targetSales, setTargetSales] = useState<number>(80000);
  const [active, setActive] = useState(true);
  const [modalError, setModalError] = useState<string | null>(null);
  const [modalSuccess, setModalSuccess] = useState(false);

  // Group and sort salesRecords as shift workday records
  const sortedWorkdayRecords = [...salesRecords].sort((a, b) => b.date.localeCompare(a.date));

  // Extract unique months for filter dropdown
  const uniqueMonths = Array.from(new Set(salesRecords.map(r => r.date.substring(0, 7)))).sort().reverse();

  // Filter records for the workday audit
  const filteredWorkdayRecords = sortedWorkdayRecords.filter(record => {
    const matchesEmployee = selectedEmployeeName === 'all' || record.employeeName === selectedEmployeeName;
    const matchesMonth = selectedMonth === 'all' || record.date.startsWith(selectedMonth);
    const matchesSearch = record.employeeName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesEmployee && matchesMonth && matchesSearch;
  });

  // Filter employees roster list by search query
  const filteredEmployeesList = employees.filter(emp => 
    emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    getRoleTh(emp.role).toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Open modal for Create
  const handleOpenCreate = () => {
    setEditingEmp(null);
    setName('');
    setRole('Employee');
    setTargetSales(80000);
    setActive(true);
    setModalError(null);
    setModalSuccess(false);
    setIsModalOpen(true);
  };

  // Open modal for Edit
  const handleOpenEdit = (emp: Employee) => {
    setEditingEmp(emp);
    setName(emp.name);
    setRole(emp.role);
    setTargetSales(emp.targetSales);
    setActive(emp.active);
    setModalError(null);
    setModalSuccess(false);
    setIsModalOpen(true);
  };

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError(null);

    if (!name.trim()) {
      setModalError('กรุณาระบุชื่อพนักงาน');
      return;
    }

    if (targetSales <= 0) {
      setModalError('เป้าหมายยอดขายรายเดือนต้องมากกว่าศูนย์');
      return;
    }

    try {
      if (editingEmp) {
        // Edit Mode
        await updateEmployee({
          ...editingEmp,
          name,
          role,
          targetSales,
          active
        });
      } else {
        // Create Mode
        await addEmployee({
          name,
          role,
          targetSales,
          active
        });
      }

      setModalSuccess(true);
      setTimeout(() => {
        setIsModalOpen(false);
        setModalSuccess(false);
      }, 1000);
    } catch (err: any) {
      setModalError(err.message || 'การดำเนินการล้มเหลว');
    }
  };

  // Delete Action
  const handleDelete = async (id: string, empName: string) => {
    const confirmDelete = window.confirm(`คุณแน่ใจหรือไม่ว่าต้องการลบพนักงาน "${empName}"? การดำเนินการนี้ไม่สามารถย้อนกลับได้`);
    if (confirmDelete) {
      await deleteEmployee(id);
    }
  };

  // Format Date Thai
  const formatDateTh = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col gap-8 pb-16"
    >
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-mono font-bold uppercase tracking-widest text-brand-orange bg-brand-orange/10 px-3 py-1 rounded-full">
            ระบบบริหารงานบุคคล
          </span>
          <h1 className="text-3xl font-extrabold tracking-tight text-gray-950 mt-2">
            ตรวจสอบกะและวันทำงานพนักงาน
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            อ้างอิงข้อมูลจากการลงบันทึกรายงานยอดขายประจำวัน (ผู้จัดการร้านได้รับการยกเว้นไม่ต้องลงบันทึก)
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleOpenCreate}
            className="py-2.5 px-4 orange-gradient text-white hover:opacity-90 active:scale-95 text-xs font-semibold rounded-xl flex items-center gap-2 shadow-md shadow-orange-500/10 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            เพิ่มพนักงานใหม่
          </button>
        </div>
      </div>

      {/* Exemption Notice Banner */}
      <div className="bg-amber-50/50 border border-amber-200/60 p-4.5 rounded-2xl flex items-start gap-3.5 shadow-3xs">
        <Info className="w-5.5 h-5.5 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <h4 className="text-sm font-extrabold text-amber-950">ข้อกำหนดการบันทึกงานประจำกะ</h4>
          <p className="text-xs text-amber-800/95 mt-1 leading-relaxed">
            พนักงานทุกคนในตำแหน่ง <strong>ผู้ดูแลระบบ, รองผู้จัดการร้าน, หัวหน้ากะ, รองหัวหน้ากะ, และพนักงานทั่วไป</strong> จะต้องพิมพ์ชื่อของตนเองเพื่อลงบันทึกประจำวันเพื่อเป็นหลักฐานการทำงาน 
            <span className="text-amber-900 font-bold"> ยกเว้นตำแหน่ง "ผู้จัดการร้าน" ไม่จำเป็นต้องลงบันทึกประจำวัน</span>
          </p>
        </div>
      </div>

      {/* Quick Bento Stats for Workdays */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-white border border-orange-100/40 p-5 rounded-2xl shadow-3xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center text-brand-orange">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <span className="block text-[10px] font-mono text-gray-400 uppercase font-bold">กะงานที่เสร็จสิ้นทั้งหมด</span>
            <span className="block text-2xl font-black text-gray-900 mt-0.5">{salesRecords.length} ครั้ง</span>
          </div>
        </div>

        <div className="bg-white border border-orange-100/40 p-5 rounded-2xl shadow-3xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
            <CheckCircle className="w-6 h-6" />
          </div>
          <div>
            <span className="block text-[10px] font-mono text-gray-400 uppercase font-bold">พนักงานผู้ปฏิบัติงาน</span>
            <span className="block text-2xl font-black text-emerald-950 mt-0.5">
              {Array.from(new Set(salesRecords.map(r => r.employeeName))).length} คน
            </span>
          </div>
        </div>

        <div className="bg-white border border-orange-100/40 p-5 rounded-2xl shadow-3xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <span className="block text-[10px] font-mono text-gray-400 uppercase font-bold">ผู้จัดการร้าน (ได้รับการยกเว้น)</span>
            <span className="block text-2xl font-black text-purple-950 mt-0.5">
              {employees.filter(e => e.role === 'Manager').length} คน
            </span>
          </div>
        </div>
      </div>

      {/* Staff Roster and Workday ledger details */}
      <div className="bg-white border border-orange-100/50 p-6 rounded-3xl shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
          <div>
            <h3 className="font-display font-bold text-base text-gray-950">ทำเนียบพนักงานและชั่วโมงทำงานสะสม</h3>
            <p className="text-[10px] text-gray-400">ประมวลผลตามรายงานยอดขายจริง สามารถเพิ่ม แก้ไข และลบพนักงานได้ที่การ์ดแต่ละใบ</p>
          </div>
          
          <div className="relative w-full sm:w-48">
            <input 
              type="text" 
              placeholder="ค้นหารายชื่อพนักงาน..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-8.5 pl-8 pr-3 text-xs font-semibold rounded-lg border border-orange-100/60 bg-gray-50/55 focus:bg-white outline-none focus:ring-2 focus:ring-brand-orange/10 focus:border-brand-orange transition-all"
            />
            <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-2.5" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredEmployeesList.map(emp => {
            const workdates = salesRecords
              .filter(r => r.employeeName === emp.name)
              .map(r => r.date)
              .sort((a, b) => b.localeCompare(a));
            
            const isExempt = emp.role === 'Manager';

            return (
              <div 
                key={emp.id} 
                className={`p-4 border rounded-2xl flex flex-col gap-3 relative transition-all bg-white ${isExempt ? 'bg-purple-50/20 border-purple-100/60' : 'bg-gray-50/30 border-gray-100 hover:border-orange-100'}`}
              >
                {/* Actions Top Right */}
                <div className="absolute right-3 top-3 flex items-center gap-1.5">
                  {isExempt && (
                    <span className="text-[9px] font-bold text-purple-700 bg-purple-50 border border-purple-100 py-0.5 px-2 rounded-full flex items-center gap-0.5">
                      <Check className="w-3 h-3 text-purple-600" /> ยกเว้นบันทึกงาน
                    </span>
                  )}
                  <div className="flex items-center gap-1 bg-white/80 border border-gray-200/50 rounded-lg p-0.5 shadow-3xs">
                    <button 
                      onClick={() => handleOpenEdit(emp)}
                      className="p-1 hover:bg-orange-50 hover:text-brand-orange text-gray-400 rounded-md transition-colors cursor-pointer"
                      title="แก้ไขข้อมูลพนักงาน"
                    >
                      <Edit3 className="w-3 h-3" />
                    </button>
                    <button 
                      onClick={() => handleDelete(emp.id, emp.name)}
                      className="p-1 hover:bg-rose-50 hover:text-rose-600 text-gray-400 rounded-md transition-colors cursor-pointer"
                      title="ลบพนักงาน"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-3 mt-1">
                  <div className={`w-9 h-9 rounded-full font-bold text-xs flex items-center justify-center ${isExempt ? 'bg-purple-100 border border-purple-200 text-purple-700' : 'bg-orange-50 border border-orange-100 text-brand-orange'}`}>
                    {emp.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h4 className="font-display font-extrabold text-xs text-gray-950">{emp.name}</h4>
                    <span className="text-[9px] font-mono font-bold text-gray-400 block mt-0.5">
                      {getRoleTh(emp.role)}
                    </span>
                  </div>
                </div>

                <div className="border-t border-gray-100 pt-3 flex flex-col gap-2">
                  <div className="flex justify-between items-center text-[11px] font-semibold text-gray-600">
                    <span>สถานะบันทึกประจำวัน:</span>
                    {isExempt ? (
                      <span className="text-purple-600 text-[10px] font-bold">ยกเว้น (ผู้จัดการร้าน)</span>
                    ) : workdates.length > 0 ? (
                      <span className="text-emerald-600 font-bold font-mono">ทำงานแล้ว {workdates.length} วัน</span>
                    ) : (
                      <span className="text-rose-500 font-bold flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5" /> ยังไม่ลงบันทึกกะใดๆ
                      </span>
                    )}
                  </div>

                  {/* Display work dates chips for audited workers */}
                  {!isExempt && (
                    <div className="flex flex-col gap-1 mt-1">
                      <span className="text-[9px] font-mono font-bold text-gray-400">วันที่ทำงานล่าสุด:</span>
                      {workdates.length > 0 ? (
                        <div className="flex flex-wrap gap-1 max-h-20 overflow-y-auto pr-1">
                          {workdates.map(d => (
                            <span key={d} className="text-[9px] font-mono font-bold bg-white border border-gray-200 text-gray-600 px-2 py-0.5 rounded-md shadow-3xs" title={d}>
                              {formatDateTh(d).split(' ')[0]} {formatDateTh(d).split(' ')[1]}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-[10px] text-gray-400 italic">ไม่มีข้อมูล</span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
          {filteredEmployeesList.length === 0 && (
            <div className="col-span-full py-8 text-center text-xs text-gray-400 italic bg-gray-50/50 rounded-2xl border border-dashed border-gray-200">
              ไม่พบรายชื่อพนักงานที่ตรงกับการค้นหา
            </div>
          )}
        </div>
      </div>

      {/* Audit Search and Table logs */}
      <div className="bg-white border border-orange-100/50 p-6 rounded-3xl shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h3 className="font-display font-bold text-base text-gray-950">บันทึกประวัติการทำงานกะรายวัน</h3>
            <p className="text-[10px] text-gray-400">ตารางตรวจสอบพนักงานผู้ควบคุมปิดกะในแต่วันตามรายงานยอดขายจริง</p>
          </div>

          {/* Filtering Controls */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Dropdown employee name filter */}
            <select
              value={selectedEmployeeName}
              onChange={(e) => setSelectedEmployeeName(e.target.value)}
              className="h-9 px-2 text-[11px] font-semibold rounded-lg border border-orange-100/60 bg-white cursor-pointer focus:outline-none"
            >
              <option value="all">พนักงานทั้งหมด</option>
              {employees.map(emp => (
                <option key={emp.id} value={emp.name}>{emp.name}</option>
              ))}
            </select>

            {/* Dropdown month filter */}
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="h-9 px-2 text-[11px] font-semibold rounded-lg border border-orange-100/60 bg-white cursor-pointer focus:outline-none"
            >
              <option value="all">เดือนทั้งหมด</option>
              {uniqueMonths.map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-orange-50/30 border-b border-orange-100/40 text-[10px] font-mono uppercase font-bold text-gray-400">
                <th className="py-3 px-5">วันที่ทำรายการ</th>
                <th className="py-3 px-5">ชื่อพนักงานที่ลงกะ (ผู้พิมพ์ชื่อตนเอง)</th>
                <th className="py-3 px-5">บทบาทปัจจุบัน</th>
                <th className="py-3 px-5">ยอดขายในกะ</th>
                <th className="py-3 px-5 text-right">สถานะตรวจสอบ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredWorkdayRecords.length > 0 ? (
                filteredWorkdayRecords.map((record) => {
                  const empObj = employees.find(e => e.name === record.employeeName);
                  const roleStr = empObj ? getRoleTh(empObj.role) : 'พนักงานทั่วไป (พิมพ์เอง)';
                  
                  return (
                    <tr key={record.id} className="text-xs hover:bg-orange-50/5 transition-colors">
                      <td className="py-3.5 px-5 font-mono font-bold text-gray-600">
                        {formatDateTh(record.date)}
                      </td>
                      <td className="py-3.5 px-5 font-bold font-display text-gray-950">
                        {record.employeeName}
                      </td>
                      <td className="py-3.5 px-5">
                        <span className="px-2 py-0.5 rounded-md text-[9px] font-mono font-bold uppercase tracking-wider bg-gray-50 border border-gray-200 text-gray-500">
                          {roleStr}
                        </span>
                      </td>
                      <td className="py-3.5 px-5 font-mono font-bold text-brand-orange">
                        ฿{record.salesAmount.toLocaleString()}
                      </td>
                      <td className="py-3.5 px-5 text-right whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full">
                          <CheckCircle className="w-3.5 h-3.5" /> ลงรายงานประจำวันแล้ว
                        </span>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-xs text-gray-400 italic">
                    ไม่พบข้อมูลประวัติวันเข้างานตรงตามเงื่อนไขที่เลือก
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Employee Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl border border-orange-100 p-6 w-full max-w-md shadow-2xl relative overflow-hidden"
            >
              <div className="flex items-center justify-between pb-4 border-b border-orange-100/30 mb-5">
                <h3 className="font-display font-bold text-base text-gray-900 flex items-center gap-2">
                  <Users className="w-5 h-5 text-brand-orange" />
                  {editingEmp ? 'แก้ไขข้อมูลพนักงาน' : 'เพิ่มพนักงานใหม่'}
                </h3>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="p-1 hover:bg-gray-100 text-gray-400 hover:text-gray-600 rounded-lg transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {modalSuccess ? (
                <div className="py-8 text-center flex flex-col items-center justify-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                    <Check className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-emerald-950">{editingEmp ? 'แก้ไขข้อมูลสำเร็จแล้ว!' : 'เพิ่มพนักงานเรียบร้อย!'}</h4>
                    <p className="text-xs text-emerald-600/80 mt-1">ข้อมูลบุคลากรได้รับการบันทึกซิงค์กับคลาวด์แล้ว</p>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                  {modalError && (
                    <div className="bg-rose-50 border border-rose-100 text-rose-800 p-3 rounded-xl text-xs leading-relaxed">
                      {modalError}
                    </div>
                  )}

                  {/* Name Input */}
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-mono font-bold uppercase text-gray-400">ชื่อ-นามสกุล พนักงาน</label>
                    <input 
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full h-11 px-4 rounded-xl border border-orange-100 glass-input text-sm font-semibold"
                      placeholder="ระบุชื่อพนักงาน..."
                    />
                  </div>

                  {/* System Role Choice */}
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-mono font-bold uppercase text-gray-400">บทบาทและสิทธิ์ระบบ</label>
                    <select
                      value={role}
                      onChange={(e) => setRole(e.target.value as any)}
                      className="w-full h-11 px-4 py-2 rounded-xl border border-orange-100 glass-input text-xs font-semibold cursor-pointer"
                    >
                      <option value="Admin">ผู้ดูแลระบบ (สิทธิ์จัดการทุกส่วนของระบบ)</option>
                      <option value="Manager">ผู้จัดการร้าน (สิทธิ์จัดการระบบเกือบทั้งหมด ไม่ต้องลงบันทึกประจำวัน)</option>
                      <option value="AssistantManager">รองผู้จัดการร้าน (สิทธิ์ช่วยดูแลและตรวจสอบรายการประจำวัน)</option>
                      <option value="ShiftLeader">หัวหน้ากะ (ดูแลกะขาย บันทึกข้อมูลประจำวัน)</option>
                      <option value="AssistantShiftLeader">รองหัวหน้ากะ (ร่วมบันทึกข้อมูลประจำวันประจำกะ)</option>
                      <option value="Employee">พนักงานทั่วไป (สิทธิ์บันทึกและจัดการรายการพื้นฐาน)</option>
                    </select>
                  </div>

                  {/* Target Sales */}
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-mono font-bold uppercase text-gray-400">เป้าหมายยอดขายรายเดือน (บาท)</label>
                    <div className="relative">
                      <input 
                        type="number"
                        required
                        min="0"
                        value={targetSales || ''}
                        onChange={(e) => setTargetSales(parseInt(e.target.value) || 0)}
                        className="w-full h-11 pl-4 pr-16 rounded-xl border border-orange-100 glass-input text-sm font-bold font-mono text-gray-950"
                        placeholder="฿ 80,000"
                      />
                      <span className="absolute right-4 top-3 text-xs font-bold text-gray-400">บาท / เดือน</span>
                    </div>
                  </div>

                  {/* Active Status Toggle */}
                  <div className="flex items-center justify-between p-3.5 bg-gray-50 rounded-2xl border border-gray-100 mt-2">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-xs font-bold text-gray-950">สถานะพร้อมปฏิบัติงาน</span>
                      <span className="text-[10px] text-gray-400 leading-none">พนักงานที่ระงับสถานะจะไม่สามารถลงบันทึกข้อมูลในระบบได้</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActive(!active)}
                      className={`w-12 h-6.5 rounded-full p-1 transition-colors cursor-pointer ${active ? 'bg-emerald-500' : 'bg-gray-300'}`}
                    >
                      <div className={`bg-white w-4.5 h-4.5 rounded-full transition-transform duration-300 ${active ? 'translate-x-5.5' : 'translate-x-0'}`} />
                    </button>
                  </div>

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
                      บันทึกข้อมูลพนักงาน
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
