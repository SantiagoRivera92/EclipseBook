"use client"

import { useEffect, useState, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Navigation } from "@/components/layout/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Shield, DollarSign, Package, Trophy, Plus, X, AlertCircle, Search } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList } from "@/components/ui/command"

export default function AdminPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  // Credit distribution state
  const [targetUser, setTargetUser] = useState("")
  const [creditAmount, setCreditAmount] = useState("")
  const [creditReason, setCreditReason] = useState("")

  // Pack management state
  const [packs, setPacks] = useState<any[]>([])
  const [selectedPackId, setSelectedPackId] = useState<string | null>(null)
  const [packName, setPackName] = useState("")
  const [packDescription, setPackDescription] = useState("")
  const [packPrice, setPackPrice] = useState("")
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
  const [slotRatios, setSlotRatios] = useState([
    { rarity: "Common", chance: 0.6, dv: 1 },
    { rarity: "Rare", chance: 0.2, dv: 3 },
    { rarity: "Super Rare", chance: 0.1, dv: 6 },
    { rarity: "Ultra Rare", chance: 0.075, dv: 8 },
    { rarity: "Secret Rare", chance: 0.02, dv: 30 },
    { rarity: "Ultimate Rare", chance: 0.005, dv: 120 },
  ])
  // Fetch all packs for editing
  useEffect(() => {
    if (!user) return;
    fetch("/api/admin/packs")
      .then(res => res.json())
      .then(data => setPacks(Array.isArray(data) ? data : []))
      .catch(() => setPacks([]))
  }, [user])

  // Load selected pack into form
  const handleSelectPack = (pack: any) => {
    setSelectedPackId(pack._id)
    setPackName(pack.name)
    setPackDescription(pack.description)
    setPackPrice(String(pack.price))
    setCardPool(pack.cardPool.map((c: any) => ({ ...c, name: c.name || "" })))
    setSlotRatios(pack.slotRatios)
  }

  // Reset form for new pack
  const handleNewPack = () => {
    setSelectedPackId(null)
    setPackName("")
    setPackDescription("")
    setPackPrice("")
    setCardPool([])
    setSlotRatios([
      { rarity: "Common", chance: 0.6, dv: 1 },
      { rarity: "Rare", chance: 0.2, dv: 3 },
      { rarity: "Super Rare", chance: 0.1, dv: 6 },
      { rarity: "Ultra Rare", chance: 0.075, dv: 8 },
      { rarity: "Secret Rare", chance: 0.02, dv: 30 },
      { rarity: "Ultimate Rare", chance: 0.005, dv: 120 },
    ])
  }

  // Delete pack
  const handleDeletePack = async () => {
    if (!selectedPackId) return;
    if (!window.confirm("Are you sure you want to delete this pack? This cannot be undone.")) return;
    const res = await fetch("/api/admin/packs", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ _id: selectedPackId }),
    })
    if (res.ok) {
      toast({ title: "Pack deleted" })
      setPacks(packs.filter(p => p._id !== selectedPackId))
      handleNewPack()
    } else {
      toast({ title: "Error", description: "Failed to delete pack", variant: "destructive" })
    }
  }

  const availableRarities = ["Common", "Rare", "Super Rare", "Ultra Rare", "Secret Rare", "Ultimate Rare"]

  // Calculate slot ratio total
  const slotRatioTotal = slotRatios.reduce((sum, r) => sum + r.chance, 0)
  const slotRatiosValid = Math.abs(slotRatioTotal - 1) < 0.0001

  // Calculate average dust value
  const averageDustValue = slotRatios.reduce((sum, r) => sum + r.chance * r.dv, 0) * 8
  const priceValid = packPrice ? Number.parseInt(packPrice) > averageDustValue : false

  // Count cards by rarity in the pool
  const rarityCounts = cardPool.reduce((acc, card) => {
    card.rarities.forEach((rarity) => {
      acc[rarity] = (acc[rarity] || 0) + 1
    })
    return acc
  }, {} as Record<string, number>)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const userRes = await fetch("/api/user/profile")

        if (userRes.ok) {
          const userData = await userRes.json()
          console.log(userData)
          if (!userData.isAdmin) {
            router.push("/")
            return
          }
          setUser(userData)
        }
      } catch (error) {
        console.error("Failed to fetch data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [router])

  const handleDistributeCredits = async (toAll: boolean) => {
    try {
      const res = await fetch("/api/admin/credits", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          targetAll: toAll,
          targetUserId: toAll ? undefined : targetUser,
          amount: Number.parseInt(creditAmount),
          reason: creditReason,
        }),
      })

      const data = await res.json()

      if (res.ok) {
        toast({
          title: "Credits distributed",
          description: toAll
            ? `Successfully distributed ${creditAmount} credits to ${data.affectedUsers} players`
            : `Successfully distributed ${creditAmount} credits`,
        })
        setTargetUser("")
        setCreditAmount("")
        setCreditReason("")
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to distribute credits",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Failed to distribute credits:", error)
      toast({
        title: "Error",
        description: "Failed to distribute credits",
        variant: "destructive",
      })
    }
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

      // Reset pagination when search query changes
      setSearchOffset(0)
      setHasMoreResults(false)

      try {
        const res = await fetch(
          `/api/cards/search?q=${encodeURIComponent(cardSearchQuery)}&limit=${searchResultsLimit}&offset=0`,
        )
        if (res.ok) {
          const results = await res.json()
          // Filter out cards that are already in the pool
          const poolCardCodes = new Set(cardPool.map((c) => c.code))
          const filteredResults = results.filter((card: { code: number; name: string }) => !poolCardCodes.has(card.code))
          setCardSearchResults(filteredResults)
          // If we got a full page, there might be more results
          setHasMoreResults(results.length === searchResultsLimit)
        }
      } catch (error) {
        console.error("Failed to search cards:", error)
      }
    }

    const timeoutId = setTimeout(searchCards, 300) // Debounce search
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
    const maxAttempts = 10 // Prevent infinite loops

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

        // Filter out cards that are already in the pool
        const filteredResults = results.filter((card: { code: number; name: string }) => !poolCardCodes.has(card.code))

        if (filteredResults.length > 0) {
          // Found some new cards, add them and stop
          setCardSearchResults((prev) => [...prev, ...filteredResults])
          setSearchOffset(nextOffset)
          setHasMoreResults(results.length === searchResultsLimit)
          break
        } else if (results.length < searchResultsLimit) {
          // Got less than a full page and all were filtered, no more results
          setHasMoreResults(false)
          break
        } else {
          // All results were filtered but we got a full page, try next page
          currentOffset = nextOffset
          attempts++
        }
      }

      if (attempts >= maxAttempts) {
        // Prevent infinite loops - stop trying if we've filtered too many pages
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

      // Load more when within 50px of bottom
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

    // Check if card already exists
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

  const handleUpdateSlotRatio = (index: number, field: "chance" | "dv", value: number) => {
    const updated = [...slotRatios]
    updated[index] = { ...updated[index], [field]: value }
    setSlotRatios(updated)
  }

  // Create or update pack
  const handleCreatePack = async () => {
    if (!packName.trim()) {
      toast({
        title: "Missing pack name",
        description: "Please enter a pack name",
        variant: "destructive",
      })
      return
    }

    if (!packPrice || Number.parseInt(packPrice) <= 0) {
      toast({
        title: "Invalid price",
        description: "Please enter a valid price",
        variant: "destructive",
      })
      return
    }

    if (!slotRatiosValid) {
      toast({
        title: "Invalid slot ratios",
        description: `Slot ratios must add up to exactly 1. Current total: ${slotRatioTotal.toFixed(4)}`,
        variant: "destructive",
      })
      return
    }

    if (!priceValid) {
      toast({
        title: "Invalid price",
        description: `Price must be greater than average dust value (${averageDustValue.toFixed(2)})`,
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

    // Validate that each rarity has at least one card
    for (const slotRatio of slotRatios) {
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
          price: Number.parseInt(packPrice),
          cardPool: cardPool.map((card) => ({ code: card.code, rarities: card.rarities })),
          slotRatios,
        }),
      })
      const data = await res.json()
      if (res.ok) {
        toast({
          title: selectedPackId ? "Pack updated" : "Pack created",
          description: `${packName} has been ${selectedPackId ? "updated" : "created"} successfully`,
        })
        handleNewPack()
        // Refresh pack list
        fetch("/api/admin/packs").then(res => res.json()).then(data => setPacks(Array.isArray(data) ? data : []))
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

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }
  if (!user) return null

  return (
    <div className="min-h-screen bg-background">
      <Navigation user={user} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 flex items-center gap-3">
          <Shield className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">Admin Panel</h1>
            <p className="text-muted-foreground">Manage EclipseBook</p>
          </div>
        </div>

        <Tabs defaultValue="credits" className="space-y-6">
          <TabsList>
            <TabsTrigger value="credits" className="gap-2">
              <DollarSign className="h-4 w-4" />
              Credits
            </TabsTrigger>
            <TabsTrigger value="packs" className="gap-2">
              <Package className="h-4 w-4" />
              Packs
            </TabsTrigger>
            <TabsTrigger value="tournaments" className="gap-2">
              <Trophy className="h-4 w-4" />
              Tournaments
            </TabsTrigger>
          </TabsList>

          <TabsContent value="credits">
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Give Credits to Specific Player</CardTitle>
                  <CardDescription>Award credits to an individual user</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="username">Username</Label>
                    <Input
                      id="username"
                      placeholder="Enter username"
                      value={targetUser}
                      onChange={(e) => setTargetUser(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="amount">Amount</Label>
                    <Input
                      id="amount"
                      type="number"
                      placeholder="100"
                      value={creditAmount}
                      onChange={(e) => setCreditAmount(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="reason">Reason</Label>
                    <Textarea
                      id="reason"
                      placeholder="Reason for awarding credits..."
                      value={creditReason}
                      onChange={(e) => setCreditReason(e.target.value)}
                    />
                  </div>
                  <Button className="w-full" onClick={() => handleDistributeCredits(false)}>
                    Give Credits
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Give Credits to All Players</CardTitle>
                  <CardDescription>Award credits to every user in the system</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="amount-all">Amount per Player</Label>
                    <Input
                      id="amount-all"
                      type="number"
                      placeholder="50"
                      value={creditAmount}
                      onChange={(e) => setCreditAmount(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="reason-all">Reason</Label>
                    <Textarea
                      id="reason-all"
                      placeholder="Reason for awarding credits..."
                      value={creditReason}
                      onChange={(e) => setCreditReason(e.target.value)}
                    />
                  </div>
                  <Button
                    className="w-full bg-transparent"
                    variant="outline"
                    onClick={() => handleDistributeCredits(true)}
                  >
                    Give to All Players
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="packs">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Pack Information</CardTitle>
                      <CardDescription>Basic information about the pack</CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="secondary" size="sm" onClick={handleNewPack} disabled={!selectedPackId}>New</Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Existing Packs</Label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {packs.map(pack => (
                        <Button
                          key={pack._id}
                          variant={selectedPackId === pack._id ? "default" : "outline"}
                          size="sm"
                          onClick={() => handleSelectPack(pack)}
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
                      placeholder="Enter pack name"
                      value={packName}
                      onChange={(e) => setPackName(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="pack-description">Description</Label>
                    <Textarea
                      id="pack-description"
                      placeholder="Describe the pack..."
                      value={packDescription}
                      onChange={(e) => setPackDescription(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="pack-price">Price (credits)</Label>
                    <Input
                      id="pack-price"
                      type="number"
                      placeholder="100"
                      value={packPrice}
                      onChange={(e) => setPackPrice(e.target.value)}
                    />
                    {packPrice && (
                      <p className="text-sm text-muted-foreground mt-1">
                        Average dust value: {averageDustValue.toFixed(2)} credits
                        {priceValid ? (
                          <span className="text-green-600 ml-2">✓ Valid</span>
                        ) : (
                          <span className="text-red-600 ml-2">
                            ✗ Price must be greater than {averageDustValue.toFixed(2)}
                          </span>
                        )}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Slot Ratios</CardTitle>
                  <CardDescription>
                    Configure the rarity distribution for pack openings. Total must equal exactly 1.0
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {slotRatios.map((ratio, index) => (
                    <div key={ratio.rarity} className="grid grid-cols-4 gap-4 items-end">
                      <div>
                        <Label>{ratio.rarity}</Label>
                        <Input value={ratio.rarity} disabled className="bg-muted" />
                      </div>
                      <div>
                        <Label>Chance (0-1)</Label>
                        <Input
                          type="number"
                          step="0.001"
                          min="0"
                          max="1"
                          value={ratio.chance}
                          onChange={(e) =>
                            handleUpdateSlotRatio(index, "chance", parseFloat(e.target.value) || 0)
                          }
                        />
                      </div>
                      <div>
                        <Label>Dust Value</Label>
                        <Input
                          type="number"
                          min="1"
                          value={ratio.dv}
                          onChange={(e) =>
                            handleUpdateSlotRatio(index, "dv", Number.parseInt(e.target.value) || 1)
                          }
                        />
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Expected: {(ratio.chance * ratio.dv * 8).toFixed(2)} credits
                      </div>
                    </div>
                  ))}
                  <div className="pt-2 border-t">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">Total:</span>
                      <span className={slotRatiosValid ? "text-green-600" : "text-red-600"}>
                        {slotRatioTotal.toFixed(4)}
                        {slotRatiosValid ? " ✓" : " ✗"}
                      </span>
                    </div>
                    {!slotRatiosValid && (
                      <Alert className="mt-2">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                          Slot ratios must add up to exactly 1.0. Current total: {slotRatioTotal.toFixed(4)}
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                </CardContent>
              </Card>
              {cardPool.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Card Pool Rarity Distribution</CardTitle>
                    <CardDescription>Current distribution of cards by rarity in the pool</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                      {slotRatios.map((ratio) => {
                        const count = rarityCounts[ratio.rarity] || 0
                        return (
                          <div
                            key={ratio.rarity}
                            className="flex flex-col items-center p-3 border rounded-lg bg-muted/50"
                          >
                            <div className="text-sm font-medium text-muted-foreground mb-1">{ratio.rarity}</div>
                            <div className="text-2xl font-bold">{count}</div>
                            <div className="text-xs text-muted-foreground mt-1">
                              {cardPool.length > 0
                                ? `${((count / cardPool.length) * 100).toFixed(1)}%`
                                : "0%"}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                    <div className="mt-4 pt-4 border-t">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Total cards in pool:</span>
                        <span className="font-semibold">{cardPool.length}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              <Card>
                <CardHeader>
                  <CardTitle>Card Pool</CardTitle>
                  <CardDescription>
                    Add cards to the pack. Each card must have at least one rarity that matches the slot ratios.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-4">
                    <div>
                      <Label>Search Card by Name</Label>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
                        <Input
                          placeholder="Search for a card by name..."
                          value={cardSearchQuery}
                          onChange={(e) => {
                            setCardSearchQuery(e.target.value)
                            setIsSearchOpen(true)
                          }}
                          onFocus={() => setIsSearchOpen(true)}
                          onBlur={(e) => {
                            // Delay closing to allow clicks on results
                            setTimeout(() => setIsSearchOpen(false), 200)
                          }}
                          className="pl-10"
                        />
                        {isSearchOpen && (cardSearchQuery.length >= 2 || cardSearchResults.length > 0) && (
                          <div className="absolute z-50 w-full mt-1 bg-popover border rounded-md shadow-md max-h-[400px] overflow-hidden flex flex-col">
                            <Command shouldFilter={false}>
                              <div
                                ref={resultsListRef}
                                className="max-h-[400px] overflow-y-auto"
                              >
                                <CommandList>
                                  {cardSearchResults.length === 0 ? (
                                    <CommandEmpty>
                                      {cardSearchQuery.length < 2
                                        ? "Type at least 2 characters to search"
                                        : "No cards found"}
                                    </CommandEmpty>
                                  ) : (
                                    <CommandGroup>
                                      {cardSearchResults.map((card) => (
                                        <CommandItem
                                          key={card.code}
                                          value={card.name}
                                          onSelect={() => {
                                            handleSelectCard(card)
                                            setIsSearchOpen(false)
                                          }}
                                          onMouseDown={(e) => {
                                            // Prevent input blur when clicking
                                            e.preventDefault()
                                          }}
                                          className="cursor-pointer"
                                        >
                                          <div className="flex items-center justify-between w-full">
                                            <span>{card.name}</span>
                                            <span className="text-xs text-muted-foreground font-mono ml-2">
                                              {card.code}
                                            </span>
                                          </div>
                                        </CommandItem>
                                      ))}
                                      {isLoadingMore && (
                                        <CommandItem disabled>
                                          <div className="flex items-center justify-center w-full py-2">
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                                            <span className="ml-2 text-sm text-muted-foreground">Loading more...</span>
                                          </div>
                                        </CommandItem>
                                      )}
                                      {!hasMoreResults && cardSearchResults.length > 0 && (
                                        <CommandItem disabled>
                                          <div className="text-center w-full py-2 text-xs text-muted-foreground">
                                            No more results
                                          </div>
                                        </CommandItem>
                                      )}
                                    </CommandGroup>
                                  )}
                                </CommandList>
                              </div>
                            </Command>
                          </div>
                        )}
                      </div>
                      {selectedCard && (
                        <p className="text-sm text-muted-foreground mt-1">
                          Selected: <span className="font-medium">{selectedCard.name}</span> (Code:{" "}
                          <span className="font-mono">{selectedCard.code}</span>)
                        </p>
                      )}
                    </div>
                    <div>
                      <Label>Rarities</Label>
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
                    <Button onClick={handleAddCardToPool} disabled={!selectedCard || newCardRarities.length === 0}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Card to Pool
                    </Button>
                  </div>

                  {cardPool.length > 0 && (
                    <div className="space-y-2">
                      <Label>Cards in Pool ({cardPool.length})</Label>
                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {cardPool.map((card, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between p-2 border rounded-md"
                          >
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              <div className="flex flex-col min-w-0 flex-1">
                                <span className="font-medium truncate">{card.name}</span>
                                <span className="text-xs text-muted-foreground font-mono">Code: {card.code}</span>
                              </div>
                              <div className="flex gap-1 flex-wrap">
                                {card.rarities.map((rarity) => (
                                  <Badge key={rarity} variant="secondary" className="text-xs">
                                    {rarity}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveCardFromPool(index)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <div className="flex gap-2">
                <Button className="w-full" size="lg" onClick={handleCreatePack} disabled={!slotRatiosValid || !priceValid || cardPool.length === 0}>
                  {selectedPackId ? "Update Pack" : "Create Pack"}
                </Button>
                {selectedPackId && (
                  <Button className="w-full" size="lg" variant="destructive" onClick={handleDeletePack}>
                    Delete Pack
                  </Button>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="tournaments">
            <Card>
              <CardHeader>
                <CardTitle>Create Tournament</CardTitle>
                <CardDescription>Set up a new competitive tournament</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="tournament-name">Tournament Name</Label>
                  <Input id="tournament-name" placeholder="Enter tournament name" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="entry-fee">Entry Fee (credits)</Label>
                    <Input id="entry-fee" type="number" placeholder="100" />
                  </div>
                  <div>
                    <Label htmlFor="max-players">Max Players</Label>
                    <Input id="max-players" type="number" placeholder="16" />
                  </div>
                </div>
                <div>
                  <Label htmlFor="start-date">Start Date & Time</Label>
                  <Input id="start-date" type="datetime-local" />
                </div>
                <Button className="w-full">Create Tournament</Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
