'use strict';

/**
 * Sprite loader and atlas.
 * Sheets exposed via Sprites.sheets for direct access.
 */
const Sprites = (() => {
  const sheets = { enterprise: null, enemy: null };
  let _ready = 0;

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

  const ENM = {
    brel:       [563, 319, 161,  92],
    borg_cube:  [523,  18, 124, 122],
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

  return {
    ENT, ENM, sheets,
    get ready() { return _ready >= 2; },

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
    },

    // Draw a banking frame of the Enterprise-D
    // bankNorm: 0.0 (hard left) → 1.0 (hard right)
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

    // Draw a named sprite from the enemy sheet
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

    // Draw explosion frame (0-4) from the strip
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
