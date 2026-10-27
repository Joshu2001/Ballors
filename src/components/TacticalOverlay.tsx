import React, { useRef, useState } from 'react'
import { ArrowLeft, ArrowLeftRight, ChevronRight, Compass, Eye, GitBranch, Move, RotateCcw, Shield, Sliders, Users, Zap } from 'lucide-react'
import { type PlayerConfig, type TacticType } from '../game/engine'
import {
  FORMATIONS,
  PITCH_H,
  PITCH_W,
  PLAYER_ROLE_PRESETS,
  POSITION_PRESETS,
  computeTacticalMetrics,
  getFormation,
  type FormationId,
  type PlayerRoleOffsetId,
  type PositionPresetId,
} from '../game/tactics'

interface TacticalOverlayProps {
  players: PlayerConfig[]
  numbers: number[]
  selectedPlayer: number
  onSelectPlayer: (index: number) => void
  formation: FormationId
  onChangeFormation: (formation: FormationId) => void
  positionPreset: PositionPresetId
  onChangePositionPreset: (preset: PositionPresetId) => void
  playerRoles: PlayerRoleOffsetId[]
  onChangePlayerRole: (playerIndex: number, role: PlayerRoleOffsetId) => void
  positions: [number, number][]
  onUpdatePosition: (playerIndex: number, x: number, y: number) => void
  onSwapPlayers: (indexA: number, indexB: number) => void
  onResetPositions: () => void
  tactic: TacticType
  onChangeTactic: (tactic: TacticType) => void
  onClose: () => void
  onStartMatch: () => void
  isInMatch?: boolean
}

const AWAY_GHOST_POSITIONS: [number, number][] = [
  [1200 - 72, 350],
  [1200 - 300, 105],
  [1200 - 285, 255],
  [1200 - 285, 445],
  [1200 - 300, 595],
  [1200 - 500, 190],
  [1200 - 520, 350],
  [1200 - 500, 510],
  [1200 - 770, 150],
  [1200 - 800, 350],
  [1200 - 770, 550],
]

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v))

export function TacticalOverlay({
  players,
  numbers,
  selectedPlayer,
  onSelectPlayer,
  formation,
  onChangeFormation,
  positionPreset,
  onChangePositionPreset,
  playerRoles,
  onChangePlayerRole,
  positions,
  onUpdatePosition,
  onSwapPlayers,
  onResetPositions,
  tactic,
  onChangeTactic,
  onClose,
  onStartMatch,
  isInMatch = false,
}: TacticalOverlayProps) {
  const pitchRef = useRef<HTMLDivElement>(null)
  const [draggingIdx, setDraggingIdx] = useState<number | null>(null)
  const [swapMode, setSwapMode] = useState(false)
  const [showOpposition, setShowOpposition] = useState(true)
  const [showPassingLinks, setShowPassingLinks] = useState(true)

  const currentFormation = getFormation(formation)
  const currentPreset = POSITION_PRESETS.find(p => p.id === positionPreset) ?? POSITION_PRESETS[0]
  const metrics = computeTacticalMetrics(positions)

  const handlePointerDownToken = (e: React.PointerEvent<HTMLButtonElement>, idx: number) => {
    e.stopPropagation()
    if (swapMode) {
      if (idx !== selectedPlayer) {
        onSwapPlayers(selectedPlayer, idx)
      }
      setSwapMode(false)
      onSelectPlayer(idx)
      return
    }
    onSelectPlayer(idx)
    e.currentTarget.setPointerCapture(e.pointerId)
    setDraggingIdx(idx)
  }

  const handlePointerMoveToken = (e: React.PointerEvent<HTMLButtonElement>, idx: number) => {
    if (draggingIdx !== idx || !pitchRef.current) return
    const rect = pitchRef.current.getBoundingClientRect()
    const rawX = ((e.clientX - rect.left) / rect.width) * PITCH_W
    const rawY = ((e.clientY - rect.top) / rect.height) * PITCH_H

    if (idx === 0) {
      // Keeper stays inside penalty area
      onUpdatePosition(0, Math.round(clamp(rawX, 48, 165)), Math.round(clamp(rawY, 220, 480)))
    } else {
      onUpdatePosition(
        idx,
        Math.round(clamp(rawX, 145, 1020)),
        Math.round(clamp(rawY, 55, PITCH_H - 55))
      )
    }
  }

  const handlePointerUpToken = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (draggingIdx !== null) {
      try {
        e.currentTarget.releasePointerCapture(e.pointerId)
      } catch {
        // already released
      }
      setDraggingIdx(null)
    }
  }

  // Build tactical links between nearby outfield players for visual structure
  const links: [number, number][] = []
  if (showPassingLinks) {
    for (let i = 1; i < positions.length; i++) {
      const dists: { idx: number; d: number }[] = []
      for (let j = 1; j < positions.length; j++) {
        if (i === j) continue
        const d = Math.hypot(positions[i][0] - positions[j][0], positions[i][1] - positions[j][1])
        if (d < 340) dists.push({ idx: j, d })
      }
      dists.sort((a, b) => a.d - b.d)
      for (const item of dists.slice(0, 2)) {
        if (i < item.idx || !links.some(([a, b]) => (a === item.idx && b === i) || (a === i && b === item.idx))) {
          links.push([i, item.idx])
        }
      }
    }
  }

  const selectedSlot = currentFormation.slots[selectedPlayer] ?? { role: 'PLY', x: 500, y: 350 }
  const selectedPlayerConfig = players[selectedPlayer]
  const selectedRoleOffset = playerRoles[selectedPlayer] ?? 'default'

  return (
    <div className="tactical-modal-backdrop" role="dialog" aria-modal="true" aria-label="Tactical formation and player positioning overlay">
      <div className="tactical-overlay-shell">
        <header className="tactical-header">
          <div className="tactical-header-left">
            <button type="button" className="tactical-back-btn" onClick={onClose}>
              <ArrowLeft size={16} />
              <span>{isInMatch ? 'Back to Match' : 'Squad Setup'}</span>
            </button>
            <div className="tactical-title-group">
              <span className="tactical-kicker">MATCHDAY TACTICAL LAB</span>
              <h2>FORMATION &amp; POSITIONING BOARD</h2>
            </div>
          </div>

          <div className="tactical-header-summary">
            <span>{currentFormation.name}</span>
            <span aria-hidden="true">·</span>
            <span>{currentPreset.name}</span>
            <span aria-hidden="true">·</span>
            <span>{tactic.toUpperCase()} MENTALITY</span>
          </div>

          <div className="tactical-header-actions">
            <button type="button" className="tactical-reset-btn" onClick={onResetPositions}>
              <RotateCcw size={15} />
              <span>Reset Shape</span>
            </button>
            <button type="button" className="tactical-confirm-btn" onClick={onStartMatch}>
              <span>{isInMatch ? 'APPLY & RESUME' : 'KICK OFF MATCH'}</span>
              <ChevronRight size={18} />
            </button>
          </div>
        </header>

        <div className="tactical-body-grid">
          {/* Interactive Pitch Column */}
          <section className="tactical-pitch-column">
            <div className="tactical-pitch-toolbar">
              <div className="pitch-toolbar-hint">
                <Move size={14} />
                <span>Drag players on the pitch to customize anchor zones or select a preset</span>
              </div>
              <div className="pitch-toolbar-toggles">
                <button
                  type="button"
                  className={showPassingLinks ? 'active' : ''}
                  onClick={() => setShowPassingLinks(v => !v)}
                >
                  <GitBranch size={13} />
                  <span>Passing Web</span>
                </button>
                <button
                  type="button"
                  className={showOpposition ? 'active' : ''}
                  onClick={() => setShowOpposition(v => !v)}
                >
                  <Eye size={13} />
                  <span>Rival 11</span>
                </button>
                <button
                  type="button"
                  className={swapMode ? 'active swap-active' : ''}
                  onClick={() => setSwapMode(v => !v)}
                >
                  <ArrowLeftRight size={13} />
                  <span>{swapMode ? 'Click Player to Swap' : 'Swap Players'}</span>
                </button>
              </div>
            </div>

            <div className="tactical-pitch-board" ref={pitchRef}>
              <svg
                className="tactical-pitch-svg"
                viewBox={`0 0 ${PITCH_W} ${PITCH_H}`}
                preserveAspectRatio="none"
                aria-hidden="true"
              >
                {/* Turf stripes */}
                {Array.from({ length: 12 }).map((_, idx) => (
                  <rect
                    key={idx}
                    x={idx * 100}
                    y={0}
                    width={100}
                    height={PITCH_H}
                    fill={idx % 2 === 0 ? 'rgba(255,255,255,0.025)' : 'rgba(0,0,0,0.03)'}
                  />
                ))}

                {/* Tactical third & half-space guide lines */}
                <line x1={400} y1={24} x2={400} y2={PITCH_H - 24} stroke="rgba(223,255,87,0.16)" strokeDasharray="6 6" strokeWidth="1.5" />
                <line x1={800} y1={24} x2={800} y2={PITCH_H - 24} stroke="rgba(223,255,87,0.16)" strokeDasharray="6 6" strokeWidth="1.5" />
                <line x1={24} y1={210} x2={PITCH_W - 24} y2={210} stroke="rgba(255,255,255,0.07)" strokeDasharray="4 8" strokeWidth="1.2" />
                <line x1={24} y1={490} x2={PITCH_W - 24} y2={490} stroke="rgba(255,255,255,0.07)" strokeDasharray="4 8" strokeWidth="1.2" />

                {/* Pitch outer boundary */}
                <rect x={24} y={24} width={PITCH_W - 48} height={PITCH_H - 48} fill="none" stroke="rgba(255,255,255,0.45)" strokeWidth="2.5" />
                {/* Halfway line & center circle */}
                <line x1={PITCH_W / 2} y1={24} x2={PITCH_W / 2} y2={PITCH_H - 24} stroke="rgba(255,255,255,0.45)" strokeWidth="2" />
                <circle cx={PITCH_W / 2} cy={PITCH_H / 2} r={88} fill="none" stroke="rgba(255,255,255,0.45)" strokeWidth="2" />
                <circle cx={PITCH_W / 2} cy={PITCH_H / 2} r={4} fill="rgba(255,255,255,0.65)" />

                {/* Home penalty box & 6-yard box */}
                <rect x={24} y={155} width={185} height={390} fill="none" stroke="rgba(255,255,255,0.45)" strokeWidth="2" />
                <rect x={24} y={250} width={68} height={200} fill="none" stroke="rgba(255,255,255,0.45)" strokeWidth="2" />
                <circle cx={148} cy={PITCH_H / 2} r={3.5} fill="rgba(255,255,255,0.55)" />

                {/* Away penalty box & 6-yard box */}
                <rect x={PITCH_W - 209} y={155} width={185} height={390} fill="none" stroke="rgba(255,255,255,0.45)" strokeWidth="2" />
                <rect x={PITCH_W - 92} y={250} width={68} height={200} fill="none" stroke="rgba(255,255,255,0.45)" strokeWidth="2" />
                <circle cx={PITCH_W - 148} cy={PITCH_H / 2} r={3.5} fill="rgba(255,255,255,0.55)" />

                {/* Defensive Line Indicator */}
                {positions.length > 1 && (() => {
                  const minOutfieldX = Math.min(...positions.slice(1).map(p => p[0]))
                  return (
                    <g>
                      <line
                        x1={minOutfieldX}
                        y1={28}
                        x2={minOutfieldX}
                        y2={PITCH_H - 28}
                        stroke="rgba(223,255,87,0.48)"
                        strokeDasharray="4 4"
                        strokeWidth="2"
                      />
                    </g>
                  )
                })()}

                {/* Passing network links */}
                {links.map(([a, b], i) => (
                  <line
                    key={i}
                    x1={positions[a][0]}
                    y1={positions[a][1]}
                    x2={positions[b][0]}
                    y2={positions[b][1]}
                    stroke="rgba(223, 255, 87, 0.28)"
                    strokeWidth="2.2"
                  />
                ))}
              </svg>

              {/* Zone Labels */}
              <div className="pitch-zone-labels" aria-hidden="true">
                <span>DEFENSIVE THIRD</span>
                <span>MIDFIELD ZONE</span>
                <span>ATTACKING THIRD →</span>
              </div>

              {/* Rival Ghost Markers */}
              {showOpposition &&
                AWAY_GHOST_POSITIONS.map((pos, idx) => (
                  <div
                    key={`opp-${idx}`}
                    className="tactical-ghost-token"
                    style={{
                      left: `${(pos[0] / PITCH_W) * 100}%`,
                      top: `${(pos[1] / PITCH_H) * 100}%`,
                    }}
                    title={`Rival #${numbers[idx]}`}
                  >
                    <span>{numbers[idx]}</span>
                  </div>
                ))}

              {/* Interactive Home Player Tokens */}
              {positions.map((pos, idx) => {
                const slot = currentFormation.slots[idx] ?? { role: 'PLY', x: pos[0], y: pos[1] }
                const player = players[idx]
                const rolePreset = playerRoles[idx] ?? 'default'
                const isSelected = selectedPlayer === idx
                const isDragging = draggingIdx === idx

                return (
                  <button
                    key={idx}
                    type="button"
                    className={`tactical-player-token ${idx === 0 ? 'is-keeper' : ''} ${isSelected ? 'is-selected' : ''} ${isDragging ? 'is-dragging' : ''} ${swapMode && !isSelected ? 'is-swap-target' : ''}`}
                    style={{
                      left: `${(pos[0] / PITCH_W) * 100}%`,
                      top: `${(pos[1] / PITCH_H) * 100}%`,
                    }}
                    onPointerDown={e => handlePointerDownToken(e, idx)}
                    onPointerMove={e => handlePointerMoveToken(e, idx)}
                    onPointerUp={handlePointerUpToken}
                    onPointerCancel={handlePointerUpToken}
                    aria-label={`${slot.role} ${player.name}, number ${numbers[idx]}`}
                  >
                    <span className="token-role-tag">{slot.role}</span>
                    <span className="token-circle">
                      <strong>{numbers[idx]}</strong>
                    </span>
                    <span className="token-name">
                      {player.name || `P${idx + 1}`}
                      {rolePreset !== 'default' && <i className="token-role-indicator" />}
                    </span>
                  </button>
                )
              })}
            </div>

            {/* Tactical Metrics Strip */}
            <div className="tactical-metrics-bar">
              <div className="tactical-metric-item">
                <span>DEFENSIVE LINE</span>
                <strong>{metrics.lineHeightMeters}m</strong>
                <small>{metrics.lineHeightMeters >= 38 ? 'High Press Line' : metrics.lineHeightMeters <= 25 ? 'Deep Box Block' : 'Balanced Line'}</small>
              </div>
              <div className="tactical-metric-item">
                <span>TEAM WIDTH</span>
                <strong>{metrics.widthPercent}%</strong>
                <small>{metrics.widthPercent >= 82 ? 'Touchline Stretch' : metrics.widthPercent <= 64 ? 'Compact Narrow' : 'Standard Channels'}</small>
              </div>
              <div className="tactical-metric-item">
                <span>COMPACTNESS</span>
                <strong>{metrics.compactness}%</strong>
                <small>Vertical Unit Cohesion</small>
              </div>
              <div className="tactical-metric-item">
                <span>ATTACKING BIAS</span>
                <strong>{metrics.attackingPresence}%</strong>
                <small>Forward Territory Occupation</small>
              </div>
            </div>

            {/* Substitutes Bench (Players 12, 13, and User-Scanned Players) */}
            {players.length > 11 && (
              <div className="tactical-bench-strip">
                <div className="tactical-bench-label">
                  <Users size={13} />
                  <span>SUBSTITUTE BENCH ({players.length - 11}) · CLICK TO SWAP WITH SELECTED STARTER</span>
                </div>
                <div className="tactical-bench-list">
                  {players.slice(11).map((benchPlayer, offset) => {
                    const benchIdx = 11 + offset
                    const num = numbers[benchIdx] ?? benchIdx + 1
                    const isBenchSelected = selectedPlayer === benchIdx
                    return (
                      <button
                        key={benchIdx}
                        type="button"
                        className={`tactical-bench-chip ${isBenchSelected ? 'active' : ''}`}
                        onClick={() => {
                          if (selectedPlayer < 11) {
                            onSwapPlayers(selectedPlayer, benchIdx)
                          } else {
                            onSelectPlayer(benchIdx)
                          }
                        }}
                        title={
                          selectedPlayer < 11
                            ? `Swap #${num} ${benchPlayer.name} into Starting XI for #${numbers[selectedPlayer]} ${players[selectedPlayer]?.name}`
                            : `Select #${num} ${benchPlayer.name}`
                        }
                      >
                        <span className="bench-chip-num">#{num}</span>
                        <strong>{benchPlayer.name || `Sub ${offset + 1}`}</strong>
                        <small>{benchPlayer.iq ?? 88} IQ · SUB IN</small>
                      </button>
                    )
                  })}
                </div>
              </div>
            )}
          </section>

          {/* Controls & Presets Sidebar */}
          <aside className="tactical-controls-sidebar">
            {/* 1. Formation Selector */}
            <section className="tactical-panel-block">
              <div className="tactical-panel-heading">
                <div>
                  <Compass size={16} />
                  <h3>1. Team Formation</h3>
                </div>
                <span>{currentFormation.tagline}</span>
              </div>
              <div className="formation-grid">
                {FORMATIONS.map(f => (
                  <button
                    key={f.id}
                    type="button"
                    className={`formation-card-btn ${formation === f.id ? 'active' : ''}`}
                    onClick={() => onChangeFormation(f.id)}
                  >
                    <strong>{f.name}</strong>
                    <small>{f.tagline}</small>
                  </button>
                ))}
              </div>
              <p className="tactical-formation-summary">{currentFormation.summary}</p>
            </section>

            {/* 2. Positioning Presets */}
            <section className="tactical-panel-block">
              <div className="tactical-panel-heading">
                <div>
                  <Sliders size={16} />
                  <h3>2. Positioning Presets</h3>
                </div>
                <span>TEAM SHAPE</span>
              </div>
              <div className="preset-grid">
                {POSITION_PRESETS.map(preset => (
                  <button
                    key={preset.id}
                    type="button"
                    className={`preset-card-btn ${positionPreset === preset.id ? 'active' : ''}`}
                    onClick={() => onChangePositionPreset(preset.id)}
                  >
                    <div className="preset-card-top">
                      <strong>{preset.name}</strong>
                      <span>{preset.badge}</span>
                    </div>
                    <small>{preset.description}</small>
                  </button>
                ))}
              </div>
            </section>

            {/* 3. Team Mentality */}
            <section className="tactical-panel-block">
              <div className="tactical-panel-heading">
                <div>
                  <Zap size={16} />
                  <h3>3. In-Match Mentality</h3>
                </div>
                <span>AI AGGRESSION</span>
              </div>
              <div className="option-trio tactic-options">
                {(['defensive', 'balanced', 'offensive'] as TacticType[]).map(t => (
                  <button
                    key={t}
                    type="button"
                    className={tactic === t ? 'active' : ''}
                    onClick={() => onChangeTactic(t)}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </section>

            {/* 4. Selected Player Individual Positioning Preset */}
            <section className="tactical-panel-block player-role-inspector">
              <div className="tactical-panel-heading">
                <div>
                  <Users size={16} />
                  <h3>
                    #{numbers[selectedPlayer]} {selectedPlayerConfig?.name || `Player ${selectedPlayer + 1}`} · {selectedSlot.role}
                  </h3>
                </div>
                <span>PLAYER INSTRUCTION</span>
              </div>
              {selectedPlayer === 0 ? (
                <p className="keeper-role-note">
                  <Shield size={14} /> Goalkeeper positioning scales automatically with your defensive line and sweeper-keeper distance.
                </p>
              ) : (
                <>
                  <div className="player-role-buttons">
                    {PLAYER_ROLE_PRESETS.map(rp => (
                      <button
                        key={rp.id}
                        type="button"
                        className={selectedRoleOffset === rp.id ? 'active' : ''}
                        onClick={() => onChangePlayerRole(selectedPlayer, rp.id)}
                      >
                        <strong>{rp.shortLabel}</strong>
                        <small>{rp.name}</small>
                      </button>
                    ))}
                  </div>
                  <p className="player-role-detail">
                    {PLAYER_ROLE_PRESETS.find(r => r.id === selectedRoleOffset)?.detail} · Pitch Anchor ({positions[selectedPlayer]?.[0]}, {positions[selectedPlayer]?.[1]})
                  </p>
                </>
              )}
            </section>
          </aside>
        </div>
      </div>
    </div>
  )
}
