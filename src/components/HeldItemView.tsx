import React from 'react';
import { ItemStack } from '../game/types.ts';
import { getItemIcon } from '../game/textures.ts';

interface HeldItemViewProps {
  heldItem: ItemStack | null;
  isSwinging: boolean;
}

export const HeldItemView: React.FC<HeldItemViewProps> = ({ heldItem, isSwinging }) => {
  return (
    <div className="pointer-events-none fixed bottom-0 right-12 z-10 select-none">
      <div
        className={`relative transition-transform duration-100 origin-bottom-right ${
          isSwinging ? '-translate-y-4 -translate-x-3 rotate-[-30deg] scale-110' : 'translate-y-0 translate-x-0 rotate-0'
        }`}
      >
        {heldItem ? (
          <div className="w-28 h-28 flex items-end justify-end drop-shadow-2xl">
            <img
              src={getItemIcon(heldItem.id)}
              alt="held item"
              className="w-24 h-24 pixelated object-contain transform rotate-[-15deg] scale-125"
              draggable={false}
            />
          </div>
        ) : (
          /* Empty Player Arm / Fist */
          <div className="w-24 h-36 bg-[#c58e63] border-l-4 border-t-4 border-[#94623e] shadow-2xl rounded-tl-sm transform rotate-[-12deg] translate-y-6 translate-x-4">
            <div className="w-full h-12 bg-[#00a8a8] border-b-2 border-[#006e6e]" />
          </div>
        )}
      </div>
    </div>
  );
};
