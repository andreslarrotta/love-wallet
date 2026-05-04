"use client";

import { useState, useEffect } from "react";
import { getExpenses, getCategories, getPeople } from "@/services/db";
import { useAuth } from "@/context/AuthContext";
import { useWallet } from "@/context/WalletContext";

export default function ExpenseList({ refreshTrigger }) {
  const { user } = useAuth();
  const { activeWallet } = useWallet();
  const [expenses, setExpenses] = useState([]);
  const [categories, setCategories] = useState({});
  const [people, setPeople] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (activeWallet) {
      loadData();
    }
  }, [activeWallet, refreshTrigger]);

  const loadData = async () => {
    setLoading(true);
    const [expData, catData, pepData] = await Promise.all([
      getExpenses(activeWallet.id),
      getCategories(activeWallet.id),
      getPeople(activeWallet.id)
    ]);

    const catMap = {};
    catData.forEach(cat => catMap[cat.id] = cat);
    setCategories(catMap);

    const pepMap = {};
    pepData.forEach(pep => pepMap[pep.id] = pep);
    setPeople(pepMap);

    setExpenses(expData);
    setLoading(false);
  };

  if (loading) return <div className="text-center py-4 text-text-secondary">Cargando gastos...</div>;

  if (expenses.length === 0) {
    return <div className="text-center py-8 text-text-secondary">No hay gastos registrados aún.</div>;
  }

  return (
    <div className="space-y-3">
      {expenses.map(expense => (
        <div key={expense.id} className="bg-surface p-4 rounded-card shadow-sm flex justify-between items-center border border-border">
          <div>
            <p className="font-bold text-text-primary">{expense.product}</p>
            <div className="flex gap-2 text-xs text-text-secondary mt-1">
              <span className="bg-[#F2F2F2] px-2 py-0.5 rounded-pill">
                {categories[expense.categoryId]?.name || "Sin categoría"}
              </span>
              <span className="bg-[#F2F2F2] px-2 py-0.5 rounded-pill">
                🧑 {people[expense.paidBy]?.name || "Desconocido"}
              </span>
            </div>
          </div>
          <div className="text-right">
            <p className="font-extrabold text-lg text-primary">
              ${expense.value.toLocaleString()}
            </p>
            <p className="text-[10px] text-text-tertiary">
              {expense.createdAt?.toDate().toLocaleDateString()}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
