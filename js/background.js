'use strict';

const Background = (() => {
  const STAR_N    = 320;
  const NEBULA_N  = 3;
  let   stars     = [];
  let   nebulae   = [];
  let   tick      = 0;
  let   warpMult  = 1;
  let   targetMult= 1;

  // ── Star ──────────────────────────────────────────────────────────────
  function mkStar(scattered) {
    const s = {
      angle:  Math.random() * Math.PI * 2,
      dist:   scattered ? U.rnd(5, 750) : U.rnd(2, 18),
      speed:  U.rnd(55, 240),
      max:    U.rnd(500, 950),
      bright: U.rnd(0.45, 1),
      size:   U.rnd(0.3, 1.8),
      tint:   Math.random() > .88 ? (Math.random() > .5 ? '#aaccff' : '#ffeecc') : '#ffffff',
    };
    return s;
  }

  function mkNebula(i) {
    return {
      x:  U.rnd(200, CFG.W - 200),
      y:  U.rnd(80,  CFG.H - 200),
      r:  U.rnd(180, 340),
      c1: ['#1a2a5a','#0d2a40','#1a1040'][i % 3],
      c2: ['#3355cc','#226688','#552299'][i % 3],
      phase: Math.random() * Math.PI * 2,
    };
  }

  // ── Public ─────────────────────────────────────────────────────────────
  return {
    init() {
      stars   = Array.from({length: STAR_N}, () => mkStar(true));
      nebulae = Array.from({length: NEBULA_N}, (_, i) => mkNebula(i));
    },

    setWarp(active) { targetMult = active ? 9 : 1; },

    update(dt) {
      tick += dt;
      warpMult = U.lerp(warpMult, targetMult, dt * 2.5);

      for (const s of stars) {
        s.dist += s.speed * warpMult * dt;
        if (s.dist > s.max) Object.assign(s, mkStar(false));
      }
    },

    render(ctx) {
      const cx = CFG.W / 2, cy = CFG.HORIZON_Y;

      // ── deep space gradient ──
      const bg = ctx.createRadialGradient(cx, cy, 0, cx, cy, 720);
      bg.addColorStop(0, '#0a1428');
      bg.addColorStop(.55,'#060d18');
      bg.addColorStop(1,  '#020508');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, CFG.W, CFG.H);

      // ── nebulae ──
      ctx.save();
      for (const n of nebulae) {
        const pulse = .03 + Math.sin(tick * .25 + n.phase) * .012;
        ctx.globalAlpha = pulse;
        const g = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, n.r);
        g.addColorStop(0, n.c2);
        g.addColorStop(1, 'transparent');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r, 0, Math.PI*2);
        ctx.fill();
      }
      ctx.restore();

      // ── star tunnel ──
      for (const s of stars) {
        const x = cx + Math.cos(s.angle) * s.dist;
        const y = cy + Math.sin(s.angle) * s.dist;
        if (x < -8 || x > CFG.W+8 || y < -8 || y > CFG.H+8) continue;

        const fadeIn = Math.min(1, s.dist / 35);
        const alpha  = fadeIn * s.bright;
        const sz     = (s.dist / s.max) * s.size * 2.8 + 0.25;

        // streak when warping
        if (warpMult > 2.2 && s.dist > 45) {
          const px = cx + Math.cos(s.angle) * (s.dist - s.speed * warpMult * .045);
          const py = cy + Math.sin(s.angle) * (s.dist - s.speed * warpMult * .045);
          ctx.beginPath();
          ctx.moveTo(px, py);
          ctx.lineTo(x, y);
          ctx.strokeStyle = U.rgba(s.tint, alpha * .75);
          ctx.lineWidth   = sz * .55;
          ctx.stroke();
        } else {
          ctx.beginPath();
          ctx.arc(x, y, Math.max(.25, sz), 0, Math.PI*2);
          ctx.fillStyle = U.rgba(s.tint, alpha);
          ctx.fill();
        }
      }

      // ── subtle scanline vignette ──
      ctx.save();
      ctx.globalAlpha = .07;
      for (let sy = 0; sy < CFG.H; sy += 3) {
        ctx.fillStyle = '#000';
        ctx.fillRect(0, sy, CFG.W, 1);
      }
      const vign = ctx.createRadialGradient(cx, CFG.H/2, CFG.H*.25, cx, CFG.H/2, CFG.H*.85);
      vign.addColorStop(0, 'transparent');
      vign.addColorStop(1, 'rgba(0,0,0,.55)');
      ctx.globalAlpha = 1;
      ctx.fillStyle = vign;
      ctx.fillRect(0, 0, CFG.W, CFG.H);
      ctx.restore();
    }
  };
})();
