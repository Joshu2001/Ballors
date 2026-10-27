import type { DribbleType } from './engine'

export type HighlightKind = 'goal' | 'shot' | 'save' | 'dribble'

export interface HighlightEvent {
  id: string
  minute: number
  clockLabel: string
  kind: HighlightKind
  team: 0 | 1
  playerName: string
  playerNumber: number
  title: string
  detail: string
  x: number
  y: number
  targetX?: number
  targetY?: number
  scoreAfter: [number, number]
  dribbleType?: DribbleType
}

export interface MatchStats {
  homeShots: number
  awayShots: number
  homeSaves: number
  awaySaves: number
  homeDribbles: number
  awayDribbles: number
  homePasses: number
  awayPasses: number
}
