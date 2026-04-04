'use strict';

/**
 * Story — manages the 4-act narrative structure.
 *
 * ACT I   "Klingon Border"      waves  1–3   bg: nebula blue
 * ACT II  "Dark Alliance"       waves  4–6   bg: green nebula
 * ACT III "The Borg Collective" waves  7–11  bg: borg green
 * ACT IV  "Final Frontier"      waves 12–15  bg: deep space / asteroids / 8472
 *
 * Each act has: name, subtitle, opening crawl (Picard quote), bg theme.
 * Between acts a full-screen LCARS cinematic plays for ~5 seconds.
 */
const Story = (() => {

  // ── Act definitions ─────────────────────────────────────────────
  const ACTS = [
    {
      num:      1,
      title:    'ACT I',
      name:     'KLINGON BORDER',
      waves:    [1, 2, 3],
      bg:       'blue',
      quote:    '"Villains who twirl their mustaches are easy to spot. Those who clothe themselves in good deeds are well-camouflaged."',
      attr:     '— Captain Jean-Luc Picard',
      mission:  'Intercept Klingon patrol. Defend Federation border.',
      picard:   'Number One, raise shields. They appear to mean business.',
    },
    {
      num:      2,
      title:    'ACT II',
      name:     'DARK ALLIANCE',
      waves:    [4, 5, 6],
      bg:       'green',
      quote:    '"The first duty of every Starfleet officer is to the truth."',
      attr:     '— Captain Jean-Luc Picard',
      mission:  'Klingon-Romulan alliance confirmed. Break the formation.',
      picard:   'They are adapting their attack pattern. Evasive maneuvers.',
    },
    {
      num:      3,
      title:    'ACT III',
      name:     'THE BORG COLLECTIVE',
      waves:    [7, 8, 9, 10, 11],
      bg:       'borg',
      quote:    '"I am Locutus of Borg. Resistance is futile."',
      attr:     '— The Borg / Jean-Luc Picard',
      mission:  'Borg cube detected. Sector 001 is the target. Stop them.',
      picard:   'Mr. Worf, load all torpedo bays. We will not yield.',
    },
    {
      num:      4,
      title:    'ACT IV',
      name:     'FINAL FRONTIER',
      waves:    [12, 13, 14, 15],
      bg:       'deep',
      quote:    '"Space: the final frontier. These are the voyages of the starship Enterprise."',
      attr:     '— Captain Jean-Luc Picard',
      mission:  'Multi-faction assault. Earth detected as target. Last stand.',
      picard:   'We have made too many compromises already. No more.',
    },
  ];

  // ── Wave → Picard tactical comments ─────────────────────────────
  const WAVE_LINES = {
    1:  'All hands, battle stations.',
    2:  'Increase phaser frequency — they are compensating.',
    3:  'Excellent work. Stand by for next engagement.',
    4:  'A Romulan-Klingon alliance. Unexpected.',
    5:  'Brace for impact — they are flanking us.',
    6:  'We held the line. For now.',
    7:  'The Borg. Of all the threats in the galaxy…',
    8:  'They adapt to our phasers — use torpedoes.',
    9:  'Shields at critical. Reroute power to deflectors.',
   10:  'Asteroid field ahead. Navigate carefully.',
   11:  'We cannot let the Borg reach Earth.',
   12:  'Cardassian warships. Their tactics are brutal.',
   13:  "The Dominion. Jem'Hadar do not take prisoners.",
   14:  'Multiple fronts. Stay focused.',
   15:  'Species 8472. No known weapon has stopped them.',
  };

  // ── State ────────────────────────────────────────────────────────
  let currentAct  = null;
  let nextAct     = null;
  let cinematic   = false;   // true = act transition screen active
  let cinTimer    = 0;
  const CIN_DUR   = 5.5;     // seconds for act transition

  let titleBanner = null;    // { text, timer, maxTimer }

  // ── Helpers ──────────────────────────────────────────────────────
  function actForWave(w) {
    return ACTS.find(a => a.waves.includes(w)) || ACTS[ACTS.length-1];
  }

  // ── Public ───────────────────────────────────────────────────────
  return {
    get currentAct()  { return currentAct; },
    get bgTheme()     { return currentAct ? currentAct.bg : 'blue'; },
    get inCinematic() { return cinematic; },

    init() {
      currentAct  = ACTS[0];
      nextAct     = null;
      cinematic   = false;
      cinTimer    = 0;
      titleBanner = null;
    },

    // Called by game.js when a new wave starts
    onWaveStart(waveNum) {
      const act = actForWave(waveNum);

      if (!currentAct || act.num !== currentAct.num) {
        // Act change — trigger cinematic
        nextAct   = act;
        cinematic = true;
        cinTimer  = 0;
      } else {
        // Same act — show wave banner + Picard line
        const line = WAVE_LINES[waveNum];
        if (line) HUD.alert(line, 3500);
        Background.setTheme(act.bg);
      }
    },

    // Called when game first starts
    onGameStart() {
      currentAct = ACTS[0];
      cinematic  = true;
      nextAct    = ACTS[0];
      cinTimer   = 0;
      Background.setTheme('blue');
    },

    update(dt) {
      if (cinematic) {
        cinTimer += dt;
        if (cinTimer >= CIN_DUR) {
          cinematic   = false;
          currentAct  = nextAct;
          nextAct     = null;
          cinTimer    = 0;
          if (currentAct) {
            Background.setTheme(currentAct.bg);
            HUD.alert(currentAct.name, 3200);
          }
        }
      }
    },

    // Returns true while cinematic is running — game pauses enemy updates
    shouldPauseGame() { return cinematic; },

    render(ctx) {
      if (!cinematic || !nextAct) return;
      const act = nextAct;
      const t   = cinTimer / CIN_DUR;         // 0 → 1
      const W   = CFG.W, H   = CFG.H;

      // Full-screen overlay
      ctx.save();

      // Background gradient (act-specific color)
      const bgColors = {
        blue:  ['#020818','#041440'],
        green: ['#020e04','#041808'],
        borg:  ['#010808','#001410'],
        deep:  ['#020408','#060418'],
      };
      const [c1,c2] = bgColors[act.bg] || bgColors.blue;
      const bg = ctx.createLinearGradient(0,0,0,H);
      bg.addColorStop(0, c1); bg.addColorStop(1, c2);
      ctx.fillStyle = bg; ctx.fillRect(0,0,W,H);

      // Horizontal LCARS accent bars
      const barAlpha = Math.min(1, t*3) * (1-Math.max(0,(t-.8)*5));
      ctx.globalAlpha = barAlpha;
      ctx.fillStyle = CFG.C.BORDER;
      ctx.fillRect(0, H*.28-1, W, 2);
      ctx.fillRect(0, H*.72-1, W, 2);
      // Thick left block
      ctx.fillStyle = '#3a2a10';
      ctx.fillRect(0, H*.28, 18, H*.44);

      // ACT number (left)
      ctx.globalAlpha = barAlpha;
      ctx.fillStyle = CFG.C.DIM;
      ctx.font = `bold 14px monospace`;
      ctx.textAlign = 'left';
      ctx.fillText(act.title, 30, H*.38);

      // Act name — large centered
      const nameAlpha = Math.min(1, (t-.05)*4) * (1-Math.max(0,(t-.8)*5));
      ctx.globalAlpha = nameAlpha;
      ctx.shadowColor = CFG.C.GOLD; ctx.shadowBlur = 40;
      ctx.fillStyle = CFG.C.GOLD;
      ctx.font = `bold 68px monospace`;
      ctx.textAlign = 'center';
      ctx.fillText(act.name, W/2, H*.48);
      ctx.shadowBlur = 0;

      // Mission line
      ctx.globalAlpha = Math.min(1, (t-.15)*5) * (1-Math.max(0,(t-.75)*5));
      ctx.fillStyle = CFG.C.TEXT;
      ctx.font = `14px monospace`;
      ctx.fillText(act.mission, W/2, H*.55);

      // Quote
      const quoteAlpha = Math.min(1, (t-.25)*4) * (1-Math.max(0,(t-.7)*5));
      ctx.globalAlpha = quoteAlpha * .75;
      ctx.fillStyle = CFG.C.DIM;
      ctx.font = `italic 13px monospace`;
      // Word-wrap the quote (max ~80 chars per line)
      const words = act.quote.split(' ');
      let line = '', lines = [], maxW = 640;
      ctx.font = `italic 13px monospace`;
      for (const w of words) {
        const test = line + (line?'  ':'')+w;
        if (ctx.measureText(test).width > maxW && line) { lines.push(line); line=w; }
        else line = test;
      }
      if (line) lines.push(line);
      lines.forEach((l,i) => ctx.fillText(l, W/2, H*.63 + i*20));
      ctx.globalAlpha = quoteAlpha * .5;
      ctx.fillStyle = CFG.C.BORDER;
      ctx.font = `11px monospace`;
      ctx.fillText(act.attr, W/2, H*.63 + lines.length*20 + 14);

      // Enterprise silhouette (fades in)
      ctx.globalAlpha = Math.min(.35, t*.7);
      const entScale = 1.4;
      Draw.enterprise(ctx, W*.78, H*.5, entScale, Math.sin(cinTimer*.4)*.06, 0);

      // Progress bar at bottom
      ctx.globalAlpha = .4;
      ctx.fillStyle = CFG.C.BORDER;
      ctx.fillRect(W*.1, H*.88, W*.8, 2);
      ctx.fillStyle = CFG.C.GOLD;
      ctx.shadowColor = CFG.C.GOLD; ctx.shadowBlur = 6;
      ctx.fillRect(W*.1, H*.88, W*.8*t, 2);
      ctx.shadowBlur = 0;

      ctx.globalAlpha = .4;
      ctx.fillStyle = CFG.C.DIM;
      ctx.font = '10px monospace';
      ctx.fillText('ENGAGING...', W/2, H*.93);

      ctx.textAlign = 'left';
      ctx.restore();
    },
  };
})();
