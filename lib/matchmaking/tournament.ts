// Tournament system

export type BracketType = "swiss" | "double-elimination"

export interface Tournament {
  _id?: string
  name: string
  organizerId: string
  bracketType: BracketType
  entryFee: number
  maxPlayers: number
  registeredPlayers: string[]
  status: "registration" | "in-progress" | "completed"
  registrationDeadline: Date
  startDate: Date
  prizes: Record<number, number> // position -> credits
  finalStandings?: string[] // Ordered by placement
  createdAt: Date
}

export const TOURNAMENT_DEFAULT_PRIZES = {
  1: 0.4, // 40%
  2: 0.2, // 20%
  3: 0.1, // 10%
  4: 0.1, // 10%
  5: 0.05, // 5%
  6: 0.05, // 5%
  7: 0.05, // 5%
  8: 0.05, // 5%
}

export function calculateTournamentPrizes(poolSize: number): Record<number, number> {
  const prizes: Record<number, number> = {}

  for (const [position, percentage] of Object.entries(TOURNAMENT_DEFAULT_PRIZES)) {
    const pos = Number.parseInt(position)
    prizes[pos] = Math.floor(poolSize * (percentage as number))
  }

  return prizes
}
