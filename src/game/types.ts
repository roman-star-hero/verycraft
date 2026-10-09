export type GameMode = 'survival' | 'creative';

export interface BlockDefinition {
  id: number;
  name: string;
  nameRu: string;
  hardness: number; // break time in seconds (0 = instant)
  transparent?: boolean;
  lightLevel?: number;
  sound: 'grass' | 'dirt' | 'stone' | 'wood' | 'sand' | 'glass' | 'wool' | 'snow' | 'water' | 'metal';
  // Face texture atlas indices [top, bottom, front, back, left, right] or single index
  textureIndices: [number, number, number, number, number, number];
  drops?: { id: number; count: number };
}

export interface ItemStack {
  id: number;
  count: number;
  type?: 'block' | 'tool' | 'item';
  durability?: number;
  maxDurability?: number;
}

export type InventorySlots = (ItemStack | null)[];

export interface PlayerState {
  x: number;
  y: number;
  z: number;
  yaw: number;
  pitch: number;
  vx: number;
  vy: number;
  vz: number;
  onGround: boolean;
  inWater: boolean;
  isFlying: boolean;
  isSprinting: boolean;
  isSneaking: boolean;
  health: number; // max 20 (10 hearts)
  maxHealth: number;
  hunger: number; // max 20 (10 drumsticks)
  oxygen: number; // max 20 (underwater)
  selectedSlot: number; // 0-8
  gameMode: GameMode;
}

export interface RaycastHit {
  blockX: number;
  blockY: number;
  blockZ: number;
  normalX: number;
  normalY: number;
  normalZ: number;
  faceIndex: number;
  distance: number;
}

export interface CraftingRecipe {
  id: string;
  name: string;
  nameRu: string;
  width: number;
  height: number;
  grid: (number | null)[]; // 2x2 or 3x3
  result: ItemStack;
  shapeless?: boolean;
}

export interface WorldSettings {
  name: string;
  seed: number;
  generator: 'standard' | 'flat' | 'mountains' | 'islands';
  renderDistance: number; // in chunks radius (e.g. 2, 3, 4)
  fov: number; // default 75
  mouseSensitivity: number; // default 1.0
  soundVolume: number; // 0 to 1
  dayLengthMinutes: number; // e.g. 10 minutes
  timeSpeed: number; // multiplier 1x, 2x, 0 (freeze)
}
