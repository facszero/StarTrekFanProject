'use strict';

/**
 * BgExplosions — ambient explosion effects drawn over background images.
 * Three types:
 *   orbital_bomb  : slow ring + flash on planet surface (Acts I, IV)
 *   station_spark : tiny compartment sparks on DS9 (Act III)
 *   lore_fire     : orange fire bursts on Lore's body (Act V waves 19-20)
 *
 * Hotspots are % of canvas (so they survive any resolution change).
 * Drawn AFTER background, BEFORE HUD frame — part of the scene.
 */
const BgExplosions = (() => {
  let pool  = [];
  let timer = 0;

  // ── Hotspot definitions (cx%, cy% of canvas 1280×720) ─────────
  const HOTSPOTS = {
    // Act I: Klingon planet surface — city lights area (right hemisphere)
    blue: {
      type: 'orbital_bomb',
      spots: [
        [0.62,0.55],[0.70,0.62],[0.75,0.48],[0.80,0.58],[0.68,0.70],
        [0.58,0.65],[0.85,0.45],[0.72,0.75],[0.55,0.72],[0.78,0.68],
      ],
      interval: [4, 8],
    },
    // Act II: green nebula / station — few sparks on station silhouette
    green: {
      type: 'station_spark',
      spots: [
        [0.22,0.52],[0.18,0.48],[0.20,0.56],[0.24,0.50],[0.16,0.54],
      ],
      interval: [3, 6],
    },
    // Act III: DS9 being assimilated — sparks on station arms
    borg: {
      type: 'station_spark',
      spots: [
        [0.18,0.50],[0.14,0.46],[0.22,0.54],[0.20,0.42],[0.16,0.58],
        [0.12,0.52],[0.24,0.48],[0.19,0.60],
      ],
      interval: [2, 5],
    },
    // Act IV: Earth under attack — explosions scattered over planet
    deep: {
      type: 'orbital_bomb',
      spots: [
        [0.70,0.45],[0.78,0.52],[0.65,0.58],[0.82,0.42],[0.74,0.62],
        [0.68,0.38],[0.85,0.55],[0.72,0.70],[0.60,0.50],[0.88,0.48],
      ],
      interval: [3, 6],
    },
  };

  // Act V wave-specific — Lore's body progressive damage
  const LORE_HOTSPOTS = {
    // wave 16-17: none (Lore still intact)
    18: {
      type: 'lore_fire',
      spots: [[0.45,0.12],[0.62,0.08]],
      interval: [5, 9],
    },
    19: {
      type: 'lore_fire',
      spots: [[0.30,0.18],[0.45,0.10],[0.62,0.07],[0.72,0.20],[0.20,0.30],[0.80,0.28]],
      interval: [2, 5],
    },
    20: {
      type: 'lore_fire',
      spots: [[0.28,0.15],[0.38,0.08],[0.45,0.12],[0.55,0.06],[0.62,0.10],
               [0.70,0.18],[0.78,0.25],[0.20,0.32],[0.82,0.30],[0.50,0.22],
               [0.35,0.28],[0.65,0.35]],
      interval: [1, 3],
    },
  };

  function _activeConfig() {
    if (typeof Story === 'undefined' || !Story.currentAct) return null;
    const act = Story.currentAct;
    const wave = (typeof Enemies !== 'undefined') ? Enemies.currentWave : 1;

    if (act.num === 5) {
      return LORE_HOTSPOTS[wave] || null;
    }
    const theme = Background.currentTheme || act.bg || 'blue';
    return HOTSPOTS[theme] || null;
  }

  function _nextInterval(cfg) {
    const [lo, hi] = cfg.interval;
    return U.rnd(lo, hi);
  }

  function _spawn(cfg) {
    const spot = U.rndPick(cfg.spots);
    if (!spot) return;
    const cx = spot[0] * CFG.W;
    const cy = spot[1] * CFG.H;
    // Add small jitter so repeated hits look different
    const jx = U.rnd(-18, 18), jy = U.rnd(-12, 12);

    if (cfg.type === 'orbital_bomb') {
      pool.push({ type:'orbital_bomb', x:cx+jx, y:cy+jy, r:0, maxR:U.rnd(28,62), life:1, maxLife:1, col:'#ff8830' });
    } else if (cfg.type === 'station_spark') {
      // Multiple sparks at once for a compartment hit feel
      for (let i=0;i<U.rndInt(3,6);i++){
        pool.push({ type:'spark', x:cx+U.rnd(-8,8), y:cy+U.rnd(-8,8),
          vx:U.rnd(-30,30), vy:U.rnd(-40,10),
          life:U.rnd(0.4,0.9), maxLife:0.9,
          r:U.rnd(2,5), col:U.rndPick(['#ff8820','#ffcc44','#ffffff','#ff4400']) });
      }
    } else if (cfg.type === 'lore_fire') {
      pool.push({ type:'lore_fire', x:cx+jx, y:cy+jy, r:0, maxR:U.rnd(22,55), life:1.2, maxLife:1.2 });
      // Secondary flash
      pool.push({ type:'orbital_bomb', x:cx+jx+U.rnd(-10,10), y:cy+jy+U.rnd(-8,8),
        r:0, maxR:U.rnd(12,28), life:0.7, maxLife:0.7, col:'#ff6600' });
    }
  }

  return {
    get currentTheme() { return typeof Background !== 'undefined' ? Background.currentTheme : 'blue'; },

    init()  { pool=[]; timer=0; },
    reset() { pool=[]; timer=0; },

    update(dt) {
      // Decay pool
      for (const e of pool) {
        e.life -= dt;
        if (e.type === 'orbital_bomb' || e.type === 'lore_fire') {
          const progress = 1 - e.life/e.maxLife;
          e.r = e.maxR * Math.pow(progress, 0.55);
        } else if (e.type === 'spark') {
          e.x += e.vx*dt; e.y += e.vy*dt;
          e.vy += 8*dt;  // slight gravity
        }
      }
      pool = pool.filter(e => e.life > 0);

      // Spawn timer
      timer -= dt;
      if (timer <= 0) {
        const cfg = _activeConfig();
        if (cfg) {
          _spawn(cfg);
          timer = _nextInterval(cfg);
        } else {
          timer = 3.0;
        }
      }
    },

    render(ctx) {
      if (!pool.length) return;
      ctx.save();
      for (const e of pool) {
        const t = e.life / e.maxLife;  // 1→0

        if (e.type === 'orbital_bomb') {
          // Expanding ring: bright center fading out
          const alpha = Math.pow(t, 0.5) * 0.75;
          ctx.globalAlpha = alpha;
          // Glow ring
          ctx.strokeStyle = e.col || '#ff8830';
          ctx.lineWidth   = Math.max(1, (1-t)*12 + 2);
          ctx.shadowColor = e.col || '#ff8830';
          ctx.shadowBlur  = 18 * t;
          ctx.beginPath(); ctx.arc(e.x, e.y, e.r, 0, Math.PI*2); ctx.stroke();
          ctx.shadowBlur = 0;
          // Bright inner flash (early phase only)
          if (t > 0.6) {
            ctx.globalAlpha = (t-0.6)/0.4 * 0.8;
            ctx.fillStyle = '#ffffff';
            ctx.shadowColor = '#ffcc44'; ctx.shadowBlur = 20;
            ctx.beginPath(); ctx.arc(e.x, e.y, e.r*0.3, 0, Math.PI*2); ctx.fill();
            ctx.shadowBlur = 0;
          }

        } else if (e.type === 'lore_fire') {
          // Larger, more orange fire burst
          const alpha = Math.pow(t, 0.4) * 0.85;
          ctx.globalAlpha = alpha;
          const g = ctx.createRadialGradient(e.x, e.y, 0, e.x, e.y, e.r);
          g.addColorStop(0, 'rgba(255,255,180,0.9)');
          g.addColorStop(0.3, 'rgba(255,140,20,0.7)');
          g.addColorStop(1, 'rgba(200,40,0,0)');
          ctx.fillStyle = g;
          ctx.beginPath(); ctx.arc(e.x, e.y, e.r, 0, Math.PI*2); ctx.fill();

        } else if (e.type === 'spark') {
          ctx.globalAlpha = t * 0.9;
          ctx.fillStyle = e.col;
          ctx.shadowColor = e.col; ctx.shadowBlur = 6;
          ctx.beginPath(); ctx.arc(e.x, e.y, e.r*t, 0, Math.PI*2); ctx.fill();
          ctx.shadowBlur = 0;
        }
      }
      ctx.globalAlpha = 1;
      ctx.restore();
    },
  };
})();
