export type FormationId = '4-3-3' | '4-4-2' | '3-5-2' | '4-2-3-1' | '3-4-3' | '5-3-2'
export type PositionPresetId = 'standard' | 'high-press' | 'low-block' | 'wide-overload' | 'central-overload' | 'overlapping-fb'
export type PlayerRoleOffsetId = 'default' | 'stay-back' | 'join-attack' | 'stay-wide' | 'cut-inside'

export interface TacticalSlot {
  role: string
  x: number
  y: number
}

export interface FormationDefinition {
  id: FormationId
  name: string
  tagline: string
  summary: string
  slots: TacticalSlot[]
}

export interface PositionPresetDefinition {
  id: PositionPresetId
  name: string
  badge: string
  description: string
}

export interface PlayerRolePresetDefinition {
  id: PlayerRoleOffsetId
  name: string
  shortLabel: string
  detail: string
}

export const PITCH_W = 1200
export const PITCH_H = 700

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v))

export const FORMATIONS: FormationDefinition[] = [
  {
    id: '4-3-3',
    name: '4–3–3',
    tagline: 'Balanced Wing Play',
    summary: 'Three forwards press high while a triangle midfield controls possession.',
    slots: [
      { role: 'GK', x: 72, y: 350 },
      { role: 'RB', x: 300, y: 105 },
      { role: 'RCB', x: 285, y: 255 },
      { role: 'LCB', x: 285, y: 445 },
      { role: 'LB', x: 300, y: 595 },
      { role: 'RCM', x: 500, y: 190 },
      { role: 'CM', x: 520, y: 350 },
      { role: 'LCM', x: 500, y: 510 },
      { role: 'RW', x: 770, y: 150 },
      { role: 'ST', x: 800, y: 350 },
      { role: 'LW', x: 770, y: 550 },
    ],
  },
  {
    id: '4-4-2',
    name: '4–4–2',
    tagline: 'Classic Twin Strikers',
    summary: 'Two compact banks of four feeding a dual strike partnership in the box.',
    slots: [
      { role: 'GK', x: 72, y: 350 },
      { role: 'RB', x: 290, y: 105 },
      { role: 'RCB', x: 275, y: 260 },
      { role: 'LCB', x: 275, y: 440 },
      { role: 'LB', x: 290, y: 595 },
      { role: 'RM', x: 530, y: 115 },
      { role: 'RCM', x: 500, y: 270 },
      { role: 'LCM', x: 500, y: 430 },
      { role: 'LM', x: 530, y: 585 },
      { role: 'RS', x: 785, y: 255 },
      { role: 'LS', x: 785, y: 445 },
    ],
  },
  {
    id: '3-5-2',
    name: '3–5–2',
    tagline: 'Wing-Back Dominance',
    summary: 'Three center-backs protect the box while five midfielders flood the flanks and center.',
    slots: [
      { role: 'GK', x: 72, y: 350 },
      { role: 'RCB', x: 275, y: 185 },
      { role: 'CB', x: 260, y: 350 },
      { role: 'LCB', x: 275, y: 515 },
      { role: 'RWB', x: 525, y: 95 },
      { role: 'RCM', x: 515, y: 235 },
      { role: 'CDM', x: 445, y: 350 },
      { role: 'LCM', x: 515, y: 465 },
      { role: 'LWB', x: 525, y: 605 },
      { role: 'RS', x: 790, y: 255 },
      { role: 'LS', x: 790, y: 445 },
    ],
  },
  {
    id: '4-2-3-1',
    name: '4–2–3–1',
    tagline: 'Modern Double Pivot',
    summary: 'Two holding midfielders shield the back four while a central playmaker links the attack.',
    slots: [
      { role: 'GK', x: 72, y: 350 },
      { role: 'RB', x: 295, y: 105 },
      { role: 'RCB', x: 280, y: 260 },
      { role: 'LCB', x: 280, y: 440 },
      { role: 'LB', x: 295, y: 595 },
      { role: 'RDM', x: 455, y: 250 },
      { role: 'LDM', x: 455, y: 450 },
      { role: 'RAM', x: 645, y: 145 },
      { role: 'CAM', x: 650, y: 350 },
      { role: 'LAM', x: 645, y: 555 },
      { role: 'ST', x: 825, y: 350 },
    ],
  },
  {
    id: '3-4-3',
    name: '3–4–3',
    tagline: 'High Octane Front Three',
    summary: 'Aggressive verticality with four midfielders supporting a fluid three-man frontline.',
    slots: [
      { role: 'GK', x: 72, y: 350 },
      { role: 'RCB', x: 285, y: 185 },
      { role: 'CB', x: 268, y: 350 },
      { role: 'LCB', x: 285, y: 515 },
      { role: 'RM', x: 530, y: 105 },
      { role: 'RCM', x: 505, y: 270 },
      { role: 'LCM', x: 505, y: 430 },
      { role: 'LM', x: 530, y: 595 },
      { role: 'RW', x: 785, y: 155 },
      { role: 'ST', x: 815, y: 350 },
      { role: 'LW', x: 785, y: 545 },
    ],
  },
  {
    id: '5-3-2',
    name: '5–3–2',
    tagline: 'Fortress Counter-Attack',
    summary: 'Five defenders lock down the penalty area and launch direct balls to twin forwards.',
    slots: [
      { role: 'GK', x: 72, y: 350 },
      { role: 'RWB', x: 335, y: 95 },
      { role: 'RCB', x: 255, y: 215 },
      { role: 'CB', x: 242, y: 350 },
      { role: 'LCB', x: 255, y: 485 },
      { role: 'LWB', x: 335, y: 605 },
      { role: 'RCM', x: 495, y: 215 },
      { role: 'CM', x: 475, y: 350 },
      { role: 'LCM', x: 495, y: 485 },
      { role: 'RS', x: 765, y: 255 },
      { role: 'LS', x: 765, y: 445 },
    ],
  },
]

export const POSITION_PRESETS: PositionPresetDefinition[] = [
  {
    id: 'standard',
    name: 'Standard Shape',
    badge: 'BALANCED',
    description: 'Natural formation geometry with balanced vertical and horizontal spacing.',
  },
  {
    id: 'high-press',
    name: 'High Line Press',
    badge: 'FRONT FOOT',
    description: 'Steps the defensive and midfield lines higher up the pitch to suffocate build-up.',
  },
  {
    id: 'low-block',
    name: 'Compact Low Block',
    badge: 'DEEP SHIELD',
    description: 'Drops outfield lines deeper and narrows horizontal gaps around the penalty box.',
  },
  {
    id: 'wide-overload',
    name: 'Wide Touchline Stretch',
    badge: 'WIDTH +25%',
    description: 'Pushes wide players toward the touchlines to stretch the opposition defense.',
  },
  {
    id: 'central-overload',
    name: 'Half-Space Box',
    badge: 'NARROW',
    description: 'Tucks wide midfielders and forwards inside for quick central passing combinations.',
  },
  {
    id: 'overlapping-fb',
    name: 'Overlapping Flanks',
    badge: 'FLANK SURGE',
    description: 'Advances full-backs and wing-backs into attacking support lanes.',
  },
]

export const PLAYER_ROLE_PRESETS: PlayerRolePresetDefinition[] = [
  {
    id: 'default',
    name: 'Balanced Role',
    shortLabel: 'Default',
    detail: 'Follows base formation and team positioning preset.',
  },
  {
    id: 'stay-back',
    name: 'Hold Position',
    shortLabel: 'Hold Deep',
    detail: 'Drops anchor deeper to protect against counter-attacks.',
  },
  {
    id: 'join-attack',
    name: 'Get Forward',
    shortLabel: 'Push High',
    detail: 'Advances starting zone higher into attacking territory.',
  },
  {
    id: 'stay-wide',
    name: 'Hug Touchline',
    shortLabel: 'Stay Wide',
    detail: 'Shifts positioning closer to the nearest touchline.',
  },
  {
    id: 'cut-inside',
    name: 'Cut Inside',
    shortLabel: 'Inverted',
    detail: 'Tucks into the central half-space corridor.',
  },
]

export function getFormation(id: FormationId): FormationDefinition {
  return FORMATIONS.find(f => f.id === id) ?? FORMATIONS[0]
}

export function applyPresetToFormation(
  formationId: FormationId,
  presetId: PositionPresetId,
  playerRoles?: PlayerRoleOffsetId[]
): [number, number][] {
  const formation = getFormation(formationId)
  return formation.slots.map((slot, index) => {
    if (index === 0) {
      // Goalkeeper stays near goal line, slightly higher on high-press
      const gkX = presetId === 'high-press' ? 92 : presetId === 'low-block' ? 64 : slot.x
      return [gkX, slot.y]
    }

    let x = slot.x
    let y = slot.y
    const distFromCenterY = y - PITCH_H / 2
    const isWide = Math.abs(distFromCenterY) > 140
    const isDefender = slot.x < 360

    switch (presetId) {
      case 'high-press':
        x += isDefender ? 85 : 65
        y = PITCH_H / 2 + distFromCenterY * 0.92
        break
      case 'low-block':
        x -= isDefender ? 55 : 85
        y = PITCH_H / 2 + distFromCenterY * 0.78
        break
      case 'wide-overload':
        if (isWide) {
          y = PITCH_H / 2 + distFromCenterY * 1.24
          x += 20
        }
        break
      case 'central-overload':
        y = PITCH_H / 2 + distFromCenterY * 0.72
        if (!isDefender) x += 18
        break
      case 'overlapping-fb':
        if (isWide && isDefender) {
          x += 125
          y = PITCH_H / 2 + distFromCenterY * 1.12
        } else if (!isWide && isDefender) {
          x -= 15
        }
        break
      case 'standard':
      default:
        break
    }

    const roleOffset = playerRoles?.[index] ?? 'default'
    if (roleOffset === 'stay-back') {
      x -= 65
    } else if (roleOffset === 'join-attack') {
      x += 75
    } else if (roleOffset === 'stay-wide') {
      const sign = distFromCenterY === 0 ? (index % 2 === 0 ? 1 : -1) : Math.sign(distFromCenterY)
      y += sign * 65
    } else if (roleOffset === 'cut-inside') {
      y = PITCH_H / 2 + (y - PITCH_H / 2) * 0.58
      x += 20
    }

    return [
      Math.round(clamp(x, 145, 980)),
      Math.round(clamp(y, 58, PITCH_H - 58)),
    ]
  })
}

export function computeTacticalMetrics(positions: [number, number][]) {
  const outfield = positions.slice(1)
  if (outfield.length === 0) {
    return { lineHeightMeters: 32, widthPercent: 75, compactness: 78, attackingPresence: 50 }
  }
  const xs = outfield.map(p => p[0])
  const ys = outfield.map(p => p[1])
  const minX = Math.min(...xs)
  const maxX = Math.max(...xs)
  const minY = Math.min(...ys)
  const maxY = Math.max(...ys)
  const avgX = xs.reduce((a, b) => a + b, 0) / xs.length

  // Convert defensive line X (145..500) to meters from goal line (approx 18m..52m)
  const lineHeightMeters = Math.round(clamp(((minX - 72) / (PITCH_W - 144)) * 105, 16, 62))
  const widthPercent = Math.round(clamp(((maxY - minY) / (PITCH_H - 110)) * 100, 35, 100))
  const depthSpan = maxX - minX
  const compactness = Math.round(clamp(100 - ((depthSpan - 320) / 480) * 55, 40, 96))
  const attackingPresence = Math.round(clamp(((avgX - 380) / 320) * 100, 25, 95))

  return { lineHeightMeters, widthPercent, compactness, attackingPresence }
}
