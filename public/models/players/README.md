# Ballors Realistic 3D Footballer Assets (CC0 1.0 Universal)

This directory contains the 12 production-ready, rigged, PBR-textured, and skeletally animated glTF 2.0 binary (`.glb`) footballer models used across Ballors' Pre-Match Squad Showcase (`src/components/PreMatchShowcase3D.tsx`) and Live 11v11 Gameplay (`src/game/renderer3d.ts`).

## Included Models

- `goalkeeper.glb` (~1.35 MB) — Goalkeeper variant with emerald keeper kit, PBR normal maps, 24-bone humanoid skeleton, and 8 animation clips
- `outfield-1.glb` through `outfield-11.glb` (~1.35 MB each) — 11 distinct outfield player variants with diverse facial structure (jawline, cheekbones, nose bridge, brow ridge), physique proportions (shoulder breadth, thigh girth), hairstyles (`short-crop`, `textured-quiff`, `fade-curls`, `buzz`, `dreads`, `top-knot`), eye colors, and 6 photorealistic skin tones

## Source Assets & License Verification

All character geometry, rigging weights, and base PBR textures derive from **CC0 1.0 Universal (Public Domain Dedication)** MakeHuman / Innerscene assets:

1. **Innerscene / MakeHuman Clothed Soccer Player ("Micah")**
   - **Source URL:** https://www.innerscene.com/tools/library/3d-parts/soccer-player-standing-3d-person-team-sports-f55b1b4f
   - **Direct Asset CDN:** https://cdn.innerscene.com/models/people/73361082_micah_standing_soccer_player_fab4.glb
   - **License:** CC0 1.0 Universal (`https://creativecommons.org/publicdomain/zero/1.0/`)
   - **Contents Used:** Adult anatomical human mesh (`~7.75` heads tall), tailored football jersey & shorts (`male_casualsuit04` + normal map `male_casualsuit04_normal.png`), ribbed knee-high football socks (`socks01`), cleated football boots with 12 sole studs (`shoes06`), hair cards (`short01`), eyeballs (`Low-Poly`), eyebrows (`eyebrow001`), and eyelashes (`eyelashes01`). Static ball prop (`Mesh 22`), static chest decal (`Mesh 23`), and occluded inner-sock shin polygons were removed.

2. **Innerscene / MakeHuman Rigged Male Base Mesh (A-Pose)**
   - **Source URL:** https://www.innerscene.com/tools/library/3d-parts/male-base-mesh-3d-person-rigged-a-pose-380e6d89
   - **Direct Asset CDN:** https://cdn.innerscene.com/models/people/male_base_mesh_rigged_standing_a_pose_98f8.glb
   - **License:** CC0 1.0 Universal (`https://creativecommons.org/publicdomain/zero/1.0/`)
   - **Contents Used:** 163-bone MakeHuman armature joint positions (`inverseBindMatrices`) and per-vertex skin weights (`JOINTS_0`, `WEIGHTS_0`), retargeted via exact MakeHuman UV/topology correspondence (`34,194` exact UV vertex matches + spatial k-NN weight transfer for clothing) onto a clean 24-bone standard Humanoid Skeleton (`Hips`, `Spine`, `Chest`, `UpperChest`, `Neck`, `Head`, `LeftEye`, `RightEye`, `LeftShoulder`, `LeftUpperArm`, `LeftLowerArm`, `LeftHand`, `RightShoulder`, `RightUpperArm`, `RightLowerArm`, `RightHand`, `LeftUpperLeg`, `LeftLowerLeg`, `LeftFoot`, `LeftToe`, `RightUpperLeg`, `RightLowerLeg`, `RightFoot`, `RightToe`).

3. **Innerscene / MakeHuman Adult Male ("Daniel")**
   - **Source URL:** https://www.innerscene.com/tools/library/3d-parts/man-standing-3d-person-casual-649f9b11
   - **Direct Asset CDN:** https://cdn.innerscene.com/models/people/73558496_daniel_standing_man_casual_c3ab.glb
   - **License:** CC0 1.0 Universal (`https://creativecommons.org/publicdomain/zero/1.0/`)
   - **Contents Used:** High-detail facial skin normal map, fair/olive/tan skin complexions, blue/green eye iris textures, and brown/blonde hair strand alpha textures.

## Embedded Skeletal Animation Clips

Each `.glb` embeds 8 looping/action skeletal `AnimationClip`s driving the 24-bone humanoid rig with ground-locked stance kinematics:

1. `Idle` — Athletic breathing and subtle weight shift
2. `Walk` — Walk cycle with heel-to-toe roll and counter-arm swing
3. `Jog` — Mid-tempo match stride with forward torso lean
4. `Sprint` — High-cadence explosive sprint cycle with knee drive
5. `Turn` — Centripetal pivot step and upper-body turn rotation
6. `Kick` — 3-phase wind-up, whip-snap ball strike, and follow-through with planted support foot
7. `SquadStand` — Pre-match back-row standing lineup posture
8. `SquadCrouch` — Pre-match front-row half-squat / hands-on-knees Champions League photo posture

## Rebuilding the Assets

The build pipeline is scripted in `scripts/build-realistic-players.mjs` (using `meshoptimizer` to simplify geometry from ~72k triangles down to ~12.4k triangles while locking facial/UV borders).
