import React from 'react';

export default function DuolingoFlamePreview() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-transparent">
      <div className="flex flex-col items-center gap-6">
        {/* Flamme animée - Lucide Flame Icon */}
        <svg width="160" height="160" viewBox="0 0 24 24" fill="none" className="drop-shadow-2xl">
          <defs>
            {/* Dégradé orange → jaune */}
            <linearGradient id="flameGradient" x1="50%" y1="0%" x2="50%" y2="100%">
              <stop offset="0%" stopColor="#FFD60A" />
              <stop offset="40%" stopColor="#FF9500" />
              <stop offset="100%" stopColor="#FF6B00" />
            </linearGradient>

            {/* Filtre de lueur */}
            <filter id="glow">
              <feGaussianBlur stdDeviation="1.5" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Flamme complète avec pulse subtil */}
          <path
            d="M12 3q1 4 4 6.5t3 5.5a1 1 0 0 1-14 0 5 5 0 0 1 1-3 1 1 0 0 0 5 0c0-2-1.5-3-1.5-5q0-2 2.5-4"
            fill="url(#flameGradient)"
            stroke="none"
            filter="url(#glow)"
            className="animate-flame-pulse"
          />
        </svg>

        {/* Texte du streak */}
        <div className="text-center">
          <div className="text-6xl font-extrabold text-white mb-2 drop-shadow-[0_2px_20px_rgba(255,149,0,0.5)]">365</div>
          <div className="text-lg font-semibold text-slate-400">jour streak!</div>
        </div>

        {/* Badge de statut */}
        <div className="px-6 py-3 bg-gradient-to-r from-orange-500/20 to-yellow-500/20 rounded-full border border-orange-400/30">
          <span className="text-orange-300 font-medium flex items-center gap-2">
            <span className="w-2 h-2 bg-orange-400 rounded-full animate-pulse"></span>
            Série en cours
          </span>
        </div>
      </div>

      <style>{`
        /* Effet battement de cœur subtil - tum tum, pause, tum tum */
        @keyframes flame-heartbeat {
          0% {
            transform: scale(1);
          }
          8% {
            transform: scale(1.02);
          }
          16% {
            transform: scale(1);
          }
          24% {
            transform: scale(1.02);
          }
          32%, 100% {
            transform: scale(1);
          }
        }

        .animate-flame-pulse {
          animation: flame-heartbeat 3s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
