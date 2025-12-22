"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList } from "@/components/ui/command"
import { Plus, X, Search } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { SLOT_RATIOS, AVERAGE_DUST_VALUE_PER_PACK } from "@/lib/constants"
import { CardImage } from "@/components/shared/card-image"

interface PackFormProps {
  selectedPackId: string | null
  packs: any[]
  onSuccess: () => void
  onSelectPack: (pack: any) => void
  onNewPack: () => void
  onDelete: () => void
}

export function PackForm({ selectedPackId, packs, onSuccess, onSelectPack, onNewPack, onDelete }: PackFormProps) {
  const { toast } = useToast()
  const [packName, setPackName] = useState("")
  const [packDescription, setPackDescription] = useState("")
  const [packHeaderImageUrl, setPackHeaderImageUrl] = useState("")
  const [cardPool, setCardPool] = useState<Array<{ code: number; name: string; rarities: string[] }>>([])
  const [cardSearchQuery, setCardSearchQuery] = useState("")
  const [cardSearchResults, setCardSearchResults] = useState<Array<{ code: number; name: string }>>([])
  const [selectedCard, setSelectedCard] = useState<{ code: number; name: string } | null>(null)
  const [newCardRarities, setNewCardRarities] = useState<string[]>([])
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [searchOffset, setSearchOffset] = useState(0)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [hasMoreResults, setHasMoreResults] = useState(false)
  const searchResultsLimit = 200
  const resultsListRef = useRef<HTMLDivElement>(null)

  const availableRarities = ["Common", "Rare", "Super Rare", "Ultra Rare", "Secret Rare", "Ultimate Rare"]

  // Count cards by rarity in the pool
  const rarityCounts = cardPool.reduce(
    (acc, card) => {
      card.rarities.forEach((rarity) => {
        acc[rarity] = (acc[rarity] || 0) + 1
      })
      return acc
    },
    {} as Record<string, number>,
  )

  // Load selected pack into form
  useEffect(() => {
    if (!selectedPackId) return
    const pack = packs.find((p) => p._id === selectedPackId)
    if (pack) {
      setPackName(pack.name)
      setPackDescription(pack.description)
      setPackHeaderImageUrl(pack.headerImageUrl || "")
      setCardPool(pack.cardPool.map((c: any) => ({ ...c, name: c.name || "" })))
    }
  }, [selectedPackId, packs])

  function startNewPack(){
    onNewPack()
    setPackName("")
    setPackDescription("")
    setPackHeaderImageUrl("")
    setCardPool([])
    setCardSearchQuery("")
    setCardSearchResults([])
    setSelectedCard(null)
    setNewCardRarities([])
  }

  // Search cards by name
  useEffect(() => {
    const searchCards = async () => {
      if (cardSearchQuery.length < 2) {
        setCardSearchResults([])
        setSearchOffset(0)
        setHasMoreResults(false)
        return
      }

      setSearchOffset(0)
      setHasMoreResults(false)

      try {
        const res = await fetch(
          `/api/cards/search?q=${encodeURIComponent(cardSearchQuery)}&limit=${searchResultsLimit}&offset=0`,
        )
        if (res.ok) {
          const results = await res.json()
          const poolCardCodes = new Set(cardPool.map((c) => c.code))
          const filteredResults = results.filter(
            (card: { code: number; name: string }) => !poolCardCodes.has(card.code),
          )
          setCardSearchResults(filteredResults)
          setHasMoreResults(results.length === searchResultsLimit)
        }
      } catch (error) {
        console.error("Failed to search cards:", error)
      }
    }

    const timeoutId = setTimeout(searchCards, 300)
    return () => clearTimeout(timeoutId)
  }, [cardSearchQuery, searchResultsLimit, cardPool])

  // Load more results when scrolling to bottom
  const loadMoreResults = useCallback(async () => {
    if (isLoadingMore || !hasMoreResults || cardSearchQuery.length < 2) {
      return
    }

    setIsLoadingMore(true)
    let currentOffset = searchOffset
    const poolCardCodes = new Set(cardPool.map((c) => c.code))
    let attempts = 0
    const maxAttempts = 10

    try {
      while (attempts < maxAttempts) {
        const nextOffset = currentOffset + searchResultsLimit
        const res = await fetch(
          `/api/cards/search?q=${encodeURIComponent(cardSearchQuery)}&limit=${searchResultsLimit}&offset=${nextOffset}`,
        )

        if (!res.ok) break

        const results = await res.json()

        if (results.length === 0) {
          setHasMoreResults(false)
          break
        }

        const filteredResults = results.filter((card: { code: number; name: string }) => !poolCardCodes.has(card.code))

        if (filteredResults.length > 0) {
          setCardSearchResults((prev) => [...prev, ...filteredResults])
          setSearchOffset(nextOffset)
          setHasMoreResults(results.length === searchResultsLimit)
          break
        } else if (results.length < searchResultsLimit) {
          setHasMoreResults(false)
          break
        } else {
          currentOffset = nextOffset
          attempts++
        }
      }

      if (attempts >= maxAttempts) {
        setHasMoreResults(false)
      }
    } catch (error) {
      console.error("Failed to load more cards:", error)
      setHasMoreResults(false)
    } finally {
      setIsLoadingMore(false)
    }
  }, [isLoadingMore, hasMoreResults, cardSearchQuery, searchOffset, searchResultsLimit, cardPool])

  // Handle scroll in the results dropdown
  useEffect(() => {
    const listElement = resultsListRef.current
    if (!listElement || !isSearchOpen) return

    const handleScroll = () => {
      const scrollBottom = listElement.scrollHeight - listElement.scrollTop - listElement.clientHeight

      if (scrollBottom < 50 && hasMoreResults && !isLoadingMore && cardSearchQuery.length >= 2) {
        loadMoreResults()
      }
    }

    listElement.addEventListener("scroll", handleScroll)
    return () => listElement.removeEventListener("scroll", handleScroll)
  }, [hasMoreResults, isLoadingMore, cardSearchQuery, isSearchOpen, loadMoreResults])

  const handleSelectCard = (card: { code: number; name: string }) => {
    setSelectedCard(card)
    setCardSearchQuery(card.name)
    setIsSearchOpen(false)
    setCardSearchResults([])
  }

  const handleAddCardToPool = () => {
    if (!selectedCard) {
      toast({
        title: "No card selected",
        description: "Please search and select a card first",
        variant: "destructive",
      })
      return
    }

    if (newCardRarities.length === 0) {
      toast({
        title: "No rarities selected",
        description: "Please select at least one rarity for this card",
        variant: "destructive",
      })
      return
    }

    if (cardPool.some((c) => c.code === selectedCard.code)) {
      toast({
        title: "Card already in pool",
        description: "This card is already in the card pool",
        variant: "destructive",
      })
      return
    }

    setCardPool([...cardPool, { code: selectedCard.code, name: selectedCard.name, rarities: [...newCardRarities] }])
    setSelectedCard(null)
    setCardSearchQuery("")
    setNewCardRarities([])
  }

  const handleRemoveCardFromPool = (index: number) => {
    setCardPool(cardPool.filter((_, i) => i !== index))
  }

  const handleToggleCardRarity = (rarity: string) => {
    if (newCardRarities.includes(rarity)) {
      setNewCardRarities(newCardRarities.filter((r) => r !== rarity))
    } else {
      setNewCardRarities([...newCardRarities, rarity])
    }
  }

  const handleCreatePack = async () => {
    if (!packName.trim()) {
      toast({
        title: "Missing pack name",
        description: "Please enter a pack name",
        variant: "destructive",
      })
      return
    }

    if (cardPool.length === 0) {
      toast({
        title: "Empty card pool",
        description: "Please add at least one card to the card pool",
        variant: "destructive",
      })
      return
    }

    for (const slotRatio of SLOT_RATIOS) {
      const hasCard = cardPool.some((card) => card.rarities.includes(slotRatio.rarity))
      if (!hasCard) {
        toast({
          title: "Missing cards for rarity",
          description: `No cards found for rarity "${slotRatio.rarity}" in card pool`,
          variant: "destructive",
        })
        return
      }
    }

    try {
      const method = selectedPackId ? "PUT" : "POST"
      const res = await fetch("/api/admin/packs", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...(selectedPackId ? { _id: selectedPackId } : {}),
          name: packName,
          description: packDescription,
          headerImageUrl: packHeaderImageUrl.trim() || undefined,
          price: 30,
          cardPool: cardPool.map((card) => ({ code: card.code, rarities: card.rarities, name: card.name })),
        }),
      })
      const data = await res.json()
      if (res.ok) {
        toast({
          title: selectedPackId ? "Pack updated" : "Pack created",
          description: `${packName} has been ${selectedPackId ? "updated" : "created"} successfully`,
        })
        onSuccess()
      } else {
        toast({
          title: "Error",
          description: data.error || `Failed to ${selectedPackId ? "update" : "create"} pack`,
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error(`Failed to ${selectedPackId ? "update" : "create"} pack:`, error)
      toast({
        title: "Error",
        description: `Failed to ${selectedPackId ? "update" : "create"} pack`,
        variant: "destructive",
      })
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Pack Information</CardTitle>
              <CardDescription>Basic information about the pack</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="secondary" size="sm" onClick={startNewPack} disabled={!selectedPackId}>
                New
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Existing Packs</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {packs.map((pack) => (
                <Button
                  key={pack._id}
                  variant={selectedPackId === pack._id ? "default" : "outline"}
                  size="sm"
                  onClick={() => onSelectPack(pack)}
                >
                  {pack.name}
                </Button>
              ))}
            </div>
          </div>
          <div>
            <Label htmlFor="pack-name">Pack Name</Label>
            <Input
              id="pack-name"
              placeholder="e.g., Starter Pack"
              value={packName}
              onChange={(e) => setPackName(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="pack-description">Description</Label>
            <Textarea
              id="pack-description"
              placeholder="Describe this pack..."
              value={packDescription}
              onChange={(e) => setPackDescription(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="pack-header-image">Header Image URL</Label>
            <Input
              id="pack-header-image"
              placeholder="https://example.com/image.jpg"
              value={packHeaderImageUrl}
              onChange={(e) => setPackHeaderImageUrl(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Card Pool</CardTitle>
          <CardDescription>Add cards that can appear in this pack</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="card-search">Search Cards</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="card-search"
                placeholder="Search by card name..."
                value={cardSearchQuery}
                onChange={(e) => {
                  setCardSearchQuery(e.target.value)
                  setIsSearchOpen(e.target.value.length >= 2)
                }}
                onFocus={() => setIsSearchOpen(cardSearchQuery.length >= 2)}
                className="pl-10"
              />
              {isSearchOpen && cardSearchResults.length > 0 && (
                <Command className="absolute top-full left-0 right-0 mt-1 z-50 border shadow-md bg-popover">
                  <CommandList ref={resultsListRef} className="max-h-60">
                    <CommandEmpty>No cards found</CommandEmpty>
                    <CommandGroup>
                      {cardSearchResults.map((card) => (
                        <CommandItem key={card.code} onSelect={() => handleSelectCard(card)}>
                          {card.name}
                        </CommandItem>
                      ))}
                      {isLoadingMore && <div className="p-2 text-center text-sm">Loading more...</div>}
                    </CommandGroup>
                  </CommandList>
                </Command>
              )}
            </div>
          </div>

          {selectedCard && (
            <div className="space-y-2 p-3 border rounded-lg bg-muted/50">
              <div className="flex items-center justify-between">
                <span className="font-semibold">{selectedCard.name}</span>
                <Button variant="ghost" size="sm" onClick={() => setSelectedCard(null)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div>
                <Label>Select Rarities</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {availableRarities.map((rarity) => (
                    <Badge
                      key={rarity}
                      variant={newCardRarities.includes(rarity) ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => handleToggleCardRarity(rarity)}
                    >
                      {rarity}
                    </Badge>
                  ))}
                </div>
              </div>
              <Button onClick={handleAddCardToPool} size="sm" className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Add to Pool
              </Button>
            </div>
          )}

          {cardPool.length > 0 && (
            <div className="space-y-2">
              <Label>Cards in Pool ({cardPool.length})</Label>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
                {cardPool.map((card, index) => (
                  <div key={index} className="relative group border rounded-lg p-2 flex flex-col items-center bg-background">
                    <CardImage
                      name={card.name}
                      imageUrl={`https://images.ygoprodeck.com/images/cards/${card.code}.jpg`}
                      rarities={card.rarities.map((rarity: string) => ({ rarity, count: 1, dustValue: 0 }))}
                      className="w-full"
                      aspectRatio="813/1185"
                    />
                    <div className="mt-2 flex flex-wrap gap-1 justify-center">
                      {card.rarities.map((rarity: string) => (
                        <Badge key={rarity} variant="secondary" className="text-xs">
                          {rarity}
                        </Badge>
                      ))}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveCardFromPool(index)}
                      className="absolute top-1 right-1 opacity-70 group-hover:opacity-100"
                      aria-label="Remove card"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {cardPool.length > 0 && (
            <div className="space-y-2 pt-2 border-t">
              <Label>Rarity Distribution</Label>
              <div className="grid grid-cols-2 gap-2 text-sm">
                {availableRarities.map((rarity) => (
                  <div key={rarity} className="flex justify-between">
                    <span className="text-muted-foreground">{rarity}:</span>
                    <span className="font-semibold">{rarityCounts[rarity] || 0} cards</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex gap-2">
        <Button onClick={handleCreatePack} className="flex-1">
          {selectedPackId ? "Update Pack" : "Create Pack"}
        </Button>
        {selectedPackId && (
          <Button variant="destructive" onClick={onDelete}>
            Delete Pack
          </Button>
        )}
      </div>
    </div>
  )
}
