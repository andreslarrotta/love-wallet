"use client";

import { useState, useEffect } from "react";
import { getExpenses, getCategories } from "@/services/db";
import { useWallet } from "@/context/WalletContext";
import Loading from "@/components/Loading";
import Link from "next/link";

export default function BudgetSummary({ refreshTrigger, selectedMonth, showValues = true }) {
  const { activeWallet } = useWallet();
  const [budgetData, setBudgetData] = useState([]);
  const [totalSummary, setTotalSummary] = useState([]);
  const [loading, setLoading] = useState(true);
  const [columns, setColumns] = useState(1);

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
    const sourceTotals = {};
    const incomeSources = activeWallet.incomeSources || [];
    
    if (incomeSources.length > 0) {
      incomeSources.forEach(source => {
        sourceTotals[source.id] = { 
          id: source.id,
          name: source.name,
          owner: source.owner,
          spent: 0, 
          income: Number(source.amount) || 0 
        };
      });
    } else {
      activeWallet.members.forEach(member => {
        sourceTotals[member] = { 
          id: member,
          name: "Total Mensual",
          owner: member,
          spent: 0, 
          income: Number(activeWallet.incomes?.[member]) || 0 
        };
      });
    }

    filteredExpenses.forEach(expense => {
      const catId = expense.categoryId;
      const email = expense.paidBy || expense.userEmail || activeWallet.members[0];
      
      if (catId) {
        if (!spentByCategoryAndUser[catId]) spentByCategoryAndUser[catId] = {};
        if (!spentByCategoryAndUser[catId][email]) spentByCategoryAndUser[catId][email] = 0;
        spentByCategoryAndUser[catId][email] += expense.value;
      }

      if (incomeSources.length > 0) {
        if (expense.incomeSourceId && sourceTotals[expense.incomeSourceId]) {
          sourceTotals[expense.incomeSourceId].spent += expense.value;
        } else {
          const genId = `general-${email}`;
          if (!sourceTotals[genId]) {
            sourceTotals[genId] = {
              id: genId,
              name: "Otros Gastos (Sin asignar)",
              owner: email,
              spent: 0,
              income: 0
            };
          }
          sourceTotals[genId].spent += expense.value;
        }
      } else {
        if (sourceTotals[email]) {
          sourceTotals[email].spent += expense.value;
        }
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

    const totalSummarized = Object.values(sourceTotals).map(data => {
      const remaining = data.income - data.spent;
      let percentage = 0;
      if (data.income > 0) {
        percentage = Math.min((data.spent / data.income) * 100, 100);
      } else if (data.spent > 0) {
        percentage = 100;
      }
      const isOver = data.income > 0 ? data.spent > data.income : data.spent > 0;
      
      return {
        ...data,
        remaining,
        percentage,
        isOver
      };
    }).sort((a, b) => b.income - a.income);

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

  if (loading) return <Loading />;

  return (
    <>
      {/* Total Salary Consumption Summary */}
      {totalSummary.length > 0 && (
        <div className="bg-primary p-card-p rounded-card neo-border neo-shadow mb-6">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="text-sm font-extrabold text-black uppercase">Consumo por Ingreso</h3>
              <p className="text-[10px] text-black font-medium mt-1">Total gastado este mes descontado de cada fuente.</p>
            </div>
            <Link href="/config" className="text-[10px] font-bold text-black uppercase tracking-wider bg-white px-2 py-1 rounded-pill border-2 border-black shadow-[2px_2px_0px_#000] neo-button">
              Configurar Ingresos
            </Link>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {totalSummary.map(data => (
              <div key={data.id} className="bg-white p-3 rounded-xl neo-border neo-shadow-sm flex flex-col justify-between">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <span className="text-xs font-extrabold text-black uppercase block truncate pr-2">
                      {data.name}
                    </span>
                    <span className="text-[10px] font-bold text-text-secondary">
                      {data.owner?.split("@")[0] || ""}
                    </span>
                  </div>
                  <span className={`text-xs font-bold ${data.isOver ? "text-red-600" : "text-black"}`}>
                    {formatCurrency(data.spent)} {data.income > 0 && `/ ${formatCurrency(data.income)}`}
                  </span>
                </div>

                <div>
                  <div className="w-full bg-white border-2 border-black rounded-full h-4 overflow-hidden shadow-[2px_2px_0px_#000]">
                    <div 
                      className={`h-full border-r-2 border-black transition-all duration-500 ${getProgressColor(data.percentage)}`} 
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
              </div>
            ))}
          </div>
        </div>
      )}

      {budgetData.length === 0 ? (
        <div className="text-center py-8 bg-surface rounded-card neo-border neo-shadow-sm">
          <p className="text-text-secondary font-bold text-sm mb-4">No hay categorías configuradas para presupuestos.</p>
          <Link href="/config" className="text-black bg-primary px-4 py-2 rounded-pill neo-border neo-shadow-sm font-bold text-sm">
            + Configurar Presupuesto
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button 
              onClick={() => setColumns(c => c === 1 ? 2 : 1)}
              className="text-[10px] font-bold text-black uppercase tracking-wider bg-white px-2 py-1 rounded-pill border-2 border-black shadow-[2px_2px_0px_#000] neo-button"
            >
              {columns === 1 ? "Ver 2 Columnas" : "Ver 1 Columna"}
            </button>
          </div>
          <div className={`grid gap-4 ${columns === 2 ? 'grid-cols-2' : 'grid-cols-1'}`}>
          {budgetData.map(cat => {
            const totalSpent = cat.membersData.reduce((sum, d) => sum + d.spent, 0);
            const totalBudget = cat.membersData.reduce((sum, d) => sum + d.budget, 0);
            return (
              <div key={cat.id} className="bg-white p-4 rounded-xl neo-border neo-shadow-sm flex flex-col">
                <div className="flex justify-between items-start mb-3 border-b-2 border-black pb-2">
                  <h3 className="font-extrabold text-black text-sm uppercase truncate pr-2">{cat.name}</h3>
                  <div className="text-right flex-shrink-0">
                    <p className="text-xs font-bold text-black">{formatCurrency(totalSpent)}</p>
                    {totalBudget > 0 && <p className="text-[10px] text-text-tertiary font-bold">de {formatCurrency(totalBudget)}</p>}
                  </div>
                </div>
                
                <div className="space-y-4 flex-1">
                  {cat.membersData.map(data => (
                    <div key={data.email}>
                      <div className="flex justify-between items-end mb-1">
                        <span className="text-xs font-bold text-text-secondary flex items-center gap-1 w-1/2 truncate">
                          {data.email.split("@")[0]}
                          {(data.isLow || data.isOver) && data.budget > 0 && (
                            <span className="text-red-500 font-bold" title="¡Presupuesto bajo o excedido!">
                              ⚠️
                            </span>
                          )}
                        </span>
                        <span className="text-xs text-black font-bold">
                          {formatCurrency(data.spent)} / {formatCurrency(data.budget)}
                        </span>
                      </div>
                      
                      <div className="w-full bg-white border-2 border-black rounded-full h-3 overflow-hidden shadow-[2px_2px_0px_#000]">
                        <div 
                          className={`h-full border-r-2 border-black transition-all duration-500 ${getProgressColor(data.percentage)}`} 
                          style={{ width: `${data.percentage}%` }}
                        ></div>
                      </div>
                      
                      {data.budget > 0 && (
                        <p className={`text-[10px] text-right mt-1 font-bold ${data.isOver ? "text-red-600" : "text-black"}`}>
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
            );
          })}
          </div>
        </div>
    )}

    </>
  );
}
