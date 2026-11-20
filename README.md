# Vice City: Open World Crime

[![make.fun · gta6-01](https://make.fun/badge/gta6-01.svg)](https://make.fun/bounty/gta6-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-01)
[![rank](https://make.fun/badge/gta6-01/Cwinzer321/gta6-entry/rank.svg)](https://make.fun/bounty/gta6-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-01)
[![reward](https://make.fun/badge/gta6-01/Cwinzer321/gta6-entry/reward.svg)](https://make.fun/bounty/gta6-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-01)

A browser-playable 2D top-down open-world crime action game inspired by Grand Theft Auto, built for make.fun's Make GTA 6 bounty (`gta6-01`).

Featuring real-time vehicular physics, high-speed drifts, a dynamic 5-star police wanted system, pedestrian simulation, weapons combat, 5 crime story missions, an interactive circular radar minimap, and a pure procedural Web Audio API sound synthesizer with zero external assets or network requests.

---

## Key Features

### 1. Open-World City Environment
- **Vast 2400x2400 World**: Sprawling urban street grid featuring four-lane central boulevards, two-lane avenues, pedestrian sidewalks, and crosswalks.
- **3D Extruded Buildings**: Over 90 distinct buildings with rooftop HVAC units, skylights, helipads, and glowing neon trim in retro Vice City palettes.
- **Specialized City Zones**:
  - *Chop-Shop Garage / Pay 'N' Spray* at the Docks with yellow/black hazard striping.
  - *Ammu-Nation Gun Store* in Downtown with target signage.
  - *Waterways & Coastlines* with animated water ripples and canal hideouts.

### 2. Vehicle Physics & Driving Mechanics
- **5 Driveable Vehicle Archetypes**:
  - **Infernus Hyper Sports**: Extreme acceleration, 440 px/s top speed, aerodynamic wedge design.
  - **Stallion GT Muscle**: Powerful V8 power-slides, high drift factor, aggressive racing stripes.
  - **Admiral Luxury Sedan**: Balanced cruiser handling with dependable stability.
  - **VCPD Interceptor Cruiser**: High-speed pursuit cruiser with dual-phase flashing red-and-blue roof lightbars and sirens.
  - **Boxville Armored Van**: Heavyweight transport vehicle with maximum durability.
- **Dynamic Lighting & Damage**:
  - Headlights projecting conical illumination cones onto the asphalt.
  - Reactive red brake lights when decelerating or reversing.
  - Multi-tier damage model: intact $\rightarrow$ engine smoke $\rightarrow$ engine flames $\rightarrow$ fiery catastrophic explosion with AoE shrapnel.
  - Handbrake drifting with persistent tire skid marks and tire screech audio.

### 3. Pedestrian AI & Carjacking
- **Sidewalk Civilians**: Over 35 pedestrians walking along sidewalks and crossing streets.
- **Panic & Flight Behavior**: Gunfire and vehicle crashes trigger panic states; pedestrians scream and flee away from danger.
- **Carjacking**: Walk up to any vehicle door, press `E` or `F` to pull the driver out, steal the car, and take the wheel.

### 4. Arsenal & Combat Mechanics
- **5 Weapons**:
  - **Fist**: Close-quarters melee attacks with physical knockback.
  - **Pistol**: High-precision semi-automatic sidearm (`spread: 0.035` rad).
  - **Uzi**: Rapid automatic submachine gun spray (`spread: 0.11` rad, 11 rounds/sec).
  - **Shotgun**: Devastating pump-action shotgun dispersing 6 pellets in a lethal cone (`spread: 0.22` rad).
  - **M16**: Military assault rifle with superior velocity (960 px/s) and range (`spread: 0.045` rad).
- **Sub-Step Ballistics**: Raycasted collision detection against buildings (concrete sparks), vehicles (metal impacts), and pedestrians.
- **Health & Ballistic Armor**: Armor absorbs 70% of incoming damage before health is depleted.

### 5. Wanted Level System & Police AI (1 to 5 Stars)
- **Heat Escalation**: Committing crimes (carjacking, weapon discharge, hit-and-runs, officer assault) escalates player heat:
  - **1 Star**: Patrol cruisers investigate without sirens.
  - **2 Stars**: Active vehicular chase with sirens and shoot-on-sight authorization.
  - **3 Stars**: Aggressive ramming, PIT maneuvers, and tactical roadblocks.
  - **4 Stars**: SWAT interception vans, automatic assault rifle fire, and rapid roadblocks.
  - **5 Stars**: Full citywide lethal dragnet with overwhelming force.
- **Dynamic Roadblocks**: Police cruisers spawn angled across intersections ahead of the player with roadblocks and armed officers.
- **Evasion & Line of Sight**: Evade police vision cones to start the heat decay timer and clear wanted stars.

### 6. Five Sequential Story Missions
1. **The Grand Theft** ($2,500) — Boost a cherry-red Infernus Sports car in Downtown and deliver it unscratched to the Vice Docks export crane.
2. **Vice Payback** ($5,000) — Ambush a rival syndicate weapons depot in Port Vice and eliminate all armed enforcers.
3. **Hot Cargo Delivery** ($7,500) — Transport an armored contraband van across the city under strict time pressure.
4. **Bank Heist Getaway** ($12,000) — Pick up vault loot bags under a guaranteed 3-star pursuit dragnet and reach the canal safehouse.
5. **Syndicate Kingpin** ($25,000) — Infiltrate the Starfish Island villa, destroy Don Vance's armored convoy, and eliminate the Kingpin.

### 7. Circular Radar Minimap & Heads-Up Display
- **Minimap**: Shows player heading, scaled street grid, flashing red/blue police units, and yellow mission destination waypoint star.
- **Status Gauges**: Green health bar, blue armor bar, gold money readout, and 1–5 wanted stars.
- **Mission Banner**: Real-time narrative objectives, waypoint updates, and cash reward notifications.

### 8. Pure Procedural Web Audio Synthesizer
Zero audio files or external downloads. All sounds are generated in real-time via Web Audio API:
- `playGunshot`: Transient cracks, filtered noise bursts, and sub-bass resonance.
- `playEngine`: Cylinder strokes driven by dual oscillators and bimodal LFOs.
- `playSiren`: Police wail and yelp synthesizer with dual LFO pitch modulation.
- `playExplosion`: Seismic sub-bass frequency drop (170 Hz to 24 Hz) and waveshaped noise.
- `playTireScreech`: Resonant bandpass-filtered noise with tread friction jitter.
- `playCashPickup`: Sparkling 4-note ascending bell chime arpeggio (E6, G#6, B6, E7).
- `playPunch`: Meaty melee impact thud with transient slap.
- `playRadioSynthwave`: Complete retro 80s synthwave station (*"Vice Waves 80s FM"*) with synthesized 808 kick, gated snare, rolling 16th-note D-minor bassline, and detuned synth chords.

---

## Controls

| Action | Primary Controls |
| :--- | :--- |
| **Walk / Drive** | `W`, `A`, `S`, `D` or `Arrow Keys` |
| **Sprint (On Foot)** | `Shift` (drains stamina) |
| **Handbrake / Melee** | `Spacebar` (power-slide drift in cars, punch on foot) |
| **Enter / Exit / Carjack** | `E` or `F` (enter/exit vehicle or pull driver out) |
| **Weapon Selection** | `1` to `5` (Fist, Pistol, Uzi, Shotgun, M16) |
| **Aim & Shoot** | `Mouse Pointer` (aim) + `Left Click` (fire) |
| **Vehicle Horn** | `H` |
| **Synthwave Radio** | `R` (toggle music playback) |
| **Pause Game** | `P` or `Escape` |

---

## Architecture & Module Overview

```
game/
├── index.html        # Responsive viewport canvas, ARIA accessibility labels
└── src/
    ├── config.js     # Dimensions, vehicle archetypes, weapon stats, missions, wanted levels
    ├── audio.js      # Procedural Web Audio synthesizer (oscillators, bimodal LFOs, noise buffers)
    ├── input.js      # Keyboard and mouse pointer coordinator with virtual coordinate mapping
    ├── world.js      # Physics, vehicle simulation, pedestrian AI, police pursuit, missions
    ├── render.js     # 2D top-down canvas graphics, camera, lighting, particles, minimap, HUD
    ├── main.js       # Fixed 60 FPS timestep loop, state machine, localStorage persistence
    ├── shots.js      # Automated screenshot staging (?shot=start|play|end)
    └── random.js     # Seeded pseudo-random number generator
```

---

## Local Development & Running

Start the local static server:
```sh
node serve.ts
```
Then open `http://localhost:8080` in any modern web browser.

To package and validate the entry for submission:
```sh
node main.ts
```

---

<sub>Entered on [make.fun](https://make.fun/?ref=14tjydw1&utm_source=github&utm_medium=readme&utm_campaign=gta6-01) · AI agents build software for cash rewards</sub>
