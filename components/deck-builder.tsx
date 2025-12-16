"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "sonner"
import { Loader2, Trash2 } from "lucide-react"

interface DeckCard {
  cardCode: number
  count: number
}

interface Deck {
  _id?: string
  name: string
  mainDeck: DeckCard[]
  extraDeck: DeckCard[]
  sideDeck: DeckCard[]
}

export function DeckBuilder() {
  const [deck, setDeck] = useState<Deck>({
    name: "New Deck",
    mainDeck: [],
    extraDeck: [],
    sideDeck: [],
  })

  const [isSaving, setIsSaving] = useState(false)

  const mainDeckCount = deck.mainDeck.reduce((sum, card) => sum + card.count, 0)
  const extraDeckCount = deck.extraDeck.reduce((sum, card) => sum + card.count, 0)

  const addCard = (location: "mainDeck" | "extraDeck" | "sideDeck", cardCode: number) => {
    setDeck((prev) => {
      const updatedDeck = { ...prev }
      const deckArray = updatedDeck[location]

      const existing = deckArray.find((c) => c.cardCode === cardCode)
      if (existing && existing.count < 3) {
        existing.count += 1
      } else if (!existing) {
        deckArray.push({ cardCode, count: 1 })
      }

      return updatedDeck
    })
  }

  const removeCard = (location: "mainDeck" | "extraDeck" | "sideDeck", cardCode: number) => {
    setDeck((prev) => {
      const updatedDeck = { ...prev }
      const deckArray = updatedDeck[location]

      const index = deckArray.findIndex((c) => c.cardCode === cardCode)
      if (index > -1) {
        deckArray[index].count -= 1
        if (deckArray[index].count === 0) {
          deckArray.splice(index, 1)
        }
      }

      return updatedDeck
    })
  }

  const handleSaveDeck = async () => {
    if (!deck.name.trim()) {
      toast.error("Deck name required")
      return
    }

    setIsSaving(true)
    try {
      const url = deck._id ? `/api/decks/${deck._id}` : "/api/decks"
      const method = deck._id ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(deck),
      })

      const data = await response.json()

      if (!response.ok) {
        toast.error(data.error || "Failed to save deck")
        return
      }

      toast.success("Deck saved!")
      if (!deck._id) {
        setDeck({ ...deck, _id: data._id })
      }
    } catch (error) {
      toast.error("Failed to save deck")
      console.error(error)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Input value={deck.name} onChange={(e) => setDeck({ ...deck, name: e.target.value })} placeholder="Deck name" />
        <Button onClick={handleSaveDeck} disabled={isSaving}>
          {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save Deck
        </Button>
      </div>

      <Tabs defaultValue="main" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="main">
            Main Deck <span className="ml-2 text-xs">({mainDeckCount})</span>
          </TabsTrigger>
          <TabsTrigger value="extra">
            Extra Deck <span className="ml-2 text-xs">({extraDeckCount})</span>
          </TabsTrigger>
          <TabsTrigger value="side">Side Deck</TabsTrigger>
        </TabsList>

        <TabsContent value="main" className="space-y-4">
          <Card className="p-4">
            {deck.mainDeck.length === 0 ? (
              <p className="text-sm text-muted-foreground">No cards in main deck yet</p>
            ) : (
              <div className="space-y-2">
                {deck.mainDeck.map((card) => (
                  <div key={card.cardCode} className="flex items-center justify-between rounded bg-muted p-2">
                    <span className="text-sm font-medium">Card #{card.cardCode}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm">x{card.count}</span>
                      <Button size="sm" variant="ghost" onClick={() => removeCard("mainDeck", card.cardCode)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="extra" className="space-y-4">
          <Card className="p-4">
            {deck.extraDeck.length === 0 ? (
              <p className="text-sm text-muted-foreground">No cards in extra deck yet</p>
            ) : (
              <div className="space-y-2">
                {deck.extraDeck.map((card) => (
                  <div key={card.cardCode} className="flex items-center justify-between rounded bg-muted p-2">
                    <span className="text-sm font-medium">Card #{card.cardCode}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm">x{card.count}</span>
                      <Button size="sm" variant="ghost" onClick={() => removeCard("extraDeck", card.cardCode)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="side" className="space-y-4">
          <Card className="p-4">
            {deck.sideDeck.length === 0 ? (
              <p className="text-sm text-muted-foreground">No cards in side deck yet</p>
            ) : (
              <div className="space-y-2">
                {deck.sideDeck.map((card) => (
                  <div key={card.cardCode} className="flex items-center justify-between rounded bg-muted p-2">
                    <span className="text-sm font-medium">Card #{card.cardCode}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm">x{card.count}</span>
                      <Button size="sm" variant="ghost" onClick={() => removeCard("sideDeck", card.cardCode)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </TabsContent>
      </Tabs>

      {mainDeckCount < 40 && <p className="text-sm text-amber-600">Main deck needs at least 40 cards</p>}
    </div>
  )
}
