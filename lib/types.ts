
export interface CollectionCard{
  cardCode: number
  imageUrl: string
  rarity: string
  count: number
  dustValue: number
  name: string
  desc: string
  atk: number
  def: number
  level?: number
  type: number
  rate: number
  attribute: number
}

export interface ReducedRarity{
  rarity: string
  count: number
  dustValue: number
}

export interface ReducedCard{
  key: string | number
  cardCode: number
  name: string
  imageUrl?: string
  totalCount: number
  rarities: ReducedRarity[]
}