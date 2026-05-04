"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { addCategory, getCategories, deleteCategory, addPerson, getPeople, deletePerson } from "@/services/db";
import Link from "next/link";

export default function ConfigPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [categories, setCategories] = useState([]);
  const [people, setPeople] = useState([]);
  
  const [newCatName, setNewCatName] = useState("");
  const [newCatBudget, setNewCatBudget] = useState("");
  const [newPersonName, setNewPersonName] = useState("");

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    } else if (user) {
      loadData();
    }
  }, [user, loading, router]);

  const loadData = async () => {
    const cats = await getCategories(user.uid);
    const peps = await getPeople(user.uid);
    setCategories(cats);
    setPeople(peps);
  };

  const handleAddCategory = async (e) => {
    e.preventDefault();
    if (!newCatName || !newCatBudget) return;
    await addCategory(user.uid, { name: newCatName, budget: Number(newCatBudget) });
    setNewCatName("");
    setNewCatBudget("");
    loadData();
  };

  const handleAddPerson = async (e) => {
    e.preventDefault();
    if (!newPersonName) return;
    await addPerson(user.uid, newPersonName);
    setNewPersonName("");
    loadData();
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
    <div className="min-h-screen bg-background p-screen-h pb-24">
      <header className="mb-section-gap flex items-center gap-4">
        <Link href="/" className="w-10 h-10 rounded-full bg-surface shadow-card flex items-center justify-center text-xl">
          ←
        </Link>
        <h1 className="hero-heading">Configuración</h1>
      </header>

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
          <button type="submit" className="w-12 h-12 bg-primary text-text-primary font-bold rounded-search-bar flex items-center justify-center shadow-sm">
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
          <button type="submit" className="w-12 h-12 bg-primary text-text-primary font-bold rounded-search-bar flex items-center justify-center shadow-sm">
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
