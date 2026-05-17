"use client";
import Loading from "@/components/Loading";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useWallet } from "@/context/WalletContext";
import { useRouter } from "next/navigation";
import { addCategory, getCategories, deleteCategory, updateCategory, createSharedWallet, updateWalletIncomes, updateWalletIncomeSources } from "@/services/db";
import Link from "next/link";

export default function ConfigPage() {
  const { user, loading: authLoading } = useAuth();
  const { wallets, activeWallet, switchWallet, loadWallets, loading: walletLoading } = useWallet();
  const router = useRouter();

  const [categories, setCategories] = useState([]);
  
  const [newCatName, setNewCatName] = useState("");
  // budgets is now an object mapping email -> amount
  const [newCatBudgets, setNewCatBudgets] = useState({});
  const [editingCategoryId, setEditingCategoryId] = useState(null);

  const [partnerEmail, setPartnerEmail] = useState("");
  
  // Income Sources
  const [incomeSources, setIncomeSources] = useState([]);
  const [editingIncomeId, setEditingIncomeId] = useState(null);
  const [incomeName, setIncomeName] = useState("");
  const [incomeAmount, setIncomeAmount] = useState("");
  const [incomeOwner, setIncomeOwner] = useState("");

  const loading = authLoading || walletLoading;

  async function initWallet(wallet) {
    const cats = await getCategories(wallet.id);
    setCategories(cats);

    const initialBudgets = {};
    wallet.members.forEach(member => {
      initialBudgets[member] = "";
    });
    setNewCatBudgets(initialBudgets);

    const initialSources = wallet.incomeSources || [];
    setIncomeSources(initialSources);
  }

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    } else if (activeWallet) {
      let cancelled = false;
      const wallet = activeWallet;
      setTimeout(() => {
        if (cancelled) return;
        initWallet(wallet);
      }, 0);
      return () => {
        cancelled = true;
      };
    }
  }, [user, activeWallet, loading, router]);

  async function loadData() {
    if (!activeWallet) return;
    const cats = await getCategories(activeWallet.id);
    setCategories(cats);
  }

  const handleBudgetChange = (email, value) => {
    setNewCatBudgets(prev => ({ ...prev, [email]: value }));
  };

  const handleSaveIncomeSource = async (e) => {
    e.preventDefault();
    if (!activeWallet || !incomeName || !incomeAmount || !incomeOwner) return;

    let updatedSources = [...incomeSources];
    
    if (editingIncomeId) {
      updatedSources = updatedSources.map(inc => 
        inc.id === editingIncomeId 
          ? { ...inc, name: incomeName, amount: Number(incomeAmount), owner: incomeOwner }
          : inc
      );
    } else {
      updatedSources.push({
        id: Date.now().toString(),
        name: incomeName,
        amount: Number(incomeAmount),
        owner: incomeOwner
      });
    }

    const newIncomesDict = {};
    activeWallet.members.forEach(m => newIncomesDict[m] = 0);
    updatedSources.forEach(inc => {
      if (newIncomesDict[inc.owner] !== undefined) {
        newIncomesDict[inc.owner] += inc.amount;
      }
    });

    await updateWalletIncomeSources(activeWallet.id, updatedSources);
    await updateWalletIncomes(activeWallet.id, newIncomesDict);
    
    setIncomeSources(updatedSources);
    setIncomeName("");
    setIncomeAmount("");
    setIncomeOwner("");
    setEditingIncomeId(null);
    loadWallets();
  };

  const handleEditIncome = (inc) => {
    setEditingIncomeId(inc.id);
    setIncomeName(inc.name);
    setIncomeAmount(inc.amount);
    setIncomeOwner(inc.owner);
  };

  const handleCancelEditIncome = () => {
    setEditingIncomeId(null);
    setIncomeName("");
    setIncomeAmount("");
    setIncomeOwner("");
  };

  const handleDeleteIncome = async (id) => {
    const updatedSources = incomeSources.filter(inc => inc.id !== id);
    const newIncomesDict = {};
    activeWallet.members.forEach(m => newIncomesDict[m] = 0);
    updatedSources.forEach(inc => {
      if (newIncomesDict[inc.owner] !== undefined) {
        newIncomesDict[inc.owner] += inc.amount;
      }
    });

    await updateWalletIncomeSources(activeWallet.id, updatedSources);
    await updateWalletIncomes(activeWallet.id, newIncomesDict);
    setIncomeSources(updatedSources);
    loadWallets();
  };

  const handleSaveCategory = async (e) => {
    e.preventDefault();
    if (!newCatName || !activeWallet) return;

    // Convert budgets to numbers
    const budgetsToSave = {};
    activeWallet.members.forEach(member => {
      budgetsToSave[member] = Number(newCatBudgets[member]) || 0;
    });

    if (editingCategoryId) {
      await updateCategory(editingCategoryId, { name: newCatName, budgets: budgetsToSave });
      setEditingCategoryId(null);
    } else {
      await addCategory(activeWallet.id, { name: newCatName, budgets: budgetsToSave });
    }

    setNewCatName("");
    const resetBudgets = {};
    activeWallet.members.forEach(member => { resetBudgets[member] = ""; });
    setNewCatBudgets(resetBudgets);
    
    loadData();
  };

  const handleEditCategory = (cat) => {
    setEditingCategoryId(cat.id);
    setNewCatName(cat.name);
    // Compatibility: if it was saved the old way (single budget), convert it for the first user
    const loadedBudgets = {};
    activeWallet.members.forEach(member => {
      loadedBudgets[member] = cat.budgets?.[member] || (cat.budget ? cat.budget : "");
    });
    setNewCatBudgets(loadedBudgets);
  };

  const handleCancelEdit = () => {
    setEditingCategoryId(null);
    setNewCatName("");
    const resetBudgets = {};
    activeWallet.members.forEach(member => { resetBudgets[member] = ""; });
    setNewCatBudgets(resetBudgets);
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



  if (loading || !user) return <Loading fullScreen />;

  return (
    <div className="min-h-screen bg-background p-screen-h pb-24 overflow-y-auto">
      <header className="mb-section-gap flex items-center gap-4">
        <Link href="/" className="w-10 h-10 rounded-full bg-white border-2 border-black shadow-[2px_2px_0px_#000] flex items-center justify-center text-xl neo-button">
          ←
        </Link>
        <h1 className="hero-heading">Configuración</h1>
      </header>

      {/* Wallet Toggle */}
      {wallets.length > 1 && (
        <div className="flex bg-white neo-border neo-shadow-sm p-1 rounded-pill mb-section-gap">
          {wallets.map(wallet => (
            <button
              key={wallet.id}
              onClick={() => switchWallet(wallet.id)}
              className={`flex-1 py-2 text-sm font-extrabold rounded-pill transition-all ${
                activeWallet?.id === wallet.id 
                  ? "bg-primary text-black border-2 border-black shadow-[2px_2px_0px_#000]" 
                  : "text-text-secondary"
              }`}
            >
              {wallet.name}
            </button>
          ))}
        </div>
      )}

      {/* Shared Wallet Section */}
      {activeWallet?.type === "personal" ? (
        <section className="mb-section-gap">
          <h2 className="section-title mb-4">Compartir Gastos</h2>
          <div className="p-card-p bg-secondary rounded-card neo-border neo-shadow-sm">
            <p className="text-sm text-black font-bold mb-3">
              Ingresa el correo de tu pareja para crear una billetera compartida.
            </p>
            <form onSubmit={handleCreateSharedWallet} className="flex gap-2">
              <input 
                type="email" 
                placeholder="correo@ejemplo.com" 
                value={partnerEmail}
                onChange={(e) => setPartnerEmail(e.target.value)}
                className="flex-1 h-12 bg-white border-2 border-black rounded-search-bar px-4 text-sm font-bold shadow-[2px_2px_0px_#000] outline-none"
                required
              />
              <button type="submit" className="w-12 h-12 bg-primary text-black font-extrabold rounded-search-bar flex items-center justify-center border-2 border-black shadow-[2px_2px_0px_#000] text-xl neo-button">
                +
              </button>
            </form>
          </div>
        </section>
      ) : (
        <section className="mb-section-gap">
          <div className="p-card-p bg-secondary rounded-card neo-border neo-shadow-sm">
            <h2 className="text-sm font-extrabold text-black uppercase mb-2">Billetera Compartida con:</h2>
            <ul className="text-xs text-black font-bold space-y-1">
              {activeWallet?.members.map(member => (
                <li key={member}>• {member} {member === user?.email ? "(Tú)" : ""}</li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {/* Incomes Section */}
      <section className="mb-section-gap">
        <h2 className="section-title mb-4">Fuentes de Ingresos</h2>
        <div className="p-card-p bg-secondary rounded-card neo-border neo-shadow-sm">
          <form onSubmit={handleSaveIncomeSource} className="bg-white p-3 rounded-xl neo-border neo-shadow-sm mb-4">
            <h4 className="text-xs font-bold text-black mb-2">{editingIncomeId ? "Editar Ingreso" : "Nuevo Ingreso"}</h4>
            
            <div className="space-y-2 mb-3">
              <input 
                type="text" 
                placeholder="Nombre (ej. Salario)" 
                value={incomeName}
                onChange={(e) => setIncomeName(e.target.value)}
                className="w-full h-10 bg-white border-2 border-black rounded-search-bar px-3 text-sm font-bold shadow-[2px_2px_0px_#000] outline-none"
                required
              />
              <div className="flex gap-2">
                <input 
                  type="number" 
                  placeholder="$ Monto" 
                  value={incomeAmount}
                  onChange={(e) => setIncomeAmount(e.target.value)}
                  className="flex-1 h-10 bg-white border-2 border-black rounded-search-bar px-3 text-sm font-bold shadow-[2px_2px_0px_#000] outline-none"
                  required
                />
                <select
                  value={incomeOwner}
                  onChange={(e) => setIncomeOwner(e.target.value)}
                  className="flex-1 h-10 bg-white border-2 border-black rounded-search-bar px-2 text-xs font-bold shadow-[2px_2px_0px_#000] outline-none appearance-none"
                  required
                >
                  <option value="">¿De quién?</option>
                  {activeWallet?.members.map(m => (
                    <option key={m} value={m}>{m.split("@")[0]}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex gap-2">
              <button type="submit" className="flex-1 h-10 bg-primary text-black font-extrabold rounded-pill border-2 border-black shadow-[2px_2px_0px_#000] text-xs neo-button">
                {editingIncomeId ? "Actualizar" : "Añadir"}
              </button>
              {editingIncomeId && (
                <button type="button" onClick={handleCancelEditIncome} className="h-10 px-4 bg-white text-black font-bold rounded-pill border-2 border-black shadow-[2px_2px_0px_#000] text-xs neo-button">
                  Cancelar
                </button>
              )}
            </div>
          </form>

          <div className="space-y-2">
            {incomeSources.map(inc => (
              <div key={inc.id} className="flex justify-between items-center p-2 bg-white border-2 border-black rounded-xl">
                <div>
                  <p className="text-sm font-bold text-black">{inc.name}</p>
                  <p className="text-[10px] text-text-secondary font-bold">{inc.owner.split("@")[0]} - ${inc.amount.toLocaleString()}</p>
                </div>
                <div className="flex gap-2">
                  <button type="button" onClick={() => handleEditIncome(inc)} className="w-8 h-8 flex items-center justify-center bg-accent border-2 border-black shadow-[2px_2px_0px_#000] rounded-full text-xs neo-button">✏️</button>
                  <button type="button" onClick={() => handleDeleteIncome(inc.id)} className="w-8 h-8 flex items-center justify-center bg-white border-2 border-black shadow-[2px_2px_0px_#000] rounded-full text-xs neo-button">🗑️</button>
                </div>
              </div>
            ))}
            {incomeSources.length === 0 && <p className="text-xs text-black font-bold text-center py-2">No hay ingresos registrados.</p>}
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="mb-section-gap">
        <h2 className="section-title mb-4">Categorías y Presupuesto</h2>
        
        <form onSubmit={handleSaveCategory} className="bg-secondary p-4 rounded-card neo-border neo-shadow-sm mb-4">
          <h3 className="text-sm font-bold text-black mb-2">{editingCategoryId ? "Editar Categoría" : "Nueva Categoría"}</h3>
          
          <input 
            type="text" 
            placeholder="Ej: Mercado" 
            value={newCatName}
            onChange={(e) => setNewCatName(e.target.value)}
            className="w-full h-12 bg-white border-2 border-black rounded-search-bar px-4 text-sm font-bold shadow-[2px_2px_0px_#000] outline-none mb-3"
            required
          />
          
          <p className="text-[10px] text-black font-extrabold uppercase mb-2">Presupuesto asignado a cada uno:</p>
          {activeWallet?.members.map(member => (
            <div key={member} className="flex items-center gap-2 mb-2">
              <span className="text-xs text-black font-bold w-1/2 truncate">{member}</span>
              <input 
                type="number" 
                placeholder="$" 
                value={newCatBudgets[member] || ""}
                onChange={(e) => handleBudgetChange(member, e.target.value)}
                className="flex-1 h-10 bg-white border-2 border-black rounded-search-bar px-4 text-sm font-bold shadow-[2px_2px_0px_#000] outline-none focus:bg-primary/10 focus:translate-x-[2px] focus:translate-y-[2px] focus:shadow-none transition-all"
                required
              />
            </div>
          ))}

          <div className="flex gap-2 mt-4">
            <button type="submit" className="flex-1 h-12 bg-primary text-black font-extrabold rounded-pill border-2 border-black shadow-[2px_2px_0px_#000] neo-button">
              {editingCategoryId ? "Guardar Cambios" : "Crear Categoría"}
            </button>
            {editingCategoryId && (
              <button type="button" onClick={handleCancelEdit} className="h-12 px-4 bg-white text-black font-bold rounded-pill border-2 border-black shadow-[2px_2px_0px_#000] neo-button">
                Cancelar
              </button>
            )}
          </div>
        </form>

        <div className="space-y-3">
          {categories.map(cat => (
            <div key={cat.id} className="p-card-p bg-white rounded-card neo-border neo-shadow-sm">
              <div className="flex justify-between items-center mb-2">
                <p className="card-title text-lg uppercase">{cat.name}</p>
                <div className="flex gap-2">
                  <button onClick={() => handleEditCategory(cat)} className="text-black bg-accent border-2 border-black px-2 py-0.5 rounded-pill shadow-[2px_2px_0px_#000] text-[10px] font-bold neo-button">Editar</button>
                  <button onClick={() => handleDeleteCategory(cat.id)} className="text-black bg-white border-2 border-black px-2 py-0.5 rounded-pill shadow-[2px_2px_0px_#000] text-[10px] font-bold neo-button">Eliminar</button>
                </div>
              </div>
              <div className="space-y-2 mt-4 pt-2 border-t-2 border-black">
                {activeWallet?.members.map(member => {
                  const amt = cat.budgets?.[member] || (cat.budget ? cat.budget : 0);
                  return (
                    <div key={member} className="flex justify-between items-center text-xs text-text-secondary">
                      <span className="truncate w-2/3 text-black font-bold">{member}</span>
                      <span className="font-extrabold text-black bg-primary px-2 py-0.5 rounded-pill border-2 border-black shadow-[2px_2px_0px_#000]">${amt.toLocaleString()}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
          {categories.length === 0 && <p className="text-sm text-text-secondary text-center py-4">No hay categorías configuradas.</p>}
        </div>
      </section>


    </div>
  );
}
