import { BlockDefinition } from './types.ts';

// Texture atlas coordinates:
// We arrange textures on a 16x16 grid or list of textures
export const BLOCK_IDS = {
  AIR: 0,
  GRASS: 1,
  DIRT: 2,
  STONE: 3,
  COBBLESTONE: 4,
  OAK_LOG: 5,
  OAK_LEAVES: 6,
  OAK_PLANKS: 7,
  SAND: 8,
  GLASS: 9,
  BRICK: 10,
  COAL_ORE: 11,
  IRON_ORE: 12,
  GOLD_ORE: 13,
  DIAMOND_ORE: 14,
  CRAFTING_TABLE: 15,
  FURNACE: 16,
  TNT: 17,
  BOOKSHELF: 18,
  BEDROCK: 19,
  GLOWSTONE: 20,
  WATER: 21,
  CHEST: 22,
  SNOW: 23,
  TORCH: 24,
  RED_WOOL: 25,
  BLUE_WOOL: 26,
  YELLOW_WOOL: 27,
  GREEN_WOOL: 28,
} as const;

export const ITEM_IDS = {
  WOODEN_PICKAXE: 101,
  STONE_PICKAXE: 102,
  IRON_PICKAXE: 103,
  DIAMOND_PICKAXE: 104,
  WOODEN_SWORD: 105,
  STONE_SWORD: 106,
  IRON_SWORD: 107,
  DIAMOND_SWORD: 108,
  WOODEN_AXE: 109,
  WOODEN_SHOVEL: 110,
  STICK: 111,
  COAL: 112,
  IRON_INGOT: 113,
  GOLD_INGOT: 114,
  DIAMOND: 115,
  APPLE: 116,
} as const;

// Texture IDs map to index in texture atlas:
// 0: Grass Top
// 1: Grass Side
// 2: Dirt
// 3: Stone
// 4: Cobblestone
// 5: Log Side
// 6: Log Top
// 7: Leaves
// 8: Planks
// 9: Sand
// 10: Glass
// 11: Brick
// 12: Coal Ore
// 13: Iron Ore
// 14: Gold Ore
// 15: Diamond Ore
// 16: Crafting Table Top
// 17: Crafting Table Side
// 18: Crafting Table Front
// 19: Furnace Front
// 20: Furnace Side
// 21: Furnace Top
// 22: TNT Top
// 23: TNT Bottom
// 24: TNT Side
// 25: Bookshelf Side
// 26: Bedrock
// 27: Glowstone
// 28: Water
// 29: Chest Top
// 30: Chest Side
// 31: Chest Front
// 32: Snow Top
// 33: Snow Side
// 34: Torch
// 35: Red Wool
// 36: Blue Wool
// 37: Yellow Wool
// 38: Green Wool

export const BLOCKS: Record<number, BlockDefinition> = {
  [BLOCK_IDS.AIR]: {
    id: 0,
    name: 'Air',
    nameRu: 'Воздух',
    hardness: 0,
    transparent: true,
    sound: 'dirt',
    textureIndices: [0, 0, 0, 0, 0, 0],
  },
  [BLOCK_IDS.GRASS]: {
    id: 1,
    name: 'Grass Block',
    nameRu: 'Блок травы',
    hardness: 0.6,
    sound: 'grass',
    // [top, bottom, front, back, left, right]
    textureIndices: [0, 2, 1, 1, 1, 1],
    drops: { id: BLOCK_IDS.DIRT, count: 1 },
  },
  [BLOCK_IDS.DIRT]: {
    id: 2,
    name: 'Dirt',
    nameRu: 'Земля',
    hardness: 0.5,
    sound: 'dirt',
    textureIndices: [2, 2, 2, 2, 2, 2],
    drops: { id: BLOCK_IDS.DIRT, count: 1 },
  },
  [BLOCK_IDS.STONE]: {
    id: 3,
    name: 'Stone',
    nameRu: 'Камень',
    hardness: 1.5,
    sound: 'stone',
    textureIndices: [3, 3, 3, 3, 3, 3],
    drops: { id: BLOCK_IDS.COBBLESTONE, count: 1 },
  },
  [BLOCK_IDS.COBBLESTONE]: {
    id: 4,
    name: 'Cobblestone',
    nameRu: 'Булыжник',
    hardness: 1.5,
    sound: 'stone',
    textureIndices: [4, 4, 4, 4, 4, 4],
    drops: { id: BLOCK_IDS.COBBLESTONE, count: 1 },
  },
  [BLOCK_IDS.OAK_LOG]: {
    id: 5,
    name: 'Oak Log',
    nameRu: 'Дубовое бревно',
    hardness: 1.2,
    sound: 'wood',
    textureIndices: [6, 6, 5, 5, 5, 5],
    drops: { id: BLOCK_IDS.OAK_LOG, count: 1 },
  },
  [BLOCK_IDS.OAK_LEAVES]: {
    id: 6,
    name: 'Oak Leaves',
    nameRu: 'Дубовые листья',
    hardness: 0.2,
    transparent: true,
    sound: 'grass',
    textureIndices: [7, 7, 7, 7, 7, 7],
    drops: { id: ITEM_IDS.APPLE, count: 1 },
  },
  [BLOCK_IDS.OAK_PLANKS]: {
    id: 7,
    name: 'Oak Planks',
    nameRu: 'Дубовые доски',
    hardness: 1.0,
    sound: 'wood',
    textureIndices: [8, 8, 8, 8, 8, 8],
    drops: { id: BLOCK_IDS.OAK_PLANKS, count: 1 },
  },
  [BLOCK_IDS.SAND]: {
    id: 8,
    name: 'Sand',
    nameRu: 'Песок',
    hardness: 0.5,
    sound: 'sand',
    textureIndices: [9, 9, 9, 9, 9, 9],
    drops: { id: BLOCK_IDS.SAND, count: 1 },
  },
  [BLOCK_IDS.GLASS]: {
    id: 9,
    name: 'Glass',
    nameRu: 'Стекло',
    hardness: 0.3,
    transparent: true,
    sound: 'glass',
    textureIndices: [10, 10, 10, 10, 10, 10],
  },
  [BLOCK_IDS.BRICK]: {
    id: 10,
    name: 'Bricks',
    nameRu: 'Кирпичи',
    hardness: 2.0,
    sound: 'stone',
    textureIndices: [11, 11, 11, 11, 11, 11],
    drops: { id: BLOCK_IDS.BRICK, count: 1 },
  },
  [BLOCK_IDS.COAL_ORE]: {
    id: 11,
    name: 'Coal Ore',
    nameRu: 'Угольная руда',
    hardness: 2.0,
    sound: 'stone',
    textureIndices: [12, 12, 12, 12, 12, 12],
    drops: { id: ITEM_IDS.COAL, count: 1 },
  },
  [BLOCK_IDS.IRON_ORE]: {
    id: 12,
    name: 'Iron Ore',
    nameRu: 'Железная руда',
    hardness: 2.5,
    sound: 'stone',
    textureIndices: [13, 13, 13, 13, 13, 13],
    drops: { id: ITEM_IDS.IRON_INGOT, count: 1 },
  },
  [BLOCK_IDS.GOLD_ORE]: {
    id: 13,
    name: 'Gold Ore',
    nameRu: 'Золотая руда',
    hardness: 2.5,
    sound: 'stone',
    textureIndices: [14, 14, 14, 14, 14, 14],
    drops: { id: ITEM_IDS.GOLD_INGOT, count: 1 },
  },
  [BLOCK_IDS.DIAMOND_ORE]: {
    id: 14,
    name: 'Diamond Ore',
    nameRu: 'Алмазная руда',
    hardness: 3.0,
    sound: 'stone',
    textureIndices: [15, 15, 15, 15, 15, 15],
    drops: { id: ITEM_IDS.DIAMOND, count: 1 },
  },
  [BLOCK_IDS.CRAFTING_TABLE]: {
    id: 15,
    name: 'Crafting Table',
    nameRu: 'Верстак',
    hardness: 1.2,
    sound: 'wood',
    // top, bottom, front, back, left, right
    textureIndices: [16, 8, 18, 17, 17, 17],
    drops: { id: BLOCK_IDS.CRAFTING_TABLE, count: 1 },
  },
  [BLOCK_IDS.FURNACE]: {
    id: 16,
    name: 'Furnace',
    nameRu: 'Печь',
    hardness: 2.0,
    sound: 'stone',
    textureIndices: [21, 21, 19, 20, 20, 20],
    drops: { id: BLOCK_IDS.FURNACE, count: 1 },
  },
  [BLOCK_IDS.TNT]: {
    id: 17,
    name: 'TNT',
    nameRu: 'Динамит',
    hardness: 0.1,
    sound: 'grass',
    textureIndices: [22, 23, 24, 24, 24, 24],
    drops: { id: BLOCK_IDS.TNT, count: 1 },
  },
  [BLOCK_IDS.BOOKSHELF]: {
    id: 18,
    name: 'Bookshelf',
    nameRu: 'Книжная полка',
    hardness: 1.0,
    sound: 'wood',
    textureIndices: [8, 8, 25, 25, 25, 25],
    drops: { id: BLOCK_IDS.BOOKSHELF, count: 1 },
  },
  [BLOCK_IDS.BEDROCK]: {
    id: 19,
    name: 'Bedrock',
    nameRu: 'Бедрок',
    hardness: 999999, // Unbreakable
    sound: 'stone',
    textureIndices: [26, 26, 26, 26, 26, 26],
  },
  [BLOCK_IDS.GLOWSTONE]: {
    id: 20,
    name: 'Glowstone',
    nameRu: 'Светокамень',
    hardness: 0.5,
    lightLevel: 15,
    sound: 'glass',
    textureIndices: [27, 27, 27, 27, 27, 27],
    drops: { id: BLOCK_IDS.GLOWSTONE, count: 1 },
  },
  [BLOCK_IDS.WATER]: {
    id: 21,
    name: 'Water',
    nameRu: 'Вода',
    hardness: 999999,
    transparent: true,
    sound: 'water',
    textureIndices: [28, 28, 28, 28, 28, 28],
  },
  [BLOCK_IDS.CHEST]: {
    id: 22,
    name: 'Chest',
    nameRu: 'Сундук',
    hardness: 1.2,
    sound: 'wood',
    textureIndices: [29, 29, 31, 30, 30, 30],
    drops: { id: BLOCK_IDS.CHEST, count: 1 },
  },
  [BLOCK_IDS.SNOW]: {
    id: 23,
    name: 'Snow Block',
    nameRu: 'Снег',
    hardness: 0.4,
    sound: 'snow',
    textureIndices: [32, 2, 33, 33, 33, 33],
    drops: { id: BLOCK_IDS.SNOW, count: 1 },
  },
  [BLOCK_IDS.TORCH]: {
    id: 24,
    name: 'Torch',
    nameRu: 'Факел',
    hardness: 0.05,
    transparent: true,
    lightLevel: 14,
    sound: 'wood',
    textureIndices: [34, 34, 34, 34, 34, 34],
    drops: { id: BLOCK_IDS.TORCH, count: 1 },
  },
  [BLOCK_IDS.RED_WOOL]: {
    id: 25,
    name: 'Red Wool',
    nameRu: 'Красная шерсть',
    hardness: 0.8,
    sound: 'wool',
    textureIndices: [35, 35, 35, 35, 35, 35],
    drops: { id: BLOCK_IDS.RED_WOOL, count: 1 },
  },
  [BLOCK_IDS.BLUE_WOOL]: {
    id: 26,
    name: 'Blue Wool',
    nameRu: 'Синяя шерсть',
    hardness: 0.8,
    sound: 'wool',
    textureIndices: [36, 36, 36, 36, 36, 36],
    drops: { id: BLOCK_IDS.BLUE_WOOL, count: 1 },
  },
  [BLOCK_IDS.YELLOW_WOOL]: {
    id: 27,
    name: 'Yellow Wool',
    nameRu: 'Жёлтая шерсть',
    hardness: 0.8,
    sound: 'wool',
    textureIndices: [37, 37, 37, 37, 37, 37],
    drops: { id: BLOCK_IDS.YELLOW_WOOL, count: 1 },
  },
  [BLOCK_IDS.GREEN_WOOL]: {
    id: 28,
    name: 'Green Wool',
    nameRu: 'Зелёная шерсть',
    hardness: 0.8,
    sound: 'wool',
    textureIndices: [38, 38, 38, 38, 38, 38],
    drops: { id: BLOCK_IDS.GREEN_WOOL, count: 1 },
  },
};

export interface ItemInfo {
  id: number;
  name: string;
  nameRu: string;
  isTool?: boolean;
  damage?: number;
  miningSpeedMultiplier?: number;
  effectiveOn?: ('wood' | 'stone' | 'dirt' | 'sand')[];
  icon: string; // canvas generated data uri
}

export const ITEMS: Record<number, { name: string; nameRu: string; isTool?: boolean; damage?: number; miningSpeed?: number }> = {
  [ITEM_IDS.WOODEN_PICKAXE]: { name: 'Wooden Pickaxe', nameRu: 'Деревянная кирка', isTool: true, damage: 2, miningSpeed: 2 },
  [ITEM_IDS.STONE_PICKAXE]: { name: 'Stone Pickaxe', nameRu: 'Каменная кирка', isTool: true, damage: 3, miningSpeed: 4 },
  [ITEM_IDS.IRON_PICKAXE]: { name: 'Iron Pickaxe', nameRu: 'Железная кирка', isTool: true, damage: 4, miningSpeed: 6 },
  [ITEM_IDS.DIAMOND_PICKAXE]: { name: 'Diamond Pickaxe', nameRu: 'Алмазная кирка', isTool: true, damage: 5, miningSpeed: 8 },
  [ITEM_IDS.WOODEN_SWORD]: { name: 'Wooden Sword', nameRu: 'Деревянный меч', isTool: true, damage: 4 },
  [ITEM_IDS.STONE_SWORD]: { name: 'Stone Sword', nameRu: 'Каменный меч', isTool: true, damage: 5 },
  [ITEM_IDS.IRON_SWORD]: { name: 'Iron Sword', nameRu: 'Железный меч', isTool: true, damage: 6 },
  [ITEM_IDS.DIAMOND_SWORD]: { name: 'Diamond Sword', nameRu: 'Алмазный меч', isTool: true, damage: 7 },
  [ITEM_IDS.WOODEN_AXE]: { name: 'Wooden Axe', nameRu: 'Деревянный топор', isTool: true, damage: 3, miningSpeed: 2 },
  [ITEM_IDS.WOODEN_SHOVEL]: { name: 'Wooden Shovel', nameRu: 'Деревянная лопата', isTool: true, damage: 2, miningSpeed: 2 },
  [ITEM_IDS.STICK]: { name: 'Stick', nameRu: 'Палка' },
  [ITEM_IDS.COAL]: { name: 'Coal', nameRu: 'Уголь' },
  [ITEM_IDS.IRON_INGOT]: { name: 'Iron Ingot', nameRu: 'Железный слиток' },
  [ITEM_IDS.GOLD_INGOT]: { name: 'Gold Ingot', nameRu: 'Золотой слиток' },
  [ITEM_IDS.DIAMOND]: { name: 'Diamond', nameRu: 'Алмаз' },
  [ITEM_IDS.APPLE]: { name: 'Apple', nameRu: 'Яблоко' },
};

export function getItemOrBlockName(id: number, lang: 'ru' | 'en' = 'ru'): string {
  if (id in BLOCKS) {
    return lang === 'ru' ? BLOCKS[id].nameRu : BLOCKS[id].name;
  }
  if (id in ITEMS) {
    return lang === 'ru' ? ITEMS[id].nameRu : ITEMS[id].name;
  }
  return 'Unknown';
}
