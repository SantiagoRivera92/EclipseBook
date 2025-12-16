"use client"

import React, { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { Navigation } from "@/components/layout/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { useState as useReactState } from "react"
import { Button } from "@/components/ui/button"
import { Search, Filter, DollarSign } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"

export default function CollectionPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [cards, setCards] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [rarityFilter, setRarityFilter] = useState("all")
  const [selectedCard, setSelectedCard] = useState<any>(null)
  const [showCopiesDialog, setShowCopiesDialog] = useState(false)
  const [loading, setLoading] = useState(true)
  const [dusting, setDusting] = useReactState<string | null>(null)
  const [dustError, setDustError] = useReactState<string | null>(null)
  const [dustSuccess, setDustSuccess] = useReactState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [userRes, cardsRes] = await Promise.all([fetch("/api/user/profile"), fetch("/api/collection")])

        if (!userRes.ok) {
          router.push("/")
          return
        }

        if (userRes.ok) setUser(await userRes.json())
        if (cardsRes.ok) setCards(await cardsRes.json())
      } catch (error) {
        console.error("Failed to fetch data:", error)
        router.push("/")
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [router])

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!user) return null


// Group cards by cardCode only (all prints together)
function groupCards(cards: any[]) {
  return cards.reduce((acc: any[], card) => {
    let group = acc.find(g => g.cardCode === card.cardCode)
    if (!group) {
      group = {
        key: card.cardCode,
        cardCode: card.cardCode,
        name: card.name,
        imageUrl: card.imageUrl,
        rarity: card.rarity, // show the first rarity found
        dustValue: card.dustValue, // show the first dust value found
        count: 0,
        copies: [],
      }
      acc.push(group)
    }
    group.count += card.count || 1
    // Merge all copies for this cardCode
    if (card.copies) {
      group.copies = group.copies.concat(card.copies)
    }
    return acc
  }, [])
}

  const filteredCards = groupCards(cards).filter((card) => {
    const matchesSearch = card.name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesRarity = rarityFilter === "all" || card.rarity === rarityFilter
    return matchesSearch && matchesRarity
  })

  return (
    <div className="min-h-screen bg-background">
      <Navigation user={user} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">My Collection</h1>
          <p className="text-muted-foreground">{cards.length} cards owned</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Search cards..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={rarityFilter} onValueChange={setRarityFilter}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filter by rarity" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Rarities</SelectItem>
              <SelectItem value="Common">Common</SelectItem>
              <SelectItem value="Rare">Rare</SelectItem>
              <SelectItem value="Super Rare">Super Rare</SelectItem>
              <SelectItem value="Ultra Rare">Ultra Rare</SelectItem>
              <SelectItem value="Secret Rare">Secret Rare</SelectItem>
              <SelectItem value="Ultimate Rare">Ultimate Rare</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {filteredCards.length === 0 ? (
          <Card className="p-12 text-center">
            <p className="text-lg text-muted-foreground">No cards found</p>
          </Card>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
            {filteredCards.map((card, idx) => (
              <div
                key={card.key}
                className="cursor-pointer group flex flex-col items-center"
                onClick={() => {
                  setSelectedCard(card);
                  setShowCopiesDialog(true);
                }}
              >
                <div
                  className="relative w-full bg-gradient-to-br from-primary/10 to-purple-500/10 rounded-lg overflow-hidden shadow-md border border-border group-hover:border-primary transition-colors"
                  style={{ aspectRatio: '813/1185' }}
                >
                  {card.imageUrl && (
                    <img
                      src={card.imageUrl}
                      alt={card.name}
                      className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform"
                      loading="lazy"
                    />
                  )}
                </div>
                <div className="w-full flex flex-col items-center mt-2">
                  <span className="font-semibold text-sm text-center truncate w-full" title={card.name}>{card.name}</span>
                  <span className="text-xs text-muted-foreground mt-1">x{card.count}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Main Card Dialog removed: open Manage Copies directly */}

      {/* Copies Dialog: show all owned copies for this card */}
      <Dialog open={showCopiesDialog} onOpenChange={setShowCopiesDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Manage Copies</DialogTitle>
            <DialogDescription>Dust or mark for sale individual copies. You must keep at least 3.</DialogDescription>
          </DialogHeader>
          {selectedCard && selectedCard.copies && (
            <GroupedCopiesDialog
              copies={selectedCard.copies}
              minKeep={3}
              dustError={dustError}
              dustSuccess={dustSuccess}
              setDustError={setDustError}
              setDustSuccess={setDustSuccess}
              setDusting={setDusting}
              dusting={dusting}
              setSelectedCard={setSelectedCard}
              setCards={setCards}
              setUser={setUser}
              cardCode={selectedCard.cardCode}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

const RARITY_ORDER = [
  "Ultimate Rare",
  "Secret Rare",
  "Ultra Rare",
  "Super Rare",
  "Rare",
  "Common",
];

function groupCopies(copies: any[]) {
  const map = new Map();
  for (const copy of copies) {
    const key = [copy.rarity, copy.dustValue, copy.originalOwner, copy.packName].join("|");
    if (!map.has(key)) {
      map.set(key, { ...copy, ids: [copy._id], count: 1, key });
    } else {
      const g = map.get(key);
      g.ids.push(copy._id);
      g.count++;
    }
  }
  return Array.from(map.values()).sort(
    (a, b) => RARITY_ORDER.indexOf(a.rarity) - RARITY_ORDER.indexOf(b.rarity)
  );
}

function GroupedCopiesDialog({ copies, minKeep, dustError, dustSuccess, setDustError, setDustSuccess, setDusting, dusting, setSelectedCard, setCards, setUser, cardCode }: any) {
  const [dustDialog, setDustDialog] = useState<{ group: any, open: boolean }>({ group: null, open: false });
  const dustInputRef = useRef<HTMLInputElement>(null);

  const handleDustGroup = async (group: any, quantity: number) => {
    setDusting(group.key);
    setDustError(null);
    setDustSuccess(null);
    try {
      const ids = group.ids.slice(0, quantity);
      const res = await fetch("/api/collection/dust", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cardIds: ids }),
      });
      const data = await res.json();
      if (res.ok) {
        setDustSuccess(`Dusted ${quantity} for ${group.dustValue * quantity} credits!`);
        setSelectedCard((prev: any) => ({
          ...prev,
          copies: prev.copies.filter((c: any) => !ids.includes(c._id)),
          count: prev.count - quantity,
        }));
        setCards((prev: any[]) => prev.map((c: any) =>
          c.cardCode === cardCode
            ? { ...c, count: c.count - quantity, copies: c.copies.filter((c2: any) => !ids.includes(c2._id)) }
            : c
        ));
        setUser((prev: any) => ({
          ...prev,
          credits: (prev.credits || 0) + (group.dustValue || 0) * quantity,
        }));
        setDustDialog({ group: null, open: false });
      } else {
        setDustError(data.error || "Failed to dust cards.");
      }
    } catch (e) {
      setDustError("Failed to dust cards.");
    } finally {
      setDusting(null);
    }
  };

  const grouped = groupCopies(copies);

  return (
    <div className="space-y-4 max-h-96 overflow-y-auto">
      {dustError && <div className="text-red-500 text-xs mb-2">{dustError}</div>}
      {dustSuccess && <div className="text-green-600 text-xs mb-2">{dustSuccess}</div>}
      {grouped.map((group: any, idx: number) => {
        const maxDustable = Math.max(0, group.count - minKeep);
        return (
          <Card key={group.ids.join("-") || idx} className="p-3 flex flex-col gap-2">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">Rarity:</span> <Badge>{group.rarity}</Badge>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">Pack:</span> <span className="text-xs">{group.packName}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">Original Owner:</span> <span className="text-xs">{group.originalOwner}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">Dust Value:</span> <span className="text-xs">{group.dustValue}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">Quantity:</span> <span className="text-xs">x{group.count}</span>
                </div>
              </div>
              <div className="flex flex-row gap-2 mt-2 sm:mt-0">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={maxDustable === 0 || dusting === group.key}
                  onClick={() => setDustDialog({ group, open: true })}
                >
                  Dust
                </Button>
                <Button size="sm" variant="secondary">Mark for Sale</Button>
              </div>
            </div>
          </Card>
        );
      })}
      {/* Dust quantity dialog */}
      <Dialog open={dustDialog.open} onOpenChange={open => setDustDialog(d => ({ ...d, open }))}>
        <DialogContent className="max-w-xs">
          <DialogHeader>
            <DialogTitle>Dust Cards</DialogTitle>
            <DialogDescription>
              {dustDialog.group && (
                <>
                  How many <b>{dustDialog.group.rarity}</b> ({dustDialog.group.dustValue} dust) would you like to dust?
                  <br />
                  <span className="text-xs text-muted-foreground">You must keep at least {minKeep} copies. Max: {Math.max(0, dustDialog.group.count - minKeep)}</span>
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          {dustDialog.group && (
            <form
              onSubmit={e => {
                e.preventDefault();
                const maxDustable = Math.max(0, dustDialog.group.count - minKeep);
                const qty = Math.min(Number(dustInputRef.current?.value || 1), maxDustable);
                if (qty > 0 && qty <= maxDustable) {
                  handleDustGroup(dustDialog.group, qty);
                }
              }}
              className="flex flex-col gap-4"
            >
              <input
                ref={dustInputRef}
                type="number"
                min={1}
                max={Math.max(0, dustDialog.group.count - minKeep)}
                defaultValue={Math.max(1, dustDialog.group.count - minKeep)}
                className="border rounded px-2 py-1 text-center text-sm"
                disabled={dusting || (dustDialog.group.count - minKeep) === 0}
              />
              <Button type="submit" disabled={dusting || (dustDialog.group.count - minKeep) === 0}>
                {dusting ? "Dusting..." : `Dust ${dustDialog.group.dustValue} × N`}
              </Button>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}