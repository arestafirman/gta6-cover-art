// Duskline Cover Studio — gta6-cover-art-01 entry program (Node 22, stdlib only).
// Hands the app in: copies this repo's app/ and screenshots/ into the output
// directory and writes /output/dossier.json with the vendored make.fun library.
// Run outside the grader with MAKEFUN_OUTPUT_DIR standing in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-app.ts';

const repoRoot = fileURLToPath(new URL('.', import.meta.url));
const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

function copyTree(src, dest) {
  mkdirSync(dest, { recursive: true });
  for (const name of readdirSync(src)) {
    const from = join(src, name);
    const to = join(dest, name);
    if (statSync(from).isDirectory()) copyTree(from, to);
    else cpSync(from, to);
  }
}

mkdirSync(outDir, { recursive: true });
copyTree(join(repoRoot, 'app'), join(outDir, 'app'));
const shotsDir = join(repoRoot, 'screenshots');
if (existsSync(shotsDir)) copyTree(shotsDir, join(outDir, 'screenshots'));

// The scorer's caps for this bounty: only text_max_bytes shapes the bytes,
// the rest refuse an entry the scorer would refuse (4 screenshots max, each
// at most 256 KiB; app/ at most 993 entries / 48 MiB / 1000-byte paths).
const dossier = buildDossier(outDir, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 50331648,
  app_path_max_bytes: 1000,
});
writeFileSync(join(outDir, 'dossier.json'), dossier);
