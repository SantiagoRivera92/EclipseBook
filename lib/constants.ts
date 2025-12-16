// Application constants

export const CREDITS_ON_SIGNUP = 1000
export const DAILY_CREDITS = 25
export const DAILY_CLAIM_INTERVAL = 24 * 60 * 60 * 1000 // 24 hours in ms

export const LADDER_STREAK_CAP = 20
export const LADDER_CREDITS_PER_WIN = (streak: number) => Math.min(streak, LADDER_STREAK_CAP)

export const ELIMINATION_ENTRY_COST = 50
export const ELIMINATION_MAX_PLAYERS = 8
export const ELIMINATION_WINNER_CREDITS = 200
export const ELIMINATION_SECOND_CREDITS = 100
export const ELIMINATION_THIRD_FOURTH_CREDITS = 50 // They get their entry back

export const TOURNAMENT_PRIZE_DISTRIBUTION = {
  1: 0.4,
  2: 0.2,
  3: 0.1,
  4: 0.1,
  5: 0.05,
  6: 0.05,
  7: 0.05,
  8: 0.05,
}

export const CARD_COPY_LIMIT = 3
export const MARKETPLACE_LISTING_EXPIRY = 7 * 24 * 60 * 60 * 1000 // 7 days in ms
export const MARKETPLACE_AUCTION_EXPIRY = 3 * 24 * 60 * 60 * 1000 // 3 days in ms
