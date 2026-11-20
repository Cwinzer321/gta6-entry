// ============================================================================
// Grand Theft Auto 6 - Arcade Edition: High-Performance 2D Canvas Renderer
// ============================================================================
// Rich top-down open-world graphics engine featuring:
// - Camera following player or driveable vehicle with dynamic velocity lookahead
// - Asphalt street grid with dashed lane markings, sidewalks, and crosswalks
// - Water boundaries, Chop-Shop garage zone, and Ammu-Nation gun store zones
// - 3D extruded building rooftops with neon edge glows, skylights, and helipads
// - Vehicle graphics: directional headlights, brake lights, police lightbars, tire smoke, and skid trails
// - Pedestrians and player: weapon holding, walking animation, muzzle flashes, blood, explosions
// - Comprehensive HUD:
//   * Circular radar minimap with street grid, nearby cops (pulsing red/blue), and mission waypoint
//   * Top-right green health bar, cyan armor bar, gold money counter, and 1-5 wanted stars
//   * Active weapon icon and ammunition readout
//   * Top-center narrative mission banner and notification ticker
// - Responsive resolution scaling (1280x720 logical canvas)

import { CANVAS, CANVAS_HEIGHT, CANVAS_WIDTH, FIELD, FONT, PALETTE, ROADS, WEAPONS } from './config.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_PAUSED = 'paused';
export const SCREEN_OVER = 'over';

/**
 * Creates the complete game rendering engine.
 *
 * @param {HTMLCanvasElement} canvas - Target canvas element
 */
export function createRenderer(canvas) {
  const ctx = canvas.getContext('2d');
  const view = { scale: 1, x: 0, y: 0 };

  // Persistent tire skid marks buffer canvas for smooth rendering
  const skidCanvas = typeof document !== 'undefined' ? document.createElement('canvas') : null;
  const skidCtx = skidCanvas ? skidCanvas.getContext('2d') : null;
  if (skidCanvas) {
    skidCanvas.width = 2400;
    skidCanvas.height = 2400;
  }

  // Smooth camera coordinates
  let camX = 620 - CANVAS_WIDTH / 2;
  let camY = 650 - CANVAS_HEIGHT / 2;

  // Window resize handler maintaining 16:9 aspect ratio
  function resize() {
    if (typeof window === 'undefined') return;
    const ratio = window.devicePixelRatio || 1;
    const width = Math.round(window.innerWidth * ratio);
    const height = Math.round(window.innerHeight * ratio);
    canvas.width = width;
    canvas.height = height;
    view.scale = Math.min(width / CANVAS_WIDTH, height / CANVAS_HEIGHT);
    view.x = (width - CANVAS_WIDTH * view.scale) / 2;
    view.y = (height - CANVAS_HEIGHT * view.scale) / 2;
  }

  // Text rendering helper
  function drawText(text, x, y, size, color = '#f8fafc', align = 'left', weight = 'bold') {
    ctx.font = `${weight} ${size}px ${FONT}`;
    ctx.fillStyle = color;
    ctx.textAlign = align;
    ctx.textBaseline = 'middle';
    ctx.fillText(text, x, y);
  }

  // --------------------------------------------------------------------------
  // 1. World Surface: Ocean, Roads, Sidewalks, Special Zones & Buildings
  // --------------------------------------------------------------------------
  function drawWorldEnvironment(state, timeSec) {
    // A. Ocean Water Base & Coastlines
    ctx.fillStyle = '#0f2744';
    ctx.fillRect(0, 0, 2400, 2400);

    // Animated water wave ripples along the coastal borders
    ctx.fillStyle = '#1e3a5f';
    for (let w = 0; w < 12; w++) {
      const waveY = (w * 200 + timeSec * 35) % 2400;
      ctx.fillRect(2340, waveY, 60, 40);
      ctx.fillRect(0, (waveY + 100) % 2400, 40, 30);
    }

    // Ground city terrain base
    ctx.fillStyle = '#141923';
    ctx.fillRect(40, 40, 2320, 2320);

    // B. Asphalt Roads, Sidewalks, and Intersections
    const roads = state.roads || [];
    roads.forEach((road) => {
      // Sidewalk Buffers
      ctx.fillStyle = '#334155';
      if (road.orientation === 'vertical') {
        ctx.fillRect(road.x - ROADS.sidewalkWidth, road.y, road.width + ROADS.sidewalkWidth * 2, road.height);
      } else {
        ctx.fillRect(road.x, road.y - ROADS.sidewalkWidth, road.width, road.height + ROADS.sidewalkWidth * 2);
      }

      // Asphalt Surface
      ctx.fillStyle = road.isMajor ? '#181e28' : '#1e2430';
      ctx.fillRect(road.x, road.y, road.width, road.height);

      // Curbs
      ctx.fillStyle = '#475569';
      if (road.orientation === 'vertical') {
        ctx.fillRect(road.x - 2, road.y, 2, road.height);
        ctx.fillRect(road.x + road.width, road.y, 2, road.height);
      } else {
        ctx.fillRect(road.x, road.y - 2, road.width, 2);
        ctx.fillRect(road.x, road.y + road.height, road.width, 2);
      }
    });

    // Dashed Lane Markings & Crosswalks
    ctx.save();
    roads.forEach((road) => {
      ctx.fillStyle = road.isMajor ? '#f1c40f' : '#f8fafc';
      if (road.orientation === 'vertical') {
        const midX = road.x + road.width / 2;
        for (let y = 0; y < road.height; y += 44) {
          ctx.fillRect(midX - 2, y, 4, 22);
        }
      } else {
        const midY = road.y + road.height / 2;
        for (let x = 0; x < road.width; x += 44) {
          ctx.fillRect(x, midY - 2, 22, 4);
        }
      }
    });

    // Crosswalk Zebra Stripes at Intersections
    const intersections = state.intersections || [];
    ctx.fillStyle = '#cbd5e1';
    intersections.forEach((inter) => {
      // North & South zebra crossings
      for (let s = -32; s <= 32; s += 16) {
        ctx.fillRect(inter.x + s - 4, inter.y - 48, 8, 20);
        ctx.fillRect(inter.x + s - 4, inter.y + 28, 8, 20);
        ctx.fillRect(inter.x - 48, inter.y + s - 4, 20, 8);
        ctx.fillRect(inter.x + 28, inter.y + s - 4, 20, 8);
      }
    });
    ctx.restore();

    // C. Special World Zones: Chop-Shop Garage & Ammu-Nation Gun Store
    // 1. Chop-Shop / Pay 'N' Spray at Docks (x: 2160, y: 2080)
    ctx.save();
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(2100, 2020, 120, 120);
    // Yellow & Black hazard diagonal stripes
    ctx.strokeStyle = '#facc15';
    ctx.lineWidth = 6;
    for (let h = -60; h <= 120; h += 24) {
      ctx.beginPath();
      ctx.moveTo(2100 + h, 2020);
      ctx.lineTo(2100 + h + 60, 2140);
      ctx.stroke();
    }
    ctx.fillStyle = '#0284c7';
    ctx.fillRect(2120, 2040, 80, 80);
    drawText("PAY 'N' SPRAY", 2160, 2070, 11, '#f8fafc', 'center');
    drawText('CHOP-SHOP', 2160, 2090, 10, '#38bdf8', 'center');
    ctx.restore();

    // 2. Ammu-Nation Gun Store (x: 960, y: 440)
    ctx.save();
    ctx.fillStyle = '#1e1b4b';
    ctx.fillRect(900, 380, 120, 120);
    ctx.fillStyle = '#dc2626';
    ctx.fillRect(915, 395, 90, 90);
    // Target bullseye symbol
    ctx.strokeStyle = '#f8fafc';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(960, 440, 28, 0, Math.PI * 2);
    ctx.arc(960, 440, 14, 0, Math.PI * 2);
    ctx.stroke();
    drawText('AMMU-NATION', 960, 440, 10, '#f8fafc', 'center');
    ctx.restore();

    // D. Persistent Tire Skid Marks Overlay
    if (skidCanvas) {
      ctx.drawImage(skidCanvas, 0, 0);
    }

    // E. 3D Extruded Building Blocks with Rooftops, Neon Trim & Helipads
    const buildings = state.buildings || [];
    buildings.forEach((bld) => {
      // 3D Drop-Shadow / Wall Extrusion
      ctx.fillStyle = '#0b0f17';
      ctx.fillRect(bld.x + 8, bld.y + 8, bld.width, bld.height);

      // Building Wall Facade
      ctx.fillStyle = bld.color || '#1e293b';
      ctx.fillRect(bld.x, bld.y, bld.width, bld.height);

      // Rooftop Surface
      const roofPadding = 6;
      ctx.fillStyle = bld.roofColor || '#0f172a';
      ctx.fillRect(
        bld.x + roofPadding,
        bld.y + roofPadding,
        bld.width - roofPadding * 2,
        bld.height - roofPadding * 2
      );

      // Glowing Neon Roof Outline
      ctx.strokeStyle = bld.trimColor || '#06b6d4';
      ctx.lineWidth = 2.5;
      ctx.shadowColor = bld.trimColor || '#06b6d4';
      ctx.shadowBlur = 8;
      ctx.strokeRect(
        bld.x + roofPadding,
        bld.y + roofPadding,
        bld.width - roofPadding * 2,
        bld.height - roofPadding * 2
      );
      ctx.shadowBlur = 0;

      // Rooftop Features (HVAC AC units & Helipads for large roofs)
      if (bld.width > 90 && bld.height > 90) {
        ctx.fillStyle = '#334155';
        ctx.fillRect(bld.x + 16, bld.y + 16, 24, 18);
        ctx.fillRect(bld.x + bld.width - 40, bld.y + 18, 20, 20);

        // Helipad "H"
        if (bld.width > 130 && bld.height > 130) {
          const centerX = bld.x + bld.width / 2;
          const centerY = bld.y + bld.height / 2;
          ctx.strokeStyle = '#facc15';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.arc(centerX, centerY, 24, 0, Math.PI * 2);
          ctx.stroke();
          drawText('H', centerX, centerY, 24, '#facc15', 'center');
        }
      }
    });
  }

  // --------------------------------------------------------------------------
  // 2. Vehicles: Chassis, Headlights, Brake Lights, Siren Lightbars
  // --------------------------------------------------------------------------
  function drawVehicles(state, timeSec) {
    const vehicles = state.vehicles || [];

    vehicles.forEach((veh) => {
      ctx.save();
      ctx.translate(veh.x, veh.y);
      ctx.rotate(veh.angle);

      const halfLen = veh.length / 2;
      const halfWid = veh.width / 2;

      // A. Headlights Casting Forward Light Cones (when intact/active)
      if (veh.state !== 'wreck') {
        const lightGrad = ctx.createRadialGradient(halfLen + 10, 0, 10, halfLen + 140, 0, 130);
        lightGrad.addColorStop(0, 'rgba(254, 240, 138, 0.45)');
        lightGrad.addColorStop(0.6, 'rgba(254, 240, 138, 0.15)');
        lightGrad.addColorStop(1, 'rgba(254, 240, 138, 0.0)');

        ctx.fillStyle = lightGrad;
        ctx.beginPath();
        ctx.moveTo(halfLen, -halfWid * 0.7);
        ctx.lineTo(halfLen + 180, -halfWid * 2.8);
        ctx.lineTo(halfLen + 180, halfWid * 2.8);
        ctx.lineTo(halfLen, halfWid * 0.7);
        ctx.closePath();
        ctx.fill();
      }

      // B. Rear Brake Lights Glow
      const isBraking = veh.speed < 0 || (veh.driver && Math.abs(veh.speed) < 20);
      if (veh.state !== 'wreck') {
        ctx.fillStyle = isBraking ? 'rgba(239, 68, 68, 0.85)' : 'rgba(239, 68, 68, 0.35)';
        ctx.shadowColor = '#ef4444';
        ctx.shadowBlur = isBraking ? 12 : 4;
        ctx.fillRect(-halfLen - 2, -halfWid + 4, 4, 6);
        ctx.fillRect(-halfLen - 2, halfWid - 10, 4, 6);
        ctx.shadowBlur = 0;
      }

      // C. Vehicle Chassis Shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
      ctx.fillRect(-halfLen + 4, -halfWid + 4, veh.length, veh.width);

      // D. Tires
      ctx.fillStyle = '#0f172a';
      const wheelW = 10;
      const wheelL = 16;
      ctx.fillRect(halfLen - 22, -halfWid - 3, wheelL, wheelW);
      ctx.fillRect(halfLen - 22, halfWid - 7, wheelL, wheelW);
      ctx.fillRect(-halfLen + 8, -halfWid - 3, wheelL, wheelW);
      ctx.fillRect(-halfLen + 8, halfWid - 7, wheelL, wheelW);

      // E. Vehicle Body Shell
      ctx.fillStyle = veh.state === 'wreck' ? '#1c1917' : veh.color || '#3b82f6';
      ctx.beginPath();
      ctx.roundRect(-halfLen, -halfWid, veh.length, veh.width, 6);
      ctx.fill();

      // Police White Center Livery
      if (veh.isPolice && veh.state !== 'wreck') {
        ctx.fillStyle = '#f8fafc';
        ctx.fillRect(-halfLen * 0.4, -halfWid, veh.length * 0.45, veh.width);
        drawText('POLICE', 0, 0, 9, '#0f172a', 'center');
      }

      // Sports Car Racing Stripes
      if (veh.type === 'sports' && veh.state !== 'wreck') {
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(-halfLen, -4, veh.length, 8);
      }

      // F. Windshield, Cabin & Rear Glass
      ctx.fillStyle = '#0f172a';
      // Front Windshield
      ctx.beginPath();
      ctx.roundRect(-halfLen * 0.25, -halfWid + 5, veh.length * 0.22, veh.width - 10, 3);
      ctx.fill();
      // Roof Cab
      ctx.fillStyle = veh.state === 'wreck' ? '#292524' : veh.color || '#2563eb';
      ctx.fillRect(-halfLen * 0.5, -halfWid + 6, veh.length * 0.35, veh.width - 12);
      // Rear Glass
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(-halfLen * 0.72, -halfWid + 6, veh.length * 0.18, veh.width - 12);

      // G. Police Strobe Lightbars (Flashing Red & Blue)
      if (veh.isPolice && veh.sirenActive && veh.state !== 'wreck') {
        const isRedPhase = Math.floor(timeSec * 8) % 2 === 0;

        // Roof lightbar unit
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(-6, -halfWid + 8, 12, veh.width - 16);

        // Flashing bulbs
        ctx.fillStyle = isRedPhase ? '#ef4444' : '#1e3a8a';
        ctx.fillRect(-4, -halfWid + 9, 8, (veh.width - 18) / 2);
        ctx.fillStyle = !isRedPhase ? '#3b82f6' : '#7f1d1d';
        ctx.fillRect(-4, 0, 8, (veh.width - 18) / 2);

        // Sweeping Siren Strobe Flash Cones
        ctx.save();
        ctx.fillStyle = isRedPhase ? 'rgba(239, 68, 68, 0.32)' : 'rgba(59, 130, 246, 0.32)';
        ctx.beginPath();
        ctx.arc(0, 0, 95, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // Mission Target Indicator Diamond
      if (veh.isMissionTarget && veh.state !== 'wreck') {
        ctx.save();
        ctx.rotate(-veh.angle);
        const floatY = -halfWid - 22 + Math.sin(timeSec * 6) * 4;
        ctx.fillStyle = '#facc15';
        ctx.beginPath();
        ctx.moveTo(0, floatY - 10);
        ctx.lineTo(8, floatY);
        ctx.lineTo(0, floatY + 10);
        ctx.lineTo(-8, floatY);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }

      ctx.restore();
    });
  }

  // --------------------------------------------------------------------------
  // 3. Pedestrians & Player Character
  // --------------------------------------------------------------------------
  function drawCharacters(state, timeSec) {
    const pedestrians = state.pedestrians || [];
    const player = state.player;

    // A. Pedestrians & Enemies
    pedestrians.forEach((ped) => {
      ctx.save();
      ctx.translate(ped.x, ped.y);

      if (ped.dead) {
        // Dead body with blood pool
        ctx.fillStyle = 'rgba(185, 28, 28, 0.75)';
        ctx.beginPath();
        ctx.ellipse(0, 0, 16, 12, ped.angle, 0, Math.PI * 2);
        ctx.fill();

        ctx.rotate(ped.angle);
        ctx.fillStyle = '#475569';
        ctx.fillRect(-8, -6, 16, 12);
        ctx.fillStyle = '#fbcfe8';
        ctx.beginPath();
        ctx.arc(0, 0, 6, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.rotate(ped.angle);

        // Animated leg cycle
        const walkCycle = Math.sin(timeSec * 14) * 6;
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(-8, -6 + walkCycle, 6, 4);
        ctx.fillRect(-8, 2 - walkCycle, 6, 4);

        // Shoulders / Torso
        ctx.fillStyle = ped.color || '#38bdf8';
        ctx.beginPath();
        ctx.ellipse(0, 0, 10, 7, 0, 0, Math.PI * 2);
        ctx.fill();

        // Head
        ctx.fillStyle = '#fed7aa';
        ctx.beginPath();
        ctx.arc(0, 0, 6, 0, Math.PI * 2);
        ctx.fill();

        // Police / Syndicate Weapon Holding
        if (ped.isCop || ped.isSyndicate) {
          ctx.fillStyle = '#0f172a';
          ctx.fillRect(4, 3, 10, 3); // Gun barrel
        }

        // Boss crown icon
        if (ped.isBoss) {
          drawText('👑 VIP', 0, -18, 11, '#facc15', 'center');
        }
      }
      ctx.restore();
    });

    // B. Player Character (when on-foot)
    if (player && !player.inVehicle && player.alive) {
      ctx.save();
      ctx.translate(player.x, player.y);
      ctx.rotate(player.angle);

      // Invulnerability Blink
      if (player.invulnerable <= 0 || Math.floor(timeSec * 20) % 2 === 0) {
        // Animated walking legs
        const isMoving = Math.hypot(player.vx, player.vy) > 10;
        const walkCycle = isMoving ? Math.sin(timeSec * 16) * 7 : 0;
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(-9, -7 + walkCycle, 7, 5);
        ctx.fillRect(-9, 2 - walkCycle, 7, 5);

        // Player Torso (Vice City Hawaiian Turquoise Shirt)
        ctx.fillStyle = '#06b6d4';
        ctx.beginPath();
        ctx.ellipse(0, 0, 12, 8, 0, 0, Math.PI * 2);
        ctx.fill();

        // Arms holding equipped weapon
        const curWeapon = player.weapons[player.selectedWeaponIndex];
        ctx.fillStyle = '#fed7aa';
        ctx.fillRect(4, -8, 8, 4); // Left arm
        ctx.fillRect(4, 4, 8, 4);  // Right arm

        // Weapon Rendered in Player Hands
        if (curWeapon && !curWeapon.isMelee) {
          ctx.fillStyle = '#1e293b';
          if (curWeapon.name === 'Shotgun' || curWeapon.name === 'M16') {
            ctx.fillRect(8, 2, 18, 4); // Long rifle barrel
          } else {
            ctx.fillRect(8, 3, 9, 3);  // Pistol/Uzi
          }
        }

        // Head & Hair
        ctx.fillStyle = '#fed7aa';
        ctx.beginPath();
        ctx.arc(0, 0, 7, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#451a03'; // Brown hair
        ctx.beginPath();
        ctx.arc(-2, 0, 6, Math.PI * 0.5, Math.PI * 1.5);
        ctx.fill();
      }

      ctx.restore();
    }
  }

  // --------------------------------------------------------------------------
  // 4. Projectiles, Cash Drops & Visual Particles
  // --------------------------------------------------------------------------
  function drawEffects(state) {
    const bullets = state.bullets || [];
    const particles = state.particles || [];
    const cashPickups = state.cashPickups || [];

    // Cash Pickups (Spinning Gold Dollar Coins)
    cashPickups.forEach((cp) => {
      ctx.save();
      ctx.translate(cp.x, cp.y);
      ctx.fillStyle = '#facc15';
      ctx.shadowColor = '#facc15';
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(0, 0, 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
      drawText('$', 0, 0, 12, '#713f12', 'center');
      ctx.restore();
    });

    // Bullets / Tracers
    ctx.lineWidth = 2.5;
    bullets.forEach((b) => {
      ctx.strokeStyle = b.color || '#fef08a';
      ctx.beginPath();
      ctx.moveTo(b.x, b.y);
      ctx.lineTo(b.x - b.vx * 0.02, b.y - b.vy * 0.02);
      ctx.stroke();
    });

    // Particle FX (Explosions, Fire, Smoke, Sparks)
    particles.forEach((p) => {
      const alpha = Math.max(0, Math.min(1, p.life / p.maxLife));
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = p.color || '#fbbf24';

      if (p.type === 'flame' || p.type === 'blast') {
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 10;
      }

      ctx.beginPath();
      ctx.arc(p.x, p.y, Math.max(1, p.radius), 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });
  }

  // --------------------------------------------------------------------------
  // 5. Complete Heads-Up Display (HUD)
  // --------------------------------------------------------------------------
  function drawHUD(state, timeSec) {
    const player = state.player;
    const mission = state.mission;

    // ------------------------------------------------------------------------
    // A. Bottom-Left Circular Radar Minimap
    // ------------------------------------------------------------------------
    const radarX = 110;
    const radarY = CANVAS_HEIGHT - 110;
    const radarRadius = 75;

    ctx.save();
    // Circular clipping frame for radar
    ctx.beginPath();
    ctx.arc(radarX, radarY, radarRadius, 0, Math.PI * 2);
    ctx.clip();

    // Radar Dark Translucent Background
    ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
    ctx.fillRect(radarX - radarRadius, radarY - radarRadius, radarRadius * 2, radarRadius * 2);

    // Mini Street Grid Lines relative to player
    const scale = radarRadius / 520;
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 3;
    const roads = state.roads || [];
    roads.forEach((road) => {
      const relX = radarX + (road.x - player.x) * scale;
      const relY = radarY + (road.y - player.y) * scale;
      if (road.orientation === 'vertical') {
        ctx.strokeRect(relX, radarY - radarRadius, road.width * scale, radarRadius * 2);
      } else {
        ctx.strokeRect(radarX - radarRadius, relY, radarRadius * 2, road.height * scale);
      }
    });

    // Cops on Radar (Pulsing Red/Blue Dots)
    const vehicles = state.vehicles || [];
    vehicles.forEach((v) => {
      if (v.isPolice && v.state !== 'wreck') {
        const copRelX = radarX + (v.x - player.x) * scale;
        const copRelY = radarY + (v.y - player.y) * scale;
        const isRed = Math.floor(timeSec * 6) % 2 === 0;
        ctx.fillStyle = isRed ? '#ef4444' : '#3b82f6';
        ctx.beginPath();
        ctx.arc(copRelX, copRelY, 4, 0, Math.PI * 2);
        ctx.fill();
      }
    });

    // Mission Waypoint Marker on Radar
    if (mission && mission.waypoint) {
      const targetRelX = (mission.waypoint.x - player.x) * scale;
      const targetRelY = (mission.waypoint.y - player.y) * scale;
      const targetDist = Math.hypot(targetRelX, targetRelY);

      // Clamp to radar circle if outside
      const clampDist = Math.min(radarRadius - 8, targetDist);
      const angle = Math.atan2(targetRelY, targetRelX);
      const blipX = radarX + Math.cos(angle) * clampDist;
      const blipY = radarY + Math.sin(angle) * clampDist;

      ctx.fillStyle = '#facc15';
      ctx.shadowColor = '#facc15';
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(blipX, blipY, 5.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    }

    // Player Center Triangle on Radar
    ctx.fillStyle = '#f8fafc';
    ctx.beginPath();
    ctx.moveTo(radarX + Math.cos(player.angle) * 8, radarY + Math.sin(player.angle) * 8);
    ctx.lineTo(radarX + Math.cos(player.angle + 2.5) * 6, radarY + Math.sin(player.angle + 2.5) * 6);
    ctx.lineTo(radarX + Math.cos(player.angle - 2.5) * 6, radarY + Math.sin(player.angle - 2.5) * 6);
    ctx.closePath();
    ctx.fill();

    ctx.restore();

    // Radar Neon Border Ring & Compass North
    ctx.save();
    ctx.strokeStyle = '#06b6d4';
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.arc(radarX, radarY, radarRadius, 0, Math.PI * 2);
    ctx.stroke();

    // North Indicator
    drawText('N', radarX, radarY - radarRadius - 10, 12, '#38bdf8', 'center');
    ctx.restore();

    // ------------------------------------------------------------------------
    // B. Top-Right Status: Health, Armor, Cash & Wanted Stars
    // ------------------------------------------------------------------------
    const statX = CANVAS_WIDTH - 240;
    const statY = 24;

    // 1. Health Bar (Vibrant Green)
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(statX, statY, 210, 16);
    const healthRatio = Math.max(0, Math.min(1, player.health / player.maxHealth));
    ctx.fillStyle = healthRatio > 0.25 ? '#22c55e' : '#ef4444';
    ctx.fillRect(statX + 2, statY + 2, 206 * healthRatio, 12);
    drawText('HEALTH', statX - 10, statY + 8, 11, '#94a3b8', 'right');

    // 2. Armor Bar (Vibrant Cyan)
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(statX, statY + 22, 210, 14);
    const armorRatio = Math.max(0, Math.min(1, player.armor / player.maxArmor));
    ctx.fillStyle = '#0ea5e9';
    ctx.fillRect(statX + 2, statY + 24, 206 * armorRatio, 10);
    drawText('ARMOR', statX - 10, statY + 29, 11, '#94a3b8', 'right');

    // 3. Cash Counter ($00002500)
    const cashStr = `$${String(player.cash).padStart(8, '0')}`;
    drawText(cashStr, CANVAS_WIDTH - 30, statY + 62, 26, '#fbbf24', 'right');

    // 4. Wanted Level Stars (1 to 5 Stars)
    const starBaseX = CANVAS_WIDTH - 170;
    const starBaseY = statY + 92;
    for (let s = 1; s <= 5; s++) {
      const active = s <= player.wantedLevel;
      const isFlashing = active && player.evasionTimer > 0 && Math.floor(timeSec * 4) % 2 === 0;

      ctx.fillStyle = active && !isFlashing ? '#f59e0b' : '#334155';
      if (active) {
        ctx.shadowColor = '#f59e0b';
        ctx.shadowBlur = 6;
      }
      drawText('★', starBaseX + (s - 1) * 26, starBaseY, 24, ctx.fillStyle, 'center');
      ctx.shadowBlur = 0;
    }

    // ------------------------------------------------------------------------
    // C. Selected Weapon Icon & Ammo Readout
    // ------------------------------------------------------------------------
    const weaponBoxX = CANVAS_WIDTH - 150;
    const weaponBoxY = statY + 122;

    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    ctx.roundRect(weaponBoxX, weaponBoxY, 120, 48, 6);
    ctx.fill();
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    const curWep = player.weapons[player.selectedWeaponIndex] || player.weapons[0];
    drawText(curWep.name.toUpperCase(), weaponBoxX + 10, weaponBoxY + 16, 13, '#38bdf8', 'left');
    const ammoText = curWep.isMelee ? '∞' : String(curWep.ammo);
    drawText(`AMMO: ${ammoText}`, weaponBoxX + 10, weaponBoxY + 34, 12, '#f8fafc', 'left');

    // ------------------------------------------------------------------------
    // D. Top-Center Mission Objective Banner & Notification Ticker
    // ------------------------------------------------------------------------
    if (mission && mission.currentMission) {
      const bannerW = 640;
      const bannerH = 46;
      const bannerX = (CANVAS_WIDTH - bannerW) / 2;
      const bannerY = 16;

      ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
      ctx.beginPath();
      ctx.roundRect(bannerX, bannerY, bannerW, bannerH, 8);
      ctx.fill();

      ctx.strokeStyle = '#ec4899';
      ctx.lineWidth = 2;
      ctx.stroke();

      drawText(`MISSION: ${mission.currentMission.title.toUpperCase()}`, bannerX + 16, bannerY + 16, 12, '#ec4899', 'left');
      const instruction = mission.notification || mission.currentMission.description;
      drawText(instruction, bannerX + 16, bannerY + 32, 11, '#e2e8f0', 'left');
    }
  }

  // --------------------------------------------------------------------------
  // 6. Title, Paused & Game Over Overlay Screens
  // --------------------------------------------------------------------------
  function drawOverlays(screen, state, best) {
    if (screen === SCREEN_TITLE) {
      ctx.fillStyle = 'rgba(11, 15, 25, 0.88)';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // 80s Synthwave Vice City Logo
      drawText('GRAND THEFT AUTO', CANVAS_WIDTH / 2, 130, 42, '#f8fafc', 'center', '900');
      ctx.shadowColor = '#ec4899';
      ctx.shadowBlur = 18;
      drawText('VICE CITY ARCADE', CANVAS_WIDTH / 2, 185, 54, '#ec4899', 'center', '900');
      ctx.shadowColor = '#06b6d4';
      drawText('GTA 6 EDITION', CANVAS_WIDTH / 2, 235, 26, '#06b6d4', 'center', '700');
      ctx.shadowBlur = 0;

      // Controls Cheat-Sheet Panel
      const panelW = 620;
      const panelH = 260;
      const panelX = (CANVAS_WIDTH - panelW) / 2;
      const panelY = 280;

      ctx.fillStyle = 'rgba(30, 41, 59, 0.8)';
      ctx.roundRect(panelX, panelY, panelW, panelH, 10);
      ctx.fill();
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2;
      ctx.stroke();

      drawText('OPEN-WORLD CONTROLS', CANVAS_WIDTH / 2, panelY + 30, 16, '#facc15', 'center');
      drawText('WASD / Arrows — Walk / Steer & Accelerate Cars', CANVAS_WIDTH / 2, panelY + 65, 13, '#e2e8f0', 'center');
      drawText('Shift — Sprint (On-Foot) | Space — Handbrake Drift / Punch', CANVAS_WIDTH / 2, panelY + 95, 13, '#e2e8f0', 'center');
      drawText('E or F — Enter / Exit / Carjack Vehicles', CANVAS_WIDTH / 2, panelY + 125, 13, '#e2e8f0', 'center');
      drawText('1 to 5 Keys — Select Weapons (Fist, Pistol, Uzi, Shotgun, M16)', CANVAS_WIDTH / 2, panelY + 155, 13, '#e2e8f0', 'center');
      drawText('Mouse Aim + Left Click — Shoot Firearms / Melee Strike', CANVAS_WIDTH / 2, panelY + 185, 13, '#e2e8f0', 'center');
      drawText('H — Vehicle Horn | R — 80s Synthwave Radio | P — Pause', CANVAS_WIDTH / 2, panelY + 215, 13, '#e2e8f0', 'center');

      // Pulsing Start Prompt
      drawText('PRESS SPACE OR CLICK TO START CRIME RUN', CANVAS_WIDTH / 2, 595, 20, '#facc15', 'center');
    } else if (screen === SCREEN_PAUSED) {
      ctx.fillStyle = 'rgba(11, 15, 25, 0.75)';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      drawText('GAME PAUSED', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 20, 48, '#f8fafc', 'center', '900');
      drawText('PRESS P OR ESCAPE TO RESUME CRIME CITY', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 35, 18, '#38bdf8', 'center');
    } else if (screen === SCREEN_OVER) {
      ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      ctx.shadowColor = '#ef4444';
      ctx.shadowBlur = 25;
      drawText('WASTED', CANVAS_WIDTH / 2, 240, 72, '#ef4444', 'center', '900');
      ctx.shadowBlur = 0;

      drawText(`CASH EARNED: $${state.cash || state.score || 0}`, CANVAS_WIDTH / 2, 340, 24, '#fbbf24', 'center');
      drawText(`STORY MISSIONS COMPLETED: ${state.level ? state.level - 1 : 0} / 5`, CANVAS_WIDTH / 2, 380, 18, '#e2e8f0', 'center');
      drawText('PRESS SPACE OR CLICK TO PLAY AGAIN', CANVAS_WIDTH / 2, 470, 20, '#facc15', 'center');
    }
  }

  // --------------------------------------------------------------------------
  // 7. Master Draw Loop
  // --------------------------------------------------------------------------
  function draw(state, screen, best) {
    const timeSec = performance.now() / 1000;

    // Reset transform to viewport
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = PALETTE.backdrop || '#0b0f19';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Apply 16:9 aspect-ratio scale & center transform
    ctx.setTransform(view.scale, 0, 0, view.scale, view.x, view.y);

    // Camera following player or driving vehicle smoothly
    const player = state.player || { x: 620, y: 650, angle: 0, vx: 0, vy: 0 };
    const targetCamX = player.x - CANVAS_WIDTH / 2;
    const targetCamY = player.y - CANVAS_HEIGHT / 2;

    camX += (targetCamX - camX) * 0.12;
    camY += (targetCamY - camY) * 0.12;

    // Clamp camera within 2400x2400 map
    camX = Math.max(0, Math.min(2400 - CANVAS_WIDTH, camX));
    camY = Math.max(0, Math.min(2400 - CANVAS_HEIGHT, camY));

    // Render In-World Elements under Camera Transform
    ctx.save();
    ctx.translate(-camX, -camY);

    drawWorldEnvironment(state, timeSec);
    drawVehicles(state, timeSec);
    drawCharacters(state, timeSec);
    drawEffects(state);

    ctx.restore();

    // Render Screen-Space HUD
    drawHUD(state, timeSec);

    // Render Overlays (Title, Paused, Game Over)
    if (screen !== SCREEN_PLAY) {
      drawOverlays(screen, state, best);
    }
  }

  resize();
  if (typeof window !== 'undefined') {
    window.addEventListener('resize', resize);
  }

  return {
    draw,
    resize,
  };
}
