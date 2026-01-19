'use client';

import React from 'react';
import { FinancialSummary } from '@/types';

interface FinancialDashboardProps {
  summary: FinancialSummary;
}

export default function FinancialDashboard({ summary }: FinancialDashboardProps) {
  const {
    totalIncome,
    totalExpenses,
    netProfit,
    marketingShare,
    mainOfficeShare,
    clearanceResult,
    totalSaudi,
    totalMah,
    totalEgypt,
    totalOperational,
    totalPurchases,
    totalFinancing,
    totalSalesProfit
  } = summary;

  const handleTransfer = () => {
    if (clearanceResult > 0) {
      alert(`تم تحويل مبلغ $${clearanceResult.toFixed(2)} إلى المكتب الرئيسي.`);
    } else if (clearanceResult < 0) {
      alert(`يجب على المكتب الرئيسي تحويل مبلغ $${Math.abs(clearanceResult).toFixed(2)} إلى مكتب التسويق.`);
    } else {
      alert('لا يوجد مبالغ للتحويل.');
    }
  };

  return (
    <div className="space-y-8 mb-24">
      <div className="glass-card rounded-2xl shadow-2xl p-8 border border-slate-700/50 relative overflow-hidden group">
        {/* Decorative background blur */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 blur-[100px] -z-10 group-hover:bg-indigo-500/10 transition-colors"></div>
        
        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-100 tracking-tight">لوحة التحكم المالية</h2>
            <p className="text-sm text-slate-400 font-medium">نظرة عامة على الأداء المالي والمقاصة</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Income Details Card */}
          <div className="lg:col-span-2 space-y-6">
            <div className="glass-card bg-slate-900/40 rounded-xl p-6 border border-slate-700/30">
              <h3 className="text-sm font-black text-slate-300 mb-6 uppercase tracking-wider flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400"></span>
                تفاصيل الدخل حسب المنطقة
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                  { label: 'مشاريع مصر', value: totalEgypt, color: 'from-blue-400 to-cyan-400' },
                  { label: 'مشاريع المملكة', value: totalSaudi, color: 'from-emerald-400 to-teal-400' },
                  { label: 'مشاريع MAH', value: totalMah, color: 'from-amber-400 to-orange-400' }
                ].map((item, idx) => (
                  <div key={idx} className="bg-slate-800/30 rounded-xl p-4 border border-slate-700/30 hover:border-slate-600/50 transition-colors">
                    <p className="text-[10px] text-slate-500 font-bold mb-1 uppercase tracking-widest">{item.label}</p>
                    <p className={`text-xl font-black bg-clip-text text-transparent bg-gradient-to-r ${item.color}`}>
                      ${item.value.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                ))}
              </div>

              <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex justify-between items-center p-4 bg-indigo-500/5 rounded-xl border border-indigo-500/10">
                  <p className="text-xs font-bold text-indigo-300">نصيب مكتب التسويق</p>
                  <p className="text-lg font-black text-indigo-400">${marketingShare.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
                </div>
                <div className="flex justify-between items-center p-4 bg-purple-500/5 rounded-xl border border-purple-500/10">
                  <p className="text-xs font-bold text-purple-300">نصيب المكتب الرئيسي</p>
                  <p className="text-lg font-black text-purple-400">${mainOfficeShare.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Clearance Card */}
          <div className="flex flex-col h-full">
            <div className="glass-card bg-slate-900/60 rounded-xl p-8 border border-slate-700/50 flex flex-col items-center text-center h-full justify-center relative overflow-hidden group/clearance">
              <div className="absolute inset-0 bg-gradient-to-b from-transparent to-indigo-500/5 opacity-0 group-hover/clearance:opacity-100 transition-opacity"></div>
              
              <h3 className="text-sm font-black text-slate-400 mb-2 uppercase tracking-widest">نتيجة المقاصة</h3>
              <div className={`text-4xl font-black mb-6 tracking-tighter ${clearanceResult >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                ${clearanceResult.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </div>
              
              <p className="text-xs text-slate-500 mb-8 max-w-[200px] leading-relaxed">
                {clearanceResult > 0 
                  ? 'المبلغ المستحق للتحويل من مكتب التسويق إلى المكتب الرئيسي'
                  : clearanceResult < 0 
                  ? 'المبلغ المستحق للتحويل من المكتب الرئيسي إلى مكتب التسويق'
                  : 'لا توجد مبالغ مستحقة للتحويل حالياً'}
              </p>

              <button
                onClick={handleTransfer}
                className="w-full py-4 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:-translate-y-1 transition-all duration-300 active:scale-95"
              >
                تنفيذ التحويل الآن
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Fixed Bottom Bar for Financial Summary */}
      <div className="fixed bottom-0 left-0 right-0 z-50 px-4 pb-4">
        <div className="container mx-auto max-w-6xl">
          <div className="glass-card bg-slate-900/80 backdrop-blur-2xl rounded-2xl border border-slate-700/50 shadow-2xl overflow-hidden">
            <div className="grid grid-cols-3 divide-x divide-x-reverse divide-slate-800">
              {[
                { label: 'إجمالي الدخل', value: totalIncome, color: 'text-emerald-400' },
                { label: 'صافي الربح', value: netProfit, color: netProfit >= 0 ? 'text-blue-400' : 'text-red-400' },
                { label: 'إجمالي التمويل', value: totalFinancing, color: 'text-indigo-400' }
              ].map((item, idx) => (
                <div key={idx} className="px-6 py-4 flex flex-col items-center justify-center group/item hover:bg-slate-800/30 transition-colors">
                  <p className="text-[10px] text-slate-500 font-bold mb-1 uppercase tracking-widest group-hover/item:text-slate-400 transition-colors">{item.label}</p>
                  <p className={`text-xl font-black ${item.color} tracking-tight`}>
                    ${item.value.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
