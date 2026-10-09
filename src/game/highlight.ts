import * as THREE from 'three';
import { generateCrackTextures } from './textures.ts';

export class BlockHighlight {
  public outlineMesh: THREE.LineSegments;
  public crackMesh: THREE.Mesh;
  private scene: THREE.Scene;
  private crackTextures: THREE.CanvasTexture[];
  private crackMaterial: THREE.MeshBasicMaterial;

  constructor(scene: THREE.Scene) {
    this.scene = scene;

    // Outline Box (black wireframe around targeted block)
    const boxGeo = new THREE.BoxGeometry(1.002, 1.002, 1.002);
    const edges = new THREE.EdgesGeometry(boxGeo);
    const lineMat = new THREE.LineBasicMaterial({ color: 0x000000, linewidth: 1.5 });
    this.outlineMesh = new THREE.LineSegments(edges, lineMat);
    this.outlineMesh.visible = false;
    scene.add(this.outlineMesh);

    // Crack Overlay Box
    const crackCanvases = generateCrackTextures();
    this.crackTextures = crackCanvases.map((c) => {
      const tex = new THREE.CanvasTexture(c);
      tex.magFilter = THREE.NearestFilter;
      tex.minFilter = THREE.NearestFilter;
      return tex;
    });

    this.crackMaterial = new THREE.MeshBasicMaterial({
      map: this.crackTextures[0],
      transparent: true,
      opacity: 0.85,
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: -1,
    });

    const crackGeo = new THREE.BoxGeometry(1.004, 1.004, 1.004);
    this.crackMesh = new THREE.Mesh(crackGeo, this.crackMaterial);
    this.crackMesh.visible = false;
    scene.add(this.crackMesh);
  }

  update(targetPos: THREE.Vector3 | null, miningProgress: number = 0) {
    if (!targetPos) {
      this.outlineMesh.visible = false;
      this.crackMesh.visible = false;
      return;
    }

    // Set position at center of targeted block
    const bx = Math.floor(targetPos.x) + 0.5;
    const by = Math.floor(targetPos.y) + 0.5;
    const bz = Math.floor(targetPos.z) + 0.5;

    this.outlineMesh.position.set(bx, by, bz);
    this.outlineMesh.visible = true;

    if (miningProgress > 0) {
      const stage = Math.min(9, Math.floor(miningProgress * 10));
      this.crackMaterial.map = this.crackTextures[stage];
      this.crackMaterial.needsUpdate = true;
      this.crackMesh.position.set(bx, by, bz);
      this.crackMesh.visible = true;
    } else {
      this.crackMesh.visible = false;
    }
  }

  dispose() {
    this.scene.remove(this.outlineMesh);
    this.scene.remove(this.crackMesh);
    this.outlineMesh.geometry.dispose();
    this.crackMesh.geometry.dispose();
    this.crackMaterial.dispose();
    for (const t of this.crackTextures) {
      t.dispose();
    }
  }
}
