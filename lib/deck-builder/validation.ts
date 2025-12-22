// Deck validation rules
export const DECK_RULES = {
  MIN_DECK_SIZE: 40,
  MAX_DECK_SIZE: 60,
  MAX_COPIES_PER_CARD: 3,
  MAX_EXTRA_DECK: 15,
  FORBIDDEN_CARDS: new Set<number>(), // Can be populated from DB
}

export interface DeckCard {
  cardCode: number
  count: number
}

export interface Deck {
  _id?: string
  deckId: string
  userId: string
  name: string
  mainDeck: number[]
  extraDeck: number[]
  sideDeck: number[]
  createdAt: Date
  updatedAt: Date
}

export interface ValidationResult {
  valid: boolean
  errors: string[]
  warnings: string[]
}

export function validateDeck(deck: Deck): ValidationResult {
  const errors: string[] = []
  const warnings: string[] = []

  // Count main deck cards
  const mainDeckCount = deck.mainDeck.reduce((sum, card) => sum + card.count, 0)

  if (mainDeckCount < DECK_RULES.MIN_DECK_SIZE) {
    errors.push(`Main deck must have at least ${DECK_RULES.MIN_DECK_SIZE} cards (current: ${mainDeckCount})`)
  }

  if (mainDeckCount > DECK_RULES.MAX_DECK_SIZE) {
    errors.push(`Main deck cannot exceed ${DECK_RULES.MAX_DECK_SIZE} cards (current: ${mainDeckCount})`)
  }

  // Check copy limits
  for (const card of deck.mainDeck) {
    if (card.count > DECK_RULES.MAX_COPIES_PER_CARD) {
      errors.push(`Card ${card.cardCode} exceeds copy limit (${card.count}/${DECK_RULES.MAX_COPIES_PER_CARD})`)
    }
  }

  for (const card of deck.extraDeck) {
    if (card.count > DECK_RULES.MAX_COPIES_PER_CARD) {
      errors.push(
        `Extra deck card ${card.cardCode} exceeds copy limit (${card.count}/${DECK_RULES.MAX_COPIES_PER_CARD})`,
      )
    }
  }

  for (const card of deck.sideDeck) {
    if (card.count > DECK_RULES.MAX_COPIES_PER_CARD) {
      errors.push(
        `Side deck card ${card.cardCode} exceeds copy limit (${card.count}/${DECK_RULES.MAX_COPIES_PER_CARD})`,
      )
    }
  }

  // Count extra deck
  const extraDeckCount = deck.extraDeck.reduce((sum, card) => sum + card.count, 0)
  if (extraDeckCount > DECK_RULES.MAX_EXTRA_DECK) {
    errors.push(`Extra deck cannot exceed ${DECK_RULES.MAX_EXTRA_DECK} cards (current: ${extraDeckCount})`)
  }

  // Check for forbidden cards
  const allCards = [...deck.mainDeck, ...deck.extraDeck, ...deck.sideDeck]
  for (const card of allCards) {
    if (DECK_RULES.FORBIDDEN_CARDS.has(card.cardCode)) {
      errors.push(`Card ${card.cardCode} is forbidden in competitive play`)
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  }
}
