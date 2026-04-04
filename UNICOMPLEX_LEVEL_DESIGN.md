# ACT V — UNIMATRIX ONE: THE FINAL RUN
## Design Document — Borg Unicomplex Level

### Canon Reference
- **Name:** Unimatrix One (Primary Unicomplex)
- **Size:** ≥600 km spanning (Memory Alpha), visually "half a star system"
- **Structure:** Thousands of interconnected sub-structures, hundreds of Borg cubes docked
- **Destroyed:** 2378, VOY "Endgame" — neurolytic pathogen from Admiral Janeway
- **Script description:** *"A vast infrastructure of interconnecting modules, grids, technology —
  a 'metropolis' floating in space as far as the eye can see."*
- **Original maquette:** Built by Dan Curry from wood blocks and Tinker Toys

### Game Concept
A tunnel/corridor shooter within the Unicomplex itself.

Instead of enemies flying toward you from a vanishing point (After Burner style),
the player flies INTO the structure. The background IS the Unicomplex.
Escape before it finishes self-destructing.

### Level Flow
```
INTRO CINEMATIC (5s)
  "Unimatrix One. The heart of the Borg Collective.
   Admiral Janeway's pathogen is spreading.
   You have one chance to get Voyager out."

PHASE 1 — OUTER APPROACH (waves 16-17)
  - Unicomplex structures appear as parallax background
  - Borg scouts + spheres defending the perimeter
  - hub_top sprite at distance = decorative horizon element
  - Background: deep Borg green, structure silhouettes

PHASE 2 — INNER CORRIDOR (wave 18)
  - Camera pushed deeper: side_long sprite fills center
  - Walls of the corridor = Unicomplex panels scrolling
  - Tighter spawn corridor (x range reduced 30%)
  - Explosion FX begin appearing in background (self-destruct starting)
  - Borg drones swarm (fast borg_scouts, tight formations)

PHASE 3 — QUEEN'S NEXUS (wave 19 — BOSS)
  - hub_top at massive scale = the Queen's chamber
  - Destroy 4 power nodes (marked with lock-on rings) around the hub
  - Each node has HP bar; Borg adaptation mechanic at max (50% multiplier cap)
  - Torpedoes essential; Nova resets adaptation
  - Explosion chain as each node dies

ESCAPE SEQUENCE (cinematic + gameplay)
  - "TRANSWARP CONDUIT OPEN — 30 SECONDS"
  - iso_right sprite behind player (chasing)
  - Timer countdown in HUD
  - Dodge debris + borg_scouts while accelerating
  - Background warp-out effect (stars become streaks)

VICTORY SCREEN
  - "The Unicomplex is destroyed. The Collective is in chaos.
    The Enterprise has returned home."
  - Score tally, "RESISTANCE WAS NOT FUTILE"
```

### Sprite Usage
| Sprite | Phase | Role | Scale |
|---|---|---|---|
| hub_top | 1,3 | Background structure / Boss | 0.3-1.5 |
| iso_right | 1 | Background parallax | 0.2-0.4 |
| side_long | 2 | Corridor walls | 1.0-2.0 |
| node_med | 3 | Destructible power nodes | 0.5-0.8 |
| fragment_sm | all | Background debris | 0.1-0.3 |
| low_angle | 2 | Dramatic corridor ceiling | 1.2-1.8 |

### 3D Models (Fernando's Tinkercad files)
Images 1-7 show a detailed 3D Unicomplex model from multiple angles.
These could be used to:
- Generate additional 2D sprite renders at specific angles
- Reference for corridor tunnel background art
- Potential future Phase 3 (WebGL) upgrade

### Audio Design (future)
- Ambient: low frequency Borg hum (generated with Web Audio API)
- Self-destruct: building low rumble + explosion chain
- Queen voice: "You will be assimilated / Resistance is futile" (text only)
- Transwarp: whoosh + high-pitched resonance

### Technical Notes
- Background.setTheme('borg') already active in Act III
- Add Background.setMode('tunnel') for Phase 2 (modifies star field to corridor)
- Unicomplex nodes = Enemy subclass with fixed position + target lock behavior
- Escape timer = new HUD element (countdown bar, replaces wave indicator)
