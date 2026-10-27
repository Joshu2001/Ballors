import { Match3DRenderer } from './renderer3d'
import { type FormationId, type PositionPresetId } from './tactics'
import { defaultAppearanceForIndex, type PlayerAppearance } from './playerModel3d'
import type { HighlightEvent, HighlightKind, MatchStats } from './highlights'

export type PitchType = 'grass' | 'turf' | 'street'
export type WeatherType = 'clear' | 'cloudy' | 'rain'
export type TacticType = 'defensive' | 'balanced' | 'offensive'
export type NetStyleType = 'box-pro' | 'hex-stadium' | 'classic-slope' | 'deep-cage'
export type NetColorType = 'white' | 'volt' | 'sky-stripe' | 'crimson-gold' | 'emerald' | 'stealth-black'
export type DribbleType = 'roulette' | 'stepover' | 'sombrero' | 'stop-go' | 'body-feint' | 'elastico'
export type GameStatus = 'playing' | 'paused' | 'fulltime'
export type PlayerAction = 'idle' | 'kick' | 'dive' | 'catch' | 'skill' | 'jump'

export type PlayerConfig = {
  name: string
  size: number
  power: number
  iq?: number
  dribble: DribbleType
  appearance?: PlayerAppearance
}

export type MatchConfig = {
  players: PlayerConfig[]
  pitch: PitchType
  duration: number
  weather: WeatherType
  tactic: TacticType
  netStyle?: NetStyleType
  netColor?: NetColorType
  formation?: FormationId
  positionPreset?: PositionPresetId
  positions?: [number, number][]
}

type Player = {
  id: number
  team: 0 | 1
  x: number
  y: number
  vx: number
  vy: number
  homeX: number
  homeY: number
  radius: number
  power: number
  iq: number
  name: string
  number: number
  keeper: boolean
  facingX: number
  facingY: number
  action: PlayerAction
  actionTime: number
  stamina: number
  skillTime: number
  skill: DribbleType
  sprinting: boolean
  appearance: PlayerAppearance
}

type Ball = {
  x: number
  y: number
  z: number
  vx: number
  vy: number
  vz: number
  owner: number | null
  cooldown: number
  lastTouch: number | null
  curve: number
}

type KickKind = 'pass' | 'through' | 'shoot' | 'lob' | 'cross'

export type Snapshot = {
  home: number
  away: number
  secondsLeft: number
  controlled: string
  notice: string
  status: GameStatus
  stamina: number
  muted: boolean
  charge: number
  chargeKind: 'lob' | 'cross' | null
  sprinting: boolean
  highlights: HighlightEvent[]
  stats: MatchStats
}

const W = 1200
const H = 700
const GOAL_TOP = 275
const GOAL_BOTTOM = 425
const FIXED_STEP = 1 / 60
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v))
const dist = (a: { x: number; y: number }, b: { x: number; y: number }) => Math.hypot(a.x - b.x, a.y - b.y)

export const DRIBBLE_NAMES: Record<DribbleType, string> = {
  roulette: 'ROULETTE',
  stepover: 'ROBINHO STEPOVER',
  sombrero: 'SOMBRERO FLICK',
  'stop-go': 'STOP & GO',
  'body-feint': 'BODY FEINT',
  elastico: 'ELASTICO',
}

export class FootballGame {
  private canvas: HTMLCanvasElement
  private view: Match3DRenderer
  private config: MatchConfig
  private players: Player[] = []
  private ball: Ball = {
    x: W / 2,
    y: H / 2,
    z: 0,
    vx: 0,
    vy: 0,
    vz: 0,
    owner: 9,
    cooldown: 0.4,
    lastTouch: 9,
    curve: 0,
  }
  private keys = new Set<string>()
  private controlled = 9
  private score: [number, number] = [0, 0]
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
  private highlights: HighlightEvent[] = []
  private stats: MatchStats = {
    homeShots: 0,
    awayShots: 0,
    homeSaves: 0,
    awaySaves: 0,
    homeDribbles: 0,
    awayDribbles: 0,
    homePasses: 0,
    awayPasses: 0,
  }

  constructor(canvas: HTMLCanvasElement, config: MatchConfig, onSnapshot: (s: Snapshot) => void) {
    this.canvas = canvas
    this.config = config
    this.view = new Match3DRenderer(
      canvas,
      config.pitch,
      config.weather,
      config.netStyle ?? 'box-pro',
      config.netColor ?? 'white'
    )
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
      controlled: this.controlled,
      x: this.players[this.controlled].x,
      y: this.players[this.controlled].y,
      ball: { ...this.ball },
      score: [...this.score],
      status: this.status,
      players: this.players.length,
      homePlayers: this.players.filter(p => p.team === 0).length,
      awayPlayers: this.players.filter(p => p.team === 1).length,
      keeperActions: this.players.filter(p => p.keeper).map(p => p.action),
      keepers: this.players.filter(p => p.keeper).map(p => ({ x: p.x, y: p.y, action: p.action })),
      ballScreen: this.view.ballScreenPosition(),
      weather: this.config.weather,
      tactic: this.config.tactic,
      charge: this.charge,
      chargeKind: this.chargeKind,
      selectedSkill: this.players[this.controlled].skill,
      sprinting: this.players[this.controlled].sprinting,
      highlights: this.highlights.length,
      render: this.view.getStats(),
    })
    if (new URLSearchParams(location.search).has('verify')) {
      ;(window as unknown as { __endMatch?: () => void }).__endMatch = () => {
        this.secondsLeft = 0.05
      }
    }
  }

  private currentMatchMinute(): { minute: number; clockLabel: string } {
    const totalSec = this.config.duration * 60
    const elapsed = Math.max(0, totalSec - this.secondsLeft)
    const matchMinutes = Math.min(90, Math.floor((elapsed / totalSec) * 90))
    const secs = Math.floor(((elapsed / totalSec) * 90 * 60) % 60)
    return {
      minute: Math.max(1, matchMinutes),
      clockLabel: `${String(matchMinutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`,
    }
  }

  private recordHighlight(
    kind: HighlightKind,
    p: Player,
    title: string,
    detail: string,
    targetX?: number,
    targetY?: number
  ) {
    const { minute, clockLabel } = this.currentMatchMinute()
    this.highlights.push({
      id: `${kind}-${this.highlights.length + 1}-${Math.round(this.secondsLeft * 10)}`,
      minute,
      clockLabel,
      kind,
      team: p.team,
      playerName: p.name,
      playerNumber: p.number,
      title,
      detail,
      x: Math.round(p.x),
      y: Math.round(p.y),
      targetX: targetX !== undefined ? Math.round(targetX) : undefined,
      targetY: targetY !== undefined ? Math.round(targetY) : undefined,
      scoreAfter: [this.score[0], this.score[1]],
      dribbleType: kind === 'dribble' ? p.skill : undefined,
    })
  }

  private random() {
    this.seed |= 0
    this.seed = (this.seed + 0x6d2b79f5) | 0
    let t = Math.imul(this.seed ^ (this.seed >>> 15), 1 | this.seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }

  private makeTeams() {
    const defaultHomes: [number, number][] = [
      [54, 350],
      [300, 105],
      [285, 255],
      [285, 445],
      [300, 595],
      [500, 190],
      [520, 350],
      [500, 510],
      [770, 150],
      [800, 350],
      [770, 550],
    ]
    const homeCoords =
      this.config.positions && this.config.positions.length === 11 ? this.config.positions : defaultHomes
    const awayNames = ['Vale', 'Stone', 'Fox', 'Reed', 'Cross', 'Ward', 'Cole', 'Parker', 'Young', 'Banks', 'Lane']
    const numbers = [1, 2, 4, 5, 3, 6, 8, 10, 7, 9, 11]
    for (let team = 0 as 0 | 1; team <= 1; team = (team + 1) as 0 | 1) {
      for (let i = 0; i < 11; i++) {
        const isKeeper = i === 0
        const rawX = team === 0 ? homeCoords[i][0] : W - defaultHomes[i][0]
        const rawY = team === 0 ? homeCoords[i][1] : defaultHomes[i][1]
        const x = isKeeper ? (team === 0 ? 52 : W - 52) : rawX
        const y = isKeeper ? H / 2 : rawY
        const c =
          team === 0
            ? this.config.players[i]
            : {
                name: awayNames[i],
                size: 96 + (i % 4) * 4,
                power: 68 + (i % 5) * 4,
                iq: 80 + (i % 4) * 4,
                dribble: 'stepover' as DribbleType,
                appearance: defaultAppearanceForIndex(11 + i),
              }
        this.players.push({
          id: team * 11 + i,
          team,
          x,
          y,
          homeX: x,
          homeY: y,
          vx: 0,
          vy: 0,
          radius: (15 * c.size) / 100,
          power: c.power,
          iq: c.iq ?? 84,
          name: c.name || `Player ${i + 1}`,
          number: numbers[i],
          keeper: isKeeper,
          facingX: team === 0 ? 1 : -1,
          facingY: 0,
          action: 'idle',
          actionTime: 0,
          stamina: 100,
          skillTime: 0,
          skill: c.dribble,
          sprinting: false,
          appearance: c.appearance ?? defaultAppearanceForIndex(team * 11 + i),
        })
      }
    }
  }

  updateTactics(
    positions: [number, number][],
    tactic: TacticType,
    formation?: FormationId,
    positionPreset?: PositionPresetId
  ) {
    this.config.positions = positions
    this.config.tactic = tactic
    if (formation) this.config.formation = formation
    if (positionPreset) this.config.positionPreset = positionPreset
    for (let i = 0; i < 11; i++) {
      const p = this.players[i]
      if (p && positions[i]) {
        p.homeX = i === 0 ? 52 : positions[i][0]
        p.homeY = i === 0 ? H / 2 : positions[i][1]
      }
    }
    this.notice = `TACTICS UPDATED · ${(formation ?? this.config.formation ?? '4-3-3').toUpperCase()}`
    this.noticeTimer = 1.2
    this.emit()
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
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    if (Math.hypot(point.x - x, point.y - y) < Math.max(46, rect.width * 0.045)) {
      e.preventDefault()
      this.ensureAudio()
      this.skill()
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
  setJoystick(x: number, y: number) {
    this.touch.x = clamp(x, -1, 1)
    this.touch.y = clamp(y, -1, 1)
    this.ensureAudio()
  }
  setSprint(v: boolean) {
    this.touch.sprint = v
    this.ensureAudio()
  }
  toggleMute() {
    this.muted = !this.muted
    localStorage.setItem('matchday-muted', this.muted ? '1' : '0')
    this.emit()
    return this.muted
  }
  pause() {
    if (this.status === 'fulltime') return
    this.status = this.status === 'paused' ? 'playing' : 'paused'
    this.keys.clear()
    this.touch.x = 0
    this.touch.y = 0
    this.touch.sprint = false
    this.cancelCharge()
    this.last = performance.now()
    this.emit()
  }
  switchPlayer() {
    if (
      this.ball.owner !== null &&
      this.players[this.ball.owner].team === 0 &&
      !this.players[this.ball.owner].keeper
    ) {
      this.controlled = this.ball.owner
    } else {
      let nearest = 1
      let best = Infinity
      for (const p of this.players) {
        if (p.team === 0 && !p.keeper && p.id !== this.controlled) {
          const d = dist(p, this.ball)
          if (d < best) {
            best = d
            nearest = p.id
          }
        }
      }
      this.controlled = nearest
    }
    this.cancelCharge()
    this.emit()
  }

  private inputDirection() {
    let dx =
      this.touch.x +
      (this.keys.has('ArrowRight') || this.keys.has('KeyD') ? 1 : 0) -
      (this.keys.has('ArrowLeft') || this.keys.has('KeyA') ? 1 : 0)
    let dy =
      this.touch.y +
      (this.keys.has('ArrowDown') || this.keys.has('KeyS') ? 1 : 0) -
      (this.keys.has('ArrowUp') || this.keys.has('KeyW') ? 1 : 0)
    const len = Math.hypot(dx, dy)
    if (len > 1) {
      dx /= len
      dy /= len
    }
    return { dx, dy, len: Math.min(len, 1) }
  }

  startCharge(kind: 'lob' | 'cross') {
    if (this.status !== 'playing' || this.resetTimer > 0 || this.ball.owner !== this.controlled) return
    this.chargeKind = kind
    this.charge = 0.08
    this.ensureAudio()
    this.emit()
  }
  releaseCharge() {
    if (!this.chargeKind) return
    const kind = this.chargeKind
    const amount = this.charge
    this.chargeKind = null
    this.charge = 0
    this.kick(kind, amount)
    this.emit()
  }
  cancelCharge() {
    this.chargeKind = null
    this.charge = 0
    this.emit()
  }

  private kick(kind: KickKind, amount = 0.62) {
    if (this.status !== 'playing' || this.resetTimer > 0 || this.ball.owner !== this.controlled) return
    const p = this.players[this.controlled]
    let { dx, dy } = this.inputDirection()
    const attack = p.team === 0 ? 1 : -1
    if (Math.hypot(dx, dy) < 0.2) {
      dx = p.facingX
      dy = p.facingY
    }
    let speed = 460
    let lift = 45
    let curve = 0
    let targetX = p.x + attack * 220
    let targetY = p.y

    if (kind === 'shoot') {
      targetY = clamp(H / 2 + dy * 105, GOAL_TOP + 12, GOAL_BOTTOM - 12)
      targetX = p.team === 0 ? W : 0
      dx = targetX - p.x
      dy = targetY - p.y
      speed = 650 + p.power * 2.1
      lift = 155 + p.power * 0.45
      this.stats.homeShots++
      this.recordHighlight(
        'shot',
        p,
        `${p.name.toUpperCase()} STRIKE`,
        `Power ${Math.round(speed / 10)} km/h strike toward goal`,
        targetX,
        targetY
      )
    } else {
      this.stats.homePasses++
      let mates = this.players.filter(m => m.team === p.team && m.id !== p.id && !m.keeper)
      if (kind === 'cross') mates = mates.filter(m => (m.x - p.x) * attack > 20)
      const inputLen = Math.hypot(dx, dy) || 1
      const scored = mates
        .map(m => {
          const mx = m.x - p.x
          const my = m.y - p.y
          const d = Math.hypot(mx, my) || 1
          const alignment = (mx / d) * (dx / inputLen) + (my / d) * (dy / inputLen)
          const forward = (m.x - p.x) * attack
          const aerialBonus =
            kind === 'cross'
              ? forward * 0.55 - Math.abs(m.y - H / 2) * 0.12
              : kind === 'lob'
              ? forward * 0.42
              : 0
          return { m, score: alignment * 150 + forward * 0.2 - d * 0.1 + aerialBonus }
        })
        .sort((a, b) => b.score - a.score)
      const m = scored[0]?.m
      if (m) {
        const lead =
          kind === 'through'
            ? 105
            : kind === 'lob'
            ? 90 + amount * 130
            : kind === 'cross'
            ? 65
            : clamp(dist(m, p) * 0.16, 18, 55)
        dx = m.x + attack * lead - p.x
        dy = m.y + m.vy * (kind === 'cross' || kind === 'lob' ? 0.55 : 0.22) - p.y
        speed =
          kind === 'through'
            ? 590
            : kind === 'lob'
            ? 500 + amount * 350
            : kind === 'cross'
            ? 480 + amount * 310
            : clamp(dist(m, p) * 1.25, 360, 535)
      } else if (kind === 'lob' || kind === 'cross') {
        dx = attack
        dy *= 0.45
        speed = kind === 'lob' ? 520 + amount * 340 : 500 + amount * 280
      }
      if (kind === 'lob') lift = 235 + amount * 190
      if (kind === 'cross') {
        lift = 220 + amount * 155
        curve = (p.id % 2 ? 1 : -1) * (22 + amount * 30)
      }
    }
    const len = Math.hypot(dx, dy) || 1
    this.ball.owner = null
    this.ball.cooldown = 0.22
    this.ball.lastTouch = p.id
    this.ball.curve = curve
    this.ball.vx = (dx / len) * speed
    this.ball.vy = (dy / len) * speed
    this.ball.vz = lift
    this.ball.x = p.x + (dx / len) * (p.radius + 10)
    this.ball.y = p.y + (dy / len) * (p.radius + 10)
    this.ball.z = 8
    p.facingX = dx / len
    p.facingY = dy / len
    p.action = 'kick'
    p.actionTime = 0.36
    this.keeperHold[p.team] = 0
    // If goalkeeper just kicked the ball, switch user control back to nearest outfield player
    if (p.keeper && p.team === 0) {
      this.switchPlayer()
    }
    this.sound(kind === 'shoot' ? 105 : 150, 0.07, 'kick')
    const powerLabel = ` · ${Math.round(amount * 100)}%`
    this.notice =
      kind === 'shoot'
        ? `${p.name.toUpperCase()} STRIKES`
        : kind === 'through'
        ? 'THROUGH BALL'
        : kind === 'lob'
        ? `LOFTED BALL${powerLabel}`
        : kind === 'cross'
        ? `CROSS${powerLabel}`
        : `${p.name.toUpperCase()} · PASS`
    this.noticeTimer = 0.75
  }

  pass() {
    this.cancelCharge()
    this.kick('pass')
  }
  through() {
    this.cancelCharge()
    this.kick('through')
  }
  shoot() {
    this.cancelCharge()
    this.kick('shoot')
  }
  skill() {
    if (this.status !== 'playing' || this.ball.owner !== this.controlled) return
    const p = this.players[this.controlled]
    if (p.stamina < 10 || p.skillTime > 0) return
    const duration = p.skill === 'roulette' ? 0.68 : p.skill === 'sombrero' ? 0.62 : 0.5
    p.skillTime = duration
    p.action = 'skill'
    p.actionTime = duration
    p.stamina -= 10
    const side = p.id % 2 ? 1 : -1
    if (p.skill === 'sombrero') {
      this.ball.owner = null
      this.ball.lastTouch = p.id
      this.ball.cooldown = 0.58
      this.ball.vx = p.facingX * 245
      this.ball.vy = p.facingY * 245
      this.ball.vz = 330
      this.ball.curve = 0
    } else if (p.skill !== 'stop-go' && p.skill !== 'roulette') {
      const lateral = p.skill === 'elastico' ? -side * 28 : side * 20
      this.ball.y = clamp(this.ball.y + lateral, 20, H - 20)
      this.ball.cooldown = 0.12
    } else if (p.skill === 'stop-go') {
      p.vx *= 0.25
      p.vy *= 0.25
    }
    this.stats.homeDribbles++
    this.recordHighlight(
      'dribble',
      p,
      `${DRIBBLE_NAMES[p.skill]}`,
      `${p.name} executed a ${DRIBBLE_NAMES[p.skill].toLowerCase()} past the press`,
      p.x + p.facingX * 55,
      p.y + p.facingY * 35
    )
    this.notice = DRIBBLE_NAMES[p.skill]
    this.noticeTimer = 0.65
    this.sound(240, 0.05, 'skill')
  }

  private loop = (now: number) => {
    const frame = Math.min((now - this.last) / 1000, 0.1)
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
    if (this.snapshotClock <= 0) {
      this.emit()
      this.snapshotClock = 0.1
    }
    this.raf = requestAnimationFrame(this.loop)
  }

  private emit() {
    this.onSnapshot({
      home: this.score[0],
      away: this.score[1],
      secondsLeft: Math.max(0, this.secondsLeft),
      controlled: this.players[this.controlled]?.name || '',
      notice: this.noticeTimer > 0 ? this.notice : '',
      status: this.status,
      stamina: this.players[this.controlled]?.stamina ?? 100,
      muted: this.muted,
      charge: this.charge,
      chargeKind: this.chargeKind,
      sprinting: this.players[this.controlled]?.sprinting ?? false,
      highlights: [...this.highlights],
      stats: { ...this.stats },
    })
  }

  private update(dt: number) {
    if (this.resetTimer > 0) {
      this.resetTimer -= dt
      // Keep simulating ball settling inside the goal net during goal celebration!
      this.ball.x += this.ball.vx * dt
      this.ball.y += this.ball.vy * dt
      this.ball.z = Math.max(0, this.ball.z + this.ball.vz * dt)
      this.ball.vz = this.ball.z > 0 ? this.ball.vz - 500 * dt : 0
      this.ball.vx *= Math.pow(0.08, dt)
      this.ball.vy *= Math.pow(0.08, dt)
      this.ball.x = clamp(this.ball.x, -21, W + 21)
      this.ball.y = clamp(this.ball.y, GOAL_TOP + 6, GOAL_BOTTOM - 6)
      if (this.resetTimer <= 0) this.resetPositions()
      return
    }
    this.secondsLeft -= dt
    this.noticeTimer -= dt
    this.ball.cooldown -= dt
    if (this.chargeKind) this.charge = Math.min(1, this.charge + dt / 1.05)
    if (this.secondsLeft <= 0) {
      this.secondsLeft = 0
      this.status = 'fulltime'
      this.notice = 'FULL TIME'
      this.noticeTimer = 99
      this.cancelCharge()
      this.sound(440, 0.35, 'whistle')
      this.emit()
      return
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
      let dx = 0
      let dy = 0
      const iqBonus = 0.94 + ((p.iq - 70) / 30) * 0.1
      let speed = 184 * (100 / (72 + p.radius * 1.8)) * iqBonus
      let sprinting = false

      // Keepers use goalkeeper AI unless holding the ball
      if (p.id === this.controlled && (!p.keeper || this.ball.owner === p.id)) {
        dx = input.dx
        dy = input.dy
        sprinting =
          (this.keys.has('ShiftLeft') || this.keys.has('ShiftRight') || this.touch.sprint) &&
          p.stamina > 1 &&
          input.len > 0.12
        speed *= Math.max(0.18, input.len)
        if (sprinting) {
          speed *= 1.52
          p.stamina = Math.max(0, p.stamina - dt * 16)
        } else p.stamina = Math.min(100, p.stamina + dt * 10)
        if (p.skillTime > 0 && p.skill !== 'stop-go') speed *= 1.28
        if (p.skillTime > 0 && p.skill === 'stop-go' && p.actionTime < 0.28) speed *= 1.85
      } else {
        const target = this.aiTarget(p)
        dx = target.x - p.x
        dy = target.y - p.y
        const urgent = this.ball.owner === null && dist(p, this.ball) < 145
        sprinting = !p.keeper && (urgent || (this.ball.owner === p.id && Math.abs(p.x - W / 2) > 330))
        speed *= p.keeper ? 1.04 : sprinting ? 1.16 : 0.92
        p.stamina = Math.min(100, p.stamina + dt * (sprinting ? 1 : 7))
      }

      p.sprinting = sprinting
      const len = Math.hypot(dx, dy)
      if (len > 0.8) {
        const nx = dx / Math.max(1, len)
        const ny = dy / Math.max(1, len)
        let response = (p.skillTime > 0 ? 13 : sprinting ? 7.2 : 10.2) * (0.85 + p.iq / 450)
        if (this.config.weather === 'rain') response *= 0.88
        const desiredSpeed = len < 22 ? speed * (len / 22) : speed
        p.vx += (nx * desiredSpeed - p.vx) * Math.min(1, dt * response)
        p.vy += (ny * desiredSpeed - p.vy) * Math.min(1, dt * response)

        if (p.keeper && this.ball.owner !== p.id) {
          // Goalkeepers always square up and face the ball!
          const bdx = this.ball.x - p.x
          const bdy = this.ball.y - p.y
          const blen = Math.hypot(bdx, bdy) || 1
          p.facingX = bdx / blen
          p.facingY = bdy / blen
        } else {
          const turn = Math.min(1, dt * (sprinting ? 7.5 : 11))
          p.facingX += (nx - p.facingX) * turn
          p.facingY += (ny - p.facingY) * turn
        }
      } else {
        p.vx *= Math.pow(0.02, dt)
        p.vy *= Math.pow(0.02, dt)
        if (p.keeper) {
          const bdx = this.ball.x - p.x
          const bdy = this.ball.y - p.y
          const blen = Math.hypot(bdx, bdy) || 1
          p.facingX = bdx / blen
          p.facingY = bdy / blen
        }
      }

      if (p.action === 'dive') {
        p.vx *= 0.9
        p.vy *= 0.9
      }

      if (p.keeper) {
        // STRICT GOALKEEPER BOX DISCIPLINE: Keepers NEVER leave their penalty box!
        const minKeeperX = p.team === 0 ? 22 : W - 165
        const maxKeeperX = p.team === 0 ? 165 : W - 22
        p.x = clamp(p.x + p.vx * dt, minKeeperX, maxKeeperX)
        p.y = clamp(p.y + p.vy * dt, 185, H - 185)
      } else {
        p.x = clamp(p.x + p.vx * dt, 28, W - 28)
        p.y = clamp(p.y + p.vy * dt, 28, H - 28)
      }
    }

    for (let i = 0; i < this.players.length; i++) {
      for (let j = i + 1; j < this.players.length; j++) {
        const a = this.players[i]
        const b = this.players[j]
        const d = dist(a, b)
        const min = a.radius + b.radius - 2
        if (d < min && d > 0) {
          const overlap = min - d
          const nx = (b.x - a.x) / d
          const ny = (b.y - a.y) / d

          // Prevent AI defenders from bulldozing a stationary user-controlled player across the pitch
          const aStationaryControlled = a.id === this.controlled && Math.hypot(a.vx, a.vy) < 12
          const bStationaryControlled = b.id === this.controlled && Math.hypot(b.vx, b.vy) < 12

          if (a.keeper || aStationaryControlled) {
            if (!b.keeper) {
              b.x += nx * overlap
              b.y += ny * overlap
              b.vx += nx * overlap * 8
              b.vy += ny * overlap * 8
            }
          } else if (b.keeper || bStationaryControlled) {
            if (!a.keeper) {
              a.x -= nx * overlap
              a.y -= ny * overlap
              a.vx -= nx * overlap * 8
              a.vy -= ny * overlap * 8
            }
          } else {
            const push = overlap * 0.5
            a.x -= nx * push
            a.y -= ny * push
            a.vx -= nx * push * 10
            a.vy -= ny * push * 10
            b.x += nx * push
            b.y += ny * push
            b.vx += nx * push * 10
            b.vy += ny * push * 10
          }
        }
      }
    }
  }

  private nearestOutfield(team: 0 | 1, target: { x: number; y: number }, exclude = -1) {
    let first = -1
    let second = -1
    let d1 = Infinity
    let d2 = Infinity
    for (const p of this.players) {
      if (p.team !== team || p.keeper || p.id === exclude) continue
      const d = dist(p, target)
      if (d < d1) {
        second = first
        d2 = d1
        first = p.id
        d1 = d
      } else if (d < d2) {
        second = p.id
        d2 = d
      }
    }
    return [first, second]
  }

  private aiTarget(p: Player) {
    const hasBall = this.ball.owner === p.id
    const attack = p.team === 0 ? 1 : -1

    // 1. INTELLIGENT GOALKEEPER ANGLE-BISECTING POSITIONING
    if (p.keeper) {
      const goalLineX = p.team === 0 ? 24 : W - 24
      if (hasBall) {
        return { x: goalLineX + attack * 38, y: clamp(p.y, GOAL_TOP + 20, GOAL_BOTTOM - 20) }
      }

      // Only sweep for loose ball if it is unowned, slow, and right inside the 6-yard/penalty spot area
      const inSweepZone =
        (p.team === 0 ? this.ball.x < 148 : this.ball.x > W - 148) &&
        Math.abs(this.ball.y - H / 2) < 115
      if (this.ball.owner === null && inSweepZone && dist(p, this.ball) < 95 && Math.hypot(this.ball.vx, this.ball.vy) < 340) {
        return {
          x: clamp(this.ball.x, p.team === 0 ? 26 : W - 145, p.team === 0 ? 145 : W - 26),
          y: clamp(this.ball.y, GOAL_TOP - 25, GOAL_BOTTOM + 25),
        }
      }

      // Bisect angle between ball and center of goal (goalLineX, H / 2)
      const vecX = this.ball.x - goalLineX
      const vecY = this.ball.y - H / 2
      const ballDist = Math.hypot(vecX, vecY) || 1
      const iqScale = clamp(p.iq / 85, 0.8, 1.15)
      // Step off goal line between 18px and 68px depending on how close the ball is
      const stepOut = clamp((1 - clamp(ballDist / 750, 0, 1)) * 56 * iqScale, 16, 68)
      const keeperX = goalLineX + attack * stepOut
      const keeperY = clamp(
        H / 2 + (vecY / ballDist) * 54,
        GOAL_TOP + 8,
        GOAL_BOTTOM - 8
      )
      return { x: keeperX, y: keeperY }
    }

    // 2. OUTFIELD PLAYER WITH BALL
    if (hasBall) {
      const lane = clamp(p.homeY + (H / 2 - p.homeY) * 0.32, 75, H - 75)
      return { x: p.team === 0 ? W - 60 : 60, y: lane }
    }

    // 3. OUTFIELD TACTICAL INTELLIGENCE & POSITIONAL DISCIPLINE
    const iqDiscipline = clamp((p.iq - 40) / 60, 0.45, 1.0) // Higher IQ = tighter formation & smarter runs
    const owner = this.ball.owner === null ? null : this.players[this.ball.owner]

    if (this.ball.owner === null) {
      const nearest = this.nearestOutfield(p.team, this.ball)
      if (nearest[0] === p.id) {
        return { x: this.ball.x + this.ball.vx * 0.14, y: this.ball.y + this.ball.vy * 0.14 }
      }
    }

    if (owner && owner.team !== p.team) {
      const nearest = this.nearestOutfield(p.team, owner)
      const mentality =
        p.team === 0
          ? this.config.tactic === 'offensive'
            ? 1.15
            : this.config.tactic === 'defensive'
            ? 0.82
            : 1
          : 1
      // Primary presser closes down the BALL in front of the ball carrier (at a clean jockey distance)
      // rather than ramming straight into the carrier's center of mass!
      if (nearest[0] === p.id && dist({ x: p.homeX, y: p.homeY }, owner) < 380) {
        const jockeyOffset = owner.radius + p.radius + 2
        return {
          x: owner.x - attack * jockeyOffset + owner.vx * 0.12 * mentality,
          y: owner.y + owner.vy * 0.12 * mentality,
        }
      }
      // Secondary cover shadows passing lane only if within their tactical zone
      if (nearest[1] === p.id && dist({ x: p.homeX, y: p.homeY }, owner) < 230) {
        return {
          x: owner.x - attack * 68,
          y: owner.y + (p.homeY - owner.y) * 0.45,
        }
      }
    }

    // Positional anchor governed by formation homeX/homeY and player Tactical Intelligence (p.iq)
    const effectiveDepth = p.team === 0 ? p.homeX : W - p.homeX
    const isDefender = effectiveDepth < 380
    const isForward = effectiveDepth >= 660
    const mentality =
      p.team === 0
        ? this.config.tactic === 'offensive'
          ? 64
          : this.config.tactic === 'defensive'
          ? -54
          : 0
        : 10
    const roleFactor = isDefender ? 0.45 : isForward ? 0.95 : 0.72
    const shiftX = clamp((this.ball.x - W / 2) * (0.28 * iqDiscipline), -135, 135)
    const shiftY = (this.ball.y - H / 2) * (isDefender ? 0.11 : 0.18) * iqDiscipline

    let supportRunX = 0
    if (owner && owner.team === p.team && !isDefender) {
      supportRunX = attack * (isForward ? 92 : 42) * iqDiscipline * (mentality > 0 ? 1.2 : 1)
    }

    return {
      x: clamp(p.homeX + shiftX * roleFactor + mentality * roleFactor + supportRunX, 65, W - 65),
      y: clamp(p.homeY + shiftY, 48, H - 48),
    }
  }

  private moveBall(dt: number) {
    if (this.ball.owner !== null) {
      const p = this.players[this.ball.owner]
      const speed = Math.hypot(p.vx, p.vy)
      // Rhythmic foot-tap dribbling pulse synchronized with the player's running stride!
      const stridePulse = speed > 6 ? (0.5 + 0.5 * Math.sin(performance.now() * (p.sprinting ? 0.016 : 0.012) + p.id)) : 0
      const baseTouch = p.radius + 5.5
      const strideKickAhead = stridePulse * Math.min(speed / (p.sprinting ? 11 : 17), p.sprinting ? 19 : 12)
      const touchDistance = baseTouch + strideKickAhead
      // Subtle lateral foot-to-foot weave while dribbling
      const perpX = -p.facingY
      const perpY = p.facingX
      const lateralWeave = speed > 10 ? Math.cos(performance.now() * 0.008 + p.id) * 2.2 : 0

      const targetX = p.x + p.facingX * touchDistance + perpX * lateralWeave
      const targetY = p.y + p.facingY * touchDistance + perpY * lateralWeave
      const control = 1 - Math.pow(0.0005, dt)
      this.ball.x += (targetX - this.ball.x) * control
      this.ball.y += (targetY - this.ball.y) * control
      this.ball.z +=
        (1.5 + stridePulse * Math.min(speed / 65, 3.2) - this.ball.z) * control
      this.ball.vx = p.vx * (1 + stridePulse * 0.35)
      this.ball.vy = p.vy * (1 + stridePulse * 0.35)
      this.ball.vz = 0
      this.ball.curve = 0
      if (p.keeper && p.id !== this.controlled) {
        this.keeperHold[p.team] += dt
        if (this.keeperHold[p.team] > 0.65) this.aiKick(p, true)
      } else if (p.id !== this.controlled && this.random() < dt * 0.64) {
        this.aiKick(p)
      }
      if (p.skillTime <= 0) {
        for (const opponent of this.players) {
          if (opponent.team === p.team || opponent.keeper || opponent.action === 'dive') continue
          if (dist(opponent, this.ball) < opponent.radius + 9 && this.random() < dt * 0.48) {
            this.ball.owner = opponent.id
            this.ball.lastTouch = opponent.id
            this.ball.cooldown = 0.2
            if (opponent.team === 0) this.controlled = opponent.id
            this.notice = 'CLEAN TACKLE'
            this.noticeTimer = 0.55
            break
          }
        }
      }
      return
    }

    this.ball.x += this.ball.vx * dt
    this.ball.y += this.ball.vy * dt
    this.ball.z += this.ball.vz * dt
    this.ball.vz -= 500 * dt

    if (this.ball.z > 2 && Math.abs(this.ball.curve) > 0.1) {
      const horizontalSpeed = Math.hypot(this.ball.vx, this.ball.vy) || 1
      const bend = this.ball.curve * dt
      this.ball.vx += (-this.ball.vy / horizontalSpeed) * bend
      this.ball.vy += (this.ball.vx / horizontalSpeed) * bend
      this.ball.curve *= Math.pow(0.985, dt * 60)
    }

    if (this.ball.z <= 0) {
      this.ball.z = 0
      if (Math.abs(this.ball.vz) > 48) {
        const bounce =
          this.config.weather === 'rain' ? 0.4 : this.config.pitch === 'street' ? 0.58 : 0.52
        this.ball.vz *= -bounce
        this.sound(90, 0.025, 'bounce')
      } else this.ball.vz = 0
    }

    let groundDrag =
      this.ball.z < 2
        ? this.config.pitch === 'street'
          ? 0.982
          : this.config.pitch === 'turf'
          ? 0.993
          : 0.988
        : 0.998
    if (this.config.weather === 'rain' && this.ball.z < 2) groundDrag = Math.max(groundDrag, 0.993)
    if (this.config.weather === 'rain' && this.ball.z >= 2) groundDrag = 0.997
    this.ball.vx *= Math.pow(groundDrag, dt * 60)
    this.ball.vy *= Math.pow(groundDrag, dt * 60)

    if (this.ball.y < 18 || this.ball.y > H - 18) {
      this.ball.y = clamp(this.ball.y, 18, H - 18)
      this.ball.vy *= -0.72
    }
    if (this.tryKeeperSave()) return
    if (this.ball.x < 6 || this.ball.x > W - 6) {
      if (this.ball.y > GOAL_TOP && this.ball.y < GOAL_BOTTOM && this.ball.z < 244) {
        this.goal(this.ball.x > W / 2 ? 0 : 1)
        return
      }
      this.ball.x = clamp(this.ball.x, 6, W - 6)
      this.ball.vx *= -0.7
    }
    if (this.ball.cooldown <= 0 && this.ball.z < 155) {
      const candidates = this.players.filter(
        p => !p.keeper && dist(p, this.ball) < p.radius + (this.ball.z > 48 ? 10 : 13)
      )
      candidates.sort((a, b) => dist(a, this.ball) - dist(b, this.ball))
      if (candidates[0]) {
        const p = candidates[0]
        const incoming = Math.hypot(this.ball.vx, this.ball.vy)
        this.ball.owner = p.id
        this.ball.lastTouch = p.id
        this.ball.curve = 0
        this.ball.vx *= incoming > 500 ? 0.22 : 0.05
        this.ball.vy *= incoming > 500 ? 0.22 : 0.05
        this.ball.x += p.facingX * Math.min(incoming / 80, 8)
        if (this.ball.z > 48) {
          p.action = 'jump'
          p.actionTime = 0.46
        }
        if (p.team === 0) this.controlled = p.id
      }
    }
  }

  private tryKeeperSave() {
    if (this.ball.cooldown > 0) return false
    for (const keeper of this.players) {
      if (!keeper.keeper) continue
      const inArea = keeper.team === 0 ? this.ball.x < 195 : this.ball.x > W - 195
      if (!inArea || this.ball.z > 248) continue
      const d = dist(keeper, this.ball)
      const reach = keeper.radius + (keeper.action === 'dive' ? 58 : 26)
      if (d > reach) {
        const threatening =
          (keeper.team === 0 && this.ball.vx < -220) || (keeper.team === 1 && this.ball.vx > 220)
        const timeToLine = Math.abs((keeper.x - this.ball.x) / (Math.abs(this.ball.vx) || 1))
        const predictedY = this.ball.y + this.ball.vy * Math.min(timeToLine, 0.5)
        if (threatening && d < 145 && Math.abs(predictedY - keeper.y) < 112 && timeToLine < 0.54) {
          keeper.action = 'dive'
          keeper.actionTime = 0.66
          keeper.vy = clamp((predictedY - keeper.y) * 5.6, -340, 340)
          keeper.vx *= 0.35
        }
        continue
      }
      const shotSpeed = Math.hypot(this.ball.vx, this.ball.vy)
      const hardShot = shotSpeed > 690 || this.ball.z > 145
      keeper.action = hardShot ? 'dive' : this.ball.z > 48 ? 'jump' : 'catch'
      keeper.actionTime = hardShot ? 0.7 : 0.5
      this.ball.lastTouch = keeper.id
      const wetHandling = this.config.weather === 'rain' ? 0.13 : 0

      if (keeper.team === 0) this.stats.homeSaves++
      else this.stats.awaySaves++

      if (hardShot && (d > keeper.radius + 8 || this.random() < 0.3 + wetHandling)) {
        this.ball.owner = null
        this.ball.cooldown = 0.38
        this.ball.curve = 0
        this.ball.vx = (keeper.team === 0 ? 1 : -1) * Math.max(230, Math.abs(this.ball.vx) * 0.48)
        this.ball.vy = (this.ball.y >= keeper.y ? 1 : -1) * (150 + this.random() * 130)
        this.ball.vz = 145
        this.ball.z = Math.max(35, this.ball.z)
        this.notice = 'STRONG HAND · PARRIED'
        this.sound(75, 0.12, 'save')
        this.recordHighlight(
          'save',
          keeper,
          `${keeper.name.toUpperCase()} DIVING PARRY`,
          `Acrobatic parry to deny a ${Math.round(shotSpeed / 10)} km/h effort`
        )
      } else {
        this.ball.owner = keeper.id
        this.ball.vx = 0
        this.ball.vy = 0
        this.ball.vz = 0
        this.ball.curve = 0
        this.ball.cooldown = 0.3
        this.keeperHold[keeper.team] = 0
        if (keeper.team === 0) this.controlled = keeper.id
        this.notice =
          this.ball.z > 48
            ? `${keeper.name.toUpperCase()} · CLAIMS THE CROSS`
            : `${keeper.name.toUpperCase()} · SAFE HANDS`
        this.sound(115, 0.09, 'save')
        if (shotSpeed > 440) {
          this.recordHighlight(
            'save',
            keeper,
            `${keeper.name.toUpperCase()} SAVE`,
            `Clean catch in the penalty box`
          )
        }
      }
      this.noticeTimer = 1.05
      this.emit()
      return true
    }
    return false
  }

  private aiKick(p: Player, keeperDistribution = false) {
    if (this.ball.owner !== p.id) return
    const attack = p.team === 0 ? 1 : -1
    const close = p.team === 0 ? p.x > 920 : p.x < 280
    let tx = p.team === 0 ? W : 0
    let ty = H / 2 + (this.random() - 0.5) * 100
    let speed = close ? 680 : 430
    let lift = close ? 175 : 45
    let curve = 0
    const mates = this.players.filter(m => m.team === p.team && m.id !== p.id && !m.keeper)

    if (keeperDistribution) {
      const sorted = [...mates].sort((a, b) => dist(a, p) - dist(b, p))
      const m = sorted[Math.floor(this.random() * Math.min(2, sorted.length))]
      if (m) {
        tx = m.x + attack * 35
        ty = m.y
      }
      speed = 410
      lift = 75
      p.action = 'kick'
      p.actionTime = 0.36
      this.notice = 'KEEPER · QUICK DISTRIBUTION'
      this.noticeTimer = 0.7
    } else if (close) {
      if (p.team === 0) this.stats.homeShots++
      else this.stats.awayShots++
      this.recordHighlight(
        'shot',
        p,
        `${p.name.toUpperCase()} EFFORT ON GOAL`,
        `Driven finish from inside the final third`,
        tx,
        ty
      )
    } else {
      if (p.team === 0) this.stats.homePasses++
      else this.stats.awayPasses++
      const forward = mates.filter(m => (m.x - p.x) * attack > 30)
      const pool = forward.length ? forward : mates
      if (pool.length) {
        const m = pool[Math.floor(this.random() * pool.length)]
        tx = m.x + attack * 25
        ty = m.y
        const wide = Math.abs(p.y - H / 2) > 190 && Math.abs(p.x - W / 2) > 380
        if (wide && dist(m, p) > 180) {
          lift = 245 + this.random() * 75
          speed = 590
          curve = (p.id % 2 ? 1 : -1) * 30
        }
      }
    }
    const len = Math.hypot(tx - p.x, ty - p.y) || 1
    this.ball.owner = null
    this.ball.cooldown = 0.28
    this.ball.lastTouch = p.id
    this.ball.curve = curve
    this.ball.vx = ((tx - p.x) / len) * speed
    this.ball.vy = ((ty - p.y) / len) * speed
    this.ball.vz = lift
    this.keeperHold[p.team] = 0
  }

  private goal(team: number) {
    this.score[team]++
    const scorer =
      (this.ball.lastTouch !== null ? this.players[this.ball.lastTouch] : null) ??
      this.players[team === 0 ? this.controlled : 20]

    this.recordHighlight(
      'goal',
      scorer,
      `GOAL! ${scorer.name.toUpperCase()} (${this.score[0]}–${this.score[1]})`,
      `${scorer.name} found the back of the net for ${team === 0 ? 'MCI' : 'RIV'}`,
      team === 0 ? W : 0,
      this.ball.y
    )

    this.notice = team === 0 ? `GOAL! ${scorer.name.toUpperCase()}` : 'RIVALS SCORE'
    this.noticeTimer = 2.1
    this.resetTimer = 1.9
    // Let ball carry into the net behind the goal line and get caught by the net mesh
    this.ball.vx *= 0.28
    this.ball.vy *= 0.25
    this.ball.vz = Math.min(this.ball.vz, 30)
    this.ball.owner = null
    this.ball.curve = 0
    this.cancelCharge()
    this.sound(520, 0.32, 'goal')
    this.emit()
  }

  private resetPositions() {
    for (const p of this.players) {
      p.x = p.homeX
      p.y = p.homeY
      p.vx = 0
      p.vy = 0
      p.action = 'idle'
      p.actionTime = 0
      p.skillTime = 0
      p.sprinting = false
    }
    this.ball = {
      x: W / 2,
      y: H / 2,
      z: 0,
      vx: 0,
      vy: 0,
      vz: 0,
      owner: 9,
      cooldown: 0.4,
      lastTouch: 9,
      curve: 0,
    }
    this.controlled = 9
    this.keeperHold = [0, 0]
  }

  private ensureAudio() {
    if (this.muted || this.audio) return
    try {
      this.audio = new AudioContext()
    } catch {
      this.audio = null
    }
  }

  private sound(
    frequency: number,
    duration: number,
    type: 'kick' | 'bounce' | 'save' | 'goal' | 'whistle' | 'skill'
  ) {
    if (this.muted) return
    this.ensureAudio()
    if (!this.audio) return
    if (this.audio.state === 'suspended') void this.audio.resume()
    const now = this.audio.currentTime
    const osc = this.audio.createOscillator()
    const gain = this.audio.createGain()
    osc.type = type === 'whistle' ? 'sine' : type === 'goal' ? 'triangle' : 'sine'
    osc.frequency.setValueAtTime(frequency, now)
    osc.frequency.exponentialRampToValueAtTime(
      type === 'goal' ? frequency * 1.8 : Math.max(40, frequency * 0.55),
      now + duration
    )
    gain.gain.setValueAtTime(type === 'bounce' ? 0.025 : 0.07, now)
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration)
    osc.connect(gain)
    gain.connect(this.audio.destination)
    osc.start(now)
    osc.stop(now + duration)
    if (type === 'goal') {
      const second = this.audio.createOscillator()
      const g2 = this.audio.createGain()
      second.type = 'triangle'
      second.frequency.value = frequency * 1.25
      g2.gain.setValueAtTime(0.04, now + 0.06)
      g2.gain.exponentialRampToValueAtTime(0.001, now + duration)
      second.connect(g2)
      g2.connect(this.audio.destination)
      second.start(now + 0.06)
      second.stop(now + duration)
    }
  }
}
