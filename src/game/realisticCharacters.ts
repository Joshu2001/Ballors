import * as THREE from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { clone } from 'three/addons/utils/SkeletonUtils.js'

/** Asset-driven footballers. Missing assets intentionally retain the procedural fallback. */
const loader = new GLTFLoader()
const cache = new Map<string, Promise<{ scene: THREE.Group; animations: THREE.AnimationClip[] }>>()
const failed = new Set<string>()
export type RealisticCharacter = { root: THREE.Group; mixer: THREE.AnimationMixer | null; update: (dt: number, speed: number) => void; dispose: () => void }
export const characterAssetPath = (index: number, keeper = false) =>
  `/models/players/${keeper ? 'goalkeeper' : `outfield-${(index % 11) + 1}`}.glb`

export async function loadRealisticCharacter(path: string, height = 1.8): Promise<RealisticCharacter | null> {
  if (failed.has(path)) return null
  if (!cache.has(path)) cache.set(path, loader.loadAsync(path).then(g => ({ scene: g.scene, animations: g.animations })))
  try {
    const asset = await cache.get(path)!
    const root = clone(asset.scene) as THREE.Group
    root.updateMatrixWorld(true)
    const bounds = new THREE.Box3().setFromObject(root)
    const size = bounds.getSize(new THREE.Vector3())
    if (!Number.isFinite(size.y) || size.y <= 0) throw new Error('Invalid character dimensions')
    root.scale.multiplyScalar(height / size.y)
    root.updateMatrixWorld(true)
    const bottom = new THREE.Box3().setFromObject(root).min.y
    root.position.y -= bottom
    root.traverse(o => {
      if (o instanceof THREE.Mesh) {
        o.castShadow = true
        o.receiveShadow = true
      }
    })
    const mixer = asset.animations.length ? new THREE.AnimationMixer(root) : null
    const clips = asset.animations
    const idle = clips.find(c => /idle|stand|breath/i.test(c.name))
    const run = clips.find(c => /run|jog|walk/i.test(c.name))
    const idleAction = idle && mixer ? mixer.clipAction(idle) : null
    const runAction = run && mixer ? mixer.clipAction(run) : null
    idleAction?.play()
    let active = idleAction
    return {
      root, mixer,
      update(dt, speed) {
        const desired = speed > 0.25 ? runAction : idleAction
        if (desired && desired !== active) {
          active?.fadeOut(0.2)
          desired.reset().fadeIn(0.2).play()
          active = desired
        }
        mixer?.update(Math.min(Math.max(dt, 0), 0.1))
      },
      dispose() {
        mixer?.stopAllAction()
        root.parent?.remove(root)
      },
    }
  } catch (error) {
    failed.add(path)
    console.warn('[Ballors] Character asset unavailable; using procedural fallback:', path, error)
    return null
  }
}
