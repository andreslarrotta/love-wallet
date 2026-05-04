"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useWallet } from "@/context/WalletContext";
import { useRouter } from "next/navigation";
import { addCategory, getCategories, deleteCategory, addPerson, getPeople, deletePerson, createSharedWallet } from "@/services/db";
import Link from "next/link";

export default function ConfigPage() {
  const { user, loading: authLoading } = useAuth();
  const { activeWallet, loadWallets, loading: walletLoading } = useWallet();
  const router = useRouter();

  const [categories, setCategories] = useState([]);
  const [people, setPeople] = useState([]);
  
  const [newCatName, setNewCatName] = useState("");
  const [newCatBudget, setNewCatBudget] = useState("");
  const [newPersonName, setNewPersonName] = useState("");
  const [partnerEmail, setPartnerEmail] = useState("");

  const loading = authLoading || walletLoading;

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    } else if (activeWallet) {
      loadData();
    }
  }, [user, activeWallet, loading, router]);

  const loadData = async () => {
    if (!activeWallet) return;
    const cats = await getCategories(activeWallet.id);
    const peps = await getPeople(activeWallet.id);
    setCategories(cats);
    setPeople(peps);
  };

  const handleAddCategory = async (e) => {
    e.preventDefault();
    if (!newCatName || !newCatBudget || !activeWallet) return;
    await addCategory(activeWallet.id, { name: newCatName, budget: Number(newCatBudget) });
    setNewCatName("");
    setNewCatBudget("");
    loadData();
  };

  const handleAddPerson = async (e) => {
    e.preventDefault();
    if (!newPersonName || !activeWallet) return;
    await addPerson(activeWallet.id, newPersonName);
    setNewPersonName("");
    loadData();
  };

  const handleCreateSharedWallet = async (e) => {
    e.preventDefault();
    if (!partnerEmail || !user) return;
    await createSharedWallet(user.email, partnerEmail);
    setPartnerEmail("");
    loadWallets(); // Refresh wallets
    alert("¡Billetera compartida creada con " + partnerEmail + "!");
  };

  const handleDeleteCategory = async (id) => {
    await deleteCategory(id);
    loadData();
  };

  const handleDeletePerson = async (id) => {
    await deletePerson(id);
    loadData();
  };

  if (loading || !user) return <div className="min-h-screen bg-background flex justify-center items-center">Cargando...</div>;

  return (
    <div className="min-h-screen bg-background p-screen-h pb-24 overflow-y-auto">
      <header className="mb-section-gap flex items-center gap-4">
        <Link href="/" className="w-10 h-10 rounded-full bg-surface shadow-card flex items-center justify-center text-xl">
          ←
        </Link>
        <h1 className="hero-heading">Configuración</h1>
      </header>

      {/* Shared Wallet Section */}
      <section className="mb-section-gap">
        <h2 className="section-title mb-4">Compartir Gastos</h2>
        <div className="p-card-p bg-surface rounded-card shadow-sm border border-primary/20">
          <p className="text-sm text-text-secondary mb-3">
            Ingresa el correo de tu pareja para crear una billetera compartida.
          </p>
          <form onSubmit={handleCreateSharedWallet} className="flex gap-2">
            <input 
              type="email" 
              placeholder="correo@ejemplo.com" 
              value={partnerEmail}
              onChange={(e) => setPartnerEmail(e.target.value)}
              className="flex-1 h-12 bg-[#F2F2F2] rounded-search-bar px-4 text-sm"
              required
            />
            <button type="submit" className="w-12 h-12 bg-primary text-text-primary font-bold rounded-search-bar flex items-center justify-center shadow-sm text-xl">
              +
            </button>
          </form>
        </div>
      </section>

      <div className="bg-primary/10 p-2 rounded-lg mb-4 text-center">
        <span className="text-xs font-bold text-primary uppercase">Editando: {activeWallet?.name}</span>
      </div>

      {/* Categories Section */}
      <section className="mb-section-gap">
        <h2 className="section-title mb-4">Categorías y Presupuesto</h2>
        
        <form onSubmit={handleAddCategory} className="flex gap-2 mb-4">
          <input 
            type="text" 
            placeholder="Ej: Mercado" 
            value={newCatName}
            onChange={(e) => setNewCatName(e.target.value)}
            className="flex-1 h-12 bg-[#F2F2F2] rounded-search-bar px-4 text-sm"
            required
          />
          <input 
            type="number" 
            placeholder="$ Presupuesto" 
            value={newCatBudget}
            onChange={(e) => setNewCatBudget(e.target.value)}
            className="w-32 h-12 bg-[#F2F2F2] rounded-search-bar px-4 text-sm"
            required
          />
          <button type="submit" className="w-12 h-12 bg-primary text-text-primary font-bold rounded-search-bar flex items-center justify-center shadow-sm text-xl">
            +
          </button>
        </form>

        <div className="space-y-2">
          {categories.map(cat => (
            <div key={cat.id} className="flex justify-between items-center p-card-p bg-surface rounded-card shadow-sm">
              <div>
                <p className="card-title">{cat.name}</p>
                <p className="card-subtitle text-primary font-semibold">${cat.budget.toLocaleString()}</p>
              </div>
              <button onClick={() => handleDeleteCategory(cat.id)} className="text-red-500 text-sm">Eliminar</button>
            </div>
          ))}
          {categories.length === 0 && <p className="text-sm text-text-secondary text-center py-4">No hay categorías configuradas.</p>}
        </div>
      </section>

      {/* People Section */}
      <section>
        <h2 className="section-title mb-4">Personas (Quién paga)</h2>
        
        <form onSubmit={handleAddPerson} className="flex gap-2 mb-4">
          <input 
            type="text" 
            placeholder="Nombre de la persona" 
            value={newPersonName}
            onChange={(e) => setNewPersonName(e.target.value)}
            className="flex-1 h-12 bg-[#F2F2F2] rounded-search-bar px-4 text-sm"
            required
          />
          <button type="submit" className="w-12 h-12 bg-primary text-text-primary font-bold rounded-search-bar flex items-center justify-center shadow-sm text-xl">
            +
          </button>
        </form>

        <div className="space-y-2">
          {people.map(person => (
            <div key={person.id} className="flex justify-between items-center p-card-p bg-surface rounded-card shadow-sm">
              <p className="card-title">{person.name}</p>
              <button onClick={() => handleDeletePerson(person.id)} className="text-red-500 text-sm">Eliminar</button>
            </div>
          ))}
          {people.length === 0 && <p className="text-sm text-text-secondary text-center py-4">No hay personas registradas.</p>}
        </div>
      </section>
    </div>
  );
}
