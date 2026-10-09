import { BLOCK_IDS } from './blocks.ts';
import { PerlinNoise } from './noise.ts';

export type BiomeId =
  | 'plains'
  | 'forest'
  | 'desert'
  | 'snow'
  | 'mountains'
  | 'snowy_mountains'
  | 'swamp'
  | 'beach';

export interface BiomeDefinition {
  id: BiomeId;
  name: string;
  nameRu: string;
  color: string;
  badgeBg: string;
  surfaceBlock: number;
  subsurfaceBlock: number;
  treeDensity: number;
  treeTypes: ('oak' | 'birch' | 'pine' | 'swamp')[];
  flowerDensity: number;
  cactusDensity: number;
  hasIce: boolean;
  fogColor?: string;
}

export const BIOMES: Record<BiomeId, BiomeDefinition> = {
  plains: {
    id: 'plains',
    name: 'Plains',
    nameRu: 'Равнины',
    color: '#7cbd38',
    badgeBg: 'bg-lime-600',
    surfaceBlock: BLOCK_IDS.GRASS,
    subsurfaceBlock: BLOCK_IDS.DIRT,
    treeDensity: 0.01,
    treeTypes: ['oak'],
    flowerDensity: 0.07,
    cactusDensity: 0,
    hasIce: false,
  },
  forest: {
    id: 'forest',
    name: 'Birch & Oak Forest',
    nameRu: 'Лес (Дуб и Берёза)',
    color: '#498c28',
    badgeBg: 'bg-emerald-700',
    surfaceBlock: BLOCK_IDS.GRASS,
    subsurfaceBlock: BLOCK_IDS.DIRT,
    treeDensity: 0.075,
    treeTypes: ['oak', 'birch'],
    flowerDensity: 0.03,
    cactusDensity: 0,
    hasIce: false,
  },
  desert: {
    id: 'desert',
    name: 'Desert',
    nameRu: 'Пустыня',
    color: '#e2cf86',
    badgeBg: 'bg-amber-600',
    surfaceBlock: BLOCK_IDS.SAND,
    subsurfaceBlock: BLOCK_IDS.SANDSTONE,
    treeDensity: 0,
    treeTypes: [],
    flowerDensity: 0,
    cactusDensity: 0.025,
    hasIce: false,
  },
  snow: {
    id: 'snow',
    name: 'Snowy Tundra',
    nameRu: 'Заснеженная тундра',
    color: '#d6edfa',
    badgeBg: 'bg-sky-700',
    surfaceBlock: BLOCK_IDS.SNOW,
    subsurfaceBlock: BLOCK_IDS.DIRT,
    treeDensity: 0.02,
    treeTypes: ['pine'],
    flowerDensity: 0,
    cactusDensity: 0,
    hasIce: true,
  },
  mountains: {
    id: 'mountains',
    name: 'Extreme Hills',
    nameRu: 'Экстремальные горы',
    color: '#8b8f94',
    badgeBg: 'bg-stone-600',
    surfaceBlock: BLOCK_IDS.STONE,
    subsurfaceBlock: BLOCK_IDS.STONE,
    treeDensity: 0.01,
    treeTypes: ['oak', 'pine'],
    flowerDensity: 0.01,
    cactusDensity: 0,
    hasIce: false,
  },
  snowy_mountains: {
    id: 'snowy_mountains',
    name: 'Snowy Peaks',
    nameRu: 'Снежные горные пики',
    color: '#eef5fc',
    badgeBg: 'bg-blue-800',
    surfaceBlock: BLOCK_IDS.SNOW,
    subsurfaceBlock: BLOCK_IDS.STONE,
    treeDensity: 0.005,
    treeTypes: ['pine'],
    flowerDensity: 0,
    cactusDensity: 0,
    hasIce: true,
  },
  swamp: {
    id: 'swamp',
    name: 'Swamp',
    nameRu: 'Болото',
    color: '#5b6b47',
    badgeBg: 'bg-teal-800',
    surfaceBlock: BLOCK_IDS.GRASS,
    subsurfaceBlock: BLOCK_IDS.DIRT,
    treeDensity: 0.04,
    treeTypes: ['swamp', 'oak'],
    flowerDensity: 0.04,
    cactusDensity: 0,
    hasIce: false,
  },
  beach: {
    id: 'beach',
    name: 'Beach',
    nameRu: 'Песчаный пляж',
    color: '#e7d79b',
    badgeBg: 'bg-yellow-600',
    surfaceBlock: BLOCK_IDS.SAND,
    subsurfaceBlock: BLOCK_IDS.SAND,
    treeDensity: 0.003,
    treeTypes: ['oak'],
    flowerDensity: 0,
    cactusDensity: 0,
    hasIce: false,
  },
};

export const SEA_LEVEL = 10;

export interface BiomeSample {
  biome: BiomeDefinition;
  height: number;
  temperature: number;
  moisture: number;
  mountainFactor: number;
  isBeach: boolean;
}

export function sampleWorldBiome(
  noise: PerlinNoise,
  gx: number,
  gz: number,
  generator: 'standard' | 'flat' | 'mountains' | 'islands' = 'standard'
): BiomeSample {
  if (generator === 'flat') {
    return {
      biome: BIOMES.plains,
      height: 3,
      temperature: 0.5,
      moisture: 0.5,
      mountainFactor: 0,
      isBeach: false,
    };
  }

  // Sample smooth climate maps
  const tempNoise = noise.fbm2D(gx * 0.008 + 234.5, gz * 0.008 + 567.8, 2);
  const moistNoise = noise.fbm2D(gx * 0.008 - 789.1, gz * 0.008 + 123.4, 2);
  const mountainNoise = noise.fbm2D(gx * 0.013 + 811.2, gz * 0.013 - 432.1, 2);
  const baseElevation = noise.fbm2D(gx * 0.024, gz * 0.024, 3);
  const detail = noise.noise2D(gx * 0.07, gz * 0.07) * 0.15;

  let mountainFactor = Math.max(0, Math.min(1, (mountainNoise - 0.12) / 0.52));

  let rawHeight = 13;

  if (generator === 'mountains') {
    mountainFactor = 1.0;
    const n = noise.fbm2D(gx * 0.025, gz * 0.025, 4);
    rawHeight = 10 + n * 18;
  } else if (generator === 'islands') {
    const distFromCenter = Math.sqrt(gx * gx + gz * gz);
    const islandMask = Math.max(0, 1 - distFromCenter / 45);
    const n = noise.fbm2D(gx * 0.04, gz * 0.04, 3);
    rawHeight = 8 + n * 14 * islandMask;
  } else {
    // Standard terrain with biome-modulated elevation
    const normalBase = 12;
    const normalScale = 5.2;
    const mountainBase = 17.5;
    const mountainScale = 11.5;

    const base = normalBase * (1 - mountainFactor) + mountainBase * mountainFactor;
    const scale = normalScale * (1 - mountainFactor) + mountainScale * mountainFactor;

    rawHeight = base + (baseElevation + detail) * scale;

    // Swamp lowlands depression
    if (moistNoise > 0.32 && tempNoise > -0.15 && mountainFactor < 0.2) {
      const swampFactor = Math.min(1, (moistNoise - 0.32) * 3.5) * (1 - mountainFactor / 0.2);
      rawHeight = rawHeight * (1 - swampFactor * 0.65) + 10.4 * (swampFactor * 0.65);
    }
  }

  const height = Math.max(1, Math.min(27, Math.floor(rawHeight)));
  const isCoast = height <= SEA_LEVEL + 1;

  // Determine active biome
  let biome: BiomeDefinition;

  if (mountainFactor > 0.55 || height >= 22) {
    biome = tempNoise < -0.1 ? BIOMES.snowy_mountains : BIOMES.mountains;
  } else if (tempNoise < -0.28) {
    biome = BIOMES.snow;
  } else if (tempNoise > 0.32 && moistNoise < 0.08) {
    biome = BIOMES.desert;
  } else if (isCoast && tempNoise > -0.2 && moistNoise < 0.3) {
    biome = BIOMES.beach;
  } else if (moistNoise > 0.34 && height <= 12) {
    biome = BIOMES.swamp;
  } else if (moistNoise > 0.1) {
    biome = BIOMES.forest;
  } else {
    biome = BIOMES.plains;
  }

  return {
    biome,
    height,
    temperature: tempNoise,
    moisture: moistNoise,
    mountainFactor,
    isBeach: biome.id === 'beach',
  };
}
