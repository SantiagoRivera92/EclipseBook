import { TYPE } from "@/lib/duel-engine/types"

export interface Card {
  cardCode: number
  name: string
  imageUrl?: string
  type: number
  attribute?: number
  level?: number
  race?: bigint
  attack?: number
  defense?: number
  ownedCount: number
  [key: string]: any
}

export type DeckSection = "main" | "extra" | "side" | "search"

export const isExtraDeckCard = (type: number) => {
  return !!(type & (TYPE.FUSION | TYPE.SYNCHRO | TYPE.XYZ))
}

export interface FilterState {
  cardType: "Monster" | "Spell" | "Trap" | null
  monsterCardType: string | null
  race: string | null
  monsterType: string | null
  attribute: string | null
  spellType: string | null
  trapType: string | null
  level: number | null
  atk: string | ""
  def: string | ""
}

export const MONSTER_CARD_TYPES = ["Normal", "Effect", "Ritual", "Fusion", "Synchro", "Xyz"]
export const MONSTER_TYPES = ["Flip", "Gemini", "Spirit", "Toon", "Union", "Tuner"]
export const SPELL_TYPES = ["Normal", "Equip", "Quick-Play", "Ritual", "Continuous", "Field"]
export const TRAP_TYPES = ["Normal", "Continuous", "Counter"]
export const ATTRIBUTES = ["LIGHT", "DARK", "WATER", "FIRE", "EARTH", "WIND", "DIVINE"]
export const RACES = [
  "Warrior",
  "Spellcaster",
  "Fairy",
  "Fiend",
  "Zombie",
  "Machine",
  "Aqua",
  "Pyro",
  "Rock",
  "Winged Beast",
  "Plant",
  "Insect",
  "Thunder",
  "Dragon",
  "Beast",
  "Beast-Warrior",
  "Dinosaur",
  "Fish",
  "Sea Serpent",
  "Reptile",
  "Psychic",
  "Divine-Beast",
]
