// ============================================================================
// Grand Theft Auto 6 - Arcade Edition: Comprehensive Open-World Engine
// ============================================================================
// Complete 2D top-down open-world crime simulation featuring:
// - Procedural city road network, asphalt boulevards, sidewalks, and building geometry
// - Driveable vehicle physics: acceleration, braking, friction, steering, and high-speed drift
// - Optimized multi-point vehicle-to-building collision response with wall scraping & bounce
// - Refined police roadblock spawning at 3+ stars with angled cruisers, cones, and SWAT officers
// - Tuned weapon ballistics with precise spread parameters for Fist, Pistol, Uzi, Shotgun, and M16
// - Pedestrian AI: sidewalk navigation, wandering, panic states, and fleeing danger
// - Player mechanics: on-foot movement, sprint, weapons combat, carjacking, health/armor
// - Wanted level system (1 to 5 stars) escalating with theft, hit-and-runs, and murder
// - Police cruiser pursuit AI with siren dispatch, roadblock tactics, and dismounting officers
// - 5 sequential crime story missions with waypoints, targets, and cash rewards
// - 100% offline procedural execution with zero external network requests

import {
  BLOCK_SIZE,
  BLOCKS,
  CANVAS,
  CANVAS_HEIGHT,
  CANVAS_WIDTH,
  LIVES,
  MAP,
  MISSIONS,
  PLAYER,
  POLICE_SPAWN_RULES,
  ROADS,
  STEP,
  VEHICLES,
  WANTED_LEVELS,
  WANTED_THRESHOLDS,
  WEAPONS,
  WORLD_HEIGHT,
  WORLD_WIDTH,
} from './config.js';

import {
  playCashPickup,
  playEngine,
  playExplosion,
  playGunshot,
  playPunch,
  playRadioSynthwave,
  playSiren,
  playTireScreech,
} from './audio.js';

// Event bitflags for loop communication
export const EVENT_HIT = 1;
export const EVENT_COIN = 2;
export const EVENT_OVER = 4;
export const EVENT_MISSION_COMPLETE = 8;
export const KIND_BLOCK = 0;
export const KIND_COIN = 1;

/**
 * Creates the complete open-world crime simulation.
 *
 * @param {Function} random - Seeded random generator function
 */
export function createWorld(random) {
  // Fallback random helper methods
  const randFloat = () => (typeof random === 'function' ? random() : Math.random());
  const randRange = (min, max) => min + randFloat() * (max - min);
  const randInt = (min, max) => Math.floor(randRange(min, max));
  const randChoice = (arr) => arr[Math.floor(randFloat() * arr.length)];

  // --------------------------------------------------------------------------
  // 1. Procedural City Generation: Roads, Avenues, Blocks & Buildings
  // --------------------------------------------------------------------------
  const roads = [];
  const intersections = [];
  const buildings = [];

  // Major cross-city boulevards (120px wide) and regular avenues (80px wide)
  const streetXCoords = [180, 440, 700, 960, 1200, 1440, 1700, 1960, 2220];
  const streetYCoords = [180, 440, 700, 960, 1200, 1440, 1700, 1960, 2220];

  // Build Road Grid Network
  streetXCoords.forEach((x) => {
    const isMajor = x === 1200;
    const w = isMajor ? ROADS.avenueWidth : ROADS.width;
    roads.push({
      x: x - w / 2,
      y: 0,
      width: w,
      height: WORLD_HEIGHT,
      orientation: 'vertical',
      isMajor,
    });
  });

  streetYCoords.forEach((y) => {
    const isMajor = y === 1200;
    const h = isMajor ? ROADS.avenueWidth : ROADS.width;
    roads.push({
      x: 0,
      y: y - h / 2,
      width: WORLD_WIDTH,
      height: h,
      orientation: 'horizontal',
      isMajor,
    });
  });

  // Intersections
  streetXCoords.forEach((x) => {
    streetYCoords.forEach((y) => {
      intersections.push({ x, y, radius: 60 });
    });
  });

  // Generate City Blocks and Solid Buildings with alleys and setbacks
  const buildingPalettes = [
    { wall: '#1e293b', roof: '#0f172a', trim: '#38bdf8' }, // Downtown glass high-rise
    { wall: '#334155', roof: '#1e293b', trim: '#ec4899' }, // Neon Art Deco hotel
    { wall: '#475569', roof: '#334155', trim: '#fbbf24' }, // Commercial bank
    { wall: '#374151', roof: '#1f2937', trim: '#ef4444' }, // Industrial brick warehouse
    { wall: '#27272a', roof: '#18181b', trim: '#10b981' }, // Marina luxury residence
  ];

  for (let i = 0; i < streetXCoords.length - 1; i++) {
    for (let j = 0; j < streetYCoords.length - 1; j++) {
      const minX = streetXCoords[i] + ROADS.width / 2 + ROADS.sidewalkWidth;
      const maxX = streetXCoords[i + 1] - ROADS.width / 2 - ROADS.sidewalkWidth;
      const minY = streetYCoords[j] + ROADS.width / 2 + ROADS.sidewalkWidth;
      const maxY = streetYCoords[j + 1] - ROADS.width / 2 - ROADS.sidewalkWidth;

      const blockW = maxX - minX;
      const blockH = maxY - minY;

      if (blockW > 70 && blockH > 70) {
        // Subdivide block into distinct structures
        const split = randFloat() > 0.4 && blockW > 120;
        if (split) {
          const w1 = Math.floor(blockW * 0.48);
          const w2 = blockW - w1 - 16;
          const p1 = randChoice(buildingPalettes);
          const p2 = randChoice(buildingPalettes);

          buildings.push({
            x: minX,
            y: minY,
            width: w1,
            height: blockH,
            color: p1.wall,
            roofColor: p1.roof,
            trimColor: p1.trim,
            id: `b_${buildings.length}`,
          });
          buildings.push({
            x: minX + w1 + 16,
            y: minY,
            width: w2,
            height: blockH,
            color: p2.wall,
            roofColor: p2.roof,
            trimColor: p2.trim,
            id: `b_${buildings.length}`,
          });
        } else {
          const p = randChoice(buildingPalettes);
          buildings.push({
            x: minX,
            y: minY,
            width: blockW,
            height: blockH,
            color: p.wall,
            roofColor: p.roof,
            trimColor: p.trim,
            id: `b_${buildings.length}`,
          });
        }
      }
    }
  }

  // --------------------------------------------------------------------------
  // 2. Simulation State Entities
  // --------------------------------------------------------------------------
  let nextEntityId = 1;

  // Player Entity
  const player = {
    id: 'player',
    x: 620,
    y: 650,
    width: PLAYER.width,
    height: PLAYER.height,
    radius: PLAYER.radius,
    angle: 0,
    vx: 0,
    vy: 0,
    speed: PLAYER.speed,
    sprintSpeed: PLAYER.sprintSpeed,
    health: PLAYER.health,
    maxHealth: PLAYER.health,
    armor: PLAYER.armor,
    maxArmor: PLAYER.armor,
    stamina: PLAYER.staminaMax,
    maxStamina: PLAYER.staminaMax,
    cash: 500,
    invulnerable: 0,
    inVehicle: false,
    vehicle: null,
    carjackTimer: 0,
    selectedWeaponIndex: 1, // Start with Pistol
    weapons: [
      { ...WEAPONS.Fist, ammo: Infinity },
      { ...WEAPONS.Pistol, ammo: 48, spread: 0.035 },
      { ...WEAPONS.Uzi, ammo: 90, spread: 0.11 },
      { ...WEAPONS.Shotgun, ammo: 24, spread: 0.22, pellets: 6 },
      { ...WEAPONS.M16, ammo: 120, spread: 0.045 },
    ],
    fireCooldown: 0,
    wantedLevel: 0,
    heat: 0,
    evasionTimer: 0,
    alive: true,
  };

  // Entity Pools
  const vehicles = [];
  const pedestrians = [];
  const bullets = [];
  const particles = [];
  const cashPickups = [];

  // Story Mission State Machine
  const missionState = {
    currentIndex: 0,
    completedCount: 0,
    currentMission: MISSIONS[0],
    objectiveStep: 'start',
    timer: 0,
    targetEntity: null,
    waypoint: { x: MISSIONS[0].targets.pickupLocation.x, y: MISSIONS[0].targets.pickupLocation.y },
    notification: 'Go to the Downtown Luxury Lot to steal the Infernus Sports car.',
    notificationTimer: 5.0,
  };

  // Camera viewport
  const camera = {
    x: player.x - CANVAS_WIDTH / 2,
    y: player.y - CANVAS_HEIGHT / 2,
    targetX: player.x,
    targetY: player.y,
  };

  // Police Dispatch & Roadblock Timers
  let policeSpawnTimer = 3.0;
  let roadblockSpawnTimer = 8.0;

  // --------------------------------------------------------------------------
  // 3. Optimized Collision Geometry Helpers
  // --------------------------------------------------------------------------
  function distance(x1, y1, x2, y2) {
    return Math.hypot(x2 - x1, y2 - y1);
  }

  function circleBoxOverlap(cx, cy, cr, bx, by, bw, bh) {
    const closestX = Math.max(bx, Math.min(cx, bx + bw));
    const closestY = Math.max(by, Math.min(cy, by + bh));
    const distX = cx - closestX;
    const distY = cy - closestY;
    return distX * distX + distY * distY < cr * cr;
  }

  function resolveCircleBuildingCollision(entity, radius) {
    for (let i = 0; i < buildings.length; i++) {
      const b = buildings[i];
      if (circleBoxOverlap(entity.x, entity.y, radius, b.x, b.y, b.width, b.height)) {
        const closestX = Math.max(b.x, Math.min(entity.x, b.x + b.width));
        const closestY = Math.max(b.y, Math.min(entity.y, b.y + b.height));
        const diffX = entity.x - closestX;
        const diffY = entity.y - closestY;
        const dist = Math.hypot(diffX, diffY) || 1;
        const push = radius - dist;
        if (push > 0) {
          entity.x += (diffX / dist) * push;
          entity.y += (diffY / dist) * push;
        }
      }
    }
  }

  /**
   * Optimized multi-point vehicle-to-building collision solver.
   * Samples corners and bumper points to provide realistic wall scraping,
   * normal reflection bounce without sticky clamping, and angular stabilization.
   */
  function resolveVehicleBuildingCollision(veh) {
    const cosA = Math.cos(veh.angle);
    const sinA = Math.sin(veh.angle);
    const halfL = veh.length * 0.48;
    const halfW = veh.width * 0.46;

    // Contact sample points: front bumper, rear bumper, center, and 4 corners
    const samplePoints = [
      { x: veh.x + cosA * halfL, y: veh.y + sinA * halfL, isFront: true },
      { x: veh.x - cosA * halfL, y: veh.y - sinA * halfL, isRear: true },
      { x: veh.x + cosA * halfL - sinA * halfW, y: veh.y + sinA * halfL + cosA * halfW, isFront: true },
      { x: veh.x + cosA * halfL + sinA * halfW, y: veh.y + sinA * halfL - cosA * halfW, isFront: true },
      { x: veh.x - cosA * halfL - sinA * halfW, y: veh.y - sinA * halfL + cosA * halfW, isRear: true },
      { x: veh.x - cosA * halfL + sinA * halfW, y: veh.y - sinA * halfL - cosA * halfW, isRear: true },
    ];

    for (let b = 0; b < buildings.length; b++) {
      const bld = buildings[b];

      // Quick AABB bounds check
      if (
        veh.x + halfL < bld.x ||
        veh.x - halfL > bld.x + bld.width ||
        veh.y + halfL < bld.y ||
        veh.y - halfL > bld.y + bld.height
      ) {
        continue;
      }

      for (let p = 0; p < samplePoints.length; p++) {
        const pt = samplePoints[p];
        if (pt.x > bld.x && pt.x < bld.x + bld.width && pt.y > bld.y && pt.y < bld.y + bld.height) {
          // Point is penetrating building! Calculate penetration to nearest edge
          const dLeft = pt.x - bld.x;
          const dRight = bld.x + bld.width - pt.x;
          const dTop = pt.y - bld.y;
          const dBottom = bld.y + bld.height - pt.y;
          const minPen = Math.min(dLeft, dRight, dTop, dBottom);

          let pushX = 0;
          let pushY = 0;

          if (minPen === dLeft) pushX = -dLeft;
          else if (minPen === dRight) pushX = dRight;
          else if (minPen === dTop) pushY = -dTop;
          else pushY = dBottom;

          // Push vehicle out
          veh.x += pushX * 0.8;
          veh.y += pushY * 0.8;

          // Normal contact bounce & sliding tangential friction
          if (Math.abs(pushX) > 0) {
            veh.speed = -veh.speed * 0.35;
          } else if (Math.abs(pushY) > 0) {
            veh.speed = -veh.speed * 0.35;
          }

          // Damage on hard impact
          if (Math.abs(veh.speed) > 70) {
            veh.health -= Math.abs(veh.speed) * 0.22;
            spawnParticle('spark', pt.x, pt.y, { color: '#fbbf24', radius: 4 });
            playPunch();
          }

          // Angular nudge away from wall if front or rear collided
          if (pt.isFront) {
            veh.angle += Math.sign(pushX + pushY) * 0.08;
          } else if (pt.isRear) {
            veh.angle -= Math.sign(pushX + pushY) * 0.08;
          }

          break;
        }
      }
    }
  }

  // --------------------------------------------------------------------------
  // 4. Vehicle & Pedestrian Spawning
  // --------------------------------------------------------------------------
  function createVehicle(archetypeKey, x, y, angle = 0, options = {}) {
    const arch = VEHICLES[archetypeKey] || VEHICLES.sedan;
    const color = options.color || randChoice(arch.colors);

    const vehicle = {
      id: `veh_${nextEntityId++}`,
      archetypeKey,
      name: arch.name,
      type: arch.type,
      x,
      y,
      angle,
      speed: options.speed ?? 0,
      lateralVelocity: 0,
      steering: 0,
      maxSpeed: arch.speeds.maxSpeed,
      reverseSpeed: arch.speeds.reverseSpeed,
      acceleration: arch.speeds.acceleration,
      braking: arch.speeds.braking,
      turnSpeed: arch.handling.turnSpeed,
      grip: arch.handling.grip,
      driftFactor: arch.handling.driftFactor,
      friction: arch.handling.friction,
      width: arch.dimensions.width,
      length: arch.dimensions.length,
      wheelbase: arch.dimensions.wheelbase,
      health: arch.health,
      maxHealth: arch.health,
      color,
      isPolice: arch.type === 'cop' || Boolean(options.isPolice),
      sirenActive: (arch.type === 'cop' || Boolean(options.isPolice)) && options.sirenActive !== false,
      driver: null,
      state: 'intact',
      smokeTimer: 0,
      skidTimer: 0,
      honkTimer: 0,
      isMissionTarget: Boolean(options.isMissionTarget),
      isParked: Boolean(options.isParked),
    };

    vehicles.push(vehicle);
    return vehicle;
  }

  function createPedestrian(x, y, options = {}) {
    const isCop = Boolean(options.isCop);
    const ped = {
      id: `ped_${nextEntityId++}`,
      x,
      y,
      radius: 12,
      angle: randFloat() * Math.PI * 2,
      speed: isCop ? 160 : randRange(45, 75),
      health: isCop ? 90 : 40,
      maxHealth: isCop ? 90 : 40,
      state: isCop ? 'pursuing' : 'walking',
      targetX: x + randRange(-150, 150),
      targetY: y + randRange(-150, 150),
      isCop,
      isSyndicate: Boolean(options.isSyndicate),
      isBoss: Boolean(options.isBoss),
      weapon: options.weapon || (isCop ? 'Pistol' : 'Fist'),
      fireCooldown: 0,
      panicTimer: 0,
      color: isCop ? '#1e3a8a' : randChoice(['#38bdf8', '#fb7185', '#34d399', '#facc15', '#c084fc']),
      dead: false,
    };
    pedestrians.push(ped);
    return ped;
  }

  // --------------------------------------------------------------------------
  // 5. Refined Police Roadblock Spawner
  // --------------------------------------------------------------------------
  function spawnPoliceRoadblock(targetX, targetY, isHorizontal = true) {
    // Roadblock consists of two angled VCPD Cruisers blocking both traffic lanes
    const angle1 = isHorizontal ? Math.PI / 4 : (3 * Math.PI) / 4;
    const angle2 = isHorizontal ? -Math.PI / 4 : -(3 * Math.PI) / 4;

    const offset1 = isHorizontal ? { dx: 0, dy: -26 } : { dx: -26, dy: 0 };
    const offset2 = isHorizontal ? { dx: 0, dy: 26 } : { dx: 26, dy: 0 };

    const cop1 = createVehicle('cop', targetX + offset1.dx, targetY + offset1.dy, angle1, {
      sirenActive: true,
      isParked: true,
    });
    const cop2 = createVehicle('cop', targetX + offset2.dx, targetY + offset2.dy, angle2, {
      sirenActive: true,
      isParked: true,
    });

    cop1.speed = 0;
    cop2.speed = 0;

    // Dismounted armed police officers taking cover behind the roadblock
    createPedestrian(targetX + (isHorizontal ? 35 : 0), targetY + (isHorizontal ? 0 : 35), {
      isCop: true,
      weapon: player.wantedLevel >= 4 ? 'M16' : 'Shotgun',
    });
    createPedestrian(targetX - (isHorizontal ? 35 : 0), targetY - (isHorizontal ? 0 : 35), {
      isCop: true,
      weapon: 'M16',
    });
  }

  // --------------------------------------------------------------------------
  // 6. Particle & Effects Factory
  // --------------------------------------------------------------------------
  function spawnParticle(type, x, y, options = {}) {
    particles.push({
      type,
      x,
      y,
      vx: options.vx ?? (randFloat() - 0.5) * 60,
      vy: options.vy ?? (randFloat() - 0.5) * 60,
      radius: options.radius ?? 4,
      color: options.color ?? '#fbbf24',
      life: options.life ?? 0.6,
      maxLife: options.life ?? 0.6,
      growth: options.growth ?? 6,
    });
  }

  function spawnExplosion(x, y, radius = 60) {
    playExplosion();

    // Fireball blast particles
    for (let i = 0; i < 24; i++) {
      const angle = randFloat() * Math.PI * 2;
      const spd = randRange(40, 220);
      spawnParticle('flame', x, y, {
        vx: Math.cos(angle) * spd,
        vy: Math.sin(angle) * spd,
        radius: randRange(8, 20),
        color: randChoice(['#ef4444', '#f97316', '#fbbf24', '#f59e0b']),
        life: randRange(0.5, 1.1),
        growth: 15,
      });
    }

    // Heavy dark explosion smoke
    for (let i = 0; i < 18; i++) {
      const angle = randFloat() * Math.PI * 2;
      const spd = randRange(20, 110);
      spawnParticle('smoke', x, y, {
        vx: Math.cos(angle) * spd,
        vy: Math.sin(angle) * spd,
        radius: randRange(12, 28),
        color: randChoice(['#475569', '#334155', '#1e293b']),
        life: randRange(0.8, 1.6),
        growth: 20,
      });
    }

    // Damage nearby entities
    vehicles.forEach((veh) => {
      const d = distance(x, y, veh.x, veh.y);
      if (d < radius * 2.2 && veh.state !== 'wreck') {
        veh.health -= (1 - d / (radius * 2.2)) * 320;
        veh.speed += (randFloat() - 0.5) * 120;
      }
    });

    pedestrians.forEach((ped) => {
      const d = distance(x, y, ped.x, ped.y);
      if (d < radius * 2.0 && !ped.dead) {
        ped.health -= 200;
      }
    });

    const playerDist = distance(x, y, player.x, player.y);
    if (playerDist < radius * 2.0) {
      applyDamageToPlayer((1 - playerDist / (radius * 2.0)) * 90);
    }
  }

  function applyDamageToPlayer(amount) {
    if (player.invulnerable > 0 || !player.alive) return;

    let remaining = amount;
    if (player.armor > 0) {
      const armorAbsorb = remaining * 0.7;
      player.armor = Math.max(0, player.armor - armorAbsorb);
      remaining -= armorAbsorb;
    }
    player.health = Math.max(0, player.health - remaining);
    player.invulnerable = PLAYER.invulnerable;

    if (player.health <= 0) {
      player.alive = false;
      player.health = 0;
      missionState.notification = 'WASTED! You were eliminated.';
      missionState.notificationTimer = 4.0;
    }
  }

  function addWantedHeat(amount) {
    player.heat += amount;
    player.evasionTimer = 0;

    let stars = 0;
    if (player.heat >= WANTED_THRESHOLDS[5]) stars = 5;
    else if (player.heat >= WANTED_THRESHOLDS[4]) stars = 4;
    else if (player.heat >= WANTED_THRESHOLDS[3]) stars = 3;
    else if (player.heat >= WANTED_THRESHOLDS[2]) stars = 2;
    else if (player.heat >= WANTED_THRESHOLDS[1]) stars = 1;

    if (stars > player.wantedLevel) {
      player.wantedLevel = stars;
      missionState.notification = `WANTED LEVEL ${stars} STAR${stars > 1 ? 'S' : ''}!`;
      missionState.notificationTimer = 3.0;
      playSiren({ mode: stars >= 3 ? 'yelp' : 'wail', duration: 2.5 });
    }
  }

  // --------------------------------------------------------------------------
  // 7. World Population Setup
  // --------------------------------------------------------------------------
  function populateWorld() {
    vehicles.length = 0;
    pedestrians.length = 0;
    bullets.length = 0;
    particles.length = 0;
    cashPickups.length = 0;

    // Traffic distribution
    const archetypes = ['sedan', 'muscle', 'sports', 'van'];
    for (let i = 0; i < 28; i++) {
      const isVert = randFloat() > 0.5;
      let x, y, angle;
      if (isVert) {
        x = randChoice(streetXCoords) + (randFloat() > 0.5 ? 18 : -18);
        y = randRange(150, WORLD_HEIGHT - 150);
        angle = randFloat() > 0.5 ? Math.PI / 2 : -Math.PI / 2;
      } else {
        x = randRange(150, WORLD_WIDTH - 150);
        y = randChoice(streetYCoords) + (randFloat() > 0.5 ? 18 : -18);
        angle = randFloat() > 0.5 ? 0 : Math.PI;
      }
      createVehicle(randChoice(archetypes), x, y, angle);
    }

    // Sidewalk pedestrians
    for (let i = 0; i < 35; i++) {
      const roadCoord = randChoice(streetXCoords);
      const sidewalkX = roadCoord + (randFloat() > 0.5 ? 54 : -54);
      const sidewalkY = randRange(200, WORLD_HEIGHT - 200);
      createPedestrian(sidewalkX, sidewalkY);
    }

    // Mission 1 Target Vehicle
    const m1Loc = MISSIONS[0].targets.pickupLocation;
    const missionCar = createVehicle('sports', m1Loc.x, m1Loc.y, 0, {
      color: '#ec4899',
      isMissionTarget: true,
      isParked: true,
    });
    missionState.targetEntity = missionCar;
  }

  populateWorld();

  // --------------------------------------------------------------------------
  // 8. Reset Function
  // --------------------------------------------------------------------------
  function reset() {
    player.x = 620;
    player.y = 650;
    player.vx = 0;
    player.vy = 0;
    player.angle = 0;
    player.health = PLAYER.health;
    player.armor = PLAYER.armor;
    player.stamina = PLAYER.staminaMax;
    player.cash = 500;
    player.wantedLevel = 0;
    player.heat = 0;
    player.invulnerable = 0;
    player.inVehicle = false;
    player.vehicle = null;
    player.alive = true;
    player.selectedWeaponIndex = 1;

    missionState.currentIndex = 0;
    missionState.completedCount = 0;
    missionState.currentMission = MISSIONS[0];
    missionState.objectiveStep = 'start';
    missionState.waypoint = {
      x: MISSIONS[0].targets.pickupLocation.x,
      y: MISSIONS[0].targets.pickupLocation.y,
    };
    missionState.notification = 'Welcome to Vice City. Follow the waypoint to steal the Infernus Sports car!';
    missionState.notificationTimer = 5.0;

    policeSpawnTimer = 3.0;
    roadblockSpawnTimer = 8.0;

    populateWorld();
  }

  // --------------------------------------------------------------------------
  // 9. Simulation Step Execution
  // --------------------------------------------------------------------------
  function step(dt, rawInput = {}, isTitle = false) {
    let events = 0;

    const input =
      typeof rawInput === 'object' && rawInput !== null
        ? rawInput
        : {
            moveX: Number(rawInput) || 0,
            moveY: 0,
            sprint: false,
            handbrake: false,
            enterExit: false,
            horn: false,
            radio: false,
            weaponIndex: null,
            mouseX: 640,
            mouseY: 360,
            shooting: false,
          };

    if (missionState.notificationTimer > 0) {
      missionState.notificationTimer -= dt;
    }

    // ------------------------------------------------------------------------
    // A. Player Controls
    // ------------------------------------------------------------------------
    if (player.alive && !isTitle) {
      if (input.weaponIndex !== null && input.weaponIndex >= 0 && input.weaponIndex < player.weapons.length) {
        player.selectedWeaponIndex = input.weaponIndex;
      }

      // Enter / Exit Vehicle (Carjacking)
      if (input.enterExit) {
        if (!player.inVehicle) {
          let nearestVeh = null;
          let minDist = 75;
          for (let i = 0; i < vehicles.length; i++) {
            const v = vehicles[i];
            if (v.state === 'wreck') continue;
            const d = distance(player.x, player.y, v.x, v.y);
            if (d < minDist) {
              minDist = d;
              nearestVeh = v;
            }
          }

          if (nearestVeh) {
            player.inVehicle = true;
            player.vehicle = nearestVeh;
            nearestVeh.driver = player;
            playEngine({ rpm: 0.4, throttle: 0.5, duration: 0.8 });

            if (nearestVeh.driver && nearestVeh.driver !== player) {
              addWantedHeat(120);
            }
          }
        } else {
          const veh = player.vehicle;
          if (veh) {
            veh.driver = null;
            const exitAngle = veh.angle + Math.PI / 2;
            player.x = veh.x + Math.cos(exitAngle) * (veh.width + 12);
            player.y = veh.y + Math.sin(exitAngle) * (veh.width + 12);
            player.inVehicle = false;
            player.vehicle = null;

            if (Math.abs(veh.speed) > 180) {
              applyDamageToPlayer(20);
              playPunch();
            }
          }
        }
      }

      if (input.radio && player.inVehicle) {
        playRadioSynthwave({ action: 'toggle' });
      }

      if (input.horn && player.inVehicle && player.vehicle) {
        player.vehicle.honkTimer = 0.3;
      }

      // Weapons & Combat
      if (player.fireCooldown > 0) {
        player.fireCooldown -= dt;
      }

      if (input.shooting && player.fireCooldown <= 0) {
        const weapon = player.weapons[player.selectedWeaponIndex];

        if (weapon.isMelee) {
          playPunch();
          player.fireCooldown = 0.4;
          const strikeX = player.x + Math.cos(player.angle) * 36;
          const strikeY = player.y + Math.sin(player.angle) * 36;

          pedestrians.forEach((ped) => {
            if (!ped.dead && distance(strikeX, strikeY, ped.x, ped.y) < 38) {
              ped.health -= weapon.damage;
              spawnParticle('spark', ped.x, ped.y, { color: '#ef4444' });
              if (ped.isCop) addWantedHeat(140);
              if (ped.health <= 0) {
                ped.dead = true;
                addWantedHeat(180);
              }
            }
          });
        } else if (weapon.ammo > 0) {
          weapon.ammo -= 1;
          player.fireCooldown = 1 / weapon.fireRate;
          playGunshot(weapon.id);

          const worldMouseX = camera.x + input.mouseX;
          const worldMouseY = camera.y + input.mouseY;
          const baseAimAngle = Math.atan2(worldMouseY - player.y, worldMouseX - player.x);

          if (randFloat() > 0.4) addWantedHeat(35);
          pedestrians.forEach((ped) => {
            if (distance(player.x, player.y, ped.x, ped.y) < 380) {
              ped.state = 'fleeing';
              ped.panicTimer = 6.0;
            }
          });

          // Tuned weapon pellet fan
          const pellets = weapon.pellets || 1;
          for (let p = 0; p < pellets; p++) {
            const spreadAngle = baseAimAngle + (randFloat() - 0.5) * weapon.spread;
            bullets.push({
              x: player.x + Math.cos(player.angle) * 22,
              y: player.y + Math.sin(player.angle) * 22,
              vx: Math.cos(spreadAngle) * weapon.bulletSpeed,
              vy: Math.sin(spreadAngle) * weapon.bulletSpeed,
              damage: weapon.damage,
              rangeRemaining: weapon.range,
              shooter: 'player',
              color: weapon.color,
            });
          }

          spawnParticle('flash', player.x + Math.cos(player.angle) * 24, player.y + Math.sin(player.angle) * 24, {
            radius: 8,
            life: 0.05,
            color: '#fef08a',
          });
        }
      }

      // Movement & Vehicle Physics
      if (!player.inVehicle) {
        const isSprinting = input.sprint && player.stamina > 5;
        const currentSpeed = isSprinting ? player.sprintSpeed : player.speed;

        if (isSprinting && (input.moveX !== 0 || input.moveY !== 0)) {
          player.stamina = Math.max(0, player.stamina - PLAYER.staminaDrain * dt);
        } else {
          player.stamina = Math.min(PLAYER.staminaMax, player.stamina + PLAYER.staminaRegen * dt);
        }

        const worldMouseX = camera.x + input.mouseX;
        const worldMouseY = camera.y + input.mouseY;
        player.angle = Math.atan2(worldMouseY - player.y, worldMouseX - player.x);

        let moveLen = Math.hypot(input.moveX, input.moveY);
        if (moveLen > 0) {
          player.vx = (input.moveX / moveLen) * currentSpeed;
          player.vy = (input.moveY / moveLen) * currentSpeed;
        } else {
          player.vx *= 0.6;
          player.vy *= 0.6;
        }

        player.x += player.vx * dt;
        player.y += player.vy * dt;

        player.x = Math.max(20, Math.min(WORLD_WIDTH - 20, player.x));
        player.y = Math.max(20, Math.min(WORLD_HEIGHT - 20, player.y));

        resolveCircleBuildingCollision(player, player.radius);
      } else {
        const veh = player.vehicle;
        if (veh) {
          if (input.moveY < 0) {
            veh.speed = Math.min(veh.maxSpeed, veh.speed + veh.acceleration * dt);
          } else if (input.moveY > 0) {
            if (veh.speed > 20) {
              veh.speed = Math.max(0, veh.speed - veh.braking * dt);
            } else {
              veh.speed = Math.max(-veh.reverseSpeed, veh.speed - veh.acceleration * 0.7 * dt);
            }
          } else {
            veh.speed *= Math.pow(veh.friction, dt * 60);
          }

          const isDrifting = input.handbrake;
          const turnMultiplier = isDrifting ? 1.6 : 1.0;
          if (input.moveX !== 0 && Math.abs(veh.speed) > 10) {
            const steerDirection = Math.sign(veh.speed) * input.moveX;
            veh.angle += steerDirection * veh.turnSpeed * turnMultiplier * dt;
          }

          if (isDrifting && Math.abs(veh.speed) > 80) {
            veh.lateralVelocity += (randFloat() - 0.5) * 80;
            if (randFloat() > 0.6) playTireScreech(0.8, 0.25);
            spawnParticle('smoke', veh.x - Math.cos(veh.angle) * 25, veh.y - Math.sin(veh.angle) * 25, {
              radius: 6,
              color: '#94a3b8',
              life: 0.4,
            });
          }

          const forwardX = Math.cos(veh.angle) * veh.speed;
          const forwardY = Math.sin(veh.angle) * veh.speed;
          veh.x += forwardX * dt;
          veh.y += forwardY * dt;

          veh.x = Math.max(30, Math.min(WORLD_WIDTH - 30, veh.x));
          veh.y = Math.max(30, Math.min(WORLD_HEIGHT - 30, veh.y));

          player.x = veh.x;
          player.y = veh.y;
          player.angle = veh.angle;

          // Optimized building collision solver
          resolveVehicleBuildingCollision(veh);
        }
      }

      if (player.invulnerable > 0) {
        player.invulnerable -= dt;
      }
    }

    // ------------------------------------------------------------------------
    // B. Vehicle Physics & Environmental Destruction
    // ------------------------------------------------------------------------
    vehicles.forEach((veh) => {
      if (veh.health < veh.maxHealth * 0.4 && veh.state !== 'wreck') {
        veh.state = veh.health < veh.maxHealth * 0.2 ? 'on_fire' : 'smoking';
        veh.smokeTimer += dt;
        if (veh.smokeTimer > 0.08) {
          veh.smokeTimer = 0;
          const smokeX = veh.x + Math.cos(veh.angle) * (veh.length * 0.35);
          const smokeY = veh.y + Math.sin(veh.angle) * (veh.length * 0.35);
          spawnParticle(
            veh.state === 'on_fire' ? 'flame' : 'smoke',
            smokeX,
            smokeY,
            {
              radius: randRange(6, 14),
              color: veh.state === 'on_fire' ? '#ef4444' : '#64748b',
              life: 0.5,
            }
          );
        }
      }

      if (veh.health <= 0 && veh.state !== 'wreck') {
        veh.state = 'wreck';
        veh.speed = 0;
        spawnExplosion(veh.x, veh.y, 75);
      }

      if (Math.abs(veh.speed) > 40 && veh.state !== 'wreck') {
        pedestrians.forEach((ped) => {
          if (!ped.dead && distance(veh.x, veh.y, ped.x, ped.y) < veh.width + 10) {
            ped.health -= Math.abs(veh.speed) * 0.8;
            spawnParticle('spark', ped.x, ped.y, { color: '#ef4444' });
            if (veh.driver === player) addWantedHeat(160);
            if (ped.health <= 0) {
              ped.dead = true;
              if (veh.driver === player) addWantedHeat(200);
            }
          }
        });
      }
    });

    // ------------------------------------------------------------------------
    // C. Pedestrians & AI Behavior
    // ------------------------------------------------------------------------
    pedestrians.forEach((ped) => {
      if (ped.dead) return;

      if (ped.panicTimer > 0) {
        ped.panicTimer -= dt;
        const fleeAngle = Math.atan2(ped.y - player.y, ped.x - player.x);
        ped.x += Math.cos(fleeAngle) * 140 * dt;
        ped.y += Math.sin(fleeAngle) * 140 * dt;
      } else if (!ped.isCop) {
        const d = distance(ped.x, ped.y, ped.targetX, ped.targetY);
        if (d < 20) {
          ped.targetX = ped.x + randRange(-120, 120);
          ped.targetY = ped.y + randRange(-120, 120);
        } else {
          const moveAngle = Math.atan2(ped.targetY - ped.y, ped.targetX - ped.x);
          ped.x += Math.cos(moveAngle) * ped.speed * dt;
          ped.y += Math.sin(moveAngle) * ped.speed * dt;
        }
      }

      resolveCircleBuildingCollision(ped, ped.radius);
    });

    // ------------------------------------------------------------------------
    // D. Police Pursuit AI & Dynamic Roadblock Strategy
    // ------------------------------------------------------------------------
    if (player.wantedLevel > 0) {
      policeSpawnTimer -= dt;
      roadblockSpawnTimer -= dt;

      // Evasion decay check
      let isSeenByPolice = false;
      vehicles.forEach((v) => {
        if (v.isPolice && distance(player.x, player.y, v.x, v.y) < POLICE_SPAWN_RULES.evasionRadius) {
          isSeenByPolice = true;
        }
      });
      pedestrians.forEach((p) => {
        if (p.isCop && !p.dead && distance(player.x, player.y, p.x, p.y) < POLICE_SPAWN_RULES.evasionRadius) {
          isSeenByPolice = true;
        }
      });

      if (!isSeenByPolice) {
        player.evasionTimer += dt;
        const requiredEvasion = WANTED_LEVELS[player.wantedLevel - 1].decayTimeSeconds;
        if (player.evasionTimer >= requiredEvasion) {
          player.wantedLevel -= 1;
          player.evasionTimer = 0;
          if (player.wantedLevel === 0) {
            player.heat = 0;
            missionState.notification = 'HEAT LOST! Wanted level cleared.';
            missionState.notificationTimer = 3.5;
          }
        }
      } else {
        player.evasionTimer = 0;
      }

      // Police pursuit cruiser dispatch
      const spawnInterval = POLICE_SPAWN_RULES.starSpawnIntervals[player.wantedLevel] || 5.0;
      if (policeSpawnTimer <= 0) {
        policeSpawnTimer = spawnInterval;
        const currentCops = vehicles.filter((v) => v.isPolice && v.state !== 'wreck').length;
        const maxCops = POLICE_SPAWN_RULES.maxActivePolicePerStar[player.wantedLevel] || 4;

        if (currentCops < maxCops) {
          const spawnAngle = randFloat() * Math.PI * 2;
          const spawnDist = randRange(POLICE_SPAWN_RULES.minSpawnDistance, POLICE_SPAWN_RULES.maxSpawnDistance);
          const spawnX = Math.max(100, Math.min(WORLD_WIDTH - 100, player.x + Math.cos(spawnAngle) * spawnDist));
          const spawnY = Math.max(100, Math.min(WORLD_HEIGHT - 100, player.y + Math.sin(spawnAngle) * spawnDist));

          createVehicle('cop', spawnX, spawnY, spawnAngle + Math.PI, {
            sirenActive: true,
          });

          createPedestrian(spawnX + 20, spawnY, {
            isCop: true,
            weapon: player.wantedLevel >= 4 ? 'M16' : 'Pistol',
          });
        }
      }

      // Refined Roadblock Spawning ahead of player (at 3+ stars)
      if (player.wantedLevel >= 3 && roadblockSpawnTimer <= 0) {
        roadblockSpawnTimer = player.wantedLevel >= 4 ? 9.0 : 14.0;
        const heading = player.inVehicle && player.vehicle ? player.vehicle.angle : player.angle;
        const leadDist = 520;
        const targetX = Math.max(200, Math.min(WORLD_WIDTH - 200, player.x + Math.cos(heading) * leadDist));
        const targetY = Math.max(200, Math.min(WORLD_HEIGHT - 200, player.y + Math.sin(heading) * leadDist));

        spawnPoliceRoadblock(targetX, targetY, Math.abs(Math.cos(heading)) > Math.abs(Math.sin(heading)));
      }

      // Police Cruiser Pursuit Steering & Ramming
      vehicles.forEach((veh) => {
        if (veh.isPolice && veh.state !== 'wreck' && !veh.isParked) {
          const targetAngle = Math.atan2(player.y - veh.y, player.x - veh.x);
          const angleDiff = Math.atan2(Math.sin(targetAngle - veh.angle), Math.cos(targetAngle - veh.angle));
          veh.angle += Math.sign(angleDiff) * Math.min(Math.abs(angleDiff), veh.turnSpeed * dt);
          veh.speed = Math.min(veh.maxSpeed * 0.9, veh.speed + veh.acceleration * dt);

          const fX = Math.cos(veh.angle) * veh.speed;
          const fY = Math.sin(veh.angle) * veh.speed;
          veh.x += fX * dt;
          veh.y += fY * dt;

          if (player.inVehicle && player.vehicle && distance(veh.x, veh.y, player.vehicle.x, player.vehicle.y) < 55) {
            player.vehicle.health -= 35 * dt;
            spawnParticle('spark', veh.x, veh.y, { color: '#38bdf8' });
          }
        }
      });

      // Armed Police Officers on Foot
      pedestrians.forEach((ped) => {
        if (ped.isCop && !ped.dead) {
          const distToPlayer = distance(ped.x, ped.y, player.x, player.y);
          if (distToPlayer > 180) {
            const angle = Math.atan2(player.y - ped.y, player.x - ped.x);
            ped.x += Math.cos(angle) * ped.speed * dt;
            ped.y += Math.sin(angle) * ped.speed * dt;
          } else {
            ped.fireCooldown = (ped.fireCooldown || 0) - dt;
            if (ped.fireCooldown <= 0) {
              ped.fireCooldown = ped.weapon === 'M16' ? 0.25 : 0.8;
              playGunshot(ped.weapon.toLowerCase());
              const aimAngle = Math.atan2(player.y - ped.y, player.x - ped.x);
              bullets.push({
                x: ped.x,
                y: ped.y,
                vx: Math.cos(aimAngle) * 750,
                vy: Math.sin(aimAngle) * 750,
                damage: ped.weapon === 'M16' ? 24 : 14,
                rangeRemaining: 380,
                shooter: 'police',
                color: '#38bdf8',
              });
            }
          }
        }
      });
    }

    // ------------------------------------------------------------------------
    // E. Bullet Projectiles & Sub-Step Hit Detection
    // ------------------------------------------------------------------------
    for (let i = bullets.length - 1; i >= 0; i--) {
      const b = bullets[i];
      const stepDist = Math.hypot(b.vx, b.vy) * dt;
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      b.rangeRemaining -= stepDist;

      let hit = false;

      // Buildings
      for (let j = 0; j < buildings.length; j++) {
        const bld = buildings[j];
        if (b.x >= bld.x && b.x <= bld.x + bld.width && b.y >= bld.y && b.y <= bld.y + bld.height) {
          hit = true;
          spawnParticle('spark', b.x, b.y, { color: '#fef08a' });
          break;
        }
      }

      // Vehicles
      if (!hit) {
        for (let v = 0; v < vehicles.length; v++) {
          const veh = vehicles[v];
          if (veh.state === 'wreck') continue;
          if (distance(b.x, b.y, veh.x, veh.y) < veh.width) {
            veh.health -= b.damage;
            hit = true;
            spawnParticle('spark', b.x, b.y, { color: '#fbbf24' });
            if (veh.isPolice && b.shooter === 'player') addWantedHeat(60);
            break;
          }
        }
      }

      // Pedestrians
      if (!hit && b.shooter === 'player') {
        for (let p = 0; p < pedestrians.length; p++) {
          const ped = pedestrians[p];
          if (!ped.dead && distance(b.x, b.y, ped.x, ped.y) < ped.radius + 6) {
            ped.health -= b.damage;
            hit = true;
            spawnParticle('spark', b.x, b.y, { color: '#ef4444' });
            if (ped.isCop) addWantedHeat(120);
            if (ped.health <= 0) {
              ped.dead = true;
              addWantedHeat(180);
              cashPickups.push({
                x: ped.x,
                y: ped.y,
                amount: randInt(25, 120),
                radius: 12,
              });
            }
            break;
          }
        }
      }

      // Player
      if (!hit && b.shooter !== 'player') {
        if (distance(b.x, b.y, player.x, player.y) < player.radius + 8) {
          applyDamageToPlayer(b.damage);
          hit = true;
          spawnParticle('spark', player.x, player.y, { color: '#ef4444' });
          events |= EVENT_HIT;
        }
      }

      if (hit || b.rangeRemaining <= 0) {
        bullets.splice(i, 1);
      }
    }

    // Cash Pickups
    for (let i = cashPickups.length - 1; i >= 0; i--) {
      const cp = cashPickups[i];
      if (distance(player.x, player.y, cp.x, cp.y) < player.radius + cp.radius) {
        player.cash += cp.amount;
        playCashPickup();
        cashPickups.splice(i, 1);
        events |= EVENT_COIN;
      }
    }

    // Particle FX
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.life -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.radius += (p.growth || 0) * dt;
      if (p.life <= 0) {
        particles.splice(i, 1);
      }
    }

    // ------------------------------------------------------------------------
    // F. Crime Story Missions Progression
    // ------------------------------------------------------------------------
    const mission = missionState.currentMission;
    if (mission && player.alive) {
      if (mission.id === 'mission_1') {
        if (missionState.objectiveStep === 'start') {
          missionState.waypoint = mission.targets.pickupLocation;
          if (player.inVehicle && player.vehicle && player.vehicle.isMissionTarget) {
            missionState.objectiveStep = 'deliver';
            missionState.waypoint = mission.targets.dropoffLocation;
            missionState.notification = 'Car acquired! Deliver it to the Vice Docks export crane!';
            missionState.notificationTimer = 4.0;
          }
        } else if (missionState.objectiveStep === 'deliver') {
          const dropDist = distance(player.x, player.y, mission.targets.dropoffLocation.x, mission.targets.dropoffLocation.y);
          if (dropDist < 90) {
            player.cash += mission.cashReward;
            playCashPickup();
            events |= EVENT_MISSION_COMPLETE;
            missionState.completedCount = 1;
            missionState.currentIndex = 1;
            missionState.currentMission = MISSIONS[1];
            missionState.objectiveStep = 'start';
            missionState.waypoint = MISSIONS[1].targets.targetLocation;
            missionState.notification = `MISSION PASSED: The Grand Theft! +$${mission.cashReward}`;
            missionState.notificationTimer = 5.0;

            for (let e = 0; e < 6; e++) {
              createPedestrian(
                MISSIONS[1].targets.targetLocation.x + randRange(-60, 60),
                MISSIONS[1].targets.targetLocation.y + randRange(-60, 60),
                { isSyndicate: true, weapon: 'Uzi' }
              );
            }
          }
        }
      } else if (mission.id === 'mission_2') {
        const aliveEnforcers = pedestrians.filter((p) => p.isSyndicate && !p.dead).length;
        if (aliveEnforcers === 0) {
          player.cash += mission.cashReward;
          playCashPickup();
          events |= EVENT_MISSION_COMPLETE;
          missionState.completedCount = 2;
          missionState.currentIndex = 2;
          missionState.currentMission = MISSIONS[2];
          missionState.objectiveStep = 'start';
          missionState.waypoint = MISSIONS[2].targets.pickupLocation;
          missionState.notification = `MISSION PASSED: Vice Payback! +$${mission.cashReward}`;
          missionState.notificationTimer = 5.0;

          const m3Loc = MISSIONS[2].targets.pickupLocation;
          createVehicle('van', m3Loc.x, m3Loc.y, 0, { isMissionTarget: true, isParked: true });
        }
      } else if (mission.id === 'mission_3') {
        if (missionState.objectiveStep === 'start') {
          if (player.inVehicle && player.vehicle && player.vehicle.isMissionTarget) {
            missionState.objectiveStep = 'deliver';
            missionState.waypoint = mission.targets.dropoffLocation;
            missionState.notification = 'Cargo secured! Race to the Ocean Marina Warehouse!';
            missionState.notificationTimer = 4.0;
          }
        } else if (missionState.objectiveStep === 'deliver') {
          const dropDist = distance(player.x, player.y, mission.targets.dropoffLocation.x, mission.targets.dropoffLocation.y);
          if (dropDist < 90) {
            player.cash += mission.cashReward;
            playCashPickup();
            events |= EVENT_MISSION_COMPLETE;
            missionState.completedCount = 3;
            missionState.currentIndex = 3;
            missionState.currentMission = MISSIONS[3];
            missionState.objectiveStep = 'start';
            missionState.waypoint = MISSIONS[3].targets.pickupLocation;
            missionState.notification = `MISSION PASSED: Hot Cargo Delivery! +$${mission.cashReward}`;
            missionState.notificationTimer = 5.0;
          }
        }
      } else if (mission.id === 'mission_4') {
        if (missionState.objectiveStep === 'start') {
          const bankDist = distance(player.x, player.y, mission.targets.pickupLocation.x, mission.targets.pickupLocation.y);
          if (bankDist < 90) {
            missionState.objectiveStep = 'escape';
            missionState.waypoint = mission.targets.dropoffLocation;
            addWantedHeat(750);
            missionState.notification = 'ALARM TRIPPED! 3-Star Police Dragnet! Lose the heat and reach the hideout!';
            missionState.notificationTimer = 5.0;
          }
        } else if (missionState.objectiveStep === 'escape') {
          const safeDist = distance(player.x, player.y, mission.targets.dropoffLocation.x, mission.targets.dropoffLocation.y);
          if (safeDist < 90 && player.wantedLevel === 0) {
            player.cash += mission.cashReward;
            playCashPickup();
            events |= EVENT_MISSION_COMPLETE;
            missionState.completedCount = 4;
            missionState.currentIndex = 4;
            missionState.currentMission = MISSIONS[4];
            missionState.objectiveStep = 'start';
            missionState.waypoint = MISSIONS[4].targets.location;
            missionState.notification = `MISSION PASSED: Bank Heist Getaway! +$${mission.cashReward}`;
            missionState.notificationTimer = 5.0;

            createPedestrian(MISSIONS[4].targets.location.x, MISSIONS[4].targets.location.y, {
              isBoss: true,
              isSyndicate: true,
              weapon: 'M16',
            });
          }
        }
      } else if (mission.id === 'mission_5') {
        const bossAlive = pedestrians.some((p) => p.isBoss && !p.dead);
        if (!bossAlive) {
          player.cash += mission.cashReward;
          playCashPickup();
          events |= EVENT_MISSION_COMPLETE;
          missionState.completedCount = 5;
          missionState.notification = 'VICTORY! Vice Syndicate Kingpin Defeated! You rule Vice City!';
          missionState.notificationTimer = 8.0;
        }
      }
    }

    // Camera Lookahead
    camera.targetX = player.x;
    camera.targetY = player.y;
    camera.x += (camera.targetX - CANVAS_WIDTH / 2 - camera.x) * 0.15;
    camera.y += (camera.targetY - CANVAS_HEIGHT / 2 - camera.y) * 0.15;

    // Backward compatibility item array
    const items = cashPickups.map((cp) => ({
      active: true,
      kind: KIND_COIN,
      x: cp.x,
      y: cp.y,
      width: cp.radius * 2,
      height: cp.radius * 2,
    }));

    // Update state object
    state.player = player;
    state.vehicles = vehicles;
    state.pedestrians = pedestrians;
    state.bullets = bullets;
    state.particles = particles;
    state.cashPickups = cashPickups;
    state.buildings = buildings;
    state.roads = roads;
    state.intersections = intersections;
    state.camera = camera;
    state.mission = missionState;
    state.score = player.cash;
    state.cash = player.cash;
    state.wantedLevel = player.wantedLevel;
    state.heat = player.heat;
    state.level = missionState.completedCount + 1;
    state.items = items;
    state.lives = player.alive ? LIVES : 0;

    if (!player.alive) {
      events |= EVENT_OVER;
    }

    return events;
  }

  // Initial State Container
  const state = {
    player,
    vehicles,
    pedestrians,
    bullets,
    particles,
    cashPickups,
    buildings,
    roads,
    intersections,
    camera,
    mission: missionState,
    score: player.cash,
    cash: player.cash,
    wantedLevel: player.wantedLevel,
    heat: player.heat,
    lives: LIVES,
    level: 1,
    items: [],
  };

  return {
    state,
    reset,
    step,
    triggerExplosion: spawnExplosion,
    spawnRoadblock: spawnPoliceRoadblock,
  };
}
