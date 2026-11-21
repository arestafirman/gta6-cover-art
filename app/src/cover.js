// Duskline Cover Studio — cover renderer (canvas 2D, offline, no network).
// Draws a multi-panel GTA-style poster from photos + caption state.

export const LAYOUTS = [
  { id: 'grid9', name: 'Nine Panel' },
  { id: 'hero3', name: 'Hero + Three' },
  { id: 'grid4', name: 'Four Panel' },
  { id: 'fullbleed', name: 'Full Bleed' },
  { id: 'tilted', name: 'Tilted Snapshots' },
  { id: 'slanted', name: 'Slanted Cut' },
];

export const GRADES = [
  { id: 'sunset', name: 'Sunset', top: '#ffb347', mid: '#ff5e62', bot: '#7a1042', wash: '#ff7a18' },
  { id: 'neon', name: 'Neon Vice', top: '#00e5ff', mid: '#ff2e88', bot: '#5b2ee5', wash: '#ff2e88' },
  { id: 'heatwave', name: 'Heatwave', top: '#ffe259', mid: '#ff7518', bot: '#b3122f', wash: '#ff7518' },
  { id: 'dusk', name: 'Palm Dusk', top: '#f7b733', mid: '#c94b7c', bot: '#2b1055', wash: '#c94b7c' },
  { id: 'noir', name: 'Noir', top: '#d7d7d7', mid: '#5a5a6e', bot: '#0c0c14', wash: '#3a3a55' },
  { id: 'candy', name: 'Candy', top: '#ff9de2', mid: '#7c4dff', bot: '#00c2ff', wash: '#ff9de2' },
];

export const SIZES = [
  { id: 'square', name: 'Square', w: 1080, h: 1080 },
  { id: 'portrait', name: 'Portrait', w: 1080, h: 1350 },
  { id: 'wide', name: 'Wide', w: 1920, h: 1080 },
];

export function gradeById(id) { return GRADES.find((g) => g.id === id) || GRADES[0]; }
export function layoutById(id) { return LAYOUTS.find((l) => l.id === id) || LAYOUTS[0]; }

function panelRects(layoutId, w, h) {
  const g = Math.round(w * 0.012);
  const titleH = Math.round(h * 0.16);
  const footH = Math.round(h * 0.13);
  const top = titleH, bottom = h - footH;
  const availH = bottom - top;
  switch (layoutId) {
    case 'hero3': {
      const heroW = Math.round(w * 0.6);
      const r = [{ x: 0, y: top, w: heroW, h: availH, hero: true }];
      const cw = w - heroW - g;
      for (let i = 0; i < 3; i++) {
        const ph = Math.round((availH - 2 * g) / 3);
        r.push({ x: heroW + g, y: top + i * (ph + g), w: cw, h: ph });
      }
      return r;
    }
    case 'grid4': {
      const pw = Math.round((w - g) / 2), ph = Math.round((availH - g) / 2);
      return [
        { x: 0, y: top, w: pw, h: ph, hero: true },
        { x: pw + g, y: top, w: pw, h: ph },
        { x: 0, y: top + ph + g, w: pw, h: ph },
        { x: pw + g, y: top + ph + g, w: pw, h: ph },
      ];
    }
    case 'fullbleed': {
      const iw = Math.round(w * 0.3), ih = Math.round(availH * 0.34);
      return [
        { x: 0, y: 0, w, h, hero: true, full: true },
        { x: w - iw - g * 2, y: bottom - ih - g, w: iw, h: ih, inset: true, rot: -4 },
        { x: g * 2, y: bottom - ih - g, w: iw, h: ih, inset: true, rot: 3 },
      ];
    }
    case 'tilted': {
      const pw = Math.round(w * 0.42), ph = Math.round(availH * 0.62);
      return [
        { x: Math.round(w * 0.05), y: top + Math.round(availH * 0.06), w: pw, h: ph, rot: -6, hero: true },
        { x: Math.round(w * 0.52), y: top, w: pw, h: ph, rot: 5 },
        { x: Math.round(w * 0.28), y: top + Math.round(availH * 0.34), w: pw, h: Math.round(availH * 0.5), rot: -2 },
      ];
    }
    case 'slanted': {
      const pw = Math.round(w / 4);
      const r = [];
      for (let i = 0; i < 4; i++) r.push({ x: i * pw, y: top, w: pw + Math.round(w * 0.05), h: availH, slant: true, hero: i === 1 });
      return r;
    }
    case 'grid9':
    default: {
      const pw = Math.round((w - 2 * g) / 3), ph = Math.round((availH - 2 * g) / 3);
      const r = [];
      for (let row = 0; row < 3; row++) {
        for (let col = 0; col < 3; col++) {
          r.push({ x: col * (pw + g), y: top + row * (ph + g), w: pw, h: ph, hero: row === 1 && col === 1 });
        }
      }
      return r;
    }
  }
}

function drawPhotoCover(ctx, img, rect, crop, grade) {
  const iw = img.naturalWidth || img.width, ih = img.naturalHeight || img.height;
  if (!iw || !ih) return;
  const zoom = (crop && crop.zoom) || 1;
  let fx = (crop && crop.ox != null ? crop.ox : 0.5);
  let fy = (crop && crop.oy != null ? crop.oy : 0.35);
  const scale = Math.max(rect.w / iw, rect.h / ih) * zoom;
  const dw = iw * scale, dh = ih * scale;
  // Clamp the focal point to the range where the photo still covers the
  // whole panel (a tall panel over a wide photo must centre vertically).
  fx = Math.min(Math.max(fx, rect.w / (2 * dw)), 1 - rect.w / (2 * dw));
  fy = Math.min(Math.max(fy, rect.h / (2 * dh)), 1 - rect.h / (2 * dh));
  const dx = rect.x + rect.w / 2 - dw * fx;
  const dy = rect.y + rect.h / 2 - dh * fy;
  ctx.save();
  ctx.beginPath();
  ctx.rect(rect.x, rect.y, rect.w, rect.h);
  ctx.clip();
  ctx.drawImage(img, dx, dy, dw, dh);
  // Gradient-map grade: warm/cool wash + duotone lift.
  const grad = ctx.createLinearGradient(rect.x, rect.y, rect.x + rect.w * 0.25, rect.y + rect.h);
  grad.addColorStop(0, grade.top);
  grad.addColorStop(0.55, grade.mid);
  grad.addColorStop(1, grade.bot);
  ctx.globalCompositeOperation = 'overlay';
  ctx.globalAlpha = 0.5;
  ctx.fillStyle = grad;
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
  ctx.globalCompositeOperation = 'soft-light';
  ctx.globalAlpha = 0.55;
  ctx.fillStyle = grade.wash;
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
  ctx.globalCompositeOperation = 'source-over';
  ctx.globalAlpha = 1;
  // Sunset glow at the top edge of each panel.
  const glow = ctx.createLinearGradient(rect.x, rect.y, rect.x, rect.y + rect.h * 0.35);
  glow.addColorStop(0, grade.top + '55');
  glow.addColorStop(1, grade.top + '00');
  ctx.fillStyle = glow;
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h * 0.35);
  ctx.restore();
}

function fitFont(ctx, text, maxW, startPx, family, weight) {
  let px = startPx;
  ctx.font = weight + ' ' + px + 'px ' + family;
  while (px > 12 && ctx.measureText(text).width > maxW) {
    px -= 2;
    ctx.font = weight + ' ' + px + 'px ' + family;
  }
  return px;
}

function drawStars(ctx, cx, y, size, filled, total) {
  for (let i = 0; i < total; i++) {
    const x = cx + (i - (total - 1) / 2) * size * 1.5;
    ctx.save();
    ctx.translate(x, y);
    ctx.beginPath();
    for (let k = 0; k < 10; k++) {
      const r = k % 2 === 0 ? size : size * 0.45;
      const a = -Math.PI / 2 + k * Math.PI / 5;
      const px = Math.cos(a) * r, py = Math.sin(a) * r;
      if (k === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fillStyle = i < filled ? '#ffd76a' : 'rgba(255,255,255,0.25)';
    ctx.fill();
    ctx.lineWidth = Math.max(1, size * 0.08);
    ctx.strokeStyle = '#1a0b2e';
    ctx.stroke();
    ctx.restore();
  }
}

let noiseTile = null;
function grainTile() {
  if (noiseTile) return noiseTile;
  const c = document.createElement('canvas');
  c.width = 128; c.height = 128;
  const x = c.getContext('2d');
  const d = x.createImageData(128, 128);
  for (let i = 0; i < d.data.length; i += 4) {
    const v = 110 + Math.floor(Math.random() * 90);
    d.data[i] = v; d.data[i + 1] = v; d.data[i + 2] = v; d.data[i + 3] = 255;
  }
  x.putImageData(d, 0, 0);
  noiseTile = c;
  return c;
}

export function renderCover(canvas, state, w, h) {
  canvas.width = w; canvas.height = h;
  const ctx = canvas.getContext('2d');
  const grade = gradeById(state.grade);
  const rects = panelRects(state.layout, w, h);
  const titleH = Math.round(h * 0.16);
  const footH = Math.round(h * 0.13);
  const gap = Math.round(w * 0.012);

  // Backdrop: deep dusk gradient + diagonal sun bands.
  const bg = ctx.createLinearGradient(0, 0, w, h);
  bg.addColorStop(0, '#2b0a3d');
  bg.addColorStop(0.5, '#7a1042');
  bg.addColorStop(1, '#1a0b2e');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);
  ctx.save();
  ctx.globalAlpha = 0.16;
  ctx.fillStyle = grade.wash;
  for (let i = 0; i < 5; i++) {
    ctx.save();
    ctx.translate(w * 0.5, h * 0.5);
    ctx.rotate(-0.5);
    ctx.fillRect(-w, -h * 0.32 + i * Math.round(h * 0.14), w * 2, Math.round(h * 0.05));
    ctx.restore();
  }
  ctx.restore();

  // Panels (hero drawn last so it pops over its neighbours — except in
  // full-bleed, where the hero is the backdrop and goes down first).
  const heroFirst = state.layout === 'fullbleed';
  const order = rects.map((r, i) => ({ r, i })).sort((a, b) => {
    const ka = a.r.hero ? (heroFirst ? 0 : 1) : 1;
    const kb = b.r.hero ? (heroFirst ? 0 : 1) : 1;
    return ka - kb;
  });
  const drawn = [];
  for (const { r, i } of order) {
    const photo = state.photos[state.panelPhoto[i] ?? 0];
    const pop = r.hero && state.layout !== 'fullbleed' ? Math.round(w * 0.012) : 0;
    const pr = { x: r.x - pop, y: r.y - pop, w: r.w + pop * 2, h: r.h + pop * 2 };
    ctx.save();
    if (r.rot) { ctx.translate(pr.x + pr.w / 2, pr.y + pr.h / 2); ctx.rotate(r.rot * Math.PI / 180); ctx.translate(-pr.w / 2, -pr.h / 2); pr.x = 0; pr.y = 0; }
    if (r.slant) {
      ctx.beginPath();
      const s = Math.round(w * 0.04);
      ctx.moveTo(pr.x + s, pr.y); ctx.lineTo(pr.x + pr.w, pr.y);
      ctx.lineTo(pr.x + pr.w - s, pr.y + pr.h); ctx.lineTo(pr.x, pr.y + pr.h);
      ctx.closePath(); ctx.clip();
    }
    if (photo && photo.img) {
      drawPhotoCover(ctx, photo.img, pr, photo.crop, grade);
    } else {
      const pg = ctx.createLinearGradient(pr.x, pr.y, pr.x + pr.w, pr.y + pr.h);
      pg.addColorStop(0, grade.mid); pg.addColorStop(1, grade.bot);
      ctx.fillStyle = pg; ctx.fillRect(pr.x, pr.y, pr.w, pr.h);
      ctx.fillStyle = 'rgba(255,255,255,0.75)';
      ctx.font = '700 ' + Math.round(w * 0.02) + 'px system-ui, sans-serif';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('ADD PHOTO', pr.x + pr.w / 2, pr.y + pr.h / 2);
    }
    if (state.banded) {
      ctx.lineWidth = Math.max(2, Math.round(w * 0.004));
      ctx.strokeStyle = '#ffffff';
      ctx.strokeRect(pr.x + ctx.lineWidth / 2, pr.y + ctx.lineWidth / 2, pr.w - ctx.lineWidth, pr.h - ctx.lineWidth);
      ctx.lineWidth = Math.max(1, Math.round(w * 0.0015));
      ctx.strokeStyle = '#ffd76a';
      ctx.strokeRect(pr.x + Math.round(w * 0.006), pr.y + Math.round(w * 0.006), pr.w - Math.round(w * 0.012), pr.h - Math.round(w * 0.012));
    }
    ctx.restore();
    drawn.push({ r: pr, i, rot: r.rot || 0, orig: r, hero: !!r.hero });
  }

  // Name + role tags on the hero and first panels (hero first).
  const tagPanels = drawn.filter((d) => d.hero || d.i === 0 || d.i < 3)
    .sort((a, b) => (b.hero ? 1 : 0) - (a.hero ? 1 : 0)).slice(0, 3);
  const tagNames = [state.nameTag, 'VICE CITY', 'DUSKLINE'];
  const tagRoles = [state.roleTag, 'NEON DISTRICT', 'EST. 2026'];
  tagPanels.forEach((d, k) => {
    const fs = Math.round(w * 0.018);
    const tr = d.rot ? d.orig : d.r; // rotated panels: tag on the unrotated frame
    ctx.save();
    ctx.font = '700 ' + fs + 'px Anton, sans-serif';
    const label = (tagNames[k] || 'DUSKLINE').toUpperCase();
    const role = (tagRoles[k] || '').toUpperCase();
    const tw = ctx.measureText(label).width;
    ctx.font = '700 ' + Math.round(fs * 0.62) + 'px system-ui, sans-serif';
    const rw = ctx.measureText(role).width;
    const pillW = Math.max(tw, rw) + 12;
    let bx = tr.x + Math.round(w * 0.01);
    bx = Math.min(Math.max(bx, 4), w - pillW - 4);
    const by = tr.y + tr.h - Math.round(h * 0.055);
    ctx.fillStyle = 'rgba(10,4,20,0.85)';
    ctx.fillRect(bx - 6, by - fs - 4, pillW, fs + 8);
    ctx.font = '700 ' + fs + 'px Anton, sans-serif';
    ctx.fillStyle = '#ffd76a';
    ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    ctx.fillText(label, bx, by - 2);
    ctx.font = '700 ' + Math.round(fs * 0.62) + 'px system-ui, sans-serif';
    ctx.fillStyle = '#7df9ff';
    ctx.fillText(role, bx, by + fs * 0.72);
    ctx.restore();
  });

  // Title block: halftone dots + striped chrome title + neon subtitle.
  if (state.halftone) {
    ctx.save();
    ctx.fillStyle = 'rgba(255,255,255,0.10)';
    const step = Math.max(8, Math.round(w * 0.012));
    for (let y = step / 2; y < titleH; y += step) {
      for (let x = step / 2; x < w; x += step) {
        const rr = (x / step + y / step) % 2 === 0 ? step * 0.22 : step * 0.12;
        ctx.beginPath(); ctx.arc(x, y, rr, 0, Math.PI * 2); ctx.fill();
      }
    }
    ctx.restore();
  }
  const title = (state.title || 'SUNSET HEIST').toUpperCase();
  const chrome = ctx.createLinearGradient(0, 6, 0, titleH);
  chrome.addColorStop(0, '#ffffff');
  chrome.addColorStop(0.35, '#ffd76a');
  chrome.addColorStop(0.55, '#ff7a18');
  chrome.addColorStop(0.75, '#ff2e88');
  chrome.addColorStop(1, '#ffffff');
  ctx.save();
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.shadowColor = '#ff2e88'; ctx.shadowBlur = Math.round(w * 0.012); ctx.shadowOffsetY = Math.round(h * 0.004);
  const tpx = fitFont(ctx, title, w * 0.94, Math.round(h * 0.085), 'Anton, sans-serif', '400');
  ctx.font = '400 ' + tpx + 'px Anton, sans-serif';
  ctx.lineWidth = Math.max(2, Math.round(w * 0.003));
  ctx.strokeStyle = '#1a0b2e';
  ctx.strokeText(title, w / 2, titleH * 0.46);
  ctx.fillStyle = chrome;
  ctx.fillText(title, w / 2, titleH * 0.46);
  ctx.shadowColor = '#00e5ff'; ctx.shadowBlur = Math.round(w * 0.014);
  const spx = fitFont(ctx, state.subtitle || '', w * 0.7, Math.round(h * 0.032), 'Pacifico, cursive', '400');
  ctx.font = '400 ' + spx + 'px Pacifico, cursive';
  ctx.fillStyle = '#7df9ff';
  ctx.fillText(state.subtitle || '', w / 2, titleH * 0.86);
  ctx.restore();

  // Heat meter: label + stars, top-right over the title band edge.
  ctx.save();
  ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
  ctx.font = '700 ' + Math.round(w * 0.016) + 'px Anton, sans-serif';
  ctx.fillStyle = '#ffffff';
  ctx.fillText('HEAT', w - Math.round(w * 0.02) - Math.round(w * 0.085), titleH + Math.round(h * 0.018));
  drawStars(ctx, w - Math.round(w * 0.055), titleH + Math.round(h * 0.018), Math.round(w * 0.011), state.heat || 4, 5);
  ctx.restore();

  // Review strip.
  const fy = h - footH;
  ctx.save();
  ctx.fillStyle = 'rgba(10,4,20,0.88)';
  ctx.fillRect(0, fy, w, footH);
  ctx.fillStyle = '#ffd76a';
  ctx.fillRect(0, fy, w, Math.max(2, Math.round(h * 0.003)));
  drawStars(ctx, Math.round(w * 0.06), fy + footH * 0.3, Math.round(w * 0.011), 5, 5);
  ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
  ctx.font = 'italic 700 ' + Math.round(w * 0.019) + 'px Georgia, serif';
  ctx.fillStyle = '#ffffff';
  const review = '“' + (state.review || 'The most wanted poster of the year.') + '”';
  fitFont(ctx, review, w * 0.62, Math.round(w * 0.019), 'Georgia, serif', 'italic 700');
  ctx.fillText(review, Math.round(w * 0.115), fy + footH * 0.3);
  ctx.font = '700 ' + Math.round(w * 0.013) + 'px system-ui, sans-serif';
  ctx.fillStyle = '#7df9ff';
  ctx.fillText('— VICE CITY WEEKLY', Math.round(w * 0.115), fy + footH * 0.62);
  ctx.restore();

  // Seal / badge ribbon, bottom-right overlapping the review strip.
  const sr = Math.round(w * 0.042);
  const scx = w - sr - Math.round(w * 0.02), scy = fy + footH * 0.42;
  ctx.save();
  ctx.translate(scx, scy);
  ctx.rotate(-0.12);
  ctx.beginPath(); ctx.arc(0, 0, sr, 0, Math.PI * 2);
  ctx.fillStyle = '#ffd76a'; ctx.fill();
  ctx.lineWidth = Math.max(2, Math.round(sr * 0.1));
  ctx.strokeStyle = '#7a1042'; ctx.stroke();
  ctx.beginPath(); ctx.arc(0, 0, sr * 0.78, 0, Math.PI * 2);
  ctx.strokeStyle = '#7a1042'; ctx.lineWidth = Math.max(1, Math.round(sr * 0.05)); ctx.stroke();
  ctx.fillStyle = '#7a1042';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.font = '400 ' + Math.round(sr * 0.52) + 'px Anton, sans-serif';
  ctx.fillText('★', 0, -sr * 0.22);
  ctx.font = '700 ' + Math.round(sr * 0.2) + 'px system-ui, sans-serif';
  ctx.fillText('DUSKLINE', 0, sr * 0.22);
  ctx.font = '700 ' + Math.round(sr * 0.16) + 'px system-ui, sans-serif';
  ctx.fillText('APPROVED', 0, sr * 0.5);
  ctx.restore();

  // Billing block.
  ctx.save();
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.font = '700 ' + Math.round(w * 0.011) + 'px system-ui, sans-serif';
  ctx.fillStyle = 'rgba(255,255,255,0.75)';
  ctx.fillText('DUSKLINE PICTURES  •  A COVER BY YOU  •  SHOT ON YOUR MACHINE, NEVER UPLOADED  •  DUSKLINE 2026', w / 2, fy + footH * 0.92);
  ctx.restore();

  // Grain + vignette.
  if (state.grain) {
    ctx.save();
    ctx.globalAlpha = 0.07;
    ctx.globalCompositeOperation = 'overlay';
    const pat = ctx.createPattern(grainTile(), 'repeat');
    ctx.fillStyle = pat;
    ctx.fillRect(0, 0, w, h);
    ctx.restore();
  }
  const vig = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.42, w / 2, h / 2, Math.max(w, h) * 0.75);
  vig.addColorStop(0, 'rgba(0,0,0,0)');
  vig.addColorStop(1, 'rgba(10,2,20,0.42)');
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, w, h);
  return { rects, titleH, footH, gap };
}

export function exportCoverPNG(state, sizeId) {
  const size = SIZES.find((s) => s.id === sizeId) || SIZES[0];
  const c = document.createElement('canvas');
  renderCover(c, state, size.w, size.h);
  return new Promise((resolve) => c.toBlob(resolve, 'image/png'));
}

export function renderToCanvas(state, w, h) {
  const c = document.createElement('canvas');
  renderCover(c, state, w, h);
  return c;
}
