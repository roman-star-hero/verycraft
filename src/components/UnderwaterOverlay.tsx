import React from 'react';

interface UnderwaterOverlayProps {
  isUnderwater: boolean;
  oxygen: number; // 0 to 20
}

export const UnderwaterOverlay: React.FC<UnderwaterOverlayProps> = ({ isUnderwater, oxygen }) => {
  if (!isUnderwater) return null;

  const totalBubbles = 10;
  const activeBubbles = Math.ceil(oxygen / 2);

  return (
    <div className="pointer-events-none fixed inset-0 z-25 select-none overflow-hidden">
      {/* 1. Deep Aquatic Water Tint & Refraction Gradient */}
      <div
        className="absolute inset-0 bg-gradient-to-b from-sky-950/60 via-blue-900/50 to-cyan-950/70"
        style={{
          boxShadow: 'inset 0 0 120px rgba(4, 28, 56, 0.85)',
          backdropFilter: 'blur(0.5px)',
        }}
      />

      {/* 2. Water Caustic Ripple Shimmer Simulation */}
      <div
        className="absolute inset-0 opacity-20 mix-blend-overlay animate-pulse"
        style={{
          background: 'radial-gradient(circle at 50% 50%, rgba(255,255,255,0.4) 0%, transparent 60%)',
          animationDuration: '3s',
        }}
      />

      {/* 3. Floating Screen Water Bubbles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[
          { left: '15%', size: 14, delay: '0s', duration: '4s' },
          { left: '28%', size: 22, delay: '1.2s', duration: '5.2s' },
          { left: '42%', size: 10, delay: '0.5s', duration: '3.8s' },
          { left: '60%', size: 18, delay: '2.1s', duration: '4.5s' },
          { left: '74%', size: 12, delay: '1.8s', duration: '3.6s' },
          { left: '88%', size: 24, delay: '0.8s', duration: '4.9s' },
        ].map((bubble, i) => (
          <div
            key={i}
            className="absolute bottom-[-30px] rounded-full border-2 border-cyan-200/60 bg-cyan-300/25 shadow-xs shadow-cyan-300/50 animate-bounce"
            style={{
              left: bubble.left,
              width: `${bubble.size}px`,
              height: `${bubble.size}px`,
              animation: `floatUp ${bubble.duration} infinite ease-in ${bubble.delay}`,
            }}
          >
            <div className="w-1.5 h-1.5 bg-white/80 rounded-full mt-0.5 ml-0.5" />
          </div>
        ))}
      </div>

      {/* 4. Top Prominent Underwater Banner with Swimming Guidance & Oxygen Meter */}
      <div className="absolute top-12 left-0 right-0 flex flex-col items-center gap-1.5 pointer-events-none">
        <div className="flex items-center gap-2 px-4 py-1.5 bg-black/75 border border-cyan-400/80 rounded-sm shadow-2xl backdrop-blur-xs">
          <span className="text-base animate-pulse">🌊</span>
          <span className="font-pixel text-xs text-cyan-200 font-bold tracking-wide">
            ВЫ ПОД ВОДОЙ
          </span>
          <span className="text-neutral-500">·</span>
          <span className="font-mc text-sm text-yellow-300 font-bold">
            Удерживайте [ПРОБЕЛ], чтобы выплыть
          </span>
        </div>

        {/* Oxygen Bubbles Bar */}
        <div className="flex items-center gap-1 bg-black/60 px-2.5 py-1 rounded-sm border border-cyan-700/60">
          <span className="font-mc text-xs text-cyan-300 mr-1">Кислород:</span>
          {Array.from({ length: totalBubbles }).map((_, i) => {
            const hasAir = i < activeBubbles;
            return (
              <div
                key={i}
                className={`w-3.5 h-3.5 rounded-full border transition-all flex items-center justify-center ${
                  hasAir
                    ? 'border-cyan-300 bg-cyan-400/90 shadow-xs shadow-cyan-300'
                    : 'border-neutral-600 bg-transparent opacity-25'
                }`}
              >
                {hasAir && <div className="w-1 h-1 bg-white rounded-full -mt-0.5 -ml-0.5" />}
              </div>
            );
          })}
        </div>
      </div>

      {/* Embedded CSS for floating bubbles animation */}
      <style>{`
        @keyframes floatUp {
          0% {
            transform: translateY(0px) translateX(0px);
            opacity: 0;
          }
          15% {
            opacity: 0.8;
          }
          50% {
            transform: translateY(-50vh) translateX(15px);
          }
          85% {
            opacity: 0.8;
          }
          100% {
            transform: translateY(-105vh) translateX(-10px);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
};
