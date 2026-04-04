'use strict';

// ═══════════════════════════════════════════════════════════════════
//  PLAYER  —  USS Enterprise-D
// ═══════════════════════════════════════════════════════════════════
const Player = (() => {
  let x, targetX, bankAngle;
  let y, targetY, pitchAngle;
  let shields, torpedoes, lives;
  let invTimer, torpRechargeTimer;
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
      torpRechargeTimer = 0;
      hitFlash     = 0;
    },

    setTarget(nx, ny) {
      targetX = U.clamp(nx, 110,             CFG.W - 110);
      targetY = U.clamp(ny, CFG.PLAYER_Y_MIN, CFG.PLAYER_Y_MAX);
    },

    // Called from game.js on tap-on-enemy
    firePhaserAt(enemy) {
      if (!enemy || enemy.dead) return;
      Projectiles.firePhaserAt(x, y, enemy);
    },

    // Called from game.js on tap-on-empty or Space key
    fireTorpedo() {
      if (torpedoes > 0) {
        torpedoes--;
        torpRechargeTimer = CFG.TORPEDO_RECHARGE;
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
          invTimer = 2.2;
          HUD.alert('⚠ HULL BREACH — REROUTING POWER ⚠', 3200);
        }
      }
      return lives <= 0;
    },

    update(dt, keys) {
      // ── Keyboard ───────────────────────────────────────────────
      if (keys['ArrowLeft'] || keys['KeyA'])
        targetX = U.clamp(targetX - CFG.PLAYER_SPEED   * dt, 110, CFG.W - 110);
      if (keys['ArrowRight']|| keys['KeyD'])
        targetX = U.clamp(targetX + CFG.PLAYER_SPEED   * dt, 110, CFG.W - 110);
      if (keys['ArrowUp']   || keys['KeyW'])
        targetY = U.clamp(targetY - CFG.PLAYER_SPEED_Y * dt, CFG.PLAYER_Y_MIN, CFG.PLAYER_Y_MAX);
      if (keys['ArrowDown'] || keys['KeyS'])
        targetY = U.clamp(targetY + CFG.PLAYER_SPEED_Y * dt, CFG.PLAYER_Y_MIN, CFG.PLAYER_Y_MAX);

      // ── Smooth follow ──────────────────────────────────────────
      x = U.lerp(x, targetX, dt * 11);
      y = U.lerp(y, targetY, dt * 9);

      // ── Banking ────────────────────────────────────────────────
      const wantBank  = ((x - CFG.W/2) / (CFG.W/2 - 110)) * CFG.PLAYER_MAX_BANK;
      bankAngle = U.lerp(bankAngle, wantBank, dt * CFG.PLAYER_BANK_RATE);

      // ── Pitch ──────────────────────────────────────────────────
      const vy = targetY - y;
      const wantPitch = U.clamp(-vy / 40, -CFG.PLAYER_MAX_PITCH, CFG.PLAYER_MAX_PITCH);
      pitchAngle = U.lerp(pitchAngle, wantPitch, dt * CFG.PLAYER_PITCH_RATE);

      // ── Timers ─────────────────────────────────────────────────
      if (invTimer > 0) invTimer -= dt;
      if (hitFlash > 0) hitFlash -= dt;

      // ── Torpedo auto-recharge (1 every 8s, up to max) ─────────
      if (torpedoes < CFG.TORPEDO_MAX) {
        torpRechargeTimer -= dt * 1000;
        if (torpRechargeTimer <= 0) {
          torpedoes++;
          torpRechargeTimer = torpedoes < CFG.TORPEDO_MAX ? CFG.TORPEDO_RECHARGE : 0;
        }
      }
    },

    // Recharge progress 0→1 for HUD indicator
    get rechargeProgress() {
      if (torpedoes >= CFG.TORPEDO_MAX) return 1;
      return 1 - U.clamp(torpRechargeTimer / CFG.TORPEDO_RECHARGE, 0, 1);
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
  constructor({ type='bop', wx=0, wy=0, speed=780, driftX=0, driftY=0 }) {
    this.type   = type;
    this.worldX = wx;
    this.worldY = wy;   // vertical offset (±60 typical)
    this.z      = CFG.Z_SPAWN;
    this.speed  = speed;
    this.driftX = driftX;
    this.driftY = driftY;

    this.spawnX  = CFG.W/2 + wx * 0.038 + U.rnd(-12, 12);  // tiny jitter at spawn
    this.spawnY  = CFG.HORIZON_Y + 6;
    // targetX uses wider spread multiplier (0.85 vs old 0.60)
    this.targetX = CFG.W/2 + wx * 0.85;
    // targetY: base approach + wy offset for vertical variety
    this.targetY = CFG.PLAYER_Y0 - 110 + wy;

    this.sx    = this.spawnX;
    this.sy    = this.spawnY;
    this.scale = 0.022;

    this.hp     = type === 'borg'         ? 210
                : type === 'borg_sphere'  ? 150
                : type === 'borg_scout'   ?  45
                : type === 'borg_assimil' ? 380
                : 30;
    this.maxHp  = this.hp;
    this.points = type === 'borg'         ? 500
                : type === 'borg_sphere'  ? 350
                : type === 'borg_scout'   ? 120
                : type === 'borg_assimil' ? 1000
                : 100;

    this.dead          = false;
    this.readyToRemove = false;
    this.exploding     = false;
    this.exTimer       = 0;
    this.exMax         = (type === 'borg' || type === 'borg_assimil') ? 1.4
                       : type === 'borg_sphere' ? 1.1 : .75;
    this.firing        = false;
    this.hitByNova     = false;
    this.tick          = 0;
  }

  get hitRadius() { return 50 * this.scale; }

  takeDamage(dmg) {
    if (this.dead) return;
    this.hp -= dmg;
    if (this.hp <= 0) {
      this.hp        = 0;
      this.dead      = true;
      this.exploding = true;
      const isBig = this.type === 'borg' || this.type === 'borg_assimil';
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

    this.targetX = CFG.W/2 + this.worldX * 0.85;
    this.targetY = Player.y - 110 + this.worldY;

    const t = U.easeIn(U.clamp(1 - this.z / CFG.Z_SPAWN, 0, 1));
    this.sx    = U.lerp(this.spawnX, this.targetX, t);
    this.sy    = U.lerp(this.spawnY, this.targetY, t);
    this.scale = U.lerp(0.022, 0.78, t);

    if (this.z <= CFG.Z_KILL) {
      const lateralDist = Math.abs(this.sx - Player.x);
      const verticalDist = Math.abs(this.sy - Player.y);
      if (lateralDist < 95 && verticalDist < 80) {
        const dmg = this.type === 'borg_assimil' ? 50
                  : this.type === 'borg'          ? 35
                  : this.type === 'borg_sphere'   ? 28
                  : 22;
        Player.takeHit(dmg);
      }
      this.dead = true; this.readyToRemove = true;
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
      const bw = 55*this.scale, bh = 5*this.scale;
      const bx = this.sx-bw/2, by = this.sy-52*this.scale;
      ctx.fillStyle='#330000'; ctx.fillRect(bx,by,bw,bh);
      ctx.fillStyle=this.hp/this.maxHp>.4?'#ff6600':'#ff2200';
      ctx.fillRect(bx,by,bw*(this.hp/this.maxHp),bh);
    }

    // Tap target ring (visible when enemy is hittable)
    if (this.scale > .06 && this.scale < .85) {
      const a = U.clamp((this.scale-.06)*2.5, 0, .55);
      ctx.save();
      ctx.strokeStyle=`rgba(255,180,40,${a})`;
      ctx.lineWidth=1; ctx.setLineDash([5,5]);
      ctx.beginPath(); ctx.arc(this.sx,this.sy,48*this.scale,0,Math.PI*2); ctx.stroke();
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
    const sp  = CFG.BOP_SPEED_BASE + (n-1)*65;
    const bsp = CFG.BORG_SPEED_BASE + n*30;

    // Helper: random position enemy
    const rnd = (type, opts={}) => ({
      type,
      wx:    opts.wx    ?? U.rnd(-480, 480),
      wy:    opts.wy    ?? U.rnd(-60, 60),
      speed: opts.speed ?? sp,
      driftX:opts.driftX ?? 0,
      delay: opts.delay  ?? 0,
    });

    const waves = [
      // Wave 1 — 3 BOPs, spread entry
      [
        {type:'bop', wx:  0,   wy:  0,  speed:sp},
        {type:'bop', wx:-280,  wy: 30,  speed:sp,   delay:900},
        {type:'bop', wx: 320,  wy:-20,  speed:sp,   delay:900},
      ],
      // Wave 2 — V formation, wider
      [
        {type:'bop', wx:   0,  wy:  0,  speed:sp*1.1},
        {type:'bop', wx:-240,  wy: 40,  speed:sp*1.1, delay:600},
        {type:'bop', wx: 260,  wy: 40,  speed:sp*1.1, delay:600},
        {type:'bop', wx:-440,  wy: 80,  speed:sp*1.1, delay:1300},
        {type:'bop', wx: 460,  wy: 80,  speed:sp*1.1, delay:1300},
      ],
      // Wave 3 — flanking pincer from both sides
      [
        {type:'bop', wx:-500,  wy: 20,  speed:sp*1.2, driftX: 3.0},
        {type:'bop', wx: 500,  wy: 20,  speed:sp*1.2, driftX:-3.0},
        {type:'bop', wx:-200,  wy:-40,  speed:sp*1.25, delay:1400},
        {type:'bop', wx: 220,  wy: 60,  speed:sp*1.25, delay:1800},
        {type:'bop', wx:  80,  wy:-30,  speed:sp*1.3,  delay:2600},
        {type:'bop', wx:-360,  wy: 10,  speed:sp*1.4,  delay:3500},
      ],
      // Wave 4 — first Borg + escort, varied Y
      [
        {type:'bop',  wx:-350, wy: 50,  speed:sp*1.1},
        {type:'bop',  wx: 380, wy:-30,  speed:sp*1.1,  delay:400},
        {type:'borg', wx:  30, wy:-20,  speed:bsp,      delay:2800},
        {type:'bop',  wx:-180, wy: 70,  speed:sp*1.2,   delay:4000},
        {type:'bop',  wx: 200, wy:-50,  speed:sp*1.2,   delay:4000},
        {type:'bop',  wx: -60, wy: 30,  speed:sp*1.35,  delay:5200},
      ],
      // Wave 5 — Borg scout swarms + spheres
      [
        {type:'borg_scout', wx:-350, wy: 40,  speed:sp*1.7},
        {type:'borg_scout', wx: 380, wy:-20,  speed:sp*1.7,  delay:250},
        {type:'borg_scout', wx: -80, wy: 60,  speed:sp*1.65, delay:700},
        {type:'borg_scout', wx: 120, wy:-50,  speed:sp*1.65, delay:950},
        {type:'borg_sphere',wx:-220, wy: 20,  speed:bsp*1.1, delay:2000},
        {type:'borg_sphere',wx: 250, wy:-30,  speed:bsp*1.1, delay:2000},
        {type:'borg_scout', wx:-480, wy: 80,  speed:sp*1.8,  delay:3600},
        {type:'borg_scout', wx: 460, wy:-60,  speed:sp*1.8,  delay:3600},
      ],
      // Wave 6 — Assimilation ship boss + mixed escort
      [
        {type:'borg_scout',  wx:-420, wy: 60,  speed:sp*1.5},
        {type:'borg_scout',  wx: 440, wy:-40,  speed:sp*1.5,  delay:350},
        {type:'borg_sphere', wx:-260, wy: 30,  speed:bsp*1.1, delay:1600},
        {type:'borg_sphere', wx: 280, wy:-60,  speed:bsp*1.1, delay:1600},
        {type:'borg_assimil',wx: -20, wy:  0,  speed:bsp*.7,  delay:4200},
        {type:'borg_scout',  wx:-160, wy: 80,  speed:sp*1.6,  delay:5400},
        {type:'borg_scout',  wx: 180, wy:-30,  speed:sp*1.6,  delay:5400},
      ],
    ];
    const template = waves[Math.min(n-1, waves.length-1)];
    return template.map(e => ({...e}));
  }

  return {
    get list() { return _list; },
    init()  { _list=[]; queue=[]; waveActive=false; },
    reset() { _list=[]; queue=[]; waveActive=false; },

    isWaveClear() {
      return waveActive && queue.length===0
          && _list.every(e=>e.readyToRemove||(e.dead&&!e.exploding));
    },

    startWave(n) {
      waveActive=true; _list=[];
      queue = buildWave(n).map(e=>({...e}));
    },

    update(dt) {
      queue = queue.filter(item=>{
        item.delay -= dt*1000;
        if(item.delay<=0){_list.push(new Enemy(item));return false;}
        return true;
      });
      for(const e of _list) e.update(dt);
      _list = _list.filter(e=>!e.readyToRemove);
    },

    render(ctx) {
      const sorted=[..._list].sort((a,b)=>b.z-a.z);
      for(const e of sorted) e.render(ctx);
    }
  };
})();
