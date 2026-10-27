import { characterAssetPath, loadRealisticCharacter, type RealisticCharacter } from '../game/realisticCharacters'
import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import type { PlayerConfig } from '../game/engine'
import {
  applyShowcaseIKPose,
  buildAthleticPlayerRig,
  computeAppearanceKey,
  createMatchBallMesh,
  createStudioEnvironment,
  defaultAppearanceForIndex,
  type PlayerRig3D,
} from '../game/playerModel3d'

export type ShowcaseCameraMode = 'squad' | 'face' | 'body'

interface PreMatchShowcase3DProps {
  players: PlayerConfig[]
  numbers: number[]
  selectedPlayer: number
  cameraMode: ShowcaseCameraMode
  onSelectCameraMode: (mode: ShowcaseCameraMode) => void
  onSelectPlayer?: (index: number) => void
}

// Authentic FC Barcelona / Champions League 2-Row Pre-Match Squad Photo Formation + Bench Substitutes
// Every slot has y = 0 so ALL boots rest cleanly on top of the pitch grass with zero clipping!
// Back Row: 6 standing players (5 outfield + Goalkeeper #0 on the right end, just like Barcelona's lineup photo)
// Front Row: 5 players in the classic half-squat / hands-on-knees team photo pose
// Bench Slots (11+): Standing on the outer flanks so all 13+ squad & user-created players are visible in 3D!
const SQUAD_POSE_SLOTS: { x: number; y: number; z: number; row: 'front' | 'back' }[] = [
  // Slot 0 (#0 Goalkeeper): Right end of Back Row in contrasting Green Keeper Kit
  { x: 1.65, y: 0, z: -0.52, row: 'back' },
  // Slots 1..5: Back Row Standing Outfielders (left to right)
  { x: -1.65, y: 0, z: -0.52, row: 'back' },
  { x: -0.99, y: 0, z: -0.54, row: 'back' },
  { x: -0.33, y: 0, z: -0.55, row: 'back' },
  { x: 0.33, y: 0, z: -0.55, row: 'back' },
  { x: 0.99, y: 0, z: -0.54, row: 'back' },
  // Slots 6..10: Front Row Half-Squat / Hands-on-Knees Star Players (staggered in the windows!)
  { x: -1.32, y: 0, z: 0.46, row: 'front' },
  { x: -0.66, y: 0, z: 0.48, row: 'front' },
  { x: 0.0, y: 0, z: 0.5, row: 'front' },
  { x: 0.66, y: 0, z: 0.48, row: 'front' },
  { x: 1.32, y: 0, z: 0.46, row: 'front' },
  // Slots 11..16: Bench Substitutes & User-Created Scanned Players
  { x: -2.28, y: 0, z: -0.36, row: 'back' },
  { x: 2.28, y: 0, z: -0.36, row: 'back' },
  { x: -1.96, y: 0, z: 0.38, row: 'front' },
  { x: 1.96, y: 0, z: 0.38, row: 'front' },
  { x: -2.62, y: 0, z: -0.15, row: 'back' },
  { x: 2.62, y: 0, z: -0.15, row: 'back' },
]

export function PreMatchShowcase3D({
  players,
  numbers,
  selectedPlayer,
  cameraMode,
  onSelectCameraMode,
  onSelectPlayer,
}: PreMatchShowcase3DProps) {
  const mountRef = useRef<HTMLDivElement>(null)
  const stateRef = useRef({ players, numbers, selectedPlayer, cameraMode, onSelectPlayer })
  stateRef.current = { players, numbers, selectedPlayer, cameraMode, onSelectPlayer }

  useEffect(() => {
    const container = mountRef.current
    if (!container) return

    const canvas = document.createElement('canvas')
    canvas.style.width = '100%'
    canvas.style.height = '100%'
    canvas.style.display = 'block'
    canvas.style.cursor = 'pointer'
    container.innerHTML = ''
    container.appendChild(canvas)

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.outputColorSpace = THREE.SRGBColorSpace
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.08
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap

    const scene = new THREE.Scene()
    scene.background = new THREE.Color('#0d221c')
    scene.fog = new THREE.Fog('#0d221c', 7.5, 19)

    scene.environment = createStudioEnvironment(renderer)

    const camera = new THREE.PerspectiveCamera(27, 16 / 10, 0.1, 60)

    // Stadium Floodlight, Real-Time Soft Shadow Key Light & Rim Lighting
    const hemi = new THREE.HemisphereLight('#f2f8ff', '#1b432c', 1.25)
    scene.add(hemi)

    const keyLight = new THREE.DirectionalLight('#fff6e8', 2.45)
    keyLight.position.set(2.8, 5.8, 4.6)
    keyLight.castShadow = true
    keyLight.shadow.mapSize.set(2048, 2048)
    keyLight.shadow.camera.left = -3.2
    keyLight.shadow.camera.right = 3.2
    keyLight.shadow.camera.top = 2.8
    keyLight.shadow.camera.bottom = -2.2
    keyLight.shadow.camera.near = 0.8
    keyLight.shadow.camera.far = 15
    keyLight.shadow.bias = -0.00025
    keyLight.shadow.normalBias = 0.012
    keyLight.shadow.radius = 2.6
    scene.add(keyLight)

    const fillLight = new THREE.DirectionalLight('#d8ecff', 0.9)
    fillLight.position.set(-4.2, 3.2, 4.0)
    scene.add(fillLight)

    const rimLight = new THREE.DirectionalLight('#dfff57', 0.95)
    rimLight.position.set(0, 4.5, -4.5)
    scene.add(rimLight)

    // Mowed Stadium Pitch Turf Pedestal (top surface at y = 0.00)
    const turfGroup = new THREE.Group()
    scene.add(turfGroup)

    const turf = new THREE.Mesh(
      new THREE.CylinderGeometry(4.4, 4.6, 0.18, 56),
      new THREE.MeshStandardMaterial({ color: '#2b6e40', roughness: 0.86 })
    )
    turf.position.y = -0.09
    turf.receiveShadow = true
    turfGroup.add(turf)

    // Subtle mowed grass stripes on the showcase pitch
    for (let s = -3; s <= 3; s += 2) {
      const stripe = new THREE.Mesh(
        new THREE.PlaneGeometry(0.95, 6.5),
        new THREE.MeshBasicMaterial({ color: '#c8ebb4', transparent: true, opacity: 0.065 })
      )
      stripe.rotation.x = -Math.PI / 2
      stripe.position.set(s * 0.95, 0.003, 0)
      turfGroup.add(stripe)
    }

    // Touchline white chalk stripe in front of the squad
    const chalkLine = new THREE.Mesh(
      new THREE.PlaneGeometry(7.2, 0.055),
      new THREE.MeshBasicMaterial({ color: '#eef4e8', transparent: true, opacity: 0.75 })
    )
    chalkLine.rotation.x = -Math.PI / 2
    chalkLine.position.set(0, 0.005, 1.38)
    turfGroup.add(chalkLine)

    // Pro Match Ball resting on the grass in front of the center player
    const ballCenter = createMatchBallMesh()
    ballCenter.position.set(0, 0.225, 1.12)
    scene.add(ballCenter)

    const rigs = new Map<number, PlayerRig3D>()
    const realistic = new Map<number, RealisticCharacter>()
    const pending = new Map<number, string>()
    let alive = true
    const attachRealistic = (i: number, rig: PlayerRig3D, key: string) => {
      const path = characterAssetPath(i, i === 0)
      pending.set(i, key)
      void loadRealisticCharacter(path).then(model => {
        if (!model) return
        if (!alive || pending.get(i) !== key || rigs.get(i) !== rig) { model.dispose(); return }
        realistic.get(i)?.dispose()
        realistic.set(i, model)
        rig.group.add(model.root)
        rig.body.visible = false
      })
    }
    const raycaster = new THREE.Raycaster()
    const pointer = new THREE.Vector2()

    // Click to select player directly in the 3D squad lineup
    const handlePointerDown = (e: PointerEvent) => {
      if (stateRef.current.cameraMode !== 'squad' || !stateRef.current.onSelectPlayer) return
      const rect = canvas.getBoundingClientRect()
      pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1
      pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1
      raycaster.setFromCamera(pointer, camera)

      for (const [idx, rig] of rigs.entries()) {
        const hits = raycaster.intersectObject(realistic.get(idx)?.root ?? rig.body, true)
        if (hits.length > 0) {
          stateRef.current.onSelectPlayer(idx)
          break
        }
      }
    }
    canvas.addEventListener('pointerdown', handlePointerDown)

    let rafId = 0
    let clock = 0
    let last = performance.now()

    const resize = () => {
      const w = Math.max(1, container.clientWidth)
      const h = Math.max(1, container.clientHeight)
      camera.aspect = w / h
      camera.updateProjectionMatrix()
      renderer.setSize(w, h, false)
    }
    const ro = new ResizeObserver(resize)
    ro.observe(container)
    resize()

    const camPos = new THREE.Vector3(0, 1.22, 4.95)
    const camTarget = new THREE.Vector3(0, 0.94, 0)

    const tick = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05)
      last = now
      clock += dt

      const { players: curPlayers, numbers: curNums, selectedPlayer: selIdx, cameraMode: mode } = stateRef.current
      const isSolo = mode === 'face' || mode === 'body'

      for (const [existingIdx, existingRig] of rigs.entries()) {
        if (existingIdx >= curPlayers.length) {
          scene.remove(existingRig.group)
          realistic.get(existingIdx)?.dispose()
          realistic.delete(existingIdx)
          pending.delete(existingIdx)
          rigs.delete(existingIdx)
        }
      }

      for (let i = 0; i < curPlayers.length; i++) {
        const p = curPlayers[i]
        const app = p.appearance ?? defaultAppearanceForIndex(i)
        const opts = {
          id: i,
          team: 0 as const,
          name: p.name || `Player ${i + 1}`,
          number: curNums[i] ?? i + 1,
          keeper: i === 0,
          radius: (15 * p.size) / 100,
          appearance: app,
          includeLabel: false,
          includeRing: true,
        }

        let rig = rigs.get(i)
        const key = computeAppearanceKey(opts)
        if (!rig || rig.appearanceKey !== key) {
          if (rig) scene.remove(rig.group)
          realistic.get(i)?.dispose()
          realistic.delete(i)
          rig = buildAthleticPlayerRig(opts)
          scene.add(rig.group)
          rigs.set(i, rig)
          attachRealistic(i, rig, key)
        }

        if (isSolo) {
          rig.group.visible = i === selIdx
          if (i === selIdx) {
            rig.group.position.set(0, 0, 0)
            rig.group.rotation.y = Math.sin(clock * 0.55) * 0.28
            rig.ring.visible = false
            if (!realistic.has(i)) applyShowcaseIKPose(rig, i, 'back', clock, true, dt)
          }
        } else {
          rig.group.visible = true
          const extraIdx = Math.max(0, i - SQUAD_POSE_SLOTS.length)
          const fallbackSlot = {
            x: (i % 2 === 0 ? -1 : 1) * (2.65 + Math.floor(extraIdx / 2) * 0.45),
            y: 0,
            z: -0.25,
            row: 'back' as const,
          }
          const slot = SQUAD_POSE_SLOTS[i] ?? fallbackSlot
          rig.group.position.set(slot.x, slot.y, slot.z)
          rig.group.rotation.y = -slot.x * 0.08
          rig.ring.visible = i === selIdx
          if (!realistic.has(i)) applyShowcaseIKPose(rig, i, slot.row, clock, false, dt)
        }
      }

      for (const model of realistic.values()) model.update(dt, 0)
      ballCenter.visible = !isSolo
      ballCenter.rotation.y = clock * 0.35

      const selectedScale = (curPlayers[selIdx]?.size ?? 100) / 100
      let desiredPos: THREE.Vector3
      let desiredLook: THREE.Vector3

      if (mode === 'face') {
        const headY = 1.88 * selectedScale
        desiredPos = new THREE.Vector3(0, headY + 0.02, 1.08)
        desiredLook = new THREE.Vector3(0, headY - 0.01, 0)
      } else if (mode === 'body') {
        // Framed so the ENTIRE player from boots on turf (y = 0) to hair crown (y = 2.08m) is 100% visible with zero cropping!
        desiredPos = new THREE.Vector3(0, 1.05 * selectedScale, 4.45 * Math.max(0.95, selectedScale))
        desiredLook = new THREE.Vector3(0, 1.02 * selectedScale, 0)
      } else {
        // Framed so all 11 starters + Bench substitutes on the flanks are visible on the turf
        desiredPos = new THREE.Vector3(0, 1.26, 5.75)
        desiredLook = new THREE.Vector3(0, 0.96, -0.05)
      }

      camPos.lerp(desiredPos, Math.min(1, dt * 6.5))
      camTarget.lerp(desiredLook, Math.min(1, dt * 6.5))
      camera.position.copy(camPos)
      camera.lookAt(camTarget)

      renderer.render(scene, camera)
      rafId = requestAnimationFrame(tick)
    }

    rafId = requestAnimationFrame(tick)

    return () => {
      alive = false
      pending.clear()
      for (const model of realistic.values()) model.dispose()
      realistic.clear()
      cancelAnimationFrame(rafId)
      canvas.removeEventListener('pointerdown', handlePointerDown)
      ro.disconnect()
      renderer.dispose()
    }
  }, [])

  return (
    <div className="showcase-3d-card">
      <div className="showcase-3d-canvas-wrap" ref={mountRef} />
      <div className="showcase-3d-controls">
        <div className="showcase-3d-badge">
          <span>3D LIVE SCAN · CLICK PLAYER TO SELECT</span>
          <strong>
            {cameraMode === 'squad'
              ? `SQUAD XI + BENCH (${players.length} PLAYERS)`
              : `#${numbers[selectedPlayer] ?? selectedPlayer + 1} ${players[selectedPlayer]?.name || `Player ${selectedPlayer + 1}`}${selectedPlayer >= 11 ? ' · BENCH' : ''}`}
          </strong>
        </div>
        <div className="showcase-camera-pills" role="group" aria-label="3D Showcase Camera View">
          <button
            type="button"
            className={cameraMode === 'squad' ? 'active' : ''}
            onClick={() => onSelectCameraMode('squad')}
          >
            Squad XI Photo
          </button>
          <button
            type="button"
            className={cameraMode === 'face' ? 'active' : ''}
            onClick={() => onSelectCameraMode('face')}
          >
            3D Face Close-Up
          </button>
          <button
            type="button"
            className={cameraMode === 'body' ? 'active' : ''}
            onClick={() => onSelectCameraMode('body')}
          >
            Full Kit 3D
          </button>
        </div>
      </div>
    </div>
  )
}
