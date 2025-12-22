"use client"

import { useDraggable } from "@dnd-kit/core"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import Image from "next/image"
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card"

interface SearchCardProps {
  card: {
    id: number
    name: string
    code: string
    type: string
    race?: string
    attribute?: string
    level?: number
    atk?: number
    def?: number
    desc: string
  }
  onAdd: () => void
}

export function SearchCard({ card, onAdd }: SearchCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `search-${card.id}`,
    data: { card, source: "search" },
  })

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
      }
    : undefined

  const cardContent = (
    <Card
      ref={setNodeRef}
      style={style}
      className="relative group cursor-grab active:cursor-grabbing hover:shadow-lg transition-shadow"
      {...listeners}
      {...attributes}
    >
      <div className="aspect-[59/86] relative">
        <Image
          src={`https://images.ygoprodeck.com/images/cards_small/${card.id}.jpg`}
          alt={card.name}
          fill
          className="object-cover rounded-lg"
          sizes="(max-width: 768px) 100px, 150px"
        />
      </div>
      <Button
        variant="default"
        size="icon"
        className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={(e) => {
          e.stopPropagation()
          onAdd()
        }}
      >
        <Plus className="h-4 w-4" />
      </Button>
    </Card>
  )

  if (isDragging) {
    return cardContent
  }

  return (
    <HoverCard openDelay={300}>
      <HoverCardTrigger asChild>{cardContent}</HoverCardTrigger>
      <HoverCardContent side="right" className="w-80">
        <div className="space-y-2">
          <div className="aspect-[59/86] relative w-full max-w-[200px] mx-auto">
            <Image
              src={`https://images.ygoprodeck.com/images/cards/${card.id}.jpg`}
              alt={card.name}
              fill
              className="object-contain rounded-lg"
              sizes="200px"
            />
          </div>
          <div className="space-y-1">
            <h4 className="font-semibold text-sm">{card.name}</h4>
            <p className="text-xs text-muted-foreground">{card.code}</p>
            <div className="flex gap-2 text-xs text-muted-foreground">
              {card.level && <span>Level {card.level}</span>}
              {card.attribute && <span>{card.attribute}</span>}
            </div>
            <p className="text-xs">{card.type}</p>
            {(card.atk !== undefined || card.def !== undefined) && (
              <div className="flex gap-2 text-xs font-mono">
                {card.atk !== undefined && <span>ATK/{card.atk}</span>}
                {card.def !== undefined && <span>DEF/{card.def}</span>}
              </div>
            )}
            <p className="text-xs text-muted-foreground line-clamp-4 mt-2">{card.desc}</p>
          </div>
        </div>
      </HoverCardContent>
    </HoverCard>
  )
}