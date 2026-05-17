"use client";

import { useState, useEffect } from "react";
import { getExpenses, getCategories, deleteExpense } from "@/services/db";
import { useWallet } from "@/context/WalletContext";
import Loading from "@/components/Loading";

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
      loadData();
    } else {
      setLoading(false);
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

  if (loading) return <Loading />;

  return (
    <div className="space-y-4">
      {/* Total Section */}
      <div className="bg-primary p-4 rounded-card neo-border neo-shadow-sm flex justify-between items-center">
        <span className="text-sm font-bold text-black uppercase">Total del mes</span>
        <span className="text-xl font-extrabold text-black">{formatCurrency(totalSpent)}</span>
      </div>

      {expenses.length === 0 ? (
        <div className="text-center py-8 text-text-secondary text-sm">No hay gastos registrados en este mes.</div>
      ) : (
        <div className="space-y-3">
          {expenses.map(expense => (
            <div key={expense.id} className="bg-surface p-4 rounded-card neo-shadow-sm flex justify-between items-center neo-border mb-3">
              <div className="flex-1 mr-2">
                <p className="font-bold text-text-primary text-sm truncate">{expense.product}</p>
                <div className="flex gap-2 text-[10px] text-black mt-2">
                  <span className="bg-white border-2 border-black shadow-[2px_2px_0px_#000] font-bold px-2 py-0.5 rounded-pill truncate max-w-[100px]">
                    {categories[expense.categoryId]?.name || "Sin categoría"}
                  </span>
                  <span className="bg-white border-2 border-black shadow-[2px_2px_0px_#000] font-bold px-2 py-0.5 rounded-pill truncate max-w-[120px]" title={expense.paidBy}>
                    🧑 {expense.paidBy?.split('@')[0] || "Desconocido"}
                  </span>
                </div>
              </div>
              <div className="text-right flex items-center gap-3">
                <div>
                  <p className="font-extrabold text-base text-black">
                    {formatCurrency(expense.value)}
                  </p>
                  <p className="text-[10px] text-text-tertiary font-bold">
                    {expense.createdAt?.toDate().toLocaleDateString()}
                  </p>
                </div>
                <button 
                  onClick={() => handleDelete(expense.id)}
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-accent border-2 border-black shadow-[2px_2px_0px_#000] text-black neo-button transition-colors"
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
