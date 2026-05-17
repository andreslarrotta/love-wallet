"use client";

import { useState, useEffect, useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { getGoals, getContributions, deleteContribution } from "@/services/db";
import { useWallet } from "@/context/WalletContext";
import Loading from "@/components/Loading";

// Swiper imports
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/pagination';

export default function GoalSummary({ refreshTrigger, selectedMonth, showValues = true }) {
  const { activeWallet } = useWallet();
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const container = useRef();

  useGSAP(() => {
    if (!loading && goals.length > 0) {
      gsap.from(".gsap-goal-card", {
        scale: 0.8,
        opacity: 0,
        duration: 0.5,
        stagger: 0.1,
        ease: "back.out(1.5)"
      });
    }
  }, { scope: container, dependencies: [loading, goals] });

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
      <div className="bg-surface p-6 rounded-card neo-border neo-shadow-sm text-center">
        <p className="text-text-secondary text-sm mb-2 font-bold">No tienes objetivos de ahorro configurados.</p>
        <p className="text-xs text-text-tertiary">¡Empieza a ahorrar para tus sueños!</p>
      </div>
    );
  }

  return (
    <div className="relative goal-swiper-container" ref={container}>
      <Swiper
        modules={[Pagination]}
        spaceBetween={16}
        slidesPerView={"auto"}
        centeredSlides={true}
        pagination={{ clickable: true }}
        className="pb-10"
      >
        {goals.map(goal => (
          <SwiperSlide key={goal.id} className="!w-[85%] md:!w-[400px]">
            <div className="bg-white p-card-p rounded-card neo-border neo-shadow relative overflow-hidden h-full gsap-goal-card">
              {/* Background Decorative Gradient */}
              <div className="absolute top-[-20px] right-[-20px] w-24 h-24 bg-accent rounded-bl-full border-b-[3px] border-l-[3px] border-black"></div>

              <div className="flex justify-between items-start gap-4 relative z-10">
                <div className="flex-1">
                  <h3 className="card-title text-lg mb-1">{goal.name}</h3>
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-[10px] font-bold text-black bg-primary px-2 py-0.5 rounded-pill border-2 border-black shadow-[2px_2px_0px_#000]">
                      META: {formatCurrency(goal.targetAmount)}
                    </span>
                    {goal.deadline && (
                      <span className="text-[10px] font-bold text-black flex items-center gap-1 bg-white px-2 py-0.5 rounded-pill border-2 border-black shadow-[2px_2px_0px_#000]">
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
                    <div className="bg-secondary p-2 rounded-lg neo-border neo-shadow-sm">
                      <p className="text-[10px] font-bold text-black uppercase tracking-wider mb-2 border-b-2 border-black pb-1">Aportes de este mes</p>
                      {goal.monthlyContributions.length > 0 ? (
                        <div className="space-y-1">
                          {goal.monthlyContributions.map((c) => (
                            <div key={c.id} className="flex justify-between items-center text-[11px] font-bold text-black">
                              <span>{c.userEmail?.split('@')[0] || "Anónimo"}</span>
                              <div className="flex items-center gap-2">
                                <span>{formatCurrency(c.amount)}</span>
                                <button
                                  onClick={() => handleDelete(c.id)}
                                  className="w-5 h-5 flex items-center justify-center rounded-full bg-white border-2 border-black text-black shadow-[2px_2px_0px_#000] neo-button transition-colors"
                                  title="Borrar aporte"
                                >
                                  ×
                                </button>
                              </div>
                            </div>
                          ))}
                          <div className="pt-1 mt-1 border-t-2 border-black flex justify-between items-center text-[11px] font-extrabold text-black">
                            <span>Total Mes</span>
                            <span>{formatCurrency(goal.monthlyTotal)}</span>
                          </div>
                        </div>
                      ) : (
                        <p className="text-[10px] text-text-tertiary italic font-bold">Sin aportes este mes</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Circular Progress */}
                <div className="flex flex-col items-center justify-center pt-2">
                  <div className="relative w-24 h-24 bg-white rounded-full border-[3px] border-black shadow-[4px_4px_0px_#000]">
                    <svg className="w-full h-full transform -rotate-90">
                      <circle
                        cx="48"
                        cy="48"
                        r="38"
                        stroke="#000"
                        strokeWidth="10"
                        fill="transparent"
                      />
                      <circle
                        cx="48"
                        cy="48"
                        r="38"
                        stroke="currentColor"
                        strokeWidth="10"
                        strokeDasharray={2 * Math.PI * 38}
                        strokeDashoffset={2 * Math.PI * 38 * (1 - goal.percentage / 100)}
                        strokeLinecap="butt"
                        fill="transparent"
                        className="text-primary transition-all duration-1000 ease-out"
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-sm font-extrabold text-black">{Math.round(goal.percentage)}%</span>
                      <span className="text-[8px] text-black uppercase font-bold">Avance</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>

      <style jsx global>{`
        .goal-swiper-container {
          overflow-x: hidden;
          margin: 0 -20px; /* Offset the parent padding to allow slides to reach edges if needed */
          padding: 0 20px;
        }
        .goal-swiper-container .swiper-pagination-bullet {
          background: var(--color-divider);
          opacity: 1;
        }
        .goal-swiper-container .swiper-pagination-bullet-active {
          background: var(--color-primary) !important;
        }
        .goal-swiper-container .swiper {
          padding-bottom: 40px !important;
        }
      `}</style>
    </div>
  );
}
