import * as THREE from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { clone } from 'three/addons/utils/SkeletonUtils.js'
import type { PlayerAction } from './engine'
import type { PlayerAppearance } from './playerModel3d'

/**
 * Asset-driven realistic 3D footballers built from CC0 MakeHuman / Innerscene
 * anatomical human meshes with 24-bone humanoid skeletons, PBR normal/diffuse maps,
 * and 8 embedded skeletal AnimationClips.
 */
const loader = new GLTFLoader()
const cache = new Map<string, Promise<{ scene: THREE.Group; animations: THREE.AnimationClip[] }>>()
const failed = new Set<string>()
const kitTextureCache = new Map<string, THREE.CanvasTexture>()

export interface RealisticCharacterOptions {
  index?: number
  team?: 0 | 1
  number?: number
  name?: string
  keeper?: boolean
  appearance?: PlayerAppearance
  showcaseRow?: 'front' | 'back'
  cameraMode?: 'squad' | 'face' | 'body'
}

export interface RealisticUpdateParams {
  dt: number
  speed: number
  sprinting?: boolean
  action?: PlayerAction
  actionTime?: number
  turnRate?: number
  showcaseRow?: 'front' | 'back'
  cameraMode?: 'squad' | 'face' | 'body'
}

export type RealisticCharacter = {
  root: THREE.Group
  mixer: THREE.AnimationMixer | null
  bones: Map<string, THREE.Bone>
  getHeadWorldPosition: (out?: THREE.Vector3) => THREE.Vector3
  update: (dt: number, speed: number, extra?: Partial<RealisticUpdateParams>) => void
  dispose: () => void
}

export const characterAssetPath = (index: number, keeper = false) =>
  `/models/players/${keeper ? 'goalkeeper' : `outfield-${(Math.abs(index) % 11) + 1}`}.glb`

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v))
}

/**
 * Builds a tailored 512x512 glTF-compatible (flipY=false) kit diffuse texture
 * mapped to the MakeHuman `male_casualsuit04` UV layout:
 * - Jersey occupies V in [0.018..0.380] (top 40% of image)
 *   - Front Chest Center: U = 0.559, V = 0.218
 *   - Left Chest Crest:   U = 0.600, V = 0.160
 *   - Back Center Number: U = 0.178, V = 0.215
 *   - Back Player Name:   U = 0.178, V = 0.125
 * - Shorts occupy V in [0.417..0.654] (middle band of image)
 */
function getCustomKitTexture(opts: RealisticCharacterOptions): THREE.CanvasTexture {
  const team = opts.team ?? 0
  const keeper = opts.keeper ?? false
  const num = opts.number ?? ((opts.index ?? 0) + 1)
  const rawName = (opts.name ?? '').trim()
  const app = opts.appearance

  const key = [
    team,
    keeper ? 1 : 0,
    num,
    rawName,
    app?.customJerseyColor ?? '',
    app?.customJerseyTrimColor ?? '',
    app?.customShortsColor ?? '',
  ].join('|')

  const cached = kitTextureCache.get(key)
  if (cached) return cached

  let jerseyHex = '#7ec3e6'
  let shortsHex = '#102536'
  let trimHex = '#dfff57'
  let textHex = '#102536'

  if (keeper) {
    if (team === 0) {
      jerseyHex = '#23b567'
      shortsHex = '#123824'
      trimHex = '#dfff57'
      textHex = '#ffffff'
    } else {
      jerseyHex = '#e67e22'
      shortsHex = '#2c1808'
      trimHex = '#ffeaa7'
      textHex = '#ffffff'
    }
  } else if (team === 1) {
    jerseyHex = '#193b42'
    shortsHex = '#dfeae2'
    trimHex = '#ff6b6b'
    textHex = '#f5f8f2'
  } else if (app?.customJerseyColor) {
    jerseyHex = app.customJerseyColor
    shortsHex = app.customShortsColor || '#14284b'
    trimHex = app.customJerseyTrimColor || '#f5c518'
    const c = new THREE.Color(jerseyHex)
    const lum = 0.299 * c.r + 0.587 * c.g + 0.114 * c.b
    textHex = lum > 0.58 ? '#102536' : '#f8faf4'
  }

  const canvas = document.createElement('canvas')
  canvas.width = 512
  canvas.height = 512
  const ctx = canvas.getContext('2d')!

  // 1. Jersey zone (y = 0..204)
  const jGrad = ctx.createLinearGradient(0, 0, 0, 204)
  const jBase = new THREE.Color(jerseyHex)
  const jDark = jBase.clone().multiplyScalar(0.82)
  const jLight = jBase.clone().lerp(new THREE.Color('#ffffff'), 0.12)
  jGrad.addColorStop(0, `#${jLight.getHexString()}`)
  jGrad.addColorStop(0.55, `#${jBase.getHexString()}`)
  jGrad.addColorStop(1, `#${jDark.getHexString()}`)
  ctx.fillStyle = jGrad
  ctx.fillRect(0, 0, 512, 204)

  // Subtle breathable micro-mesh fabric weave on jersey
  ctx.fillStyle = 'rgba(255,255,255,0.04)'
  for (let y = 4; y < 200; y += 6) {
    ctx.fillRect(0, y, 512, 2)
  }

  // Collar & sleeve cuff trim accents
  ctx.fillStyle = trimHex
  ctx.fillRect(0, 0, 512, 9)
  ctx.fillRect(0, 194, 512, 8)

  // 2. Shorts zone (y = 204..360)
  const sBase = new THREE.Color(shortsHex)
  const sDark = sBase.clone().multiplyScalar(0.78)
  const sGrad = ctx.createLinearGradient(0, 204, 0, 360)
  sGrad.addColorStop(0, `#${sBase.getHexString()}`)
  sGrad.addColorStop(1, `#${sDark.getHexString()}`)
  ctx.fillStyle = sGrad
  ctx.fillRect(0, 204, 512, 160)

  // Shorts hem trim stripe
  ctx.fillStyle = trimHex
  ctx.fillRect(0, 326, 512, 8)

  // Lower background fill
  ctx.fillStyle = `#${sDark.getHexString()}`
  ctx.fillRect(0, 360, 512, 152)

  // 3. Club Crest Shield on Left Chest (U = 0.600 -> x = 307, V = 0.160 -> y = 82)
  ctx.save()
  ctx.translate(307, 80)
  ctx.fillStyle = trimHex
  ctx.beginPath()
  ctx.arc(0, 0, 10, 0, Math.PI * 2)
  ctx.fill()
  ctx.lineWidth = 2.2
  ctx.strokeStyle = textHex
  ctx.stroke()
  ctx.restore()

  // 4. Front Chest Squad Number (U = 0.559 -> x = 286, V = 0.225 -> y = 115)
  ctx.save()
  ctx.font = '900 32px system-ui, -apple-system, sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.lineWidth = 3.5
  ctx.strokeStyle = textHex === '#ffffff' || textHex === '#f8faf4' ? 'rgba(10,22,30,0.65)' : 'rgba(255,255,255,0.65)'
  ctx.strokeText(String(num), 286, 118)
  ctx.fillStyle = textHex
  ctx.fillText(String(num), 286, 118)
  ctx.restore()

  // 5. Back Jersey Number (U = 0.178 -> x = 91, V = 0.215 -> y = 110)
  ctx.save()
  ctx.font = '900 54px system-ui, -apple-system, sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.lineWidth = 4.5
  ctx.strokeStyle = textHex === '#ffffff' || textHex === '#f8faf4' ? 'rgba(10,22,30,0.72)' : 'rgba(255,255,255,0.72)'
  ctx.strokeText(String(num), 91, 114)
  ctx.fillStyle = textHex
  ctx.fillText(String(num), 91, 114)

  // Surname above back number
  if (rawName) {
    const surname = rawName.split(/\s+/).pop()!.toUpperCase().slice(0, 12)
    ctx.font = '800 15px system-ui, -apple-system, sans-serif'
    ctx.fillStyle = textHex
    ctx.fillText(surname, 91, 70)
  }
  ctx.restore()

  // 6. Shorts Squad Number on Left Thigh (U = 0.58 -> x = 297, V = 0.56 -> y = 286)
  ctx.save()
  ctx.font = '800 20px system-ui, -apple-system, sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillStyle = trimHex
  ctx.fillText(String(num), 297, 292)
  ctx.restore()

  const tex = new THREE.CanvasTexture(canvas)
  tex.flipY = false
  tex.colorSpace = THREE.SRGBColorSpace
  tex.needsUpdate = true
  kitTextureCache.set(key, tex)
  return tex
}

/**
 * Applies per-instance material cloning and customization (team kits, squad numbers,
 * custom scanned kits, boot color, hair/skin/eye tints) so cloned SkinnedMeshes never
 * bleed colors across teams or players.
 */
function customizeCharacterMaterials(root: THREE.Group, opts: RealisticCharacterOptions): THREE.Texture[] {
  const ownedTextures: THREE.Texture[] = []
  const app = opts.appearance
  const kitTex = getCustomKitTexture(opts)

  root.traverse(node => {
    if (!(node instanceof THREE.Mesh)) return
    node.castShadow = true
    node.receiveShadow = true
    node.frustumCulled = false

    const origMat = node.material
    if (!(origMat instanceof THREE.MeshStandardMaterial)) return
    const mat = origMat.clone()
    node.material = mat

    if (mat.name === 'Kit_Jersey' || mat.name === 'Kit_Shorts') {
      mat.map = kitTex
      mat.roughness = 0.72
      mat.metalness = 0.02
      mat.needsUpdate = true
    } else if (mat.name === 'Kit_Socks') {
      if (opts.keeper) {
        mat.color.set(opts.team === 0 ? '#1c9e59' : '#d35400')
      } else if (opts.team === 1) {
        mat.color.set('#193b42')
      } else if (app?.customSocksColor) {
        mat.color.set(app.customSocksColor)
      } else {
        mat.color.set('#f2f6f0')
      }
      mat.roughness = 0.82
    } else if (mat.name === 'Footwear_Cleats') {
      if (app?.bootColor) {
        // Blend custom boot color with the detailed leather/studs texture
        const bootTint = new THREE.Color(app.bootColor).lerp(new THREE.Color('#ffffff'), 0.25)
        mat.color.copy(bootTint)
      }
      mat.roughness = 0.36
      mat.metalness = 0.14
    } else if (mat.name === 'Body_Skin') {
      mat.roughness = 0.52
      mat.metalness = 0.01
      if (app?.skinTone) {
        // Subtle tint toward user-selected skin tone while preserving photorealistic pore/complexion texture
        const targetSkin = new THREE.Color(app.skinTone)
        const neutral = new THREE.Color('#d8a988')
        const tint = new THREE.Color(
          clamp(targetSkin.r / Math.max(0.2, neutral.r), 0.65, 1.25),
          clamp(targetSkin.g / Math.max(0.2, neutral.g), 0.65, 1.25),
          clamp(targetSkin.b / Math.max(0.2, neutral.b), 0.65, 1.25)
        ).lerp(new THREE.Color('#ffffff'), 0.55)
        mat.color.copy(tint)
      }
    } else if (mat.name === 'Head_Hair') {
      mat.roughness = 0.84
      mat.metalness = 0.02
      mat.alphaTest = 0.16
      if (app?.hairColor) {
        // Natural strand melanin tinting that preserves deep roots, strand shadows, and hair texture
        const baseColor = new THREE.Color(app.hairColor)
        const isLight = baseColor.r > 0.58 || baseColor.g > 0.48
        const naturalTint = isLight
          ? baseColor.clone().multiplyScalar(0.72).lerp(new THREE.Color('#7a4f1a'), 0.32)
          : baseColor.clone().lerp(new THREE.Color('#ffffff'), 0.12)
        mat.color.copy(naturalTint)
      }
    } else if (mat.name === 'Head_Eyes') {
      mat.roughness = 0.12
      mat.metalness = 0.04
    } else if (mat.name === 'Head_Brows' || mat.name === 'Head_Lashes' || mat.name === 'Head_BrowsLashes') {
      mat.alphaTest = 0.16
      mat.roughness = 0.75
    }
  })

  return ownedTextures
}

export async function loadRealisticCharacter(
  path: string,
  height = 1.92,
  options: RealisticCharacterOptions = {}
): Promise<RealisticCharacter | null> {
  if (failed.has(path)) return null
  if (!cache.has(path)) {
    cache.set(
      path,
      loader.loadAsync(path).then(g => {
        // Ensure all embedded glTF textures use correct color spaces
        g.scene.traverse(obj => {
          if (obj instanceof THREE.Mesh && obj.material instanceof THREE.MeshStandardMaterial) {
            if (obj.material.map) obj.material.map.colorSpace = THREE.SRGBColorSpace
          }
        })
        return { scene: g.scene, animations: g.animations }
      })
    )
  }

  try {
    const asset = await cache.get(path)!
    const root = clone(asset.scene) as THREE.Group

    // Compute bind-pose bounds in O(1) from geometry.boundingBox (avoids 30k-vertex CPU skinning in Box3.setFromObject)
    let minY = Infinity
    let maxY = -Infinity
    root.traverse(obj => {
      if (obj instanceof THREE.Mesh && obj.geometry) {
        if (!obj.geometry.boundingBox) obj.geometry.computeBoundingBox()
        const bb = obj.geometry.boundingBox
        if (bb) {
          if (bb.min.y < minY) minY = bb.min.y
          if (bb.max.y > maxY) maxY = bb.max.y
        }
      }
    })
    if (!Number.isFinite(minY) || !Number.isFinite(maxY) || maxY <= minY) {
      minY = 0
      maxY = 1.84
    }
    const rawHeight = maxY - minY
    const scaleFactor = height / rawHeight
    root.scale.setScalar(scaleFactor)
    root.position.y = -minY * scaleFactor
    root.updateMatrixWorld(true)

    const ownedTextures = customizeCharacterMaterials(root, options)

    // Index all 24 humanoid bones for fast lookup (Head tracking, procedural lean, etc.)
    const bones = new Map<string, THREE.Bone>()
    root.traverse(obj => {
      if (obj instanceof THREE.Bone) {
        bones.set(obj.name, obj)
      }
    })

    const mixer = asset.animations.length ? new THREE.AnimationMixer(root) : null
    const actions = new Map<string, THREE.AnimationAction>()
    if (mixer) {
      for (const clip of asset.animations) {
        const act = mixer.clipAction(clip)
        actions.set(clip.name.toLowerCase(), act)
      }
    }

    const pickAction = (...names: string[]): THREE.AnimationAction | null => {
      for (const n of names) {
        const found = actions.get(n.toLowerCase())
        if (found) return found
      }
      return null
    }

    const idleAction = pickAction('idle', 'squadstand')
    const walkAction = pickAction('walk', 'jog')
    const jogAction = pickAction('jog', 'walk')
    const sprintAction = pickAction('sprint', 'jog')
    const turnAction = pickAction('turn', 'jog')
    const kickAction = pickAction('kick', 'sprint')
    const standAction = pickAction('squadstand', 'idle')
    const crouchAction = pickAction('squadcrouch', 'idle')

    const selectShowcaseAction = (row?: 'front' | 'back', camMode?: 'squad' | 'face' | 'body') => {
      if (camMode === 'face' || camMode === 'body') return idleAction ?? standAction
      if (row === 'front') return crouchAction ?? idleAction
      return standAction ?? idleAction
    }

    let active: THREE.AnimationAction | null = options.showcaseRow
      ? selectShowcaseAction(options.showcaseRow, options.cameraMode)
      : idleAction

    if (active && mixer) {
      active.reset().play()
      // Desynchronize breathing/posture phase across squad members and advance mixer immediately
      const phaseOffset = ((options.index ?? 0) * 0.53) % 2.4
      mixer.update(phaseOffset)
      root.updateMatrixWorld(true)
    }

    const headBone = bones.get('Head') ?? bones.get('Neck')
    const fallbackHeadVec = new THREE.Vector3()

    return {
      root,
      mixer,
      bones,
      getHeadWorldPosition(out = fallbackHeadVec) {
        root.updateMatrixWorld(true)
        if (headBone) {
          headBone.getWorldPosition(out)
          // Offset slightly up from base of head bone to the bridge of the nose / eyes
          out.y += 0.055 * root.scale.y
          return out
        }
        root.getWorldPosition(out)
        out.y += height * 0.88
        return out
      },
      update(dt, speed, extra) {
        if (!mixer) return
        const safeDt = Math.min(Math.max(dt, 0), 0.1)

        let desired: THREE.AnimationAction | null = active
        let timeScale = 1.0
        let fadeDuration = 0.18

        const row = extra?.showcaseRow ?? options.showcaseRow
        const camMode = extra?.cameraMode ?? options.cameraMode

        if (row && speed <= 0.05 && (!extra?.action || extra.action === 'idle')) {
          desired = selectShowcaseAction(row, camMode)
          timeScale = camMode === 'face' ? 0.45 : 0.85
          fadeDuration = 0.22
        } else if (extra?.action === 'kick' || (extra?.actionTime && extra.actionTime > 0 && extra.action !== 'idle')) {
          desired = kickAction ?? sprintAction ?? jogAction
          timeScale = 1.35
          fadeDuration = 0.08
        } else if (extra?.turnRate && Math.abs(extra.turnRate) > 3.2 && speed > 10) {
          desired = turnAction ?? jogAction
          timeScale = 1.15
          fadeDuration = 0.12
        } else if (extra?.sprinting || speed > 130) {
          desired = sprintAction ?? jogAction
          timeScale = clamp(speed / 155, 0.88, 1.42)
          fadeDuration = 0.15
        } else if (speed > 38) {
          desired = jogAction ?? walkAction
          timeScale = clamp(speed / 92, 0.82, 1.35)
          fadeDuration = 0.16
        } else if (speed > 2.5) {
          desired = walkAction ?? jogAction
          timeScale = clamp(speed / 28, 0.78, 1.32)
          fadeDuration = 0.18
        } else {
          desired = idleAction
          timeScale = 1.0
          fadeDuration = 0.22
        }

        if (desired && desired !== active) {
          active?.fadeOut(fadeDuration)
          desired.reset().fadeIn(fadeDuration).play()
          active = desired
        }
        if (active) {
          active.timeScale = timeScale
        }

        mixer.update(safeDt)
      },
      dispose() {
        mixer?.stopAllAction()
        for (const t of ownedTextures) t.dispose()
        root.traverse(node => {
          if (node instanceof THREE.Mesh && node.material instanceof THREE.Material) {
            node.material.dispose()
          }
        })
        root.parent?.remove(root)
      },
    }
  } catch (error) {
    failed.add(path)
    console.warn('[Ballors] Character asset unavailable; using procedural fallback:', path, error)
    return null
  }
}
