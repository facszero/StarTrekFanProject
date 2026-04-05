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
      targetX = U.clamp(nx, CFG.PLAYER_X_MIN, CFG.PLAYER_X_MAX);
      targetY = U.clamp(ny, CFG.PLAYER_Y_MIN, CFG.PLAYER_Y_MAX);
    },

    // Called from game.js on tap-on-enemy
    // Tap on enemy → sets priority target for sustained phaser beam
    setPriorityTarget(enemy) {
      Phasers.setPriorityTarget(enemy);
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
        targetX = U.clamp(targetX - CFG.PLAYER_SPEED   * dt, CFG.PLAYER_X_MIN, CFG.PLAYER_X_MAX);
      if (keys['ArrowRight']|| keys['KeyD'])
        targetX = U.clamp(targetX + CFG.PLAYER_SPEED   * dt, CFG.PLAYER_X_MIN, CFG.PLAYER_X_MAX);
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
  constructor({ type='bop', wx=0, wy=0, speed=780, driftX=0, driftY=0, size=1.0 }) {
    this.type   = type;
    this.worldX = wx;
    this.worldY = wy;
    this.z      = CFG.Z_SPAWN;
    this.speed  = speed;
    this.driftX = driftX;
    this.driftY = driftY;
    this.size   = size;   // used by asteroids

    this.spawnX  = CFG.W/2 + wx * 0.038 + U.rnd(-12, 12);
    this.spawnY  = CFG.HORIZON_Y + 6;
    this.targetX = CFG.W/2 + wx * 0.85;
    this.targetY = CFG.PLAYER_Y0 - 110 + wy;

    this.sx    = this.spawnX;
    this.sy    = this.spawnY;
    this.scale = 0.022;

    this.hp     = type === 'borg'         ? 210
                : type === 'borg_sphere'  ? 150
                : type === 'borg_scout'   ?  45
                : type === 'borg_assimil' ? 380
                : type === 'neghvar'      ? 150
                : type === 'dderidex'     ? 120
                : type === 'vorcha'       ?  90
                : type === 'valdore'      ?  80
                : type === 'galor'        ?  75
                : type === 'keldon'       ? 110
                : type === 'jem_hadar'    ?  55
                : type === 'jem_battle'   ? 140
                : type === 'bioship'      ?  70
                : type === 'bioship_lg'   ? 280
                : type === 'lore_scout'   ?  45
                : type === 'lore_enforcer'? 130
                : type === 'lore_titan'   ? 450
                : type === 'asteroid'     ? Math.ceil(size * 3)
                : 30;
    this.maxHp  = this.hp;
    this.points = type === 'borg'         ?  500
                : type === 'borg_sphere'  ?  350
                : type === 'borg_scout'   ?  120
                : type === 'borg_assimil' ? 1000
                : type === 'neghvar'      ?  400
                : type === 'dderidex'     ?  350
                : type === 'vorcha'       ?  250
                : type === 'valdore'      ?  200
                : type === 'galor'        ?  175
                : type === 'keldon'       ?  280
                : type === 'jem_hadar'    ?  150
                : type === 'jem_battle'   ?  380
                : type === 'bioship'      ?  200
                : type === 'bioship_lg'   ?  800
                : type === 'lore_scout'   ?  150
                : type === 'lore_enforcer'?  500
                : type === 'lore_titan'   ? 1500
                : type === 'asteroid'     ?   50
                : 100;

    this.dead          = false;
    this.readyToRemove = false;
    this.exploding     = false;
    this.exTimer       = 0;
    this.exMax         = (type === 'borg' || type === 'borg_assimil' || type === 'neghvar' || type === 'dderidex') ? 1.4
                       : (type === 'borg_sphere' || type === 'vorcha' || type === 'valdore') ? 1.0
                       : type === 'asteroid' ? 0.5
                       : .75;
    this.firing    = false;
    this.chargeTimer = 0;
    this.chargePct   = 0;
    this.hitByNova = false;
    this.tick      = 0;
    this.rotation  = Math.random() * Math.PI * 2;
    this.rotSpeed  = type === 'asteroid' ? U.rnd(-1.8, 1.8) : 0;
    // Enemy fire — only for non-asteroid types that have fire config
    this.canFire   = EnemyFire.hasFire(type);
    this.fireTimer = this.canFire ? U.rnd(1.5, 4.0) : Infinity; // stagger initial shots

    // Asteroid: generate irregular polygon vertices once
    if (type === 'asteroid') {
      const n = 7 + Math.floor(Math.random() * 5);
      this.verts = Array.from({length:n}, (_,i) => {
        const a = (i/n) * Math.PI * 2;
        const r = 0.65 + Math.random() * 0.35;
        return [Math.cos(a)*r, Math.sin(a)*r];
      });
    }
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
    if (this.type === 'asteroid') this.rotation += this.rotSpeed * dt;

    // Lore Titan: charge focal beam
    if (this.type === 'lore_titan' && this.scale > 0.15 && !this.exploding) {
      this.chargeTimer += dt;
      const cycleTime = EnemyFire.getInterval('lore_titan', Enemies.currentWave);
      this.chargePct = Math.min(1, this.chargeTimer / (cycleTime * 0.7));
      if (this.chargeTimer >= cycleTime) {
        EnemyFire.fire(this, Player.x, Player.y);
        this.chargeTimer = 0; this.chargePct = 0;
      }
    }
    // Enemy fires when visible (scale > 0.12) and fire timer expires
    if (this.canFire && this.type !== 'lore_titan' && this.scale > 0.12 && !this.exploding) {
      this.fireTimer -= dt;
      if (this.fireTimer <= 0) {
        EnemyFire.fire(this, Player.x, Player.y);
        this.fireTimer = EnemyFire.getInterval(this.type, Enemies.currentWave || 1);
      }
    }

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
                  : this.type === 'neghvar'        ? 32
                  : this.type === 'dderidex'       ? 28
                  : this.type === 'vorcha'         ? 25
                  : this.type === 'asteroid'       ? Math.ceil(18*(this.size||1))
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

    if      (this.type === 'bop')         Draw.birdOfPrey   (ctx, this.sx, this.sy, this.scale * .72);
    else if (this.type === 'borg')        Draw.borgCube     (ctx, this.sx, this.sy, this.scale, this.tick);
    else if (this.type === 'borg_sphere') Draw.borgSphere   (ctx, this.sx, this.sy, this.scale, this.tick);
    else if (this.type === 'borg_scout')  Draw.borgScout    (ctx, this.sx, this.sy, this.scale, this.tick);
    else if (this.type === 'borg_assimil')Draw.borgAssimil  (ctx, this.sx, this.sy, this.scale, this.tick, this.firing);
    else if (this.type === 'valdore')     Draw.valdore      (ctx, this.sx, this.sy, this.scale, this.tick);
    else if (this.type === 'dderidex')    Draw.dderidex     (ctx, this.sx, this.sy, this.scale, this.tick);
    else if (this.type === 'vorcha')      Draw.vorcha       (ctx, this.sx, this.sy, this.scale, this.tick);
    else if (this.type === 'neghvar')     Draw.neghvar      (ctx, this.sx, this.sy, this.scale, this.tick);
    else if (this.type === 'galor')       Draw.galor        (ctx, this.sx, this.sy, this.scale);
    else if (this.type === 'keldon')      Draw.keldon       (ctx, this.sx, this.sy, this.scale);
    else if (this.type === 'jem_hadar')   Draw.jemHadar     (ctx, this.sx, this.sy, this.scale);
    else if (this.type === 'jem_battle')  Draw.jemHadarBattle(ctx, this.sx, this.sy, this.scale);
    else if (this.type === 'bioship')     Draw.bioship      (ctx, this.sx, this.sy, this.scale, false);
    else if (this.type === 'bioship_lg')  Draw.bioship      (ctx, this.sx, this.sy, this.scale, true);
    else if (this.type === 'lore_scout')   Draw.loreScout   (ctx, this.sx, this.sy, this.scale);
    else if (this.type === 'lore_enforcer')Draw.loreEnforcer(ctx, this.sx, this.sy, this.scale);
    else if (this.type === 'lore_titan')   Draw.loreTitan   (ctx, this.sx, this.sy, this.scale, this.chargePct||0);
    else if (this.type === 'asteroid') {
      const r = 38 * this.scale * (this.size || 1);
      Draw.asteroid(ctx, this.sx, this.sy, r, this.rotation, this.verts);
    }

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
  let _currentWave = 1;
  let _astTimer = 0;    // countdown to next random asteroid
  let _astBase  = 12;   // base interval seconds between random asteroids

  function _newAstInterval() {
    return U.rnd(_astBase * 0.5, _astBase * 1.5);
  }

  function buildWave(n) {
    const sp  = CFG.BOP_SPEED_BASE + (n-1)*55;   // 420→1190 across 15 waves
    const bsp = CFG.BORG_SPEED_BASE + n*25;

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
      // Wave 1 — 5 BOPs: center first, then flanks, then stragglers
      [
        {type:'bop', wx:   0, wy:  0, speed:sp},
        {type:'bop', wx:-280, wy: 30, speed:sp,    delay:1200},
        {type:'bop', wx: 320, wy:-20, speed:sp,    delay:1200},
        {type:'bop', wx:-120, wy:-30, speed:sp*.9, delay:3000},
        {type:'bop', wx: 160, wy: 40, speed:sp*.9, delay:4200},
      ],
      // Wave 2 — V formation, 6 ships, wider spread
      [
        {type:'bop', wx:   0, wy:  0, speed:sp*1.05},
        {type:'bop', wx:-240, wy: 40, speed:sp*1.05, delay:700},
        {type:'bop', wx: 260, wy: 40, speed:sp*1.05, delay:700},
        {type:'bop', wx:-440, wy: 80, speed:sp*1.1,  delay:1800},
        {type:'bop', wx: 460, wy: 80, speed:sp*1.1,  delay:1800},
        {type:'bop', wx:  60, wy:-40, speed:sp*1.15, delay:3400},
      ],
      // Wave 3 — flanking pincer + back-row reinforcements
      [
        {type:'bop', wx:-500, wy: 20, speed:sp*1.15, driftX: 2.5},
        {type:'bop', wx: 500, wy: 20, speed:sp*1.15, driftX:-2.5},
        {type:'bop', wx:-200, wy:-40, speed:sp*1.2,  delay:1600},
        {type:'bop', wx: 220, wy: 60, speed:sp*1.2,  delay:2000},
        {type:'bop', wx:  80, wy:-30, speed:sp*1.25, delay:3200},
        {type:'bop', wx:-360, wy: 10, speed:sp*1.3,  delay:4200},
        {type:'bop', wx: 380, wy:-50, speed:sp*1.3,  delay:5500},
      ],
      // Wave 4 — first Borg cube + heavy BOP escort
      [
        {type:'bop',  wx:-350, wy: 50, speed:sp*1.1},
        {type:'bop',  wx: 380, wy:-30, speed:sp*1.1,  delay:500},
        {type:'bop',  wx:-100, wy: 30, speed:sp*1.15, delay:1400},
        {type:'borg', wx:  30, wy:-20, speed:bsp,      delay:3200},
        {type:'bop',  wx:-180, wy: 70, speed:sp*1.2,   delay:4500},
        {type:'bop',  wx: 200, wy:-50, speed:sp*1.2,   delay:4500},
        {type:'bop',  wx: -60, wy: 30, speed:sp*1.3,   delay:6000},
        {type:'borg', wx:-200, wy:-20, speed:bsp*.85,  delay:7500},
      ],
      // Wave 5 — Borg scouts + spheres, multi-wave assault
      [
        {type:'borg_scout', wx:-350, wy: 40, speed:sp*1.6},
        {type:'borg_scout', wx: 380, wy:-20, speed:sp*1.6,  delay:300},
        {type:'borg_scout', wx: -80, wy: 60, speed:sp*1.55, delay:900},
        {type:'borg_scout', wx: 120, wy:-50, speed:sp*1.55, delay:1200},
        {type:'borg_sphere',wx:-220, wy: 20, speed:bsp*1.1, delay:2500},
        {type:'borg_sphere',wx: 250, wy:-30, speed:bsp*1.1, delay:2500},
        {type:'borg_scout', wx:-480, wy: 80, speed:sp*1.7,  delay:4200},
        {type:'borg_scout', wx: 460, wy:-60, speed:sp*1.7,  delay:4200},
        {type:'borg_sphere',wx:  20, wy:  0, speed:bsp,     delay:6000},
      ],
      // Wave 6 — Assimilation ship + full Borg screen
      [
        {type:'borg_scout',  wx:-420, wy: 60, speed:sp*1.45},
        {type:'borg_scout',  wx: 440, wy:-40, speed:sp*1.45, delay:400},
        {type:'borg_sphere', wx:-260, wy: 30, speed:bsp*1.1, delay:1800},
        {type:'borg_sphere', wx: 280, wy:-60, speed:bsp*1.1, delay:1800},
        {type:'borg_scout',  wx: -80, wy: 50, speed:sp*1.5,  delay:3200},
        {type:'borg_scout',  wx: 100, wy:-30, speed:sp*1.5,  delay:3200},
        {type:'borg_assimil',wx: -20, wy:  0, speed:bsp*.65, delay:5000},
        {type:'borg_scout',  wx:-160, wy: 80, speed:sp*1.55, delay:6500},
        {type:'borg_scout',  wx: 180, wy:-30, speed:sp*1.55, delay:6500},
      ],
      // Wave 7 — Romulan patrol: Valdore + D'deridex
      [
        {type:'valdore',  wx:-380, wy: 20,  speed:sp*1.2},
        {type:'valdore',  wx: 360, wy:-30,  speed:sp*1.2,  delay:400},
        {type:'dderidex', wx:  40, wy: 10,  speed:sp*.95,  delay:2000},
        {type:'valdore',  wx:-200, wy: 50,  speed:sp*1.3,  delay:3400},
        {type:'valdore',  wx: 220, wy:-20,  speed:sp*1.3,  delay:3400},
        {type:'dderidex', wx: -60, wy:-30,  speed:sp*.9,   delay:5000},
      ],
      // Wave 8 — Klingon heavy: B'rel swarm + Vor'cha + Negh'Var
      [
        {type:'bop',     wx:-300, wy: 30,  speed:sp*1.5},
        {type:'bop',     wx: 320, wy:-20,  speed:sp*1.5,  delay:250},
        {type:'vorcha',  wx:-150, wy: 20,  speed:sp*1.1,  delay:1400},
        {type:'vorcha',  wx: 180, wy:-40,  speed:sp*1.1,  delay:1400},
        {type:'bop',     wx:   0, wy: 10,  speed:sp*1.6,  delay:2600},
        {type:'neghvar', wx: -30, wy:  0,  speed:sp*.85,  delay:4000},
        {type:'bop',     wx:-400, wy: 50,  speed:sp*1.7,  delay:5300},
        {type:'bop',     wx: 380, wy:-50,  speed:sp*1.7,  delay:5300},
      ],
      // Wave 9 — Multi-faction: Klingon + Romulan together
      [
        {type:'bop',     wx:-420, wy: 40,  speed:sp*1.4},
        {type:'valdore', wx: 380, wy:-30,  speed:sp*1.2,  delay:300},
        {type:'vorcha',  wx:-180, wy: 20,  speed:sp*1.1,  delay:1600},
        {type:'dderidex',wx: 160, wy:-20,  speed:sp*.95,  delay:1600},
        {type:'bop',     wx:   0, wy: 50,  speed:sp*1.5,  delay:2800},
        {type:'neghvar', wx: -60, wy:-30,  speed:sp*.85,  delay:4200},
        {type:'valdore', wx:-300, wy: 60,  speed:sp*1.3,  delay:5600},
        {type:'bop',     wx: 300, wy:-40,  speed:sp*1.6,  delay:5600},
      ],
      // Wave 10 — Asteroid field + scattered attack
      [
        {type:'asteroid',wx:-350, wy: 20,  speed:680, size:0.7},
        {type:'asteroid',wx: 280, wy:-10,  speed:750, size:0.9, delay:400},
        {type:'bop',     wx:-200, wy: 30,  speed:sp*1.4, delay:800},
        {type:'asteroid',wx:  60, wy: 40,  speed:600, size:1.1, delay:1200},
        {type:'bop',     wx: 250, wy:-20,  speed:sp*1.4, delay:1400},
        {type:'asteroid',wx:-100, wy:-30,  speed:800, size:0.6, delay:2000},
        {type:'valdore', wx: -50, wy: 10,  speed:sp*1.2, delay:2800},
        {type:'asteroid',wx: 350, wy: 50,  speed:700, size:1.0, delay:3200},
        {type:'vorcha',  wx:-250, wy:-20,  speed:sp*1.1, delay:3800},
        {type:'asteroid',wx: 150, wy:-40,  speed:650, size:0.8, delay:4400},
        {type:'asteroid',wx:-200, wy: 30,  speed:720, size:0.5, delay:5000},
        {type:'borg',    wx:  20, wy:  0,  speed:bsp,    delay:5800},
      ],
      // Wave 11 — Full Borg + Romulan + Asteroid (escalated repeat)
      [
        {type:'asteroid', wx:-300, wy: 30, speed:750, size:0.8},
        {type:'borg_scout',wx: 350, wy:-20, speed:sp*1.8, delay:300},
        {type:'asteroid', wx: 200, wy:-40, speed:700, size:1.1, delay:700},
        {type:'borg_sphere',wx:-180, wy:20, speed:bsp*1.2, delay:1500},
        {type:'dderidex', wx: 220, wy:-30, speed:sp*1.0, delay:1500},
        {type:'asteroid', wx: -80, wy: 10, speed:820, size:0.6, delay:2400},
        {type:'borg_scout',wx:-380, wy: 50, speed:sp*1.9, delay:3200},
        {type:'borg',     wx:  40, wy:  0, speed:bsp,    delay:4500},
        {type:'asteroid', wx: 300, wy:-50, speed:680, size:1.2, delay:5200},
        {type:'borg_assimil',wx:-20, wy: 0, speed:bsp*.65, delay:6500},
      ],
      // Wave 12 — Cardassian fleet
      [
        {type:'galor',   wx:-380, wy: 30,  speed:sp*1.15},
        {type:'galor',   wx: 360, wy:-20,  speed:sp*1.15, delay:350},
        {type:'galor',   wx:   0, wy: 10,  speed:sp*1.2,  delay:1200},
        {type:'keldon',  wx:-200, wy: 40,  speed:sp*1.0,  delay:2400},
        {type:'keldon',  wx: 220, wy:-30,  speed:sp*1.0,  delay:2400},
        {type:'galor',   wx:-450, wy: 20,  speed:sp*1.3,  delay:3800},
        {type:'galor',   wx: 430, wy:-40,  speed:sp*1.3,  delay:3800},
        {type:'keldon',  wx:  30, wy: 10,  speed:sp*.9,   delay:5200},
      ],
      // Wave 13 — Dominion
      [
        {type:'jem_hadar',  wx:-350, wy: 20, speed:sp*1.6},
        {type:'jem_hadar',  wx: 370, wy:-30, speed:sp*1.6, delay:200},
        {type:'jem_battle', wx:-200, wy: 20, speed:sp*1.1, delay:1800},
        {type:'jem_battle', wx: 220, wy:-20, speed:sp*1.1, delay:1800},
        {type:'jem_hadar',  wx:-420, wy: 50, speed:sp*1.7, delay:3400},
        {type:'jem_hadar',  wx: 440, wy:-50, speed:sp*1.7, delay:3400},
        {type:'jem_battle', wx:  10, wy:  0, speed:sp*.95, delay:5000},
      ],
      // Wave 14 — Cardassian + Dominion + asteroids
      [
        {type:'asteroid',   wx:-320, wy: 20, speed:700, size:0.8},
        {type:'jem_hadar',  wx: 350, wy:-20, speed:sp*1.5, delay:250},
        {type:'galor',      wx:-180, wy: 30, speed:sp*1.1, delay:900},
        {type:'asteroid',   wx: 150, wy:-30, speed:750, size:1.0, delay:1300},
        {type:'jem_battle', wx: -30, wy: 10, speed:sp*.9,  delay:2200},
        {type:'keldon',     wx: 260, wy:-40, speed:sp*1.0, delay:2200},
        {type:'asteroid',   wx:-200, wy: 50, speed:680, size:1.2, delay:3200},
        {type:'galor',      wx: -80, wy: 20, speed:sp*1.2, delay:4800},
      ],
      // Wave 15 — Species 8472 Bioships
      [
        {type:'bioship',    wx:-320, wy: 20, speed:sp*1.4},
        {type:'bioship',    wx: 340, wy:-30, speed:sp*1.4, delay:300},
        {type:'bioship',    wx: 120, wy:-20, speed:sp*1.35, delay:1200},
        {type:'bioship_lg', wx: -40, wy:  0, speed:sp*.75, delay:4500},
        {type:'bioship_lg', wx: 100, wy:-20, speed:sp*.70, delay:7000},
      ],
      // ── ACT V: LORE'S AWAKENING ─────────────────────────────────
      // Wave 16 — First Contact
      [
        {type:'lore_scout',   wx:-420, wy: 30, speed:sp*2.2},
        {type:'lore_scout',   wx: 400, wy:-20, speed:sp*2.2, delay:200},
        {type:'lore_scout',   wx:-200, wy: 50, speed:sp*2.0, delay:700},
        {type:'lore_scout',   wx: 220, wy:-40, speed:sp*2.0, delay:900},
        {type:'bioship',      wx: -60, wy: 20, speed:sp*1.5, delay:2000},
        {type:'lore_scout',   wx:-480, wy:-30, speed:sp*2.2, delay:2600},
        {type:'bioship',      wx: 280, wy:-20, speed:sp*1.5, delay:3000},
        {type:'lore_scout',   wx: 460, wy: 40, speed:sp*2.2, delay:3600},
      ],
      // Wave 17 — Organized Assault
      [
        {type:'lore_enforcer',wx:-320, wy: 20, speed:sp*1.4},
        {type:'lore_enforcer',wx: 340, wy:-30, speed:sp*1.4, delay:400},
        {type:'lore_scout',   wx:-160, wy: 50, speed:sp*2.0, delay:900},
        {type:'lore_scout',   wx: 180, wy:-40, speed:sp*2.0, delay:1100},
        {type:'bioship',      wx:-280, wy: 20, speed:sp*1.4, delay:2200},
        {type:'bioship',      wx: 300, wy:-20, speed:sp*1.4, delay:2200},
        {type:'lore_enforcer',wx:   0, wy:  0, speed:sp*1.3, delay:3800},
        {type:'asteroid',     wx:-350, wy:-20, speed:800, size:0.9, delay:4800},
        {type:'asteroid',     wx: 380, wy: 30, speed:750, size:1.0, delay:5100},
      ],
      // Wave 18 — Heavy Attack
      [
        {type:'lore_scout',   wx:-440, wy: 30, speed:sp*2.1},
        {type:'lore_scout',   wx: 460, wy:-20, speed:sp*2.1, delay:250},
        {type:'lore_enforcer',wx:-240, wy: 40, speed:sp*1.4, delay:900},
        {type:'lore_enforcer',wx: 260, wy:-30, speed:sp*1.4, delay:1100},
        {type:'bioship_lg',   wx:-100, wy: 10, speed:sp*0.9, delay:2800},
        {type:'bioship_lg',   wx: 120, wy:-20, speed:sp*0.9, delay:2800},
        {type:'asteroid',     wx:-320, wy: 50, speed:820, size:1.2, delay:4000},
        {type:'lore_enforcer',wx: 360, wy:-40, speed:sp*1.5, delay:4500},
        {type:'asteroid',     wx: 200, wy:-30, speed:780, size:0.8, delay:5300},
        {type:'bioship_lg',   wx:  30, wy:  0, speed:sp*0.85,delay:6600},
      ],
      // Wave 19 — Titan Assault
      [
        {type:'lore_scout',   wx:-400, wy: 30, speed:sp*2.2},
        {type:'lore_scout',   wx: 420, wy:-20, speed:sp*2.2, delay:200},
        {type:'lore_enforcer',wx:-220, wy: 40, speed:sp*1.4, delay:1100},
        {type:'lore_enforcer',wx: 240, wy:-30, speed:sp*1.4, delay:1300},
        {type:'lore_titan',   wx:-120, wy: 10, speed:sp*0.65,delay:3000},
        {type:'lore_enforcer',wx: 300, wy:-40, speed:sp*1.5, delay:3800},
        {type:'lore_titan',   wx: 140, wy:-10, speed:sp*0.60,delay:5000},
        {type:'lore_scout',   wx:-460, wy: 20, speed:sp*2.3, delay:5800},
        {type:'lore_scout',   wx: 480, wy:-30, speed:sp*2.3, delay:6000},
        {type:'asteroid',     wx:-200, wy: 50, speed:750, size:1.1, delay:6800},
      ],
      // Wave 20 — FINAL STAND
      [
        {type:'lore_scout',   wx:-440, wy: 30, speed:sp*2.3},
        {type:'lore_scout',   wx: 460, wy:-20, speed:sp*2.3, delay:200},
        {type:'lore_enforcer',wx:-280, wy: 40, speed:sp*1.5, delay:800},
        {type:'lore_enforcer',wx: 300, wy:-30, speed:sp*1.5, delay:1000},
        {type:'bioship_lg',   wx:-160, wy: 20, speed:sp*0.95,delay:2200},
        {type:'bioship_lg',   wx: 180, wy:-20, speed:sp*0.95,delay:2200},
        {type:'lore_titan',   wx: -50, wy:  0, speed:sp*0.55,delay:4000},
        {type:'lore_scout',   wx:-420, wy: 50, speed:sp*2.4, delay:5200},
        {type:'lore_scout',   wx: 440, wy:-40, speed:sp*2.4, delay:5400},
        {type:'lore_enforcer',wx: 100, wy: 30, speed:sp*1.6, delay:6200},
        {type:'lore_titan',   wx:-200, wy:-10, speed:sp*0.50,delay:7800},
        {type:'asteroid',     wx: 300, wy:-30, speed:800, size:1.3, delay:9000},
        {type:'lore_titan',   wx: 200, wy: 10, speed:sp*0.50,delay:11000},
      ],
    ];
    const template = waves[Math.min(n-1, waves.length-1)];
    return template.map(e => ({...e, delay: e.delay || 0}));  // CRITICAL: default delay=0
  }

  return {
    get list()         { return _list; },
    get currentWave()  { return _currentWave; },
    init()  { _list=[]; queue=[]; waveActive=false; _astTimer=_newAstInterval(); _currentWave=1; },
    reset() { _list=[]; queue=[]; waveActive=false; _astTimer=_newAstInterval(); _currentWave=1; },

    isWaveClear() {
      return waveActive && queue.length===0
          && _list.every(e=>e.readyToRemove||(e.dead&&!e.exploding));
    },

    startWave(n) {
      waveActive=true; _list=[]; _currentWave=n;
      queue = buildWave(n).map(e=>({...e}));
    },

    update(dt) {
      queue = queue.filter(item=>{
        item.delay -= dt*1000;
        if(item.delay<=0){_list.push(new Enemy(item));return false;}
        return true;
      });

      // ── Random asteroid spawner ───────────────────────────────
      if (waveActive) {
        _astTimer -= dt;
        if (_astTimer <= 0) {
          // Inject 1-2 random asteroids at scattered positions
          const count = Math.random() < 0.35 ? 2 : 1;
          for (let i=0; i<count; i++) {
            _list.push(new Enemy({
              type:  'asteroid',
              wx:    U.rnd(-480, 480),
              wy:    U.rnd(-50, 60),
              speed: U.rnd(600, 900),
              size:  U.rnd(0.5, 1.2),
            }));
          }
          _astTimer = _newAstInterval();
        }
      }

      for(const e of _list) e.update(dt);
      _list = _list.filter(e=>!e.readyToRemove);
    },

    render(ctx) {
      const sorted=[..._list].sort((a,b)=>b.z-a.z);
      for(const e of sorted) e.render(ctx);
    }
  };
})();
