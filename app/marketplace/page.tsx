"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Navigation } from "@/components/layout/navigation"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Search, ShoppingCart, Gavel } from "lucide-react"
import { ListingCard } from "@/components/marketplace/listing-card"
import { AuctionCard } from "@/components/marketplace/auction-card"
import { EmptyState } from "@/components/shared/empty-state"
import { PageHeader } from "@/components/shared/page-header"
import { LoadingSpinner } from "@/components/shared/loading-spinner"

interface Listing {
  _id: string
  cardName: string
  rarity: string
  price: number
  seller: string
  expiresAt: string
  imageUrl?: string
}

interface Auction {
  _id: string
  cardName: string
  rarity: string
  currentBid: number
  highestBidder?: string
  seller: string
  expiresAt: string
  imageUrl?: string
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
        headers: { "Content-Type": "application/json" },
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
        headers: { "Content-Type": "application/json" },
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
    return <LoadingSpinner />
  }

  if (!user) return null

  const filteredListings = listings.filter((l) => l.cardName.toLowerCase().includes(searchQuery.toLowerCase()))
  const filteredAuctions = auctions.filter((a) => a.cardName.toLowerCase().includes(searchQuery.toLowerCase()))

  return (
    <div className="min-h-screen bg-background">
      <Navigation user={user} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <PageHeader title="Marketplace" description="Buy and sell cards with other players" />

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
              <EmptyState
                icon={ShoppingCart}
                title="No listings found"
                description="Check back later or adjust your search"
              />
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredListings.map((listing) => (
                  <ListingCard
                    key={listing._id}
                    listing={listing}
                    userCredits={user.credits}
                    onBuy={handleBuyListing}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="auctions" className="space-y-4">
            {filteredAuctions.length === 0 ? (
              <EmptyState
                icon={Gavel}
                title="No auctions found"
                description="Check back later or adjust your search"
              />
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredAuctions.map((auction) => (
                  <AuctionCard
                    key={auction._id}
                    auction={auction}
                    userCredits={user.credits}
                    onBid={handlePlaceBid}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
