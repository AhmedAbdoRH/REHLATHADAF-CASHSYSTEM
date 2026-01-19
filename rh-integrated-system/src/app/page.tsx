'use client';

import React, { useState, useEffect } from 'react';
import { Project, Expense, FinancialSummary, FinancingRecord, SalesRecord } from '@/types';
import ProjectManager from '@/components/ProjectManager';
import FinancingManager from '@/components/FinancingManager';
import FinancialDashboard from '@/components/FinancialDashboard';
import FinancialChart from '@/components/FinancialChart';
import Header from '@/components/Header';

export default function Home() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [financing, setFinancing] = useState<FinancingRecord[]>([]);
  const [summary, setSummary] = useState<FinancialSummary>({
    totalIncome: 0,
    totalExpenses: 0,
    netProfit: 0,
    marketingShare: 0,
    mainOfficeShare: 0,
    clearanceResult: 0,
    totalSaudi: 0,
    totalMah: 0,
    totalEgypt: 0,
    totalOperational: 0,
    totalPurchases: 0,
    totalFinancing: 0,
    totalSalesProfit: 0
  });

  useEffect(() => {
    // Calculate totals for projects
    const totalSaudi = projects
      .filter(p => p.projectType === 'saudi')
      .reduce((sum, p) => sum + p.cost, 0);
    const totalMah = projects
      .filter(p => p.projectType === 'mah')
      .reduce((sum, p) => sum + p.cost, 0);
    const totalEgypt = projects
      .filter(p => p.projectType === 'egypt')
      .reduce((sum, p) => sum + p.cost, 0);

    const totalFinancing = financing.reduce((sum, record) => sum + record.cost, 0);

    const totalIncome = totalSaudi + totalMah + totalEgypt;
    const totalExpenses = 0; // Expenses removed
    const netProfit = totalIncome - totalExpenses;

    // Calculate shares
    const marketingShare = totalMah + (totalSaudi * (2 / 3)) + (totalEgypt * (2 / 3));
    const mainOfficeShare = (totalSaudi * (1 / 3)) + (totalEgypt * (1 / 3));

    // Calculate clearance result
    const clearanceResult = (totalSaudi * (2 / 3)) + totalMah - (totalEgypt * (1 / 3));

    setSummary({
      totalIncome,
      totalExpenses,
      netProfit,
      marketingShare,
      mainOfficeShare,
      clearanceResult,
      totalSaudi,
      totalMah,
      totalEgypt,
      totalOperational: 0,
      totalPurchases: 0,
      totalFinancing,
      totalSalesProfit: 0
    });
  }, [projects, financing]);

  return (
    <div className="min-h-screen bg-gray-900 pb-20" dir="rtl">
      <div className="container mx-auto px-4 py-8">
        <Header />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <FinancingManager onFinancingChange={setFinancing} />
          <ProjectManager onProjectsChange={setProjects} />
        </div>
        <FinancialDashboard summary={summary} />
        <FinancialChart />
      </div>
    </div>
  );
}
