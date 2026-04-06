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

  // ── Photo backgrounds ─────────────────────────────────────────
  const BG_PHOTOS = { blue:'assets/bg/bg_act1.jpg', green:'assets/bg/bg_act2.jpg',
                      borg:'assets/bg/bg_act3.jpg', deep:'assets/bg/bg_act4.jpg' };
  // Act V: per-wave backgrounds (Lore progression)
  const BG_WAVES = {
    16:'assets/bg/bg_wave16.jpg', 17:'assets/bg/bg_wave17.jpg',
    18:'assets/bg/bg_wave18.jpg', 19:'assets/bg/bg_wave19.jpg',
    20:'assets/bg/bg_wave20.jpg',
  };
  let   waveBgImg = null;   // active wave-specific bg (overrides theme bg)
  let   waveBgAlpha = 0;
  let bgImgs  = {};
  let bgAlpha = 0;       // 0→1 crossfade-in
  let bgPrevImg = null;  // previous photo during transition
  let bgPrevAlpha = 0;

  function _loadBgPhotos() {
    Object.entries(BG_PHOTOS).forEach(([key, src]) => {
      if (bgImgs[key]) return;
      const img = new Image(); img.src = src; bgImgs[key] = img;
    });
    Object.entries(BG_WAVES).forEach(([key, src]) => {
      if (bgImgs['wave'+key]) return;
      const img = new Image(); img.src = src; bgImgs['wave'+key] = img;
    });
  }

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
      bgAlpha = 0; bgPrevImg = null; bgPrevAlpha = 0; waveBgImg = null; waveBgAlpha = 0;
      _loadBgPhotos();
    },

    setWarp(active) { targetMult = active ? 9 : 1; },

    get currentTheme() { return theme; },

    setWaveBg(waveNum) {
      // Called on wave start for Act V waves (16-20)
      const key = 'wave' + waveNum;
      if (bgImgs[key]) {
        bgPrevImg   = waveBgImg || bgImgs[theme] || null;
        bgPrevAlpha = Math.max(bgAlpha, waveBgAlpha);
        waveBgImg   = bgImgs[key];
        waveBgAlpha = 0;
      }
    },

    clearWaveBg() {
      // Called when leaving Act V — restore act bg cleanly
      waveBgImg    = null;
      waveBgAlpha  = 0;
      bgPrevImg    = null;   // drop any lingering wave crossfade
      bgPrevAlpha  = 0;
      bgAlpha      = 0;      // force act bg to fade in fresh
    },

    setTheme(t) {
      if (t !== targetTheme) {
        // Save current as previous for crossfade
        bgPrevImg   = bgImgs[theme] || null;
        bgPrevAlpha = bgAlpha;
        bgAlpha     = 0;
        targetTheme = t;
        themeBlend  = 0;
      }
    },

    update(dt) {
      tick += dt;
      warpMult = U.lerp(warpMult, targetMult, dt * 2.5);


      // Blend to new theme
      if (themeBlend < 1) {
        themeBlend = Math.min(1, themeBlend + dt * 0.8);
        if (themeBlend >= 1) theme = targetTheme;
      }
      // Crossfade bg photo in
      if (bgAlpha < 1) bgAlpha = Math.min(1, bgAlpha + dt * 0.55);
      if (bgPrevAlpha > 0) bgPrevAlpha = Math.max(0, bgPrevAlpha - dt * 0.55);
      if (waveBgImg && waveBgAlpha < 1) waveBgAlpha = Math.min(1, waveBgAlpha + dt * 1.8);

      for (const s of stars) {
        s.dist += s.speed * warpMult * dt;
        if (s.dist > s.max) Object.assign(s, mkStar(false));
      }
    },

    render(ctx) {
      const cx = CFG.W / 2, cy = CFG.HORIZON_Y;

      // ── photo background ──────────────────────────────────────
      // Dark base first
      ctx.fillStyle = '#020408'; ctx.fillRect(0, 0, CFG.W, CFG.H);

      // Previous photo fading out
      if (bgPrevImg && bgPrevImg.complete && bgPrevAlpha > 0) {
        ctx.save(); ctx.globalAlpha = bgPrevAlpha;
        ctx.drawImage(bgPrevImg, 0, 0, CFG.W, CFG.H);
        ctx.restore();
      }
      // Current photo fading in
      const curImg = bgImgs[theme] || bgImgs.blue;
      if (curImg && curImg.complete && curImg.naturalWidth && bgAlpha > 0) {
        ctx.save(); ctx.globalAlpha = bgAlpha;
        ctx.drawImage(curImg, 0, 0, CFG.W, CFG.H);
        ctx.restore();
      }

      // ── wave-specific bg (Act V, overlays act bg) ────────────────
      if (waveBgImg && waveBgImg.complete && waveBgAlpha > 0) {
        ctx.save(); ctx.globalAlpha = waveBgAlpha;
        ctx.drawImage(waveBgImg, 0, 0, CFG.W, CFG.H);
        ctx.restore();
      }

      // ── subtle dark vignette to help readability ───────────────
      const vig = ctx.createRadialGradient(cx, CFG.H/2, 120, cx, CFG.H/2, 750);
      vig.addColorStop(0, 'rgba(0,0,0,0)');
      vig.addColorStop(1, 'rgba(0,0,0,0.45)');
      ctx.fillStyle = vig; ctx.fillRect(0,0,CFG.W,CFG.H);

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
