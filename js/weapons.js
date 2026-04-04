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
    phaserHit (x, y) { spark(x, y,  8, ['#ff8830','#ffcc44','#ffffff'], .8); },
    flash(x, y, r)   { pool.push({ type:'flash', x, y, r, life:.24, maxLife:.24 }); },
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
//  PROJECTILES
// ═══════════════════════════════════════════════════════════════════
const Projectiles = (() => {
  let list = [];

  return {
    init()  { list = []; },
    reset() { list = []; },

    // ── Tap-targeted phaser (manual) ──────────────────────────────
    firePhaserAt(fromX, fromY, target) {
      if (!target || target.dead) return;
      list.push({
        type: 'phaser',
        x1: fromX, y1: fromY,
        x2: target.sx, y2: target.sy,
        target,
        life: 0.45, maxLife: 0.45,   // longer — 0.20 was too short on mobile
        hit: false, dead: false,
      });
    },

    // ── Torpedo: homing, toward nearest enemy ─────────────────────
    fireTorpedoFrom(x, y) {
      // Find nearest visible enemy
      let best = null, bestD = Infinity;
      for (const e of Enemies.list) {
        if (e.dead || e.scale < .04) continue;
        const d = U.dist(x, y, e.sx, e.sy);
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

        if (p.type === 'phaser') {
          p.life -= dt;
          if (!p.hit && p.target && !p.target.dead) {
            p.target.takeDamage(CFG.PHASER_DAMAGE);
            p.hit = true;
            // Bright impact flash at hit point
            Particles.phaserHit(p.x2, p.y2);
            Particles.flash(p.x2, p.y2, 28);
            if (p.target.dead) Game.addScore(p.target.points);
          }
          if (p.life <= 0) p.dead = true;

        } else if (p.type === 'torpedo') {
          // Homing guidance
          if (p.target && !p.target.dead) {
            const dx = p.target.sx - p.x, dy = p.target.sy - p.y;
            const d  = Math.hypot(dx, dy);
            if (d > 8) { p.vx = U.lerp(p.vx,(dx/d)*480,dt*5); p.vy = U.lerp(p.vy,(dy/d)*480,dt*5); }
          }
          p.x += p.vx*dt; p.y += p.vy*dt;
          p.life -= dt;
          p.size = 8 - (1-p.life/p.maxLife)*2.5;

          for (const e of Enemies.list) {
            if (e.dead) continue;
            if (U.circles(p.x,p.y,10,e.sx,e.sy,40*e.scale)) {
              e.takeDamage(CFG.TORPEDO_DAMAGE);
              if (e.dead) Game.addScore(e.points);
              Particles.torpImpact(p.x,p.y);
              p.dead = true; break;
            }
          }
          if (p.life<=0||p.x<-80||p.x>CFG.W+80||p.y<-80) p.dead=true;
        }
      }
      list = list.filter(p=>!p.dead);
    },

    render(ctx) {
      for (const p of list) {
        if (p.dead) continue;
        if (p.type==='phaser') Draw.phaserBeam(ctx,p.x1,p.y1,p.x2,p.y2,p.life/p.maxLife);
        else                   Draw.torpedo(ctx,p.x,p.y,p.size*(1-(1-p.life/p.maxLife)*.35),1);
      }
    }
  };
})();

// ═══════════════════════════════════════════════════════════════════
//  NOVA  — area-clear weapon (expanding ring, 15s cooldown)
// ═══════════════════════════════════════════════════════════════════
const Nova = (() => {
  let rings    = [];
  let cooldown = 0;   // seconds remaining

  return {
    get ready()        { return cooldown <= 0; },
    get cooldown()     { return cooldown; },
    get cooldownPct()  { return U.clamp(1 - cooldown/CFG.NOVA_COOLDOWN, 0, 1); },

    init()  { rings = []; cooldown = 0; },
    reset() { rings = []; cooldown = 0; },

    fire(px, py) {
      if (cooldown > 0) return false;
      rings.push({ x: px, y: py, r: 15, life: 1, dead: false });
      cooldown = CFG.NOVA_COOLDOWN;
      HUD.alert('◎ NOVA DISCHARGE', 1800);
      Particles.explode(px, py, 60);
      return true;
    },

    update(dt) {
      if (cooldown > 0) cooldown = Math.max(0, cooldown - dt);

      for (const ring of rings) {
        const prevR = ring.r;
        ring.r += CFG.NOVA_RING_SPEED * dt;
        ring.life = U.clamp(1 - ring.r / 1300, 0, 1);

        // Hit enemies as ring passes through them
        for (const e of Enemies.list) {
          if (e.dead || e.hitByNova) continue;
          const d = Math.hypot(e.sx - ring.x, e.sy - ring.y);
          if (d >= prevR - 10 && d <= ring.r + 10) {
            e.hitByNova = true;
            e.takeDamage(e.maxHp * 3);     // guaranteed kill
            Game.addScore(e.points);
            Particles.explode(e.sx, e.sy, 45 + e.scale * 70);
          }
        }
        if (ring.r > 1350) ring.dead = true;
      }
      rings = rings.filter(r => !r.dead);
    },

    render(ctx) {
      for (const ring of rings) {
        const a = ring.life;
        ctx.save();

        // Outer glow
        ctx.globalAlpha = a * .35;
        ctx.strokeStyle = '#88ccff';
        ctx.lineWidth   = 22 * a + 4;
        ctx.shadowColor = '#44aaff';
        ctx.shadowBlur  = 30 * a;
        ctx.beginPath(); ctx.arc(ring.x, ring.y, ring.r, 0, Math.PI*2); ctx.stroke();
        ctx.shadowBlur = 0;

        // Core ring
        ctx.globalAlpha = a * .85;
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth   = 5 * a + 1;
        ctx.beginPath(); ctx.arc(ring.x, ring.y, ring.r, 0, Math.PI*2); ctx.stroke();

        // Inner energy ring
        ctx.globalAlpha = a * .5;
        ctx.strokeStyle = '#aaddff';
        ctx.lineWidth   = 2;
        ctx.beginPath(); ctx.arc(ring.x, ring.y, ring.r - 9, 0, Math.PI*2); ctx.stroke();

        ctx.restore();
      }
    }
  };
})();
