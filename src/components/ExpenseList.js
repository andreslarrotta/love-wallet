"use client";

import { useState, useEffect, useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { getExpenses, getCategories, deleteExpense } from "@/services/db";
import { useWallet } from "@/context/WalletContext";
import Loading from "@/components/Loading";
import Modal from "@/components/Modal";
import ExpenseForm from "@/components/ExpenseForm";

export default function ExpenseList({ refreshTrigger, selectedMonth, showValues = true, onExpenseChanged }) {
  const { activeWallet } = useWallet();
  const [expenses, setExpenses] = useState([]);
  const [categories, setCategories] = useState({});
  const [loading, setLoading] = useState(true);

  const [editingExpense, setEditingExpense] = useState(null);
  const container = useRef();

  useGSAP(() => {
    if (!loading && expenses.length > 0) {
      gsap.from(".gsap-expense-card", {
        x: -50,
        opacity: 0,
        duration: 0.4,
        stagger: 0.1,
        ease: "power2.out",
        clearProps: "all"
      });
    }
  }, { scope: container, dependencies: [loading, expenses] });

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
      if (onExpenseChanged) onExpenseChanged();
    }
  };

  const totalSpent = expenses.reduce((acc, exp) => acc + exp.value, 0);

  const formatCurrency = (value) => {
    if (!showValues) return "******";
    return `$${value.toLocaleString()}`;
  };

  if (loading) return <Loading />;

  return (
    <div className="space-y-4" ref={container}>
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
            <div key={expense.id} className="bg-surface p-4 rounded-card neo-shadow-sm flex justify-between items-center neo-border mb-3 gsap-expense-card hover:-translate-y-1 transition-transform">
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
                <div className="flex gap-2 flex-col">
                  <button
                    onClick={() => setEditingExpense(expense)}
                    className="w-8 h-8 flex items-center justify-center rounded-full bg-white border-2 border-black shadow-[2px_2px_0px_#000] text-black neo-button transition-colors"
                    title="Editar gasto"
                  >
                    ✏️
                  </button>
                  <button
                    onClick={() => handleDelete(expense.id)}
                    className="w-8 h-8 flex items-center justify-center rounded-full bg-accent border-2 border-black shadow-[2px_2px_0px_#000] text-black neo-button transition-colors"
                    title="Eliminar gasto"
                  >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M10 12L14 16M14 12L10 16M4 6H20M16 6L15.7294 5.18807C15.4671 4.40125 15.3359 4.00784 15.0927 3.71698C14.8779 3.46013 14.6021 3.26132 14.2905 3.13878C13.9376 3 13.523 3 12.6936 3H11.3064C10.477 3 10.0624 3 9.70951 3.13878C9.39792 3.26132 9.12208 3.46013 8.90729 3.71698C8.66405 4.00784 8.53292 4.40125 8.27064 5.18807L8 6M18 6V16.2C18 17.8802 18 18.7202 17.673 19.362C17.3854 19.9265 16.9265 20.3854 16.362 20.673C15.7202 21 14.8802 21 13.2 21H10.8C9.11984 21 8.27976 21 7.63803 20.673C7.07354 20.3854 6.6146 19.9265 6.32698 19.362C6 18.7202 6 17.8802 6 16.2V6" stroke="#000000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {editingExpense && (
        <Modal
          isOpen={true}
          onClose={() => setEditingExpense(null)}
          title="Editar Gasto"
        >
          <ExpenseForm
            onClose={() => setEditingExpense(null)}
            onExpenseAdded={() => {
              setEditingExpense(null);
              setLocalRefresh(prev => prev + 1);
              if (onExpenseChanged) onExpenseChanged();
            }}
            initialData={editingExpense}
          />
        </Modal>
      )}
    </div>
  );
}
