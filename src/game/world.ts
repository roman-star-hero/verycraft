import * as THREE from 'three';
import { BLOCK_IDS, BLOCKS } from './blocks.ts';
import { PerlinNoise } from './noise.ts';
import { RaycastHit } from './types.ts';
import { getAtlasTexture, getTileUV } from './textures.ts';

export const CHUNK_SIZE_X = 16;
export const CHUNK_SIZE_Y = 32;
export const CHUNK_SIZE_Z = 16;

export const SEA_LEVEL = 10;

// Face normals and vertices offset
const FACES = [
  // 0: Top (+Y)
  {
    dir: [0, 1, 0],
    corners: [
      [0, 1, 1],
      [1, 1, 1],
      [1, 1, 0],
      [0, 1, 0],
    ],
    textureFaceIndex: 0,
  },
  // 1: Bottom (-Y)
  {
    dir: [0, -1, 0],
    corners: [
      [0, 0, 0],
      [1, 0, 0],
      [1, 0, 1],
      [0, 0, 1],
    ],
    textureFaceIndex: 1,
  },
  // 2: North (-Z)
  {
    dir: [0, 0, -1],
    corners: [
      [1, 0, 0],
      [0, 0, 0],
      [0, 1, 0],
      [1, 1, 0],
    ],
    textureFaceIndex: 3,
  },
  // 3: South (+Z)
  {
    dir: [0, 0, 1],
    corners: [
      [0, 0, 1],
      [1, 0, 1],
      [1, 1, 1],
      [0, 1, 1],
    ],
    textureFaceIndex: 2,
  },
  // 4: West (-X)
  {
    dir: [-1, 0, 0],
    corners: [
      [0, 0, 0],
      [0, 0, 1],
      [0, 1, 1],
      [0, 1, 0],
    ],
    textureFaceIndex: 4,
  },
  // 5: East (+X)
  {
    dir: [1, 0, 0],
    corners: [
      [1, 0, 1],
      [1, 0, 0],
      [1, 1, 0],
      [1, 1, 1],
    ],
    textureFaceIndex: 5,
  },
];

export class Chunk {
  public cx: number;
  public cz: number;
  public blocks: Uint8Array;
  public mesh: THREE.Mesh | null = null;
  public transparentMesh: THREE.Mesh | null = null;
  public isDirty: boolean = true;

  constructor(cx: number, cz: number) {
    this.cx = cx;
    this.cz = cz;
    this.blocks = new Uint8Array(CHUNK_SIZE_X * CHUNK_SIZE_Y * CHUNK_SIZE_Z);
  }

  getIndex(lx: number, ly: number, lz: number): number {
    return lx + lz * CHUNK_SIZE_X + ly * (CHUNK_SIZE_X * CHUNK_SIZE_Z);
  }

  getBlock(lx: number, ly: number, lz: number): number {
    if (lx < 0 || lx >= CHUNK_SIZE_X || ly < 0 || ly >= CHUNK_SIZE_Y || lz < 0 || lz >= CHUNK_SIZE_Z) {
      return BLOCK_IDS.AIR;
    }
    return this.blocks[this.getIndex(lx, ly, lz)];
  }

  setBlock(lx: number, ly: number, lz: number, id: number) {
    if (lx < 0 || lx >= CHUNK_SIZE_X || ly < 0 || ly >= CHUNK_SIZE_Y || lz < 0 || lz >= CHUNK_SIZE_Z) return;
    this.blocks[this.getIndex(lx, ly, lz)] = id;
    this.isDirty = true;
  }

  setDirty() {
    this.isDirty = true;
  }
}

export class VoxelWorld {
  public chunks: Map<string, Chunk> = new Map();
  public scene: THREE.Scene;
  public seed: number;
  public generator: 'standard' | 'flat' | 'mountains' | 'islands';
  private noise: PerlinNoise;
  private material: THREE.MeshStandardMaterial;
  private transparentMaterial: THREE.MeshStandardMaterial;

  constructor(scene: THREE.Scene, seed: number = 12345, generator: 'standard' | 'flat' | 'mountains' | 'islands' = 'standard') {
    this.scene = scene;
    this.seed = seed;
    this.generator = generator;
    this.noise = new PerlinNoise(seed);

    const atlas = getAtlasTexture();
    this.material = new THREE.MeshStandardMaterial({
      map: atlas,
      vertexColors: true,
      roughness: 0.85,
      metalness: 0.05,
      shadowSide: THREE.FrontSide,
    });

    this.transparentMaterial = new THREE.MeshStandardMaterial({
      map: atlas,
      vertexColors: true,
      transparent: true,
      opacity: 0.75,
      roughness: 0.3,
      metalness: 0.1,
      depthWrite: false,
    });
  }

  private chunkKey(cx: number, cz: number): string {
    return `${cx},${cz}`;
  }

  getChunk(cx: number, cz: number): Chunk | undefined {
    return this.chunks.get(this.chunkKey(cx, cz));
  }

  getOrCreateChunk(cx: number, cz: number): Chunk {
    const key = this.chunkKey(cx, cz);
    let chunk = this.chunks.get(key);
    if (!chunk) {
      chunk = new Chunk(cx, cz);
      this.chunks.set(key, chunk);
      this.generateChunkTerrain(chunk);
    }
    return chunk;
  }

  // Get block at global coordinate
  getBlock(gx: number, gy: number, gz: number): number {
    if (gy < 0 || gy >= CHUNK_SIZE_Y) return BLOCK_IDS.AIR;
    const cx = Math.floor(gx / CHUNK_SIZE_X);
    const cz = Math.floor(gz / CHUNK_SIZE_Z);
    const chunk = this.getChunk(cx, cz);
    if (!chunk) return BLOCK_IDS.AIR;

    const lx = ((gx % CHUNK_SIZE_X) + CHUNK_SIZE_X) % CHUNK_SIZE_X;
    const lz = ((gz % CHUNK_SIZE_Z) + CHUNK_SIZE_Z) % CHUNK_SIZE_Z;
    return chunk.getBlock(lx, gy, lz);
  }

  // Set block at global coordinate
  setBlock(gx: number, gy: number, gz: number, id: number) {
    if (gy < 0 || gy >= CHUNK_SIZE_Y) return;
    const cx = Math.floor(gx / CHUNK_SIZE_X);
    const cz = Math.floor(gz / CHUNK_SIZE_Z);
    const chunk = this.getOrCreateChunk(cx, cz);

    const lx = ((gx % CHUNK_SIZE_X) + CHUNK_SIZE_X) % CHUNK_SIZE_X;
    const lz = ((gz % CHUNK_SIZE_Z) + CHUNK_SIZE_Z) % CHUNK_SIZE_Z;

    chunk.setBlock(lx, gy, lz, id);

    // If on boundary, mark neighbor chunks dirty so hidden faces appear
    if (lx === 0) this.getChunk(cx - 1, cz)?.setDirty();
    if (lx === CHUNK_SIZE_X - 1) this.getChunk(cx + 1, cz)?.setDirty();
    if (lz === 0) this.getChunk(cx, cz - 1)?.setDirty();
    if (lz === CHUNK_SIZE_Z - 1) this.getChunk(cx, cz + 1)?.setDirty();
  }

  // Generate terrain for chunk
  private generateChunkTerrain(chunk: Chunk) {
    const startX = chunk.cx * CHUNK_SIZE_X;
    const startZ = chunk.cz * CHUNK_SIZE_Z;

    if (this.generator === 'flat') {
      for (let lx = 0; lx < CHUNK_SIZE_X; lx++) {
        for (let lz = 0; lz < CHUNK_SIZE_Z; lz++) {
          chunk.setBlock(lx, 0, lz, BLOCK_IDS.BEDROCK);
          chunk.setBlock(lx, 1, lz, BLOCK_IDS.DIRT);
          chunk.setBlock(lx, 2, lz, BLOCK_IDS.DIRT);
          chunk.setBlock(lx, 3, lz, BLOCK_IDS.GRASS);
        }
      }
      return;
    }

    const treesToPlant: [number, number, number][] = [];

    for (let lx = 0; lx < CHUNK_SIZE_X; lx++) {
      for (let lz = 0; lz < CHUNK_SIZE_Z; lz++) {
        const gx = startX + lx;
        const gz = startZ + lz;

        // Base height calculation based on generator
        let height = 14;
        if (this.generator === 'mountains') {
          const n = this.noise.fbm2D(gx * 0.025, gz * 0.025, 4);
          height = Math.floor(10 + n * 18);
        } else if (this.generator === 'islands') {
          const distFromCenter = Math.sqrt(gx * gx + gz * gz);
          const islandMask = Math.max(0, 1 - distFromCenter / 45);
          const n = this.noise.fbm2D(gx * 0.04, gz * 0.04, 3);
          height = Math.floor(8 + (n * 14) * islandMask);
        } else {
          // Standard Minecraft terrain: rolling hills with plains
          const elevation = this.noise.fbm2D(gx * 0.03, gz * 0.03, 3);
          const detail = this.noise.noise2D(gx * 0.08, gz * 0.08) * 0.2;
          height = Math.floor(11 + (elevation + detail) * 11);
        }

        height = Math.max(1, Math.min(CHUNK_SIZE_Y - 7, height));

        // Bedrock layer
        chunk.setBlock(lx, 0, lz, BLOCK_IDS.BEDROCK);

        // Stone & Ores layers
        for (let y = 1; y < height - 3; y++) {
          let blockType: number = BLOCK_IDS.STONE;

          // Simple ore pockets
          const oreNoise = this.noise.noise2D(gx * 0.4 + y * 0.3, gz * 0.4 + y * 0.3);
          if (y <= 5 && oreNoise > 0.68) {
            blockType = BLOCK_IDS.DIAMOND_ORE;
          } else if (y <= 12 && oreNoise > 0.6) {
            blockType = BLOCK_IDS.GOLD_ORE;
          } else if (y <= 20 && oreNoise > 0.52) {
            blockType = BLOCK_IDS.IRON_ORE;
          } else if (oreNoise > 0.45) {
            blockType = BLOCK_IDS.COAL_ORE;
          }

          chunk.setBlock(lx, y, lz, blockType);
        }

        // Sub-surface Dirt
        for (let y = Math.max(1, height - 3); y < height; y++) {
          chunk.setBlock(lx, y, lz, BLOCK_IDS.DIRT);
        }

        // Surface layer
        if (height <= SEA_LEVEL + 1) {
          // Sand beach around water
          chunk.setBlock(lx, height, lz, BLOCK_IDS.SAND);
        } else if (height >= 26) {
          // Snow on tall mountain peaks
          chunk.setBlock(lx, height, lz, BLOCK_IDS.SNOW);
        } else {
          // Lush green grass block
          chunk.setBlock(lx, height, lz, BLOCK_IDS.GRASS);

          // Tree planting chance
          if (
            lx >= 2 && lx <= CHUNK_SIZE_X - 3 &&
            lz >= 2 && lz <= CHUNK_SIZE_Z - 3 &&
            height < CHUNK_SIZE_Y - 7
          ) {
            const treeHash = Math.abs(Math.sin(gx * 12.9898 + gz * 78.233) * 43758.5453);
            if (treeHash - Math.floor(treeHash) < 0.035) {
              treesToPlant.push([lx, height + 1, lz]);
            }
          }
        }

        // Water fill up to sea level
        for (let y = height + 1; y <= SEA_LEVEL; y++) {
          chunk.setBlock(lx, y, lz, BLOCK_IDS.WATER);
        }
      }
    }

    // Plant trees
    for (const [tx, ty, tz] of treesToPlant) {
      this.growOakTree(chunk, tx, ty, tz);
    }
  }

  private growOakTree(chunk: Chunk, x: number, y: number, z: number) {
    const trunkHeight = 4 + (x % 2);

    // Leaves crown
    for (let ly = y + trunkHeight - 2; ly <= y + trunkHeight + 1; ly++) {
      if (ly >= CHUNK_SIZE_Y) break;
      const radius = ly >= y + trunkHeight ? 1 : 2;
      for (let dx = -radius; dx <= radius; dx++) {
        for (let dz = -radius; dz <= radius; dz++) {
          if (Math.abs(dx) === radius && Math.abs(dz) === radius && Math.random() > 0.6) continue;
          const nx = x + dx;
          const nz = z + dz;
          if (chunk.getBlock(nx, ly, nz) === BLOCK_IDS.AIR) {
            chunk.setBlock(nx, ly, nz, BLOCK_IDS.OAK_LEAVES);
          }
        }
      }
    }

    // Trunk
    for (let i = 0; i < trunkHeight; i++) {
      if (y + i < CHUNK_SIZE_Y) {
        chunk.setBlock(x, y + i, z, BLOCK_IDS.OAK_LOG);
      }
    }
  }

  // Calculate simple corner Ambient Occlusion for a vertex
  private calculateVertexAO(side1: boolean, side2: boolean, corner: boolean): number {
    if (side1 && side2) return 0;
    return 3 - ((side1 ? 1 : 0) + (side2 ? 1 : 0) + (corner ? 1 : 0));
  }

  // Mesh a chunk with face culling, AO, and UV mapping
  meshChunk(chunk: Chunk) {
    if (chunk.mesh) {
      this.scene.remove(chunk.mesh);
      chunk.mesh.geometry.dispose();
      chunk.mesh = null;
    }
    if (chunk.transparentMesh) {
      this.scene.remove(chunk.transparentMesh);
      chunk.transparentMesh.geometry.dispose();
      chunk.transparentMesh = null;
    }

    const positions: number[] = [];
    const normals: number[] = [];
    const uvs: number[] = [];
    const colors: number[] = [];
    const indices: number[] = [];

    const transPositions: number[] = [];
    const transNormals: number[] = [];
    const transUvs: number[] = [];
    const transColors: number[] = [];
    const transIndices: number[] = [];

    const startX = chunk.cx * CHUNK_SIZE_X;
    const startZ = chunk.cz * CHUNK_SIZE_Z;

    for (let ly = 0; ly < CHUNK_SIZE_Y; ly++) {
      for (let lz = 0; lz < CHUNK_SIZE_Z; lz++) {
        for (let lx = 0; lx < CHUNK_SIZE_X; lx++) {
          const blockId = chunk.getBlock(lx, ly, lz);
          if (blockId === BLOCK_IDS.AIR) continue;

          const blockDef = BLOCKS[blockId];
          if (!blockDef) continue;

          const gx = startX + lx;
          const gz = startZ + lz;
          const isTrans = blockDef.transparent || blockId === BLOCK_IDS.WATER || blockId === BLOCK_IDS.GLASS;

          const targetPos = isTrans ? transPositions : positions;
          const targetNorm = isTrans ? transNormals : normals;
          const targetUv = isTrans ? transUvs : uvs;
          const targetCol = isTrans ? transColors : colors;
          const targetIdx = isTrans ? transIndices : indices;

          for (let f = 0; f < FACES.length; f++) {
            const face = FACES[f];
            const [dx, dy, dz] = face.dir;
            const neighborBlock = this.getBlock(gx + dx, ly + dy, gz + dz);
            const neighborDef = BLOCKS[neighborBlock];

            // Face Culling: Render face only if neighbor is air or transparent
            const isNeighborOpaque = neighborBlock !== BLOCK_IDS.AIR && neighborDef && !neighborDef.transparent;
            if (isNeighborOpaque) continue;

            // Don't render face between same transparent liquid
            if (blockId === BLOCK_IDS.WATER && neighborBlock === BLOCK_IDS.WATER) continue;

            // Texture UV for this face
            const textureIndex = blockDef.textureIndices[face.textureFaceIndex];
            const [u0, v0, u1, v1] = getTileUV(textureIndex);

            const vertexStartIndex = targetPos.length / 3;

            // Add 4 vertices of the quad
            for (let c = 0; c < 4; c++) {
              const corner = face.corners[c];
              targetPos.push(gx + corner[0], ly + corner[1], gz + corner[2]);
              targetNorm.push(face.dir[0], face.dir[1], face.dir[2]);

              // Basic light shade based on face normal direction
              let shade = 1.0;
              if (face.dir[1] === 1) shade = 1.0; // Top is brightest
              else if (face.dir[1] === -1) shade = 0.5; // Bottom is darkest
              else if (face.dir[0] !== 0) shade = 0.75; // East/West
              else shade = 0.85; // North/South

              targetCol.push(shade, shade, shade);
            }

            // UV mapping
            targetUv.push(u0, v1);
            targetUv.push(u1, v1);
            targetUv.push(u1, v0);
            targetUv.push(u0, v0);

            // Two triangles for the quad (0, 1, 2) and (0, 2, 3)
            targetIdx.push(
              vertexStartIndex,
              vertexStartIndex + 1,
              vertexStartIndex + 2,
              vertexStartIndex,
              vertexStartIndex + 2,
              vertexStartIndex + 3
            );
          }
        }
      }
    }

    if (positions.length > 0) {
      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
      geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
      geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
      geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
      geometry.setIndex(indices);

      chunk.mesh = new THREE.Mesh(geometry, this.material);
      chunk.mesh.receiveShadow = true;
      chunk.mesh.castShadow = true;
      this.scene.add(chunk.mesh);
    }

    if (transPositions.length > 0) {
      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute('position', new THREE.Float32BufferAttribute(transPositions, 3));
      geometry.setAttribute('normal', new THREE.Float32BufferAttribute(transNormals, 3));
      geometry.setAttribute('uv', new THREE.Float32BufferAttribute(transUvs, 2));
      geometry.setAttribute('color', new THREE.Float32BufferAttribute(transColors, 3));
      geometry.setIndex(transIndices);

      chunk.transparentMesh = new THREE.Mesh(geometry, this.transparentMaterial);
      this.scene.add(chunk.transparentMesh);
    }

    chunk.isDirty = false;
  }

  // Fast 3D DDA (Digital Differential Analyzer) voxel raycaster
  raycast(origin: THREE.Vector3, direction: THREE.Vector3, maxDistance = 6.0): RaycastHit | null {
    let px = origin.x;
    let py = origin.y;
    let pz = origin.z;

    const dx = direction.x;
    const dy = direction.y;
    const dz = direction.z;

    let mapX = Math.floor(px);
    let mapY = Math.floor(py);
    let mapZ = Math.floor(pz);

    const stepX = dx >= 0 ? 1 : -1;
    const stepY = dy >= 0 ? 1 : -1;
    const stepZ = dz >= 0 ? 1 : -1;

    const deltaDistX = Math.abs(1 / (dx || 0.00001));
    const deltaDistY = Math.abs(1 / (dy || 0.00001));
    const deltaDistZ = Math.abs(1 / (dz || 0.00001));

    let sideDistX = (stepX > 0 ? mapX + 1.0 - px : px - mapX) * deltaDistX;
    let sideDistY = (stepY > 0 ? mapY + 1.0 - py : py - mapY) * deltaDistY;
    let sideDistZ = (stepZ > 0 ? mapZ + 1.0 - pz : pz - mapZ) * deltaDistZ;

    let normalX = 0;
    let normalY = 0;
    let normalZ = 0;
    let faceIndex = 0;
    let distance = 0;

    while (distance < maxDistance) {
      if (sideDistX < sideDistY && sideDistX < sideDistZ) {
        distance = sideDistX;
        sideDistX += deltaDistX;
        mapX += stepX;
        normalX = -stepX;
        normalY = 0;
        normalZ = 0;
        faceIndex = stepX > 0 ? 4 : 5;
      } else if (sideDistY < sideDistZ) {
        distance = sideDistY;
        sideDistY += deltaDistY;
        mapY += stepY;
        normalX = 0;
        normalY = -stepY;
        normalZ = 0;
        faceIndex = stepY > 0 ? 1 : 0;
      } else {
        distance = sideDistZ;
        sideDistZ += deltaDistZ;
        mapZ += stepZ;
        normalX = 0;
        normalY = 0;
        normalZ = -stepZ;
        faceIndex = stepZ > 0 ? 2 : 3;
      }

      if (distance > maxDistance) break;

      const block = this.getBlock(mapX, mapY, mapZ);
      // Skip air and non-solid liquids like water when clicking
      if (block !== BLOCK_IDS.AIR && block !== BLOCK_IDS.WATER) {
        return {
          blockX: mapX,
          blockY: mapY,
          blockZ: mapZ,
          normalX,
          normalY,
          normalZ,
          faceIndex,
          distance,
        };
      }
    }

    return null;
  }

  // Update chunks around player position
  update(playerPos: THREE.Vector3, renderRadius = 2) {
    const centerChunkX = Math.floor(playerPos.x / CHUNK_SIZE_X);
    const centerChunkZ = Math.floor(playerPos.z / CHUNK_SIZE_Z);

    // Create and mesh chunks in radius
    for (let dx = -renderRadius; dx <= renderRadius; dx++) {
      for (let dz = -renderRadius; dz <= renderRadius; dz++) {
        const cx = centerChunkX + dx;
        const cz = centerChunkZ + dz;
        const chunk = this.getOrCreateChunk(cx, cz);
        if (chunk.isDirty) {
          this.meshChunk(chunk);
        }
      }
    }
  }

  // Serialize modified blocks for saving
  serializeWorld(): string {
    const data: { seed: number; generator: string; blocks: [number, number, number, number][] } = {
      seed: this.seed,
      generator: this.generator,
      blocks: [],
    };

    // Store all non-air blocks in generated chunks
    for (const chunk of this.chunks.values()) {
      const startX = chunk.cx * CHUNK_SIZE_X;
      const startZ = chunk.cz * CHUNK_SIZE_Z;
      for (let ly = 0; ly < CHUNK_SIZE_Y; ly++) {
        for (let lz = 0; lz < CHUNK_SIZE_Z; lz++) {
          for (let lx = 0; lx < CHUNK_SIZE_X; lx++) {
            const b = chunk.getBlock(lx, ly, lz);
            if (b !== BLOCK_IDS.AIR) {
              data.blocks.push([startX + lx, ly, startZ + lz, b]);
            }
          }
        }
      }
    }

    return JSON.stringify(data);
  }

  // Cleanup all meshes
  dispose() {
    for (const chunk of this.chunks.values()) {
      if (chunk.mesh) {
        this.scene.remove(chunk.mesh);
        chunk.mesh.geometry.dispose();
      }
      if (chunk.transparentMesh) {
        this.scene.remove(chunk.transparentMesh);
        chunk.transparentMesh.geometry.dispose();
      }
    }
    this.chunks.clear();
  }
}
