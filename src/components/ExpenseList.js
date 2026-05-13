"use client";

import { useState, useEffect } from "react";
import { getExpenses, getCategories, deleteExpense } from "@/services/db";
import { useWallet } from "@/context/WalletContext";

export default function ExpenseList({ refreshTrigger, selectedMonth, showValues = true }) {
  const { activeWallet } = useWallet();
  const [expenses, setExpenses] = useState([]);
  const [categories, setCategories] = useState({});
  const [loading, setLoading] = useState(true);

  // Local state to force reload after delete
  const [localRefresh, setLocalRefresh] = useState(0);

  async function loadData() {
    setLoading(true);
    const [expData, catData] = await Promise.all([
      getExpenses(activeWallet.id),
      getCategories(activeWallet.id)
    ]);

    const catMap = {};
    catData.forEach(cat => catMap[cat.id] = cat);
    setCategories(catMap);

    const filteredExpenses = selectedMonth 
      ? expData.filter(expense => {
          if (!expense.createdAt) return true;
          const date = expense.createdAt.toDate ? expense.createdAt.toDate() : new Date(expense.createdAt);
          const expMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          return expMonth === selectedMonth;
        })
      : expData;

    setExpenses(filteredExpenses);
    setLoading(false);
  }

  useEffect(() => {
    if (activeWallet) {
      let cancelled = false;
      setTimeout(() => {
        if (cancelled) return;
        loadData();
      }, 0);
      return () => {
        cancelled = true;
      };
    }
  }, [activeWallet, refreshTrigger, localRefresh, selectedMonth]);

  const handleDelete = async (id) => {
    if (confirm("¿Estás seguro de que deseas eliminar este gasto?")) {
      await deleteExpense(id);
      setLocalRefresh(prev => prev + 1);
    }
  };

  const totalSpent = expenses.reduce((acc, exp) => acc + exp.value, 0);

  const formatCurrency = (value) => {
    if (!showValues) return "******";
    return `$${value.toLocaleString()}`;
  };

  if (loading) return <div className="text-center py-4 text-text-secondary text-sm">Cargando gastos...</div>;

  return (
    <div className="space-y-4">
      {/* Total Section */}
      <div className="bg-primary/10 p-4 rounded-card border border-primary/20 flex justify-between items-center">
        <span className="text-sm font-bold text-primary uppercase">Total del mes</span>
        <span className="text-xl font-extrabold text-primary">{formatCurrency(totalSpent)}</span>
      </div>

      {expenses.length === 0 ? (
        <div className="text-center py-8 text-text-secondary text-sm">No hay gastos registrados en este mes.</div>
      ) : (
        <div className="space-y-3">
          {expenses.map(expense => (
            <div key={expense.id} className="bg-surface p-4 rounded-card shadow-sm flex justify-between items-center border border-border">
              <div className="flex-1 mr-2">
                <p className="font-bold text-text-primary text-sm truncate">{expense.product}</p>
                <div className="flex gap-2 text-[10px] text-text-secondary mt-1">
                  <span className="bg-[#F2F2F2] px-2 py-0.5 rounded-pill truncate max-w-[100px]">
                    {categories[expense.categoryId]?.name || "Sin categoría"}
                  </span>
                  <span className="bg-[#F2F2F2] px-2 py-0.5 rounded-pill truncate max-w-[120px]" title={expense.paidBy}>
                    🧑 {expense.paidBy?.split('@')[0] || "Desconocido"}
                  </span>
                </div>
              </div>
              <div className="text-right flex items-center gap-3">
                <div>
                  <p className="font-extrabold text-base text-primary">
                    {formatCurrency(expense.value)}
                  </p>
                  <p className="text-[10px] text-text-tertiary">
                    {expense.createdAt?.toDate().toLocaleDateString()}
                  </p>
                </div>
                <button 
                  onClick={() => handleDelete(expense.id)}
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-red-100 text-red-500 hover:bg-red-200 transition-colors"
                  title="Eliminar gasto"
                >
                  🗑️
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
