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
  PLAYER_SPEED:     520,   // px/s lateral
  PLAYER_BANK_RATE:  4.5,
  PLAYER_MAX_BANK:   0.28,

  PHASER_INTERVAL:  95,    // ms between auto phaser shots
  TORPEDO_MAX:      15,

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
