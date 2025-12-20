"use client"

import { CardImage } from "@/components/shared/card-image"
import { ReducedCard } from "@/lib/types"

interface CardGridProps {
  cards: ReducedCard[]
  onCardClick: (card: any) => void
}

export function CardGrid({ cards, onCardClick }: CardGridProps) {
  if (cards.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-lg text-muted-foreground">No cards found</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
      {cards.map((card, idx) => (
        <CardImage
          key={card.cardCode + card.rarities[0].rarity + idx}
          name={card.name}
          imageUrl={card.imageUrl}
          count={card.totalCount}
          onClick={() => onCardClick(card)}
          rarities={card.rarities}
          showCount={true}
        />
      ))}
    </div>
  )
}
