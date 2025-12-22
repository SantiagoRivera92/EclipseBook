"use client"

import type React from "react"
import { cn } from "@/lib/utils"
import { BuilderCard } from "./builder-card"
import type { Card, DeckSection } from "./types"
import { useDroppable } from "@dnd-kit/core"

interface DeckGridProps {
  cards: Card[]
  section: DeckSection
  title: string
  onInteract: (e: React.MouseEvent, card: Card, source: DeckSection, index?: number) => void
  minCount?: number
  maxCount?: number
  className?: string
}

export function DeckGrid({ cards, section, title, onInteract, minCount = 0, maxCount = 60, className }: DeckGridProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: `droppable-${section}`,
    data: { section },
  })

  const isInvalid = cards.length < minCount || cards.length > maxCount

  return (
    <section className={cn("space-y-3", className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-base font-bold tracking-tight text-foreground">{title}</h2>
          <span
            className={cn(
              "text-xs font-semibold px-2 py-1 rounded",
              isInvalid ? "bg-destructive/10 text-destructive" : "bg-primary/10 text-primary",
            )}
          >
            {cards.length}
            {minCount > 0 && ` / ${minCount}-${maxCount}`}
          </span>
        </div>

        {cards.length < minCount && (
          <span className="text-xs text-destructive/80 font-medium">Need {minCount - cards.length} more</span>
        )}
        {cards.length > maxCount && (
          <span className="text-xs text-destructive/80 font-medium">Remove {cards.length - maxCount}</span>
        )}
      </div>

      <div
        ref={setNodeRef}
        className={cn(
          "min-h-[180px] p-4 bg-card rounded-lg border-2 transition-all",
          isOver ? "border-primary bg-primary/5 shadow-lg" : "border-border",
        )}
      >
        <div
          className={cn(
            "grid gap-2",
            section === "main"
              ? "grid-cols-5 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10"
              : "grid-cols-5 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10",
          )}
        >
          {cards.map((card, i) => (
            <BuilderCard
              key={`${section}-${card.cardCode}-${i}`}
              card={card}
              section={section}
              index={i}
              onInteract={onInteract}
            />
          ))}

          {cards.length === 0 && (
            <div className="col-span-full h-32 flex flex-col items-center justify-center text-muted-foreground border-2 border-dashed border-border rounded-md">
              <span className="text-sm font-medium opacity-60">Drop cards here</span>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
