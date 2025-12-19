"use client"

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Clock } from "lucide-react"

interface ListingCardProps {
  listing: {
    _id: string
    cardName: string
    rarity: string
    price: number
    seller: string
    expiresAt: string
    imageUrl?: string
  }
  userCredits: number
  onBuy: (listingId: string, price: number) => void
}

export function ListingCard({ listing, userCredits, onBuy }: ListingCardProps) {
  return (
    <Card>
      <CardHeader>
        <div className="aspect-[2/3] bg-gradient-to-br from-primary/10 to-purple-500/10 rounded-lg flex items-center justify-center mb-3">
          {listing.imageUrl && (
            <img
              src={listing.imageUrl || "/placeholder.svg"}
              alt={listing.cardName}
              className="max-h-full max-w-full object-contain"
              loading="lazy"
            />
          )}
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
          onClick={() => onBuy(listing._id, listing.price)}
          disabled={userCredits < listing.price}
        >
          {userCredits < listing.price ? "Not Enough Credits" : "Buy Now"}
        </Button>
      </CardFooter>
    </Card>
  )
}
