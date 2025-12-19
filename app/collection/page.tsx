"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Navigation } from "@/components/layout/navigation"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Search } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { log } from "console"

export default function CollectionPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [cards, setCards] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCard, setSelectedCard] = useState<any>(null)
  const [showCopiesDialog, setShowCopiesDialog] = useState(false)
  const [loading, setLoading] = useState(true)

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

  // Group cards by cardCode only (all rarities together)
  function groupCards(cards: any[]) {
    return cards.reduce((acc: any[], card) => {
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

  function updateSelectedCard(cardCode: number) {
    const grouped = groupCards(cards)
    const found = grouped.find((g) => g.cardCode === cardCode)
    console.log(found)
    setSelectedCard(found || null)
  }

  const filteredCards = groupCards(cards).filter((card) => {
    const matchesSearch = card.name.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesSearch
  })

  const totalCards = cards.reduce((sum, card) => sum + card.count, 0)

  return (
    <div className="min-h-screen bg-background">
      <Navigation user={user} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">My Collection</h1>
          <p className="text-muted-foreground">{totalCards} cards owned</p>
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
                  setSelectedCard(card)
                  setShowCopiesDialog(true)
                }}
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
        )}
      </main>

      {/* Copies Dialog: show all owned rarities for this card */}
      <Dialog open={showCopiesDialog} onOpenChange={setShowCopiesDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Manage Copies - {selectedCard?.name}</DialogTitle>
            <DialogDescription>Dust or sell individual rarities</DialogDescription>
          </DialogHeader>
          {selectedCard && (
            (() => {
              // Always get the freshest rarities from grouped cards
              const latestGrouped = groupCards(cards).find((g) => g.cardCode === selectedCard.cardCode)
              if (!latestGrouped) return null
              return (
                <RaritiesDialog
                  cardCode={latestGrouped.cardCode}
                  cardName={latestGrouped.name}
                  rarities={latestGrouped.rarities}
                  setCards={setCards}
                  setUser={setUser}
                  setShowCopiesDialog={setShowCopiesDialog}
                  updateSelectedCard={updateSelectedCard}
                />
              )
            })()
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

function RaritiesDialog({
  cardCode,
  cardName,
  rarities,
  setCards,
  setUser,
  setShowCopiesDialog,
  updateSelectedCard,
}: {
  cardCode: number
  cardName: string
  rarities: any[]
  setCards: any
  setUser: any
  setShowCopiesDialog: any
  updateSelectedCard: (cardCode: number) => void
}) {
  const [dusting, setDusting] = useState(false)
  const [dustError, setDustError] = useState<string | null>(null)
  const [dustSuccess, setDustSuccess] = useState<string | null>(null)
  const [dustDialog, setDustDialog] = useState<{ rarity: any; open: boolean }>({ rarity: null, open: false })
  const [qty, setQty] = useState(1)

  const handleDust = async (rarity: any, quantity: number) => {
    setDusting(true)
    setDustError(null)
    setDustSuccess(null)

    try {
      const res = await fetch("/api/collection/dust", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cardCode, rarity: rarity.rarity, quantity }),
      })
      const data = await res.json()

      if (res.ok) {
        setDustSuccess(`Dusted ${quantity} ${rarity.rarity} for ${data.creditsEarned} credits!`)

        // Update cards state
        setCards((prev: any[]) => {
          const updated = prev
            .map((c: any) => {
              if (c.cardCode === cardCode && c.rarity === rarity.rarity) {
                const newCount = c.count - quantity
                if (newCount <= 0) return null
                return { ...c, count: newCount }
              }
              return c
            })
            .filter(Boolean)
          // Also update selectedCard with new rarities
          setTimeout(() => updateSelectedCard(cardCode), 0)
          return updated
        })

        // Fetch collection again to update properly
        const collectionRes = await fetch("/api/collection")
        if (collectionRes.ok) {
          const updatedCards = await collectionRes.json()
          setCards(updatedCards)
          console.log("Fetched updated collection after dusting")
          // Update selectedCard after fetching
          setTimeout(() => updateSelectedCard(cardCode), 0)
        }

        // Update user credits
        setUser((prev: any) => ({
          ...prev,
          credits: (prev.credits || 0) + data.creditsEarned,
        }))

        // Close dialog if all dusted
        if (rarity.count - quantity <= 0) {
          setDustDialog({ rarity: null, open: false })

          // Check if all rarities are gone
          const remainingRarities = rarities.filter((r) => {
            if (r.rarity === rarity.rarity) return r.count - quantity > 0
            return true
          })

          if (remainingRarities.length === 0) {
            setShowCopiesDialog(false)
          }
        }
      } else {
        setDustError(data.error || "Failed to dust cards")
      }
    } catch (error) {
      setDustError("Failed to dust cards")
    } finally {
      setDusting(false)
    }
  }

  return (
    <div className="space-y-4 max-h-96 overflow-y-auto">
      {dustError && <div className="text-red-500 text-xs mb-2">{dustError}</div>}
      {dustSuccess && <div className="text-green-600 text-xs mb-2">{dustSuccess}</div>}

      {rarities.map((rarity, idx) => (
        <Card key={`${rarity.rarity}-${idx}`} className="p-3 flex flex-col gap-2">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <Badge>{rarity.rarity}</Badge>
                <span className="text-xs text-muted-foreground">x{rarity.count}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Dust Value:</span>
                <span className="text-xs">{rarity.dustValue} per card</span>
              </div>
            </div>
            <div className="flex flex-row gap-2 mt-2 sm:mt-0">
              <Button
                size="sm"
                variant="outline"
                disabled={dusting || rarity.count === 0}
                onClick={() => {
                  setQty(Math.min(rarity.count, 1))
                  setDustDialog({ rarity, open: true })
                }}
              >
                Dust
              </Button>
              <Button size="sm" variant="secondary">
                Sell
              </Button>
            </div>
          </div>
        </Card>
      ))}

      {/* Dust quantity dialog */}
      <Dialog open={dustDialog.open} onOpenChange={(open) => setDustDialog((d) => ({ ...d, open }))}>
        <DialogContent className="max-w-xs">
          <DialogHeader>
            <DialogTitle>Dust Cards</DialogTitle>
            <DialogDescription>
              {dustDialog.rarity && (
                <>
                  How many <b>{dustDialog.rarity.rarity}</b> copies would you like to dust?
                  <br />
                  <span className="text-xs text-muted-foreground">
                    Dust value: {dustDialog.rarity.dustValue} per card. Max: {dustDialog.rarity.count}
                  </span>
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          {dustDialog.rarity && (
            <form
              onSubmit={(e) => {
                e.preventDefault()
                if (qty > 0 && qty <= dustDialog.rarity.count) {
                  handleDust(dustDialog.rarity, qty)
                }
              }}
              className="flex flex-col gap-4"
            >
              <input
                type="number"
                min={1}
                max={dustDialog.rarity.count}
                value={qty}
                onChange={(e) => {
                  const val = Number(e.target.value)
                  setQty(isNaN(val) ? 1 : val)
                }}
                className="border rounded px-2 py-1 text-center text-sm"
                disabled={dusting}
              />
              <Button type="submit" disabled={dusting || qty <= 0 || qty > dustDialog.rarity.count}>
                {dusting ? "Dusting..." : `Dust for ${dustDialog.rarity.dustValue * qty} Credits`}
              </Button>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
