// Elimination bracket system

export interface EliminationBracket {
  _id?: string
  players: string[]
  bracket: BracketMatch[][]
  status: "waiting" | "in-progress" | "completed"
  winners: {
    first: string
    second: string
    third: string
    fourth: string
  }
  createdAt: Date
}

export interface BracketMatch {
  id: string
  player1Id: string
  player2Id: string
  winnerId?: string
  completed: boolean
}

export const ELIMINATION_CONFIG = {
  MAX_PLAYERS: 8,
  ENTRY_COST: 50,
  WINNER_PRIZE: 200,
  SECOND_PRIZE: 100,
  THIRD_FOURTH_PRIZE: 50, // They get entry back
}

export function generateEliminationBracket(playerIds: string[]): BracketMatch[][] {
  if (playerIds.length !== 8) {
    throw new Error("Elimination bracket requires exactly 8 players")
  }

  const bracket: BracketMatch[][] = []

  // Round 1 - 4 matches
  const round1: BracketMatch[] = []
  for (let i = 0; i < 8; i += 2) {
    round1.push({
      id: `r1_m${i / 2}`,
      player1Id: playerIds[i],
      player2Id: playerIds[i + 1],
      completed: false,
    })
  }
  bracket.push(round1)

  // Round 2 (Semi-finals) - 2 matches
  const round2: BracketMatch[] = [
    { id: "r2_m0", player1Id: "", player2Id: "", completed: false },
    { id: "r2_m1", player1Id: "", player2Id: "", completed: false },
  ]
  bracket.push(round2)

  // Round 3 (Finals) - 1 match
  const round3: BracketMatch[] = [{ id: "r3_m0", player1Id: "", player2Id: "", completed: false }]
  bracket.push(round3)

  // 3rd place match
  const thirdPlace: BracketMatch[] = [{ id: "third_place", player1Id: "", player2Id: "", completed: false }]
  bracket.push(thirdPlace)

  return bracket
}

export function updateBracket(bracket: BracketMatch[][], matchId: string, winnerId: string): BracketMatch[][] {
  const newBracket = JSON.parse(JSON.stringify(bracket))

  // Find match and mark as complete
  for (const round of newBracket) {
    const match = round.find((m: BracketMatch) => m.id === matchId)
    if (match) {
      match.winnerId = winnerId
      match.completed = true

      // Advance winner to next round
      const roundIndex = newBracket.indexOf(round)
      const matchIndex = round.indexOf(match)

      if (roundIndex < newBracket.length - 1) {
        const nextRound = newBracket[roundIndex + 1]
        // Semi-finals: place in finals
        if (roundIndex === 0) {
          if (matchIndex < 2) {
            nextRound[0].player1Id = winnerId
          } else {
            nextRound[1].player1Id = winnerId
          }
        } else if (roundIndex === 1) {
          // Finals setup
          nextRound[0].player2Id = winnerId
        }
      }

      break
    }
  }

  return newBracket
}
