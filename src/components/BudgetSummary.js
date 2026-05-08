"use client";

import { useState, useEffect } from "react";
import { getExpenses, getCategories } from "@/services/db";
import { useWallet } from "@/context/WalletContext";

export default function BudgetSummary({ refreshTrigger, selectedMonth, showValues = true }) {
  const { activeWallet } = useWallet();
  const [budgetData, setBudgetData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (activeWallet) {
      calculateBudgets();
    }
  }, [activeWallet, refreshTrigger, selectedMonth]);

  const calculateBudgets = async () => {
    setLoading(true);
    const [expData, catData] = await Promise.all([
      getExpenses(activeWallet.id),
      getCategories(activeWallet.id)
    ]);

    const filteredExpenses = selectedMonth 
      ? expData.filter(expense => {
          if (!expense.createdAt) return true;
          const date = expense.createdAt.toDate ? expense.createdAt.toDate() : new Date(expense.createdAt);
          const expMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          return expMonth === selectedMonth;
        })
      : expData;

    // Aggregate expenses by category AND by userEmail
    const spentByCategoryAndUser = {};
    filteredExpenses.forEach(expense => {
      const catId = expense.categoryId;
      // Fallback to userEmail or first member for backward compatibility with old data
      const email = expense.paidBy || expense.userEmail || activeWallet.members[0];
      
      if (!spentByCategoryAndUser[catId]) spentByCategoryAndUser[catId] = {};
      if (!spentByCategoryAndUser[catId][email]) spentByCategoryAndUser[catId][email] = 0;
      
      spentByCategoryAndUser[catId][email] += expense.value;
    });

    // Combine with category budgets
    const summary = catData.map(cat => {
      const membersData = activeWallet.members.map(member => {
        const spent = spentByCategoryAndUser[cat.id]?.[member] || 0;
        // Check for new per-user budget, fallback to old global budget for the first user
        const budget = cat.budgets?.[member] || (member === activeWallet.members[0] && cat.budget ? cat.budget : 0);
        
        const remaining = budget - spent;
        const percentage = budget > 0 ? Math.min((spent / budget) * 100, 100) : 0;
        const isLow = remaining <= 50000 && remaining >= 0;
        const isOver = remaining < 0;

        return {
          email: member,
          spent,
          budget,
          remaining,
          percentage,
          isLow,
          isOver
        };
      });

      return {
        ...cat,
        membersData
      };
    });

    setBudgetData(summary);
    setLoading(false);
  };

  const formatCurrency = (value) => {
    if (!showValues) return "******";
    return `$${value.toLocaleString()}`;
  };

  if (loading) return <div className="text-center py-4 text-text-secondary text-sm">Calculando presupuesto...</div>;

  if (budgetData.length === 0) {
    return <div className="text-center py-4 text-text-secondary text-sm">No hay categorías configuradas para presupuestos.</div>;
  }

  return (
    <div className="bg-surface p-card-p rounded-card shadow-card space-y-6">
      {budgetData.map(cat => (
        <div key={cat.id} className="border-b border-divider pb-4 last:border-0 last:pb-0">
          <h3 className="font-bold text-text-primary text-lg mb-3">{cat.name}</h3>
          
          <div className="space-y-4">
            {cat.membersData.map(data => (
              <div key={data.email}>
                <div className="flex justify-between items-end mb-1">
                  <span className="text-xs font-semibold text-text-secondary flex items-center gap-1 w-1/2 truncate">
                    {data.email.split('@')[0]}
                    {(data.isLow || data.isOver) && data.budget > 0 && (
                      <span className="text-red-500 font-bold" title="¡Presupuesto bajo o excedido!">
                        ⚠️
                      </span>
                    )}
                  </span>
                  <span className="text-xs text-text-secondary font-medium">
                    {formatCurrency(data.spent)} / {formatCurrency(data.budget)}
                  </span>
                </div>
                
                <div className="w-full bg-[#E8E8E8] rounded-full h-2 overflow-hidden">
                  <div 
                    className={`h-2 rounded-full ${data.isOver ? 'bg-red-500' : data.isLow ? 'bg-orange-400' : 'bg-primary'}`} 
                    style={{ width: `${data.percentage}%` }}
                  ></div>
                </div>
                
                {data.budget > 0 && (
                  <p className={`text-[10px] text-right mt-1 ${data.isOver ? 'text-red-500 font-bold' : 'text-text-tertiary'}`}>
                    {data.isOver 
                      ? `Excedido por ${formatCurrency(Math.abs(data.remaining))}` 
                      : `Disponible: ${formatCurrency(data.remaining)}`
                    }
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
