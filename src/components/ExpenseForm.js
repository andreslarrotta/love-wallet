"use client";

import { useState, useEffect } from "react";
import { addExpense, getCategories, getExpenses, updateExpense } from "@/services/db";
import { useAuth } from "@/context/AuthContext";
import { useWallet } from "@/context/WalletContext";

export default function ExpenseForm({ onExpenseAdded, selectedMonth, onClose, initialData = null }) {
  const { user } = useAuth();
  const { activeWallet } = useWallet();
  const [product, setProduct] = useState(initialData?.product || "");
  const [value, setValue] = useState(initialData?.value || "");
  const [categoryId, setCategoryId] = useState(initialData?.categoryId || "");
  const [paidBy, setPaidBy] = useState(initialData?.paidBy || "");
  const [incomeSourceId, setIncomeSourceId] = useState(initialData?.incomeSourceId || "");
  const [date, setDate] = useState(() => {
    if (initialData?.createdAt) {
      const d = initialData.createdAt.toDate ? initialData.createdAt.toDate() : new Date(initialData.createdAt);
      return d.toISOString().split('T')[0];
    }
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [categories, setCategories] = useState([]);
  const [spentByMember, setSpentByMember] = useState({});
  const [spentBySource, setSpentBySource] = useState({});

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
    const sourceSpentMap = {};
    filteredExpenses.forEach(expense => {
      const email = expense.paidBy || expense.userEmail || activeWallet.members[0];
      spentMap[email] = (spentMap[email] || 0) + (Number(expense.value) || 0);
      
      if (expense.incomeSourceId) {
        sourceSpentMap[expense.incomeSourceId] = (sourceSpentMap[expense.incomeSourceId] || 0) + (Number(expense.value) || 0);
      }
    });
    setSpentByMember(spentMap);
    setSpentBySource(sourceSpentMap);
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
      const expenseData = {
        product,
        value: Number(value),
        categoryId,
        paidBy,
        incomeSourceId: incomeSourceId || null,
        userEmail: user.email,
        createdAt: new Date(date + "T12:00:00")
      };

      if (initialData) {
        await updateExpense(initialData.id, expenseData);
      } else {
        await addExpense(activeWallet.id, expenseData);

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
      }

      setProduct("");

      setValue("");
      setCategoryId("");
      setPaidBy("");
      setIncomeSourceId("");
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
    <div className="bg-surface p-card-p rounded-card neo-border neo-shadow">
      <h3 className="section-title mb-4">{initialData ? "Editar Gasto" : "Nuevo Gasto"}</h3>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className="block text-xs font-semibold text-text-secondary uppercase mb-1">Producto / Servicio</label>
          <input 
            type="text" 
            value={product} 
            onChange={(e) => setProduct(e.target.value)}
            className="w-full h-12 bg-white border-2 border-black rounded-lg px-4 text-sm font-bold shadow-[2px_2px_0px_#000] outline-none focus:bg-primary/10 focus:translate-y-[2px] focus:translate-x-[2px] focus:shadow-none transition-all"
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
            className="w-full h-12 bg-white border-2 border-black rounded-lg px-4 text-sm font-bold shadow-[2px_2px_0px_#000] outline-none focus:bg-primary/10 focus:translate-y-[2px] focus:translate-x-[2px] focus:shadow-none transition-all"
            required
            placeholder="$"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-text-secondary uppercase mb-1">Fecha</label>
          <input 
            type="date" 
            value={date} 
            onChange={(e) => setDate(e.target.value)}
            className="w-full h-12 bg-white border-2 border-black rounded-lg px-2 sm:px-4 text-sm font-bold shadow-[2px_2px_0px_#000] outline-none focus:bg-primary/10 focus:translate-y-[2px] focus:translate-x-[2px] focus:shadow-none transition-all appearance-none block"
            required
          />
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 min-w-0">
            <label className="block text-xs font-semibold text-text-secondary uppercase mb-1">Categoría</label>
            <select 
              value={categoryId} 
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full h-12 bg-white border-2 border-black rounded-lg px-4 text-sm font-bold shadow-[2px_2px_0px_#000] outline-none focus:bg-primary/10 focus:translate-y-[2px] focus:translate-x-[2px] focus:shadow-none transition-all appearance-none"
              required
            >
              <option value="">Selecciona...</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>

          <div className="flex-1 min-w-0">
            <label className="block text-xs font-semibold text-text-secondary uppercase mb-1">Pagado por</label>
            <select 
              value={paidBy} 
              onChange={(e) => setPaidBy(e.target.value)}
              className="w-full h-12 bg-white border-2 border-black rounded-lg px-4 text-sm font-bold shadow-[2px_2px_0px_#000] outline-none focus:bg-primary/10 focus:translate-y-[2px] focus:translate-x-[2px] focus:shadow-none transition-all appearance-none"
              required
            >
              <option value="">Selecciona...</option>
              {activeWallet?.members.map(member => (
                <option key={member} value={member}>{member}</option>
              ))}
            </select>
          </div>
        </div>

        {paidBy && activeWallet?.incomeSources && activeWallet.incomeSources.some(src => src.owner === paidBy) && (
          <div>
            <label className="block text-xs font-semibold text-text-secondary uppercase mb-1">Descontar de (Ingreso)</label>
            <select 
              value={incomeSourceId} 
              onChange={(e) => setIncomeSourceId(e.target.value)}
              className="w-full h-12 bg-white border-2 border-black rounded-lg px-4 text-sm font-bold shadow-[2px_2px_0px_#000] outline-none focus:bg-primary/10 focus:translate-y-[2px] focus:translate-x-[2px] focus:shadow-none transition-all appearance-none"
            >
              <option value="">General (No especificado)</option>
              {activeWallet.incomeSources.filter(src => src.owner === paidBy).map(src => (
                <option key={src.id} value={src.id}>{src.name} (${src.amount.toLocaleString()})</option>
              ))}
            </select>
          </div>
        )}

        {paidBy && (
          (() => {
            const selectedSource = incomeSourceId ? activeWallet?.incomeSources?.find(s => s.id === incomeSourceId) : null;
            const income = selectedSource ? Number(selectedSource.amount) : (Number(activeWallet?.incomes?.[paidBy]) || 0);
            const spent = selectedSource ? (spentBySource[incomeSourceId] || 0) : (spentByMember[paidBy] || 0);
            const projected = spent + (Number(value) || 0);
            const percentage = income > 0 ? Math.min((projected / income) * 100, 100) : 0;
            const formatCurrency = (v) => `$${Number(v || 0).toLocaleString()}`;

            if (income <= 0) {
              return (
                <div className="bg-secondary p-3 rounded-card neo-border neo-shadow-sm">
                  <p className="text-xs font-bold text-black uppercase">Consumo de ingreso</p>
                  <p className="text-[11px] text-black font-medium mt-1">
                    Define el ingreso mensual de {paidBy.split("@")[0]} en Configuración para ver el porcentaje de uso.
                  </p>
                </div>
              );
            }

            return (
              <div className="bg-secondary p-3 rounded-card neo-border neo-shadow-sm mt-4">
                <div className="flex justify-between items-center">
                  <p className="text-xs font-bold text-black uppercase">
                    {selectedSource ? `Consumo de: ${selectedSource.name}` : "Consumo de ingreso total"}
                  </p>
                  <p className="text-xs text-black font-extrabold">{paidBy.split("@")[0]}</p>
                </div>
                <div className="flex justify-between items-center mt-1">
                  <p className="text-[11px] text-black font-medium">Este mes (incluye este gasto)</p>
                  <p className="text-[11px] font-extrabold text-black">{formatCurrency(projected)} / {formatCurrency(income)}</p>
                </div>
                <div className="w-full bg-white border-2 border-black rounded-full h-3 overflow-hidden mt-2 shadow-[2px_2px_0px_#000]">
                  <div className="h-full border-r-2 border-black bg-primary" style={{ width: `${percentage}%` }}></div>
                </div>
                <p className="text-[10px] text-right mt-1 text-black font-bold">{Math.round(percentage)}% usado</p>
              </div>
            );
          })()
        )}

        <div className="flex gap-3 mt-2">
          {onClose && (
            <button 
              type="button"
              onClick={onClose}
              className="flex-1 h-12 bg-white text-black font-bold rounded-pill neo-border neo-shadow-sm neo-button"
            >
              Cancelar
            </button>
          )}
          <button 
            type="submit" 
            disabled={isSubmitting}
            className={`flex-[2] h-12 bg-primary text-black font-extrabold rounded-pill neo-border neo-shadow neo-button disabled:opacity-50`}
          >
            {isSubmitting ? "Guardando..." : (initialData ? "Actualizar Gasto" : "Guardar Gasto")}
          </button>
        </div>
      </form>
    </div>
  );
}
