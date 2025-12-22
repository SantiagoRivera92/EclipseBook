"use client"

import Link from "next/link"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Edit, Trash2 } from "lucide-react"

interface DeckCardProps {
  deck: {
    _id: string
    deckId: string
    name: string
    mainDeck: number[]
    extraDeck: number[]
    sideDeck: number[]
    canUse: boolean
    updatedAt: string
  }
  onDelete: (deckId: string) => void
}

export function DeckCard({ deck, onDelete }: DeckCardProps) {
  console.log(deck.updatedAt)
  return (
    <Card className="flex flex-col">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="line-clamp-1">{deck.name}</CardTitle>
            <CardDescription className="mt-1">
              Last modified: {new Date(deck.updatedAt).toLocaleDateString()}
            </CardDescription>
          </div>
          {deck.canUse ? <Badge variant="default">Ready</Badge> : <Badge variant="destructive">Missing Cards</Badge>}
        </div>
      </CardHeader>
      <CardContent className="flex-1">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Main Deck:</span>
            <span className="font-semibold">{deck.mainDeck.length} cards</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Extra Deck:</span>
            <span className="font-semibold">{deck.extraDeck.length} cards</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Side Deck:</span>
            <span className="font-semibold">{deck.sideDeck.length} cards</span>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex gap-2">
        <Link href={`/decks/builder?id=${deck.deckId}`} className="flex-1">
          <Button variant="outline" className="w-full gap-2 bg-transparent">
            <Edit className="h-4 w-4" />
            Edit
          </Button>
        </Link>
        <Button variant="destructive" size="icon" onClick={() => onDelete(deck._id)}>
          <Trash2 className="h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  )
}
