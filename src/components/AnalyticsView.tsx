import React from 'react';
import { motion } from 'motion/react';
import { 
  AreaChart, Area, BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts';
import { 
  BarChart3, TrendingUp, DollarSign, Receipt, Sparkles, PieChart as PieIcon, Activity, Flame
} from 'lucide-react';
import { useDatabase } from '../context/DatabaseContext';

export const AnalyticsView: React.FC = () => {
  const { salesRecords, expenses } = useDatabase();

  // 1. Core aggregates data formatting: Chronological sort
  const chronRecords = [...salesRecords].sort((a, b) => a.date.localeCompare(b.date));

  // Sales and Profit Trend over last 15 shifts
  const trendData = chronRecords.slice(-15).map(r => ({
    date: r.date.substring(5), // MM-DD
    'ยอดขาย': r.salesAmount,
    'กำไรสุทธิ': r.profit,
    'น้ำหนักหมูทอด': r.porkAfterFry,
    'น้ำหนักหมูที่ขาย': r.weightSold
  }));

  // 2. Day of Week Sales Aggregation
  const getDayNameTh = (dateStr: string) => {
    const d = new Date(dateStr);
    const dayIndex = d.getDay(); // 0 is Sunday, 1 is Monday, etc.
    const daysTh = ['อา.', 'จ.', 'อ.', 'พ.', 'พฤ.', 'ศ.', 'ส.'];
    return daysTh[dayIndex];
  };

  const dayOfWeekAgg = salesRecords.reduce((acc, curr) => {
    const day = getDayNameTh(curr.date);
    if (!acc[day]) acc[day] = { count: 0, salesTotal: 0 };
    acc[day].count += 1;
    acc[day].salesTotal += curr.salesAmount;
    return acc;
  }, {} as Record<string, { count: number; salesTotal: number }>);

  const daysOfWeek = ['จ.', 'อ.', 'พ.', 'พฤ.', 'ศ.', 'ส.', 'อา.'];
  const dayOfWeekData = daysOfWeek.map(day => {
    const data = dayOfWeekAgg[day];
    return {
      day,
      'ยอดขายเฉลี่ย': data ? Math.round(data.salesTotal / data.count) : 0,
      'จำนวนกะ': data ? data.count : 0
    };
  });

  // 3. Expenses Aggregates by Category
  const expenseAgg = expenses.reduce((acc, curr) => {
    acc[curr.category] = (acc[curr.category] || 0) + curr.amount;
    return acc;
  }, {} as Record<string, number>);

  const categoryNamesTh: Record<string, string> = {
    'Raw Pork': 'เนื้อหมูดิบ',
    'Oil': 'น้ำมันพืช',
    'Marinade & Condiments': 'ซอสปรุงรสและเครื่องปรุง',
    'Packaging': 'กล่องและบรรจุภัณฑ์',
    'Gas & Utilities': 'แก๊สและค่าสาธารณูปโภค',
    'Store Supplies': 'ของใช้อเนกประสงค์ในร้าน',
    'Wages & Staff': 'ค่าแรงและเบี้ยเลี้ยงพนักงาน',
    'Other': 'ค่าใช้จ่ายอื่นๆ'
  };

  const getCategoryTh = (cat: string) => categoryNamesTh[cat] || cat;

  const COLORS = ['#ff5722', '#f97316', '#3b82f6', '#10b981', '#a855f7', '#ec4899', '#06b6d4', '#64748b'];
  const expensePieData = Object.entries(expenseAgg).map(([name, value]) => ({
    name: getCategoryTh(name),
    value: Number(value)
  })).sort((a, b) => b.value - a.value);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col gap-8 pb-16"
    >
      {/* Header */}
      <div>
        <span className="text-xs font-mono font-bold uppercase tracking-widest text-brand-orange bg-brand-orange/10 px-3 py-1 rounded-full">
          การวิเคราะห์ข้อมูลเชิงลึก
        </span>
        <h1 className="text-3xl font-extrabold tracking-tight text-gray-950 mt-2">
          แนวโน้มธุรกิจและรายงานวิเคราะห์
        </h1>
        <p className="text-xs text-gray-500 mt-1">
          สรุปรายงานผลการดำเนินงาน ยอดขายเฉลี่ยรายวัน อัตราสูญเสียการทอดหมู และสัดส่วนค่าใช้จ่ายเพื่อช่วยเพิ่มผลกำไร
        </p>
      </div>

      {/* Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Chart 1: Revenue vs Net Profit Trend Line */}
        <div className="bg-white border border-orange-100/50 p-6 rounded-3xl shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="font-display font-bold text-base text-gray-950 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-brand-orange" />
              เปรียบเทียบ ยอดขาย vs กำไรสุทธิ (15 กะล่าสุด)
            </h3>
            <p className="text-[10px] text-gray-400">วิเคราะห์เพื่อตรวจสอบอัตรากำไรและความต่อเนื่องของผลตอบแทน</p>
          </div>

          <div className="h-64 w-full mt-6">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f5e6de" />
                <XAxis dataKey="date" stroke="#a38f85" style={{ fontSize: 9, fontFamily: 'var(--font-mono)' }} tickLine={false} axisLine={false} />
                <YAxis stroke="#a38f85" style={{ fontSize: 9, fontFamily: 'var(--font-mono)' }} tickLine={false} axisLine={false} tickFormatter={(v) => { const num = Number(v); return `฿${num >= 1000 ? (num/1000) + 'k' : num}`; }} />
                <Tooltip formatter={(value) => `฿${Number(value).toLocaleString()}`} />
                <Line type="monotone" name="ยอดขาย" dataKey="ยอดขาย" stroke="#ff5722" strokeWidth={3} activeDot={{ r: 6 }} dot={{ r: 3 }} />
                <Line type="monotone" name="กำไรสุทธิ" dataKey="กำไรสุทธิ" stroke="#10b981" strokeWidth={2.5} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Prepared Pork vs Sold Pork Area */}
        <div className="bg-white border border-orange-100/50 p-6 rounded-3xl shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="font-display font-bold text-base text-gray-950 flex items-center gap-2">
              <Flame className="w-5 h-5 text-orange-500" />
              การใช้ประโยชน์และผลผลิตหมูทอด
            </h3>
            <p className="text-[10px] text-gray-400">เปรียบเทียบ หมูทอดเสร็จ (กก.) กับ หมูที่ขายได้ (กก.)</p>
          </div>

          <div className="h-64 w-full mt-6">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="colorPrepared" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f97316" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorSold" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ff5722" stopOpacity={0.25}/>
                    <stop offset="95%" stopColor="#ff5722" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f5e6de" />
                <XAxis dataKey="date" stroke="#a38f85" style={{ fontSize: 9, fontFamily: 'var(--font-mono)' }} tickLine={false} axisLine={false} />
                <YAxis stroke="#a38f85" style={{ fontSize: 9, fontFamily: 'var(--font-mono)' }} tickLine={false} axisLine={false} tickFormatter={(v) => `${v} กก.`} />
                <Tooltip formatter={(value) => `${value} กก.`} />
                <Area type="monotone" name="หมูทอดแล้ว" dataKey="น้ำหนักหมูทอด" stroke="#f97316" strokeWidth={2} fillOpacity={1} fill="url(#colorPrepared)" />
                <Area type="monotone" name="หมูที่ขายได้" dataKey="น้ำหนักหมูที่ขาย" stroke="#ff5722" strokeWidth={3} fillOpacity={1} fill="url(#colorSold)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 3: Average Sales by Day of Week Bar */}
        <div className="bg-white border border-orange-100/50 p-6 rounded-3xl shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="font-display font-bold text-base text-gray-950 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-brand-orange" />
              ยอดขายเฉลี่ยแยกตามวันในสัปดาห์
            </h3>
            <p className="text-[10px] text-gray-400">แสดงวันที่มีลูกค้าหนาแน่นที่สุดเพื่อวางแผนการเตรียมวัตถุดิบและกำลังคน</p>
          </div>

          <div className="h-64 w-full mt-6">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dayOfWeekData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f5e6de" />
                <XAxis dataKey="day" stroke="#a38f85" style={{ fontSize: 9, fontFamily: 'var(--font-mono)' }} tickLine={false} axisLine={false} />
                <YAxis stroke="#a38f85" style={{ fontSize: 9, fontFamily: 'var(--font-mono)' }} tickLine={false} axisLine={false} tickFormatter={(v) => `฿${Number(v)/1000}k`} />
                <Tooltip formatter={(value) => `฿${Number(value).toLocaleString()}`} />
                <Bar name="ยอดขายเฉลี่ย" dataKey="ยอดขายเฉลี่ย" fill="#ff5722" radius={[6, 6, 0, 0]} maxBarSize={36} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 4: Expense Categories Distribution Pie */}
        <div className="bg-white border border-orange-100/50 p-6 rounded-3xl shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="font-display font-bold text-base text-gray-950 flex items-center gap-2">
              <PieIcon className="w-5 h-5 text-brand-orange" />
              สัดส่วนค่าใช้จ่ายและรายจ่ายย่อย
            </h3>
            <p className="text-[10px] text-gray-400">สรุปยอดรวมแบ่งตามหมวดหมู่เพื่อวิเคราะห์ต้นทุนการดำเนินงาน</p>
          </div>

          {expensePieData.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center gap-2 text-xs font-semibold text-gray-400">
              <Activity className="w-8 h-8 text-gray-300" />
              ยังไม่มีการบันทึกรายการรายจ่ายในระบบ
            </div>
          ) : (
            <div className="h-64 w-full mt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="h-44 w-44 relative shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={expensePieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={65}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {expensePieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => `฿${Number(value).toLocaleString()}`} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="flex-1 overflow-y-auto max-h-56 grid grid-cols-2 gap-2 text-[10px] font-mono w-full">
                {expensePieData.map((item, index) => (
                  <div key={index} className="flex items-center gap-2 py-1 px-1.5 rounded-lg hover:bg-gray-50">
                    <span className="w-2.5 h-2.5 rounded-xs shrink-0" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                    <span className="text-gray-600 truncate">{item.name}</span>
                    <span className="font-bold text-gray-900 ml-auto">฿{item.value.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

      </div>
    </motion.div>
  );
};
