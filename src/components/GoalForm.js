"use client";

import { useState, useEffect } from "react";
import { addGoal, getGoals, updateGoal, deleteGoal, addContribution } from "@/services/db";
import { useAuth } from "@/context/AuthContext";
import { useWallet } from "@/context/WalletContext";

export default function GoalForm({ onGoalUpdated, onClose }) {
  const { user } = useAuth();
  const { activeWallet } = useWallet();
  const [view, setView] = useState("contribute"); // "contribute", "manage", "edit"
  
  const [goals, setGoals] = useState([]);
  const [selectedGoalId, setSelectedGoalId] = useState("");
  const [contributionAmount, setContributionAmount] = useState("");
  const [paidBy, setPaidBy] = useState(user?.email || "");
  
  // New Goal / Edit Goal fields
  const [editingGoal, setEditingGoal] = useState(null);
  const [goalName, setGoalName] = useState("");
  const [targetAmount, setTargetAmount] = useState("");
  const [deadline, setDeadline] = useState("");
  
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (activeWallet) {
      loadGoals();
    }
  }, [activeWallet]);

  async function loadGoals() {
    const data = await getGoals(activeWallet.id);
    setGoals(data);
    if (data.length > 0 && !selectedGoalId) {
      setSelectedGoalId(data[0].id);
    }
  }

  const handleContribute = async (e) => {
    e.preventDefault();
    if (!selectedGoalId || !contributionAmount || !paidBy) return;

    setIsSubmitting(true);
    try {
      await addContribution(activeWallet.id, {
        goalId: selectedGoalId,
        amount: Number(contributionAmount),
        userEmail: paidBy,
        createdAt: new Date()
      });
      
      setContributionAmount("");
      if (onGoalUpdated) onGoalUpdated();
      if (onClose) onClose();
    } catch (error) {
      console.error("Error adding contribution:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveGoal = async (e) => {
    e.preventDefault();
    if (!goalName || !targetAmount) return;

    setIsSubmitting(true);
    try {
      const goalData = {
        name: goalName,
        targetAmount: Number(targetAmount),
        deadline: deadline || null,
        updatedAt: new Date()
      };

      if (editingGoal) {
        await updateGoal(editingGoal.id, goalData);
      } else {
        await addGoal(activeWallet.id, goalData);
      }

      setGoalName("");
      setTargetAmount("");
      setDeadline("");
      setEditingGoal(null);
      await loadGoals();
      setView("manage");
      if (onGoalUpdated) onGoalUpdated();
    } catch (error) {
      console.error("Error saving goal:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteGoal = async (id) => {
    if (confirm("¿Estás seguro de eliminar este objetivo? Los aportes no se borrarán pero quedarán huérfanos.")) {
      await deleteGoal(id);
      loadGoals();
      if (onGoalUpdated) onGoalUpdated();
    }
  };

  return (
    <div className="space-y-6">
      {/* View Selector */}
      <div className="flex bg-[#F2F2F2] p-1 rounded-pill">
        <button 
          onClick={() => setView("contribute")}
          className={`flex-1 py-2 text-xs font-bold rounded-pill transition-all ${view === "contribute" ? "bg-white text-primary shadow-sm" : "text-text-secondary"}`}
        >
          Aportar
        </button>
        <button 
          onClick={() => setView("manage")}
          className={`flex-1 py-2 text-xs font-bold rounded-pill transition-all ${view === "manage" || view === "edit" ? "bg-white text-primary shadow-sm" : "text-text-secondary"}`}
        >
          Gestionar
        </button>
      </div>

      {view === "contribute" && (
        <form onSubmit={handleContribute} className="space-y-4">
          {goals.length === 0 ? (
            <div className="text-center py-4">
              <p className="text-sm text-text-secondary mb-3">No tienes objetivos creados.</p>
              <button 
                type="button"
                onClick={() => setView("edit")}
                className="text-primary font-bold text-sm"
              >
                + Crear primer objetivo
              </button>
            </div>
          ) : (
            <>
              <div>
                <label className="block text-xs font-semibold text-text-secondary uppercase mb-1">Seleccionar Objetivo</label>
                <select 
                  value={selectedGoalId}
                  onChange={(e) => setSelectedGoalId(e.target.value)}
                  className="w-full h-12 bg-[#F2F2F2] rounded-xl px-4 text-sm"
                  required
                >
                  {goals.map(g => (
                    <option key={g.id} value={g.id}>{g.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-secondary uppercase mb-1">Monto a Ahorrar</label>
                <input 
                  type="number"
                  value={contributionAmount}
                  onChange={(e) => setContributionAmount(e.target.value)}
                  className="w-full h-12 bg-[#F2F2F2] rounded-xl px-4 text-sm font-bold"
                  placeholder="$ 0"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-secondary uppercase mb-1">¿Quién ahorra?</label>
                <select 
                  value={paidBy}
                  onChange={(e) => setPaidBy(e.target.value)}
                  className="w-full h-12 bg-[#F2F2F2] rounded-xl px-4 text-sm"
                  required
                >
                  {activeWallet?.members.map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>

              <button 
                type="submit"
                disabled={isSubmitting}
                className="w-full h-12 bg-primary text-text-primary font-bold rounded-pill shadow-fab disabled:opacity-50 mt-2"
              >
                {isSubmitting ? "Guardando..." : "Registrar Aporte"}
              </button>
            </>
          )}
        </form>
      )}

      {(view === "manage" || view === "edit") && (
        <div className="space-y-6">
          {view === "edit" ? (
            <form onSubmit={handleSaveGoal} className="space-y-4 bg-background/50 p-4 rounded-xl border border-divider">
              <h4 className="font-bold text-sm text-text-primary">{editingGoal ? "Editar Objetivo" : "Nuevo Objetivo"}</h4>
              
              <div>
                <label className="block text-[10px] font-bold text-text-secondary uppercase mb-1">Nombre del Objetivo</label>
                <input 
                  type="text"
                  value={goalName}
                  onChange={(e) => setGoalName(e.target.value)}
                  className="w-full h-10 bg-white border border-divider rounded-lg px-3 text-sm"
                  placeholder="Ej: Viaje a la playa"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-text-secondary uppercase mb-1">Meta de Ahorro</label>
                <input 
                  type="number"
                  value={targetAmount}
                  onChange={(e) => setTargetAmount(e.target.value)}
                  className="w-full h-10 bg-white border border-divider rounded-lg px-3 text-sm font-bold"
                  placeholder="$"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-text-secondary uppercase mb-1">Fecha Límite (Opcional)</label>
                <input 
                  type="date"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  className="w-full h-10 bg-white border border-divider rounded-lg px-3 text-sm"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button 
                  type="button"
                  onClick={() => { setView("manage"); setEditingGoal(null); }}
                  className="flex-1 h-10 bg-[#F2F2F2] text-text-secondary font-bold text-xs rounded-lg"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-[2] h-10 bg-primary text-text-primary font-bold text-xs rounded-lg shadow-sm"
                >
                  {editingGoal ? "Actualizar" : "Crear"}
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <h4 className="font-bold text-sm text-text-primary">Mis Objetivos</h4>
                <button 
                  onClick={() => {
                    setView("edit");
                    setEditingGoal(null);
                    setGoalName("");
                    setTargetAmount("");
                    setDeadline("");
                  }}
                  className="text-xs font-bold text-primary"
                >
                  + Nuevo
                </button>
              </div>

              {goals.length === 0 ? (
                <p className="text-center py-4 text-xs text-text-tertiary">No tienes objetivos configurados.</p>
              ) : (
                <div className="space-y-2">
                  {goals.map(g => (
                    <div key={g.id} className="flex justify-between items-center p-3 bg-white border border-divider rounded-xl">
                      <div>
                        <p className="text-sm font-bold text-text-primary">{g.name}</p>
                        <p className="text-[10px] text-text-secondary">${Number(g.targetAmount).toLocaleString()}</p>
                      </div>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => {
                            setEditingGoal(g);
                            setGoalName(g.name);
                            setTargetAmount(g.targetAmount);
                            setDeadline(g.deadline || "");
                            setView("edit");
                          }}
                          className="w-8 h-8 flex items-center justify-center bg-background rounded-full"
                        >
                          ✏️
                        </button>
                        <button 
                          onClick={() => handleDeleteGoal(g.id)}
                          className="w-8 h-8 flex items-center justify-center bg-background rounded-full"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
