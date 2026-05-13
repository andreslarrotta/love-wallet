"use client";

import { useState, useEffect } from "react";
import { addExpense, getCategories, getExpenses } from "@/services/db";
import { useAuth } from "@/context/AuthContext";
import { useWallet } from "@/context/WalletContext";

export default function ExpenseForm({ onExpenseAdded, selectedMonth, onClose }) {
  const { user } = useAuth();
  const { activeWallet } = useWallet();
  const [product, setProduct] = useState("");
  const [value, setValue] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [paidBy, setPaidBy] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [categories, setCategories] = useState([]);
  const [spentByMember, setSpentByMember] = useState({});

  async function loadSelectData() {
    const [cats, expData] = await Promise.all([
      getCategories(activeWallet.id),
      getExpenses(activeWallet.id)
    ]);
    setCategories(cats);

    const filteredExpenses = selectedMonth
      ? expData.filter(expense => {
          if (!expense.createdAt) return true;
          const date = expense.createdAt.toDate ? expense.createdAt.toDate() : new Date(expense.createdAt);
          const expMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
          return expMonth === selectedMonth;
        })
      : expData;

    const spentMap = {};
    filteredExpenses.forEach(expense => {
      const email = expense.paidBy || expense.userEmail || activeWallet.members[0];
      spentMap[email] = (spentMap[email] || 0) + (Number(expense.value) || 0);
    });
    setSpentByMember(spentMap);
  }

  useEffect(() => {
    if (activeWallet) {
      loadSelectData();
    }
  }, [activeWallet, selectedMonth]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!product || !value || !categoryId || !paidBy || !activeWallet) return;

    setIsSubmitting(true);
    try {
      await addExpense(activeWallet.id, {
        product,
        value: Number(value),
        categoryId,
        paidBy,
        userEmail: user.email
      });

      // Send notification to other members
      fetch("/api/notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          walletId: activeWallet.id,
          amount: value,
          product: product,
          userName: user.displayName || user.email,
          excludeEmail: user.email
        })
      }).catch(err => console.error("Notification error:", err));

      setProduct("");

      setValue("");
      setCategoryId("");
      setPaidBy("");
      await loadSelectData();
      if (onExpenseAdded) onExpenseAdded();
      if (onClose) onClose();
    } catch (error) {
      console.error("Error adding expense:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-surface p-card-p rounded-card shadow-card">
      <h3 className="section-title mb-4">Nuevo Gasto</h3>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className="block text-xs font-semibold text-text-secondary uppercase mb-1">Producto / Servicio</label>
          <input 
            type="text" 
            value={product} 
            onChange={(e) => setProduct(e.target.value)}
            className="w-full h-12 bg-[#F2F2F2] rounded-search-bar px-4 text-sm"
            required
            placeholder="Ej: Cena restaurante"
          />
        </div>
        
        <div>
          <label className="block text-xs font-semibold text-text-secondary uppercase mb-1">Valor</label>
          <input 
            type="number" 
            value={value} 
            onChange={(e) => setValue(e.target.value)}
            className="w-full h-12 bg-[#F2F2F2] rounded-search-bar px-4 text-sm"
            required
            placeholder="$"
          />
        </div>

        <div className="flex gap-4">
          <div className="flex-1">
            <label className="block text-xs font-semibold text-text-secondary uppercase mb-1">Categoría</label>
            <select 
              value={categoryId} 
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full h-12 bg-[#F2F2F2] rounded-search-bar px-4 text-sm appearance-none"
              required
            >
              <option value="">Selecciona...</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>

          <div className="flex-1">
            <label className="block text-xs font-semibold text-text-secondary uppercase mb-1">Pagado por</label>
            <select 
              value={paidBy} 
              onChange={(e) => setPaidBy(e.target.value)}
              className="w-full h-12 bg-[#F2F2F2] rounded-search-bar px-4 text-sm appearance-none"
              required
            >
              <option value="">Selecciona...</option>
              {activeWallet?.members.map(member => (
                <option key={member} value={member}>{member}</option>
              ))}
            </select>
          </div>
        </div>

        {paidBy && (
          (() => {
            const income = Number(activeWallet?.incomes?.[paidBy]) || 0;
            const spent = spentByMember[paidBy] || 0;
            const projected = spent + (Number(value) || 0);
            const percentage = income > 0 ? Math.min((projected / income) * 100, 100) : 0;
            const formatCurrency = (v) => `$${Number(v || 0).toLocaleString()}`;

            if (income <= 0) {
              return (
                <div className="bg-primary/10 p-3 rounded-card border border-primary/20">
                  <p className="text-xs font-bold text-primary">Consumo de ingreso</p>
                  <p className="text-[11px] text-text-secondary mt-1">
                    Define el ingreso mensual de {paidBy.split("@")[0]} en Configuración para ver el porcentaje de uso.
                  </p>
                </div>
              );
            }

            return (
              <div className="bg-primary/10 p-3 rounded-card border border-primary/20">
                <div className="flex justify-between items-center">
                  <p className="text-xs font-bold text-primary">Consumo de ingreso</p>
                  <p className="text-xs text-text-secondary font-semibold">{paidBy.split("@")[0]}</p>
                </div>
                <div className="flex justify-between items-center mt-1">
                  <p className="text-[11px] text-text-secondary">Este mes (incluye este gasto)</p>
                  <p className="text-[11px] font-bold text-primary">{formatCurrency(projected)} / {formatCurrency(income)}</p>
                </div>
                <div className="w-full bg-[#E8E8E8] rounded-full h-2 overflow-hidden mt-2">
                  <div className="h-2 rounded-full bg-primary" style={{ width: `${percentage}%` }}></div>
                </div>
                <p className="text-[10px] text-right mt-1 text-text-tertiary">{Math.round(percentage)}% usado</p>
              </div>
            );
          })()
        )}

        <div className="flex gap-3 mt-2">
          {onClose && (
            <button 
              type="button"
              onClick={onClose}
              className="flex-1 h-12 bg-[#F2F2F2] text-text-secondary font-bold rounded-pill"
            >
              Cancelar
            </button>
          )}
          <button 
            type="submit" 
            disabled={isSubmitting}
            className={`flex-[2] h-12 bg-primary text-text-primary font-bold rounded-pill shadow-fab disabled:opacity-50`}
          >
            {isSubmitting ? "Guardando..." : "Guardar Gasto"}
          </button>
        </div>
      </form>
    </div>
  );
}
