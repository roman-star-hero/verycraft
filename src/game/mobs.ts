import * as THREE from 'three';
import { VoxelWorld } from './world.ts';
import { soundManager } from './audio.ts';
import { BLOCK_IDS } from './blocks.ts';

export type MobType = 'pig' | 'sheep' | 'zombie';

export class Mob {
  public type: MobType;
  public group: THREE.Group;
  public position: THREE.Vector3;
  public velocity: THREE.Vector3;
  public health: number;
  public maxHealth: number;
  public isDead: boolean = false;

  private legs: THREE.Mesh[] = [];
  private head: THREE.Mesh | null = null;
  private arms: THREE.Mesh[] = [];
  private materials: THREE.MeshLambertMaterial[] = [];

  private walkCycle: number = 0;
  private changeDirTimer: number = 0;
  private targetYaw: number = 0;
  private currentYaw: number = 0;
  private hurtTimer: number = 0;
  private soundTimer: number = 5 + Math.random() * 10;

  constructor(scene: THREE.Scene, type: MobType, x: number, y: number, z: number) {
    this.type = type;
    this.position = new THREE.Vector3(x, y, z);
    this.velocity = new THREE.Vector3(0, 0, 0);
    this.group = new THREE.Group();
    this.group.position.copy(this.position);

    if (type === 'pig') {
      this.health = 10;
      this.maxHealth = 10;
      this.buildPigModel();
    } else if (type === 'sheep') {
      this.health = 8;
      this.maxHealth = 8;
      this.buildSheepModel();
    } else {
      this.health = 20;
      this.maxHealth = 20;
      this.buildZombieModel();
    }

    scene.add(this.group);
  }

  private registerMaterial(color: number): THREE.MeshLambertMaterial {
    const mat = new THREE.MeshLambertMaterial({ color });
    this.materials.push(mat);
    return mat;
  }

  private buildPigModel() {
    const pinkMat = this.registerMaterial(0xf49da9);
    const darkPinkMat = this.registerMaterial(0xdf8490);
    const eyeMat = this.registerMaterial(0x000000);

    // Body
    const bodyGeo = new THREE.BoxGeometry(0.8, 0.6, 1.2);
    const body = new THREE.Mesh(bodyGeo, pinkMat);
    body.position.set(0, 0.6, 0);
    this.group.add(body);

    // Head
    const headGeo = new THREE.BoxGeometry(0.55, 0.55, 0.55);
    const head = new THREE.Mesh(headGeo, pinkMat);
    head.position.set(0, 0.85, 0.7);

    // Snout
    const snoutGeo = new THREE.BoxGeometry(0.3, 0.2, 0.15);
    const snout = new THREE.Mesh(snoutGeo, darkPinkMat);
    snout.position.set(0, -0.1, 0.32);
    head.add(snout);

    // Eyes
    const eyeGeo = new THREE.BoxGeometry(0.08, 0.08, 0.05);
    const eyeLeft = new THREE.Mesh(eyeGeo, eyeMat);
    eyeLeft.position.set(-0.2, 0.08, 0.28);
    const eyeRight = new THREE.Mesh(eyeGeo, eyeMat);
    eyeRight.position.set(0.2, 0.08, 0.28);
    head.add(eyeLeft);
    head.add(eyeRight);

    this.head = head;
    this.group.add(head);

    // 4 Legs
    const legGeo = new THREE.BoxGeometry(0.24, 0.45, 0.24);
    const offsets = [
      [-0.26, 0.22, 0.4],
      [0.26, 0.22, 0.4],
      [-0.26, 0.22, -0.4],
      [0.26, 0.22, -0.4],
    ];

    for (const [lx, ly, lz] of offsets) {
      const leg = new THREE.Mesh(legGeo, pinkMat);
      leg.position.set(lx, ly, lz);
      this.legs.push(leg);
      this.group.add(leg);
    }
  }

  private buildSheepModel() {
    const woolMat = this.registerMaterial(0xeeeeee);
    const skinMat = this.registerMaterial(0xd3b89b);
    const eyeMat = this.registerMaterial(0x111111);

    // Wool Body
    const bodyGeo = new THREE.BoxGeometry(0.9, 0.75, 1.25);
    const body = new THREE.Mesh(bodyGeo, woolMat);
    body.position.set(0, 0.7, 0);
    this.group.add(body);

    // Head
    const headGeo = new THREE.BoxGeometry(0.45, 0.45, 0.5);
    const head = new THREE.Mesh(headGeo, skinMat);
    head.position.set(0, 0.9, 0.75);

    // Wool cap on head
    const capGeo = new THREE.BoxGeometry(0.48, 0.2, 0.4);
    const cap = new THREE.Mesh(capGeo, woolMat);
    cap.position.set(0, 0.2, -0.05);
    head.add(cap);

    // Eyes
    const eyeGeo = new THREE.BoxGeometry(0.06, 0.06, 0.05);
    const eyeL = new THREE.Mesh(eyeGeo, eyeMat);
    eyeL.position.set(-0.16, 0.05, 0.26);
    const eyeR = new THREE.Mesh(eyeGeo, eyeMat);
    eyeR.position.set(0.16, 0.05, 0.26);
    head.add(eyeL);
    head.add(eyeR);

    this.head = head;
    this.group.add(head);

    // Legs
    const legGeo = new THREE.BoxGeometry(0.22, 0.5, 0.22);
    const offsets = [
      [-0.28, 0.25, 0.42],
      [0.28, 0.25, 0.42],
      [-0.28, 0.25, -0.42],
      [0.28, 0.25, -0.42],
    ];

    for (const [lx, ly, lz] of offsets) {
      const leg = new THREE.Mesh(legGeo, skinMat);
      leg.position.set(lx, ly, lz);
      this.legs.push(leg);
      this.group.add(leg);
    }
  }

  private buildZombieModel() {
    const greenMat = this.registerMaterial(0x4d7936); // skin
    const shirtMat = this.registerMaterial(0x279b9b); // cyan shirt
    const pantsMat = this.registerMaterial(0x38346e); // dark blue/purple pants
    const eyeMat = this.registerMaterial(0x111111);

    // Torso
    const bodyGeo = new THREE.BoxGeometry(0.55, 0.75, 0.3);
    const body = new THREE.Mesh(bodyGeo, shirtMat);
    body.position.set(0, 1.05, 0);
    this.group.add(body);

    // Head
    const headGeo = new THREE.BoxGeometry(0.48, 0.48, 0.48);
    const head = new THREE.Mesh(headGeo, greenMat);
    head.position.set(0, 1.66, 0);

    // Eyes
    const eyeGeo = new THREE.BoxGeometry(0.08, 0.06, 0.05);
    const eyeL = new THREE.Mesh(eyeGeo, eyeMat);
    eyeL.position.set(-0.14, 0.04, 0.25);
    const eyeR = new THREE.Mesh(eyeGeo, eyeMat);
    eyeR.position.set(0.14, 0.04, 0.25);
    head.add(eyeL);
    head.add(eyeR);

    this.head = head;
    this.group.add(head);

    // Outstretched Arms (reaching forward!)
    const armGeo = new THREE.BoxGeometry(0.2, 0.2, 0.7);
    const armL = new THREE.Mesh(armGeo, shirtMat);
    armL.position.set(-0.38, 1.25, 0.35);
    const armR = new THREE.Mesh(armGeo, shirtMat);
    armR.position.set(0.38, 1.25, 0.35);
    this.arms.push(armL, armR);
    this.group.add(armL);
    this.group.add(armR);

    // 2 Legs
    const legGeo = new THREE.BoxGeometry(0.24, 0.68, 0.24);
    const legL = new THREE.Mesh(legGeo, pantsMat);
    legL.position.set(-0.14, 0.34, 0);
    const legR = new THREE.Mesh(legGeo, pantsMat);
    legR.position.set(0.14, 0.34, 0);
    this.legs.push(legL, legR);
    this.group.add(legL);
    this.group.add(legR);
  }

  takeDamage(amount: number, knockbackDir?: THREE.Vector3) {
    this.health -= amount;
    this.hurtTimer = 0.25;

    // Flash red
    for (const mat of this.materials) {
      mat.color.set(0xff2222);
    }

    if (knockbackDir) {
      this.velocity.x += knockbackDir.x * 6;
      this.velocity.y += 4;
      this.velocity.z += knockbackDir.z * 6;
    }

    if (this.health <= 0) {
      this.isDead = true;
    }
  }

  update(world: VoxelWorld, dt: number, playerPos: THREE.Vector3, onAttackPlayer?: (dmg: number) => void) {
    // Hurt flash reset
    if (this.hurtTimer > 0) {
      this.hurtTimer -= dt;
      if (this.hurtTimer <= 0) {
        // Reset colors
        if (this.type === 'pig') {
          this.materials[0].color.set(0xf49da9);
        } else if (this.type === 'sheep') {
          this.materials[0].color.set(0xeeeeee);
        } else {
          this.materials[0].color.set(0x4d7936);
          if (this.materials[1]) this.materials[1].color.set(0x279b9b);
        }
      }
    }

    // Sound intervals
    this.soundTimer -= dt;
    if (this.soundTimer <= 0) {
      this.soundTimer = 10 + Math.random() * 12;
      const distToPlayer = this.position.distanceTo(playerPos);
      if (distToPlayer < 18) {
        if (this.type === 'pig') soundManager.playMobOink();
        else if (this.type === 'zombie') soundManager.playZombieGroan();
      }
    }

    // AI logic
    const distToPlayer = this.position.distanceTo(playerPos);
    let speed = 1.2;

    if (this.type === 'zombie') {
      // Zombie tracks player if within 18 blocks
      if (distToPlayer < 18) {
        speed = 2.2;
        const dx = playerPos.x - this.position.x;
        const dz = playerPos.z - this.position.z;
        this.targetYaw = Math.atan2(dx, dz);

        // Attack player if touching
        if (distToPlayer < 1.3 && onAttackPlayer) {
          onAttackPlayer(3);
        }
      }
    } else {
      // Friendly mobs wander randomly
      this.changeDirTimer -= dt;
      if (this.changeDirTimer <= 0) {
        this.changeDirTimer = 3 + Math.random() * 4;
        if (Math.random() < 0.4) {
          this.targetYaw = Math.random() * Math.PI * 2;
        }
      }
    }

    // Smooth turn towards target yaw
    let diff = this.targetYaw - this.currentYaw;
    while (diff < -Math.PI) diff += Math.PI * 2;
    while (diff > Math.PI) diff -= Math.PI * 2;
    this.currentYaw += diff * Math.min(1.0, 5.0 * dt);
    this.group.rotation.y = this.currentYaw;

    // Move forward
    const moveX = Math.sin(this.currentYaw) * speed;
    const moveZ = Math.cos(this.currentYaw) * speed;

    this.velocity.x = moveX;
    this.velocity.z = moveZ;

    // Gravity
    this.velocity.y -= 25 * dt;

    // Voxel ground collision
    const nextY = this.position.y + this.velocity.y * dt;
    const blockBelow = world.getBlock(Math.floor(this.position.x), Math.floor(nextY), Math.floor(this.position.z));
    const blockAtFeet = world.getBlock(Math.floor(this.position.x), Math.floor(this.position.y), Math.floor(this.position.z));

    if (blockBelow !== BLOCK_IDS.AIR && blockBelow !== BLOCK_IDS.WATER) {
      this.position.y = Math.floor(nextY) + 1.0;
      this.velocity.y = 0;

      // Jump if obstacle in front
      const frontX = this.position.x + Math.sin(this.currentYaw) * 0.6;
      const frontZ = this.position.z + Math.cos(this.currentYaw) * 0.6;
      const frontBlock = world.getBlock(Math.floor(frontX), Math.floor(this.position.y + 0.3), Math.floor(frontZ));
      const frontHead = world.getBlock(Math.floor(frontX), Math.floor(this.position.y + 1.3), Math.floor(frontZ));

      if (frontBlock !== BLOCK_IDS.AIR && frontBlock !== BLOCK_IDS.WATER && frontHead === BLOCK_IDS.AIR) {
        this.velocity.y = 7.0; // Jump up 1 block
      }
    } else {
      this.position.y = nextY;
    }

    this.position.x += this.velocity.x * dt;
    this.position.z += this.velocity.z * dt;
    this.group.position.copy(this.position);

    // Leg swing animation
    this.walkCycle += dt * 8;
    const swing = Math.sin(this.walkCycle) * 0.6;

    if (this.legs.length === 4) {
      this.legs[0].rotation.x = swing;
      this.legs[1].rotation.x = -swing;
      this.legs[2].rotation.x = -swing;
      this.legs[3].rotation.x = swing;
    } else if (this.legs.length === 2) {
      this.legs[0].rotation.x = swing;
      this.legs[1].rotation.x = -swing;
    }
  }

  destroy(scene: THREE.Scene) {
    scene.remove(this.group);
    for (const mat of this.materials) {
      mat.dispose();
    }
  }
}
