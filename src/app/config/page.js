"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useWallet } from "@/context/WalletContext";
import { useRouter } from "next/navigation";
import { addCategory, getCategories, deleteCategory, updateCategory, addPerson, getPeople, deletePerson, createSharedWallet } from "@/services/db";
import Link from "next/link";

export default function ConfigPage() {
  const { user, loading: authLoading } = useAuth();
  const { wallets, activeWallet, switchWallet, loadWallets, loading: walletLoading } = useWallet();
  const router = useRouter();

  const [categories, setCategories] = useState([]);
  const [people, setPeople] = useState([]);
  
  const [newCatName, setNewCatName] = useState("");
  // budgets is now an object mapping email -> amount
  const [newCatBudgets, setNewCatBudgets] = useState({});
  const [editingCategoryId, setEditingCategoryId] = useState(null);

  const [newPersonName, setNewPersonName] = useState("");
  const [partnerEmail, setPartnerEmail] = useState("");

  const loading = authLoading || walletLoading;

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    } else if (activeWallet) {
      loadData();
      // Initialize budget inputs based on wallet members
      const initialBudgets = {};
      activeWallet.members.forEach(member => {
        initialBudgets[member] = "";
      });
      setNewCatBudgets(initialBudgets);
    }
  }, [user, activeWallet, loading, router]);

  const loadData = async () => {
    if (!activeWallet) return;
    const cats = await getCategories(activeWallet.id);
    const peps = await getPeople(activeWallet.id);
    setCategories(cats);
    setPeople(peps);
  };

  const handleBudgetChange = (email, value) => {
    setNewCatBudgets(prev => ({ ...prev, [email]: value }));
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

      {/* Wallet Toggle */}
      {wallets.length > 1 && (
        <div className="flex bg-[#F2F2F2] p-1 rounded-pill mb-section-gap">
          {wallets.map(wallet => (
            <button
              key={wallet.id}
              onClick={() => switchWallet(wallet.id)}
              className={`flex-1 py-2 text-sm font-bold rounded-pill transition-all ${
                activeWallet?.id === wallet.id 
                  ? "bg-white text-primary shadow-sm" 
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
      ) : (
        <section className="mb-section-gap">
          <div className="p-card-p bg-primary/10 rounded-card border border-primary/20">
            <h2 className="text-sm font-bold text-primary mb-2">Billetera Compartida con:</h2>
            <ul className="text-xs text-text-secondary font-medium space-y-1">
              {activeWallet?.members.map(member => (
                <li key={member}>• {member} {member === user?.email ? "(Tú)" : ""}</li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {/* Categories Section */}
      <section className="mb-section-gap">
        <h2 className="section-title mb-4">Categorías y Presupuesto</h2>
        
        <form onSubmit={handleSaveCategory} className="bg-surface p-4 rounded-card shadow-sm mb-4">
          <h3 className="text-sm font-bold mb-2">{editingCategoryId ? "Editar Categoría" : "Nueva Categoría"}</h3>
          
          <input 
            type="text" 
            placeholder="Ej: Mercado" 
            value={newCatName}
            onChange={(e) => setNewCatName(e.target.value)}
            className="w-full h-12 bg-[#F2F2F2] rounded-search-bar px-4 text-sm mb-3"
            required
          />
          
          <p className="text-xs text-text-secondary mb-2 font-semibold">Presupuesto asignado a cada uno:</p>
          {activeWallet?.members.map(member => (
            <div key={member} className="flex items-center gap-2 mb-2">
              <span className="text-xs text-text-secondary w-1/2 truncate">{member}</span>
              <input 
                type="number" 
                placeholder="$" 
                value={newCatBudgets[member] || ""}
                onChange={(e) => handleBudgetChange(member, e.target.value)}
                className="flex-1 h-10 bg-[#F2F2F2] rounded-search-bar px-4 text-sm"
                required
              />
            </div>
          ))}

          <div className="flex gap-2 mt-4">
            <button type="submit" className="flex-1 h-12 bg-primary text-text-primary font-bold rounded-pill shadow-sm">
              {editingCategoryId ? "Guardar Cambios" : "Crear Categoría"}
            </button>
            {editingCategoryId && (
              <button type="button" onClick={handleCancelEdit} className="h-12 px-4 bg-[#F2F2F2] text-text-secondary font-bold rounded-pill">
                Cancelar
              </button>
            )}
          </div>
        </form>

        <div className="space-y-2">
          {categories.map(cat => (
            <div key={cat.id} className="p-card-p bg-surface rounded-card shadow-sm">
              <div className="flex justify-between items-center mb-2">
                <p className="card-title text-lg">{cat.name}</p>
                <div className="flex gap-2">
                  <button onClick={() => handleEditCategory(cat)} className="text-blue-500 text-sm font-semibold">Editar</button>
                  <button onClick={() => handleDeleteCategory(cat.id)} className="text-red-500 text-sm font-semibold">Eliminar</button>
                </div>
              </div>
              <div className="space-y-1">
                {activeWallet?.members.map(member => {
                  const amt = cat.budgets?.[member] || (cat.budget ? cat.budget : 0);
                  return (
                    <div key={member} className="flex justify-between text-xs text-text-secondary">
                      <span className="truncate w-2/3">{member}</span>
                      <span className="font-bold text-primary">${amt.toLocaleString()}</span>
                    </div>
                  );
                })}
              </div>
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
