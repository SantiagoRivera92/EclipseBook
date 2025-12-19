"use client"

interface CardGridProps {
  cards: Array<{
    key: string | number
    cardCode: number
    name: string
    imageUrl?: string
    totalCount: number
  }>
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
      {cards.map((card) => (
        <div
          key={card.key}
          className="cursor-pointer group flex flex-col items-center"
          onClick={() => onCardClick(card)}
        >
          <div
            className="relative w-full bg-gradient-to-br from-primary/10 to-purple-500/10 rounded-lg overflow-hidden shadow-md border border-border group-hover:border-primary transition-colors"
            style={{ aspectRatio: "813/1185" }}
          >
            {card.imageUrl && (
              <img
                src={card.imageUrl || "/placeholder.svg"}
                alt={card.name}
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform"
                loading="lazy"
              />
            )}
          </div>
          <div className="w-full flex flex-col items-center mt-2">
            <span className="font-semibold text-sm text-center truncate w-full" title={card.name}>
              {card.name}
            </span>
            <span className="text-xs text-muted-foreground mt-1">x{card.totalCount}</span>
          </div>
        </div>
      ))}
    </div>
  )
}
