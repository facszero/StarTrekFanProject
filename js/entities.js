'use strict';

// ═══════════════════════════════════════════════════════════════════
//  PLAYER  —  USS Enterprise-D
// ═══════════════════════════════════════════════════════════════════
const Player = (() => {
  let x, targetX, bankAngle;
  let y, targetY, pitchAngle;
  let shields, torpedoes, lives;
  let invTimer, shootTimer;
  let hitFlash;

  return {
    get x()         { return x; },
    get y()         { return y; },
    get shields()   { return shields; },
    get torpedoes() { return torpedoes; },
    get lives()     { return lives; },
    get bank()      { return bankAngle; },
    get pitch()     { return pitchAngle; },

    init() { this.reset(); },

    reset() {
      x = targetX  = CFG.PLAYER_X0;
      y = targetY  = CFG.PLAYER_Y0;
      bankAngle    = 0;
      pitchAngle   = 0;
      shields      = CFG.SHIELD_MAX;
      torpedoes    = CFG.TORPEDO_MAX;
      lives        = CFG.LIVES;
      invTimer     = 0;
      shootTimer   = 0;
      hitFlash     = 0;
    },

    // Called from game.js with raw canvas coords
    setTarget(nx, ny) {
      targetX = U.clamp(nx, 110,            CFG.W - 110);
      targetY = U.clamp(ny, CFG.PLAYER_Y_MIN, CFG.PLAYER_Y_MAX);
    },

    fireTorpedo() {
      if (torpedoes > 0) {
        torpedoes--;
        Projectiles.fireTorpedoFrom(x, y);
      }
    },

    takeHit(dmg) {
      if (invTimer > 0) return false;
      shields -= dmg;
      hitFlash = .18;
      invTimer = 1.6;
      HUD.alert('SHIELDS UNDER ATTACK', 2200);
      if (shields <= 0) {
        shields = 0;
        lives--;
        if (lives > 0) {
          shields  = Math.floor(CFG.SHIELD_MAX * .5);
          invTimer = 2.8;
          HUD.alert('⚠ HULL BREACH — REROUTING POWER ⚠', 3200);
        }
      }
      return lives <= 0;
    },

    update(dt, keys) {
      // ── Keyboard: lateral ──────────────────────────────────────
      if (keys['ArrowLeft'] || keys['KeyA'])
        targetX = U.clamp(targetX - CFG.PLAYER_SPEED   * dt, 110, CFG.W - 110);
      if (keys['ArrowRight']|| keys['KeyD'])
        targetX = U.clamp(targetX + CFG.PLAYER_SPEED   * dt, 110, CFG.W - 110);

      // ── Keyboard: vertical ─────────────────────────────────────
      if (keys['ArrowUp']   || keys['KeyW'])
        targetY = U.clamp(targetY - CFG.PLAYER_SPEED_Y * dt, CFG.PLAYER_Y_MIN, CFG.PLAYER_Y_MAX);
      if (keys['ArrowDown'] || keys['KeyS'])
        targetY = U.clamp(targetY + CFG.PLAYER_SPEED_Y * dt, CFG.PLAYER_Y_MIN, CFG.PLAYER_Y_MAX);

      // ── Smooth follow ──────────────────────────────────────────
      x = U.lerp(x, targetX, dt * 11);
      y = U.lerp(y, targetY, dt * 9);

      // ── Banking (lateral tilt) ─────────────────────────────────
      const wantBank  = ((x - CFG.W/2) / (CFG.W/2 - 110)) * CFG.PLAYER_MAX_BANK;
      bankAngle = U.lerp(bankAngle, wantBank, dt * CFG.PLAYER_BANK_RATE);

      // ── Pitch (forward/backward tilt from vertical movement) ───
      // Moving up → nose dips forward; moving down → nose lifts
      const vy = targetY - y;   // positive = moving down
      const wantPitch = U.clamp(-vy / 40, -CFG.PLAYER_MAX_PITCH, CFG.PLAYER_MAX_PITCH);
      pitchAngle = U.lerp(pitchAngle, wantPitch, dt * CFG.PLAYER_PITCH_RATE);

      // ── Timers ─────────────────────────────────────────────────
      if (invTimer > 0)  invTimer  -= dt;
      if (hitFlash > 0)  hitFlash  -= dt;

      // ── Auto phasers ───────────────────────────────────────────
      shootTimer -= dt * 1000;
      if (shootTimer <= 0) {
        shootTimer = CFG.PHASER_INTERVAL;
        Projectiles.firePhaserFrom(x, y);
      }
    },

    render(ctx) {
      if (invTimer > 0 && Math.floor(invTimer * 9) % 2 === 0) return;

      Draw.enterprise(ctx, x, y, 1.0, bankAngle, pitchAngle);

      // Warp engine glow
      ctx.save();
      const tr = ctx.createRadialGradient(x, y + 8, 0, x, y + 8, 28);
      tr.addColorStop(0, 'rgba(80,140,255,.55)');
      tr.addColorStop(1, 'transparent');
      ctx.fillStyle = tr;
      ctx.beginPath(); ctx.arc(x, y + 8, 28, 0, Math.PI*2); ctx.fill();
      ctx.restore();

      if (hitFlash > 0) {
        ctx.save();
        ctx.globalAlpha = hitFlash * 4;
        ctx.fillStyle = '#ff3300';
        ctx.globalCompositeOperation = 'source-over';
        ctx.fillRect(x - 120, y - 120, 240, 160);
        ctx.restore();
      }
    }
  };
})();

// ═══════════════════════════════════════════════════════════════════
//  ENEMY
// ═══════════════════════════════════════════════════════════════════
class Enemy {
  constructor({ type='bop', wx=0, wy=-80, speed=780, driftX=0, driftY=0 }) {
    this.type   = type;
    this.worldX = wx;
    this.worldY = wy;
    this.z      = CFG.Z_SPAWN;
    this.speed  = speed;
    this.driftX = driftX;
    this.driftY = driftY;

    this.spawnX  = CFG.W/2 + wx * 0.038;
    this.spawnY  = CFG.HORIZON_Y + 6;

    // targetX/Y are recalculated each frame to track the player
    this.targetX = CFG.W/2 + wx * 0.60;
    this.targetY = CFG.PLAYER_Y0 - 110;

    this.sx    = this.spawnX;
    this.sy    = this.spawnY;
    this.scale = 0.02;

    this.hp     = type === 'borg'        ? 210
                : type === 'borg_sphere' ? 150
                : type === 'borg_scout'  ?  45
                : type === 'borg_assimil'? 380
                : 30;
    this.maxHp  = this.hp;
    this.points = type === 'borg'        ? 500
                : type === 'borg_sphere' ? 350
                : type === 'borg_scout'  ? 120
                : type === 'borg_assimil'? 1000
                : 100;
    this.firing = false;   // used by assimil beam state

    this.dead          = false;
    this.readyToRemove = false;
    this.exploding     = false;
    this.exTimer       = 0;
    this.exMax         = (type === 'borg' || type === 'borg_assimil') ? 1.4
                       : type === 'borg_sphere' ? 1.1
                       : .75;
    this.tick          = 0;
  }

  get hitRadius() { return 44 * this.scale; }

  takeDamage(dmg) {
    if (this.dead) return;
    this.hp -= dmg;
    if (this.hp <= 0) {
      this.hp        = 0;
      this.dead      = true;
      this.exploding = true;
      const isBig = type === 'borg' || type === 'borg_assimil';
      Particles.explode(this.sx, this.sy, 55 + this.scale * (isBig ? 110 : 70));
    }
  }

  update(dt) {
    this.tick += dt;

    if (this.exploding) {
      this.exTimer += dt;
      if (this.exTimer >= this.exMax) this.readyToRemove = true;
      return;
    }
    if (this.dead) return;

    this.z      -= this.speed * dt;
    this.worldX += this.driftX * dt * 60;
    this.worldY += this.driftY * dt * 60;

    // Recompute screen targets — track player Y dynamically
    this.targetX = CFG.W/2 + this.worldX * 0.60;
    this.targetY = Player.y - 110;   // ← follows player vertical position

    const t = U.easeIn(U.clamp(1 - this.z / CFG.Z_SPAWN, 0, 1));
    this.sx    = U.lerp(this.spawnX, this.targetX, t);
    this.sy    = U.lerp(this.spawnY, this.targetY, t);
    this.scale = U.lerp(0.022, 0.92, t);

    // Passed player — collision check
    if (this.z <= CFG.Z_KILL) {
      const lateralDist = Math.abs(this.sx - Player.x);
      const verticalDist = Math.abs(this.sy - Player.y);
      if (lateralDist < 95 && verticalDist < 80) {
        const dmg = this.type === 'borg_assimil' ? 50
                : this.type === 'borg'         ? 35
                : this.type === 'borg_sphere'  ? 28
                : 22;
      Player.takeHit(dmg);
      }
      this.dead          = true;
      this.readyToRemove = true;
    }
  }

  render(ctx) {
    if (this.readyToRemove && !this.exploding) return;
    if (this.scale < 0.018) return;

    if (this.exploding) {
      Draw.explosion(ctx, this.sx, this.sy, 75 * this.scale * 2.5, this.exTimer / this.exMax);
      return;
    }

    if      (this.type === 'bop')         Draw.birdOfPrey (ctx, this.sx, this.sy, this.scale * .72);
    else if (this.type === 'borg')        Draw.borgCube   (ctx, this.sx, this.sy, this.scale, this.tick);
    else if (this.type === 'borg_sphere') Draw.borgSphere (ctx, this.sx, this.sy, this.scale, this.tick);
    else if (this.type === 'borg_scout')  Draw.borgScout  (ctx, this.sx, this.sy, this.scale, this.tick);
    else if (this.type === 'borg_assimil')Draw.borgAssimil(ctx, this.sx, this.sy, this.scale, this.tick, this.firing);

    // HP bar
    if (this.hp < this.maxHp && this.scale > .12) {
      const bw = 55 * this.scale, bh = 5 * this.scale;
      const bx = this.sx - bw/2,  by = this.sy - 52 * this.scale;
      ctx.fillStyle = '#330000'; ctx.fillRect(bx, by, bw, bh);
      ctx.fillStyle = this.hp/this.maxHp > .4 ? '#ff6600' : '#ff2200';
      ctx.fillRect(bx, by, bw*(this.hp/this.maxHp), bh);
    }

    // Lock-on ring
    if (this.scale > .12 && this.scale < .85) {
      const a = U.clamp((this.scale-.12)*3, 0, .7);
      ctx.save();
      ctx.strokeStyle = `rgba(255,180,40,${a})`;
      ctx.lineWidth = 1; ctx.setLineDash([5,5]);
      ctx.beginPath(); ctx.arc(this.sx, this.sy, 48*this.scale, 0, Math.PI*2); ctx.stroke();
      ctx.setLineDash([]); ctx.restore();
    }
  }
}

// ═══════════════════════════════════════════════════════════════════
//  ENEMIES  — wave manager
// ═══════════════════════════════════════════════════════════════════
const Enemies = (() => {
  let _list = [], queue = [], waveActive = false;

  function buildWave(n) {
    const sp = CFG.BOP_SPEED_BASE + (n-1)*75;
    const waves = [
      [
        {type:'bop', wx:   0, speed:sp},
        {type:'bop', wx:-200, speed:sp, delay:1100},
        {type:'bop', wx: 200, speed:sp, delay:1100},
      ],
      [
        {type:'bop', wx:   0, speed:sp*1.1},
        {type:'bop', wx:-180, speed:sp*1.1, delay:700},
        {type:'bop', wx: 180, speed:sp*1.1, delay:700},
        {type:'bop', wx:-340, speed:sp*1.1, delay:1400},
        {type:'bop', wx: 340, speed:sp*1.1, delay:1400},
      ],
      [
        {type:'bop', wx:-420, speed:sp*1.2, driftX: 2.5},
        {type:'bop', wx: 420, speed:sp*1.2, driftX:-2.5},
        {type:'bop', wx:   0, speed:sp*1.2, delay:1600},
        {type:'bop', wx:-200, speed:sp*1.2, delay:2600},
        {type:'bop', wx: 200, speed:sp*1.2, delay:2600},
        {type:'bop', wx:   0, speed:sp*1.4, delay:3800},
      ],
      [
        {type:'bop',  wx:-250, speed:sp*1.1},
        {type:'bop',  wx: 250, speed:sp*1.1, delay:500},
        {type:'borg', wx:   0, speed:CFG.BORG_SPEED_BASE + n*40, delay:3000},
        {type:'bop',  wx:-180, speed:sp*1.2, delay:4200},
        {type:'bop',  wx: 180, speed:sp*1.2, delay:4200},
      ],
      // Wave 5 — Borg Spheres + Scouts
      [
        {type:'borg_scout',  wx:-300, speed:sp*1.6},
        {type:'borg_scout',  wx: 300, speed:sp*1.6, delay:300},
        {type:'borg_scout',  wx:   0, speed:sp*1.6, delay:800},
        {type:'borg_sphere', wx:-160, speed:CFG.BORG_SPEED_BASE+n*35, delay:2200},
        {type:'borg_sphere', wx: 160, speed:CFG.BORG_SPEED_BASE+n*35, delay:2200},
        {type:'borg_scout',  wx:-400, speed:sp*1.7, delay:3800},
        {type:'borg_scout',  wx: 400, speed:sp*1.7, delay:3800},
      ],
      // Wave 6 — Assimilation Ship + escort
      [
        {type:'borg_scout',  wx:-350, speed:sp*1.5},
        {type:'borg_scout',  wx: 350, speed:sp*1.5, delay:400},
        {type:'borg_sphere', wx:-200, speed:CFG.BORG_SPEED_BASE+n*30, delay:1800},
        {type:'borg_sphere', wx: 200, speed:CFG.BORG_SPEED_BASE+n*30, delay:1800},
        {type:'borg_assimil',wx:   0, speed:CFG.BORG_SPEED_BASE*0.7,  delay:4500},
        {type:'borg_scout',  wx:-150, speed:sp*1.6, delay:5500},
        {type:'borg_scout',  wx: 150, speed:sp*1.6, delay:5500},
      ],
    ];
    const template = waves[Math.min(n-1, waves.length-1)];
    return template.map(e => ({...e, delay: e.delay || 0}));
  }

  return {
    get list() { return _list; },

    init()  { _list = []; queue = []; waveActive = false; },
    reset() { _list = []; queue = []; waveActive = false; },

    isWaveClear() {
      return waveActive
          && queue.length === 0
          && _list.every(e => e.readyToRemove || (e.dead && !e.exploding));
    },

    startWave(n) {
      waveActive = true;
      _list = [];
      const raw = buildWave(n);
      queue = raw.map(e => ({...e}));
    },

    update(dt) {
      queue = queue.filter(item => {
        item.delay -= dt * 1000;
        if (item.delay <= 0) { _list.push(new Enemy(item)); return false; }
        return true;
      });
      for (const e of _list) e.update(dt);
      _list = _list.filter(e => !e.readyToRemove);
    },

    render(ctx) {
      const sorted = [..._list].sort((a,b) => b.z - a.z);
      for (const e of sorted) e.render(ctx);
    }
  };
})();
