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
