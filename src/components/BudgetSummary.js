"use client";

import { useState, useEffect } from "react";
import { getExpenses, getCategories } from "@/services/db";
import { useWallet } from "@/context/WalletContext";
import Link from "next/link";

export default function BudgetSummary({ refreshTrigger, selectedMonth, showValues = true }) {
  const { activeWallet } = useWallet();
  const [budgetData, setBudgetData] = useState([]);
  const [totalSummary, setTotalSummary] = useState([]);
  const [loading, setLoading] = useState(true);

  async function calculateBudgets() {
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

    const spentByCategoryAndUser = {};
    const totals = {};
    
    // Initialize totals for each member
    activeWallet.members.forEach(member => {
      totals[member] = { spent: 0, income: Number(activeWallet.incomes?.[member]) || 0 };
    });

    filteredExpenses.forEach(expense => {
      const catId = expense.categoryId;
      const email = expense.paidBy || expense.userEmail || activeWallet.members[0];
      
      if (catId) {
        if (!spentByCategoryAndUser[catId]) spentByCategoryAndUser[catId] = {};
        if (!spentByCategoryAndUser[catId][email]) spentByCategoryAndUser[catId][email] = 0;
        spentByCategoryAndUser[catId][email] += expense.value;
      }

      if (totals[email]) {
        totals[email].spent += expense.value;
      }
    });

    const summary = catData.map(cat => {
      const membersData = activeWallet.members.map(member => {
        const spent = spentByCategoryAndUser[cat.id]?.[member] || 0;
        const budget = cat.budgets?.[member] || (member === activeWallet.members[0] && cat.budget ? cat.budget : 0);
        const income = Number(activeWallet?.incomes?.[member]) || 0;
        const incomePercentage = income > 0 ? Math.min((spent / income) * 100, 100) : null;
        const incomeIsOver = income > 0 ? spent > income : false;
        
        const remaining = budget - spent;
        const percentage = budget > 0 ? Math.min((spent / budget) * 100, 100) : 0;
        const isLow = remaining <= 50000 && remaining >= 0;
        const isOver = remaining < 0;

        return {
          email: member,
          spent,
          budget,
          income,
          incomePercentage,
          incomeIsOver,
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

    const totalSummarized = activeWallet.members.map(member => {
      const data = totals[member];
      const remaining = data.income - data.spent;
      const percentage = data.income > 0 ? Math.min((data.spent / data.income) * 100, 100) : 0;
      const isOver = data.income > 0 ? data.spent > data.income : false;
      return {
        email: member,
        ...data,
        remaining,
        percentage,
        isOver
      };
    });

    setBudgetData(summary);
    setTotalSummary(totalSummarized);
    setLoading(false);
  }

  useEffect(() => {
    if (activeWallet) {
      calculateBudgets();
    } else {
      setLoading(false);
    }
  }, [activeWallet, refreshTrigger, selectedMonth]);

  const formatCurrency = (value) => {
    if (!showValues) return "******";
    return `$${value.toLocaleString()}`;
  };

  const getProgressColor = (percentage) => {
    if (percentage <= 50) return "bg-green-500";
    if (percentage <= 80) return "bg-orange-400";
    return "bg-red-500";
  };

  if (loading) return <div className="text-center py-4 text-text-secondary text-sm">Calculando presupuesto...</div>;

  return (
    <>
      {/* Total Salary Consumption Summary */}
      {totalSummary.length > 0 && (
        <div className="bg-primary/5 p-card-p rounded-card border border-primary/20 mb-6">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="text-sm font-bold text-primary">Consumo Total de Salario</h3>
              <p className="text-[10px] text-text-tertiary">Total gastado este mes frente al ingreso configurado.</p>
            </div>
            <Link href="/config" className="text-[10px] font-bold text-primary uppercase tracking-wider bg-white px-2 py-1 rounded-pill shadow-sm">
              Configurar
            </Link>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {totalSummary.map(data => (
              <div key={`${data.email}-total`} className="bg-white p-3 rounded-xl shadow-sm border border-divider">
                <div className="flex justify-between items-end mb-2">
                  <span className="text-xs font-bold text-text-secondary truncate pr-2">
                    {data.email.split("@")[0]}
                  </span>
                  <span className={`text-xs font-bold ${data.isOver ? "text-red-500" : "text-primary"}`}>
                    {formatCurrency(data.spent)} / {formatCurrency(data.income)}
                  </span>
                </div>

                <div className="w-full bg-[#F2F2F2] rounded-full h-2.5 overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-500 ${getProgressColor(data.percentage)}`} 
                    style={{ width: `${data.percentage}%` }}
                  ></div>
                </div>

                <div className="flex justify-between mt-2">
                  <span className="text-[10px] font-medium text-text-tertiary">
                    {Math.round(data.percentage)}% usado
                  </span>
                  {data.income > 0 && (
                    <span className={`text-[10px] font-bold ${data.isOver ? "text-red-500" : "text-green-600"}`}>
                      {data.isOver 
                        ? `Excedido por ${formatCurrency(Math.abs(data.remaining))}` 
                        : `Libre: ${formatCurrency(data.remaining)}`
                      }
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {budgetData.length === 0 ? (
        <div className="text-center py-8 bg-surface rounded-card shadow-sm border border-divider">
          <p className="text-text-secondary text-sm mb-4">No hay categorías configuradas para presupuestos.</p>
          <Link href="/config" className="text-primary font-bold text-sm">
            + Configurar Presupuesto
          </Link>
        </div>
      ) : (
        <div className="bg-surface p-card-p rounded-card shadow-card space-y-6">
        {budgetData.map(cat => (
          <div key={cat.id} className="border-b border-divider pb-4 last:border-0 last:pb-0">
            <h3 className="font-bold text-text-primary text-lg mb-3">{cat.name}</h3>
            
            <div className="space-y-4">
              {cat.membersData.map(data => (
                <div key={data.email}>
                  <div className="flex justify-between items-end mb-1">
                    <span className="text-xs font-semibold text-text-secondary flex items-center gap-1 w-1/2 truncate">
                      {data.email.split("@")[0]}
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
                      className={`h-2 rounded-full transition-all duration-500 ${getProgressColor(data.percentage)}`} 
                      style={{ width: `${data.percentage}%` }}
                    ></div>
                  </div>
                  
                  {data.budget > 0 && (
                    <p className={`text-[10px] text-right mt-1 ${data.isOver ? "text-red-500 font-bold" : "text-text-tertiary"}`}>
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
    )}

    </>
  );
}
