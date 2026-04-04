'use strict';

const HUD = (() => {
  let alerts = [], floatScores = [], tick = 0;

  // ── Shared LCARS helpers ────────────────────────────────────────

  // Filled rounded-rect pill (LCARS style)
  function pill(ctx, x, y, w, h, col, r) {
    r = r ?? Math.min(h/2, 10);
    U.rRect(ctx, x, y, w, h, r);
    ctx.fillStyle = col; ctx.fill();
  }

  // Filled bar (with dark bg track)
  function bar(ctx, x, y, w, h, pct, col) {
    ctx.fillStyle = '#08101a'; ctx.fillRect(x,y,w,h);
    ctx.strokeStyle = U.rgba(col,.3); ctx.lineWidth=.6; ctx.strokeRect(x,y,w,h);
    if (pct > 0) {
      const fw = Math.max(0,(w-2)*pct);
      ctx.fillStyle = col;
      ctx.shadowColor = col; ctx.shadowBlur = 5;
      ctx.fillRect(x+1, y+1, fw, h-2);
      ctx.shadowBlur = 0;
    }
  }

  // LCARS label
  function label(ctx, x, y, text, col, size, align) {
    ctx.fillStyle = col || CFG.C.DIM;
    ctx.font = `bold ${size||9}px monospace`;
    ctx.textAlign = align || 'left';
    ctx.fillText(text, x, y);
    ctx.textAlign = 'left';
  }

  // LCARS rounded block button
  function block(ctx, x, y, w, h, col, text, active) {
    const c = active ? col : U.rgba(col, .45);
    pill(ctx, x, y, w, h, active ? '#0d1e30' : '#08121e', 5);
    ctx.strokeStyle = c; ctx.lineWidth = active ? 1.5 : .7;
    U.rRect(ctx, x, y, w, h, 5); ctx.stroke();
    if (active) {
      // Left accent bar
      ctx.fillStyle = col;
      ctx.shadowColor = col; ctx.shadowBlur = 8;
      ctx.fillRect(x, y, 4, h);
      ctx.shadowBlur = 0;
    }
    label(ctx, x + (active?10:6), y + h/2 + 4, text, active ? CFG.C.TEXT : CFG.C.DIM, 9);
  }

  // ── TOP BAR ────────────────────────────────────────────────────
  function drawTop(ctx, score, wave) {
    const H = 52;
    ctx.fillStyle = CFG.C.BG; ctx.fillRect(0,0,CFG.W,H);
    // Bottom accent line (gold)
    ctx.fillStyle = CFG.C.BORDER; ctx.fillRect(0,H-2,CFG.W,2);
    // Top thin line
    ctx.fillStyle = U.rgba(CFG.C.BORDER,.3); ctx.fillRect(0,0,CFG.W,2);

    // ── Score ──────────────────────────────────────────────────
    label(ctx, 14, 14, 'SCORE', CFG.C.DIM, 9);
    ctx.fillStyle = CFG.C.GOLD;
    ctx.font = 'bold 26px monospace';
    ctx.shadowColor = U.rgba(CFG.C.GOLD,.5); ctx.shadowBlur = 8;
    ctx.fillText(String(score).padStart(7,'0'), 12, 42);
    ctx.shadowBlur = 0;

    // ── Shield bar (center) ────────────────────────────────────
    const bx=290, bw=500, by=14, bh=18;
    const pct = U.clamp(Player.shields / CFG.SHIELD_MAX, 0, 1);
    const shCol = pct > .5 ? CFG.C.BLUE : pct > .25 ? '#ffaa00' : '#ff3300';

    label(ctx, CFG.W/2, 11, 'DEFLECTOR SHIELDS', CFG.C.DIM, 9, 'center');

    ctx.fillStyle = '#04080f'; U.rRect(ctx,bx,by,bw,bh,3); ctx.fill();
    ctx.strokeStyle = U.rgba(CFG.C.BORDER,.6); ctx.lineWidth=1; U.rRect(ctx,bx,by,bw,bh,3); ctx.stroke();
    if (pct > 0) {
      ctx.fillStyle = shCol; ctx.shadowColor = shCol; ctx.shadowBlur = 10;
      U.rRect(ctx, bx+2, by+2, (bw-4)*pct, bh-4, 2); ctx.fill();
      ctx.shadowBlur = 0;
    }
    // Segment dividers
    ctx.strokeStyle = U.rgba(CFG.C.BORDER,.25); ctx.lineWidth=.5;
    for(let i=1;i<10;i++){const sx=bx+bw/10*i; ctx.beginPath(); ctx.moveTo(sx,by+2); ctx.lineTo(sx,by+bh-2); ctx.stroke();}
    label(ctx, CFG.W/2, by+bh+12, Math.ceil(pct*100)+'%', CFG.C.TEXT, 10, 'center');

    // ── Lives ──────────────────────────────────────────────────
    label(ctx, CFG.W-230, 13, 'HULL', CFG.C.DIM, 9);
    for(let i=0;i<CFG.LIVES;i++){
      const alive = i < Player.lives;
      ctx.fillStyle = alive ? CFG.C.GOLD : U.rgba(CFG.C.GOLD,.2);
      if (alive) { ctx.shadowColor=CFG.C.GOLD; ctx.shadowBlur=8; }
      ctx.font='18px Arial'; ctx.fillText('◈', CFG.W-228+i*28, 38);
      ctx.shadowBlur=0;
    }

    // ── Torpedo count ──────────────────────────────────────────
    label(ctx, CFG.W-112, 13, 'TORPEDO', CFG.C.DIM, 9);
    ctx.fillStyle = Player.torpedoes > 0 ? CFG.C.BLUE : U.rgba(CFG.C.BLUE,.3);
    ctx.font = 'bold 28px monospace';
    ctx.shadowColor = Player.torpedoes > 0 ? CFG.C.BLUE : 'transparent'; ctx.shadowBlur=6;
    ctx.fillText(String(Player.torpedoes).padStart(2,'0'), CFG.W-108, 40);
    ctx.shadowBlur = 0;

    // Torpedo recharge arc
    if (Player.torpedoes < CFG.TORPEDO_MAX) {
      const rp = Player.rechargeProgress;
      const rx2=CFG.W-82, ry2=44, rr2=7;
      ctx.strokeStyle=U.rgba(CFG.C.BLUE,.2); ctx.lineWidth=2;
      ctx.beginPath(); ctx.arc(rx2,ry2,rr2,0,Math.PI*2); ctx.stroke();
      ctx.strokeStyle=CFG.C.BLUE; ctx.shadowColor=CFG.C.BLUE; ctx.shadowBlur=8;
      ctx.beginPath(); ctx.arc(rx2,ry2,rr2,-Math.PI/2,-Math.PI/2+rp*Math.PI*2); ctx.stroke();
      ctx.shadowBlur=0;
    }

    // ── Wave badge ─────────────────────────────────────────────
    ctx.fillStyle = U.rgba(CFG.C.BORDER,.5); ctx.font='bold 9px monospace';
    ctx.textAlign='right'; ctx.fillText(`WAVE ${String(wave).padStart(2,'0')}`, CFG.W-6, 48);
    ctx.textAlign='left';
  }

  // ── LEFT PANEL (LCARS-style) ───────────────────────────────────
  function drawLeft(ctx) {
    const PW=155, PH=262, PX=0, PY=52;
    ctx.fillStyle=CFG.C.BG; ctx.fillRect(PX,PY,PW,PH);
    ctx.fillStyle=CFG.C.BORDER; ctx.fillRect(PX+PW-2,PY,2,PH);

    // Top LCARS rounded corner cap
    ctx.fillStyle='#3a2a10';
    U.rRect(ctx, PX, PY, PW-2, 28, [14,14,0,0]); ctx.fill();
    label(ctx, PX+12, PY+18, 'CAPT. J.L. PICARD', CFG.C.GOLD, 8);

    // Ship name bar
    ctx.fillStyle='#1a1a2a';
    ctx.fillRect(PX, PY+28, PW-2, 14);
    label(ctx, PX+8, PY+38, 'U.S.S. ENTERPRISE-D', U.rgba(CFG.C.BORDER,.7), 7);

    // Portrait frame
    const fX=PX+8, fY=PY+48, fW=PW-18, fH=80;
    ctx.fillStyle='#060e18';
    ctx.strokeStyle=CFG.C.BORDER; ctx.lineWidth=1.5;
    ctx.fillRect(fX,fY,fW,fH);
    ctx.strokeRect(fX,fY,fW,fH);
    _drawPicard(ctx, fX, fY, fW, fH);

    // Status bars with LCARS labels
    const statusBars = [
      { label:'WARP CORE',  val: 1.0,                          col:'#00e5ff', unit:'100%' },
      { label:'SHIELD PWR', val: Player.shields/CFG.SHIELD_MAX, col:Player.shields/CFG.SHIELD_MAX>.5?'#38ef7d':'#ffaa00', unit: Math.ceil(Player.shields)+'%' },
      { label:'PHASER NRG', val: 0.72,                         col:'#cc44ff', unit: '72%' },
    ];
    statusBars.forEach(({label:lbl, val, col, unit}, i) => {
      const bx=PX+6, by=fY+fH+12+i*30;
      // LCARS pill header
      ctx.fillStyle=col; ctx.globalAlpha=.15;
      ctx.fillRect(bx, by-10, PW-14, 12);
      ctx.globalAlpha=1;
      label(ctx, bx+2, by, lbl, col, 7);
      label(ctx, PX+PW-22, by, unit, col, 7, 'right');
      bar(ctx, bx, by+2, PW-14, 9, val, col);
    });

    // ENGINEERING DATA header
    const edY = fY+fH+12+3*30+4;
    ctx.fillStyle='#1a1a00';
    ctx.fillRect(PX, edY, PW-2, 14);
    label(ctx, PX+6, edY+10, 'ENGINEERING DATA', U.rgba(CFG.C.GOLD,.8), 8);

    const edItems = ['EPS CONDUITS: STABLE','IMPULSE DRIVE: ONLINE','IMPULSE DRIVE: ONLINE'];
    edItems.forEach((txt, i) => {
      const iy = edY+20+i*14;
      ctx.fillStyle=i%2===0?'#070e16':'#050b12'; ctx.fillRect(PX,iy,PW-2,14);
      // Green dot
      ctx.fillStyle='#38ef7d'; ctx.beginPath(); ctx.arc(PX+9,iy+7,3,0,Math.PI*2); ctx.fill();
      label(ctx, PX+18, iy+10, txt, U.rgba(CFG.C.TEXT,.7), 7);
    });
  }

  // Captain Picard placeholder (silhouette + TNG colors)
  function _drawPicard(ctx, x, y, w, h) {
    ctx.save(); ctx.translate(x+w/2, y+h/2);
    // Dark bg gradient
    const bg=ctx.createLinearGradient(0,-h/2,0,h/2);
    bg.addColorStop(0,'#0a1830'); bg.addColorStop(1,'#060e1a');
    ctx.fillStyle=bg; ctx.fillRect(-w/2,-h/2,w,h);
    // Uniform (maroon/black TNG)
    ctx.fillStyle='#1a0808';
    ctx.beginPath(); ctx.ellipse(0,h*.22,w*.38,h*.35,0,0,Math.PI*2); ctx.fill();
    ctx.fillStyle='#2a0808';
    ctx.beginPath(); ctx.ellipse(0,h*.14,w*.28,h*.28,0,0,Math.PI*2); ctx.fill();
    // Head shape
    ctx.fillStyle='#c8a882';
    ctx.beginPath(); ctx.ellipse(0,-h*.12,w*.18,h*.22,0,0,Math.PI*2); ctx.fill();
    ctx.fillStyle='#b89868'; ctx.beginPath(); ctx.ellipse(0,-h*.05,w*.17,h*.1,0,0,Math.PI*2); ctx.fill();
    // Eyes
    ctx.fillStyle='#1a1008';
    ctx.beginPath(); ctx.ellipse(-w*.055,-h*.14,2.5,2,0,0,Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.ellipse( w*.055,-h*.14,2.5,2,0,0,Math.PI*2); ctx.fill();
    // Comm badge gold
    ctx.fillStyle=CFG.C.GOLD; ctx.shadowColor=CFG.C.GOLD; ctx.shadowBlur=4;
    ctx.font='10px Arial'; ctx.textAlign='center'; ctx.fillText('✦',2,h*.08);
    ctx.shadowBlur=0;
    // Scanlines
    ctx.globalAlpha=.06; ctx.strokeStyle='#4488cc'; ctx.lineWidth=1;
    for(let sy=-h/2;sy<h/2;sy+=3){ctx.beginPath();ctx.moveTo(-w/2,sy);ctx.lineTo(w/2,sy);ctx.stroke();}
    ctx.restore();
  }

  // ── RIGHT PANEL (Tactical Grid / Ship Systems) ─────────────────
  function drawRight(ctx) {
    const PW=155, PX=CFG.W-PW, PY=52, PH=262;
    ctx.fillStyle=CFG.C.BG; ctx.fillRect(PX,PY,PW,PH);
    ctx.fillStyle=CFG.C.BORDER; ctx.fillRect(PX,PY,2,PH);

    let cy=PY+4;

    // TACTICAL GRID header
    ctx.fillStyle='#102030'; ctx.fillRect(PX+2,cy,PW-2,16); cy+=16;
    label(ctx, PX+10, cy-4, 'TACTICAL GRID', U.rgba(CFG.C.BORDER,.9), 9);
    block(ctx,PX+4,cy, PW-8,16, '#4488ff','COORD '+String(Math.floor(Player.x)).padStart(4,'0'), true); cy+=20;
    block(ctx,PX+4,cy, PW-8,16, '#4488ff','SCANNER FEED', false); cy+=22;

    // SHIP SYSTEMS header
    ctx.fillStyle='#102030'; ctx.fillRect(PX+2,cy,PW-2,16); cy+=16;
    label(ctx, PX+10, cy-4, 'SHIP SYSTEMS', U.rgba(CFG.C.BORDER,.9), 9);
    block(ctx,PX+4,cy, PW-8,16, '#38ef7d','TARGET LOCK', Enemies.list.length>0); cy+=20;
    block(ctx,PX+4,cy, PW-8,16, '#38ef7d','SHIP STATS', false); cy+=20;
    block(ctx,PX+4,cy, PW-8,16, '#38ef7d','SENSOR FEED', false); cy+=22;

    // DAMAGE CONTROL header
    ctx.fillStyle='#200808'; ctx.fillRect(PX+2,cy,PW-2,16); cy+=16;
    label(ctx, PX+10, cy-4, 'DAMAGE CONTROL', U.rgba(CFG.C.ALERT,.8), 9);
    const shOk = Player.shields/CFG.SHIELD_MAX > .5;
    block(ctx,PX+4,cy, PW-8,16, shOk?'#38ef7d':CFG.C.ALERT,'TARGET LOCK', true); cy+=20;
    block(ctx,PX+4,cy, PW-8,16, Player.torpedoes>0?CFG.C.TORPEDO:'#555','PHOTON TORP', Player.torpedoes>0); cy+=20;
    block(ctx,PX+4,cy, PW-8,16, CFG.C.TORPEDO,'PHOTON TORPS: '+String(Player.torpedoes).padStart(2,' '), Player.torpedoes>0); cy+=20;
  }

  // ── BOTTOM BAR ─────────────────────────────────────────────────
  function drawBottom(ctx) {
    const bh=78, by=CFG.H-bh;
    ctx.fillStyle=CFG.C.BG; ctx.fillRect(0,by,CFG.W,bh);
    ctx.fillStyle=CFG.C.BORDER; ctx.fillRect(0,by,CFG.W,2);
    ctx.fillStyle=U.rgba(CFG.C.BORDER,.15); ctx.fillRect(0,CFG.H-3,CFG.W,3);

    // TACTICAL OVERLAY label
    ctx.fillStyle='#0e1a24'; ctx.fillRect(155,by,800,18);
    label(ctx, 165, by+13, 'TACTICAL OVERLAY', U.rgba(CFG.C.BORDER,.7), 9);

    // Bottom status buttons strip
    const tabs = ['WEAPON STATUS','NAVIGATIONAL SENSORS','ENEMY ANALYSIS'];
    const tw = 220, tgap = 4, tx0 = 155;
    tabs.forEach((t,i)=>{
      const tx=tx0+i*(tw+tgap);
      const active=i===0;
      ctx.fillStyle=active?'#0d2030':'#080e18';
      ctx.fillRect(tx, by+18, tw, 20);
      ctx.strokeStyle=active?CFG.C.BORDER:U.rgba(CFG.C.BORDER,.3); ctx.lineWidth=active?1:.5;
      ctx.strokeRect(tx,by+18,tw,20);
      label(ctx, tx+tw/2, by+31, t, active?CFG.C.TEXT:CFG.C.DIM, 8, 'center');
    });

    // Weapon icons bar
    const icons=[
      {ic:'⊕',  lbl:'PHASER',   col:'#ff8832', active:true},
      {ic:'◉',  lbl:'PHOTON',   col:CFG.C.BLUE, active:Player.torpedoes>0},
      {ic:'⬡',  lbl:'SHIELDS',  col:CFG.C.BLUE, active:true},
      {ic:'▲',  lbl:'BOOST',    col:'#38ef7d',  active:false},
      {ic:'◎',  lbl:'LOCK-ON',  col:'#ffcc00',  active:false},
      {ic:'✦',  lbl:'SPECIAL',  col:'#cc44ff',  active:false},
    ];
    const iw=52, ih=46, igap=4, ix0=175;
    icons.forEach(({ic,lbl,col,active},i)=>{
      const ix=ix0+i*(iw+igap), iy=by+36;
      ctx.fillStyle=active?'#0d1c2c':'#080e18';
      U.rRect(ctx,ix,iy,iw,ih,5); ctx.fill();
      ctx.strokeStyle=active?U.rgba(col,.8):U.rgba(col,.2); ctx.lineWidth=active?1.2:.5;
      U.rRect(ctx,ix,iy,iw,ih,5); ctx.stroke();
      ctx.fillStyle=active?col:U.rgba(col,.3);
      if(active){ctx.shadowColor=col;ctx.shadowBlur=10;}
      ctx.font='18px Arial'; ctx.textAlign='center';
      ctx.fillText(ic, ix+iw/2, iy+26); ctx.shadowBlur=0;
      label(ctx, ix+iw/2, iy+ih-4, lbl, active?CFG.C.TEXT:CFG.C.DIM, 7, 'center');
    });

    // Tactical radar (right side, above Nova)
    const rx=CFG.W-200, ry=by+42, rr=28;
    ctx.strokeStyle=U.rgba(CFG.C.BORDER,.5); ctx.lineWidth=1;
    ctx.beginPath(); ctx.arc(rx,ry,rr,0,Math.PI*2); ctx.stroke();
    ctx.beginPath(); ctx.arc(rx,ry,rr*.55,0,Math.PI*2); ctx.stroke();
    ctx.strokeStyle=U.rgba(CFG.C.BORDER,.2);
    ctx.beginPath();ctx.moveTo(rx-rr,ry);ctx.lineTo(rx+rr,ry);ctx.stroke();
    ctx.beginPath();ctx.moveTo(rx,ry-rr);ctx.lineTo(rx,ry+rr);ctx.stroke();

    // Player dot
    const pry=ry+((Player.y-CFG.PLAYER_Y0)/(CFG.PLAYER_Y_MAX-CFG.PLAYER_Y_MIN))*rr*.6;
    ctx.fillStyle=CFG.C.BLUE; ctx.shadowColor=CFG.C.BLUE; ctx.shadowBlur=6;
    ctx.beginPath(); ctx.arc(rx, pry, 3.5,0,Math.PI*2); ctx.fill(); ctx.shadowBlur=0;

    // Enemy dots
    for(const e of Enemies.list){
      if(e.dead||e.scale<.04) continue;
      const ex=rx+(e.worldX/650)*rr;
      const ey=ry-(1-e.z/CFG.Z_SPAWN)*rr;
      const isBorg=e.type.startsWith('borg');
      ctx.fillStyle=isBorg?'#00ff44':'#ff4400';
      ctx.beginPath();
      ctx.arc(U.clamp(ex,rx-rr+3,rx+rr-3),U.clamp(ey,ry-rr+3,ry+rr-3),2.5,0,Math.PI*2);
      ctx.fill();
    }
    label(ctx, rx, by+bh-5, 'TACTICAL', CFG.C.DIM, 8, 'center');
  }

  // ── NOVA BUTTON ────────────────────────────────────────────────
  function drawNovaButton(ctx) {
    const bx=CFG.NOVA_BTN_X, by_=CFG.NOVA_BTN_Y, br=CFG.NOVA_BTN_R;
    const ready=Nova.ready, pct=Nova.cooldownPct;

    ctx.save();
    // Glow ring
    if(ready){ctx.shadowColor='#44aaff'; ctx.shadowBlur=22;}
    ctx.beginPath(); ctx.arc(bx,by_,br,0,Math.PI*2);
    ctx.fillStyle=ready?'#0a1828':'#080e18'; ctx.fill();
    ctx.strokeStyle=ready?'#44aaff':'#1a3050'; ctx.lineWidth=ready?2:1.5; ctx.stroke();
    ctx.shadowBlur=0;

    // Cooldown fill
    if(!ready&&pct>0){
      ctx.beginPath(); ctx.moveTo(bx,by_);
      ctx.arc(bx,by_,br-2,-Math.PI/2,-Math.PI/2+pct*Math.PI*2); ctx.closePath();
      ctx.fillStyle='rgba(30,70,120,.38)'; ctx.fill();
    }
    // Progress arc
    if(!ready){
      ctx.strokeStyle=U.rgba(CFG.C.BLUE,.5); ctx.lineWidth=3;
      ctx.beginPath(); ctx.arc(bx,by_,br-1,-Math.PI/2,-Math.PI/2+pct*Math.PI*2); ctx.stroke();
    }

    // Icon
    if(ready&&Math.sin(Date.now()/350)>-.3){ctx.shadowColor='#44aaff';ctx.shadowBlur=18;}
    ctx.fillStyle=ready?'#88ccff':'#2a4a6a';
    ctx.font='26px Arial'; ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillText('◎', bx, by_-7); ctx.shadowBlur=0;

    // Label
    if(ready){
      label(ctx,bx,by_+14,'NOVA',CFG.C.TEXT,9,'center');
      if(Math.sin(Date.now()/380)>0){
        ctx.fillStyle='#44aaff'; ctx.font='bold 8px monospace'; ctx.textAlign='center';
        ctx.fillText('READY',bx,by_+25);
      }
    } else {
      ctx.fillStyle='#44aaff'; ctx.font='bold 13px monospace'; ctx.textAlign='center';
      ctx.fillText(Math.ceil(Nova.cooldown)+'s',bx,by_+13);
      label(ctx,bx,by_+25,'NOVA','#1a3050',8,'center');
    }
    ctx.textAlign='left'; ctx.textBaseline='alphabetic';
    ctx.restore();
  }

  // ── ALERT OVERLAY ──────────────────────────────────────────────
  function drawAlerts(ctx) {
    if(!alerts.length) return;
    const top=alerts[0];
    const a=Math.min(1,top.timer*3);
    ctx.save(); ctx.globalAlpha=a;
    const aw=440,ah=38,ax=(CFG.W-aw)/2,ay=60;
    ctx.fillStyle='#1e0000'; U.rRect(ctx,ax,ay,aw,ah,4); ctx.fill();
    ctx.strokeStyle=CFG.C.ALERT; ctx.lineWidth=1.5; U.rRect(ctx,ax,ay,aw,ah,4); ctx.stroke();
    const blink=Math.sin(tick*9)>0||top.timer>top.maxTimer*.7;
    ctx.fillStyle=blink?CFG.C.ALERT:U.rgba(CFG.C.ALERT,.5);
    ctx.font='bold 13px monospace'; ctx.textAlign='center';
    ctx.fillText(top.text,CFG.W/2,ay+25);
    ctx.textAlign='left'; ctx.restore();
  }

  // ── FLOAT SCORES ───────────────────────────────────────────────
  function drawFloats(ctx) {
    for(const f of floatScores){
      ctx.save(); ctx.globalAlpha=f.life/f.maxLife;
      ctx.fillStyle=CFG.C.GOLD; ctx.font='bold 15px monospace';
      ctx.textAlign='center'; ctx.fillText(f.text,f.x,f.y);
      ctx.textAlign='left'; ctx.restore();
    }
  }

  // ── CORNER BRACKETS ────────────────────────────────────────────
  function drawCorners(ctx) {
    const s=18, col=CFG.C.BORDER;
    Draw.corner(ctx,155,52,s,1,col);  Draw.corner(ctx,CFG.W-155,52,s,-1,col);
    Draw.corner(ctx,155,CFG.H-78,s,1,col); Draw.corner(ctx,CFG.W-155,CFG.H-78,s,-1,col);
  }

  // ══════════════════════════════════════════════════════════════
  return {
    init()  { alerts=[]; floatScores=[]; tick=0; },

    alert(text, ms) {
      alerts.unshift({text,timer:ms/1000,maxTimer:ms/1000});
      if(alerts.length>3) alerts.pop();
    },

    floatScore(text, x, y) {
      floatScores.push({text,x,y,life:1.6,maxLife:1.6});
    },

    render(ctx, score, wave, dt) {
      tick += dt;
      alerts      = alerts.filter(a=>{a.timer-=dt;return a.timer>0;});
      floatScores = floatScores.filter(f=>{f.life-=dt;f.y-=28*dt;return f.life>0;});

      drawTop    (ctx, score, wave);
      drawLeft   (ctx);
      drawRight  (ctx);
      drawBottom (ctx);
      drawCorners(ctx);
      drawNovaButton(ctx);
      drawAlerts (ctx);
      drawFloats (ctx);
    }
  };
})();
