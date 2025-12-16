// Core types for the duel engine translated from ygopro-core

export enum LOCATION {
  DECK = 0x01,
  HAND = 0x02,
  MZONE = 0x04,
  SZONE = 0x08,
  GRAVE = 0x10,
  REMOVED = 0x20,
  EXTRA = 0x40,
  OVERLAY = 0x80,
  // Derived locations
  MMZONE = 0x44, // Main Monster Zone
  EMZONE = 0x84, // Extra Monster Zone
  STZONE = 0x88, // Spell/Trap Zone
  FZONE = 0x08, // Field Zone
  PZONE = 0x08, // Pendulum Zone
}

export enum POSITION {
  FACEUP_ATTACK = 0x01,
  FACEDOWN_ATTACK = 0x02,
  FACEUP_DEFENSE = 0x04,
  FACEDOWN_DEFENSE = 0x08,
}

export enum TYPE {
  MONSTER = 0x1,
  SPELL = 0x2,
  TRAP = 0x4,
  FUSION = 0x40,
  SYNCHRO = 0x2000,
  XYZ = 0x800000,
  PENDULUM = 0x1000000,
  LINK = 0x4000000,
}

export enum ATTRIBUTE {
  FIRE = 0x01,
  WATER = 0x02,
  WIND = 0x04,
  LIGHT = 0x08,
  DARK = 0x10,
  DIVINE = 0x20,
}

export interface CardData {
  code: number
  alias: number
  setcodes: Set<number>
  type: number
  level: number
  attribute: number
  race: bigint
  attack: number
  defense: number
  lscale: number
  rscale: number
  linkMarker: number
}

export interface CardState {
  code: number
  code2: number
  setcodes: Set<number>
  type: number
  level: number
  rank: number
  link: number
  linkMarker: number
  lscale: number
  rscale: number
  attribute: number
  race: bigint
  attack: number
  defense: number
  baseAttack: number
  baseDefense: number
  controller: number
  location: number
  sequence: number
  position: number
  reason: number
  pzone: boolean
  reasonCard?: Card
  reasonPlayer: number
  reasonEffect?: Effect
}

export interface LocInfo {
  controller: number
  location: number
  sequence: number
  position: number
}

export class Card {
  data: CardData
  previous: CardState
  temp: CardState
  current: CardState
  owner: number
  cardid: number
  status: number

  constructor(code: number) {
    this.cardid = Math.random()
    this.data = {
      code,
      alias: 0,
      setcodes: new Set(),
      type: 0,
      level: 0,
      attribute: 0,
      race: 0n,
      attack: 0,
      defense: 0,
      lscale: 0,
      rscale: 0,
      linkMarker: 0,
    }
    this.current = this.createCardState()
    this.previous = this.createCardState()
    this.temp = this.createCardState()
    this.owner = 0
    this.status = 0
  }

  private createCardState(): CardState {
    return {
      code: 0,
      code2: 0,
      setcodes: new Set(),
      type: 0,
      level: 0,
      rank: 0,
      link: 0,
      linkMarker: 0,
      lscale: 0,
      rscale: 0,
      attribute: 0,
      race: 0n,
      attack: 0,
      defense: 0,
      baseAttack: 0,
      baseDefense: 0,
      controller: 0,
      location: 0,
      sequence: 0,
      position: 0,
      reason: 0,
      pzone: false,
      reasonPlayer: 0,
    }
  }

  getCode(): number {
    return this.current.code || this.data.code
  }

  getAttack(): number {
    return this.current.attack
  }

  getDefense(): number {
    return this.current.defense
  }

  getLevel(): number {
    return this.current.level
  }

  getType(): number {
    return this.current.type
  }

  getLocation(): LocInfo {
    return {
      controller: this.current.controller,
      location: this.current.location,
      sequence: this.current.sequence,
      position: this.current.position,
    }
  }

  isMonster(): boolean {
    return (this.current.type & TYPE.MONSTER) !== 0
  }

  isSpell(): boolean {
    return (this.current.type & TYPE.SPELL) !== 0
  }

  isTrap(): boolean {
    return (this.current.type & TYPE.TRAP) !== 0
  }
}

export class Effect {
  code: number
  type: number
  owner: Card | null

  constructor(code = 0) {
    this.code = code
    this.type = 0
    this.owner = null
  }
}

export class Group {
  cards: Card[] = []

  add(card: Card): void {
    if (!this.cards.includes(card)) {
      this.cards.push(card)
    }
  }

  remove(card: Card): void {
    const index = this.cards.indexOf(card)
    if (index > -1) {
      this.cards.splice(index, 1)
    }
  }

  contains(card: Card): boolean {
    return this.cards.includes(card)
  }

  getCards(): Card[] {
    return [...this.cards]
  }

  getCount(): number {
    return this.cards.length
  }
}

export interface DuelOptions {
  seed?: number
  loglevel?: number
  useShuffle?: boolean
}

export class Duel {
  cardMap: Map<number, Card> = new Map()
  groups: Set<Group> = new Set()
  effects: Set<Effect> = new Set()
  messages: Buffer[] = []
  gameField: Field

  constructor(options?: DuelOptions) {
    this.gameField = new Field()
  }

  newCard(code: number): Card {
    const card = new Card(code)
    this.cardMap.set(card.cardid, card)
    return card
  }

  newGroup(...cards: Card[]): Group {
    const group = new Group()
    cards.forEach((c) => group.add(c))
    this.groups.add(group)
    return group
  }

  newEffect(): Effect {
    const effect = new Effect()
    this.effects.add(effect)
    return effect
  }

  deleteCard(card: Card): void {
    this.cardMap.delete(card.cardid)
  }

  deleteGroup(group: Group): void {
    this.groups.delete(group)
  }

  deleteEffect(effect: Effect): void {
    this.effects.delete(effect)
  }

  getRandomInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min
  }
}

export class Field {
  players: PlayerInfo[] = []
  chains: Chain[] = []

  constructor() {
    this.players = [new PlayerInfo(0), new PlayerInfo(1)]
  }
}

export class PlayerInfo {
  playerid: number
  lp: number
  hand: Card[] = []
  deck: Card[] = []
  grave: Card[] = []
  removed: Card[] = []
  extra: Card[] = []
  mzone: (Card | null)[] = new Array(7).fill(null)
  szone: (Card | null)[] = new Array(8).fill(null)

  constructor(playerid: number) {
    this.playerid = playerid
    this.lp = 8000
  }
}

export interface Chain {
  id: number
  triggeredCard: Card
  targetCards: Card[]
  activated: boolean
}
