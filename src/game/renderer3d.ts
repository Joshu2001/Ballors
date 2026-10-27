import {
  characterAssetPath,
  loadRealisticCharacter,
  type RealisticCharacter,
  type RealisticCharacterOptions,
} from './realisticCharacters'
import * as THREE from 'three'
import type {
  DribbleType,
  GameStatus,
  NetColorType,
  NetStyleType,
  PitchType,
  PlayerAction,
  WeatherType,
} from './engine'
import {
  animateAthleticPlayerRig,
  buildAthleticPlayerRig,
  computeAppearanceKey,
  createLightweightPlayerRig,
  createMatchBallMesh,
  createStudioEnvironment,
  type BuildPlayerOptions,
  type PlayerAppearance,
  type PlayerRig3D,
} from './playerModel3d'

export type RenderPlayer = {
  id: number
  team: 0 | 1
  x: number
  y: number
  vx: number
  vy: number
  radius: number
  name: string
  number: number
  keeper: boolean
  facingX: number
  facingY: number
  action: PlayerAction
  actionTime: number
  sprinting: boolean
  skill: DribbleType
  appearance?: PlayerAppearance
}

export type RenderBall = {
  x: number
  y: number
  z: number
  vx: number
  vy: number
  vz: number
  curve?: number
}

const sx = (x: number) => x / 10 - 60
const sz = (y: number) => y / 10 - 35
const W_HALF = 600
const clamp01 = (v: number) => Math.max(0, Math.min(1, v))
const mat = (color: string | number, roughness = 0.75, metalness = 0.02) =>
  new THREE.MeshStandardMaterial({ color, roughness, metalness })
const mesh = (
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

export class Match3DRenderer {
  private renderer: THREE.WebGLRenderer
  private scene = new THREE.Scene()
  private camera = new THREE.PerspectiveCamera(32, 12 / 7, 0.1, 350)
  private rigs = new Map<number, PlayerRig3D>()
  private realistic = new Map<number, RealisticCharacter>()
  private pendingModels = new Map<number, string>()
  private disposed = false
  private attachRealistic(
    id: number,
    rig: PlayerRig3D,
    key: string,
    opts: RealisticCharacterOptions,
    fallbackOpts: BuildPlayerOptions
  ) {
    this.pendingModels.set(id, key)
    void loadRealisticCharacter(characterAssetPath(id, Boolean(opts.keeper)), 1.92, opts).then(model => {
      if (this.disposed || this.pendingModels.get(id) !== key || this.rigs.get(id) !== rig) {
        model?.dispose()
        return
      }
      if (!model) {
        const fb = buildAthleticPlayerRig(fallbackOpts, this.makeLabel)
        fb.group.position.copy(rig.group.position)
        fb.group.rotation.copy(rig.group.rotation)
        this.scene.remove(rig.group)
        this.scene.add(fb.group)
        this.rigs.set(id, fb)
        return
      }
      this.realistic.get(id)?.dispose()
      this.realistic.set(id, model)
      rig.group.add(model.root)
      rig.body.visible = false
    })
  }
  private ball: THREE.Group
  private ballShadow: THREE.Mesh
  private clock = 0
  private pitch: PitchType
  private observer: ResizeObserver
  private resizeRafId = 0
  private lastW = 0
  private lastH = 0
  private cameraX = 0
  private narrow = false
  private weather: WeatherType
  private netStyle: NetStyleType
  private netColor: NetColorType
  private rain: THREE.Points | null = null
  private rainPositions: Float32Array | null = null
  private sunLight!: THREE.DirectionalLight
  private sunTarget = new THREE.Object3D()
  private rimLight!: THREE.DirectionalLight
  private fillLight!: THREE.DirectionalLight
  private stadiumFloods: THREE.PointLight[] = []
  private fps = 60
  private fpsClock = 0
  private frameCount = 0

  constructor(
    canvas: HTMLCanvasElement,
    pitch: PitchType,
    weather: WeatherType,
    netStyle: NetStyleType = 'box-pro',
    netColor: NetColorType = 'white'
  ) {
    this.pitch = pitch
    this.weather = weather
    this.netStyle = netStyle
    this.netColor = netColor
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      powerPreference: 'high-performance',
      preserveDrawingBuffer: true,
    })
    const gl = this.renderer.getContext()
    const dbg = gl.getExtension('WEBGL_debug_renderer_info')
    const glRendererStr = `${gl.getParameter(gl.RENDERER)} ${dbg ? gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL) : ''}`
    const isSoftwareGl = /SwiftShader|llvmpipe|softpipe|Subzero/i.test(glRendererStr)

    this.renderer.setPixelRatio(
      isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, window.innerWidth < 800 ? 1.35 : 1.75)
    )
    this.renderer.shadowMap.enabled = !isSoftwareGl
    this.renderer.shadowMap.type = THREE.PCFShadowMap
    this.renderer.outputColorSpace = THREE.SRGBColorSpace
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping
    this.renderer.toneMappingExposure = this.weather === 'rain' ? 1.08 : 1.04

    if (!isSoftwareGl) {
      this.scene.environment = createStudioEnvironment(this.renderer)
    }

    const sky = this.weather === 'clear' ? '#8fa9b0' : this.weather === 'cloudy' ? '#718086' : '#4e6269'
    this.scene.background = new THREE.Color(sky)
    this.scene.fog = new THREE.Fog(sky, this.weather === 'rain' ? 85 : 118, this.weather === 'rain' ? 195 : 240)

    this.buildWorld()
    if (this.weather === 'rain') this.makeRain()

    this.ball = createMatchBallMesh()
    this.scene.add(this.ball)

    this.ballShadow = new THREE.Mesh(
      new THREE.CircleGeometry(0.26, 20),
      new THREE.MeshBasicMaterial({
        color: '#05130b',
        transparent: true,
        opacity: 0.34,
        depthWrite: false,
        polygonOffset: true,
        polygonOffsetFactor: -1,
      })
    )
    this.ballShadow.rotation.x = -Math.PI / 2
    this.ballShadow.position.y = 0.018
    this.scene.add(this.ballShadow)

    this.observer = new ResizeObserver(() => {
      cancelAnimationFrame(this.resizeRafId)
      this.resizeRafId = requestAnimationFrame(() => this.resize(canvas))
    })
    this.observer.observe(canvas.parentElement || canvas)
    this.resize(canvas)
  }

  private resize(canvas: HTMLCanvasElement) {
    if (this.disposed) return
    const parent = canvas.parentElement
    const width = Math.max(1, Math.round(parent?.clientWidth || canvas.clientWidth || 1200))
    const height = Math.max(1, Math.round(parent?.clientHeight || canvas.clientHeight || 700))
    if (width === this.lastW && height === this.lastH) return
    this.lastW = width
    this.lastH = height
    this.narrow = width / height < 1.15
    this.camera.aspect = width / height
    this.camera.fov = this.narrow ? 43 : 32
    this.camera.updateProjectionMatrix()
    this.renderer.setSize(width, height, false)
  }

  private grassTexture() {
    const c = document.createElement('canvas')
    c.width = 256
    c.height = 256
    const ctx = c.getContext('2d')!
    ctx.fillStyle = this.weather === 'rain' ? '#235f3c' : this.pitch === 'turf' ? '#267452' : '#347b43'
    ctx.fillRect(0, 0, 256, 256)
    let seed = 9127
    for (let i = 0; i < 6400; i++) {
      seed = (seed * 16807) % 2147483647
      const x = seed % 256
      seed = (seed * 16807) % 2147483647
      const y = seed % 256
      ctx.fillStyle = i % 3 ? 'rgba(215,240,175,.065)' : 'rgba(4,45,20,.095)'
      ctx.fillRect(x, y, 1, 3)
    }
    const texture = new THREE.CanvasTexture(c)
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping
    texture.repeat.set(20, 12)
    texture.colorSpace = THREE.SRGBColorSpace
    texture.anisotropy = Math.min(8, this.renderer.capabilities.getMaxAnisotropy())
    return texture
  }

  private buildWorld() {
    // 1. Ambient Sky-to-Pitch Bounce Hemisphere Light
    const hemi = new THREE.HemisphereLight(
      '#e9f4ff',
      '#1e462a',
      this.weather === 'clear' ? 1.05 : this.weather === 'rain' ? 1.12 : 0.95
    )
    this.scene.add(hemi)

    // 2. Dynamic Camera-Tracking Primary Sun / Stadium Floodlight with 2048x2048 Soft Shadows
    this.scene.add(this.sunTarget)
    this.sunLight = new THREE.DirectionalLight(
      this.weather === 'clear' ? '#fff5e2' : '#dceaf2',
      this.weather === 'clear' ? 2.35 : this.weather === 'rain' ? 1.75 : 1.55
    )
    this.sunLight.position.set(-18, 44, 24)
    this.sunLight.target = this.sunTarget
    this.sunLight.castShadow = true
    this.sunLight.shadow.mapSize.set(2048, 2048)
    this.sunLight.shadow.camera.left = -36
    this.sunLight.shadow.camera.right = 36
    this.sunLight.shadow.camera.top = 28
    this.sunLight.shadow.camera.bottom = -28
    this.sunLight.shadow.camera.near = 8
    this.sunLight.shadow.camera.far = 115
    this.sunLight.shadow.bias = -0.00025
    this.sunLight.shadow.normalBias = 0.014
    this.sunLight.shadow.radius = 2.6
    this.scene.add(this.sunLight)

    // 3. Dynamic Stadium Back-Rim Light & Cool Fill Light for 3D Player Depth
    this.rimLight = new THREE.DirectionalLight(
      this.weather === 'rain' ? '#b8e8ff' : '#eef7d2',
      this.weather === 'clear' ? 0.92 : 0.78
    )
    this.rimLight.position.set(14, 24, -34)
    this.scene.add(this.rimLight)

    this.fillLight = new THREE.DirectionalLight('#cce4ff', 0.58)
    this.fillLight.position.set(26, 20, 32)
    this.scene.add(this.fillLight)

    // 4. Four Corner Stadium Floodlight PointLights for Real-Time Specular Highlights
    this.stadiumFloods = []
    for (const fx of [-36, 36]) {
      for (const fz of [-36, 36]) {
        const flood = new THREE.PointLight('#edf7ff', 45, 95, 1.6)
        flood.position.set(fx, 15.5, fz)
        this.scene.add(flood)
        this.stadiumFloods.push(flood)
      }
    }

    const ground = mesh(
      new THREE.PlaneGeometry(175, 130),
      mat(this.pitch === 'street' ? '#354046' : '#266338'),
      this.scene,
      0,
      -0.04,
      0,
      false
    )
    ground.rotation.x = -Math.PI / 2
    ground.receiveShadow = true

    const fieldMat =
      this.pitch === 'street'
        ? mat('#536168', 0.94)
        : new THREE.MeshStandardMaterial({
            map: this.grassTexture(),
            roughness: this.weather === 'rain' ? 0.68 : 0.88,
            metalness: 0.02,
            color: '#ffffff',
          })
    const field = mesh(new THREE.PlaneGeometry(120, 70), fieldMat, this.scene, 0, 0, 0, false)
    field.rotation.x = -Math.PI / 2
    field.receiveShadow = true

    if (this.pitch !== 'street') {
      const stripeMat = new THREE.MeshStandardMaterial({
        color: '#d9f0be',
        transparent: true,
        opacity: 0.075,
        roughness: this.weather === 'rain' ? 0.68 : 0.88,
        depthWrite: false,
        polygonOffset: true,
        polygonOffsetFactor: -1,
      })
      for (let i = 0; i < 12; i += 2) {
        const stripe = mesh(
          new THREE.PlaneGeometry(10, 70),
          stripeMat,
          this.scene,
          -55 + i * 10,
          0.004,
          0,
          false
        )
        stripe.rotation.x = -Math.PI / 2
        stripe.receiveShadow = true
      }
    }

    this.addLines()
    // FIXED GOAL NET ORIENTATION:
    // Left goal at x = -60 extends OUTWARD behind the goal line in direction -1 (to x = -62.35)
    // Right goal at x = +60 extends OUTWARD behind the goal line in direction +1 (to x = +62.35)
    this.addGoal(-60, -1)
    this.addGoal(60, 1)
    this.addStadium()
    this.camera.position.set(0, 27, 43)
    this.camera.lookAt(0, 0.5, -2)
  }

  private addLines() {
    const lineMat = new THREE.MeshBasicMaterial({ color: '#eef3df' })
    const line = (w: number, d: number, x: number, z: number) => {
      const m = mesh(new THREE.BoxGeometry(w, 0.018, d), lineMat, this.scene, x, 0.025, z, false)
      m.receiveShadow = false
    }
    line(120, 0.12, 0, -35)
    line(120, 0.12, 0, 35)
    line(0.12, 70, -60, 0)
    line(0.12, 70, 60, 0)
    line(0.12, 70, 0, 0)

    const circle = mesh(new THREE.RingGeometry(9.12, 9.25, 80), lineMat, this.scene, 0, 0.027, 0, false)
    circle.rotation.x = -Math.PI / 2
    const spot = mesh(new THREE.CircleGeometry(0.18, 18), lineMat, this.scene, 0, 0.028, 0, false)
    spot.rotation.x = -Math.PI / 2

    for (const side of [-1, 1]) {
      line(15, 0.12, side * 52.5, -16)
      line(15, 0.12, side * 52.5, 16)
      line(0.12, 32, side * 45, 0)
      line(6, 0.12, side * 57, -7.5)
      line(6, 0.12, side * 57, 7.5)
      line(0.12, 15, side * 54, 0)

      const penalty = mesh(new THREE.CircleGeometry(0.15, 16), lineMat, this.scene, side * 49, 0.028, 0, false)
      penalty.rotation.x = -Math.PI / 2
      const arc = mesh(
        new THREE.RingGeometry(
          9.12,
          9.24,
          40,
          1,
          side === 1 ? Math.PI * 0.64 : -Math.PI * 0.36,
          Math.PI * 0.72
        ),
        lineMat,
        this.scene,
        side * 49,
        0.028,
        0,
        false
      )
      arc.rotation.x = -Math.PI / 2
    }
  }

  private createNetFabricTexture(primaryHex: string, secondaryHex: string): THREE.CanvasTexture {
    const c = document.createElement('canvas')
    c.width = 256
    c.height = 256
    const ctx = c.getContext('2d')!
    ctx.clearRect(0, 0, 256, 256)

    const isStriped = primaryHex !== secondaryHex
    ctx.lineWidth = this.netStyle === 'deep-cage' ? 3.0 : 2.2

    if (this.netStyle === 'hex-stadium') {
      // Hexagonal honeycomb stadium mesh
      const r = 16
      const dx = r * 1.5
      const dy = r * Math.sqrt(3)
      for (let row = -1; row < 12; row++) {
        for (let col = -1; col < 14; col++) {
          const cx = col * dx
          const cy = row * dy + (col % 2 !== 0 ? dy / 2 : 0)
          ctx.strokeStyle = isStriped && col % 4 >= 2 ? secondaryHex : primaryHex
          ctx.beginPath()
          for (let k = 0; k < 6; k++) {
            const a = (k / 6) * Math.PI * 2
            const px = cx + Math.cos(a) * r
            const py = cy + Math.sin(a) * r
            if (k === 0) ctx.moveTo(px, py)
            else ctx.lineTo(px, py)
          }
          ctx.closePath()
          ctx.stroke()
        }
      }
    } else if (this.netStyle === 'deep-cage') {
      // Tight diamond arena weave
      const step = 24
      for (let i = -256; i <= 512; i += step) {
        ctx.strokeStyle = isStriped && Math.floor((i + 256) / step) % 2 === 0 ? secondaryHex : primaryHex
        ctx.beginPath()
        ctx.moveTo(i, 0)
        ctx.lineTo(i + 256, 256)
        ctx.moveTo(i + 256, 0)
        ctx.lineTo(i, 256)
        ctx.stroke()
      }
    } else {
      // Crisp woven square box mesh
      const step = 24
      for (let i = 0; i <= 256; i += step) {
        ctx.strokeStyle = isStriped && Math.floor(i / (step * 2)) % 2 === 1 ? secondaryHex : primaryHex
        ctx.beginPath()
        ctx.moveTo(i, 0)
        ctx.lineTo(i, 256)
        ctx.stroke()

        ctx.beginPath()
        ctx.moveTo(0, i)
        ctx.lineTo(256, i)
        ctx.stroke()
      }
    }

    const tex = new THREE.CanvasTexture(c)
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping
    tex.colorSpace = THREE.SRGBColorSpace
    return tex
  }

  private getNetPalette(): { primary: string; secondary: string; post: string; stanchion: string } {
    switch (this.netColor) {
      case 'volt':
        return { primary: '#dfff57', secondary: '#dfff57', post: '#f8faf2', stanchion: '#183028' }
      case 'sky-stripe':
        return { primary: '#7ec3e6', secondary: '#f8faf2', post: '#f8faf2', stanchion: '#143347' }
      case 'crimson-gold':
        return { primary: '#f59e0b', secondary: '#e11d48', post: '#f8faf2', stanchion: '#2c1620' }
      case 'emerald':
        return { primary: '#34d399', secondary: '#ecfdf5', post: '#f8faf2', stanchion: '#0f2e22' }
      case 'stealth-black':
        return { primary: '#1e293b', secondary: '#334155', post: '#f8faf2', stanchion: '#0f172a' }
      case 'white':
      default:
        return { primary: '#eef4ec', secondary: '#eef4ec', post: '#f8faf2', stanchion: '#1c332d' }
    }
  }

  private addGoal(x: number, outwardDir: number) {
    // outwardDir is -1 for left goal (x = -60) and +1 for right goal (x = +60)
    // so the entire net & stanchions extend strictly OUTWARD behind the goal line!
    const palette = this.getNetPalette()
    const whitePostMat = mat(palette.post, 0.2, 0.18)
    const stanchionMat = mat(palette.stanchion, 0.42, 0.32)
    const ropeMat = new THREE.LineBasicMaterial({ color: palette.primary, transparent: true, opacity: 0.78 })
    const netLineMat = new THREE.LineBasicMaterial({
      color: palette.primary,
      transparent: true,
      opacity: this.netColor === 'stealth-black' ? 0.78 : 0.62,
    })

    // Depth geometry per selectable NetStyleType:
    // 'box-pro' & 'deep-cage' have depthTop === depthBottom so the back wall is 100% vertical and NEVER leans forward!
    const depthTop =
      this.netStyle === 'box-pro'
        ? 2.45
        : this.netStyle === 'hex-stadium'
          ? 2.32
          : this.netStyle === 'deep-cage'
            ? 2.25
            : 1.65
    const depthBottom =
      this.netStyle === 'box-pro'
        ? 2.45
        : this.netStyle === 'hex-stadium'
          ? 2.52
          : this.netStyle === 'deep-cage'
            ? 2.25
            : 2.45

    const topBackX = x + outwardDir * depthTop
    const bottomBackX = x + outwardDir * depthBottom
    const halfWidth = 3.75
    const height = 2.44

    // 1. Front Goalposts & Crossbar right on the goal line x
    mesh(new THREE.CylinderGeometry(0.08, 0.08, height, 18), whitePostMat, this.scene, x, height / 2, -halfWidth)
    mesh(new THREE.CylinderGeometry(0.08, 0.08, height, 18), whitePostMat, this.scene, x, height / 2, halfWidth)
    const crossbar = mesh(
      new THREE.CylinderGeometry(0.08, 0.08, halfWidth * 2 + 0.16, 18),
      whitePostMat,
      this.scene,
      x,
      height,
      0
    )
    crossbar.rotation.x = Math.PI / 2

    // 2. Bottom Ground Anchor Frame (behind goal line)
    const backGroundBar = mesh(
      new THREE.CylinderGeometry(0.045, 0.045, halfWidth * 2, 12),
      stanchionMat,
      this.scene,
      bottomBackX,
      0.04,
      0
    )
    backGroundBar.rotation.x = Math.PI / 2

    for (const sideZ of [-halfWidth, halfWidth]) {
      const sideGroundBar = mesh(
        new THREE.CylinderGeometry(0.045, 0.045, depthBottom, 10),
        stanchionMat,
        this.scene,
        x + outwardDir * (depthBottom / 2),
        0.04,
        sideZ
      )
      sideGroundBar.rotation.z = Math.PI / 2
    }

    // 3. Stanchion Architecture per NetStyleType
    const tensionPoints: THREE.Vector3[] = []
    if (this.netStyle === 'box-pro' || this.netStyle === 'hex-stadium') {
      // UEFA / Champions League style external vertical tension poles behind the net corners
      const poleX = x + outwardDir * (depthBottom + 0.42)
      const poleH = height + 0.22
      for (const sideSign of [-1, 1]) {
        const poleZ = sideSign * (halfWidth + 0.32)
        mesh(
          new THREE.CylinderGeometry(0.042, 0.048, poleH, 12),
          stanchionMat,
          this.scene,
          poleX,
          poleH / 2,
          poleZ
        )
        // High-tension guy cables pulling the top and bottom rear net corners taut outward!
        tensionPoints.push(
          new THREE.Vector3(poleX, poleH - 0.05, poleZ),
          new THREE.Vector3(topBackX, height, sideSign * halfWidth),
          new THREE.Vector3(poleX, 0.08, poleZ),
          new THREE.Vector3(bottomBackX, 0.04, sideSign * halfWidth)
        )
      }
      // Top rear horizontal tension cable across back of roof
      tensionPoints.push(
        new THREE.Vector3(topBackX, height, -halfWidth),
        new THREE.Vector3(topBackX, height, halfWidth)
      )
    } else if (this.netStyle === 'deep-cage') {
      // Solid steel rear cage frame (rear corner posts + rear top crossbar + side roof rails)
      const rearCrossbar = mesh(
        new THREE.CylinderGeometry(0.055, 0.055, halfWidth * 2 + 0.1, 14),
        stanchionMat,
        this.scene,
        topBackX,
        height,
        0
      )
      rearCrossbar.rotation.x = Math.PI / 2

      for (const sideZ of [-halfWidth, halfWidth]) {
        mesh(
          new THREE.CylinderGeometry(0.055, 0.055, height, 14),
          stanchionMat,
          this.scene,
          topBackX,
          height / 2,
          sideZ
        )
        const topRail = mesh(
          new THREE.CylinderGeometry(0.05, 0.05, depthTop, 12),
          stanchionMat,
          this.scene,
          x + outwardDir * (depthTop / 2),
          height,
          sideZ
        )
        topRail.rotation.z = Math.PI / 2
      }
    } else {
      // 'classic-slope': Top elbow bars + diagonal rear support struts
      for (const sideZ of [-halfWidth, halfWidth]) {
        const topSupportBar = mesh(
          new THREE.CylinderGeometry(0.042, 0.042, depthTop, 10),
          stanchionMat,
          this.scene,
          x + outwardDir * (depthTop / 2),
          height - 0.02,
          sideZ
        )
        topSupportBar.rotation.z = Math.PI / 2
      }
    }

    if (tensionPoints.length > 0) {
      this.scene.add(new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(tensionPoints), ropeMat))
    }

    // 4. Translucent Woven Fabric Net Panels (Roof, Back Wall, Left & Right Side Walls)
    const fabricTex = this.createNetFabricTexture(palette.primary, palette.secondary)
    const buildQuadPanel = (
      p0: THREE.Vector3,
      p1: THREE.Vector3,
      p2: THREE.Vector3,
      p3: THREE.Vector3,
      repU: number,
      repV: number
    ) => {
      const tex = fabricTex.clone()
      tex.needsUpdate = true
      tex.repeat.set(repU, repV)
      const geo = new THREE.BufferGeometry()
      const vertices = new Float32Array([
        p0.x, p0.y, p0.z,
        p1.x, p1.y, p1.z,
        p2.x, p2.y, p2.z,
        p0.x, p0.y, p0.z,
        p2.x, p2.y, p2.z,
        p3.x, p3.y, p3.z,
      ])
      const uvs = new Float32Array([
        0, 0,
        1, 0,
        1, 1,
        0, 0,
        1, 1,
        0, 1,
      ])
      geo.setAttribute('position', new THREE.BufferAttribute(vertices, 3))
      geo.setAttribute('uv', new THREE.BufferAttribute(uvs, 2))
      geo.computeVertexNormals()
      const panelMat = new THREE.MeshBasicMaterial({
        map: tex,
        transparent: true,
        opacity: 0.55,
        side: THREE.DoubleSide,
        depthWrite: false,
      })
      const panelMesh = new THREE.Mesh(geo, panelMat)
      this.scene.add(panelMesh)
    }

    // Roof panel
    buildQuadPanel(
      new THREE.Vector3(x, height, -halfWidth),
      new THREE.Vector3(x, height, halfWidth),
      new THREE.Vector3(topBackX, height, halfWidth),
      new THREE.Vector3(topBackX, height, -halfWidth),
      6,
      2
    )
    // Back wall panel (vertical when depthTop === depthBottom!)
    buildQuadPanel(
      new THREE.Vector3(bottomBackX, 0.04, -halfWidth),
      new THREE.Vector3(bottomBackX, 0.04, halfWidth),
      new THREE.Vector3(topBackX, height, halfWidth),
      new THREE.Vector3(topBackX, height, -halfWidth),
      6,
      2.2
    )
    // Left & Right side panels
    for (const sideZ of [-halfWidth, halfWidth]) {
      buildQuadPanel(
        new THREE.Vector3(x, 0.04, sideZ),
        new THREE.Vector3(bottomBackX, 0.04, sideZ),
        new THREE.Vector3(topBackX, height, sideZ),
        new THREE.Vector3(x, height, sideZ),
        2.2,
        2.2
      )
    }

    // 5. Crisp 3D Structural Net Strands (gives sharp visual depth at all camera distances)
    const points: THREE.Vector3[] = []
    const zSteps = 26
    for (let i = 0; i <= zSteps; i++) {
      const z = -halfWidth + (i / zSteps) * (halfWidth * 2)
      points.push(new THREE.Vector3(x, height, z), new THREE.Vector3(topBackX, height, z))
      points.push(new THREE.Vector3(topBackX, height, z), new THREE.Vector3(bottomBackX, 0.04, z))
    }

    const roofSteps = 7
    for (let i = 1; i <= roofSteps; i++) {
      const t = i / roofSteps
      const rx = x + (topBackX - x) * t
      points.push(new THREE.Vector3(rx, height, -halfWidth), new THREE.Vector3(rx, height, halfWidth))
    }

    const ySteps = 12
    for (let i = 0; i <= ySteps; i++) {
      const t = i / ySteps
      const y = 0.04 + t * (height - 0.04)
      const backXAtY = bottomBackX + (topBackX - bottomBackX) * t
      points.push(new THREE.Vector3(backXAtY, y, -halfWidth), new THREE.Vector3(backXAtY, y, halfWidth))
      points.push(new THREE.Vector3(x, y, -halfWidth), new THREE.Vector3(backXAtY, y, -halfWidth))
      points.push(new THREE.Vector3(x, y, halfWidth), new THREE.Vector3(backXAtY, y, halfWidth))
    }

    const sideSteps = 10
    for (let i = 1; i < sideSteps; i++) {
      const u = i / sideSteps
      const sxBottom = x + outwardDir * (depthBottom * u)
      const sxTop = x + outwardDir * (depthTop * u)
      points.push(new THREE.Vector3(sxBottom, 0.04, -halfWidth), new THREE.Vector3(sxTop, height, -halfWidth))
      points.push(new THREE.Vector3(sxBottom, 0.04, halfWidth), new THREE.Vector3(sxTop, height, halfWidth))
    }

    const netSegments = new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(points), netLineMat)
    this.scene.add(netSegments)
  }

  private addStadium() {
    const concrete = mat('#59696b')
    const dark = mat('#23373a')
    for (const side of [-1, 1]) {
      for (let tier = 0; tier < 6; tier++) {
        mesh(
          new THREE.BoxGeometry(148, 0.8, 1.7),
          concrete,
          this.scene,
          0,
          0.6 + tier * 0.85,
          side * (39 + tier * 1.6),
          false
        )
      }
      const seats = new THREE.InstancedMesh(new THREE.BoxGeometry(0.7, 0.55, 0.5), mat('#ffffff'), 6 * 74)
      const dummy = new THREE.Object3D()
      const colors = ['#d7e5df', '#315c64', '#83a7a4', '#d7c85b'].map(c => new THREE.Color(c))
      let index = 0
      for (let tier = 0; tier < 6; tier++) {
        for (let i = 0; i < 74; i++) {
          dummy.position.set(-72 + i * 2, 1.25 + tier * 0.85, side * (39 + tier * 1.6))
          dummy.rotation.y = ((i % 5) - 2) * 0.03
          dummy.updateMatrix()
          seats.setMatrixAt(index, dummy.matrix)
          seats.setColorAt(index, colors[(i * 7 + tier * 3) % colors.length])
          index++
        }
      }
      seats.computeBoundingSphere()
      seats.receiveShadow = true
      this.scene.add(seats)

      const roof = mesh(new THREE.BoxGeometry(154, 0.45, 10), dark, this.scene, 0, 10.2, side * 46, false)
      roof.rotation.x = side * 0.08
      for (const x of [-65, -30, 30, 65]) {
        mesh(new THREE.CylinderGeometry(0.1, 0.15, 15, 8), dark, this.scene, x, 7.5, side * 44, false)
        const lamp = mesh(
          new THREE.BoxGeometry(4.5, 1.8, 0.35),
          new THREE.MeshStandardMaterial({
            color: '#e9f3e8',
            emissive: '#d7edff',
            emissiveIntensity: 0.55,
          }),
          this.scene,
          x,
          15,
          side * 44,
          false
        )
        lamp.rotation.x = side * 0.25
      }
      mesh(new THREE.BoxGeometry(124, 1.15, 0.25), dark, this.scene, 0, 0.65, side * 37, false)
    }

    const c = document.createElement('canvas')
    c.width = 512
    c.height = 64
    const ctx = c.getContext('2d')!
    ctx.fillStyle = '#14363a'
    ctx.fillRect(0, 0, 512, 64)
    ctx.fillStyle = '#dfff57'
    ctx.font = '700 28px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('MATCHDAY  /  PLAY YOUR WAY', 256, 43)
    const boardTexture = new THREE.CanvasTexture(c)
    boardTexture.colorSpace = THREE.SRGBColorSpace
    for (const side of [-1, 1]) {
      for (let i = 0; i < 12; i++) {
        const panel = mesh(
          new THREE.PlaneGeometry(10, 1),
          new THREE.MeshBasicMaterial({ map: boardTexture }),
          this.scene,
          -55 + i * 10,
          0.7,
          side * 36.84,
          false
        )
        panel.rotation.y = side === 1 ? Math.PI : 0
      }
    }
  }

  private makeRain() {
    const count = 720
    this.rainPositions = new Float32Array(count * 3)
    let seed = 7331
    const random = () => {
      seed = (seed * 16807) % 2147483647
      return (seed - 1) / 2147483646
    }
    for (let i = 0; i < count; i++) {
      this.rainPositions[i * 3] = random() * 170 - 85
      this.rainPositions[i * 3 + 1] = random() * 34
      this.rainPositions[i * 3 + 2] = random() * 110 - 55
    }
    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.BufferAttribute(this.rainPositions, 3))
    const material = new THREE.PointsMaterial({
      color: '#d9edf3',
      size: 0.085,
      transparent: true,
      opacity: 0.68,
      depthWrite: false,
    })
    this.rain = new THREE.Points(geometry, material)
    this.scene.add(this.rain)
  }

  private makeLabel = (name: string, number: number, keeper: boolean) => {
    const c = document.createElement('canvas')
    c.width = 256
    c.height = 56
    const ctx = c.getContext('2d')!
    ctx.fillStyle = 'rgba(8,25,24,.82)'
    ctx.beginPath()
    ctx.roundRect(20, 5, 216, 40, 9)
    ctx.fill()
    ctx.fillStyle = keeper ? '#ffd867' : '#f3f5ed'
    ctx.font = '700 22px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText(`${number}  ${name}${keeper ? ' · GK' : ''}`, 128, 33)
    const texture = new THREE.CanvasTexture(c)
    texture.colorSpace = THREE.SRGBColorSpace
    const sprite = new THREE.Sprite(
      new THREE.SpriteMaterial({ map: texture, transparent: true, depthTest: false })
    )
    sprite.scale.set(2.15, 0.47, 1)
    return sprite
  }

  render(players: RenderPlayer[], ball: RenderBall, controlled: number, status: GameStatus, dt: number) {
    this.clock += Math.min(dt, 0.05)
    this.fpsClock += dt
    this.frameCount++
    if (this.fpsClock >= 0.75) {
      this.fps = Math.round(this.frameCount / this.fpsClock)
      this.fpsClock = 0
      this.frameCount = 0
    }
    if (this.rain && this.rainPositions) {
      for (let i = 0; i < this.rainPositions.length; i += 3) {
        this.rainPositions[i + 1] -= dt * 24
        this.rainPositions[i] -= dt * 2.4
        if (this.rainPositions[i + 1] < 0) {
          this.rainPositions[i + 1] += 34
          this.rainPositions[i] += 5
        }
        if (this.rainPositions[i] > 85) this.rainPositions[i] = -85
      }
      this.rain.geometry.attributes.position.needsUpdate = true
    }

    const ballWorldX = sx(ball.x)
    const ballWorldZ = sz(ball.y)

    for (const p of players) {
      const desiredKey = computeAppearanceKey({
        id: p.id,
        team: p.team,
        name: p.name,
        number: p.number,
        keeper: p.keeper,
        radius: p.radius,
        appearance: p.appearance,
      })
      let rig = this.rigs.get(p.id)
      if (!rig || rig.appearanceKey !== desiredKey) {
        if (rig) this.scene.remove(rig.group)
        this.realistic.get(p.id)?.dispose()
        this.realistic.delete(p.id)
        const rigOpts: BuildPlayerOptions = {
          id: p.id,
          team: p.team,
          name: p.name,
          number: p.number,
          keeper: p.keeper,
          radius: p.radius,
          appearance: p.appearance,
          includeLabel: true,
          includeRing: true,
        }
        rig = createLightweightPlayerRig(rigOpts, this.makeLabel)
        this.scene.add(rig.group)
        this.rigs.set(p.id, rig)
        this.attachRealistic(
          p.id,
          rig,
          desiredKey,
          {
            index: p.id,
            team: p.team,
            number: p.number,
            name: p.name,
            keeper: p.keeper,
            appearance: p.appearance,
          },
          rigOpts
        )
      }

      const px = sx(p.x)
      const pz = sz(p.y)
      rig.group.position.set(px, 0.01, pz)

      animateAthleticPlayerRig(
        rig,
        p,
        { x: ballWorldX, z: ballWorldZ },
        { x: px, z: pz },
        this.clock,
        dt
      )

      const rModel = this.realistic.get(p.id)
      if (rModel) {
        rModel.update(dt, Math.hypot(p.vx, p.vy), {
          sprinting: p.sprinting,
          action: p.action,
          actionTime: p.actionTime,
          turnRate: rig.kinematics?.smoothedTurnRate ?? 0,
        })
      }
      rig.ring.visible = p.id === controlled
      if (rig.label) rig.label.visible = p.id === controlled || p.keeper
    }

    // Realistic ball position, rolling spin & curve spin, and ground contact shadow
    const ballHeight = 0.225 + ball.z / 100
    this.ball.position.set(ballWorldX, ballHeight, ballWorldZ)
    this.ball.rotation.z -= ball.vx * dt * 0.0032
    this.ball.rotation.x += ball.vy * dt * 0.0032
    this.ball.rotation.y += (ball.curve ?? 0) * dt * 0.08

    const shadowScale = Math.max(0.42, 1 - ball.z / 280)
    this.ballShadow.position.set(ballWorldX, 0.02, ballWorldZ)
    this.ballShadow.scale.setScalar(shadowScale)

    const targetX = clamp01((ball.x + 60) / 1320) * 120 - 60
    this.cameraX += (Math.max(-44, Math.min(44, targetX)) - this.cameraX) * Math.min(1, dt * 4.6)
    const attacking = clamp01((Math.abs(ball.x - W_HALF) - 250) / 350)
    const baseY = (this.narrow ? 32 : 19) + attacking * 3
    const baseZ = (this.narrow ? 49 : 29) + attacking * 5
    this.camera.position.set(this.cameraX, baseY, baseZ)
    this.camera.lookAt(this.cameraX, 0.55, ballWorldZ * 0.12 - (this.narrow ? 0 : 3))

    // Dynamic Real-Time Shadow-Camera & Floodlight Tracking:
    // Keeps the 2048x2048 PCFSoftShadowMap frustum centered on the active play for maximum shadow sharpness
    const focusZ = ballWorldZ * 0.25
    this.sunTarget.position.set(this.cameraX, 0, focusZ)
    this.sunTarget.updateMatrixWorld()
    this.sunLight.position.set(
      this.cameraX - 18 + Math.sin(this.clock * 0.18) * 1.1,
      44,
      focusZ + 22
    )
    this.rimLight.position.set(this.cameraX + (ballWorldX - this.cameraX) * 0.35, 24, -34)
    this.fillLight.position.set(this.cameraX + 24, 20, 32)

    this.renderer.render(this.scene, this.camera)
    void status
  }

  ballScreenPosition() {
    const rect = this.renderer.domElement.getBoundingClientRect()
    const projected = this.ball.position.clone().project(this.camera)
    return {
      x: (projected.x * 0.5 + 0.5) * rect.width,
      y: (-projected.y * 0.5 + 0.5) * rect.height,
    }
  }

  getStats() {
    const gl = this.renderer.getContext()
    return {
      calls: this.renderer.info.render.calls,
      triangles: this.renderer.info.render.triangles,
      fps: this.fps,
      renderer: gl.getParameter(gl.RENDERER),
    }
  }

  destroy() {
    cancelAnimationFrame(this.resizeRafId)
    this.observer.disconnect()
    const textures = new Set<THREE.Texture>()
    const materials = new Set<THREE.Material>()
    const geometries = new Set<THREE.BufferGeometry>()
    this.scene.traverse(obj => {
      if (
        obj instanceof THREE.Mesh ||
        obj instanceof THREE.LineSegments ||
        obj instanceof THREE.Sprite ||
        obj instanceof THREE.Points
      ) {
        if ('geometry' in obj && obj.geometry) geometries.add(obj.geometry)
        const mats = Array.isArray(obj.material) ? obj.material : [obj.material]
        mats.forEach(m => {
          materials.add(m)
          if ('map' in m && m.map) textures.add(m.map as THREE.Texture)
        })
      }
    })
    textures.forEach(t => t.dispose())
    materials.forEach(m => m.dispose())
    geometries.forEach(g => g.dispose())
    this.disposed = true
    this.pendingModels.clear()
    for (const model of this.realistic.values()) model.dispose()
    this.realistic.clear()
    this.renderer.dispose()
  }
}
