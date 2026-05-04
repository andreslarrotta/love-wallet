"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import ExpenseForm from "@/components/ExpenseForm";
import ExpenseList from "@/components/ExpenseList";

export default function Home() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();

  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return <div className="min-h-screen bg-background flex items-center justify-center">Cargando...</div>;
  }

  return (
    <div className="min-h-screen bg-background p-screen-h pb-24">
      <header className="mb-section-gap flex justify-between items-center">
        <div>
          <p className="text-sm text-text-secondary">Bienvenido,</p>
          <h1 className="hero-heading">
            Tus <span className="hero-highlight">Gastos</span>
          </h1>
        </div>
        <button 
          onClick={() => logout()}
          className="w-10 h-10 rounded-full border-2 border-primary overflow-hidden shadow-card flex items-center justify-center bg-white text-xl"
        >
          🚪
        </button>
      </header>

      <section className="mb-section-gap">
        <ExpenseForm onExpenseAdded={() => setRefreshKey(k => k + 1)} />
      </section>

      <section>
        <div className="flex justify-between items-center mb-item-gap">
          <h2 className="section-title">Últimos Gastos</h2>
          <a href="/config" className="text-sm font-semibold text-primary flex items-center gap-1">
            ⚙️ Configurar
          </a>
        </div>
        <ExpenseList refreshTrigger={refreshKey} />
      </section>

      {/* Bottom Nav Mockup */}
      <nav className="fixed bottom-0 left-0 right-0 h-[72px] bg-white border-t border-divider flex items-center justify-around px-4 shadow-nav-bar">
        <a href="/" className="bg-primary/20 px-5 py-2 rounded-pill flex items-center gap-2">
          <span className="text-primary text-xl">🏠</span>
          <span className="text-xs font-bold text-text-primary">Inicio</span>
        </a>
        <a href="/config" className="text-icon-muted text-xl flex flex-col items-center">
          ⚙️
        </a>
      </nav>
    </div>
  );
}
