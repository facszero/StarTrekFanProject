'use strict';

/**
 * All rendering primitives for ships, weapons, and effects.
 * Each function receives a pre-translated/scaled ctx (or absolute coords).
 */
const Draw = {

  // ══════════════════════════════════════════════════════════════
  //  USS ENTERPRISE-D  — rear ¾ view from above (After-Burner cam)
  //  cx/cy = screen center of ship, scale = draw scale, bank = radians
  // ══════════════════════════════════════════════════════════════
  enterprise(ctx, cx, cy, scale, bank) {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(bank * 0.14);
    ctx.scale(scale, scale);

    const c = {
      hull:   '#bcc9d6', hullLt: '#cfdde8', hullDk: '#7a8a9a',
      panel:  '#a8b8c4', nacelle:'#96a8b8', band:   '#cc4400',
      glow:   '#449aff', glowLt: '#88ccff',
      imp:    '#ff5500', impLt:  '#ffaa44', det:    '#697a8a',
    };

    // ── Nacelle pylons (drawn behind saucer) ──────────────────
    ctx.strokeStyle = c.det; ctx.lineWidth = 4; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(-18,28); ctx.quadraticCurveTo(-50,48,-90,57); ctx.stroke();
    ctx.beginPath(); ctx.moveTo( 18,28); ctx.quadraticCurveTo( 50,48, 90,57); ctx.stroke();

    // ── Left nacelle ─────────────────────────────────────────
    ctx.save(); ctx.translate(-90, 57); this._nacelle(ctx, c); ctx.restore();
    // ── Right nacelle (mirrored) ─────────────────────────────
    ctx.save(); ctx.translate( 90, 57); ctx.scale(-1,1); this._nacelle(ctx, c); ctx.restore();

    // ── Secondary hull ───────────────────────────────────────
    const sg2 = ctx.createRadialGradient(-8,42,4, 0,42,35);
    sg2.addColorStop(0, c.hullLt); sg2.addColorStop(1, c.panel);
    ctx.beginPath(); ctx.ellipse(0,42,32,22,0,0,Math.PI*2);
    ctx.fillStyle = sg2; ctx.fill();
    ctx.strokeStyle = c.det; ctx.lineWidth = .8; ctx.stroke();
    ctx.beginPath(); ctx.ellipse(0,42,23,16,0,0,Math.PI*2);
    ctx.strokeStyle = U.rgba(c.det,.45); ctx.lineWidth = .5; ctx.stroke();

    // ── Neck ──────────────────────────────────────────────────
    ctx.beginPath();
    ctx.moveTo(-12,8); ctx.bezierCurveTo(-14,22,-15,30,-15,38);
    ctx.lineTo(15,38); ctx.bezierCurveTo(15,30,14,22,12,8); ctx.closePath();
    ctx.fillStyle = c.panel; ctx.fill();
    ctx.strokeStyle = c.det; ctx.lineWidth = .6; ctx.stroke();

    // ── Saucer (dominant feature) ────────────────────────────
    const sg = ctx.createRadialGradient(-22,-20,12, 0,-13,94);
    sg.addColorStop(0, c.hullLt); sg.addColorStop(.4, c.hull);
    sg.addColorStop(.85, c.panel); sg.addColorStop(1, c.hullDk);
    ctx.beginPath(); ctx.ellipse(0,-13,91,73,0,0,Math.PI*2);
    ctx.fillStyle = sg; ctx.fill();
    ctx.strokeStyle = c.det; ctx.lineWidth = 1; ctx.stroke();

    // Ring details
    for (const [rx,ry,a] of [[83,66,.6],[66,53,.5],[43,34,.4],[22,17,.35]]) {
      ctx.beginPath(); ctx.ellipse(0,-13,rx,ry,0,0,Math.PI*2);
      ctx.strokeStyle = U.rgba(c.hullDk,a); ctx.lineWidth = .55; ctx.stroke();
    }

    // Center core
    const cg = ctx.createRadialGradient(0,-13,0, 0,-13,20);
    cg.addColorStop(0, c.hullLt); cg.addColorStop(1, c.hull);
    ctx.beginPath(); ctx.ellipse(0,-13,20,15,0,0,Math.PI*2);
    ctx.fillStyle = cg; ctx.fill();

    // Hull radial panel lines
    ctx.save(); ctx.strokeStyle = U.rgba(c.hullDk,.18); ctx.lineWidth = .5;
    for (let i=0; i<16; i++) {
      const a = (i/16)*Math.PI*2;
      ctx.beginPath();
      ctx.moveTo(Math.cos(a)*20, -13+Math.sin(a)*15);
      ctx.lineTo(Math.cos(a)*91, -13+Math.sin(a)*73);
      ctx.stroke();
    }
    ctx.restore();

    // Concentric arc lines (top half)
    ctx.save(); ctx.strokeStyle = U.rgba(c.hullDk,.28); ctx.lineWidth = .4;
    for (let r=0; r<5; r++) {
      ctx.beginPath(); ctx.ellipse(0,-13,28+r*13,22+r*10,0,Math.PI*1.08,Math.PI*1.92);
      ctx.stroke();
    }
    ctx.restore();

    // ── Impulse engines (rear of saucer) ─────────────────────
    ctx.save();
    ctx.shadowColor = c.imp; ctx.shadowBlur = 18;
    ctx.fillStyle = c.imp;
    U.rRect(ctx,-25,46,20,7,3); ctx.fill();
    U.rRect(ctx,  5,46,20,7,3); ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = c.impLt;
    U.rRect(ctx,-23,47,16,4,2); ctx.fill();
    U.rRect(ctx,  7,47,16,4,2); ctx.fill();
    ctx.restore();

    // Navigation lights
    ctx.save();
    ctx.shadowColor='#ff0000'; ctx.shadowBlur=9; ctx.fillStyle='#ff3322';
    ctx.beginPath(); ctx.arc(-91,-13,2.5,0,Math.PI*2); ctx.fill();
    ctx.shadowColor='#00ff00'; ctx.fillStyle='#22ff55';
    ctx.beginPath(); ctx.arc( 91,-13,2.5,0,Math.PI*2); ctx.fill();
    ctx.shadowBlur = 0; ctx.restore();

    ctx.restore();
  },

  // Internal: one nacelle body, centered at (0,0), pointing RIGHT
  _nacelle(ctx, c) {
    U.rRect(ctx,-43,-9,86,18,8);
    ctx.fillStyle = c.nacelle; ctx.fill();
    ctx.strokeStyle = c.det; ctx.lineWidth = .8; ctx.stroke();

    // Top panel line
    ctx.beginPath(); ctx.moveTo(-36,-3); ctx.lineTo(16,-3);
    ctx.strokeStyle = U.rgba(c.det,.45); ctx.lineWidth = .5; ctx.stroke();

    // Orange banding
    U.rRect(ctx,17,-9,14,18,[0,4,4,0]);
    ctx.fillStyle = c.band; ctx.fill();

    // Rear warp glow
    const gl = ctx.createRadialGradient(43,0,0, 43,0,20);
    gl.addColorStop(0, c.glowLt); gl.addColorStop(.4, U.rgba(c.glow,.8));
    gl.addColorStop(1, 'rgba(0,80,200,0)');
    ctx.fillStyle = gl;
    ctx.beginPath(); ctx.arc(43,0,20,0,Math.PI*2); ctx.fill();
    ctx.fillStyle = '#ddeeff';
    ctx.beginPath(); ctx.arc(43,0,5.5,0,Math.PI*2); ctx.fill();
  },

  // ══════════════════════════════════════════════════════════════
  //  KLINGON BIRD OF PREY  — front/above (enemy approaching)
  // ══════════════════════════════════════════════════════════════
  birdOfPrey(ctx, cx, cy, scale) {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(scale, scale);

    const hull  = '#28301e', hullLt = '#3e4830', acc = '#4a5438', wpn = '#ff4422';

    // Wings (swept forward, slightly down)
    ctx.beginPath();
    ctx.moveTo(-5,-8); ctx.lineTo(-82,-30); ctx.lineTo(-70, 8); ctx.lineTo(-22,14); ctx.closePath();
    ctx.fillStyle = hull; ctx.fill(); ctx.strokeStyle='#556655'; ctx.lineWidth=.75; ctx.stroke();

    ctx.beginPath();
    ctx.moveTo( 5,-8); ctx.lineTo( 82,-30); ctx.lineTo( 70, 8); ctx.lineTo( 22,14); ctx.closePath();
    ctx.fillStyle = hull; ctx.fill(); ctx.stroke();

    // Wing highlight panels
    ctx.fillStyle = hullLt;
    ctx.beginPath(); ctx.moveTo(-10,-4); ctx.lineTo(-68,-26); ctx.lineTo(-56,6); ctx.lineTo(-18,12); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo( 10,-4); ctx.lineTo( 68,-26); ctx.lineTo( 56,6); ctx.lineTo( 18,12); ctx.closePath(); ctx.fill();

    // Wing ribs
    ctx.strokeStyle = U.rgba(acc,.55); ctx.lineWidth = .8;
    for (let i=0;i<3;i++) {
      const t = .3+i*.25;
      ctx.beginPath(); ctx.moveTo(-5+(-77)*t,-8+(-22)*t); ctx.lineTo(-5+(-17)*t,-8+22*t); ctx.stroke();
      ctx.beginPath(); ctx.moveTo( 5+(  77)*t,-8+(-22)*t); ctx.lineTo( 5+( 17)*t,-8+22*t); ctx.stroke();
    }

    // Body/neck
    ctx.fillStyle = '#202518';
    ctx.beginPath(); ctx.moveTo(-9,-32); ctx.lineTo(9,-32); ctx.lineTo(11,22); ctx.lineTo(-11,22); ctx.closePath();
    ctx.fill(); ctx.strokeStyle='#556655'; ctx.lineWidth=.7; ctx.stroke();

    // Central hull ellipse
    ctx.beginPath(); ctx.ellipse(0,5,14,20,0,0,Math.PI*2);
    ctx.fillStyle='#2c3020'; ctx.fill(); ctx.stroke();

    // Beak
    ctx.beginPath(); ctx.moveTo(0,-48); ctx.lineTo(-8,-28); ctx.lineTo(8,-28); ctx.closePath();
    ctx.fillStyle='#181c10'; ctx.fill(); ctx.stroke();

    // Weapon glow
    ctx.save(); ctx.shadowColor = wpn; ctx.shadowBlur = 12; ctx.fillStyle = wpn;
    ctx.beginPath(); ctx.arc(-82,-30,5.5,0,Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc( 82,-30,5.5,0,Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(  0,-50,4  ,0,Math.PI*2); ctx.fill();
    ctx.shadowBlur=0; ctx.restore();

    ctx.restore();
  },

  // ══════════════════════════════════════════════════════════════
  //  BORG CUBE  (approaching head-on)
  // ══════════════════════════════════════════════════════════════
  borgCube(ctx, cx, cy, scale, tick) {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(scale, scale);

    const s=62, g='#00cc44', dk='#060d08', g2='#00ff66';

    // Right face (perspective)
    ctx.beginPath();
    ctx.moveTo(s,-s); ctx.lineTo(s,s); ctx.lineTo(s+18,s-18); ctx.lineTo(s+18,-s-18); ctx.closePath();
    ctx.fillStyle='#080f08'; ctx.fill();
    ctx.strokeStyle=g; ctx.lineWidth=1; ctx.stroke();

    // Top face
    ctx.beginPath();
    ctx.moveTo(-s,-s); ctx.lineTo(s,-s); ctx.lineTo(s+18,-s-18); ctx.lineTo(-s+18,-s-18); ctx.closePath();
    ctx.fillStyle='#0a140a'; ctx.fill();
    ctx.strokeStyle=g; ctx.lineWidth=1; ctx.stroke();

    // Front face
    ctx.fillStyle = dk;
    ctx.fillRect(-s,-s,s*2,s*2);

    // Grid lines
    ctx.save(); ctx.strokeStyle=g; ctx.globalAlpha=.25; ctx.lineWidth=.6;
    for (let i=-s;i<=s;i+=16) {
      ctx.beginPath(); ctx.moveTo(i,-s); ctx.lineTo(i,s); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-s,i); ctx.lineTo(s,i); ctx.stroke();
    }
    ctx.restore();

    // Random lit tech panels (flicker = Borg aesthetic)
    ctx.save(); ctx.globalAlpha=.65;
    ctx.fillStyle='#00ee44';
    for (let i=0;i<10;i++) {
      const tx=U.rnd(-s+4,s-14), ty=U.rnd(-s+4,s-14);
      ctx.fillRect(tx,ty,U.rnd(4,12),U.rnd(4,12));
    }
    ctx.restore();

    // Glowing border
    ctx.strokeStyle=g; ctx.lineWidth=2;
    ctx.shadowColor=g; ctx.shadowBlur=20;
    ctx.strokeRect(-s,-s,s*2,s*2);
    ctx.shadowBlur=0;

    // Green tractor beam (optional, when close)
    if (scale > .35) {
      ctx.save(); ctx.globalAlpha = (scale-.35)*1.5;
      ctx.strokeStyle=g2; ctx.lineWidth=1.5;
      ctx.setLineDash([8,6]); ctx.lineDashOffset = -(tick*30);
      ctx.beginPath(); ctx.moveTo(0,s); ctx.lineTo(0,s+80); ctx.stroke();
      ctx.setLineDash([]); ctx.restore();
    }

    ctx.restore();
  },

  // ══════════════════════════════════════════════════════════════
  //  WEAPONS
  // ══════════════════════════════════════════════════════════════

  // Phaser beam  (auto-targeting, glowing orange line)
  phaserBeam(ctx, x1, y1, x2, y2, alpha) {
    ctx.save(); ctx.globalAlpha = alpha;
    const len = Math.hypot(x2-x1, y2-y1);
    const gr  = ctx.createLinearGradient(x1,y1,x2,y2);
    gr.addColorStop(0,   '#ffcc66'); gr.addColorStop(.25,'#ff8830');
    gr.addColorStop(.8,  '#ff5500'); gr.addColorStop(1,  'rgba(255,60,0,0)');
    // outer glow
    ctx.strokeStyle = U.rgba('#ff6600',.35); ctx.lineWidth = 7; ctx.beginPath();
    ctx.moveTo(x1,y1); ctx.lineTo(x2,y2); ctx.stroke();
    // core beam
    ctx.strokeStyle = gr; ctx.lineWidth = 2.5;
    ctx.shadowColor='#ff8830'; ctx.shadowBlur=14;
    ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(x2,y2); ctx.stroke();
    ctx.shadowBlur=0; ctx.restore();
  },

  // Photon torpedo  (glowing blue orb with trail)
  torpedo(ctx, x, y, size, alpha) {
    ctx.save(); ctx.globalAlpha = alpha; ctx.translate(x, y);
    const gr = ctx.createRadialGradient(0,0,0, 0,0,size*3.5);
    gr.addColorStop(0, '#ccf0ff'); gr.addColorStop(.35, U.rgba('#44aaff',.7));
    gr.addColorStop(1, 'transparent');
    ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(0,0,size*3.5,0,Math.PI*2); ctx.fill();
    ctx.fillStyle='#ddf0ff'; ctx.shadowColor='#44aaff'; ctx.shadowBlur=22;
    ctx.beginPath(); ctx.arc(0,0,size,0,Math.PI*2); ctx.fill();
    ctx.shadowBlur=0; ctx.restore();
  },

  // Explosion ring burst  (progress 0→1)
  explosion(ctx, x, y, radius, progress) {
    ctx.save(); ctx.translate(x, y);
    const rings=4;
    for (let r=0;r<rings;r++) {
      const t = U.clamp(progress*rings-r, 0, 1);
      if (t <= 0) continue;
      const rr = radius*t*(0.35+r*.22);
      const a  = (1-t)*.85;
      const gr = ctx.createRadialGradient(0,0,0, 0,0,rr);
      gr.addColorStop(0,  CFG.C.EXP[r % CFG.C.EXP.length] + 'ff');
      gr.addColorStop(.6, CFG.C.EXP[(r+2)%CFG.C.EXP.length] + '88');
      gr.addColorStop(1,  'transparent');
      ctx.globalAlpha = a; ctx.fillStyle = gr;
      ctx.beginPath(); ctx.arc(0,0,rr,0,Math.PI*2); ctx.fill();
    }
    ctx.restore();
  },

  // HUD corner bracket
  corner(ctx, x, y, size, dir, color) {
    ctx.strokeStyle = color; ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x + dir*size, y); ctx.lineTo(x, y); ctx.lineTo(x, y + size);
    ctx.stroke();
  },

  // Segmented LED bar (for HUD)
  ledBar(ctx, x, y, w, h, pct, colFill, colBg) {
    const segs = 12;
    const sw   = Math.floor((w - segs - 1) / segs);
    const lit  = Math.round(pct * segs);
    for (let i=0; i<segs; i++) {
      const sx = x + i*(sw+1);
      ctx.fillStyle = i < lit ? colFill : colBg;
      ctx.fillRect(sx, y, sw, h);
    }
  },
};
