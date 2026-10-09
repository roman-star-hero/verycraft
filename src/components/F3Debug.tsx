import React from 'react';
import { PlayerState } from '../game/types.ts';

interface F3DebugProps {
  isVisible: boolean;
  playerState: PlayerState;
  fps: number;
  timeHours: number;
  timeMinutes: number;
  mobCount: number;
}

export const F3Debug: React.FC<F3DebugProps> = ({
  isVisible,
  playerState,
  fps,
  timeHours,
  timeMinutes,
  mobCount,
}) => {
  if (!isVisible) return null;

  const { x, y, z, yaw, pitch, onGround, inWater, isFlying, gameMode } = playerState;

  // Calculate facing direction
  // Yaw normalized to 0..360
  const deg = (((yaw * 180) / Math.PI) % 360 + 360) % 360;
  let facing = 'North (-Z)';
  if (deg >= 45 && deg < 135) facing = 'West (-X)';
  else if (deg >= 135 && deg < 225) facing = 'South (+Z)';
  else if (deg >= 225 && deg < 315) facing = 'East (+X)';

  const blockX = Math.floor(x);
  const blockY = Math.floor(y);
  const blockZ = Math.floor(z);
  const chunkX = Math.floor(x / 16);
  const chunkZ = Math.floor(z / 16);

  // Biome estimation
  let biome = 'Plains (Равнины)';
  if (y >= 26) biome = 'Mountains (Горы / Снег)';
  else if (y <= 11) biome = 'Beach / Shore (Побережье)';
  else if ((Math.abs(blockX) + Math.abs(blockZ)) % 30 > 15) biome = 'Forest (Дубовый лес)';

  const pad = (n: number) => n.toString().padStart(2, '0');

  return (
    <div className="pointer-events-none fixed top-2 left-2 z-40 font-pixel text-[11px] text-white select-none space-y-1">
      <div className="bg-black/60 px-2.5 py-1.5 rounded-xs border-l-2 border-emerald-400 space-y-1 leading-relaxed shadow-lg">
        <p className="text-emerald-300 font-bold">CraftVoxel v1.0 (WebGL / Three.js)</p>
        <p>
          <span className="text-yellow-300">{fps} fps</span> · {gameMode.toUpperCase()}
        </p>
        <p>
          XYZ: <span className="text-sky-300">{x.toFixed(3)}</span> / <span className="text-sky-300">{y.toFixed(3)}</span> / <span className="text-sky-300">{z.toFixed(3)}</span>
        </p>
        <p>
          Block: {blockX} {blockY} {blockZ} [Chunk: {chunkX}, {chunkZ}]
        </p>
        <p>
          Facing: <span className="text-amber-200">{facing}</span> (yaw: {deg.toFixed(1)}°, pitch: {((pitch * 180) / Math.PI).toFixed(1)}°)
        </p>
        <p>Biome: <span className="text-green-300">{biome}</span></p>
        <p>
          Time: <span className="text-cyan-300">{pad(timeHours)}:{pad(timeMinutes)}</span> · Mobs: {mobCount}
        </p>
        <p className="text-neutral-400 text-[10px]">
          State: {onGround ? 'onGround' : 'inAir'} {inWater ? '· inWater' : ''} {isFlying ? '· Flying' : ''}
        </p>
      </div>
    </div>
  );
};
