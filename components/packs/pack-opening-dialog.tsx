"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Sparkles } from "lucide-react"

interface PulledCard {
  _id?: string
  name: string
  rarity: string
  imageUrl?: string
  canDust?: boolean
  dustValue?: number
  packIndex?: number
}

interface PackOpeningDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  pulledCards: PulledCard[]
  packs: any[]
  onDust: (group: any) => void
}

const RARITY_ORDER = ["Ultimate Rare", "Secret Rare", "Ultra Rare", "Super Rare", "Rare", "Common"]

export function PackOpeningDialog({ open, onOpenChange, pulledCards, packs, onDust }: PackOpeningDialogProps) {
  const [currentPack, setCurrentPack] = useState(0)

  function groupCards(cards: PulledCard[]): any[] {
    const map = new Map<string, any>()
    for (const card of cards.filter((c) => c.canDust)) {
      const key = [card.name, card.rarity, card.dustValue, card.packIndex].join("|")
      if (!map.has(key)) {
        map.set(key, {
          key,
          name: card.name,
          rarity: card.rarity,
          imageUrl: card.imageUrl,
          dustValue: card.dustValue,
          canDust: card.canDust,
          count: 1,
          ids: card._id ? [card._id] : [],
        })
      } else {
        const g = map.get(key)!
        g.count++
        if (card._id) g.ids.push(card._id)
      }
    }
    return Array.from(map.values())
  }

  const packSize = packs[0]?.cardCount || 8
  const quantity = pulledCards.length > 0 ? pulledCards.length / packSize : 0

  // If more than 10 packs, show summary by rarity
  if (quantity > 10) {
    const rarityGroups = RARITY_ORDER.map((rarity) => ({
      rarity,
      cards: pulledCards.filter((card) => card.rarity === rarity),
    })).filter((g) => g.cards.length > 0)

    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-h-[90vh] min-h-[60vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              Packs Opened!
            </DialogTitle>
            <DialogDescription>Here are your new cards</DialogDescription>
          </DialogHeader>
          <div className="space-y-8">
            {rarityGroups.map((rg) => {
              const nameMap = new Map<string, { name: string; imageUrl?: string; count: number }>()
              for (const card of rg.cards) {
                if (!nameMap.has(card.name)) {
                  nameMap.set(card.name, { name: card.name, imageUrl: card.imageUrl, count: 1 })
                } else {
                  nameMap.get(card.name)!.count++
                }
              }
              const grouped = Array.from(nameMap.values())
              return (
                <div key={rg.rarity}>
                  <h3 className="font-bold text-lg mb-2">{rg.rarity}</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {grouped.map((card) => (
                      <div key={card.name} className="flex flex-col items-center">
                        <div className="aspect-[2/3] w-full bg-gradient-to-br from-primary/10 to-purple-500/10 flex items-center justify-center mb-2">
                          <img
                            src={card.imageUrl || "/placeholder.svg"}
                            alt={card.name}
                            className="max-h-full max-w-full object-contain"
                            loading="lazy"
                          />
                        </div>
                        <span className="font-semibold text-sm truncate w-full text-center">{card.name}</span>
                        <span className="block text-xs mt-1">x{card.count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  const maxPack = pulledCards.reduce(
    (max, c) => (c.packIndex !== undefined && c.packIndex > max ? c.packIndex : max),
    0,
  )

  if (maxPack > 0) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              Packs Opened!
            </DialogTitle>
            <DialogDescription>Here are your new cards</DialogDescription>
          </DialogHeader>
          <div>
            <div className="flex items-center justify-between mb-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setCurrentPack((p) => Math.max(0, p - 1))}
                disabled={currentPack === 0}
              >
                Previous Pack
              </Button>
              <span className="text-sm">
                Pack {currentPack + 1} of {maxPack + 1}
              </span>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setCurrentPack((p) => Math.min(maxPack, p + 1))}
                disabled={currentPack === maxPack}
              >
                Next Pack
              </Button>
            </div>
            <div className="w-full">
              <div className="hidden md:flex gap-4 overflow-x-auto pb-2" style={{ minHeight: 320 }}>
                {groupCards(
                  pulledCards.filter((card) => card.packIndex === currentPack || card.packIndex === undefined),
                )
                  .concat(
                    pulledCards
                      .filter((card) => card.packIndex === currentPack || card.packIndex === undefined)
                      .filter((card) => !card.canDust)
                      .map((card) => ({
                        key: card._id || card.name + card.rarity,
                        name: card.name,
                        rarity: card.rarity,
                        imageUrl: card.imageUrl,
                        dustValue: card.dustValue,
                        canDust: false,
                        count: 1,
                        ids: card._id ? [card._id] : [],
                      })),
                  )
                  .sort((a, b) => RARITY_ORDER.indexOf(a.rarity) - RARITY_ORDER.indexOf(b.rarity))
                  .map((group) => (
                    <div key={group.key} className="space-y-2 min-w-[180px] max-w-[200px]">
                      <Card className="overflow-hidden">
                        <div className="aspect-[2/3] bg-gradient-to-br from-primary/10 to-purple-500/10 flex items-center justify-center">
                          <img
                            src={group.imageUrl || "/placeholder.svg"}
                            alt={group.name}
                            className="max-h-full max-w-full object-contain"
                            loading="lazy"
                          />
                        </div>
                        <CardContent className="p-3">
                          <p className="font-semibold text-sm truncate">{group.name}</p>
                          <Badge variant="outline" className="mt-2">
                            {group.rarity}
                          </Badge>
                          {group.count > 1 && <p className="text-xs text-muted-foreground mt-1">x{group.count}</p>}
                        </CardContent>
                      </Card>
                      {group.canDust && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full bg-transparent"
                          onClick={() => onDust(group)}
                        >
                          Dust ({group.dustValue * group.count})
                        </Button>
                      )}
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Packs Opened!
          </DialogTitle>
          <DialogDescription>Here are your new cards</DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {groupCards(pulledCards)
            .concat(
              pulledCards
                .filter((card) => !card.canDust)
                .map((card) => ({
                  key: card._id || card.name + card.rarity,
                  name: card.name,
                  rarity: card.rarity,
                  imageUrl: card.imageUrl,
                  dustValue: card.dustValue,
                  canDust: false,
                  count: 1,
                  ids: card._id ? [card._id] : [],
                })),
            )
            .sort((a, b) => RARITY_ORDER.indexOf(a.rarity) - RARITY_ORDER.indexOf(b.rarity))
            .map((group) => (
              <div key={group.key} className="space-y-2">
                <Card className="overflow-hidden">
                  <div className="aspect-[2/3] bg-gradient-to-br from-primary/10 to-purple-500/10 flex items-center justify-center">
                    <img
                      src={group.imageUrl || "/placeholder.svg"}
                      alt={group.name}
                      className="max-h-full max-w-full object-contain"
                      loading="lazy"
                    />
                  </div>
                  <CardContent className="p-3">
                    <p className="font-semibold text-sm truncate">{group.name}</p>
                    <Badge variant="outline" className="mt-2">
                      {group.rarity}
                    </Badge>
                    {group.count > 1 && <p className="text-xs text-muted-foreground mt-1">x{group.count}</p>}
                  </CardContent>
                </Card>
                {group.canDust && (
                  <Button variant="outline" size="sm" className="w-full bg-transparent" onClick={() => onDust(group)}>
                    Dust ({group.dustValue * group.count})
                  </Button>
                )}
              </div>
            ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}
