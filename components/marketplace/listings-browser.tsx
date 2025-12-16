"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"

interface Listing {
  _id: string
  cardId: string
  price: number
  expiresAt: string
}

export function ListingsBrowser() {
  const [listings, setListings] = useState<Listing[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadListings()
  }, [])

  const loadListings = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/marketplace/listings")
      const data = await response.json()
      setListings(data)
    } catch (error) {
      toast.error("Failed to load listings")
    } finally {
      setIsLoading(false)
    }
  }

  const handleBuy = async (listingId: string) => {
    try {
      const response = await fetch("/api/marketplace/buy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listingId }),
      })

      const data = await response.json()

      if (!response.ok) {
        toast.error(data.error || "Failed to buy card")
        return
      }

      toast.success("Card purchased!")
      loadListings()
    } catch (error) {
      toast.error("Failed to buy card")
    }
  }

  if (isLoading) {
    return <Loader2 className="h-6 w-6 animate-spin" />
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Buy Cards</h2>
      <div className="grid gap-4 md:grid-cols-3">
        {listings.map((listing) => (
          <Card key={listing._id} className="p-4">
            <p className="text-sm text-muted-foreground">Card #{listing.cardId}</p>
            <p className="mt-2 text-lg font-semibold">{listing.price} credits</p>
            <p className="text-xs text-muted-foreground">Expires: {new Date(listing.expiresAt).toLocaleDateString()}</p>
            <Button onClick={() => handleBuy(listing._id)} className="mt-4 w-full">
              Buy
            </Button>
          </Card>
        ))}
      </div>
    </div>
  )
}
