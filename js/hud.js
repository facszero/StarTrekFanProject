'use strict';

const HUD = (() => {
  let alerts = [], floatScores = [], tick = 0;
  let picardImg = null;

  function loadPicard() {
    if (picardImg) return;
    picardImg = new Image();
    picardImg.src = 'assets/sprites/picard.png';
  }

  // ── Helpers ─────────────────────────────────────────────────────

  function txt(ctx, x, y, str, col, size, align) {
    ctx.fillStyle = col || CFG.C.DIM;
    ctx.font = `bold ${size||9}px monospace`;
    ctx.textAlign = align || 'left';
    ctx.fillText(str, x, y);
    ctx.textAlign = 'left';
  }

  function solidBg(ctx, x, y, w, h, col) {
    ctx.fillStyle = col || '#060c18';
    ctx.fillRect(x, y, w, h);
  }

  function bar(ctx, x, y, w, h, pct, col, label, unit) {
    solidBg(ctx, x-2, y-2, w+4, h+14, '#070f1c');
    txt(ctx, x, y+8, label, col, 7);
    txt(ctx, x+w, y+8, unit, col, 7, 'right');
    ctx.fillStyle='#02050e'; ctx.fillRect(x,y+10,w,h);
    ctx.strokeStyle=U.rgba(col,.3); ctx.lineWidth=.7; ctx.strokeRect(x,y+10,w,h);
    if(pct>0){
      ctx.fillStyle=col; ctx.shadowColor=col; ctx.shadowBlur=5;
      ctx.fillRect(x+1,y+11,Math.max(0,(w-2)*pct),h-2);
      ctx.shadowBlur=0;
    }
  }

  function blockBtn(ctx, x, y, w, label, col, active) {
    const H=15;
    solidBg(ctx,x,y,w,H,active?'#0a1828':'#060c18');
    if(active){
      ctx.strokeStyle=U.rgba(col,.7);ctx.lineWidth=1;ctx.strokeRect(x,y,w,H);
      ctx.fillStyle=col;ctx.fillRect(x,y,4,H);
    }
    txt(ctx,x+(active?8:4),y+H-3,label,active?CFG.C.TEXT:U.rgba(CFG.C.DIM,.7),8);
  }

  function sectionHdr(ctx, x, y, w, label, col) {
    solidBg(ctx,x,y,w,15,'#0d1a26');
    ctx.fillStyle=U.rgba(col||CFG.C.BORDER,.15);ctx.fillRect(x,y,w,15);
    txt(ctx,x+4,y+11,label,col||U.rgba(CFG.C.BORDER,.9),9);
  }

  // ── TOP BAR (y=0..FRAME_Y, fully opaque) ───────────────────────
  function drawTop(ctx, score, wave) {
    solidBg(ctx,0,0,CFG.W,CFG.FRAME_Y,'#050810');
    ctx.fillStyle=U.rgba(CFG.C.BORDER,.45);ctx.fillRect(0,CFG.FRAME_Y-1,CFG.W,1);
    const cy=Math.round(CFG.FRAME_Y/2);

    // ── SCORE ───────────────────────────────────────────────────
    txt(ctx,14,cy-8,'SCORE',CFG.C.DIM,9);
    ctx.fillStyle=CFG.C.GOLD;ctx.shadowColor=U.rgba(CFG.C.GOLD,.5);ctx.shadowBlur=8;
    ctx.font='bold 22px monospace';
    ctx.fillText(String(score).padStart(7,'0'),12,cy+12);
    ctx.shadowBlur=0;

    // ── SHIELD BAR (narrower: bw 460→340) ─────────────────────
    const pct=U.clamp(Player.shields/CFG.SHIELD_MAX,0,1);
    const shCol=pct>.5?CFG.C.BLUE:pct>.25?'#ffaa00':'#ff3300';
    const bx=284, bw=340, by=8, bh=14;
    txt(ctx,CFG.W/2-80,7,'DEFLECTOR SHIELDS',CFG.C.DIM,8,'left');
    ctx.fillStyle='#02050e';U.rRect(ctx,bx,by,bw,bh,3);ctx.fill();
    ctx.strokeStyle=U.rgba(CFG.C.BORDER,.5);ctx.lineWidth=.8;U.rRect(ctx,bx,by,bw,bh,3);ctx.stroke();
    if(pct>0){
      ctx.fillStyle=shCol;ctx.shadowColor=shCol;ctx.shadowBlur=10;
      U.rRect(ctx,bx+1,by+1,(bw-2)*pct,bh-2,2);ctx.fill();ctx.shadowBlur=0;
    }
    ctx.strokeStyle=U.rgba(CFG.C.BORDER,.15);ctx.lineWidth=.5;
    for(let i=1;i<8;i++){const sx=bx+bw/8*i;ctx.beginPath();ctx.moveTo(sx,by+2);ctx.lineTo(sx,by+bh-2);ctx.stroke();}
    txt(ctx,bx+bw/2,by+bh+11,Math.ceil(pct*100)+'%',CFG.C.TEXT,9,'center');

    // ── WAVE BADGE (right of shield bar) ──────────────────────
    const wx2=bx+bw+10, wby=by;
    ctx.fillStyle='#0a1828'; ctx.fillRect(wx2,wby,78,bh+14);
    ctx.strokeStyle=U.rgba(CFG.C.BORDER,.5);ctx.lineWidth=.8;ctx.strokeRect(wx2,wby,78,bh+14);
    txt(ctx,wx2+4,wby+8,'WAVE',CFG.C.DIM,7);
    ctx.fillStyle=CFG.C.TEXT;ctx.shadowColor=U.rgba(CFG.C.TEXT,.4);ctx.shadowBlur=5;
    ctx.font='bold 16px monospace';ctx.textAlign='left';
    ctx.fillText(String(wave).padStart(2,'0'),wx2+30,wby+20);
    ctx.shadowBlur=0;

    // ── BORG ADAPTATION MINI (inline, after wave badge) ────────
    const adapt = typeof BorgAdaptation !== 'undefined' ? BorgAdaptation.level : 0;
    if (adapt > 2) {
      const ax=wx2+86, abw=170, aby=by, abh=bh+14;
      ctx.fillStyle='rgba(0,14,4,.85)';ctx.fillRect(ax,aby,abw,abh);
      ctx.strokeStyle=U.rgba('#00cc44',.4);ctx.lineWidth=.7;ctx.strokeRect(ax,aby,abw,abh);
      txt(ctx,ax+4,aby+8,'ADAPTATION',adapt>75?'#ff4444':adapt>40?'#ffaa00':'#00cc44',7);
      // mini bar
      ctx.fillStyle='#001400';ctx.fillRect(ax+4,aby+10,abw-8,6);
      const aCol=adapt>75?'#ff3333':adapt>40?'#ffaa00':'#00cc44';
      ctx.fillStyle=aCol;ctx.shadowColor=aCol;ctx.shadowBlur=4;
      ctx.fillRect(ax+4,aby+10,(abw-8)*(adapt/100),6);
      ctx.shadowBlur=0;
      txt(ctx,ax+abw-4,aby+21,Math.ceil(adapt)+'%',aCol,7,'right');
    }

    // ── LIVES ──────────────────────────────────────────────────
    txt(ctx,CFG.W-238,cy-8,'HULL',CFG.C.DIM,9);
    for(let i=0;i<CFG.LIVES;i++){
      const alive=i<Player.lives;
      ctx.fillStyle=alive?CFG.C.GOLD:U.rgba(CFG.C.GOLD,.18);
      if(alive){ctx.shadowColor=CFG.C.GOLD;ctx.shadowBlur=8;}
      ctx.font='16px Arial';ctx.fillText('◈',CFG.W-236+i*24,cy+11);ctx.shadowBlur=0;
    }

    // ── TORPEDO ────────────────────────────────────────────────
    txt(ctx,CFG.W-120,cy-8,'TORPEDO',CFG.C.DIM,9);
    ctx.fillStyle=Player.torpedoes>0?CFG.C.BLUE:U.rgba(CFG.C.BLUE,.3);
    ctx.shadowColor=Player.torpedoes>0?CFG.C.BLUE:'transparent';ctx.shadowBlur=6;
    ctx.font='bold 24px monospace';
    ctx.fillText(String(Player.torpedoes).padStart(2,'0'),CFG.W-116,cy+13);
    ctx.shadowBlur=0;

    if(Player.torpedoes<CFG.TORPEDO_MAX){
      const rp=Player.rechargeProgress,rx2=CFG.W-88,ry2=cy+4,rr2=7;
      ctx.strokeStyle=U.rgba(CFG.C.BLUE,.2);ctx.lineWidth=2;
      ctx.beginPath();ctx.arc(rx2,ry2,rr2,0,Math.PI*2);ctx.stroke();
      ctx.strokeStyle=CFG.C.BLUE;ctx.shadowColor=CFG.C.BLUE;ctx.shadowBlur=7;
      ctx.beginPath();ctx.arc(rx2,ry2,rr2,-Math.PI/2,-Math.PI/2+rp*Math.PI*2);ctx.stroke();
      ctx.shadowBlur=0;
    }
  }

  // ── LEFT PANEL ──────────────────────────────────────────────────
  function drawLeft(ctx) {
    const FY=CFG.FRAME_Y, PX=4, PW=CFG.HUD_LEFT_W-8;

    // Full opaque bg
    solidBg(ctx,0,FY,CFG.HUD_LEFT_W,CFG.HUD_LEFT_H-FY,'#060c18');
    ctx.fillStyle=U.rgba(CFG.C.BORDER,.5);ctx.fillRect(CFG.HUD_LEFT_W-1,FY,1,CFG.HUD_LEFT_H-FY);

    // Name header
    solidBg(ctx,PX,FY+2,PW,22,'#0a160a');
    txt(ctx,PX+6,FY+11,'CAPT. J.L. PICARD',CFG.C.GOLD,8);
    txt(ctx,PX+6,FY+21,'U.S.S. ENTERPRISE-D',U.rgba(CFG.C.BORDER,.7),7);

    // ── Portrait — square-ish, centered ──────────────────────────
    // portW constrained by panel, portH ≈ same as portW → square
    const portW = PW - 4;    // ~247px
    const portH = 185;       // height ≈ width*0.75; keeps face + shoulders
    const portX = PX + 2, portY = FY + 26;

    ctx.fillStyle='#04080f';ctx.fillRect(portX,portY,portW,portH);
    ctx.strokeStyle=U.rgba(CFG.C.BORDER,.6);ctx.lineWidth=1.5;ctx.strokeRect(portX,portY,portW,portH);

    if(picardImg && picardImg.complete && picardImg.naturalWidth){
      ctx.save();
      ctx.beginPath();ctx.rect(portX+1,portY+1,portW-2,portH-2);ctx.clip();
      // Scale so width fills box, then crop vertically centered
      const scl = portW / picardImg.naturalWidth;
      const dh  = picardImg.naturalHeight * scl;
      // Center vertically (show face not feet — offset 0 = top)
      const offsetY = 0;
      ctx.drawImage(picardImg, portX+1, portY+1+offsetY, portW-2, dh);
      // Scanline overlay
      ctx.globalAlpha=.05;ctx.strokeStyle='#4488cc';ctx.lineWidth=1;
      for(let sy=portY;sy<portY+portH;sy+=3){ctx.beginPath();ctx.moveTo(portX,sy);ctx.lineTo(portX+portW,sy);ctx.stroke();}
      ctx.restore();
    } else {
      _picardFallback(ctx,portX,portY,portW,portH);
    }

    // ── Status bars ───────────────────────────────────────────────
    const barsX=PX+2, bW=PW-4, BH=10;
    let by2=portY+portH+6;
    bar(ctx,barsX,by2,bW,BH, 1.0,                            '#00e5ff','WARP CORE','100%');  by2+=26;
    bar(ctx,barsX,by2,bW,BH, Player.shields/CFG.SHIELD_MAX,  Player.shields/CFG.SHIELD_MAX>.5?'#38ef7d':'#ffaa00','SHIELD PWR',Math.ceil(Player.shields)+'%'); by2+=26;
    bar(ctx,barsX,by2,bW,BH, 0.72,                           '#cc44ff','PHASER NRG','72%'); by2+=26;

    // ── Engineering Data ──────────────────────────────────────────
    by2+=2;
    solidBg(ctx,PX,by2,PW,14,'#0d1a00');
    ctx.fillStyle=U.rgba('#ffaa44',.9);ctx.fillRect(PX,by2,4,14);
    txt(ctx,PX+7,by2+11,'ENGINEERING DATA',U.rgba(CFG.C.GOLD,.85),8);
    by2+=14;

    ['EPS CONDUITS: STABLE','IMPULSE DRIVE: ONLINE','IMPULSE DRIVE: ONLINE'].forEach((t,i)=>{
      solidBg(ctx,PX,by2,PW,16,i%2===0?'#060e12':'#050c10');
      ctx.fillStyle='#38ef7d';ctx.shadowColor='#38ef7d';ctx.shadowBlur=4;
      ctx.beginPath();ctx.arc(PX+8,by2+8,3,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;
      txt(ctx,PX+16,by2+12,t,U.rgba(CFG.C.TEXT,.7),7);
      by2+=16;
    });

    // ── Weapons Status ────────────────────────────────────────────
    by2+=3;
    solidBg(ctx,PX,by2,PW,14,'#1a0d00');
    ctx.fillStyle=U.rgba('#ff8832',.9);ctx.fillRect(PX,by2,4,14);
    txt(ctx,PX+7,by2+11,'WEAPONS STATUS',U.rgba('#ff8832',.85),8);
    by2+=14;

    const phPct = 0.85; // phaser energy remaining
    solidBg(ctx,PX,by2,PW,16,'#060a14');
    const phCol='#ff8832';
    txt(ctx,PX+6,by2+11,'PHASERS: READY',phCol,7);
    ctx.fillStyle=phCol;ctx.fillRect(PX,by2,4,16);
    by2+=16;

    solidBg(ctx,PX,by2,PW,16,'#050c10');
    const torpCol=Player.torpedoes>0?CFG.C.TORPEDO:'#334455';
    const torpLabel='TORPEDOES: '+String(Player.torpedoes).padStart(2,'0')+'/'+CFG.TORPEDO_MAX;
    txt(ctx,PX+6,by2+11,torpLabel,torpCol,7);
    ctx.fillStyle=torpCol;ctx.fillRect(PX,by2,4,16);
  }

  // ── RIGHT PANEL ─────────────────────────────────────────────────
  function drawRight(ctx) {
    const FY=CFG.FRAME_Y, PX=CFG.HUD_RIGHT_X, PW=CFG.W-CFG.HUD_RIGHT_X;

    solidBg(ctx,PX,FY,PW,CFG.HUD_RIGHT_H-FY,'#060c18');
    ctx.fillStyle=U.rgba(CFG.C.BORDER,.5);ctx.fillRect(PX,FY,1,CFG.HUD_RIGHT_H-FY);

    const BX=PX+4, BW=PW-8;
    let cy=FY+4;

    // TACTICAL GRID
    sectionHdr(ctx,PX,cy,PW,'TACTICAL GRID',CFG.C.BORDER);cy+=16;
    blockBtn(ctx,BX,cy,BW,'COORD '+String(Math.floor(Player.x)).padStart(4,'0'),'#4488ff',true);cy+=17;
    blockBtn(ctx,BX,cy,BW,'SCANNER FEED','#334466',false);cy+=19;

    // SHIP SYSTEMS
    sectionHdr(ctx,PX,cy,PW,'SHIP SYSTEMS',CFG.C.BORDER);cy+=16;
    const hasEnemies=Enemies.list.length>0;
    blockBtn(ctx,BX,cy,BW,'TARGET LOCK',hasEnemies?'#38ef7d':'#334455',hasEnemies);cy+=17;
    blockBtn(ctx,BX,cy,BW,'SHIP STATS','#334455',false);cy+=17;
    blockBtn(ctx,BX,cy,BW,'SENSOR FEED','#334455',false);cy+=19;

    // DAMAGE CONTROL
    const shOk=Player.shields/CFG.SHIELD_MAX>.5;
    sectionHdr(ctx,PX,cy,PW,'DAMAGE CONTROL',shOk?U.rgba(CFG.C.BORDER,.9):CFG.C.ALERT);cy+=16;
    blockBtn(ctx,BX,cy,BW,'TARGET LOCK',shOk?'#38ef7d':CFG.C.ALERT,true);cy+=17;
    blockBtn(ctx,BX,cy,BW,'PHOTON TORP',Player.torpedoes>0?CFG.C.TORPEDO:'#334455',Player.torpedoes>0);cy+=17;
    solidBg(ctx,BX,cy,BW,15,'#0a1828');
    ctx.strokeStyle=U.rgba(CFG.C.TORPEDO,.4);ctx.lineWidth=.7;ctx.strokeRect(BX,cy,BW,15);
    txt(ctx,BX+4,cy+11,'PHOTON TORPS: '+String(Player.torpedoes).padStart(2,' '),CFG.C.TORPEDO,8);cy+=19;

    // NAVIGATION DATA
    sectionHdr(ctx,PX,cy,PW,'NAVIGATION DATA','#33aacc');cy+=16;
    // Wave progress
    solidBg(ctx,BX,cy,BW,15,'#060e18');
    const enemiesLeft=Enemies.list.filter(e=>!e.dead).length;
    txt(ctx,BX+4,cy+11,'WAVE ENEMIES: '+String(enemiesLeft).padStart(2,' '),
        enemiesLeft>0?'#ffaa00':'#38ef7d',8);cy+=17;
    // Player position
    solidBg(ctx,BX,cy,BW,15,'#060c14');
    const yPct=U.clamp((Player.y-CFG.PLAYER_Y_MIN)/(CFG.PLAYER_Y_MAX-CFG.PLAYER_Y_MIN),0,1);
    txt(ctx,BX+4,cy+11,'HELM Y: '+Math.ceil(yPct*100)+'%  ALT',U.rgba(CFG.C.TEXT,.6),8);cy+=17;
    solidBg(ctx,BX,cy,BW,15,'#060e18');
    txt(ctx,BX+4,cy+11,'WARP SPEED: FULL',U.rgba(CFG.C.TEXT,.6),8);cy+=19;

    // TACTICAL ANALYSIS
    sectionHdr(ctx,PX,cy,PW,'TACTICAL ANALYSIS',U.rgba(CFG.C.BORDER,.8));cy+=16;
    // Current act
    const actName = Story.currentAct ? Story.currentAct.name : '---';
    solidBg(ctx,BX,cy,BW,15,'#060c14');
    txt(ctx,BX+4,cy+11,actName,U.rgba(CFG.C.GOLD,.8),7); cy+=17;
    solidBg(ctx,BX,cy,BW,15,'#060e18');
    txt(ctx,BX+4,cy+11,'THREAT LEVEL: ALPHA',U.rgba(CFG.C.ALERT,.7),8);cy+=17;
    solidBg(ctx,BX,cy,BW,15,'#060c14');
    txt(ctx,BX+4,cy+11,'SHIELDS: NOMINAL',U.rgba('#38ef7d',.7),8);cy+=17;
    solidBg(ctx,BX,cy,BW,15,'#060e18');
    txt(ctx,BX+4,cy+11,'PHASERS: ARMED',U.rgba('#ff8832',.7),8);
  }

  // ── RADAR ───────────────────────────────────────────────────────
  function drawRadar(ctx) {
    const fBottom=CFG.FRAME_Y+CFG.FRAME_H;
    const rx=CFG.HUD_LEFT_W+55,ry=fBottom-32,rr=22;

    solidBg(ctx,rx-rr-4,ry-rr-4,rr*2+8,rr*2+18,'rgba(4,8,18,.88)');
    ctx.strokeStyle=U.rgba(CFG.C.BORDER,.5);ctx.lineWidth=1;
    ctx.beginPath();ctx.arc(rx,ry,rr,0,Math.PI*2);ctx.stroke();
    ctx.beginPath();ctx.arc(rx,ry,rr*.55,0,Math.PI*2);ctx.stroke();
    ctx.strokeStyle=U.rgba(CFG.C.BORDER,.2);
    ctx.beginPath();ctx.moveTo(rx-rr,ry);ctx.lineTo(rx+rr,ry);ctx.stroke();
    ctx.beginPath();ctx.moveTo(rx,ry-rr);ctx.lineTo(rx,ry+rr);ctx.stroke();

    const pry=ry+((Player.y-CFG.PLAYER_Y0)/(CFG.PLAYER_Y_MAX-CFG.PLAYER_Y_MIN))*rr*.6;
    ctx.fillStyle=CFG.C.BLUE;ctx.shadowColor=CFG.C.BLUE;ctx.shadowBlur=6;
    ctx.beginPath();ctx.arc(rx,pry,3,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;

    for(const e of Enemies.list){
      if(e.dead||e.scale<.04) continue;
      const ex=rx+(e.worldX/600)*rr;
      const ey=ry-(1-e.z/CFG.Z_SPAWN)*rr;
      ctx.fillStyle=e.type.startsWith('borg')?'#00ff44':'#ff4400';
      ctx.beginPath();
      ctx.arc(U.clamp(ex,rx-rr+2,rx+rr-2),U.clamp(ey,ry-rr+2,ry+rr-2),2.5,0,Math.PI*2);
      ctx.fill();
    }
    txt(ctx,rx,ry+rr+12,'RADAR',CFG.C.DIM,7,'center');
  }

  // ── NOVA BUTTON ─────────────────────────────────────────────────
  function drawNovaButton(ctx) {
    const bx=CFG.NOVA_BTN_X,by_=CFG.NOVA_BTN_Y,br=CFG.NOVA_BTN_R;
    const ready=Nova.ready,pct=Nova.cooldownPct;

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

  function _picardFallback(ctx,x,y,w,h){
    ctx.save();ctx.translate(x+w/2,y+h/2);
    ctx.fillStyle='rgba(42,10,10,.85)';ctx.beginPath();ctx.ellipse(0,h*.22,w*.38,h*.35,0,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#c8a882';ctx.beginPath();ctx.ellipse(0,-h*.12,w*.18,h*.22,0,0,Math.PI*2);ctx.fill();
    ctx.fillStyle=CFG.C.GOLD;ctx.shadowColor=CFG.C.GOLD;ctx.shadowBlur=4;
    ctx.font='9px Arial';ctx.textAlign='center';ctx.fillText('✦',1,h*.08);
    ctx.shadowBlur=0;ctx.restore();
  }

  function drawAlerts(ctx){
    if(!alerts.length) return;
    const top=alerts[0];const a=Math.min(1,top.timer*3);
    ctx.save();ctx.globalAlpha=a;
    const aw=460,ah=36,ax=(CFG.W-aw)/2,ay=CFG.FRAME_Y+8;
    ctx.fillStyle='rgba(28,0,0,.95)';U.rRect(ctx,ax,ay,aw,ah,4);ctx.fill();
    ctx.strokeStyle=CFG.C.ALERT;ctx.lineWidth=1.5;U.rRect(ctx,ax,ay,aw,ah,4);ctx.stroke();
    ctx.fillStyle=Math.sin(tick*9)>0||top.timer>top.maxTimer*.7?CFG.C.ALERT:U.rgba(CFG.C.ALERT,.5);
    ctx.font='bold 13px monospace';ctx.textAlign='center';
    ctx.fillText(top.text,CFG.W/2,ay+24);ctx.textAlign='left';ctx.restore();
  }

  function drawFloats(ctx){
    for(const f of floatScores){
      ctx.save();ctx.globalAlpha=f.life/f.maxLife;
      ctx.fillStyle=CFG.C.GOLD;ctx.font='bold 14px monospace';
      ctx.textAlign='center';ctx.fillText(f.text,f.x,f.y);ctx.textAlign='left';ctx.restore();
    }
  }

  // ══════════════════════════════════════════════════════════════
  return {
    init()  { alerts=[]; floatScores=[]; tick=0; loadPicard(); },
    alert(text,ms){ alerts.unshift({text,timer:ms/1000,maxTimer:ms/1000}); if(alerts.length>3)alerts.pop(); },
    floatScore(text,x,y){ floatScores.push({text,x,y,life:1.6,maxLife:1.6}); },
    render(ctx, score, wave, dt) {
      tick+=dt;
      alerts      = alerts.filter(a=>{a.timer-=dt;return a.timer>0;});
      floatScores = floatScores.filter(f=>{f.life-=dt;f.y-=28*dt;return f.life>0;});
      drawTop(ctx,score,wave);
      drawLeft(ctx);
      drawRight(ctx);
      drawRadar(ctx);
      drawNovaButton(ctx);
      drawAlerts(ctx);
      drawFloats(ctx);
    }
  };
})();
