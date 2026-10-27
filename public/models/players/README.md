# Ballors realistic character assets (CC0 starting points)

The runtime loader in src/game/realisticCharacters.ts supports rigged glTF/GLB models. These assets are NOT yet checked into the repository.

## Recommended CC0 sources (verified from publisher listings October 2026)

1. Innerscene / MakeHuman soccer player (textured and clothed, **static/unrigged**, 17.5 MB): https://www.innerscene.com/tools/library/3d-parts/soccer-player-standing-3d-person-team-sports-f55b1b4f
2. Innerscene / MakeHuman male base mesh (163-bone **rigged**, but untextured clay-like body and without football kit, 4.3 MB): https://www.innerscene.com/tools/library/3d-parts/male-base-mesh-3d-person-rigged-a-pose-380e6d89

Both publishers describe these as CC0. Verify the asset's downloaded license and preserve a copy before redistribution.

## Asset preparation in Blender

1. Import the rigged male model and use it as the animation-ready base.
2. Model/fit football shirt, shorts, socks, boots and hair; bind clothing to the same armature. Do not simply combine the static soccer player's mesh with the rig and assume it will animate.
3. Retarget licensed idle, walk, sprint, turn and kick animations to the armature; bake each as a named action.
4. Export glTF 2.0 binary (.glb), with skinning, animation and PBR materials. Face +Z; Y up; feet on ground.
5. Produce optimized models for gameplay (LOD) and higher-detail models for the close-up showcase.

## File names

Save the finished models here:
- outfield-1.glb through outfield-11.glb
- goalkeeper.glb

The loader normalizes models to 1.8 world units and looks for named idle/run/walk clips. Until these files are present, the game deliberately uses its existing procedural footballers. The static soccer model can be previewed in Blender, but **must not** be used as a running gameplay character without rigging.

## Performance and legal notes

Avoid loading twelve copies of a 17.5 MB model without optimization. Compress textures and geometry, use instancing where appropriate, and check memory usage on mobile. CC0 asset licensing does not grant rights to recognizable real-player likenesses or protected club insignia.

No third-party assets have been downloaded, embedded, or redistributed in this repository yet.
