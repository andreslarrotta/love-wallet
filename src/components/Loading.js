"use client";

export default function Loading({ fullScreen = false }) {
  const containerClasses = fullScreen 
    ? "min-h-screen bg-background flex flex-col items-center justify-center gap-4"
    : "py-12 flex flex-col items-center justify-center gap-4";

  return (
    <div className={containerClasses}>
      <div className="relative w-24 h-24 flex items-center justify-center">
        {/* Heart Wallet */}
        <div className="text-5xl animate-bounce z-10">❤️</div>
        
        {/* Floating Bills */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="bill-animation bill-1 text-2xl">💵</div>
          <div className="bill-animation bill-2 text-2xl">💸</div>
          <div className="bill-animation bill-3 text-2xl">💰</div>
        </div>
      </div>
      
      <p className="text-sm font-bold text-primary animate-pulse uppercase tracking-widest">
        Contando amor...
      </p>

      <style jsx>{`
        .bill-animation {
          position: absolute;
          bottom: 40px;
          left: 50%;
          transform: translateX(-50%);
          opacity: 0;
          animation: float-up 2s infinite linear;
        }

        .bill-1 { animation-delay: 0s; }
        .bill-2 { animation-delay: 0.7s; }
        .bill-3 { animation-delay: 1.4s; }

        @keyframes float-up {
          0% {
            transform: translate(-50%, 0) scale(0.5);
            opacity: 0;
          }
          20% {
            opacity: 1;
          }
          80% {
            opacity: 1;
          }
          100% {
            transform: translate(calc(-50% + (var(--dir, 20px))), -60px) scale(1.2) rotate(15deg);
            opacity: 0;
          }
        }

        .bill-1 { --dir: -40px; }
        .bill-2 { --dir: 40px; }
        .bill-3 { --dir: 0px; }
      `}</style>
    </div>
  );
}
