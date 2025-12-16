"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Navigation } from "@/components/layout/navigation"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Search, Clock, Gavel, ShoppingCart } from "lucide-react"

interface Listing {
  _id: string
  cardName: string
  rarity: string
  price: number
  seller: string
  expiresAt: string
}

interface Auction {
  _id: string
  cardName: string
  rarity: string
  currentBid: number
  highestBidder?: string
  seller: string
  expiresAt: string
}

export default function MarketplacePage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [listings, setListings] = useState<Listing[]>([])
  const [auctions, setAuctions] = useState<Auction[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [userRes, listingsRes, auctionsRes] = await Promise.all([
          fetch("/api/user/profile"),
          fetch("/api/marketplace/listings"),
          fetch("/api/marketplace/auctions"),
        ])

        if (!userRes.ok) {
          router.push("/")
          return
        }

        if (userRes.ok) setUser(await userRes.json())
        if (listingsRes.ok) setListings(await listingsRes.json())
        if (auctionsRes.ok) setAuctions(await auctionsRes.json())
      } catch (error) {
        console.error("Failed to fetch data:", error)
        router.push("/")
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [router])

  const handleBuyListing = async (listingId: string, price: number) => {
    if (user.credits < price) return

    try {
      const res = await fetch("/api/marketplace/buy", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ listingId }),
      })

      if (res.ok) {
        const data = await res.json()
        setUser({ ...user, credits: data.newCredits })
        setListings(listings.filter((l) => l._id !== listingId))
      }
    } catch (error) {
      console.error("Failed to buy listing:", error)
    }
  }

  const handlePlaceBid = async (auctionId: string, bidAmount: number) => {
    try {
      const res = await fetch("/api/marketplace/bid", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ auctionId, bidAmount }),
      })

      if (res.ok) {
        const data = await res.json()
        setUser({ ...user, credits: data.newCredits })
        setAuctions(
          auctions.map((a) =>
            a._id === auctionId ? { ...a, currentBid: bidAmount, highestBidder: user.username } : a,
          ),
        )
      }
    } catch (error) {
      console.error("Failed to place bid:", error)
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

  const filteredListings = listings.filter((l) => l.cardName.toLowerCase().includes(searchQuery.toLowerCase()))
  const filteredAuctions = auctions.filter((a) => a.cardName.toLowerCase().includes(searchQuery.toLowerCase()))

  return (
    <div className="min-h-screen bg-background">
      <Navigation user={user} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Marketplace</h1>
          <p className="text-muted-foreground">Buy and sell cards with other players</p>
        </div>

        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            placeholder="Search cards..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <Tabs defaultValue="listings" className="space-y-6">
          <TabsList>
            <TabsTrigger value="listings" className="gap-2">
              <ShoppingCart className="h-4 w-4" />
              Listings ({filteredListings.length})
            </TabsTrigger>
            <TabsTrigger value="auctions" className="gap-2">
              <Gavel className="h-4 w-4" />
              Auctions ({filteredAuctions.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="listings" className="space-y-4">
            {filteredListings.length === 0 ? (
              <Card className="p-12 text-center">
                <ShoppingCart className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">No listings found</h3>
                <p className="text-muted-foreground">Check back later or adjust your search</p>
              </Card>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredListings.map((listing) => (
                  <Card key={listing._id}>
                    <CardHeader>
                      <div className="aspect-[2/3] bg-gradient-to-br from-primary/10 to-purple-500/10 rounded-lg flex items-center justify-center mb-3">
                        <span className="text-5xl">🃏</span>
                      </div>
                      <CardTitle className="text-base line-clamp-1">{listing.cardName}</CardTitle>
                      <CardDescription>Sold by {listing.seller}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <Badge variant="outline">{listing.rarity}</Badge>
                        <span className="text-xl font-bold text-primary">{listing.price} credits</span>
                      </div>
                      <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        Expires: {new Date(listing.expiresAt).toLocaleDateString()}
                      </div>
                    </CardContent>
                    <CardFooter>
                      <Button
                        className="w-full"
                        onClick={() => handleBuyListing(listing._id, listing.price)}
                        disabled={user.credits < listing.price}
                      >
                        {user.credits < listing.price ? "Not Enough Credits" : "Buy Now"}
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="auctions" className="space-y-4">
            {filteredAuctions.length === 0 ? (
              <Card className="p-12 text-center">
                <Gavel className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">No auctions found</h3>
                <p className="text-muted-foreground">Check back later or adjust your search</p>
              </Card>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredAuctions.map((auction) => (
                  <Card key={auction._id}>
                    <CardHeader>
                      <div className="aspect-[2/3] bg-gradient-to-br from-primary/10 to-purple-500/10 rounded-lg flex items-center justify-center mb-3">
                        <span className="text-5xl">🃏</span>
                      </div>
                      <CardTitle className="text-base line-clamp-1">{auction.cardName}</CardTitle>
                      <CardDescription>Sold by {auction.seller}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between mb-2">
                        <Badge variant="outline">{auction.rarity}</Badge>
                        <span className="text-xl font-bold text-primary">{auction.currentBid} credits</span>
                      </div>
                      {auction.highestBidder && (
                        <p className="text-xs text-muted-foreground mb-2">Highest bidder: {auction.highestBidder}</p>
                      )}
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        Ends: {new Date(auction.expiresAt).toLocaleDateString()}
                      </div>
                    </CardContent>
                    <CardFooter>
                      <Button
                        className="w-full"
                        onClick={() => handlePlaceBid(auction._id, auction.currentBid + 10)}
                        disabled={user.credits < auction.currentBid + 10}
                      >
                        Bid {auction.currentBid + 10}
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
