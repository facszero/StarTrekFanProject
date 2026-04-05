'use strict';

// ═══════════════════════════════════════════════════════════════════
//  PARTICLES
// ═══════════════════════════════════════════════════════════════════
const Particles = (() => {
  let pool = [];

  function spark(x, y, n, colorsArr, speedScale) {
    for (let i = 0; i < n; i++) {
      const a  = Math.random() * Math.PI * 2;
      const sp = U.rnd(40, 180) * (speedScale || 1);
      const life = U.rnd(.3, .75);
      pool.push({ x, y, vx: Math.cos(a)*sp, vy: Math.sin(a)*sp,
        life, maxLife: life, size: U.rnd(1.2, 3.5),
        color: U.rndPick(colorsArr || CFG.C.EXP) });
    }
  }

  return {
    init()  { pool = []; },
    reset() { pool = []; },
    torpImpact(x, y) { spark(x, y, 22, ['#4499ff','#88ccff','#ffffff','#aaddff'], 1.4); },
    phaserHit (x, y) { spark(x, y,  6, ['#ff8830','#ffcc44','#ffffff'], .7); },
    flash(x, y, r)   { pool.push({ type:'flash', x, y, r, life:.22, maxLife:.22 }); },
    explode(x, y, r) {
      spark(x, y, 32, CFG.C.EXP, 1 + r*.025);
      pool.push({ type:'flash', x, y, r, life:.32, maxLife:.32 });
    },
    update(dt) {
      for (const p of pool) {
        p.life -= dt;
        if (p.type==='flash') continue;
        p.x += p.vx*dt; p.y += p.vy*dt;
        p.vx *= 1-dt*2.4; p.vy *= 1-dt*2.4;
      }
      pool = pool.filter(p=>p.life>0);
      if (pool.length>600) pool.splice(0, pool.length-600);
    },
    render(ctx) {
      for (const p of pool) {
        const t = p.life/p.maxLife;
        if (p.type==='flash') {
          const g=ctx.createRadialGradient(p.x,p.y,0,p.x,p.y,p.r*(2-t));
          g.addColorStop(0,'#ffffff'); g.addColorStop(.3,'#ffaa44'); g.addColorStop(1,'transparent');
          ctx.save(); ctx.globalAlpha=(1-t)*.75; ctx.fillStyle=g;
          ctx.beginPath(); ctx.arc(p.x,p.y,p.r*(2-t),0,Math.PI*2); ctx.fill(); ctx.restore();
        } else {
          ctx.save(); ctx.globalAlpha=t; ctx.fillStyle=p.color;
          ctx.shadowColor=p.color; ctx.shadowBlur=5;
          ctx.beginPath(); ctx.arc(p.x,p.y,p.size*t,0,Math.PI*2); ctx.fill();
          ctx.shadowBlur=0; ctx.restore();
        }
      }
    }
  };
})();

// ═══════════════════════════════════════════════════════════════════
//  PHASERS  — auto-sustained beam
//  Continuous damage: CFG.PHASER_DPS hp/second to nearest (or priority) enemy.
//  Visual: permanent orange beam while target exists.
// ═══════════════════════════════════════════════════════════════════
const Phasers = (() => {
  let target = null;           // current auto-target
  let priorityTarget = null;   // manually tapped override
  let priorityTimer  = 0;      // seconds remaining on priority lock
  let active = false;          // beam is firing this frame
  let beamAlpha = 0;           // smooth beam fade in/out
  let hitTimer  = 0;           // interval for particle hits

  // Public endpoints
  let bx1=0, by1=0, bx2=0, by2=0;   // beam coords for rendering

  return {
    get active() { return active; },
    get beamAlpha() { return beamAlpha; },

    init()  { target=null; priorityTarget=null; priorityTimer=0; active=false; beamAlpha=0; },
    reset() { target=null; priorityTarget=null; priorityTimer=0; active=false; beamAlpha=0; },

    // Called by game.js when player taps on an enemy
    setPriorityTarget(enemy) {
      if (!enemy || enemy.dead) return;
      priorityTarget = enemy;
      priorityTimer  = 3.5;   // seconds of priority lock
    },

    update(dt, playerX, playerY) {
      // Decay priority lock
      if (priorityTimer > 0) {
        priorityTimer -= dt;
        if (priorityTimer <= 0 || (priorityTarget && priorityTarget.dead)) {
          priorityTarget = null;
          priorityTimer  = 0;
        }
      }

      // Select target: priority override > nearest enemy
      if (priorityTarget && !priorityTarget.dead && priorityTarget.scale > 0.04) {
        target = priorityTarget;
      } else {
        // Find nearest visible enemy
        let best = null, bestD = Infinity;
        for (const e of Enemies.list) {
          if (e.dead || e.scale < 0.04) continue;
          const d = Math.hypot(e.sx - playerX, e.sy - playerY);
          if (d < bestD) { bestD = d; best = e; }
        }
        target = best;
      }

      active = target !== null && !target.dead;

      // Smooth beam alpha
      const targetAlpha = active ? 1 : 0;
      beamAlpha = U.lerp(beamAlpha, targetAlpha, dt * 14);

      if (active) {
        bx1 = playerX; by1 = playerY;
        bx2 = target.sx; by2 = target.sy;

        // Apply continuous damage — reduced by Borg adaptation
        const isBorg = target.type.startsWith('borg');
        const mult   = isBorg ? BorgAdaptation.multiplier : 1.0;
        const dmg    = CFG.PHASER_DPS * dt * mult;
        target.takeDamage(dmg);
        if (isBorg) BorgAdaptation.onPhaserHit(CFG.PHASER_DPS * dt);
        if (target.dead) Game.addScore(target.points);

        // Periodic particle hits (every 0.12s)
        hitTimer -= dt;
        if (hitTimer <= 0) {
          Particles.phaserHit(bx2, by2);
          hitTimer = 0.12;
        }
      } else {
        hitTimer = 0;
      }
    },

    render(ctx) {
      if (beamAlpha < 0.02) return;

      // Subtle pulse: beam width/brightness oscillates slightly
      const pulse = 1 + Math.sin(Date.now() / 60) * 0.15;
      const alpha  = beamAlpha * pulse;

      Draw.phaserBeam(ctx, bx1, by1, bx2, by2, alpha);

      // Priority target indicator: tighter targeting reticle
      if (priorityTarget && !priorityTarget.dead && priorityTimer > 0) {
        const fade = Math.min(1, priorityTimer) * 0.8;
        ctx.save();
        ctx.globalAlpha = fade;
        ctx.strokeStyle = '#ffcc44';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 4]);
        ctx.lineDashOffset = -(Date.now() / 30) % 8;
        ctx.beginPath();
        ctx.arc(priorityTarget.sx, priorityTarget.sy, 28 * priorityTarget.scale, 0, Math.PI*2);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.restore();
      }
    }
  };
})();

// ═══════════════════════════════════════════════════════════════════
//  PROJECTILES  — photon torpedoes only
// ═══════════════════════════════════════════════════════════════════
const Projectiles = (() => {
  let list = [];

  return {
    init()  { list = []; },
    reset() { list = []; },

    fireTorpedoFrom(x, y) {
      // Find nearest visible enemy
      let best = null, bestD = Infinity;
      for (const e of Enemies.list) {
        if (e.dead || e.scale < .04) continue;
        const d = Math.hypot(e.sx - x, e.sy - y);
        if (d < bestD) { bestD = d; best = e; }
      }
      list.push({
        type: 'torpedo',
        x, y, vx: 0, vy: -320,
        target: best,
        life: 3.5, maxLife: 3.5,
        size: 8, dead: false,
      });
    },

    update(dt) {
      for (const p of list) {
        if (p.dead) continue;
        // Homing guidance
        if (p.target && !p.target.dead) {
          const dx = p.target.sx - p.x, dy = p.target.sy - p.y;
          const d  = Math.hypot(dx, dy);
          if (d > 8) {
            p.vx = U.lerp(p.vx, (dx/d)*500, dt*5);
            p.vy = U.lerp(p.vy, (dy/d)*500, dt*5);
          }
        }
        p.x += p.vx*dt; p.y += p.vy*dt;
        p.life -= dt;
        p.size = 8 - (1-p.life/p.maxLife)*2.5;

        for (const e of Enemies.list) {
          if (e.dead) continue;
          if (U.circles(p.x, p.y, 10, e.sx, e.sy, 40*e.scale)) {
            e.takeDamage(CFG.TORPEDO_DAMAGE);
            if (e.dead) Game.addScore(e.points);
            if (e.type && e.type.startsWith('borg')) BorgAdaptation.onTorpedoHit();
            Particles.torpImpact(p.x, p.y);
            p.dead = true; break;
          }
        }
        if (p.life<=0||p.x<-80||p.x>CFG.W+80||p.y<-80) p.dead=true;
      }
      list = list.filter(p=>!p.dead);
    },

    render(ctx) {
      for (const p of list) {
        if (p.dead) continue;
        Draw.torpedo(ctx, p.x, p.y, p.size*(1-(1-p.life/p.maxLife)*.35), 1);
      }
    }
  };
})();

// ═══════════════════════════════════════════════════════════════════
//  NOVA  — area-clear weapon (expanding ring, 15s cooldown)
// ═══════════════════════════════════════════════════════════════════
const Nova = (() => {
  let rings    = [];
  let cooldown = 0;

  return {
    get ready()       { return cooldown <= 0; },
    get cooldown()    { return cooldown; },
    get cooldownPct() { return U.clamp(1 - cooldown/CFG.NOVA_COOLDOWN, 0, 1); },

    init()  { rings = []; cooldown = 0; },
    reset() { rings = []; cooldown = 0; },

    fire(px, py) {
      if (cooldown > 0) return false;
      rings.push({ x:px, y:py, r:15, life:1, dead:false });
      cooldown = CFG.NOVA_COOLDOWN;
      HUD.alert('◎ NOVA DISCHARGE', 1800);
      Particles.explode(px, py, 60);
      BorgAdaptation.onNova();
      return true;
    },

    update(dt) {
      if (cooldown > 0) cooldown = Math.max(0, cooldown - dt);
      for (const ring of rings) {
        const prevR = ring.r;
        ring.r += CFG.NOVA_RING_SPEED * dt;
        ring.life = U.clamp(1 - ring.r/1300, 0, 1);
        for (const e of Enemies.list) {
          if (e.dead || e.hitByNova) continue;
          const d = Math.hypot(e.sx-ring.x, e.sy-ring.y);
          if (d >= prevR-10 && d <= ring.r+10) {
            e.hitByNova = true;
            e.takeDamage(e.maxHp * 3);
            Game.addScore(e.points);
            Particles.explode(e.sx, e.sy, 45+e.scale*70);
          }
        }
        if (ring.r > 1350) ring.dead = true;
      }
      rings = rings.filter(r=>!r.dead);
    },

    render(ctx) {
      for (const ring of rings) {
        const a = ring.life;
        ctx.save();
        ctx.globalAlpha = a*.35;
        ctx.strokeStyle='#88ccff'; ctx.lineWidth=22*a+4;
        ctx.shadowColor='#44aaff'; ctx.shadowBlur=30*a;
        ctx.beginPath(); ctx.arc(ring.x,ring.y,ring.r,0,Math.PI*2); ctx.stroke();
        ctx.shadowBlur=0;
        ctx.globalAlpha=a*.85;
        ctx.strokeStyle='#ffffff'; ctx.lineWidth=5*a+1;
        ctx.beginPath(); ctx.arc(ring.x,ring.y,ring.r,0,Math.PI*2); ctx.stroke();
        ctx.globalAlpha=a*.5;
        ctx.strokeStyle='#aaddff'; ctx.lineWidth=2;
        ctx.beginPath(); ctx.arc(ring.x,ring.y,ring.r-9,0,Math.PI*2); ctx.stroke();
        ctx.restore();
      }
    }
  };
})();

// ═══════════════════════════════════════════════════════════════════
//  BORG ADAPTATION  — Borg learn to resist phaser frequencies over time
//  Based on TNG: Borg adapt to energy weapons, requiring frequency modulation.
//  Mechanic:
//    - Phasers deal reduced damage to Borg as adaptation builds (0–100%)
//    - Torpedo hit disrupts adaptation (−25 per hit)
//    - Nova resets adaptation completely
//    - Slow natural decay between engagements
//    - Visual: pulsing green "ADAPTATION LEVEL XX%" in game area
// ═══════════════════════════════════════════════════════════════════
const BorgAdaptation = (() => {
  let level     = 0;   // 0–100 %
  let showTimer = 0;   // seconds to show overlay

  return {
    get level()      { return level; },
    get multiplier() {
      // Damage multiplier: 1.0 at level 0, drops to 0.08 at level 100
      return Math.max(0.08, 1 - (level / 108));
    },
    get active()     { return level > 2; },

    init()  { level = 0; showTimer = 0; },
    reset() { level = 0; showTimer = 0; },

    // Call when phasers deal damage to a Borg entity
    onPhaserHit(rawDamage) {
      // Borg adapt faster than they take damage — each second of phaser fire builds 12%
      level = Math.min(100, level + rawDamage * 0.8);
      showTimer = 3.5;
    },

    // Call when a torpedo kills / hits a Borg — disrupts frequency lock
    onTorpedoHit() {
      level = Math.max(0, level - 25);
      showTimer = 2.5;
    },

    // Call when Nova fires — overwhelming energy resets adaptation
    onNova() {
      level = 0;
      showTimer = 0;
    },

    update(dt) {
      // Slow natural decay (2%/second while not actively firing)
      if (level > 0) level = Math.max(0, level - dt * 2.5);
      if (showTimer > 0) showTimer -= dt;
    },

    render(ctx, gameAreaCX, gameAreaTop) {
      if (level < 3) return;
      const a = Math.min(1, level / 12) * (showTimer > 0 ? 1 : Math.min(1, level/40));
      if (a < 0.05) return;

      ctx.save();
      ctx.globalAlpha = a;

      const pct = level / 100;
      const barW = 340, barH = 18;
      const bx = gameAreaCX - barW/2;
      const by = gameAreaTop + 45;

      // Background panel
      ctx.fillStyle = 'rgba(0,20,0,.75)';
      U.rRect(ctx, bx-10, by-22, barW+20, barH+28, 4); ctx.fill();
      ctx.strokeStyle = `rgba(0,${Math.floor(180+pct*75)},0,.6)`;
      ctx.lineWidth = 1;
      U.rRect(ctx, bx-10, by-22, barW+20, barH+28, 4); ctx.stroke();

      // Label
      const urgency = pct > .7 ? '#ff4444' : pct > .4 ? '#ffaa00' : '#00cc44';
      ctx.fillStyle = urgency;
      ctx.font = `bold 11px monospace`;
      ctx.textAlign = 'center';
      ctx.shadowColor = urgency; ctx.shadowBlur = 8;
      ctx.fillText(`ADAPTATION LEVEL ${Math.ceil(level)}%`, gameAreaCX, by - 7);
      ctx.shadowBlur = 0;

      // Bar track
      ctx.fillStyle = '#001400'; ctx.fillRect(bx, by, barW, barH);
      ctx.strokeStyle = 'rgba(0,180,0,.3)'; ctx.lineWidth=.7; ctx.strokeRect(bx,by,barW,barH);

      // Bar fill — color shifts red as adaptation grows
      const rCol = Math.floor(pct * 220);
      const gCol = Math.floor((1-pct) * 200 + 44);
      ctx.fillStyle = `rgba(${rCol},${gCol},20,.9)`;
      ctx.shadowColor = `rgb(${rCol},${gCol},20)`; ctx.shadowBlur = 8;
      ctx.fillRect(bx+1, by+1, (barW-2)*pct, barH-2);
      ctx.shadowBlur = 0;

      // Segment ticks
      ctx.strokeStyle = 'rgba(0,180,0,.15)'; ctx.lineWidth=.5;
      for(let i=1;i<10;i++){const sx=bx+barW/10*i;ctx.beginPath();ctx.moveTo(sx,by+2);ctx.lineTo(sx,by+barH-2);ctx.stroke();}

      // Warning when critical
      if (pct > 0.75 && Math.sin(Date.now()/200) > 0) {
        ctx.fillStyle = '#ff4444'; ctx.font = 'bold 9px monospace'; ctx.textAlign='center';
        ctx.fillText('PHASERS INEFFECTIVE — USE TORPEDOES', gameAreaCX, by+barH+14);
      }

      ctx.restore();
    }
  };
})();

// ═══════════════════════════════════════════════════════════════════
//  ENEMY FIRE — enemy projectiles that the player must dodge
//  ~50% of enemy types fire back. Slow-moving colored bolts aimed
//  at the player's current position when fired.
//  Bolt colors: orange=Klingon, green=Borg, purple=Dominion,
//               yellow=Romulan, red=Cardassian, lime=8472
// ═══════════════════════════════════════════════════════════════════
const EnemyFire = (() => {
  let bolts = [];

  // Which types fire, their color and base interval (seconds)
  const FIRE_CONFIG = {
    bop:         { col:'#ff8822', interval:4.5 },
    borg:        { col:'#22ff88', interval:3.5 },
    borg_sphere: { col:'#44ffaa', interval:4.0 },
    borg_assimil:{ col:'#00ff44', interval:2.5 },
    valdore:     { col:'#ffff44', interval:4.0 },
    dderidex:    { col:'#ffff22', interval:3.0 },
    vorcha:      { col:'#ff6600', interval:3.8 },
    neghvar:     { col:'#ff4400', interval:2.8 },
    galor:       { col:'#ff3300', interval:3.5 },
    keldon:      { col:'#ff2200', interval:2.5 },
    jem_hadar:   { col:'#cc44ff', interval:3.2 },
    jem_battle:  { col:'#aa22ee', interval:2.2 },
    bioship:      { col:'#88ff22', interval:3.0 },
    bioship_lg:   { col:'#66ff00', interval:1.8 },
    lore_scout:   { col:'#44ffcc', interval:3.5 },
    lore_enforcer:{ col:'#aaff22', interval:2.0 },
    lore_titan:   { col:'#00ff66', interval:5.5 },  // slow but big focal beam
  };

  return {
    init()  { bolts = []; },
    reset() { bolts = []; },

    // Called by Enemy.update when fire timer elapses
    fire(enemy, playerX, playerY) {
      const cfg = FIRE_CONFIG[enemy.type];
      if (!cfg) return;
      // Aim at player with slight spread
      const dx = playerX - enemy.sx + U.rnd(-40, 40);
      const dy = playerY - enemy.sy + U.rnd(-20, 20);
      const dist = Math.hypot(dx, dy);
      const speed = U.rnd(280, 380);
      const isTitan = enemy.type === 'lore_titan';
      bolts.push({
        x: enemy.sx, y: enemy.sy,
        vx: (dx/dist)*(isTitan?520:speed), vy: (dy/dist)*(isTitan?520:speed),
        col: cfg.col,
        life: 3.5, dead: false,
        size: isTitan ? 12 : enemy.type === 'bioship_lg' ? 7 : enemy.type === 'borg_assimil' ? 6 : 4,
        damage: isTitan ? 28 : 12,
      });
    },

    // Returns base fire interval for an enemy type, scaled by wave difficulty
    getInterval(type, wave) {
      const cfg = FIRE_CONFIG[type];
      if (!cfg) return Infinity;
      // Gets faster each act (~15% per 5 waves)
      const scale = Math.max(0.45, 1 - (wave-1) * 0.04);
      return cfg.interval * scale;
    },

    hasFire(type) { return !!FIRE_CONFIG[type]; },

    update(dt) {
      for (const b of bolts) {
        if (b.dead) continue;
        b.x += b.vx * dt;
        b.y += b.vy * dt;
        b.life -= dt;
        // Hit player
        const hitR = b.size > 10 ? 36 : 28;
        if (Math.hypot(b.x - Player.x, b.y - Player.y) < hitR) {
          Player.takeHit(b.damage || 12);
          b.dead = true;
          Particles.flash(b.x, b.y, 18);
          continue;
        }
        // Out of bounds or expired
        if (b.life <= 0 || b.x < 120 || b.x > CFG.W-120 || b.y < 80 || b.y > CFG.H-60)
          b.dead = true;
      }
      bolts = bolts.filter(b => !b.dead);
    },

    render(ctx) {
      for (const b of bolts) {
        if (b.dead) continue;
        // Elongated bolt in direction of travel
        const angle = Math.atan2(b.vy, b.vx);
        const len = b.size * 4;
        ctx.save();
        ctx.translate(b.x, b.y);
        ctx.rotate(angle);
        // Outer glow
        ctx.globalAlpha = 0.4;
        ctx.fillStyle = b.col;
        ctx.shadowColor = b.col; ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.ellipse(0, 0, len, b.size*1.2, 0, 0, Math.PI*2);
        ctx.fill();
        // Bright core
        ctx.globalAlpha = 0.95;
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.ellipse(0, 0, len*.6, b.size*.55, 0, 0, Math.PI*2);
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.restore();
      }
    },
  };
})();
