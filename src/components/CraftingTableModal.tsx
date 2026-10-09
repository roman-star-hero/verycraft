import React, { useState } from 'react';
import { InventorySlots, ItemStack } from '../game/types.ts';
import { getItemIcon } from '../game/textures.ts';
import { findMatchingRecipe } from '../game/crafting.ts';
import { soundManager } from '../game/audio.ts';

interface CraftingTableModalProps {
  isOpen: boolean;
  onClose: () => void;
  inventory: InventorySlots;
  hotbar: InventorySlots;
  onUpdateInventory: (newInv: InventorySlots, newHotbar: InventorySlots) => void;
}

export const CraftingTableModal: React.FC<CraftingTableModalProps> = ({
  isOpen,
  onClose,
  inventory,
  hotbar,
  onUpdateInventory,
}) => {
  const [craftGrid, setCraftGrid] = useState<(ItemStack | null)[]>(new Array(9).fill(null));
  const [cursorItem, setCursorItem] = useState<ItemStack | null>(null);

  if (!isOpen) return null;

  const craftResult = findMatchingRecipe(craftGrid, 3);

  const handleTakeResult = () => {
    if (!craftResult) return;
    soundManager.playItemPickup();

    if (cursorItem) {
      if (cursorItem.id === craftResult.id) {
        setCursorItem({ ...cursorItem, count: cursorItem.count + craftResult.count });
      } else {
        return;
      }
    } else {
      setCursorItem({ ...craftResult });
    }

    // Decrement 1 from craft slots
    const nextGrid = craftGrid.map((item) => {
      if (!item) return null;
      if (item.count <= 1) return null;
      return { ...item, count: item.count - 1 };
    });
    setCraftGrid(nextGrid);
  };

  const handleCraftSlotClick = (index: number) => {
    const nextGrid = [...craftGrid];
    const current = nextGrid[index];
    soundManager.playBlockPlace('wood');

    if (!cursorItem) {
      if (current) {
        setCursorItem(current);
        nextGrid[index] = null;
      }
    } else {
      if (!current) {
        nextGrid[index] = { ...cursorItem, count: 1 };
        if (cursorItem.count <= 1) setCursorItem(null);
        else setCursorItem({ ...cursorItem, count: cursorItem.count - 1 });
      } else if (current.id === cursorItem.id) {
        nextGrid[index] = { ...current, count: current.count + 1 };
        if (cursorItem.count <= 1) setCursorItem(null);
        else setCursorItem({ ...cursorItem, count: cursorItem.count - 1 });
      } else {
        nextGrid[index] = cursorItem;
        setCursorItem(current);
      }
    }
    setCraftGrid(nextGrid);
  };

  const handleInventorySlotClick = (isHotbar: boolean, index: number) => {
    const list = isHotbar ? [...hotbar] : [...inventory];
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

    if (isHotbar) onUpdateInventory(inventory, list);
    else onUpdateInventory(list, hotbar);
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
        <div className="flex items-center justify-between pb-2 border-b-2 border-[#888] mb-4">
          <span className="font-mc text-lg font-bold text-neutral-900">Верстак (3x3 Crafting Table)</span>
          <button onClick={onClose} className="mc-button w-7 h-7 flex items-center justify-center font-pixel text-xs text-white">
            ✕
          </button>
        </div>

        {/* 3x3 Matrix + Arrow + Result */}
        <div className="flex items-center justify-center gap-6 bg-[#adadad] p-4 border-2 border-[#555] mb-4">
          <div className="grid grid-cols-3 gap-1 bg-[#888] p-1.5 border border-[#444]">
            {craftGrid.map((item, i) => (
              <div
                key={i}
                onClick={() => handleCraftSlotClick(i)}
                className="w-10 h-10 mc-slot flex items-center justify-center cursor-pointer hover:brightness-110"
              >
                {item && (
                  <div className="relative w-7 h-7 flex items-center justify-center">
                    <img src={getItemIcon(item.id)} alt="item" className="w-7 h-7 pixelated" />
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

          <span className="font-pixel text-xl text-neutral-700">➔</span>

          <div
            onClick={handleTakeResult}
            className={`w-14 h-14 mc-slot flex items-center justify-center ${
              craftResult ? 'cursor-pointer hover:brightness-125 bg-amber-100/30' : 'opacity-60'
            }`}
          >
            {craftResult && (
              <div className="relative w-10 h-10 flex items-center justify-center">
                <img src={getItemIcon(craftResult.id)} alt="result" className="w-10 h-10 pixelated" />
                {craftResult.count > 1 && (
                  <span className="absolute -bottom-1 -right-1 font-pixel text-[12px] text-white" style={{ textShadow: '1px 1px 0 #000' }}>
                    {craftResult.count}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Player Inventory Slots */}
        <div className="mb-2">
          <span className="font-mc text-xs text-neutral-700 block mb-1">Инвентарь игрока</span>
          <div className="grid grid-cols-9 gap-1 bg-[#9c9c9c] p-1.5 border-2 border-[#555]">
            {inventory.map((item, i) => (
              <div
                key={i}
                onClick={() => handleInventorySlotClick(false, i)}
                className="w-10 h-10 mc-slot flex items-center justify-center cursor-pointer hover:bg-[#a0a0a0]"
              >
                {item && (
                  <div className="relative w-7 h-7 flex items-center justify-center">
                    <img src={getItemIcon(item.id)} alt="item" className="w-7 h-7 pixelated" />
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

        {/* Hotbar Slots */}
        <div>
          <span className="font-mc text-xs text-neutral-700 block mb-1">Хотбар</span>
          <div className="grid grid-cols-9 gap-1 bg-[#9c9c9c] p-1.5 border-2 border-[#555]">
            {hotbar.map((item, i) => (
              <div
                key={i}
                onClick={() => handleInventorySlotClick(true, i)}
                className="w-10 h-10 mc-slot flex items-center justify-center cursor-pointer hover:bg-[#a0a0a0]"
              >
                {item && (
                  <div className="relative w-7 h-7 flex items-center justify-center">
                    <img src={getItemIcon(item.id)} alt="item" className="w-7 h-7 pixelated" />
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
