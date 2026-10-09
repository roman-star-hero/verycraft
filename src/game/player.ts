import * as THREE from 'three';
import { VoxelWorld } from './world.ts';
import { BLOCK_IDS, BLOCKS } from './blocks.ts';
import { GameMode, PlayerState } from './types.ts';
import { soundManager } from './audio.ts';

export class Player {
  public position: THREE.Vector3;
  public velocity: THREE.Vector3;
  public yaw: number = 0; // rotation around Y (horizontal)
  public pitch: number = 0; // rotation around X (vertical)
  public camera: THREE.PerspectiveCamera;

  public width: number = 0.6;
  public height: number = 1.8;
  public eyeHeight: number = 1.62;

  public onGround: boolean = false;
  public inWater: boolean = false;
  public isFlying: boolean = false;
  public isSprinting: boolean = false;
  public isSneaking: boolean = false;

  public health: number = 20;
  public maxHealth: number = 20;
  public hunger: number = 20;
  public oxygen: number = 20;
  public selectedSlot: number = 0;
  public gameMode: GameMode = 'creative'; // default creative for instant fun, toggleable

  private fallStartHeight: number = 0;
  private isFalling: boolean = false;
  private lastFootstepDist: number = 0;
  private drownTimer: number = 0;
  private hungerRegenTimer: number = 0;

  // Key tracking
  public keys: Record<string, boolean> = {
    forward: false,
    backward: false,
    left: false,
    right: false,
    jump: false,
    sneak: false,
    sprint: false,
  };

  constructor(camera: THREE.PerspectiveCamera, spawnX = 8, spawnY = 20, spawnZ = 8) {
    this.camera = camera;
    this.position = new THREE.Vector3(spawnX, spawnY, spawnZ);
    this.velocity = new THREE.Vector3(0, 0, 0);
  }

  setGameMode(mode: GameMode) {
    this.gameMode = mode;
    if (mode === 'survival') {
      this.isFlying = false;
    }
  }

  // Check if a point collides with a solid block in the world
  private isSolidBlock(world: VoxelWorld, x: number, y: number, z: number): boolean {
    const block = world.getBlock(Math.floor(x), Math.floor(y), Math.floor(z));
    if (block === BLOCK_IDS.AIR || block === BLOCK_IDS.WATER) return false;
    return true;
  }

  // Bounding box collision test
  private checkCollision(world: VoxelWorld, pos: THREE.Vector3): boolean {
    const halfW = this.width / 2;
    const minX = Math.floor(pos.x - halfW);
    const maxX = Math.floor(pos.x + halfW);
    const minY = Math.floor(pos.y);
    const maxY = Math.floor(pos.y + this.height);
    const minZ = Math.floor(pos.z - halfW);
    const maxZ = Math.floor(pos.z + halfW);

    for (let x = minX; x <= maxX; x++) {
      for (let y = minY; y <= maxY; y++) {
        for (let z = minZ; z <= maxZ; z++) {
          const block = world.getBlock(x, y, z);
          if (block !== BLOCK_IDS.AIR && block !== BLOCK_IDS.WATER) {
            return true;
          }
        }
      }
    }
    return false;
  }

  // Update player physics, movement, and collisions
  update(world: VoxelWorld, dt: number) {
    // Clamp delta time to avoid physics tunneling on lag spikes
    const delta = Math.min(dt, 0.05);

    // Check water at eye level & body level
    const headBlock = world.getBlock(Math.floor(this.position.x), Math.floor(this.position.y + this.eyeHeight), Math.floor(this.position.z));
    const feetBlock = world.getBlock(Math.floor(this.position.x), Math.floor(this.position.y + 0.1), Math.floor(this.position.z));
    this.inWater = headBlock === BLOCK_IDS.WATER || feetBlock === BLOCK_IDS.WATER;

    // Underwater oxygen logic
    if (headBlock === BLOCK_IDS.WATER) {
      this.oxygen = Math.max(0, this.oxygen - delta * 2.5);
      if (this.oxygen <= 0) {
        this.drownTimer += delta;
        if (this.drownTimer >= 1.5) {
          this.takeDamage(2);
          this.drownTimer = 0;
        }
      }
    } else {
      this.oxygen = Math.min(20, this.oxygen + delta * 10);
      this.drownTimer = 0;
    }

    // Health regen in survival
    if (this.gameMode === 'survival') {
      if (this.hunger >= 18 && this.health < this.maxHealth) {
        this.hungerRegenTimer += delta;
        if (this.hungerRegenTimer >= 4.0) {
          this.health = Math.min(this.maxHealth, this.health + 1);
          this.hungerRegenTimer = 0;
        }
      }
    }

    // Determine movement direction relative to camera yaw
    const forwardX = -Math.sin(this.yaw);
    const forwardZ = -Math.cos(this.yaw);
    const rightX = Math.cos(this.yaw);
    const rightZ = -Math.sin(this.yaw);

    let moveX = 0;
    let moveZ = 0;

    if (this.keys.forward) {
      moveX += forwardX;
      moveZ += forwardZ;
    }
    if (this.keys.backward) {
      moveX -= forwardX;
      moveZ -= forwardZ;
    }
    if (this.keys.right) {
      moveX += rightX;
      moveZ += rightZ;
    }
    if (this.keys.left) {
      moveX -= rightX;
      moveZ -= rightZ;
    }

    // Normalize horizontal move vector
    const moveLen = Math.sqrt(moveX * moveX + moveZ * moveZ);
    if (moveLen > 0.0001) {
      moveX /= moveLen;
      moveZ /= moveLen;
    }

    // Speed modifiers
    let speed = 4.3; // base walking speed m/s
    if (this.isSprinting && !this.isSneaking) speed = 6.2;
    if (this.isSneaking) speed = 2.0;
    if (this.inWater) speed = 2.8;
    if (this.isFlying) speed = 12.0;

    // Target horizontal velocities
    const targetVx = moveX * speed;
    const targetVz = moveZ * speed;

    const accel = this.onGround ? 18.0 : 8.0;
    this.velocity.x += (targetVx - this.velocity.x) * Math.min(1.0, accel * delta);
    this.velocity.z += (targetVz - this.velocity.z) * Math.min(1.0, accel * delta);

    // Vertical physics
    if (this.isFlying) {
      let flyY = 0;
      if (this.keys.jump) flyY += 8.0;
      if (this.keys.sneak) flyY -= 8.0;
      this.velocity.y += (flyY - this.velocity.y) * Math.min(1.0, 15.0 * delta);
    } else if (this.inWater) {
      // Water buoyancy and swimming
      if (this.keys.jump) {
        this.velocity.y = 3.5;
      } else {
        this.velocity.y += (-2.5 - this.velocity.y) * delta * 4;
      }
    } else {
      // Normal Gravity
      const gravity = 28.0;
      this.velocity.y -= gravity * delta;

      // Jump
      if (this.keys.jump && this.onGround) {
        this.velocity.y = 8.8; // Classic Minecraft jump ~1.25 blocks
        this.onGround = false;
        soundManager.playStepSound('dirt');
      }

      // Track fall distance for damage
      if (!this.onGround) {
        if (!this.isFalling) {
          this.isFalling = true;
          this.fallStartHeight = this.position.y;
        }
      }
    }

    // Separate Axis Collision Resolution: Y axis first
    const nextY = this.position.y + this.velocity.y * delta;
    const testPosY = new THREE.Vector3(this.position.x, nextY, this.position.z);

    if (this.checkCollision(world, testPosY)) {
      if (this.velocity.y < 0) {
        // Landed on ground
        if (this.isFalling && this.gameMode === 'survival') {
          const fallDistance = this.fallStartHeight - this.position.y;
          if (fallDistance > 3.5) {
            const damage = Math.floor(fallDistance - 3);
            this.takeDamage(damage);
          }
        }
        this.isFalling = false;
        this.onGround = true;
      }
      this.velocity.y = 0;
    } else {
      this.position.y = nextY;
      if (this.velocity.y < -0.5) {
        this.onGround = false;
      }
    }

    // X axis collision resolution
    const nextX = this.position.x + this.velocity.x * delta;
    const testPosX = new THREE.Vector3(nextX, this.position.y, this.position.z);
    if (this.checkCollision(world, testPosX)) {
      this.velocity.x = 0;
    } else {
      this.position.x = nextX;
    }

    // Z axis collision resolution
    const nextZ = this.position.z + this.velocity.z * delta;
    const testPosZ = new THREE.Vector3(this.position.x, this.position.y, nextZ);
    if (this.checkCollision(world, testPosZ)) {
      this.velocity.z = 0;
    } else {
      this.position.z = nextZ;
    }

    // Void falling safeguard
    if (this.position.y < -15) {
      this.position.set(8, 28, 8);
      this.velocity.set(0, 0, 0);
      if (this.gameMode === 'survival') {
        this.takeDamage(10);
      }
    }

    // Footstep audio
    const horizontalSpeed = Math.sqrt(this.velocity.x * this.velocity.x + this.velocity.z * this.velocity.z);
    if (this.onGround && horizontalSpeed > 0.5) {
      this.lastFootstepDist += horizontalSpeed * delta;
      if (this.lastFootstepDist >= (this.isSprinting ? 2.0 : 2.5)) {
        this.lastFootstepDist = 0;
        const blockBelow = world.getBlock(Math.floor(this.position.x), Math.floor(this.position.y - 0.2), Math.floor(this.position.z));
        const soundType = BLOCKS[blockBelow]?.sound || 'dirt';
        soundManager.playStepSound(soundType);
      }
    }

    // Update Camera position & rotation
    this.camera.position.set(this.position.x, this.position.y + this.eyeHeight, this.position.z);

    const euler = new THREE.Euler(0, 0, 0, 'YXZ');
    euler.x = this.pitch;
    euler.y = this.yaw;
    this.camera.quaternion.setFromEuler(euler);
  }

  takeDamage(amount: number) {
    if (this.gameMode === 'creative') return;
    this.health = Math.max(0, this.health - amount);
    soundManager.playHurt();
    if (this.health <= 0) {
      // Respawn
      this.respawn();
    }
  }

  respawn() {
    this.health = 20;
    this.hunger = 20;
    this.oxygen = 20;
    this.position.set(8, 24, 8);
    this.velocity.set(0, 0, 0);
  }

  eatFood(hungerRestore = 4, healthRestore = 2) {
    this.hunger = Math.min(20, this.hunger + hungerRestore);
    this.health = Math.min(this.maxHealth, this.health + healthRestore);
    soundManager.playStepSound('grass');
  }

  // Get current player state snapshot for React UI
  getState(): PlayerState {
    return {
      x: this.position.x,
      y: this.position.y,
      z: this.position.z,
      yaw: this.yaw,
      pitch: this.pitch,
      vx: this.velocity.x,
      vy: this.velocity.y,
      vz: this.velocity.z,
      onGround: this.onGround,
      inWater: this.inWater,
      isFlying: this.isFlying,
      isSprinting: this.isSprinting,
      isSneaking: this.isSneaking,
      health: this.health,
      maxHealth: this.maxHealth,
      hunger: this.hunger,
      oxygen: this.oxygen,
      selectedSlot: this.selectedSlot,
      gameMode: this.gameMode,
    };
  }
}
