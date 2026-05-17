"use client";

import { useAuth } from "@/context/AuthContext";
import { useWallet } from "@/context/WalletContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import ExpenseForm from "@/components/ExpenseForm";
import ExpenseList from "@/components/ExpenseList";
import BudgetSummary from "@/components/BudgetSummary";
import GoalSummary from "@/components/GoalSummary";
import GoalForm from "@/components/GoalForm";
import Modal from "@/components/Modal";
import Loading from "@/components/Loading";
import Link from "next/link";
import { messaging } from "@/lib/firebase";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { useRef } from "react";

gsap.registerPlugin(useGSAP);

export default function Home() {
  const { user, loading: authLoading, logout } = useAuth();
  const { wallets, activeWallet, switchWallet, loading: walletLoading } = useWallet();
  const router = useRouter();

  const [refreshKey, setRefreshKey] = useState(0);
  const [showValues, setShowValues] = useState(true);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const container = useRef();

  useGSAP(() => {
    gsap.from(".gsap-header", { y: -50, opacity: 0, duration: 0.5, ease: "back.out(1.7)", clearProps: "all" });
    gsap.from(".gsap-section", { 
      y: 30, 
      opacity: 0, 
      duration: 0.5, 
      stagger: 0.15, 
      ease: "power2.out",
      delay: 0.2,
      clearProps: "all"
    });
    gsap.from(".gsap-fab", { scale: 0, opacity: 0, duration: 0.5, ease: "back.out(2)", delay: 0.8, clearProps: "all" });
    gsap.from(".gsap-nav", { y: 100, opacity: 0, duration: 0.5, ease: "power2.out", delay: 0.5, clearProps: "all" });
  }, { scope: container });

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
    <div className="min-h-screen bg-background p-screen-h pb-24" ref={container}>
      <header className="mb-section-gap flex justify-between items-center gsap-header">
        <div>
          <p className="text-sm text-text-secondary">Bienvenido,</p>
          <h1 className="hero-heading">
            Tus <span className="hero-highlight">Gastos</span>
          </h1>
        </div>
        <button
          onClick={() => logout()}
          className="w-10 h-10 rounded-full neo-border overflow-hidden neo-shadow-sm flex items-center justify-center bg-white text-xl neo-button"
        >
          <svg viewBox="0 0 24 24" width="24px" height="24px"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 4c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z" fill="#010002" /></svg>
        </button>
      </header>

      {/* Wallet Toggle */}
      {wallets.length > 1 && (
        <div className="flex bg-white neo-border neo-shadow-sm p-1 rounded-pill mb-section-gap gsap-section">
          {wallets.map(wallet => (
            <button
              key={wallet.id}
              onClick={() => switchWallet(wallet.id)}
              className={`flex-1 py-2 text-sm font-bold rounded-pill transition-all ${activeWallet?.id === wallet.id
                ? "bg-primary text-black border-2 border-black shadow-[2px_2px_0px_#000]"
                : "text-text-secondary"
                }`}
            >
              {wallet.name}
            </button>
          ))}
        </div>
      )}



      {/* Goals Section */}
      <section className="mb-section-gap gsap-section">
        <div className="flex justify-between items-center mb-4">
          <h2 className="section-title">Objetivos de Ahorro</h2>
          <button
            onClick={() => setIsGoalModalOpen(true)}
            className="text-xs font-bold text-black flex items-center gap-1 bg-secondary px-3 py-1.5 rounded-pill neo-border neo-shadow-sm neo-button"
          >
            🎯 Configurar / Aportar
          </button>
        </div>
        <GoalSummary
          refreshTrigger={refreshKey}
          selectedMonth={selectedMonth}
          showValues={showValues}
        />
      </section>

      <section className="mb-section-gap gsap-section">
        <div className="flex justify-between items-center mb-4">
          <h2 className="section-title">Presupuesto</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowValues(!showValues)}
              className="w-8 h-8 flex items-center justify-center bg-white neo-border neo-shadow-sm rounded-pill text-sm neo-button"
              title={showValues ? "Ocultar valores" : "Mostrar valores"}
            >
              {showValues ? "👁️" : "🙈"}
            </button>
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="text-xs bg-white neo-border neo-shadow-sm rounded-pill px-2 py-1 outline-none text-black font-bold h-8"
            />
          </div>
        </div>
        <BudgetSummary refreshTrigger={refreshKey} selectedMonth={selectedMonth} showValues={showValues} />
      </section>

      <section className="gsap-section">
        <div className="flex justify-between items-center mb-item-gap">
          <h2 className="section-title">Últimos Gastos</h2>
          <Link href="/config" className="text-sm font-bold text-black flex items-center gap-1 bg-accent px-3 py-1.5 rounded-pill neo-border neo-shadow-sm neo-button">
            ⚙️ Configurar
          </Link>
        </div>
        <ExpenseList
          refreshTrigger={refreshKey}
          selectedMonth={selectedMonth}
          showValues={showValues}
          onExpenseChanged={() => setRefreshKey(k => k + 1)}
        />
      </section>

      {/* Floating Action Button */}
      <button
        onClick={() => setIsExpenseModalOpen(true)}
        className="fixed bottom-[88px] right-6 h-14 pl-4 pr-6 bg-primary text-text-primary font-bold rounded-pill neo-border neo-shadow flex items-center gap-2 z-40 neo-button gsap-fab"
      >
        <span className="text-2xl">+</span>
        <span className="text-sm uppercase">Nuevo Gasto</span>
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

      {/* Goal Modal */}
      <Modal
        isOpen={isGoalModalOpen}
        onClose={() => setIsGoalModalOpen(false)}
        title="Mis Objetivos de Ahorro"
      >
        <GoalForm
          onGoalUpdated={() => setRefreshKey(k => k + 1)}
          onClose={() => setIsGoalModalOpen(false)}
        />
      </Modal>

      {/* Bottom Nav Mockup */}
      <nav className="fixed bottom-0 left-0 right-0 h-[72px] bg-white border-t-[3px] border-black flex items-center justify-around px-4 z-40 gsap-nav">
        <Link href="/" className="bg-primary px-5 py-2 rounded-pill flex items-center gap-2 neo-border neo-shadow-sm">
          <span className="text-xl">
            <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="#010002" width="24" height="24">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" stroke="#010002" strokeWidth="2"></path>
              <polyline points="9 22 9 12 15 12 15 22" stroke="#010002" strokeWidth="2"></polyline>
            </svg>
          </span>
          <span className="text-xs font-bold text-text-primary uppercase tracking-wider">Inicio</span>
        </Link>
        <Link href="/config" className="text-icon-muted text-xl flex flex-col items-center">
          ⚙️
        </Link>
      </nav>
    </div>
  );
}
