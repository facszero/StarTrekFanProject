'use strict';

const Sprites = (() => {
  const sheets = { enterprise: null, enemy: null, borg: null };
  let _ready = 0;

  // ── enterprise_sheet.png  (1536×1024) ────────────────────────────
  const ENT = {
    player: [419, 433, 382, 316],
    bank: [
      [ 47, 228, 190, 137],
      [315, 230, 198, 139],
      [607, 214, 268, 189],
      [840,  23, 262, 200],
      [1138, 28, 332, 175],
    ],
    phaser_glow: [ 32, 746, 295, 253],
    exp_strip:   [383, 773, 1153, 218],
  };

  // ── enemy_sheet.png  (1264×843) ──────────────────────────────────
  const ENM = {
    brel:       [563, 319, 161,  92],
    borg_cube:  [523,  18, 124, 122],   // legacy (will be replaced by BORG atlas)
    borg_sphere:[700,  35,  80,  82],
    valdore:    [162, 157, 301, 131],
    dderidex:   [525, 154, 221, 122],
    neghvar:    [279, 300, 262,  95],
    vorcha:     [ 22, 302, 237, 102],
    galor:      [773, 299, 240,  94],
    jem_hadar:  [ 31, 451, 147,  72],
    jem_battle: [213, 433, 265, 107],
    hirogen:    [509, 574, 183, 114],
    sp8472:     [931, 556, 327, 150],
    breen:      [ 28, 577, 228, 100],
    exp_sm:     [675, 746,  75,  67],
    exp_md:     [772, 737, 115,  89],
    exp_lg:     [898, 721, 181, 112],
  };

  // ── borg_sheet.png  (1264×843) ───────────────────────────────────
  const BORG = {
    // ── Borg Cube ──────────────────────────────────────────────────
    cube_frente  : [ 38,  46, 101, 100],  // Head-on (main game enemy)
    cube_arriba  : [191,  46, 100, 100],  // Top view
    cube_bottom  : [343,  46, 102, 100],  // Bottom view
    cube_45a     : [ 37, 175, 103, 104],  // 45° angle A — slight tilt
    cube_45b     : [189, 174, 103, 105],  // 45° angle B
    cube_45c     : [342, 175, 104, 104],  // 45° angle C
    cube_45d     : [494, 174, 103, 105],  // 45° angle D (95°)
    cube_65      : [ 37, 301, 103, 102],  // 65° angle
    cube_85a     : [189, 301, 103, 102],  // 85° angle A
    cube_85b     : [342, 301, 104, 102],  // 85° angle B
    // ── Borg Sphere ────────────────────────────────────────────────
    sphere_frente: [682,  46, 102, 101],  // Head-on (main game enemy)
    sphere_arriba: [830,  46, 101, 101],  // Top view
    sphere_bottom: [978,  46, 101, 101],  // Bottom view
    sphere_45    : [1125,  46, 100, 101], // 45°
    sphere_45b   : [682, 180, 101, 101],  // 45° B
    sphere_135a  : [830, 180, 101, 101],  // 135° A
    sphere_135b  : [978, 180, 101, 101],  // 135° B
    sphere_135c  : [1125,179, 101, 102],  // 135° C
    // ── Borg Scout ─────────────────────────────────────────────────
    scout_frente : [ 29, 494, 119,  53],  // Head-on (fast enemy)
    scout_arriba : [180, 466, 117, 101],  // Top view
    scout_45     : [333, 466, 117, 101],  // 45°
    scout_45b    : [480, 474, 125,  92],  // 45° B
    scout_view   : [ 30, 596, 117, 109],  // 3/4 view
    scout_bottom : [181, 596, 116, 111],  // Bottom
    scout_25a    : [328, 630, 128,  45],  // 25° A
    scout_25b    : [486, 630, 128,  45],  // 25° B
    scout_fl_high: [ 19, 738, 130,  76],  // Front-left-high
    scout_fr_low : [172, 738, 129,  76],  // Front-right-low
    scout_fl_low : [334, 738, 130,  76],  // Front-left-low
    scout_fr_low2: [487, 738, 130,  75],  // Front-right-low 2
    // ── Borg Assimilation Ship ─────────────────────────────────────
    assimil_frente : [666, 487, 118,  53],  // Head-on
    assimil_arriba : [966, 469, 109, 214],  // Top (tall, imposing)
    assimil_tall   : [823, 469, 103, 214],  // Frente tall
    assimil_45     : [1101,474, 146,  83],  // 45°
    assimil_bottom : [1102,595, 140,  84],  // Bottom
    assimil_frente2: [675, 564,  99, 121],  // Frente 2
    assimil_arriba2: [821, 746, 144,  63],  // Arriba 2
    assimil_beam   : [993, 744, 214,  69],  // FIRING — with green beam effect
  };

  return {
    ENT, ENM, BORG, sheets,
    get ready() { return _ready >= 2; },  // enterprise + enemy minimum
    get borgReady() { return !!sheets.borg && sheets.borg.complete && sheets.borg.naturalWidth > 0; },

    load(base) {
      const mk = (key, file) => {
        const img = new Image();
        img.onload  = () => { _ready++; };
        img.onerror = () => console.warn('Sprite load failed:', file);
        img.src     = base + file;
        sheets[key] = img;
      };
      mk('enterprise', 'enterprise_sheet.png');
      mk('enemy',      'enemy_sheet.png');
      mk('borg',       'borg_sheet.png');
      mk('logo',       'logo.png');
      mk('hud_frame',  'hud_frame.png');
    },

    // ── Draw helpers ─────────────────────────────────────────────

    drawPlayer(ctx, cx, cy, scale, bankNorm) {
      const img = sheets.enterprise;
      if (!img || !img.complete || !img.naturalWidth) return false;
      const fi = Math.round(U.clamp(bankNorm, 0, 1) * 4);
      const [sx, sy, sw, sh] = ENT.bank[fi];
      const dw = sw * scale, dh = sh * scale;
      ctx.save(); ctx.translate(cx, cy);
      ctx.drawImage(img, sx, sy, sw, sh, -dw/2, -dh/2, dw, dh);
      ctx.restore(); return true;
    },

    drawEnemy(ctx, name, cx, cy, scale, rot) {
      const img = sheets.enemy;
      if (!img || !img.complete || !img.naturalWidth) return false;
      const r = ENM[name]; if (!r) return false;
      const dw = r[2] * scale, dh = r[3] * scale;
      ctx.save(); ctx.translate(cx, cy);
      if (rot) ctx.rotate(rot);
      ctx.drawImage(img, r[0], r[1], r[2], r[3], -dw/2, -dh/2, dw, dh);
      ctx.restore(); return true;
    },

    // Draw from borg_sheet atlas
    // name: key in BORG object
    // flipX: mirror horizontally (for left/right banking variants)
    drawBorg(ctx, name, cx, cy, scale, rot, flipX) {
      const img = sheets.borg;
      if (!img || !img.complete || !img.naturalWidth) return false;
      const r = BORG[name]; if (!r) return false;
      const dw = r[2] * scale, dh = r[3] * scale;
      ctx.save(); ctx.translate(cx, cy);
      if (rot)   ctx.rotate(rot);
      if (flipX) ctx.scale(-1, 1);
      ctx.drawImage(img, r[0], r[1], r[2], r[3], -dw/2, -dh/2, dw, dh);
      ctx.restore(); return true;
    },

    drawExpFrame(ctx, frame, cx, cy, scale) {
      const img = sheets.enterprise;
      if (!img || !img.complete || !img.naturalWidth) return false;
      const [sx, sy, sw, sh] = ENT.exp_strip;
      const fw = Math.floor(sw / 5);
      const dw = fw * scale, dh = sh * scale;
      ctx.save(); ctx.translate(cx, cy);
      ctx.drawImage(img, sx + frame*fw, sy, fw, sh, -dw/2, -dh/2, dw, dh);
      ctx.restore(); return true;
    },
  };
})();

// ── Patch: inject ROM/KLI atlases and load helpers after initial module ──
// These are appended here so the main IIFE stays clean.
// Access via Sprites.ROM, Sprites.KLI, Sprites.drawRomulan(), Sprites.drawKlingon()

Sprites.ROM = {
  // ── Valdore-class Warbird ─────────────────────────────────────────
  valdore_frente   : [ 550,  51, 191,  66],  // Head-on approach (main enemy)
  valdore_rear     : [ 779,  50, 203,  60],  // Rear view
  valdore_arriba_a : [ 552, 151, 186, 121],  // Top view A
  valdore_arriba_b : [ 787, 152, 187, 121],  // Top view B
  valdore_angle    : [1026, 174, 226, 110],  // Ángulo
  // ── D'deridex Warbird ────────────────────────────────────────────
  dderidex_frente  : [ 538, 323, 213,  70],  // Head-on (wide wingspan)
  dderidex_rear    : [ 777, 320, 210,  63],
  dderidex_angle   : [1018, 325, 213,  80],
  dderidex_arriba_a: [ 539, 432, 211, 101],
  dderidex_arriba_b: [ 777, 434, 210, 100],
  dderidex_angle_b : [1020, 441, 200, 110],
  // ── Scimitar-class Thalaron ──────────────────────────────────────
  scimitar_frente  : [ 557, 602, 167,  45],  // Head-on (wide + flat)
  scimitar_rear    : [ 770, 603, 168,  45],
  scimitar_arriba_a: [ 554, 690, 174, 116],
  scimitar_arriba_b: [ 769, 690, 174, 116],
  scimitar_angle   : [1015, 586, 181, 103],
  scimitar_angle_b : [  39, 716, 225, 104],
  scimitar_angle_c : [ 295, 710, 155, 109],
  scimitar_angle_d : [1011, 716, 195, 106],
  scimitar_side    : [  20, 580, 237, 103],
  scimitar_small   : [ 325, 617, 113,  68],
};

Sprites.KLI = {
  // ── Vor'cha-class Attack Cruiser ─────────────────────────────────
  vorcha_frente    : [ 494, 195, 168,  81],  // Head-on
  vorcha_arriba    : [ 296, 194, 176,  86],  // Top view
  vorcha_angle     : [  18, 190, 253, 111],  // Ángulo
  vorcha_large     : [  50, 315, 251, 183],  // Large angle (close pass)
  vorcha_large_b   : [ 344, 331, 267, 183],
  // ── Negh'Var-class Warship ───────────────────────────────────────
  neghvar_frente   : [ 940, 197, 134,  80],  // Head-on
  neghvar_angle    : [ 678, 201, 253, 101],  // Ángulo
  neghvar_arriba   : [ 710, 331, 254, 148],  // Top view
  neghvar_large    : [1013, 324, 233, 182],  // Large (boss approach)
  neghvar_large_b  : [ 763, 540, 228, 184],
  neghvar_small    : [1101, 198, 149,  79],
  // ── B'rel-class Bird-of-Prey ─────────────────────────────────────
  brel_frente      : [ 291, 588, 191,  87],  // Head-on (better than enemy_sheet)
  brel_frente_b    : [ 517, 589, 190,  88],
  brel_dive        : [1029, 582, 218,  66],  // Diving attack angle
  brel_angle       : [  34, 709, 231, 128],  // Ángulo
  brel_angle_b     : [ 341, 714, 214, 114],
  brel_large       : [  20, 569, 231, 132],  // Large angle
  brel_small       : [1104, 716, 127, 117],
  // ── Weapons & FX ─────────────────────────────────────────────────
  exp_a            : [ 833, 738, 111,  85],  // Explosion A (orange)
  exp_b            : [ 962, 723, 117, 100],  // Explosion B (bright)
  torpedo_beam     : [ 624, 776, 155,  14],  // Torpedo/disruptor beam
};

// Draw helpers for the new sheets
Sprites.drawRomulan = function(ctx, name, cx, cy, scale, rot, flipX) {
  const img = Sprites.sheets.romulan;
  if (!img || !img.complete || !img.naturalWidth) return false;
  const r = Sprites.ROM[name]; if (!r) return false;
  const dw = r[2]*scale, dh = r[3]*scale;
  ctx.save(); ctx.translate(cx, cy);
  if (rot)   ctx.rotate(rot);
  if (flipX) ctx.scale(-1, 1);
  ctx.drawImage(img, r[0], r[1], r[2], r[3], -dw/2, -dh/2, dw, dh);
  ctx.restore(); return true;
};

Sprites.drawKlingon = function(ctx, name, cx, cy, scale, rot, flipX) {
  const img = Sprites.sheets.klingon;
  if (!img || !img.complete || !img.naturalWidth) return false;
  const r = Sprites.KLI[name]; if (!r) return false;
  const dw = r[2]*scale, dh = r[3]*scale;
  ctx.save(); ctx.translate(cx, cy);
  if (rot)   ctx.rotate(rot);
  if (flipX) ctx.scale(-1, 1);
  ctx.drawImage(img, r[0], r[1], r[2], r[3], -dw/2, -dh/2, dw, dh);
  ctx.restore(); return true;
};

// Extend Sprites.load to include the new sheets
(function() {
  const _origLoad = Sprites.load.bind(Sprites);
  Sprites.load = function(base) {
    _origLoad(base);
    const mk = (key, file) => {
      const img = new Image();
      img.onload  = () => { };
      img.onerror = () => console.warn('Sprite load failed:', file);
      img.src     = base + file;
      Sprites.sheets[key] = img;
    };
    mk('romulan', 'romulan_sheet.png');
    mk('klingon', 'klingon_sheet.png');
  };
})();
