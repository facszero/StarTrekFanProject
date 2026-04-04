'use strict';

const CFG = {
  // ── Canvas ──────────────────────────────────────────────────────────────
  W: 1280,
  H: 720,

  // ── HUD frame layout (hud_frame.png scaled to 1280x582, y-offset 69) ──
  // Frame game viewport (transparent center): x=267-1073, y=114-522
  FRAME_Y:      69,    // y where frame is drawn
  FRAME_H:      582,   // frame height on canvas (1483x674 → 1280x582)

  // ── Perspective — calibrated to frame viewport ───────────────────────
  Z_SPAWN:      2800,
  Z_KILL:       60,
  HORIZON_Y:    122,   // frame viewport top (y=114) + 8px margin
  PLAYER_Y:     510,   // frame viewport bottom (y=522) - 12px margin

  // ── Player ──────────────────────────────────────────────────────────────
  PLAYER_X0:        670,   // center of frame viewport (267+1073)/2
  PLAYER_Y0:        500,
  PLAYER_Y_MIN:     175,   // frame top + 61px
  PLAYER_Y_MAX:     510,   // frame bottom - 12px
  PLAYER_X_MIN:     295,   // frame viewport left + 28px
  PLAYER_X_MAX:     1055,  // frame viewport right - 18px

  // ── HUD panel boundaries (match frame panels) ────────────────────────
  HUD_LEFT_W:   259,   // left panel right edge
  HUD_LEFT_H:   493,   // just below our Engineering Data items → covers frame's EPS labels
  HUD_RIGHT_X:  1079,  // right panel left edge
  HUD_RIGHT_H:  545,   // covers frame's Photon Torpedoes labels
  HUD_TOP_H:    110,
  PLAYER_SPEED:     520,   // px/s lateral
  PLAYER_SPEED_Y:   340,   // px/s vertical (slightly tighter than lateral)
  PLAYER_BANK_RATE:  4.5,
  PLAYER_MAX_BANK:   0.28,
  PLAYER_PITCH_RATE: 3.2,
  PLAYER_MAX_PITCH:  0.14, // forward/backward tilt radians

  PHASER_DPS:       15,    // hp/second continuous beam (auto-targets nearest enemy)
  TORPEDO_MAX:      15,
  TORPEDO_DAMAGE:   45,
  TORPEDO_RECHARGE: 8000,

  NOVA_COOLDOWN:   15,     // seconds
  NOVA_RING_SPEED: 950,    // px/second
  MAX_WAVES:  15,    // after this → victory screen   // inside right panel
  NOVA_BTN_Y:       545,   // above frame's READY STATUS element (~y=587)
  NOVA_BTN_R:        38,

  SHIELD_MAX:       100,
  LIVES:            3,

  // ── Enemies ─────────────────────────────────────────────────────────────
  BOP_SPEED_BASE:   600,   // z-units/sec wave 1 → increases 65/wave up to ~1510 at wave 15
  BORG_SPEED_BASE:  400,

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
