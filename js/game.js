'use strict';

const Game = (() => {
  let canvas, ctx;
  let state     = 'TITLE';
  let score     = 0;
  let wave      = 1;
  let dt        = 0, lastTs = 0;
  let keys      = {};
  let scaleX    = 1, scaleY = 1;
  let canvasRect = { left:0, top:0, width:1280, height:720 };
  let titleTick  = 0;

  // ── Tap detection state ─────────────────────────────────────────
  let touchStartX = 0, touchStartY = 0, touchStartTime = 0;
  let isDragging  = false, touchOnButton = false;

  // ── Canvas rect (never call getBoundingClientRect in move handlers)
  function refreshRect() {
    canvasRect = canvas.getBoundingClientRect();
    scaleX = CFG.W / (canvasRect.width  || CFG.W);
    scaleY = CFG.H / (canvasRect.height || CFG.H);
  }

  // ── Convert client coords → canvas coords ──────────────────────
  function toCanvas(clientX, clientY) {
    return {
      cx: (clientX - canvasRect.left) * scaleX,
      cy: (clientY - canvasRect.top)  * scaleY,
    };
  }

  // ── Find enemy at canvas position (for tap-targeting) ──────────
  function findEnemyAt(cx, cy) {
    for (const e of Enemies.list) {
      if (e.dead || e.scale < .05) continue;
      const hitR = Math.max(38, 55 * e.scale);
      if (Math.hypot(cx - e.sx, cy - e.sy) < hitR) return e;
    }
    return null;
  }

  // ── Nova button hit test ───────────────────────────────────────
  function isNovaBtn(cx, cy) {
    return Math.hypot(cx - CFG.NOVA_BTN_X, cy - CFG.NOVA_BTN_Y) < CFG.NOVA_BTN_R + 10;
  }

  // ── Unified tap handler ────────────────────────────────────────
  function handleTap(cx, cy) {
    if (state !== 'PLAYING') { _startGame(); return; }

    // Nova button
    if (isNovaBtn(cx, cy)) {
      Nova.fire(Player.x, Player.y);
      return;
    }

    // Tap on enemy → phaser
    const target = findEnemyAt(cx, cy);
    if (target) {
      Player.firePhaserAt(target);
    } else {
      // Tap on empty space → torpedo
      Player.fireTorpedo();
    }
  }

  // ── Input setup ─────────────────────────────────────────────────
  function setupInput() {
    // ── Mouse ───────────────────────────────────────────────────
    canvas.addEventListener('mousemove', e => {
      onMove(e.clientX, e.clientY);
    });

    canvas.addEventListener('click', e => {
      const {cx, cy} = toCanvas(e.clientX, e.clientY);
      handleTap(cx, cy);
    });

    // ── Touch ───────────────────────────────────────────────────
    canvas.addEventListener('touchstart', e => {
      e.preventDefault();
      refreshRect();
      if (!e.touches.length) return;
      const t = e.touches[0];
      const {cx, cy} = toCanvas(t.clientX, t.clientY);
      touchStartX    = cx;
      touchStartY    = cy;
      touchStartTime = Date.now();
      isDragging     = false;
      touchOnButton  = isNovaBtn(cx, cy);

      // Start moving (unless on button)
      if (!touchOnButton) onMove(t.clientX, t.clientY);

      if (state !== 'PLAYING') _startGame();
    }, {passive: false});

    canvas.addEventListener('touchmove', e => {
      e.preventDefault();
      if (!e.touches.length || touchOnButton) return;
      const t = e.touches[0];
      const {cx, cy} = toCanvas(t.clientX, t.clientY);
      if (Math.hypot(cx - touchStartX, cy - touchStartY) > 16) isDragging = true;
      onMove(t.clientX, t.clientY);
    }, {passive: false});

    canvas.addEventListener('touchend', e => {
      e.preventDefault();
      const elapsed = Date.now() - touchStartTime;
      if (elapsed < 320 && !isDragging) {
        handleTap(touchStartX, touchStartY);
      }
    }, {passive: false});

    // ── Keyboard ────────────────────────────────────────────────
    document.addEventListener('keydown', e => {
      keys[e.code] = true;
      if (e.code === 'Space') {
        e.preventDefault();
        if (state === 'PLAYING') Player.fireTorpedo();
      }
      if (e.code === 'KeyN' || e.code === 'KeyF') {
        if (state === 'PLAYING') Nova.fire(Player.x, Player.y);
      }
      if (e.code === 'Enter') _startGame();
      if (e.code === 'Escape') {
        if      (state === 'PLAYING') state = 'PAUSED';
        else if (state === 'PAUSED')  state = 'PLAYING';
      }
    });
    document.addEventListener('keyup', e => { keys[e.code] = false; });

    window.addEventListener('resize',            refreshRect, {passive: true});
    window.addEventListener('orientationchange', () => setTimeout(refreshRect, 300), {passive: true});
  }

  function onMove(clientX, clientY) {
    if (state !== 'PLAYING') return;
    Player.setTarget(
      (clientX - canvasRect.left) * scaleX,
      (clientY - canvasRect.top)  * scaleY
    );
  }

  // ── Game flow ───────────────────────────────────────────────────
  function _startGame() {
    if (state === 'PAUSED') { state = 'PLAYING'; return; }
    score = 0; wave = 1;
    Player.reset();
    Enemies.reset();
    Projectiles.reset();
    Particles.reset();
    Nova.reset();
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

  // ── Main loop ───────────────────────────────────────────────────
  function loop(ts) {
    dt = Math.min((ts - lastTs) / 1000, .05);
    lastTs = ts;
    try { update(); render(); } catch(err) { console.error('[Loop]', err); }
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
    Nova.update(dt);
    if (Enemies.isWaveClear()) _nextWave();
    if (Player.lives <= 0) state = 'GAME_OVER';
  }

  // ── Screens ─────────────────────────────────────────────────────
  function renderTitle() {
    const cx = CFG.W / 2;
    ctx.fillStyle = 'rgba(0,0,12,.72)'; ctx.fillRect(0,0,CFG.W,CFG.H);

    Draw.enterprise(ctx, cx, 310, 1.1, Math.sin(titleTick*.5)*.12, 0);
    const tg=ctx.createRadialGradient(cx,318,0,cx,318,55);
    tg.addColorStop(0,'rgba(80,140,255,.45)'); tg.addColorStop(1,'transparent');
    ctx.fillStyle=tg; ctx.beginPath(); ctx.arc(cx,318,55,0,Math.PI*2); ctx.fill();

    ctx.save(); ctx.shadowColor='#4488ff'; ctx.shadowBlur=28;
    ctx.fillStyle='#aaccff'; ctx.font='bold 15px "Courier New"';
    ctx.textAlign='center'; ctx.fillText('STAR TREK',cx,108); ctx.shadowBlur=0; ctx.restore();

    ctx.save(); ctx.shadowColor=CFG.C.GOLD; ctx.shadowBlur=30;
    ctx.fillStyle=CFG.C.GOLD; ctx.font='bold 64px "Courier New"';
    ctx.textAlign='center'; ctx.fillText('FINAL FRONTIER',cx,178); ctx.shadowBlur=0; ctx.restore();

    ctx.fillStyle=CFG.C.BORDER; ctx.fillRect(cx-320,188,640,2);
    ctx.fillStyle='#7a8a9a'; ctx.font='15px "Courier New"'; ctx.textAlign='center';
    ctx.fillText('USS Enterprise-D  ·  Tactical Engagement Simulator',cx,212);
    ctx.fillText('Fan Project — Not for Commercial Use',cx,232);

    if (Math.sin(Date.now()/480)>0) {
      ctx.fillStyle=CFG.C.TEXT; ctx.font='bold 16px "Courier New"';
      ctx.fillText('[ TAP OR PRESS ENTER TO ENGAGE ]',cx,448);
    }

    ctx.fillStyle=U.rgba(CFG.C.DIM,.85); ctx.font='12px "Courier New"';
    ctx.fillText('DRAG / ← → ↑ ↓     Move ship',cx,500);
    ctx.fillText('TAP on enemy        Phaser (targeted)',cx,521);
    ctx.fillText('TAP on empty / SPACE  Photon torpedo (homing)',cx,542);
    ctx.fillText('Nova button / N     Area-clear discharge',cx,563);
    ctx.textAlign='left';
  }

  function renderPause() {
    ctx.fillStyle='rgba(0,0,20,.72)'; ctx.fillRect(0,0,CFG.W,CFG.H);
    ctx.fillStyle=CFG.C.GOLD; ctx.font='bold 52px "Courier New"';
    ctx.textAlign='center'; ctx.fillText('TACTICAL PAUSE',CFG.W/2,CFG.H/2-10);
    ctx.fillStyle='#7a8a9a'; ctx.font='17px "Courier New"';
    ctx.fillText('Press ESC or tap to resume',CFG.W/2,CFG.H/2+44);
    ctx.textAlign='left';
  }

  function renderGameOver() {
    ctx.fillStyle='rgba(22,0,0,.88)'; ctx.fillRect(0,0,CFG.W,CFG.H);
    ctx.save(); ctx.shadowColor='#ff0000'; ctx.shadowBlur=35;
    ctx.fillStyle='#ff2222'; ctx.font='bold 68px "Courier New"';
    ctx.textAlign='center'; ctx.fillText('SHIP DESTROYED',CFG.W/2,CFG.H/2-44);
    ctx.shadowBlur=0; ctx.restore();
    ctx.fillStyle=CFG.C.GOLD; ctx.font='bold 28px "Courier New"';
    ctx.textAlign='center';
    ctx.fillText('FINAL SCORE: '+String(score).padStart(7,'0'),CFG.W/2,CFG.H/2+24);
    if (Math.sin(Date.now()/580)>0) {
      ctx.fillStyle=CFG.C.TEXT; ctx.font='17px "Courier New"';
      ctx.fillText('[ TAP OR PRESS ENTER ]',CFG.W/2,CFG.H/2+86);
    }
    ctx.textAlign='left';
  }

  function render() {
    ctx.clearRect(0,0,CFG.W,CFG.H);
    Background.render(ctx);
    if (state==='TITLE') { renderTitle(); return; }
    Enemies.render(ctx);
    Projectiles.render(ctx);
    Nova.render(ctx);
    Player.render(ctx);
    Particles.render(ctx);
    HUD.render(ctx, score, wave, dt);
    if (state==='PAUSED')    renderPause();
    if (state==='GAME_OVER') renderGameOver();
  }

  // ── Public ──────────────────────────────────────────────────────
  return {
    addScore(pts) { score += pts; },
    init() {
      canvas = document.getElementById('gameCanvas');
      ctx    = canvas.getContext('2d');
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      Sprites.load('assets/sprites/');
      setupInput();
      refreshRect();
      Background.init(); Player.init(); Enemies.init();
      Projectiles.init(); Particles.init(); Nova.init(); HUD.init();
      requestAnimationFrame(ts => { lastTs=ts; requestAnimationFrame(loop); });
    }
  };
})();

document.addEventListener('DOMContentLoaded', () => Game.init());
