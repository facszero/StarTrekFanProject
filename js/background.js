'use strict';

const Background = (() => {
  const STAR_N    = 320;
  const NEBULA_N  = 3;
  let   stars     = [];
  let   nebulae   = [];
  let   tick      = 0;
  let   warpMult  = 1;
  let   targetMult= 1;

  // Theme: controls nebula colors and space gradient
  // blue=Klingon border, green=Romulan alliance, borg=Borg space, deep=final
  let   theme     = 'blue';
  let   targetTheme = 'blue';
  let   themeBlend  = 1.0;  // 0=old theme, 1=new theme (lerped on change)

  const THEMES = {
    blue: {
      bg1: '#0a1428', bg2: '#060d18', bg3: '#020508',
      neb1: ['#1a2a5a','#0d2a40','#1a1040'],
      neb2: ['#3355cc','#226688','#552299'],
    },
    green: {
      bg1: '#081408', bg2: '#040e04', bg3: '#020502',
      neb1: ['#0d2a0d','#142814','#0a1a0a'],
      neb2: ['#225522','#335533','#1a4422'],
    },
    borg: {
      bg1: '#040e08', bg2: '#020808', bg3: '#010403',
      neb1: ['#051a05','#051205','#030e08'],
      neb2: ['#0a3312','#0d2218','#062210'],
    },
    deep: {
      bg1: '#080414', bg2: '#060210', bg3: '#030108',
      neb1: ['#1a0a3a','#200830','#180a28'],
      neb2: ['#442288','#331166','#220a55'],
    },
  };

  // ── Per-act scenery (stations, planets) ───────────────────────
  let earthFrame = 0, earthTimer = 0;
  const SCENERY = {
    blue: [  // Act I: Earth + K-7 station
      { sheet:'earth', r:()=>Sprites.BG&&Sprites.BG.earth_large, x:1080,y:310, s:0.90, a:0.62 },
      { sheet:'k7',    r:()=>Sprites.BG&&Sprites.BG.k7_side,     x: 185,y:385, s:0.48, a:0.38 },
    ],
    green: [ // Act II: K-7 under siege
      { sheet:'k7', r:()=>Sprites.BG&&Sprites.BG.k7_front, x:210,y:355, s:0.68, a:0.50 },
      { sheet:'k7', r:()=>Sprites.BG&&Sprites.BG.k7_side,  x:1055,y:420,s:0.42, a:0.32 },
    ],
    borg: [  // Act III: DS9 being assimilated
      { sheet:'ds9', r:()=>Sprites.BG&&Sprites.BG.ds9_34, x:200,y:375, s:0.85, a:0.45 },
    ],
    deep: [  // Act IV: Earth Spacedock + Earth
      { sheet:'earth',     r:()=>Sprites.BG&&Sprites.BG.earth_large,      x:1005,y:340, s:0.75, a:0.55 },
      { sheet:'spacedock', r:()=>Sprites.BG&&Sprites.BG.spacedock_front,   x: 195,y:370, s:0.58, a:0.48 },
    ],
  };

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

    setTheme(t) {
      if (t !== targetTheme) {
        targetTheme = t;
        themeBlend  = 0;
      }
    },

    update(dt) {
      tick += dt;
      warpMult = U.lerp(warpMult, targetMult, dt * 2.5);
      // Earth rotation animation (one frame every 3s)
      earthTimer += dt;
      if (earthTimer > 3.0) { earthTimer = 0; earthFrame++; }

      // Blend to new theme
      if (themeBlend < 1) {
        themeBlend = Math.min(1, themeBlend + dt * 0.8);
        if (themeBlend >= 1) theme = targetTheme;
      }

      for (const s of stars) {
        s.dist += s.speed * warpMult * dt;
        if (s.dist > s.max) Object.assign(s, mkStar(false));
      }
    },

    render(ctx) {
      const cx = CFG.W / 2, cy = CFG.HORIZON_Y;

      // ── deep space gradient (theme-aware) ──
      const th = THEMES[theme] || THEMES.blue;
      const bg = ctx.createRadialGradient(cx, cy, 0, cx, cy, 720);
      bg.addColorStop(0, th.bg1);
      bg.addColorStop(.55, th.bg2);
      bg.addColorStop(1,  th.bg3);
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

      // ── scenery (stations, planets) — drawn behind stars ──────
      const defs = SCENERY[theme] || SCENERY.blue;
      for (const el of defs) {
        const rect = el.r && el.r();
        if (!rect) continue;
        // Subtle parallax: offset slightly based on tick
        const px = el.x + Math.sin(tick * 0.04) * 3;
        const py = el.y + Math.cos(tick * 0.03) * 2;
        // Earth rotates through frames
        let r = rect;
        if (el.sheet === 'earth' && Sprites.BG && Sprites.BG.earth_rot) {
          r = Sprites.BG.earth_rot[earthFrame % Sprites.BG.earth_rot.length] || rect;
        }
        Sprites.drawBgElement(ctx, el.sheet, r, px, py, el.s, el.a);
      }

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

      // ── vignette (single pass, no scanlines loop) ──
      const vign = ctx.createRadialGradient(cx, CFG.H/2, CFG.H*.25, cx, CFG.H/2, CFG.H*.85);
      vign.addColorStop(0, 'transparent');
      vign.addColorStop(1, 'rgba(0,0,0,.55)');
      ctx.fillStyle = vign;
      ctx.fillRect(0, 0, CFG.W, CFG.H);
    }
  };
})();
