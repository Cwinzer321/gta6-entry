// ============================================================================
// Grand Theft Auto 6 - Arcade Edition: Automated Screenshot Staging Pipeline
// ============================================================================
// Staging scenes for ?shot=start|play|end automated visual grading:
// - ?shot=start: Stages the retro 80s synthwave neon title screen ('VICE CITY CRIME')
// - ?shot=play:  Stages an active open-world action scene (player cruising in Infernus Sports,
//                traffic, pedestrians on sidewalks, and complete HUD)
// - ?shot=end:   Stages an intense 4-star police pursuit with sirens, pursuit cruisers,
//                roadblocks, and a massive fiery explosion.

import { STEP } from './config.js';
import { SCREEN_PLAY, SCREEN_TITLE } from './render.js';

/**
 * Stages the requested screenshot scene onto the given world instance.
 *
 * @param {string} name - 'start' | 'play' | 'end'
 * @param {object} world - Simulation world instance returned by createWorld()
 * @returns {object} { screen: string, best: number }
 */
export function stageShot(name, world) {
  world.reset();

  if (name === 'start') {
    // ------------------------------------------------------------------------
    // Scene 1: Start / Neon Title Screen
    // ------------------------------------------------------------------------
    // Advance world slightly so traffic and pedestrians are naturally distributed
    for (let i = 0; i < 20; i++) {
      world.step(STEP, { moveX: 0, moveY: 0 }, true);
    }
    return {
      screen: SCREEN_TITLE,
      best: world.state.cash || 500,
    };
  }

  if (name === 'end') {
    // ------------------------------------------------------------------------
    // Scene 3: End / Intense 4-Star Police Pursuit with Sirens & Explosion
    // ------------------------------------------------------------------------
    const state = world.state;
    const player = state.player;

    // Position player on East-West Central Boulevard (x: 1200, y: 1200)
    player.x = 1200;
    player.y = 1200;
    player.cash = 18500;
    player.armor = 75;
    player.health = 85;
    player.wantedLevel = 4;
    player.heat = 1650;
    player.selectedWeaponIndex = 4; // M16 Assault Rifle

    // Find or convert closest vehicle to a Stallion Muscle car
    let muscleCar = state.vehicles.find((v) => v.type === 'muscle' && v.state !== 'wreck');
    if (!muscleCar) {
      muscleCar = state.vehicles[0];
    }

    if (muscleCar) {
      muscleCar.x = 1200;
      muscleCar.y = 1200;
      muscleCar.angle = 0; // Heading East
      muscleCar.speed = 260;
      muscleCar.color = '#ea580c';
      muscleCar.health = 190;
      muscleCar.driver = player;
      player.inVehicle = true;
      player.vehicle = muscleCar;
    }

    // Spawn 3 aggressive Police Interceptors pursuing immediately behind
    const copOffsets = [
      { dx: -130, dy: -25, angle: 0.05 },
      { dx: -140, dy: 28, angle: -0.04 },
      { dx: -240, dy: 2, angle: 0 },
    ];

    copOffsets.forEach((offset, idx) => {
      const cop = state.vehicles[idx + 1] || state.vehicles[0];
      if (cop && cop !== muscleCar) {
        cop.x = player.x + offset.dx;
        cop.y = player.y + offset.dy;
        cop.angle = offset.angle;
        cop.speed = 255;
        cop.isPolice = true;
        cop.sirenActive = true;
        cop.type = 'cop';
        cop.color = '#0f172a';
        cop.state = 'intact';
      }
    });

    // Spawn Roadblock ahead at intersection (x: 1440, y: 1200)
    const blockCop1 = state.vehicles[5];
    const blockCop2 = state.vehicles[6];
    if (blockCop1) {
      blockCop1.x = 1430;
      blockCop1.y = 1180;
      blockCop1.angle = Math.PI / 4;
      blockCop1.speed = 0;
      blockCop1.isPolice = true;
      blockCop1.sirenActive = true;
      blockCop1.type = 'cop';
    }
    if (blockCop2) {
      blockCop2.x = 1430;
      blockCop2.y = 1220;
      blockCop2.angle = -Math.PI / 4;
      blockCop2.speed = 0;
      blockCop2.isPolice = true;
      blockCop2.sirenActive = true;
      blockCop2.type = 'cop';
    }

    // Trigger a fiery explosion with blast particles nearby (x: 1330, y: 1160)
    if (typeof world.triggerExplosion === 'function') {
      world.triggerExplosion(1330, 1160, 80);
    }

    // Update camera to frame the pursuit action
    state.camera.x = player.x - 640;
    state.camera.y = player.y - 360;

    // Advance 4 physics steps to emit tire smoke, siren strobes, and fireballs
    for (let i = 0; i < 4; i++) {
      world.step(STEP, { moveX: 0, moveY: -1, sprint: false }, false);
    }

    return {
      screen: SCREEN_PLAY,
      best: 18500,
    };
  }

  // --------------------------------------------------------------------------
  // Scene 2: Play / Open-World Crime Action Scene
  // --------------------------------------------------------------------------
  const state = world.state;
  const player = state.player;

  // Place player in the cherry-red Infernus Sports car on Avenue (x: 700, y: 700)
  player.x = 700;
  player.y = 700;
  player.cash = 4500;
  player.armor = 100;
  player.health = 100;
  player.selectedWeaponIndex = 2; // Uzi Submachine Gun

  let sportsCar = state.vehicles.find((v) => v.type === 'sports');
  if (!sportsCar) sportsCar = state.vehicles[0];

  if (sportsCar) {
    sportsCar.x = 700;
    sportsCar.y = 700;
    sportsCar.angle = 0;
    sportsCar.speed = 220;
    sportsCar.color = '#ec4899'; // Cherry neon pink
    sportsCar.isMissionTarget = true;
    sportsCar.driver = player;
    player.inVehicle = true;
    player.vehicle = sportsCar;
  }

  // Place traffic in adjacent lanes
  if (state.vehicles[1]) {
    state.vehicles[1].x = 880;
    state.vehicles[1].y = 720;
    state.vehicles[1].angle = 0;
    state.vehicles[1].speed = 140;
    state.vehicles[1].color = '#3b82f6';
  }

  if (state.vehicles[2]) {
    state.vehicles[2].x = 540;
    state.vehicles[2].y = 680;
    state.vehicles[2].angle = Math.PI;
    state.vehicles[2].speed = 130;
    state.vehicles[2].color = '#f59e0b';
  }

  // Place pedestrians strolling along the sidewalks
  if (state.pedestrians[0]) {
    state.pedestrians[0].x = 720;
    state.pedestrians[0].y = 655;
    state.pedestrians[0].angle = 0;
  }
  if (state.pedestrians[1]) {
    state.pedestrians[1].x = 760;
    state.pedestrians[1].y = 745;
    state.pedestrians[1].angle = Math.PI;
  }

  // Camera framing
  state.camera.x = player.x - 640;
  state.camera.y = player.y - 360;

  // Advance 3 steps for headlights, engine smoke, and HUD
  for (let i = 0; i < 3; i++) {
    world.step(STEP, { moveX: 0, moveY: -1, sprint: false }, false);
  }

  return {
    screen: SCREEN_PLAY,
    best: 4500,
  };
}
