// Ladder system implementation

export interface LadderPlayer {
  userId: string
  username: string
  winStreak: number
  totalWins: number
  totalLosses: number
  rank: number
}

export interface LadderMatch {
  _id?: string
  player1Id: string
  player2Id: string
  winnerId?: string
  loserId?: string
  format: "bo3" // Best of 3
  status: "pending" | "in-progress" | "completed"
  createdAt: Date
  completedAt?: Date
}

export function calculateLadderRewards(winStreak: number): number {
  const { LADDER_STREAK_CAP, LADDER_CREDITS_PER_WIN } = require("@/lib/constants")
  return Math.min(winStreak, LADDER_STREAK_CAP)
}

export function calculateLadderRating(wins: number, losses: number): number {
  const total = wins + losses
  if (total === 0) return 1200
  return Math.round(1200 + (wins - losses) * 16)
}
