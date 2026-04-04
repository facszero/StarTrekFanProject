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
    let best = null, bestD = Infinity;
    for (const e of Enemies.list) {
      if (e.dead || e.scale < .04) continue;
      // Generous hit radius: at least 70px, scales with enemy size
      // On mobile the canvas is CSS-scaled down, so we need extra room
      const hitR = Math.max(70, 80 * e.scale);
      const d = Math.hypot(cx - e.sx, cy - e.sy);
      if (d < hitR && d < bestD) { bestD = d; best = e; }
    }
    return best;
  }

  // ── Nova button hit test ───────────────────────────────────────
  function isNovaBtn(cx, cy) {
    return Math.hypot(cx - CFG.NOVA_BTN_X, cy - CFG.NOVA_BTN_Y) < CFG.NOVA_BTN_R + 10;
  }

  // ── Unified tap handler ────────────────────────────────────────
  function handleTap(cx, cy) {
    if (state !== 'PLAYING') { _startGame(); return; }    if (isNovaBtn(cx, cy)) { Nova.fire(Player.x, Player.y); return; }

    const target = findEnemyAt(cx, cy);
    if (target) {
      // Tap on enemy → lock phasers onto it as priority target
      Player.setPriorityTarget(target);
    } else {
      // Tap on empty → fire torpedo
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
    Phasers.reset();
    Projectiles.reset();
    Particles.reset();
    Nova.reset();
    BorgAdaptation.reset();
    Story.init();
    Story.onGameStart();
    HUD.init();
    Enemies.startWave(wave);
    HUD.alert('ENGAGE — WAVE 01', 2800);
    state = 'PLAYING';
  }

  function _nextWave() {
    wave++;
    if (wave > CFG.MAX_WAVES) { _triggerVictory(); return; }
    Story.onWaveStart(wave);
    Enemies.startWave(wave);
    setTimeout(() =>
      HUD.alert(`WAVE ${String(wave).padStart(2,'0')} — INCOMING`, 3000), 120);
  }

  function _triggerVictory() {
    state = 'VICTORY';
    HUD.alert('MISSION COMPLETE — ENTERPRISE RETURNS HOME', 8000);
    Background.setTheme('blue');
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
    Story.update(dt);

    if (state !== 'PLAYING') return;
    if (Story.shouldPauseGame()) return;   // freeze gameplay during act transition
    Player.update(dt, keys);
    Phasers.update(dt, Player.x, Player.y);
    BorgAdaptation.update(dt);
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
    ctx.fillStyle = 'rgba(0,0,12,.82)'; ctx.fillRect(0,0,CFG.W,CFG.H);

    // Game logo at top
    const logo = Sprites.sheets && Sprites.sheets.logo;
    if (logo && logo.complete && logo.naturalWidth) {
      const LW=760, LH=Math.round(760*(688/1529));
      ctx.save();
      ctx.shadowColor='rgba(180,140,40,.7)'; ctx.shadowBlur=32;
      ctx.drawImage(logo, cx-LW/2, 30, LW, LH);
      ctx.shadowBlur=0; ctx.restore();
    } else {
      ctx.save(); ctx.shadowColor=CFG.C.GOLD; ctx.shadowBlur=28;
      ctx.fillStyle=CFG.C.GOLD; ctx.font='bold 58px Arial,sans-serif';
      ctx.textAlign='center'; ctx.fillText('FINAL FRONTIER', cx, 120);
      ctx.shadowBlur=0; ctx.restore();
    }

    // Enterprise-D below logo
    const logoH = Math.round(760*(688/1529));
    const entY = 30 + logoH + 20;
    Draw.enterprise(ctx, cx, entY + 80, 1.1, Math.sin(titleTick*.5)*.12, 0);
    const tg=ctx.createRadialGradient(cx,entY+88,0,cx,entY+88,60);
    tg.addColorStop(0,'rgba(80,140,255,.4)'); tg.addColorStop(1,'transparent');
    ctx.fillStyle=tg; ctx.beginPath(); ctx.arc(cx,entY+88,60,0,Math.PI*2); ctx.fill();

    // Subtitle
    const subY = entY + 175;
    ctx.fillStyle='#7a8a9a'; ctx.font='13px Arial,sans-serif'; ctx.textAlign='center';
    ctx.fillText('USS Enterprise-D  ·  Tactical Engagement Simulator', cx, subY);
    ctx.fillStyle=U.rgba(CFG.C.DIM,.6); ctx.font='11px Arial,sans-serif';
    ctx.fillText('Fan Project — Not for Commercial Use', cx, subY+17);

    ctx.fillStyle=CFG.C.BORDER; ctx.fillRect(cx-240, subY+28, 480, 1);

    // Prompt
    if (Math.sin(Date.now()/480)>0) {
      ctx.fillStyle=CFG.C.TEXT; ctx.font='bold 14px Arial,sans-serif';
      ctx.textAlign='center'; ctx.fillText('[ TAP OR PRESS ENTER TO ENGAGE ]', cx, subY+50);
    }

    // Controls 2-col
    ctx.fillStyle=U.rgba(CFG.C.DIM,.85); ctx.font='12px Arial,sans-serif';
    const col1=cx-200, col2=cx+10, cy2=subY+74;
    ctx.textAlign='left';
    [
      ['DRAG / Arrows',       'Move ship'],
      ['Tap on enemy',        'Fire phaser (targeted)'],
      ['Tap empty / Space',   'Photon torpedo (homing)'],
      ['Nova btn / N',        'Area-clear discharge'],
    ].forEach(([k,v],i) => {
      ctx.fillStyle=CFG.C.DIM;  ctx.fillText(k, col1, cy2+i*18);
      ctx.fillStyle=CFG.C.TEXT; ctx.fillText(v, col2, cy2+i*18);
    });
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
    Phasers.render(ctx);
    Projectiles.render(ctx);
    Nova.render(ctx);
    Player.render(ctx);
    Particles.render(ctx);
    // Borg Adaptation overlay — drawn over game, under HUD frame
    BorgAdaptation.render(ctx, (CFG.PLAYER_X_MIN + CFG.PLAYER_X_MAX)/2, CFG.HORIZON_Y + 20);

    // ── HUD frame overlay ────────────────────────────────────────
    const frameImg = Sprites.sheets && Sprites.sheets.hud_frame;
    if (frameImg && frameImg.complete && frameImg.naturalWidth) {
      ctx.drawImage(frameImg, 0, CFG.FRAME_Y, 1280, CFG.FRAME_H);
    }

    HUD.render(ctx, score, wave, dt);
    Story.render(ctx);   // cinematic overlay (acts as full-screen when active)
    if (state==='PAUSED')    renderPause();
    if (state==='GAME_OVER') renderGameOver();
    if (state==='VICTORY')   renderVictory();
  }

  function renderVictory() {
    const cx=CFG.W/2, cy=CFG.H/2;
    ctx.save();
    ctx.fillStyle='rgba(0,0,20,.85)'; ctx.fillRect(0,0,CFG.W,CFG.H);
    // TNG font for title
    ctx.shadowColor='#c8a840'; ctx.shadowBlur=40;
    ctx.fillStyle=CFG.C.GOLD; ctx.font='bold 62px "StarTrekTNG",monospace';
    ctx.textAlign='center'; ctx.fillText('MISSION COMPLETE',cx,cy-60);
    ctx.shadowBlur=0;
    ctx.fillStyle=CFG.C.TEXT; ctx.font='bold 20px monospace';
    ctx.fillText('The USS Enterprise-D has returned to Federation space.',cx,cy+10);
    ctx.fillStyle=CFG.C.DIM; ctx.font='16px monospace';
    ctx.fillText('"Resistance was not futile."',cx,cy+44);
    ctx.fillStyle=CFG.C.GOLD; ctx.font='bold 22px monospace';
    ctx.fillText('FINAL SCORE: '+String(score).padStart(7,'0'),cx,cy+90);
    if(Math.sin(Date.now()/500)>0){
      ctx.fillStyle=CFG.C.TEXT; ctx.font='bold 15px monospace';
      ctx.fillText('[ TAP OR PRESS ENTER TO PLAY AGAIN ]',cx,cy+140);
    }
    ctx.textAlign='left'; ctx.restore();
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
      Phasers.init(); Projectiles.init(); Particles.init(); Nova.init();
      BorgAdaptation.init(); Story.init(); HUD.init();
      requestAnimationFrame(ts => { lastTs=ts; requestAnimationFrame(loop); });
    }
  };
})();

document.addEventListener('DOMContentLoaded', () => Game.init());
