'use strict';

const Game = (() => {
  let canvas, ctx;
  let state  = 'TITLE'; // TITLE | PLAYING | PAUSED | GAME_OVER
  let score  = 0;
  let wave   = 1;
  let dt     = 0, lastTs = 0;
  let keys   = {};
  let scaleX = 1, scaleY = 1;
  let titleTick = 0;

  // ── Input ────────────────────────────────────────────────────────
  function onMove(ex) {
    Player.setTargetX(ex * scaleX);
  }

  function onFire() {
    if (state === 'PLAYING') Player.fireTorpedo();
  }

  function onStart() {
    if (state === 'TITLE' || state === 'GAME_OVER') _startGame();
    else if (state === 'PAUSED') state = 'PLAYING';
  }

  function setupInput() {
    const rect = () => canvas.getBoundingClientRect();

    canvas.addEventListener('mousemove', e => {
      const r = rect(); onMove(e.clientX - r.left);
    });
    canvas.addEventListener('click', () => onStart());

    canvas.addEventListener('touchmove', e => {
      e.preventDefault();
      const r = rect();
      onMove(e.touches[0].clientX - r.left);
    }, {passive:false});

    canvas.addEventListener('touchstart', e => {
      e.preventDefault();
      const r = rect();
      onMove(e.touches[0].clientX - r.left);
      if (state === 'PLAYING') Player.fireTorpedo();
      else onStart();
    }, {passive:false});

    document.addEventListener('keydown', e => {
      keys[e.code] = true;
      if (e.code === 'Space') { e.preventDefault(); onFire(); }
      if (e.code === 'Enter') onStart();
      if (e.code === 'Escape') {
        if (state === 'PLAYING')  state = 'PAUSED';
        else if (state === 'PAUSED') state = 'PLAYING';
      }
    });
    document.addEventListener('keyup', e => { keys[e.code] = false; });
  }

  function updateScale() {
    const r = canvas.getBoundingClientRect();
    scaleX = CFG.W / (r.width  || CFG.W);
    scaleY = CFG.H / (r.height || CFG.H);
  }

  // ── Game flow ────────────────────────────────────────────────────
  function _startGame() {
    score = 0; wave = 1;
    Player.reset();
    Enemies.reset();
    Projectiles.reset();
    Particles.reset();
    HUD.init();
    Enemies.startWave(wave);
    HUD.alert('ENGAGE — WAVE 01', 2800);
    state = 'PLAYING';
  }

  function _nextWave() {
    wave++;
    Enemies.startWave(wave);
    setTimeout(() =>
      HUD.alert(`WAVE ${String(wave).padStart(2,'0')} — INCOMING`, 3000), 120);
  }

  // ── Collision (enemy passes player zone) handled inside entities ──

  // ── Main loop ────────────────────────────────────────────────────
  function loop(ts) {
    dt = Math.min((ts - lastTs) / 1000, .05);
    lastTs = ts;

    update();
    render();
    requestAnimationFrame(loop);
  }

  function update() {
    Background.update(dt);
    titleTick += dt;

    if (state !== 'PLAYING') return;

    Player.update(dt, keys);
    Enemies.update(dt);
    Projectiles.update(dt);
    Particles.update(dt);

    if (Enemies.isWaveClear()) _nextWave();
    if (Player.lives <= 0 && Player.shields <= 0) state = 'GAME_OVER';
  }

  // ── Render helpers ───────────────────────────────────────────────
  function renderTitle() {
    const cx = CFG.W / 2;

    // Dark overlay
    ctx.fillStyle = 'rgba(0,0,12,.72)';
    ctx.fillRect(0, 0, CFG.W, CFG.H);

    // USS Enterprise-D in center (slowly banking)
    const bank = Math.sin(titleTick * .5) * .12;
    Draw.enterprise(ctx, cx, 310, 1.1, bank);

    // Thruster glow
    const tg = ctx.createRadialGradient(cx, 318, 0, cx, 318, 55);
    tg.addColorStop(0, 'rgba(80,140,255,.45)'); tg.addColorStop(1,'transparent');
    ctx.fillStyle=tg; ctx.beginPath(); ctx.arc(cx,318,55,0,Math.PI*2); ctx.fill();

    // Title text
    ctx.save();
    ctx.shadowColor='#4488ff'; ctx.shadowBlur=28;
    ctx.fillStyle='#aaccff'; ctx.font='bold 15px "Courier New"';
    ctx.textAlign='center'; ctx.fillText('STAR TREK', cx, 108);
    ctx.shadowBlur=0; ctx.restore();

    ctx.save();
    ctx.shadowColor=CFG.C.GOLD; ctx.shadowBlur=30;
    ctx.fillStyle=CFG.C.GOLD; ctx.font='bold 64px "Courier New"';
    ctx.textAlign='center'; ctx.fillText('FINAL FRONTIER', cx, 178);
    ctx.shadowBlur=0; ctx.restore();

    ctx.fillStyle=CFG.C.BORDER; ctx.fillRect(cx-320,188,640,2);

    ctx.fillStyle='#7a8a9a'; ctx.font='15px "Courier New"';
    ctx.textAlign='center';
    ctx.fillText('USS Enterprise-D  ·  Tactical Engagement Simulator', cx, 212);
    ctx.fillText('Fan Project — Not for Commercial Use', cx, 232);

    // Blinking prompt
    if (Math.sin(Date.now()/480) > 0) {
      ctx.fillStyle=CFG.C.TEXT; ctx.font='bold 16px "Courier New"';
      ctx.fillText('[ PRESS SPACE OR CLICK TO ENGAGE ]', cx, 448);
    }

    // Controls legend
    ctx.fillStyle=U.rgba(CFG.C.DIM,.85); ctx.font='12px "Courier New"';
    ctx.fillText('MOUSE / ← → KEYS  :  Helm control', cx, 500);
    ctx.fillText('SPACE / TAP        :  Launch photon torpedo  (auto-phasers always active)', cx, 521);
    ctx.fillText('ESC                :  Tactical pause', cx, 542);
    ctx.textAlign='left';
  }

  function renderPause() {
    ctx.fillStyle='rgba(0,0,20,.72)'; ctx.fillRect(0,0,CFG.W,CFG.H);
    ctx.fillStyle=CFG.C.GOLD; ctx.font='bold 52px "Courier New"';
    ctx.textAlign='center'; ctx.fillText('TACTICAL PAUSE', CFG.W/2, CFG.H/2-10);
    ctx.fillStyle='#7a8a9a'; ctx.font='17px "Courier New"';
    ctx.fillText('Press ESC or ENTER to resume', CFG.W/2, CFG.H/2+44);
    ctx.textAlign='left';
  }

  function renderGameOver() {
    ctx.fillStyle='rgba(22,0,0,.88)'; ctx.fillRect(0,0,CFG.W,CFG.H);
    ctx.save();
    ctx.shadowColor='#ff0000'; ctx.shadowBlur=35;
    ctx.fillStyle='#ff2222'; ctx.font='bold 68px "Courier New"';
    ctx.textAlign='center'; ctx.fillText('SHIP DESTROYED', CFG.W/2, CFG.H/2-44);
    ctx.shadowBlur=0; ctx.restore();

    ctx.fillStyle=CFG.C.GOLD; ctx.font='bold 28px "Courier New"';
    ctx.textAlign='center';
    ctx.fillText('FINAL SCORE: '+String(score).padStart(7,'0'), CFG.W/2, CFG.H/2+24);

    if (Math.sin(Date.now()/580)>0) {
      ctx.fillStyle=CFG.C.TEXT; ctx.font='17px "Courier New"';
      ctx.fillText('[ PRESS SPACE TO TRY AGAIN ]', CFG.W/2, CFG.H/2+86);
    }
    ctx.textAlign='left';
  }

  function render() {
    ctx.clearRect(0, 0, CFG.W, CFG.H);
    Background.render(ctx);

    if (state === 'TITLE') { renderTitle(); return; }

    Enemies.render(ctx);
    Projectiles.render(ctx);
    Player.render(ctx);
    Particles.render(ctx);
    HUD.render(ctx, score, wave, dt);

    if (state === 'PAUSED')    renderPause();
    if (state === 'GAME_OVER') renderGameOver();
  }

  // ── Public API ───────────────────────────────────────────────────
  return {
    addScore(pts) {
      score += pts;
      // HUD floating label would need screen coords — called from weapons.js
    },

    init() {
      canvas = document.getElementById('gameCanvas');
      ctx    = canvas.getContext('2d');
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      // Load sprite sheets (async – canvas fallback used until ready)
      Sprites.load('assets/sprites/');

      setupInput();
      updateScale();
      window.addEventListener('resize', updateScale);

      Background.init();
      Player.init();
      Enemies.init();
      Projectiles.init();
      Particles.init();
      HUD.init();

      requestAnimationFrame(ts => { lastTs = ts; loop(ts); });
    }
  };
})();

document.addEventListener('DOMContentLoaded', () => Game.init());
