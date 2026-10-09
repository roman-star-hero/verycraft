import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { VoxelWorld, CHUNK_SIZE_X, CHUNK_SIZE_Z } from './game/world.ts';
import { Player } from './game/player.ts';
import { SkyManager } from './game/sky.ts';
import { Mob } from './game/mobs.ts';
import { ParticleSystem, PrimedTNT } from './game/particles.ts';
import { BlockHighlight } from './game/highlight.ts';
import { BLOCK_IDS, BLOCKS, ITEMS, ITEM_IDS } from './game/blocks.ts';
import { soundManager } from './game/audio.ts';
import { musicEngine } from './game/music.ts';
import { GameMode, InventorySlots, ItemStack, PlayerState, WorldSettings } from './game/types.ts';

// UI Components
import { Crosshair } from './components/Crosshair.tsx';
import { Hotbar } from './components/Hotbar.tsx';
import { StatusBars } from './components/StatusBars.tsx';
import { HeldItemView } from './components/HeldItemView.tsx';
import { InventoryModal } from './components/InventoryModal.tsx';
import { CraftingTableModal } from './components/CraftingTableModal.tsx';
import { ChestModal } from './components/ChestModal.tsx';
import { PauseMenu } from './components/PauseMenu.tsx';
import { F3Debug } from './components/F3Debug.tsx';
import { HelpControls } from './components/HelpControls.tsx';
import { UnderwaterOverlay } from './components/UnderwaterOverlay.tsx';

const DEFAULT_SETTINGS: WorldSettings = {
  name: 'Мой мир (My World)',
  seed: 42819,
  generator: 'standard',
  renderDistance: 2,
  fov: 75,
  mouseSensitivity: 1.0,
  soundVolume: 0.5,
  musicVolume: 0.35,
  musicEnabled: true,
  dayLengthMinutes: 10,
  timeSpeed: 1.0,
};

// Initial starter hotbar items
const INITIAL_HOTBAR: InventorySlots = [
  { id: BLOCK_IDS.GRASS, count: 64, type: 'block' },
  { id: BLOCK_IDS.OAK_PLANKS, count: 64, type: 'block' },
  { id: BLOCK_IDS.COBBLESTONE, count: 64, type: 'block' },
  { id: BLOCK_IDS.OAK_LOG, count: 32, type: 'block' },
  { id: BLOCK_IDS.GLASS, count: 32, type: 'block' },
  { id: BLOCK_IDS.TNT, count: 16, type: 'block' },
  { id: BLOCK_IDS.TORCH, count: 16, type: 'block' },
  { id: ITEM_IDS.DIAMOND_PICKAXE, count: 1, type: 'tool', durability: 1561, maxDurability: 1561 },
  { id: ITEM_IDS.DIAMOND_SWORD, count: 1, type: 'tool', durability: 1561, maxDurability: 1561 },
];

export default function App() {
  const mountRef = useRef<HTMLDivElement>(null);

  // Game UI States
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [isInventoryOpen, setIsInventoryOpen] = useState<boolean>(false);
  const [isCraftingTableOpen, setIsCraftingTableOpen] = useState<boolean>(false);
  const [isChestOpen, setIsChestOpen] = useState<boolean>(false);
  const [isHelpOpen, setIsHelpOpen] = useState<boolean>(false);
  const [isF3Open, setIsF3Open] = useState<boolean>(false);

  // Settings & Game Mode
  const [settings, setSettings] = useState<WorldSettings>(DEFAULT_SETTINGS);
  const [gameMode, setGameMode] = useState<GameMode>('creative');

  // Inventory & Hotbar
  const [hotbar, setHotbar] = useState<InventorySlots>(INITIAL_HOTBAR);
  const [inventory, setInventory] = useState<InventorySlots>(new Array(27).fill(null));
  const [chestSlots, setChestSlots] = useState<InventorySlots>(new Array(27).fill(null));
  const [selectedSlot, setSelectedSlot] = useState<number>(0);

  // HUD stats
  const [playerSnapshot, setPlayerSnapshot] = useState<PlayerState>({
    x: 8,
    y: 20,
    z: 8,
    yaw: 0,
    pitch: 0,
    vx: 0,
    vy: 0,
    vz: 0,
    onGround: true,
    inWater: false,
    isHeadUnderwater: false,
    isFlying: false,
    isSprinting: false,
    isSneaking: false,
    health: 20,
    maxHealth: 20,
    hunger: 20,
    oxygen: 20,
    selectedSlot: 0,
    gameMode: 'creative',
  });
  const [fps, setFps] = useState<number>(60);
  const [skyHours, setSkyHours] = useState<number>(10);
  const [skyMinutes, setSkyMinutes] = useState<number>(0);
  const [mobCount, setMobCount] = useState<number>(0);
  const [isSwingingHand, setIsSwingingHand] = useState<boolean>(false);
  const [targetedBlockId, setTargetedBlockId] = useState<number | null>(null);

  // References for Engine
  const engineRef = useRef<{
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer;
    world: VoxelWorld;
    player: Player;
    sky: SkyManager;
    particles: ParticleSystem;
    tnts: PrimedTNT[];
    mobs: Mob[];
    highlight: BlockHighlight;
    isLeftMouseDown: boolean;
    miningTime: number;
    requiredMiningTime: number;
    targetBlockPos: THREE.Vector3 | null;
    targetNormal: THREE.Vector3 | null;
    lastSpacePressTime: number;
    animFrameId: number;
  } | null>(null);

  // Helper to sync inventory to engine and state
  const handleUpdateInventory = useCallback((newInv: InventorySlots, newHot: InventorySlots) => {
    setInventory(newInv);
    setHotbar(newHot);
  }, []);

  // Helper to add item to inventory/hotbar
  const addItemToInventory = useCallback((id: number, count = 1) => {
    setHotbar((prevHotbar) => {
      const nextHotbar = [...prevHotbar];
      // Try stack existing
      for (let i = 0; i < 9; i++) {
        if (nextHotbar[i] && nextHotbar[i]!.id === id) {
          nextHotbar[i] = { ...nextHotbar[i]!, count: nextHotbar[i]!.count + count };
          soundManager.playItemPickup();
          return nextHotbar;
        }
      }
      // Try empty slot
      for (let i = 0; i < 9; i++) {
        if (!nextHotbar[i]) {
          nextHotbar[i] = { id, count, type: id >= 100 ? 'item' : 'block' };
          soundManager.playItemPickup();
          return nextHotbar;
        }
      }
      // If hotbar full, add to inventory
      setInventory((prevInv) => {
        const nextInv = [...prevInv];
        for (let i = 0; i < 27; i++) {
          if (nextInv[i] && nextInv[i]!.id === id) {
            nextInv[i] = { ...nextInv[i]!, count: nextInv[i]!.count + count };
            soundManager.playItemPickup();
            return nextInv;
          }
        }
        for (let i = 0; i < 27; i++) {
          if (!nextInv[i]) {
            nextInv[i] = { id, count, type: id >= 100 ? 'item' : 'block' };
            soundManager.playItemPickup();
            return nextInv;
          }
        }
        return nextInv;
      });
      return nextHotbar;
    });
  }, []);

  // Hand swing trigger
  const triggerHandSwing = useCallback(() => {
    setIsSwingingHand(true);
    setTimeout(() => setIsSwingingHand(false), 120);
  }, []);

  // Pointer lock enter handler
  const requestPlay = useCallback(() => {
    if (!document.pointerLockElement) {
      document.body.requestPointerLock();
    }
    setIsPlaying(true);
    setIsPaused(false);
    setIsInventoryOpen(false);
    setIsCraftingTableOpen(false);
    setIsChestOpen(false);
    setIsHelpOpen(false);

    // Auto-start cheerful background music on first interaction
    if (settings.musicEnabled && !musicEngine.isMusicPlaying()) {
      musicEngine.setVolume(settings.musicVolume);
      musicEngine.start();
    }
  }, [settings.musicEnabled, settings.musicVolume]);

  const handleToggleMusic = useCallback(() => {
    const nextEnabled = !settings.musicEnabled;
    setSettings((prev) => ({ ...prev, musicEnabled: nextEnabled }));
    if (nextEnabled) {
      musicEngine.setVolume(settings.musicVolume);
      musicEngine.start();
    } else {
      musicEngine.stop();
    }
  }, [settings.musicEnabled, settings.musicVolume]);

  // Initialize Three.js Game Engine
  useEffect(() => {
    if (!mountRef.current) return;

    const width = window.innerWidth;
    const height = window.innerHeight;

    // 1. Scene, Camera, Renderer
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x78a7ff);

    const camera = new THREE.PerspectiveCamera(settings.fov, width / height, 0.1, 300);
    const renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.BasicShadowMap;
    mountRef.current.appendChild(renderer.domElement);

    // 2. World, Player, Sky, Highlights, Particles
    const world = new VoxelWorld(scene, settings.seed, settings.generator);
    const player = new Player(camera, 8, 22, 8);
    player.setGameMode(gameMode);

    const sky = new SkyManager(scene);
    sky.timeSpeed = settings.timeSpeed;
    const particles = new ParticleSystem(scene);
    const highlight = new BlockHighlight(scene);

    // Initial terrain generation around spawn
    world.update(player.position, settings.renderDistance);

    // Adjust spawn Y to be on top of highest ground block
    let highestY = 16;
    for (let y = 30; y >= 1; y--) {
      if (world.getBlock(8, y, 8) !== BLOCK_IDS.AIR) {
        highestY = y + 1;
        break;
      }
    }
    player.position.set(8, highestY + 1, 8);

    // 3. Spawn Mobs
    const mobs: Mob[] = [];
    const spawnMob = (type: 'pig' | 'sheep' | 'zombie', x: number, z: number) => {
      let groundY = 14;
      for (let y = 28; y >= 1; y--) {
        if (world.getBlock(Math.floor(x), y, Math.floor(z)) !== BLOCK_IDS.AIR) {
          groundY = y + 1;
          break;
        }
      }
      const mob = new Mob(scene, type, x, groundY, z);
      mobs.push(mob);
    };

    spawnMob('pig', 12, 14);
    spawnMob('pig', 15, 10);
    spawnMob('sheep', 4, 12);
    spawnMob('sheep', 18, 16);
    spawnMob('zombie', 20, 20);

    const tnts: PrimedTNT[] = [];

    engineRef.current = {
      scene,
      camera,
      renderer,
      world,
      player,
      sky,
      particles,
      tnts,
      mobs,
      highlight,
      isLeftMouseDown: false,
      miningTime: 0,
      requiredMiningTime: 0.5,
      targetBlockPos: null,
      targetNormal: null,
      lastSpacePressTime: 0,
      animFrameId: 0,
    };

    // 4. Resize listener
    const handleResize = () => {
      if (!renderer || !camera) return;
      const w = window.innerWidth;
      const h = window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    // 5. Game Loop
    let lastTime = performance.now();
    let frameCount = 0;
    let fpsTimer = 0;

    const animate = (currentTime: number) => {
      const dt = Math.min((currentTime - lastTime) / 1000, 0.05);
      lastTime = currentTime;

      frameCount++;
      fpsTimer += dt;
      if (fpsTimer >= 0.5) {
        setFps(Math.round(frameCount / fpsTimer));
        frameCount = 0;
        fpsTimer = 0;
      }

      const eng = engineRef.current;
      if (eng) {
        // Only update gameplay movement if not paused/modal open
        const isInteractingWithUI = !document.pointerLockElement;

        if (!isInteractingWithUI) {
          eng.player.update(eng.world, dt);
          eng.world.update(eng.player.position, settings.renderDistance);

          // Update Raycast to targeted block
          const rayOrigin = eng.camera.position;
          const rayDir = new THREE.Vector3();
          eng.camera.getWorldDirection(rayDir);
          const hit = eng.world.raycast(rayOrigin, rayDir, 5.5);

          if (hit) {
            eng.targetBlockPos = new THREE.Vector3(hit.blockX, hit.blockY, hit.blockZ);
            eng.targetNormal = new THREE.Vector3(hit.normalX, hit.normalY, hit.normalZ);
            const targetedBlock = eng.world.getBlock(hit.blockX, hit.blockY, hit.blockZ);
            setTargetedBlockId(targetedBlock);

            // Progressive Mining update if holding left click
            if (eng.isLeftMouseDown) {
              const targetedBlock = eng.world.getBlock(hit.blockX, hit.blockY, hit.blockZ);
              const blockDef = BLOCKS[targetedBlock];

              if (eng.player.gameMode === 'creative') {
                // Instant break in creative
                eng.world.setBlock(hit.blockX, hit.blockY, hit.blockZ, BLOCK_IDS.AIR);
                eng.particles.spawnBlockBreakParticles(hit.blockX, hit.blockY, hit.blockZ, targetedBlock);
                soundManager.playBlockBreak(blockDef?.sound || 'stone');
                eng.miningTime = 0;
              } else {
                // Survival mode: calculate mining speed with held tool
                let baseHardness = blockDef?.hardness ?? 1.0;
                const held = hotbar[eng.player.selectedSlot];

                if (held && held.id in ITEMS) {
                  const itemData = ITEMS[held.id];
                  if (itemData.miningSpeed) {
                    baseHardness /= itemData.miningSpeed;
                  }
                }

                eng.requiredMiningTime = Math.max(0.1, baseHardness);
                eng.miningTime += dt;

                // Hit sound interval
                if (Math.random() < 0.2) {
                  soundManager.playBlockHit(blockDef?.sound || 'stone');
                }

                if (eng.miningTime >= eng.requiredMiningTime) {
                  // Block broken!
                  eng.world.setBlock(hit.blockX, hit.blockY, hit.blockZ, BLOCK_IDS.AIR);
                  eng.particles.spawnBlockBreakParticles(hit.blockX, hit.blockY, hit.blockZ, targetedBlock);
                  soundManager.playBlockBreak(blockDef?.sound || 'stone');

                  // Drop item into inventory
                  const dropId = blockDef?.drops ? blockDef.drops.id : targetedBlock;
                  const dropCount = blockDef?.drops ? blockDef.drops.count : 1;
                  addItemToInventory(dropId, dropCount);

                  eng.miningTime = 0;
                }
              }
            } else {
              eng.miningTime = 0;
            }

            const progress = eng.player.gameMode === 'creative' ? 0 : eng.miningTime / eng.requiredMiningTime;
            eng.highlight.update(eng.targetBlockPos, progress);
          } else {
            eng.targetBlockPos = null;
            eng.targetNormal = null;
            eng.miningTime = 0;
            eng.highlight.update(null, 0);
            setTargetedBlockId(null);
          }
        }

        // Sky and day/night (with underwater effect)
        eng.sky.update(dt, eng.player.position, eng.player.isHeadUnderwater);
        const skyState = eng.sky.getSkyState();
        setSkyHours(skyState.hours);
        setSkyMinutes(skyState.minutes);

        // Particles
        eng.particles.update(dt);

        // Primed TNTs
        for (let i = eng.tnts.length - 1; i >= 0; i--) {
          const tnt = eng.tnts[i];
          const exploded = tnt.update(dt);
          if (exploded) {
            eng.tnts.splice(i, 1);
          }
        }

        // Mobs update
        for (let i = eng.mobs.length - 1; i >= 0; i--) {
          const mob = eng.mobs[i];
          if (mob.isDead) {
            eng.particles.spawnBlockBreakParticles(mob.position.x, mob.position.y, mob.position.z, BLOCK_IDS.GRASS);
            mob.destroy(eng.scene);
            eng.mobs.splice(i, 1);
            continue;
          }

          mob.update(eng.world, dt, eng.player.position, (damage) => {
            eng.player.takeDamage(damage, 'hit');
          });
        }
        setMobCount(eng.mobs.length);

        // Sync player snapshot for React HUD
        setPlayerSnapshot(eng.player.getState());

        // Render scene
        eng.renderer.render(eng.scene, eng.camera);

        eng.animFrameId = requestAnimationFrame(animate);
      }
    };

    engineRef.current.animFrameId = requestAnimationFrame(animate);

    // Cleanup
    return () => {
      cancelAnimationFrame(engineRef.current?.animFrameId || 0);
      window.removeEventListener('resize', handleResize);
      engineRef.current?.world.dispose();
      engineRef.current?.highlight.dispose();
      engineRef.current?.particles.dispose();
      renderer.dispose();
      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement);
      }
    };
  }, [settings.seed, settings.generator, settings.renderDistance]);

  // Sync game mode changes to engine player
  useEffect(() => {
    if (engineRef.current) {
      engineRef.current.player.setGameMode(gameMode);
    }
  }, [gameMode]);

  // Sync selected slot to engine player
  useEffect(() => {
    if (engineRef.current) {
      engineRef.current.player.selectedSlot = selectedSlot;
    }
  }, [selectedSlot]);

  // Mouse Move & Pointer Lock Listeners
  useEffect(() => {
    const handlePointerLockChange = () => {
      const isLocked = document.pointerLockElement === document.body;
      if (!isLocked) {
        // If not locked and no other modal is open, open pause menu
        if (!isInventoryOpen && !isCraftingTableOpen && !isChestOpen && !isHelpOpen) {
          setIsPaused(true);
        }
      } else {
        setIsPaused(false);
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (document.pointerLockElement !== document.body) return;
      const eng = engineRef.current;
      if (!eng) return;

      const sens = 0.0022 * settings.mouseSensitivity;
      eng.player.yaw -= e.movementX * sens;
      eng.player.pitch -= e.movementY * sens;

      // Clamp vertical pitch to prevent flipping
      const maxPitch = Math.PI / 2.05;
      eng.player.pitch = Math.max(-maxPitch, Math.min(maxPitch, eng.player.pitch));
    };

    const handleMouseDown = (e: MouseEvent) => {
      if (document.pointerLockElement !== document.body) return;
      const eng = engineRef.current;
      if (!eng) return;

      triggerHandSwing();

      // LEFT CLICK (Mining or Attacking Mobs)
      if (e.button === 0) {
        eng.isLeftMouseDown = true;

        // Check if attacking a mob first
        const rayOrigin = eng.camera.position;
        const rayDir = new THREE.Vector3();
        eng.camera.getWorldDirection(rayDir);

        for (const mob of eng.mobs) {
          const mobDist = rayOrigin.distanceTo(mob.position);
          if (mobDist < 3.8) {
            // Check angle toward mob
            const toMob = new THREE.Vector3().subVectors(mob.position, rayOrigin).normalize();
            if (rayDir.dot(toMob) > 0.85) {
              // Hit mob!
              const held = hotbar[eng.player.selectedSlot];
              let dmg = 2; // fist
              if (held && held.id in ITEMS) {
                dmg = ITEMS[held.id].damage ?? 2;
              }
              const knockback = new THREE.Vector3().copy(rayDir).multiplyScalar(1);
              mob.takeDamage(dmg, knockback);
              soundManager.playHurt();
              return;
            }
          }
        }
      }

      // RIGHT CLICK (Placing Block or Interacting)
      if (e.button === 2) {
        e.preventDefault();

        if (eng.targetBlockPos && eng.targetNormal) {
          const tx = eng.targetBlockPos.x;
          const ty = eng.targetBlockPos.y;
          const tz = eng.targetBlockPos.z;
          const clickedBlock = eng.world.getBlock(tx, ty, tz);

          // Interaction: Crafting Table
          if (clickedBlock === BLOCK_IDS.CRAFTING_TABLE) {
            document.exitPointerLock?.();
            setIsCraftingTableOpen(true);
            return;
          }

          // Interaction: Chest
          if (clickedBlock === BLOCK_IDS.CHEST) {
            document.exitPointerLock?.();
            setIsChestOpen(true);
            return;
          }

          // Interaction: TNT Ignition (right click ignites TNT)
          if (clickedBlock === BLOCK_IDS.TNT) {
            eng.world.setBlock(tx, ty, tz, BLOCK_IDS.AIR);
            const primed = new PrimedTNT(eng.scene, tx, ty, tz, (ex, ey, ez) => {
              // TNT Explosion radius
              const radius = 3.5;
              for (let dx = -radius; dx <= radius; dx++) {
                for (let dy = -radius; dy <= radius; dy++) {
                  for (let dz = -radius; dz <= radius; dz++) {
                    const d = Math.sqrt(dx * dx + dy * dy + dz * dz);
                    if (d <= radius) {
                      const bx = Math.floor(ex + dx);
                      const by = Math.floor(ey + dy);
                      const bz = Math.floor(ez + dz);
                      const b = eng.world.getBlock(bx, by, bz);
                      if (b !== BLOCK_IDS.AIR && b !== BLOCK_IDS.BEDROCK) {
                        eng.world.setBlock(bx, by, bz, BLOCK_IDS.AIR);
                        if (Math.random() < 0.3) {
                          eng.particles.spawnBlockBreakParticles(bx, by, bz, b);
                        }
                      }
                    }
                  }
                }
              }

              // Knockback player if near
              const pDist = eng.player.position.distanceTo(new THREE.Vector3(ex, ey, ez));
              if (pDist < 6.0) {
                const push = new THREE.Vector3().subVectors(eng.player.position, new THREE.Vector3(ex, ey, ez)).normalize();
                eng.player.velocity.addScaledVector(push, (6.0 - pDist) * 3);
                eng.player.takeDamage(Math.floor((6.0 - pDist) * 2), 'hit');
              }
            });
            eng.tnts.push(primed);
            return;
          }

          // Held Item Interaction (Eat food or place block)
          const held = hotbar[eng.player.selectedSlot];
          if (!held) return;

          // Eat Apple
          if (held.id === ITEM_IDS.APPLE) {
            eng.player.eatFood(4, 2);
            if (eng.player.gameMode === 'survival') {
              if (held.count <= 1) {
                const nh = [...hotbar];
                nh[eng.player.selectedSlot] = null;
                setHotbar(nh);
              } else {
                const nh = [...hotbar];
                nh[eng.player.selectedSlot] = { ...held, count: held.count - 1 };
                setHotbar(nh);
              }
            }
            return;
          }

          // Place Block
          if (held.id in BLOCKS && held.id !== BLOCK_IDS.AIR) {
            const px = tx + eng.targetNormal.x;
            const py = ty + eng.targetNormal.y;
            const pz = tz + eng.targetNormal.z;

            // Check if placing block inside player's body
            const halfW = eng.player.width / 2;
            const playerMinX = eng.player.position.x - halfW;
            const playerMaxX = eng.player.position.x + halfW;
            const playerMinY = eng.player.position.y;
            const playerMaxY = eng.player.position.y + eng.player.height;
            const playerMinZ = eng.player.position.z - halfW;
            const playerMaxZ = eng.player.position.z + halfW;

            const blockIntersectsPlayer =
              px + 1 > playerMinX &&
              px < playerMaxX &&
              py + 1 > playerMinY &&
              py < playerMaxY &&
              pz + 1 > playerMinZ &&
              pz < playerMaxZ;

            if (!blockIntersectsPlayer) {
              eng.world.setBlock(px, py, pz, held.id);
              const sound = BLOCKS[held.id]?.sound || 'wood';
              soundManager.playBlockPlace(sound);

              // Decrement held item in survival
              if (eng.player.gameMode === 'survival') {
                if (held.count <= 1) {
                  const nh = [...hotbar];
                  nh[eng.player.selectedSlot] = null;
                  setHotbar(nh);
                } else {
                  const nh = [...hotbar];
                  nh[eng.player.selectedSlot] = { ...held, count: held.count - 1 };
                  setHotbar(nh);
                }
              }
            }
          }
        }
      }
    };

    const handleMouseUp = (e: MouseEvent) => {
      const eng = engineRef.current;
      if (!eng) return;
      if (e.button === 0) {
        eng.isLeftMouseDown = false;
        eng.miningTime = 0;
      }
    };

    const handleWheel = (e: WheelEvent) => {
      setSelectedSlot((prev) => {
        const delta = e.deltaY > 0 ? 1 : -1;
        return (((prev + delta) % 9) + 9) % 9;
      });
    };

    // Keyboard controls
    const handleKeyDown = (e: KeyboardEvent) => {
      const eng = engineRef.current;
      if (!eng) return;

      // Toggle inventory
      if (e.code === 'KeyE') {
        if (isInventoryOpen || isCraftingTableOpen || isChestOpen) {
          setIsInventoryOpen(false);
          setIsCraftingTableOpen(false);
          setIsChestOpen(false);
          document.body.requestPointerLock();
        } else if (!isPaused) {
          document.exitPointerLock?.();
          setIsInventoryOpen(true);
        }
        return;
      }

      // Toggle Help Controls
      if (e.code === 'KeyH') {
        if (isHelpOpen) {
          setIsHelpOpen(false);
          document.body.requestPointerLock();
        } else if (!isPaused) {
          document.exitPointerLock?.();
          setIsHelpOpen(true);
        }
        return;
      }

      // Toggle Music
      if (e.code === 'KeyM') {
        handleToggleMusic();
        return;
      }

      // Toggle Pause
      if (e.code === 'Escape') {
        if (isHelpOpen) {
          setIsHelpOpen(false);
          return;
        }
        if (isInventoryOpen || isCraftingTableOpen || isChestOpen) {
          setIsInventoryOpen(false);
          setIsCraftingTableOpen(false);
          setIsChestOpen(false);
          document.body.requestPointerLock();
          return;
        }
        setIsPaused((prev) => !prev);
        if (!isPaused) document.exitPointerLock?.();
        else document.body.requestPointerLock();
        return;
      }

      // F3 Debug
      if (e.code === 'F3') {
        e.preventDefault();
        setIsF3Open((prev) => !prev);
        return;
      }

      // Hotbar selection keys 1..9
      if (e.code.startsWith('Digit') && e.code.length === 6) {
        const num = parseInt(e.code.replace('Digit', ''));
        if (num >= 1 && num <= 9) {
          setSelectedSlot(num - 1);
        }
      }

      // Movement keys
      if (e.code === 'KeyW') eng.player.keys.forward = true;
      if (e.code === 'KeyS') eng.player.keys.backward = true;
      if (e.code === 'KeyA') eng.player.keys.left = true;
      if (e.code === 'KeyD') eng.player.keys.right = true;

      // Jump / Fly
      if (e.code === 'Space') {
        eng.player.keys.jump = true;

        // Double tap space in creative toggles flight!
        const now = performance.now();
        if (eng.player.gameMode === 'creative') {
          if (now - eng.lastSpacePressTime < 300) {
            eng.player.isFlying = !eng.player.isFlying;
          }
        }
        eng.lastSpacePressTime = now;
      }

      // Sneak
      if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') {
        eng.player.keys.sneak = true;
        eng.player.isSneaking = true;
      }

      // Sprint
      if (e.code === 'ControlLeft' || e.code === 'ControlRight') {
        eng.player.keys.sprint = true;
        eng.player.isSprinting = true;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const eng = engineRef.current;
      if (!eng) return;

      if (e.code === 'KeyW') eng.player.keys.forward = false;
      if (e.code === 'KeyS') eng.player.keys.backward = false;
      if (e.code === 'KeyA') eng.player.keys.left = false;
      if (e.code === 'KeyD') eng.player.keys.right = false;

      if (e.code === 'Space') eng.player.keys.jump = false;
      if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') {
        eng.player.keys.sneak = false;
        eng.player.isSneaking = false;
      }
      if (e.code === 'ControlLeft' || e.code === 'ControlRight') {
        eng.player.keys.sprint = false;
        eng.player.isSprinting = false;
      }
    };

    document.addEventListener('pointerlockchange', handlePointerLockChange);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('wheel', handleWheel);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      document.removeEventListener('pointerlockchange', handlePointerLockChange);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('wheel', handleWheel);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [
    isInventoryOpen,
    isCraftingTableOpen,
    isChestOpen,
    isHelpOpen,
    isPaused,
    settings.mouseSensitivity,
    hotbar,
    triggerHandSwing,
    addItemToInventory,
  ]);

  // World Save & Export Handlers
  const handleSaveWorld = () => {
    if (!engineRef.current) return;
    const json = engineRef.current.world.serializeWorld();
    localStorage.setItem('craftvoxel_world_data', json);
  };

  const handleExportWorld = () => {
    if (!engineRef.current) return;
    const json = engineRef.current.world.serializeWorld();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `craftvoxel_world_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportWorld = (jsonStr: string) => {
    try {
      const data = JSON.parse(jsonStr);
      if (data && data.blocks && engineRef.current) {
        // Clear and rebuild
        engineRef.current.world.dispose();
        engineRef.current.world = new VoxelWorld(engineRef.current.scene, data.seed || 1234, data.generator || 'standard');
        for (const [x, y, z, id] of data.blocks) {
          engineRef.current.world.setBlock(x, y, z, id);
        }
        engineRef.current.world.update(engineRef.current.player.position, settings.renderDistance);
      }
    } catch (e) {
      console.error('Failed to import world', e);
    }
  };

  const handleResetWorld = (generator: 'standard' | 'flat' | 'mountains' | 'islands', seed: number) => {
    setSettings((prev) => ({ ...prev, generator, seed }));
  };

  const handleSetTimeOfDay = (timeNorm: number) => {
    if (engineRef.current) {
      engineRef.current.sky.timeOfDay = timeNorm;
    }
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden select-none bg-black">
      {/* 3D WebGL Canvas Container */}
      <div ref={mountRef} className="w-full h-full cursor-crosshair" onClick={requestPlay} />

      {/* Start / Click to Play Overlay if not locked */}
      {!isPlaying && (
        <div
          onClick={requestPlay}
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/75 cursor-pointer text-white"
        >
          <div className="flex flex-col items-center gap-4 p-8 mc-panel max-w-lg text-center animate-fade-in">
            <h1
              className="font-pixel text-2xl md:text-3xl text-yellow-300 drop-shadow-lg tracking-wider"
              style={{ textShadow: '3px 3px 0 #000' }}
            >
              CRAFTVOXEL
            </h1>
            <p className="font-mc text-lg text-neutral-800">
              Полноценный 3D клон Minecraft в вашем браузере!
            </p>

            <div className="w-full h-0.5 bg-[#888] my-1" />

            <div className="space-y-2 text-xs font-pixel text-neutral-800 text-left bg-neutral-200/90 p-3.5 border-2 border-neutral-400 rounded-xs w-full">
              <p className="text-amber-900 font-bold flex items-center gap-1.5">
                <span>🧱</span> <span>КАК ПОСТАВИТЬ БЛОК:</span>
              </p>
              <p className="text-sm font-mc text-neutral-900 pl-4 leading-tight">
                Выберите блок (клавиши <strong>1–9</strong>) ➔ наведите прицел ➔ нажмите <strong>ПКМ (правую кнопку мыши)</strong>.
              </p>

              <div className="w-full h-px bg-neutral-300 my-1" />

              <p className="text-blue-900 font-bold flex items-center gap-1.5">
                <span>⛏</span> <span>КАК ЛОМАТЬ:</span>
              </p>
              <p className="text-sm font-mc text-neutral-900 pl-4 leading-tight">
                Наведите прицел и зажмите <strong>ЛКМ (левую кнопку мыши)</strong>.
              </p>

              <div className="w-full h-px bg-neutral-300 my-1" />

              <p className="text-neutral-700 text-xs font-mc pt-0.5 flex items-center justify-between">
                <span><strong>E</strong> — Инвентарь</span>
                <span><strong>H</strong> — Полная справка</span>
                <span><strong>2x Пробел</strong> — Полёт</span>
              </p>
            </div>

            <button className="mc-button px-8 py-3 font-mc text-xl font-bold text-white mt-2 w-full animate-pulse shadow-lg">
              КЛИКНИТЕ ДЛЯ СТАРТА
            </button>
          </div>
        </div>
      )}

      {/* Crosshair in center */}
      <Crosshair />

      {/* Underwater Tint, Caustics, and Bubble Overlay */}
      <UnderwaterOverlay
        isUnderwater={playerSnapshot.isHeadUnderwater}
        oxygen={playerSnapshot.oxygen}
      />

      {/* Top right quick shortcuts banner */}
      <div className="fixed top-3 right-3 z-30 flex items-center gap-2 font-pixel text-[10px] text-white/90 select-none">
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleToggleMusic();
          }}
          className={`${
            settings.musicEnabled ? 'bg-emerald-700 hover:bg-emerald-600 border-emerald-400' : 'bg-neutral-800 hover:bg-neutral-700 border-neutral-600'
          } text-white px-2.5 py-1 border rounded-xs cursor-pointer shadow-md flex items-center gap-1 transition-colors`}
          title="Включить / выключить весёлую музыку (клавиша M)"
        >
          <span>🎵</span>
          <span>{settings.musicEnabled ? 'Музыка: ВКЛ' : 'Музыка: ВЫКЛ'}</span>
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            document.exitPointerLock?.();
            setIsHelpOpen(true);
          }}
          className="bg-amber-600 hover:bg-amber-500 text-white px-2.5 py-1 border border-amber-300 rounded-xs cursor-pointer shadow-md flex items-center gap-1 transition-colors"
          title="Открыть справку по управлению"
        >
          <span>❓</span>
          <span>H: Справка</span>
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            document.exitPointerLock?.();
            setIsInventoryOpen(true);
          }}
          className="bg-black/60 hover:bg-black/80 px-2 py-1 border border-neutral-700/80 rounded-xs cursor-pointer transition-colors"
        >
          E: Инвентарь
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsF3Open((prev) => !prev);
          }}
          className="bg-black/60 hover:bg-black/80 px-2 py-1 border border-neutral-700/80 rounded-xs cursor-pointer transition-colors"
        >
          F3: Инфо
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            document.exitPointerLock?.();
            setIsPaused(true);
          }}
          className="bg-black/60 hover:bg-black/80 px-2 py-1 border border-neutral-700/80 rounded-xs cursor-pointer transition-colors"
        >
          ESC: Пауза
        </button>
      </div>

      {/* Bottom HUD: Contextual Controls Prompt, Status Bars & 9-Slot Hotbar */}
      <div className="fixed bottom-4 left-0 right-0 z-20 flex flex-col items-center gap-1.5 pointer-events-none">
        {/* Contextual Action Prompt Bar */}
        <div className="flex items-center gap-2.5 bg-black/80 px-3.5 py-1 rounded-sm border border-neutral-600/90 text-sm font-mc text-white shadow-xl pointer-events-none select-none backdrop-blur-xs">
          <span className="text-emerald-400 font-bold">[ПКМ]</span>
          <span>
            {targetedBlockId === BLOCK_IDS.CRAFTING_TABLE
              ? 'Открыть верстак'
              : targetedBlockId === BLOCK_IDS.CHEST
              ? 'Открыть сундук'
              : targetedBlockId === BLOCK_IDS.TNT
              ? 'Поджечь TNT'
              : 'Поставить блок'}
          </span>
          <span className="text-neutral-500">·</span>
          <span className="text-red-400 font-bold">[ЛКМ]</span>
          <span>Ломать блок</span>
          <span className="text-neutral-500">·</span>
          <span className="text-amber-300 font-bold">[1-9]</span>
          <span>Выбрать блок</span>
          <span className="text-neutral-500">·</span>
          <span className="text-yellow-300 font-bold">[H]</span>
          <span>Справка</span>
        </div>

        <div className="pointer-events-auto">
          <StatusBars playerState={playerSnapshot} />
        </div>
        <div className="pointer-events-auto">
          <Hotbar hotbar={hotbar} selectedSlot={selectedSlot} onSelectSlot={setSelectedSlot} />
        </div>
      </div>

      {/* First person hand / item view in bottom right */}
      <HeldItemView heldItem={hotbar[selectedSlot]} isSwinging={isSwingingHand} />

      {/* F3 Debug Screen */}
      <F3Debug
        isVisible={isF3Open}
        playerState={playerSnapshot}
        fps={fps}
        timeHours={skyHours}
        timeMinutes={skyMinutes}
        mobCount={mobCount}
        biomeName={
          engineRef.current
            ? `${engineRef.current.world.getBiomeSample(playerSnapshot.x, playerSnapshot.z).biome.name} (${engineRef.current.world.getBiomeSample(playerSnapshot.x, playerSnapshot.z).biome.nameRu})`
            : undefined
        }
        biomeColor={engineRef.current?.world.getBiomeSample(playerSnapshot.x, playerSnapshot.z).biome.color}
        temperature={engineRef.current?.world.getBiomeSample(playerSnapshot.x, playerSnapshot.z).temperature}
        moisture={engineRef.current?.world.getBiomeSample(playerSnapshot.x, playerSnapshot.z).moisture}
      />

      {/* Inventory & 2x2 Crafting Modal */}
      <InventoryModal
        isOpen={isInventoryOpen}
        onClose={() => {
          setIsInventoryOpen(false);
          document.body.requestPointerLock();
        }}
        inventory={inventory}
        hotbar={hotbar}
        onUpdateInventory={handleUpdateInventory}
      />

      {/* Crafting Table 3x3 Modal */}
      <CraftingTableModal
        isOpen={isCraftingTableOpen}
        onClose={() => {
          setIsCraftingTableOpen(false);
          document.body.requestPointerLock();
        }}
        inventory={inventory}
        hotbar={hotbar}
        onUpdateInventory={handleUpdateInventory}
      />

      {/* Chest Storage Modal */}
      <ChestModal
        isOpen={isChestOpen}
        onClose={() => {
          setIsChestOpen(false);
          document.body.requestPointerLock();
        }}
        chestSlots={chestSlots}
        inventory={inventory}
        hotbar={hotbar}
        onUpdateChest={setChestSlots}
        onUpdateInventory={handleUpdateInventory}
      />

      {/* Pause Menu & World Settings */}
      <PauseMenu
        isOpen={isPaused}
        onResume={() => {
          setIsPaused(false);
          document.body.requestPointerLock();
        }}
        gameMode={gameMode}
        onToggleGameMode={setGameMode}
        settings={settings}
        onUpdateSettings={setSettings}
        onSaveWorld={handleSaveWorld}
        onExportWorld={handleExportWorld}
        onImportWorld={handleImportWorld}
        onResetWorld={handleResetWorld}
        onOpenHelp={() => setIsHelpOpen(true)}
        onSetTimeOfDay={handleSetTimeOfDay}
      />

      {/* Help & Key Controls Modal */}
      <HelpControls isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />
    </div>
  );
}
