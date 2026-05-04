"use client";

import { useState, useEffect } from "react";
import { getExpenses, getCategories } from "@/services/db";
import { useWallet } from "@/context/WalletContext";

export default function BudgetSummary({ refreshTrigger }) {
  const { activeWallet } = useWallet();
  const [budgetData, setBudgetData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (activeWallet) {
      calculateBudgets();
    }
  }, [activeWallet, refreshTrigger]);

  const calculateBudgets = async () => {
    setLoading(true);
    const [expData, catData] = await Promise.all([
      getExpenses(activeWallet.id),
      getCategories(activeWallet.id)
    ]);

    // Map to aggregate expenses by category
    const spentByCategory = {};
    expData.forEach(expense => {
      const catId = expense.categoryId;
      if (!spentByCategory[catId]) spentByCategory[catId] = 0;
      spentByCategory[catId] += expense.value;
    });

    // Combine with category budgets
    const summary = catData.map(cat => {
      const spent = spentByCategory[cat.id] || 0;
      const remaining = cat.budget - spent;
      const percentage = cat.budget > 0 ? Math.min((spent / cat.budget) * 100, 100) : 0;
      const isLow = remaining <= 50000 && remaining >= 0;
      const isOver = remaining < 0;

      return {
        ...cat,
        spent,
        remaining,
        percentage,
        isLow,
        isOver
      };
    });

    setBudgetData(summary);
    setLoading(false);
  };

  if (loading) return <div className="text-center py-4 text-text-secondary text-sm">Calculando presupuesto...</div>;

  if (budgetData.length === 0) {
    return <div className="text-center py-4 text-text-secondary text-sm">No hay categorías configuradas para presupuestos.</div>;
  }

  return (
    <div className="bg-surface p-card-p rounded-card shadow-card space-y-4">
      {budgetData.map(data => (
        <div key={data.id}>
          <div className="flex justify-between items-end mb-1">
            <span className="font-bold text-text-primary flex items-center gap-1">
              {data.name}
              {(data.isLow || data.isOver) && (
                <span className="text-red-500 font-bold" title="¡Presupuesto bajo o excedido!">
                  ⚠️
                </span>
              )}
            </span>
            <span className="text-xs text-text-secondary">
              ${data.spent.toLocaleString()} / ${data.budget.toLocaleString()}
            </span>
          </div>
          
          <div className="w-full bg-[#E8E8E8] rounded-full h-2.5 overflow-hidden">
            <div 
              className={`h-2.5 rounded-full ${data.isOver ? 'bg-red-500' : data.isLow ? 'bg-orange-400' : 'bg-primary'}`} 
              style={{ width: `${data.percentage}%` }}
            ></div>
          </div>
          
          <p className={`text-[11px] text-right mt-1 ${data.isOver ? 'text-red-500 font-bold' : 'text-text-tertiary'}`}>
            {data.isOver 
              ? `Excedido por $${Math.abs(data.remaining).toLocaleString()}` 
              : `Disponible: $${data.remaining.toLocaleString()}`
            }
          </p>
        </div>
      ))}
    </div>
  );
}
