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

  // ── enterprise_angles.png  (963×538) — new detailed sprites ─────
  const ANG = {
    front_below : [ 38, 251, 435, 276],  // main player view (center banking)
    bank_left   : [ 66,  28, 332, 174],  // left bank (also used flipped for right)
    straight    : [434,  24, 262, 197],  // straight-on with engine fire
    top_view    : [661, 215, 266, 186],  // top-down
  };
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
      mk('enterprise_angles', 'enterprise_angles.png');
      mk('enemy',      'enemy_sheet.png');
      mk('borg',       'borg_sheet.png');
      mk('logo',       'logo.png');
      mk('hud_frame',  'hud_frame.png');
      // picard loaded separately by HUD module (not needed as sprite)
    },

    // ── Draw helpers ─────────────────────────────────────────────

    // Draw Enterprise-D player sprite with banking animation.
    // bankNorm: 0.0=hard-left, 0.5=center, 1.0=hard-right
    // Uses enterprise_angles.png when loaded, falls back to enterprise_sheet.png frames.
    drawPlayer(ctx, cx, cy, scale, bankNorm) {
      const angImg = sheets.enterprise_angles;
      const angReady = angImg && angImg.complete && angImg.naturalWidth;

      if (angReady) {
        // Smooth 3-sprite interpolation: bank_left ↔ front_below ↔ bank_right(flipped)
        const dev = Math.abs(bankNorm - 0.5) * 2;  // 0=center, 1=full bank
        const goLeft = bankNorm < 0.5;

        // At center: front_below. At full bank: bank_left (or flipped).
        let r;
        if (dev < 0.35) {
          r = ANG.front_below;
        } else {
          r = ANG.bank_left;
        }

        const dw = r[2] * scale, dh = r[3] * scale;
        ctx.save();
        ctx.translate(cx, cy);
        // Flip horizontally for right bank
        if (!goLeft && dev >= 0.35) ctx.scale(-1, 1);
        ctx.drawImage(angImg, r[0], r[1], r[2], r[3], -dw/2, -dh/2, dw, dh);
        ctx.restore();
        return true;
      }

      // Fallback: enterprise_sheet.png 5-frame bank strip
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

// ════════════════════════════════════════════════════════════════════
//  NEW FACTION SHEETS — Phase 2 batch
// ════════════════════════════════════════════════════════════════════

Sprites.CARD = {
  // cardassian_sheet.png (1264x843)
  galor_top      : [1063,  13,172,232],  // top-down
  galor_fl       : [  14,  53,264, 99],  // front-left 3/4
  galor_fr       : [ 295,  52,225,112],  // front-right 3/4
  galor_frente   : [ 555,  53,224,113],  // frontal (head-on approach ← main)
  galor_arriba   : [ 796,  44,229,158],  // top view
  galor_rl       : [   0, 252,249,132],  // rear-left
  galor_rl2      : [ 286, 251,238,157],  // rear-left alt
  galor_rr       : [ 552, 250,227,139],  // rear-right
  galor_sf       : [ 805, 293,212, 88],  // straight frontal (small)
  galor_sr       : [1047, 294,204, 87],  // straight rear
  keldon_frontal : [   9, 472,327, 73],  // Keldon frontal view (long)
  keldon_top     : [ 793, 460,228,182],  // Keldon top view
  keldon_bottom  : [1055, 450,192,225],  // Keldon bottom-up
  keldon_fv      : [ 581, 502,185,111],  // Keldon front-view
  keldon_fl      : [  13, 578,267,101],  // Keldon front-left
  keldon_fr      : [ 298, 578,249, 98],  // Keldon front-right
  keldon_rl      : [   9, 715,271,101],  // Keldon rear-left
  keldon_rr      : [ 295, 718,262, 93],  // Keldon rear-right
  keldon_sf      : [ 588, 728,188, 72],  // Keldon straight frontal
  keldon_top2    : [ 804, 726,210, 83],  // Keldon top 2
  keldon_bottom2 : [1054, 724,199, 86],  // Keldon bottom 2
};

Sprites.DOM = {
  // dominion_sheet.png (1264x843)
  jem_ref_a     : [ 469,  57,139, 57],  // Jem'Hadar ref small
  jem_ref_b     : [1124,  57,138, 56],
  jem_fl        : [  15,  80,162, 78],  // Attack Fighter front-left (main)
  jem_fr        : [ 268,  79,161, 79],  // front-right
  jemb_fl       : [ 652,  74,213, 86],  // Battle Cruiser front-left (main)
  jemb_fr       : [ 883,  76,211, 85],  // front-right
  jemb_side     : [1134, 147, 97,133],  // Battle Cruiser side
  jem_top       : [ 485, 156,112,117],  // Fighter top view
  jem_rl        : [  54, 191,161, 78],  // Fighter rear-left
  jem_rr        : [ 263, 191,161, 79],  // rear-right
  jemb_rl       : [ 647, 184,224, 89],  // Battle Cruiser rear-left
  jemb_rr       : [ 889, 184,206, 91],  // rear-right
  jem_straight  : [  38, 328,167, 60],  // Fighter straight-on (← main enemy)
  jem_rear      : [ 249, 328,168, 61],  // Fighter rear view
  jem_top2      : [ 481, 319,120, 87],  // Fighter top 2
  gorn_raider   : [ 661, 322,163, 66],  // Gorn Raider side
  jemb_top      : [ 860, 310,191, 98],  // Battle Cruiser top
  jemb_bottom   : [1089, 316,146, 88],  // Battle Cruiser bottom
  vorta_fl      : [ 214, 435,264,105],  // Vorta command ship front-left
  vorta_fr      : [ 482, 439,211, 81],  // front-right
  vorta_top     : [ 735, 441,165, 87],  // top
  vorta_fr2     : [ 917, 444,178, 79],  // front 2
  jem_fighter   : [  33, 451,145, 72],  // Fighter silhouette
  phased_beam   : [1133, 454,117, 46],  // Phased polaron beam FX
  vorta_fl2     : [  28, 580,231, 95],  // Vorta RL
  vorta_rl      : [ 278, 580,232, 94],  // Vorta RL alt
  vorta_top2    : [ 555, 598,147, 75],  // Vorta top 2
  jemb_ref      : [ 715, 576,230, 99],  // Battle Cruiser ref
  jemb_ref2     : [ 978, 578,183,113],
  vorta_rl2     : [  21, 711,268,105],  // Vorta rear-left
  vorta_rr      : [ 297, 705,271,111],  // Vorta rear-right
  vorta_fv      : [ 761, 703,199,118],  // Vorta front view
  jemb_large    : [1016, 703,207,118],  // Battle Cruiser large
  vorta_top3    : [ 573, 724,153, 62],  // Vorta top 3
};

Sprites.SP8472 = {
  // sp8472_sheet.png (1134x928)
  bio_large_frente : [ 754, 106,361,112],  // Large bioship head-on (← main boss)
  bio_sm_a      : [  29, 128, 84, 73],  // Small bioship angle a
  bio_sm_b      : [ 154, 128, 82, 73],  // angle b
  bio_sm_c      : [ 281, 128, 82, 73],  // angle c
  bio_sm_d      : [ 431, 128, 83, 72],  // angle d
  bio_sm_side   : [ 593, 250,132, 98],  // Small side view
  bio_lg_side   : [ 750, 253,167, 87],  // Large side
  bio_lg_side2  : [ 943, 259,139, 78],
  bio_sm_top    : [  21, 516,152,229],  // Small top view (tall)
  bio_sm_bot    : [ 202, 516,152,229],  // Small bottom
  bio_sm_sup    : [ 370, 521,169,100],  // Small superior angle
  bio_lg_top    : [ 602, 516,129,235],  // Large top (tall)
  bio_lg_bot    : [ 775, 510,129,235],  // Large bottom
  bio_lg_beam   : [ 909, 533,205,134],  // Large with focal beam
  bio_lg_beam2  : [ 596, 793,320, 91],  // Large beam firing side
};

Sprites.AST = {
  // asteroid_sheet.png (1264x843) — rotation sets (8 frames each)
  // Row 1: small asteroids (indices 0-13, ~54x52px each)
  rot8_sm: [
    [ 26, 46, 54, 53], [111, 45, 58, 54], [200, 47, 54, 50], [294, 47, 55, 52],
    [381, 49, 56, 47], [470, 48, 59, 48], [565, 46, 57, 52], [661, 44, 56, 55],
  ],
  // Row 2: more small (indices 14-26)
  rot8_sm2: [
    [ 22,133, 62, 41], [109,133, 60, 43], [201,127, 56, 51], [296,127, 55, 51],
    [381,133, 60, 43], [469,130, 61, 47], [565,127, 56, 52], [661,126, 57, 54],
  ],
  // Large asteroids (various perspective angles)
  large_a  : [ 26,245,141,123],
  large_b  : [215,245,152,125],
  large_c  : [408,247,175,119],
  large_d  : [623,249,225,117],  // biggest
  large_e  : [884,250,166,113],
  // Rotation set (bottom, 8 frames ~81x81 each)
  rot8_med: [
    [ 17,738, 81, 79], [118,736, 81, 83], [222,735, 80, 83], [324,738, 81, 81],
    [428,736, 80, 82], [529,735, 82, 83], [634,738, 81, 81],
  ],
  // Mineral/special
  mineral_green : [ 27,442, 98, 85],
  fractured_a   : [139,445, 87, 82],
  volcanic_a    : [709,438,108, 94],
  metallic_a    : [858,439, 85, 90],
};

Sprites.DS9 = {
  // ds9_sheet.png (1264x843)
  nor_class_panel  : [   7,  67,1245,473],  // Full top row (multiple views together)
  outpost_fl       : [  27, 604,157, 62],   // Outpost front-left
  outpost_fl2      : [ 193, 604,157, 61],
  outpost_fr       : [ 362, 607,137, 57],
  outpost_fl3      : [ 510, 603,153, 62],
  outpost_fr2      : [ 675, 604,156, 62],
  nor_perspective  : [ 853, 604,176,145],   // DS9 3/4 perspective view
};

// Draw helpers for new sheets
Sprites.drawCardassian = function(ctx, name, cx, cy, scale, rot, flipX) {
  const img = Sprites.sheets.cardassian;
  if (!img || !img.complete || !img.naturalWidth) return false;
  const r = Sprites.CARD[name]; if (!r) return false;
  const dw=r[2]*scale, dh=r[3]*scale;
  ctx.save(); ctx.translate(cx,cy);
  if (rot) ctx.rotate(rot); if (flipX) ctx.scale(-1,1);
  ctx.drawImage(img, r[0],r[1],r[2],r[3], -dw/2,-dh/2, dw,dh);
  ctx.restore(); return true;
};

Sprites.drawDominion = function(ctx, name, cx, cy, scale, rot, flipX) {
  const img = Sprites.sheets.dominion;
  if (!img || !img.complete || !img.naturalWidth) return false;
  const r = Sprites.DOM[name]; if (!r) return false;
  const dw=r[2]*scale, dh=r[3]*scale;
  ctx.save(); ctx.translate(cx,cy);
  if (rot) ctx.rotate(rot); if (flipX) ctx.scale(-1,1);
  ctx.drawImage(img, r[0],r[1],r[2],r[3], -dw/2,-dh/2, dw,dh);
  ctx.restore(); return true;
};

Sprites.drawSp8472 = function(ctx, name, cx, cy, scale, rot) {
  const img = Sprites.sheets.sp8472;
  if (!img || !img.complete || !img.naturalWidth) return false;
  const r = Sprites.SP8472[name]; if (!r) return false;
  const dw=r[2]*scale, dh=r[3]*scale;
  ctx.save(); ctx.translate(cx,cy);
  if (rot) ctx.rotate(rot);
  ctx.drawImage(img, r[0],r[1],r[2],r[3], -dw/2,-dh/2, dw,dh);
  ctx.restore(); return true;
};

Sprites.drawAsteroid = function(ctx, frame8, cx, cy, scale) {
  // frame8: 0-7 rotation frames from rot8_med set
  const img = Sprites.sheets.asteroids;
  if (!img || !img.complete || !img.naturalWidth) return false;
  const r = Sprites.AST.rot8_med[frame8 % 7]; if (!r) return false;
  const dw=r[2]*scale, dh=r[3]*scale;
  ctx.save(); ctx.translate(cx,cy);
  ctx.drawImage(img, r[0],r[1],r[2],r[3], -dw/2,-dh/2, dw,dh);
  ctx.restore(); return true;
};

Sprites.drawDs9 = function(ctx, name, cx, cy, scale) {
  const img = Sprites.sheets.ds9;
  if (!img || !img.complete || !img.naturalWidth) return false;
  const r = Sprites.DS9[name]; if (!r) return false;
  const dw=r[2]*scale, dh=r[3]*scale;
  ctx.save(); ctx.translate(cx,cy);
  ctx.drawImage(img, r[0],r[1],r[2],r[3], -dw/2,-dh/2, dw,dh);
  ctx.restore(); return true;
};

// Extend Sprites.load for new sheets
(function() {
  const _prev = Sprites.load.bind(Sprites);
  Sprites.load = function(base) {
    _prev(base);
    const mk = (key, file) => {
      const img = new Image();
      img.onload = () => {};
      img.onerror = () => console.warn('Failed:', file);
      img.src = base + file;
      Sprites.sheets[key] = img;
    };
    mk('cardassian', 'cardassian_sheet.png');
    mk('dominion',   'dominion_sheet.png');
    mk('sp8472',     'sp8472_sheet.png');
    mk('asteroids',  'asteroid_sheet.png');
    mk('ds9',        'ds9_sheet.png');
  };
})();

// ════════════════════════════════════════════════════════════════════
//  BORG UNICOMPLEX — Final Level Asset
//  Source: Voyager "Dark Frontier" / "Endgame"
//  Canon size: ≥600 km spanning, thousands of sub-structures
//  Destroyed 2378 by neurolytic pathogen (Admiral Janeway)
// ════════════════════════════════════════════════════════════════════

Sprites.UNICOMPLEX = {
  // unicomplex_sheet.png (1408x768)
  // Top-down hub view (X-shaped, largest, central nexus)
  hub_top     : [  40,  25, 733, 317],   // 108,924px — PRIMARY view, Borg Queen chamber

  // 45° isometric angle (right side, detailed tech)
  iso_right   : [ 846,  29, 521, 351],   // 116,036px — approach from right quadrant

  // Side/lateral view (elongated horizontal structure)
  side_long   : [  33, 376, 664, 129],   // 54,389px — side strut/corridor tunnel

  // 3/4 angle medium (central intersection node)
  node_med    : [ 727, 407, 307, 287],   // 82,494px — hub node mid-size

  // Small variant (partial structure, distance element)
  fragment_sm : [1056, 471, 325, 266],   // 35,188px — background element / debris

  // Lower angle view (looking up at structure)
  low_angle   : [  93, 547, 527, 192],   // 62,139px — dramatic fly-under angle
};

Sprites.drawUnicomplex = function(ctx, name, cx, cy, scale, rot) {
  const img = Sprites.sheets.unicomplex;
  if (!img || !img.complete || !img.naturalWidth) return false;
  const r = Sprites.UNICOMPLEX[name]; if (!r) return false;
  const dw = r[2]*scale, dh = r[3]*scale;
  ctx.save(); ctx.translate(cx, cy);
  if (rot) ctx.rotate(rot);
  ctx.drawImage(img, r[0],r[1],r[2],r[3], -dw/2,-dh/2, dw,dh);
  ctx.restore(); return true;
};

// Extend loader for unicomplex sheet
(function() {
  const _prev = Sprites.load.bind(Sprites);
  Sprites.load = function(base) {
    _prev(base);
    const img = new Image();
    img.onload = () => {};
    img.onerror = () => console.warn('Failed: unicomplex_sheet.png');
    img.src = base + 'unicomplex_sheet.png';
    Sprites.sheets.unicomplex = img;
  };
})();
