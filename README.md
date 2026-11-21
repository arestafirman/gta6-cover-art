# Duskline Cover Studio

[![make.fun · gta6-cover-art-01](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/arestafirman/gta6-cover-art/rank.svg)](https://make.fun/bounty/gta6-cover-art-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/arestafirman/gta6-cover-art/reward.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)

Turn your photos + a caption into GTA-style multi-panel cover art, fully offline.

## What it does

- **6 layouts** — Nine Panel grid, Hero + Three, Four Panel, Full Bleed, Tilted Snapshots, Slanted Cut — with a pop-out hero that overlaps its neighbours.
- **6 gradient-map grades** — Sunset, Neon Vice, Heatwave, Palm Dusk, Noir, Candy — applied per panel on canvas.
- **Poster lettering** — striped chrome title in Anton, neon script subtitle in Pacifico (both SIL OFL fonts shipped under `app/fonts/`).
- **Poster furniture** — name tags, role tags, review strip, heat-meter stars, a Duskline seal, and a billing block.
- **Any photo** — upload up to 4 photos (they never leave your machine), per-panel crop with drag + zoom + focal point, portrait framing preset, fill all panels with one photo.
- **Fast** — one click exports all 3 post sizes at once: PNG 1080×1080, 1080×1350, 1920×1080.
- **Polish** — live preview, undo/redo, grain + vignette, halftone title block, inked panel borders.

## Run it

```sh
node serve.ts
# open http://localhost:8080
```

Or open `app/index.html` straight from the files — it needs no server and no network. Two model-made sample photos ship under `app/samples/` so it works instantly.

## Build

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

An entry for the [Make GTA 6 Cover Art](https://make.fun/bounty/gta6-cover-art-01) bounty on make.fun. Original work — no Rockstar logo, artwork, character, or font anywhere in it.
