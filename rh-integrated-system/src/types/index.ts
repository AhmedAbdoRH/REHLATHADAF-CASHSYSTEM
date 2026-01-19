export interface Project {
  id: string;
  name: string;
  cost: number;
  projectType: 'egypt' | 'saudi' | 'mah';
  date: string;
  archived?: boolean;
}

export interface Expense {
  id: string;
  name: string;
  cost: number;
  expenseType: 'operational' | 'purchases';
  date: string;
}

export interface FinancingRecord {
  id: string;
  name: string;
  cost: number;
  timestamp: any;
  imageUrl?: string;
}

export interface SalesRecord {
  id: string;
  name: string;
  saleAmount: number;
  expenseCost: number;
  expenseDescription: string;
  netProfit: number;
  timestamp: any;
}

export interface FinancialSummary {
  totalIncome: number;
  totalExpenses: number;
  netProfit: number;
  marketingShare: number;
  mainOfficeShare: number;
  clearanceResult: number;
  totalSaudi: number;
  totalMah: number;
  totalEgypt: number;
  totalOperational: number;
  totalPurchases: number;
  totalFinancing: number;
  totalSalesProfit: number;
}
