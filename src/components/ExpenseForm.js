"use client";

import { useState, useEffect } from "react";
import { addExpense, getCategories, getPeople } from "@/services/db";
import { useAuth } from "@/context/AuthContext";
import { useWallet } from "@/context/WalletContext";

export default function ExpenseForm({ onExpenseAdded }) {
  const { user } = useAuth();
  const { activeWallet } = useWallet();
  const [product, setProduct] = useState("");
  const [value, setValue] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [paidBy, setPaidBy] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [categories, setCategories] = useState([]);
  const [people, setPeople] = useState([]);

  useEffect(() => {
    if (activeWallet) {
      loadSelectData();
    }
  }, [activeWallet]);

  const loadSelectData = async () => {
    const cats = await getCategories(activeWallet.id);
    const peps = await getPeople(activeWallet.id);
    setCategories(cats);
    setPeople(peps);
  };

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
      setProduct("");
      setValue("");
      setCategoryId("");
      setPaidBy("");
      if (onExpenseAdded) onExpenseAdded();
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
              {people.map(person => (
                <option key={person.id} value={person.id}>{person.name}</option>
              ))}
            </select>
          </div>
        </div>

        <button 
          type="submit" 
          disabled={isSubmitting}
          className="w-full h-12 bg-primary text-text-primary font-bold rounded-pill shadow-fab mt-2 disabled:opacity-50"
        >
          {isSubmitting ? "Guardando..." : "Guardar Gasto"}
        </button>
      </form>
    </div>
  );
}
