import { useState } from 'react'
import { Award, Crosshair, Flame, RotateCcw, Shield, Sparkles, Trophy, Users } from 'lucide-react'
import type { Snapshot } from '../game/engine'
import type { HighlightEvent, HighlightKind } from '../game/highlights'
import { PITCH_H, PITCH_W } from '../game/tactics'

interface PostMatchHighlightsProps {
  snapshot: Snapshot
  formation: string
  onPlayAgain: () => void
  onReturnSetup: () => void
}

type FilterMode = 'all' | 'goal' | 'shot-save' | 'dribble'

export function PostMatchHighlights({
  snapshot,
  formation,
  onPlayAgain,
  onReturnSetup,
}: PostMatchHighlightsProps) {
  const [filter, setFilter] = useState<FilterMode>('all')
  const [selectedId, setSelectedId] = useState<string | null>(
    snapshot.highlights[snapshot.highlights.length - 1]?.id ?? null
  )

  const highlights = snapshot.highlights
  const filtered = highlights.filter(h => {
    if (filter === 'all') return true
    if (filter === 'goal') return h.kind === 'goal'
    if (filter === 'shot-save') return h.kind === 'shot' || h.kind === 'save'
    if (filter === 'dribble') return h.kind === 'dribble'
    return true
  })

  const activeHighlight: HighlightEvent | undefined =
    filtered.find(h => h.id === selectedId) ?? filtered[filtered.length - 1] ?? highlights[highlights.length - 1]

  // Compute Man of the Match from highlight contributions
  const playerScores = new Map<string, { name: string; number: number; team: 0 | 1; pts: number; goals: number; dribbles: number; shots: number }>()
  for (const h of highlights) {
    const key = `${h.team}-${h.playerName}`
    const cur = playerScores.get(key) ?? {
      name: h.playerName,
      number: h.playerNumber,
      team: h.team,
      pts: 0,
      goals: 0,
      dribbles: 0,
      shots: 0,
    }
    if (h.kind === 'goal') {
      cur.pts += 5
      cur.goals++
    } else if (h.kind === 'shot') {
      cur.pts += 2
      cur.shots++
    } else if (h.kind === 'dribble') {
      cur.pts += 2
      cur.dribbles++
    } else if (h.kind === 'save') {
      cur.pts += 3
    }
    playerScores.set(key, cur)
  }

  const topPerformer = [...playerScores.values()].sort((a, b) => b.pts - a.pts)[0] ?? {
    name: snapshot.controlled || 'Alex',
    number: 9,
    team: 0 as const,
    pts: 6,
    goals: snapshot.home,
    dribbles: snapshot.stats.homeDribbles,
    shots: snapshot.stats.homeShots,
  }

  const kindLabel = (k: HighlightKind) => {
    switch (k) {
      case 'goal':
        return 'GOAL'
      case 'shot':
        return 'SHOT'
      case 'save':
        return 'SAVE'
      case 'dribble':
        return 'DRIBBLE'
    }
  }

  return (
    <div className="match-overlay fulltime highlights-overlay" role="dialog" aria-label="Post-match highlights summary">
      <div className="highlights-shell">
        {/* Top Broadcast Banner */}
        <header className="highlights-header">
          <div className="highlights-header-title">
            <span className="highlights-kicker">FULL TIME · POST-MATCH HIGHLIGHTS &amp; ANALYTICS</span>
            <h2>
              {snapshot.home > snapshot.away
                ? 'Victory is yours.'
                : snapshot.home < snapshot.away
                ? 'Run it back.'
                : 'Honours even.'}
            </h2>
          </div>

          <div className="highlights-scoreboard">
            <div className="hl-team-badge home">
              <span>MCI</span>
              <small>{formation}</small>
            </div>
            <div className="hl-score-digits">
              <strong>{snapshot.home}</strong>
              <span>—</span>
              <strong>{snapshot.away}</strong>
            </div>
            <div className="hl-team-badge away">
              <span>RIV</span>
              <small>4–3–3</small>
            </div>
          </div>

          <div className="highlights-header-actions">
            <button type="button" className="start-button" onClick={onPlayAgain}>
              <RotateCcw size={17} />
              <span>PLAY AGAIN</span>
            </button>
            <button type="button" className="hl-secondary-btn" onClick={onReturnSetup}>
              <Users size={16} />
              <span>Squad &amp; Setup</span>
            </button>
          </div>
        </header>

        {/* Main 2-Column Content */}
        <div className="highlights-grid">
          {/* Left: Pitch Key Moment Map & Match Stats */}
          <section className="highlights-pitch-col">
            <div className="hl-panel-header">
              <span>KEY MOMENTS PITCH MAP (GOALS, SHOTS &amp; DRIBBLES)</span>
              <span>{highlights.length} RECORDED EVENTS</span>
            </div>

            <div className="hl-pitch-map">
              <svg viewBox={`0 0 ${PITCH_W} ${PITCH_H}`} preserveAspectRatio="none" className="hl-pitch-svg">
                <rect x={24} y={24} width={PITCH_W - 48} height={PITCH_H - 48} fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth="2.5" />
                <line x1={PITCH_W / 2} y1={24} x2={PITCH_W / 2} y2={PITCH_H - 24} stroke="rgba(255,255,255,0.35)" strokeWidth="2" />
                <circle cx={PITCH_W / 2} cy={PITCH_H / 2} r={88} fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth="2" />
                <rect x={24} y={155} width={185} height={390} fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth="2" />
                <rect x={PITCH_W - 209} y={155} width={185} height={390} fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth="2" />

                {/* Trajectory vectors for filtered moments */}
                {filtered.map(ev => {
                  if (ev.targetX === undefined || ev.targetY === undefined) return null
                  const isActive = activeHighlight?.id === ev.id
                  const strokeColor =
                    ev.kind === 'goal'
                      ? '#dfff57'
                      : ev.kind === 'dribble'
                      ? '#38bdf8'
                      : 'rgba(255, 180, 70, 0.75)'
                  return (
                    <line
                      key={`vec-${ev.id}`}
                      x1={ev.x}
                      y1={ev.y}
                      x2={ev.targetX}
                      y2={ev.targetY}
                      stroke={strokeColor}
                      strokeWidth={isActive ? 4 : 2}
                      strokeDasharray={ev.kind === 'dribble' ? '6 4' : undefined}
                      opacity={isActive ? 1 : 0.45}
                    />
                  )
                })}
              </svg>

              {/* Event Nodes */}
              {filtered.map(ev => {
                const isActive = activeHighlight?.id === ev.id
                return (
                  <button
                    key={ev.id}
                    type="button"
                    className={`hl-pitch-node kind-${ev.kind} ${isActive ? 'active' : ''}`}
                    style={{
                      left: `${(ev.x / PITCH_W) * 100}%`,
                      top: `${(ev.y / PITCH_H) * 100}%`,
                    }}
                    onClick={() => setSelectedId(ev.id)}
                    title={`${ev.clockLabel} · ${ev.title}`}
                  >
                    <span>{ev.minute}&prime;</span>
                  </button>
                )
              })}

              {activeHighlight && (
                <div className="hl-selected-callout">
                  <span className={`hl-kind-tag kind-${activeHighlight.kind}`}>{kindLabel(activeHighlight.kind)}</span>
                  <strong>{activeHighlight.clockLabel} · {activeHighlight.title}</strong>
                  <span>{activeHighlight.detail}</span>
                </div>
              )}
            </div>

            {/* Stats & Man of the Match Row */}
            <div className="hl-stats-row">
              <div className="hl-stat-box">
                <span>GOALS</span>
                <strong>{snapshot.home} · {snapshot.away}</strong>
                <small>MCI vs RIV</small>
              </div>
              <div className="hl-stat-box">
                <span>SHOTS</span>
                <strong>{snapshot.stats.homeShots} · {snapshot.stats.awayShots}</strong>
                <small>Attempts at Goal</small>
              </div>
              <div className="hl-stat-box">
                <span>DRIBBLES</span>
                <strong>{snapshot.stats.homeDribbles}</strong>
                <small>Skill Moves Completed</small>
              </div>
              <div className="hl-stat-box">
                <span>KEEPER SAVES</span>
                <strong>{snapshot.stats.homeSaves} · {snapshot.stats.awaySaves}</strong>
                <small>Stops &amp; Parries</small>
              </div>
              <div className="hl-stat-box motm-box">
                <span><Award size={12} /> MAN OF THE MATCH</span>
                <strong>#{topPerformer.number} {topPerformer.name}</strong>
                <small>{topPerformer.goals}G · {topPerformer.shots} Shots · {topPerformer.dribbles} Skills</small>
              </div>
            </div>
          </section>

          {/* Right: Chronological Key Moments Feed */}
          <aside className="highlights-feed-col">
            <div className="hl-filter-tabs" role="tablist" aria-label="Filter match highlights">
              <button
                type="button"
                className={filter === 'all' ? 'active' : ''}
                onClick={() => setFilter('all')}
              >
                All ({highlights.length})
              </button>
              <button
                type="button"
                className={filter === 'goal' ? 'active' : ''}
                onClick={() => setFilter('goal')}
              >
                Goals ({highlights.filter(h => h.kind === 'goal').length})
              </button>
              <button
                type="button"
                className={filter === 'shot-save' ? 'active' : ''}
                onClick={() => setFilter('shot-save')}
              >
                Shots &amp; Saves ({highlights.filter(h => h.kind === 'shot' || h.kind === 'save').length})
              </button>
              <button
                type="button"
                className={filter === 'dribble' ? 'active' : ''}
                onClick={() => setFilter('dribble')}
              >
                Dribbles ({highlights.filter(h => h.kind === 'dribble').length})
              </button>
            </div>

            <div className="hl-timeline-list">
              {filtered.length === 0 ? (
                <div className="hl-empty-state">
                  <Flame size={22} />
                  <p>No moments recorded in this category during the match.</p>
                </div>
              ) : (
                filtered.map(item => {
                  const isSelected = activeHighlight?.id === item.id
                  return (
                    <button
                      key={item.id}
                      type="button"
                      className={`hl-timeline-card ${isSelected ? 'active' : ''}`}
                      onClick={() => setSelectedId(item.id)}
                    >
                      <div className="hl-card-minute">
                        <strong>{item.minute}&prime;</strong>
                        <small>{item.clockLabel}</small>
                      </div>
                      <div className="hl-card-body">
                        <div className="hl-card-top">
                          <span className={`hl-kind-tag kind-${item.kind}`}>
                            {item.kind === 'goal' && <Trophy size={11} />}
                            {item.kind === 'shot' && <Crosshair size={11} />}
                            {item.kind === 'save' && <Shield size={11} />}
                            {item.kind === 'dribble' && <Sparkles size={11} />}
                            {kindLabel(item.kind)}
                          </span>
                          <span className="hl-card-team">
                            {item.team === 0 ? 'MCI' : 'RIV'} · #{item.playerNumber} {item.playerName}
                          </span>
                        </div>
                        <strong>{item.title}</strong>
                        <p>{item.detail}</p>
                      </div>
                    </button>
                  )
                })
              )}
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}
