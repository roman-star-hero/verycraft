import React, { useEffect, useState } from 'react';
import { InventorySlots } from '../game/types.ts';
import { getItemIcon } from '../game/textures.ts';
import { getItemOrBlockName } from '../game/blocks.ts';

interface HotbarProps {
  hotbar: InventorySlots;
  selectedSlot: number;
  onSelectSlot: (slot: number) => void;
}

export const Hotbar: React.FC<HotbarProps> = ({ hotbar, selectedSlot, onSelectSlot }) => {
  const [activeItemName, setActiveItemName] = useState<string>('');
  const [nameVisible, setNameVisible] = useState(false);

  useEffect(() => {
    const item = hotbar[selectedSlot];
    if (item) {
      setActiveItemName(getItemOrBlockName(item.id, 'ru'));
      setNameVisible(true);
      const timer = setTimeout(() => setNameVisible(false), 2000);
      return () => clearTimeout(timer);
    } else {
      setNameVisible(false);
    }
  }, [selectedSlot, hotbar]);

  return (
    <div className="flex flex-col items-center gap-2 select-none">
      {/* Active Item Title Toast */}
      <div
        className={`text-sm font-mc tracking-wide text-white bg-black/75 px-3 py-1 rounded-sm shadow-md transition-opacity duration-300 ${
          nameVisible && activeItemName ? 'opacity-100' : 'opacity-0'
        }`}
      >
        {activeItemName}
      </div>

      {/* 9 Hotbar Slots */}
      <div className="flex items-center p-1.5 bg-[#4a4a4a] border-3 border-[#222222] rounded-xs shadow-2xl">
        {Array.from({ length: 9 }).map((_, i) => {
          const item = hotbar[i];
          const isSelected = selectedSlot === i;

          return (
            <div
              key={i}
              onClick={() => onSelectSlot(i)}
              className={`relative w-12 h-12 flex items-center justify-center cursor-pointer transition-transform ${
                isSelected
                  ? 'bg-[#8a8a8a] border-3 border-white scale-105 z-10 shadow-lg'
                  : 'bg-[#5a5a5a] border-2 border-[#2b2b2b] hover:bg-[#6b6b6b]'
              }`}
              style={{
                boxShadow: isSelected ? 'inset 0 0 4px rgba(255,255,255,0.6)' : 'inset 1px 1px 0px #777, inset -1px -1px 0px #333',
              }}
            >
              {/* Slot Number Label */}
              <span className="absolute top-0.5 left-1 text-[9px] font-pixel text-neutral-400 opacity-60">
                {i + 1}
              </span>

              {/* Item Icon */}
              {item && (
                <div className="relative w-8 h-8 flex items-center justify-center pointer-events-none">
                  <img
                    src={getItemIcon(item.id)}
                    alt={getItemOrBlockName(item.id)}
                    className="w-8 h-8 pixelated select-none object-contain drop-shadow-xs"
                    draggable={false}
                  />

                  {/* Stack count */}
                  {item.count > 1 && (
                    <span
                      className="absolute -bottom-1 -right-1 font-pixel text-[10px] text-white font-bold"
                      style={{
                        textShadow: '1px 1px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000',
                      }}
                    >
                      {item.count}
                    </span>
                  )}

                  {/* Durability Bar */}
                  {item.durability !== undefined && item.maxDurability !== undefined && (
                    <div className="absolute -bottom-1.5 left-0 right-0 h-1 bg-black rounded-xs overflow-hidden">
                      <div
                        className="h-full bg-emerald-500"
                        style={{
                          width: `${(item.durability / item.maxDurability) * 100}%`,
                          backgroundColor:
                            item.durability / item.maxDurability < 0.2
                              ? '#ef4444'
                              : item.durability / item.maxDurability < 0.5
                              ? '#f59e0b'
                              : '#10b981',
                        }}
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
