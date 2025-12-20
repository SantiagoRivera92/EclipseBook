import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { CollectionCard, ReducedCard } from './types'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function groupCards(cards: CollectionCard[]) {
    return cards.reduce((acc: ReducedCard[], card) => {
      let group = acc.find((g) => g.cardCode === card.cardCode)
      if (!group) {
        group = {
          key: card.cardCode,
          cardCode: card.cardCode,
          name: card.name,
          imageUrl: card.imageUrl,
          totalCount: 0,
          rarities: [],
        }
        acc.push(group)
      }
      group.totalCount += card.count
      group.rarities.push({
        rarity: card.rarity,
        count: card.count,
        dustValue: card.dustValue,
      })
      return acc
    }, [])
  }