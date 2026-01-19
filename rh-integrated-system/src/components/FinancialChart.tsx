'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, collection, query, orderBy, onSnapshot, doc, setDoc, deleteDoc } from "firebase/firestore";

// Using the same Firebase config as other components
const firebaseConfig = {
  apiKey: "AIzaSyDKHlDDZ4GFGI8u6oOhfOulD_XFzL3qZBQ",
  authDomain: "hadaf-pa.firebaseapp.com",
  projectId: "hadaf-pa",
  storageBucket: "hadaf-pa.appspot.com",
  messagingSenderId: "755281209375",
  appId: "1:755281209375:web:3a9040a2f0031ea2b14d2a",
  measurementId: "G-XNBQ73GMJ2"
};

const APP_NAME = "chart-app";
const app = !getApps().find(a => a.name === APP_NAME) 
  ? initializeApp(firebaseConfig, APP_NAME) 
  : getApp(APP_NAME);
const db = getFirestore(app);

interface MonthlyData {
  id: string; // YYYY-MM
  monthLabel: string;
  income: number;
  expenses: number;
}

export default function FinancialChart() {
  const [data, setData] = useState<MonthlyData[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newMonth, setNewMonth] = useState('2026-01');
  const [newIncome, setNewIncome] = useState('');
  const [newExpenses, setNewExpenses] = useState('');

  const monthsArabic = [
    "يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو",
    "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"
  ];

  useEffect(() => {
    const q = query(collection(db, "monthly_stats"), orderBy("id", "asc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const stats = snapshot.docs.map(doc => ({
        ...doc.data()
      })) as MonthlyData[];
      setData(stats);
    });

    return () => unsubscribe();
  }, []);

  const handleSave = async () => {
    if (!newIncome || !newExpenses) return;

    const [year, month] = newMonth.split('-');
    const monthLabel = `${monthsArabic[parseInt(month) - 1]} ${year.slice(2)}`;

    try {
      await setDoc(doc(db, "monthly_stats", newMonth), {
        id: newMonth,
        monthLabel,
        income: parseFloat(newIncome),
        expenses: parseFloat(newExpenses)
      });
      setIsModalOpen(false);
      setNewIncome('');
      setNewExpenses('');
    } catch (error) {
      console.error("Error saving stats:", error);
      alert("حدث خطأ أثناء حفظ البيانات.");
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("هل تريد حذف بيانات هذا الشهر؟")) return;
    try {
      await deleteDoc(doc(db, "monthly_stats", id));
    } catch (error) {
      console.error("Error deleting stats:", error);
    }
  };

  return (
    <div className="glass-card rounded-2xl shadow-2xl p-8 border border-slate-700/50 relative overflow-hidden group">
      {/* Decorative background blur */}
      <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/5 blur-[80px] -z-10 group-hover:bg-emerald-500/10 transition-colors"></div>
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
            </svg>
          </div>
          <div>
            <h3 className="text-xl font-black text-slate-100 tracking-tight">تحليل الأداء الشهري</h3>
            <p className="text-xs text-slate-400 font-medium">مقارنة الدخل والنفقات على مدار الأشهر</p>
          </div>
        </div>

        <button 
          onClick={() => setIsModalOpen(true)}
          className="w-full md:w-auto px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-emerald-500/30 rounded-xl text-sm font-bold transition-all duration-300 flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/5 hover:shadow-emerald-500/10"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          إضافة أو تعديل شهر
        </button>
      </div>

      <div className="h-[350px] w-full mb-10 p-4 bg-slate-900/30 rounded-2xl border border-slate-800/50 shadow-inner" dir="ltr">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
          >
            <defs>
              <linearGradient id="incomeGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10B981" stopOpacity={0.8}/>
                <stop offset="100%" stopColor="#10B981" stopOpacity={0.3}/>
              </linearGradient>
              <linearGradient id="expenseGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#EF4444" stopOpacity={0.8}/>
                <stop offset="100%" stopColor="#EF4444" stopOpacity={0.3}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} opacity={0.3} />
            <XAxis 
              dataKey="monthLabel" 
              stroke="#64748b" 
              fontSize={10} 
              tickLine={false} 
              axisLine={false}
              tick={{ fontWeight: 600 }}
              dy={10}
            />
            <YAxis 
              stroke="#64748b" 
              fontSize={10} 
              tickLine={false} 
              axisLine={false} 
              tickFormatter={(v) => `$${v}`}
              tick={{ fontWeight: 600 }}
            />
            <Tooltip 
              cursor={{ fill: 'rgba(255,255,255,0.05)' }}
              contentStyle={{ 
                backgroundColor: 'rgba(15, 23, 42, 0.9)', 
                backdropFilter: 'blur(8px)',
                border: '1px solid rgba(51, 65, 85, 0.5)', 
                borderRadius: '12px', 
                color: '#f1f5f9',
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3)'
              }} 
              itemStyle={{ fontWeight: 700, fontSize: '12px' }}
            />
            <Legend 
              verticalAlign="top" 
              align="right"
              height={36}
              iconType="circle"
              formatter={(value) => <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-2">{value}</span>}
            />
            <Bar name="إجمالي الدخل" dataKey="income" fill="url(#incomeGradient)" radius={[6, 6, 0, 0]} barSize={24} />
            <Bar name="إجمالي النفقات" dataKey="expenses" fill="url(#expenseGradient)" radius={[6, 6, 0, 0]} barSize={24} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Data Summary Table */}
      {data.length > 0 && (
        <div className="glass-card bg-slate-900/40 rounded-xl border border-slate-700/30 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-right text-sm">
              <thead>
                <tr className="bg-slate-800/50 text-slate-500 text-[10px] uppercase font-bold tracking-widest border-b border-slate-700/50">
                  <th className="px-6 py-3">الشهر</th>
                  <th className="px-6 py-3 text-center">الدخل المحقق</th>
                  <th className="px-6 py-3 text-center">النفقات المسجلة</th>
                  <th className="px-6 py-3 w-16"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {data.map((item) => (
                  <tr key={item.id} className="group/row hover:bg-slate-800/30 transition-colors">
                    <td className="px-6 py-3 text-slate-300 font-bold">{item.monthLabel}</td>
                    <td className="px-6 py-3 text-center font-mono font-bold text-emerald-400">
                      ${item.income.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-3 text-center font-mono font-bold text-red-400">
                      ${item.expenses.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-3">
                      <button 
                        onClick={() => handleDelete(item.id)} 
                        className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all opacity-0 group-hover/row:opacity-100"
                        title="حذف البيانات"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Redesigned Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-[100] p-4 animate-in fade-in duration-300">
          <div className="glass-card bg-slate-900 border border-slate-700/50 rounded-2xl p-8 w-full max-w-md shadow-2xl relative">
            <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-24 h-24 bg-emerald-500/10 blur-[50px] -z-10 rounded-full"></div>
            
            <div className="flex items-center gap-4 mb-8">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h4 className="text-xl font-black text-slate-100 tracking-tight">إضافة بيانات شهرية</h4>
            </div>
            
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest text-right px-1">الشهر والسنة</label>
                <input 
                  type="month" 
                  value={newMonth}
                  onChange={(e) => setNewMonth(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-100 px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all text-right font-bold"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest text-right px-1">إجمالي الدخل ($)</label>
                <div className="relative">
                  <input 
                    type="number" 
                    value={newIncome}
                    placeholder="0.00"
                    onChange={(e) => setNewIncome(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 text-emerald-400 px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all text-right font-black"
                  />
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 font-bold">$</div>
                </div>
              </div>
              <div className="space-y-2">
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest text-right px-1">إجمالي النفقات ($)</label>
                <div className="relative">
                  <input 
                    type="number" 
                    value={newExpenses}
                    placeholder="0.00"
                    onChange={(e) => setNewExpenses(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 text-red-400 px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all text-right font-black"
                  />
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 font-bold">$</div>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3 mt-10">
              <button 
                onClick={handleSave}
                className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 text-white py-4 rounded-xl font-black text-sm shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/40 hover:-translate-y-0.5 transition-all duration-300"
              >
                حفظ البيانات
              </button>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="w-full bg-slate-800 hover:bg-slate-700 text-slate-400 py-3 rounded-xl font-bold text-xs transition-all duration-300"
              >
                إلغاء التغييرات
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
