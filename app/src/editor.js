// Duskline Cover Studio — editor state: photos, crops, undo/redo, shot scenes.
// Photos live only in memory (FileReader / local samples); nothing is uploaded.

import { LAYOUTS, GRADES } from './cover.js';

export function defaultState() {
  return {
    layout: 'grid9',
    grade: 'sunset',
    title: 'SUNSET HEIST',
    subtitle: 'a duskline story',
    nameTag: 'LUCIA',
    roleTag: 'GETAWAY DRIVER',
    review: 'The most wanted poster of the year.',
    heat: 4,
    grain: true,
    halftone: false,
    banded: true,
    previewSize: 'square',
    selectedPanel: 0,
    selectedPhoto: 0,
    photos: [null, null, null, null],
    panelPhoto: [0, 1, 0, 1, 0, 1, 0, 1, 0],
  };
}

export function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('could not load image'));
    img.src = src;
  });
}

export function makePhoto(img, name) {
  return { img, name: name || 'photo', crop: { zoom: 1, ox: 0.5, oy: 0.35 } };
}

export async function loadSample(state, slot, which) {
  const img = await loadImage('samples/' + which + '.jpg');
  state.photos[slot] = makePhoto(img, which);
  return state.photos[slot];
}

export async function loadFilePhoto(state, slot, file) {
  const url = URL.createObjectURL(file);
  const img = await loadImage(url);
  state.photos[slot] = makePhoto(img, file.name);
  return state.photos[slot];
}

// --- Undo / redo over the serialisable part of the state (images stay put). ---
function snapshot(state) {
  return JSON.stringify({
    layout: state.layout, grade: state.grade, title: state.title,
    subtitle: state.subtitle, nameTag: state.nameTag, roleTag: state.roleTag,
    review: state.review, heat: state.heat, grain: state.grain,
    halftone: state.halftone, banded: state.banded,
    selectedPanel: state.selectedPanel, selectedPhoto: state.selectedPhoto,
    panelPhoto: state.panelPhoto,
    crops: state.photos.map((p) => (p ? p.crop : null)),
    photoNames: state.photos.map((p) => (p ? p.name : null)),
  });
}

function applySnapshot(state, json) {
  const s = JSON.parse(json);
  Object.assign(state, {
    layout: s.layout, grade: s.grade, title: s.title, subtitle: s.subtitle,
    nameTag: s.nameTag, roleTag: s.roleTag, review: s.review, heat: s.heat,
    grain: s.grain, halftone: s.halftone, banded: s.banded,
    selectedPanel: s.selectedPanel, selectedPhoto: s.selectedPhoto,
    panelPhoto: s.panelPhoto,
  });
  s.crops.forEach((c, i) => { if (state.photos[i] && c) state.photos[i].crop = c; });
}

export function createHistory(state) {
  const past = [];
  const future = [];
  let last = snapshot(state);
  return {
    get canUndo() { return past.length > 0; },
    get canRedo() { return future.length > 0; },
    commit() {
      const now = snapshot(state);
      if (now === last) return;
      past.push(last);
      if (past.length > 60) past.shift();
      future.length = 0;
      last = now;
    },
    undo() {
      if (!past.length) return false;
      future.push(last);
      last = past.pop();
      applySnapshot(state, last);
      return true;
    },
    redo() {
      if (!future.length) return false;
      past.push(last);
      last = future.pop();
      applySnapshot(state, last);
      return true;
    },
  };
}

// --- Panel picking + drag-to-reframe on the preview canvas. ---
export function pickPanel(rects, x, y) {
  let best = -1, bestArea = Infinity;
  rects.forEach((r, i) => {
    if (x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h) {
      const area = r.w * r.h;
      if (area < bestArea) { bestArea = area; best = i; }
    }
  });
  return best;
}

export function nudgeCrop(photo, dxFrac, dyFrac) {
  if (!photo) return;
  const c = photo.crop;
  c.ox = Math.min(0.95, Math.max(0.05, c.ox - dxFrac));
  c.oy = Math.min(0.95, Math.max(0.05, c.oy - dyFrac));
}

export function setZoom(photo, zoom) {
  if (!photo) return;
  photo.crop.zoom = Math.min(2.6, Math.max(1, zoom));
}

export function portraitFraming(photo) {
  if (!photo) return;
  photo.crop.zoom = 1.35;
  photo.crop.ox = 0.5;
  photo.crop.oy = 0.22;
}

export function fillAllPanels(state, photoIndex) {
  const n = state.panelPhoto.length;
  state.panelPhoto = Array.from({ length: n }, () => photoIndex);
}

export function randomise(state) {
  state.layout = LAYOUTS[Math.floor(Math.random() * LAYOUTS.length)].id;
  state.grade = GRADES[Math.floor(Math.random() * GRADES.length)].id;
  state.heat = 1 + Math.floor(Math.random() * 5);
}

// --- Fixed scenes for screenshots (?shot=cover / ?shot=editor). ---
export async function runShot(state, shot, query) {
  if (shot === 'cover') document.body.classList.add('shot-cover');
  const photo = query.get('photo') || 'pier';
  const caption = query.get('caption') || 'Sunset Heist';
  const layout = query.get('layout');
  const grade = query.get('grade');
  const size = query.get('size');
  state.title = caption.toUpperCase();
  if (layout) state.layout = layout;
  if (grade) state.grade = grade;
  if (size) state.previewSize = size;
  await loadSample(state, 0, photo);
  await loadSample(state, 1, photo === 'pier' ? 'boulevard' : 'pier');
  state.panelPhoto = [0, 1, 0, 1, 0, 1, 0, 1, 0];
  return state;
}
