'use client';

import React, { useState, useEffect } from 'react';
import { database, ref, push, onValue, remove } from '@/lib/firebase';
import { Expense } from '@/types';

interface ExpenseManagerProps {
  onExpensesChange: (expenses: Expense[]) => void;
}

export default function ExpenseManager({ onExpensesChange }: ExpenseManagerProps) {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [expenseName, setExpenseName] = useState('');
  const [expenseCost, setExpenseCost] = useState('');
  const [expenseType, setExpenseType] = useState<'operational' | 'purchases'>('operational');

  useEffect(() => {
    const expensesRef = ref(database, 'expenses');
    
    const unsubscribe = onValue(expensesRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const expensesList: Expense[] = Object.keys(data).map((key) => ({
          id: key,
          ...data[key]
        }));
        setExpenses(expensesList);
        onExpensesChange(expensesList);
      }
    });

    return () => unsubscribe();
  }, [onExpensesChange]);

  const addExpense = () => {
    if (!expenseName.trim() || !expenseCost || parseFloat(expenseCost) <= 0) {
      alert('يرجى إدخال اسم مسار الإنفاق وتكلفة صحيحة.');
      return;
    }

    const date = new Date().toLocaleDateString('ar-EG', { day: '2-digit', month: '2-digit' });
    const expenseData = {
      name: expenseName.trim(),
      cost: parseFloat(expenseCost),
      expenseType,
      date
    };

    push(ref(database, 'expenses'), expenseData)
      .then(() => {
        setExpenseName('');
        setExpenseCost('');
        setExpenseType('operational');
      })
      .catch((error) => {
        console.error('Error adding expense:', error);
        alert('حدث خطأ أثناء إضافة مسار الإنفاق.');
      });
  };

  const deleteExpense = (expenseId: string) => {
    remove(ref(database, `expenses/${expenseId}`))
      .catch((error) => {
        console.error('Error deleting expense:', error);
        alert('حدث خطأ أثناء حذف مسار الإنفاق.');
      });
  };

  const getExpensesByType = (type: 'operational' | 'purchases') => {
    return expenses.filter(expense => expense.expenseType === type);
  };

  const getTotalByType = (type: 'operational' | 'purchases') => {
    return expenses
      .filter(expense => expense.expenseType === type)
      .reduce((sum, expense) => sum + expense.cost, 0);
  };

  return (
    <div className="glass-card rounded-2xl shadow-2xl p-8 border border-slate-700/50 relative overflow-hidden group">
      {/* Decorative background blur */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/5 blur-3xl -z-10 group-hover:bg-red-500/10 transition-colors"></div>
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center shadow-lg shadow-red-500/20">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-100 tracking-tight">إدارة النفقات</h2>
            <p className="text-xs text-slate-400 font-medium">تتبع وتحليل المصاريف التشغيلية والمشتريات</p>
          </div>
        </div>
        
        <button
          onClick={addExpense}
          className="w-full md:w-auto px-8 py-3 bg-gradient-to-r from-red-500 to-rose-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-red-500/25 hover:shadow-red-500/40 hover:-translate-y-0.5 transition-all duration-300 active:scale-95"
        >
          إضافة نفقة جديدة
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="md:col-span-2 relative">
          <input
            type="text"
            placeholder="مسار الإنفاق (مثال: إيجار المكتب)"
            value={expenseName}
            onChange={(e) => setExpenseName(e.target.value)}
            className="w-full px-5 py-4 bg-slate-900/50 border border-slate-700/50 text-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500/50 transition-all placeholder:text-slate-500 font-medium"
          />
        </div>
        <div className="relative">
          <input
            type="number"
            placeholder="التكلفة ($)"
            value={expenseCost}
            onChange={(e) => setExpenseCost(e.target.value)}
            className="w-full px-5 py-4 bg-slate-900/50 border border-slate-700/50 text-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500/50 transition-all placeholder:text-slate-500 font-bold"
          />
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold">$</div>
        </div>
      </div>

      <div className="bg-slate-900/40 rounded-xl p-1.5 mb-8 border border-slate-800/50 flex gap-1">
        <button
          onClick={() => setExpenseType('operational')}
          className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition-all duration-300 ${
            expenseType === 'operational' 
              ? 'bg-red-500 text-white shadow-lg shadow-red-500/20' 
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
          }`}
        >
          مصارف تشغيلية
        </button>
        <button
          onClick={() => setExpenseType('purchases')}
          className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition-all duration-300 ${
            expenseType === 'purchases' 
              ? 'bg-red-500 text-white shadow-lg shadow-red-500/20' 
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
          }`}
        >
          مشتريات
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {(['operational', 'purchases'] as const).map((type) => (
          <div key={type} className="flex flex-col h-full">
            <div className="flex justify-between items-center mb-4 px-2">
              <h3 className="text-sm font-black text-slate-300 flex items-center gap-2 uppercase tracking-wider">
                <span className={`w-1.5 h-1.5 rounded-full ${type === 'operational' ? 'bg-orange-500' : 'bg-red-500'}`}></span>
                {type === 'operational' ? 'المصارف التشغيلية' : 'المشتريات'}
              </h3>
              <span className="text-[10px] font-bold px-2 py-1 bg-slate-800 text-slate-400 rounded-md border border-slate-700/50">
                {getExpensesByType(type).length} عناصر
              </span>
            </div>

            <div className="glass-card rounded-xl border border-slate-700/30 overflow-hidden flex-grow flex flex-col">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-right">
                  <thead>
                    <tr className="bg-slate-800/50 text-slate-400 text-[10px] uppercase font-bold tracking-widest border-b border-slate-700/50">
                      <th className="px-4 py-3">مسار الإنفاق</th>
                      <th className="px-4 py-3">التاريخ</th>
                      <th className="px-4 py-3 text-left">التكلفة</th>
                      <th className="px-4 py-3 w-16"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50">
                    {getExpensesByType(type).length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-4 py-8 text-center text-slate-500 text-xs italic">
                          لا توجد بيانات مسجلة حالياً
                        </td>
                      </tr>
                    ) : (
                      getExpensesByType(type).map((expense) => (
                        <tr key={expense.id} className="group/row hover:bg-slate-800/30 transition-colors">
                          <td className="px-4 py-3 text-slate-200 font-medium">{expense.name}</td>
                          <td className="px-4 py-3 text-slate-500 text-xs font-mono">{expense.date}</td>
                          <td className="px-4 py-3 text-left">
                            <span className="text-red-400 font-bold font-mono">${expense.cost.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                          </td>
                          <td className="px-4 py-3">
                            <button
                              onClick={() => deleteExpense(expense.id)}
                              className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all opacity-0 group-hover/row:opacity-100"
                              title="حذف"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              
              <div className="mt-auto border-t border-slate-700/50 bg-slate-900/60 p-4">
                <div className="flex justify-between items-center">
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">إجمالي القسم</p>
                  <p className="text-lg font-black text-red-400 font-mono">${getTotalByType(type).toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
