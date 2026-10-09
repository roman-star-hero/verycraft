import React, { useState, useEffect } from 'react';
import { FurnaceData, InventorySlots, ItemStack } from '../game/types.ts';
import { BLOCK_IDS, ITEM_IDS } from '../game/blocks.ts';
import { getItemIcon } from '../game/textures.ts';
import { soundManager } from '../game/audio.ts';

interface FurnaceModalProps {
  isOpen: boolean;
  onClose: () => void;
  furnaceData: FurnaceData;
  onUpdateFurnaceData: (data: FurnaceData) => void;
  inventory: InventorySlots;
  hotbar: InventorySlots;
  onUpdateInventory: (newInv: InventorySlots, newHotbar: InventorySlots) => void;
}

export function getSmeltResult(inputId: number): { id: number; count: number } | null {
  switch (inputId) {
    case BLOCK_IDS.IRON_ORE:
      return { id: ITEM_IDS.IRON_INGOT, count: 1 };
    case BLOCK_IDS.GOLD_ORE:
      return { id: ITEM_IDS.GOLD_INGOT, count: 1 };
    case BLOCK_IDS.COBBLESTONE:
      return { id: BLOCK_IDS.STONE, count: 1 };
    case BLOCK_IDS.SAND:
      return { id: BLOCK_IDS.GLASS, count: 1 };
    case ITEM_IDS.RAW_PORKCHOP:
      return { id: ITEM_IDS.COOKED_PORKCHOP, count: 1 };
    default:
      return null;
  }
}

export function getFuelBurnTime(fuelId: number): number {
  switch (fuelId) {
    case ITEM_IDS.COAL:
      return 60; // 60 seconds (smelts 7-8 items)
    case BLOCK_IDS.OAK_LOG:
    case BLOCK_IDS.BIRCH_LOG:
    case BLOCK_IDS.OAK_PLANKS:
      return 15; // 15 seconds
    case ITEM_IDS.STICK:
      return 5; // 5 seconds
    default:
      return 0;
  }
}

export const FurnaceModal: React.FC<FurnaceModalProps> = ({
  isOpen,
  onClose,
  furnaceData,
  onUpdateFurnaceData,
  inventory,
  hotbar,
  onUpdateInventory,
}) => {
  const [cursorItem, setCursorItem] = useState<ItemStack | null>(null);

  // Active cooking tick inside furnace
  useEffect(() => {
    if (!isOpen) return;

    const interval = setInterval(() => {
      let { input, fuel, output, burnTimeRemaining, maxBurnTime, smeltProgress } = furnaceData;
      let changed = false;
      const dt = 0.2;

      const smeltResult = input ? getSmeltResult(input.id) : null;
      const canSmelt =
        smeltResult &&
        (!output || (output.id === smeltResult.id && output.count < 64));

      // Consume new fuel if out of flame and input needs cooking
      if (burnTimeRemaining <= 0 && canSmelt && fuel && fuel.count > 0) {
        const fuelTime = getFuelBurnTime(fuel.id);
        if (fuelTime > 0) {
          burnTimeRemaining = fuelTime;
          maxBurnTime = fuelTime;
          if (fuel.count <= 1) {
            fuel = null;
          } else {
            fuel = { ...fuel, count: fuel.count - 1 };
          }
          changed = true;
          soundManager.playSmelt();
        }
      }

      // Burn timer down
      if (burnTimeRemaining > 0) {
        burnTimeRemaining = Math.max(0, burnTimeRemaining - dt);
        changed = true;

        if (canSmelt) {
          // Progress cooking (takes 7 seconds to smelt one item)
          smeltProgress += dt / 7.0;
          if (smeltProgress >= 1.0) {
            smeltProgress = 0;
            // Smelt completed!
            if (output) {
              output = { ...output, count: output.count + smeltResult!.count };
            } else {
              output = { id: smeltResult!.id, count: smeltResult!.count };
            }

            if (input!.count <= 1) {
              input = null;
            } else {
              input = { ...input!, count: input!.count - 1 };
            }
            soundManager.playSmelt();
          }
        } else {
          smeltProgress = Math.max(0, smeltProgress - dt * 0.5);
        }
      } else {
        if (smeltProgress > 0) {
          smeltProgress = Math.max(0, smeltProgress - dt * 0.5);
          changed = true;
        }
      }

      if (changed) {
        onUpdateFurnaceData({
          input,
          fuel,
          output,
          burnTimeRemaining,
          maxBurnTime,
          smeltProgress,
        });
      }
    }, 200);

    return () => clearInterval(interval);
  }, [isOpen, furnaceData, onUpdateFurnaceData]);

  if (!isOpen) return null;

  const handleInputSlotClick = () => {
    soundManager.playItemPickup();
    const current = furnaceData.input;

    if (!cursorItem) {
      if (current) {
        setCursorItem(current);
        onUpdateFurnaceData({ ...furnaceData, input: null });
      }
    } else {
      if (!current) {
        onUpdateFurnaceData({ ...furnaceData, input: cursorItem });
        setCursorItem(null);
      } else if (current.id === cursorItem.id) {
        const total = current.count + cursorItem.count;
        if (total <= 64) {
          onUpdateFurnaceData({ ...furnaceData, input: { ...current, count: total } });
          setCursorItem(null);
        } else {
          onUpdateFurnaceData({ ...furnaceData, input: { ...current, count: 64 } });
          setCursorItem({ ...cursorItem, count: total - 64 });
        }
      } else {
        // Swap
        onUpdateFurnaceData({ ...furnaceData, input: cursorItem });
        setCursorItem(current);
      }
    }
  };

  const handleFuelSlotClick = () => {
    soundManager.playItemPickup();
    const current = furnaceData.fuel;

    if (!cursorItem) {
      if (current) {
        setCursorItem(current);
        onUpdateFurnaceData({ ...furnaceData, fuel: null });
      }
    } else {
      if (!current) {
        onUpdateFurnaceData({ ...furnaceData, fuel: cursorItem });
        setCursorItem(null);
      } else if (current.id === cursorItem.id) {
        const total = current.count + cursorItem.count;
        if (total <= 64) {
          onUpdateFurnaceData({ ...furnaceData, fuel: { ...current, count: total } });
          setCursorItem(null);
        } else {
          onUpdateFurnaceData({ ...furnaceData, fuel: { ...current, count: 64 } });
          setCursorItem({ ...cursorItem, count: total - 64 });
        }
      } else {
        onUpdateFurnaceData({ ...furnaceData, fuel: cursorItem });
        setCursorItem(current);
      }
    }
  };

  const handleOutputSlotClick = () => {
    const current = furnaceData.output;
    if (!current) return;
    soundManager.playItemPickup();

    if (!cursorItem) {
      setCursorItem(current);
      onUpdateFurnaceData({ ...furnaceData, output: null });
    } else if (cursorItem.id === current.id) {
      const total = cursorItem.count + current.count;
      if (total <= 64) {
        setCursorItem({ ...cursorItem, count: total });
        onUpdateFurnaceData({ ...furnaceData, output: null });
      } else {
        setCursorItem({ ...cursorItem, count: 64 });
        onUpdateFurnaceData({ ...furnaceData, output: { ...current, count: total - 64 } });
      }
    }
  };

  const handleInvSlotClick = (index: number) => {
    soundManager.playItemPickup();
    const nextInv = [...inventory];
    const current = nextInv[index];

    if (!cursorItem) {
      if (current) {
        setCursorItem(current);
        nextInv[index] = null;
      }
    } else {
      if (!current) {
        nextInv[index] = cursorItem;
        setCursorItem(null);
      } else if (current.id === cursorItem.id) {
        const total = current.count + cursorItem.count;
        if (total <= 64) {
          nextInv[index] = { ...current, count: total };
          setCursorItem(null);
        } else {
          nextInv[index] = { ...current, count: 64 };
          setCursorItem({ ...cursorItem, count: total - 64 });
        }
      } else {
        nextInv[index] = cursorItem;
        setCursorItem(current);
      }
    }
    onUpdateInventory(nextInv, hotbar);
  };

  const handleHotbarSlotClick = (index: number) => {
    soundManager.playItemPickup();
    const nextHotbar = [...hotbar];
    const current = nextHotbar[index];

    if (!cursorItem) {
      if (current) {
        setCursorItem(current);
        nextHotbar[index] = null;
      }
    } else {
      if (!current) {
        nextHotbar[index] = cursorItem;
        setCursorItem(null);
      } else if (current.id === cursorItem.id) {
        const total = current.count + cursorItem.count;
        if (total <= 64) {
          nextHotbar[index] = { ...current, count: total };
          setCursorItem(null);
        } else {
          nextHotbar[index] = { ...current, count: 64 };
          setCursorItem({ ...cursorItem, count: total - 64 });
        }
      } else {
        nextHotbar[index] = cursorItem;
        setCursorItem(current);
      }
    }
    onUpdateInventory(inventory, nextHotbar);
  };

  const flameHeightPercent = furnaceData.maxBurnTime > 0
    ? Math.min(100, Math.max(0, (furnaceData.burnTimeRemaining / furnaceData.maxBurnTime) * 100))
    : 0;

  const arrowWidthPercent = Math.min(100, Math.max(0, furnaceData.smeltProgress * 100));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 select-none">
      <div className="mc-panel w-[460px] p-5 flex flex-col items-center relative">
        {/* Header */}
        <div className="w-full flex justify-between items-center mb-4 pb-2 border-b-2 border-[#555]">
          <h2 className="font-pixel text-base text-[#404040]">Печь / Furnace</h2>
          <button
            onClick={() => {
              if (cursorItem) {
                // Return cursor item to inventory
                const nextInv = [...inventory];
                for (let i = 0; i < nextInv.length; i++) {
                  if (!nextInv[i]) {
                    nextInv[i] = cursorItem;
                    onUpdateInventory(nextInv, hotbar);
                    break;
                  }
                }
              }
              onClose();
            }}
            className="text-neutral-500 hover:text-red-600 font-bold text-lg px-2"
          >
            ✕
          </button>
        </div>

        {/* Smelting Area */}
        <div className="flex items-center justify-center gap-6 my-3 p-4 bg-[#b5b5b5] border-2 border-[#555] rounded-xs shadow-inner">
          {/* Left: Input & Fuel */}
          <div className="flex flex-col items-center gap-3">
            {/* Input Slot */}
            <div
              onClick={handleInputSlotClick}
              className="mc-slot w-12 h-12 flex items-center justify-center relative cursor-pointer hover:border-yellow-400"
            >
              {furnaceData.input ? (
                <>
                  <img src={getItemIcon(furnaceData.input.id)} alt="input" className="w-8 h-8 pixelated" />
                  {furnaceData.input.count > 1 && (
                    <span className="absolute bottom-1 right-1 font-pixel text-xs text-white drop-shadow-[0_1px_1px_rgba(0,0,0,1)]">
                      {furnaceData.input.count}
                    </span>
                  )}
                </>
              ) : (
                <span className="font-mc text-[10px] text-neutral-400">Руда/Еда</span>
              )}
            </div>

            {/* Fire flame indicator */}
            <div className="w-5 h-5 relative flex items-center justify-center">
              <div
                className="w-4 h-4 transition-all duration-200"
                style={{
                  background: furnaceData.burnTimeRemaining > 0
                    ? `linear-gradient(to top, #ff2200, #ffbb00 ${flameHeightPercent}%, transparent ${flameHeightPercent}%)`
                    : '#777',
                  clipPath: 'polygon(50% 0%, 80% 40%, 100% 70%, 80% 100%, 20% 100%, 0% 70%, 20% 40%)',
                }}
              />
            </div>

            {/* Fuel Slot */}
            <div
              onClick={handleFuelSlotClick}
              className="mc-slot w-12 h-12 flex items-center justify-center relative cursor-pointer hover:border-yellow-400"
            >
              {furnaceData.fuel ? (
                <>
                  <img src={getItemIcon(furnaceData.fuel.id)} alt="fuel" className="w-8 h-8 pixelated" />
                  {furnaceData.fuel.count > 1 && (
                    <span className="absolute bottom-1 right-1 font-pixel text-xs text-white drop-shadow-[0_1px_1px_rgba(0,0,0,1)]">
                      {furnaceData.fuel.count}
                    </span>
                  )}
                </>
              ) : (
                <span className="font-mc text-[10px] text-neutral-400">Уголь</span>
              )}
            </div>
          </div>

          {/* Center: Arrow Progress */}
          <div className="w-10 h-6 bg-[#8e8e8e] relative border border-[#555] rounded-xs overflow-hidden flex items-center">
            <div
              className="h-full bg-amber-400 transition-all duration-200"
              style={{ width: `${arrowWidthPercent}%` }}
            />
            <span className="absolute inset-0 flex items-center justify-center font-bold text-xs text-black/50">
              ▶
            </span>
          </div>

          {/* Right: Output Slot */}
          <div
            onClick={handleOutputSlotClick}
            className="mc-slot w-14 h-14 flex items-center justify-center relative cursor-pointer hover:border-green-400 bg-[#9e9e9e]"
          >
            {furnaceData.output ? (
              <>
                <img src={getItemIcon(furnaceData.output.id)} alt="output" className="w-10 h-10 pixelated" />
                {furnaceData.output.count > 1 && (
                  <span className="absolute bottom-1 right-1 font-pixel text-sm text-white drop-shadow-[0_1px_1px_rgba(0,0,0,1)]">
                    {furnaceData.output.count}
                  </span>
                )}
              </>
            ) : (
              <span className="font-mc text-[10px] text-neutral-400">Выход</span>
            )}
          </div>
        </div>

        {/* Player Inventory (27 slots) */}
        <div className="w-full mt-3">
          <p className="font-pixel text-xs text-[#404040] mb-1">Инвентарь</p>
          <div className="grid grid-cols-9 gap-1 bg-[#8e8e8e] p-1.5 border border-[#555]">
            {inventory.map((slot, i) => (
              <div
                key={i}
                onClick={() => handleInvSlotClick(i)}
                className="mc-slot w-9 h-9 flex items-center justify-center relative cursor-pointer hover:border-white"
              >
                {slot && (
                  <>
                    <img src={getItemIcon(slot.id)} alt="inv" className="w-7 h-7 pixelated" />
                    {slot.count > 1 && (
                      <span className="absolute bottom-0 right-1 font-pixel text-[10px] text-white drop-shadow-[0_1px_1px_rgba(0,0,0,1)]">
                        {slot.count}
                      </span>
                    )}
                  </>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Hotbar (9 slots) */}
        <div className="w-full mt-2">
          <p className="font-pixel text-xs text-[#404040] mb-1">Панель быстрого доступа</p>
          <div className="grid grid-cols-9 gap-1 bg-[#8e8e8e] p-1.5 border border-[#555]">
            {hotbar.map((slot, i) => (
              <div
                key={i}
                onClick={() => handleHotbarSlotClick(i)}
                className="mc-slot w-9 h-9 flex items-center justify-center relative cursor-pointer hover:border-yellow-300"
              >
                {slot && (
                  <>
                    <img src={getItemIcon(slot.id)} alt="hotbar" className="w-7 h-7 pixelated" />
                    {slot.count > 1 && (
                      <span className="absolute bottom-0 right-1 font-pixel text-[10px] text-white drop-shadow-[0_1px_1px_rgba(0,0,0,1)]">
                        {slot.count}
                      </span>
                    )}
                  </>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Floating cursor item */}
        {cursorItem && (
          <div className="pointer-events-none fixed z-50 flex items-center justify-center w-8 h-8">
            <img src={getItemIcon(cursorItem.id)} alt="cursor" className="w-8 h-8 pixelated" />
          </div>
        )}
      </div>
    </div>
  );
};
