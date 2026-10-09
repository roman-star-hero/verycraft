import React from 'react';

export const Crosshair: React.FC = () => {
  return (
    <div className="pointer-events-none fixed inset-0 flex items-center justify-center z-20">
      <div className="relative w-5 h-5 flex items-center justify-center">
        {/* Horizontal bar */}
        <div className="absolute w-4 h-0.5 bg-white mix-blend-difference shadow-xs opacity-90" />
        {/* Vertical bar */}
        <div className="absolute h-4 w-0.5 bg-white mix-blend-difference shadow-xs opacity-90" />
      </div>
    </div>
  );
};
