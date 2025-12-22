"use client"

import type React from "react"
import { useEffect, useState, useCallback, useMemo } from "react"
import { Navigation } from "@/components/layout/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Save, Trash2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { SearchSidebar } from "@/components/decks/builder/search-sidebar"
import { DeckGrid } from "@/components/decks/builder/deck-grid"
import { isExtraDeckCard, type Card, type DeckSection, type FilterState } from "@/components/decks/builder/types"
import { DndContext, DragOverlay, closestCorners, type DragStartEvent, type DragEndEvent } from "@dnd-kit/core"
import { arrayMove } from "@dnd-kit/sortable"
import { cn } from "@/lib/utils"

export default function DeckBuilderPage() {
  const [user, setUser] = useState<any>(null)
  const [deckName, setDeckName] = useState("New Deck")
  const [searchQuery, setSearchQuery] = useState("")
  const [isSaving, setIsSaving] = useState(false)
  const { toast } = useToast()
  const [filters, setFilters] = useState<FilterState>({
    cardType: null,
    monsterCardType: null,
    race: null,
    monsterType: null,
    attribute: null,
    spellType: null,
    trapType: null,
    level: null,
    atk: "",
    def: "",
  })

  const [mainDeck, setMainDeck] = useState<Card[]>([])
  const [extraDeck, setExtraDeck] = useState<Card[]>([])
  const [sideDeck, setSideDeck] = useState<Card[]>([])
  const [allCards, setAllCards] = useState<Card[]>([])
  const [activeDragCard, setActiveDragCard] = useState<Card | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [userRes, cardsRes] = await Promise.all([fetch("/api/user/profile"), fetch("/api/collection")])
        if (userRes.ok) setUser(await userRes.json())
        if (cardsRes.ok) {
          const cards = await cardsRes.json()
          setAllCards(cards.map((c: any) => ({ ...c, ownedCount: c.count })))
        }
      } catch (error) {
        console.error("[v0] Fetch error:", error)
      }
    }
    fetchData()
  }, [])

  const handleSaveDeck = async () => {
    if (mainDeck.length < 40) {
      toast({
        variant: "destructive",
        title: "Invalid deck",
        description: "Main Deck must contain at least 40 cards.",
      })
      return
    }

    setIsSaving(true)
    try {
      const response = await fetch("/api/decks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: deckName,
          mainDeck: mainDeck.map((c) => c.cardCode),
          extraDeck: extraDeck.map((c) => c.cardCode),
          sideDeck: sideDeck.map((c) => c.cardCode),
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to save deck")
      }

      toast({
        title: "Deck saved!",
        description: `"${deckName}" has been saved successfully.`,
      })
      window.location.href = "/decks"
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Failed to save",
        description: error instanceof Error ? error.message : "An error occurred while saving the deck.",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleCardInteraction = useCallback(
    (e: React.MouseEvent, card: Card, source: DeckSection, index?: number) => {
      e.preventDefault()

      if (e.type === "contextmenu") {
        if (source === "search") {
          if (e.shiftKey || e.altKey) {
            addToSection(card, "side")
          } else {
            addToSection(card, isExtraDeckCard(card.type) ? "extra" : "main")
          }
        } else {
          removeFromSource(source, index!)
        }
        return
      }

      if (source === "search") {
        addToSection(card, isExtraDeckCard(card.type) ? "extra" : "main")
      } else {
        removeFromSource(source, index!)
      }
    },
    [mainDeck, extraDeck, sideDeck],
  )

  const addToSection = (card: Card, target: DeckSection) => {
    const currentCount = [...mainDeck, ...extraDeck, ...sideDeck].filter((c) => c.cardCode === card.cardCode).length
    if (currentCount >= 3)
      return toast({
        variant: "destructive",
        title: "Card limit reached",
        description: "You can only have up to 3 copies of a card in your deck.",
      })

    if (currentCount >= (card.ownedCount || 0)) {
      return toast({
        variant: "destructive",
        title: "Ownership limit reached",
        description: `You own only ${card.ownedCount} of this card.`,
      })
    }

    if (target === "main") {
      if (mainDeck.length >= 60)
        return toast({
          variant: "destructive",
          title: "Main Deck is full",
          description: "You cannot add more than 60 cards to the Main Deck.",
        })
      setMainDeck((prev) => [...prev, card])
    } else if (target === "extra") {
      if (!isExtraDeckCard(card.type))
        return toast({
          variant: "destructive",
          title: "Invalid card type",
          description: "Only Extra Deck cards are allowed in the Extra Deck.",
        })
      if (extraDeck.length >= 15)
        return toast({
          variant: "destructive",
          title: "Extra Deck is full",
          description: "You cannot add more than 15 cards to the Extra Deck.",
        })
      setExtraDeck((prev) => [...prev, card])
    } else if (target === "side") {
      if (sideDeck.length >= 15)
        return toast({
          variant: "destructive",
          title: "Side Deck is full",
          description: "You cannot add more than 15 cards to the Side Deck.",
        })
      setSideDeck((prev) => [...prev, card])
    }
  }

  const handleDragStart = (event: DragStartEvent) => {
    const { card } = event.active.data.current as any
    setActiveDragCard(card)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveDragCard(null)
    const { active, over } = event
    if (!over) return

    const activeData = active.data.current as any
    const overData = over.data.current as any

    if (!activeData) return

    const card = activeData.card as Card
    const sourceSection = activeData.section as DeckSection
    const sourceIndex = activeData.index as number

    let targetSection = overData?.section as DeckSection
    const targetIndex = overData?.index as number | undefined

    if (over.id && typeof over.id === "string" && over.id.startsWith("droppable-")) {
      targetSection = over.id.replace("droppable-", "") as DeckSection
    }

    if (!targetSection) return

    if (sourceSection === targetSection && targetIndex !== undefined && sourceIndex !== targetIndex) {
      if (sourceSection === "main") {
        setMainDeck((prev) => arrayMove(prev, sourceIndex, targetIndex))
      } else if (sourceSection === "extra") {
        setExtraDeck((prev) => arrayMove(prev, sourceIndex, targetIndex))
      } else if (sourceSection === "side") {
        setSideDeck((prev) => arrayMove(prev, sourceIndex, targetIndex))
      }
      return
    }

    if (sourceSection === "search") {
      const currentCount = [...mainDeck, ...extraDeck, ...sideDeck].filter((c) => c.cardCode === card.cardCode).length

      if (currentCount >= 3) {
        toast({
          variant: "destructive",
          title: "Card limit reached",
          description: "You can only have up to 3 copies of a card in your deck.",
        })
        return
      }

      if (currentCount >= (card.ownedCount || 0)) {
        toast({
          variant: "destructive",
          title: "Ownership limit reached",
          description: `You own only ${card.ownedCount} of this card.`,
        })
        return
      }

      if (targetSection === "main" && !isExtraDeckCard(card.type)) {
        if (mainDeck.length < 60) {
          setMainDeck((prev) => [...prev, card])
        }
      } else if (targetSection === "extra" && isExtraDeckCard(card.type)) {
        if (extraDeck.length < 15) {
          setExtraDeck((prev) => [...prev, card])
        }
      } else if (targetSection === "side") {
        if (sideDeck.length < 15) {
          setSideDeck((prev) => [...prev, card])
        }
      } else {
        if (targetSection === "main" && isExtraDeckCard(card.type)) {
          toast({
            variant: "destructive",
            title: "Invalid card type",
            description: "Extra Deck cards cannot be added to the Main Deck.",
          })
        } else if (targetSection === "extra" && !isExtraDeckCard(card.type)) {
          toast({
            variant: "destructive",
            title: "Invalid card type",
            description: "Only Extra Deck cards can be added to the Extra Deck.",
          })
        }
      }
      return
    }

    if (sourceSection !== targetSection) {
      if (targetSection === "main" && isExtraDeckCard(card.type)) {
        toast({
          variant: "destructive",
          title: "Invalid move",
          description: "Extra Deck cards cannot be moved to the Main Deck.",
        })
        return
      }

      if (targetSection === "extra" && !isExtraDeckCard(card.type)) {
        toast({
          variant: "destructive",
          title: "Invalid move",
          description: "Only Extra Deck cards can be moved to the Extra Deck.",
        })
        return
      }

      let moveSuccess = false

      if (targetSection === "main" && mainDeck.length < 60) {
        setMainDeck((prev) => [...prev, card])
        moveSuccess = true
      } else if (targetSection === "extra" && extraDeck.length < 15) {
        setExtraDeck((prev) => [...prev, card])
        moveSuccess = true
      } else if (targetSection === "side" && sideDeck.length < 15) {
        setSideDeck((prev) => [...prev, card])
        moveSuccess = true
      }

      if (moveSuccess) {
        removeFromSource(sourceSection, sourceIndex)
      } else {
        toast({
          variant: "destructive",
          title: "Deck is full",
          description: `Cannot move card - ${targetSection} deck has reached its maximum capacity.`,
        })
      }
    }
  }

  const removeFromSource = (source: DeckSection, index: number) => {
    if (source === "main") setMainDeck((prev) => prev.filter((_, i) => i !== index))
    else if (source === "extra") setExtraDeck((prev) => prev.filter((_, i) => i !== index))
    else if (source === "side") setSideDeck((prev) => prev.filter((_, i) => i !== index))
  }

  const filteredCards = useMemo(() => {
    if (searchQuery.length < 2) return []

    return allCards.filter((card) => {
      const matchName = card.name.toLowerCase().includes(searchQuery.toLowerCase())
      if (!matchName) return false

      if (filters.cardType === "Monster" && !(card.type & 0x1)) return false
      if (filters.cardType === "Spell" && !(card.type & 0x2)) return false
      if (filters.cardType === "Trap" && !(card.type & 0x4)) return false

      if (filters.cardType === "Monster") {
        if (filters.attribute && card.attributeName !== filters.attribute) return false
        if (filters.level && card.level !== filters.level) return false
        if (filters.race && card.raceName !== filters.race) return false
        if (filters.atk && (card.attack === undefined || card.attack < Number.parseInt(filters.atk))) return false
        if (filters.def && (card.defense === undefined || card.defense < Number.parseInt(filters.def))) return false

        if (filters.monsterCardType) {
          if (filters.monsterCardType === "Fusion" && !(card.type & 0x40)) return false
          if (filters.monsterCardType === "Synchro" && !(card.type & 0x2000)) return false
          if (filters.monsterCardType === "Xyz" && !(card.type & 0x800000)) return false
        }
      }

      return true
    })
  }, [allCards, searchQuery, filters])

  const cardsInDeckCount = useMemo(() => {
    const counts: Record<number, number> = {}
    ;[...mainDeck, ...extraDeck, ...sideDeck].forEach((card) => {
      counts[card.cardCode] = (counts[card.cardCode] || 0) + 1
    })
    return counts
  }, [mainDeck, extraDeck, sideDeck])

  if (!user) return <div className="min-h-screen bg-background flex items-center justify-center">Loading...</div>

  return (
    <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd} collisionDetection={closestCorners}>
      <div className="min-h-screen bg-background text-foreground font-sans">
        <Navigation user={user} />
        <main className="max-w-[1400px] mx-auto px-4 py-8">
          <div className="flex flex-col lg:flex-row gap-8 items-start">
            <SearchSidebar
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              filters={filters}
              onFilterChange={setFilters}
              filteredCards={filteredCards}
              onInteract={handleCardInteraction}
              cardsInDeckCount={cardsInDeckCount}
            />
            <div className="flex-1 w-full space-y-8">
              <div className="flex items-center justify-between gap-4 pb-4 border-b">
                <div className="space-y-1">
                  <Input
                    value={deckName}
                    onChange={(e) => setDeckName(e.target.value)}
                    className="bg-transparent border-none text-2xl font-bold h-auto focus-visible:ring-0 p-0 text-foreground placeholder:text-muted"
                  />
                  <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    <span className={cn(mainDeck.length < 40 && "text-destructive")}>Main: {mainDeck.length}/60</span>
                    <span>Extra: {extraDeck.length}/15</span>
                    <span>Side: {sideDeck.length}/15</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 text-xs font-bold uppercase tracking-tight"
                    onClick={() => {
                      setMainDeck([])
                      setExtraDeck([])
                      setSideDeck([])
                    }}
                  >
                    <Trash2 className="h-3.5 w-3.5 mr-1" /> Clear
                  </Button>
                  <Button
                    className="h-9 px-6 font-bold shadow-sm"
                    onClick={handleSaveDeck}
                    disabled={isSaving || mainDeck.length < 40}
                  >
                    <Save className="h-4 w-4 mr-2" /> {isSaving ? "Saving..." : "Save Deck"}
                  </Button>
                </div>
              </div>

              <div className="space-y-8">
                <DeckGrid
                  section="main"
                  title="Main Deck"
                  cards={mainDeck}
                  minCount={40}
                  maxCount={60}
                  onInteract={handleCardInteraction}
                />

                <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                  <DeckGrid
                    section="extra"
                    title="Extra Deck"
                    cards={extraDeck}
                    maxCount={15}
                    onInteract={handleCardInteraction}
                  />
                  <DeckGrid
                    section="side"
                    title="Side Deck"
                    cards={sideDeck}
                    maxCount={15}
                    onInteract={handleCardInteraction}
                  />
                </div>
              </div>
            </div>
          </div>
        </main>

        <DragOverlay>
          {activeDragCard && (
            <div className="w-20 aspect-[2/3] ring-2 ring-white rounded shadow-2xl overflow-hidden scale-110 rotate-3">
              <img
                src={
                  activeDragCard.imageUrl || `https://images.ygoprodeck.com/images/cards/${activeDragCard.cardCode}.jpg`
                }
                className="w-full h-full object-cover"
              />
            </div>
          )}
        </DragOverlay>
      </div>
    </DndContext>
  )
}
