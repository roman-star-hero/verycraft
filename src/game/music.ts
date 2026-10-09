// Cheerful procedural 8-bit / chiptune music engine for CraftVoxel
// Uses Web Audio API polyphony for cheerful melodies, bouncy basslines, and light rhythm

interface NoteEvent {
  note: number; // MIDI note number or 0 for rest
  duration: number; // in 16th notes (1 = 16th, 2 = 8th, 4 = quarter)
}

// Frequency helper from MIDI note
function midiToFreq(midi: number): number {
  if (midi <= 0) return 0;
  return 440 * Math.pow(2, (midi - 69) / 12);
}

// Cheerful Melodies (in C major / A minor, uplifting, playful tempo ~124 BPM)
// MIDI numbers: C4=60, D4=62, E4=64, F4=65, G4=67, A4=69, B4=71, C5=72, D5=74, E5=76, G5=79
const CHEERFUL_LEAD_PATTERNS: number[][] = [
  // Pattern 1: Bouncy morning jump (16 steps of 16th notes = 1 bar)
  [64, 0, 67, 0, 72, 72, 74, 0, 76, 0, 72, 0, 69, 0, 67, 0],
  // Pattern 2: Joyful walk
  [65, 0, 69, 0, 72, 0, 74, 76, 74, 0, 72, 0, 67, 0, 64, 0],
  // Pattern 3: Uplifting build
  [64, 67, 69, 72, 74, 0, 76, 0, 79, 76, 74, 72, 69, 72, 67, 0],
  // Pattern 4: Playful resolution
  [65, 67, 69, 72, 74, 72, 69, 67, 64, 0, 62, 0, 60, 0, 0, 0],

  // Pattern 5: Second movement (higher octave arpeggio)
  [72, 0, 76, 0, 79, 0, 81, 79, 76, 0, 74, 0, 72, 74, 76, 0],
  // Pattern 6: Happy dance
  [74, 0, 71, 0, 67, 0, 71, 0, 74, 76, 74, 72, 69, 0, 67, 0],
  // Pattern 7: Fast bouncy run
  [67, 69, 72, 74, 76, 79, 81, 79, 76, 72, 74, 69, 67, 64, 67, 0],
  // Pattern 8: Warm home finish
  [69, 72, 74, 76, 72, 0, 67, 0, 64, 0, 62, 0, 60, 0, 0, 0],
];

// Chords (Roots for bassline & arpeggio pad)
// C -> G -> Am -> F -> C -> G -> F -> G
const CHORD_ROOTS: number[] = [48, 43, 45, 41, 48, 43, 41, 43]; // MIDI C3, G2, A2, F2

export class MusicEngine {
  private ctx: AudioContext | null = null;
  private isPlaying: boolean = false;
  private volume: number = 0.3;
  private tempoBPM: number = 124;
  private stepTimer: number | null = null;
  private currentStep: number = 0; // 0..127 (8 bars of 16 steps)
  private masterGain: GainNode | null = null;

  constructor() {
    // Lazy initialized on first user interaction
  }

  private initContext() {
    if (!this.ctx) {
      const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtxClass();

      // Master gain node
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.volume, this.ctx.currentTime);

      // Gentle compressor to keep music smooth & pleasant
      const compressor = this.ctx.createDynamicsCompressor();
      compressor.threshold.setValueAtTime(-18, this.ctx.currentTime);
      compressor.knee.setValueAtTime(12, this.ctx.currentTime);
      compressor.ratio.setValueAtTime(4, this.ctx.currentTime);
      compressor.attack.setValueAtTime(0.005, this.ctx.currentTime);
      compressor.release.setValueAtTime(0.1, this.ctx.currentTime);

      this.masterGain.connect(compressor);
      compressor.connect(this.ctx.destination);
    }

    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  setVolume(vol: number) {
    this.volume = Math.max(0, Math.min(1, vol));
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(this.volume * 0.35, this.ctx.currentTime, 0.05);
    }
  }

  getVolume(): number {
    return this.volume;
  }

  isMusicPlaying(): boolean {
    return this.isPlaying;
  }

  start() {
    if (this.isPlaying) return;
    this.initContext();
    if (!this.ctx || !this.masterGain) return;

    this.isPlaying = true;
    this.currentStep = 0;
    this.scheduleNextStep();
  }

  stop() {
    this.isPlaying = false;
    if (this.stepTimer !== null) {
      clearTimeout(this.stepTimer);
      this.stepTimer = null;
    }
  }

  toggle(): boolean {
    if (this.isPlaying) {
      this.stop();
      return false;
    } else {
      this.start();
      return true;
    }
  }

  private scheduleNextStep() {
    if (!this.isPlaying || !this.ctx || !this.masterGain) return;

    const stepDurationMs = (60 / this.tempoBPM / 4) * 1000; // duration of one 16th note (~120ms)

    this.playStep(this.currentStep);

    this.currentStep = (this.currentStep + 1) % (8 * 16); // 8 bars loop

    this.stepTimer = window.setTimeout(() => {
      this.scheduleNextStep();
    }, stepDurationMs);
  }

  private playStep(step: number) {
    if (!this.ctx || !this.masterGain) return;

    const t = this.ctx.currentTime;
    const bar = Math.floor(step / 16);
    const stepInBar = step % 16;
    const chordRoot = CHORD_ROOTS[bar % CHORD_ROOTS.length];

    // 1. LEAD SYNTH MELODY (cheerful, bright, warm triangle/square blend with soft vibrato)
    const pattern = CHEERFUL_LEAD_PATTERNS[bar % CHEERFUL_LEAD_PATTERNS.length];
    const leadMidi = pattern[stepInBar];

    if (leadMidi > 0) {
      const freq = midiToFreq(leadMidi);
      const noteDuration = 0.16;

      const osc = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const noteGain = this.ctx.createGain();

      // Cheerful synth timbre (triangle + square octave)
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t);

      osc2.type = 'square';
      osc2.frequency.setValueAtTime(freq, t);

      // Gentle lowpass filter to remove harshness
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(2200, t);
      filter.frequency.exponentialRampToValueAtTime(800, t + noteDuration);

      // Pluck volume envelope
      noteGain.gain.setValueAtTime(0.18, t);
      noteGain.gain.exponentialRampToValueAtTime(0.001, t + noteDuration);

      osc.connect(filter);
      osc2.connect(filter);
      filter.connect(noteGain);
      noteGain.connect(this.masterGain);

      osc.start(t);
      osc2.start(t);
      osc.stop(t + noteDuration + 0.02);
      osc2.stop(t + noteDuration + 0.02);
    }

    // 2. BASSLINE (bouncy 8th note groove on steps 0, 4, 8, 12, 14)
    if (stepInBar === 0 || stepInBar === 4 || stepInBar === 8 || stepInBar === 12 || stepInBar === 14) {
      const isFifth = stepInBar === 8 || stepInBar === 14;
      const bassMidi = chordRoot + (isFifth ? 7 : 0);
      const bassFreq = midiToFreq(bassMidi);
      const bassDur = 0.18;

      const bassOsc = this.ctx.createOscillator();
      const bassGain = this.ctx.createGain();

      bassOsc.type = 'triangle';
      bassOsc.frequency.setValueAtTime(bassFreq, t);

      bassGain.gain.setValueAtTime(0.24, t);
      bassGain.gain.exponentialRampToValueAtTime(0.001, t + bassDur);

      bassOsc.connect(bassGain);
      bassGain.connect(this.masterGain);

      bassOsc.start(t);
      bassOsc.stop(t + bassDur + 0.01);
    }

    // 3. CHORD ARPEGGIO CHIME (soft high chimes on 8th notes)
    if (stepInBar % 2 === 0) {
      const arpOffsets = [0, 4, 7, 12, 16, 12, 7, 4];
      const arpMidi = chordRoot + 24 + arpOffsets[(stepInBar / 2) % arpOffsets.length];
      const arpFreq = midiToFreq(arpMidi);

      const arpOsc = this.ctx.createOscillator();
      const arpGain = this.ctx.createGain();

      arpOsc.type = 'sine';
      arpOsc.frequency.setValueAtTime(arpFreq, t);

      arpGain.gain.setValueAtTime(0.08, t);
      arpGain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);

      arpOsc.connect(arpGain);
      arpGain.connect(this.masterGain);

      arpOsc.start(t);
      arpOsc.stop(t + 0.13);
    }

    // 4. CHEERFUL DRUM BEAT
    // Kick drum on beats 0 and 8
    if (stepInBar === 0 || stepInBar === 8) {
      const kickOsc = this.ctx.createOscillator();
      const kickGain = this.ctx.createGain();

      kickOsc.type = 'sine';
      kickOsc.frequency.setValueAtTime(140, t);
      kickOsc.frequency.exponentialRampToValueAtTime(45, t + 0.12);

      kickGain.gain.setValueAtTime(0.26, t);
      kickGain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);

      kickOsc.connect(kickGain);
      kickGain.connect(this.masterGain);

      kickOsc.start(t);
      kickOsc.stop(t + 0.13);
    }

    // Snare / clap on beats 4 and 12
    if (stepInBar === 4 || stepInBar === 12) {
      const snareNoise = this.ctx.createBufferSource();
      const bufSize = Math.floor(this.ctx.sampleRate * 0.09);
      const buf = this.ctx.createBuffer(1, bufSize, this.ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < bufSize; i++) data[i] = Math.random() * 2 - 1;
      snareNoise.buffer = buf;

      const snareFilter = this.ctx.createBiquadFilter();
      snareFilter.type = 'highpass';
      snareFilter.frequency.setValueAtTime(1100, t);

      const snareGain = this.ctx.createGain();
      snareGain.gain.setValueAtTime(0.14, t);
      snareGain.gain.exponentialRampToValueAtTime(0.001, t + 0.09);

      snareNoise.connect(snareFilter);
      snareFilter.connect(snareGain);
      snareGain.connect(this.masterGain);

      snareNoise.start(t);
    }

    // Hi-hat tick on off-beats (step 2, 6, 10, 14)
    if (stepInBar % 4 === 2) {
      const hatNoise = this.ctx.createBufferSource();
      const bufSize = Math.floor(this.ctx.sampleRate * 0.035);
      const buf = this.ctx.createBuffer(1, bufSize, this.ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < bufSize; i++) data[i] = Math.random() * 2 - 1;
      hatNoise.buffer = buf;

      const hatFilter = this.ctx.createBiquadFilter();
      hatFilter.type = 'highpass';
      hatFilter.frequency.setValueAtTime(6500, t);

      const hatGain = this.ctx.createGain();
      hatGain.gain.setValueAtTime(0.06, t);
      hatGain.gain.exponentialRampToValueAtTime(0.001, t + 0.035);

      hatNoise.connect(hatFilter);
      hatFilter.connect(hatGain);
      hatGain.connect(this.masterGain);

      hatNoise.start(t);
    }
  }
}

export const musicEngine = new MusicEngine();
