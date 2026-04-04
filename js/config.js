'use strict';

const CFG = {
  // ── Canvas ──────────────────────────────────────────────────────────────
  W: 1280,
  H: 720,

  // ── Perspective ─────────────────────────────────────────────────────────
  // Enemies spawn at Z_SPAWN and move toward 0.
  // Screen mapping is interpolated: at Z_SPAWN → near vanishing pt; at 0 → near player.
  Z_SPAWN:      2800,
  Z_KILL:       60,     // enemy "passes" player; collision checked here
  HORIZON_Y:    252,    // Y of vanishing point on canvas
  PLAYER_Y:     582,    // Y where Enterprise-D is drawn

  // ── Player ──────────────────────────────────────────────────────────────
  PLAYER_X0:        640,   // default x
  PLAYER_Y0:        582,   // default y
  PLAYER_Y_MIN:     312,   // horizon(252) + 60px perspective margin
  PLAYER_Y_MAX:     610,   // bottom bar(640) − 30px margin
  PLAYER_SPEED:     520,   // px/s lateral
  PLAYER_SPEED_Y:   340,   // px/s vertical (slightly tighter than lateral)
  PLAYER_BANK_RATE:  4.5,
  PLAYER_MAX_BANK:   0.28,
  PLAYER_PITCH_RATE: 3.2,
  PLAYER_MAX_PITCH:  0.14, // forward/backward tilt radians

  PHASER_INTERVAL:  95,    // ms (kept for reference only, auto-fire removed)
  PHASER_DAMAGE:     8,
  TORPEDO_MAX:      15,
  TORPEDO_DAMAGE:   45,
  TORPEDO_RECHARGE: 8000,  // ms per torpedo auto-recharge

  NOVA_COOLDOWN:   15,     // seconds
  NOVA_RING_SPEED: 950,    // px/second
  NOVA_BTN_X:      1218,   // canvas px — inside right panel
  NOVA_BTN_Y:       565,   // above bottom bar
  NOVA_BTN_R:        44,   // radius

  SHIELD_MAX:       100,
  LIVES:            3,

  // ── Enemies ─────────────────────────────────────────────────────────────
  BOP_SPEED_BASE:   780,   // z-units / second (Bird of Prey)
  BORG_SPEED_BASE:  480,

  // ── Palette ─────────────────────────────────────────────────────────────
  C: {
    // HUD
    BG:      '#0b0f16',
    PANEL:   '#121a26',
    BORDER:  '#c8a840',
    GOLD:    '#f0c060',
    DIM:     '#887040',
    TEXT:    '#e8d070',
    ALERT:   '#ff3838',
    GREEN:   '#38ef7d',
    BLUE:    '#3a7bff',
    PURPLE:  '#aa44ff',
    // FX
    PHASER:  '#ff8832',
    TORPEDO: '#44aaff',
    EXP:     ['#ff6600','#ff4400','#ffaa00','#ff2200','#ffffaa'],
  }
};
