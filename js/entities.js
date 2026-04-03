'use strict';

// ═══════════════════════════════════════════════════════════════════
//  PLAYER  —  USS Enterprise-D
// ═══════════════════════════════════════════════════════════════════
const Player = (() => {
  let x, targetX, bankAngle;
  let shields, torpedoes, lives;
  let invTimer, shootTimer;
  let hitFlash;

  return {
    get x()         { return x; },
    get shields()   { return shields; },
    get torpedoes() { return torpedoes; },
    get lives()     { return lives; },
    get bank()      { return bankAngle; },

    init() { this.reset(); },

    reset() {
      x = targetX  = CFG.PLAYER_X0;
      bankAngle    = 0;
      shields      = CFG.SHIELD_MAX;
      torpedoes    = CFG.TORPEDO_MAX;
      lives        = CFG.LIVES;
      invTimer     = 0;
      shootTimer   = 0;
      hitFlash     = 0;
    },

    setTargetX(nx) {
      targetX = U.clamp(nx, 110, CFG.W - 110);
    },

    fireTorpedo() {
      if (torpedoes > 0) {
        torpedoes--;
        Projectiles.fireTorpedoFrom(x, CFG.PLAYER_Y);
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
      // Keyboard input
      if (keys['ArrowLeft'] || keys['KeyA'])
        targetX = U.clamp(targetX - CFG.PLAYER_SPEED * dt, 110, CFG.W - 110);
      if (keys['ArrowRight']|| keys['KeyD'])
        targetX = U.clamp(targetX + CFG.PLAYER_SPEED * dt, 110, CFG.W - 110);

      // Smooth follow
      x = U.lerp(x, targetX, dt * 11);

      // Banking
      const want = ((x - CFG.W/2) / (CFG.W/2 - 110)) * CFG.PLAYER_MAX_BANK;
      bankAngle = U.lerp(bankAngle, want, dt * CFG.PLAYER_BANK_RATE);

      // Timers
      if (invTimer > 0)  invTimer  -= dt;
      if (hitFlash > 0)  hitFlash  -= dt;

      // Auto phaser
      shootTimer -= dt * 1000;
      if (shootTimer <= 0) {
        shootTimer = CFG.PHASER_INTERVAL;
        Projectiles.firePhaserFrom(x, CFG.PLAYER_Y);
      }
    },

    render(ctx) {
      // Invulnerability flash
      if (invTimer > 0 && Math.floor(invTimer * 9) % 2 === 0) return;

      // Red tint on damage
      if (hitFlash > 0) {
        ctx.save();
        ctx.globalCompositeOperation = 'source-over';
        // draw ship normally first, then overlay
      }

      Draw.enterprise(ctx, x, CFG.PLAYER_Y, 1.0, bankAngle);

      // Engine thruster glow (always present)
      ctx.save();
      const tr = ctx.createRadialGradient(x, CFG.PLAYER_Y + 8, 0, x, CFG.PLAYER_Y + 8, 28);
      tr.addColorStop(0, 'rgba(80,140,255,.55)');
      tr.addColorStop(1, 'transparent');
      ctx.fillStyle = tr;
      ctx.beginPath(); ctx.arc(x, CFG.PLAYER_Y + 8, 28, 0, Math.PI*2); ctx.fill();
      ctx.restore();

      if (hitFlash > 0) {
        ctx.save();
        ctx.globalCompositeOperation = 'source-atop';
        ctx.globalAlpha = hitFlash * 4;
        ctx.fillStyle = '#ff3300';
        ctx.fillRect(x - 120, CFG.PLAYER_Y - 120, 240, 160);
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

    // Screen-space interpolation endpoints
    // spawnX/Y ≈ vanishing point (tiny)
    // targetX/Y ≈ midscreen (scaled up)
    this.spawnX  = CFG.W/2 + wx * 0.038;
    this.spawnY  = CFG.HORIZON_Y + 6;
    this.targetX = CFG.W/2 + wx * 0.60;
    this.targetY = CFG.PLAYER_Y - 110;

    this.sx    = this.spawnX;
    this.sy    = this.spawnY;
    this.scale = 0.02;

    this.hp     = type === 'borg' ? 210 : 30;
    this.maxHp  = this.hp;
    this.points = type === 'borg' ? 500 : 100;

    this.dead           = false;
    this.readyToRemove  = false;
    this.exploding      = false;
    this.exTimer        = 0;
    this.exMax          = type === 'borg' ? 1.2 : .75;
    this.tick           = 0;
  }

  get hitRadius() { return 44 * this.scale; }

  takeDamage(dmg) {
    if (this.dead) return;
    this.hp -= dmg;
    if (this.hp <= 0) {
      this.hp        = 0;
      this.dead      = true;
      this.exploding = true;
      Particles.explode(this.sx, this.sy, 55 + this.scale * 80);
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

    // Recalculate screen targets (drift may change them)
    this.targetX = CFG.W/2 + this.worldX * 0.60;

    const t = U.easeIn(U.clamp(1 - this.z / CFG.Z_SPAWN, 0, 1));
    this.sx    = U.lerp(this.spawnX, this.targetX, t);
    this.sy    = U.lerp(this.spawnY, this.targetY, t);
    this.scale = U.lerp(0.022, 0.92, t);

    // Passed player
    if (this.z <= CFG.Z_KILL) {
      const lateralDist = Math.abs(this.sx - Player.x);
      if (lateralDist < 95) {
        const dead = Player.takeHit(type === 'borg' ? 35 : 22);
        if (dead) { /* game over handled in Game */ }
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

    if      (this.type === 'bop')  Draw.birdOfPrey(ctx, this.sx, this.sy, this.scale * .72);
    else if (this.type === 'borg') Draw.borgCube  (ctx, this.sx, this.sy, this.scale,  this.tick);

    // HP bar (visible when damaged and close enough)
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

  // Formation definitions per wave
  function buildWave(n) {
    const sp = CFG.BOP_SPEED_BASE + (n-1)*75;
    const waves = [
      // Wave 1 — classic column, easy
      [
        {type:'bop', wx:   0, wy:-80, speed:sp},
        {type:'bop', wx:-200, wy:-65, speed:sp, delay:1100},
        {type:'bop', wx: 200, wy:-65, speed:sp, delay:1100},
      ],
      // Wave 2 — V formation
      [
        {type:'bop', wx:   0, wy:-100, speed:sp*1.1},
        {type:'bop', wx:-180, wy: -80, speed:sp*1.1, delay:700},
        {type:'bop', wx: 180, wy: -80, speed:sp*1.1, delay:700},
        {type:'bop', wx:-340, wy: -60, speed:sp*1.1, delay:1400},
        {type:'bop', wx: 340, wy: -60, speed:sp*1.1, delay:1400},
      ],
      // Wave 3 — flanking pincer
      [
        {type:'bop', wx:-420, wy:-50, speed:sp*1.2, driftX: 2.5},
        {type:'bop', wx: 420, wy:-50, speed:sp*1.2, driftX:-2.5},
        {type:'bop', wx:   0, wy:-95, speed:sp*1.2, delay:1600},
        {type:'bop', wx:-200, wy:-80, speed:sp*1.2, delay:2600},
        {type:'bop', wx: 200, wy:-80, speed:sp*1.2, delay:2600},
        {type:'bop', wx:   0, wy:-95, speed:sp*1.4, delay:3800},
      ],
      // Wave 4 — first Borg encounter
      [
        {type:'bop',  wx:-250, wy:-70, speed:sp*1.1},
        {type:'bop',  wx: 250, wy:-70, speed:sp*1.1, delay:500},
        {type:'borg', wx:   0, wy:-90, speed:CFG.BORG_SPEED_BASE + n*40, delay:3000},
        {type:'bop',  wx:-180, wy:-65, speed:sp*1.2, delay:4200},
        {type:'bop',  wx: 180, wy:-65, speed:sp*1.2, delay:4200},
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
      // Drain spawn queue
      queue = queue.filter(item => {
        item.delay -= dt * 1000;
        if (item.delay <= 0) { _list.push(new Enemy(item)); return false; }
        return true;
      });

      for (const e of _list) e.update(dt);
      _list = _list.filter(e => !e.readyToRemove);
    },

    render(ctx) {
      // Far enemies behind close ones
      const sorted = [..._list].sort((a,b) => b.z - a.z);
      for (const e of sorted) e.render(ctx);
    }
  };
})();
