// ============================================================================
// Grand Theft Auto 6 - Vice City Arcade Edition: Procedural Web Audio Engine
// ============================================================================
// Pure procedural sound synthesizer built on the Web Audio API with zero external
// audio files. Utilizes AudioContext oscillators, dual bimodal LFOs, and noise
// buffers to generate dynamic gunshots, engine rumble, police sirens, explosions,
// tire skids, cash pickups, punch impacts, and a retro 80s synthwave radio station.

let audioCtx = null;
let masterGain = null;
let sfxGain = null;
let radioGain = null;
let sharedNoiseBuffer = null;

/**
 * Returns or initializes the shared browser AudioContext and master bus topology.
 * Handles browser autoplay policies by auto-resuming on user interaction.
 */
export function getAudioContext() {
  if (typeof window === 'undefined') return null;
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) return null;

  if (!audioCtx) {
    audioCtx = new AudioContextClass();

    masterGain = audioCtx.createGain();
    masterGain.gain.setValueAtTime(0.85, audioCtx.currentTime);
    masterGain.connect(audioCtx.destination);

    sfxGain = audioCtx.createGain();
    sfxGain.gain.setValueAtTime(0.9, audioCtx.currentTime);
    sfxGain.connect(masterGain);

    radioGain = audioCtx.createGain();
    radioGain.gain.setValueAtTime(0.65, audioCtx.currentTime);
    radioGain.connect(masterGain);
  }

  if (audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }

  return audioCtx;
}

/**
 * Generates and caches a 2-second white noise buffer for procedural sound synthesis.
 */
function getNoiseBuffer(ctx) {
  if (sharedNoiseBuffer && sharedNoiseBuffer.sampleRate === ctx.sampleRate) {
    return sharedNoiseBuffer;
  }
  const sampleRate = ctx.sampleRate || 44100;
  const bufferSize = sampleRate * 2;
  const buffer = ctx.createBuffer(1, bufferSize, sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1;
  }
  sharedNoiseBuffer = buffer;
  return buffer;
}

/**
 * Creates a soft-clipping distortion curve for punchy weapon cracks and explosions.
 */
function makeDistortionCurve(amount = 25) {
  const samples = 256;
  const curve = new Float32Array(samples);
  const deg = Math.PI / 180;
  for (let i = 0; i < samples; ++i) {
    const x = (i * 2) / samples - 1;
    curve[i] = ((3 + amount) * x * 20 * deg) / (Math.PI + amount * Math.abs(x));
  }
  return curve;
}

/**
 * Procedural Gunshot Synthesizer.
 * Synthesizes unique sound signatures for Fist (punches), Pistol, Uzi, Shotgun, and M16.
 * Blends high-frequency transient cracks, filtered noise body bursts, and sub-bass resonance.
 *
 * @param {string} weaponType - 'fist' | 'pistol' | 'uzi' | 'shotgun' | 'm16'
 * @param {object} options - Optional { volume, pan, pitch }
 */
export function playGunshot(weaponType = 'pistol', options = {}) {
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const type = String(weaponType).toLowerCase();
  const baseVolume = options.volume ?? 1.0;

  if (type === 'fist') {
    playPunch(options);
    return;
  }

  // Master container gain for this gunshot instance
  const shotGain = ctx.createGain();
  shotGain.gain.setValueAtTime(baseVolume, now);
  shotGain.connect(sfxGain);

  const noise = ctx.createBufferSource();
  noise.buffer = getNoiseBuffer(ctx);

  const filter = ctx.createBiquadFilter();
  const noiseGain = ctx.createGain();

  // Pitch sweep oscillator for bullet transient "crack"
  const osc = ctx.createOscillator();
  const oscGain = ctx.createGain();

  if (type === 'shotgun') {
    // Heavy blast: deep bass boom, wider spread, lingering low-end rumble
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(2200, now);
    filter.frequency.exponentialRampToValueAtTime(80, now + 0.38);

    noiseGain.gain.setValueAtTime(1.2, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.38);

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(190, now);
    osc.frequency.exponentialRampToValueAtTime(28, now + 0.25);
    oscGain.gain.setValueAtTime(1.0, now);
    oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

    noise.stop(now + 0.4);
    osc.stop(now + 0.3);
  } else if (type === 'uzi') {
    // Snappy rapid-fire crack: high pitch, quick decay
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(2400, now);
    filter.Q.setValueAtTime(1.8, now);

    noiseGain.gain.setValueAtTime(0.85, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.085);

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(420, now);
    osc.frequency.exponentialRampToValueAtTime(80, now + 0.06);
    oscGain.gain.setValueAtTime(0.65, now);
    oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);

    noise.stop(now + 0.1);
    osc.stop(now + 0.08);
  } else if (type === 'm16') {
    // Powerful military assault rifle: aggressive crack, punchy low-mid presence
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(3400, now);
    filter.frequency.exponentialRampToValueAtTime(120, now + 0.22);

    noiseGain.gain.setValueAtTime(1.1, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(320, now);
    osc.frequency.exponentialRampToValueAtTime(45, now + 0.16);
    oscGain.gain.setValueAtTime(0.9, now);
    oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

    noise.stop(now + 0.24);
    osc.stop(now + 0.2);
  } else {
    // Default Pistol: crisp snap with moderate kick
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1800, now);
    filter.Q.setValueAtTime(1.4, now);

    noiseGain.gain.setValueAtTime(0.95, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(360, now);
    osc.frequency.exponentialRampToValueAtTime(50, now + 0.11);
    oscGain.gain.setValueAtTime(0.8, now);
    oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

    noise.stop(now + 0.16);
    osc.stop(now + 0.14);
  }

  noise.connect(filter);
  filter.connect(noiseGain);
  noiseGain.connect(shotGain);

  osc.connect(oscGain);
  oscGain.connect(shotGain);

  noise.start(now);
  osc.start(now);
}

/**
 * Procedural Vehicle Engine Synthesizer.
 * Synthesizes engine cylinder firing with dual harmonic oscillators modulated by
 * bimodal LFOs (primary cylinder stroke rate + secondary chassis vibration wobble)
 * and an RPM-dependent resonant low-pass filter.
 *
 * Can be called as a one-shot rev, or returns an active continuous engine controller.
 *
 * @param {object|number} configOrRPM - RPM ratio (0.0 to 1.0) or configuration object
 * @returns {object} Controller { setRPM(rpm), setThrottle(throttle), stop() }
 */
export function playEngine(configOrRPM = {}) {
  const ctx = getAudioContext();
  if (!ctx) {
    return { setRPM: () => {}, setThrottle: () => {}, stop: () => {} };
  }

  const options = typeof configOrRPM === 'number' ? { rpm: configOrRPM } : configOrRPM;
  const now = ctx.currentTime;
  const loop = options.loop !== false;
  let currentRpm = Math.max(0, Math.min(1, options.rpm ?? 0.35));
  let currentThrottle = Math.max(0, Math.min(1, options.throttle ?? 0.2));

  // Master node for this engine sound
  const engineGain = ctx.createGain();
  engineGain.gain.setValueAtTime(options.volume ?? 0.35, now);
  engineGain.connect(sfxGain);

  // Dual tone oscillators for cylinder firing
  const osc1 = ctx.createOscillator();
  const osc2 = ctx.createOscillator();
  osc1.type = 'sawtooth';
  osc2.type = 'triangle';

  // Base frequency scaled with RPM (40 Hz idle to 190 Hz redline)
  const baseFreq = 42 + currentRpm * 135;
  osc1.frequency.setValueAtTime(baseFreq, now);
  osc2.frequency.setValueAtTime(baseFreq * 0.5, now); // Sub-harmonic

  // Bimodal LFO 1: Primary cylinder cycle pulsation (14 Hz to 42 Hz based on RPM)
  const lfo1 = ctx.createOscillator();
  const lfo1Gain = ctx.createGain();
  lfo1.frequency.setValueAtTime(14 + currentRpm * 28, now);
  lfo1Gain.gain.setValueAtTime(12 + currentRpm * 18, now);
  lfo1.connect(lfo1Gain);
  lfo1Gain.connect(osc1.frequency);

  // Bimodal LFO 2: Secondary chassis tremor / idle roughness (2.8 Hz to 6 Hz)
  const lfo2 = ctx.createOscillator();
  const lfo2Gain = ctx.createGain();
  lfo2.frequency.setValueAtTime(3.2 + currentRpm * 2.8, now);
  lfo2Gain.gain.setValueAtTime(6.0, now);
  lfo2.connect(lfo2Gain);
  lfo2Gain.connect(osc2.frequency);

  // Resonant filter opens with throttle and RPM
  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.Q.setValueAtTime(2.2, now);
  const cutoff = 260 + currentRpm * 1200 + currentThrottle * 900;
  filter.frequency.setValueAtTime(cutoff, now);

  // Subtle exhaust hiss via filtered noise
  const noise = ctx.createBufferSource();
  noise.buffer = getNoiseBuffer(ctx);
  noise.loop = true;
  const noiseFilter = ctx.createBiquadFilter();
  noiseFilter.type = 'bandpass';
  noiseFilter.frequency.setValueAtTime(750 + currentRpm * 600, now);
  noiseFilter.Q.setValueAtTime(1.5, now);
  const noiseGain = ctx.createGain();
  noiseGain.gain.setValueAtTime(0.04 + currentThrottle * 0.08, now);

  noise.connect(noiseFilter);
  noiseFilter.connect(noiseGain);
  noiseGain.connect(filter);

  osc1.connect(filter);
  osc2.connect(filter);
  filter.connect(engineGain);

  osc1.start(now);
  osc2.start(now);
  lfo1.start(now);
  lfo2.start(now);
  noise.start(now);

  if (!loop) {
    const duration = options.duration ?? 0.6;
    engineGain.gain.exponentialRampToValueAtTime(0.001, now + duration);
    osc1.stop(now + duration + 0.05);
    osc2.stop(now + duration + 0.05);
    lfo1.stop(now + duration + 0.05);
    lfo2.stop(now + duration + 0.05);
    noise.stop(now + duration + 0.05);
  }

  return {
    setRPM(rpm) {
      if (!ctx || ctx.state === 'closed') return;
      currentRpm = Math.max(0, Math.min(1, rpm));
      const t = ctx.currentTime;
      const targetFreq = 42 + currentRpm * 135;
      osc1.frequency.setTargetAtTime(targetFreq, t, 0.05);
      osc2.frequency.setTargetAtTime(targetFreq * 0.5, t, 0.05);
      lfo1.frequency.setTargetAtTime(14 + currentRpm * 28, t, 0.05);
      filter.frequency.setTargetAtTime(260 + currentRpm * 1200 + currentThrottle * 900, t, 0.05);
      noiseGain.gain.setTargetAtTime(0.04 + currentThrottle * 0.08, t, 0.05);
    },
    setThrottle(throttle) {
      if (!ctx || ctx.state === 'closed') return;
      currentThrottle = Math.max(0, Math.min(1, throttle));
      const t = ctx.currentTime;
      filter.frequency.setTargetAtTime(260 + currentRpm * 1200 + currentThrottle * 900, t, 0.05);
      noiseGain.gain.setTargetAtTime(0.04 + currentThrottle * 0.08, t, 0.05);
    },
    stop(fadeDuration = 0.15) {
      if (!ctx || ctx.state === 'closed') return;
      const t = ctx.currentTime;
      engineGain.gain.linearRampToValueAtTime(0.001, t + fadeDuration);
      setTimeout(() => {
        try {
          osc1.stop();
          osc2.stop();
          lfo1.stop();
          lfo2.stop();
          noise.stop();
          engineGain.disconnect();
        } catch {}
      }, fadeDuration * 1000 + 50);
    },
  };
}

/**
 * Procedural Police Siren Synthesizer.
 * Employs bimodal LFOs: LFO 1 produces the primary sweeping wail/yelp pitch trajectory,
 * while LFO 2 injects rapid urgency flutter/warble.
 *
 * @param {object} options - { mode: 'wail'|'yelp', duration: number, loop: boolean, volume: number }
 * @returns {object} Controller { stop(), setMode(mode), setVolume(vol) }
 */
export function playSiren(options = {}) {
  const ctx = getAudioContext();
  if (!ctx) return { stop: () => {}, setMode: () => {}, setVolume: () => {} };

  const now = ctx.currentTime;
  const mode = options.mode ?? 'wail';
  const loop = options.loop !== false;
  const baseVolume = options.volume ?? 0.45;

  const sirenGain = ctx.createGain();
  sirenGain.gain.setValueAtTime(baseVolume, now);
  sirenGain.connect(sfxGain);

  // Siren Carrier Oscillator (rich analog-style sawtooth wave)
  const carrier = ctx.createOscillator();
  carrier.type = 'sawtooth';
  carrier.frequency.setValueAtTime(800, now);

  // Bimodal LFO 1: Primary Pitch Trajectory
  // 'wail' = slow sweeping cycle (~0.28 Hz), 'yelp' = frantic fast cycle (~1.8 Hz)
  const lfo1 = ctx.createOscillator();
  const lfo1Gain = ctx.createGain();
  lfo1.type = 'triangle';
  const lfo1Freq = mode === 'yelp' ? 1.85 : 0.28;
  const lfo1Depth = mode === 'yelp' ? 320 : 380;
  lfo1.frequency.setValueAtTime(lfo1Freq, now);
  lfo1Gain.gain.setValueAtTime(lfo1Depth, now);
  lfo1.connect(lfo1Gain);
  lfo1Gain.connect(carrier.frequency);

  // Bimodal LFO 2: High-Urgency Siren Warble / Flutter (5.6 Hz)
  const lfo2 = ctx.createOscillator();
  const lfo2Gain = ctx.createGain();
  lfo2.type = 'sine';
  lfo2.frequency.setValueAtTime(5.6, now);
  lfo2Gain.gain.setValueAtTime(45, now);
  lfo2.connect(lfo2Gain);
  lfo2Gain.connect(carrier.frequency);

  // Lowpass filter to roll off harsh high frequencies and simulate horn enclosure
  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(2200, now);
  filter.Q.setValueAtTime(2.0, now);

  carrier.connect(filter);
  filter.connect(sirenGain);

  carrier.start(now);
  lfo1.start(now);
  lfo2.start(now);

  if (!loop) {
    const dur = options.duration ?? 2.8;
    sirenGain.gain.setValueAtTime(baseVolume, now + dur - 0.3);
    sirenGain.gain.linearRampToValueAtTime(0.001, now + dur);
    carrier.stop(now + dur + 0.05);
    lfo1.stop(now + dur + 0.05);
    lfo2.stop(now + dur + 0.05);
  }

  return {
    setMode(nextMode) {
      if (!ctx || ctx.state === 'closed') return;
      const t = ctx.currentTime;
      const freq = nextMode === 'yelp' ? 1.85 : 0.28;
      const depth = nextMode === 'yelp' ? 320 : 380;
      lfo1.frequency.setTargetAtTime(freq, t, 0.1);
      lfo1Gain.gain.setTargetAtTime(depth, t, 0.1);
    },
    setVolume(vol) {
      if (!ctx || ctx.state === 'closed') return;
      sirenGain.gain.setTargetAtTime(Math.max(0, vol), ctx.currentTime, 0.05);
    },
    stop(fadeDuration = 0.2) {
      if (!ctx || ctx.state === 'closed') return;
      const t = ctx.currentTime;
      sirenGain.gain.linearRampToValueAtTime(0.001, t + fadeDuration);
      setTimeout(() => {
        try {
          carrier.stop();
          lfo1.stop();
          lfo2.stop();
          sirenGain.disconnect();
        } catch {}
      }, fadeDuration * 1000 + 40);
    },
  };
}

/**
 * Procedural Explosion Synthesizer.
 * Simulates a massive open-world vehicular explosion using pitch-sweeping sub-bass,
 * filtered noise blast, and non-linear waveshaping distortion.
 *
 * @param {object} options - Optional { volume, duration }
 */
export function playExplosion(options = {}) {
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const duration = options.duration ?? 1.5;
  const volume = options.volume ?? 1.0;

  const masterExp = ctx.createGain();
  masterExp.gain.setValueAtTime(volume, now);
  masterExp.connect(sfxGain);

  // 1. Sub-bass seismic boom oscillator (drops from 170 Hz to 24 Hz)
  const subOsc = ctx.createOscillator();
  const subGain = ctx.createGain();
  subOsc.type = 'sine';
  subOsc.frequency.setValueAtTime(170, now);
  subOsc.frequency.exponentialRampToValueAtTime(24, now + duration * 0.7);

  subGain.gain.setValueAtTime(1.3, now);
  subGain.gain.exponentialRampToValueAtTime(0.001, now + duration);

  subOsc.connect(subGain);
  subGain.connect(masterExp);

  // 2. High-impact debris and shrapnel noise burst
  const noise = ctx.createBufferSource();
  noise.buffer = getNoiseBuffer(ctx);

  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(1900, now);
  filter.frequency.exponentialRampToValueAtTime(35, now + duration);
  filter.Q.setValueAtTime(3.2, now);

  const noiseGain = ctx.createGain();
  noiseGain.gain.setValueAtTime(1.4, now);
  noiseGain.gain.exponentialRampToValueAtTime(0.001, now + duration);

  // Waveshaper distortion for raw explosive heat
  const dist = ctx.createWaveShaper();
  dist.curve = makeDistortionCurve(35);

  noise.connect(filter);
  filter.connect(dist);
  dist.connect(noiseGain);
  noiseGain.connect(masterExp);

  subOsc.start(now);
  noise.start(now);

  subOsc.stop(now + duration + 0.05);
  noise.stop(now + duration + 0.05);
}

/**
 * Procedural Tire Screech Synthesizer.
 * Simulates rubber peeling and sliding across asphalt during high-speed drifts
 * or emergency braking via resonant bandpass noise modulated by bimodal friction LFOs.
 *
 * @param {number} intensity - 0.0 to 1.0 slip intensity
 * @param {number} duration - sound duration in seconds (default: 0.35s)
 */
export function playTireScreech(intensity = 1.0, duration = 0.35) {
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const slip = Math.max(0.1, Math.min(1.0, intensity));

  const screechGain = ctx.createGain();
  screechGain.gain.setValueAtTime(0.01, now);
  screechGain.gain.linearRampToValueAtTime(0.4 * slip, now + 0.04);
  screechGain.gain.exponentialRampToValueAtTime(0.001, now + duration);
  screechGain.connect(sfxGain);

  const noise = ctx.createBufferSource();
  noise.buffer = getNoiseBuffer(ctx);

  // High-Q bandpass filter centered on characteristic tire squeal frequency (2400 Hz)
  const bandpass = ctx.createBiquadFilter();
  bandpass.type = 'bandpass';
  bandpass.frequency.setValueAtTime(2350, now);
  bandpass.Q.setValueAtTime(4.5, now);

  // Bimodal friction LFO 1: Rapid tire tread block snap (26 Hz)
  const lfo1 = ctx.createOscillator();
  const lfo1Gain = ctx.createGain();
  lfo1.frequency.setValueAtTime(26, now);
  lfo1Gain.gain.setValueAtTime(320 * slip, now);
  lfo1.connect(lfo1Gain);
  lfo1Gain.connect(bandpass.frequency);

  // Bimodal friction LFO 2: Vehicle chassis drift wobble (4.2 Hz)
  const lfo2 = ctx.createOscillator();
  const lfo2Gain = ctx.createGain();
  lfo2.frequency.setValueAtTime(4.2, now);
  lfo2Gain.gain.setValueAtTime(140 * slip, now);
  lfo2.connect(lfo2Gain);
  lfo2Gain.connect(bandpass.frequency);

  noise.connect(bandpass);
  bandpass.connect(screechGain);

  noise.start(now);
  lfo1.start(now);
  lfo2.start(now);

  noise.stop(now + duration + 0.05);
  lfo1.stop(now + duration + 0.05);
  lfo2.stop(now + duration + 0.05);
}

/**
 * Procedural Cash Pickup Chime.
 * Plays an ascending sparkling 4-note arpeggio (E6 -> G#6 -> B6 -> E7) with harmonic
 * bell overtones, evoking the classic GTA mission reward & cash drop pickup sound.
 */
export function playCashPickup(options = {}) {
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const volume = options.volume ?? 0.6;
  const notes = [1318.51, 1661.22, 1975.53, 2637.02]; // E6, G#6, B6, E7
  const noteDuration = 0.065;

  notes.forEach((freq, index) => {
    const noteTime = now + index * noteDuration;

    // Fundamental bell tone
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();

    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(freq, noteTime);

    // Harmonic bell shimmer
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(freq * 2.01, noteTime);

    gain.gain.setValueAtTime(0, noteTime);
    gain.gain.linearRampToValueAtTime(volume * (index === 3 ? 0.9 : 0.65), noteTime + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.28);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(sfxGain);

    osc1.start(noteTime);
    osc2.start(noteTime);
    osc1.stop(noteTime + 0.3);
    osc2.stop(noteTime + 0.3);
  });
}

/**
 * Procedural Melee Punch Impact Synthesizer.
 * Delivers a physical body thud (pitch-dropping sub tone) paired with a sharp
 * short-duration slap transient for satisfying unarmed combat feedback.
 *
 * @param {object} options - Optional { volume }
 */
export function playPunch(options = {}) {
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const volume = options.volume ?? 0.85;

  const punchGain = ctx.createGain();
  punchGain.gain.setValueAtTime(volume, now);
  punchGain.connect(sfxGain);

  // 1. Meat / Body impact thud (180 Hz dropping to 34 Hz in 90ms)
  const osc = ctx.createOscillator();
  const oscGain = ctx.createGain();
  osc.type = 'triangle';
  osc.frequency.setValueAtTime(180, now);
  osc.frequency.exponentialRampToValueAtTime(34, now + 0.09);

  oscGain.gain.setValueAtTime(1.1, now);
  oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

  osc.connect(oscGain);
  oscGain.connect(punchGain);

  // 2. Flesh slap / knuckle crack noise burst
  const noise = ctx.createBufferSource();
  noise.buffer = getNoiseBuffer(ctx);

  const filter = ctx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.setValueAtTime(1250, now);
  filter.Q.setValueAtTime(1.8, now);

  const noiseGain = ctx.createGain();
  noiseGain.gain.setValueAtTime(0.75, now);
  noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.035);

  noise.connect(filter);
  filter.connect(noiseGain);
  noiseGain.connect(punchGain);

  osc.start(now);
  noise.start(now);

  osc.stop(now + 0.14);
  noise.stop(now + 0.05);
}

// Global active radio station controller singleton
let activeRadioInstance = null;

/**
 * Procedural Retro Synthwave Radio Station ("Vice Waves 80s FM").
 * Completely synthesizes an authentic 1980s Miami Vice style synthwave track
 * using pure Web Audio API primitives:
 * - 4-on-the-floor synthesized 808 kick drum
 * - Crisp 80s gated snare & hi-hat groove
 * - Rolling 16th-note analog sawtooth bassline in D minor with bimodal LFO filter sweeps
 * - Lush detuned polyphonic synth brass chord arpeggiations (Dm - Bb - F - C)
 *
 * @param {object} options - { action: 'start'|'stop'|'toggle', volume: number }
 * @returns {object} Controller { isPlaying: boolean, start(), stop(), toggle(), setVolume() }
 */
export function playRadioSynthwave(options = {}) {
  const ctx = getAudioContext();
  if (!ctx) {
    return {
      isPlaying: false,
      start: () => {},
      stop: () => {},
      toggle: () => false,
      setVolume: () => {},
      getTrackInfo: () => ({ station: 'Vice Waves FM', track: 'Offline' }),
    };
  }

  // If already active and toggle / stop requested:
  if (activeRadioInstance && activeRadioInstance.isPlaying) {
    if (options.action === 'stop' || options.action === 'toggle' || options.stop === true) {
      activeRadioInstance.stop();
      return activeRadioInstance;
    }
    if (options.volume !== undefined) {
      activeRadioInstance.setVolume(options.volume);
    }
    return activeRadioInstance;
  }

  if (options.action === 'stop') {
    return {
      isPlaying: false,
      start: () => {},
      stop: () => {},
      toggle: () => false,
      setVolume: () => {},
    };
  }

  const tempo = 116; // 116 BPM classic synthwave tempo
  const stepTime = 60 / tempo / 4; // 16th note step duration (~0.129s)
  let isPlaying = true;
  let currentStep = 0;
  let timerId = null;

  const stationGain = ctx.createGain();
  stationGain.gain.setValueAtTime(options.volume ?? 0.65, ctx.currentTime);
  stationGain.connect(radioGain);

  // 16-step chord progression: 4 bars (Dm -> Bb -> F -> C)
  const chords = [
    // D minor (D3, F3, A3, D4)
    [146.83, 174.61, 220.00, 293.66],
    // Bb Major (Bb2, D3, F3, Bb3)
    [116.54, 146.83, 174.61, 233.08],
    // F Major (F2, A2, C3, F3)
    [87.31, 110.00, 130.81, 174.61],
    // C Major (C3, E3, G3, C4)
    [130.81, 164.81, 196.00, 261.63],
  ];

  const bassNotes = [
    73.42, 73.42, 146.83, 73.42, // D2, D2, D3, D2
    58.27, 58.27, 116.54, 58.27, // Bb1, Bb1, Bb2, Bb1
    43.65, 43.65, 87.31, 43.65,  // F1, F1, F2, F1
    65.41, 65.41, 130.81, 65.41, // C2, C2, C3, C2
  ];

  // Procedural 808 Kick Drum
  function triggerKick(time) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(130, time);
    osc.frequency.exponentialRampToValueAtTime(38, time + 0.12);

    gain.gain.setValueAtTime(1.0, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.24);

    osc.connect(gain);
    gain.connect(stationGain);
    osc.start(time);
    osc.stop(time + 0.25);
  }

  // Procedural 80s Snare Drum
  function triggerSnare(time) {
    const noise = ctx.createBufferSource();
    noise.buffer = getNoiseBuffer(ctx);
    const filter = ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(800, time);

    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.75, time);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, time + 0.18);

    const bodyOsc = ctx.createOscillator();
    const bodyGain = ctx.createGain();
    bodyOsc.type = 'triangle';
    bodyOsc.frequency.setValueAtTime(220, time);
    bodyOsc.frequency.exponentialRampToValueAtTime(80, time + 0.08);
    bodyGain.gain.setValueAtTime(0.6, time);
    bodyGain.gain.exponentialRampToValueAtTime(0.001, time + 0.12);

    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(stationGain);

    bodyOsc.connect(bodyGain);
    bodyGain.connect(stationGain);

    noise.start(time);
    bodyOsc.start(time);
    noise.stop(time + 0.2);
    bodyOsc.stop(time + 0.15);
  }

  // Procedural Hi-Hat
  function triggerHat(time, open = false) {
    const noise = ctx.createBufferSource();
    noise.buffer = getNoiseBuffer(ctx);
    const filter = ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(6500, time);

    const gain = ctx.createGain();
    const decay = open ? 0.14 : 0.045;
    gain.gain.setValueAtTime(open ? 0.35 : 0.2, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + decay);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(stationGain);

    noise.start(time);
    noise.stop(time + decay + 0.02);
  }

  // Procedural Rolling Bassline Note
  function triggerBass(time, freq) {
    const osc = ctx.createOscillator();
    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(freq, time);

    filter.type = 'lowpass';
    filter.Q.setValueAtTime(4.0, time);
    filter.frequency.setValueAtTime(750, time);
    filter.frequency.exponentialRampToValueAtTime(140, time + stepTime * 0.9);

    gain.gain.setValueAtTime(0.65, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + stepTime * 0.95);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(stationGain);

    osc.start(time);
    osc.stop(time + stepTime);
  }

  // Procedural Lush Synth Chords (Detuned Sawtooth Pair)
  function triggerChord(time, chordFrequencies) {
    chordFrequencies.forEach((freq) => {
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const filter = ctx.createBiquadFilter();
      const gain = ctx.createGain();

      osc1.type = 'sawtooth';
      osc2.type = 'sawtooth';
      osc1.frequency.setValueAtTime(freq, time);
      osc2.frequency.setValueAtTime(freq * 1.006, time); // Detuned for chorus effect

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1600, time);
      filter.Q.setValueAtTime(1.5, time);

      gain.gain.setValueAtTime(0.12, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + stepTime * 3.8);

      osc1.connect(filter);
      osc2.connect(filter);
      filter.connect(gain);
      gain.connect(stationGain);

      osc1.start(time);
      osc2.start(time);
      osc1.stop(time + stepTime * 4.0);
      osc2.stop(time + stepTime * 4.0);
    });
  }

  // Music sequencer tick scheduler
  let nextNoteTime = ctx.currentTime + 0.05;

  function schedule() {
    while (nextNoteTime < ctx.currentTime + 0.25 && isPlaying) {
      const barStep = currentStep % 16;
      const barIndex = Math.floor((currentStep / 16) % 4);

      // Drums: 4-on-the-floor kick, 2 & 4 snare, 16th hats
      if (barStep % 4 === 0) triggerKick(nextNoteTime);
      if (barStep % 8 === 4) triggerSnare(nextNoteTime);
      triggerHat(nextNoteTime, barStep % 4 === 2);

      // Bass: 16th-note rolling octave bassline
      const bassFreq = bassNotes[barIndex * 4 + (barStep % 4)];
      triggerBass(nextNoteTime, bassFreq);

      // Chords: Strummed pad hits on beat 1 and beat 3
      if (barStep === 0 || barStep === 6 || barStep === 10) {
        triggerChord(nextNoteTime, chords[barIndex]);
      }

      nextNoteTime += stepTime;
      currentStep = (currentStep + 1) % 64;
    }

    if (isPlaying) {
      timerId = setTimeout(schedule, 50);
    }
  }

  schedule();

  const controller = {
    get isPlaying() {
      return isPlaying;
    },
    start() {
      if (!isPlaying) {
        isPlaying = true;
        nextNoteTime = ctx.currentTime + 0.05;
        schedule();
      }
    },
    stop(fadeDuration = 0.3) {
      isPlaying = false;
      if (timerId) {
        clearTimeout(timerId);
        timerId = null;
      }
      try {
        stationGain.gain.linearRampToValueAtTime(0.001, ctx.currentTime + fadeDuration);
        setTimeout(() => {
          try {
            stationGain.disconnect();
          } catch {}
        }, fadeDuration * 1000 + 50);
      } catch {}
      if (activeRadioInstance === controller) {
        activeRadioInstance = null;
      }
    },
    toggle() {
      if (isPlaying) {
        this.stop();
        return false;
      } else {
        this.start();
        return true;
      }
    },
    setVolume(vol) {
      if (!ctx || ctx.state === 'closed') return;
      stationGain.gain.setTargetAtTime(Math.max(0, vol), ctx.currentTime, 0.05);
    },
    getTrackInfo() {
      return {
        station: 'Vice Waves 80s FM',
        track: 'Neon Palms Boulevard',
        artist: 'Antigravity Sound System',
        genre: 'Synthwave / Outrun',
      };
    },
  };

  activeRadioInstance = controller;
  return controller;
}
