"use client";

import { useState, useEffect } from "react";
import { getGoals, getContributions, deleteContribution } from "@/services/db";
import { useWallet } from "@/context/WalletContext";
import Loading from "@/components/Loading";

export default function GoalSummary({ refreshTrigger, selectedMonth, showValues = true }) {
  const { activeWallet } = useWallet();
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);

  async function fetchData() {
    setLoading(true);
    try {
      const [goalsData, contributionsData] = await Promise.all([
        getGoals(activeWallet.id),
        getContributions(activeWallet.id)
      ]);

      const processedGoals = goalsData.map(goal => {
        // Filter contributions for this specific goal
        const goalContributions = contributionsData.filter(c => c.goalId === goal.id);
        
        // Total saved
        const totalSaved = goalContributions.reduce((sum, c) => sum + Number(c.amount), 0);
        
        // Contributions by month (for the selected month)
        const monthlyContributions = goalContributions.filter(c => {
          const date = c.createdAt?.toDate ? c.createdAt.toDate() : new Date(c.createdAt);
          const month = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          return month === selectedMonth;
        });

        const monthlyTotal = monthlyContributions.reduce((sum, c) => sum + Number(c.amount), 0);
        
        const percentage = goal.targetAmount > 0 
          ? Math.min((totalSaved / goal.targetAmount) * 100, 100) 
          : 0;
        
        return {
          ...goal,
          totalSaved,
          percentage,
          monthlyTotal,
          monthlyContributions // Include individual contributions for deletion
        };
      });

      setGoals(processedGoals);
    } catch (error) {
      console.error("Error fetching goals:", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (activeWallet) {
      fetchData();
    }
  }, [activeWallet, refreshTrigger, selectedMonth]);

  const formatCurrency = (value) => {
    if (!showValues) return "******";
    return `$${Number(value).toLocaleString()}`;
  };

  const handleDelete = async (id) => {
    if (confirm("¿Estás seguro de borrar este aporte?")) {
      try {
        await deleteContribution(id);
        fetchData();
      } catch (error) {
        console.error("Error deleting contribution:", error);
      }
    }
  };

  if (loading) return <Loading />;

  if (goals.length === 0) {
    return (
      <div className="bg-surface p-6 rounded-card border border-divider text-center">
        <p className="text-text-secondary text-sm mb-2">No tienes objetivos de ahorro configurados.</p>
        <p className="text-xs text-text-tertiary">¡Empieza a ahorrar para tus sueños!</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {goals.map(goal => (
        <div key={goal.id} className="bg-white p-card-p rounded-card shadow-card border border-divider relative overflow-hidden">
          {/* Background Decorative Gradient */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 blur-3xl"></div>
          
          <div className="flex justify-between items-start gap-4 relative z-10">
            <div className="flex-1">
              <h3 className="card-title text-lg mb-1">{goal.name}</h3>
              <div className="flex items-center gap-2 mb-4">
                <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-pill">
                  META: {formatCurrency(goal.targetAmount)}
                </span>
                {goal.deadline && (
                  <span className="text-[10px] text-text-secondary flex items-center gap-1">
                    📅 {new Date(goal.deadline).toLocaleDateString()}
                  </span>
                )}
              </div>

              <div className="space-y-3">
                <div>
                  <p className="text-xs text-text-secondary font-medium mb-1">Total Ahorrado</p>
                  <p className="text-xl font-extrabold text-text-primary">{formatCurrency(goal.totalSaved)}</p>
                </div>

                {/* Monthly Contribution Details */}
                <div className="bg-background/50 p-2 rounded-lg border border-divider">
                  <p className="text-[10px] font-bold text-text-secondary uppercase tracking-wider mb-2">Aportes de este mes</p>
                  {goal.monthlyContributions.length > 0 ? (
                    <div className="space-y-1">
                      {goal.monthlyContributions.map((c) => (
                        <div key={c.id} className="flex justify-between items-center text-[11px]">
                          <span className="text-text-secondary">{c.userEmail?.split('@')[0] || "Anónimo"}</span>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-primary">{formatCurrency(c.amount)}</span>
                            <button 
                              onClick={() => handleDelete(c.id)}
                              className="w-4 h-4 flex items-center justify-center rounded-full bg-red-50 text-red-400 hover:bg-red-100 transition-colors"
                              title="Borrar aporte"
                            >
                              ×
                            </button>
                          </div>
                        </div>
                      ))}
                      <div className="pt-1 mt-1 border-t border-divider flex justify-between items-center text-[11px] font-bold">
                        <span>Total Mes</span>
                        <span>{formatCurrency(goal.monthlyTotal)}</span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-[10px] text-text-tertiary italic">Sin aportes este mes</p>
                  )}
                </div>
              </div>
            </div>

            {/* Circular Progress */}
            <div className="flex flex-col items-center justify-center pt-2">
              <div className="relative w-24 h-24">
                <svg className="w-full h-full transform -rotate-90">
                  <circle
                    cx="48"
                    cy="48"
                    r="40"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="transparent"
                    className="text-divider"
                  />
                  <circle
                    cx="48"
                    cy="48"
                    r="40"
                    stroke="currentColor"
                    strokeWidth="8"
                    strokeDasharray={2 * Math.PI * 40}
                    strokeDashoffset={2 * Math.PI * 40 * (1 - goal.percentage / 100)}
                    strokeLinecap="round"
                    fill="transparent"
                    className="text-primary transition-all duration-1000 ease-out"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-sm font-extrabold text-text-primary">{Math.round(goal.percentage)}%</span>
                  <span className="text-[8px] text-text-tertiary uppercase font-bold">Avance</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
