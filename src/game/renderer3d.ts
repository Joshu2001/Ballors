import * as THREE from 'three'
import type { DribbleType, GameStatus, PitchType, PlayerAction, WeatherType } from './engine'

type RenderPlayer = {
  id: number; team: 0 | 1; x: number; y: number; vx: number; vy: number; radius: number
  name: string; number: number; keeper: boolean; facingX: number; facingY: number
  action: PlayerAction; actionTime: number; sprinting: boolean; skill: DribbleType
}
type RenderBall = { x: number; y: number; z: number; vx: number; vy: number; vz: number }
type Limb = { upper: THREE.Group; lower: THREE.Group }
type Rig = {
  group: THREE.Group; body: THREE.Group; torso: THREE.Group; head: THREE.Group
  leftLeg: Limb; rightLeg: Limb; leftArm: Limb; rightArm: Limb
  ring: THREE.Mesh; label: THREE.Sprite; phase: number; scale: number
}

const sx = (x: number) => x / 10 - 60
const sz = (y: number) => y / 10 - 35
const W_HALF = 600
const clamp01 = (v: number) => Math.max(0, Math.min(1, v))
const mat = (color: string | number, roughness = .75) => new THREE.MeshStandardMaterial({ color, roughness, metalness: .015 })
const mesh = (geometry: THREE.BufferGeometry, material: THREE.Material, parent: THREE.Object3D, x = 0, y = 0, z = 0, shadow = true) => {
  const m = new THREE.Mesh(geometry, material)
  m.position.set(x, y, z); m.castShadow = shadow; m.receiveShadow = shadow; parent.add(m); return m
}

export class Match3DRenderer {
  private renderer: THREE.WebGLRenderer
  private scene = new THREE.Scene()
  private camera = new THREE.PerspectiveCamera(32, 12 / 7, .1, 350)
  private rigs = new Map<number, Rig>()
  private ball: THREE.Group
  private clock = 0
  private pitch: PitchType
  private observer: ResizeObserver
  private cameraX = 0
  private narrow = false
  private weather: WeatherType
  private rain: THREE.Points | null = null
  private rainPositions: Float32Array | null = null
  private fps = 60
  private fpsClock = 0
  private frameCount = 0

  constructor(canvas: HTMLCanvasElement, pitch: PitchType, weather: WeatherType) {
    this.pitch = pitch
    this.weather = weather
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' })
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, window.innerWidth < 800 ? 1.35 : 1.7))
    this.renderer.shadowMap.enabled = true
    this.renderer.shadowMap.type = THREE.PCFShadowMap
    this.renderer.outputColorSpace = THREE.SRGBColorSpace
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping
    this.renderer.toneMappingExposure = this.weather === 'rain' ? 1.05 : .92
    const sky = this.weather === 'clear' ? '#8fa9b0' : this.weather === 'cloudy' ? '#718086' : '#4e6269'
    this.scene.background = new THREE.Color(sky)
    this.scene.fog = new THREE.Fog(sky, this.weather === 'rain' ? 82 : 115, this.weather === 'rain' ? 190 : 235)
    this.buildWorld()
    if (this.weather === 'rain') this.makeRain()
    this.ball = this.makeBall()
    this.scene.add(this.ball)
    this.observer = new ResizeObserver(() => this.resize(canvas))
    this.observer.observe(canvas.parentElement || canvas)
    this.resize(canvas)
  }

  private resize(canvas: HTMLCanvasElement) {
    const parent = canvas.parentElement
    const width = Math.max(1, parent?.clientWidth || canvas.clientWidth || 1200)
    const height = Math.max(1, parent?.clientHeight || canvas.clientHeight || 700)
    this.narrow = width / height < 1.15
    this.camera.aspect = width / height
    this.camera.fov = this.narrow ? 43 : 32
    this.camera.updateProjectionMatrix()
    this.renderer.setSize(width, height, false)
  }

  private grassTexture() {
    const c = document.createElement('canvas'); c.width = 128; c.height = 128
    const ctx = c.getContext('2d')!
    ctx.fillStyle = this.weather === 'rain' ? '#235f3c' : this.pitch === 'turf' ? '#267452' : '#347b43'; ctx.fillRect(0, 0, 128, 128)
    let seed = 9127
    for (let i = 0; i < 3200; i++) {
      seed = (seed * 16807) % 2147483647
      const x = seed % 128; seed = (seed * 16807) % 2147483647
      const y = seed % 128
      ctx.fillStyle = i % 3 ? 'rgba(210,235,170,.055)' : 'rgba(4,45,20,.09)'
      ctx.fillRect(x, y, 1, 2)
    }
    const texture = new THREE.CanvasTexture(c)
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping; texture.repeat.set(18, 11)
    texture.colorSpace = THREE.SRGBColorSpace; texture.anisotropy = Math.min(4, this.renderer.capabilities.getMaxAnisotropy())
    return texture
  }

  private buildWorld() {
    const hemi = new THREE.HemisphereLight('#e9f4ff', '#24452e', this.weather === 'clear' ? 1.2 : this.weather === 'rain' ? 1.3 : 1); this.scene.add(hemi)
    const sun = new THREE.DirectionalLight(this.weather === 'clear' ? '#fff4df' : '#d7e5ec', this.weather === 'clear' ? 2.15 : this.weather === 'rain' ? 1.55 : 1.2); sun.position.set(-32, 62, 24); sun.castShadow = true
    sun.shadow.mapSize.set(1024, 1024); sun.shadow.camera.left = -72; sun.shadow.camera.right = 72
    sun.shadow.camera.top = 55; sun.shadow.camera.bottom = -55; sun.shadow.camera.far = 150; sun.shadow.bias = -.00018
    this.scene.add(sun)
    const ground = mesh(new THREE.PlaneGeometry(175, 130), mat(this.pitch === 'street' ? '#354046' : '#28683b'), this.scene, 0, -.04, 0, false)
    ground.rotation.x = -Math.PI / 2
    const fieldMat = this.pitch === 'street' ? mat('#536168', .96) : new THREE.MeshStandardMaterial({ map: this.grassTexture(), roughness: .96, color: '#ffffff' })
    const field = mesh(new THREE.PlaneGeometry(120, 70), fieldMat, this.scene, 0, 0, 0, false); field.rotation.x = -Math.PI / 2
    if (this.pitch !== 'street') for (let i = 0; i < 12; i += 2) {
      const stripe = mesh(new THREE.PlaneGeometry(10, 70), new THREE.MeshBasicMaterial({ color: '#d7edbd', transparent: true, opacity: .055 }), this.scene, -55 + i * 10, .008, 0, false)
      stripe.rotation.x = -Math.PI / 2
    }
    this.addLines(); this.addGoal(-60, 1); this.addGoal(60, -1); this.addStadium()
    this.camera.position.set(0, 27, 43); this.camera.lookAt(0, .5, -2)
  }

  private addLines() {
    const lineMat = new THREE.MeshBasicMaterial({ color: '#eef3df' })
    const line = (w: number, d: number, x: number, z: number) => { const m = mesh(new THREE.BoxGeometry(w, .018, d), lineMat, this.scene, x, .025, z, false); m.receiveShadow = false }
    line(120, .12, 0, -35); line(120, .12, 0, 35); line(.12, 70, -60, 0); line(.12, 70, 60, 0); line(.12, 70, 0, 0)
    const circle = mesh(new THREE.RingGeometry(9.12, 9.25, 80), lineMat, this.scene, 0, .027, 0, false); circle.rotation.x = -Math.PI / 2
    const spot = mesh(new THREE.CircleGeometry(.18, 18), lineMat, this.scene, 0, .028, 0, false); spot.rotation.x = -Math.PI / 2
    for (const side of [-1, 1]) {
      line(15, .12, side * 52.5, -16); line(15, .12, side * 52.5, 16); line(.12, 32, side * 45, 0)
      line(6, .12, side * 57, -7.5); line(6, .12, side * 57, 7.5); line(.12, 15, side * 54, 0)
      const penalty = mesh(new THREE.CircleGeometry(.15, 16), lineMat, this.scene, side * 49, .028, 0, false); penalty.rotation.x = -Math.PI / 2
      const arc = mesh(new THREE.RingGeometry(9.12, 9.24, 40, 1, side === 1 ? Math.PI * .64 : -Math.PI * .36, Math.PI * .72), lineMat, this.scene, side * 49, .028, 0, false)
      arc.rotation.x = -Math.PI / 2
    }
  }

  private addGoal(x: number, direction: number) {
    const white = mat('#f5f5ed', .3), net = new THREE.LineBasicMaterial({ color: '#e1e8df', transparent: true, opacity: .5 })
    const post = (px: number, py: number, pz: number, length: number, horizontal = false) => {
      const m = mesh(new THREE.CylinderGeometry(.075, .075, length, 12), white, this.scene, px, py, pz)
      if (horizontal) m.rotation.x = Math.PI / 2
    }
    post(x, 1.22, -3.75, 2.44); post(x, 1.22, 3.75, 2.44); post(x, 2.44, 0, 7.5, true)
    const backX = x + direction * 2.1
    post(backX, 1.05, -3.75, 2.1); post(backX, 1.05, 3.75, 2.1)
    const points: THREE.Vector3[] = []
    for (let i = 0; i <= 20; i++) { const z = -3.75 + i * .375; points.push(new THREE.Vector3(x, .05, z), new THREE.Vector3(backX, .05, z), new THREE.Vector3(x, 2.44, z), new THREE.Vector3(backX, 2.1, z)) }
    for (let i = 0; i <= 7; i++) { const y = i * .3; points.push(new THREE.Vector3(backX, y, -3.75), new THREE.Vector3(backX, y, 3.75)) }
    for (let i = 0; i <= 10; i++) { const z = -3.75 + i * .75; points.push(new THREE.Vector3(backX, 0, z), new THREE.Vector3(backX, 2.1, z)) }
    this.scene.add(new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(points), net))
  }

  private addStadium() {
    const concrete = mat('#59696b'), dark = mat('#23373a')
    for (const side of [-1, 1]) {
      for (let tier = 0; tier < 6; tier++) mesh(new THREE.BoxGeometry(148, .8, 1.7), concrete, this.scene, 0, .6 + tier * .85, side * (39 + tier * 1.6), false)
      const seats = new THREE.InstancedMesh(new THREE.BoxGeometry(.7, .55, .5), mat('#ffffff'), 6 * 74)
      const dummy = new THREE.Object3D(), colors = ['#d7e5df', '#315c64', '#83a7a4', '#d7c85b'].map(c => new THREE.Color(c))
      let index = 0
      for (let tier = 0; tier < 6; tier++) for (let i = 0; i < 74; i++) {
        dummy.position.set(-72 + i * 2, 1.25 + tier * .85, side * (39 + tier * 1.6)); dummy.rotation.y = (i % 5 - 2) * .03; dummy.updateMatrix()
        seats.setMatrixAt(index, dummy.matrix); seats.setColorAt(index, colors[(i * 7 + tier * 3) % colors.length]); index++
      }
      seats.receiveShadow = true; this.scene.add(seats)
      const roof = mesh(new THREE.BoxGeometry(154, .45, 10), dark, this.scene, 0, 10.2, side * 46, false); roof.rotation.x = side * .08
      for (const x of [-65, -30, 30, 65]) {
        mesh(new THREE.CylinderGeometry(.1, .15, 15, 8), dark, this.scene, x, 7.5, side * 44, false)
        const lamp = mesh(new THREE.BoxGeometry(4.5, 1.8, .35), new THREE.MeshStandardMaterial({ color: '#e9f3e8', emissive: '#d7edff', emissiveIntensity: .55 }), this.scene, x, 15, side * 44, false)
        lamp.rotation.x = side * .25
      }
      mesh(new THREE.BoxGeometry(124, 1.15, .25), dark, this.scene, 0, .65, side * 37, false)
    }
    const c = document.createElement('canvas'); c.width = 512; c.height = 64
    const ctx = c.getContext('2d')!; ctx.fillStyle = '#14363a'; ctx.fillRect(0, 0, 512, 64)
    ctx.fillStyle = '#dfff57'; ctx.font = '700 28px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('MATCHDAY  /  PLAY YOUR WAY', 256, 43)
    const boardTexture = new THREE.CanvasTexture(c); boardTexture.colorSpace = THREE.SRGBColorSpace
    for (const side of [-1, 1]) for (let i = 0; i < 12; i++) {
      const panel = mesh(new THREE.PlaneGeometry(10, 1), new THREE.MeshBasicMaterial({ map: boardTexture }), this.scene, -55 + i * 10, .7, side * 36.84, false)
      panel.rotation.y = side === 1 ? Math.PI : 0
    }
  }

  private makeRain() {
    const count = 720
    this.rainPositions = new Float32Array(count * 3)
    let seed = 7331
    const random = () => { seed = seed * 16807 % 2147483647; return (seed - 1) / 2147483646 }
    for (let i = 0; i < count; i++) {
      this.rainPositions[i * 3] = random() * 170 - 85
      this.rainPositions[i * 3 + 1] = random() * 34
      this.rainPositions[i * 3 + 2] = random() * 110 - 55
    }
    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.BufferAttribute(this.rainPositions, 3))
    const material = new THREE.PointsMaterial({ color: '#d9edf3', size: .085, transparent: true, opacity: .68, depthWrite: false })
    this.rain = new THREE.Points(geometry, material)
    this.scene.add(this.rain)
  }

  private kitNumber(p: RenderPlayer, back: boolean) {
    const c = document.createElement('canvas'); c.width = 128; c.height = 160
    const ctx = c.getContext('2d')!
    ctx.clearRect(0, 0, 128, 160); ctx.textAlign = 'center'; ctx.fillStyle = p.team === 0 ? '#153d56' : '#f1f3e8'
    if (back) { ctx.font = '700 20px sans-serif'; ctx.fillText(p.name.toUpperCase(), 64, 28) }
    ctx.font = `800 ${back ? 92 : 76}px sans-serif`; ctx.fillText(String(p.number), 64, back ? 123 : 98)
    const texture = new THREE.CanvasTexture(c); texture.colorSpace = THREE.SRGBColorSpace
    return new THREE.MeshBasicMaterial({ map: texture, transparent: true, side: THREE.DoubleSide, depthWrite: false })
  }

  private makeLimb(parent: THREE.Group, x: number, y: number, leg: boolean, shirt: THREE.Material, skin: THREE.Material, lowerMat: THREE.Material, bootMat: THREE.Material): Limb {
    const upper = new THREE.Group(); upper.position.set(x, y, 0); parent.add(upper)
    const upperLength = leg ? .43 : .34
    mesh(new THREE.CapsuleGeometry(leg ? .09 : .07, upperLength - .12, 5, 10), leg ? skin : shirt, upper, 0, -upperLength / 2, 0)
    if (leg) mesh(new THREE.CylinderGeometry(.115, .095, .24, 12), shirt, upper, 0, -.1, 0)
    const lower = new THREE.Group(); lower.position.y = -upperLength; upper.add(lower)
    const lowerLength = leg ? .4 : .31
    mesh(new THREE.CapsuleGeometry(leg ? .068 : .052, lowerLength - .1, 5, 10), leg ? lowerMat : skin, lower, 0, -lowerLength / 2, 0)
    if (leg) {
      const boot = mesh(new THREE.BoxGeometry(.16, .115, .32), bootMat, lower, 0, -.44, .075)
      boot.geometry.translate(0, 0, .035); boot.rotation.x = -.08
      mesh(new THREE.BoxGeometry(.13, .015, .19), mat('#e8eee4', .5), lower, 0, -.387, .08, false)
    } else {
      mesh(new THREE.SphereGeometry(.07, 12, 9), lowerMat, lower, 0, -.35, 0)
    }
    return { upper, lower }
  }

  private makePlayer(p: RenderPlayer): Rig {
    const group = new THREE.Group(), body = new THREE.Group(), scale = p.radius / 15
    group.add(body); group.scale.setScalar(scale)
    const skinTones = ['#8b5a3d', '#c98e68', '#e0ac82', '#6e4432', '#b87550']
    const skin = mat(skinTones[p.id % skinTones.length], .68)
    const keeperHome = p.keeper && p.team === 0, keeperAway = p.keeper && p.team === 1
    const shirtColor = keeperHome ? '#e9b949' : keeperAway ? '#805ad5' : p.team === 0 ? '#83c5e7' : '#183f42'
    const shirt = mat(shirtColor, .72), shorts = mat(p.keeper ? '#202b31' : p.team === 0 ? '#edf0e8' : '#122d30')
    const socks = mat(p.keeper ? shirtColor : p.team === 0 ? '#83c5e7' : '#183f42')
    const boots = mat(p.id % 3 === 0 ? '#dfff57' : p.id % 3 === 1 ? '#e95e49' : '#151f23', .42)
    const glove = mat(p.keeper ? '#ecf3e8' : skinTones[p.id % skinTones.length], .55)
    const hair = mat(['#241c18', '#3c2b20', '#151819'][p.id % 3], .85)
    const torso = new THREE.Group(); torso.position.y = 1.02; body.add(torso)
    const trunk = mesh(new THREE.CylinderGeometry(.27, .31, .67, 16), shirt, torso, 0, .32, 0); trunk.scale.z = .72
    mesh(new THREE.SphereGeometry(.28, 16, 10), shirt, torso, 0, .57, 0).scale.set(1.16, .42, .76)
    mesh(new THREE.CylinderGeometry(.265, .26, .28, 14), shorts, body, 0, .88, 0).scale.z = .82
    mesh(new THREE.CylinderGeometry(.07, .08, .14, 12), skin, torso, 0, .75, 0)
    const head = new THREE.Group(); head.position.set(0, .91, 0); torso.add(head)
    const skull = mesh(new THREE.SphereGeometry(.18, 24, 18), skin, head, 0, 0, 0); skull.scale.set(.86, 1.1, .91)
    const jaw = mesh(new THREE.SphereGeometry(.135, 14, 10), skin, head, 0, -.085, .012); jaw.scale.set(.9, .65, .9)
    const hairCap = mesh(new THREE.SphereGeometry(.184, 16, 10, 0, Math.PI * 2, 0, Math.PI * .48), hair, head, 0, .045, -.004); hairCap.scale.set(.88, .9, .93)
    const front = mesh(new THREE.PlaneGeometry(.18, .24), this.kitNumber(p, false), torso, 0, .36, .218, false)
    const back = mesh(new THREE.PlaneGeometry(.35, .43), this.kitNumber(p, true), torso, 0, .36, -.218, false); back.rotation.y = Math.PI
    front.renderOrder = 2; back.renderOrder = 2
    const leftLeg = this.makeLimb(body, -.145, .86, true, shorts, skin, socks, boots)
    const rightLeg = this.makeLimb(body, .145, .86, true, shorts, skin, socks, boots)
    const leftArm = this.makeLimb(torso, -.34, .58, false, shirt, skin, glove, boots)
    const rightArm = this.makeLimb(torso, .34, .58, false, shirt, skin, glove, boots)
    leftArm.upper.rotation.z = -.08; rightArm.upper.rotation.z = .08
    const ring = mesh(new THREE.RingGeometry(.46, .54, 40), new THREE.MeshBasicMaterial({ color: '#dfff57', side: THREE.DoubleSide, transparent: true, opacity: .95 }), group, 0, .025, 0, false)
    ring.rotation.x = -Math.PI / 2
    const label = this.makeLabel(p.name, p.number, p.keeper); label.position.set(0, 2.35, 0); group.add(label)
    this.scene.add(group)
    return { group, body, torso, head, leftLeg, rightLeg, leftArm, rightArm, ring, label, phase: p.id * .73, scale }
  }

  private makeLabel(name: string, number: number, keeper: boolean) {
    const c = document.createElement('canvas'); c.width = 256; c.height = 56
    const ctx = c.getContext('2d')!; ctx.fillStyle = 'rgba(8,25,24,.8)'; ctx.beginPath(); ctx.roundRect(24, 5, 208, 40, 9); ctx.fill()
    ctx.fillStyle = keeper ? '#ffd867' : '#f3f5ed'; ctx.font = '600 22px sans-serif'; ctx.textAlign = 'center'; ctx.fillText(`${number}  ${name}${keeper ? ' · GK' : ''}`, 128, 33)
    const texture = new THREE.CanvasTexture(c); texture.colorSpace = THREE.SRGBColorSpace
    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture, transparent: true, depthTest: false })); sprite.scale.set(2.15, .47, 1); return sprite
  }

  private makeBall() {
    const group = new THREE.Group()
    const geometry = new THREE.IcosahedronGeometry(.22, 2)
    const count = geometry.getAttribute('position').count, colors = new Float32Array(count * 3)
    const light = new THREE.Color('#f4f1df'), dark = new THREE.Color('#202b2b')
    for (let i = 0; i < count; i += 3) {
      const color = (i / 3) % 5 === 0 ? dark : light
      for (let j = 0; j < 3; j++) { colors[(i + j) * 3] = color.r; colors[(i + j) * 3 + 1] = color.g; colors[(i + j) * 3 + 2] = color.b }
    }
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    mesh(geometry, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: .36 }), group)
    return group
  }

  private animateLimb(limb: Limb, swing: number, knee: number) {
    limb.upper.rotation.x = swing
    limb.lower.rotation.x = knee
  }

  render(players: RenderPlayer[], ball: RenderBall, controlled: number, status: GameStatus, dt: number) {
    this.clock += Math.min(dt, .05)
    this.fpsClock += dt; this.frameCount++
    if (this.fpsClock >= .75) { this.fps = Math.round(this.frameCount / this.fpsClock); this.fpsClock = 0; this.frameCount = 0 }
    if (this.rain && this.rainPositions) {
      for (let i = 0; i < this.rainPositions.length; i += 3) {
        this.rainPositions[i + 1] -= dt * 24
        this.rainPositions[i] -= dt * 2.4
        if (this.rainPositions[i + 1] < 0) { this.rainPositions[i + 1] += 34; this.rainPositions[i] += 5 }
        if (this.rainPositions[i] > 85) this.rainPositions[i] = -85
      }
      this.rain.geometry.attributes.position.needsUpdate = true
    }
    for (const p of players) {
      let rig = this.rigs.get(p.id)
      if (!rig) { rig = this.makePlayer(p); this.rigs.set(p.id, rig) }
      rig.group.position.set(sx(p.x), .12, sz(p.y))
      const speed = Math.hypot(p.vx, p.vy), run = Math.min(speed / 255, 1)
      if (speed > 5) rig.group.rotation.y = Math.atan2(p.vx, p.vy)
      else rig.group.rotation.y = Math.atan2(p.facingX, p.facingY)
      rig.phase += dt * (3.2 + speed * .047) * (speed > 4 ? 1 : .12)
      const cycle = rig.phase
      const stride = (.38 + run * .58) * Math.min(speed / 55, 1)
      const swing = Math.sin(cycle) * stride
      const kneeL = Math.max(0, -Math.sin(cycle)) * (1 + run * .35) * run
      const kneeR = Math.max(0, Math.sin(cycle)) * (1 + run * .35) * run
      this.animateLimb(rig.leftLeg, swing, kneeL)
      this.animateLimb(rig.rightLeg, -swing, kneeR)
      rig.leftArm.upper.rotation.x = -swing * (p.sprinting ? 1.05 : .82)
      rig.rightArm.upper.rotation.x = swing * (p.sprinting ? 1.05 : .82)
      rig.leftArm.lower.rotation.x = -.24 - run * .38 - Math.max(0, swing) * .35
      rig.rightArm.lower.rotation.x = -.24 - run * .38 - Math.max(0, -swing) * .35
      rig.torso.rotation.x = -.035 - run * (p.sprinting ? .22 : .1)
      rig.torso.rotation.y = Math.sin(cycle) * .075 * run
      rig.torso.rotation.z = Math.sin(cycle * .5) * .035 * run
      rig.head.rotation.x = .025 + run * .08
      rig.head.rotation.y = -rig.torso.rotation.y * .65
      rig.body.rotation.set(0, 0, 0)
      rig.body.position.y = Math.abs(Math.sin(cycle)) * (.018 + run * .045) + Math.sin(this.clock * 2 + p.id) * .005
      if (p.action === 'kick') {
        const t = 1 - p.actionTime / .36
        rig.rightLeg.upper.rotation.x = -1.05 + t * 1.9
        rig.rightLeg.lower.rotation.x = .75 - t * .65
        rig.leftArm.upper.rotation.x = -.5; rig.rightArm.upper.rotation.x = .4
      } else if (p.action === 'skill') {
        if (p.skill === 'roulette') {
          const t = 1 - p.actionTime / .68
          rig.body.rotation.y = t * Math.PI * 2
          rig.leftArm.upper.rotation.z = -.55; rig.rightArm.upper.rotation.z = .55
        } else if (p.skill === 'stepover') {
          const t = 1 - p.actionTime / .5
          rig.rightLeg.upper.rotation.x = Math.sin(t * Math.PI * 4) * .85
          rig.rightLeg.upper.rotation.z = Math.cos(t * Math.PI * 4) * .35
          rig.torso.rotation.z = -.13
        } else if (p.skill === 'sombrero') {
          const t = 1 - p.actionTime / .62
          rig.rightLeg.upper.rotation.x = -1.2 + t * 2.2
          rig.rightLeg.lower.rotation.x = .9 - t * .7
          rig.body.position.y += Math.sin(t * Math.PI) * .22
          rig.torso.rotation.x = -.28
        } else if (p.skill === 'stop-go') {
          rig.torso.rotation.x = -.32
          rig.leftArm.upper.rotation.x = -.75; rig.rightArm.upper.rotation.x = -.75
        } else if (p.skill === 'body-feint') {
          const t = 1 - p.actionTime / .5
          rig.torso.rotation.z = Math.sin(t * Math.PI * 2) * .34
          rig.head.rotation.z = -rig.torso.rotation.z * .4
        } else {
          const t = 1 - p.actionTime / .5
          rig.rightLeg.upper.rotation.x = -.55 + Math.sin(t * Math.PI * 2) * .8
          rig.rightLeg.upper.rotation.z = Math.sin(t * Math.PI * 2) * .4
          rig.torso.rotation.z = .16
        }
      }
      if (p.keeper && p.action === 'idle') {
        rig.leftArm.upper.rotation.z = -.45; rig.rightArm.upper.rotation.z = .45
        rig.leftArm.lower.rotation.x = -.65; rig.rightArm.lower.rotation.x = -.65
        rig.leftLeg.upper.rotation.x *= .25; rig.rightLeg.upper.rotation.x *= .25
      } else { rig.leftArm.upper.rotation.z = -.08; rig.rightArm.upper.rotation.z = .08 }
      if (p.action === 'jump') {
        const t = 1 - p.actionTime / .5
        rig.body.position.y += Math.sin(t * Math.PI) * .52
        rig.leftLeg.upper.rotation.x = -.35; rig.rightLeg.upper.rotation.x = .42
        rig.leftLeg.lower.rotation.x = .7; rig.rightLeg.lower.rotation.x = .45
        rig.leftArm.upper.rotation.z = -.55; rig.rightArm.upper.rotation.z = .55
        rig.torso.rotation.x = -.14
      }
      if (p.action === 'catch') {
        rig.leftArm.upper.rotation.x = -1.65; rig.rightArm.upper.rotation.x = -1.65
        rig.leftArm.upper.rotation.z = -.25; rig.rightArm.upper.rotation.z = .25
        rig.leftArm.lower.rotation.x = -.45; rig.rightArm.lower.rotation.x = -.45
      } else if (p.action === 'dive') {
        const side = p.vy >= 0 ? 1 : -1
        rig.body.rotation.z = -side * 1.12
        rig.body.position.y = .48
        rig.leftArm.upper.rotation.x = -1.45; rig.rightArm.upper.rotation.x = -1.45
        rig.leftArm.upper.rotation.z = -.65; rig.rightArm.upper.rotation.z = .65
        rig.leftArm.lower.rotation.x = 0; rig.rightArm.lower.rotation.x = 0
        rig.leftLeg.upper.rotation.x = -.25; rig.rightLeg.upper.rotation.x = .35
      }
      rig.ring.visible = p.id === controlled
      rig.label.visible = p.id === controlled || p.keeper
    }
    this.ball.position.set(sx(ball.x), .24 + ball.z / 100, sz(ball.y))
    this.ball.rotation.z += ball.vx * dt * .0024; this.ball.rotation.x += ball.vy * dt * .0024
    const targetX = sx(ball.x)
    this.cameraX += (targetX - this.cameraX) * Math.min(1, dt * 4.6)
    const attacking = clamp01((Math.abs(ball.x - W_HALF) - 250) / 350)
    const baseY = (this.narrow ? 32 : 19) + attacking * 3
    const baseZ = (this.narrow ? 49 : 29) + attacking * 5
    this.camera.position.set(this.cameraX, baseY, baseZ)
    this.camera.lookAt(this.cameraX, .55, sz(ball.y) * .12 - (this.narrow ? 0 : 3))
    this.renderer.render(this.scene, this.camera)
    void status
  }

  ballScreenPosition() {
    const rect = this.renderer.domElement.getBoundingClientRect()
    const projected = this.ball.position.clone().project(this.camera)
    return { x: (projected.x * .5 + .5) * rect.width, y: (-projected.y * .5 + .5) * rect.height }
  }

  getStats() {
    const gl = this.renderer.getContext()
    return { calls: this.renderer.info.render.calls, triangles: this.renderer.info.render.triangles, fps: this.fps, renderer: gl.getParameter(gl.RENDERER) }
  }

  destroy() {
    this.observer.disconnect()
    const textures = new Set<THREE.Texture>(), materials = new Set<THREE.Material>(), geometries = new Set<THREE.BufferGeometry>()
    this.scene.traverse(obj => {
      if (obj instanceof THREE.Mesh || obj instanceof THREE.LineSegments || obj instanceof THREE.Sprite || obj instanceof THREE.Points) {
        if ('geometry' in obj && obj.geometry) geometries.add(obj.geometry)
        const mats = Array.isArray(obj.material) ? obj.material : [obj.material]
        mats.forEach(m => { materials.add(m); if ('map' in m && m.map) textures.add(m.map as THREE.Texture) })
      }
    })
    textures.forEach(t => t.dispose()); materials.forEach(m => m.dispose()); geometries.forEach(g => g.dispose())
    this.renderer.dispose()
  }
}
