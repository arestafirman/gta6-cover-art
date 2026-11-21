// Duskline Cover Studio — wires the editor UI to the cover renderer.
// Exposes window.Duskline for play-testing: { state, redraw, exportPNG, exportAll }.

import { LAYOUTS, GRADES, SIZES, renderCover, exportCoverPNG } from './cover.js';
import {
  defaultState, loadSample, loadFilePhoto, createHistory, pickPanel,
  nudgeCrop, setZoom, portraitFraming, fillAllPanels, randomise, runShot,
} from './editor.js';

const $ = (id) => document.getElementById(id);
const canvas = $('cover');
const statusEl = $('status');
const state = defaultState();
const history = createHistory(state);
let lastRects = [];
let previewW = 1080, previewH = 1080;

function setStatus(msg) { statusEl.textContent = msg; }

function currentSize() {
  if (state.previewSize === 'portrait') return { w: 1080, h: 1350 };
  if (state.previewSize === 'wide') return { w: 1920, h: 1080 };
  return { w: 1080, h: 1080 };
}

function redraw() {
  const { w, h } = currentSize();
  previewW = w; previewH = h;
  const info = renderCover(canvas, state, w, h);
  lastRects = info.rects;
  canvas.dataset.ratio = state.previewSize;
  syncControls();
}

function syncControls() {
  $('undoBtn').disabled = !history.canUndo;
  $('redoBtn').disabled = !history.canRedo;
  // Never clobber a text field the user is typing in (keeps the caret put).
  const setText = (id, value) => { if (document.activeElement !== $(id)) $(id).value = value; };
  setText('titleInput', state.title);
  setText('subtitleInput', state.subtitle);
  setText('nameInput', state.nameTag);
  setText('roleInput', state.roleTag);
  setText('reviewInput', state.review);
  $('heatRange').value = String(state.heat);
  $('heatVal').textContent = state.heat + ' / 5';
  $('grainCheck').checked = state.grain;
  $('halftoneCheck').checked = state.halftone;
  $('bandedCheck').checked = state.banded;
  $('previewSizeSelect').value = state.previewSize;
  const photo = state.photos[state.selectedPhoto];
  $('zoomRange').value = String(Math.round(((photo ? photo.crop.zoom : 1)) * 100));
  $('zoomVal').textContent = Math.round((photo ? photo.crop.zoom : 1) * 100) + '%';
  document.querySelectorAll('#layoutChips button').forEach((b) => b.classList.toggle('active', b.dataset.id === state.layout));
  document.querySelectorAll('#gradeChips button').forEach((b) => b.classList.toggle('active', b.dataset.id === state.grade));
  document.querySelectorAll('.slot').forEach((el, i) => el.classList.toggle('selected', i === state.selectedPhoto));
  const sel = $('panelPhotoSelect');
  sel.value = String(state.panelPhoto[state.selectedPanel] ?? 0);
}

function buildChips() {
  const lc = $('layoutChips');
  LAYOUTS.forEach((l) => {
    const b = document.createElement('button');
    b.type = 'button'; b.dataset.id = l.id; b.textContent = l.name;
    b.addEventListener('click', () => { state.layout = l.id; history.commit(); redraw(); });
    lc.appendChild(b);
  });
  const gc = $('gradeChips');
  GRADES.forEach((g) => {
    const b = document.createElement('button');
    b.type = 'button'; b.dataset.id = g.id; b.textContent = g.name;
    b.addEventListener('click', () => { state.grade = g.id; history.commit(); redraw(); });
    gc.appendChild(b);
  });
}

function buildSlots() {
  const wrap = $('photoSlots');
  for (let i = 0; i < 4; i++) {
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'slot'; b.dataset.slot = String(i);
    b.innerHTML = '<span>Slot ' + (i + 1) + '</span>';
    b.addEventListener('click', () => { state.selectedPhoto = i; redraw(); });
    wrap.appendChild(b);
  }
  const sel = $('panelPhotoSelect');
  for (let i = 0; i < 4; i++) {
    const o = document.createElement('option');
    o.value = String(i); o.textContent = 'Photo slot ' + (i + 1);
    sel.appendChild(o);
  }
}

function refreshSlotThumbs() {
  document.querySelectorAll('.slot').forEach((el, i) => {
    const p = state.photos[i];
    const old = el.querySelector('img');
    if (old) old.remove();
    if (p) {
      const img = document.createElement('img');
      img.alt = p.name;
      img.src = p.img.src;
      el.insertBefore(img, el.firstChild);
    }
  });
}

function downloadBlob(blob, name) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 5000);
}

async function exportOne() {
  const blob = await exportCoverPNG(state, state.previewSize);
  const size = SIZES.find((s) => s.id === state.previewSize) || SIZES[0];
  downloadBlob(blob, 'duskline-cover-' + size.w + 'x' + size.h + '.png');
  setStatus('Saved duskline-cover-' + size.w + 'x' + size.h + '.png');
}

async function exportAll() {
  const names = [];
  for (const s of SIZES) {
    const blob = await exportCoverPNG(state, s.id);
    downloadBlob(blob, 'duskline-cover-' + s.w + 'x' + s.h + '.png');
    names.push(s.w + 'x' + s.h);
  }
  setStatus('Exported ' + names.join(', ') + ' — check your downloads.');
  return names;
}

function bindText(id, key) {
  $(id).addEventListener('input', (e) => { state[key] = e.target.value; redraw(); });
  $(id).addEventListener('change', () => history.commit());
}

function bindEvents() {
  buildChips();
  buildSlots();
  bindText('titleInput', 'title');
  bindText('subtitleInput', 'subtitle');
  bindText('nameInput', 'nameTag');
  bindText('roleInput', 'roleTag');
  bindText('reviewInput', 'review');
  $('heatRange').addEventListener('input', (e) => { state.heat = Number(e.target.value); redraw(); });
  $('heatRange').addEventListener('change', () => history.commit());
  $('grainCheck').addEventListener('change', (e) => { state.grain = e.target.checked; history.commit(); redraw(); });
  $('halftoneCheck').addEventListener('change', (e) => { state.halftone = e.target.checked; history.commit(); redraw(); });
  $('bandedCheck').addEventListener('change', (e) => { state.banded = e.target.checked; history.commit(); redraw(); });
  $('previewSizeSelect').addEventListener('change', (e) => { state.previewSize = e.target.value; redraw(); });
  $('panelPhotoSelect').addEventListener('change', (e) => {
    state.panelPhoto[state.selectedPanel] = Number(e.target.value);
    history.commit(); redraw();
  });
  $('zoomRange').addEventListener('input', (e) => {
    setZoom(state.photos[state.selectedPhoto], Number(e.target.value) / 100);
    redraw();
  });
  $('zoomRange').addEventListener('change', () => history.commit());
  $('portraitBtn').addEventListener('click', () => {
    portraitFraming(state.photos[state.selectedPhoto]);
    history.commit(); redraw(); setStatus('Portrait framing applied to the selected photo.');
  });
  $('fillAllBtn').addEventListener('click', () => {
    fillAllPanels(state, state.selectedPhoto);
    history.commit(); redraw(); setStatus('All panels now use photo slot ' + (state.selectedPhoto + 1) + '.');
  });
  $('samplePierBtn').addEventListener('click', async () => {
    await loadSample(state, state.selectedPhoto, 'pier');
    history.commit(); refreshSlotThumbs(); redraw(); setStatus('Pier sample loaded into slot ' + (state.selectedPhoto + 1) + '.');
  });
  $('sampleBlvdBtn').addEventListener('click', async () => {
    await loadSample(state, state.selectedPhoto, 'boulevard');
    history.commit(); refreshSlotThumbs(); redraw(); setStatus('Boulevard sample loaded into slot ' + (state.selectedPhoto + 1) + '.');
  });
  $('photoInput').addEventListener('change', async (e) => {
    const files = Array.from(e.target.files || []).slice(0, 4);
    for (const f of files) {
      const slot = state.photos.findIndex((p) => !p);
      const target = slot === -1 ? state.selectedPhoto : slot;
      await loadFilePhoto(state, target, f);
      state.selectedPhoto = target;
    }
    history.commit(); refreshSlotThumbs(); redraw();
    setStatus(files.length + ' photo(s) loaded — stored only on this machine.');
  });
  $('undoBtn').addEventListener('click', () => { if (history.undo()) { refreshSlotThumbs(); redraw(); setStatus('Undid.'); } });
  $('redoBtn').addEventListener('click', () => { if (history.redo()) { refreshSlotThumbs(); redraw(); setStatus('Redid.'); } });
  $('exportOneBtn').addEventListener('click', exportOne);
  $('exportAllBtn').addEventListener('click', exportAll);
  $('shuffleBtn').addEventListener('click', () => { randomise(state); history.commit(); redraw(); setStatus('New layout + grade. Hit export when it looks right.'); });

  // Preview interaction: click selects a panel, drag reframes its photo, wheel zooms.
  let dragging = false, lastX = 0, lastY = 0;
  function canvasPoint(e) {
    const r = canvas.getBoundingClientRect();
    return { x: (e.clientX - r.left) / r.width * previewW, y: (e.clientY - r.top) / r.height * previewH };
  }
  canvas.addEventListener('pointerdown', (e) => {
    const p = canvasPoint(e);
    const idx = pickPanel(lastRects, p.x, p.y);
    if (idx >= 0) {
      state.selectedPanel = idx;
      const pi = state.panelPhoto[idx] ?? 0;
      state.selectedPhoto = pi;
      syncControls();
    }
    dragging = true; lastX = p.x; lastY = p.y;
    canvas.setPointerCapture(e.pointerId);
  });
  canvas.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    const p = canvasPoint(e);
    const photo = state.photos[state.panelPhoto[state.selectedPanel] ?? 0];
    nudgeCrop(photo, (p.x - lastX) / previewW, (p.y - lastY) / previewH);
    lastX = p.x; lastY = p.y;
    redraw();
  });
  canvas.addEventListener('pointerup', () => { if (dragging) { dragging = false; history.commit(); } });
  canvas.addEventListener('dblclick', (e) => {
    const p = canvasPoint(e);
    const idx = pickPanel(lastRects, p.x, p.y);
    if (idx >= 0) {
      const cur = state.panelPhoto[idx] ?? 0;
      state.panelPhoto[idx] = (cur + 1) % 4;
      history.commit(); redraw();
    }
  });
  canvas.addEventListener('wheel', (e) => {
    e.preventDefault();
    const photo = state.photos[state.panelPhoto[state.selectedPanel] ?? 0];
    if (!photo) return;
    setZoom(photo, photo.crop.zoom * (e.deltaY < 0 ? 1.08 : 0.93));
    redraw();
  }, { passive: false });
}

window.Duskline = {
  state, redraw, exportPNG: exportCoverPNG, exportAll,
  undo: () => { const ok = history.undo(); redraw(); return ok; },
  redo: () => { const ok = history.redo(); redraw(); return ok; },
  history,
};

async function init() {
  bindEvents();
  const query = new URLSearchParams(location.search);
  const shot = query.get('shot');
  try {
    if (shot) {
      await runShot(state, shot, query);
    } else {
      await loadSample(state, 0, 'pier');
      await loadSample(state, 1, 'boulevard');
    }
    await document.fonts.load('400 80px Anton');
    await document.fonts.load('400 40px Pacifico');
    await document.fonts.ready;
  } catch (err) {
    setStatus('A sample photo failed to load — upload your own to continue.');
  }
  refreshSlotThumbs();
  redraw();
  setStatus('Ready — pick a layout, a grade, and export all 3 sizes.');
  requestAnimationFrame(() => requestAnimationFrame(() => { window.__shotReady = true; }));
}

init();
