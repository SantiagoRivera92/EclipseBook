"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Navigation } from "@/components/layout/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
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

  const filteredCards = cards.filter((card) => {
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
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {filteredCards.map((card) => (
              <div key={card._id} className="cursor-pointer group" onClick={() => setSelectedCard(card)}>
                <Card className="overflow-hidden hover:border-primary transition-colors">
                  <div className="aspect-[2/3] bg-gradient-to-br from-primary/10 to-purple-500/10 flex items-center justify-center">
                    <span className="text-5xl group-hover:scale-110 transition-transform">🃏</span>
                  </div>
                  <CardContent className="p-3">
                    <p className="font-semibold text-sm truncate">{card.name}</p>
                    <Badge variant="outline" className="mt-1 text-xs">
                      {card.rarity}
                    </Badge>
                    <p className="text-xs text-muted-foreground mt-1">x{card.count}</p>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        )}
      </main>

      <Dialog open={!!selectedCard} onOpenChange={() => setSelectedCard(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedCard?.name}</DialogTitle>
            <DialogDescription>Card Details</DialogDescription>
          </DialogHeader>

          {selectedCard && (
            <div className="space-y-4">
              <div className="aspect-[2/3] bg-gradient-to-br from-primary/10 to-purple-500/10 rounded-lg flex items-center justify-center">
                <span className="text-9xl">🃏</span>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Rarity:</span>
                  <Badge>{selectedCard.rarity}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Owned:</span>
                  <span className="font-semibold">{selectedCard.count}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">From Pack:</span>
                  <span className="font-semibold">{selectedCard.packName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Original Owner:</span>
                  <span className="font-semibold">{selectedCard.originalOwner}</span>
                </div>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" className="flex-1 bg-transparent">
                  <DollarSign className="h-4 w-4 mr-2" />
                  Sell
                </Button>
                <Button className="flex-1">Use in Deck</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
