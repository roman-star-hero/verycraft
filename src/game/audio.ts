// Comprehensive procedural Web Audio API sound synthesizer for Minecraft audio effects

class AudioManager {
  private ctx: AudioContext | null = null;
  private volume: number = 0.5;

  private initCtx() {
    if (!this.ctx) {
      const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtxClass();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  setVolume(vol: number) {
    this.volume = Math.max(0, Math.min(1, vol));
  }

  // Generate White Noise Buffer for crunch, rustle, water, and debris
  private createNoiseBuffer(duration: number): AudioBuffer | null {
    if (!this.ctx) return null;
    const bufferSize = Math.max(1, Math.floor(this.ctx.sampleRate * duration));
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    return buffer;
  }

  /**
   * 1. Walking sound effects for different block types
   * Fully procedural, dynamic pitch variation, material-specific acoustic properties
   */
  playStepSound(soundType: string = 'grass', volumeScale: number = 1.0) {
    if (this.volume <= 0) return;
    this.initCtx();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const pitch = 0.88 + Math.random() * 0.24; // subtle pitch variation for organic realism
    const masterGain = this.ctx.createGain();
    masterGain.gain.setValueAtTime(0.18 * this.volume * volumeScale, t);
    masterGain.connect(this.ctx.destination);

    switch (soundType) {
      case 'grass': {
        // Soft organic crunch / rustling blades of grass
        const duration = 0.14;
        const noise = this.ctx.createBufferSource();
        const buf = this.createNoiseBuffer(duration);
        if (!buf) return;
        noise.buffer = buf;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime((750 + Math.random() * 200) * pitch, t);
        filter.frequency.exponentialRampToValueAtTime(300, t + duration);

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.22, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + duration);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(masterGain);
        noise.start(t);
        break;
      }

      case 'stone': {
        // Crisp, sharp mineral click with hard footstep impact
        const duration = 0.09;
        const noise = this.ctx.createBufferSource();
        const buf = this.createNoiseBuffer(duration);
        if (!buf) return;
        noise.buffer = buf;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime((1500 + Math.random() * 250) * pitch, t);
        filter.Q.setValueAtTime(3.2, t);

        // High click transient
        const osc = this.ctx.createOscillator();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(320 * pitch, t);
        osc.frequency.exponentialRampToValueAtTime(80, t + 0.05);

        const oscGain = this.ctx.createGain();
        oscGain.gain.setValueAtTime(0.18, t);
        oscGain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
        osc.connect(oscGain);
        oscGain.connect(masterGain);
        osc.start(t);
        osc.stop(t + 0.06);

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.3, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + duration);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(masterGain);
        noise.start(t);
        break;
      }

      case 'wood': {
        // Hollow, resonant wooden clop/thud
        const duration = 0.13;
        const osc = this.ctx.createOscillator();
        const oscGain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime((190 + Math.random() * 30) * pitch, t);
        osc.frequency.exponentialRampToValueAtTime(75, t + duration);

        oscGain.gain.setValueAtTime(0.35, t);
        oscGain.gain.exponentialRampToValueAtTime(0.001, t + duration);
        osc.connect(oscGain);
        oscGain.connect(masterGain);
        osc.start(t);
        osc.stop(t + duration + 0.01);

        // Subtle muffled wood tap noise
        const noise = this.ctx.createBufferSource();
        const buf = this.createNoiseBuffer(0.07);
        if (buf) {
          noise.buffer = buf;
          const filter = this.ctx.createBiquadFilter();
          filter.type = 'lowpass';
          filter.frequency.setValueAtTime(450 * pitch, t);
          const noiseGain = this.ctx.createGain();
          noiseGain.gain.setValueAtTime(0.15, t);
          noiseGain.gain.exponentialRampToValueAtTime(0.001, t + 0.07);
          noise.connect(filter);
          filter.connect(noiseGain);
          noiseGain.connect(masterGain);
          noise.start(t);
        }
        break;
      }

      case 'sand': {
        // Granular, gritty crunchy friction
        const duration = 0.16;
        const noise = this.ctx.createBufferSource();
        const buf = this.createNoiseBuffer(duration);
        if (!buf) return;
        noise.buffer = buf;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime((950 + Math.random() * 200) * pitch, t);
        filter.Q.setValueAtTime(1.4, t);

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.24, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + duration);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(masterGain);
        noise.start(t);
        break;
      }

      case 'snow': {
        // Soft, powdery, high-frequency compaction crunch
        const duration = 0.13;
        const noise = this.ctx.createBufferSource();
        const buf = this.createNoiseBuffer(duration);
        if (!buf) return;
        noise.buffer = buf;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'highpass';
        filter.frequency.setValueAtTime((1800 + Math.random() * 300) * pitch, t);

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.2, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + duration);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(masterGain);
        noise.start(t);
        break;
      }

      case 'wool': {
        // Soft, cushioned, muffled dull tap
        const duration = 0.1;
        const noise = this.ctx.createBufferSource();
        const buf = this.createNoiseBuffer(duration);
        if (!buf) return;
        noise.buffer = buf;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(280 * pitch, t);

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.12, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + duration);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(masterGain);
        noise.start(t);
        break;
      }

      case 'glass': {
        // High-pitched, brittle crystalline tick
        const duration = 0.08;
        const osc = this.ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime((2400 + Math.random() * 300) * pitch, t);
        osc.frequency.exponentialRampToValueAtTime(1200, t + duration);

        const oscGain = this.ctx.createGain();
        oscGain.gain.setValueAtTime(0.15, t);
        oscGain.gain.exponentialRampToValueAtTime(0.001, t + duration);
        osc.connect(oscGain);
        oscGain.connect(masterGain);
        osc.start(t);
        osc.stop(t + duration);
        break;
      }

      case 'water': {
        // Sloshing shallow water wading step
        const duration = 0.18;
        const noise = this.ctx.createBufferSource();
        const buf = this.createNoiseBuffer(duration);
        if (!buf) return;
        noise.buffer = buf;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(900 * pitch, t);
        filter.frequency.exponentialRampToValueAtTime(450, t + duration);

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.28, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + duration);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(masterGain);
        noise.start(t);
        break;
      }

      case 'metal': {
        // Resonant metallic footstep
        const duration = 0.12;
        const osc = this.ctx.createOscillator();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime((850 + Math.random() * 100) * pitch, t);
        osc.frequency.exponentialRampToValueAtTime(250, t + duration);

        const oscGain = this.ctx.createGain();
        oscGain.gain.setValueAtTime(0.2, t);
        oscGain.gain.exponentialRampToValueAtTime(0.001, t + duration);
        osc.connect(oscGain);
        oscGain.connect(masterGain);
        osc.start(t);
        osc.stop(t + duration);
        break;
      }

      case 'dirt':
      default: {
        // Earthy, deep muffled soil impact
        const duration = 0.12;
        const noise = this.ctx.createBufferSource();
        const buf = this.createNoiseBuffer(duration);
        if (!buf) return;
        noise.buffer = buf;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime((480 + Math.random() * 100) * pitch, t);

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.2, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + duration);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(masterGain);
        noise.start(t);
        break;
      }
    }
  }

  /**
   * 2. Comprehensive Jumping sound effect
   * Upward aerodynamic whoosh + springy surface push-off
   */
  playJump(surfaceType: string = 'dirt') {
    if (this.volume <= 0) return;
    this.initCtx();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const duration = 0.18;

    // Upward air whoosh
    const osc = this.ctx.createOscillator();
    const oscGain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(110, t);
    osc.frequency.exponentialRampToValueAtTime(320, t + duration);

    oscGain.gain.setValueAtTime(0.22 * this.volume, t);
    oscGain.gain.exponentialRampToValueAtTime(0.001, t + duration);

    osc.connect(oscGain);
    oscGain.connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + duration + 0.01);

    // Friction whoosh noise
    const noise = this.ctx.createBufferSource();
    const buf = this.createNoiseBuffer(duration);
    if (buf) {
      noise.buffer = buf;
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(500, t);
      filter.frequency.exponentialRampToValueAtTime(1200, t + duration);

      const noiseGain = this.ctx.createGain();
      noiseGain.gain.setValueAtTime(0.18 * this.volume, t);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, t + duration);

      noise.connect(filter);
      filter.connect(noiseGain);
      noiseGain.connect(this.ctx.destination);
      noise.start(t);
    }

    // Quick surface push-off pop
    this.playStepSound(surfaceType, 0.7);
  }

  /**
   * 3. Comprehensive Landing sound effect
   * Dynamic impact volume & texture based on fall height and landing surface
   */
  playLand(surfaceType: string = 'dirt', fallDistance: number = 1.0) {
    if (this.volume <= 0) return;
    this.initCtx();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const intensity = Math.min(2.5, Math.max(0.6, fallDistance * 0.45));
    const duration = 0.22;

    // Deep heavy impact sub-bass thump
    const osc = this.ctx.createOscillator();
    const oscGain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(140, t);
    osc.frequency.exponentialRampToValueAtTime(40, t + duration);

    oscGain.gain.setValueAtTime(0.35 * this.volume * intensity, t);
    oscGain.gain.exponentialRampToValueAtTime(0.001, t + duration);

    osc.connect(oscGain);
    oscGain.connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + duration + 0.01);

    // Surface impact dispersion sound
    this.playStepSound(surfaceType, 1.4 * intensity);
  }

  /**
   * 4. Comprehensive Taking Damage sound effects
   * Classic vocalized formant "Oof!" + damage type specific textures (fall crunch, drown gurgle, etc.)
   */
  playDamage(damageType: 'hit' | 'fall' | 'drown' | 'generic' = 'hit', amount: number = 2) {
    if (this.volume <= 0) return;
    this.initCtx();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const duration = 0.24;

    // Iconic vocal grunt ("Oof!") using dual formant filters
    const osc = this.ctx.createOscillator();
    osc.type = 'sawtooth';
    // Sharp vocal pitch drop
    osc.frequency.setValueAtTime(175, t);
    osc.frequency.exponentialRampToValueAtTime(65, t + duration);

    // Formant filter 1 (first vowel resonance ~450Hz)
    const f1 = this.ctx.createBiquadFilter();
    f1.type = 'bandpass';
    f1.frequency.setValueAtTime(450, t);
    f1.Q.setValueAtTime(3.0, t);

    // Formant filter 2 (second vowel resonance ~950Hz)
    const f2 = this.ctx.createBiquadFilter();
    f2.type = 'bandpass';
    f2.frequency.setValueAtTime(950, t);
    f2.Q.setValueAtTime(3.5, t);

    const gruntGain = this.ctx.createGain();
    gruntGain.gain.setValueAtTime(0.45 * this.volume, t);
    gruntGain.gain.exponentialRampToValueAtTime(0.001, t + duration);

    osc.connect(f1);
    osc.connect(f2);
    f1.connect(gruntGain);
    f2.connect(gruntGain);
    gruntGain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + duration + 0.02);

    // Additional texture depending on damage type
    if (damageType === 'fall') {
      // Bone crunch / heavy physical impact crunch
      const crunchNoise = this.ctx.createBufferSource();
      const buf = this.createNoiseBuffer(0.2);
      if (buf) {
        crunchNoise.buffer = buf;
        const crunchFilter = this.ctx.createBiquadFilter();
        crunchFilter.type = 'bandpass';
        crunchFilter.frequency.setValueAtTime(1200, t);
        crunchFilter.Q.setValueAtTime(2.0, t);

        const crunchGain = this.ctx.createGain();
        crunchGain.gain.setValueAtTime(0.4 * this.volume, t);
        crunchGain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);

        crunchNoise.connect(crunchFilter);
        crunchFilter.connect(crunchGain);
        crunchGain.connect(this.ctx.destination);
        crunchNoise.start(t);
      }
    } else if (damageType === 'drown') {
      // Water bubble choke sound
      const bubbleOsc = this.ctx.createOscillator();
      const bubbleGain = this.ctx.createGain();
      bubbleOsc.type = 'sine';
      bubbleOsc.frequency.setValueAtTime(350, t);
      bubbleOsc.frequency.linearRampToValueAtTime(700, t + 0.08);
      bubbleOsc.frequency.linearRampToValueAtTime(280, t + 0.16);

      bubbleGain.gain.setValueAtTime(0.3 * this.volume, t);
      bubbleGain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);

      bubbleOsc.connect(bubbleGain);
      bubbleGain.connect(this.ctx.destination);
      bubbleOsc.start(t);
      bubbleOsc.stop(t + 0.19);
    }
  }

  // Alias for backward compatibility
  playHurt() {
    this.playDamage('hit');
  }

  // Block hit (punch thud)
  playBlockHit(soundType: string = 'stone') {
    if (this.volume <= 0) return;
    this.initCtx();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    const baseFreq = soundType === 'wood' ? 120 : (soundType === 'stone' ? 180 : 100);
    osc.frequency.setValueAtTime(baseFreq, t);
    osc.frequency.exponentialRampToValueAtTime(40, t + 0.08);

    gain.gain.setValueAtTime(0.25 * this.volume, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.09);
  }

  // Block break sound (crunch + pop)
  playBlockBreak(soundType: string = 'stone') {
    if (this.volume <= 0) return;
    this.initCtx();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    // Pop tone
    const osc = this.ctx.createOscillator();
    const oscGain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(250 + Math.random() * 100, t);
    osc.frequency.exponentialRampToValueAtTime(60, t + 0.15);
    oscGain.gain.setValueAtTime(0.3 * this.volume, t);
    oscGain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
    osc.connect(oscGain);
    oscGain.connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + 0.16);

    // Crunch noise
    const noise = this.ctx.createBufferSource();
    const buffer = this.createNoiseBuffer(0.2);
    if (!buffer) return;
    noise.buffer = buffer;
    const filter = this.ctx.createBiquadFilter();
    filter.type = soundType === 'stone' ? 'bandpass' : 'lowpass';
    filter.frequency.setValueAtTime(soundType === 'stone' ? 1200 : 800, t);

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.35 * this.volume, t);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);

    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(this.ctx.destination);

    noise.start(t);
  }

  // Block place sound
  playBlockPlace(soundType: string = 'wood') {
    if (this.volume <= 0) return;
    this.initCtx();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(200, t);
    osc.frequency.exponentialRampToValueAtTime(70, t + 0.1);

    gain.gain.setValueAtTime(0.3 * this.volume, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.11);
  }

  // Item pickup chime
  playItemPickup() {
    if (this.volume <= 0) return;
    this.initCtx();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(600, t);
    osc.frequency.setValueAtTime(900, t + 0.05);

    gain.gain.setValueAtTime(0.25 * this.volume, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.13);
  }

  // TNT Fuse fizzing
  playTntFuse() {
    if (this.volume <= 0) return;
    this.initCtx();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const duration = 2.5;
    const noise = this.ctx.createBufferSource();
    const buffer = this.createNoiseBuffer(duration);
    if (!buffer) return;
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(3000, t);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.2 * this.volume, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + duration);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    noise.start(t);
  }

  // TNT Explosion
  playExplosion() {
    if (this.volume <= 0) return;
    this.initCtx();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const duration = 1.2;

    // Heavy deep boom
    const osc = this.ctx.createOscillator();
    const oscGain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(140, t);
    osc.frequency.exponentialRampToValueAtTime(20, t + 0.8);

    oscGain.gain.setValueAtTime(0.6 * this.volume, t);
    oscGain.gain.exponentialRampToValueAtTime(0.001, t + 0.8);
    osc.connect(oscGain);
    oscGain.connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + 0.85);

    // Blast noise
    const noise = this.ctx.createBufferSource();
    const buffer = this.createNoiseBuffer(duration);
    if (!buffer) return;
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1200, t);
    filter.frequency.exponentialRampToValueAtTime(150, t + duration);

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.7 * this.volume, t);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, t + duration);

    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(this.ctx.destination);

    noise.start(t);
  }

  // Splash in water
  playSplash() {
    if (this.volume <= 0) return;
    this.initCtx();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const noise = this.ctx.createBufferSource();
    const buffer = this.createNoiseBuffer(0.3);
    if (!buffer) return;
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1200, t);
    filter.frequency.exponentialRampToValueAtTime(400, t + 0.3);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.4 * this.volume, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    noise.start(t);
  }

  // Pig oink
  playMobOink() {
    if (this.volume <= 0) return;
    this.initCtx();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(280, t);
    osc.frequency.setValueAtTime(380, t + 0.08);
    osc.frequency.setValueAtTime(260, t + 0.16);

    gain.gain.setValueAtTime(0.2 * this.volume, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.24);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.25);
  }

  // Zombie groan
  playZombieGroan() {
    if (this.volume <= 0) return;
    this.initCtx();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(90, t);
    osc.frequency.exponentialRampToValueAtTime(65, t + 0.6);

    gain.gain.setValueAtTime(0.18 * this.volume, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.6);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.65);
  }

  // Bow shooting sound (twang)
  playBowShoot() {
    if (this.volume <= 0) return;
    this.initCtx();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(320, t);
    osc.frequency.exponentialRampToValueAtTime(120, t + 0.12);

    gain.gain.setValueAtTime(0.35 * this.volume, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.16);
  }

  // Arrow hitting block or mob (sharp thud)
  playArrowHit() {
    if (this.volume <= 0) return;
    this.initCtx();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(450, t);
    osc.frequency.exponentialRampToValueAtTime(80, t + 0.08);

    gain.gain.setValueAtTime(0.4 * this.volume, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.09);
  }

  // Furnace crackle / smelting sizzle
  playSmelt() {
    if (this.volume <= 0) return;
    this.initCtx();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const noise = this.ctx.createBufferSource();
    const buf = this.createNoiseBuffer(0.2);
    if (!buf) return;
    noise.buffer = buf;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(2400, t);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.25 * this.volume, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    noise.start(t);
  }

  // Sleep peaceful morning chime
  playSleep() {
    if (this.volume <= 0) return;
    this.initCtx();
    if (!this.ctx) return;

    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
    notes.forEach((freq, idx) => {
      const t = this.ctx!.currentTime + idx * 0.12;
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t);

      gain.gain.setValueAtTime(0.2 * this.volume, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);

      osc.connect(gain);
      gain.connect(this.ctx!.destination);

      osc.start(t);
      osc.stop(t + 0.45);
    });
  }
}

export const soundManager = new AudioManager();
