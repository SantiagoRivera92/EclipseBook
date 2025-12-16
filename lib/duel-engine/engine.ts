import { Duel, type Card, type Effect, type Group, type DuelOptions } from "./types"

export class DuelEngine {
  private duel: Duel

  constructor(options?: DuelOptions) {
    this.duel = new Duel(options)
  }

  addCard(code: number, owner: number, location: number): Card {
    const card = this.duel.newCard(code)
    card.owner = owner
    card.current.location = location
    card.current.controller = owner
    return card
  }

  removeCard(card: Card): void {
    this.duel.deleteCard(card)
  }

  createGroup(...cards: Card[]): Group {
    return this.duel.newGroup(...cards)
  }

  createEffect(): Effect {
    return this.duel.newEffect()
  }

  getRandomInt(min: number, max: number): number {
    return this.duel.getRandomInt(min, max)
  }

  getDuel(): Duel {
    return this.duel
  }
}
