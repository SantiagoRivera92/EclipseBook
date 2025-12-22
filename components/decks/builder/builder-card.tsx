"use client"

import type React from "react"
import { cn } from "@/lib/utils"
import type { Card, DeckSection } from "./types"
import { useDraggable } from "@dnd-kit/core"

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

  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: `${section}-${card.cardCode}-${index ?? 0}`,
    data: { card, section, index },
    disabled: isSearch,
  })

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        zIndex: 50,
      }
    : undefined

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...(!isSearch ? attributes : {})}
      {...(!isSearch ? listeners : {})}
      className={cn(
        "group relative aspect-[2/3] rounded-md transition-all overflow-hidden bg-card border border-border",
        !isSearch && "cursor-grab active:cursor-grabbing",
        isSearch && "cursor-pointer",
        "hover:ring-2 hover:ring-primary/50 hover:shadow-lg",
        isDragging && "opacity-50 scale-95",
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
              card.ownedCount > 0 ? "bg-secondary text-secondary-foreground" : "bg-destructive text-destructive-foreground",
            )}
          >
            {card.ownedCount} OWNED
          </div>
        </div>
      )}

      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-end p-2 pointer-events-none">
        <span className="text-[10px] text-white font-medium bg-black/70 px-2 py-1 rounded backdrop-blur-sm">
          {isSearch ? "Right-click to add" : "Right-click to remove"}
        </span>
      </div>
    </div>
  )
}
