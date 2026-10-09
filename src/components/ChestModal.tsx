import React, { useState } from 'react';
import { InventorySlots, ItemStack } from '../game/types.ts';
import { getItemIcon } from '../game/textures.ts';
import { soundManager } from '../game/audio.ts';

interface ChestModalProps {
  isOpen: boolean;
  onClose: () => void;
  chestSlots: InventorySlots; // 27 slots
  inventory: InventorySlots; // 27 slots
  hotbar: InventorySlots; // 9 slots
  onUpdateChest: (newChest: InventorySlots) => void;
  onUpdateInventory: (newInv: InventorySlots, newHotbar: InventorySlots) => void;
}

export const ChestModal: React.FC<ChestModalProps> = ({
  isOpen,
  onClose,
  chestSlots,
  inventory,
  hotbar,
  onUpdateChest,
  onUpdateInventory,
}) => {
  const [cursorItem, setCursorItem] = useState<ItemStack | null>(null);

  if (!isOpen) return null;

  const handleSlotClick = (target: 'chest' | 'inventory' | 'hotbar', index: number) => {
    let list: InventorySlots;
    if (target === 'chest') list = [...chestSlots];
    else if (target === 'inventory') list = [...inventory];
    else list = [...hotbar];

    const current = list[index];
    soundManager.playBlockPlace('wood');

    if (!cursorItem) {
      if (current) {
        setCursorItem(current);
        list[index] = null;
      }
    } else {
      if (!current) {
        list[index] = cursorItem;
        setCursorItem(null);
      } else if (current.id === cursorItem.id) {
        list[index] = { ...current, count: current.count + cursorItem.count };
        setCursorItem(null);
      } else {
        list[index] = cursorItem;
        setCursorItem(current);
      }
    }

    if (target === 'chest') onUpdateChest(list);
    else if (target === 'inventory') onUpdateInventory(list, hotbar);
    else onUpdateInventory(inventory, list);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-xs select-none"
      onMouseMove={(e) => {
        document.documentElement.style.setProperty('--mouse-x', `${e.clientX}px`);
        document.documentElement.style.setProperty('--mouse-y', `${e.clientY}px`);
      }}
    >
      {cursorItem && (
        <div
          className="fixed pointer-events-none z-60"
          style={{
            left: 'calc(var(--mouse-x, 0px) - 16px)',
            top: 'calc(var(--mouse-y, 0px) - 16px)',
          }}
        >
          <div className="relative w-8 h-8">
            <img src={getItemIcon(cursorItem.id)} alt="cursor" className="w-8 h-8 pixelated drop-shadow-md" />
            <span
              className="absolute -bottom-1 -right-1 font-pixel text-[10px] text-white font-bold"
              style={{ textShadow: '1px 1px 0 #000' }}
            >
              {cursorItem.count}
            </span>
          </div>
        </div>
      )}

      <div className="mc-panel w-[480px] max-w-[95vw] p-5 relative">
        <div className="flex items-center justify-between pb-2 border-b-2 border-[#888] mb-3">
          <span className="font-mc text-lg font-bold text-neutral-900">Сундук (Chest)</span>
          <button onClick={onClose} className="mc-button w-7 h-7 flex items-center justify-center font-pixel text-xs text-white">
            ✕
          </button>
        </div>

        {/* Chest Slots (27) */}
        <div className="mb-4">
          <span className="font-mc text-xs text-neutral-700 block mb-1">Хранилище сундука (27 слотов)</span>
          <div className="grid grid-cols-9 gap-1 bg-[#8c8c8c] p-2 border-2 border-[#444]">
            {chestSlots.map((item, i) => (
              <div
                key={i}
                onClick={() => handleSlotClick('chest', i)}
                className="w-10 h-10 mc-slot flex items-center justify-center cursor-pointer hover:bg-[#a0a0a0]"
              >
                {item && (
                  <div className="relative w-7 h-7 flex items-center justify-center">
                    <img src={getItemIcon(item.id)} alt="chest item" className="w-7 h-7 pixelated" />
                    {item.count > 1 && (
                      <span className="absolute -bottom-1 -right-1 font-pixel text-[9px] text-white" style={{ textShadow: '1px 1px 0 #000' }}>
                        {item.count}
                      </span>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Player Inventory (27) */}
        <div className="mb-2">
          <span className="font-mc text-xs text-neutral-700 block mb-1">Инвентарь игрока</span>
          <div className="grid grid-cols-9 gap-1 bg-[#9c9c9c] p-1.5 border-2 border-[#555]">
            {inventory.map((item, i) => (
              <div
                key={i}
                onClick={() => handleSlotClick('inventory', i)}
                className="w-10 h-10 mc-slot flex items-center justify-center cursor-pointer hover:bg-[#a0a0a0]"
              >
                {item && (
                  <div className="relative w-7 h-7 flex items-center justify-center">
                    <img src={getItemIcon(item.id)} alt="inv item" className="w-7 h-7 pixelated" />
                    {item.count > 1 && (
                      <span className="absolute -bottom-1 -right-1 font-pixel text-[9px] text-white" style={{ textShadow: '1px 1px 0 #000' }}>
                        {item.count}
                      </span>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Hotbar (9) */}
        <div>
          <span className="font-mc text-xs text-neutral-700 block mb-1">Хотбар</span>
          <div className="grid grid-cols-9 gap-1 bg-[#9c9c9c] p-1.5 border-2 border-[#555]">
            {hotbar.map((item, i) => (
              <div
                key={i}
                onClick={() => handleSlotClick('hotbar', i)}
                className="w-10 h-10 mc-slot flex items-center justify-center cursor-pointer hover:bg-[#a0a0a0]"
              >
                {item && (
                  <div className="relative w-7 h-7 flex items-center justify-center">
                    <img src={getItemIcon(item.id)} alt="hotbar item" className="w-7 h-7 pixelated" />
                    {item.count > 1 && (
                      <span className="absolute -bottom-1 -right-1 font-pixel text-[9px] text-white" style={{ textShadow: '1px 1px 0 #000' }}>
                        {item.count}
                      </span>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
