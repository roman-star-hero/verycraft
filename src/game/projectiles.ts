import * as THREE from 'three';
import { VoxelWorld } from './world.ts';
import { Mob } from './mobs.ts';
import { soundManager } from './audio.ts';
import { BLOCK_IDS } from './blocks.ts';

export class Arrow {
  public mesh: THREE.Group;
  public position: THREE.Vector3;
  public velocity: THREE.Vector3;
  public isEmbedded: boolean = false;
  public shouldRemove: boolean = false;
  private lifeTimer: number = 0;
  private scene: THREE.Scene;

  constructor(scene: THREE.Scene, startPos: THREE.Vector3, direction: THREE.Vector3, speed: number = 26) {
    this.scene = scene;
    this.position = startPos.clone();
    this.velocity = direction.clone().normalize().multiplyScalar(speed);

    // Build 3D Voxel Arrow Mesh
    this.mesh = new THREE.Group();

    // Wooden shaft
    const shaftGeo = new THREE.BoxGeometry(0.04, 0.04, 0.55);
    const shaftMat = new THREE.MeshLambertMaterial({ color: 0x8b5a2b });
    const shaft = new THREE.Mesh(shaftGeo, shaftMat);
    this.mesh.add(shaft);

    // Iron head tip
    const tipGeo = new THREE.BoxGeometry(0.08, 0.08, 0.12);
    const tipMat = new THREE.MeshLambertMaterial({ color: 0xd0d0d0 });
    const tip = new THREE.Mesh(tipGeo, tipMat);
    tip.position.z = 0.3;
    this.mesh.add(tip);

    // Feather fletching
    const featherGeo = new THREE.BoxGeometry(0.12, 0.02, 0.14);
    const featherMat = new THREE.MeshLambertMaterial({ color: 0xffffff });
    const feather1 = new THREE.Mesh(featherGeo, featherMat);
    feather1.position.z = -0.22;
    this.mesh.add(feather1);

    const feather2 = new THREE.Mesh(featherGeo, featherMat);
    feather2.rotation.z = Math.PI / 2;
    feather2.position.z = -0.22;
    this.mesh.add(feather2);

    this.mesh.position.copy(this.position);
    this.orientAlongVelocity();

    scene.add(this.mesh);
  }

  private orientAlongVelocity() {
    if (this.velocity.lengthSq() > 0.001) {
      const dir = this.velocity.clone().normalize();
      const lookTarget = this.position.clone().add(dir);
      this.mesh.lookAt(lookTarget);
    }
  }

  update(world: VoxelWorld, mobs: Mob[], dt: number): boolean {
    this.lifeTimer += dt;
    if (this.lifeTimer > 20) {
      this.destroy();
      return false;
    }

    if (this.isEmbedded) {
      return true;
    }

    // Apply gravity
    this.velocity.y -= 12.0 * dt;

    const prevPos = this.position.clone();
    const nextPos = this.position.clone().addScaledVector(this.velocity, dt);

    // Check mob collisions along trajectory
    for (const mob of mobs) {
      if (mob.isDead) continue;
      const mobCenter = mob.position.clone().add(new THREE.Vector3(0, 0.6, 0));
      const dist = nextPos.distanceTo(mobCenter);
      if (dist < 0.85) {
        // Hit mob!
        mob.health -= 8;
        soundManager.playArrowHit();

        // Knockback mob
        const knockDir = this.velocity.clone().normalize();
        mob.velocity.x += knockDir.x * 4;
        mob.velocity.y += 3;
        mob.velocity.z += knockDir.z * 4;

        if (mob.health <= 0) {
          mob.isDead = true;
          this.scene.remove(mob.group);
        }

        this.destroy();
        return false;
      }
    }

    // Check block collision (ray marching)
    const block = world.getBlock(Math.floor(nextPos.x), Math.floor(nextPos.y), Math.floor(nextPos.z));
    if (block !== BLOCK_IDS.AIR && block !== BLOCK_IDS.WATER) {
      // Embed arrow into block
      this.position.copy(nextPos);
      this.mesh.position.copy(this.position);
      this.isEmbedded = true;
      this.velocity.set(0, 0, 0);
      soundManager.playArrowHit();
      return true;
    }

    // Move arrow forward
    this.position.copy(nextPos);
    this.mesh.position.copy(this.position);
    this.orientAlongVelocity();

    return true;
  }

  destroy() {
    this.shouldRemove = true;
    this.scene.remove(this.mesh);
  }
}
