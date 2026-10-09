import React from 'react';
import { PlayerState } from '../game/types.ts';

interface StatusBarsProps {
  playerState: PlayerState;
}

export const StatusBars: React.FC<StatusBarsProps> = ({ playerState }) => {
  const { health, maxHealth, hunger, oxygen, inWater, gameMode } = playerState;

  if (gameMode === 'creative') {
    return (
      <div className="flex items-center gap-2 px-3 py-1 bg-black/60 backdrop-blur-xs rounded-sm border border-neutral-700/80 text-xs font-pixel text-neutral-300 pointer-events-none select-none">
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        <span>Творческий режим (Creative)</span>
        <span className="text-neutral-500">·</span>
        <span className="text-neutral-400">Полет: Space (двойной)</span>
      </div>
    );
  }

  // Survival Mode Hearts & Drumsticks
  const totalHearts = 10;
  const healthHalfPoints = Math.round(health); // 0 to 20

  const totalDrumsticks = 10;
  const hungerHalfPoints = Math.round(hunger); // 0 to 20

  return (
    <div className="flex flex-col items-center gap-1.5 pointer-events-none select-none">
      {/* Underwater Oxygen Bubbles */}
      {inWater && (
        <div className="flex items-center gap-1 mb-1">
          {Array.from({ length: 10 }).map((_, i) => {
            const hasBubble = (i + 1) * 2 <= oxygen;
            return (
              <span
                key={i}
                className={`w-3 h-3 rounded-full border border-sky-300 text-[10px] flex items-center justify-center transition-all ${
                  hasBubble ? 'bg-sky-400 shadow-xs shadow-sky-400/50' : 'bg-transparent opacity-20'
                }`}
              >
                {hasBubble && <span className="w-1 h-1 bg-white rounded-full -mt-0.5 -ml-0.5" />}
              </span>
            );
          })}
        </div>
      )}

      <div className="flex items-center justify-between w-[340px] px-1">
        {/* Hearts (Health) */}
        <div className="flex items-center gap-0.5">
          {Array.from({ length: totalHearts }).map((_, i) => {
            const heartValue = (i + 1) * 2;
            const isFull = healthHalfPoints >= heartValue;
            const isHalf = !isFull && healthHalfPoints >= heartValue - 1;

            return (
              <div key={i} className="relative w-4 h-4 flex items-center justify-center">
                {/* Background Empty Heart */}
                <span className="text-neutral-900 text-sm drop-shadow-xs font-bold leading-none select-none">❤</span>
                {/* Full or Half Heart Overlay */}
                {isFull && (
                  <span className="absolute text-red-600 text-sm leading-none drop-shadow-xs select-none">❤</span>
                )}
                {isHalf && (
                  <span className="absolute text-red-500 text-sm leading-none select-none overflow-hidden w-2 left-0">❤</span>
                )}
              </div>
            );
          })}
        </div>

        {/* Drumsticks (Hunger) */}
        <div className="flex items-center gap-0.5 flex-row-reverse">
          {Array.from({ length: totalDrumsticks }).map((_, i) => {
            const drumValue = (i + 1) * 2;
            const isFull = hungerHalfPoints >= drumValue;
            const isHalf = !isFull && hungerHalfPoints >= drumValue - 1;

            return (
              <div key={i} className="relative w-4 h-4 flex items-center justify-center">
                {/* Empty bone/icon */}
                <span className="text-neutral-900 text-xs drop-shadow-xs font-bold select-none">🍗</span>
                {/* Full or Half */}
                {isFull && (
                  <span className="absolute text-amber-700 text-xs select-none">🍗</span>
                )}
                {isHalf && (
                  <span className="absolute text-amber-600 text-xs select-none overflow-hidden w-2 right-0">🍗</span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
