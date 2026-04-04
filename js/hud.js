'use strict';

/**
 * HUD — draws dynamic game data ON TOP of the hud_frame.png overlay.
 * The frame already has all the decorative LCARS panels.
 * We only render: scores, bars, status text, radar, Nova button — no backgrounds.
 */
const HUD = (() => {
  let alerts = [], floatScores = [], tick = 0;

  // ── Shared helpers ──────────────────────────────────────────────

  function txt(ctx, x, y, str, col, size, align) {
    ctx.fillStyle = col || CFG.C.DIM;
    ctx.font = `bold ${size||9}px monospace`;
    ctx.textAlign = align || 'left';
    ctx.fillText(str, x, y);
    ctx.textAlign = 'left';
  }

  function bar(ctx, x, y, w, h, pct, col) {
    // Transparent track
    ctx.fillStyle = 'rgba(0,0,0,.4)'; ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = U.rgba(col,.35); ctx.lineWidth=.7; ctx.strokeRect(x,y,w,h);
    if (pct > 0) {
      const fw = Math.max(0, (w-2)*pct);
      ctx.fillStyle = col;
      ctx.shadowColor = col; ctx.shadowBlur = 6;
      ctx.fillRect(x+1, y+1, fw, h-2);
      ctx.shadowBlur = 0;
    }
  }

  // ── TOP AREA (above frame, y=0 to FRAME_Y) ─────────────────────
  function drawTop(ctx, score, wave) {
    // Dark strip above frame
    ctx.fillStyle = '#050810'; ctx.fillRect(0, 0, CFG.W, CFG.FRAME_Y);
    ctx.fillStyle = U.rgba(CFG.C.BORDER,.5); ctx.fillRect(0, CFG.FRAME_Y-1, CFG.W, 1);

    const cy = CFG.FRAME_Y / 2 + 5;

    // Score
    txt(ctx, 14, cy - 10, 'SCORE', CFG.C.DIM, 9);
    ctx.fillStyle = CFG.C.GOLD; ctx.shadowColor = U.rgba(CFG.C.GOLD,.5); ctx.shadowBlur=8;
    ctx.font = 'bold 24px monospace';
    ctx.fillText(String(score).padStart(7,'0'), 12, cy + 14);
    ctx.shadowBlur = 0;

    // Shield bar (center)
    const pct = U.clamp(Player.shields / CFG.SHIELD_MAX, 0, 1);
    const shCol = pct > .5 ? CFG.C.BLUE : pct > .25 ? '#ffaa00' : '#ff3300';
    const bx=290, bw=480, by=12, bh=16;
    txt(ctx, CFG.W/2, 10, 'DEFLECTOR SHIELDS', CFG.C.DIM, 9, 'center');
    ctx.fillStyle='rgba(0,0,0,.5)'; U.rRect(ctx,bx,by,bw,bh,3); ctx.fill();
    ctx.strokeStyle=U.rgba(CFG.C.BORDER,.5); ctx.lineWidth=.8; U.rRect(ctx,bx,by,bw,bh,3); ctx.stroke();
    if (pct > 0) {
      ctx.fillStyle=shCol; ctx.shadowColor=shCol; ctx.shadowBlur=10;
      U.rRect(ctx, bx+2, by+2, (bw-4)*pct, bh-4, 2); ctx.fill(); ctx.shadowBlur=0;
    }
    // Segment ticks
    ctx.strokeStyle=U.rgba(CFG.C.BORDER,.2); ctx.lineWidth=.5;
    for(let i=1;i<10;i++){const sx=bx+bw/10*i;ctx.beginPath();ctx.moveTo(sx,by+2);ctx.lineTo(sx,by+bh-2);ctx.stroke();}
    txt(ctx, CFG.W/2, by+bh+12, Math.ceil(pct*100)+'%', CFG.C.TEXT, 10, 'center');

    // Lives
    txt(ctx, CFG.W-230, cy-10, 'HULL', CFG.C.DIM, 9);
    for(let i=0;i<CFG.LIVES;i++){
      const alive=i<Player.lives;
      ctx.fillStyle=alive?CFG.C.GOLD:U.rgba(CFG.C.GOLD,.18);
      if(alive){ctx.shadowColor=CFG.C.GOLD;ctx.shadowBlur=8;}
      ctx.font='17px Arial'; ctx.fillText('◈', CFG.W-228+i*26, cy+12);
      ctx.shadowBlur=0;
    }

    // Torpedo
    txt(ctx, CFG.W-114, cy-10, 'TORPEDO', CFG.C.DIM, 9);
    ctx.fillStyle=Player.torpedoes>0?CFG.C.BLUE:U.rgba(CFG.C.BLUE,.3);
    ctx.shadowColor=Player.torpedoes>0?CFG.C.BLUE:'transparent'; ctx.shadowBlur=6;
    ctx.font='bold 26px monospace';
    ctx.fillText(String(Player.torpedoes).padStart(2,'0'), CFG.W-110, cy+14);
    ctx.shadowBlur=0;

    // Torpedo recharge arc
    if (Player.torpedoes < CFG.TORPEDO_MAX) {
      const rp=Player.rechargeProgress, rx2=CFG.W-84, ry2=cy+6, rr2=7;
      ctx.strokeStyle=U.rgba(CFG.C.BLUE,.2); ctx.lineWidth=2;
      ctx.beginPath(); ctx.arc(rx2,ry2,rr2,0,Math.PI*2); ctx.stroke();
      ctx.strokeStyle=CFG.C.BLUE; ctx.shadowColor=CFG.C.BLUE; ctx.shadowBlur=7;
      ctx.beginPath(); ctx.arc(rx2,ry2,rr2,-Math.PI/2,-Math.PI/2+rp*Math.PI*2); ctx.stroke();
      ctx.shadowBlur=0;
    }

    // Wave
    txt(ctx, CFG.W-6, cy+14, `WAVE ${String(wave).padStart(2,'0')}`, U.rgba(CFG.C.BORDER,.7), 9, 'right');
  }

  // ── LEFT PANEL — dynamic data only, no background ──────────────
  // Panel covers x=0–259, y=FRAME_Y–430 (above Engineering Data)
  function drawLeft(ctx) {
    const PX=8, PW=CFG.HUD_LEFT_W-10, FY=CFG.FRAME_Y;

    // Portrait area (frame has a box here)
    const portY = FY + 55, portH = 90, portW = PW - 10;
    _drawPicard(ctx, PX+2, portY, portW, portH);

    // Name labels over frame
    txt(ctx, PX+4, FY+20, 'CAPT. J.L. PICARD', CFG.C.GOLD, 8);
    txt(ctx, PX+4, FY+32, 'U.S.S. ENTERPRISE-D', U.rgba(CFG.C.BORDER,.7), 7);

    // Status bars (WARP CORE / SHIELD PWR / PHASER NRG)
    const bars=[
      {lbl:'WARP CORE', pct:1.0,                            col:'#00e5ff', unit:'100%'},
      {lbl:'SHIELD PWR', pct:Player.shields/CFG.SHIELD_MAX,  col:Player.shields/CFG.SHIELD_MAX>.5?'#38ef7d':'#ffaa00', unit:Math.ceil(Player.shields)+'%'},
      {lbl:'PHASER NRG', pct:0.72,                           col:'#cc44ff', unit:'72%'},
    ];
    const barsY = portY + portH + 8;
    bars.forEach(({lbl,pct,col,unit},i)=>{
      const by=barsY+i*28;
      txt(ctx, PX+2, by+9, lbl, col, 7);
      txt(ctx, PX+PW-2, by+9, unit, col, 7, 'right');
      bar(ctx, PX+2, by+11, PW-4, 9, pct, col);
    });

    // Engineering data items (small dots + text)
    const edY = barsY + 3*28 + 6;
    const items=['EPS CONDUITS: STABLE','IMPULSE DRIVE: ONLINE','IMPULSE DRIVE: ONLINE'];
    items.forEach((t,i)=>{
      const iy=edY+i*15;
      ctx.fillStyle='#38ef7d'; ctx.shadowColor='#38ef7d'; ctx.shadowBlur=4;
      ctx.beginPath(); ctx.arc(PX+7, iy+4, 3, 0, Math.PI*2); ctx.fill();
      ctx.shadowBlur=0;
      txt(ctx, PX+14, iy+8, t, U.rgba(CFG.C.TEXT,.65), 7);
    });
  }

  // ── RIGHT PANEL — dynamic data only ────────────────────────────
  // Panel covers x=1079–1280, y=FRAME_Y–435 (above Damage Control)
  function drawRight(ctx) {
    const PX=CFG.HUD_RIGHT_X+6, PW=CFG.W-CFG.HUD_RIGHT_X-8, FY=CFG.FRAME_Y;

    // TACTICAL GRID section
    txt(ctx, PX, FY+16, 'TACTICAL GRID', U.rgba(CFG.C.BORDER,.9), 9);

    // COORD — live player X coordinate
    const coordVal = 'COORD '+String(Math.floor(Player.x)).padStart(4,'0');
    ctx.fillStyle='rgba(30,60,120,.6)'; ctx.fillRect(PX-2, FY+20, PW, 16);
    ctx.strokeStyle=U.rgba(CFG.C.BLUE,.8); ctx.lineWidth=1; ctx.strokeRect(PX-2, FY+20, PW, 16);
    txt(ctx, PX+2, FY+32, coordVal, '#88ccff', 8);

    txt(ctx, PX+2, FY+52, 'SCANNER FEED', CFG.C.DIM, 8);
    ctx.fillStyle='rgba(20,40,80,.4)'; ctx.fillRect(PX-2, FY+56, PW, 16);
    ctx.strokeStyle=U.rgba(CFG.C.BLUE,.3); ctx.lineWidth=.6; ctx.strokeRect(PX-2, FY+56, PW, 16);

    // SHIP SYSTEMS
    txt(ctx, PX, FY+90, 'SHIP SYSTEMS', U.rgba(CFG.C.BORDER,.9), 9);
    const hasEnemies=Enemies.list.length>0;
    _rightBlock(ctx, PX, FY+94, PW, 'TARGET LOCK', hasEnemies?'#38ef7d':'#333355', hasEnemies);
    _rightBlock(ctx, PX, FY+112, PW, 'SHIP STATS', '#333355', false);
    _rightBlock(ctx, PX, FY+130, PW, 'SENSOR FEED', '#333355', false);

    // DAMAGE CONTROL — placed just above HUD_RIGHT_H boundary
    const dcY=CFG.HUD_RIGHT_H-100;
    txt(ctx, PX, dcY, 'DAMAGE CONTROL', U.rgba(CFG.C.ALERT,.9), 9);
    const shOk=Player.shields/CFG.SHIELD_MAX>.5;
    _rightBlock(ctx, PX, dcY+4, PW, 'TARGET LOCK', shOk?'#38ef7d':CFG.C.ALERT, true);
    _rightBlock(ctx, PX, dcY+22, PW, 'PHOTON TORP', Player.torpedoes>0?CFG.C.TORPEDO:'#333355', Player.torpedoes>0);
    // Torpedo count row
    ctx.fillStyle='rgba(10,20,50,.5)'; ctx.fillRect(PX-2, dcY+40, PW, 16);
    ctx.strokeStyle=U.rgba(CFG.C.TORPEDO,.35); ctx.lineWidth=.6; ctx.strokeRect(PX-2,dcY+40,PW,16);
    txt(ctx, PX+2, dcY+52, 'PHOTON TORPS: '+String(Player.torpedoes).padStart(2,' '), CFG.C.TORPEDO, 8);
  }

  function _rightBlock(ctx, x, y, w, label, col, active) {
    const bg = active ? 'rgba(10,30,60,.5)' : 'rgba(5,8,18,.4)';
    ctx.fillStyle=bg; ctx.fillRect(x-2, y, w, 16);
    if (active) {
      ctx.strokeStyle=U.rgba(col,.7); ctx.lineWidth=1; ctx.strokeRect(x-2,y,w,16);
      ctx.fillStyle=col; ctx.fillRect(x-2, y, 4, 16);   // left accent
    }
    txt(ctx, x+6, y+11, label, active?CFG.C.TEXT:CFG.C.DIM, 8);
  }

  // ── BOTTOM AREA (below frame game area, within frame) ──────────
  function drawBottom(ctx) {
    // Radar — inside frame bottom-left area
    const frameBottom = CFG.FRAME_Y + CFG.FRAME_H;
    const rx=CFG.HUD_LEFT_W+55, ry=frameBottom-35, rr=22;

    ctx.strokeStyle=U.rgba(CFG.C.BORDER,.5); ctx.lineWidth=1;
    ctx.beginPath(); ctx.arc(rx,ry,rr,0,Math.PI*2); ctx.stroke();
    ctx.beginPath(); ctx.arc(rx,ry,rr*.55,0,Math.PI*2); ctx.stroke();
    ctx.strokeStyle=U.rgba(CFG.C.BORDER,.2);
    ctx.beginPath();ctx.moveTo(rx-rr,ry);ctx.lineTo(rx+rr,ry);ctx.stroke();
    ctx.beginPath();ctx.moveTo(rx,ry-rr);ctx.lineTo(rx,ry+rr);ctx.stroke();

    // Player dot
    const pry=ry+((Player.y-CFG.PLAYER_Y0)/(CFG.PLAYER_Y_MAX-CFG.PLAYER_Y_MIN))*rr*.6;
    ctx.fillStyle=CFG.C.BLUE; ctx.shadowColor=CFG.C.BLUE; ctx.shadowBlur=6;
    ctx.beginPath(); ctx.arc(rx,pry,3,0,Math.PI*2); ctx.fill(); ctx.shadowBlur=0;

    // Enemy dots
    for(const e of Enemies.list){
      if(e.dead||e.scale<.04) continue;
      const ex=rx+(e.worldX/600)*rr;
      const ey=ry-(1-e.z/CFG.Z_SPAWN)*rr;
      ctx.fillStyle=e.type.startsWith('borg')?'#00ff44':'#ff4400';
      ctx.beginPath();
      ctx.arc(U.clamp(ex,rx-rr+2,rx+rr-2),U.clamp(ey,ry-rr+2,ry+rr-2),2.5,0,Math.PI*2);
      ctx.fill();
    }
    txt(ctx,rx,frameBottom-6,'RADAR',CFG.C.DIM,7,'center');
  }

  // Captain Picard portrait
  function _drawPicard(ctx, x, y, w, h) {
    ctx.save(); ctx.translate(x+w/2, y+h/2);
    const bg=ctx.createLinearGradient(0,-h/2,0,h/2);
    bg.addColorStop(0,'rgba(10,24,48,.7)'); bg.addColorStop(1,'rgba(6,14,26,.7)');
    ctx.fillStyle=bg; ctx.fillRect(-w/2,-h/2,w,h);
    ctx.strokeStyle=U.rgba(CFG.C.BORDER,.5); ctx.lineWidth=1; ctx.strokeRect(-w/2,-h/2,w,h);
    // Uniform
    ctx.fillStyle='rgba(28,8,8,.85)';
    ctx.beginPath(); ctx.ellipse(0,h*.22,w*.38,h*.35,0,0,Math.PI*2); ctx.fill();
    ctx.fillStyle='rgba(42,10,10,.75)';
    ctx.beginPath(); ctx.ellipse(0,h*.14,w*.28,h*.28,0,0,Math.PI*2); ctx.fill();
    // Head
    ctx.fillStyle='#c8a882';
    ctx.beginPath(); ctx.ellipse(0,-h*.12,w*.18,h*.22,0,0,Math.PI*2); ctx.fill();
    ctx.fillStyle='#b89868';
    ctx.beginPath(); ctx.ellipse(0,-h*.05,w*.17,h*.1,0,0,Math.PI*2); ctx.fill();
    // Eyes
    ctx.fillStyle='#1a1008';
    ctx.beginPath(); ctx.ellipse(-w*.055,-h*.14,2.2,1.8,0,0,Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.ellipse( w*.055,-h*.14,2.2,1.8,0,0,Math.PI*2); ctx.fill();
    // Comm badge
    ctx.fillStyle=CFG.C.GOLD; ctx.shadowColor=CFG.C.GOLD; ctx.shadowBlur=4;
    ctx.font='9px Arial'; ctx.textAlign='center'; ctx.fillText('✦',1,h*.08);
    ctx.shadowBlur=0;
    ctx.restore();
  }

  // ── NOVA BUTTON ────────────────────────────────────────────────
  function drawNovaButton(ctx) {
    const bx=CFG.NOVA_BTN_X, by_=CFG.NOVA_BTN_Y, br=CFG.NOVA_BTN_R;
    const ready=Nova.ready, pct=Nova.cooldownPct;

    ctx.save();
    if(ready){ctx.shadowColor='#44aaff';ctx.shadowBlur=22;}
    ctx.beginPath();ctx.arc(bx,by_,br,0,Math.PI*2);
    ctx.fillStyle=ready?'#0a1828':'#080e18';ctx.fill();
    ctx.strokeStyle=ready?'#44aaff':'#1a3050';ctx.lineWidth=ready?2:1.5;ctx.stroke();
    ctx.shadowBlur=0;
    if(!ready&&pct>0){
      ctx.beginPath();ctx.moveTo(bx,by_);
      ctx.arc(bx,by_,br-2,-Math.PI/2,-Math.PI/2+pct*Math.PI*2);ctx.closePath();
      ctx.fillStyle='rgba(30,70,120,.38)';ctx.fill();
    }
    if(!ready){
      ctx.strokeStyle=U.rgba(CFG.C.BLUE,.5);ctx.lineWidth=3;
      ctx.beginPath();ctx.arc(bx,by_,br-1,-Math.PI/2,-Math.PI/2+pct*Math.PI*2);ctx.stroke();
    }
    if(ready&&Math.sin(Date.now()/350)>-.3){ctx.shadowColor='#44aaff';ctx.shadowBlur=18;}
    ctx.fillStyle=ready?'#88ccff':'#2a4a6a';
    ctx.font='24px Arial';ctx.textAlign='center';ctx.textBaseline='middle';
    ctx.fillText('◎',bx,by_-6);ctx.shadowBlur=0;
    if(ready){
      txt(ctx,bx,by_+12,'NOVA',CFG.C.TEXT,8,'center');
      if(Math.sin(Date.now()/380)>0){
        ctx.fillStyle='#44aaff';ctx.font='bold 7px monospace';ctx.textAlign='center';
        ctx.fillText('READY',bx,by_+22);
      }
    } else {
      ctx.fillStyle='#44aaff';ctx.font='bold 12px monospace';ctx.textAlign='center';
      ctx.fillText(Math.ceil(Nova.cooldown)+'s',bx,by_+12);
    }
    ctx.textAlign='left';ctx.textBaseline='alphabetic';ctx.restore();
  }

  // ── ALERTS ─────────────────────────────────────────────────────
  function drawAlerts(ctx) {
    if(!alerts.length) return;
    const top=alerts[0];
    const a=Math.min(1,top.timer*3);
    ctx.save();ctx.globalAlpha=a;
    const aw=440,ah=36,ax=(CFG.W-aw)/2,ay=CFG.FRAME_Y+10;
    ctx.fillStyle='rgba(30,0,0,.85)';U.rRect(ctx,ax,ay,aw,ah,4);ctx.fill();
    ctx.strokeStyle=CFG.C.ALERT;ctx.lineWidth=1.5;U.rRect(ctx,ax,ay,aw,ah,4);ctx.stroke();
    const blink=Math.sin(tick*9)>0||top.timer>top.maxTimer*.7;
    ctx.fillStyle=blink?CFG.C.ALERT:U.rgba(CFG.C.ALERT,.5);
    ctx.font='bold 13px monospace';ctx.textAlign='center';
    ctx.fillText(top.text,CFG.W/2,ay+24);
    ctx.textAlign='left';ctx.restore();
  }

  function drawFloats(ctx) {
    for(const f of floatScores){
      ctx.save();ctx.globalAlpha=f.life/f.maxLife;
      ctx.fillStyle=CFG.C.GOLD;ctx.font='bold 14px monospace';
      ctx.textAlign='center';ctx.fillText(f.text,f.x,f.y);
      ctx.textAlign='left';ctx.restore();
    }
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
      tick+=dt;
      alerts      = alerts.filter(a=>{a.timer-=dt;return a.timer>0;});
      floatScores = floatScores.filter(f=>{f.life-=dt;f.y-=28*dt;return f.life>0;});

      drawTop    (ctx, score, wave);
      drawLeft   (ctx);
      drawRight  (ctx);
      drawBottom (ctx);
      drawNovaButton(ctx);
      drawAlerts (ctx);
      drawFloats (ctx);
    }
  };
})();
