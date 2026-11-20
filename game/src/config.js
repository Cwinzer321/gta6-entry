// ============================================================================
// Grand Theft Auto 6 - Vice City Arcade Edition: Game Configuration & Constants
// ============================================================================

/**
 * Logical / Virtual Canvas Resolution.
 * Renderers project and scale this 16:9 canvas to any screen size.
 */
export const CANVAS = {
  width: 1280,
  height: 720,
  aspectRatio: 1280 / 720,
};
export const CANVAS_WIDTH = 1280;
export const CANVAS_HEIGHT = 720;

/** Simulation fixed timestep (60 updates per second). */
export const STEP = 1 / 60;

/**
 * Open-World Map Dimensions (2400x2400 virtual pixels).
 * Divided into structured street grids, city blocks, districts, and waterways.
 */
export const MAP = {
  width: 2400,
  height: 2400,
  gridCols: 10,
  gridRows: 10,
  cellWidth: 240,
  cellHeight: 240,
  bounds: {
    minX: 0,
    minY: 0,
    maxX: 2400,
    maxY: 2400,
  },
};
export const WORLD_WIDTH = 2400;
export const WORLD_HEIGHT = 2400;

/**
 * Road Grid Specifications.
 * Defines arterial boulevards, standard avenues, lane dividers, and pedestrian sidewalks.
 */
export const ROADS = {
  width: 80,             // Standard 2-lane street width
  avenueWidth: 120,       // Major 4-lane cross-city boulevard width
  laneWidth: 36,          // Single vehicle traffic lane width
  sidewalkWidth: 24,      // Pedestrian walkway buffer flanking roads
  markingWidth: 4,        // Dashed center lane dividing stripe width
  markingLength: 20,      // Dashed lane line stripe length
  markingGap: 24,         // Gap between painted lane stripes
  crosswalkWidth: 28,     // Zebra pedestrian crossing width at intersections
  asphaltColor: '#1e2430',
  markingColor: '#f1c40f',
  sidewalkColor: '#3a4454',
  curbColor: '#535f73',
};
export const ROAD_WIDTH = ROADS.width;

/**
 * City Block Dimensions and Building Zoning.
 * Matches 2400x2400 map grid for clean urban layouts with alleys and courtyards.
 */
export const BLOCKS = {
  size: 240,              // Uniform block grid unit (240x240 pixels)
  width: 240,
  height: 240,
  buildingPadding: 24,    // Building setback from road edge
  minBuildingWidth: 64,
  maxBuildingWidth: 192,
  minBuildingHeight: 64,
  maxBuildingHeight: 192,
  alleyWidth: 32,
};
export const BLOCK_SIZE = BLOCKS.size;

/**
 * Player Character Base Attributes & Movement Dynamics.
 */
export const PLAYER = {
  speed: 180,             // Base walking/running speed (pixels/sec)
  sprintSpeed: 300,       // Sprinting speed with Shift/Sprint key (pixels/sec)
  health: 100,            // Base hit points (max 100)
  armor: 100,             // Max ballistic armor protection (absorbs 70% damage)
  width: 28,              // Hitbox width
  height: 28,             // Hitbox height
  radius: 14,             // Radial collision radius
  turnSpeed: 10.0,        // Rotational smoothing speed (rad/sec)
  invulnerable: 1.5,      // Post-hit invulnerability immunity duration (seconds)
  staminaMax: 100,        // Sprint stamina pool
  staminaDrain: 25,       // Stamina drain rate per second when sprinting
  staminaRegen: 18,       // Stamina recovery per second when walking/resting
  punchCooldown: 0.45,    // Melee attack interval (seconds)
};
export const PLAYER_STATS = {
  speed: 180,
  sprintSpeed: 300,
  health: 100,
  armor: 100,
};

/**
 * Vehicle Archetypes.
 * 5 distinct vehicle classes: sedan, muscle, sports, cop, and van.
 * Includes acceleration, braking, top speeds, handling friction, health, dimensions, and colorways.
 */
export const VEHICLES = {
  sedan: {
    id: 'sedan',
    name: 'Admiral Luxury Sedan',
    type: 'sedan',
    speeds: {
      maxSpeed: 290,
      reverseSpeed: 105,
      acceleration: 230,
      braking: 340,
    },
    handling: {
      turnSpeed: 3.2,
      grip: 0.88,
      driftFactor: 0.12,
      friction: 0.98,
    },
    health: 260,
    maxHealth: 260,
    dimensions: {
      width: 34,
      length: 64,
      wheelbase: 42,
    },
    colors: ['#2563eb', '#3b82f6', '#475569', '#64748b', '#0284c7', '#334155'],
    mass: 1350,
    enginePitch: 1.0,
  },
  muscle: {
    id: 'muscle',
    name: 'Stallion GT Muscle',
    type: 'muscle',
    speeds: {
      maxSpeed: 360,
      reverseSpeed: 115,
      acceleration: 330,
      braking: 290,
    },
    handling: {
      turnSpeed: 2.8,
      grip: 0.77,
      driftFactor: 0.28,     // Higher drift factor for muscle power-slides
      friction: 0.985,
    },
    health: 320,
    maxHealth: 320,
    dimensions: {
      width: 36,
      length: 68,
      wheelbase: 44,
    },
    colors: ['#dc2626', '#ea580c', '#f59e0b', '#7c2d12', '#18181b', '#991b1b'],
    mass: 1650,
    enginePitch: 0.85,
  },
  sports: {
    id: 'sports',
    name: 'Infernus Hyper Sports',
    type: 'sports',
    speeds: {
      maxSpeed: 440,
      reverseSpeed: 130,
      acceleration: 410,
      braking: 430,
    },
    handling: {
      turnSpeed: 4.2,
      grip: 0.94,
      driftFactor: 0.15,
      friction: 0.99,
    },
    health: 190,
    maxHealth: 190,
    dimensions: {
      width: 32,
      length: 62,
      wheelbase: 40,
    },
    colors: ['#ec4899', '#06b6d4', '#e11d48', '#8b5cf6', '#10b981', '#f43f5e'],
    mass: 1100,
    enginePitch: 1.35,
  },
  cop: {
    id: 'cop',
    name: 'VCPD Interceptor Cruiser',
    type: 'cop',
    speeds: {
      maxSpeed: 385,
      reverseSpeed: 120,
      acceleration: 350,
      braking: 390,
    },
    handling: {
      turnSpeed: 3.8,
      grip: 0.91,
      driftFactor: 0.14,
      friction: 0.988,
    },
    health: 340,
    maxHealth: 340,
    dimensions: {
      width: 35,
      length: 66,
      wheelbase: 43,
    },
    colors: ['#0f172a', '#f8fafc'], // Classic black & white police livery
    roofLightColors: { red: '#ef4444', blue: '#3b82f6' },
    sirenActive: true,
    mass: 1450,
    enginePitch: 1.1,
  },
  van: {
    id: 'van',
    name: 'Boxville Armored Van',
    type: 'van',
    speeds: {
      maxSpeed: 230,
      reverseSpeed: 80,
      acceleration: 160,
      braking: 260,
    },
    handling: {
      turnSpeed: 2.2,
      grip: 0.82,
      driftFactor: 0.09,
      friction: 0.975,
    },
    health: 460,
    maxHealth: 460,
    dimensions: {
      width: 38,
      length: 74,
      wheelbase: 48,
    },
    colors: ['#6b7280', '#1e293b', '#047857', '#854d0e', '#4338ca', '#374151'],
    mass: 2200,
    enginePitch: 0.75,
  },
};
export const VEHICLE_ARCHETYPES = VEHICLES;

/**
 * Weapon Definitions.
 * Includes Fist (melee), Pistol, Uzi, Shotgun, and M16 assault rifle.
 * Parameters: damage, fireRate (rounds/sec), range (pixels), ammo capacity, spread, and bullet velocity.
 */
export const WEAPONS = {
  Fist: {
    id: 'fist',
    name: 'Fist',
    damage: 20,
    fireRate: 2.2,         // Attacks per second (~0.45s interval)
    range: 48,             // Close quarters melee reach
    ammo: Infinity,
    maxAmmo: Infinity,
    clipSize: Infinity,
    isMelee: true,
    bulletSpeed: 0,
    spread: 0,
    sound: 'punch',
    color: '#e2e8f0',
  },
  Pistol: {
    id: 'pistol',
    name: 'Pistol',
    damage: 32,
    fireRate: 3.5,         // Semi-auto fire (~0.285s interval)
    range: 420,            // Effective range in pixels
    ammo: 60,
    maxAmmo: 180,
    clipSize: 12,
    reloadTime: 1.2,
    bulletSpeed: 860,
    spread: 0.04,          // Angular spread in radians
    pellets: 1,
    sound: 'pistol',
    color: '#94a3b8',
  },
  Uzi: {
    id: 'uzi',
    name: 'Uzi',
    damage: 18,
    fireRate: 11.0,        // High-rate submachine gun (~0.09s interval)
    range: 360,
    ammo: 150,
    maxAmmo: 450,
    clipSize: 30,
    reloadTime: 1.5,
    bulletSpeed: 820,
    spread: 0.12,          // Wider spray cone
    pellets: 1,
    sound: 'uzi',
    color: '#38bdf8',
  },
  Shotgun: {
    id: 'shotgun',
    name: 'Shotgun',
    damage: 16,            // Per pellet (6 pellets x 16 = 96 damage point-blank)
    fireRate: 1.2,         // Pump-action delay (~0.83s interval)
    range: 280,            // Close/medium devastating range
    ammo: 32,
    maxAmmo: 96,
    clipSize: 8,
    reloadTime: 2.2,
    bulletSpeed: 760,
    spread: 0.24,          // Wide pellet dispersion
    pellets: 6,
    sound: 'shotgun',
    color: '#fb923c',
  },
  M16: {
    id: 'm16',
    name: 'M16',
    damage: 38,
    fireRate: 8.5,         // Military automatic rifle (~0.117s interval)
    range: 560,            // Long distance lethal range
    ammo: 180,
    maxAmmo: 540,
    clipSize: 30,
    reloadTime: 1.8,
    bulletSpeed: 960,
    spread: 0.05,          // High precision
    pellets: 1,
    sound: 'm16',
    color: '#4ade80',
  },
};

/**
 * Police Wanted Level Thresholds (1 to 5 Stars).
 * Determines heat required to trigger each star, decay times when out of sight,
 * maximum active squad cars, and tactical pursuit behavior.
 */
export const WANTED_LEVELS = [
  {
    stars: 1,
    threshold: 100,        // Petty theft / hit & run / melee assault
    description: 'Minor Infraction - Patrol Units Investigating',
    decayTimeSeconds: 12,  // Seconds without police sight to lose wanted status
    copMaxUnits: 2,
    copSpeedMultiplier: 1.0,
    shootOnSight: false,
    useSiren: false,
    tactic: 'patrol_and_approach',
  },
  {
    stars: 2,
    threshold: 300,        // Weapon discharge / carjacking / citizen homicide
    description: 'Active Pursuit - Siren Interceptors Dispatched',
    decayTimeSeconds: 20,
    copMaxUnits: 4,
    copSpeedMultiplier: 1.15,
    shootOnSight: true,
    useSiren: true,
    tactic: 'vehicular_pursuit',
  },
  {
    stars: 3,
    threshold: 700,        // Officer assault / reckless urban chaos
    description: 'State Highway Troopers - Roadblocks Deployed',
    decayTimeSeconds: 32,
    copMaxUnits: 6,
    copSpeedMultiplier: 1.28,
    shootOnSight: true,
    useSiren: true,
    roadblocks: true,
    tactic: 'aggressive_ramming_and_roadblocks',
  },
  {
    stars: 4,
    threshold: 1400,       // Mass casualty event / bank robbery alarm
    description: 'SWAT Tactical Unit - Armored Containment',
    decayTimeSeconds: 48,
    copMaxUnits: 8,
    copSpeedMultiplier: 1.38,
    shootOnSight: true,
    useSiren: true,
    roadblocks: true,
    tacticalVans: true,
    tactic: 'swat_interception_and_pit_maneuver',
  },
  {
    stars: 5,
    threshold: 2500,       // Total syndicate warfare / military threat
    description: 'Maximum Lethal Force - Citywide Dragnet',
    decayTimeSeconds: 65,
    copMaxUnits: 12,
    copSpeedMultiplier: 1.5,
    shootOnSight: true,
    useSiren: true,
    roadblocks: true,
    tacticalVans: true,
    tactic: 'overwhelming_lethal_force',
  },
];

export const WANTED_THRESHOLDS = {
  1: 100,
  2: 300,
  3: 700,
  4: 1400,
  5: 2500,
};

/**
 * Police Unit Spawning & AI Response Rules.
 */
export const POLICE_SPAWN_RULES = {
  minSpawnDistance: 380,   // Min pixel distance from player (spawns just off-screen)
  maxSpawnDistance: 780,   // Max pixel distance for squad unit insertion
  evasionRadius: 520,      // Distance to stay clear of police vision cones to decay heat
  starSpawnIntervals: {
    1: 10.0, // Spawn attempt every 10 seconds at 1 star
    2: 6.5,  // Spawn attempt every 6.5 seconds at 2 stars
    3: 4.5,  // Spawn attempt every 4.5 seconds at 3 stars
    4: 3.0,  // Spawn attempt every 3.0 seconds at 4 stars
    5: 2.0,  // Spawn attempt every 2.0 seconds at 5 stars
  },
  maxActivePolicePerStar: {
    1: 2,
    2: 4,
    3: 6,
    4: 8,
    5: 12,
  },
  officerStats: {
    health: 90,
    speed: 165,
    sprintSpeed: 270,
    weapon: 'Pistol',
    accuracy: 0.65,
    swatHealth: 160,
    swatWeapon: 'M16',
  },
};

/**
 * 5 Crime Story Missions.
 * Each mission features full narrative descriptions, objective targets,
 * coordinates, vehicle/enemy parameters, and substantial cash rewards.
 */
export const MISSIONS = [
  {
    id: 'mission_1',
    name: 'The Grand Theft',
    title: 'The Grand Theft',
    description: 'Boost a high-end cherry-red Infernus Sports car parked in the Downtown Financial District and deliver it unscratched to the Vice Docks export crane before rival syndicates or the heat notice.',
    targets: {
      objectiveType: 'steal_and_deliver',
      targetName: 'Infernus Sports',
      vehicleType: 'sports',
      pickupLocation: { x: 620, y: 520, label: 'Downtown Luxury Lot' },
      dropoffLocation: { x: 2160, y: 2080, label: 'Vice Docks Export Crane' },
      maxVehicleDamageAllowed: 60, // Maximum allowed damage % before failing
    },
    cashReward: 2500,
    badgeColor: '#06b6d4',
  },
  {
    id: 'mission_2',
    name: 'Vice Payback',
    title: 'Vice Payback',
    description: 'A rival syndicate crew has set up an illegal weapons cache in the industrial alleys of Port Vice. Ambush their enforcers, neutralize all armed guards, and reclaim the stolen weapon shipment.',
    targets: {
      objectiveType: 'eliminate_targets',
      targetName: 'Syndicate Enforcer Crew',
      enemyCount: 6,
      targetLocation: { x: 1940, y: 760, radius: 180, label: 'Port Vice Alley Depot' },
      reinforcementsOnHalf: 2,
    },
    cashReward: 5000,
    badgeColor: '#e11d48',
  },
  {
    id: 'mission_3',
    name: 'Hot Cargo Delivery',
    title: 'Hot Cargo Delivery',
    description: 'A high-stakes contraband van loaded with untraceable diamonds needs immediate transport across Vice City to the marina safehouse while evading aggressive rival ambush squads.',
    targets: {
      objectiveType: 'escort_cargo',
      targetName: 'Contraband Armored Van',
      vehicleType: 'van',
      pickupLocation: { x: 380, y: 1920, label: 'Industrial Yard Compound' },
      dropoffLocation: { x: 2240, y: 440, label: 'Ocean Marina Warehouse' },
      timeLimitSeconds: 150,
      ambushWaves: 3,
    },
    cashReward: 7500,
    badgeColor: '#f59e0b',
  },
  {
    id: 'mission_4',
    name: 'Bank Heist Getaway',
    title: 'Bank Heist Getaway',
    description: 'The Ocean View Central Bank vault alarm has tripped! Pick up the heist crew outside the bank vault with the loot bags, lose the 3-star police pursuit dragnet, and reach the underground canal safehouse.',
    targets: {
      objectiveType: 'heist_getaway',
      targetName: 'Heist Crew & Duffle Bags',
      pickupLocation: { x: 1200, y: 1120, label: 'Ocean View Central Bank' },
      dropoffLocation: { x: 420, y: 380, label: 'Underground Canal Hideout' },
      initialWantedLevel: 3,
      evadeRequired: true,
    },
    cashReward: 12000,
    badgeColor: '#8b5cf6',
  },
  {
    id: 'mission_5',
    name: 'Syndicate Kingpin',
    title: 'Syndicate Kingpin',
    description: 'The ruthless Vice Syndicate Don has arrived at his fortified Starfish Island estate with an armored motorcade. Infiltrate the perimeter, destroy the escort vehicles, eliminate the Kingpin, and rule Vice City.',
    targets: {
      objectiveType: 'assassination',
      targetName: 'Don Salvatore "The Viper" Vance',
      bossHealth: 500,
      escortVehicles: 2,
      guardCount: 8,
      location: { x: 1760, y: 1680, label: 'Starfish Island Villa' },
      reinforcements: true,
    },
    cashReward: 25000,
    badgeColor: '#ef4444',
  },
];

// --- Backward Compatibility & Arcade UI Defaults ---
export const FIELD = { width: 1280, height: 720, groundY: 664 };
export const LIVES = 3;
export const BLOCK = {
  minWidth: 40,
  maxWidth: 110,
  height: 36,
  speed: 240,
  speedPerLevel: 30,
  speedJitter: 90,
  interval: 0.55,
  intervalScale: 0.88,
  minInterval: 0.14,
  dodgePoints: 1,
};
export const COIN = {
  size: 24,
  speed: 190,
  speedPerLevel: 14,
  interval: 1.4,
  intervalJitter: 0.8,
  points: 10,
};
export const LEVEL = { seconds: 12, max: 12 };
export const POOL_SIZE = 64;
export const PALETTE = {
  backdrop: '#0b0f19',
  sky: '#111827',
  ground: '#1f2937',
  player: '#38bdf8',
  block: '#ef4444',
  coin: '#fbbf24',
  panel: '#1e293b',
  text: '#f8fafc',
  muted: '#94a3b8',
  neonPink: '#ec4899',
  neonCyan: '#06b6d4',
  neonYellow: '#facc15',
};
export const FONT = 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';
export const BEST_KEY = 'gta-crime-city.best';
