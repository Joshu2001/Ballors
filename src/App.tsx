import { useEffect, useRef, useState, type ChangeEvent } from 'react'
import {
  ArrowLeft,
  ArrowLeftRight,
  Brain,
  Camera,
  ChevronRight,
  Cloud,
  CloudRain,
  Compass,
  Eye,
  Gamepad2,
  Layers,
  LogOut,
  Pause,
  Play,
  RectangleHorizontal,
  RectangleVertical,
  Shield,
  Sliders,
  Sparkles,
  Sun,
  Timer,
  Trash2,
  Upload,
  UserPlus,
  Users,
  Volume2,
  VolumeX,
  Zap,
} from 'lucide-react'
import {
  FootballGame,
  type DribbleType,
  type MatchConfig,
  type NetColorType,
  type NetStyleType,
  type PitchType,
  type PlayerConfig,
  type Snapshot,
  type TacticType,
  type WeatherType,
} from './game/engine'
import {
  FORMATIONS,
  PITCH_H,
  PITCH_W,
  POSITION_PRESETS,
  applyPresetToFormation,
  getFormation,
  type FormationId,
  type PlayerRoleOffsetId,
  type PositionPresetId,
} from './game/tactics'
import {
  BEARD_STYLES,
  BOOT_COLORS,
  EYE_COLORS,
  HAIR_COLORS,
  HAIR_STYLES,
  SKIN_TONES,
  analyzePhotoForPlayerAppearance,
  defaultAppearanceForIndex,
  type CustomDecalShape as DecalShape,
  type CustomDecalTarget as DecalTarget,
  type FaceMapMode,
  type PlayerAppearance,
} from './game/playerModel3d'
import { TacticalOverlay } from './components/TacticalOverlay'
import { PreMatchShowcase3D, type ShowcaseCameraMode } from './components/PreMatchShowcase3D'
import { PostMatchHighlights } from './components/PostMatchHighlights'
import { PlayerScannerModal } from './components/PlayerScannerModal'
import './App.css'

function createPresetEmblemDataUrl(preset: 'lion' | 'eagle' | 'crown'): string {
  const c = document.createElement('canvas')
  c.width = 256
  c.height = 256
  const ctx = c.getContext('2d')!
  ctx.clearRect(0, 0, 256, 256)

  if (preset === 'lion') {
    const g = ctx.createRadialGradient(128, 118, 18, 128, 128, 115)
    g.addColorStop(0, '#fde047')
    g.addColorStop(0.55, '#ca8a04')
    g.addColorStop(1, '#1e1b4b')
    ctx.fillStyle = g
    ctx.beginPath()
    ctx.arc(128, 128, 114, 0, Math.PI * 2)
    ctx.fill()

    ctx.strokeStyle = '#fef08a'
    ctx.lineWidth = 10
    ctx.stroke()

    ctx.fillStyle = '#0f172a'
    ctx.beginPath()
    ctx.moveTo(128, 42)
    ctx.lineTo(188, 86)
    ctx.lineTo(166, 182)
    ctx.lineTo(128, 212)
    ctx.lineTo(90, 182)
    ctx.lineTo(68, 86)
    ctx.closePath()
    ctx.fill()

    ctx.fillStyle = '#facc15'
    ctx.font = '900 44px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('★', 128, 108)
    ctx.font = '900 34px sans-serif'
    ctx.fillText('FC 3D', 128, 158)
  } else if (preset === 'eagle') {
    const g = ctx.createLinearGradient(0, 0, 256, 256)
    g.addColorStop(0, '#0284c7')
    g.addColorStop(0.5, '#0f172a')
    g.addColorStop(1, '#e11d48')
    ctx.fillStyle = g
    ctx.fillRect(16, 16, 224, 224)

    ctx.strokeStyle = '#38bdf8'
    ctx.lineWidth = 12
    ctx.strokeRect(24, 24, 208, 208)

    ctx.fillStyle = '#f8fafc'
    ctx.beginPath()
    ctx.moveTo(36, 95)
    ctx.lineTo(128, 132)
    ctx.lineTo(220, 95)
    ctx.lineTo(186, 165)
    ctx.lineTo(128, 198)
    ctx.lineTo(70, 165)
    ctx.closePath()
    ctx.fill()

    ctx.fillStyle = '#f43f5e'
    ctx.font = '900 32px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('ULTRA', 128, 82)
  } else {
    const g = ctx.createRadialGradient(128, 128, 15, 128, 128, 118)
    g.addColorStop(0, '#10b981')
    g.addColorStop(0.65, '#064e3b')
    g.addColorStop(1, '#022c22')
    ctx.fillStyle = g
    ctx.beginPath()
    ctx.arc(128, 128, 114, 0, Math.PI * 2)
    ctx.fill()

    ctx.fillStyle = '#dfff57'
    ctx.beginPath()
    ctx.moveTo(62, 162)
    ctx.lineTo(76, 86)
    ctx.lineTo(108, 124)
    ctx.lineTo(128, 72)
    ctx.lineTo(148, 124)
    ctx.lineTo(180, 86)
    ctx.lineTo(194, 162)
    ctx.closePath()
    ctx.fill()

    ctx.fillStyle = '#ffffff'
    ctx.font = '900 28px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('ROYALE', 128, 200)
  }
  return c.toDataURL('image/png')
}

const initialPlayers: PlayerConfig[] = [
  { name: 'You', size: 104, power: 74, iq: 92, dribble: 'body-feint', appearance: defaultAppearanceForIndex(0) },
  { name: 'Mateo', size: 96, power: 72, iq: 85, dribble: 'stop-go', appearance: defaultAppearanceForIndex(1) },
  { name: 'Kai', size: 104, power: 76, iq: 88, dribble: 'roulette', appearance: defaultAppearanceForIndex(2) },
  { name: 'Leo', size: 94, power: 82, iq: 89, dribble: 'stepover', appearance: defaultAppearanceForIndex(3) },
  { name: 'Noah', size: 106, power: 86, iq: 84, dribble: 'body-feint', appearance: defaultAppearanceForIndex(4) },
  { name: 'Luca', size: 98, power: 79, iq: 91, dribble: 'roulette', appearance: defaultAppearanceForIndex(5) },
  { name: 'Eli', size: 95, power: 80, iq: 90, dribble: 'elastico', appearance: defaultAppearanceForIndex(6) },
  { name: 'Theo', size: 101, power: 84, iq: 86, dribble: 'stepover', appearance: defaultAppearanceForIndex(7) },
  { name: 'Milo', size: 92, power: 83, iq: 87, dribble: 'sombrero', appearance: defaultAppearanceForIndex(8) },
  { name: 'Alex', size: 103, power: 92, iq: 93, dribble: 'stop-go', appearance: defaultAppearanceForIndex(9) },
  { name: 'Finn', size: 94, power: 86, iq: 88, dribble: 'elastico', appearance: defaultAppearanceForIndex(10) },
  // Substitute Bench Players (12th & 13th squad members by default; grows when users scan/upload new players)
  { name: 'Santi', size: 99, power: 88, iq: 90, dribble: 'elastico', appearance: defaultAppearanceForIndex(11) },
  { name: 'Jude', size: 105, power: 91, iq: 94, dribble: 'roulette', appearance: defaultAppearanceForIndex(12) },
]
const initialNumbers = [1, 2, 4, 5, 3, 6, 8, 10, 7, 9, 11, 12, 14]
const pitchInfo: { id: PitchType; name: string; detail: string }[] = [
  { id: 'grass', name: 'Classic grass', detail: 'Balanced bounce & pace' },
  { id: 'turf', name: 'Arena turf', detail: 'Quicker ball roll' },
  { id: 'street', name: 'Street court', detail: 'Heavy, technical play' },
]
const dribbles: { id: DribbleType; name: string }[] = [
  { id: 'roulette', name: 'Roulette' },
  { id: 'stepover', name: 'Robinho stepover' },
  { id: 'sombrero', name: 'Sombrero' },
  { id: 'stop-go', name: 'Stop & go' },
  { id: 'body-feint', name: 'Body feint' },
  { id: 'elastico', name: 'Elastico' },
]
const netStyleInfo: { id: NetStyleType; name: string; detail: string }[] = [
  { id: 'box-pro', name: 'Pro Box Stanchion', detail: 'Full vertical box + external poles' },
  { id: 'hex-stadium', name: 'Hexagonal Tension', detail: 'Honeycomb weave + deep D-frame' },
  { id: 'deep-cage', name: 'Deep Arena Cage', detail: 'Rigid rectangular steel frame' },
  { id: 'classic-slope', name: 'Classic Tapered', detail: 'Traditional angled rear roof' },
]
const netColorInfo: { id: NetColorType; name: string; swatch: string }[] = [
  { id: 'white', name: 'Classic White', swatch: '#f4f7f2' },
  { id: 'volt', name: 'Volt Lime', swatch: '#dfff57' },
  { id: 'sky-stripe', name: 'Sky & White', swatch: 'linear-gradient(135deg, #7ec3e6 50%, #f8faf2 50%)' },
  { id: 'crimson-gold', name: 'Blaugrana Gold', swatch: 'linear-gradient(135deg, #e11d48 50%, #f59e0b 50%)' },
  { id: 'emerald', name: 'Pitch Emerald', swatch: '#34d399' },
  { id: 'stealth-black', name: 'Midnight Carbon', swatch: '#1e293b' },
]
const formatClock = (seconds: number, duration: number) => {
  const elapsed = duration * 60 - seconds
  const matchMinutes = Math.min(90, Math.floor((elapsed / (duration * 60)) * 90))
  const secs = Math.floor(((elapsed / (duration * 60)) * 90 * 60) % 60)
  return `${String(matchMinutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
}

export default function App() {
  const [screen, setScreen] = useState<'setup' | 'match'>('setup')
  const [players, setPlayers] = useState(initialPlayers)
  const [numbers, setNumbers] = useState(initialNumbers)
  const [selected, setSelected] = useState(9)
  const [showcaseMode, setShowcaseMode] = useState<ShowcaseCameraMode>('squad')
  const [editorTab, setEditorTab] = useState<'attributes' | 'face' | 'decal'>('attributes')
  const [decalSavedNotice, setDecalSavedNotice] = useState<string | null>(null)
  const [showPlayerScanner, setShowPlayerScanner] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [pitch, setPitch] = useState<PitchType>('grass')
  const [weather, setWeather] = useState<WeatherType>('clear')
  const [tactic, setTactic] = useState<TacticType>('balanced')
  const [netStyle, setNetStyle] = useState<NetStyleType>('box-pro')
  const [netColor, setNetColor] = useState<NetColorType>('white')
  const [formation, setFormation] = useState<FormationId>('4-3-3')
  const [positionPreset, setPositionPreset] = useState<PositionPresetId>('standard')
  const [playerRoles, setPlayerRoles] = useState<PlayerRoleOffsetId[]>(() => Array(11).fill('default'))
  const [positions, setPositions] = useState<[number, number][]>(() => applyPresetToFormation('4-3-3', 'standard'))
  const [showTacticalOverlay, setShowTacticalOverlay] = useState(false)

  const [orientation, setOrientation] = useState<'landscape' | 'portrait'>('landscape')
  const [duration, setDuration] = useState(2)
  const [sprintHeld, setSprintHeld] = useState(false)
  const [snapshot, setSnapshot] = useState<Snapshot>({
    home: 0,
    away: 0,
    secondsLeft: 120,
    controlled: 'Alex',
    notice: 'KICK OFF',
    status: 'playing',
    stamina: 100,
    muted: false,
    charge: 0,
    chargeKind: null,
    sprinting: false,
    highlights: [],
    stats: {
      homeShots: 0,
      awayShots: 0,
      homeSaves: 0,
      awaySaves: 0,
      homeDribbles: 0,
      awayDribbles: 0,
      homePasses: 0,
      awayPasses: 0,
    },
  })
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const gameRef = useRef<FootballGame | null>(null)
  const configRef = useRef<MatchConfig>({
    players: players.slice(0, 11),
    pitch,
    duration,
    weather,
    tactic,
    netStyle,
    netColor,
    formation,
    positionPreset,
    positions,
  })
  const [matchKey, setMatchKey] = useState(0)

  useEffect(() => {
    if (screen !== 'match' || !canvasRef.current) return
    const game = new FootballGame(canvasRef.current, configRef.current, setSnapshot)
    gameRef.current = game
    return () => {
      game.destroy()
      gameRef.current = null
    }
  }, [screen, matchKey])

  const updatePlayer = (patch: Partial<PlayerConfig>) =>
    setPlayers(old => old.map((p, i) => (i === selected ? { ...p, ...patch } : p)))

  const updateAppearance = (patch: Partial<PlayerAppearance>, preferredCamera?: ShowcaseCameraMode) => {
    setPlayers(old =>
      old.map((p, i) => {
        if (i !== selected) return p
        const currentApp = p.appearance ?? defaultAppearanceForIndex(i)
        return { ...p, appearance: { ...currentApp, ...patch } }
      })
    )
    if (preferredCamera) {
      setShowcaseMode(preferredCamera)
    } else if (showcaseMode === 'squad') {
      setShowcaseMode('face')
    }
  }

  const applyFullBodyPhotoToSelected = (rawUrl: string, label: string) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      const maxDim = 512
      const scale = Math.min(1, maxDim / Math.max(img.width, img.height))
      const dw = Math.max(64, Math.round(img.width * scale))
      const dh = Math.max(64, Math.round(img.height * scale))
      const c = document.createElement('canvas')
      c.width = dw
      c.height = dh
      const ctx = c.getContext('2d')!
      ctx.clearRect(0, 0, dw, dh)
      ctx.drawImage(img, 0, 0, dw, dh)
      const normalizedDataUrl = c.toDataURL('image/png')

      const normImg = new Image()
      normImg.onload = () => {
        const autoApp = analyzePhotoForPlayerAppearance(normImg, normalizedDataUrl, safeSelected)
        updateAppearance(
          {
            ...autoApp,
            faceMapMode: 'photo-blend',
          },
          'face'
        )
        setDecalSavedNotice(
          `${label} mapped in 3D (Face, Nose ${autoApp.skinTone}, Hair ${autoApp.hairColor} & Kit) for #${numbers[safeSelected]} ${players[safeSelected].name}`
        )
      }
      normImg.src = normalizedDataUrl
    }
    img.src = rawUrl
  }

  const handleUploadDecalPhoto = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const rawUrl = typeof reader.result === 'string' ? reader.result : ''
      if (!rawUrl) return
      applyFullBodyPhotoToSelected(rawUrl, 'Uploaded Photo')
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  const handleApplyDecalToEntireSquad = () => {
    const srcApp = players[selected].appearance ?? defaultAppearanceForIndex(selected)
    if (!srcApp.customDecalDataUrl) return
    setPlayers(old =>
      old.map((p, i) => {
        const base = p.appearance ?? defaultAppearanceForIndex(i)
        return {
          ...p,
          appearance: {
            ...base,
            customDecalDataUrl: srcApp.customDecalDataUrl,
            customDecalTarget: srcApp.customDecalTarget ?? 'chest',
            customDecalShape: srcApp.customDecalShape ?? 'shield',
            customDecalDepth: srcApp.customDecalDepth ?? 85,
          },
        }
      })
    )
    setShowcaseMode('squad')
    setDecalSavedNotice(`3D Decal stamped onto all ${players.length} Squad & Bench kits!`)
  }

  const handleCreateScannedPlayer = (
    newPlayer: PlayerConfig,
    shirtNumber: number,
    destination: 'bench' | 'starter',
    replaceStarterIndex: number
  ) => {
    if (destination === 'starter') {
      const targetIdx = Math.max(0, Math.min(10, replaceStarterIndex))
      const replacedPlayer = players[targetIdx]
      const replacedNumber = numbers[targetIdx]
      setPlayers(prev => {
        const next = [...prev]
        next[targetIdx] = newPlayer
        next.push(replacedPlayer)
        return next
      })
      setNumbers(prev => {
        const next = [...prev]
        next[targetIdx] = shirtNumber
        next.push(replacedNumber)
        return next
      })
      setSelected(targetIdx)
      setShowcaseMode('face')
      setEditorTab('face')
      setDecalSavedNotice(
        `Added #${shirtNumber} ${newPlayer.name} to Starting XI (#${replacedNumber} ${replacedPlayer.name} moved to Bench)`
      )
    } else {
      const newIdx = players.length
      setPlayers(prev => [...prev, newPlayer])
      setNumbers(prev => [...prev, shirtNumber])
      setSelected(newIdx)
      setShowcaseMode('face')
      setEditorTab('face')
      setDecalSavedNotice(`Created & added #${shirtNumber} ${newPlayer.name} to Substitute Bench!`)
    }
    setShowPlayerScanner(false)
  }

  const handleSelectFormation = (nextFormation: FormationId) => {
    setFormation(nextFormation)
    setPositions(applyPresetToFormation(nextFormation, positionPreset, playerRoles))
  }

  const handleSelectPositionPreset = (nextPreset: PositionPresetId) => {
    setPositionPreset(nextPreset)
    setPositions(applyPresetToFormation(formation, nextPreset, playerRoles))
  }

  const handleSelectPlayerRole = (playerIdx: number, nextRole: PlayerRoleOffsetId) => {
    const updatedRoles = playerRoles.map((r, i) => (i === playerIdx ? nextRole : r))
    setPlayerRoles(updatedRoles)
    const recomputed = applyPresetToFormation(formation, positionPreset, updatedRoles)
    setPositions(prev => prev.map((pos, i) => (i === playerIdx ? recomputed[i] : pos)))
  }

  const handleUpdateSinglePosition = (playerIdx: number, x: number, y: number) => {
    setPositions(prev => prev.map((pos, i) => (i === playerIdx ? [x, y] : pos)))
  }

  const handleSwapPlayers = (indexA: number, indexB: number) => {
    setPlayers(prev => {
      const next = [...prev]
      const temp = next[indexA]
      next[indexA] = next[indexB]
      next[indexB] = temp
      return next
    })
    setNumbers(prev => {
      const next = [...prev]
      const temp = next[indexA]
      next[indexA] = next[indexB]
      next[indexB] = temp
      return next
    })
  }

  const handleResetPositions = () => {
    const defaultRoles: PlayerRoleOffsetId[] = Array(11).fill('default')
    setPlayerRoles(defaultRoles)
    setPositionPreset('standard')
    setPositions(applyPresetToFormation(formation, 'standard', defaultRoles))
  }

  const start = () => {
    configRef.current = {
      players: players.slice(0, 11),
      pitch,
      duration,
      weather,
      tactic,
      netStyle,
      netColor,
      formation,
      positionPreset,
      positions,
    }
    setSnapshot(s => ({
      ...s,
      home: 0,
      away: 0,
      secondsLeft: duration * 60,
      status: 'playing',
      highlights: [],
      stats: {
        homeShots: 0,
        awayShots: 0,
        homeSaves: 0,
        awaySaves: 0,
        homeDribbles: 0,
        awayDribbles: 0,
        homePasses: 0,
        awayPasses: 0,
      },
    }))
    setShowTacticalOverlay(false)
    setScreen('match')
  }

  const applyTacticsInMatch = () => {
    configRef.current = {
      players: players.slice(0, 11),
      pitch,
      duration,
      weather,
      tactic,
      netStyle,
      netColor,
      formation,
      positionPreset,
      positions,
    }
    gameRef.current?.updateTactics(positions, tactic, formation, positionPreset)
    setShowTacticalOverlay(false)
    if (snapshot.status === 'paused') {
      gameRef.current?.pause()
    }
  }

  const restart = () => {
    configRef.current = {
      players: players.slice(0, 11),
      pitch,
      duration,
      weather,
      tactic,
      netStyle,
      netColor,
      formation,
      positionPreset,
      positions,
    }
    setMatchKey(k => k + 1)
  }
  const sprintEnd = () => {
    setSprintHeld(false)
    gameRef.current?.setSprint(false)
  }
  const chargeEnd = () => gameRef.current?.releaseCharge()

  const currentFormationDef = getFormation(formation)
  const currentPresetDef = POSITION_PRESETS.find(p => p.id === positionPreset) ?? POSITION_PRESETS[0]
  const safeSelected = Math.min(selected, players.length - 1)
  const currentApp = players[safeSelected]?.appearance ?? defaultAppearanceForIndex(safeSelected)

  if (screen === 'setup')
    return (
      <main className="setup-shell">
        <header className="topbar">
          <div className="brand">
            <span className="brand-mark">M</span>
            <span>
              MATCHDAY<small>FOOTBALL LAB</small>
            </span>
          </div>
          <div className="topbar-actions">
            <span className="mode-label">
              {players.length} SQUAD ({players.length - 11} BENCH) · {currentFormationDef.name}
            </span>
            <button
              type="button"
              className="topbar-scan-player-btn"
              onClick={() => setShowPlayerScanner(true)}
            >
              <Camera size={14} />
              <span>+ SCAN / UPLOAD PHOTO TO ADD PLAYER</span>
            </button>
            <button type="button" className="topbar-tactics-btn" onClick={() => setShowTacticalOverlay(true)}>
              <Compass size={14} />
              <span>TACTICAL OVERLAY</span>
            </button>
          </div>
        </header>
        <section className="setup-hero">
          <div>
            <p className="overline">YOUR CLUB. YOUR RULES.</p>
            <h1>
              OWN THE
              <br />
              <em>Match.</em>
            </h1>
          </div>
          <p>
            Sculpt every player in 3D, scan or upload a photo of yourself to create a new player,
            <br className="desktop-break" /> manage your Starting XI &amp; Bench ({players.length} players), then command the pitch.
          </p>
        </section>
        <div className="setup-grid">
          <section className="squad-section">
            <div className="section-heading squad-heading-row">
              <div>
                <Users size={19} />
                <h2>Starting Eleven (11) &amp; Bench ({players.length - 11})</h2>
              </div>
              <div className="squad-heading-actions">
                <span>
                  {currentFormationDef.name} · {currentPresetDef.name.toUpperCase()}
                </span>
                <button
                  type="button"
                  className="add-player-cta-btn"
                  onClick={() => setShowPlayerScanner(true)}
                >
                  <UserPlus size={14} />
                  <span>+ SCAN / UPLOAD PHOTO TO ADD PLAYER</span>
                </button>
              </div>
            </div>

            <div className="player-tabs" role="tablist" aria-label="Select starting XI player">
              {players.slice(0, 11).map((p, i) => {
                const roleLabel = currentFormationDef.slots[i]?.role ?? 'PLY'
                return (
                  <button
                    key={i}
                    role="tab"
                    aria-selected={safeSelected === i}
                    className={safeSelected === i ? 'active' : ''}
                    onClick={() => setSelected(i)}
                  >
                    <span>
                      {numbers[i]} <small className="tab-role-code">{roleLabel}</small>
                    </span>
                    {p.name || `Player ${i + 1}`}
                  </button>
                )
              })}
              <button
                type="button"
                className="player-tab-add-btn"
                onClick={() => setShowPlayerScanner(true)}
                title="Upload a photo or scan yourself with camera to create & add a new player"
              >
                <span>
                  + <small className="tab-role-code">NEW</small>
                </span>
                SCAN / UPLOAD
              </button>
            </div>

            {/* Substitute Bench Strip (Players 12, 13, 14+) */}
            <div className="bench-strip-container">
              <div className="bench-strip-header">
                <span>
                  SUBSTITUTE BENCH ({players.length - 11} PLAYERS · TOTAL SQUAD {players.length})
                </span>
                <small>Click any bench player to customize in 3D or swap into the Starting XI</small>
              </div>
              <div className="bench-tabs-row" role="tablist" aria-label="Substitute bench players">
                {players.slice(11).map((p, offset) => {
                  const idx = 11 + offset
                  const hasCustomScan = Boolean(p.appearance?.customDecalDataUrl)
                  return (
                    <button
                      key={idx}
                      type="button"
                      role="tab"
                      aria-selected={safeSelected === idx}
                      className={`bench-tab-btn ${safeSelected === idx ? 'active' : ''}`}
                      onClick={() => setSelected(idx)}
                    >
                      <span className="bench-tab-num">#{numbers[idx] ?? idx + 1}</span>
                      <span className="bench-tab-info">
                        <strong>{p.name}</strong>
                        <small>
                          SUB · {p.iq ?? 88} IQ {hasCustomScan ? '· 3D SCAN' : ''}
                        </small>
                      </span>
                    </button>
                  )
                })}
                <button
                  type="button"
                  className="bench-add-scan-btn"
                  onClick={() => setShowPlayerScanner(true)}
                >
                  <Camera size={14} />
                  <span>+ CREATE PLAYER FROM PHOTO / CAMERA</span>
                </button>
              </div>
            </div>

            {safeSelected >= 11 && (
              <div className="bench-swap-callout">
                <div className="bench-swap-title">
                  <ArrowLeftRight size={14} />
                  <span>
                    BENCH PLAYER SELECTED: <b>#{numbers[safeSelected]} {players[safeSelected].name}</b> — SWAP INTO STARTING XI:
                  </span>
                </div>
                <div className="bench-swap-pills">
                  {players.slice(0, 11).map((starter, sIdx) => (
                    <button
                      key={sIdx}
                      type="button"
                      onClick={() => {
                        handleSwapPlayers(safeSelected, sIdx)
                        setSelected(sIdx)
                      }}
                      title={`Swap #${numbers[safeSelected]} ${players[safeSelected].name} with #${numbers[sIdx]} ${starter.name}`}
                    >
                      #{numbers[sIdx]} {starter.name} ({currentFormationDef.slots[sIdx]?.role ?? 'PLY'})
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="player-editor player-editor-3d">
              <div className="editor-left-column">
                <div className="editor-mode-switch cols-3" role="tablist" aria-label="Player customization tabs">
                  <button
                    type="button"
                    className={editorTab === 'attributes' ? 'active' : ''}
                    onClick={() => {
                      setEditorTab('attributes')
                    }}
                  >
                    <Brain size={13} />
                    <span>Attributes &amp; IQ</span>
                  </button>
                  <button
                    type="button"
                    className={editorTab === 'face' ? 'active' : ''}
                    onClick={() => {
                      setEditorTab('face')
                      setShowcaseMode('face')
                    }}
                  >
                    <Eye size={13} />
                    <span>3D Face &amp; Kit</span>
                  </button>
                  <button
                    type="button"
                    className={editorTab === 'decal' ? 'active' : ''}
                    onClick={() => {
                      setEditorTab('decal')
                      setShowcaseMode(currentApp.customDecalTarget === 'face' ? 'face' : 'body')
                    }}
                  >
                    <Layers size={13} />
                    <span>Photo-to-3D Decal</span>
                  </button>
                </div>

                {editorTab === 'attributes' ? (
                  <div className="editor-fields">
                    <label className="name-field">
                      <span>
                        PLAYER NAME ·{' '}
                        {safeSelected < 11
                          ? currentFormationDef.slots[safeSelected]?.role
                          : `BENCH SUBSTITUTE #${numbers[safeSelected]}`}
                      </span>
                      <input
                        value={players[safeSelected].name}
                        maxLength={12}
                        onChange={e => updatePlayer({ name: e.target.value })}
                        placeholder={`Player ${safeSelected + 1}`}
                      />
                    </label>
                    <label className="range-field">
                      <span>
                        <span>TACTICAL INTELLIGENCE (POSITIONING IQ)</span>
                        <b>{players[safeSelected].iq ?? 88} IQ</b>
                      </span>
                      <input
                        type="range"
                        min="50"
                        max="99"
                        value={players[selected].iq ?? 88}
                        onChange={e => updatePlayer({ iq: Number(e.target.value) })}
                      />
                      <small>
                        <span>FREE ROAM</span>
                        <span>ELITE DISCIPLINE &amp; VISION</span>
                      </small>
                    </label>
                    <label className="range-field">
                      <span>
                        <span>ATHLETIC PHYSIQUE</span>
                        <b>{players[selected].size}%</b>
                      </span>
                      <input
                        type="range"
                        min="75"
                        max="130"
                        value={players[selected].size}
                        onChange={e => updatePlayer({ size: Number(e.target.value) })}
                      />
                      <small>
                        <span>AGILE</span>
                        <span>POWERHOUSE</span>
                      </small>
                    </label>
                    <label className="range-field">
                      <span>
                        <span>SHOT POWER</span>
                        <b>{players[selected].power}</b>
                      </span>
                      <input
                        type="range"
                        min="35"
                        max="100"
                        value={players[selected].power}
                        onChange={e => updatePlayer({ power: Number(e.target.value) })}
                      />
                      <small>
                        <span>PLACED</span>
                        <span>THUNDERBOLT</span>
                      </small>
                    </label>
                  </div>
                ) : editorTab === 'face' ? (
                  <div className="face-editor-fields">
                    <div className="swatch-row">
                      <span>SKIN &amp; NOSE TONE ({currentApp.skinTone})</span>
                      <div className="extracted-kit-row">
                        <label className="kit-color-pill" title="Exact Skin & Nose Tone">
                          <span>Custom</span>
                          <input
                            type="color"
                            value={currentApp.skinTone || '#c6865c'}
                            onChange={e => updateAppearance({ skinTone: e.target.value })}
                          />
                        </label>
                        <div className="color-swatches">
                          {SKIN_TONES.map(s => (
                            <button
                              key={s.id}
                              type="button"
                              className={`color-swatch-btn ${currentApp.skinTone === s.id ? 'active' : ''}`}
                              style={{ backgroundColor: s.id }}
                              onClick={() => updateAppearance({ skinTone: s.id })}
                              title={s.name}
                              aria-label={s.name}
                            />
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="swatch-row">
                      <span>3D HAIRSTYLE</span>
                      <div className="mini-option-grid">
                        {HAIR_STYLES.map(hs => (
                          <button
                            key={hs.id}
                            type="button"
                            className={currentApp.hairStyle === hs.id ? 'active' : ''}
                            onClick={() => updateAppearance({ hairStyle: hs.id })}
                          >
                            {hs.name}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="swatch-row-split">
                      <div className="swatch-row">
                        <span>HAIR COLOR ({currentApp.hairColor})</span>
                        <div className="extracted-kit-row">
                          <label className="kit-color-pill" title="Exact Hair Color">
                            <span>Custom</span>
                            <input
                              type="color"
                              value={currentApp.hairColor || '#181412'}
                              onChange={e => updateAppearance({ hairColor: e.target.value })}
                            />
                          </label>
                          <div className="color-swatches">
                            {HAIR_COLORS.map(hc => (
                              <button
                                key={hc.id}
                                type="button"
                                className={`color-swatch-btn ${currentApp.hairColor === hc.id ? 'active' : ''}`}
                                style={{ backgroundColor: hc.id }}
                                onClick={() => updateAppearance({ hairColor: hc.id })}
                                title={hc.name}
                                aria-label={hc.name}
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                      <div className="swatch-row">
                        <span>EYE IRIS</span>
                        <div className="color-swatches">
                          {EYE_COLORS.map(ec => (
                            <button
                              key={ec.id}
                              type="button"
                              className={`color-swatch-btn ${currentApp.eyeColor === ec.id ? 'active' : ''}`}
                              style={{ backgroundColor: ec.id }}
                              onClick={() => updateAppearance({ eyeColor: ec.id })}
                              title={ec.name}
                              aria-label={ec.name}
                            />
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="swatch-row">
                      <span>FACIAL HAIR / BEARD</span>
                      <div className="mini-option-grid cols-4">
                        {BEARD_STYLES.map(bs => (
                          <button
                            key={bs.id}
                            type="button"
                            className={currentApp.beardStyle === bs.id ? 'active' : ''}
                            onClick={() => updateAppearance({ beardStyle: bs.id })}
                          >
                            {bs.name}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="face-sliders-grid">
                      <label className="range-field">
                        <span>
                          <span>3D NOSE BRIDGE &amp; TIP</span>
                          <b>{currentApp.noseSize}%</b>
                        </span>
                        <input
                          type="range"
                          min="80"
                          max="130"
                          value={currentApp.noseSize}
                          onChange={e => updateAppearance({ noseSize: Number(e.target.value) })}
                        />
                      </label>
                      <label className="range-field">
                        <span>
                          <span>EYEBROW EXPRESSION</span>
                          <b>{currentApp.browTilt}&deg;</b>
                        </span>
                        <input
                          type="range"
                          min="-15"
                          max="15"
                          value={currentApp.browTilt}
                          onChange={e => updateAppearance({ browTilt: Number(e.target.value) })}
                        />
                      </label>
                      <label className="range-field">
                        <span>
                          <span>JAW &amp; CHEEKBONE WIDTH</span>
                          <b>{currentApp.jawWidth}%</b>
                        </span>
                        <input
                          type="range"
                          min="86"
                          max="118"
                          value={currentApp.jawWidth}
                          onChange={e => updateAppearance({ jawWidth: Number(e.target.value) })}
                        />
                      </label>
                      <div className="swatch-row">
                        <span>BOOT COLORWAY</span>
                        <div className="color-swatches">
                          {BOOT_COLORS.map(bc => (
                            <button
                              key={bc.id}
                              type="button"
                              className={`color-swatch-btn ${currentApp.bootColor === bc.id ? 'active' : ''}`}
                              style={{ backgroundColor: bc.id }}
                              onClick={() => updateAppearance({ bootColor: bc.id })}
                              title={bc.name}
                              aria-label={bc.name}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="decal-studio-fields">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      style={{ display: 'none' }}
                      onChange={handleUploadDecalPhoto}
                    />
                    <div className="decal-upload-banner">
                      <div className="decal-preview-box">
                        {currentApp.customDecalDataUrl ? (
                          <img src={currentApp.customDecalDataUrl} alt="3D Player Decal Preview" />
                        ) : (
                          <Layers size={22} />
                        )}
                      </div>
                      <div className="decal-upload-copy">
                        <strong>PHOTO-TO-3D RELIEF ASSET &amp; FACE SCANNER</strong>
                        <p>
                          Upload a picture for this player&apos;s 3D Chest/Face Relief, or scan/upload yourself to create a brand-new player on the roster!
                        </p>
                        <div className="decal-upload-actions">
                          <button
                            type="button"
                            className="decal-upload-btn"
                            onClick={() => fileInputRef.current?.click()}
                          >
                            <Upload size={13} />
                            <span>UPLOAD PICTURE FOR #{numbers[safeSelected]}</span>
                          </button>
                          <button
                            type="button"
                            className="decal-upload-btn scan-new-inline-btn"
                            onClick={() => setShowPlayerScanner(true)}
                          >
                            <Camera size={13} />
                            <span>+ SCAN / UPLOAD AS NEW PLAYER</span>
                          </button>
                          {currentApp.customDecalDataUrl && (
                            <button
                              type="button"
                              className="decal-clear-btn"
                              onClick={() => {
                                updateAppearance({ customDecalDataUrl: undefined }, 'body')
                                setDecalSavedNotice(null)
                              }}
                            >
                              <Trash2 size={13} />
                              <span>REMOVE</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="swatch-row">
                      <span>INSTANT 3D RECONSTRUCTION &amp; EMBLEM SAMPLES</span>
                      <div className="mini-option-grid cols-4">
                        <button
                          type="button"
                          onClick={() =>
                            applyFullBodyPhotoToSelected(
                              '/assets/aistudio/images__3__96ec9ef2.jfif',
                              'Lamine Yamal Full-Body'
                            )
                          }
                        >
                          Lamine Yamal 3D Kit
                        </button>
                        {(
                          [
                            { id: 'lion', label: 'Golden Lion 3D' },
                            { id: 'eagle', label: 'Ultra Eagle 3D' },
                            { id: 'crown', label: 'Royale Crown 3D' },
                          ] as const
                        ).map(sample => (
                          <button
                            key={sample.id}
                            type="button"
                            onClick={() => {
                              const url = createPresetEmblemDataUrl(sample.id)
                              updateAppearance(
                                {
                                  customDecalDataUrl: url,
                                  customTorsoDataUrl: undefined,
                                  customDecalTarget: 'chest',
                                  customDecalShape: currentApp.customDecalShape ?? 'shield',
                                  customDecalDepth: currentApp.customDecalDepth ?? 90,
                                },
                                'body'
                              )
                              setDecalSavedNotice(`${sample.label} saved to #${numbers[safeSelected]} ${players[safeSelected].name}`)
                            }}
                          >
                            {sample.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="swatch-row">
                      <span>3D HEAD LIKENESS &amp; ASSET TARGET</span>
                      <div className="mini-option-grid">
                        {(
                          [
                            { id: 'sculpted', label: '3D Realistic Player (Clean)', cam: 'face' },
                            { id: 'photo-blend', label: 'Blend Isolated Head Photo', cam: 'face' },
                          ] as { id: FaceMapMode; label: string; cam: ShowcaseCameraMode }[]
                        ).map(fm => (
                          <button
                            key={fm.id}
                            type="button"
                            className={(currentApp.faceMapMode ?? 'sculpted') === fm.id ? 'active' : ''}
                            onClick={() => updateAppearance({ faceMapMode: fm.id }, fm.cam)}
                          >
                            {fm.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="swatch-row">
                      <span>3D CUTOUT &amp; BEVEL GEOMETRY</span>
                      <div className="mini-option-grid cols-4">
                        {(
                          [
                            { id: 'shield', label: 'Shield Crest' },
                            { id: 'circle', label: 'Circle Badge' },
                            { id: 'cutout', label: 'Auto Cutout' },
                            { id: 'full', label: 'Full Frame' },
                          ] as { id: DecalShape; label: string }[]
                        ).map(sh => (
                          <button
                            key={sh.id}
                            type="button"
                            className={(currentApp.customDecalShape ?? 'shield') === sh.id ? 'active' : ''}
                            onClick={() =>
                              updateAppearance(
                                { customDecalShape: sh.id },
                                (currentApp.customDecalTarget ?? 'chest') === 'face' ? 'face' : 'body'
                              )
                            }
                          >
                            {sh.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="decal-bottom-row">
                      <label className="range-field">
                        <span>
                          <span>3D NORMAL RELIEF EXTRUSION DEPTH</span>
                          <b>{currentApp.customDecalDepth ?? 85}%</b>
                        </span>
                        <input
                          type="range"
                          min="20"
                          max="150"
                          value={currentApp.customDecalDepth ?? 85}
                          onChange={e =>
                            updateAppearance(
                              { customDecalDepth: Number(e.target.value) },
                              (currentApp.customDecalTarget ?? 'chest') === 'face' ? 'face' : 'body'
                            )
                          }
                        />
                      </label>
                      {currentApp.customDecalDataUrl && (
                        <button
                          type="button"
                          className="decal-stamp-squad-btn"
                          onClick={handleApplyDecalToEntireSquad}
                        >
                          STAMP DECAL ON ALL {players.length} PLAYERS
                        </button>
                      )}
                    </div>

                    {decalSavedNotice && <div className="decal-saved-toast">{decalSavedNotice}</div>}
                  </div>
                )}

                <div className="skill-picker">
                  <span>
                    <Sparkles size={14} /> SIGNATURE DRIBBLE
                  </span>
                  <div>
                    {dribbles.map(d => (
                      <button
                        key={d.id}
                        className={players[safeSelected].dribble === d.id ? 'active' : ''}
                        onClick={() => updatePlayer({ dribble: d.id })}
                      >
                        {d.name}
                      </button>
                    ))}
                  </div>
                  <small>Tap the ball in a match or press SKILL / E to perform it.</small>
                </div>
              </div>

              {/* Live 3D Squad Lineup Showcase & 3D Face/Body Scanner */}
              <PreMatchShowcase3D
                players={players}
                numbers={numbers}
                selectedPlayer={safeSelected}
                cameraMode={showcaseMode}
                onSelectCameraMode={setShowcaseMode}
                onSelectPlayer={setSelected}
              />
            </div>

            {/* Pre-Match Tactical Board Preview & Quick Switcher */}
            <div className="setup-tactical-card">
              <div className="setup-tactical-info">
                <div className="section-heading">
                  <div>
                    <Compass size={18} />
                    <h2>Formation &amp; Positioning</h2>
                  </div>
                  <span>{currentFormationDef.tagline.toUpperCase()}</span>
                </div>
                <div className="quick-formation-pills" role="group" aria-label="Quick formation presets">
                  {FORMATIONS.map(f => (
                    <button
                      key={f.id}
                      type="button"
                      className={formation === f.id ? 'active' : ''}
                      onClick={() => handleSelectFormation(f.id)}
                    >
                      {f.name}
                    </button>
                  ))}
                </div>
                <div className="quick-preset-row">
                  <span className="quick-preset-label">
                    <Sliders size={12} /> PRESET: <b>{currentPresetDef.name}</b>
                  </span>
                  <div className="quick-preset-pills">
                    {POSITION_PRESETS.slice(0, 4).map(pr => (
                      <button
                        key={pr.id}
                        type="button"
                        className={positionPreset === pr.id ? 'active' : ''}
                        onClick={() => handleSelectPositionPreset(pr.id)}
                      >
                        {pr.name}
                      </button>
                    ))}
                  </div>
                </div>
                <button type="button" className="open-tactical-overlay-btn" onClick={() => setShowTacticalOverlay(true)}>
                  <Compass size={16} />
                  <span>OPEN FULL TACTICAL OVERLAY BOARD</span>
                  <ChevronRight size={16} />
                </button>
              </div>

              <div
                className="mini-tactical-preview"
                onClick={() => setShowTacticalOverlay(true)}
                role="button"
                tabIndex={0}
                onKeyDown={e => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    setShowTacticalOverlay(true)
                  }
                }}
                aria-label="Open interactive tactical board"
              >
                <div className="mini-pitch-lines" />
                {positions.map((pos, idx) => (
                  <span
                    key={idx}
                    className={`mini-pitch-dot ${idx === 0 ? 'keeper' : ''} ${safeSelected === idx ? 'selected' : ''}`}
                    style={{
                      left: `${(pos[0] / PITCH_W) * 100}%`,
                      top: `${(pos[1] / PITCH_H) * 100}%`,
                    }}
                  >
                    {numbers[idx]}
                  </span>
                ))}
                <span className="mini-pitch-caption">CLICK TO EDIT POSITIONS</span>
              </div>
            </div>
          </section>

          <aside className="match-options">
            <section>
              <div className="section-heading">
                <div>
                  <Shield size={19} />
                  <h2>The ground</h2>
                </div>
              </div>
              <div className="pitch-options">
                {pitchInfo.map(p => (
                  <button
                    key={p.id}
                    className={pitch === p.id ? `pitch-choice ${p.id} active` : `pitch-choice ${p.id}`}
                    onClick={() => setPitch(p.id)}
                  >
                    <span className="pitch-mini">
                      <i />
                      <i />
                      <i />
                    </span>
                    <span>
                      <b>{p.name}</b>
                      <small>{p.detail}</small>
                    </span>
                    <span className="radio-dot" />
                  </button>
                ))}
              </div>
            </section>
            <section>
              <div className="section-heading">
                <div>
                  <Sun size={18} />
                  <h2>Weather</h2>
                </div>
              </div>
              <div className="option-trio weather-options">
                <button className={weather === 'clear' ? 'active' : ''} onClick={() => setWeather('clear')}>
                  <Sun size={17} />
                  <span>Clear</span>
                </button>
                <button className={weather === 'cloudy' ? 'active' : ''} onClick={() => setWeather('cloudy')}>
                  <Cloud size={17} />
                  <span>Cloudy</span>
                </button>
                <button className={weather === 'rain' ? 'active' : ''} onClick={() => setWeather('rain')}>
                  <CloudRain size={17} />
                  <span>Rain</span>
                </button>
              </div>
            </section>
            <section>
              <div className="section-heading">
                <div>
                  <Zap size={18} />
                  <h2>Team mentality</h2>
                </div>
              </div>
              <div className="option-trio tactic-options">
                {(['defensive', 'balanced', 'offensive'] as TacticType[]).map(t => (
                  <button key={t} className={tactic === t ? 'active' : ''} onClick={() => setTactic(t)}>
                    {t}
                  </button>
                ))}
              </div>
            </section>
            <section className="net-customizer-section">
              <div className="section-heading">
                <div>
                  <Shield size={18} />
                  <h2>Goal Net &amp; Color</h2>
                </div>
              </div>
              <div className="net-style-grid" role="group" aria-label="Goal Net Geometry">
                {netStyleInfo.map(ns => (
                  <button
                    key={ns.id}
                    type="button"
                    className={netStyle === ns.id ? 'net-style-btn active' : 'net-style-btn'}
                    onClick={() => setNetStyle(ns.id)}
                  >
                    <b>{ns.name}</b>
                    <small>{ns.detail}</small>
                  </button>
                ))}
              </div>
              <div className="net-color-row">
                <span className="net-color-label">NET COLORWAY</span>
                <div className="net-color-swatches" role="group" aria-label="Goal Net Color">
                  {netColorInfo.map(nc => (
                    <button
                      key={nc.id}
                      type="button"
                      className={netColor === nc.id ? 'net-color-swatch active' : 'net-color-swatch'}
                      style={{ background: nc.swatch }}
                      onClick={() => setNetColor(nc.id)}
                      title={nc.name}
                      aria-label={nc.name}
                    />
                  ))}
                </div>
              </div>
            </section>
            <section className="duration-section">
              <div className="section-heading">
                <div>
                  <Timer size={19} />
                  <h2>Match length</h2>
                </div>
              </div>
              <div className="duration-options">
                {[2, 4, 6].map(d => (
                  <button key={d} className={duration === d ? 'active' : ''} onClick={() => setDuration(d)}>
                    <b>{d}</b>
                    <span>MIN</span>
                  </button>
                ))}
              </div>
            </section>
            <button
              type="button"
              className="scan-sidebar-button"
              onClick={() => setShowPlayerScanner(true)}
            >
              <Camera size={17} /> + SCAN / UPLOAD PHOTO TO ADD PLAYER
            </button>
            <button type="button" className="tactical-prematch-button" onClick={() => setShowTacticalOverlay(true)}>
              <Compass size={17} /> TACTICAL BOARD ({currentFormationDef.name})
            </button>
            <button className="start-button" onClick={start}>
              START MATCH <ChevronRight size={22} />
            </button>
            <p className="setup-note">Landscape by default · Portrait toggle in match</p>
          </aside>
        </div>

        {showPlayerScanner && (
          <PlayerScannerModal
            nextIndex={players.length}
            suggestedNumber={Math.max(...numbers, 14) + 1}
            starterNames={players.slice(0, 11).map((p, idx) => ({
              index: idx,
              number: numbers[idx] ?? idx + 1,
              name: p.name,
              role: currentFormationDef.slots[idx]?.role ?? 'PLY',
            }))}
            onCreatePlayer={handleCreateScannedPlayer}
            onClose={() => setShowPlayerScanner(false)}
          />
        )}

        {showTacticalOverlay && (
          <TacticalOverlay
            players={players}
            numbers={numbers}
            selectedPlayer={safeSelected < 11 ? safeSelected : 0}
            onSelectPlayer={setSelected}
            formation={formation}
            onChangeFormation={handleSelectFormation}
            positionPreset={positionPreset}
            onChangePositionPreset={handleSelectPositionPreset}
            playerRoles={playerRoles}
            onChangePlayerRole={handleSelectPlayerRole}
            positions={positions}
            onUpdatePosition={handleUpdateSinglePosition}
            onSwapPlayers={handleSwapPlayers}
            onResetPositions={handleResetPositions}
            tactic={tactic}
            onChangeTactic={setTactic}
            onClose={() => setShowTacticalOverlay(false)}
            onStartMatch={start}
          />
        )}
      </main>
    )

  return (
    <main className={`match-shell orientation-${orientation}`}>
      <section className="game-wrap">
        <canvas ref={canvasRef} aria-label="Playable 3D eleven versus eleven football match" />
        <header className="broadcast-bar">
          <button
            type="button"
            className="exit-match-pill"
            onClick={() => setScreen('setup')}
            aria-label="Exit game and return to squad setup"
            title="Exit Match to Squad Setup"
          >
            <ArrowLeft size={16} />
            <span>EXIT GAME</span>
          </button>
          <div className="live-score">
            <span className="live-team">MCI</span>
            <strong>{snapshot.home}</strong>
            <span className="live-clock">{formatClock(snapshot.secondsLeft, configRef.current.duration)}</span>
            <strong>{snapshot.away}</strong>
            <span className="live-team away">RIV</span>
          </div>
          <div className="broadcast-actions">
            <button
              type="button"
              className="round-control"
              onClick={() => {
                if (snapshot.status !== 'paused') gameRef.current?.pause()
                setShowTacticalOverlay(true)
              }}
              aria-label="Open tactical board"
              title="Tactical Board"
            >
              <Compass size={18} />
            </button>
            <button
              type="button"
              className="round-control orientation-toggle"
              onClick={() => setOrientation(o => (o === 'landscape' ? 'portrait' : 'landscape'))}
              aria-label={`Switch to ${orientation === 'landscape' ? 'portrait' : 'landscape'} mode`}
            >
              {orientation === 'landscape' ? <RectangleVertical size={18} /> : <RectangleHorizontal size={18} />}
            </button>
            <button
              type="button"
              className="round-control"
              onClick={() => gameRef.current?.toggleMute()}
              aria-label={snapshot.muted ? 'Unmute sound' : 'Mute sound'}
            >
              {snapshot.muted ? <VolumeX size={17} /> : <Volume2 size={17} />}
            </button>
            <button
              type="button"
              className="round-control"
              onClick={() => gameRef.current?.pause()}
              aria-label="Pause match"
              title="Pause Match"
            >
              {snapshot.status === 'paused' ? <Play size={17} /> : <Pause size={17} />}
            </button>
            <button
              type="button"
              className="round-control exit-icon-btn"
              onClick={() => setScreen('setup')}
              aria-label="Exit game"
              title="Exit Game"
            >
              <LogOut size={17} />
            </button>
          </div>
        </header>
        <div className="live-badge">
          <i /> LIVE <span>11 V 11</span>
          <b>
            {(configRef.current.formation ?? formation).toUpperCase()} ·{' '}
            {configRef.current.weather.toUpperCase()} · {configRef.current.tactic.toUpperCase()}
          </b>
        </div>
        {snapshot.notice && snapshot.status !== 'fulltime' && (
          <div className="game-notice">{snapshot.notice}</div>
        )}
        {snapshot.chargeKind && (
          <div className="power-meter">
            <span>
              {snapshot.chargeKind === 'lob' ? 'LONG BALL' : 'CROSS'} POWER{' '}
              <b>{Math.round(snapshot.charge * 100)}%</b>
            </span>
            <div>
              <i style={{ width: `${snapshot.charge * 100}%` }} />
            </div>
            <small>RELEASE TO KICK</small>
          </div>
        )}
        <div className="player-status">
          <button onClick={() => gameRef.current?.switchPlayer()} aria-label="Switch player">
            <span className="control-dot" /> {snapshot.controlled}
            <small>SWITCH</small>
          </button>
          <div className="stamina-track" aria-label={`Stamina ${Math.round(snapshot.stamina)} percent`}>
            <i style={{ width: `${snapshot.stamina}%` }} />
          </div>
        </div>
        <div className="desktop-match-help">
          <Gamepad2 size={15} /> WASD MOVE · SHIFT SPRINT · SPACE PASS · J SHOOT · HOLD V LONG BALL ·
          HOLD C CROSS · E SKILL · Q SWITCH
        </div>
        <div className="ball-tip">
          <Sparkles size={12} /> TAP BALL FOR DRIBBLE
        </div>
        <section className="touch-controls" aria-label="Touch match controls">
          <Joystick onChange={(x, y) => gameRef.current?.setJoystick(x, y)} />
          <div className="touch-actions">
            <button
              className="action-lob"
              onPointerDown={e => {
                e.preventDefault()
                e.currentTarget.setPointerCapture(e.pointerId)
                gameRef.current?.startCharge('lob')
              }}
              onPointerUp={chargeEnd}
              onPointerCancel={() => gameRef.current?.cancelCharge()}
            >
              LOB<small>HOLD</small>
            </button>
            <button
              className="action-cross"
              onPointerDown={e => {
                e.preventDefault()
                e.currentTarget.setPointerCapture(e.pointerId)
                gameRef.current?.startCharge('cross')
              }}
              onPointerUp={chargeEnd}
              onPointerCancel={() => gameRef.current?.cancelCharge()}
            >
              CROSS<small>HOLD</small>
            </button>
            <button
              className="action-shoot"
              onPointerDown={e => {
                e.preventDefault()
                gameRef.current?.shoot()
              }}
            >
              SHOOT
            </button>
            <button
              className="action-pass"
              onPointerDown={e => {
                e.preventDefault()
                gameRef.current?.pass()
              }}
            >
              PASS
            </button>
            <button
              className="action-skill"
              onPointerDown={e => {
                e.preventDefault()
                gameRef.current?.skill()
              }}
            >
              SKILL
            </button>
            <button
              className={`action-sprint ${sprintHeld || snapshot.sprinting ? 'is-held' : ''}`}
              onPointerDown={e => {
                e.preventDefault()
                e.currentTarget.setPointerCapture(e.pointerId)
                setSprintHeld(true)
                gameRef.current?.setSprint(true)
              }}
              onPointerUp={sprintEnd}
              onPointerCancel={sprintEnd}
            >
              SPRINT<small>HOLD</small>
            </button>
          </div>
        </section>
        {snapshot.status === 'paused' && !showTacticalOverlay && (
          <div className="match-overlay">
            <p>MATCH PAUSED</p>
            <h2>Take a breath.</h2>
            <button type="button" className="start-button" onClick={() => gameRef.current?.pause()}>
              <Play size={19} /> RESUME MATCH
            </button>
            <button
              type="button"
              className="tactical-prematch-button overlay-tactics-btn"
              onClick={() => setShowTacticalOverlay(true)}
            >
              <Compass size={17} /> TACTICAL BOARD ({formation})
            </button>
            <button
              type="button"
              className="exit-overlay-btn"
              onClick={() => setScreen('setup')}
            >
              <LogOut size={16} /> EXIT GAME TO SETUP
            </button>
          </div>
        )}
        {snapshot.status === 'fulltime' && (
          <PostMatchHighlights
            snapshot={snapshot}
            formation={currentFormationDef.name}
            onPlayAgain={restart}
            onReturnSetup={() => setScreen('setup')}
          />
        )}
        {showTacticalOverlay && (
          <TacticalOverlay
            players={players}
            numbers={numbers}
            selectedPlayer={selected}
            onSelectPlayer={setSelected}
            formation={formation}
            onChangeFormation={handleSelectFormation}
            positionPreset={positionPreset}
            onChangePositionPreset={handleSelectPositionPreset}
            playerRoles={playerRoles}
            onChangePlayerRole={handleSelectPlayerRole}
            positions={positions}
            onUpdatePosition={handleUpdateSinglePosition}
            onSwapPlayers={handleSwapPlayers}
            onResetPositions={handleResetPositions}
            tactic={tactic}
            onChangeTactic={setTactic}
            onClose={() => setShowTacticalOverlay(false)}
            onStartMatch={applyTacticsInMatch}
            isInMatch
          />
        )}
      </section>
    </main>
  )
}

function Joystick({ onChange }: { onChange: (x: number, y: number) => void }) {
  const ref = useRef<HTMLDivElement>(null)
  const active = useRef<number | null>(null)
  const [knob, setKnob] = useState({ x: 0, y: 0 })
  const move = (e: React.PointerEvent) => {
    if (!ref.current || active.current !== e.pointerId) return
    const r = ref.current.getBoundingClientRect()
    let x = e.clientX - (r.left + r.width / 2)
    let y = e.clientY - (r.top + r.height / 2)
    const max = r.width * 0.31
    const len = Math.hypot(x, y)
    if (len > max) {
      x = (x / len) * max
      y = (y / len) * max
    }
    setKnob({ x, y })
    onChange(x / max, y / max)
  }
  const end = (e: React.PointerEvent) => {
    active.current = null
    try {
      e.currentTarget.releasePointerCapture(e.pointerId)
    } catch {
      /* already released */
    }
    setKnob({ x: 0, y: 0 })
    onChange(0, 0)
  }
  return (
    <div
      ref={ref}
      className="joystick"
      aria-label="Movement joystick"
      onPointerDown={e => {
        e.preventDefault()
        active.current = e.pointerId
        e.currentTarget.setPointerCapture(e.pointerId)
        move(e)
      }}
      onPointerMove={move}
      onPointerUp={end}
      onPointerCancel={end}
    >
      <div className="joystick-arrows">◆</div>
      <div className="joystick-knob" style={{ transform: `translate(${knob.x}px, ${knob.y}px)` }} />
    </div>
  )
}
