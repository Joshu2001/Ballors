# Matchday Football Lab

A landscape-first 3D 11v11 football game built with React, TypeScript and Three.js.

## Play

Customize all eleven players, assign each a signature dribble, then choose the pitch, weather, team mentality and match length. The match includes pause, full time and replay.

## Controls

### Touch
- Left joystick: move and aim; partial tilt slows movement
- **SPRINT**: hold while moving; the button shows its pressed state
- **SKILL** or tap the ball: perform the selected player's signature dribble
- **PASS / SHOOT**: immediate assisted actions
- **LOB / CROSS**: hold to charge intensity, release to kick
- Player-name button: switch player
- Top-right orientation button: switch between landscape and portrait layouts

### Keyboard
- **WASD / arrows**: move and aim
- **Shift**: sprint
- **Space**: pass
- **J / K**: shoot
- **L**: through pass
- **V**: hold and release for a long ball
- **C**: hold and release for a cross
- **E**: signature dribble
- **Q / Tab**: switch player
- **P / Escape**: pause

## Main systems

- Full 22-player 4–3–3 match simulation with defensive, balanced and offensive team shape
- Angle-aware goalkeeper positioning, rushing, set positioning, diving, catching, parrying and cross claiming
- Speed-dependent strides, sprint lean, knee lift, arm counter-swing, jumping and distinct dribble animations
- Roulette, Robinho stepover, sombrero, stop-and-go, body feint and elastico
- Charged aerial balls with gravity, drag, bounce and curve; rain alters roll, bounce and handling
- Clear, cloudy and rainy presentation with responsive broadcast camera
- Fixed-timestep simulation, stamina, tackling, quick distribution and synthesized sound

## Run

```sh
npm install
npm run dev
```

Create a production build with `npm run build`, then serve it with `npm run preview`.
