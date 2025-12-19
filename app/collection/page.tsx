"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Navigation } from "@/components/layout/navigation"
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"
import { CardGrid } from "@/components/collection/card-grid"
import { CardActionsDialog } from "@/components/collection/card-actions-dialog"
import { PageHeader } from "@/components/shared/page-header"
import { LoadingSpinner } from "@/components/shared/loading-spinner"

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

  const filteredCards = groupCards(cards).filter((card) => {
    const matchesSearch = card.name.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesSearch
  })

  const totalCards = cards.reduce((sum, card) => sum + card.count, 0)

  return (
    <div className="min-h-screen bg-background">
      <Navigation user={user} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <PageHeader title="My Collection" description={`${totalCards} cards owned`} />

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
