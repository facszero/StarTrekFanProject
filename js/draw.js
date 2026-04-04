'use strict';

/**
 * Draw – uses real sprites when loaded, clean canvas fallback otherwise.
 */
const Draw = {

  // ══════════════════════════════════════════════════════════════
  //  USS ENTERPRISE-D
  // ══════════════════════════════════════════════════════════════
  enterprise(ctx, cx, cy, scale, bank, pitch) {
    // bankNorm: 0 = hard-left, 0.5 = straight, 1 = hard-right
    const bankNorm = U.clamp((bank + CFG.PLAYER_MAX_BANK) / (CFG.PLAYER_MAX_BANK * 2), 0, 1);

    if (Sprites.drawPlayer(ctx, cx, cy, scale, bankNorm)) {
      // Sprite-based: apply subtle scale-Y squish to simulate pitch
      // (already drawn; we can't re-draw, so pitch is shown via thruster offset)
      this._thruster(ctx, cx, cy + (pitch || 0) * 12 * scale, scale);
      return;
    }
    this._enterpriseCanvas(ctx, cx, cy, scale, bank, pitch || 0);
  },

  _thruster(ctx, cx, cy, scale) {
    const g = ctx.createRadialGradient(cx, cy+14*scale, 0, cx, cy+14*scale, 32*scale);
    g.addColorStop(0, 'rgba(80,140,255,.52)');
    g.addColorStop(1, 'transparent');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(cx, cy+14*scale, 32*scale, 0, Math.PI*2); ctx.fill();
  },

  _enterpriseCanvas(ctx, cx, cy, scale, bank, pitch) {
    ctx.save(); ctx.translate(cx,cy); ctx.rotate(bank*.14);
    // Pitch: squish Y axis slightly (nose up/down illusion)
    ctx.scale(scale, scale * (1 + pitch * 0.35));
    const c={hull:'#bcc9d6',hullLt:'#cfdde8',hullDk:'#7a8a9a',panel:'#a8b8c4',
      nacelle:'#96a8b8',band:'#cc4400',glow:'#449aff',glowLt:'#88ccff',
      imp:'#ff5500',impLt:'#ffaa44',det:'#697a8a'};
    ctx.strokeStyle=c.det; ctx.lineWidth=4; ctx.lineCap='round';
    ctx.beginPath(); ctx.moveTo(-18,28); ctx.quadraticCurveTo(-50,48,-90,57); ctx.stroke();
    ctx.beginPath(); ctx.moveTo( 18,28); ctx.quadraticCurveTo( 50,48, 90,57); ctx.stroke();
    ctx.save(); ctx.translate(-90,57); this._nac(ctx,c); ctx.restore();
    ctx.save(); ctx.translate( 90,57); ctx.scale(-1,1); this._nac(ctx,c); ctx.restore();
    const sg2=ctx.createRadialGradient(-8,42,4,0,42,35);
    sg2.addColorStop(0,c.hullLt); sg2.addColorStop(1,c.panel);
    ctx.beginPath(); ctx.ellipse(0,42,32,22,0,0,Math.PI*2);
    ctx.fillStyle=sg2; ctx.fill(); ctx.strokeStyle=c.det; ctx.lineWidth=.8; ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-12,8); ctx.bezierCurveTo(-14,22,-15,30,-15,38);
    ctx.lineTo(15,38); ctx.bezierCurveTo(15,30,14,22,12,8); ctx.closePath();
    ctx.fillStyle=c.panel; ctx.fill(); ctx.strokeStyle=c.det; ctx.lineWidth=.6; ctx.stroke();
    const sg=ctx.createRadialGradient(-22,-20,12,0,-13,94);
    sg.addColorStop(0,c.hullLt); sg.addColorStop(.4,c.hull); sg.addColorStop(.85,c.panel); sg.addColorStop(1,c.hullDk);
    ctx.beginPath(); ctx.ellipse(0,-13,91,73,0,0,Math.PI*2); ctx.fillStyle=sg; ctx.fill();
    ctx.strokeStyle=c.det; ctx.lineWidth=1; ctx.stroke();
    for(const[rx,ry,a]of[[83,66,.6],[66,53,.5],[43,34,.4],[22,17,.35]]){
      ctx.beginPath(); ctx.ellipse(0,-13,rx,ry,0,0,Math.PI*2);
      ctx.strokeStyle=U.rgba(c.hullDk,a); ctx.lineWidth=.55; ctx.stroke();}
    const cg=ctx.createRadialGradient(0,-13,0,0,-13,20);
    cg.addColorStop(0,c.hullLt); cg.addColorStop(1,c.hull);
    ctx.beginPath(); ctx.ellipse(0,-13,20,15,0,0,Math.PI*2); ctx.fillStyle=cg; ctx.fill();
    ctx.save(); ctx.strokeStyle=U.rgba(c.hullDk,.18); ctx.lineWidth=.5;
    for(let i=0;i<16;i++){const a=(i/16)*Math.PI*2;ctx.beginPath();
      ctx.moveTo(Math.cos(a)*20,-13+Math.sin(a)*15); ctx.lineTo(Math.cos(a)*91,-13+Math.sin(a)*73); ctx.stroke();}
    ctx.restore();
    ctx.save(); ctx.shadowColor=c.imp; ctx.shadowBlur=18; ctx.fillStyle=c.imp;
    U.rRect(ctx,-25,46,20,7,3); ctx.fill(); U.rRect(ctx,5,46,20,7,3); ctx.fill();
    ctx.shadowBlur=0; ctx.fillStyle=c.impLt;
    U.rRect(ctx,-23,47,16,4,2); ctx.fill(); U.rRect(ctx,7,47,16,4,2); ctx.fill(); ctx.restore();
    ctx.save(); ctx.shadowColor='#f00'; ctx.shadowBlur=9; ctx.fillStyle='#ff3322';
    ctx.beginPath(); ctx.arc(-91,-13,2.5,0,Math.PI*2); ctx.fill();
    ctx.shadowColor='#0f0'; ctx.fillStyle='#22ff55';
    ctx.beginPath(); ctx.arc(91,-13,2.5,0,Math.PI*2); ctx.fill();
    ctx.shadowBlur=0; ctx.restore();
    ctx.restore();
    this._thruster(ctx, cx, cy, scale);
  },

  _nac(ctx,c){
    U.rRect(ctx,-43,-9,86,18,8); ctx.fillStyle=c.nacelle; ctx.fill();
    ctx.strokeStyle=c.det; ctx.lineWidth=.8; ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-36,-3); ctx.lineTo(16,-3);
    ctx.strokeStyle=U.rgba(c.det,.45); ctx.lineWidth=.5; ctx.stroke();
    U.rRect(ctx,17,-9,14,18,[0,4,4,0]); ctx.fillStyle=c.band; ctx.fill();
    const gl=ctx.createRadialGradient(43,0,0,43,0,20);
    gl.addColorStop(0,c.glowLt); gl.addColorStop(.4,U.rgba(c.glow,.8)); gl.addColorStop(1,'rgba(0,80,200,0)');
    ctx.fillStyle=gl; ctx.beginPath(); ctx.arc(43,0,20,0,Math.PI*2); ctx.fill();
    ctx.fillStyle='#ddeeff'; ctx.beginPath(); ctx.arc(43,0,5.5,0,Math.PI*2); ctx.fill();
  },

  // ══════════════════════════════════════════════════════════════
  //  KLINGON BIRD OF PREY
  //  Sprite rotated -90° so the nose points down toward the player
  // ══════════════════════════════════════════════════════════════
  birdOfPrey(ctx, cx, cy, scale) {
    if (Sprites.drawEnemy(ctx, 'brel', cx, cy, scale, -Math.PI/2)) return;

    // Canvas fallback
    ctx.save(); ctx.translate(cx,cy); ctx.scale(scale,scale);
    const hull='#28301e',hullLt='#3e4830',acc='#4a5438',wpn='#ff4422';
    ctx.beginPath(); ctx.moveTo(-5,-8); ctx.lineTo(-82,-30); ctx.lineTo(-70,8); ctx.lineTo(-22,14); ctx.closePath();
    ctx.fillStyle=hull; ctx.fill(); ctx.strokeStyle='#556655'; ctx.lineWidth=.75; ctx.stroke();
    ctx.beginPath(); ctx.moveTo(5,-8); ctx.lineTo(82,-30); ctx.lineTo(70,8); ctx.lineTo(22,14); ctx.closePath();
    ctx.fillStyle=hull; ctx.fill(); ctx.stroke();
    ctx.fillStyle=hullLt;
    ctx.beginPath(); ctx.moveTo(-10,-4); ctx.lineTo(-68,-26); ctx.lineTo(-56,6); ctx.lineTo(-18,12); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(10,-4); ctx.lineTo(68,-26); ctx.lineTo(56,6); ctx.lineTo(18,12); ctx.closePath(); ctx.fill();
    for(let i=0;i<3;i++){const t=.3+i*.25;ctx.strokeStyle=U.rgba(acc,.55);ctx.lineWidth=.8;
      ctx.beginPath(); ctx.moveTo(-5+(-77)*t,-8+(-22)*t); ctx.lineTo(-5+(-17)*t,-8+22*t); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(5+(77)*t,-8+(-22)*t); ctx.lineTo(5+(17)*t,-8+22*t); ctx.stroke();}
    ctx.fillStyle='#202518'; ctx.beginPath(); ctx.moveTo(-9,-32); ctx.lineTo(9,-32); ctx.lineTo(11,22); ctx.lineTo(-11,22); ctx.closePath(); ctx.fill();
    ctx.strokeStyle='#556655'; ctx.lineWidth=.7; ctx.stroke();
    ctx.beginPath(); ctx.ellipse(0,5,14,20,0,0,Math.PI*2); ctx.fillStyle='#2c3020'; ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0,-48); ctx.lineTo(-8,-28); ctx.lineTo(8,-28); ctx.closePath(); ctx.fillStyle='#181c10'; ctx.fill(); ctx.stroke();
    ctx.save(); ctx.shadowColor=wpn; ctx.shadowBlur=12; ctx.fillStyle=wpn;
    ctx.beginPath(); ctx.arc(-82,-30,5.5,0,Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(82,-30,5.5,0,Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(0,-50,4,0,Math.PI*2); ctx.fill();
    ctx.shadowBlur=0; ctx.restore();
    ctx.restore();
  },

  // ══════════════════════════════════════════════════════════════
  //  BORG CUBE
  //  Sprite multiplier: 3.94 → cube appears ~310px wide at max scale
  //  Angle selection by scale (0.022 far → 0.78 closest)
  // ══════════════════════════════════════════════════════════════
  borgCube(ctx, cx, cy, scale, tick) {
    let spriteName;
    if      (scale < 0.12) spriteName = 'cube_frente';
    else if (scale < 0.35) spriteName = 'cube_45a';
    else if (scale < 0.58) spriteName = 'cube_65';
    else                   spriteName = 'cube_85a';

    if (Sprites.drawBorg(ctx, spriteName, cx, cy, scale * 3.94)) {
      this._borgGlow(ctx, cx, cy, scale, tick, 199); // hw = (101/2)*3.94
      return;
    }
    // Canvas fallback — scaled to match sprite size (~310px at max scale)
    ctx.save(); ctx.translate(cx,cy); ctx.scale(scale * 3.94, scale * 3.94);
    const s=40, g='#00cc44', dk='#060d08';
    ctx.beginPath(); ctx.moveTo(s,-s); ctx.lineTo(s,s); ctx.lineTo(s+12,s-12); ctx.lineTo(s+12,-s-12); ctx.closePath();
    ctx.fillStyle='#080f08'; ctx.fill(); ctx.strokeStyle=g; ctx.lineWidth=.5; ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-s,-s); ctx.lineTo(s,-s); ctx.lineTo(s+12,-s-12); ctx.lineTo(-s+12,-s-12); ctx.closePath();
    ctx.fillStyle='#0a140a'; ctx.fill(); ctx.stroke();
    ctx.fillStyle=dk; ctx.fillRect(-s,-s,s*2,s*2);
    ctx.save(); ctx.strokeStyle=g; ctx.globalAlpha=.25; ctx.lineWidth=.4;
    for(let i=-s;i<=s;i+=10){ctx.beginPath();ctx.moveTo(i,-s);ctx.lineTo(i,s);ctx.stroke();ctx.beginPath();ctx.moveTo(-s,i);ctx.lineTo(s,i);ctx.stroke();}
    ctx.restore();
    ctx.strokeStyle=g; ctx.lineWidth=1; ctx.shadowColor=g; ctx.shadowBlur=10; ctx.strokeRect(-s,-s,s*2,s*2); ctx.shadowBlur=0;
    ctx.restore();
    this._borgGlow(ctx, cx, cy, scale, tick, 199);
  },

  // ══════════════════════════════════════════════════════════════
  //  BORG SPHERE
  //  Sprite multiplier: 3.21 → sphere ~255px wide at max scale
  // ══════════════════════════════════════════════════════════════
  borgSphere(ctx, cx, cy, scale, tick) {
    let spriteName;
    if      (scale < 0.20) spriteName = 'sphere_frente';
    else if (scale < 0.50) spriteName = 'sphere_45';
    else                   spriteName = 'sphere_135a';

    if (Sprites.drawBorg(ctx, spriteName, cx, cy, scale * 3.21)) {
      this._borgGlow(ctx, cx, cy, scale, tick, 164); // hw = (102/2)*3.21
      return;
    }
    // Canvas fallback
    ctx.save();
    const r = 52 * scale * 3.21;
    const gr = ctx.createRadialGradient(cx-r*.15,cy-r*.15,r*.04, cx,cy,r);
    gr.addColorStop(0,'#1a3a1a'); gr.addColorStop(.5,'#0a200a'); gr.addColorStop(1,'#030803');
    ctx.fillStyle=gr; ctx.beginPath(); ctx.arc(cx,cy,r,0,Math.PI*2); ctx.fill();
    ctx.strokeStyle='#00cc44'; ctx.lineWidth=Math.max(1,1.5*scale*3.21);
    ctx.shadowColor='#00ff44'; ctx.shadowBlur=r*.25;
    ctx.stroke(); ctx.shadowBlur=0; ctx.restore();
    this._borgGlow(ctx, cx, cy, scale, tick, 164);
  },

  // ══════════════════════════════════════════════════════════════
  //  BORG SCOUT
  //  Sprite multiplier: 1.67 → scout ~155px wide at max scale
  // ══════════════════════════════════════════════════════════════
  borgScout(ctx, cx, cy, scale, tick) {
    let spriteName;
    if      (scale < 0.15) spriteName = 'scout_frente';
    else if (scale < 0.40) spriteName = 'scout_25a';
    else if (scale < 0.62) spriteName = 'scout_arriba';
    else                   spriteName = 'scout_fl_high';

    if (Sprites.drawBorg(ctx, spriteName, cx, cy, scale * 1.67)) {
      this._borgScoutGlow(ctx, cx, cy, scale);
      return;
    }
    // Canvas fallback
    ctx.save(); ctx.translate(cx,cy); ctx.scale(scale * 1.67, scale * 1.67);
    ctx.fillStyle='#1a2a1a';
    ctx.beginPath(); ctx.moveTo(0,-35); ctx.lineTo(-30,18); ctx.lineTo(0,10); ctx.lineTo(30,18); ctx.closePath();
    ctx.fill(); ctx.strokeStyle='#336633'; ctx.lineWidth=.8; ctx.stroke();
    ctx.fillStyle='#00aa33'; ctx.beginPath(); ctx.arc(0,-35,3.5,0,Math.PI*2); ctx.fill();
    ctx.restore();
  },

  // ══════════════════════════════════════════════════════════════
  //  BORG ASSIMILATION SHIP
  //  Sprite multiplier: 2.06 → ship ~175px wide / ~440px tall at max scale
  // ══════════════════════════════════════════════════════════════
  borgAssimil(ctx, cx, cy, scale, tick, firing) {
    const spriteName = firing ? 'assimil_beam' : 'assimil_arriba';

    if (Sprites.drawBorg(ctx, spriteName, cx, cy, scale * 2.06)) {
      if (firing && scale > 0.3) {
        const beamLen = 107 * scale * 2.06;
        ctx.save(); ctx.globalAlpha = .7;
        ctx.shadowColor='#00ff66'; ctx.shadowBlur=22;
        ctx.strokeStyle='#00ff44'; ctx.lineWidth=Math.max(1.5, 3*scale);
        ctx.beginPath(); ctx.moveTo(cx, cy + beamLen*.3); ctx.lineTo(cx, cy + beamLen); ctx.stroke();
        ctx.shadowBlur=0; ctx.restore();
      }
      this._borgGlow(ctx, cx, cy, scale, tick, 112); // hw = (109/2)*2.06
      return;
    }
    // Canvas fallback
    ctx.save(); ctx.translate(cx,cy); ctx.scale(scale * 2.06, scale * 2.06);
    ctx.fillStyle='#0d1a0d'; ctx.fillRect(-25,-45,50,90);
    ctx.strokeStyle='#00cc44'; ctx.lineWidth=1.2; ctx.strokeRect(-25,-45,50,90);
    ctx.restore();
  },

  // ── Shared Borg glow overlay ───────────────────────────────────
  // hwMult: (sprite_native_px / 2) * draw_scale_multiplier
  //         → hw = scale * hwMult = visual half-size on screen
  _borgGlow(ctx, cx, cy, scale, tick, hwMult) {
    const hw = scale * hwMult;
    ctx.save();
    const gr = ctx.createRadialGradient(cx,cy,hw*.3, cx,cy,hw*1.6);
    gr.addColorStop(0, 'rgba(0,200,60,.07)');
    gr.addColorStop(1, 'transparent');
    ctx.fillStyle=gr; ctx.beginPath(); ctx.arc(cx,cy,hw*1.6,0,Math.PI*2); ctx.fill();
    // Tractor beam when close enough
    if (scale > .40) {
      ctx.globalAlpha = U.clamp((scale-.40)*2.0, 0, .7);
      ctx.strokeStyle='#00ff66'; ctx.lineWidth = Math.max(1, 1.5 * scale);
      ctx.setLineDash([8,5]); ctx.lineDashOffset = -(tick*28);
      ctx.beginPath(); ctx.moveTo(cx,cy+hw); ctx.lineTo(cx,cy+hw+55*scale*2); ctx.stroke();
      ctx.setLineDash([]);
    }
    ctx.restore();
  },

  _borgScoutGlow(ctx, cx, cy, scale) {
    const r = 66 * scale;  // matches 40px * 1.67x mult
    const gr = ctx.createRadialGradient(cx,cy,0, cx,cy,r);
    gr.addColorStop(0,'rgba(0,180,50,.12)'); gr.addColorStop(1,'transparent');
    ctx.fillStyle=gr; ctx.beginPath(); ctx.arc(cx,cy,r,0,Math.PI*2); ctx.fill();
  },


  phaserBeam(ctx, x1, y1, x2, y2, alpha) {
    ctx.save(); ctx.globalAlpha = alpha;
    const gr = ctx.createLinearGradient(x1,y1,x2,y2);
    gr.addColorStop(0,   '#ffffff');
    gr.addColorStop(.15, '#ffdd88');
    gr.addColorStop(.5,  '#ff8830');
    gr.addColorStop(1,   'rgba(255,80,0,0)');

    // Wide outer glow
    ctx.strokeStyle = U.rgba('#ff6600', .45); ctx.lineWidth = 12;
    ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(x2,y2); ctx.stroke();

    // Mid glow
    ctx.strokeStyle = U.rgba('#ff8830', .65); ctx.lineWidth = 6;
    ctx.shadowColor='#ff8830'; ctx.shadowBlur=18;
    ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(x2,y2); ctx.stroke();

    // Core beam (bright white/yellow)
    ctx.strokeStyle = gr; ctx.lineWidth = 2.5;
    ctx.shadowColor='#ffffff'; ctx.shadowBlur=10;
    ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(x2,y2); ctx.stroke();

    ctx.shadowBlur=0; ctx.restore();
  },

  torpedo(ctx, x, y, size, alpha) {
    ctx.save(); ctx.globalAlpha=alpha; ctx.translate(x,y);
    const gr=ctx.createRadialGradient(0,0,0,0,0,size*3.5);
    gr.addColorStop(0,'#ccf0ff'); gr.addColorStop(.35,U.rgba('#44aaff',.7)); gr.addColorStop(1,'transparent');
    ctx.fillStyle=gr; ctx.beginPath(); ctx.arc(0,0,size*3.5,0,Math.PI*2); ctx.fill();
    ctx.fillStyle='#ddf0ff'; ctx.shadowColor='#44aaff'; ctx.shadowBlur=22;
    ctx.beginPath(); ctx.arc(0,0,size,0,Math.PI*2); ctx.fill();
    ctx.shadowBlur=0; ctx.restore();
  },

  // ══════════════════════════════════════════════════════════════
  //  EXPLOSION  — canvas rings + optional sprite overlay
  // ══════════════════════════════════════════════════════════════
  explosion(ctx, x, y, radius, progress) {
    ctx.save(); ctx.translate(x,y);
    const rings=4;
    for(let r=0;r<rings;r++){
      const t=U.clamp(progress*rings-r,0,1); if(t<=0) continue;
      const rr=radius*t*(0.35+r*.22), a=(1-t)*.85;
      const gr=ctx.createRadialGradient(0,0,0,0,0,rr);
      gr.addColorStop(0,CFG.C.EXP[r%CFG.C.EXP.length]+'ff');
      gr.addColorStop(.6,CFG.C.EXP[(r+2)%CFG.C.EXP.length]+'88');
      gr.addColorStop(1,'transparent');
      ctx.globalAlpha=a; ctx.fillStyle=gr; ctx.beginPath(); ctx.arc(0,0,rr,0,Math.PI*2); ctx.fill();
    }
    ctx.restore();
    // Sprite frame overlay
    if (progress < .88) {
      const frame = Math.min(4, Math.floor(progress * 5));
      ctx.save(); ctx.globalAlpha=(1-progress)*.8;
      Sprites.drawExpFrame(ctx, frame, x, y, radius/100);
      ctx.restore();
    }
  },

  // ── HUD helpers ───────────────────────────────────────────────
  corner(ctx,x,y,size,dir,color){
    ctx.strokeStyle=color; ctx.lineWidth=2; ctx.beginPath();
    ctx.moveTo(x+dir*size,y); ctx.lineTo(x,y); ctx.lineTo(x,y+size); ctx.stroke();
  },
  ledBar(ctx,x,y,w,h,pct,colFill,colBg){
    const segs=12,sw=Math.floor((w-segs-1)/segs),lit=Math.round(pct*segs);
    for(let i=0;i<segs;i++){ctx.fillStyle=i<lit?colFill:colBg;ctx.fillRect(x+i*(sw+1),y,sw,h);}
  },
};
