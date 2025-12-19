import { text } from "stream/consumers"

export const CREDITS_ON_SIGNUP = 1000
export const DAILY_CREDITS = 25
export const DAILY_CLAIM_INTERVAL = 24 * 60 * 60 * 1000

export const LADDER_STREAK_CAP = 20
export const LADDER_CREDITS_PER_WIN = (streak: number) => Math.min(streak, LADDER_STREAK_CAP)

export const ELIMINATION_ENTRY_COST = 50
export const ELIMINATION_MAX_PLAYERS = 8
export const ELIMINATION_WINNER_CREDITS = 200
export const ELIMINATION_SECOND_CREDITS = 100
export const ELIMINATION_THIRD_FOURTH_CREDITS = 50

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

export const RARITIES = [
  "Common",
  "Rare",
  "Super Rare",
  "Ultra Rare",
  "Secret Rare",
  "Ultimate Rare",
]

export const RARITY_DUST_VALUES: Record<string, number> = {
  "Common": 1,
  "Rare": 3,
  "Super Rare": 6,
  "Ultra Rare": 8,
  "Secret Rare": 30,
  "Ultimate Rare": 120,
}

export const RARITY_ABBREVIATIONS: Record<string, string> = {
  "Common": "C",
  "Rare": "R",
  "Super Rare": "SR",
  "Ultra Rare": "UR",
  "Secret Rare": "SCR",
  "Ultimate Rare": "UTR",
}

export const RARITY_ICONS: Record<string, any> = {
  "Common": { color: "#000000", textColor: "#FFFFFF" },
  "Rare": { color: "#666666", textColor: "#FFFFFF" },
  "Super Rare": { color: "#0066cc", textColor: "#FFFFFF" },
  "Ultra Rare": { color: "#6600cc", textColor: "#FFFFFF" },
  "Secret Rare": { color: "#ff9900", textColor: "#000000" },
  "Ultimate Rare": { color: "#cc6600", textColor: "#FFFFFF" },
}

export const SLOT_RATIOS = [
  { rarity: "Common", chance: 0.6, dv: 1 },
  { rarity: "Rare", chance: 0.2, dv: 3 },
  { rarity: "Super Rare", chance: 0.1, dv: 6 },
  { rarity: "Ultra Rare", chance: 0.075, dv: 8 },
  { rarity: "Secret Rare", chance: 0.02, dv: 30 },
  { rarity: "Ultimate Rare", chance: 0.005, dv: 120 },
]

export const AVERAGE_DUST_VALUE_PER_PACK = SLOT_RATIOS.reduce((sum, r) => sum + r.chance * r.dv, 0) * 8
