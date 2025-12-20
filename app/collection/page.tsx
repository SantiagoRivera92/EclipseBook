"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Navigation } from "@/components/layout/navigation"
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { CardGrid } from "@/components/collection/card-grid"
import { CardActionsDialog } from "@/components/collection/card-actions-dialog"
import { PageHeader } from "@/components/shared/page-header"
import { LoadingSpinner } from "@/components/shared/loading-spinner"

const RARITY_ORDER = [
  "Ultimate Rare",
  "Secret Rare",
  "Ultra Rare",
  "Super Rare",
  "Rare",
  "Common",
]

export default function CollectionPage() {
  const [sortOption, setSortOption] = useState<'name' | 'rarity-high' | 'rarity-low'>('name')
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [cards, setCards] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCard, setSelectedCard] = useState<any>(null)
  const [showCopiesDialog, setShowCopiesDialog] = useState(false)
  const [loading, setLoading] = useState(true)

  const [massDustDialog, setMassDustDialog] = useState(false)
  // Remove massDustCount, we'll calculate on the fly
  const [confirmMassDust, setConfirmMassDust] = useState<null | 'keepcheap' | 'keepexpensive'>(null)
  const [massDusting, setMassDusting] = useState(false)
  const [massDustError, setMassDustError] = useState<string | null>(null)

  // Calculate how many cards and credits would be dusted if keeping 3 of each (helper)
  function calculateMassDustStats(priority: 'keepcheap' | 'keepexpensive') {
    // Group by cardCode, then by rarity
    const grouped = cards.reduce((acc: Record<number, any[]>, card) => {
      if (!acc[card.cardCode]) acc[card.cardCode] = []
      acc[card.cardCode].push(card)
      return acc
    }, {} as Record<number, any[]>)
    let totalCards = 0
    let totalCredits = 0
    Object.values(grouped).forEach((rarityList) => {
      // Sort rarities by priority
      rarityList.sort((a, b) => {
        const idxA = RARITY_ORDER.indexOf(a.rarity)
        const idxB = RARITY_ORDER.indexOf(b.rarity)
        return priority === 'keepexpensive' ? idxA - idxB : idxB - idxA
      })
      let keep = 3
      for (const r of rarityList) {
        if (keep > 0) {
          const toKeep = Math.min(r.count, keep)
          keep -= toKeep
          if (r.count > toKeep) {
            totalCards += r.count - toKeep
            totalCredits += (r.count - toKeep) * (r.dustValue || 0)
          }
        } else {
          totalCards += r.count
          totalCredits += r.count * (r.dustValue || 0)
        }
      }
    })
    return { totalCards, totalCredits }
  }

  // Mass dust handler
  const handleMassDust = async (priority: 'keepcheap' | 'keepexpensive') => {
    setMassDusting(true)
    setMassDustError(null)
    try {
      const res = await fetch(`/api/collection/dust/mass/${priority}`, { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to dust cards')
      // Refresh collection
      const collectionRes = await fetch("/api/collection")
      if (collectionRes.ok) {
        const updatedCards = await collectionRes.json()
        setCards(updatedCards)
      }
      setUser((prev: any) => ({ ...prev, credits: (prev.credits || 0) + (data.creditsEarned || 0) }))
      setMassDustDialog(false)
      setConfirmMassDust(null)
    } catch (e: any) {
      setMassDustError(e.message || 'Failed to dust cards')
    } finally {
      setMassDusting(false)
    }
  }

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
    setSelectedCard(found || null)
  }

  const handleDust = async (cardCode: number, rarity: string, quantity: number) => {
    const res = await fetch("/api/collection/dust", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cardCode, rarity, quantity }),
    })
    const data = await res.json()

    if (res.ok) {
      setCards((prev: any[]) => {
        const updated = prev
          .map((c: any) => {
            if (c.cardCode === cardCode && c.rarity === rarity) {
              const newCount = c.count - quantity
              if (newCount <= 0) return null
              return { ...c, count: newCount }
            }
            return c
          })
          .filter(Boolean)
        return updated
      })

      const collectionRes = await fetch("/api/collection")
      if (collectionRes.ok) {
        const updatedCards = await collectionRes.json()
        setCards(updatedCards)
      }

      setUser((prev: any) => ({
        ...prev,
        credits: (prev.credits || 0) + data.creditsEarned,
      }))
    } else {
      throw new Error(data.error || "Failed to dust cards")
    }
  }

  if (loading) {
    return <LoadingSpinner />
  }

  if (!user) return null

  let filteredCards = groupCards(cards).filter((card) => {
    const matchesSearch = card.name.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesSearch
  })

  // Sorting logic
  if (sortOption === 'name') {
    filteredCards = filteredCards.sort((a, b) => a.name.localeCompare(b.name))
  } else if (sortOption === 'rarity-high') {
    filteredCards = filteredCards.sort((a, b) => {
      // Highest rarity for each card
      const aHighest = a.rarities.reduce((prev, curr) => RARITY_ORDER.indexOf(curr.rarity) < RARITY_ORDER.indexOf(prev.rarity) ? curr : prev, a.rarities[0])
      const bHighest = b.rarities.reduce((prev, curr) => RARITY_ORDER.indexOf(curr.rarity) < RARITY_ORDER.indexOf(prev.rarity) ? curr : prev, b.rarities[0])
      return RARITY_ORDER.indexOf(aHighest.rarity) - RARITY_ORDER.indexOf(bHighest.rarity)
    })
  }

  const totalCards = cards.reduce((sum, card) => sum + card.count, 0)

  return (
    <div className="min-h-screen bg-background">
      <Navigation user={user} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <PageHeader title="My Collection" description={`${totalCards} cards owned`} />

        <div className="flex flex-col sm:flex-row gap-4 mb-6 items-center">
          <div className="flex flex-row w-full items-center">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Search cards..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="ml-4 flex items-center gap-2">
              <select
                value={sortOption}
                onChange={e => setSortOption(e.target.value as any)}
                className="border rounded px-2 py-1 text-sm bg-background"
              >
                <option value="name">Sort by Name</option>
                <option value="rarity-high">Sort by Highest Rarity</option>
              </select>
              <Button
                className="bg-red-600 hover:bg-red-700 text-white"
                onClick={() => setMassDustDialog(true)}
              >
                Dust all extra copies
              </Button>
            </div>
          </div>
        </div>

        {/* Mass Dust Dialog */}
        <Dialog open={massDustDialog} onOpenChange={open => { setMassDustDialog(open); setConfirmMassDust(null); setMassDustError(null); }}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Mass Dusting</DialogTitle>
              <DialogDescription>
                {(() => {
                  const keepCheap = calculateMassDustStats('keepcheap')
                  const keepExpensive = calculateMassDustStats('keepexpensive')
                  return (
                    <>
                      You can dust <b>{keepCheap.totalCards}</b> cards for <b>{keepCheap.totalCredits}</b> credits (keeping lowest rarity),
                      or <b>{keepExpensive.totalCredits}</b> credits (keeping highest rarity).<br />
                      Which rarities do you want to keep?
                    </>
                  )
                })()}
              </DialogDescription>
            </DialogHeader>
            {massDustError && <div className="text-red-500 text-xs mb-2">{massDustError}</div>}
            <div className="flex flex-col gap-3 mt-4">
              <Button
                variant="destructive"
                disabled={massDusting}
                onClick={() => setConfirmMassDust('keepcheap')}
              >
                Keep lowest rarity
              </Button>
              <Button
                variant="destructive"
                disabled={massDusting}
                onClick={() => setConfirmMassDust('keepexpensive')}
              >
                Keep highest rarity
              </Button>
              <Button
                variant="outline"
                onClick={() => setMassDustDialog(false)}
                disabled={massDusting}
              >
                Cancel
              </Button>
            </div>
            {/* Confirmation step */}
            {confirmMassDust && (() => {
              const stats = calculateMassDustStats(confirmMassDust)
              return (
                <div className="mt-6">
                  <div className="mb-2 text-sm">
                    Are you sure you want to dust <b>{stats.totalCards}</b> cards for <b>{stats.totalCredits}</b> credits and keep 3 of each card ({confirmMassDust === 'keepexpensive' ? 'prioritizing highest rarity' : 'prioritizing lowest rarity'})?
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setConfirmMassDust(null)}
                      disabled={massDusting}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="destructive"
                      disabled={massDusting}
                      onClick={async () => {
                        await handleMassDust(confirmMassDust)
                      }}
                      className="flex-1"
                    >
                      Confirm
                    </Button>
                  </div>
                </div>
              )
            })()}
          </DialogContent>
        </Dialog>

        <CardGrid
          cards={filteredCards}
          onCardClick={(card) => {
            setSelectedCard(card)
            setShowCopiesDialog(true)
          }}
        />
      </main>

      <CardActionsDialog
        open={showCopiesDialog}
        onOpenChange={setShowCopiesDialog}
        card={selectedCard ? groupCards(cards).find((g) => g.cardCode === selectedCard.cardCode) : null}
        onDust={handleDust}
        onUpdateCard={updateSelectedCard}
      />
    </div>
  )
}