import * as THREE from 'three';

export const ATLAS_COLS = 8;
export const ATLAS_ROWS = 8;
export const TILE_SIZE = 16;
export const ATLAS_SIZE = ATLAS_COLS * TILE_SIZE; // 128x128

// Pseudo-random helper with seed for deterministic texture noise
function createRng(seed = 12345) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

// Draw 16x16 pixel textures
export function generateAtlasCanvas(): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = ATLAS_SIZE;
  canvas.height = ATLAS_SIZE;
  const ctx = canvas.getContext('2d')!;
  ctx.imageSmoothingEnabled = false;

  // Clear black
  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, ATLAS_SIZE, ATLAS_SIZE);

  const drawTile = (tileIndex: number, painter: (ctx: CanvasRenderingContext2D, x: number, y: number) => void) => {
    const col = tileIndex % ATLAS_COLS;
    const row = Math.floor(tileIndex / ATLAS_COLS);
    const tx = col * TILE_SIZE;
    const ty = row * TILE_SIZE;

    ctx.save();
    ctx.translate(tx, ty);
    painter(ctx, 0, 0);
    ctx.restore();
  };

  // 0: Grass Top (#5b8c32)
  drawTile(0, (c) => {
    const rng = createRng(100);
    for (let y = 0; y < 16; y++) {
      for (let x = 0; x < 16; x++) {
        const r = rng();
        const g = Math.floor(130 + r * 35);
        const red = Math.floor(75 + r * 25);
        const b = Math.floor(40 + r * 20);
        c.fillStyle = `rgb(${red},${g},${b})`;
        c.fillRect(x, y, 1, 1);
      }
    }
  });

  // 1: Grass Side (Dirt with green dripping top)
  drawTile(1, (c) => {
    const rng = createRng(101);
    // Base dirt
    for (let y = 0; y < 16; y++) {
      for (let x = 0; x < 16; x++) {
        const r = rng();
        const base = Math.floor(100 + r * 30);
        c.fillStyle = `rgb(${base + 20},${Math.floor(base * 0.7)},${Math.floor(base * 0.45)})`;
        c.fillRect(x, y, 1, 1);
      }
    }
    // Grass top fringe
    for (let x = 0; x < 16; x++) {
      const dropHeight = 2 + Math.floor(rng() * 3);
      for (let y = 0; y < dropHeight; y++) {
        const r = rng();
        c.fillStyle = `rgb(${Math.floor(75 + r * 25)},${Math.floor(130 + r * 35)},${Math.floor(40 + r * 20)})`;
        c.fillRect(x, y, 1, 1);
      }
    }
  });

  // 2: Dirt (#866043)
  drawTile(2, (c) => {
    const rng = createRng(102);
    for (let y = 0; y < 16; y++) {
      for (let x = 0; x < 16; x++) {
        const r = rng();
        const base = Math.floor(95 + r * 35);
        c.fillStyle = `rgb(${base + 25},${Math.floor(base * 0.72)},${Math.floor(base * 0.48)})`;
        c.fillRect(x, y, 1, 1);
      }
    }
  });

  // 3: Stone (#7a7a7a)
  drawTile(3, (c) => {
    const rng = createRng(103);
    for (let y = 0; y < 16; y++) {
      for (let x = 0; x < 16; x++) {
        const r = rng();
        const g = Math.floor(105 + r * 40);
        c.fillStyle = `rgb(${g},${g},${g})`;
        c.fillRect(x, y, 1, 1);
      }
    }
  });

  // 4: Cobblestone (stones with dark mortar cracks)
  drawTile(4, (c) => {
    const rng = createRng(104);
    for (let y = 0; y < 16; y++) {
      for (let x = 0; x < 16; x++) {
        const r = rng();
        let g = Math.floor(100 + r * 45);
        // Add dark mortar borders
        if ((x % 5 === 0 && y % 4 !== 0) || (y % 4 === 0)) {
          g = Math.floor(45 + r * 25);
        }
        c.fillStyle = `rgb(${g},${g},${g})`;
        c.fillRect(x, y, 1, 1);
      }
    }
  });

  // 5: Oak Log Side (vertical bark stripes)
  drawTile(5, (c) => {
    const rng = createRng(105);
    for (let y = 0; y < 16; y++) {
      for (let x = 0; x < 16; x++) {
        const r = rng();
        const stripe = (x % 4 === 0) ? -25 : (x % 2 === 0 ? 10 : 0);
        const base = Math.max(40, Math.min(160, Math.floor(90 + stripe + r * 20)));
        c.fillStyle = `rgb(${base + 20},${Math.floor(base * 0.7)},${Math.floor(base * 0.4)})`;
        c.fillRect(x, y, 1, 1);
      }
    }
  });

  // 6: Oak Log Top (concentric wood rings)
  drawTile(6, (c) => {
    const rng = createRng(106);
    for (let y = 0; y < 16; y++) {
      for (let x = 0; x < 16; x++) {
        const dx = x - 7.5;
        const dy = y - 7.5;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const r = rng();
        let base = Math.floor(165 + r * 20);
        if (dist > 6.2) {
          // Dark bark rim
          base = Math.floor(70 + r * 20);
          c.fillStyle = `rgb(${base + 20},${Math.floor(base * 0.7)},${Math.floor(base * 0.4)})`;
        } else {
          // Rings
          if (Math.floor(dist) % 2 === 0) base -= 25;
          c.fillStyle = `rgb(${base + 10},${Math.floor(base * 0.82)},${Math.floor(base * 0.55)})`;
        }
        c.fillRect(x, y, 1, 1);
      }
    }
  });

  // 7: Leaves (#2e6918 dappled green)
  drawTile(7, (c) => {
    const rng = createRng(107);
    for (let y = 0; y < 16; y++) {
      for (let x = 0; x < 16; x++) {
        const r = rng();
        if (r < 0.18) {
          // Transparent gaps / darker see-through illusion
          c.fillStyle = 'rgba(25, 60, 15, 0.9)';
        } else {
          const g = Math.floor(90 + r * 55);
          c.fillStyle = `rgb(${Math.floor(g * 0.45)},${g},${Math.floor(g * 0.25)})`;
        }
        c.fillRect(x, y, 1, 1);
      }
    }
  });

  // 8: Planks (4 horizontal wooden boards)
  drawTile(8, (c) => {
    const rng = createRng(108);
    for (let y = 0; y < 16; y++) {
      for (let x = 0; x < 16; x++) {
        const r = rng();
        let base = Math.floor(170 + r * 25);
        if (y % 4 === 0) base -= 65; // Horizontal seam
        if ((y < 4 && x === 7) || (y >= 4 && y < 8 && x === 13) || (y >= 8 && y < 12 && x === 5) || (y >= 12 && x === 11)) {
          base -= 50; // Vertical nail/seam
        }
        c.fillStyle = `rgb(${base + 15},${Math.floor(base * 0.78)},${Math.floor(base * 0.5)})`;
        c.fillRect(x, y, 1, 1);
      }
    }
  });

  // 9: Sand (#d8cd9d)
  drawTile(9, (c) => {
    const rng = createRng(109);
    for (let y = 0; y < 16; y++) {
      for (let x = 0; x < 16; x++) {
        const r = rng();
        const base = Math.floor(205 + r * 30);
        c.fillStyle = `rgb(${base + 10},${base},${Math.floor(base * 0.72)})`;
        c.fillRect(x, y, 1, 1);
      }
    }
  });

  // 10: Glass (frame + cyan tint + diagonal glare streak)
  drawTile(10, (c) => {
    c.fillStyle = 'rgba(180, 220, 240, 0.35)';
    c.fillRect(0, 0, 16, 16);
    // Border
    c.fillStyle = 'rgba(220, 240, 255, 0.85)';
    c.strokeRect(0.5, 0.5, 15, 15);
    // Glare streaks
    c.fillStyle = '#ffffff';
    c.fillRect(2, 2, 2, 2);
    c.fillRect(4, 4, 3, 2);
    c.fillRect(9, 3, 3, 2);
    c.fillRect(11, 5, 2, 2);
  });

  // 11: Brick
  drawTile(11, (c) => {
    const rng = createRng(111);
    for (let y = 0; y < 16; y++) {
      for (let x = 0; x < 16; x++) {
        const r = rng();
        const isMortar = (y % 4 === 0) || ((y < 4 || (y >= 8 && y < 12)) ? x % 8 === 0 : (x + 4) % 8 === 0);
        if (isMortar) {
          c.fillStyle = '#b5b0a7';
        } else {
          const red = Math.floor(155 + r * 40);
          c.fillStyle = `rgb(${red},${Math.floor(red * 0.42)},${Math.floor(red * 0.32)})`;
        }
        c.fillRect(x, y, 1, 1);
      }
    }
  });

  // Helper for ore generation
  const drawOre = (oreColor: string, gemColor2: string, seed: number) => {
    return (c: CanvasRenderingContext2D) => {
      const rng = createRng(seed);
      // Stone background
      for (let y = 0; y < 16; y++) {
        for (let x = 0; x < 16; x++) {
          const r = rng();
          const g = Math.floor(105 + r * 40);
          c.fillStyle = `rgb(${g},${g},${g})`;
          c.fillRect(x, y, 1, 1);
        }
      }
      // Gem flecks
      const clusters = [
        [3, 4], [4, 4], [4, 5],
        [9, 2], [10, 3], [10, 4],
        [7, 9], [8, 9], [8, 10], [9, 10],
        [2, 11], [3, 11], [3, 12],
        [12, 12], [13, 12], [12, 13]
      ];
      clusters.forEach(([x, y], idx) => {
        c.fillStyle = idx % 3 === 0 ? gemColor2 : oreColor;
        c.fillRect(x, y, 1, 1);
      });
    };
  };

  // 12: Coal Ore
  drawTile(12, drawOre('#242424', '#111111', 112));
  // 13: Iron Ore
  drawTile(13, drawOre('#d4a373', '#e8cbb1', 113));
  // 14: Gold Ore
  drawTile(14, drawOre('#f4c430', '#fff385', 114));
  // 15: Diamond Ore
  drawTile(15, drawOre('#40e0d0', '#aaf5ee', 115));

  // 16: Crafting Table Top
  drawTile(16, (c) => {
    // Planks base
    drawTile(8, () => {}); // reuse logic
    c.fillStyle = '#b08850';
    c.fillRect(0, 0, 16, 16);
    c.strokeStyle = '#5c3e1e';
    c.lineWidth = 1;
    c.strokeRect(1.5, 1.5, 13, 13);
    // 3x3 grid line
    c.fillStyle = '#452e16';
    c.fillRect(5, 2, 1, 12);
    c.fillRect(10, 2, 1, 12);
    c.fillRect(2, 5, 12, 1);
    c.fillRect(2, 10, 12, 1);
  });

  // 17: Crafting Table Side
  drawTile(17, (c) => {
    c.fillStyle = '#a67c48';
    c.fillRect(0, 0, 16, 16);
    c.fillStyle = '#42280d';
    c.fillRect(0, 0, 16, 2);
    c.fillRect(0, 14, 16, 2);
    // Saw silhouette
    c.fillStyle = '#7a7a7a';
    c.fillRect(3, 4, 10, 2);
    c.fillStyle = '#5c3e1e';
    c.fillRect(2, 4, 2, 4);
  });

  // 18: Crafting Table Front (hammer & pliers)
  drawTile(18, (c) => {
    c.fillStyle = '#a67c48';
    c.fillRect(0, 0, 16, 16);
    c.fillStyle = '#42280d';
    c.fillRect(0, 0, 16, 2);
    c.fillRect(0, 14, 16, 2);
    // Tools
    c.fillStyle = '#8b5a2b';
    c.fillRect(4, 5, 2, 6);
    c.fillStyle = '#555555';
    c.fillRect(3, 4, 4, 2);
  });

  // 19: Furnace Front
  drawTile(19, (c) => {
    drawTile(4, () => {});
    c.fillStyle = '#7a7a7a';
    c.fillRect(0, 0, 16, 16);
    // Dark mouth
    c.fillStyle = '#222222';
    c.fillRect(3, 7, 10, 7);
    c.fillStyle = '#e86a17';
    c.fillRect(5, 10, 6, 3); // burning ember
  });

  // 20: Furnace Side
  drawTile(20, (c) => {
    const rng = createRng(120);
    for (let y = 0; y < 16; y++) {
      for (let x = 0; x < 16; x++) {
        const r = rng();
        const g = Math.floor(95 + r * 40);
        c.fillStyle = `rgb(${g},${g},${g})`;
        c.fillRect(x, y, 1, 1);
      }
    }
  });

  // 21: Furnace Top
  drawTile(21, (c) => {
    const rng = createRng(121);
    for (let y = 0; y < 16; y++) {
      for (let x = 0; x < 16; x++) {
        const r = rng();
        const g = Math.floor(100 + r * 40);
        c.fillStyle = `rgb(${g},${g},${g})`;
        c.fillRect(x, y, 1, 1);
      }
    }
  });

  // 22: TNT Top
  drawTile(22, (c) => {
    c.fillStyle = '#b82a20';
    c.fillRect(0, 0, 16, 16);
    c.fillStyle = '#e0dad5';
    c.fillRect(2, 2, 12, 12);
    c.fillStyle = '#403d3a';
    c.fillRect(7, 7, 2, 2); // fuse center
  });

  // 23: TNT Bottom
  drawTile(23, (c) => {
    c.fillStyle = '#b82a20';
    c.fillRect(0, 0, 16, 16);
    c.fillStyle = '#7a1c15';
    c.fillRect(3, 3, 10, 10);
  });

  // 24: TNT Side (red with white band and 'TNT')
  drawTile(24, (c) => {
    c.fillStyle = '#b82a20';
    c.fillRect(0, 0, 16, 16);
    c.fillStyle = '#dedbd5';
    c.fillRect(0, 5, 16, 6);
    // Draw TNT letters
    c.fillStyle = '#000000';
    // T
    c.fillRect(2, 6, 3, 1);
    c.fillRect(3, 7, 1, 3);
    // N
    c.fillRect(6, 6, 1, 4);
    c.fillRect(7, 7, 1, 1);
    c.fillRect(8, 8, 1, 1);
    c.fillRect(9, 6, 1, 4);
    // T
    c.fillRect(11, 6, 3, 1);
    c.fillRect(12, 7, 1, 3);
  });

  // 25: Bookshelf Side
  drawTile(25, (c) => {
    c.fillStyle = '#b8945f';
    c.fillRect(0, 0, 16, 16);
    // Shelves
    c.fillStyle = '#543d22';
    c.fillRect(0, 0, 16, 1);
    c.fillRect(0, 7, 16, 2);
    c.fillRect(0, 15, 16, 1);
    // Books
    const bookColors = ['#a83232', '#3266a8', '#32a852', '#a89432', '#7a32a8'];
    for (let x = 1; x < 15; x += 2) {
      c.fillStyle = bookColors[(x * 3) % bookColors.length];
      c.fillRect(x, 1, 2, 6);
      c.fillStyle = bookColors[(x * 5) % bookColors.length];
      c.fillRect(x, 9, 2, 6);
    }
  });

  // 26: Bedrock
  drawTile(26, (c) => {
    const rng = createRng(126);
    for (let y = 0; y < 16; y++) {
      for (let x = 0; x < 16; x++) {
        const r = rng();
        const g = Math.floor(25 + r * 50);
        c.fillStyle = `rgb(${g},${g},${g})`;
        c.fillRect(x, y, 1, 1);
      }
    }
  });

  // 27: Glowstone
  drawTile(27, (c) => {
    const rng = createRng(127);
    for (let y = 0; y < 16; y++) {
      for (let x = 0; x < 16; x++) {
        const r = rng();
        const base = Math.floor(190 + r * 65);
        c.fillStyle = `rgb(${base},${Math.floor(base * 0.82)},${Math.floor(base * 0.35)})`;
        c.fillRect(x, y, 1, 1);
      }
    }
  });

  // 28: Water (translucent bluish)
  drawTile(28, (c) => {
    const rng = createRng(128);
    for (let y = 0; y < 16; y++) {
      for (let x = 0; x < 16; x++) {
        const r = rng();
        const b = Math.floor(190 + r * 50);
        c.fillStyle = `rgba(35, ${Math.floor(80 + r * 30)}, ${b}, 0.75)`;
        c.fillRect(x, y, 1, 1);
      }
    }
  });

  // 29: Chest Top
  drawTile(29, (c) => {
    c.fillStyle = '#8f6836';
    c.fillRect(0, 0, 16, 16);
    c.strokeStyle = '#3e2912';
    c.lineWidth = 1;
    c.strokeRect(1.5, 1.5, 13, 13);
  });

  // 30: Chest Side
  drawTile(30, (c) => {
    c.fillStyle = '#8f6836';
    c.fillRect(0, 0, 16, 16);
    c.fillStyle = '#3e2912';
    c.fillRect(0, 4, 16, 1);
    c.strokeRect(1.5, 1.5, 13, 13);
  });

  // 31: Chest Front (with lock)
  drawTile(31, (c) => {
    c.fillStyle = '#8f6836';
    c.fillRect(0, 0, 16, 16);
    c.fillStyle = '#3e2912';
    c.fillRect(0, 4, 16, 1);
    c.strokeRect(1.5, 1.5, 13, 13);
    // Silver latch
    c.fillStyle = '#cfcfcf';
    c.fillRect(7, 3, 2, 4);
    c.fillStyle = '#555555';
    c.fillRect(7, 4, 2, 1);
  });

  // 32: Snow Top
  drawTile(32, (c) => {
    const rng = createRng(132);
    for (let y = 0; y < 16; y++) {
      for (let x = 0; x < 16; x++) {
        const r = rng();
        const base = Math.floor(235 + r * 20);
        c.fillStyle = `rgb(${base},${base},${base + 5})`;
        c.fillRect(x, y, 1, 1);
      }
    }
  });

  // 33: Snow Side
  drawTile(33, (c) => {
    // Dirt base with snowy top
    const rng = createRng(133);
    for (let y = 0; y < 16; y++) {
      for (let x = 0; x < 16; x++) {
        const r = rng();
        if (y < 4 || (y < 6 && r > 0.5)) {
          const base = Math.floor(235 + r * 20);
          c.fillStyle = `rgb(${base},${base},${base + 5})`;
        } else {
          const base = Math.floor(95 + r * 35);
          c.fillStyle = `rgb(${base + 25},${Math.floor(base * 0.72)},${Math.floor(base * 0.48)})`;
        }
        c.fillRect(x, y, 1, 1);
      }
    }
  });

  // 34: Torch
  drawTile(34, (c) => {
    c.fillStyle = 'rgba(0, 0, 0, 0)';
    c.clearRect(0, 0, 16, 16);
    // Stick
    c.fillStyle = '#7a5229';
    c.fillRect(7, 6, 2, 9);
    // Coal tip
    c.fillStyle = '#261b12';
    c.fillRect(7, 4, 2, 2);
    // Flame
    c.fillStyle = '#ff7b00';
    c.fillRect(6, 2, 4, 3);
    c.fillStyle = '#ffee33';
    c.fillRect(7, 1, 2, 2);
  });

  // 35: Red Wool
  drawTile(35, (c) => {
    const rng = createRng(135);
    for (let y = 0; y < 16; y++) {
      for (let x = 0; x < 16; x++) {
        const r = rng();
        const red = Math.floor(160 + r * 50);
        c.fillStyle = `rgb(${red},${Math.floor(red * 0.2)},${Math.floor(red * 0.2)})`;
        c.fillRect(x, y, 1, 1);
      }
    }
  });

  // 36: Blue Wool
  drawTile(36, (c) => {
    const rng = createRng(136);
    for (let y = 0; y < 16; y++) {
      for (let x = 0; x < 16; x++) {
        const r = rng();
        const b = Math.floor(160 + r * 50);
        c.fillStyle = `rgb(${Math.floor(b * 0.2)},${Math.floor(b * 0.35)},${b})`;
        c.fillRect(x, y, 1, 1);
      }
    }
  });

  // 37: Yellow Wool
  drawTile(37, (c) => {
    const rng = createRng(137);
    for (let y = 0; y < 16; y++) {
      for (let x = 0; x < 16; x++) {
        const r = rng();
        const base = Math.floor(190 + r * 55);
        c.fillStyle = `rgb(${base},${Math.floor(base * 0.85)},${Math.floor(base * 0.2)})`;
        c.fillRect(x, y, 1, 1);
      }
    }
  });

  // 38: Green Wool
  drawTile(38, (c) => {
    const rng = createRng(138);
    for (let y = 0; y < 16; y++) {
      for (let x = 0; x < 16; x++) {
        const r = rng();
        const g = Math.floor(130 + r * 50);
        c.fillStyle = `rgb(${Math.floor(g * 0.3)},${g},${Math.floor(g * 0.2)})`;
        c.fillRect(x, y, 1, 1);
      }
    }
  });

  return canvas;
}

// Generate Crack Overlay Canvas (10 stages from 0 to 9)
export function generateCrackTextures(): HTMLCanvasElement[] {
  const canvases: HTMLCanvasElement[] = [];
  for (let stage = 0; stage < 10; stage++) {
    const cvs = document.createElement('canvas');
    cvs.width = 16;
    cvs.height = 16;
    const ctx = cvs.getContext('2d')!;
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, 16, 16);

    ctx.strokeStyle = 'rgba(0, 0, 0, 0.75)';
    ctx.lineWidth = 1;

    // Draw progressive crack lines based on stage
    const lines = [
      [[8, 8], [6, 4]],
      [[8, 8], [11, 6]],
      [[6, 4], [3, 2]],
      [[8, 8], [9, 12]],
      [[9, 12], [13, 14]],
      [[6, 4], [4, 7]],
      [[11, 6], [14, 5]],
      [[4, 7], [2, 10]],
      [[9, 12], [6, 14]],
      [[8, 8], [3, 12]],
    ];

    ctx.beginPath();
    const count = Math.min(lines.length, stage + 1);
    for (let i = 0; i < count; i++) {
      const [from, to] = lines[i];
      ctx.moveTo(from[0], from[1]);
      ctx.lineTo(to[0], to[1]);
    }
    ctx.stroke();

    canvases.push(cvs);
  }
  return canvases;
}

let cachedTexture: THREE.CanvasTexture | null = null;

export function getAtlasTexture(): THREE.CanvasTexture {
  if (!cachedTexture) {
    const canvas = generateAtlasCanvas();
    cachedTexture = new THREE.CanvasTexture(canvas);
    cachedTexture.magFilter = THREE.NearestFilter;
    cachedTexture.minFilter = THREE.NearestFilter;
    cachedTexture.colorSpace = THREE.SRGBColorSpace;
    cachedTexture.wrapS = THREE.ClampToEdgeWrapping;
    cachedTexture.wrapT = THREE.ClampToEdgeWrapping;
  }
  return cachedTexture;
}

// Map texture index to UV coordinates in the atlas
export function getTileUV(tileIndex: number): [number, number, number, number] {
  const col = tileIndex % ATLAS_COLS;
  const row = Math.floor(tileIndex / ATLAS_COLS);

  // In WebGL texture coordinates, (0,0) is bottom-left
  // whereas canvas is top-left
  const u0 = col / ATLAS_COLS;
  const u1 = (col + 1) / ATLAS_COLS;
  const v1 = 1.0 - row / ATLAS_ROWS;
  const v0 = 1.0 - (row + 1) / ATLAS_ROWS;

  return [u0, v0, u1, v1];
}

// Generate standalone icon data URL for items & blocks (for inventory and HUD)
const itemIconCache = new Map<number, string>();

export function getItemIcon(id: number): string {
  if (itemIconCache.has(id)) {
    return itemIconCache.get(id)!;
  }

  const cvs = document.createElement('canvas');
  cvs.width = 32;
  cvs.height = 32;
  const ctx = cvs.getContext('2d')!;
  ctx.imageSmoothingEnabled = false;

  // If it's a tool or item (100+)
  if (id >= 100) {
    drawItemIcon(ctx, id);
  } else {
    // It's a block - render isometric 3D block cube preview!
    drawIsometricBlock(ctx, id);
  }

  const url = cvs.toDataURL('image/png');
  itemIconCache.set(id, url);
  return url;
}

function drawIsometricBlock(ctx: CanvasRenderingContext2D, blockId: number) {
  // Draw mini 3D isometric cube
  const atlas = generateAtlasCanvas();
  // We can pick top, front, and side faces
  // Simple isometric cube drawing
  const cx = 16;
  const cy = 16;

  // Face top
  ctx.fillStyle = blockId === 1 ? '#5b8c32' : (blockId === 5 ? '#b8945f' : (blockId === 14 ? '#40e0d0' : (blockId === 8 ? '#d8cd9d' : '#888888')));
  ctx.beginPath();
  ctx.moveTo(cx, cy - 12);
  ctx.lineTo(cx + 12, cy - 5);
  ctx.lineTo(cx, cy + 2);
  ctx.lineTo(cx - 12, cy - 5);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#222';
  ctx.stroke();

  // Face left
  ctx.fillStyle = blockId === 1 ? '#725137' : (blockId === 5 ? '#6b5030' : '#666666');
  ctx.beginPath();
  ctx.moveTo(cx - 12, cy - 5);
  ctx.lineTo(cx, cy + 2);
  ctx.lineTo(cx, cy + 14);
  ctx.lineTo(cx - 12, cy + 7);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Face right
  ctx.fillStyle = blockId === 1 ? '#5c3f2b' : (blockId === 5 ? '#543d22' : '#555555');
  ctx.beginPath();
  ctx.moveTo(cx, cy + 2);
  ctx.lineTo(cx + 12, cy - 5);
  ctx.lineTo(cx + 12, cy + 7);
  ctx.lineTo(cx, cy + 14);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
}

function drawItemIcon(ctx: CanvasRenderingContext2D, itemId: number) {
  ctx.scale(2, 2); // 16x16 coordinate space scaled to 32x32

  if (itemId === 111) {
    // Stick
    ctx.strokeStyle = '#8b5a2b';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(3, 13);
    ctx.lineTo(13, 3);
    ctx.stroke();
    return;
  }

  if (itemId === 112) {
    // Coal
    ctx.fillStyle = '#222222';
    ctx.beginPath();
    ctx.arc(8, 8, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#444';
    ctx.fillRect(6, 6, 3, 3);
    return;
  }

  if (itemId === 113) {
    // Iron Ingot
    ctx.fillStyle = '#e0e0e0';
    ctx.fillRect(4, 6, 8, 4);
    ctx.strokeStyle = '#999';
    ctx.strokeRect(4, 6, 8, 4);
    return;
  }

  if (itemId === 114) {
    // Gold Ingot
    ctx.fillStyle = '#ffd700';
    ctx.fillRect(4, 6, 8, 4);
    ctx.strokeStyle = '#b8860b';
    ctx.strokeRect(4, 6, 8, 4);
    return;
  }

  if (itemId === 115) {
    // Diamond
    ctx.fillStyle = '#40e0d0';
    ctx.beginPath();
    ctx.moveTo(8, 3);
    ctx.lineTo(13, 7);
    ctx.lineTo(8, 13);
    ctx.lineTo(3, 7);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.stroke();
    return;
  }

  if (itemId === 116) {
    // Apple
    ctx.fillStyle = '#d32f2f';
    ctx.beginPath();
    ctx.arc(8, 9, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#558b2f';
    ctx.fillRect(8, 3, 2, 3); // stem
    return;
  }

  // Tools: Pickaxe, Sword, Axe, Shovel
  const isPickaxe = itemId >= 101 && itemId <= 104;
  const isSword = itemId >= 105 && itemId <= 108;
  const isAxe = itemId === 109;
  const isShovel = itemId === 110;

  // Handle color: stick
  ctx.strokeStyle = '#8b5a2b';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(3, 13);
  ctx.lineTo(11, 5);
  ctx.stroke();

  // Head material color
  let matColor = '#a07548'; // wood
  if (itemId === 102 || itemId === 106) matColor = '#9e9e9e'; // stone
  if (itemId === 103 || itemId === 107) matColor = '#e0e0e0'; // iron
  if (itemId === 104 || itemId === 108) matColor = '#40e0d0'; // diamond

  ctx.fillStyle = matColor;
  ctx.strokeStyle = '#222';
  ctx.lineWidth = 0.5;

  if (isPickaxe) {
    ctx.beginPath();
    ctx.moveTo(6, 4);
    ctx.lineTo(12, 4);
    ctx.lineTo(14, 8);
    ctx.lineTo(12, 6);
    ctx.lineTo(8, 6);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  } else if (isSword) {
    ctx.beginPath();
    ctx.moveTo(6, 6);
    ctx.lineTo(13, 2);
    ctx.lineTo(14, 3);
    ctx.lineTo(7, 7);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    // Guard
    ctx.fillStyle = '#ffb300';
    ctx.fillRect(5, 7, 3, 1.5);
  } else if (isAxe) {
    ctx.fillRect(9, 3, 4, 4);
    ctx.strokeRect(9, 3, 4, 4);
  } else if (isShovel) {
    ctx.beginPath();
    ctx.arc(11, 4, 2.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }
}
