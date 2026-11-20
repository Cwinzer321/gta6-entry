// ============================================================================
// Grand Theft Auto 6 - Vice City: Open World Crime
// Packaging & Entrypoint Script (Node 22, Standard Library Only)
// ============================================================================
// Validates all game modules, copies game assets and screenshots to the
// designated bounty output directory, and builds the canonical submission dossier.

import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

console.log('------------------------------------------------------------');
console.log('Packaging Vice City: Open World Crime (make.fun gta6-01)');
console.log('------------------------------------------------------------');
console.log(`Source directory : ${here}`);
console.log(`Output directory : ${out}`);

// 1. Validate Game Source & Structure
const gameDir = join(here, 'game');
const indexPath = join(gameDir, 'index.html');

if (!existsSync(indexPath)) {
  console.error(`FATAL: Missing required game entrypoint at ${indexPath}`);
  process.exit(1);
}

const requiredModules = [
  'config.js',
  'audio.js',
  'input.js',
  'world.js',
  'render.js',
  'shots.js',
  'main.js',
  'random.js',
];

for (const mod of requiredModules) {
  const modPath = join(gameDir, 'src', mod);
  if (!existsSync(modPath)) {
    console.error(`FATAL: Missing game source module at ${modPath}`);
    process.exit(1);
  }
}

// 2. Validate Screenshots
const screenshotsDir = join(here, 'screenshots');
if (!existsSync(screenshotsDir)) {
  console.error(`FATAL: Missing screenshots directory at ${screenshotsDir}`);
  process.exit(1);
}

const screenshotFiles = readdirSync(screenshotsDir).filter((f) => /\.(jpg|jpeg|png)$/i.test(f));
if (screenshotFiles.length < 3) {
  console.error(`WARNING: Expected at least 3 screenshots, found ${screenshotFiles.length}`);
} else {
  console.log(`Found ${screenshotFiles.length} screenshots: ${screenshotFiles.join(', ')}`);
}

// 3. Prepare Target Directories
mkdirSync(out, { recursive: true });
const targetGame = join(out, 'game');
const targetScreenshots = join(out, 'screenshots');

mkdirSync(targetGame, { recursive: true });
mkdirSync(targetScreenshots, { recursive: true });

// 4. Copy Game Files and Screenshots
console.log('Copying game files to output directory...');
cpSync(gameDir, targetGame, { recursive: true });

console.log('Copying screenshots to output directory...');
cpSync(screenshotsDir, targetScreenshots, { recursive: true });

// 5. Build and Verify Canonical Submission Dossier
console.log('Generating canonical dossier.json with buildDossier...');
const dossierContent = buildDossier(out, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
  game_path_max_bytes: 1000,
});

const dossierPath = join(out, 'dossier.json');
writeFileSync(dossierPath, dossierContent);

const dossierSize = statSync(dossierPath).size;
console.log(`Dossier successfully written (${dossierSize} bytes)`);
console.log('Packaging complete. Ready for submission.');
console.log('------------------------------------------------------------');
