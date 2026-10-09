import React, { useState } from 'react';
import { InventorySlots, ItemStack } from '../game/types.ts';
import { BLOCKS, ITEMS, ITEM_IDS, getItemOrBlockName } from '../game/blocks.ts';
import { getItemIcon } from '../game/textures.ts';
import { RECIPES, findMatchingRecipe } from '../game/crafting.ts';
import { soundManager } from '../game/audio.ts';

interface InventoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  inventory: InventorySlots; // 27 slots
  hotbar: InventorySlots; // 9 slots
  onUpdateInventory: (newInv: InventorySlots, newHotbar: InventorySlots) => void;
}

export const InventoryModal: React.FC<InventoryModalProps> = ({
  isOpen,
  onClose,
  inventory,
  hotbar,
  onUpdateInventory,
}) => {
  const [activeTab, setActiveTab] = useState<'survival' | 'creative' | 'recipes'>('survival');

  // 2x2 crafting grid inside player inventory
  const [craftGrid, setCraftGrid] = useState<(ItemStack | null)[]>([null, null, null, null]);
  const [cursorItem, setCursorItem] = useState<ItemStack | null>(null);

  // Creative search filter
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'nature' | 'building' | 'ores' | 'tools'>('all');

  if (!isOpen) return null;

  // Calculate craft result
  const craftResult = findMatchingRecipe(craftGrid, 2);

  // Take craft result
  const handleTakeCraftResult = () => {
    if (!craftResult) return;

    soundManager.playItemPickup();

    if (cursorItem) {
      if (cursorItem.id === craftResult.id) {
        setCursorItem({ ...cursorItem, count: cursorItem.count + craftResult.count });
      } else {
        return; // cursor full with another item
      }
    } else {
      setCursorItem({ ...craftResult });
    }

    // Decrement 1 from each occupied craft slot
    const nextGrid = craftGrid.map((item) => {
      if (!item) return null;
      if (item.count <= 1) return null;
      return { ...item, count: item.count - 1 };
    });
    setCraftGrid(nextGrid);
  };

  // Slot click handler (both inventory and hotbar)
  const handleSlotClick = (isHotbar: boolean, index: number, isRightClick = false) => {
    const list = isHotbar ? [...hotbar] : [...inventory];
    const current = list[index];

    soundManager.playBlockPlace('wood');

    if (!cursorItem) {
      // Pick up item
      if (current) {
        if (isRightClick && current.count > 1) {
          // Pick up half
          const half = Math.ceil(current.count / 2);
          setCursorItem({ ...current, count: half });
          list[index] = { ...current, count: current.count - half };
        } else {
          setCursorItem(current);
          list[index] = null;
        }
      }
    } else {
      // Placing cursor item
      if (!current) {
        if (isRightClick) {
          // Place 1
          list[index] = { ...cursorItem, count: 1 };
          if (cursorItem.count <= 1) setCursorItem(null);
          else setCursorItem({ ...cursorItem, count: cursorItem.count - 1 });
        } else {
          list[index] = cursorItem;
          setCursorItem(null);
        }
      } else if (current.id === cursorItem.id) {
        // Stack together
        if (isRightClick) {
          list[index] = { ...current, count: current.count + 1 };
          if (cursorItem.count <= 1) setCursorItem(null);
          else setCursorItem({ ...cursorItem, count: cursorItem.count - 1 });
        } else {
          list[index] = { ...current, count: current.count + cursorItem.count };
          setCursorItem(null);
        }
      } else {
        // Swap
        list[index] = cursorItem;
        setCursorItem(current);
      }
    }

    if (isHotbar) {
      onUpdateInventory(inventory, list);
    } else {
      onUpdateInventory(list, hotbar);
    }
  };

  // Crafting grid slot click
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

  // Creative mode: click item in catalog to get 64
  const handlePickCreativeItem = (id: number) => {
    soundManager.playItemPickup();
    setCursorItem({ id, count: 64, type: id >= 100 ? 'item' : 'block' });
  };

  // Get catalog items
  const allBlocksList = Object.values(BLOCKS).filter((b) => b.id > 0);
  const allItemsList = Object.entries(ITEMS).map(([idStr, val]) => ({
    id: parseInt(idStr),
    name: val.name,
    nameRu: val.nameRu,
    isTool: val.isTool,
  }));

  const filteredCatalog = [...allBlocksList, ...allItemsList].filter((item) => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      if (!item.name.toLowerCase().includes(q) && !item.nameRu.toLowerCase().includes(q)) {
        return false;
      }
    }

    if (categoryFilter === 'nature') {
      return [1, 2, 5, 6, 8, 21, 23].includes(item.id);
    }
    if (categoryFilter === 'building') {
      return [3, 4, 7, 9, 10, 15, 16, 17, 18, 22, 25, 26, 27, 28].includes(item.id);
    }
    if (categoryFilter === 'ores') {
      return [11, 12, 13, 14, 19, 20, 112, 113, 114, 115].includes(item.id);
    }
    if (categoryFilter === 'tools') {
      return item.id >= 100 && item.id <= 111;
    }
    return true;
  });

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-xs select-none"
      onContextMenu={(e) => e.preventDefault()}
    >
      {/* Floating Cursor Item */}
      {cursorItem && (
        <div
          className="fixed pointer-events-none z-60"
          style={{
            left: 'calc(var(--mouse-x, 0px) - 16px)',
            top: 'calc(var(--mouse-y, 0px) - 16px)',
          }}
          id="cursor-tracker"
        >
          <div className="relative w-8 h-8">
            <img src={getItemIcon(cursorItem.id)} alt="cursor item" className="w-8 h-8 pixelated drop-shadow-md" />
            <span
              className="absolute -bottom-1 -right-1 font-pixel text-[10px] text-white font-bold"
              style={{ textShadow: '1px 1px 0 #000, -1px -1px 0 #000' }}
            >
              {cursorItem.count}
            </span>
          </div>
        </div>
      )}

      {/* Main Inventory Panel */}
      <div
        className="mc-panel w-[520px] max-w-[95vw] p-5 relative"
        onMouseMove={(e) => {
          document.documentElement.style.setProperty('--mouse-x', `${e.clientX}px`);
          document.documentElement.style.setProperty('--mouse-y', `${e.clientY}px`);
        }}
      >
        {/* Header Tabs & Close Button */}
        <div className="flex items-center justify-between pb-3 border-b-2 border-[#888] mb-4">
          <div className="flex items-center gap-1">
            <button
              onClick={() => setActiveTab('survival')}
              className={`px-3 py-1 font-mc text-base transition-colors ${
                activeTab === 'survival' ? 'mc-button font-bold text-white' : 'text-neutral-700 hover:text-black'
              }`}
            >
              Инвентарь (Survival)
            </button>
            <button
              onClick={() => setActiveTab('creative')}
              className={`px-3 py-1 font-mc text-base transition-colors ${
                activeTab === 'creative' ? 'mc-button font-bold text-white' : 'text-neutral-700 hover:text-black'
              }`}
            >
              Каталог блоков (Creative)
            </button>
            <button
              onClick={() => setActiveTab('recipes')}
              className={`px-3 py-1 font-mc text-base transition-colors ${
                activeTab === 'recipes' ? 'mc-button font-bold text-white' : 'text-neutral-700 hover:text-black'
              }`}
            >
              Книга рецептов
            </button>
          </div>

          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center mc-button font-pixel text-xs text-white"
            title="Закрыть (E или ESC)"
          >
            ✕
          </button>
        </div>

        {/* Tab 1: Survival Inventory */}
        {activeTab === 'survival' && (
          <div>
            {/* Top Row: Player Avatar Preview & 2x2 Crafting */}
            <div className="flex items-start justify-between bg-[#adadad] p-3 border-2 border-[#555] mb-4">
              {/* Player Avatar */}
              <div className="flex items-center gap-3">
                <div className="w-18 h-26 bg-[#666] border-2 border-[#333] flex flex-col items-center justify-center p-1">
                  <div className="w-8 h-8 bg-[#c58e63] border border-black mb-1" /> {/* Head */}
                  <div className="w-10 h-10 bg-[#00a8a8] border border-black mb-0.5" /> {/* Torso */}
                  <div className="flex gap-0.5">
                    <div className="w-4 h-6 bg-[#283593] border border-black" />
                    <div className="w-4 h-6 bg-[#283593] border border-black" />
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <span className="font-mc text-base font-bold text-neutral-800">Игрок (Steve)</span>
                  <span className="font-mc text-xs text-neutral-600">Клик = взять/положить</span>
                  <span className="font-mc text-xs text-neutral-600">ПКМ = разделить стак</span>
                </div>
              </div>

              {/* 2x2 Crafting Matrix */}
              <div className="flex items-center gap-3">
                <div className="flex flex-col items-center">
                  <span className="font-mc text-xs text-neutral-700 mb-1">Создание (2x2)</span>
                  <div className="grid grid-cols-2 gap-1 bg-[#888] p-1 border border-[#444]">
                    {Array.from({ length: 4 }).map((_, i) => {
                      const item = craftGrid[i];
                      return (
                        <div
                          key={i}
                          onClick={() => handleCraftSlotClick(i)}
                          className="w-9 h-9 mc-slot flex items-center justify-center cursor-pointer hover:brightness-110"
                        >
                          {item && (
                            <div className="relative w-7 h-7 flex items-center justify-center">
                              <img src={getItemIcon(item.id)} alt="craft item" className="w-6 h-6 pixelated" />
                              {item.count > 1 && (
                                <span
                                  className="absolute -bottom-1 -right-1 font-pixel text-[9px] text-white"
                                  style={{ textShadow: '1px 1px 0 #000' }}
                                >
                                  {item.count}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                <span className="font-pixel text-neutral-600 text-xs">➔</span>

                {/* Craft Result Slot */}
                <div className="flex flex-col items-center">
                  <span className="font-mc text-xs text-neutral-700 mb-1">Результат</span>
                  <div
                    onClick={handleTakeCraftResult}
                    className={`w-11 h-11 mc-slot flex items-center justify-center ${
                      craftResult ? 'cursor-pointer hover:brightness-125 bg-amber-100/20' : 'opacity-60'
                    }`}
                  >
                    {craftResult && (
                      <div className="relative w-8 h-8 flex items-center justify-center">
                        <img src={getItemIcon(craftResult.id)} alt="result" className="w-8 h-8 pixelated" />
                        {craftResult.count > 1 && (
                          <span
                            className="absolute -bottom-1 -right-1 font-pixel text-[10px] text-white"
                            style={{ textShadow: '1px 1px 0 #000' }}
                          >
                            {craftResult.count}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* 27 Main Inventory Slots */}
            <div className="mb-3">
              <span className="font-mc text-xs text-neutral-700 block mb-1">Инвентарь</span>
              <div className="grid grid-cols-9 gap-1 bg-[#9c9c9c] p-1.5 border-2 border-[#555]">
                {Array.from({ length: 27 }).map((_, i) => {
                  const item = inventory[i];
                  return (
                    <div
                      key={i}
                      onClick={() => handleSlotClick(false, i, false)}
                      onContextMenu={(e) => {
                        e.preventDefault();
                        handleSlotClick(false, i, true);
                      }}
                      className="w-10 h-10 mc-slot flex items-center justify-center cursor-pointer hover:bg-[#a0a0a0]"
                    >
                      {item && (
                        <div className="relative w-7 h-7 flex items-center justify-center pointer-events-none">
                          <img src={getItemIcon(item.id)} alt="item" className="w-7 h-7 pixelated" />
                          {item.count > 1 && (
                            <span
                              className="absolute -bottom-1 -right-1 font-pixel text-[9px] text-white"
                              style={{ textShadow: '1px 1px 0 #000' }}
                            >
                              {item.count}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 9 Hotbar Slots */}
            <div>
              <span className="font-mc text-xs text-neutral-700 block mb-1">Панель быстрого доступа (Хотбар)</span>
              <div className="grid grid-cols-9 gap-1 bg-[#9c9c9c] p-1.5 border-2 border-[#555]">
                {Array.from({ length: 9 }).map((_, i) => {
                  const item = hotbar[i];
                  return (
                    <div
                      key={i}
                      onClick={() => handleSlotClick(true, i, false)}
                      onContextMenu={(e) => {
                        e.preventDefault();
                        handleSlotClick(true, i, true);
                      }}
                      className="w-10 h-10 mc-slot flex items-center justify-center cursor-pointer hover:bg-[#a0a0a0]"
                    >
                      {item && (
                        <div className="relative w-7 h-7 flex items-center justify-center pointer-events-none">
                          <img src={getItemIcon(item.id)} alt="item" className="w-7 h-7 pixelated" />
                          {item.count > 1 && (
                            <span
                              className="absolute -bottom-1 -right-1 font-pixel text-[9px] text-white"
                              style={{ textShadow: '1px 1px 0 #000' }}
                            >
                              {item.count}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Creative Catalog */}
        {activeTab === 'creative' && (
          <div>
            {/* Filter buttons & Search */}
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-1">
                {(['all', 'nature', 'building', 'ores', 'tools'] as const).map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setCategoryFilter(cat)}
                    className={`px-2 py-0.5 font-mc text-sm rounded-xs transition-colors ${
                      categoryFilter === cat ? 'bg-[#555] text-white font-bold' : 'bg-[#999] text-black hover:bg-[#888]'
                    }`}
                  >
                    {cat === 'all'
                      ? 'Все'
                      : cat === 'nature'
                      ? 'Природа'
                      : cat === 'building'
                      ? 'Строительство'
                      : cat === 'ores'
                      ? 'Руды'
                      : 'Инструменты'}
                  </button>
                ))}
              </div>

              <input
                type="text"
                placeholder="Поиск предмета..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="px-2 py-1 bg-white border border-[#555] font-mc text-sm text-black placeholder:text-neutral-500 w-40"
              />
            </div>

            {/* Catalog Grid */}
            <div className="max-h-60 overflow-y-auto grid grid-cols-9 gap-1 bg-[#8c8c8c] p-2 border-2 border-[#444] mb-3">
              {filteredCatalog.map((item) => (
                <div
                  key={item.id}
                  onClick={() => handlePickCreativeItem(item.id)}
                  className="w-10 h-10 mc-slot flex items-center justify-center cursor-pointer hover:bg-[#a8a8a8] hover:scale-105 transition-transform"
                  title={`${item.nameRu} (${item.name})`}
                >
                  <img src={getItemIcon(item.id)} alt={item.name} className="w-7 h-7 pixelated" />
                </div>
              ))}
            </div>

            <p className="font-mc text-xs text-neutral-700 text-center">
              Кликните по любому блоку или инструменту, чтобы взять стак (64 шт.) на курсор!
            </p>
          </div>
        )}

        {/* Tab 3: Recipes Book */}
        {activeTab === 'recipes' && (
          <div className="max-h-80 overflow-y-auto pr-1 flex flex-col gap-2">
            <span className="font-mc text-sm text-neutral-800 font-bold block mb-1">
              Основные рецепты крафта в игре:
            </span>
            {RECIPES.map((recipe) => (
              <div
                key={recipe.id}
                className="flex items-center justify-between p-2 bg-[#b0b0b0] border border-[#666] rounded-xs"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 mc-slot flex items-center justify-center bg-[#888]">
                    <img src={getItemIcon(recipe.result.id)} alt={recipe.name} className="w-7 h-7 pixelated" />
                  </div>
                  <div>
                    <span className="font-mc text-sm font-bold block text-neutral-900">{recipe.nameRu}</span>
                    <span className="font-mc text-xs text-neutral-600">
                      Результат: {recipe.result.count} шт. ({recipe.width}x{recipe.height} {recipe.width > 2 ? 'верстак' : 'инвентарь'})
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => handlePickCreativeItem(recipe.result.id)}
                  className="mc-button px-2 py-1 font-mc text-xs text-white"
                >
                  Взять сразу
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
