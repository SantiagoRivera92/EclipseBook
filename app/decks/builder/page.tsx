"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Navigation } from "@/components/layout/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Search, Save, ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function DeckBuilderPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [deckName, setDeckName] = useState("New Deck")
  const [searchQuery, setSearchQuery] = useState("")
  const [mainDeck, setMainDeck] = useState<any[]>([])
  const [extraDeck, setExtraDeck] = useState<any[]>([])
  const [sideDeck, setSideDeck] = useState<any[]>([])
  const [allCards, setAllCards] = useState<any[]>([])

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [userRes, cardsRes] = await Promise.all([
          fetch("/api/user/profile"),
          fetch("/api/collection"),
        ])
        console.log(cardsRes)
        if (userRes.ok) setUser(await userRes.json())
        if (cardsRes.ok) setAllCards(await cardsRes.json())
      } catch (error) {
        console.error("Failed to fetch data:", error)
      }
    }

    fetchData()
  }, [router])

  const handleSave = async () => {
    try {
      const res = await fetch("/api/decks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: deckName,
          mainDeck: mainDeck.map((c) => c._id),
          extraDeck: extraDeck.map((c) => c._id),
          sideDeck: sideDeck.map((c) => c._id),
        }),
      })

      if (res.ok) {
        router.push("/decks")
      }
    } catch (error) {
      console.error("Failed to save deck:", error)
    }
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation user={user} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Link href="/decks">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <Input
              value={deckName}
              onChange={(e) => setDeckName(e.target.value)}
              className="text-2xl font-bold border-none bg-transparent px-0 h-auto"
              placeholder="Deck Name"
            />
          </div>
          <Button onClick={handleSave} className="gap-2">
            <Save className="h-4 w-4" />
            Save Deck
          </Button>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card>
              <CardContent className="p-6">
                <div className="relative mb-4">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search cards..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 max-h-[600px] overflow-y-auto">
                  {allCards
                    .filter((card) => card.name.toLowerCase().includes(searchQuery.toLowerCase()))
                    .map((card, i) => (
                      <div
                        key={card._id + "" + i}
                        className="cursor-pointer hover:scale-105 transition-transform"
                        onClick={() => {
                          if (card.type === "Extra Deck" && extraDeck.length < 15) {
                            setExtraDeck([...extraDeck, card])
                          } else if (mainDeck.length < 60) {
                            setMainDeck([...mainDeck, card])
                          }
                        }}
                      >
                        <div className="aspect-[2/3] bg-gradient-to-br from-primary/10 to-purple-500/10 rounded-lg flex items-center justify-center border-2 border-border hover:border-primary">
                          {card.imageUrl && (
                            <img
                              src={card.imageUrl}
                              alt={card.name}
                              className="max-h-full max-w-full object-contain"
                              loading="lazy"
                            />
                          )}
                        </div>
                        <p className="text-xs mt-1 truncate text-center">{card.name}</p>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-4">
            <Card>
              <CardContent className="p-4">
                <Tabs defaultValue="main">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="main">
                      Main
                      <Badge variant="secondary" className="ml-2">
                        {mainDeck.length}
                      </Badge>
                    </TabsTrigger>
                    <TabsTrigger value="extra">
                      Extra
                      <Badge variant="secondary" className="ml-2">
                        {extraDeck.length}
                      </Badge>
                    </TabsTrigger>
                    <TabsTrigger value="side">
                      Side
                      <Badge variant="secondary" className="ml-2">
                        {sideDeck.length}
                      </Badge>
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="main" className="mt-4 space-y-2 max-h-[500px] overflow-y-auto">
                    {mainDeck.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-8">No cards in main deck</p>
                    ) : (
                      mainDeck.map((card, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-2 bg-secondary rounded hover:bg-secondary/80 cursor-pointer"
                          onClick={() => setMainDeck(mainDeck.filter((_, i) => i !== index))}
                        >
                          <span className="text-sm truncate">{card.name}</span>
                        </div>
                      ))
                    )}
                  </TabsContent>

                  <TabsContent value="extra" className="mt-4 space-y-2 max-h-[500px] overflow-y-auto">
                    {extraDeck.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-8">No cards in extra deck</p>
                    ) : (
                      extraDeck.map((card, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-2 bg-secondary rounded hover:bg-secondary/80 cursor-pointer"
                          onClick={() => setExtraDeck(extraDeck.filter((_, i) => i !== index))}
                        >
                          <span className="text-sm truncate">{card.name}</span>
                        </div>
                      ))
                    )}
                  </TabsContent>

                  <TabsContent value="side" className="mt-4 space-y-2 max-h-[500px] overflow-y-auto">
                    {sideDeck.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-8">No cards in side deck</p>
                    ) : (
                      sideDeck.map((card, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-2 bg-secondary rounded hover:bg-secondary/80 cursor-pointer"
                          onClick={() => setSideDeck(sideDeck.filter((_, i) => i !== index))}
                        >
                          <span className="text-sm truncate">{card.name}</span>
                        </div>
                      ))
                    )}
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
