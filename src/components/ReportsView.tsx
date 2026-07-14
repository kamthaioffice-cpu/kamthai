import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  FileText, Download, Printer, Calendar, TrendingUp, DollarSign, Receipt, Weight, Calculator, Search, Filter, Sparkles, ChevronDown, ChevronUp
} from 'lucide-react';
import { useDatabase } from '../context/DatabaseContext';
import { SalesRecord } from '../types';

export const ReportsView: React.FC = () => {
  const { salesRecords, expenses, isGoogleLinked, exportMonthlySummary, loginWithGoogle } = useDatabase();
  const [reportType, setReportType] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('weekly');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().substring(0, 7)); // YYYY-MM
  const [selectedYear, setSelectedYear] = useState('2026');

  const [exporting, setExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState<string | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  // Filter sales based on selected period
  const getFilteredRecords = (): SalesRecord[] => {
    return salesRecords.filter(record => {
      const recDate = new Date(record.date);
      
      if (reportType === 'daily') {
        return record.date === selectedDate;
      }
      
      if (reportType === 'weekly') {
        // Simple approximation: last 7 days from selectedDate
        const targetDate = new Date(selectedDate);
        const diffTime = Math.abs(targetDate.getTime() - recDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays <= 7 && recDate <= targetDate;
      }
      
      if (reportType === 'monthly') {
        return record.date.startsWith(selectedMonth);
      }
      
      if (reportType === 'yearly') {
        return record.date.startsWith(selectedYear);
      }
      
      return true;
    }).sort((a, b) => b.date.localeCompare(a.date));
  };

  const filteredRecords = getFilteredRecords();

  // Aggregate Metrics over selected period
  const totalSales = filteredRecords.reduce((sum, r) => sum + r.salesAmount, 0);
  const totalProfit = filteredRecords.reduce((sum, r) => sum + r.profit, 0);
  const totalExpense = filteredRecords.reduce((sum, r) => sum + r.expense, 0);
  const totalPorkBefore = filteredRecords.reduce((sum, r) => sum + r.porkBeforeFry, 0);
  const totalPorkAfter = filteredRecords.reduce((sum, r) => sum + r.porkAfterFry, 0);
  const totalPorkSold = filteredRecords.reduce((sum, r) => sum + r.weightSold, 0);
  const avgYield = filteredRecords.length > 0 
    ? Math.round((filteredRecords.reduce((sum, r) => sum + r.fryingYieldPercent, 0) / filteredRecords.length) * 10) / 10
    : 0;

  // Payments splits
  const cash = filteredRecords.reduce((sum, r) => sum + r.cash, 0);
  const transfer = filteredRecords.reduce((sum, r) => sum + r.moneyTransfer, 0);
  const thaiChuayThai = filteredRecords.reduce((sum, r) => sum + r.thaiChuayThai, 0);
  const lineMan = filteredRecords.reduce((sum, r) => sum + r.lineMan, 0);
  const grab = filteredRecords.reduce((sum, r) => sum + r.grab, 0);
  const totalIntake = cash + transfer + thaiChuayThai + lineMan + grab;
  const differenceSum = filteredRecords.reduce((sum, r) => sum + r.difference, 0);

  // Export CSV Helper
  const handleExportCSV = () => {
    if (filteredRecords.length === 0) return;

    const headers = [
      'วันที่', 'พนักงาน', 'หมูดิบ (กก.)', 'หมูทอด (กก.)', 'หมูที่ขายได้ (กก.)',
      'ยอดขายรวม (บาท)', 'เงินสด (บาท)', 'เงินโอน (บาท)', 'LINE MAN (บาท)', 'Grab (บาท)',
      'รายจ่ายย่อย (บาท)', 'อัตราผลผลิต %', 'ยอดต่างลิ้นชัก (บาท)', 'กำไรประเมิน (บาท)', 'หมายเหตุ'
    ];

    const rows = filteredRecords.map(r => [
      r.date, r.employeeName, r.porkBeforeFry, r.porkAfterFry, r.weightSold,
      r.salesAmount, r.cash, r.moneyTransfer, r.lineMan, r.grab,
      r.expense, r.fryingYieldPercent, r.difference, r.profit, r.remark.replace(/,/g, ';')
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `KamThai_Sales_Report_${reportType}_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Triggers print view
  const handlePrint = () => {
    window.print();
  };

  // Export Monthly Summary to Google Sheets
  const handleExportToSheets = async () => {
    setExporting(true);
    setExportSuccess(null);
    setExportError(null);
    try {
      const metrics = {
        totalSales,
        totalProfit,
        totalExpense,
        totalPorkSold,
        avgYield,
        cash,
        transfer,
        thaiChuayThai,
        lineMan,
        grab
      };
      const sheetName = await exportMonthlySummary(selectedMonth, metrics, filteredRecords);
      setExportSuccess(sheetName);
    } catch (err: any) {
      setExportError(err.message || 'เกิดข้อผิดพลาดในการส่งออกข้อมูล');
    } finally {
      setExporting(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col gap-8 pb-16 print:p-0"
    >
      {/* Header (Hidden in Print) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
        <div>
          <span className="text-xs font-mono font-bold uppercase tracking-widest text-brand-orange bg-brand-orange/10 px-3 py-1 rounded-full">
            บัญชีและการเงิน
          </span>
          <h1 className="text-3xl font-extrabold tracking-tight text-gray-950 mt-2">
            รายงานยอดขายและการปิดกะ
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            ตรวจสอบข้อมูลแยกตามช่วงเวลา ตรวจสอบช่องทางการชำระเงิน จัดพิมพ์รายงาน และดาวน์โหลดไฟล์ CSV ไปใช้งานต่อ
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            disabled={filteredRecords.length === 0}
            className="py-2 px-4 border border-gray-200 bg-white hover:bg-gray-50 active:scale-95 text-xs font-semibold rounded-xl flex items-center gap-2 transition-all cursor-pointer shadow-3xs"
          >
            <Download className="w-4 h-4" />
            ดาวน์โหลดไฟล์ CSV / Excel
          </button>
          
          <button
            onClick={handlePrint}
            disabled={filteredRecords.length === 0}
            className="py-2 px-4 bg-orange-950 hover:bg-black text-white hover:opacity-90 active:scale-95 text-xs font-semibold rounded-xl flex items-center gap-2 shadow-md transition-all cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            พิมพ์รายงาน
          </button>
        </div>
      </div>

      {/* Reports Period Controls Bar (Hidden in Print) */}
      <div className="bg-white border border-orange-100/40 p-5 rounded-3xl shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6 print:hidden">
        
        {/* Toggle selectors */}
        <div className="flex items-center gap-1.5 p-1 bg-gray-50 border border-gray-100 rounded-2xl w-fit">
          {(['daily', 'weekly', 'monthly', 'yearly'] as const).map((type) => (
            <button
              key={type}
              onClick={() => setReportType(type)}
              className={`py-2 px-4 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${reportType === type ? 'bg-white text-brand-orange shadow-xs border border-orange-100/40' : 'text-gray-500 hover:text-gray-900'}`}
            >
              {type === 'daily' ? 'รายวัน' : type === 'weekly' ? 'รายสัปดาห์' : type === 'monthly' ? 'รายเดือน' : 'รายปี'}
            </button>
          ))}
        </div>

        {/* Dynamic Period Selectors */}
        <div className="flex flex-wrap items-center gap-4">
          
          {reportType === 'daily' && (
            <div className="flex flex-col gap-1">
              <span className="text-[9px] font-mono font-bold text-gray-400 uppercase">เลือกวันที่ต้องการดู</span>
              <input 
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="h-10 px-3 border border-orange-100 rounded-xl text-xs font-semibold bg-white outline-none"
              />
            </div>
          )}

          {reportType === 'weekly' && (
            <div className="flex flex-col gap-1">
              <span className="text-[9px] font-mono font-bold text-gray-400 uppercase">เลือกวันสิ้นสุดสัปดาห์</span>
              <div className="flex items-center gap-2">
                <input 
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="h-10 px-3 border border-orange-100 rounded-xl text-xs font-semibold bg-white outline-none"
                />
                <span className="text-[10px] text-gray-400 font-mono">แสดงย้อนหลัง 7 วัน</span>
              </div>
            </div>
          )}

          {reportType === 'monthly' && (
            <div className="flex flex-col gap-1">
              <span className="text-[9px] font-mono font-bold text-gray-400 uppercase">เลือกเดือน</span>
              <input 
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="h-10 px-3 border border-orange-100 rounded-xl text-xs font-semibold bg-white outline-none"
              />
            </div>
          )}

          {reportType === 'yearly' && (
            <div className="flex flex-col gap-1">
              <span className="text-[9px] font-mono font-bold text-gray-400 uppercase">เลือกปี</span>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="h-10 px-4 border border-orange-100 rounded-xl text-xs font-semibold bg-white outline-none cursor-pointer"
              >
                <option value="2026">2026</option>
                <option value="2025">2025</option>
                <option value="2024">2024</option>
              </select>
            </div>
          )}

        </div>
      </div>

      {/* Google Sheets Monthly Export Block */}
      {reportType === 'monthly' && (
        <div className="bg-gradient-to-r from-orange-50/70 to-amber-50/70 border border-orange-100/60 p-6 rounded-3xl shadow-3xs flex flex-col md:flex-row items-start md:items-center justify-between gap-6 print:hidden">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-white rounded-2xl shadow-3xs border border-orange-100/50 text-brand-orange">
              <Sparkles className="w-6 h-6 animate-pulse" />
            </div>
            <div className="flex-1">
              <h2 className="text-sm font-bold text-gray-950 flex flex-wrap items-center gap-2">
                สรุปยอดขายรายเดือนใน Google Sheets
                <span className="flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full border border-emerald-100 bg-emerald-50 text-emerald-700">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                  รองรับระบบคลาวด์
                </span>
              </h2>
              <p className="text-xs text-gray-500 mt-1 max-w-xl">
                ส่งออกรายงานยอดเงิน, ยอดขายรายวัน (เงินสด, เงินโอน, และเดลิเวอรี่) <strong className="text-brand-orange font-semibold">พร้อมกับสรุปความเคลื่อนไหวคลังสินค้าวัตถุดิบสะสม (ยอดยกมา, รับเข้า, เบิกใช้, คงเหลือ)</strong> ประจำเดือน <strong className="text-gray-900">{selectedMonth}</strong> ไปยังตารางวิเคราะห์ข้อมูลระดับมืออาชีพใน Google Sheets
              </p>
              {exportSuccess && (
                <div className="mt-3 p-2.5 bg-emerald-50 border border-emerald-100 rounded-xl text-[11px] text-emerald-800 font-medium flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  ส่งออกไปยังแท็บ "{exportSuccess}" สำเร็จเรียบร้อยแล้ว! คุณสามารถเปิด Google Sheets ของคุณเพื่อดูข้อมูลได้ทันที
                </div>
              )}
              {exportError && (
                <div className="mt-3 p-2.5 bg-red-50 border border-red-100 rounded-xl text-[11px] text-red-800 font-medium flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                  {exportError}
                </div>
              )}
            </div>
          </div>

          <div className="self-stretch md:self-auto flex items-center justify-end">
            {isGoogleLinked ? (
              <button
                onClick={handleExportToSheets}
                disabled={exporting || filteredRecords.length === 0}
                className="w-full md:w-auto h-11 px-5 bg-orange-950 hover:bg-black text-white hover:opacity-90 active:scale-95 disabled:opacity-50 text-xs font-bold rounded-2xl flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer whitespace-nowrap"
              >
                {exporting ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    กำลังส่งออกข้อมูล...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    ส่งออกสรุปรายเดือนไปยัง Google Sheets
                  </>
                )}
              </button>
            ) : (
              <button
                onClick={loginWithGoogle}
                className="w-full md:w-auto h-11 px-5 border border-orange-200 bg-white hover:bg-orange-50/50 text-orange-950 active:scale-95 text-xs font-bold rounded-2xl flex items-center justify-center gap-2 shadow-3xs transition-all cursor-pointer whitespace-nowrap"
              >
                <Sparkles className="w-4 h-4 text-brand-orange" />
                เชื่อมต่อ Google Sheets เพื่อส่งออกข้อมูล
              </button>
            )}
          </div>
        </div>
      )}

      {/* Printable Report Header */}
      <div className="hidden print:block mb-8">
        <h1 className="text-2xl font-black font-display text-gray-950 uppercase tracking-tight">แก้มไทย - รายงานการตรวจสอบยอดขาย</h1>
        <div className="grid grid-cols-2 mt-4 text-[11px] font-mono text-gray-500 border-b border-gray-100 pb-4">
          <div>
            <span>ขอบเขตรายงาน: <strong>{reportType === 'daily' ? 'รายวัน' : reportType === 'weekly' ? 'รายสัปดาห์' : reportType === 'monthly' ? 'รายเดือน' : 'รายปี'}</strong></span>
            <span className="block mt-1">รายละเอียดช่วงเวลา: {reportType === 'daily' ? selectedDate : reportType === 'weekly' ? `${selectedDate} (ย้อนหลัง 7 วัน)` : reportType === 'monthly' ? selectedMonth : selectedYear}</span>
          </div>
          <div className="text-right">
            <span>พิมพ์เมื่อ: {new Date().toLocaleDateString()}</span>
            <span className="block mt-1">สถานะ: ปิดยอดการตรวจสอบกะการขายเรียบร้อย</span>
          </div>
        </div>
      </div>

      {/* Aggregate metrics grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-5">
        
        <div className="bg-white border border-orange-100/30 rounded-2xl p-4 shadow-3xs flex flex-col justify-between">
          <span className="text-[10px] font-mono font-bold text-gray-400 uppercase">ยอดขายรวม</span>
          <span className="text-base font-extrabold font-mono text-gray-950 mt-2">฿{totalSales.toLocaleString()}</span>
        </div>

        <div className="bg-white border border-orange-100/30 rounded-2xl p-4 shadow-3xs flex flex-col justify-between">
          <span className="text-[10px] font-mono font-bold text-gray-400 uppercase">กำไรสุทธิ</span>
          <span className={`text-base font-extrabold font-mono mt-2 ${totalProfit < 0 ? 'text-red-600' : 'text-emerald-600'}`}>฿{totalProfit.toLocaleString()}</span>
        </div>

        <div className="bg-white border border-orange-100/30 rounded-2xl p-4 shadow-3xs flex flex-col justify-between">
          <span className="text-[10px] font-mono font-bold text-gray-400 uppercase">รายจ่ายย่อย</span>
          <span className="text-base font-extrabold font-mono text-gray-950 mt-2">฿{totalExpense.toLocaleString()}</span>
        </div>

        <div className="bg-white border border-orange-100/30 rounded-2xl p-4 shadow-3xs flex flex-col justify-between">
          <span className="text-[10px] font-mono font-bold text-gray-400 uppercase">น้ำหนักหมูทอด</span>
          <span className="text-base font-extrabold font-mono text-gray-950 mt-2">{Math.round(totalPorkAfter)} กก.</span>
        </div>

        <div className="bg-white border border-orange-100/30 rounded-2xl p-4 shadow-3xs flex flex-col justify-between">
          <span className="text-[10px] font-mono font-bold text-gray-400 uppercase">น้ำหนักหมูที่ขาย</span>
          <span className="text-base font-extrabold font-mono text-gray-950 mt-2">{Math.round(totalPorkSold)} กก.</span>
        </div>

        <div className="bg-white border border-orange-100/30 rounded-2xl p-4 shadow-3xs flex flex-col justify-between">
          <span className="text-[10px] font-mono font-bold text-gray-400 uppercase">อัตราผลผลิตเฉลี่ย</span>
          <span className="text-base font-extrabold font-mono text-brand-orange mt-2">{avgYield}%</span>
        </div>

      </div>

      {/* Channels Split Table */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Payment Channels aggregates */}
        <div className="md:col-span-1 bg-white border border-orange-100/40 p-5 rounded-2xl shadow-3xs">
          <h3 className="font-display font-bold text-xs text-gray-950 uppercase tracking-wide mb-4">ช่องทางการชำระเงิน</h3>
          <div className="flex flex-col gap-3 font-mono text-[11px]">
            
            <div className="flex justify-between items-center py-1.5 border-b border-gray-50">
              <span className="text-gray-500">เงินสดในลิ้นชัก</span>
              <span className="font-bold text-gray-900">฿{cash.toLocaleString()}</span>
            </div>

            <div className="flex justify-between items-center py-1.5 border-b border-gray-50">
              <span className="text-gray-500">เงินโอนผ่าน QR</span>
              <span className="font-bold text-gray-900">฿{transfer.toLocaleString()}</span>
            </div>

            <div className="flex justify-between items-center py-1.5 border-b border-gray-50">
              <span className="text-gray-500">ไทยช่วยไทย</span>
              <span className="font-bold text-gray-900">฿{thaiChuayThai.toLocaleString()}</span>
            </div>

            <div className="flex justify-between items-center py-1.5 border-b border-gray-50">
              <span className="text-gray-500">ยอดขาย LINE MAN</span>
              <span className="font-bold text-emerald-600">฿{lineMan.toLocaleString()}</span>
            </div>

            <div className="flex justify-between items-center py-1.5 border-b border-gray-50">
              <span className="text-gray-500">ยอดขาย Grab Food</span>
              <span className="font-bold text-emerald-600">฿{grab.toLocaleString()}</span>
            </div>

            <div className="flex justify-between items-center pt-2 font-bold text-xs text-brand-orange">
              <span>ยอดเงินเข้าเก๊ะรวม</span>
              <span>฿{totalIntake.toLocaleString()}</span>
            </div>

            <div className="flex justify-between items-center py-1 text-[10px] text-gray-400">
              <span>ความต่างลิ้นชักเก็บเงิน</span>
              <span className={differenceSum < 0 ? 'text-red-500' : 'text-emerald-600'}>{differenceSum > 0 ? '+' : ''}{differenceSum.toLocaleString()} บาท</span>
            </div>

          </div>
        </div>

        {/* Detailed Transactions List Table */}
        <div className="md:col-span-2 bg-white border border-orange-100/40 rounded-2xl shadow-3xs overflow-hidden flex flex-col justify-between">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-orange-50/30 border-b border-orange-100/40 text-[10px] font-mono uppercase font-bold text-gray-400">
                  <th className="py-3 px-5 w-8"></th>
                  <th className="py-3 px-5">วันที่</th>
                  <th className="py-3 px-5">พนักงานผู้ปิดกะ</th>
                  <th className="py-3 px-5">หมูที่ขาย</th>
                  <th className="py-3 px-5">ยอดขายรวม</th>
                  <th className="py-3 px-5">อัตราผลผลิต</th>
                  <th className="py-3 px-5">กำไรของกะ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 text-xs">
                {filteredRecords.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-gray-400 font-medium">
                      ไม่พบประวัติการปิดกะการขายในช่วงเวลานี้
                    </td>
                  </tr>
                ) : (
                  filteredRecords.map((r) => {
                    const isExpanded = expandedRow === r.id;
                    return (
                      <React.Fragment key={r.id}>
                        <tr 
                          onClick={() => setExpandedRow(isExpanded ? null : r.id)}
                          className="hover:bg-orange-50/5 transition-colors cursor-pointer"
                        >
                          <td className="py-3 px-5">
                            {isExpanded ? (
                              <ChevronUp className="w-3.5 h-3.5 text-gray-400" />
                            ) : (
                              <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
                            )}
                          </td>
                          <td className="py-3 px-5 font-mono text-gray-500 whitespace-nowrap">{r.date}</td>
                          <td className="py-3 px-5 font-display font-semibold text-gray-950 whitespace-nowrap">{r.employeeName}</td>
                          <td className="py-3 px-5 font-mono font-semibold text-gray-700 whitespace-nowrap">{r.weightSold} กก.</td>
                          <td className="py-3 px-5 font-mono font-bold text-gray-950 whitespace-nowrap">฿{r.salesAmount.toLocaleString()}</td>
                          <td className="py-3 px-5 font-mono text-orange-600 font-bold whitespace-nowrap">{r.fryingYieldPercent}%</td>
                          <td className={`py-3 px-5 font-mono font-bold whitespace-nowrap ${r.profit < 0 ? 'text-red-500' : 'text-emerald-600'}`}>
                            ฿{r.profit.toLocaleString()}
                          </td>
                        </tr>
                        {isExpanded && (
                          <tr className="bg-orange-50/[0.15]">
                            <td colSpan={7} className="py-4 px-6 border-b border-orange-100/10">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-gray-600">
                                <div className="flex flex-col gap-2">
                                  <h4 className="text-[10px] font-mono font-bold uppercase tracking-wider text-gray-400">รายละเอียดเพิ่มเติมของกะ</h4>
                                  <div className="text-xs bg-white border border-orange-100/30 p-3 rounded-xl shadow-3xs">
                                    <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
                                      <div><span className="text-gray-400">หมูก่อนทอด:</span> <strong className="text-gray-900">{r.porkBeforeFry} กก.</strong></div>
                                      <div><span className="text-gray-400">หมูหลังทอด:</span> <strong className="text-gray-900">{r.porkAfterFry} กก.</strong></div>
                                      <div><span className="text-gray-400">สต็อกยกมา:</span> <strong className="text-gray-900">{r.previousRemainingStock} กก.</strong></div>
                                      <div><span className="text-gray-400">สต็อกเหลือจริง:</span> <strong className="text-gray-900">{r.remainingStockAfterSales} กก.</strong></div>
                                      <div className="col-span-2 border-t border-gray-100/60 my-1 pt-1.5">
                                        <span className="text-gray-400">รายจ่ายเงินสดย่อย:</span> <strong className="text-red-600">฿{r.expense?.toLocaleString() || 0}</strong>
                                      </div>
                                    </div>
                                    {r.remark && (
                                      <div className="mt-2 border-t border-gray-100/60 pt-2 text-[11px]">
                                        <span className="text-gray-400 block font-bold mb-0.5">หมายเหตุหัวหน้ากะ:</span>
                                        <p className="text-gray-700 italic font-semibold font-display leading-relaxed">"{r.remark}"</p>
                                      </div>
                                    )}
                                  </div>
                                </div>
                                <div className="flex flex-col gap-2">
                                  <h4 className="text-[10px] font-mono font-bold uppercase tracking-wider text-gray-400">รายการวัตถุดิบและอุปกรณ์ที่เบิกใช้งาน</h4>
                                  <div className="text-xs bg-white border border-orange-100/30 p-3 rounded-xl shadow-3xs">
                                    {r.withdrawals && r.withdrawals.length > 0 ? (
                                      <div className="grid grid-cols-1 gap-1.5">
                                        {r.withdrawals.map((w, idx) => (
                                          <div key={idx} className="flex items-center justify-between py-1 border-b border-gray-50 last:border-0 font-mono text-[11px]">
                                            <span className="text-gray-700 font-semibold">{w.product}</span>
                                            <span className="font-bold text-brand-orange bg-orange-50 px-2 py-0.5 rounded-md text-[10px]">
                                              เบิก {w.amount}
                                            </span>
                                          </div>
                                        ))}
                                      </div>
                                    ) : (
                                      <div className="text-center py-4 text-gray-400 text-[11px]">
                                        ไม่มีรายการเบิกของในกะนี้
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <div className="p-4 bg-orange-50/10 border-t border-orange-100/30 flex items-center justify-between text-xs font-semibold print:hidden">
            <span className="text-gray-400 uppercase tracking-wider text-[9px] font-mono">พบทั้งหมด: {filteredRecords.length} กะ</span>
            <span className="text-sm font-extrabold font-mono text-brand-orange">
              รวมช่วงเวลา: ฿{totalSales.toLocaleString()}
            </span>
          </div>
        </div>

      </div>
    </motion.div>
  );
};
