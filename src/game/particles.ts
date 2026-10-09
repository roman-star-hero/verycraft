import * as THREE from 'three';
import { BLOCKS, BLOCK_IDS } from './blocks.ts';
import { getTileUV, getAtlasTexture } from './textures.ts';
import { soundManager } from './audio.ts';
import { VoxelWorld } from './world.ts';

interface Particle {
  mesh: THREE.Mesh;
  velocity: THREE.Vector3;
  life: number;
  maxLife: number;
}

export class ParticleSystem {
  private scene: THREE.Scene;
  private particles: Particle[] = [];
  private material: THREE.MeshBasicMaterial;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.material = new THREE.MeshBasicMaterial({
      map: getAtlasTexture(),
    });
  }

  // Spawn break debris for a block
  spawnBlockBreakParticles(x: number, y: number, z: number, blockId: number) {
    const blockDef = BLOCKS[blockId];
    if (!blockDef) return;

    const count = 12;
    const size = 0.18;
    const geometry = new THREE.BoxGeometry(size, size, size);

    // Apply block texture UV
    const textureIdx = blockDef.textureIndices[0];
    const [u0, v0, u1, v1] = getTileUV(textureIdx);
    const uvs = geometry.attributes.uv.array as Float32Array;
    for (let i = 0; i < uvs.length; i += 2) {
      uvs[i] = u0 + uvs[i] * (u1 - u0);
      uvs[i + 1] = v0 + uvs[i + 1] * (v1 - v0);
    }
    geometry.attributes.uv.needsUpdate = true;

    for (let i = 0; i < count; i++) {
      const mesh = new THREE.Mesh(geometry, this.material);
      mesh.position.set(
        x + 0.2 + Math.random() * 0.6,
        y + 0.2 + Math.random() * 0.6,
        z + 0.2 + Math.random() * 0.6
      );

      const vx = (Math.random() - 0.5) * 4.0;
      const vy = 2.0 + Math.random() * 3.5;
      const vz = (Math.random() - 0.5) * 4.0;

      this.scene.add(mesh);
      this.particles.push({
        mesh,
        velocity: new THREE.Vector3(vx, vy, vz),
        life: 0,
        maxLife: 0.6 + Math.random() * 0.3,
      });
    }
  }

  // Update particles
  update(dt: number) {
    const gravity = 18.0;

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life += dt;

      if (p.life >= p.maxLife) {
        this.scene.remove(p.mesh);
        p.mesh.geometry.dispose();
        this.particles.splice(i, 1);
        continue;
      }

      // Physics
      p.velocity.y -= gravity * dt;
      p.mesh.position.addScaledVector(p.velocity, dt);

      // Shrink over time
      const scale = Math.max(0.01, 1.0 - p.life / p.maxLife);
      p.mesh.scale.set(scale, scale, scale);
    }
  }

  dispose() {
    for (const p of this.particles) {
      this.scene.remove(p.mesh);
      p.mesh.geometry.dispose();
    }
    this.particles = [];
  }
}

// Primed TNT Entity
export class PrimedTNT {
  public mesh: THREE.Mesh;
  public position: THREE.Vector3;
  private timer: number = 3.0; // 3 second fuse
  private scene: THREE.Scene;
  private flashWhite: boolean = false;
  private onExplodeCallback: (x: number, y: number, z: number) => void;

  constructor(scene: THREE.Scene, x: number, y: number, z: number, onExplode: (x: number, y: number, z: number) => void) {
    this.scene = scene;
    this.position = new THREE.Vector3(x + 0.5, y + 0.5, z + 0.5);
    this.onExplodeCallback = onExplode;

    const geo = new THREE.BoxGeometry(0.98, 0.98, 0.98);
    const mat = new THREE.MeshBasicMaterial({
      map: getAtlasTexture(),
      color: 0xffffff,
    });
    this.mesh = new THREE.Mesh(geo, mat);
    this.mesh.position.copy(this.position);
    this.scene.add(this.mesh);

    soundManager.playTntFuse();
  }

  update(dt: number): boolean {
    this.timer -= dt;

    // Pulse / Flash
    const flashFreq = (3.0 - this.timer) * 5;
    this.flashWhite = Math.sin(flashFreq * Math.PI) > 0;
    (this.mesh.material as THREE.MeshBasicMaterial).color.set(this.flashWhite ? 0xffffff : 0xcccccc);

    // Expand slightly
    const s = 1.0 + (3.0 - this.timer) * 0.08;
    this.mesh.scale.set(s, s, s);

    if (this.timer <= 0) {
      this.explode();
      return true; // Finished
    }
    return false;
  }

  private explode() {
    this.scene.remove(this.mesh);
    this.mesh.geometry.dispose();
    soundManager.playExplosion();
    this.onExplodeCallback(Math.floor(this.position.x), Math.floor(this.position.y), Math.floor(this.position.z));
  }
}
