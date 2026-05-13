"use client";

import { useAuth } from "@/context/AuthContext";
import { useWallet } from "@/context/WalletContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import ExpenseForm from "@/components/ExpenseForm";
import ExpenseList from "@/components/ExpenseList";
import BudgetSummary from "@/components/BudgetSummary";
import Modal from "@/components/Modal";
import Loading from "@/components/Loading";
import Link from "next/link";
import { messaging } from "@/lib/firebase";

export default function Home() {
  const { user, loading: authLoading, logout } = useAuth();
  const { wallets, activeWallet, switchWallet, loading: walletLoading } = useWallet();
  const router = useRouter();

  const [refreshKey, setRefreshKey] = useState(0);
  const [showValues, setShowValues] = useState(true);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      const registerSW = async () => {
        try {
          const registration = await navigator.serviceWorker.register('/sw.js');
          console.log('Service Worker registered');

          // Get FCM Token
          if (user?.email && messaging) {
            const { getToken } = await import("firebase/messaging");
            const currentToken = await getToken(messaging, {
              serviceWorkerRegistration: registration,
              vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY // Make sure this is in your .env
            });

            if (currentToken) {
              const { saveFcmToken } = await import("@/services/db");
              await saveFcmToken(user.email, currentToken);
              console.log("FCM Token saved");
            }
          }
        } catch (err) {
          console.error('SW registration or FCM token failed', err);
        }
      };

      registerSW();
    }
    
    // Request Notification permission
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'default') {
        Notification.requestPermission();
      }
    }
  }, [user]);

  const triggerExpenseNotification = () => {
    // This is now handled by the backend broadcast, but we can keep it for local testing if needed
    // or remove it to avoid duplicate notifications for the sender.
  };
  
  // Default to current month YYYY-MM
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
  });

  const loading = authLoading || walletLoading;

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return <Loading fullScreen />;
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

      <section className="mb-section-gap">
        <div className="flex justify-between items-center mb-4">
          <h2 className="section-title">Presupuesto</h2>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setShowValues(!showValues)}
              className="w-8 h-8 flex items-center justify-center bg-[#F2F2F2] rounded-pill text-sm hover:bg-[#E8E8E8] transition-colors"
              title={showValues ? "Ocultar valores" : "Mostrar valores"}
            >
              {showValues ? "👁️" : "🙈"}
            </button>
            <input 
              type="month" 
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="text-xs bg-[#F2F2F2] rounded-pill px-2 py-1 outline-none text-text-secondary font-bold h-8"
            />
          </div>
        </div>
        <BudgetSummary refreshTrigger={refreshKey} selectedMonth={selectedMonth} showValues={showValues} />
      </section>

      <section>
        <div className="flex justify-between items-center mb-item-gap">
          <h2 className="section-title">Últimos Gastos</h2>
          <Link href="/config" className="text-sm font-semibold text-primary flex items-center gap-1">
            ⚙️ Configurar
          </Link>
        </div>
        <ExpenseList refreshTrigger={refreshKey} selectedMonth={selectedMonth} showValues={showValues} />
      </section>

      {/* Floating Action Button */}
      <button 
        onClick={() => setIsExpenseModalOpen(true)}
        className="fixed bottom-[88px] right-6 h-14 pl-4 pr-6 bg-primary text-text-primary font-bold rounded-pill shadow-fab flex items-center gap-2 z-40 animate-in slide-in-from-right-full duration-500"
      >
        <span className="text-2xl">+</span>
        <span className="text-sm">Nuevo Gasto</span>
      </button>

      {/* Expense Modal */}
      <Modal 
        isOpen={isExpenseModalOpen} 
        onClose={() => setIsExpenseModalOpen(false)}
        title="Agregar Nuevo Gasto"
      >
        <ExpenseForm 
          selectedMonth={selectedMonth} 
          onExpenseAdded={() => { 
            setRefreshKey(k => k + 1); 
            triggerExpenseNotification(); 
            setIsExpenseModalOpen(false);
          }} 
          onClose={() => setIsExpenseModalOpen(false)}
        />
      </Modal>

      {/* Bottom Nav Mockup */}
      <nav className="fixed bottom-0 left-0 right-0 h-[72px] bg-white border-t border-divider flex items-center justify-around px-4 shadow-nav-bar">
        <Link href="/" className="bg-primary/20 px-5 py-2 rounded-pill flex items-center gap-2">
          <span className="text-primary text-xl">🏠</span>
          <span className="text-xs font-bold text-text-primary">Inicio</span>
        </Link>
        <Link href="/config" className="text-icon-muted text-xl flex flex-col items-center">
          ⚙️
        </Link>
      </nav>
    </div>
  );
}
