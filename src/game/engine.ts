import { Match3DRenderer } from './renderer3d'

export type PitchType = 'grass' | 'turf' | 'street'
export type WeatherType = 'clear' | 'cloudy' | 'rain'
export type TacticType = 'defensive' | 'balanced' | 'offensive'
export type DribbleType = 'roulette' | 'stepover' | 'sombrero' | 'stop-go' | 'body-feint' | 'elastico'
export type GameStatus = 'playing' | 'paused' | 'fulltime'
export type PlayerAction = 'idle' | 'kick' | 'dive' | 'catch' | 'skill' | 'jump'
export type PlayerConfig = { name: string; size: number; power: number; dribble: DribbleType }
export type MatchConfig = { players: PlayerConfig[]; pitch: PitchType; duration: number; weather: WeatherType; tactic: TacticType }

type Player = {
  id: number; team: 0 | 1; x: number; y: number; vx: number; vy: number
  homeX: number; homeY: number; radius: number; power: number; name: string
  number: number; keeper: boolean; facingX: number; facingY: number
  action: PlayerAction; actionTime: number; stamina: number; skillTime: number
  skill: DribbleType; sprinting: boolean
}
type Ball = {
  x: number; y: number; z: number; vx: number; vy: number; vz: number
  owner: number | null; cooldown: number; lastTouch: number | null; curve: number
}
type KickKind = 'pass' | 'through' | 'shoot' | 'lob' | 'cross'
export type Snapshot = {
  home: number; away: number; secondsLeft: number; controlled: string
  notice: string; status: GameStatus; stamina: number; muted: boolean
  charge: number; chargeKind: 'lob' | 'cross' | null; sprinting: boolean
}

const W = 1200
const H = 700
const GOAL_TOP = 275
const GOAL_BOTTOM = 425
const FIXED_STEP = 1 / 60
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v))
const dist = (a: { x: number; y: number }, b: { x: number; y: number }) => Math.hypot(a.x - b.x, a.y - b.y)
const DRIBBLE_NAMES: Record<DribbleType, string> = {
  roulette: 'ROULETTE', stepover: 'ROBINHO STEPOVER', sombrero: 'SOMBRERO FLICK',
  'stop-go': 'STOP & GO', 'body-feint': 'BODY FEINT', elastico: 'ELASTICO',
}

export class FootballGame {
  private canvas: HTMLCanvasElement
  private view: Match3DRenderer
  private config: MatchConfig
  private players: Player[] = []
  private ball: Ball = { x: W / 2, y: H / 2, z: 0, vx: 0, vy: 0, vz: 0, owner: 9, cooldown: .4, lastTouch: 9, curve: 0 }
  private keys = new Set<string>()
  private controlled = 9
  private score = [0, 0]
  private secondsLeft: number
  private last = 0
  private accumulator = 0
  private raf = 0
  private resetTimer = 0
  private notice = 'KICK OFF · 11 V 11'
  private noticeTimer = 1.4
  private status: GameStatus = 'playing'
  private touch = { x: 0, y: 0, sprint: false }
  private onSnapshot: (s: Snapshot) => void
  private snapshotClock = 0
  private keeperHold = [0, 0]
  private chargeKind: 'lob' | 'cross' | null = null
  private charge = 0
  private seed = 0x51f15e
  private audio: AudioContext | null = null
  private muted = false

  constructor(canvas: HTMLCanvasElement, config: MatchConfig, onSnapshot: (s: Snapshot) => void) {
    this.canvas = canvas
    this.config = config
    this.view = new Match3DRenderer(canvas, config.pitch, config.weather)
    this.secondsLeft = config.duration * 60
    this.onSnapshot = onSnapshot
    this.muted = localStorage.getItem('matchday-muted') === '1'
    this.makeTeams()
    this.bind()
    this.last = performance.now()
    this.emit()
    this.raf = requestAnimationFrame(this.loop)
    ;(window as unknown as { __GAME_READY__?: boolean }).__GAME_READY__ = true
    ;(window as unknown as { __gameProbe?: () => unknown }).__gameProbe = () => ({
      controlled: this.controlled, x: this.players[this.controlled].x, y: this.players[this.controlled].y,
      ball: { ...this.ball }, score: [...this.score], status: this.status,
      players: this.players.length, homePlayers: this.players.filter(p => p.team === 0).length,
      awayPlayers: this.players.filter(p => p.team === 1).length,
      keeperActions: this.players.filter(p => p.keeper).map(p => p.action),
      keepers: this.players.filter(p => p.keeper).map(p => ({ x: p.x, y: p.y, action: p.action })),
      ballScreen: this.view.ballScreenPosition(),
      weather: this.config.weather, tactic: this.config.tactic, charge: this.charge, chargeKind: this.chargeKind,
      selectedSkill: this.players[this.controlled].skill, sprinting: this.players[this.controlled].sprinting,
      render: this.view.getStats(),
    })
    if (new URLSearchParams(location.search).has('verify')) {
      ;(window as unknown as { __endMatch?: () => void }).__endMatch = () => { this.secondsLeft = .05 }
    }
  }

  private random() {
    this.seed |= 0; this.seed = this.seed + 0x6D2B79F5 | 0
    let t = Math.imul(this.seed ^ this.seed >>> 15, 1 | this.seed)
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t
    return ((t ^ t >>> 14) >>> 0) / 4294967296
  }

  private makeTeams() {
    const homes = [[72, 350], [300, 105], [285, 255], [285, 445], [300, 595], [500, 190], [520, 350], [500, 510], [770, 150], [800, 350], [770, 550]]
    const awayNames = ['Vale', 'Stone', 'Fox', 'Reed', 'Cross', 'Ward', 'Cole', 'Parker', 'Young', 'Banks', 'Lane']
    const numbers = [1, 2, 4, 5, 3, 6, 8, 10, 7, 9, 11]
    for (let team = 0 as 0 | 1; team <= 1; team = (team + 1) as 0 | 1) {
      for (let i = 0; i < 11; i++) {
        const x = team === 0 ? homes[i][0] : W - homes[i][0]
        const y = homes[i][1]
        const c = team === 0 ? this.config.players[i] : { name: awayNames[i], size: 96 + (i % 4) * 4, power: 67 + (i % 5) * 4, dribble: 'stepover' as DribbleType }
        this.players.push({
          id: team * 11 + i, team, x, y, homeX: x, homeY: y, vx: 0, vy: 0,
          radius: 15 * c.size / 100, power: c.power, name: c.name || `Player ${i + 1}`,
          number: numbers[i], keeper: i === 0, facingX: team === 0 ? 1 : -1, facingY: 0,
          action: 'idle', actionTime: 0, stamina: 100, skillTime: 0, skill: c.dribble, sprinting: false,
        })
      }
    }
  }

  private keyDown = (e: KeyboardEvent) => {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space', 'Tab'].includes(e.code)) e.preventDefault()
    this.keys.add(e.code)
    this.ensureAudio()
    if (e.repeat || this.status !== 'playing') {
      if (!e.repeat && (e.code === 'KeyP' || e.code === 'Escape')) this.pause()
      return
    }
    if (e.code === 'KeyQ' || e.code === 'Tab') this.switchPlayer()
    if (e.code === 'Space') this.pass()
    if (e.code === 'KeyJ' || e.code === 'KeyK') this.shoot()
    if (e.code === 'KeyL') this.through()
    if (e.code === 'KeyC') this.startCharge('cross')
    if (e.code === 'KeyV') this.startCharge('lob')
    if (e.code === 'KeyE') this.skill()
    if (e.code === 'KeyP' || e.code === 'Escape') this.pause()
  }
  private keyUp = (e: KeyboardEvent) => {
    this.keys.delete(e.code)
    if (e.code === 'KeyC' || e.code === 'KeyV') this.releaseCharge()
  }
  private pointerDown = (e: PointerEvent) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return
    const point = this.view.ballScreenPosition()
    const rect = this.canvas.getBoundingClientRect()
    const x = e.clientX - rect.left, y = e.clientY - rect.top
    if (Math.hypot(point.x - x, point.y - y) < Math.max(46, rect.width * .045)) {
      e.preventDefault(); this.ensureAudio(); this.skill()
    }
  }
  private bind() {
    window.addEventListener('keydown', this.keyDown)
    window.addEventListener('keyup', this.keyUp)
    this.canvas.addEventListener('pointerdown', this.pointerDown)
  }
  destroy() {
    cancelAnimationFrame(this.raf)
    this.view.destroy()
    window.removeEventListener('keydown', this.keyDown)
    window.removeEventListener('keyup', this.keyUp)
    this.canvas.removeEventListener('pointerdown', this.pointerDown)
    this.audio?.close()
  }
  setJoystick(x: number, y: number) { this.touch.x = clamp(x, -1, 1); this.touch.y = clamp(y, -1, 1); this.ensureAudio() }
  setSprint(v: boolean) { this.touch.sprint = v; this.ensureAudio() }
  toggleMute() { this.muted = !this.muted; localStorage.setItem('matchday-muted', this.muted ? '1' : '0'); this.emit(); return this.muted }
  pause() {
    if (this.status === 'fulltime') return
    this.status = this.status === 'paused' ? 'playing' : 'paused'
    this.keys.clear(); this.touch.x = 0; this.touch.y = 0; this.touch.sprint = false
    this.cancelCharge()
    this.last = performance.now(); this.emit()
  }
  switchPlayer() {
    if (this.ball.owner !== null && this.players[this.ball.owner].team === 0) {
      this.controlled = this.ball.owner
    } else {
      let nearest = 1, best = Infinity
      for (const p of this.players) if (p.team === 0 && !p.keeper) {
        const d = dist(p, this.ball)
        if (d < best) { best = d; nearest = p.id }
      }
      this.controlled = nearest
    }
    this.cancelCharge(); this.emit()
  }

  private inputDirection() {
    let dx = this.touch.x + (this.keys.has('ArrowRight') || this.keys.has('KeyD') ? 1 : 0) - (this.keys.has('ArrowLeft') || this.keys.has('KeyA') ? 1 : 0)
    let dy = this.touch.y + (this.keys.has('ArrowDown') || this.keys.has('KeyS') ? 1 : 0) - (this.keys.has('ArrowUp') || this.keys.has('KeyW') ? 1 : 0)
    const len = Math.hypot(dx, dy)
    if (len > 1) { dx /= len; dy /= len }
    return { dx, dy, len: Math.min(len, 1) }
  }

  startCharge(kind: 'lob' | 'cross') {
    if (this.status !== 'playing' || this.resetTimer > 0 || this.ball.owner !== this.controlled) return
    this.chargeKind = kind; this.charge = .08; this.ensureAudio(); this.emit()
  }
  releaseCharge() {
    if (!this.chargeKind) return
    const kind = this.chargeKind, amount = this.charge
    this.chargeKind = null; this.charge = 0
    this.kick(kind, amount); this.emit()
  }
  cancelCharge() { this.chargeKind = null; this.charge = 0; this.emit() }

  private kick(kind: KickKind, amount = .62) {
    if (this.status !== 'playing' || this.resetTimer > 0 || this.ball.owner !== this.controlled) return
    const p = this.players[this.controlled]
    let { dx, dy } = this.inputDirection()
    const attack = p.team === 0 ? 1 : -1
    if (Math.hypot(dx, dy) < .2) { dx = p.facingX; dy = p.facingY }
    let speed = 460, lift = 45, curve = 0
    if (kind === 'shoot') {
      const targetY = clamp(H / 2 + dy * 105, GOAL_TOP + 12, GOAL_BOTTOM - 12)
      dx = attack * W - p.x; dy = targetY - p.y
      speed = 650 + p.power * 2.1; lift = 155 + p.power * .45
    } else {
      let mates = this.players.filter(m => m.team === p.team && m.id !== p.id && !m.keeper)
      if (kind === 'cross') mates = mates.filter(m => (m.x - p.x) * attack > 20)
      const inputLen = Math.hypot(dx, dy) || 1
      const scored = mates.map(m => {
        const mx = m.x - p.x, my = m.y - p.y, d = Math.hypot(mx, my) || 1
        const alignment = mx / d * dx / inputLen + my / d * dy / inputLen
        const forward = (m.x - p.x) * attack
        const aerialBonus = kind === 'cross' ? forward * .55 - Math.abs(m.y - H / 2) * .12 : kind === 'lob' ? forward * .42 : 0
        return { m, score: alignment * 150 + forward * .2 - d * .1 + aerialBonus }
      }).sort((a, b) => b.score - a.score)
      const m = scored[0]?.m
      if (m) {
        const lead = kind === 'through' ? 105 : kind === 'lob' ? 90 + amount * 130 : kind === 'cross' ? 65 : clamp(dist(m, p) * .16, 18, 55)
        dx = m.x + attack * lead - p.x; dy = m.y + m.vy * (kind === 'cross' || kind === 'lob' ? .55 : .22) - p.y
        speed = kind === 'through' ? 590 : kind === 'lob' ? 500 + amount * 350 : kind === 'cross' ? 480 + amount * 310 : clamp(dist(m, p) * 1.25, 360, 535)
      } else if (kind === 'lob' || kind === 'cross') {
        dx = attack; dy *= .45; speed = kind === 'lob' ? 520 + amount * 340 : 500 + amount * 280
      }
      if (kind === 'lob') lift = 235 + amount * 190
      if (kind === 'cross') { lift = 220 + amount * 155; curve = (p.id % 2 ? 1 : -1) * (22 + amount * 30) }
    }
    const len = Math.hypot(dx, dy) || 1
    this.ball.owner = null; this.ball.cooldown = .22; this.ball.lastTouch = p.id; this.ball.curve = curve
    this.ball.vx = dx / len * speed; this.ball.vy = dy / len * speed; this.ball.vz = lift
    this.ball.x = p.x + dx / len * (p.radius + 10); this.ball.y = p.y + dy / len * (p.radius + 10); this.ball.z = 8
    p.facingX = dx / len; p.facingY = dy / len; p.action = 'kick'; p.actionTime = .36
    this.keeperHold[p.team] = 0
    this.sound(kind === 'shoot' ? 105 : 150, .07, 'kick')
    const powerLabel = ` · ${Math.round(amount * 100)}%`
    this.notice = kind === 'shoot' ? `${p.name.toUpperCase()} STRIKES` : kind === 'through' ? 'THROUGH BALL' : kind === 'lob' ? `LOFTED BALL${powerLabel}` : kind === 'cross' ? `CROSS${powerLabel}` : `${p.name.toUpperCase()} · PASS`
    this.noticeTimer = .75
  }
  pass() { this.cancelCharge(); this.kick('pass') }
  through() { this.cancelCharge(); this.kick('through') }
  shoot() { this.cancelCharge(); this.kick('shoot') }
  skill() {
    if (this.status !== 'playing' || this.ball.owner !== this.controlled) return
    const p = this.players[this.controlled]
    if (p.stamina < 10 || p.skillTime > 0) return
    const duration = p.skill === 'roulette' ? .68 : p.skill === 'sombrero' ? .62 : .5
    p.skillTime = duration; p.action = 'skill'; p.actionTime = duration; p.stamina -= 10
    const side = p.id % 2 ? 1 : -1
    if (p.skill === 'sombrero') {
      this.ball.owner = null; this.ball.lastTouch = p.id; this.ball.cooldown = .58
      this.ball.vx = p.facingX * 245; this.ball.vy = p.facingY * 245; this.ball.vz = 330; this.ball.curve = 0
    } else if (p.skill !== 'stop-go' && p.skill !== 'roulette') {
      const lateral = p.skill === 'elastico' ? -side * 28 : side * 20
      this.ball.y = clamp(this.ball.y + lateral, 20, H - 20)
      this.ball.cooldown = .12
    } else if (p.skill === 'stop-go') {
      p.vx *= .25; p.vy *= .25
    }
    this.notice = DRIBBLE_NAMES[p.skill]; this.noticeTimer = .65
    this.sound(240, .05, 'skill')
  }

  private loop = (now: number) => {
    const frame = Math.min((now - this.last) / 1000, .1)
    this.last = now
    if (this.status === 'playing') {
      this.accumulator += frame
      while (this.accumulator >= FIXED_STEP) {
        this.update(FIXED_STEP)
        this.accumulator -= FIXED_STEP
      }
    }
    this.view.render(this.players, this.ball, this.controlled, this.status, frame)
    this.snapshotClock -= frame
    if (this.snapshotClock <= 0) { this.emit(); this.snapshotClock = .1 }
    this.raf = requestAnimationFrame(this.loop)
  }

  private emit() {
    this.onSnapshot({
      home: this.score[0], away: this.score[1], secondsLeft: Math.max(0, this.secondsLeft),
      controlled: this.players[this.controlled]?.name || '', notice: this.noticeTimer > 0 ? this.notice : '',
      status: this.status, stamina: this.players[this.controlled]?.stamina ?? 100, muted: this.muted,
      charge: this.charge, chargeKind: this.chargeKind, sprinting: this.players[this.controlled]?.sprinting ?? false,
    })
  }

  private update(dt: number) {
    if (this.resetTimer > 0) {
      this.resetTimer -= dt
      if (this.resetTimer <= 0) this.resetPositions()
      return
    }
    this.secondsLeft -= dt; this.noticeTimer -= dt; this.ball.cooldown -= dt
    if (this.chargeKind) this.charge = Math.min(1, this.charge + dt / 1.05)
    if (this.secondsLeft <= 0) {
      this.secondsLeft = 0; this.status = 'fulltime'; this.notice = 'FULL TIME'; this.noticeTimer = 99
      this.cancelCharge(); this.sound(440, .35, 'whistle'); this.emit(); return
    }
    this.movePlayers(dt)
    this.moveBall(dt)
  }

  private movePlayers(dt: number) {
    const input = this.inputDirection()
    for (const p of this.players) {
      p.actionTime = Math.max(0, p.actionTime - dt)
      p.skillTime = Math.max(0, p.skillTime - dt)
      if (p.actionTime <= 0) p.action = 'idle'
      let dx = 0, dy = 0
      let speed = 184 * (100 / (72 + p.radius * 1.8))
      let sprinting = false
      if (p.id === this.controlled) {
        dx = input.dx; dy = input.dy
        sprinting = (this.keys.has('ShiftLeft') || this.keys.has('ShiftRight') || this.touch.sprint) && p.stamina > 1 && input.len > .12
        speed *= Math.max(.18, input.len)
        if (sprinting) { speed *= 1.52; p.stamina = Math.max(0, p.stamina - dt * 16) }
        else p.stamina = Math.min(100, p.stamina + dt * 10)
        if (p.skillTime > 0 && p.skill !== 'stop-go') speed *= 1.28
        if (p.skillTime > 0 && p.skill === 'stop-go' && p.actionTime < .28) speed *= 1.85
      } else {
        const target = this.aiTarget(p)
        dx = target.x - p.x; dy = target.y - p.y
        const urgent = this.ball.owner === null && dist(p, this.ball) < 155
        sprinting = !p.keeper && (urgent || (this.ball.owner === p.id && Math.abs(p.x - W / 2) > 330))
        speed *= p.keeper ? .96 : sprinting ? 1.16 : .9
        p.stamina = Math.min(100, p.stamina + dt * (sprinting ? 1 : 7))
      }
      p.sprinting = sprinting
      const len = Math.hypot(dx, dy)
      if (len > .08) {
        const nx = dx / Math.max(1, len), ny = dy / Math.max(1, len)
        let response = p.skillTime > 0 ? 13 : sprinting ? 6.8 : 9.5
        if (this.config.weather === 'rain') response *= .88
        p.vx += (nx * speed - p.vx) * Math.min(1, dt * response)
        p.vy += (ny * speed - p.vy) * Math.min(1, dt * response)
        const turn = Math.min(1, dt * (sprinting ? 7 : 10))
        p.facingX += (nx - p.facingX) * turn; p.facingY += (ny - p.facingY) * turn
      } else { p.vx *= Math.pow(.035, dt); p.vy *= Math.pow(.035, dt) }
      if (p.action === 'dive') { p.vx *= .9; p.vy *= .9 }
      p.x = clamp(p.x + p.vx * dt, 28, W - 28)
      p.y = clamp(p.y + p.vy * dt, 28, H - 28)
    }
    for (let i = 0; i < this.players.length; i++) for (let j = i + 1; j < this.players.length; j++) {
      const a = this.players[i], b = this.players[j]
      const d = dist(a, b), min = a.radius + b.radius - 2
      if (d < min && d > 0) {
        const push = (min - d) / 2, nx = (b.x - a.x) / d, ny = (b.y - a.y) / d
        a.x -= nx * push; a.y -= ny * push; b.x += nx * push; b.y += ny * push
      }
    }
  }

  private nearestOutfield(team: 0 | 1, target: { x: number; y: number }, exclude = -1) {
    let first = -1, second = -1, d1 = Infinity, d2 = Infinity
    for (const p of this.players) {
      if (p.team !== team || p.keeper || p.id === exclude) continue
      const d = dist(p, target)
      if (d < d1) { second = first; d2 = d1; first = p.id; d1 = d }
      else if (d < d2) { second = p.id; d2 = d }
    }
    return [first, second]
  }

  private aiTarget(p: Player) {
    const hasBall = this.ball.owner === p.id
    const attack = p.team === 0 ? 1 : -1
    if (p.keeper) {
      if (hasBall) return { x: p.homeX + attack * 30, y: p.homeY }
      const goalX = p.team === 0 ? 78 : W - 78
      const goalDistance = dist(this.ball, { x: goalX, y: H / 2 })
      const inBox = p.team === 0 ? this.ball.x < 245 : this.ball.x > 955
      if (this.ball.owner === null && inBox && Math.abs(this.ball.y - H / 2) < 160 && dist(p, this.ball) < 155) {
        return { x: this.ball.x + this.ball.vx * .09, y: this.ball.y + this.ball.vy * .09 }
      }
      const advance = 10 + clamp((610 - goalDistance) / 500, 0, 1) * 90
      const widthFactor = clamp(.58 + advance / 240, .58, .88)
      const trackY = clamp(H / 2 + (this.ball.y - H / 2) * widthFactor, GOAL_TOP + 12, GOAL_BOTTOM - 12)
      return { x: goalX + attack * advance, y: trackY }
    }
    if (hasBall) {
      const lane = clamp(p.homeY + (H / 2 - p.homeY) * .35, 75, H - 75)
      return { x: p.team === 0 ? W : 0, y: lane }
    }
    const owner = this.ball.owner === null ? null : this.players[this.ball.owner]
    if (this.ball.owner === null) {
      const nearest = this.nearestOutfield(p.team, this.ball)
      if (nearest[0] === p.id) return { x: this.ball.x + this.ball.vx * .14, y: this.ball.y + this.ball.vy * .14 }
    }
    if (owner && owner.team !== p.team) {
      const nearest = this.nearestOutfield(p.team, owner)
      const mentality = p.team === 0 ? (this.config.tactic === 'offensive' ? 1.15 : this.config.tactic === 'defensive' ? .82 : 1) : 1
      if (nearest[0] === p.id) return { x: owner.x + owner.vx * .13 * mentality, y: owner.y + owner.vy * .13 * mentality }
      if (nearest[1] === p.id) return { x: owner.x - attack * 48, y: owner.y + (p.homeY - owner.y) * .28 }
    }
    const role = p.id % 11
    const mentality = p.team === 0 ? (this.config.tactic === 'offensive' ? 68 : this.config.tactic === 'defensive' ? -58 : 0) : 12
    const roleFactor = role <= 4 ? .55 : role >= 8 ? 1.2 : .85
    const shift = clamp((this.ball.x - W / 2) * .3, -150, 150)
    let support = 0
    if (owner && owner.team === p.team && role >= 6) support = attack * (role >= 8 ? 105 : 48) * (mentality > 0 ? 1.25 : 1)
    return {
      x: clamp(p.homeX + shift * roleFactor + mentality * roleFactor + support, 55, W - 55),
      y: clamp(p.homeY + (this.ball.y - H / 2) * (role <= 4 ? .13 : .22), 45, H - 45),
    }
  }

  private moveBall(dt: number) {
    if (this.ball.owner !== null) {
      const p = this.players[this.ball.owner]
      const speed = Math.hypot(p.vx, p.vy)
      const touchDistance = p.radius + 7 + Math.min(speed / (p.sprinting ? 19 : 30), p.sprinting ? 17 : 10)
      const targetX = p.x + p.facingX * touchDistance
      const targetY = p.y + p.facingY * touchDistance
      const control = 1 - Math.pow(.0008, dt)
      this.ball.x += (targetX - this.ball.x) * control
      this.ball.y += (targetY - this.ball.y) * control
      this.ball.z += (2 + Math.abs(Math.sin(performance.now() * .012)) * Math.min(speed / 80, 3) - this.ball.z) * control
      this.ball.vx = p.vx; this.ball.vy = p.vy; this.ball.vz = 0; this.ball.curve = 0
      if (p.keeper && p.id !== this.controlled) {
        this.keeperHold[p.team] += dt
        if (this.keeperHold[p.team] > .72) this.aiKick(p, true)
      } else if (p.id !== this.controlled && this.random() < dt * .64) this.aiKick(p)
      if (p.skillTime <= 0) {
        for (const opponent of this.players) {
          if (opponent.team === p.team || opponent.keeper || opponent.action === 'dive') continue
          if (dist(opponent, this.ball) < opponent.radius + 9 && this.random() < dt * .48) {
            this.ball.owner = opponent.id; this.ball.lastTouch = opponent.id; this.ball.cooldown = .2
            if (opponent.team === 0) this.controlled = opponent.id
            this.notice = 'CLEAN TACKLE'; this.noticeTimer = .55
            break
          }
        }
      }
      return
    }
    this.ball.x += this.ball.vx * dt; this.ball.y += this.ball.vy * dt; this.ball.z += this.ball.vz * dt
    this.ball.vz -= 500 * dt
    if (this.ball.z > 2 && Math.abs(this.ball.curve) > .1) {
      const horizontalSpeed = Math.hypot(this.ball.vx, this.ball.vy) || 1
      const bend = this.ball.curve * dt
      this.ball.vx += -this.ball.vy / horizontalSpeed * bend
      this.ball.vy += this.ball.vx / horizontalSpeed * bend
      this.ball.curve *= Math.pow(.985, dt * 60)
    }
    if (this.ball.z <= 0) {
      this.ball.z = 0
      if (Math.abs(this.ball.vz) > 48) {
        const bounce = this.config.weather === 'rain' ? .4 : this.config.pitch === 'street' ? .58 : .52
        this.ball.vz *= -bounce; this.sound(90, .025, 'bounce')
      } else this.ball.vz = 0
    }
    let groundDrag = this.ball.z < 2 ? (this.config.pitch === 'street' ? .982 : this.config.pitch === 'turf' ? .993 : .988) : .998
    if (this.config.weather === 'rain' && this.ball.z < 2) groundDrag = Math.max(groundDrag, .993)
    if (this.config.weather === 'rain' && this.ball.z >= 2) groundDrag = .997
    this.ball.vx *= Math.pow(groundDrag, dt * 60); this.ball.vy *= Math.pow(groundDrag, dt * 60)
    if (this.ball.y < 18 || this.ball.y > H - 18) { this.ball.y = clamp(this.ball.y, 18, H - 18); this.ball.vy *= -.72 }
    if (this.tryKeeperSave()) return
    if (this.ball.x < 8 || this.ball.x > W - 8) {
      if (this.ball.y > GOAL_TOP && this.ball.y < GOAL_BOTTOM && this.ball.z < 244) { this.goal(this.ball.x > W / 2 ? 0 : 1); return }
      this.ball.x = clamp(this.ball.x, 8, W - 8); this.ball.vx *= -.7
    }
    if (this.ball.cooldown <= 0 && this.ball.z < 155) {
      const candidates = this.players.filter(p => !p.keeper && dist(p, this.ball) < p.radius + (this.ball.z > 48 ? 10 : 13))
      candidates.sort((a, b) => dist(a, this.ball) - dist(b, this.ball))
      if (candidates[0]) {
        const p = candidates[0], incoming = Math.hypot(this.ball.vx, this.ball.vy)
        this.ball.owner = p.id; this.ball.lastTouch = p.id; this.ball.curve = 0
        this.ball.vx *= incoming > 500 ? .22 : .05; this.ball.vy *= incoming > 500 ? .22 : .05
        this.ball.x += p.facingX * Math.min(incoming / 80, 8)
        if (this.ball.z > 48) { p.action = 'jump'; p.actionTime = .46 }
        if (p.team === 0) this.controlled = p.id
      }
    }
  }

  private tryKeeperSave() {
    if (this.ball.cooldown > 0) return false
    for (const keeper of this.players) {
      if (!keeper.keeper) continue
      const inArea = keeper.team === 0 ? this.ball.x < 235 : this.ball.x > 965
      if (!inArea || this.ball.z > 250) continue
      const d = dist(keeper, this.ball)
      const reach = keeper.radius + (keeper.action === 'dive' ? 58 : 25)
      if (d > reach) {
        const threatening = (keeper.team === 0 && this.ball.vx < -245) || (keeper.team === 1 && this.ball.vx > 245)
        const timeToLine = Math.abs((keeper.x - this.ball.x) / (Math.abs(this.ball.vx) || 1))
        const predictedY = this.ball.y + this.ball.vy * Math.min(timeToLine, .5)
        if (threatening && d < 140 && Math.abs(predictedY - keeper.y) < 108 && timeToLine < .52) {
          keeper.action = 'dive'; keeper.actionTime = .66
          keeper.vy = clamp((predictedY - keeper.y) * 5.4, -350, 350)
          keeper.vx *= .4
        }
        continue
      }
      const shotSpeed = Math.hypot(this.ball.vx, this.ball.vy)
      const hardShot = shotSpeed > 690 || this.ball.z > 145
      keeper.action = hardShot ? 'dive' : this.ball.z > 48 ? 'jump' : 'catch'; keeper.actionTime = hardShot ? .7 : .5
      this.ball.lastTouch = keeper.id
      const wetHandling = this.config.weather === 'rain' ? .13 : 0
      if (hardShot && (d > keeper.radius + 8 || this.random() < .3 + wetHandling)) {
        this.ball.owner = null; this.ball.cooldown = .38; this.ball.curve = 0
        this.ball.vx = (keeper.team === 0 ? 1 : -1) * Math.max(230, Math.abs(this.ball.vx) * .48)
        this.ball.vy = (this.ball.y >= keeper.y ? 1 : -1) * (150 + this.random() * 130)
        this.ball.vz = 145; this.ball.z = Math.max(35, this.ball.z)
        this.notice = 'STRONG HAND · PARRIED'; this.sound(75, .12, 'save')
      } else {
        this.ball.owner = keeper.id; this.ball.vx = 0; this.ball.vy = 0; this.ball.vz = 0; this.ball.curve = 0
        this.ball.cooldown = .3; this.keeperHold[keeper.team] = 0
        if (keeper.team === 0) this.controlled = keeper.id
        this.notice = this.ball.z > 48 ? `${keeper.name.toUpperCase()} · CLAIMS THE CROSS` : `${keeper.name.toUpperCase()} · SAFE HANDS`
        this.sound(115, .09, 'save')
      }
      this.noticeTimer = 1.05; this.emit()
      return true
    }
    return false
  }

  private aiKick(p: Player, keeperDistribution = false) {
    if (this.ball.owner !== p.id) return
    const attack = p.team === 0 ? 1 : -1
    const close = p.team === 0 ? p.x > 920 : p.x < 280
    let tx = p.team === 0 ? W : 0, ty = H / 2 + (this.random() - .5) * 100
    let speed = close ? 680 : 430, lift = close ? 175 : 45, curve = 0
    const mates = this.players.filter(m => m.team === p.team && m.id !== p.id && !m.keeper)
    if (keeperDistribution) {
      const sorted = [...mates].sort((a, b) => dist(a, p) - dist(b, p))
      const m = sorted[Math.floor(this.random() * Math.min(2, sorted.length))]
      tx = m.x + attack * 35; ty = m.y; speed = 390; lift = 70
      p.action = 'kick'; p.actionTime = .36
      this.notice = 'KEEPER · QUICK DISTRIBUTION'; this.noticeTimer = .7
    } else if (!close) {
      const forward = mates.filter(m => (m.x - p.x) * attack > 30)
      const pool = forward.length ? forward : mates
      if (pool.length) {
        const m = pool[Math.floor(this.random() * pool.length)]
        tx = m.x + attack * 25; ty = m.y
        const wide = Math.abs(p.y - H / 2) > 190 && Math.abs(p.x - W / 2) > 380
        if (wide && dist(m, p) > 180) { lift = 245 + this.random() * 75; speed = 590; curve = (p.id % 2 ? 1 : -1) * 30 }
      }
    }
    const len = Math.hypot(tx - p.x, ty - p.y) || 1
    this.ball.owner = null; this.ball.cooldown = .28; this.ball.lastTouch = p.id; this.ball.curve = curve
    this.ball.vx = (tx - p.x) / len * speed; this.ball.vy = (ty - p.y) / len * speed; this.ball.vz = lift
    this.keeperHold[p.team] = 0
  }

  private goal(team: number) {
    this.score[team]++
    this.notice = team === 0 ? 'GOAL! BRILLIANT FINISH' : 'RIVALS SCORE'
    this.noticeTimer = 2; this.resetTimer = 1.9
    this.ball.vx = 0; this.ball.vy = 0; this.ball.vz = 0; this.ball.owner = null; this.ball.curve = 0
    this.cancelCharge(); this.sound(520, .32, 'goal'); this.emit()
  }

  private resetPositions() {
    for (const p of this.players) {
      p.x = p.homeX; p.y = p.homeY; p.vx = 0; p.vy = 0; p.action = 'idle'; p.actionTime = 0; p.skillTime = 0; p.sprinting = false
    }
    this.ball = { x: W / 2, y: H / 2, z: 0, vx: 0, vy: 0, vz: 0, owner: 9, cooldown: .4, lastTouch: 9, curve: 0 }
    this.controlled = 9; this.keeperHold = [0, 0]
  }

  private ensureAudio() {
    if (this.muted || this.audio) return
    try { this.audio = new AudioContext() } catch { this.audio = null }
  }

  private sound(frequency: number, duration: number, type: 'kick' | 'bounce' | 'save' | 'goal' | 'whistle' | 'skill') {
    if (this.muted) return
    this.ensureAudio()
    if (!this.audio) return
    if (this.audio.state === 'suspended') void this.audio.resume()
    const now = this.audio.currentTime
    const osc = this.audio.createOscillator(), gain = this.audio.createGain()
    osc.type = type === 'whistle' ? 'sine' : type === 'goal' ? 'triangle' : 'sine'
    osc.frequency.setValueAtTime(frequency, now)
    osc.frequency.exponentialRampToValueAtTime(type === 'goal' ? frequency * 1.8 : Math.max(40, frequency * .55), now + duration)
    gain.gain.setValueAtTime(type === 'bounce' ? .025 : .07, now)
    gain.gain.exponentialRampToValueAtTime(.001, now + duration)
    osc.connect(gain); gain.connect(this.audio.destination); osc.start(now); osc.stop(now + duration)
    if (type === 'goal') {
      const second = this.audio.createOscillator(), g2 = this.audio.createGain()
      second.type = 'triangle'; second.frequency.value = frequency * 1.25
      g2.gain.setValueAtTime(.04, now + .06); g2.gain.exponentialRampToValueAtTime(.001, now + duration)
      second.connect(g2); g2.connect(this.audio.destination); second.start(now + .06); second.stop(now + duration)
    }
  }
}
