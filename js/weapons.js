'use strict';

// ═══════════════════════════════════════════════════════════════════
//  PARTICLES
// ═══════════════════════════════════════════════════════════════════
const Particles = (() => {
  let pool = [];

  function spark(x, y, n, colorsArr, speedScale) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const sp = U.rnd(40, 180) * (speedScale || 1);
      const life = U.rnd(.3, .75);
      pool.push({
        x, y, vx: Math.cos(a)*sp, vy: Math.sin(a)*sp,
        life, maxLife: life,
        size: U.rnd(1.2, 3.5),
        color: U.rndPick(colorsArr || CFG.C.EXP),
      });
    }
  }

  return {
    init()  { pool = []; },
    reset() { pool = []; },

    torpImpact(x, y) { spark(x, y, 22, ['#4499ff','#88ccff','#ffffff','#aaddff'], 1.4); },
    phaserHit (x, y) { spark(x, y,  6, ['#ff8830','#ffcc44','#ffffff'],             .7); },

    explode(x, y, r) {
      spark(x, y, 32, CFG.C.EXP, 1 + r * .025);
      pool.push({ type:'flash', x, y, r, life:.32, maxLife:.32 });
    },

    update(dt) {
      for (const p of pool) {
        p.life -= dt;
        if (p.type === 'flash') continue;
        p.x  += p.vx * dt;
        p.y  += p.vy * dt;
        p.vx *= 1 - dt * 2.4;
        p.vy *= 1 - dt * 2.4;
      }
      pool = pool.filter(p => p.life > 0);
      if (pool.length > 600) pool.splice(0, pool.length - 600);
    },

    render(ctx) {
      for (const p of pool) {
        const t = p.life / p.maxLife;
        if (p.type === 'flash') {
          const gr = ctx.createRadialGradient(p.x,p.y,0, p.x,p.y, p.r*(2-t));
          gr.addColorStop(0, '#ffffff'); gr.addColorStop(.3,'#ffaa44');
          gr.addColorStop(1,'transparent');
          ctx.save(); ctx.globalAlpha = (1-t)*.75;
          ctx.fillStyle = gr;
          ctx.beginPath(); ctx.arc(p.x,p.y,p.r*(2-t),0,Math.PI*2); ctx.fill();
          ctx.restore();
        } else {
          ctx.save(); ctx.globalAlpha = t;
          ctx.fillStyle  = p.color;
          ctx.shadowColor= p.color; ctx.shadowBlur = 5;
          ctx.beginPath(); ctx.arc(p.x, p.y, p.size*t, 0, Math.PI*2); ctx.fill();
          ctx.shadowBlur = 0; ctx.restore();
        }
      }
    }
  };
})();

// ═══════════════════════════════════════════════════════════════════
//  PROJECTILES  (phasers + photon torpedoes)
// ═══════════════════════════════════════════════════════════════════
const Projectiles = (() => {
  let list = [];

  function nearestEnemy(fromX, fromY) {
    let best = null, bestD = Infinity;
    for (const e of Enemies.list) {
      if (e.dead || e.scale < .04) continue;
      const d = U.dist(fromX, fromY, e.sx, e.sy);
      if (d < bestD) { bestD = d; best = e; }
    }
    return best;
  }

  return {
    init()  { list = []; },
    reset() { list = []; },

    firePhaserFrom(x, y) {
      const tgt = nearestEnemy(x, y);
      const p = {
        type: 'phaser',
        x1: x, y1: y,
        x2: tgt ? tgt.sx : CFG.W/2,
        y2: tgt ? tgt.sy : CFG.HORIZON_Y,
        target: tgt,
        life: .13, maxLife: .13,
        hit: false, dead: false,
      };
      list.push(p);
    },

    fireTorpedoFrom(x, y) {
      const tgt = nearestEnemy(x, y);
      list.push({
        type: 'torpedo',
        x, y, vx: 0, vy: -320,
        sx: x, sy: y,
        target: tgt,
        life: 3.5, maxLife: 3.5,
        size: 8, dead: false,
      });
    },

    update(dt) {
      for (const p of list) {
        if (p.dead) continue;

        if (p.type === 'phaser') {
          p.life -= dt;
          // Instant damage on frame of creation
          if (!p.hit && p.target && !p.target.dead) {
            p.target.takeDamage(CFG.PHASER_DAMAGE ?? 8);
            p.hit = true;
            Particles.phaserHit(p.x2, p.y2);
            if (p.target.dead) Game.addScore(p.target.points);
          }
          if (p.life <= 0) p.dead = true;

        } else if (p.type === 'torpedo') {
          // Homing guidance
          if (p.target && !p.target.dead) {
            const dx = p.target.sx - p.x, dy = p.target.sy - p.y;
            const d  = Math.hypot(dx, dy);
            if (d > 8) {
              p.vx = U.lerp(p.vx, (dx/d)*480, dt*5);
              p.vy = U.lerp(p.vy, (dy/d)*480, dt*5);
            }
          }
          p.x += p.vx * dt;
          p.y += p.vy * dt;
          p.sx = p.x; p.sy = p.y;
          p.life -= dt;
          p.size  = 8 - (1 - p.life/p.maxLife)*2.5;

          // Hit detection
          for (const e of Enemies.list) {
            if (e.dead) continue;
            const hr = 40 * e.scale;
            if (U.circles(p.x, p.y, 10, e.sx, e.sy, hr)) {
              e.takeDamage(CFG.TORPEDO_DAMAGE ?? 45);
              if (e.dead) Game.addScore(e.points);
              Particles.torpImpact(p.x, p.y);
              p.dead = true; break;
            }
          }
          if (p.life <= 0 || p.x<-80||p.x>CFG.W+80||p.y<-80) p.dead = true;
        }
      }
      list = list.filter(p => !p.dead);
    },

    render(ctx) {
      for (const p of list) {
        if (p.dead) continue;
        if (p.type === 'phaser') {
          Draw.phaserBeam(ctx, p.x1,p.y1, p.x2,p.y2, p.life/p.maxLife);
        } else {
          Draw.torpedo(ctx, p.x, p.y, p.size * (1-(1-p.life/p.maxLife)*.35), 1);
        }
      }
    }
  };
})();
