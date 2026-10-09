import { BLOCK_IDS, ITEM_IDS } from './blocks.ts';
import { CraftingRecipe, ItemStack } from './types.ts';

export const RECIPES: CraftingRecipe[] = [
  // 1 Oak Log -> 4 Oak Planks (shapeless)
  {
    id: 'planks',
    name: 'Oak Planks',
    nameRu: 'Дубовые доски',
    width: 1,
    height: 1,
    grid: [BLOCK_IDS.OAK_LOG],
    result: { id: BLOCK_IDS.OAK_PLANKS, count: 4, type: 'block' },
    shapeless: true,
  },
  // 2 Planks -> 4 Sticks
  {
    id: 'sticks',
    name: 'Sticks',
    nameRu: 'Палки',
    width: 1,
    height: 2,
    grid: [BLOCK_IDS.OAK_PLANKS, BLOCK_IDS.OAK_PLANKS],
    result: { id: ITEM_IDS.STICK, count: 4, type: 'item' },
  },
  // 4 Planks -> 1 Crafting Table (2x2)
  {
    id: 'crafting_table',
    name: 'Crafting Table',
    nameRu: 'Верстак',
    width: 2,
    height: 2,
    grid: [
      BLOCK_IDS.OAK_PLANKS, BLOCK_IDS.OAK_PLANKS,
      BLOCK_IDS.OAK_PLANKS, BLOCK_IDS.OAK_PLANKS,
    ],
    result: { id: BLOCK_IDS.CRAFTING_TABLE, count: 1, type: 'block' },
  },
  // 1 Stick + 1 Coal -> 4 Torches
  {
    id: 'torch',
    name: 'Torches',
    nameRu: 'Факелы',
    width: 1,
    height: 2,
    grid: [ITEM_IDS.COAL, ITEM_IDS.STICK],
    result: { id: BLOCK_IDS.TORCH, count: 4, type: 'block' },
  },
  // 8 Cobblestone -> 1 Furnace (3x3)
  {
    id: 'furnace',
    name: 'Furnace',
    nameRu: 'Печь',
    width: 3,
    height: 3,
    grid: [
      BLOCK_IDS.COBBLESTONE, BLOCK_IDS.COBBLESTONE, BLOCK_IDS.COBBLESTONE,
      BLOCK_IDS.COBBLESTONE, null,                  BLOCK_IDS.COBBLESTONE,
      BLOCK_IDS.COBBLESTONE, BLOCK_IDS.COBBLESTONE, BLOCK_IDS.COBBLESTONE,
    ],
    result: { id: BLOCK_IDS.FURNACE, count: 1, type: 'block' },
  },
  // 8 Planks -> 1 Chest (3x3)
  {
    id: 'chest',
    name: 'Chest',
    nameRu: 'Сундук',
    width: 3,
    height: 3,
    grid: [
      BLOCK_IDS.OAK_PLANKS, BLOCK_IDS.OAK_PLANKS, BLOCK_IDS.OAK_PLANKS,
      BLOCK_IDS.OAK_PLANKS, null,                 BLOCK_IDS.OAK_PLANKS,
      BLOCK_IDS.OAK_PLANKS, BLOCK_IDS.OAK_PLANKS, BLOCK_IDS.OAK_PLANKS,
    ],
    result: { id: BLOCK_IDS.CHEST, count: 1, type: 'block' },
  },
  // TNT: 4 Sand + 5 Coal/Gunpowder in X pattern
  {
    id: 'tnt',
    name: 'TNT',
    nameRu: 'Динамит',
    width: 3,
    height: 3,
    grid: [
      ITEM_IDS.COAL,  BLOCK_IDS.SAND, ITEM_IDS.COAL,
      BLOCK_IDS.SAND, ITEM_IDS.COAL,  BLOCK_IDS.SAND,
      ITEM_IDS.COAL,  BLOCK_IDS.SAND, ITEM_IDS.COAL,
    ],
    result: { id: BLOCK_IDS.TNT, count: 1, type: 'block' },
  },
  // Quick 2x2 TNT recipe (2 Sand + 2 Coal)
  {
    id: 'tnt_quick',
    name: 'TNT',
    nameRu: 'Динамит',
    width: 2,
    height: 2,
    grid: [
      ITEM_IDS.COAL, BLOCK_IDS.SAND,
      BLOCK_IDS.SAND, ITEM_IDS.COAL,
    ],
    result: { id: BLOCK_IDS.TNT, count: 1, type: 'block' },
  },
  // Wooden Pickaxe (3 Planks + 2 Sticks)
  {
    id: 'wood_pickaxe',
    name: 'Wooden Pickaxe',
    nameRu: 'Деревянная кирка',
    width: 3,
    height: 3,
    grid: [
      BLOCK_IDS.OAK_PLANKS, BLOCK_IDS.OAK_PLANKS, BLOCK_IDS.OAK_PLANKS,
      null,                 ITEM_IDS.STICK,       null,
      null,                 ITEM_IDS.STICK,       null,
    ],
    result: { id: ITEM_IDS.WOODEN_PICKAXE, count: 1, type: 'tool', durability: 60, maxDurability: 60 },
  },
  // Stone Pickaxe (3 Cobblestone + 2 Sticks)
  {
    id: 'stone_pickaxe',
    name: 'Stone Pickaxe',
    nameRu: 'Каменная кирка',
    width: 3,
    height: 3,
    grid: [
      BLOCK_IDS.COBBLESTONE, BLOCK_IDS.COBBLESTONE, BLOCK_IDS.COBBLESTONE,
      null,                  ITEM_IDS.STICK,        null,
      null,                  ITEM_IDS.STICK,        null,
    ],
    result: { id: ITEM_IDS.STONE_PICKAXE, count: 1, type: 'tool', durability: 132, maxDurability: 132 },
  },
  // Iron Pickaxe (3 Iron + 2 Sticks)
  {
    id: 'iron_pickaxe',
    name: 'Iron Pickaxe',
    nameRu: 'Железная кирка',
    width: 3,
    height: 3,
    grid: [
      ITEM_IDS.IRON_INGOT, ITEM_IDS.IRON_INGOT, ITEM_IDS.IRON_INGOT,
      null,                ITEM_IDS.STICK,      null,
      null,                ITEM_IDS.STICK,      null,
    ],
    result: { id: ITEM_IDS.IRON_PICKAXE, count: 1, type: 'tool', durability: 251, maxDurability: 251 },
  },
  // Diamond Pickaxe (3 Diamonds + 2 Sticks)
  {
    id: 'diamond_pickaxe',
    name: 'Diamond Pickaxe',
    nameRu: 'Алмазная кирка',
    width: 3,
    height: 3,
    grid: [
      ITEM_IDS.DIAMOND, ITEM_IDS.DIAMOND, ITEM_IDS.DIAMOND,
      null,             ITEM_IDS.STICK,   null,
      null,             ITEM_IDS.STICK,   null,
    ],
    result: { id: ITEM_IDS.DIAMOND_PICKAXE, count: 1, type: 'tool', durability: 1561, maxDurability: 1561 },
  },
  // Wooden Sword (2 Planks + 1 Stick)
  {
    id: 'wood_sword',
    name: 'Wooden Sword',
    nameRu: 'Деревянный меч',
    width: 1,
    height: 3,
    grid: [
      BLOCK_IDS.OAK_PLANKS,
      BLOCK_IDS.OAK_PLANKS,
      ITEM_IDS.STICK,
    ],
    result: { id: ITEM_IDS.WOODEN_SWORD, count: 1, type: 'tool', durability: 60, maxDurability: 60 },
  },
  // Diamond Sword (2 Diamonds + 1 Stick)
  {
    id: 'diamond_sword',
    name: 'Diamond Sword',
    nameRu: 'Алмазный меч',
    width: 1,
    height: 3,
    grid: [
      ITEM_IDS.DIAMOND,
      ITEM_IDS.DIAMOND,
      ITEM_IDS.STICK,
    ],
    result: { id: ITEM_IDS.DIAMOND_SWORD, count: 1, type: 'tool', durability: 1561, maxDurability: 1561 },
  },
  // Bookshelf (6 Planks + 3 Sticks / Books)
  {
    id: 'bookshelf',
    name: 'Bookshelf',
    nameRu: 'Книжная полка',
    width: 3,
    height: 3,
    grid: [
      BLOCK_IDS.OAK_PLANKS, BLOCK_IDS.OAK_PLANKS, BLOCK_IDS.OAK_PLANKS,
      ITEM_IDS.STICK,       ITEM_IDS.STICK,       ITEM_IDS.STICK,
      BLOCK_IDS.OAK_PLANKS, BLOCK_IDS.OAK_PLANKS, BLOCK_IDS.OAK_PLANKS,
    ],
    result: { id: BLOCK_IDS.BOOKSHELF, count: 1, type: 'block' },
  },
];

// Check if craft input matches recipe
export function findMatchingRecipe(inputGrid: (ItemStack | null)[], gridSize: 2 | 3): ItemStack | null {
  // Extract non-null items
  const nonNullItems = inputGrid.filter((x): x is ItemStack => x !== null && x.count > 0);
  if (nonNullItems.length === 0) return null;

  // Check shapeless single item recipes first
  if (nonNullItems.length === 1) {
    const single = nonNullItems[0];
    for (const r of RECIPES) {
      if (r.shapeless && r.grid.length === 1 && r.grid[0] === single.id) {
        return { ...r.result };
      }
    }
  }

  // Determine bounding box of input grid
  let minCol: number = gridSize;
  let maxCol: number = -1;
  let minRow: number = gridSize;
  let maxRow: number = -1;

  for (let r = 0; r < gridSize; r++) {
    for (let c = 0; c < gridSize; c++) {
      const item = inputGrid[r * gridSize + c];
      if (item && item.count > 0) {
        if (c < minCol) minCol = c;
        if (c > maxCol) maxCol = c;
        if (r < minRow) minRow = r;
        if (r > maxRow) maxRow = r;
      }
    }
  }

  const inputW = maxCol - minCol + 1;
  const inputH = maxRow - minRow + 1;

  for (const recipe of RECIPES) {
    if (recipe.shapeless) continue;
    if (recipe.width !== inputW || recipe.height !== inputH) continue;

    let match = true;
    for (let r = 0; r < recipe.height; r++) {
      for (let c = 0; c < recipe.width; c++) {
        const expected = recipe.grid[r * recipe.width + c];
        const actualItem = inputGrid[(minRow + r) * gridSize + (minCol + c)];
        const actualId = actualItem ? actualItem.id : null;

        if (expected !== actualId) {
          match = false;
          break;
        }
      }
      if (!match) break;
    }

    if (match) {
      return { ...recipe.result };
    }
  }

  return null;
}
