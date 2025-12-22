"use client"

import type React from "react"
import { cn } from "@/lib/utils"
import type { Card, DeckSection } from "./types"
import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { HoverCard, HoverCardTrigger, HoverCardContent } from "@/components/ui/hover-card"

interface BuilderCardProps {
  card: Card
  section: DeckSection
  index?: number
  onInteract: (e: React.MouseEvent, card: Card, source: DeckSection, index?: number) => void
  className?: string
  isDragging?: boolean
  countInDeck?: number
}

export function BuilderCard({
  card,
  section,
  index,
  onInteract,
  className,
  isDragging,
  countInDeck = 0,
}: BuilderCardProps) {
  const isSearch = section === "search"

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({
    id: `${section}-${card.cardCode}-${index ?? 0}`,
    data: { card, section, index },
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const showHoverCard = !isDragging && !isSortableDragging

  const cardContent = (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={cn(
        "group relative aspect-[2/3] rounded-md transition-all overflow-hidden bg-card border border-border",
        "cursor-grab active:cursor-grabbing",
        "hover:ring-2 hover:ring-primary/50 hover:shadow-lg",
        (isDragging || isSortableDragging) && "opacity-0",
        className,
      )}
      onContextMenu={(e) => {
        e.preventDefault()
        onInteract(e, card, section, index)
      }}
      onClick={(e) => {
        if (isSearch) onInteract(e, card, section, index)
      }}
    >
      <img
        src={card.imageUrl || `https://images.ygoprodeck.com/images/cards/${card.cardCode}.jpg`}
        alt={card.name}
        className="w-full h-full object-cover rounded-md"
        loading="lazy"
        draggable={false}
      />

      {isSearch && (
        <div className="absolute top-1 right-1 flex flex-col gap-1">
          {countInDeck > 0 && (
            <div className="bg-primary text-primary-foreground text-[10px] px-1.5 py-0.5 rounded font-bold shadow-md">
              {countInDeck} IN DECK
            </div>
          )}
          <div
            className={cn(
              "text-[10px] px-1.5 py-0.5 rounded font-bold shadow-md",
              card.ownedCount > 0
                ? "bg-secondary text-secondary-foreground"
                : "bg-destructive text-destructive-foreground",
            )}
          >
            {card.ownedCount} OWNED
          </div>
        </div>
      )}

      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-end p-2 pointer-events-none">
        <span className="text-[10px] text-white font-medium bg-black/70 px-2 py-1 rounded backdrop-blur-sm">
          {isSearch ? "Click/Drag to add" : "Right-click to remove"}
        </span>
      </div>
    </div>
  )

  if (!showHoverCard) {
    return cardContent
  }

  return (
    <HoverCard openDelay={300} closeDelay={100}>
      <HoverCardTrigger asChild>{cardContent}</HoverCardTrigger>
      <HoverCardContent side="right" align="start" className="w-80 p-4">
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <img
              src={card.imageUrl || `https://images.ygoprodeck.com/images/cards/${card.cardCode}.jpg`}
              alt={card.name}
              className="w-20 aspect-[2/3] rounded object-cover shadow-md"
            />
            <div className="flex-1 space-y-1">
              <h3 className="font-bold text-sm leading-tight">{card.name}</h3>
              <p className="text-xs text-muted-foreground">#{card.cardCode}</p>
              {card.level !== undefined && <p className="text-xs text-muted-foreground">Level/Rank: {card.level}</p>}
              {card.attributeName && <p className="text-xs text-muted-foreground">Attribute: {card.attributeName}</p>}
              {card.raceName && <p className="text-xs text-muted-foreground">Type: {card.raceName}</p>}
            </div>
          </div>

          {(card.attack !== undefined || card.defense !== undefined) && (
            <div className="flex gap-3 text-xs">
              {card.attack !== undefined && (
                <div className="flex items-center gap-1">
                  <span className="font-semibold text-muted-foreground">ATK:</span>
                  <span className="font-bold">{card.attack}</span>
                </div>
              )}
              {card.defense !== undefined && (
                <div className="flex items-center gap-1">
                  <span className="font-semibold text-muted-foreground">DEF:</span>
                  <span className="font-bold">{card.defense}</span>
                </div>
              )}
            </div>
          )}

          {card.description && (
            <p className="text-xs leading-relaxed text-muted-foreground border-t pt-2">{card.description}</p>
          )}
        </div>
      </HoverCardContent>
    </HoverCard>
  )
}
