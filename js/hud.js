'use strict';

const HUD = (() => {
  let alerts = [], floatScores = [], tick = 0, gameDt = .016;

  // ── Captain portrait (Picard silhouette) ──────────────────────────
  function drawPortrait(ctx, x, y, w, h) {
    ctx.save(); ctx.translate(x+w/2, y+h/2);
    // Bg
    const bg = ctx.createRadialGradient(0,-4,4, 0,0,w/2);
    bg.addColorStop(0,'#1a2840'); bg.addColorStop(1,'#0c1520');
    ctx.fillStyle=bg; ctx.fillRect(-w/2,-h/2,w,h);
    // Head
    ctx.fillStyle='#8899aa';
    ctx.beginPath(); ctx.ellipse(0,-8,18,22,0,0,Math.PI*2); ctx.fill();
    // Shoulders
    ctx.fillStyle='#1c2c3c';
    ctx.beginPath(); ctx.moveTo(-w/2,h/2); ctx.lineTo(-30,6); ctx.lineTo(30,6); ctx.lineTo(w/2,h/2); ctx.fill();
    // Uniform
    ctx.fillStyle='#243444';
    ctx.beginPath(); ctx.ellipse(0,20,24,18,0,0,Math.PI*2); ctx.fill();
    // Insignia
    ctx.fillStyle=CFG.C.GOLD; ctx.font='10px Arial'; ctx.textAlign='center';
    ctx.fillText('✦',0,27);
    // Scanlines
    ctx.globalAlpha=.08; ctx.strokeStyle='#4488cc'; ctx.lineWidth=1;
    for(let sy=-h/2;sy<h/2;sy+=3){ctx.beginPath();ctx.moveTo(-w/2,sy);ctx.lineTo(w/2,sy);ctx.stroke();}
    ctx.restore();
  }

  // ── LED status bar ─────────────────────────────────────────────────
  function ledBar(ctx, x, y, w, h, pct, col) {
    ctx.fillStyle='#08101a'; ctx.fillRect(x,y,w,h);
    ctx.strokeStyle=U.rgba(col,.4); ctx.lineWidth=.6; ctx.strokeRect(x,y,w,h);
    if (pct>0) {
      const fw=Math.max(0,(w-2)*pct);
      ctx.fillStyle=col; ctx.fillRect(x+1,y+1,fw,h-2);
    }
  }

  // ── Top bar ────────────────────────────────────────────────────────
  function drawTop(ctx, score, wave) {
    const H=52;
    ctx.fillStyle=CFG.C.BG; ctx.fillRect(0,0,CFG.W,H);
    ctx.fillStyle=CFG.C.BORDER; ctx.fillRect(0,H-2,CFG.W,2);
    ctx.fillStyle=U.rgba(CFG.C.BORDER,.25); ctx.fillRect(0,0,CFG.W,3);

    // Score
    ctx.fillStyle=CFG.C.DIM;  ctx.font='bold 10px "Courier New"'; ctx.fillText('SCORE',14,16);
    ctx.fillStyle=CFG.C.GOLD; ctx.font='bold 26px "Courier New"';
    ctx.fillText(String(score).padStart(7,'0'),12,42);

    // Shields bar (center)
    const bx=290,bw=500,by=14,bh=18;
    const pct=U.clamp(Player.shields/CFG.SHIELD_MAX,0,1);
    const col=pct>.5?CFG.C.BLUE:pct>.25?'#ffaa00':'#ff3300';

    ctx.fillStyle=CFG.C.DIM; ctx.font='bold 9px "Courier New"';
    ctx.textAlign='center'; ctx.fillText('DEFLECTOR SHIELDS',CFG.W/2,11); ctx.textAlign='left';

    ctx.fillStyle='#080e16'; U.rRect(ctx,bx,by,bw,bh,3); ctx.fill();
    ctx.strokeStyle=U.rgba(CFG.C.BORDER,.7); ctx.lineWidth=1; U.rRect(ctx,bx,by,bw,bh,3); ctx.stroke();

    if(pct>0){
      ctx.fillStyle=col;
      ctx.shadowColor=col; ctx.shadowBlur=8;
      U.rRect(ctx,bx+2,by+2,(bw-4)*pct,bh-4,2); ctx.fill();
      ctx.shadowBlur=0;
    }
    // Segments
    ctx.strokeStyle=U.rgba(CFG.C.BORDER,.35); ctx.lineWidth=.5;
    for(let i=1;i<10;i++){const sx=bx+bw/10*i;ctx.beginPath();ctx.moveTo(sx,by+2);ctx.lineTo(sx,by+bh-2);ctx.stroke();}

    ctx.fillStyle=CFG.C.TEXT; ctx.font='bold 11px "Courier New"';
    ctx.textAlign='center'; ctx.fillText(Math.ceil(pct*100)+'%',CFG.W/2,by+bh+12); ctx.textAlign='left';

    // Lives
    ctx.fillStyle=CFG.C.DIM; ctx.font='bold 9px "Courier New"'; ctx.fillText('HULL',CFG.W-225,13);
    for(let i=0;i<Player.lives;i++){
      ctx.fillStyle=CFG.C.GOLD; ctx.font='19px Arial';
      ctx.fillText('◈',CFG.W-223+i*30,38);
    }

    // Torpedo count
    ctx.fillStyle=CFG.C.DIM; ctx.font='bold 9px "Courier New"'; ctx.fillText('TORPEDO',CFG.W-108,13);
    ctx.fillStyle=Player.torpedoes>0?CFG.C.BLUE:CFG.C.DIM;
    ctx.font='bold 28px "Courier New"'; ctx.fillText(String(Player.torpedoes).padStart(2,'0'),CFG.W-104,40);

    // Recharge arc under torpedo count
    if (Player.torpedoes < CFG.TORPEDO_MAX) {
      const pct = Player.rechargeProgress;
      const rx2 = CFG.W-90, ry2 = 46, rr2 = 6;
      ctx.strokeStyle = U.rgba(CFG.C.BLUE, .3); ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(rx2, ry2, rr2, 0, Math.PI*2); ctx.stroke();
      ctx.strokeStyle = CFG.C.BLUE;
      ctx.shadowColor = CFG.C.BLUE; ctx.shadowBlur = 6;
      ctx.beginPath(); ctx.arc(rx2, ry2, rr2, -Math.PI/2, -Math.PI/2 + pct*Math.PI*2); ctx.stroke();
      ctx.shadowBlur = 0;
    }

    // Wave badge (top right)
    ctx.fillStyle=U.rgba(CFG.C.BORDER,.6); ctx.font='bold 9px "Courier New"';
    ctx.textAlign='right'; ctx.fillText(`WAVE ${String(wave).padStart(2,'0')}`,CFG.W-8,48); ctx.textAlign='left';
  }

  // ── Left panel ─────────────────────────────────────────────────────
  function drawLeft(ctx) {
    const pw=138,ph=190,px=0,py=52;
    ctx.fillStyle=CFG.C.BG; ctx.fillRect(px,py,pw,ph);
    ctx.fillStyle=CFG.C.BORDER; ctx.fillRect(px+pw-2,py,2,ph);

    // Portrait
    const fW=82,fH=82,fX=px+10,fY=py+10;
    ctx.fillStyle='#0c1520'; ctx.fillRect(fX,fY,fW,fH);
    ctx.strokeStyle=CFG.C.BORDER; ctx.lineWidth=1.5; ctx.strokeRect(fX,fY,fW,fH);
    drawPortrait(ctx,fX,fY,fW,fH);
    ctx.fillStyle=CFG.C.DIM; ctx.font='bold 9px "Courier New"';
    ctx.fillText('CAPT. PICARD',fX-2,fY+fH+14);

    // Status bars
    const bars=[
      {label:'SHD', val:Player.shields/CFG.SHIELD_MAX, col:CFG.C.BLUE},
      {label:'ENG', val:.88,                            col:'#38ef7d'},
      {label:'WRP', val:.74,                            col:'#aa44ff'},
    ];
    bars.forEach(({label,val,col},i)=>{
      const bx=fX,by=fY+fH+22+i*23;
      ctx.fillStyle=CFG.C.DIM; ctx.font='8px "Courier New"'; ctx.fillText(label,bx,by);
      ledBar(ctx,bx+22,by-9,fW+26,11,val,col);
    });
  }

  // ── Bottom bar ─────────────────────────────────────────────────────
  function drawBottom(ctx) {
    const bh=80,by=CFG.H-bh;
    ctx.fillStyle=CFG.C.BG; ctx.fillRect(0,by,CFG.W,bh);
    ctx.fillStyle=CFG.C.BORDER; ctx.fillRect(0,by,CFG.W,2);
    ctx.fillStyle=U.rgba(CFG.C.BORDER,.2); ctx.fillRect(0,CFG.H-4,CFG.W,4);

    // Weapon buttons
    const btns=[
      {label:'PHASERS', icon:'⚡',col:'#ff8832',active:true},
      {label:'PHOTONS', icon:'◉', col:CFG.C.TORPEDO,active:false},
      {label:'SHIELDS', icon:'⬡', col:CFG.C.BLUE,  active:true},
      {label:'BOOST',   icon:'▲', col:'#38ef7d',    active:false},
      {label:'LOCK-ON', icon:'◎', col:'#ffcc00',    active:false},
      {label:'SPECIAL', icon:'★', col:'#cc44ff',    active:false},
    ];
    const bw=122,bbh=56,gap=8;
    const sx=(CFG.W-btns.length*(bw+gap))/2+gap/2;

    btns.forEach((b,i)=>{
      const bx=sx+i*(bw+gap), bby=by+12;
      ctx.fillStyle=b.active?'#192234':'#10141e';
      U.rRect(ctx,bx,bby,bw,bbh,6); ctx.fill();
      ctx.strokeStyle=b.active?b.col:U.rgba(b.col,.28);
      ctx.lineWidth=b.active?1.5:.7; U.rRect(ctx,bx,bby,bw,bbh,6); ctx.stroke();

      ctx.fillStyle=b.active?b.col:U.rgba(b.col,.38);
      ctx.font='20px Arial'; ctx.textAlign='center';
      if(b.active){ctx.shadowColor=b.col;ctx.shadowBlur=14;}
      ctx.fillText(b.icon,bx+bw/2,bby+28); ctx.shadowBlur=0;

      ctx.fillStyle=b.active?CFG.C.TEXT:CFG.C.DIM;
      ctx.font='bold 8px "Courier New"'; ctx.fillText(b.label,bx+bw/2,bby+46);
      ctx.textAlign='left';

      if(b.active){
        ctx.fillStyle=b.col;
        ctx.beginPath(); ctx.arc(bx+10,bby+10,3,0,Math.PI*2); ctx.fill();
      }
    });

    // Tactical radar
    const rx=CFG.W-68,ry=by+42,rr=28;
    ctx.strokeStyle=U.rgba(CFG.C.BORDER,.5); ctx.lineWidth=1;
    ctx.beginPath(); ctx.arc(rx,ry,rr,0,Math.PI*2); ctx.stroke();
    ctx.beginPath(); ctx.arc(rx,ry,rr*.55,0,Math.PI*2); ctx.stroke();
    ctx.strokeStyle=U.rgba(CFG.C.BORDER,.2);
    ctx.beginPath();ctx.moveTo(rx-rr,ry);ctx.lineTo(rx+rr,ry);ctx.stroke();
    ctx.beginPath();ctx.moveTo(rx,ry-rr);ctx.lineTo(rx,ry+rr);ctx.stroke();

    // Player dot — Y position reflects actual vertical position
    const playerRadarY = ry + ((Player.y - CFG.PLAYER_Y0) / (CFG.PLAYER_Y_MAX - CFG.PLAYER_Y_MIN)) * rr * .6;
    ctx.fillStyle=CFG.C.BLUE;
    ctx.beginPath(); ctx.arc(rx, playerRadarY, 3.5, 0, Math.PI*2); ctx.fill();

    // Enemy dots
    for(const e of Enemies.list){
      if(e.dead||e.scale<.04) continue;
      const ex=rx+(e.worldX/650)*rr;
      const ey=ry-(1-e.z/CFG.Z_SPAWN)*rr;
      ctx.fillStyle=e.type==='borg'?'#00ff44':'#ff4400';
      ctx.beginPath();
      ctx.arc(U.clamp(ex,rx-rr+3,rx+rr-3),U.clamp(ey,ry-rr+3,ry+rr-3),2.5,0,Math.PI*2);
      ctx.fill();
    }

    ctx.fillStyle=CFG.C.DIM; ctx.font='8px "Courier New"';
    ctx.textAlign='center'; ctx.fillText('TACTICAL',rx,by+bh-6); ctx.textAlign='left';
  }

  // ── Red-alert overlay ──────────────────────────────────────────────
  function drawAlerts(ctx) {
    if(!alerts.length) return;
    const top=alerts[0];
    const a=Math.min(1,top.timer*3);
    ctx.save(); ctx.globalAlpha=a;

    const aw=420,ah=38,ax=(CFG.W-aw)/2,ay=60;
    ctx.fillStyle='#1e0000'; U.rRect(ctx,ax,ay,aw,ah,4); ctx.fill();
    ctx.strokeStyle=CFG.C.ALERT; ctx.lineWidth=1.5; U.rRect(ctx,ax,ay,aw,ah,4); ctx.stroke();

    const blink=Math.sin(tick*9)>0||top.timer>top.maxTimer*.7;
    ctx.fillStyle=blink?CFG.C.ALERT:U.rgba(CFG.C.ALERT,.5);
    ctx.font='bold 13px "Courier New"'; ctx.textAlign='center';
    ctx.fillText(top.text,CFG.W/2,ay+25);
    ctx.textAlign='left'; ctx.restore();
  }

  // ── Floating score labels ──────────────────────────────────────────
  function drawFloats(ctx) {
    for(const f of floatScores){
      ctx.save(); ctx.globalAlpha=f.life/f.maxLife;
      ctx.fillStyle=CFG.C.GOLD; ctx.font='bold 15px "Courier New"';
      ctx.textAlign='center'; ctx.fillText(f.text,f.x,f.y); ctx.textAlign='left';
      ctx.restore();
    }
  }

  // ── HUD border corners (decorative) ───────────────────────────────
  function drawCorners(ctx) {
    const s=18, col=CFG.C.BORDER;
    // Top-left (below top bar)
    Draw.corner(ctx,0,52,s,1,col); Draw.corner(ctx,CFG.W,52,s,-1,col);
    // Above bottom bar
    Draw.corner(ctx,0,CFG.H-80,s,1,col); Draw.corner(ctx,CFG.W,CFG.H-80,s,-1,col);
  }

  // ── Nova button ────────────────────────────────────────────────────
  function drawNovaButton(ctx) {
    const bx = CFG.NOVA_BTN_X, by = CFG.NOVA_BTN_Y, br = CFG.NOVA_BTN_R;
    const ready = Nova.ready;
    const pct   = Nova.cooldownPct;  // 0 = just fired → 1 = ready

    ctx.save();
    // Outer glow ring when ready
    if (ready) {
      ctx.shadowColor = '#44aaff'; ctx.shadowBlur = 22;
    }
    // Background
    ctx.beginPath(); ctx.arc(bx, by, br, 0, Math.PI*2);
    ctx.fillStyle = ready ? '#0a1828' : '#080e18'; ctx.fill();
    ctx.strokeStyle = ready ? '#44aaff' : '#1a3050';
    ctx.lineWidth = ready ? 2 : 1.5; ctx.stroke();
    ctx.shadowBlur = 0;

    // Cooldown fill arc (pie chart style)
    if (!ready && pct > 0) {
      ctx.beginPath();
      ctx.moveTo(bx, by);
      ctx.arc(bx, by, br-2, -Math.PI/2, -Math.PI/2 + pct*Math.PI*2);
      ctx.closePath();
      ctx.fillStyle = 'rgba(30,70,120,.38)'; ctx.fill();
    }

    // Cooldown border arc (progress ring)
    if (!ready) {
      ctx.strokeStyle = U.rgba(CFG.C.BLUE, .5); ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(bx, by, br-1, -Math.PI/2, -Math.PI/2 + pct*Math.PI*2);
      ctx.stroke();
    }

    // Icon
    if (ready && Math.sin(Date.now()/350) > -.3) {
      ctx.shadowColor = '#44aaff'; ctx.shadowBlur = 18;
    }
    ctx.fillStyle = ready ? '#88ccff' : '#2a4a6a';
    ctx.font = '26px Arial'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('◎', bx, by - 7);
    ctx.shadowBlur = 0;

    // Label / countdown
    if (ready) {
      ctx.fillStyle = CFG.C.TEXT; ctx.font = 'bold 9px "Courier New"';
      ctx.fillText('NOVA', bx, by + 14);
      // "READY" blink
      if (Math.sin(Date.now()/380) > 0) {
        ctx.fillStyle = '#44aaff'; ctx.font = 'bold 8px "Courier New"';
        ctx.fillText('READY', bx, by + 25);
      }
    } else {
      ctx.fillStyle = '#44aaff'; ctx.font = 'bold 13px "Courier New"';
      ctx.fillText(Math.ceil(Nova.cooldown) + 's', bx, by + 13);
      ctx.fillStyle = '#1a3050'; ctx.font = 'bold 8px "Courier New"';
      ctx.fillText('NOVA', bx, by + 25);
    }

    ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
    ctx.restore();
  }

  // ══════════════════════════════════════════════════════════════════
  return {
    init()  { alerts=[]; floatScores=[]; tick=0; },

    alert(text, ms) {
      alerts.unshift({text, timer:ms/1000, maxTimer:ms/1000});
      if(alerts.length>3) alerts.pop();
    },

    floatScore(text, x, y) {
      floatScores.push({text, x, y, life:1.6, maxLife:1.6});
    },

    render(ctx, score, wave, dt) {
      gameDt = dt;
      tick  += dt;
      alerts      = alerts.filter(a=>{a.timer-=dt;return a.timer>0;});
      floatScores = floatScores.filter(f=>{f.life-=dt;f.y-=28*dt;return f.life>0;});

      drawTop    (ctx, score, wave);
      drawLeft   (ctx);
      drawBottom (ctx);
      drawCorners(ctx);
      drawNovaButton(ctx);
      drawAlerts (ctx);
      drawFloats (ctx);
    }
  };
})();
