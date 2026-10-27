import * as THREE from 'three'
import type { DribbleType, PlayerAction } from './engine'

export type HairStyleId = 'short-crop' | 'fade-curls' | 'textured-quiff' | 'top-knot' | 'buzz' | 'dreads'
export type BeardStyleId = 'none' | 'stubble' | 'boxed-beard' | 'goatee'
export type CustomDecalTarget = 'chest' | 'face' | 'both'
export type CustomDecalShape = 'shield' | 'circle' | 'cutout' | 'full'
export type FaceMapMode = 'sculpted' | 'photo-blend'

export interface PhotoCropConfig {
  /** Normalized center X (0..1) of the face/head region in the uploaded photo */
  faceCenterX: number
  /** Normalized center Y (0..1) of the face/head region in the uploaded photo */
  faceCenterY: number
  /** Normalized radius (0.04..0.5) of the face/head region in the uploaded photo */
  faceRadius: number
  /** Whether the photo was detected/configured as a full-body kit photo */
  isFullBody: boolean
}

export interface PlayerAppearance {
  skinTone: string
  hairStyle: HairStyleId
  hairColor: string
  eyeColor: string
  beardStyle: BeardStyleId
  noseSize: number // 80..130 (%)
  browTilt: number // -15..15 (deg)
  jawWidth: number // 85..120 (%)
  bootColor: string
  // 3D Kit & Full-Body Reconstruction fields extracted from full-body footballer photos
  customJerseyColor?: string
  customJerseyTrimColor?: string
  customShortsColor?: string
  customSocksColor?: string
  customTorsoDataUrl?: string
  // Cropped & aligned Face-Only texture + rendering mode (NEVER stamps the torso onto the face!)
  faceCropDataUrl?: string
  faceMapMode?: FaceMapMode
  photoCrop?: PhotoCropConfig
  // Custom Uploaded Photo -> 3D Asset & Decal fields
  customDecalDataUrl?: string
  customDecalTarget?: CustomDecalTarget
  customDecalShape?: CustomDecalShape
  customDecalDepth?: number // 20..150 (%) 3D normal/relief depth
}

export const SKIN_TONES = [
  { id: '#f2c8ab', name: 'Porcelain Warm' },
  { id: '#e3b089', name: 'Mediterranean Olive' },
  { id: '#cc9168', name: 'Golden Tan' },
  { id: '#b4744c', name: 'Warm Bronze' },
  { id: '#895335', name: 'Rich Mahogany' },
  { id: '#543220', name: 'Deep Espresso' },
]

export const HAIR_COLORS = [
  { id: '#141210', name: 'Jet Black' },
  { id: '#291d15', name: 'Dark Espresso' },
  { id: '#4e3422', name: 'Chestnut Brown' },
  { id: '#8a6036', name: 'Warm Honey' },
  { id: '#d4af5a', name: 'Sunlit Blonde' },
  { id: '#dcded8', name: 'Platinum Frost' },
]

export const EYE_COLORS = [
  { id: '#261810', name: 'Deep Brown' },
  { id: '#543924', name: 'Amber Hazel' },
  { id: '#2d5c45', name: 'Emerald Green' },
  { id: '#2b5b84', name: 'Sapphire Blue' },
  { id: '#4c5966', name: 'Storm Grey' },
]

export const BOOT_COLORS = [
  { id: '#dfff57', name: 'Volt Lime' },
  { id: '#ff4d6d', name: 'Berry Pink' },
  { id: '#38bdf8', name: 'Electric Cyan' },
  { id: '#f5f7f2', name: 'Pearl White' },
  { id: '#f59e0b', name: 'Solar Gold' },
  { id: '#182024', name: 'Stealth Carbon' },
]

export const HAIR_STYLES: { id: HairStyleId; name: string }[] = [
  { id: 'short-crop', name: 'Textured Crop' },
  { id: 'fade-curls', name: 'Wavy Taper Curls' },
  { id: 'textured-quiff', name: 'Feathered Flow' },
  { id: 'top-knot', name: 'Band & Waves' },
  { id: 'buzz', name: 'Skin-Fade Buzz' },
  { id: 'dreads', name: 'Braided Locks' },
]

export const BEARD_STYLES: { id: BeardStyleId; name: string }[] = [
  { id: 'none', name: 'Clean Shaven' },
  { id: 'stubble', name: 'Matchday Stubble' },
  { id: 'boxed-beard', name: 'Full Tapered Beard' },
  { id: 'goatee', name: 'Sculpted Goatee' },
]

const PRESET_SQUAD_APPEARANCES: PlayerAppearance[] = [
  { skinTone: '#e3b089', hairStyle: 'textured-quiff', hairColor: '#291d15', eyeColor: '#543924', beardStyle: 'stubble', noseSize: 102, browTilt: 2, jawWidth: 102, bootColor: '#dfff57' },
  { skinTone: '#b4744c', hairStyle: 'dreads', hairColor: '#141210', eyeColor: '#261810', beardStyle: 'goatee', noseSize: 105, browTilt: 4, jawWidth: 104, bootColor: '#f5f7f2' },
  { skinTone: '#e3b089', hairStyle: 'short-crop', hairColor: '#291d15', eyeColor: '#261810', beardStyle: 'boxed-beard', noseSize: 100, browTilt: 3, jawWidth: 106, bootColor: '#ff4d6d' },
  { skinTone: '#f2c8ab', hairStyle: 'textured-quiff', hairColor: '#8a6036', eyeColor: '#2b5b84', beardStyle: 'none', noseSize: 96, browTilt: 0, jawWidth: 100, bootColor: '#f5f7f2' },
  { skinTone: '#895335', hairStyle: 'fade-curls', hairColor: '#141210', eyeColor: '#261810', beardStyle: 'none', noseSize: 106, browTilt: 2, jawWidth: 98, bootColor: '#ff4d6d' },
  { skinTone: '#cc9168', hairStyle: 'buzz', hairColor: '#141210', eyeColor: '#543924', beardStyle: 'stubble', noseSize: 102, browTilt: 5, jawWidth: 104, bootColor: '#38bdf8' },
  { skinTone: '#e3b089', hairStyle: 'short-crop', hairColor: '#141210', eyeColor: '#261810', beardStyle: 'stubble', noseSize: 98, browTilt: -2, jawWidth: 96, bootColor: '#ff4d6d' },
  { skinTone: '#f2c8ab', hairStyle: 'textured-quiff', hairColor: '#d4af5a', eyeColor: '#2b5b84', beardStyle: 'none', noseSize: 96, browTilt: 2, jawWidth: 98, bootColor: '#38bdf8' },
  { skinTone: '#895335', hairStyle: 'fade-curls', hairColor: '#d4af5a', eyeColor: '#261810', beardStyle: 'none', noseSize: 104, browTilt: 3, jawWidth: 96, bootColor: '#38bdf8' },
  { skinTone: '#cc9168', hairStyle: 'dreads', hairColor: '#141210', eyeColor: '#261810', beardStyle: 'goatee', noseSize: 102, browTilt: 6, jawWidth: 102, bootColor: '#f5f7f2' },
  { skinTone: '#543220', hairStyle: 'top-knot', hairColor: '#141210', eyeColor: '#261810', beardStyle: 'stubble', noseSize: 108, browTilt: 4, jawWidth: 104, bootColor: '#f59e0b' },
]

export function defaultAppearanceForIndex(index: number): PlayerAppearance {
  const preset = PRESET_SQUAD_APPEARANCES[index % PRESET_SQUAD_APPEARANCES.length]
  return { ...preset }
}

export type LimbRig = {
  upper: THREE.Group
  lower: THREE.Group
  footOrHand?: THREE.Object3D
}

export interface RigKinematicState {
  prevVx: number
  prevVy: number
  prevYaw: number
  smoothedSpeed: number
  smoothedAccelFwd: number
  smoothedAccelLat: number
  smoothedTurnRate: number
  strideCycle: number
  initialized: boolean
}

export type PlayerRig3D = {
  group: THREE.Group
  body: THREE.Group
  pelvis: THREE.Group
  torso: THREE.Group
  neck: THREE.Group
  head: THREE.Group
  leftLeg: LimbRig
  rightLeg: LimbRig
  leftArm: LimbRig
  rightArm: LimbRig
  ring: THREE.Mesh
  shadowDisc: THREE.Mesh
  label?: THREE.Sprite
  phase: number
  scale: number
  appearanceKey: string
  prevX?: number
  prevZ?: number
  kinematics?: RigKinematicState
}

export interface BuildPlayerOptions {
  id: number
  team: 0 | 1
  name: string
  number: number
  keeper: boolean
  radius: number
  appearance?: PlayerAppearance
  includeLabel?: boolean
  includeRing?: boolean
}

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v))

const stdMat = (color: string | number, roughness = 0.62, metalness = 0.03) =>
  new THREE.MeshStandardMaterial({ color, roughness, metalness })

const skinShaderMat = (color: string | number, map?: THREE.Texture) =>
  new THREE.MeshStandardMaterial({
    color,
    map: map ?? null,
    roughness: 0.54,
    metalness: 0.02,
  })

const addMesh = (
  geometry: THREE.BufferGeometry,
  material: THREE.Material,
  parent: THREE.Object3D,
  x = 0,
  y = 0,
  z = 0,
  shadow = true
) => {
  const m = new THREE.Mesh(geometry, material)
  m.position.set(x, y, z)
  m.castShadow = shadow
  m.receiveShadow = shadow
  parent.add(m)
  return m
}

const faceTextureCache = new Map<string, THREE.CanvasTexture>()
const kitTextureCache = new Map<string, THREE.CanvasTexture>()
const shortsTextureCache = new Map<string, THREE.CanvasTexture>()
const thighSkinTexCache = new Map<string, THREE.CanvasTexture>()
const loadedImageCache = new Map<string, HTMLImageElement>()
const decal3DCache = new Map<string, { colorTex: THREE.CanvasTexture; normalTex: THREE.CanvasTexture }>()

function adjustColorHex(hex: string, factor: number): string {
  const c = new THREE.Color(hex)
  c.multiplyScalar(factor)
  return `#${c.getHexString()}`
}

/**
 * Converts an uploaded 2D image into a 3D Relief Asset (masked Color Texture + Sobel 3D Normal Map Texture)
 * so any uploaded photo or emblem becomes a physical 3D normal-mapped asset on the player's kit or face!
 */
function build3DDecalAssetFromImage(
  img: HTMLImageElement,
  shape: CustomDecalShape,
  depthPercent: number
): { colorTex: THREE.CanvasTexture; normalTex: THREE.CanvasTexture } {
  const size = 256
  const colorCanvas = document.createElement('canvas')
  colorCanvas.width = size
  colorCanvas.height = size
  const cctx = colorCanvas.getContext('2d')!
  cctx.clearRect(0, 0, size, size)

  cctx.save()
  if (shape === 'circle') {
    cctx.beginPath()
    cctx.arc(size / 2, size / 2, size * 0.44, 0, Math.PI * 2)
    cctx.closePath()
    cctx.clip()
  } else if (shape === 'shield') {
    cctx.beginPath()
    cctx.moveTo(size * 0.5, size * 0.06)
    cctx.lineTo(size * 0.88, size * 0.18)
    cctx.quadraticCurveTo(size * 0.88, size * 0.68, size * 0.5, size * 0.94)
    cctx.quadraticCurveTo(size * 0.12, size * 0.68, size * 0.12, size * 0.18)
    cctx.closePath()
    cctx.clip()
  }

  // Center-crop image into square
  const aspect = img.width / Math.max(1, img.height)
  let sx = 0
  let sy = 0
  let sw = img.width
  let sh = img.height
  if (aspect > 1) {
    sw = img.height
    sx = (img.width - sw) / 2
  } else {
    sh = img.width
    sy = (img.height - sh) / 2
  }
  cctx.drawImage(img, sx, sy, sw, sh, 12, 12, size - 24, size - 24)
  cctx.restore()

  const imgData = cctx.getImageData(0, 0, size, size)
  const data = imgData.data

  // Smart background removal when shape === 'cutout': sample corner color and feather matching background pixels
  if (shape === 'cutout') {
    const bgR = data[12 * (size * 4) + 12 * 4]
    const bgG = data[12 * (size * 4) + 12 * 4 + 1]
    const bgB = data[12 * (size * 4) + 12 * 4 + 2]
    for (let i = 0; i < data.length; i += 4) {
      if (data[i + 3] === 0) continue
      const dist = Math.hypot(data[i] - bgR, data[i + 1] - bgG, data[i + 2] - bgB)
      if (dist < 36) {
        data[i + 3] = 0
      } else if (dist < 64) {
        data[i + 3] = Math.round(((dist - 36) / 28) * 255)
      }
    }
    cctx.putImageData(imgData, 0, 0)
  }

  // Add metallic/embroidered 3D border frame for shield or circle badges
  if (shape === 'shield' || shape === 'circle') {
    cctx.strokeStyle = '#f59e0b'
    cctx.lineWidth = 6
    if (shape === 'circle') {
      cctx.beginPath()
      cctx.arc(size / 2, size / 2, size * 0.44, 0, Math.PI * 2)
      cctx.stroke()
    } else {
      cctx.beginPath()
      cctx.moveTo(size * 0.5, size * 0.06)
      cctx.lineTo(size * 0.88, size * 0.18)
      cctx.quadraticCurveTo(size * 0.88, size * 0.68, size * 0.5, size * 0.94)
      cctx.quadraticCurveTo(size * 0.12, size * 0.68, size * 0.12, size * 0.18)
      cctx.closePath()
      cctx.stroke()
    }
  }

  // Compute Sobel 3D Normal Map from luminance & alpha heightfield
  const finalData = cctx.getImageData(0, 0, size, size).data
  const normalCanvas = document.createElement('canvas')
  normalCanvas.width = size
  normalCanvas.height = size
  const nctx = normalCanvas.getContext('2d')!
  const nImgData = nctx.createImageData(size, size)
  const nData = nImgData.data

  const strength = clamp(depthPercent / 100, 0.2, 1.8) * 3.2
  const lumAt = (x: number, y: number) => {
    const cx = clamp(x, 0, size - 1)
    const cy = clamp(y, 0, size - 1)
    const idx = (cy * size + cx) * 4
    const alpha = finalData[idx + 3] / 255
    const l = (finalData[idx] * 0.299 + finalData[idx + 1] * 0.587 + finalData[idx + 2] * 0.114) / 255
    return l * alpha
  }

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const tl = lumAt(x - 1, y - 1)
      const t = lumAt(x, y - 1)
      const tr = lumAt(x + 1, y - 1)
      const l = lumAt(x - 1, y)
      const r = lumAt(x + 1, y)
      const bl = lumAt(x - 1, y + 1)
      const b = lumAt(x, y + 1)
      const br = lumAt(x + 1, y + 1)

      const dX = tr + 2 * r + br - (tl + 2 * l + bl)
      const dY = bl + 2 * b + br - (tl + 2 * t + tr)

      let nx = -dX * strength
      let ny = dY * strength
      let nz = 1.0
      const invLen = 1 / Math.hypot(nx, ny, nz)
      nx *= invLen
      ny *= invLen
      nz *= invLen

      const idx = (y * size + x) * 4
      nData[idx] = Math.round((nx * 0.5 + 0.5) * 255)
      nData[idx + 1] = Math.round((ny * 0.5 + 0.5) * 255)
      nData[idx + 2] = Math.round((nz * 0.5 + 0.5) * 255)
      nData[idx + 3] = 255
    }
  }
  nctx.putImageData(nImgData, 0, 0)

  const colorTex = new THREE.CanvasTexture(colorCanvas)
  colorTex.colorSpace = THREE.SRGBColorSpace
  const normalTex = new THREE.CanvasTexture(normalCanvas)

  return { colorTex, normalTex }
}

/**
 * Generates a 512x512 procedural or photo-reconstructed football jersey texture with authentic club stripes
 * or custom extracted kit colors + torso texture from a full-body player scan.
 */
function getKitJerseyTexture(
  team: 0 | 1,
  keeper: boolean,
  customJerseyColor?: string,
  customTrimColor?: string,
  customTorsoImg?: HTMLImageElement
): THREE.CanvasTexture {
  const hasTorsoImg = Boolean(customTorsoImg && customTorsoImg.complete && customTorsoImg.naturalWidth > 0)
  const key = `${team}|${keeper ? 1 : 0}|${customJerseyColor ?? ''}|${customTrimColor ?? ''}|${hasTorsoImg ? customTorsoImg!.src.slice(-28) : ''}`
  const cached = kitTextureCache.get(key)
  if (cached) return cached

  const c = document.createElement('canvas')
  c.width = 512
  c.height = 512
  const ctx = c.getContext('2d')!

  if (customJerseyColor) {
    // Reconstructed 3D Kit from uploaded full-body player photo (e.g. Lamine Yamal Spain Red #d91c24 + Gold trim)
    const baseCol = new THREE.Color(customJerseyColor)
    const darkStripe = baseCol.clone().multiplyScalar(0.86)
    const trimHex = customTrimColor || '#f59e0b'

    ctx.fillStyle = `#${baseCol.getHexString()}`
    ctx.fillRect(0, 0, 512, 512)

    // Subtle athletic jacquard weave stripes
    const stripes = 16
    const sw = 512 / stripes
    for (let i = 0; i < stripes; i++) {
      if (i % 2 === 1) {
        ctx.fillStyle = `rgba(${Math.round(darkStripe.r * 255)}, ${Math.round(darkStripe.g * 255)}, ${Math.round(darkStripe.b * 255)}, 0.25)`
        ctx.fillRect(i * sw, 0, sw, 512)
      }
    }

    // Side athletic panels in trim color (like Spain's yellow side waves)
    ctx.fillStyle = trimHex
    ctx.globalAlpha = 0.75
    ctx.fillRect(0, 180, 18, 332)
    ctx.fillRect(494, 180, 18, 332)
    ctx.globalAlpha = 1.0

    // If a cropped torso texture was extracted from the full-body photo, blend its front chest details onto the front UV!
    if (hasTorsoImg && customTorsoImg) {
      ctx.save()
      ctx.beginPath()
      ctx.roundRect(118, 36, 276, 440, 36)
      ctx.clip()
      ctx.globalAlpha = 0.88
      ctx.drawImage(customTorsoImg, 118, 36, 276, 440)
      ctx.restore()
    }
  } else if (keeper) {
    const base = team === 0 ? '#1db954' : '#7c3aed'
    const dark = team === 0 ? '#14843b' : '#5b21b6'
    ctx.fillStyle = base
    ctx.fillRect(0, 0, 512, 512)

    ctx.strokeStyle = dark
    ctx.lineWidth = 12
    for (let y = 48; y < 460; y += 46) {
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(256, y + 26)
      ctx.lineTo(512, y)
      ctx.stroke()
    }
  } else if (team === 0) {
    ctx.fillStyle = '#6dbbe0'
    ctx.fillRect(0, 0, 512, 512)

    const stripes = 14
    const sw = 512 / stripes
    for (let i = 0; i < stripes; i++) {
      if (i % 2 === 1) {
        ctx.fillStyle = 'rgba(16, 52, 78, 0.16)'
        ctx.fillRect(i * sw, 0, sw, 512)
        ctx.fillStyle = 'rgba(245, 158, 11, 0.35)'
        ctx.fillRect(i * sw, 0, 2, 512)
      }
    }
  } else {
    ctx.fillStyle = '#15383b'
    ctx.fillRect(0, 0, 512, 512)
    const stripes = 14
    const sw = 512 / stripes
    for (let i = 0; i < stripes; i++) {
      if (i % 2 === 1) {
        ctx.fillStyle = 'rgba(9, 24, 26, 0.5)'
        ctx.fillRect(i * sw, 0, sw, 512)
        ctx.fillStyle = 'rgba(223, 255, 87, 0.22)'
        ctx.fillRect(i * sw, 0, 2, 512)
      }
    }
  }

  // Smooth pectoral & waist drape shading
  const pecGrad = ctx.createLinearGradient(0, 0, 0, 512)
  pecGrad.addColorStop(0, 'rgba(15, 23, 42, 0.25)') // collar rim
  pecGrad.addColorStop(0.06, 'rgba(255,255,255,0.12)')
  pecGrad.addColorStop(0.36, 'rgba(255,255,255,0.04)')
  pecGrad.addColorStop(0.44, 'rgba(0,0,0,0.09)')
  pecGrad.addColorStop(0.92, 'rgba(0,0,0,0.05)')
  pecGrad.addColorStop(1, 'rgba(0,0,0,0.28)')
  ctx.fillStyle = pecGrad
  ctx.fillRect(0, 0, 512, 512)

  // Tailored V-neck collar trim baked into top of jersey
  ctx.strokeStyle = customTrimColor || (team === 0 ? '#f59e0b' : '#dfff57')
  ctx.lineWidth = 14
  ctx.beginPath()
  ctx.moveTo(0, 8)
  ctx.lineTo(256, 34)
  ctx.lineTo(512, 8)
  ctx.stroke()

  const tex = new THREE.CanvasTexture(c)
  tex.colorSpace = THREE.SRGBColorSpace
  kitTextureCache.set(key, tex)
  return tex
}

/**
 * Generates a tailored shorts texture with baked side stripes and hem trim so side stripes
 * hug the tapered shorts fabric instead of sticking out as detached boxes!
 */
function getShortsTexture(shortsColor: string, trimColor: string): THREE.CanvasTexture {
  const key = `${shortsColor}|${trimColor}`
  const cached = shortsTextureCache.get(key)
  if (cached) return cached

  const c = document.createElement('canvas')
  c.width = 256
  c.height = 256
  const ctx = c.getContext('2d')!

  ctx.fillStyle = shortsColor
  ctx.fillRect(0, 0, 256, 256)

  // Fabric fold shading
  const grad = ctx.createLinearGradient(0, 0, 0, 256)
  grad.addColorStop(0, 'rgba(0,0,0,0.25)')
  grad.addColorStop(0.5, 'rgba(255,255,255,0.05)')
  grad.addColorStop(0.88, 'rgba(0,0,0,0.12)')
  grad.addColorStop(1, trimColor)
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, 256, 256)

  // Crisp bottom hem trim band
  ctx.fillStyle = trimColor
  ctx.fillRect(0, 236, 256, 20)

  // Side vertical athletic stripes baked directly onto the cylinder UV
  ctx.fillStyle = trimColor
  ctx.fillRect(58, 0, 14, 240)
  ctx.fillRect(184, 0, 14, 240)

  const tex = new THREE.CanvasTexture(c)
  tex.colorSpace = THREE.SRGBColorSpace
  shortsTextureCache.set(key, tex)
  return tex
}

/**
 * Generates a natural, subtle thigh & kneecap (patella) shading texture map
 * so the knee looks like human skin & tendon rather than a wooden ball-joint.
 */
function getThighKneeSkinTexture(skinHex: string): THREE.CanvasTexture {
  const cached = thighSkinTexCache.get(skinHex)
  if (cached) return cached

  const c = document.createElement('canvas')
  c.width = 256
  c.height = 256
  const ctx = c.getContext('2d')!

  const base = new THREE.Color(skinHex)
  const shadow = base.clone().multiplyScalar(0.82)
  const highlight = base.clone().lerp(new THREE.Color('#fff5eb'), 0.16)

  ctx.fillStyle = `#${base.getHexString()}`
  ctx.fillRect(0, 0, 256, 256)

  // Soft quadriceps sweep highlight
  const quadHighlight = ctx.createRadialGradient(128, 92, 10, 128, 92, 76)
  quadHighlight.addColorStop(0, `#${highlight.getHexString()}`)
  quadHighlight.addColorStop(1, `rgba(${Math.round(base.r * 255)}, ${Math.round(base.g * 255)}, ${Math.round(base.b * 255)}, 0)`)
  ctx.fillStyle = quadHighlight
  ctx.fillRect(30, 10, 196, 150)

  // Subtle anatomical patella (kneecap) side hollows & tendon highlight (no harsh dark circles!)
  for (const sx of [104, 152]) {
    const hollow = ctx.createRadialGradient(sx, 196, 2, sx, 196, 16)
    hollow.addColorStop(0, `rgba(${Math.round(shadow.r * 255)}, ${Math.round(shadow.g * 255)}, ${Math.round(shadow.b * 255)}, 0.42)`)
    hollow.addColorStop(1, 'rgba(0,0,0,0)')
    ctx.fillStyle = hollow
    ctx.beginPath()
    ctx.arc(sx, 196, 16, 0, Math.PI * 2)
    ctx.fill()
  }

  const patellaGrad = ctx.createRadialGradient(128, 190, 3, 128, 190, 20)
  patellaGrad.addColorStop(0, `#${highlight.getHexString()}`)
  patellaGrad.addColorStop(1, 'rgba(255,255,255,0)')
  ctx.fillStyle = patellaGrad
  ctx.beginPath()
  ctx.arc(128, 190, 20, 0, Math.PI * 2)
  ctx.fill()

  const tex = new THREE.CanvasTexture(c)
  tex.colorSpace = THREE.SRGBColorSpace
  thighSkinTexCache.set(skinHex, tex)
  return tex
}

function getRealisticFaceTexture(app: PlayerAppearance, faceCropImg?: HTMLImageElement): THREE.CanvasTexture {
  // Project the isolated, aspect-aligned face crop onto the 3D head & 3D nose whenever faceCropDataUrl is available
  // (unless the user explicitly switched faceMapMode to 'sculpted' procedural-only mode).
  const mode = app.faceMapMode ?? (app.faceCropDataUrl ? 'photo-blend' : 'sculpted')
  const usePhotoBlend =
    mode === 'photo-blend' &&
    Boolean(faceCropImg && faceCropImg.complete && faceCropImg.naturalWidth > 0 && app.faceCropDataUrl)
  const cacheKey = `v5|${app.skinTone}|${app.hairStyle}|${app.hairColor}|${app.eyeColor}|${app.beardStyle}|${app.noseSize}|${app.browTilt}|${usePhotoBlend ? app.faceCropDataUrl?.slice(-36) : 'sculpted'}`
  const existing = faceTextureCache.get(cacheKey)
  if (existing) return existing

  const c = document.createElement('canvas')
  c.width = 512
  c.height = 512
  const ctx = c.getContext('2d')!

  const baseSkin = new THREE.Color(app.skinTone || '#c6865c')
  const darkerSkin = baseSkin.clone().multiplyScalar(0.82)
  const highlightSkin = baseSkin.clone().lerp(new THREE.Color('#fff5ec'), 0.16)
  const warmFlush = baseSkin.clone().lerp(new THREE.Color('#d46a56'), 0.12)

  // 1. Clean, even, natural human skin base across the entire cranium, nose & neck
  ctx.fillStyle = `#${baseSkin.getHexString()}`
  ctx.fillRect(0, 0, 512, 512)

  // Soft forehead & nasal bridge T-zone highlight (centered at x=256, y=250)
  const tZoneGrad = ctx.createRadialGradient(256, 225, 10, 256, 240, 125)
  tZoneGrad.addColorStop(0, `#${highlightSkin.getHexString()}`)
  tZoneGrad.addColorStop(
    1,
    `rgba(${Math.round(baseSkin.r * 255)}, ${Math.round(baseSkin.g * 255)}, ${Math.round(baseSkin.b * 255)}, 0)`
  )
  ctx.fillStyle = tZoneGrad
  ctx.fillRect(110, 100, 292, 260)

  // Subtle natural malar cheek & nose-tip warmth
  for (const [cx, cy, rad] of [
    [196, 268, 44],
    [316, 268, 44],
    [256, 272, 22],
  ] as const) {
    const cheekGrad = ctx.createRadialGradient(cx, cy, 3, cx, cy, rad)
    cheekGrad.addColorStop(0, `#${warmFlush.getHexString()}`)
    cheekGrad.addColorStop(
      1,
      `rgba(${Math.round(baseSkin.r * 255)}, ${Math.round(baseSkin.g * 255)}, ${Math.round(baseSkin.b * 255)}, 0)`
    )
    ctx.fillStyle = cheekGrad
    ctx.beginPath()
    ctx.arc(cx, cy, rad, 0, Math.PI * 2)
    ctx.fill()
  }

  // Sculpted dorsal nose bridge highlight & soft alar shadow (so even procedural mode has natural nose definition)
  const noseBridgeGrad = ctx.createLinearGradient(244, 215, 268, 285)
  noseBridgeGrad.addColorStop(0, `rgba(${Math.round(darkerSkin.r * 255)}, ${Math.round(darkerSkin.g * 255)}, ${Math.round(darkerSkin.b * 255)}, 0.18)`)
  noseBridgeGrad.addColorStop(0.5, `rgba(255, 248, 240, 0.22)`)
  noseBridgeGrad.addColorStop(1, `rgba(${Math.round(darkerSkin.r * 255)}, ${Math.round(darkerSkin.g * 255)}, ${Math.round(darkerSkin.b * 255)}, 0.18)`)
  ctx.fillStyle = noseBridgeGrad
  ctx.fillRect(244, 215, 24, 68)

  // Delicate nasolabial fold & philtrum shading
  ctx.strokeStyle = `rgba(${Math.round(darkerSkin.r * 255)}, ${Math.round(darkerSkin.g * 255)}, ${Math.round(darkerSkin.b * 255)}, 0.25)`
  ctx.lineWidth = 2.2
  for (const side of [-1, 1]) {
    ctx.beginPath()
    ctx.moveTo(256 + side * 19, 282)
    ctx.quadraticCurveTo(256 + side * 31, 308, 256 + side * 26, 336)
    ctx.stroke()
  }

  // Subtle micro-skin pore texture
  let pSeed = 4177
  for (let i = 0; i < 2200; i++) {
    pSeed = (pSeed * 16807) % 2147483647
    const px = pSeed % 512
    pSeed = (pSeed * 16807) % 2147483647
    const py = pSeed % 512
    ctx.fillStyle = i % 2 === 0 ? 'rgba(255,245,235,0.02)' : 'rgba(30,15,10,0.022)'
    ctx.fillRect(px, py, 1.5, 1.5)
  }

  // 2. When 'photo-blend' is active, map the aligned Face Crop directly onto the frontal UV landmarks:
  //    Forehead y=132, Brows y=202, Eyes y=240, Nose Bridge/Tip y=268..282, Mouth y=332, Chin y=396!
  if (usePhotoBlend && faceCropImg) {
    const fw = 236
    const fh = 264
    const off = document.createElement('canvas')
    off.width = fw
    off.height = fh
    const octx = off.getContext('2d')!
    octx.drawImage(faceCropImg, 0, 0, fw, fh)

    // Preserve 85% of the photo's true facial colors & contrast while gently harmonizing outer edges with the detected skin tone
    const fData = octx.getImageData(0, 0, fw, fh)
    const fd = fData.data
    const targetR = baseSkin.r * 255
    const targetG = baseSkin.g * 255
    const targetB = baseSkin.b * 255

    for (let py = 0; py < fh; py++) {
      for (let px = 0; px < fw; px++) {
        const i = (py * fw + px) * 4
        if (fd[i + 3] < 10) continue
        // Normalized distance from face center (118, 132)
        const dx = (px - fw * 0.5) / (fw * 0.48)
        const dy = (py - fh * 0.5) / (fh * 0.48)
        const rDist = Math.hypot(dx, dy)
        // Keep central features (eyes, eyebrows, nose, lips) 92% true to the photo; blend outer cheek/jaw transition into baseSkin
        const photoWeight = clamp(0.92 - Math.max(0, rDist - 0.55) * 0.85, 0.25, 0.92)
        const lum = (fd[i] * 0.299 + fd[i + 1] * 0.587 + fd[i + 2] * 0.114) / 168
        const shade = clamp(lum, 0.35, 1.32)
        fd[i] = Math.round(fd[i] * photoWeight + clamp(targetR * shade, 0, 255) * (1 - photoWeight))
        fd[i + 1] = Math.round(fd[i + 1] * photoWeight + clamp(targetG * shade, 0, 255) * (1 - photoWeight))
        fd[i + 2] = Math.round(fd[i + 2] * photoWeight + clamp(targetB * shade, 0, 255) * (1 - photoWeight))
      }
    }
    octx.putImageData(fData, 0, 0)

    // Elliptical feather mask so the photo face merges into the 3D temples, jawline, and forehead with ZERO hard border
    octx.save()
    octx.globalCompositeOperation = 'destination-in'
    octx.translate(fw * 0.5, fh * 0.5)
    octx.scale(1, fh / fw)
    const maskGrad = octx.createRadialGradient(0, 0, fw * 0.28, 0, 0, fw * 0.49)
    maskGrad.addColorStop(0, 'rgba(0,0,0,1)')
    maskGrad.addColorStop(0.65, 'rgba(0,0,0,0.92)')
    maskGrad.addColorStop(0.86, 'rgba(0,0,0,0.48)')
    maskGrad.addColorStop(1, 'rgba(0,0,0,0)')
    octx.fillStyle = maskGrad
    octx.beginPath()
    octx.arc(0, 0, fw * 0.5, 0, Math.PI * 2)
    octx.fill()
    octx.restore()

    // Draw at (138, 132) -> center is (256, 264), matching u_front and v_front on both 3D Head and 3D Nose!
    ctx.drawImage(off, 138, 132, fw, fh)
  } else if (app.beardStyle === 'stubble') {
    const beardCol = new THREE.Color(app.hairColor).lerp(new THREE.Color('#1a1512'), 0.4)
    const rB = Math.round(beardCol.r * 255)
    const gB = Math.round(beardCol.g * 255)
    const bB = Math.round(beardCol.b * 255)
    const stubGrad = ctx.createRadialGradient(256, 358, 12, 256, 342, 84)
    stubGrad.addColorStop(0, `rgba(${rB}, ${gB}, ${bB}, 0.24)`)
    stubGrad.addColorStop(0.75, `rgba(${rB}, ${gB}, ${bB}, 0.16)`)
    stubGrad.addColorStop(1, `rgba(${rB}, ${gB}, ${bB}, 0)`)
    ctx.fillStyle = stubGrad
    ctx.beginPath()
    ctx.arc(256, 348, 84, 0, Math.PI)
    ctx.fill()
  }

  const tex = new THREE.CanvasTexture(c)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.needsUpdate = true
  faceTextureCache.set(cacheKey, tex)
  return tex
}

/**
 * Full-Body & Portrait Biometric Segmentation Engine:
 * 1. Rejects studio background gradients row-by-row using local edge sampling + saturation checks.
 * 2. Separates Hair Crown pixels vs. Facial Skin/Nose pixels using human skin chromaticity (R > G > B).
 * 3. Centers the Face Crop directly on the facial skin oval (nose bridge) so eyes, nose & mouth align 1:1 with the 3D head mesh.
 * 4. Automatically extracts the exact Hair RGB hex color, exact Nose/Face Skin RGB hex color, and full 3D Kit colors.
 */
export function analyzePhotoForPlayerAppearance(
  img: HTMLImageElement,
  rawDataUrl: string,
  fallbackIndex = 0,
  manualCrop?: Partial<PhotoCropConfig>
): PlayerAppearance {
  const base = defaultAppearanceForIndex(fallbackIndex)
  try {
    const W = 256
    const H = 384
    const c = document.createElement('canvas')
    c.width = W
    c.height = H
    const ctx = c.getContext('2d')!
    ctx.drawImage(img, 0, 0, W, H)
    const imgData = ctx.getImageData(0, 0, W, H)
    const data = imgData.data

    // 1. Row-adaptive background estimator (handles studio lighting gradients from top to bottom)
    const rowBgR = new Float32Array(H)
    const rowBgG = new Float32Array(H)
    const rowBgB = new Float32Array(H)
    let globalBgR = 0
    let globalBgG = 0
    let globalBgB = 0
    let globalBgCnt = 0

    for (let y = 0; y < H; y++) {
      let r = 0
      let g = 0
      let b = 0
      let cnt = 0
      for (const x of [2, 5, 9, W - 10, W - 6, W - 3]) {
        const idx = (y * W + x) * 4
        if (data[idx + 3] > 128) {
          r += data[idx]
          g += data[idx + 1]
          b += data[idx + 2]
          cnt++
        }
      }
      if (cnt > 0) {
        rowBgR[y] = r / cnt
        rowBgG[y] = g / cnt
        rowBgB[y] = b / cnt
        if (y < H * 0.6) {
          globalBgR += rowBgR[y]
          globalBgG += rowBgG[y]
          globalBgB += rowBgB[y]
          globalBgCnt++
        }
      } else {
        rowBgR[y] = 235
        rowBgG[y] = 238
        rowBgB[y] = 242
      }
    }
    if (globalBgCnt > 0) {
      globalBgR /= globalBgCnt
      globalBgG /= globalBgCnt
      globalBgB /= globalBgCnt
    } else {
      globalBgR = 235
      globalBgG = 238
      globalBgB = 242
    }

    const isForegroundPixel = (x: number, y: number, threshold = 26) => {
      const cy = clamp(y, 0, H - 1)
      const cx = clamp(x, 0, W - 1)
      const idx = (cy * W + cx) * 4
      if (data[idx + 3] < 128) return false
      const r = data[idx]
      const g = data[idx + 1]
      const b = data[idx + 2]
      const dRow = Math.hypot(r - rowBgR[cy], g - rowBgG[cy], b - rowBgB[cy])
      const dGlob = Math.hypot(r - globalBgR, g - globalBgG, b - globalBgB)
      return dRow > threshold && dGlob > threshold * 0.85
    }

    // True human skin chromaticity test (warm R > G >= B tone, rejecting neutral studio backdrops and dark hair)
    const isHumanSkinPixel = (r: number, g: number, b: number) => {
      const lum = (r * 0.299 + g * 0.587 + b * 0.114) / 255
      if (lum < 0.18 || lum > 0.89) return false
      const maxC = Math.max(r, g, b)
      const minC = Math.min(r, g, b)
      const sat = maxC > 0 ? (maxC - minC) / maxC : 0
      // Human skin across all ethnicities has warm R-dominant chromaticity and non-zero saturation
      return r > g + 4 && g >= b - 8 && r - b >= 14 && sat >= 0.13 && sat <= 0.72
    }

    // 2. Scan foreground silhouette row-by-row
    let fgMinY = H - 1
    let fgMaxY = 0
    const rowLeft = new Int16Array(H).fill(W)
    const rowRight = new Int16Array(H).fill(-1)
    for (let y = 2; y < H - 2; y++) {
      let left = W
      let right = -1
      for (let x = 4; x < W - 4; x++) {
        if (isForegroundPixel(x, y)) {
          if (x < left) left = x
          if (x > right) right = x
        }
      }
      if (right - left >= 6) {
        rowLeft[y] = left
        rowRight[y] = right
        if (y < fgMinY) fgMinY = y
        if (y > fgMaxY) fgMaxY = y
      }
    }

    const fgHeight = Math.max(40, fgMaxY - fgMinY)
    let headSpanSum = 0
    let headSpanCount = 0
    for (let y = fgMinY + Math.floor(fgHeight * 0.02); y <= fgMinY + Math.floor(fgHeight * 0.14); y++) {
      if (y >= 0 && y < H && rowRight[y] > rowLeft[y]) {
        headSpanSum += rowRight[y] - rowLeft[y]
        headSpanCount++
      }
    }
    let torsoSpanSum = 0
    let torsoSpanCount = 0
    for (let y = fgMinY + Math.floor(fgHeight * 0.22); y <= fgMinY + Math.floor(fgHeight * 0.44); y++) {
      if (y >= 0 && y < H && rowRight[y] > rowLeft[y]) {
        torsoSpanSum += rowRight[y] - rowLeft[y]
        torsoSpanCount++
      }
    }
    const avgHeadSpan = headSpanCount > 0 ? headSpanSum / headSpanCount : W * 0.25
    const avgTorsoSpan = torsoSpanCount > 0 ? torsoSpanSum / torsoSpanCount : W * 0.5

    // Detect if this is a Full-Body / Kit photo vs. Portrait Headshot
    const autoIsFullBody =
      (avgTorsoSpan > avgHeadSpan * 1.3 && avgHeadSpan < W * 0.48) ||
      (img.height > img.width * 1.18 && avgHeadSpan < W * 0.45)

    // 3. Locate the exact Facial Skin Oval (Forehead-to-Chin, centered on the Nose Bridge!)
    const searchTopY = fgMinY
    const searchBotY = autoIsFullBody
      ? Math.min(H - 1, Math.round(fgMinY + fgHeight * 0.165))
      : Math.min(fgMaxY, Math.round(fgMinY + fgHeight * 0.78))

    let skinSumX = 0
    let skinSumY = 0
    let skinMinY = searchBotY
    let skinMaxY = searchTopY
    let skinCnt = 0

    for (let y = searchTopY; y <= searchBotY; y++) {
      const l = rowLeft[y]
      const r = rowRight[y]
      if (r <= l) continue
      for (let x = l; x <= r; x++) {
        if (!isForegroundPixel(x, y, 24)) continue
        const idx = (y * W + x) * 4
        if (isHumanSkinPixel(data[idx], data[idx + 1], data[idx + 2])) {
          skinSumX += x
          skinSumY += y
          if (y < skinMinY) skinMinY = y
          if (y > skinMaxY) skinMaxY = y
          skinCnt++
        }
      }
    }

    let autoFaceCX = 0.5
    let autoFaceCY = autoIsFullBody ? 0.116 : 0.46
    let autoFaceRadius = autoIsFullBody ? 0.054 : 0.22

    if (skinCnt >= 24 && skinMaxY > skinMinY + 8) {
      // Center directly on the detected facial skin oval (exclude the lower neck below chin)
      const faceHeightEst = Math.min(skinMaxY - skinMinY, (searchBotY - searchTopY) * 0.72)
      const chinY = skinMinY + faceHeightEst
      autoFaceCX = clamp(skinSumX / (skinCnt * W), 0.15, 0.85)
      autoFaceCY = clamp(((skinMinY + chinY) * 0.5) / H, 0.05, 0.85)
      autoFaceRadius = clamp(
        (faceHeightEst * 0.52) / H,
        autoIsFullBody ? 0.045 : 0.14,
        autoIsFullBody ? 0.14 : 0.36
      )
    } else if (autoIsFullBody) {
      const headTopY = fgMinY
      const headBottomY = fgMinY + fgHeight * 0.148
      let cxSum = 0
      let cxCnt = 0
      for (let y = Math.floor(headTopY); y <= Math.min(H - 1, Math.ceil(headBottomY)); y++) {
        if (rowRight[y] > rowLeft[y]) {
          cxSum += (rowLeft[y] + rowRight[y]) * 0.5
          cxCnt++
        }
      }
      autoFaceCX = cxCnt > 0 ? clamp(cxSum / (cxCnt * W), 0.15, 0.85) : 0.5
      // Offset 62% down from top of hair so center lands on the nose bridge rather than the forehead/hair!
      autoFaceCY = clamp((headTopY + (headBottomY - headTopY) * 0.62) / H, 0.06, 0.85)
      autoFaceRadius = clamp(((headBottomY - headTopY) * 0.39) / H, 0.046, 0.14)
    }

    const crop: PhotoCropConfig = {
      faceCenterX: manualCrop?.faceCenterX ?? autoFaceCX,
      faceCenterY: manualCrop?.faceCenterY ?? autoFaceCY,
      faceRadius: manualCrop?.faceRadius ?? autoFaceRadius,
      isFullBody: manualCrop?.isFullBody ?? autoIsFullBody,
    }

    // 4. Sample Exact Nose/Cheek Skin Color & Exact Hair Crown Color around the aligned Face Box
    const headCenterX = Math.round(crop.faceCenterX * W)
    const headCenterY = Math.round(crop.faceCenterY * H)
    const headRadY = Math.max(9, Math.round(crop.faceRadius * H))
    const headRadX = Math.max(8, Math.round(crop.faceRadius * W * 0.92))

    // 4A. Collect verified facial skin pixels from the Nose Bridge & Malar Cheeks
    const skinPixels: { r: number; g: number; b: number; lum: number }[] = []
    const sx0 = clamp(Math.round(headCenterX - headRadX * 0.62), 0, W - 1)
    const sx1 = clamp(Math.round(headCenterX + headRadX * 0.62), 0, W - 1)
    const sy0 = clamp(Math.round(headCenterY - headRadY * 0.48), 0, H - 1)
    const sy1 = clamp(Math.round(headCenterY + headRadY * 0.45), 0, H - 1)

    for (let y = sy0; y <= sy1; y++) {
      for (let x = sx0; x <= sx1; x++) {
        if (!isForegroundPixel(x, y, 22)) continue
        const idx = (y * W + x) * 4
        const r = data[idx]
        const g = data[idx + 1]
        const b = data[idx + 2]
        if (isHumanSkinPixel(r, g, b)) {
          const lum = (r * 0.299 + g * 0.587 + b * 0.114) / 255
          skinPixels.push({ r: r / 255, g: g / 255, b: b / 255, lum })
        }
      }
    }

    let bestSkin = base.skinTone || '#c6865c'
    let cheekLum = 0.55
    if (skinPixels.length >= 6) {
      // Sort by luminance and average the middle 60% (discarding dark nostril/eye shadows and bright studio sweat glare)
      skinPixels.sort((a, b) => a.lum - b.lum)
      const pStart = Math.floor(skinPixels.length * 0.22)
      const pEnd = Math.max(pStart + 1, Math.ceil(skinPixels.length * 0.82))
      let sr = 0
      let sg = 0
      let sb = 0
      let sLum = 0
      for (let i = pStart; i < pEnd; i++) {
        sr += skinPixels[i].r
        sg += skinPixels[i].g
        sb += skinPixels[i].b
        sLum += skinPixels[i].lum
      }
      const cnt = pEnd - pStart
      const exactSkin = new THREE.Color(sr / cnt, sg / cnt, sb / cnt)
      cheekLum = sLum / cnt
      bestSkin = `#${exactSkin.getHexString()}`
    }

    // 4B. Collect Hair Crown pixels (strictly above the forehead: y from headCenterY - 1.75*headRadY to headCenterY - 0.58*headRadY)
    const hairPixels: { r: number; g: number; b: number; lum: number }[] = []
    const hx0 = clamp(Math.round(headCenterX - headRadX * 0.88), 0, W - 1)
    const hx1 = clamp(Math.round(headCenterX + headRadX * 0.88), 0, W - 1)
    const hy0 = clamp(Math.round(headCenterY - headRadY * 1.78), Math.max(1, fgMinY), H - 1)
    const hy1 = clamp(Math.round(headCenterY - headRadY * 0.55), hy0 + 2, H - 1)

    for (let y = hy0; y <= hy1; y++) {
      for (let x = hx0; x <= hx1; x++) {
        if (!isForegroundPixel(x, y, 28)) continue
        const idx = (y * W + x) * 4
        const r = data[idx] / 255
        const g = data[idx + 1] / 255
        const b = data[idx + 2] / 255
        const lum = r * 0.299 + g * 0.587 + b * 0.114
        // Exclude bright studio rim-light bleeding onto outer hair tips (lum > 0.78)
        if (lum < 0.78) {
          hairPixels.push({ r, g, b, lum })
        }
      }
    }

    let bestHair = '#181412'
    let hairLum = 0.12
    let hairVariance = 0.015
    if (hairPixels.length >= 6) {
      hairPixels.sort((a, b) => a.lum - b.lum)
      // Take the richer lower 65% of crown pixels so studio highlights don't wash out black/brown hair
      const hEnd = Math.max(1, Math.ceil(hairPixels.length * 0.65))
      let hr = 0
      let hg = 0
      let hb = 0
      let hLumSum = 0
      let hLumSq = 0
      for (let i = 0; i < hEnd; i++) {
        hr += hairPixels[i].r
        hg += hairPixels[i].g
        hb += hairPixels[i].b
        hLumSum += hairPixels[i].lum
        hLumSq += hairPixels[i].lum * hairPixels[i].lum
      }
      const exactHair = new THREE.Color(hr / hEnd, hg / hEnd, hb / hEnd)
      hairLum = hLumSum / hEnd
      hairVariance = Math.max(0, hLumSq / hEnd - hairLum * hairLum)
      bestHair = `#${exactHair.getHexString()}`
    }

    // Determine 3D Hairstyle from crown height & texture (never defaults to a blonde bun!)
    const crownSpanH = Math.max(0, headCenterY - headRadY * 0.65 - fgMinY)
    const hairStyle: HairStyleId =
      crownSpanH < headRadY * 0.35
        ? 'buzz'
        : hairLum < 0.26 || hairVariance > 0.008
          ? 'fade-curls'
          : crownSpanH > headRadY * 0.75
            ? 'textured-quiff'
            : 'short-crop'

    // Sample generic foreground box helper for chin beard & kit zones
    const sampleFgBox = (
      x0: number,
      y0: number,
      x1: number,
      y1: number,
      minLum = 0.0,
      maxLum = 1.0
    ): { color: THREE.Color; count: number; variance: number } => {
      let r = 0
      let g = 0
      let b = 0
      let lumSum = 0
      let lumSqSum = 0
      let count = 0
      const bx0 = clamp(Math.round(x0), 0, W - 1)
      const bx1 = clamp(Math.round(x1), 0, W - 1)
      const by0 = clamp(Math.round(y0), 0, H - 1)
      const by1 = clamp(Math.round(y1), 0, H - 1)

      for (let y = by0; y <= by1; y++) {
        for (let x = bx0; x <= bx1; x++) {
          if (!isForegroundPixel(x, y, 26)) continue
          const idx = (y * W + x) * 4
          const pr = data[idx] / 255
          const pg = data[idx + 1] / 255
          const pb = data[idx + 2] / 255
          const lum = pr * 0.299 + pg * 0.587 + pb * 0.114
          if (lum < minLum || lum > maxLum) continue
          r += pr
          g += pg
          b += pb
          lumSum += lum
          lumSqSum += lum * lum
          count++
        }
      }
      if (count === 0) {
        return { color: new THREE.Color(bestSkin), count: 0, variance: 0 }
      }
      const meanLum = lumSum / count
      const variance = Math.max(0, lumSqSum / count - meanLum * meanLum)
      return {
        color: new THREE.Color(r / count, g / count, b / count),
        count,
        variance,
      }
    }

    // Chin zone for beard detection
    const chinSample = sampleFgBox(
      headCenterX - headRadX * 0.38,
      headCenterY + headRadY * 0.55,
      headCenterX + headRadX * 0.38,
      headCenterY + headRadY * 0.92,
      0.02,
      0.88
    )
    const chinLum =
      chinSample.color.r * 0.299 + chinSample.color.g * 0.587 + chinSample.color.b * 0.114
    const beardStyle: BeardStyleId =
      chinSample.count > 10 && chinLum < cheekLum - 0.22
        ? 'boxed-beard'
        : chinSample.count > 10 && chinLum < cheekLum - 0.14
          ? 'stubble'
          : 'none'

    // 5. Generate Aspect-Correct, Nose-Centered 256x256 Face Crop (`faceCropDataUrl`)
    //    Using uniform pixel radius so non-square photos are NEVER stretched horizontally or vertically!
    const faceCanvas = document.createElement('canvas')
    faceCanvas.width = 256
    faceCanvas.height = 256
    const fctx = faceCanvas.getContext('2d')!
    fctx.fillStyle = bestSkin
    fctx.fillRect(0, 0, 256, 256)

    const refDim = Math.max(img.width, img.height)
    const srcCropW = refDim * (crop.faceRadius * 1.92)
    const srcCropH = refDim * (crop.faceRadius * 2.08)
    const srcCropX = img.width * crop.faceCenterX - srcCropW * 0.5
    const srcCropY = img.height * crop.faceCenterY - srcCropH * 0.5
    fctx.drawImage(img, srcCropX, srcCropY, srcCropW, srcCropH, 0, 0, 256, 256)

    // Strip any studio background pixels or dark hair-corner pixels at the outer borders of faceCanvas
    // so only clean skin & facial features map onto the 3D cheeks and forehead!
    const fcImgData = fctx.getImageData(0, 0, 256, 256)
    const fcd = fcImgData.data
    const skinCol = new THREE.Color(bestSkin)
    const sR = Math.round(skinCol.r * 255)
    const sG = Math.round(skinCol.g * 255)
    const sB = Math.round(skinCol.b * 255)

    for (let py = 0; py < 256; py++) {
      for (let px = 0; px < 256; px++) {
        const i = (py * 256 + px) * 4
        const r = fcd[i]
        const g = fcd[i + 1]
        const b = fcd[i + 2]
        const dBg = Math.hypot(r - globalBgR, g - globalBgG, b - globalBgB)
        const maxC = Math.max(r, g, b)
        const minC = Math.min(r, g, b)
        const sat = maxC > 0 ? (maxC - minC) / maxC : 0
        const lum = (r * 0.299 + g * 0.587 + b * 0.114) / 255
        const normX = (px - 128) / 128
        const normY = (py - 128) / 128
        const radial = Math.hypot(normX, normY)

        // Replace studio background OR dark sideburn/hair-fringe at top/outer edges with detected skin tone
        const isStudioBg = dBg < 38 || (lum > 0.76 && sat < 0.12)
        const isOuterHair = (py < 42 || radial > 0.78) && lum < 0.25
        if (isStudioBg || isOuterHair) {
          fcd[i] = sR
          fcd[i + 1] = sG
          fcd[i + 2] = sB
        }
      }
    }
    fctx.putImageData(fcImgData, 0, 0)
    const faceCropDataUrl = faceCanvas.toDataURL('image/png')

    // 6. If Full-Body Photo (like Lamine Yamal), Extract Full 3D Kit Colors (Jersey, Shorts, Socks, Boots) + Torso Texture!
    let customJerseyColor: string | undefined
    let customJerseyTrimColor: string | undefined
    let customShortsColor: string | undefined
    let customSocksColor: string | undefined
    let customTorsoDataUrl: string | undefined
    let detectedBootColor = base.bootColor

    if (crop.isFullBody) {
      const torsoTopY = fgMinY + fgHeight * 0.2
      const torsoBotY = fgMinY + fgHeight * 0.48
      const torsoSample = sampleFgBox(W * 0.3, torsoTopY, W * 0.7, torsoBotY, 0.05, 0.92)
      if (torsoSample.count > 20) {
        customJerseyColor = `#${torsoSample.color.getHexString()}`
      }

      const trimSample = sampleFgBox(W * 0.22, fgMinY + fgHeight * 0.16, W * 0.78, fgMinY + fgHeight * 0.24, 0.45, 0.98)
      if (trimSample.count > 10) {
        customJerseyTrimColor = `#${trimSample.color.getHexString()}`
      } else {
        customJerseyTrimColor = '#f59e0b'
      }

      const shortsSample = sampleFgBox(W * 0.28, fgMinY + fgHeight * 0.53, W * 0.72, fgMinY + fgHeight * 0.68, 0.03, 0.9)
      if (shortsSample.count > 15) {
        customShortsColor = `#${shortsSample.color.getHexString()}`
      }

      const socksSample = sampleFgBox(W * 0.22, fgMinY + fgHeight * 0.73, W * 0.78, fgMinY + fgHeight * 0.88, 0.05, 0.9)
      if (socksSample.count > 12) {
        customSocksColor = `#${socksSample.color.getHexString()}`
      }

      const bootsSample = sampleFgBox(W * 0.18, fgMinY + fgHeight * 0.9, W * 0.82, fgMaxY, 0.05, 0.92)
      if (bootsSample.count > 8) {
        detectedBootColor = `#${bootsSample.color.getHexString()}`
      }

      // Extract clean 256x256 Cropped Torso Texture for the 3D Jersey Chest
      const torsoCanvas = document.createElement('canvas')
      torsoCanvas.width = 256
      torsoCanvas.height = 256
      const tctx = torsoCanvas.getContext('2d')!
      tctx.fillStyle = customJerseyColor || '#d91c24'
      tctx.fillRect(0, 0, 256, 256)

      const tLeft = Math.max(0, (headCenterX - avgTorsoSpan * 0.46) / W) * img.width
      const tWidth = Math.min(img.width - tLeft, ((avgTorsoSpan * 0.92) / W) * img.width)
      const tTop = (torsoTopY / H) * img.height
      const tHeight = ((torsoBotY - torsoTopY) / H) * img.height
      tctx.drawImage(img, tLeft, tTop, tWidth, tHeight, 0, 0, 256, 256)

      const tImgData = tctx.getImageData(0, 0, 256, 256)
      const td = tImgData.data
      const jCol = new THREE.Color(customJerseyColor || '#d91c24')
      const jR = Math.round(jCol.r * 255)
      const jG = Math.round(jCol.g * 255)
      const jB = Math.round(jCol.b * 255)
      for (let i = 0; i < td.length; i += 4) {
        const dr = td[i] - globalBgR
        const dg = td[i + 1] - globalBgG
        const db = td[i + 2] - globalBgB
        if (Math.hypot(dr, dg, db) < 36) {
          td[i] = jR
          td[i + 1] = jG
          td[i + 2] = jB
        }
      }
      tctx.putImageData(tImgData, 0, 0)
      customTorsoDataUrl = torsoCanvas.toDataURL('image/png')
    }

    return {
      ...base,
      skinTone: bestSkin,
      hairColor: bestHair,
      hairStyle,
      beardStyle,
      bootColor: detectedBootColor,
      customJerseyColor,
      customJerseyTrimColor,
      customShortsColor,
      customSocksColor,
      customTorsoDataUrl,
      faceCropDataUrl,
      // Always default to 'photo-blend' when a photo is scanned so the extracted face maps onto the 3D head & nose!
      faceMapMode: 'photo-blend',
      photoCrop: crop,
      customDecalDataUrl: rawDataUrl,
      customDecalTarget: 'chest',
      customDecalShape: 'shield',
      customDecalDepth: 85,
    }
  } catch {
    return {
      ...base,
      faceCropDataUrl: rawDataUrl,
      faceMapMode: 'photo-blend',
      customDecalDataUrl: rawDataUrl,
      customDecalTarget: 'chest',
      customDecalShape: 'shield',
      customDecalDepth: 85,
    }
  }
}

/**
 * Shared Frontal Facial UV Projection:
 * Maps head-space coordinates (hx, hy) on both the 3D Head mesh AND the 3D Nose mesh
 * to identical texture coordinates (u, v) on `faceMat` so the nose and face have 100% seamless color & texture!
 */
function computeFrontalFaceUV(hx: number, hy: number): [number, number] {
  const u = clamp(0.5 + (hx / 0.125) * 0.23, 0.05, 0.95)
  const v = clamp(0.484 + (hy / 0.108) * 0.258, 0.05, 0.95)
  return [u, v]
}

/**
 * Smooth, anatomically sculpted 3D human cranium, zygomatic cheekbones, orbital sockets,
 * and mandibular jawline with Frontal Perspective-Corrected UVs so uploaded face photos
 * map 1:1 without spherical distortion!
 */
function createSculptedHeadGeometry(jawScale: number): THREE.BufferGeometry {
  const geo = new THREE.SphereGeometry(0.168, 52, 44)
  geo.rotateY(-Math.PI / 2)

  const pos = geo.attributes.position
  const uvAttr = geo.attributes.uv
  const v = new THREE.Vector3()
  const smoothstep = (edge0: number, edge1: number, x: number) => {
    const t = clamp((x - edge0) / (edge1 - edge0), 0, 1)
    return t * t * (3 - 2 * t)
  }

  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i)

    const nx = v.x / 0.168
    const ny = v.y / 0.168
    const nz = v.z / 0.168

    // 1. Cranial & mandibular width proportions (smooth transition from temples to jaw)
    const lowerWeight = smoothstep(0.15, -0.65, ny)
    const widthFactor = 0.84 * (1 - lowerWeight * 0.08 + lowerWeight * (jawScale - 1) * 0.75)
    v.x *= widthFactor
    v.y *= 1.12
    v.z *= 0.96

    // 2. Smooth jawline taper toward the chin (mental protuberance)
    const chinTaper = smoothstep(-0.1, -0.95, ny)
    v.x *= 1 - chinTaper * 0.28

    // Gentle forward facial plane & chin projection
    if (nz > 0) {
      const facePlane = smoothstep(-0.95, 0.25, ny) * (1 - smoothstep(0.35, 0.85, ny))
      v.z += facePlane * 0.012 * nz
      const chinBump = Math.exp(-Math.pow((ny + 0.76) / 0.16, 2)) * Math.exp(-Math.pow(nx / 0.28, 2))
      v.z += chinBump * 0.01 * nz
    }

    // Back of skull occipital curve & neck base tuck
    if (nz < 0 && ny < -0.2) {
      const napeTuck = smoothstep(-0.2, -0.9, ny)
      v.z += napeTuck * 0.018 * (-nz)
    }

    // 3. Facial bone landmarks on the anterior face (nz > 0.2)
    if (nz > 0.2) {
      const frontMask = smoothstep(0.2, 0.55, nz)

      // Supraorbital brow ridge
      const browArch = Math.exp(-Math.pow((ny - 0.21) / 0.09, 2)) * Math.exp(-Math.pow(nx / 0.52, 2))
      v.z += browArch * 0.009 * frontMask

      // Recessed orbital eye sockets (around ny = 0.08, |nx| = 0.31)
      const eyeSocket =
        Math.exp(-Math.pow((ny - 0.08) / 0.095, 2)) *
        Math.exp(-Math.pow((Math.abs(nx) - 0.3) / 0.13, 2))
      v.z -= eyeSocket * 0.009 * frontMask

      // Smooth zygomatic cheekbone prominence (around ny = -0.05, |nx| = 0.44)
      const zygoma =
        Math.exp(-Math.pow((ny + 0.05) / 0.15, 2)) *
        Math.exp(-Math.pow((Math.abs(nx) - 0.42) / 0.18, 2))
      v.z += zygoma * 0.007 * frontMask
      v.x += Math.sign(nx) * zygoma * 0.005 * frontMask
    }

    pos.setXYZ(i, v.x, v.y, v.z)

    // 4. Frontal Perspective-Corrected UV projection for the anterior face (nz > 0.05)
    //    so the face photo maps distortion-free onto the forehead, eyes, cheeks, and chin!
    if (nz > 0.05) {
      const blend = smoothstep(0.05, 0.42, nz)
      const origU = uvAttr.getX(i)
      const origV = uvAttr.getY(i)
      const [frontU, frontV] = computeFrontalFaceUV(v.x, v.y)
      uvAttr.setXY(i, origU * (1 - blend) + frontU * blend, origV * (1 - blend) + frontV * blend)
    }
  }

  uvAttr.needsUpdate = true
  geo.computeVertexNormals()
  return geo
}

/**
 * Generates an anisotropic hair-strand texture so 3D hairstyles have fine realistic hair fibers.
 */
const hairFiberTexCache = new Map<string, THREE.CanvasTexture>()
function getHairFiberTexture(hairHex: string): THREE.CanvasTexture {
  const existing = hairFiberTexCache.get(hairHex)
  if (existing) return existing

  const c = document.createElement('canvas')
  c.width = 256
  c.height = 256
  const ctx = c.getContext('2d')!
  const base = new THREE.Color(hairHex)
  const dark = base.clone().multiplyScalar(0.62)
  const highlight = base.clone().lerp(new THREE.Color('#fff1d0'), 0.22)

  ctx.fillStyle = `#${base.getHexString()}`
  ctx.fillRect(0, 0, 256, 256)

  let seed = 8821
  for (let i = 0; i < 1800; i++) {
    seed = (seed * 16807) % 2147483647
    const x = seed % 256
    seed = (seed * 16807) % 2147483647
    const y = seed % 256
    ctx.strokeStyle = i % 3 === 0 ? `#${highlight.getHexString()}` : `#${dark.getHexString()}`
    ctx.globalAlpha = i % 3 === 0 ? 0.25 : 0.35
    ctx.lineWidth = 1.2
    ctx.beginPath()
    ctx.moveTo(x, y)
    ctx.bezierCurveTo(x + 2, y + 8, x - 2, y + 16, x + 1, y + 24)
    ctx.stroke()
  }
  ctx.globalAlpha = 1.0

  const tex = new THREE.CanvasTexture(c)
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping
  tex.repeat.set(3, 3)
  tex.colorSpace = THREE.SRGBColorSpace
  hairFiberTexCache.set(hairHex, tex)
  return tex
}

/**
 * Builds a sculpted, organic 3D hair cap + flowing locks that hug the cranium naturally.
 */
function buildHairMesh(head: THREE.Group, app: PlayerAppearance) {
  const hairGroup = new THREE.Group()
  head.add(hairGroup)

  const style = app.hairStyle
  const baseHairColor = new THREE.Color(app.hairColor)
  const rootColor = baseHairColor.clone().multiplyScalar(0.68)
  const fiberTex = getHairFiberTexture(app.hairColor)

  const hairMat = new THREE.MeshStandardMaterial({
    map: fiberTex,
    roughness: 0.72,
    metalness: 0.04,
  })
  const fadeMat = new THREE.MeshStandardMaterial({
    color: rootColor,
    roughness: 0.86,
    metalness: 0.02,
  })

  const makeOrganicCrownCap = (topLift: number, frontReach: number, waveAmp: number) => {
    const capGeo = new THREE.SphereGeometry(0.171, 36, 28)
    capGeo.rotateY(-Math.PI / 2)
    const pos = capGeo.attributes.position
    const v = new THREE.Vector3()
    for (let i = 0; i < pos.count; i++) {
      v.fromBufferAttribute(pos, i)
      const nx = v.x / 0.171
      const ny = v.y / 0.171
      const nz = v.z / 0.171

      const hairlineY = nz > 0.15 ? 0.34 - (1 - nz) * 0.22 - frontReach : -0.36
      if (ny < hairlineY) {
        const tuck = Math.min(1, (hairlineY - ny) * 3.5)
        v.multiplyScalar(1 - tuck * 0.14)
        v.y = Math.max(v.y, -0.11)
      } else {
        v.x *= 0.855
        v.y *= 1.13 + (ny > 0.25 ? topLift * (ny - 0.25) : 0)
        v.z *= 0.97 + (nz > 0.2 && ny > 0.3 ? frontReach * 0.45 : 0)

        const wave =
          Math.sin(nx * 14 + nz * 10) * Math.cos(nz * 12 - nx * 8) * waveAmp * Math.max(0, ny)
        v.x += nx * wave
        v.y += Math.abs(wave) * 1.3
        v.z += nz * wave
      }
      pos.setXYZ(i, v.x, v.y, v.z)
    }
    capGeo.computeVertexNormals()
    return capGeo
  }

  if (style === 'buzz') {
    const buzzGeo = makeOrganicCrownCap(0.01, 0.01, 0.002)
    addMesh(buzzGeo, fadeMat, hairGroup, 0, 0.003, 0)
    return
  }

  if (style === 'short-crop') {
    const cropGeo = makeOrganicCrownCap(0.055, 0.045, 0.0065)
    addMesh(cropGeo, hairMat, hairGroup, 0, 0.004, 0)

    const fringeGeo = new THREE.SphereGeometry(0.115, 24, 16)
    fringeGeo.scale(1.12, 0.42, 0.68)
    const fringe = addMesh(fringeGeo, hairMat, hairGroup, 0, 0.152, 0.078)
    fringe.rotation.x = 0.28
  } else if (style === 'fade-curls') {
    const baseGeo = makeOrganicCrownCap(0.08, 0.05, 0.012)
    addMesh(baseGeo, fadeMat, hairGroup, 0, 0.004, 0)

    const curlGeo = new THREE.SphereGeometry(0.132, 32, 24)
    const cPos = curlGeo.attributes.position
    const cv = new THREE.Vector3()
    for (let i = 0; i < cPos.count; i++) {
      cv.fromBufferAttribute(cPos, i)
      const ripple =
        Math.sin(cv.x * 38) * Math.cos(cv.z * 38) * 0.011 +
        Math.sin((cv.x + cv.z) * 26) * 0.007
      cv.addScaledVector(cv.clone().normalize(), ripple)
      cPos.setXYZ(i, cv.x * 0.96, cv.y * 0.62, cv.z * 1.05)
    }
    curlGeo.computeVertexNormals()
    const curls = addMesh(curlGeo, hairMat, hairGroup, 0, 0.145, 0.018)
    curls.rotation.x = 0.12
  } else if (style === 'textured-quiff') {
    const baseGeo = makeOrganicCrownCap(0.07, 0.05, 0.008)
    addMesh(baseGeo, hairMat, hairGroup, 0, 0.004, 0)

    const quiffGeo = new THREE.SphereGeometry(0.122, 28, 20)
    const qPos = quiffGeo.attributes.position
    const qv = new THREE.Vector3()
    for (let i = 0; i < qPos.count; i++) {
      qv.fromBufferAttribute(qPos, i)
      const wave = Math.sin(qv.x * 28 + qv.z * 18) * 0.006
      qPos.setXYZ(i, qv.x * 0.95 + wave, qv.y * 0.55 + (qv.z > 0 ? qv.z * 0.28 : 0), qv.z * 1.12)
    }
    quiffGeo.computeVertexNormals()
    const quiff = addMesh(quiffGeo, hairMat, hairGroup, 0, 0.158, 0.042)
    quiff.rotation.x = -0.18
    quiff.rotation.z = -0.06
  } else if (style === 'top-knot') {
    const baseGeo = makeOrganicCrownCap(0.045, 0.02, 0.006)
    addMesh(baseGeo, hairMat, hairGroup, 0, 0.004, 0)

    const band = addMesh(
      new THREE.TorusGeometry(0.146, 0.009, 10, 36),
      stdMat('#f4f7f2', 0.45),
      hairGroup,
      0,
      0.086,
      0.002
    )
    band.rotation.x = Math.PI / 2 - 0.24
    band.scale.set(0.95, 1.03, 1)

    const bun = addMesh(
      new THREE.SphereGeometry(0.054, 20, 16),
      hairMat,
      hairGroup,
      0,
      0.168,
      -0.118
    )
    bun.scale.set(0.88, 0.92, 1.12)
  } else if (style === 'dreads') {
    const baseGeo = makeOrganicCrownCap(0.05, 0.03, 0.008)
    addMesh(baseGeo, fadeMat, hairGroup, 0, 0.004, 0)

    for (let i = -5; i <= 5; i++) {
      const t = i / 5
      const lock = addMesh(
        new THREE.CapsuleGeometry(0.015, 0.15, 6, 12),
        hairMat,
        hairGroup,
        t * 0.105,
        0.055 - Math.abs(t) * 0.02,
        -0.085 - (1 - Math.abs(t)) * 0.045
      )
      lock.rotation.x = 0.52
      lock.rotation.z = -t * 0.28
      lock.scale.set(0.92, 1, 0.78)
    }
  }
}

/**
 * Creates a single, continuous, anatomically sculpted 3D human nose mesh with Frontal Face UVs
 * matched to `createSculptedHeadGeometry` so the nose uses `faceMat` and matches the face color 100%!
 */
function createSculptedNoseGeometry(): THREE.BufferGeometry {
  const geo = new THREE.SphereGeometry(0.024, 28, 24)
  const pos = geo.attributes.position
  const uvAttr = geo.attributes.uv
  const v = new THREE.Vector3()

  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i)
    const nx = v.x / 0.024
    const ny = v.y / 0.024
    const nz = v.z / 0.024

    const yHeight = ny * 0.034
    const bridgeTaper = ny > 0 ? 0.46 - ny * 0.14 : 0.46 + Math.sin(Math.min(1, -ny) * Math.PI * 0.85) * 0.46
    let xWidth = nx * 0.025 * bridgeTaper

    let zDepth = nz * 0.015
    if (nz > -0.2) {
      const tipProfile =
        ny > -0.35
          ? (1 - (ny + 0.35) / 1.35) * 0.018
          : (1 - (-0.35 - ny) / 0.65) * 0.018
      zDepth += tipProfile * Math.max(0, nz + 0.2)
    }

    const alarFlare =
      Math.exp(-Math.pow((ny + 0.48) / 0.32, 2)) *
      Math.exp(-Math.pow((Math.abs(nx) - 0.72) / 0.35, 2))
    xWidth += Math.sign(nx) * alarFlare * 0.0055
    zDepth -= alarFlare * 0.003

    pos.setXYZ(i, xWidth, yHeight, zDepth)

    // Assign exact head-space frontal UVs (noseGroup is positioned at y = -0.004 on the head)
    const [u, vCoord] = computeFrontalFaceUV(xWidth, yHeight - 0.004)
    uvAttr.setXY(i, u, vCoord)
  }

  uvAttr.needsUpdate = true
  geo.computeVertexNormals()
  return geo
}

let sharedNoseGeo: THREE.BufferGeometry | null = null

/**
 * Builds realistic 3D facial relief:
 * - Always uses `faceMat` on the 3D sculpted nose so the nose color & texture 100% match the face!
 * - When `photo-blend` mode is active with a real face photo, lets the aligned photographic eyes,
 *   eyebrows, nose, and smile shine on the 3D sculpted topography without covering them with cartoon capsules!
 * - When `sculpted` procedural mode is active, renders full 3D eyeballs, feathered 3D eyebrows, and 3D lips.
 */
function buildSculptedFaceRelief(
  head: THREE.Group,
  app: PlayerAppearance,
  skinMat: THREE.Material,
  faceMat: THREE.Material
) {
  const jawScale = clamp((app.jawWidth ?? 100) / 100, 0.88, 1.16)
  const noseScale = clamp((app.noseSize ?? 100) / 100, 0.82, 1.28)
  const browRad = ((app.browTilt ?? 0) * Math.PI) / 180

  const mode = app.faceMapMode ?? (app.faceCropDataUrl ? 'photo-blend' : 'sculpted')
  const isPhotoMapped = mode === 'photo-blend' && Boolean(app.faceCropDataUrl)

  const browHairMat = stdMat(adjustColorHex(app.hairColor, 0.75), 0.78, 0.02)
  const lashMat = stdMat('#14100e', 0.38, 0.02)
  const scleraMat = stdMat('#f6f8f4', 0.18, 0.01)
  const limbalMat = stdMat(adjustColorHex(app.eyeColor || '#261810', 0.48), 0.16, 0.05)
  const irisMat = stdMat(app.eyeColor || '#261810', 0.14, 0.08)
  const pupilMat = stdMat('#050607', 0.06, 0.12)
  const catchlightMat = new THREE.MeshBasicMaterial({ color: '#ffffff' })
  const caruncleMat = stdMat('#c96b63', 0.45, 0.02)

  // 1. Procedural 3D Eyes, Eyelids & Eyebrows (only when NOT mapping a real photographic face)
  if (!isPhotoMapped) {
    for (const side of [-1, 1] as const) {
      const eyeGroup = new THREE.Group()
      eyeGroup.position.set(side * 0.049, 0.018, 0.147)
      eyeGroup.rotation.y = side * 0.13
      head.add(eyeGroup)

      const sclera = addMesh(new THREE.SphereGeometry(0.021, 20, 16), scleraMat, eyeGroup, 0, 0, 0, false)
      sclera.scale.set(1.24, 0.78, 0.52)

      const caruncle = addMesh(
        new THREE.SphereGeometry(0.0042, 8, 8),
        caruncleMat,
        eyeGroup,
        -side * 0.021,
        -0.001,
        0.005,
        false
      )
      caruncle.scale.set(1.1, 0.7, 0.6)

      const limbal = addMesh(
        new THREE.SphereGeometry(0.0115, 16, 14),
        limbalMat,
        eyeGroup,
        -side * 0.001,
        0.001,
        0.0068,
        false
      )
      limbal.scale.set(1, 0.98, 0.36)

      const iris = addMesh(
        new THREE.SphereGeometry(0.0098, 16, 14),
        irisMat,
        eyeGroup,
        -side * 0.001,
        0.001,
        0.0082,
        false
      )
      iris.scale.set(1, 0.98, 0.34)

      const pupil = addMesh(
        new THREE.SphereGeometry(0.0052, 12, 12),
        pupilMat,
        eyeGroup,
        -side * 0.001,
        0.001,
        0.01,
        false
      )
      pupil.scale.set(1, 0.98, 0.3)

      addMesh(
        new THREE.SphereGeometry(0.0021, 8, 8),
        catchlightMat,
        eyeGroup,
        -0.0032,
        0.0035,
        0.0122,
        false
      )
      addMesh(
        new THREE.SphereGeometry(0.0011, 6, 6),
        catchlightMat,
        eyeGroup,
        0.0026,
        -0.0022,
        0.012,
        false
      )

      const upperLash = addMesh(
        new THREE.TorusGeometry(0.0215, 0.0024, 8, 20, Math.PI * 0.88),
        lashMat,
        eyeGroup,
        0,
        0.002,
        0.0065,
        false
      )
      upperLash.rotation.z = Math.PI * 0.06
      upperLash.scale.set(1.18, 0.68, 0.7)

      const upperLidFold = addMesh(
        new THREE.TorusGeometry(0.0225, 0.0032, 8, 20, Math.PI * 0.86),
        skinMat,
        eyeGroup,
        0,
        0.0045,
        0.005,
        false
      )
      upperLidFold.rotation.z = Math.PI * 0.07
      upperLidFold.scale.set(1.2, 0.65, 0.75)

      const lowerLidRim = addMesh(
        new THREE.TorusGeometry(0.021, 0.0022, 8, 18, Math.PI * 0.82),
        skinMat,
        eyeGroup,
        0,
        -0.0025,
        0.005,
        false
      )
      lowerLidRim.rotation.z = Math.PI + Math.PI * 0.09
      lowerLidRim.scale.set(1.18, 0.52, 0.68)

      const browGroup = new THREE.Group()
      browGroup.position.set(side * 0.049, 0.048, 0.154)
      browGroup.rotation.y = side * 0.18
      browGroup.rotation.z = -side * browRad
      head.add(browGroup)

      const browSegments = 7
      for (let b = 0; b < browSegments; b++) {
        const u = b / (browSegments - 1)
        const bx = side * (-0.018 + u * 0.042)
        const by = Math.sin(u * Math.PI * 0.88) * 0.0055 - (u > 0.65 ? (u - 0.65) * 0.008 : 0)
        const bz = -u * u * 0.005
        const radius = 0.0048 * (1 - u * 0.52)
        const seg = addMesh(
          new THREE.CapsuleGeometry(radius, 0.009, 5, 8),
          browHairMat,
          browGroup,
          bx,
          by,
          bz,
          false
        )
        seg.rotation.z = Math.PI / 2 + side * (u < 0.6 ? -0.14 : 0.28)
        seg.scale.set(0.85, 1, 0.55)
      }
    }
  }

  // 2. Continuous Sculpted 3D Nose — UV-mapped with `faceMat` so its color & photo texture 100% match the face!
  if (!sharedNoseGeo) sharedNoseGeo = createSculptedNoseGeometry()
  const noseGroup = new THREE.Group()
  noseGroup.position.set(0, -0.004, 0.156)
  noseGroup.scale.setScalar(noseScale)
  head.add(noseGroup)

  addMesh(sharedNoseGeo, faceMat, noseGroup, 0, 0, 0)

  // Recessed dark nostrils on the underside of the nose
  for (const side of [-1, 1] as const) {
    const nostril = addMesh(
      new THREE.SphereGeometry(0.004, 10, 8),
      lashMat,
      noseGroup,
      side * 0.0082,
      -0.022,
      0.008,
      false
    )
    nostril.scale.set(1.15, 0.36, 0.85)
  }

  // 3. Sculpted 3D Mouth & Cupid's-Bow Lips (only in procedural mode so real photo smiles aren't covered by capsules!)
  if (!isPhotoMapped) {
    const lipBase = new THREE.Color(app.skinTone).lerp(new THREE.Color('#8c3b38'), 0.42)
    const upperLipMat = stdMat(lipBase.clone().multiplyScalar(0.88).getHex(), 0.48)
    const lowerLipMat = stdMat(lipBase.clone().lerp(new THREE.Color('#e07a72'), 0.14).getHex(), 0.38)
    const mouthLineMat = stdMat(lipBase.clone().multiplyScalar(0.35).getHex(), 0.6)

    const mouthGroup = new THREE.Group()
    mouthGroup.position.set(0, -0.056, 0.161)
    head.add(mouthGroup)

    for (const side of [-1, 1] as const) {
      const upperWing = addMesh(
        new THREE.CapsuleGeometry(0.0062, 0.018, 6, 10),
        upperLipMat,
        mouthGroup,
        side * 0.0095,
        0.0038,
        0.002,
        false
      )
      upperWing.rotation.z = Math.PI / 2 + side * 0.14
      upperWing.rotation.y = -side * 0.18
      upperWing.scale.set(0.85, 1, 0.72)
    }

    const mouthPart = addMesh(
      new THREE.CapsuleGeometry(0.0018, 0.036, 4, 8),
      mouthLineMat,
      mouthGroup,
      0,
      0,
      0.003,
      false
    )
    mouthPart.rotation.z = Math.PI / 2

    const lowerLip = addMesh(
      new THREE.CapsuleGeometry(0.0074, 0.026, 8, 12),
      lowerLipMat,
      mouthGroup,
      0,
      -0.0052,
      0.0022,
      false
    )
    lowerLip.rotation.z = Math.PI / 2
    lowerLip.scale.set(0.88, 1, 0.78)
  }

  // 4. Anatomical Multi-Part 3D Ears (C-Helix Rim, Concha Bowl & Earlobe)
  const innerEarMat = stdMat(adjustColorHex(app.skinTone, 0.78), 0.65)
  for (const side of [-1, 1] as const) {
    const earGroup = new THREE.Group()
    earGroup.position.set(side * 0.142 * jawScale, -0.002, -0.008)
    earGroup.rotation.y = -side * 0.26
    earGroup.rotation.z = -side * 0.06
    head.add(earGroup)

    const concha = addMesh(
      new THREE.SphereGeometry(0.018, 14, 12),
      innerEarMat,
      earGroup,
      0,
      0,
      -0.002,
      false
    )
    concha.scale.set(0.38, 1.35, 0.85)

    const helix = addMesh(
      new THREE.TorusGeometry(0.019, 0.0055, 8, 20, Math.PI * 1.35),
      skinMat,
      earGroup,
      side * 0.002,
      0.003,
      0,
      false
    )
    helix.rotation.y = side === 1 ? Math.PI * 0.35 : -Math.PI * 0.35
    helix.rotation.z = side === 1 ? -Math.PI * 0.18 : Math.PI * 0.18
    helix.scale.set(0.82, 1.25, 0.75)

    const lobe = addMesh(
      new THREE.SphereGeometry(0.0085, 10, 10),
      skinMat,
      earGroup,
      -side * 0.001,
      -0.022,
      0.002,
      false
    )
    lobe.scale.set(0.65, 0.95, 0.75)
  }

  // 5. Sculpted 3D Mustache, Goatee & Boxed Beard
  if (app.beardStyle !== 'none') {
    const beardMat = new THREE.MeshStandardMaterial({
      map: getHairFiberTexture(app.hairColor),
      color: adjustColorHex(app.hairColor, 0.85),
      roughness: 0.84,
      metalness: 0.02,
      transparent: app.beardStyle === 'stubble',
      opacity: app.beardStyle === 'stubble' ? 0.52 : 0.96,
    })

    if (!isPhotoMapped) {
      for (const side of [-1, 1] as const) {
        const stacheWing = addMesh(
          new THREE.CapsuleGeometry(0.0052, 0.02, 6, 10),
          beardMat,
          head,
          side * 0.012,
          -0.044,
          0.161,
          false
        )
        stacheWing.rotation.z = Math.PI / 2 + side * 0.24
        stacheWing.rotation.y = -side * 0.16
        stacheWing.scale.set(0.75, 1, 0.55)
      }
    }

    if (app.beardStyle === 'goatee' || app.beardStyle === 'boxed-beard' || app.beardStyle === 'stubble') {
      const chinGoatee = addMesh(
        new THREE.SphereGeometry(0.036, 18, 14),
        beardMat,
        head,
        0,
        -0.112,
        0.132,
        false
      )
      chinGoatee.scale.set(0.95, 0.78, 0.65)
    }

    if (app.beardStyle === 'boxed-beard') {
      const jawBeard = addMesh(
        new THREE.SphereGeometry(0.145, 28, 20, 0, Math.PI * 2, Math.PI * 0.55, Math.PI * 0.42),
        beardMat,
        head,
        0,
        -0.018,
        0.012,
        false
      )
      jawBeard.scale.set(0.86 * jawScale, 1.06, 0.96)
    }
  }
}

function buildArticulatedHand(
  side: -1 | 1,
  mat: THREE.Material,
  isKeeper: boolean,
  accentMat: THREE.Material
): THREE.Group {
  const handGroup = new THREE.Group()
  handGroup.position.set(0, -0.265, 0.006)

  const palm = addMesh(
    new THREE.BoxGeometry(0.052, 0.064, 0.024),
    mat,
    handGroup,
    0,
    -0.026,
    0
  )
  palm.rotation.x = 0.06

  const knuckles = addMesh(
    new THREE.CylinderGeometry(0.012, 0.012, 0.052, 10),
    mat,
    handGroup,
    0,
    -0.056,
    0.002
  )
  knuckles.rotation.z = Math.PI / 2

  const thumbGroup = new THREE.Group()
  thumbGroup.position.set(-side * 0.024, -0.02, 0.009)
  thumbGroup.rotation.z = side * 0.52
  thumbGroup.rotation.x = 0.25
  handGroup.add(thumbGroup)

  addMesh(new THREE.CapsuleGeometry(0.009, 0.03, 5, 8), mat, thumbGroup, 0, -0.016, 0)

  const fingerOffsets = [-0.019, -0.0065, 0.0065, 0.019]
  const fingerLengths = [0.034, 0.04, 0.036, 0.028]
  const fingerRadii = [0.0074, 0.0078, 0.0074, 0.0064]

  for (let i = 0; i < 4; i++) {
    const fx = side * fingerOffsets[i]
    const len = fingerLengths[i]
    const r = fingerRadii[i]

    const finger = new THREE.Group()
    finger.position.set(fx, -0.056, 0.002)
    finger.rotation.x = 0.24 + i * 0.04
    handGroup.add(finger)

    addMesh(new THREE.CapsuleGeometry(r, len, 5, 8), mat, finger, 0, -len * 0.55, 0)
  }

  if (isKeeper) {
    addMesh(
      new THREE.BoxGeometry(0.046, 0.048, 0.008),
      accentMat,
      handGroup,
      0,
      -0.026,
      -0.013
    )
  }

  return handGroup
}

/**
 * Creates a smooth, continuous 3D athletic jersey torso geometry using differentiable C1/C2 polynomials
 * (using x^2 instead of |x| so there is ZERO vertical ridge/crease down the sternum!)
 * and natural sloping trapezius-to-deltoid shoulders.
 */
function createSculptedTorsoGeometry(): THREE.BufferGeometry {
  const profile: THREE.Vector2[] = [
    new THREE.Vector2(0.228, 0.0),   // Jersey bottom hem overhanging shorts waist
    new THREE.Vector2(0.214, 0.14),  // Athletic waist taper
    new THREE.Vector2(0.226, 0.28),  // Lower ribs / obliques
    new THREE.Vector2(0.252, 0.44),  // Lats V-taper
    new THREE.Vector2(0.268, 0.56),  // Full pectoral & deltoid span
    new THREE.Vector2(0.235, 0.63),  // Smooth acromion shoulder curve
    new THREE.Vector2(0.168, 0.68),  // Trapezius slope
    new THREE.Vector2(0.092, 0.72),  // Collar neck opening
  ]

  const segments = 48
  const geo = new THREE.LatheGeometry(profile, segments)
  const pos = geo.attributes.position
  const v = new THREE.Vector3()

  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i)
    const ny = v.y / 0.72

    // Smooth elliptical athletic chest/waist cross-section
    const shoulderWidening = 1.03 + Math.sin(ny * Math.PI * 0.82) * 0.12
    v.x *= shoulderWidening
    v.z *= 0.68

    // Differentiable C2 pectoral curve using (x / 0.26)^2 — ZERO sharp vertical crease at x = 0!
    const xNormSq = Math.min(1, (v.x * v.x) / (0.25 * 0.25))
    if (v.z > 0 && ny > 0.38 && ny < 0.86) {
      const pecY = Math.sin(((ny - 0.38) / 0.48) * Math.PI)
      const pecX = (1 - xNormSq) * (1 - xNormSq)
      v.z += pecY * pecX * 0.022
    }

    // Smooth upper back contour
    if (v.z < 0 && ny > 0.42 && ny < 0.86) {
      const backY = Math.sin(((ny - 0.42) / 0.44) * Math.PI)
      v.z -= backY * (1 - xNormSq) * 0.012
    }

    // Smooth anatomical shoulder drop using x^2 (NOT |x|!) so top of chest is 100% smooth
    if (ny > 0.68) {
      v.y -= xNormSq * 0.042 * ((ny - 0.68) / 0.32)
    }

    pos.setXYZ(i, v.x, v.y, v.z)
  }

  geo.computeVertexNormals()

  // Weld seam normals along the LatheGeometry seam (first and last ring column) so there is zero lighting seam!
  const normalAttr = geo.attributes.normal
  const ringStride = profile.length
  const totalCols = segments + 1
  for (let r = 0; r < ringStride; r++) {
    const idx0 = r
    const idxLast = (totalCols - 1) * ringStride + r
    const nx = (normalAttr.getX(idx0) + normalAttr.getX(idxLast)) * 0.5
    const ny = (normalAttr.getY(idx0) + normalAttr.getY(idxLast)) * 0.5
    const nz = (normalAttr.getZ(idx0) + normalAttr.getZ(idxLast)) * 0.5
    const len = Math.hypot(nx, ny, nz) || 1
    normalAttr.setXYZ(idx0, nx / len, ny / len, nz / len)
    normalAttr.setXYZ(idxLast, nx / len, ny / len, nz / len)
  }
  normalAttr.needsUpdate = true

  return geo
}

let sharedTorsoGeo: THREE.BufferGeometry | null = null

function createSculptedCalfGeometry(): THREE.BufferGeometry {
  const pts: THREE.Vector2[] = [
    new THREE.Vector2(0.052, 0.0),
    new THREE.Vector2(0.055, 0.07),
    new THREE.Vector2(0.068, 0.16),
    new THREE.Vector2(0.083, 0.25),
    new THREE.Vector2(0.078, 0.33),
    new THREE.Vector2(0.075, 0.37),
  ]
  const geo = new THREE.LatheGeometry(pts, 24)
  geo.translate(0, -0.37, 0)

  const pos = geo.attributes.position
  const v = new THREE.Vector3()
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i)
    const t = (v.y + 0.37) / 0.37
    const calfSwell = Math.sin(t * Math.PI)
    if (v.z < 0) {
      v.z *= 1 + calfSwell * 0.22
    } else {
      v.z *= 0.95
    }
    v.x *= 0.95
    pos.setXYZ(i, v.x, v.y, v.z)
  }
  geo.computeVertexNormals()
  return geo
}

let sharedCalfGeo: THREE.BufferGeometry | null = null

function makeKitDecal(
  name: string,
  number: number,
  team: 0 | 1,
  back: boolean,
  keeper: boolean,
  app: PlayerAppearance,
  customImg?: HTMLImageElement
) {
  const c = document.createElement('canvas')
  c.width = 256
  c.height = 320
  const ctx = c.getContext('2d')!
  ctx.clearRect(0, 0, 256, 320)
  ctx.textAlign = 'center'

  const textColor = keeper ? '#11181c' : team === 0 ? '#0c2738' : '#f4f7ef'
  const outlineColor = keeper ? 'rgba(255,255,255,0.75)' : team === 0 ? 'rgba(255,255,255,0.82)' : 'rgba(0,0,0,0.65)'

  if (back) {
    ctx.font = '800 32px "Arial Narrow", Arial, sans-serif'
    ctx.strokeStyle = outlineColor
    ctx.lineWidth = 5
    ctx.strokeText(name.toUpperCase().slice(0, 11), 128, 56)
    ctx.fillStyle = textColor
    ctx.fillText(name.toUpperCase().slice(0, 11), 128, 56)

    ctx.font = '900 158px "Arial Narrow", Impact, sans-serif'
    ctx.lineWidth = 7
    ctx.strokeText(String(number), 128, 224)
    ctx.fillText(String(number), 128, 224)
  } else {
    // Embroidered Club Crest on Left Chest
    ctx.save()
    ctx.beginPath()
    ctx.arc(174, 54, 18, 0, Math.PI * 2)
    ctx.fillStyle = team === 0 ? '#0f354d' : '#dfff57'
    ctx.fill()
    ctx.lineWidth = 2.5
    ctx.strokeStyle = '#f59e0b'
    ctx.stroke()
    ctx.fillStyle = team === 0 ? '#dfff57' : '#0f2822'
    ctx.font = '900 13px sans-serif'
    ctx.fillText(team === 0 ? 'FCB' : 'RIV', 174, 59)
    ctx.restore()

    // Kit Maker Swoosh on Right Chest
    ctx.strokeStyle = team === 0 ? '#f59e0b' : '#dfff57'
    ctx.lineWidth = 4
    ctx.beginPath()
    ctx.moveTo(68, 56)
    ctx.quadraticCurveTo(76, 63, 94, 48)
    ctx.stroke()

    // Front Squad Number (shifted slightly up or down if custom 3D chest decal is active)
    const hasChestDecal =
      customImg &&
      app.customDecalDataUrl &&
      (!app.customDecalTarget || app.customDecalTarget === 'chest' || app.customDecalTarget === 'both')

    ctx.font = `900 ${hasChestDecal ? 52 : 76}px "Arial Narrow", Impact, sans-serif`
    ctx.strokeStyle = outlineColor
    ctx.lineWidth = 4.5
    const numY = hasChestDecal ? 268 : 165
    ctx.strokeText(String(number), 128, numY)
    ctx.fillStyle = textColor
    ctx.fillText(String(number), 128, numY)
  }

  const texture = new THREE.CanvasTexture(c)
  texture.colorSpace = THREE.SRGBColorSpace
  return new THREE.MeshBasicMaterial({
    map: texture,
    transparent: true,
    side: THREE.DoubleSide,
    depthWrite: false,
    polygonOffset: true,
    polygonOffsetFactor: -1,
  })
}

function makeContactShadowTexture() {
  const c = document.createElement('canvas')
  c.width = 64
  c.height = 64
  const ctx = c.getContext('2d')!
  const grad = ctx.createRadialGradient(32, 32, 4, 32, 32, 30)
  grad.addColorStop(0, 'rgba(4, 18, 10, 0.56)')
  grad.addColorStop(0.65, 'rgba(4, 18, 10, 0.24)')
  grad.addColorStop(1, 'rgba(4, 18, 10, 0)')
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, 64, 64)
  const tex = new THREE.CanvasTexture(c)
  tex.colorSpace = THREE.SRGBColorSpace
  return tex
}

let sharedShadowTex: THREE.CanvasTexture | null = null

function makeAthleticLimb(
  parent: THREE.Group,
  x: number,
  y: number,
  z: number,
  side: -1 | 1,
  isLeg: boolean,
  isKeeper: boolean,
  upperClothMat: THREE.Material,
  skinMat: THREE.Material,
  thighSkinMat: THREE.Material,
  lowerMat: THREE.Material,
  bootMat: THREE.Material,
  trimMat: THREE.Material
): LimbRig {
  const upper = new THREE.Group()
  upper.position.set(x, y, z)
  parent.add(upper)

  if (isLeg) {
    // 1. Hip-socket shorts bridge at (0, 0, 0) so high-amplitude 3D IK hip flexion/abduction never gaps at the pelvis
    const hipSocketBridge = addMesh(
      new THREE.SphereGeometry(0.11, 18, 14),
      upperClothMat,
      upper,
      0,
      -0.01,
      0
    )
    hipSocketBridge.scale.set(1.02, 0.86, 0.9)

    // Tailored Individual Shorts Leg with baked side-stripe & hem trim texture (NO floating boxes!)
    const shortsSleeve = addMesh(
      new THREE.CylinderGeometry(0.114, 0.104, 0.23, 24),
      upperClothMat,
      upper,
      0,
      -0.105,
      0
    )
    shortsSleeve.scale.set(1.02, 1, 0.92)

    // 2. Continuous Sculpted Quadriceps & Knee Joint (eliminates wooden action-figure ball-joint gap!)
    const quadAndKnee = addMesh(
      new THREE.CylinderGeometry(0.091, 0.074, 0.25, 24),
      thighSkinMat,
      upper,
      0,
      -0.315,
      0.002
    )
    quadAndKnee.rotation.y = -Math.PI / 2
    quadAndKnee.scale.set(0.95, 1, 1.02)

    // Vastus medialis teardrop muscle contour above inner knee
    const vastusMedialis = addMesh(
      new THREE.SphereGeometry(0.048, 14, 12),
      skinMat,
      upper,
      -side * 0.016,
      -0.345,
      0.018
    )
    vastusMedialis.scale.set(0.82, 1.38, 0.72)

    // Anatomical femoral condyle bridge centered at the knee pivot (0, -0.43, 0) for zero hinge gap up to 125 deg flexion
    const kneeCondyleBridge = addMesh(
      new THREE.SphereGeometry(0.071, 18, 14),
      skinMat,
      upper,
      0,
      -0.428,
      0
    )
    kneeCondyleBridge.scale.set(0.95, 0.96, 0.98)

    // Subtle, flat-contoured Anatomical Patella (blended smoothly into the front of the knee, NOT a round ball!)
    const patellaContour = addMesh(
      new THREE.SphereGeometry(0.042, 16, 12),
      skinMat,
      upper,
      0,
      -0.412,
      0.036
    )
    patellaContour.scale.set(0.84, 1.08, 0.38)

    // 3. Lower Leg Group (pivots at knee y = -0.43)
    const lower = new THREE.Group()
    lower.position.set(0, -0.43, 0)
    upper.add(lower)

    // Seamless knee-to-shin skin overlap cylinder
    const upperShin = addMesh(
      new THREE.CylinderGeometry(0.073, 0.074, 0.068, 20),
      skinMat,
      lower,
      0,
      -0.018,
      0.001
    )
    upperShin.scale.set(0.95, 1, 1.0)

    // Ribbed Football Sock Turnover Cuff
    addMesh(
      new THREE.CylinderGeometry(0.079, 0.077, 0.044, 20),
      trimMat,
      lower,
      0,
      -0.062,
      -0.001
    )

    if (!sharedCalfGeo) sharedCalfGeo = createSculptedCalfGeometry()
    addMesh(sharedCalfGeo, lowerMat, lower, 0, -0.05, 0)

    // Pro Ankle Grip Tape Wrap
    addMesh(
      new THREE.CylinderGeometry(0.055, 0.058, 0.075, 16),
      stdMat('#f4f7f2', 0.65),
      lower,
      0,
      -0.375,
      0
    )

    // 4. Sculpted Pro Football Cleat (Boot) pivoting at the true anatomical ankle joint (0, -0.43, 0)
    const bootGroup = new THREE.Group()
    bootGroup.position.set(0, -0.43, 0)
    lower.add(bootGroup)

    // Ankle malleolus collar bridge so dorsiflexion/plantarflexion & eversion never detach the boot from the sock
    const ankleBridge = addMesh(
      new THREE.SphereGeometry(0.054, 14, 12),
      stdMat('#f4f7f2', 0.65),
      bootGroup,
      0,
      0.014,
      0
    )
    ankleBridge.scale.set(0.96, 1.05, 0.98)

    const bootVamp = addMesh(
      new THREE.CapsuleGeometry(0.056, 0.165, 10, 16),
      bootMat,
      bootGroup,
      0,
      0.012,
      0.074
    )
    bootVamp.rotation.x = Math.PI / 2 - 0.09
    bootVamp.scale.set(1.04, 1, 0.72)

    const heelCup = addMesh(
      new THREE.CylinderGeometry(0.056, 0.058, 0.068, 14),
      bootMat,
      bootGroup,
      0,
      0.024,
      0.0
    )
    heelCup.scale.set(0.95, 1, 0.95)

    addMesh(
      new THREE.BoxGeometry(0.112, 0.018, 0.265),
      stdMat('#12171a', 0.3, 0.25),
      bootGroup,
      0,
      -0.028,
      0.072
    )

    return { upper, lower, footOrHand: bootGroup }
  } else {
    // NATURAL HUMAN SHOULDER & SLEEVE (tucked cleanly under the clavicle/acromion slope—NO puff-sleeve balls!)
    const shoulderCap = addMesh(
      new THREE.SphereGeometry(0.076, 16, 14),
      upperClothMat,
      upper,
      -side * 0.008,
      -0.028,
      0
    )
    shoulderCap.scale.set(0.92, 0.88, 0.88)

    const sleeve = addMesh(
      new THREE.CylinderGeometry(0.076, 0.066, 0.155, 18),
      upperClothMat,
      upper,
      0,
      -0.1,
      0
    )
    sleeve.scale.set(0.95, 1, 0.94)

    addMesh(
      new THREE.CylinderGeometry(0.068, 0.066, 0.02, 18),
      trimMat,
      upper,
      0,
      -0.175,
      0
    )

    // Seamless Bicep-to-Elbow Taper (eliminates wooden action-figure elbow line!)
    const bicep = addMesh(
      new THREE.CylinderGeometry(0.061, 0.054, 0.175, 16),
      skinMat,
      upper,
      0,
      -0.25,
      0
    )
    bicep.scale.set(0.94, 1, 1.0)

    const elbowJoint = addMesh(
      new THREE.SphereGeometry(0.053, 14, 12),
      skinMat,
      upper,
      0,
      -0.33,
      0
    )
    elbowJoint.scale.set(0.94, 0.95, 0.98)

    const lower = new THREE.Group()
    lower.position.set(0, -0.33, 0)
    upper.add(lower)

    const forearm = addMesh(
      new THREE.CylinderGeometry(0.054, 0.041, 0.22, 16),
      skinMat,
      lower,
      0,
      -0.115,
      0
    )
    forearm.scale.set(0.94, 1, 1.02)

    addMesh(
      new THREE.CylinderGeometry(0.044, 0.043, 0.034, 14),
      stdMat('#f4f7f2', 0.65),
      lower,
      0,
      -0.24,
      0
    )

    const hand = buildArticulatedHand(side, lowerMat, isKeeper, trimMat)
    lower.add(hand)

    return { upper, lower, footOrHand: hand }
  }
}

export function computeAppearanceKey(p: BuildPlayerOptions): string {
  const a = p.appearance ?? defaultAppearanceForIndex(p.id)
  const decalHash = a.customDecalDataUrl ? `${a.customDecalDataUrl.length}:${a.customDecalDataUrl.slice(-24)}` : 'none'
  const faceHash = a.faceCropDataUrl ? `${a.faceCropDataUrl.length}:${a.faceCropDataUrl.slice(-20)}` : 'none'
  const torsoHash = a.customTorsoDataUrl ? `${a.customTorsoDataUrl.length}:${a.customTorsoDataUrl.slice(-20)}` : 'none'
  return `${p.name}|${p.number}|${p.radius.toFixed(1)}|${a.skinTone}|${a.hairStyle}|${a.hairColor}|${a.eyeColor}|${a.beardStyle}|${a.noseSize}|${a.browTilt}|${a.jawWidth}|${a.bootColor}|${decalHash}|${a.customDecalTarget ?? 'chest'}|${a.customDecalShape ?? 'shield'}|${a.customDecalDepth ?? 85}|${a.faceMapMode ?? 'sculpted'}|${faceHash}|${torsoHash}|${a.customJerseyColor ?? ''}|${a.customJerseyTrimColor ?? ''}|${a.customShortsColor ?? ''}|${a.customSocksColor ?? ''}`
}

function getOrLoadImage(dataUrl?: string, onReady?: (img: HTMLImageElement) => void): HTMLImageElement | undefined {
  if (!dataUrl) return undefined
  let img = loadedImageCache.get(dataUrl)
  if (!img) {
    img = new Image()
    img.crossOrigin = 'anonymous'
    img.src = dataUrl
    loadedImageCache.set(dataUrl, img)
  }
  if (onReady && (!img.complete || img.naturalWidth === 0)) {
    img.addEventListener('load', () => onReady(img!), { once: true })
  }
  return img
}

export function buildAthleticPlayerRig(
  p: BuildPlayerOptions,
  labelFactory?: (name: string, number: number, keeper: boolean) => THREE.Sprite
): PlayerRig3D {
  const group = new THREE.Group()
  const body = new THREE.Group()
  const scale = p.radius / 15
  group.add(body)
  group.scale.setScalar(scale)

  const app = p.appearance ?? defaultAppearanceForIndex(p.id)

  // Load distinct images for chest decal, isolated face crop, and full-body torso fabric
  const customImg = getOrLoadImage(app.customDecalDataUrl)
  const faceCropImg = getOrLoadImage(app.faceCropDataUrl)
  const customTorsoImg = getOrLoadImage(app.customTorsoDataUrl)

  const skin = skinShaderMat(app.skinTone)
  const thighSkin = skinShaderMat('#ffffff', getThighKneeSkinTexture(app.skinTone))

  const keeperHome = p.keeper && p.team === 0
  const keeperAway = p.keeper && p.team === 1
  const defaultTrim = keeperHome ? '#0f291e' : keeperAway ? '#f3f5ed' : p.team === 0 ? '#f59e0b' : '#dfff57'
  const defaultShorts = keeperHome ? '#14843b' : keeperAway ? '#1d272c' : p.team === 0 ? '#112c42' : '#112a2d'
  const defaultSocks = keeperHome ? '#1db954' : keeperAway ? '#7c3aed' : p.team === 0 ? '#112c42' : '#183f42'

  const trimColor = (!p.keeper && app.customJerseyTrimColor) ? app.customJerseyTrimColor : defaultTrim
  const shortsColor = (!p.keeper && app.customShortsColor) ? app.customShortsColor : defaultShorts
  const socksColor = (!p.keeper && app.customSocksColor) ? app.customSocksColor : defaultSocks

  const shirt = new THREE.MeshStandardMaterial({
    map: getKitJerseyTexture(
      p.team,
      p.keeper,
      !p.keeper ? app.customJerseyColor : undefined,
      !p.keeper ? app.customJerseyTrimColor : undefined,
      !p.keeper && customTorsoImg && customTorsoImg.complete && customTorsoImg.naturalWidth > 0
        ? customTorsoImg
        : undefined
    ),
    roughness: 0.64,
    metalness: 0.03,
  })
  if (!p.keeper && customTorsoImg && (!customTorsoImg.complete || customTorsoImg.naturalWidth === 0)) {
    customTorsoImg.addEventListener(
      'load',
      () => {
        shirt.map = getKitJerseyTexture(
          p.team,
          p.keeper,
          app.customJerseyColor,
          app.customJerseyTrimColor,
          customTorsoImg
        )
        shirt.needsUpdate = true
      },
      { once: true }
    )
  }

  const trim = stdMat(trimColor, 0.5, 0.05)
  const shortsSolid = stdMat(shortsColor, 0.72, 0.02)
  const shortsLegMat = new THREE.MeshStandardMaterial({
    map: getShortsTexture(shortsColor, trimColor),
    roughness: 0.72,
    metalness: 0.02,
  })
  const socks = stdMat(socksColor, 0.68, 0.02)
  const boots = new THREE.MeshPhysicalMaterial({
    color: app.bootColor || '#dfff57',
    roughness: 0.24,
    metalness: 0.14,
    clearcoat: 0.72,
  })
  const handOrGlove = p.keeper ? stdMat('#f4f7f2', 0.42) : skin

  if (!sharedShadowTex) sharedShadowTex = makeContactShadowTexture()
  const shadowDisc = new THREE.Mesh(
    new THREE.PlaneGeometry(1.05, 1.05),
    new THREE.MeshBasicMaterial({
      map: sharedShadowTex,
      transparent: true,
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: -1,
    })
  )
  shadowDisc.rotation.x = -Math.PI / 2
  shadowDisc.position.y = 0.015
  group.add(shadowDisc)

  // 1. Tailored Pelvis / Shorts Waistband (tucked cleanly inside the jersey hem at y = 0.89 so it NEVER pokes through the shirt!)
  const pelvis = new THREE.Group()
  pelvis.position.y = 0.89
  body.add(pelvis)

  const shortsWaist = addMesh(
    new THREE.CylinderGeometry(0.198, 0.218, 0.13, 24),
    shortsSolid,
    pelvis,
    0,
    0.015,
    0
  )
  shortsWaist.scale.set(1.0, 1, 0.62)

  for (const side of [-1, 1] as const) {
    const hipRound = addMesh(
      new THREE.SphereGeometry(0.112, 16, 14),
      shortsSolid,
      pelvis,
      side * 0.122,
      -0.015,
      -0.004
    )
    hipRound.scale.set(1.0, 0.92, 0.88)
  }

  // 2. Seamless Sculpted Athletic Jersey Torso (overhangs shorts cleanly at y = 0.92)
  const torso = new THREE.Group()
  torso.position.y = 0.92
  body.add(torso)

  if (!sharedTorsoGeo) sharedTorsoGeo = createSculptedTorsoGeometry()
  addMesh(sharedTorsoGeo, shirt, torso, 0, 0, 0)

  // Sleek, flush V-neck collar band (NOT a thick yellow donut ring!)
  const collar = addMesh(
    new THREE.TorusGeometry(0.094, 0.009, 10, 28),
    trim,
    torso,
    0,
    0.715,
    0.005
  )
  collar.rotation.x = Math.PI / 2 + 0.16
  collar.scale.set(1.0, 0.86, 0.7)

  const frontDecal = addMesh(
    new THREE.PlaneGeometry(0.24, 0.3),
    makeKitDecal(p.name, p.number, p.team, false, p.keeper, app, customImg),
    torso,
    0,
    0.45,
    0.194,
    false
  )
  const backDecal = addMesh(
    new THREE.PlaneGeometry(0.32, 0.4),
    makeKitDecal(p.name, p.number, p.team, true, p.keeper, app, customImg),
    torso,
    0,
    0.44,
    -0.19,
    false
  )
  backDecal.rotation.y = Math.PI
  frontDecal.renderOrder = 2
  backDecal.renderOrder = 2

  // 2B. Custom Uploaded Photo -> 3D Normal-Mapped Relief Emblem / Decal on Chest (only if no full-torso texture already covers chest, or if explicitly requested)
  const showChestDecal =
    app.customDecalDataUrl &&
    !app.customTorsoDataUrl &&
    (!app.customDecalTarget || app.customDecalTarget === 'chest' || app.customDecalTarget === 'both')
  if (showChestDecal && customImg) {
    const apply3DDecalMesh = (imgEl: HTMLImageElement) => {
      const shape = app.customDecalShape ?? 'shield'
      const depth = app.customDecalDepth ?? 85
      const dKey = `${app.customDecalDataUrl?.slice(-32)}|${shape}|${depth}`
      let asset = decal3DCache.get(dKey)
      if (!asset) {
        asset = build3DDecalAssetFromImage(imgEl, shape, depth)
        decal3DCache.set(dKey, asset)
      }
      // Curved 3D relief patch conforming to the player's pectoral chest contour
      const patchGeo = new THREE.PlaneGeometry(0.18, 0.18, 16, 16)
      const pPos = patchGeo.attributes.position
      for (let i = 0; i < pPos.count; i++) {
        const px = pPos.getX(i)
        const py = pPos.getY(i)
        const curveZ = -((px * px) * 0.85 + (py * py) * 0.35)
        pPos.setZ(i, curveZ)
      }
      patchGeo.computeVertexNormals()

      const patchMat = new THREE.MeshStandardMaterial({
        map: asset.colorTex,
        normalMap: asset.normalTex,
        normalScale: new THREE.Vector2((depth / 100) * 1.6, (depth / 100) * 1.6),
        roughness: 0.32,
        metalness: 0.18,
        transparent: true,
        side: THREE.DoubleSide,
        polygonOffset: true,
        polygonOffsetFactor: -2,
      })
      const patchMesh = addMesh(patchGeo, patchMat, torso, 0, 0.45, 0.198, false)
      patchMesh.renderOrder = 3
    }

    if (customImg.complete && customImg.naturalWidth > 0) {
      apply3DDecalMesh(customImg)
    } else {
      customImg.addEventListener('load', () => {
        apply3DDecalMesh(customImg)
      }, { once: true })
    }
  }

  // 3. Sculpted Muscular Neck
  const neck = new THREE.Group()
  neck.position.set(0, 0.7, 0)
  torso.add(neck)

  const neckCol = addMesh(
    new THREE.CylinderGeometry(0.072, 0.088, 0.15, 18),
    skin,
    neck,
    0,
    0.055,
    0.004
  )
  neckCol.scale.set(0.96, 1, 0.92)

  // 4. Sculpted 3D Head with High-Definition Skin/Hair/Beard Map (NEVER stamps torso/shorts onto face!)
  const head = new THREE.Group()
  head.position.set(0, 0.215, 0.012)
  neck.add(head)

  const jawScale = clamp((app.jawWidth ?? 100) / 100, 0.88, 1.16)
  const readyFaceImg =
    faceCropImg && faceCropImg.complete && faceCropImg.naturalWidth > 0 ? faceCropImg : undefined
  const faceTex = getRealisticFaceTexture(app, readyFaceImg)
  const faceMat = new THREE.MeshStandardMaterial({
    map: faceTex,
    roughness: 0.54,
    metalness: 0.02,
  })

  const effectiveFaceMode = app.faceMapMode ?? (app.faceCropDataUrl ? 'photo-blend' : 'sculpted')

  if (faceCropImg && (!faceCropImg.complete || faceCropImg.naturalWidth === 0)) {
    faceCropImg.addEventListener(
      'load',
      () => {
        faceTextureCache.clear()
        faceMat.map = getRealisticFaceTexture(app, faceCropImg)
        if (effectiveFaceMode === 'photo-blend') {
          const depth = app.customDecalDepth ?? 65
          const dKey = `face|${app.faceCropDataUrl?.slice(-32)}|full|${depth}`
          let asset = decal3DCache.get(dKey)
          if (!asset) {
            asset = build3DDecalAssetFromImage(faceCropImg, 'full', depth)
            decal3DCache.set(dKey, asset)
          }
          faceMat.normalMap = asset.normalTex
          faceMat.normalScale = new THREE.Vector2((depth / 100) * 0.28, (depth / 100) * 0.28)
        }
        faceMat.needsUpdate = true
      },
      { once: true }
    )
  }

  // Optional 3D normal-map micro-relief ONLY from the isolated face crop when in photo-blend mode
  if (readyFaceImg && effectiveFaceMode === 'photo-blend') {
    const depth = app.customDecalDepth ?? 65
    const dKey = `face|${app.faceCropDataUrl?.slice(-32)}|full|${depth}`
    let asset = decal3DCache.get(dKey)
    if (!asset) {
      asset = build3DDecalAssetFromImage(readyFaceImg, 'full', depth)
      decal3DCache.set(dKey, asset)
    }
    faceMat.normalMap = asset.normalTex
    faceMat.normalScale = new THREE.Vector2((depth / 100) * 0.28, (depth / 100) * 0.28)
  }

  const headGeo = createSculptedHeadGeometry(jawScale)
  addMesh(headGeo, faceMat, head, 0, 0, 0)

  buildHairMesh(head, app)
  buildSculptedFaceRelief(head, app, skin, faceMat)

  // 5. Legs & Arms (Arms tucked at x = ±0.242, y = 0.555 underneath the natural acromion slope!)
  const leftLeg = makeAthleticLimb(pelvis, -0.126, 0, 0, -1, true, p.keeper, shortsLegMat, skin, thighSkin, socks, boots, trim)
  const rightLeg = makeAthleticLimb(pelvis, 0.126, 0, 0, 1, true, p.keeper, shortsLegMat, skin, thighSkin, socks, boots, trim)

  const leftArm = makeAthleticLimb(torso, -0.242, 0.555, 0, -1, false, p.keeper, shirt, skin, thighSkin, handOrGlove, boots, trim)
  const rightArm = makeAthleticLimb(torso, 0.242, 0.555, 0, 1, false, p.keeper, shirt, skin, thighSkin, handOrGlove, boots, trim)

  const ring = addMesh(
    new THREE.RingGeometry(0.48, 0.58, 44),
    new THREE.MeshBasicMaterial({
      color: '#dfff57',
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.95,
    }),
    group,
    0,
    0.024,
    0,
    false
  )
  ring.rotation.x = -Math.PI / 2
  ring.visible = p.includeRing ?? false

  let label: THREE.Sprite | undefined
  if (p.includeLabel && labelFactory) {
    label = labelFactory(p.name, p.number, p.keeper)
    label.position.set(0, 2.42, 0)
    group.add(label)
  }

  return {
    group,
    body,
    pelvis,
    torso,
    neck,
    head,
    leftLeg,
    rightLeg,
    leftArm,
    rightArm,
    ring,
    shadowDisc,
    label,
    phase: p.id * 0.73,
    scale,
    appearanceKey: computeAppearanceKey(p),
  }
}

export interface SpatialLegIKInput {
  /** Lateral ankle offset from hip socket (m) */
  targetX: number
  /** Vertical ankle offset from hip socket (m, < 0 downward) */
  targetY: number
  /** Forward/backward ankle offset from hip socket (m, +Z forward) */
  targetZ: number
  /** Internal/external hip & knee pole-vector swivel (rad) */
  kneeSwivelY?: number
  /** Whether the foot is in ground-contact stance phase */
  isStance: boolean
  /** Progression through stance phase (0 = heel strike, 0.45 = mid-stance, 1 = toe-off) */
  stanceProgress: number
  /** Pelvis sagittal pitch (rad) for ground-normal ankle compensation */
  pelvisPitch?: number
  /** Pelvis + body frontal roll (rad) for flat-cleat ankle eversion compensation */
  pelvisRoll?: number
  /** Extra foot pitch offset (rad, e.g. laces lock during kick) */
  footPitchOffset?: number
}

export interface SpatialLegIKResult {
  hipX: number
  hipY: number
  hipZ: number
  kneeX: number
  ankleX: number
  ankleY: number
  ankleZ: number
  soleRelPelvisY: number
}

/**
 * Full 3D Spatial 2-Bone Inverse Kinematics solver for the human thigh (L1 = 0.43m),
 * shin/calf (L2 = 0.43m), and 3-DOF talocrural/subtalar ankle joint.
 * Enforces anatomical pole-vector knee hinge constraints (0.04..2.18 rad) and solves
 * heel-strike -> flat mid-stance -> plantarflexion toe-off ankle articulation.
 */
export function solveSpatialLegIK(input: SpatialLegIKInput): SpatialLegIKResult {
  const L1 = 0.43
  const L2 = 0.43
  const maxReach = L1 + L2 - 0.0025

  const pelvisPitch = input.pelvisPitch ?? 0
  const pelvisRoll = input.pelvisRoll ?? 0
  const kneeSwivelY = input.kneeSwivelY ?? 0

  // 1. Frontal-plane hip abduction/adduction (hipZ) to reach lateral targetX
  const safeDownY = Math.max(0.22, -input.targetY)
  const hipZ = clamp(Math.atan2(input.targetX, safeDownY), -0.52, 0.52)

  // 2. Eccentric mid-stance knee-flexion shock absorption (natural athletic compliance on impact)
  const shockCompression = input.isStance ? Math.sin(input.stanceProgress * Math.PI) * 0.022 : 0
  const planarY = -Math.hypot(input.targetX, safeDownY) + shockCompression

  // 3. Sagittal 2-bone Law of Cosines for thigh (L1) and shin (L2)
  const rawDist = Math.hypot(planarY, input.targetZ)
  const r = clamp(rawDist, 0.22, maxReach)

  const cosKnee = clamp((L1 * L1 + L2 * L2 - r * r) / (2 * L1 * L2), -1, 1)
  // Exterior knee flexion angle (>= 0 so knee strictly hinges backward around the anatomical patella)
  const kneeX = clamp(Math.PI - Math.acos(cosKnee), 0.04, 2.18)

  const alpha = Math.atan2(input.targetZ, -planarY)
  const beta = Math.atan2(L2 * Math.sin(kneeX), L1 + L2 * Math.cos(kneeX))
  const hipX = clamp(-(alpha + beta) - pelvisPitch * 0.42, -1.65, 1.35)
  const hipY = clamp(kneeSwivelY, -0.52, 0.52)

  // 4. 3-DOF Ankle Articulation (dorsiflexion/plantarflexion ankleX, inversion/eversion ankleZ, rotation ankleY)
  const shinWorldPitch = pelvisPitch + hipX + kneeX
  let ankleX = 0
  let ankleY = 0
  let ankleZ = 0

  if (input.isStance) {
    // Heel-strike dorsiflexion (stanceProgress = 0) -> flat mid-stance -> explosive plantarflexion toe-off (stanceProgress = 1)
    const strikeDorsiflex = Math.max(0, 1 - input.stanceProgress * 3.1) * -0.22
    const pushPlantarflex =
      Math.pow(clamp((input.stanceProgress - 0.44) / 0.56, 0, 1), 1.45) * 0.48
    ankleX = clamp(
      -shinWorldPitch * 0.86 + strikeDorsiflex + pushPlantarflex + (input.footPitchOffset ?? 0),
      -0.68,
      0.82
    )
    // Subtalar ankle eversion/inversion keeps the cleat sole flush with the turf during hip shifts & banking
    ankleZ = clamp(-(hipZ + pelvisRoll) * 0.84, -0.44, 0.44)
    ankleY = clamp(-hipY * 0.35, -0.32, 0.32)
  } else {
    // Swing phase: active dorsiflexion lifts toe to clear the turf during forward recovery; plantarflexion on kick/push
    const swingDorsiflex =
      -0.16 - Math.max(0, -hipX) * 0.24 + Math.max(0, kneeX - 0.85) * 0.2 + (input.footPitchOffset ?? 0)
    ankleX = clamp(swingDorsiflex, -0.62, 0.65)
    ankleZ = clamp(-hipZ * 0.35, -0.28, 0.28)
    ankleY = clamp(kneeSwivelY * 0.45, -0.35, 0.35)
  }

  // 5. Exact vertical coordinate of the active cleat contact point relative to the pelvis origin
  const ankleRelHipY = (-L1 * Math.cos(hipX) - L2 * Math.cos(hipX + kneeX)) * Math.cos(hipZ)
  const forefootRockDrop = Math.max(0, Math.sin(ankleX) * 0.088)
  const heelRockDrop = Math.max(0, -Math.sin(ankleX) * 0.028)
  const soleRelPelvisY = ankleRelHipY - (0.036 + forefootRockDrop + heelRockDrop)

  return {
    hipX,
    hipY,
    hipZ,
    kneeX,
    ankleX,
    ankleY,
    ankleZ,
    soleRelPelvisY,
  }
}

function dampValue(current: number, target: number, lambda: number, dt: number): number {
  const t = 1 - Math.exp(-lambda * dt)
  return current + (target - current) * t
}

function dampAngle(current: number, target: number, lambda: number, dt: number): number {
  let diff = target - current
  while (diff > Math.PI) diff -= Math.PI * 2
  while (diff < -Math.PI) diff += Math.PI * 2
  const t = 1 - Math.exp(-lambda * dt)
  return current + diff * t
}

function dampEuler(
  euler: THREE.Euler,
  tx: number,
  ty: number,
  tz: number,
  lambda: number,
  dt: number
) {
  euler.set(
    dampAngle(euler.x, tx, lambda, dt),
    dampAngle(euler.y, ty, lambda, dt),
    dampAngle(euler.z, tz, lambda, dt)
  )
}

/**
 * Applies an IK-grounded, breathing athletic pose for the Pre-Match 3D Showcase
 * (Squad XI Photo, 3D Face Close-Up, and Full Kit 3D inspection).
 */
export function applyShowcaseIKPose(
  rig: PlayerRig3D,
  idx: number,
  row: 'front' | 'back',
  clock: number,
  isSolo: boolean,
  dt = 0.016
) {
  const phaseOffset = idx * 0.85
  const breath = Math.sin(clock * 2.1 + phaseOffset) * 0.014
  const weightShift = Math.sin(clock * 0.95 + phaseOffset) * (isSolo ? 0.014 : 0.01)
  const headTurn = Math.sin(clock * 0.8 + idx * 1.15) * (isSolo ? 0.055 : 0.038)
  const headNod = Math.cos(clock * 1.1 + idx * 0.7) * 0.018

  if (!isSolo && row === 'front') {
    // Classic FC Barcelona Front-Row Half-Squat Pose (both boots planted flat on turf via 3D IK, hands resting on knees)
    const squatHipHeight = 0.675 + breath * 0.4
    const pelvisPitch = 0.14
    const leftIK = solveSpatialLegIK({
      targetX: -0.055 + weightShift * 0.4,
      targetY: -squatHipHeight,
      targetZ: 0.14,
      kneeSwivelY: 0.12,
      isStance: true,
      stanceProgress: 0.38,
      pelvisPitch,
      pelvisRoll: -weightShift * 0.6,
    })
    const rightIK = solveSpatialLegIK({
      targetX: 0.055 + weightShift * 0.4,
      targetY: -squatHipHeight,
      targetZ: 0.14,
      kneeSwivelY: -0.12,
      isStance: true,
      stanceProgress: 0.38,
      pelvisPitch,
      pelvisRoll: -weightShift * 0.6,
    })

    const lowestSole = Math.min(leftIK.soleRelPelvisY, rightIK.soleRelPelvisY)
    rig.body.position.set(0, -0.89 - lowestSole, 0)
    rig.body.rotation.set(0, 0, 0)

    rig.pelvis.position.set(weightShift, 0.89, -0.04)
    rig.pelvis.rotation.set(pelvisPitch, 0, -weightShift * 0.6)

    rig.torso.position.set(weightShift * 1.05, 0.92, -0.04)
    rig.torso.rotation.set(0.32 + breath, -weightShift * 0.4, weightShift * 0.5)

    rig.neck.rotation.set(-0.12, headTurn * 0.35, 0)
    rig.head.rotation.set(-0.16 + headNod, headTurn * 0.65, 0)

    rig.leftLeg.upper.rotation.set(leftIK.hipX, leftIK.hipY, leftIK.hipZ)
    rig.leftLeg.lower.rotation.set(leftIK.kneeX, 0, 0)
    if (rig.leftLeg.footOrHand) {
      rig.leftLeg.footOrHand.rotation.set(leftIK.ankleX, leftIK.ankleY, leftIK.ankleZ)
    }

    rig.rightLeg.upper.rotation.set(rightIK.hipX, rightIK.hipY, rightIK.hipZ)
    rig.rightLeg.lower.rotation.set(rightIK.kneeX, 0, 0)
    if (rig.rightLeg.footOrHand) {
      rig.rightLeg.footOrHand.rotation.set(rightIK.ankleX, rightIK.ankleY, rightIK.ankleZ)
    }

    // Hands resting naturally on top of the patella/knees
    rig.leftArm.upper.rotation.set(-0.58 + breath * 0.5, 0.18, -0.05)
    rig.leftArm.lower.rotation.set(-0.36, 0.12, 0.12)
    if (rig.leftArm.footOrHand) rig.leftArm.footOrHand.rotation.set(0.18, 0, -0.06)

    rig.rightArm.upper.rotation.set(-0.58 + breath * 0.5, -0.18, 0.05)
    rig.rightArm.lower.rotation.set(-0.36, -0.12, -0.12)
    if (rig.rightArm.footOrHand) rig.rightArm.footOrHand.rotation.set(0.18, 0, 0.06)
    return
  }

  // Standing Athletic Stance (Solo inspection or Back Row) with natural IK foot plant & subtle weight shift
  const standHipHeight = 0.848 + breath * 0.25
  const pelvisRoll = -weightShift * 1.1
  const leftIK = solveSpatialLegIK({
    targetX: -0.032 - weightShift * 0.6,
    targetY: -standHipHeight,
    targetZ: isSolo ? -0.018 : -0.012,
    kneeSwivelY: 0.05,
    isStance: true,
    stanceProgress: 0.42,
    pelvisPitch: 0.02,
    pelvisRoll,
  })
  const rightIK = solveSpatialLegIK({
    targetX: 0.032 - weightShift * 0.6,
    targetY: -standHipHeight,
    targetZ: isSolo ? 0.022 : 0.015,
    kneeSwivelY: -0.05,
    isStance: true,
    stanceProgress: 0.46,
    pelvisPitch: 0.02,
    pelvisRoll,
  })

  const lowestSole = Math.min(leftIK.soleRelPelvisY, rightIK.soleRelPelvisY)
  rig.body.position.set(0, dampValue(rig.body.position.y, -0.89 - lowestSole, 18, dt), 0)
  rig.body.rotation.set(0, 0, 0)

  rig.pelvis.position.set(weightShift, 0.89, 0)
  rig.pelvis.rotation.set(0.02, -weightShift * 0.8, pelvisRoll)

  // Lumbar-thoracic counter-sway keeps shoulders level and poised while breathing
  rig.torso.position.set(weightShift * 1.04, 0.92, 0)
  rig.torso.rotation.set(0.03 + breath, weightShift * 0.6, -pelvisRoll * 0.75)

  rig.neck.rotation.set(0.01, headTurn * 0.35, -pelvisRoll * 0.2)
  rig.head.rotation.set(0.015 + headNod, headTurn * 0.65, 0)

  rig.leftLeg.upper.rotation.set(leftIK.hipX, leftIK.hipY, leftIK.hipZ)
  rig.leftLeg.lower.rotation.set(leftIK.kneeX, 0, 0)
  if (rig.leftLeg.footOrHand) {
    rig.leftLeg.footOrHand.rotation.set(leftIK.ankleX, leftIK.ankleY, leftIK.ankleZ)
  }

  rig.rightLeg.upper.rotation.set(rightIK.hipX, rightIK.hipY, rightIK.hipZ)
  rig.rightLeg.lower.rotation.set(rightIK.kneeX, 0, 0)
  if (rig.rightLeg.footOrHand) {
    rig.rightLeg.footOrHand.rotation.set(rightIK.ankleX, rightIK.ankleY, rightIK.ankleZ)
  }

  if (isSolo || idx % 2 === 0) {
    // Relaxed anatomical athletic arm carriage
    rig.leftArm.upper.rotation.set(0.04 + breath * 0.4, 0.06, -0.085 - Math.abs(breath) * 0.3)
    rig.leftArm.lower.rotation.set(-0.22 - breath * 0.5, 0.08, 0.05)
    if (rig.leftArm.footOrHand) rig.leftArm.footOrHand.rotation.set(0.05, 0, -0.04)

    rig.rightArm.upper.rotation.set(0.04 + breath * 0.4, -0.06, 0.085 + Math.abs(breath) * 0.3)
    rig.rightArm.lower.rotation.set(-0.22 - breath * 0.5, -0.08, -0.05)
    if (rig.rightArm.footOrHand) rig.rightArm.footOrHand.rotation.set(0.05, 0, 0.04)
  } else if (idx === 0) {
    // Goalkeeper ready poise
    rig.leftArm.upper.rotation.set(-0.14 + breath * 0.4, 0.08, -0.15)
    rig.leftArm.lower.rotation.set(-0.38, 0.1, 0.12)
    if (rig.leftArm.footOrHand) rig.leftArm.footOrHand.rotation.set(0.08, 0, -0.05)

    rig.rightArm.upper.rotation.set(0.05 + breath * 0.4, -0.08, 0.17)
    rig.rightArm.lower.rotation.set(-0.44, -0.1, -0.16)
    if (rig.rightArm.footOrHand) rig.rightArm.footOrHand.rotation.set(0.08, 0, 0.05)
  } else {
    // Confident Champions League crossed-arms pose
    rig.leftArm.upper.rotation.set(-0.48 + breath * 0.3, 0.35, -0.1)
    rig.leftArm.lower.rotation.set(-1.05, 0.15, 0.52)
    if (rig.leftArm.footOrHand) rig.leftArm.footOrHand.rotation.set(0.06, 0, 0)

    rig.rightArm.upper.rotation.set(-0.48 + breath * 0.3, -0.35, 0.1)
    rig.rightArm.lower.rotation.set(-1.05, -0.15, -0.52)
    if (rig.rightArm.footOrHand) rig.rightArm.footOrHand.rotation.set(0.06, 0, 0)
  }
}

export function animateAthleticPlayerRig(
  rig: PlayerRig3D,
  state: {
    vx: number
    vy: number
    facingX: number
    facingY: number
    sprinting: boolean
    keeper: boolean
    action: PlayerAction
    actionTime: number
    skill: DribbleType
  },
  ballPosWorld: { x: number; z: number },
  playerPosWorld: { x: number; z: number },
  clock: number,
  dt: number
) {
  const safeDt = clamp(dt, 0.004, 0.05)
  const worldDx = rig.prevX !== undefined ? playerPosWorld.x - rig.prevX : 0
  const worldDz = rig.prevZ !== undefined ? playerPosWorld.z - rig.prevZ : 0
  rig.prevX = playerPosWorld.x
  rig.prevZ = playerPosWorld.z

  // Initialize persistent kinematic state on first frame
  if (!rig.kinematics) {
    rig.kinematics = {
      prevVx: state.vx,
      prevVy: state.vy,
      prevYaw: rig.group.rotation.y,
      smoothedSpeed: 0,
      smoothedAccelFwd: 0,
      smoothedAccelLat: 0,
      smoothedTurnRate: 0,
      strideCycle: rig.phase,
      initialized: true,
    }
  }
  const kin = rig.kinematics

  // 1. REAL-TIME KINEMATIC DERIVATIVES (Velocity, Forward/Lateral Acceleration, Angular Turn Rate)
  const stepDistWorld = Math.hypot(worldDx, worldDz)
  const worldSpeedMps = stepDistWorld / safeDt
  const engineSpeed = Math.hypot(state.vx, state.vy)
  const rawSpeed = Math.max(engineSpeed, worldSpeedMps * 10)
  kin.smoothedSpeed = dampValue(kin.smoothedSpeed, rawSpeed, 14, safeDt)
  const speed = kin.smoothedSpeed
  const effectiveSpeedMps = speed / 10

  const distToBall = Math.hypot(ballPosWorld.x - playerPosWorld.x, ballPosWorld.z - playerPosWorld.z)
  const isDribbling = !state.keeper && distToBall < 2.65 && speed > 3.0

  // Smoothly align player yaw toward movement trajectory (or facing vector when stationary/jockeying)
  const moveVx = engineSpeed > 3.2 ? state.vx : worldSpeedMps > 0.32 ? worldDx / safeDt : state.facingX
  const moveVy = engineSpeed > 3.2 ? state.vy : worldSpeedMps > 0.32 ? worldDz / safeDt : state.facingY
  const targetYaw =
    speed > 2.8 && (!state.keeper || state.action !== 'idle')
      ? Math.atan2(moveVx, moveVy)
      : Math.atan2(state.facingX, state.facingY)

  let yawDiff = targetYaw - rig.group.rotation.y
  while (yawDiff > Math.PI) yawDiff -= Math.PI * 2
  while (yawDiff < -Math.PI) yawDiff += Math.PI * 2
  const yawStep = yawDiff * Math.min(1, safeDt * 14)
  rig.group.rotation.y += yawStep

  // Angular velocity (rad/s) for centripetal turn banking & knee pole-vector swivel
  const rawTurnRate = clamp(yawDiff / safeDt, -12, 12)
  kin.smoothedTurnRate = dampValue(kin.smoothedTurnRate, rawTurnRate, 10, safeDt)

  // World-space acceleration projected into the player's local forward (+Z) and lateral (+X) axes
  const accelWorldX = (state.vx - kin.prevVx) / safeDt
  const accelWorldZ = (state.vy - kin.prevVy) / safeDt
  kin.prevVx = state.vx
  kin.prevVy = state.vy

  const sinYaw = Math.sin(rig.group.rotation.y)
  const cosYaw = Math.cos(rig.group.rotation.y)
  const rawAccelFwd = clamp((accelWorldX * sinYaw + accelWorldZ * cosYaw) / 650, -1, 1)
  const rawAccelLat = clamp((accelWorldX * cosYaw - accelWorldZ * sinYaw) / 550, -1, 1)
  kin.smoothedAccelFwd = dampValue(kin.smoothedAccelFwd, rawAccelFwd, 9, safeDt)
  kin.smoothedAccelLat = dampValue(kin.smoothedAccelLat, rawAccelLat, 9, safeDt)

  const walkRatio = clamp((speed - 1.2) / 14, 0, 1)
  const runRatio = clamp(speed / 185, 0, 1)
  const sprintFactor = state.sprinting ? clamp((speed - 95) / 110, 0, 1) : 0

  // 2. DISTANCE-LOCKED GAIT PHASE & BIOMECHANICAL STRIDE LENGTH
  const baseStrideLength = clamp(0.28 + effectiveSpeedMps * 0.038 + sprintFactor * 0.08, 0.26, 0.82)
  const strideLength = (isDribbling ? baseStrideLength * 0.86 : baseStrideLength) * walkRatio

  if (speed > 1.6) {
    // Advance gait phase strictly by distance traveled over stride length so planted feet never slide!
    const effectiveStepDist = Math.max(stepDistWorld, effectiveSpeedMps * safeDt)
    const activeStride = Math.max(0.24, strideLength * rig.scale)
    const cadenceBoost = isDribbling ? 1.16 : 1.0
    rig.phase = (rig.phase + ((Math.PI * effectiveStepDist) / activeStride) * cadenceBoost) % (Math.PI * 2)
  } else {
    rig.phase = (rig.phase + safeDt * 1.6) % (Math.PI * 2)
  }
  const c = rig.phase

  // 3. MULTI-AXIS TORSO SWAY, LUMBAR-PELVIC RHYTHM & CENTRIPETAL BANKING
  // Stance weight shift: when sin(c) > 0, left leg is moving toward front strike / mid-stance;
  // pelvis shifts laterally over the active supporting leg and drops slightly on the swing side
  const stanceShiftOsc = Math.cos(c)
  const strideOsc = Math.sin(c)
  const idleBreath = Math.sin(clock * 2.3 + rig.phase) * 0.013
  const idleWeightShift = (1 - walkRatio) * Math.sin(clock * 1.05 + rig.phase * 0.5) * 0.012

  // Centripetal banking into turns and lateral cuts
  const turnBankRoll = clamp(
    -kin.smoothedTurnRate * 0.022 * walkRatio - kin.smoothedAccelLat * 0.09,
    -0.22,
    0.22
  )
  // Forward lean driven by velocity + explosive forward acceleration pitch (or braking lean-back)
  const accelPitch = kin.smoothedAccelFwd * 0.14
  const baseForwardLean =
    0.04 +
    walkRatio * (state.sprinting ? 0.23 : isDribbling ? 0.18 : 0.13) +
    accelPitch

  // Lateral hip shift over the stance foot (keeps torso & pelvis connected at the lumbar spine!)
  const pelvisShiftX =
    -stanceShiftOsc * (0.022 + runRatio * 0.012) * walkRatio +
    idleWeightShift +
    clamp(kin.smoothedTurnRate * 0.004 * walkRatio, -0.025, 0.025)
  const pelvisShiftZ = -kin.smoothedAccelFwd * 0.018 * walkRatio

  // Pelvic tilt (anterior pitch), Trendelenburg frontal list (pelvisRoll), and transverse axial rotation (pelvisYaw)
  const pelvisPitch = clamp(baseForwardLean * 0.38, -0.12, 0.22)
  const pelvisRoll =
    stanceShiftOsc * (0.048 + runRatio * 0.022) * walkRatio +
    turnBankRoll * 0.45 -
    idleWeightShift * 0.9
  const pelvisYaw = -strideOsc * (0.14 + runRatio * 0.06) * walkRatio

  // Thoracic Spine (Torso) counter-rotates axially against the pelvis and sways laterally to balance COM over stance foot
  const torsoPitch = clamp(baseForwardLean + idleBreath + Math.abs( Math.cos(c) ) * 0.028 * runRatio, -0.25, 0.42)
  const torsoYaw =
    strideOsc * (0.17 + runRatio * 0.07) * walkRatio +
    clamp(kin.smoothedTurnRate * 0.028 * walkRatio, -0.18, 0.18)
  const torsoRoll =
    -stanceShiftOsc * (0.056 + runRatio * 0.026) * walkRatio +
    turnBankRoll * 0.85 +
    idleWeightShift * 0.7

  // 4. 3D SPATIAL FOOT-PLACEMENT TRAJECTORY & 2-BONE + ANKLE IK
  const crouchDrop =
    (state.keeper ? 0.048 : 0) +
    (isDribbling ? 0.036 : 0) +
    runRatio * (state.sprinting ? 0.052 : 0.03) * walkRatio +
    Math.abs(turnBankRoll) * 0.12
  const baseHipHeight = 0.844 - crouchDrop

  const computeSpatialLeg = (legPhase: number, side: -1 | 1): SpatialLegIKResult => {
    const s = Math.sin(legPhase)
    const w = Math.cos(legPhase)
    // Stance phase when w <= 0 (planted foot sweeps backward on the turf from +halfStride to -halfStride)
    // Swing phase when w > 0 (foot lifts in an athletic heel-tuck arc and reaches forward)
    const isStance = w <= 0 || walkRatio < 0.04
    const halfStride = strideLength * 0.5

    // Sagittal foot target Z relative to hip socket
    const restStanceZ = -side * 0.022 * (1 - walkRatio)
    const footZ = s * halfStride + restStanceZ - kin.smoothedAccelFwd * 0.04 * (isStance ? 1 : -0.5)

    // Lateral foot target X relative to hip socket (wider athletic base when cutting, keeper-jockeying, or dribbling)
    const cutStepOut = clamp(-kin.smoothedTurnRate * 0.008 * walkRatio, -0.055, 0.055)
    const dribbleWeaveX =
      isDribbling && !isStance ? Math.sin(legPhase * 2) * -side * 0.038 : 0
    const baseStanceWidth = side * (0.018 + (state.keeper ? 0.035 : 0) + (isDribbling ? 0.016 : 0))
    const footX = baseStanceWidth + cutStepOut + dribbleWeaveX - pelvisShiftX * 0.65

    // Vertical foot lift Y above ground during swing phase (strictly 0 during stance for ground lock!)
    let footLiftY = 0
    if (!isStance) {
      // Biomimetic swing trajectory: rapid early-swing heel tuck toward glutes (s < 0, w > 0) + forward knee drive
      const swingEnvelope = Math.pow(w, 1.2)
      const earlyHeelTuck = Math.max(0, -s) * w * (0.08 + runRatio * (state.sprinting ? 0.16 : 0.11))
      const highKneeDrive = Math.max(0, s) * w * (0.04 + sprintFactor * 0.06)
      footLiftY = (swingEnvelope * (0.085 + runRatio * 0.13) + earlyHeelTuck + highKneeDrive) * walkRatio
    }

    const stanceProgress = isStance ? clamp(0.5 - s * 0.5, 0, 1) : 0
    const targetAnkleY = -baseHipHeight + footLiftY

    // Pole-vector knee swivel tracks turns and medial ball touches naturally
    const dribbleTouchYaw = isDribbling && !isStance ? w * -side * 0.16 : 0
    const kneeSwivelY =
      -side * 0.03 +
      dribbleTouchYaw +
      clamp(kin.smoothedTurnRate * 0.025 * walkRatio, -0.22, 0.22)

    return solveSpatialLegIK({
      targetX: footX,
      targetY: targetAnkleY,
      targetZ: footZ,
      kneeSwivelY,
      isStance,
      stanceProgress,
      pelvisPitch,
      pelvisRoll: pelvisRoll + turnBankRoll * 0.5,
    })
  }

  let leftIK = computeSpatialLeg(c, -1)
  let rightIK = computeSpatialLeg(c + Math.PI, 1)

  // Target upper-body & arm rotations (before action overrides and exponential damping)
  let targetBodyRotX = 0
  let targetBodyRotY = 0
  let targetBodyRotZ = turnBankRoll * 0.35

  const armSwingAmp = (0.46 + runRatio * (state.sprinting ? 0.68 : 0.46)) * walkRatio
  const leftArmSwing = -strideOsc * armSwingAmp
  const rightArmSwing = strideOsc * armSwingAmp
  const balanceAbduction = Math.abs(turnBankRoll) * 0.85 + (isDribbling ? 0.09 : 0) + runRatio * 0.06

  let leftArmUpper = {
    x: leftArmSwing + 0.03 * (1 - walkRatio),
    y: 0.16 * walkRatio - torsoYaw * 0.35,
    z: -0.085 - balanceAbduction,
  }
  let rightArmUpper = {
    x: rightArmSwing + 0.03 * (1 - walkRatio),
    y: -0.16 * walkRatio - torsoYaw * 0.35,
    z: 0.085 + balanceAbduction,
  }
  // Dynamic elbow flexion: closes tighter on forward upswing, extends slightly on rear backswing
  let leftArmLower = {
    x: -0.32 - runRatio * 0.68 - Math.max(0, -leftArmSwing) * 0.42 + Math.max(0, leftArmSwing) * 0.18,
    y: 0.14 * walkRatio,
    z: 0.14 * walkRatio,
  }
  let rightArmLower = {
    x: -0.32 - runRatio * 0.68 - Math.max(0, -rightArmSwing) * 0.42 + Math.max(0, rightArmSwing) * 0.18,
    y: -0.14 * walkRatio,
    z: -0.14 * walkRatio,
  }
  let leftHandRot = {
    x: 0.06 + Math.max(0, -leftArmSwing) * 0.15,
    y: 0,
    z: -0.05,
  }
  let rightHandRot = {
    x: 0.06 + Math.max(0, -rightArmSwing) * 0.15,
    y: 0,
    z: 0.05,
  }

  let finalTorsoPitch = torsoPitch
  let finalTorsoYaw = torsoYaw
  let finalTorsoRoll = torsoRoll
  let finalPelvisPitch = pelvisPitch
  let finalPelvisYaw = pelvisYaw
  let finalPelvisRoll = pelvisRoll
  let finalPelvisShiftX = pelvisShiftX
  let finalPelvisShiftZ = pelvisShiftZ
  let extraBodyLiftY =
    runRatio > 0.62 ? Math.max(0, Math.abs(Math.cos(c)) - 0.72) * 0.048 * runRatio : 0

  // 5. GOALKEEPER READY STANCE & SPECIALIZED ACTION IK OVERRIDES
  if (state.keeper && state.action === 'idle' && speed < 35) {
    finalTorsoPitch = 0.22 + idleBreath
    finalPelvisPitch = 0.1
    leftArmUpper = { x: -0.42, y: 0.18, z: -0.32 }
    rightArmUpper = { x: -0.42, y: -0.18, z: 0.32 }
    leftArmLower = { x: -0.78, y: 0.15, z: 0.08 }
    rightArmLower = { x: -0.78, y: -0.15, z: -0.08 }
    leftHandRot = { x: -0.22, y: 0, z: -0.08 }
    rightHandRot = { x: -0.22, y: 0, z: 0.08 }
    leftIK = solveSpatialLegIK({
      targetX: -0.075,
      targetY: -0.77,
      targetZ: 0.03,
      kneeSwivelY: 0.1,
      isStance: true,
      stanceProgress: 0.4,
      pelvisPitch: finalPelvisPitch,
      pelvisRoll: finalPelvisRoll,
    })
    rightIK = solveSpatialLegIK({
      targetX: 0.075,
      targetY: -0.77,
      targetZ: 0.03,
      kneeSwivelY: -0.1,
      isStance: true,
      stanceProgress: 0.4,
      pelvisPitch: finalPelvisPitch,
      pelvisRoll: finalPelvisRoll,
    })
  }

  if (state.action === 'kick') {
    const t = clamp(1 - state.actionTime / 0.36, 0, 1)
    // Left support leg plants firmly beside the ball via 3D IK with knee flexion & flat cleat lock
    finalPelvisShiftX = -0.055 * Math.sin(t * Math.PI)
    targetBodyRotZ = 0.13 * Math.sin(t * Math.PI)
    leftIK = solveSpatialLegIK({
      targetX: -0.065,
      targetY: -0.765,
      targetZ: 0.14 * Math.sin(t * Math.PI),
      kneeSwivelY: 0.08,
      isStance: true,
      stanceProgress: 0.35,
      pelvisPitch: -0.08,
      pelvisRoll: targetBodyRotZ,
    })

    // Right striking leg: 3-phase biomechanical wind-up -> whip snap impact -> across-body follow-through
    if (t < 0.34) {
      const w = t / 0.34
      rightIK = solveSpatialLegIK({
        targetX: 0.04,
        targetY: -0.78 + w * 0.22,
        targetZ: -w * 0.44,
        kneeSwivelY: -0.14 * w,
        isStance: false,
        stanceProgress: 0,
        footPitchOffset: 0.38 * w,
      })
      rightIK.kneeX = clamp(rightIK.kneeX + w * 0.55, 0.2, 2.05)
    } else {
      const s = (t - 0.34) / 0.66
      const followArc = Math.sin(s * Math.PI * 0.85)
      rightIK = solveSpatialLegIK({
        targetX: 0.04 - s * 0.11,
        targetY: -0.76 + followArc * 0.28,
        targetZ: -0.44 + followArc * 0.96,
        kneeSwivelY: -0.14 + s * 0.34,
        isStance: false,
        stanceProgress: 0,
        footPitchOffset: 0.42 * (1 - s * 0.5),
      })
    }

    finalTorsoPitch = t < 0.34 ? 0.12 : -0.16 * Math.sin(((t - 0.34) / 0.66) * Math.PI)
    finalTorsoYaw = (0.38 - t * 0.72) * Math.sin(t * Math.PI)
    finalTorsoRoll = 0.14 * Math.sin(t * Math.PI)
    finalPelvisYaw = -finalTorsoYaw * 0.65

    // Dynamic balance counter-arm (left arm sweeps wide and high, right arm counter-balances behind)
    leftArmUpper = { x: -0.68, y: 0.28, z: -0.48 }
    leftArmLower = { x: -0.52, y: 0.2, z: 0.18 }
    rightArmUpper = { x: 0.45 - t * 0.65, y: -0.2, z: 0.26 }
    rightArmLower = { x: -0.65, y: -0.15, z: -0.12 }
  } else if (state.action === 'skill') {
    if (state.skill === 'roulette') {
      const t = clamp(1 - state.actionTime / 0.68, 0, 1)
      targetBodyRotY = t * Math.PI * 2
      finalTorsoPitch = 0.22
      finalTorsoRoll = Math.sin(t * Math.PI * 2) * 0.14
      leftArmUpper = { x: -0.28, y: 0.2, z: -0.38 }
      rightArmUpper = { x: -0.28, y: -0.2, z: 0.38 }
      leftIK = solveSpatialLegIK({
        targetX: -0.04,
        targetY: -0.78,
        targetZ: Math.sin(t * Math.PI * 2) * 0.18,
        kneeSwivelY: 0.15,
        isStance: t < 0.5,
        stanceProgress: 0.45,
        pelvisPitch: 0.12,
      })
      rightIK = solveSpatialLegIK({
        targetX: 0.04,
        targetY: -0.76 + Math.sin(t * Math.PI) * 0.08,
        targetZ: -Math.sin(t * Math.PI * 2) * 0.22,
        kneeSwivelY: -0.18,
        isStance: t >= 0.5,
        stanceProgress: 0.45,
        pelvisPitch: 0.12,
      })
    } else if (state.skill === 'stepover') {
      const t = clamp(1 - state.actionTime / 0.5, 0, 1)
      const loop = t * Math.PI * 4
      finalPelvisShiftX = Math.sin(t * Math.PI * 2) * 0.045
      finalTorsoRoll = Math.sin(t * Math.PI * 2) * 0.22
      finalTorsoPitch = 0.22
      leftIK = solveSpatialLegIK({
        targetX: -0.055 - finalPelvisShiftX,
        targetY: -0.77,
        targetZ: 0.04,
        kneeSwivelY: 0.08,
        isStance: true,
        stanceProgress: 0.45,
        pelvisPitch: 0.1,
        pelvisRoll: -finalTorsoRoll * 0.5,
      })
      rightIK = solveSpatialLegIK({
        targetX: 0.02 + Math.cos(loop) * 0.13,
        targetY: -0.68 + Math.abs(Math.sin(loop)) * 0.08,
        targetZ: 0.18 + Math.sin(loop) * 0.16,
        kneeSwivelY: Math.cos(loop) * 0.28,
        isStance: false,
        stanceProgress: 0,
      })
      leftArmUpper.z = -0.32
      rightArmUpper.z = 0.32
    } else if (state.skill === 'sombrero') {
      const t = clamp(1 - state.actionTime / 0.62, 0, 1)
      extraBodyLiftY = Math.sin(t * Math.PI) * 0.18
      finalTorsoPitch = -0.08 * Math.sin(t * Math.PI)
      leftIK = solveSpatialLegIK({
        targetX: -0.04,
        targetY: -0.79,
        targetZ: -0.04,
        isStance: true,
        stanceProgress: 0.55,
      })
      rightIK = solveSpatialLegIK({
        targetX: 0.03,
        targetY: -0.72 + Math.sin(t * Math.PI) * 0.26,
        targetZ: -0.18 + t * 0.58,
        kneeSwivelY: -0.12,
        isStance: false,
        stanceProgress: 0,
        footPitchOffset: -0.25,
      })
    } else if (state.skill === 'stop-go') {
      const t = clamp(1 - state.actionTime / 0.5, 0, 1)
      finalTorsoPitch = t < 0.45 ? 0.06 : 0.32
      leftArmUpper = { x: -0.55, y: 0.15, z: -0.28 }
      rightArmUpper = { x: 0.45, y: -0.15, z: 0.28 }
      leftIK = solveSpatialLegIK({
        targetX: -0.05,
        targetY: -0.75,
        targetZ: t < 0.45 ? 0.22 : -0.18,
        isStance: true,
        stanceProgress: t < 0.45 ? 0.15 : 0.85,
        pelvisPitch: finalTorsoPitch * 0.4,
      })
    } else if (state.skill === 'body-feint') {
      const t = clamp(1 - state.actionTime / 0.5, 0, 1)
      const feintWave = Math.sin(t * Math.PI * 2)
      finalPelvisShiftX = feintWave * 0.068
      finalTorsoRoll = feintWave * 0.32
      finalTorsoYaw = -feintWave * 0.22
      finalPelvisRoll = -feintWave * 0.16
      leftArmUpper.z = -0.26 - Math.max(0, feintWave) * 0.22
      rightArmUpper.z = 0.26 + Math.max(0, -feintWave) * 0.22
    } else {
      // Elastico
      const t = clamp(1 - state.actionTime / 0.5, 0, 1)
      const whip = Math.sin(t * Math.PI * 2)
      finalPelvisShiftX = whip * 0.045
      finalTorsoRoll = whip * 0.2
      finalTorsoYaw = -whip * 0.18
      rightIK = solveSpatialLegIK({
        targetX: 0.04 + whip * 0.16,
        targetY: -0.71,
        targetZ: 0.22,
        kneeSwivelY: -whip * 0.38,
        isStance: false,
        stanceProgress: 0,
      })
    }
  } else if (state.action === 'jump') {
    const t = clamp(1 - state.actionTime / 0.5, 0, 1)
    extraBodyLiftY = Math.sin(t * Math.PI) * 0.52
    finalTorsoPitch = -0.08 + Math.cos(t * Math.PI) * 0.14
    leftIK = solveSpatialLegIK({
      targetX: -0.04,
      targetY: -0.66,
      targetZ: 0.14,
      isStance: false,
      stanceProgress: 0,
      footPitchOffset: 0.25,
    })
    rightIK = solveSpatialLegIK({
      targetX: 0.04,
      targetY: -0.64,
      targetZ: -0.18,
      isStance: false,
      stanceProgress: 0,
      footPitchOffset: 0.32,
    })
    leftArmUpper = { x: -0.85, y: 0.15, z: -0.38 }
    rightArmUpper = { x: -0.85, y: -0.15, z: 0.38 }
    leftArmLower = { x: -0.55, y: 0, z: 0.12 }
    rightArmLower = { x: -0.55, y: 0, z: -0.12 }
  } else if (state.action === 'catch') {
    finalTorsoPitch = 0.08
    leftArmUpper = { x: -1.52, y: 0.22, z: -0.2 }
    rightArmUpper = { x: -1.52, y: -0.22, z: 0.2 }
    leftArmLower = { x: -0.42, y: 0.18, z: 0.1 }
    rightArmLower = { x: -0.42, y: -0.18, z: -0.1 }
    leftHandRot = { x: -0.15, y: 0.2, z: -0.1 }
    rightHandRot = { x: -0.15, y: -0.2, z: 0.1 }
  } else if (state.action === 'dive') {
    const side = state.vy >= 0 ? 1 : -1
    targetBodyRotZ = -side * 1.18
    finalTorsoRoll = -side * 0.18
    finalTorsoPitch = 0.06
    leftArmUpper = { x: -1.62, y: 0.15, z: -0.42 }
    rightArmUpper = { x: -1.62, y: -0.15, z: 0.42 }
    leftArmLower = { x: -0.18, y: 0, z: 0 }
    rightArmLower = { x: -0.18, y: 0, z: 0 }
    leftIK = solveSpatialLegIK({
      targetX: -0.05,
      targetY: -0.78,
      targetZ: -0.08,
      isStance: false,
      stanceProgress: 0,
      footPitchOffset: 0.3,
    })
    rightIK = solveSpatialLegIK({
      targetX: 0.05,
      targetY: -0.72,
      targetZ: 0.08,
      isStance: false,
      stanceProgress: 0,
      footPitchOffset: 0.25,
    })
  }

  // 6. EXACT GROUND-LOCK SOLVER & EXPONENTIAL BONE DAMPING (Prevents any robotic snapping!)
  const lowestSoleRelPelvis = Math.min(leftIK.soleRelPelvisY, rightIK.soleRelPelvisY)
  const targetBodyY =
    state.action === 'dive'
      ? 0.44
      : Math.max(-0.22, -0.89 - lowestSoleRelPelvis + extraBodyLiftY)

  const limbSpeed = state.action === 'idle' ? 22 : 28
  const coreSpeed = 20

  rig.body.position.y = dampValue(rig.body.position.y, targetBodyY, 24, safeDt)
  if (state.action === 'skill' && state.skill === 'roulette') {
    rig.body.rotation.set(targetBodyRotX, targetBodyRotY, targetBodyRotZ)
  } else {
    dampEuler(rig.body.rotation, targetBodyRotX, targetBodyRotY, targetBodyRotZ, coreSpeed, safeDt)
  }

  // Couple pelvis and torso positions at the L5/S1 lumbar junction so the waist NEVER shears!
  rig.pelvis.position.x = dampValue(rig.pelvis.position.x, finalPelvisShiftX, coreSpeed, safeDt)
  rig.pelvis.position.y = 0.89
  rig.pelvis.position.z = dampValue(rig.pelvis.position.z, finalPelvisShiftZ, coreSpeed, safeDt)
  dampEuler(
    rig.pelvis.rotation,
    finalPelvisPitch,
    finalPelvisYaw,
    finalPelvisRoll,
    coreSpeed,
    safeDt
  )

  rig.torso.position.x = rig.pelvis.position.x * 1.05
  rig.torso.position.y = 0.92
  rig.torso.position.z = rig.pelvis.position.z * 1.05
  dampEuler(
    rig.torso.rotation,
    finalTorsoPitch,
    finalTorsoYaw,
    finalTorsoRoll,
    coreSpeed,
    safeDt
  )

  // Apply damped 3D IK rotations to Left & Right Legs (Hip 3-DOF, Knee Hinge, Ankle 3-DOF)
  dampEuler(rig.leftLeg.upper.rotation, leftIK.hipX, leftIK.hipY, leftIK.hipZ, limbSpeed, safeDt)
  dampEuler(rig.leftLeg.lower.rotation, leftIK.kneeX, 0, 0, limbSpeed, safeDt)
  if (rig.leftLeg.footOrHand) {
    dampEuler(
      rig.leftLeg.footOrHand.rotation,
      leftIK.ankleX,
      leftIK.ankleY,
      leftIK.ankleZ,
      limbSpeed,
      safeDt
    )
  }

  dampEuler(rig.rightLeg.upper.rotation, rightIK.hipX, rightIK.hipY, rightIK.hipZ, limbSpeed, safeDt)
  dampEuler(rig.rightLeg.lower.rotation, rightIK.kneeX, 0, 0, limbSpeed, safeDt)
  if (rig.rightLeg.footOrHand) {
    dampEuler(
      rig.rightLeg.footOrHand.rotation,
      rightIK.ankleX,
      rightIK.ankleY,
      rightIK.ankleZ,
      limbSpeed,
      safeDt
    )
  }

  // Apply damped 3D rotations to Left & Right Arms (Shoulder, Elbow, Wrist/Hand)
  dampEuler(
    rig.leftArm.upper.rotation,
    leftArmUpper.x,
    leftArmUpper.y,
    leftArmUpper.z,
    limbSpeed,
    safeDt
  )
  dampEuler(
    rig.leftArm.lower.rotation,
    leftArmLower.x,
    leftArmLower.y,
    leftArmLower.z,
    limbSpeed,
    safeDt
  )
  if (rig.leftArm.footOrHand) {
    dampEuler(
      rig.leftArm.footOrHand.rotation,
      leftHandRot.x,
      leftHandRot.y,
      leftHandRot.z,
      limbSpeed,
      safeDt
    )
  }

  dampEuler(
    rig.rightArm.upper.rotation,
    rightArmUpper.x,
    rightArmUpper.y,
    rightArmUpper.z,
    limbSpeed,
    safeDt
  )
  dampEuler(
    rig.rightArm.lower.rotation,
    rightArmLower.x,
    rightArmLower.y,
    rightArmLower.z,
    limbSpeed,
    safeDt
  )
  if (rig.rightArm.footOrHand) {
    dampEuler(
      rig.rightArm.footOrHand.rotation,
      rightHandRot.x,
      rightHandRot.y,
      rightHandRot.z,
      limbSpeed,
      safeDt
    )
  }

  // 7. VESTIBULO-OCULAR NECK & HEAD STABILIZATION (Tracks ball while counter-stabilizing torso sway)
  const toBallX = ballPosWorld.x - playerPosWorld.x
  const toBallZ = ballPosWorld.z - playerPosWorld.z
  const worldAngleToBall = Math.atan2(toBallX, toBallZ)
  let headYaw = worldAngleToBall - rig.group.rotation.y
  while (headYaw > Math.PI) headYaw -= Math.PI * 2
  while (headYaw < -Math.PI) headYaw += Math.PI * 2
  headYaw = clamp(headYaw, -0.62, 0.62)

  const targetNeckPitch = -finalTorsoPitch * 0.25 + (isDribbling ? 0.08 : 0.02)
  const targetNeckYaw = headYaw * 0.28 - finalTorsoYaw * 0.25
  const targetNeckRoll = -finalTorsoRoll * 0.35
  dampEuler(rig.neck.rotation, targetNeckPitch, targetNeckYaw, targetNeckRoll, 16, safeDt)

  const targetHeadPitch = (isDribbling ? 0.12 : 0.02) - finalTorsoPitch * 0.25
  const targetHeadYaw = headYaw * 0.42 - finalTorsoYaw * 0.35
  const targetHeadRoll = -finalTorsoRoll * 0.3
  dampEuler(rig.head.rotation, targetHeadPitch, targetHeadYaw, targetHeadRoll, 16, safeDt)
}

export function createMatchBallMesh(): THREE.Group {
  const group = new THREE.Group()

  const c = document.createElement('canvas')
  c.width = 512
  c.height = 256
  const ctx = c.getContext('2d')!

  ctx.fillStyle = '#f6f7f2'
  ctx.fillRect(0, 0, 512, 256)

  const centers = [
    [64, 64],
    [192, 64],
    [320, 64],
    [448, 64],
    [128, 128],
    [256, 128],
    [384, 128],
    [64, 192],
    [192, 192],
    [320, 192],
    [448, 192],
  ]

  ctx.strokeStyle = '#263238'
  ctx.lineWidth = 3.5
  for (let i = 0; i < centers.length; i++) {
    for (let j = i + 1; j < centers.length; j++) {
      const d = Math.hypot(centers[i][0] - centers[j][0], centers[i][1] - centers[j][1])
      if (d < 155) {
        ctx.beginPath()
        ctx.moveTo(centers[i][0], centers[i][1])
        ctx.lineTo(centers[j][0], centers[j][1])
        ctx.stroke()
      }
    }
  }

  for (let idx = 0; idx < centers.length; idx++) {
    const [cx, cy] = centers[idx]
    ctx.fillStyle = idx % 2 === 0 ? '#102d27' : '#1e4e68'
    ctx.beginPath()
    for (let k = 0; k < 5; k++) {
      const a = (k / 5) * Math.PI * 2 - Math.PI / 2
      const r = 27
      const px = cx + Math.cos(a) * r
      const py = cy + Math.sin(a) * r
      if (k === 0) ctx.moveTo(px, py)
      else ctx.lineTo(px, py)
    }
    ctx.closePath()
    ctx.fill()

    ctx.strokeStyle = idx % 3 === 0 ? '#dfff57' : '#ff5733'
    ctx.lineWidth = 2.5
    ctx.stroke()
  }

  const colorTex = new THREE.CanvasTexture(c)
  colorTex.colorSpace = THREE.SRGBColorSpace

  const ballGeo = new THREE.SphereGeometry(0.225, 40, 32)
  const ballMat = new THREE.MeshPhysicalMaterial({
    map: colorTex,
    roughness: 0.22,
    metalness: 0.06,
    clearcoat: 0.88,
    clearcoatRoughness: 0.14,
  })

  addMesh(ballGeo, ballMat, group, 0, 0, 0, true)
  return group
}

export function createStudioEnvironment(renderer: THREE.WebGLRenderer): THREE.Texture {
  const envScene = new THREE.Scene()
  envScene.background = new THREE.Color('#223832')

  const boxGeo = new THREE.BoxGeometry(1, 1, 1)
  const topPanel = new THREE.Mesh(
    boxGeo,
    new THREE.MeshBasicMaterial({ color: new THREE.Color('#ffffff').multiplyScalar(3.2) })
  )
  topPanel.position.set(0, 8, 0)
  topPanel.scale.set(10, 0.2, 10)
  envScene.add(topPanel)

  const warmSide = new THREE.Mesh(
    boxGeo,
    new THREE.MeshBasicMaterial({ color: new THREE.Color('#fff2d6').multiplyScalar(2.4) })
  )
  warmSide.position.set(7, 3, 5)
  warmSide.scale.set(0.2, 6, 8)
  envScene.add(warmSide)

  const coolSide = new THREE.Mesh(
    boxGeo,
    new THREE.MeshBasicMaterial({ color: new THREE.Color('#bce6ff').multiplyScalar(2.0) })
  )
  coolSide.position.set(-7, 3, -5)
  coolSide.scale.set(0.2, 6, 8)
  envScene.add(coolSide)

  const pmrem = new THREE.PMREMGenerator(renderer)
  const envTex = pmrem.fromScene(envScene, 0.04).texture
  pmrem.dispose()
  boxGeo.dispose()
  return envTex
}
