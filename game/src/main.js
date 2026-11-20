// ============================================================================
// Grand Theft Auto 6 - Arcade Edition: Master Game Loop & Lifecycle
// ============================================================================
// Orchestrates the complete game lifecycle:
// - Fixed 60 FPS timestep simulation loop (stepping physics, AI, bullets, particles)
// - requestAnimationFrame rendering with camera interpolation
// - State transitions: TITLE ('VICE CITY CRIME'), PLAYING, PAUSED, and WASTED/BUSTED
// - Full localStorage persistence: cash balance, arsenal ammo, completed missions, high score
// - Screen-reader announcements and tab-visibility pause handling
// - Support for ?shot=start|play|end and ?seed=N automated screenshot pipelines

import { BEST_KEY, LIVES, MISSIONS, STEP } from './config.js';
import { createRandom } from './random.js';
import { createWorld, EVENT_HIT, EVENT_MISSION_COMPLETE, EVENT_OVER } from './world.js';
import { ACTION_CONFIRM, ACTION_PAUSE, createInput } from './input.js';
import { createRenderer, SCREEN_OVER, SCREEN_PAUSED, SCREEN_PLAY, SCREEN_TITLE } from './render.js';
import { stageShot } from './shots.js';
import { playRadioSynthwave } from './audio.js';

/** The longest frame interval the accumulator will catch up on before dropping. */
const MAX_FRAME = 0.25;

/** Storage key for persistent game progress. */
const SAVE_KEY = 'vice-city-crime.save';

const isBrowser = typeof window !== 'undefined';
const params = isBrowser ? new URLSearchParams(window.location.search) : new URLSearchParams();
const shotParam = params.get('shot');
const seedParam = Number.parseInt(params.get('seed') ?? '', 10);
const seed = Number.isInteger(seedParam) ? seedParam : Math.floor(Math.random() * 4294967296);

const canvas = isBrowser ? document.getElementById('game') : null;
const status = isBrowser ? document.getElementById('status') : null;
const world = createWorld(createRandom(seed));
const renderer = canvas ? createRenderer(canvas) : null;

// ----------------------------------------------------------------------------
// LocalStorage Persistence System (Cash, Weapons, Missions, Top Score)
// ----------------------------------------------------------------------------
export function readBestScore() {
  if (!isBrowser) return 0;
  try {
    return Number.parseInt(window.localStorage.getItem(BEST_KEY) ?? '0', 10) || 0;
  } catch {
    return 0;
  }
}

export function saveBestScore(value) {
  if (!isBrowser) return;
  try {
    window.localStorage.setItem(BEST_KEY, String(value));
  } catch {}
}

export function loadGameProgress() {
  if (!isBrowser) return null;
  try {
    const raw = window.localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function saveGameProgress(state) {
  if (!isBrowser) return;
  try {
    const p = state.player;
    const m = state.mission;
    const payload = {
      cash: p.cash,
      bestScore: Math.max(p.cash, readBestScore()),
      completedMissions: m.completedCount,
      missionIndex: m.currentIndex,
      weapons: p.weapons.map((w) => ({ id: w.id, ammo: w.ammo })),
      savedAt: Date.now(),
    };
    window.localStorage.setItem(SAVE_KEY, JSON.stringify(payload));
    saveBestScore(payload.bestScore);
  } catch {}
}

export function applyLoadedProgress(saveData) {
  if (!saveData || typeof saveData !== 'object') return;
  const p = world.state.player;
  const m = world.state.mission;

  if (typeof saveData.cash === 'number') {
    p.cash = Math.max(500, saveData.cash);
    world.state.cash = p.cash;
    world.state.score = p.cash;
  }

  if (Array.isArray(saveData.weapons)) {
    saveData.weapons.forEach((savedWep) => {
      const match = p.weapons.find((w) => w.id === savedWep.id);
      if (match && typeof savedWep.ammo === 'number' && match.ammo !== Infinity) {
        match.ammo = savedWep.ammo;
      }
    });
  }

  if (typeof saveData.completedMissions === 'number') {
    m.completedCount = Math.min(5, Math.max(0, saveData.completedMissions));
    const targetIdx = Math.min(MISSIONS.length - 1, m.completedCount);
    m.currentIndex = targetIdx;
    m.currentMission = MISSIONS[targetIdx];
    world.state.level = m.completedCount + 1;
  }
}

// ----------------------------------------------------------------------------
// Automated Screenshot Pipeline (?shot=start|play|end)
// ----------------------------------------------------------------------------
function runShot(name) {
  if (!renderer) return;
  const scene = stageShot(name, world);
  let painted = 0;
  function paint() {
    renderer.draw(world.state, scene.screen, scene.best);
    painted += 1;
    if (painted < 2) requestAnimationFrame(paint);
    else window.__shotReady = true;
  }
  requestAnimationFrame(paint);
}

// ----------------------------------------------------------------------------
// Master Game Execution
// ----------------------------------------------------------------------------
function runGame() {
  if (!canvas || !renderer) return;

  const input = createInput(canvas);
  let screen = SCREEN_TITLE;
  let best = readBestScore();
  let accumulator = 0;
  let last = performance.now();
  let radioActive = false;

  // Screen-reader announcer
  function announce(message) {
    if (status) status.textContent = message;
  }

  function startGame() {
    world.reset();

    // Restore saved progression if available
    const saved = loadGameProgress();
    if (saved) {
      applyLoadedProgress(saved);
    }

    accumulator = 0;
    screen = SCREEN_PLAY;
    announce(`Vice City: Open World Crime. Playing. Cash: $${world.state.player.cash}. Wanted Level: ${world.state.player.wantedLevel}.`);

    // Auto-start radio on game start
    if (!radioActive) {
      playRadioSynthwave({ action: 'start', volume: 0.5 });
      radioActive = true;
    }
  }

  function endGame() {
    screen = SCREEN_OVER;
    const finalScore = world.state.player.cash;
    if (finalScore > best) {
      best = finalScore;
      saveBestScore(best);
    }
    saveGameProgress(world.state);
    announce(`WASTED. Final cash: $${finalScore}. Best: $${best}. Press Space or click to play again.`);
  }

  function handleActions() {
    const actions = input.takeActions();

    if (actions & ACTION_CONFIRM && (screen === SCREEN_TITLE || screen === SCREEN_OVER)) {
      startGame();
    } else if (actions & ACTION_PAUSE && screen === SCREEN_PLAY) {
      screen = SCREEN_PAUSED;
      announce('Game paused. Press P to resume.');
    } else if (actions & (ACTION_PAUSE | ACTION_CONFIRM) && screen === SCREEN_PAUSED) {
      screen = SCREEN_PLAY;
      announce('Game resumed. Playing.');
    }
  }

  function step() {
    if (screen === SCREEN_TITLE) {
      world.step(STEP, 0, true);
      return;
    }

    const events = world.step(STEP, input.direction(), false);

    if (events & EVENT_OVER) {
      endGame();
    } else if (events & EVENT_MISSION_COMPLETE) {
      saveGameProgress(world.state);
      announce(`Mission Complete! Reward awarded. Total cash: $${world.state.player.cash}.`);
    } else if (events & EVENT_HIT) {
      announce(`Hit taken! Health: ${Math.round(world.state.player.health)}. Armor: ${Math.round(world.state.player.armor)}.`);
    }
  }

  function frame(now) {
    requestAnimationFrame(frame);
    accumulator += Math.min((now - last) / 1000, MAX_FRAME);
    last = now;

    handleActions();

    if (screen === SCREEN_TITLE || screen === SCREEN_PLAY) {
      while (accumulator >= STEP && (screen === SCREEN_TITLE || screen === SCREEN_PLAY)) {
        step();
        accumulator -= STEP;
      }
    } else {
      accumulator = 0;
    }

    renderer.draw(world.state, screen, best);
  }

  // Auto-pause when browser tab loses focus
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && screen === SCREEN_PLAY) {
      screen = SCREEN_PAUSED;
      announce('Game paused.');
    }
  });

  // Keyboard shortcut for radio toggle in any mode
  window.addEventListener('keydown', (e) => {
    if (e.code === 'KeyR' && !e.repeat && screen === SCREEN_PLAY) {
      playRadioSynthwave({ action: 'toggle' });
    }
  });

  announce('Vice City Crime. Press Space or click to start.');
  requestAnimationFrame(frame);
}

// Launch either screenshot staging or the interactive game if in browser
if (isBrowser) {
  if (shotParam) runShot(shotParam);
  else runGame();
}
