import { useEffect, useRef, useState } from 'react'
import { ArrowLeft, ChevronRight, Cloud, CloudRain, Gamepad2, Pause, Play, RectangleHorizontal, RectangleVertical, RotateCcw, Shield, Sparkles, Sun, Timer, Users, Volume2, VolumeX, Zap } from 'lucide-react'
import { FootballGame, type DribbleType, type MatchConfig, type PitchType, type PlayerConfig, type Snapshot, type TacticType, type WeatherType } from './game/engine'
import './App.css'

const initialPlayers: PlayerConfig[] = [
  { name: 'You', size: 104, power: 70, dribble: 'body-feint' },
  { name: 'Mateo', size: 96, power: 68, dribble: 'stop-go' },
  { name: 'Kai', size: 104, power: 76, dribble: 'roulette' },
  { name: 'Leo', size: 92, power: 82, dribble: 'stepover' },
  { name: 'Noah', size: 108, power: 88, dribble: 'body-feint' },
  { name: 'Luca', size: 98, power: 78, dribble: 'roulette' },
  { name: 'Eli', size: 94, power: 80, dribble: 'elastico' },
  { name: 'Theo', size: 101, power: 84, dribble: 'stepover' },
  { name: 'Milo', size: 91, power: 82, dribble: 'sombrero' },
  { name: 'Alex', size: 103, power: 91, dribble: 'stop-go' },
  { name: 'Finn', size: 93, power: 85, dribble: 'elastico' },
]
const numbers = [1, 2, 4, 5, 3, 6, 8, 10, 7, 9, 11]
const pitchInfo: { id: PitchType; name: string; detail: string }[] = [
  { id: 'grass', name: 'Classic grass', detail: 'Balanced bounce & pace' },
  { id: 'turf', name: 'Arena turf', detail: 'Quicker ball roll' },
  { id: 'street', name: 'Street court', detail: 'Heavy, technical play' },
]
const dribbles: { id: DribbleType; name: string }[] = [
  { id: 'roulette', name: 'Roulette' }, { id: 'stepover', name: 'Robinho stepover' },
  { id: 'sombrero', name: 'Sombrero' }, { id: 'stop-go', name: 'Stop & go' },
  { id: 'body-feint', name: 'Body feint' }, { id: 'elastico', name: 'Elastico' },
]
const formatClock = (seconds: number, duration: number) => {
  const elapsed = duration * 60 - seconds
  const matchMinutes = Math.min(90, Math.floor(elapsed / (duration * 60) * 90))
  const secs = Math.floor((elapsed / (duration * 60) * 90 * 60) % 60)
  return `${String(matchMinutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
}

export default function App() {
  const [screen, setScreen] = useState<'setup' | 'match'>('setup')
  const [players, setPlayers] = useState(initialPlayers)
  const [selected, setSelected] = useState(9)
  const [pitch, setPitch] = useState<PitchType>('grass')
  const [weather, setWeather] = useState<WeatherType>('clear')
  const [tactic, setTactic] = useState<TacticType>('balanced')
  const [orientation, setOrientation] = useState<'landscape' | 'portrait'>('landscape')
  const [duration, setDuration] = useState(2)
  const [sprintHeld, setSprintHeld] = useState(false)
  const [snapshot, setSnapshot] = useState<Snapshot>({ home: 0, away: 0, secondsLeft: 120, controlled: 'Alex', notice: 'KICK OFF', status: 'playing', stamina: 100, muted: false, charge: 0, chargeKind: null, sprinting: false })
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const gameRef = useRef<FootballGame | null>(null)
  const configRef = useRef<MatchConfig>({ players, pitch, duration, weather, tactic })
  const [matchKey, setMatchKey] = useState(0)

  useEffect(() => {
    if (screen !== 'match' || !canvasRef.current) return
    const game = new FootballGame(canvasRef.current, configRef.current, setSnapshot)
    gameRef.current = game
    return () => { game.destroy(); gameRef.current = null }
  }, [screen, matchKey])

  const updatePlayer = (patch: Partial<PlayerConfig>) => setPlayers(old => old.map((p, i) => i === selected ? { ...p, ...patch } : p))
  const start = () => {
    configRef.current = { players, pitch, duration, weather, tactic }
    setSnapshot(s => ({ ...s, home: 0, away: 0, secondsLeft: duration * 60, status: 'playing' }))
    setScreen('match')
  }
  const restart = () => { configRef.current = { players, pitch, duration, weather, tactic }; setMatchKey(k => k + 1) }
  const sprintEnd = () => { setSprintHeld(false); gameRef.current?.setSprint(false) }
  const chargeEnd = () => gameRef.current?.releaseCharge()

  if (screen === 'setup') return (
    <main className="setup-shell">
      <header className="topbar">
        <div className="brand"><span className="brand-mark">M</span><span>MATCHDAY<small>FOOTBALL LAB</small></span></div>
        <span className="mode-label">11 V 11 · QUICK PLAY</span>
      </header>
      <section className="setup-hero">
        <div><p className="overline">YOUR CLUB. YOUR RULES.</p><h1>OWN THE<br /><em>Match.</em></h1></div>
        <p>Build your eleven, choose your conditions,<br className="desktop-break" /> then play every minute your way.</p>
      </section>
      <div className="setup-grid">
        <section className="squad-section">
          <div className="section-heading"><div><Users size={19} /><h2>Your starting eleven</h2></div><span>4–3–3 · PLAYER 1 IS YOUR KEEPER</span></div>
          <div className="player-tabs" role="tablist" aria-label="Select player">
            {players.map((p, i) => <button key={i} role="tab" aria-selected={selected === i} className={selected === i ? 'active' : ''} onClick={() => setSelected(i)}><span>{numbers[i]}</span>{p.name || `Player ${i + 1}`}</button>)}
          </div>
          <div className="player-editor">
            <div className="editor-fields">
              <label className="name-field"><span>PLAYER NAME</span><input value={players[selected].name} maxLength={12} onChange={e => updatePlayer({ name: e.target.value })} placeholder={`Player ${selected + 1}`} /></label>
              <label className="range-field"><span><span>BODY SIZE</span><b>{players[selected].size}%</b></span><input type="range" min="75" max="135" value={players[selected].size} onChange={e => updatePlayer({ size: Number(e.target.value) })} /><small><span>AGILE</span><span>POWERFUL</span></small></label>
              <label className="range-field"><span><span>SHOT POWER</span><b>{players[selected].power}</b></span><input type="range" min="35" max="100" value={players[selected].power} onChange={e => updatePlayer({ power: Number(e.target.value) })} /><small><span>COMPOSED</span><span>ROCKET</span></small></label>
            </div>
            <div className={`player-avatar size-${Math.round(players[selected].size / 10)}`} style={{ '--avatar-scale': players[selected].size / 100 } as React.CSSProperties}><div className="avatar-head" /><div className="avatar-body">{numbers[selected]}</div><div className="avatar-legs" /></div>
            <div className="skill-picker"><span><Sparkles size={14} /> SIGNATURE DRIBBLE</span><div>{dribbles.map(d => <button key={d.id} className={players[selected].dribble === d.id ? 'active' : ''} onClick={() => updatePlayer({ dribble: d.id })}>{d.name}</button>)}</div><small>Tap the ball in a match or press SKILL / E to perform it.</small></div>
          </div>
        </section>
        <aside className="match-options">
          <section>
            <div className="section-heading"><div><Shield size={19} /><h2>The ground</h2></div></div>
            <div className="pitch-options">{pitchInfo.map(p => <button key={p.id} className={pitch === p.id ? `pitch-choice ${p.id} active` : `pitch-choice ${p.id}`} onClick={() => setPitch(p.id)}><span className="pitch-mini"><i /><i /><i /></span><span><b>{p.name}</b><small>{p.detail}</small></span><span className="radio-dot" /></button>)}</div>
          </section>
          <section>
            <div className="section-heading"><div><Sun size={18} /><h2>Weather</h2></div></div>
            <div className="option-trio weather-options">
              <button className={weather === 'clear' ? 'active' : ''} onClick={() => setWeather('clear')}><Sun size={17} /><span>Clear</span></button>
              <button className={weather === 'cloudy' ? 'active' : ''} onClick={() => setWeather('cloudy')}><Cloud size={17} /><span>Cloudy</span></button>
              <button className={weather === 'rain' ? 'active' : ''} onClick={() => setWeather('rain')}><CloudRain size={17} /><span>Rain</span></button>
            </div>
          </section>
          <section>
            <div className="section-heading"><div><Zap size={18} /><h2>Team mentality</h2></div></div>
            <div className="option-trio tactic-options">{(['defensive', 'balanced', 'offensive'] as TacticType[]).map(t => <button key={t} className={tactic === t ? 'active' : ''} onClick={() => setTactic(t)}>{t}</button>)}</div>
          </section>
          <section className="duration-section">
            <div className="section-heading"><div><Timer size={19} /><h2>Match length</h2></div></div>
            <div className="duration-options">{[2, 4, 6].map(d => <button key={d} className={duration === d ? 'active' : ''} onClick={() => setDuration(d)}><b>{d}</b><span>MIN</span></button>)}</div>
          </section>
          <button className="start-button" onClick={start}>START MATCH <ChevronRight size={22} /></button>
          <p className="setup-note">Landscape by default · Portrait toggle in match</p>
        </aside>
      </div>
    </main>
  )

  return (
    <main className={`match-shell orientation-${orientation}`}>
      <section className="game-wrap">
        <canvas ref={canvasRef} aria-label="Playable 3D eleven versus eleven football match" />
        <header className="broadcast-bar">
          <button className="round-control exit-control" onClick={() => { if (window.confirm('Leave this match and return to squad setup?')) setScreen('setup') }} aria-label="Exit match"><ArrowLeft size={18} /></button>
          <div className="live-score">
            <span className="live-team">MCI</span><strong>{snapshot.home}</strong><span className="live-clock">{formatClock(snapshot.secondsLeft, configRef.current.duration)}</span><strong>{snapshot.away}</strong><span className="live-team away">RIV</span>
          </div>
          <div className="broadcast-actions">
            <button className="round-control orientation-toggle" onClick={() => setOrientation(o => o === 'landscape' ? 'portrait' : 'landscape')} aria-label={`Switch to ${orientation === 'landscape' ? 'portrait' : 'landscape'} mode`}>{orientation === 'landscape' ? <RectangleVertical size={18} /> : <RectangleHorizontal size={18} />}</button>
            <button className="round-control" onClick={() => gameRef.current?.toggleMute()} aria-label={snapshot.muted ? 'Unmute sound' : 'Mute sound'}>{snapshot.muted ? <VolumeX size={17} /> : <Volume2 size={17} />}</button>
            <button className="round-control" onClick={() => gameRef.current?.pause()} aria-label="Pause match">{snapshot.status === 'paused' ? <Play size={17} /> : <Pause size={17} />}</button>
          </div>
        </header>
        <div className="live-badge"><i /> LIVE <span>11 V 11</span><b>{configRef.current.weather.toUpperCase()} · {configRef.current.tactic.toUpperCase()}</b></div>
        {snapshot.notice && snapshot.status !== 'fulltime' && <div className="game-notice">{snapshot.notice}</div>}
        {snapshot.chargeKind && <div className="power-meter"><span>{snapshot.chargeKind === 'lob' ? 'LONG BALL' : 'CROSS'} POWER <b>{Math.round(snapshot.charge * 100)}%</b></span><div><i style={{ width: `${snapshot.charge * 100}%` }} /></div><small>RELEASE TO KICK</small></div>}
        <div className="player-status">
          <button onClick={() => gameRef.current?.switchPlayer()} aria-label="Switch player"><span className="control-dot" /> {snapshot.controlled}<small>SWITCH</small></button>
          <div className="stamina-track" aria-label={`Stamina ${Math.round(snapshot.stamina)} percent`}><i style={{ width: `${snapshot.stamina}%` }} /></div>
        </div>
        <div className="desktop-match-help"><Gamepad2 size={15} /> WASD MOVE · SHIFT SPRINT · SPACE PASS · J SHOOT · HOLD V LONG BALL · HOLD C CROSS · E SKILL · Q SWITCH</div>
        <div className="ball-tip"><Sparkles size={12} /> TAP BALL FOR DRIBBLE</div>
        <section className="touch-controls" aria-label="Touch match controls">
          <Joystick onChange={(x, y) => gameRef.current?.setJoystick(x, y)} />
          <div className="touch-actions">
            <button className="action-lob" onPointerDown={e => { e.preventDefault(); e.currentTarget.setPointerCapture(e.pointerId); gameRef.current?.startCharge('lob') }} onPointerUp={chargeEnd} onPointerCancel={() => gameRef.current?.cancelCharge()}>LOB<small>HOLD</small></button>
            <button className="action-cross" onPointerDown={e => { e.preventDefault(); e.currentTarget.setPointerCapture(e.pointerId); gameRef.current?.startCharge('cross') }} onPointerUp={chargeEnd} onPointerCancel={() => gameRef.current?.cancelCharge()}>CROSS<small>HOLD</small></button>
            <button className="action-shoot" onPointerDown={e => { e.preventDefault(); gameRef.current?.shoot() }}>SHOOT</button>
            <button className="action-pass" onPointerDown={e => { e.preventDefault(); gameRef.current?.pass() }}>PASS</button>
            <button className="action-skill" onPointerDown={e => { e.preventDefault(); gameRef.current?.skill() }}>SKILL</button>
            <button className={`action-sprint ${sprintHeld || snapshot.sprinting ? 'is-held' : ''}`} onPointerDown={e => { e.preventDefault(); e.currentTarget.setPointerCapture(e.pointerId); setSprintHeld(true); gameRef.current?.setSprint(true) }} onPointerUp={sprintEnd} onPointerCancel={sprintEnd}>SPRINT<small>HOLD</small></button>
          </div>
        </section>
        {snapshot.status === 'paused' && <div className="match-overlay"><p>MATCH PAUSED</p><h2>Take a breath.</h2><button className="start-button" onClick={() => gameRef.current?.pause()}><Play size={19} /> RESUME</button><button className="text-button" onClick={() => setScreen('setup')}>Return to setup</button></div>}
        {snapshot.status === 'fulltime' && <div className="match-overlay fulltime"><p>FULL TIME</p><h2>{snapshot.home > snapshot.away ? 'Victory is yours.' : snapshot.home < snapshot.away ? 'Run it back.' : 'Honours even.'}</h2><div className="final-score">{snapshot.home}<span>—</span>{snapshot.away}</div><button className="start-button" onClick={restart}><RotateCcw size={18} /> PLAY AGAIN</button><button className="text-button" onClick={() => setScreen('setup')}>Edit squad &amp; settings</button></div>}
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
    let x = e.clientX - (r.left + r.width / 2), y = e.clientY - (r.top + r.height / 2)
    const max = r.width * .31, len = Math.hypot(x, y)
    if (len > max) { x = x / len * max; y = y / len * max }
    setKnob({ x, y }); onChange(x / max, y / max)
  }
  const end = (e: React.PointerEvent) => { active.current = null; try { e.currentTarget.releasePointerCapture(e.pointerId) } catch { /* already released */ } setKnob({ x: 0, y: 0 }); onChange(0, 0) }
  return <div ref={ref} className="joystick" aria-label="Movement joystick" onPointerDown={e => { e.preventDefault(); active.current = e.pointerId; e.currentTarget.setPointerCapture(e.pointerId); move(e) }} onPointerMove={move} onPointerUp={end} onPointerCancel={end}><div className="joystick-arrows">◆</div><div className="joystick-knob" style={{ transform: `translate(${knob.x}px, ${knob.y}px)` }} /></div>
}
