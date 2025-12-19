"use client"

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Clock } from "lucide-react"

interface AuctionCardProps {
  auction: {
    _id: string
    cardName: string
    rarity: string
    currentBid: number
    highestBidder?: string
    seller: string
    expiresAt: string
    imageUrl?: string
  }
  userCredits: number
  onBid: (auctionId: string, bidAmount: number) => void
}

export function AuctionCard({ auction, userCredits, onBid }: AuctionCardProps) {
  const nextBid = auction.currentBid + 10

  return (
    <Card>
      <CardHeader>
        <div className="aspect-[2/3] bg-gradient-to-br from-primary/10 to-purple-500/10 rounded-lg flex items-center justify-center mb-3">
          {auction.imageUrl && (
            <img
              src={auction.imageUrl || "/placeholder.svg"}
              alt={auction.cardName}
              className="max-h-full max-w-full object-contain"
              loading="lazy"
            />
          )}
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
        <Button className="w-full" onClick={() => onBid(auction._id, nextBid)} disabled={userCredits < nextBid}>
          Bid {nextBid}
        </Button>
      </CardFooter>
    </Card>
  )
}
