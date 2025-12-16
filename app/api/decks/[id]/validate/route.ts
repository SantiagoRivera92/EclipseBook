// Validate that user owns all cards in deck
import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { getDatabase } from "@/lib/db"
import { ObjectId } from "mongodb"

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const user = await getCurrentUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const db = await getDatabase()
    const decksCollection = db.collection("decks")
    const collectionCollection = db.collection("collection")

    const deck = await decksCollection.findOne({
      _id: new ObjectId(params.id),
      userId: user.userId,
    })

    if (!deck) {
      return NextResponse.json({ error: "Deck not found" }, { status: 404 })
    }

    const missingCards: Array<{ cardCode: number; needed: number; owned: number }> = []

    // Check main deck
    for (const card of deck.mainDeck) {
      const owned = await collectionCollection.countDocuments({
        userId: user.userId,
        cardCode: card.cardCode,
        forSale: false,
      })

      if (owned < card.count) {
        missingCards.push({
          cardCode: card.cardCode,
          needed: card.count,
          owned,
        })
      }
    }

    // Check extra deck
    for (const card of deck.extraDeck) {
      const owned = await collectionCollection.countDocuments({
        userId: user.userId,
        cardCode: card.cardCode,
        forSale: false,
      })

      if (owned < card.count) {
        missingCards.push({
          cardCode: card.cardCode,
          needed: card.count,
          owned,
        })
      }
    }

    const canUse = missingCards.length === 0

    return NextResponse.json({
      canUse,
      missingCards,
      totalMissing: missingCards.reduce((sum, c) => sum + (c.needed - c.owned), 0),
    })
  } catch (error) {
    console.error("Validate deck error:", error)
    return NextResponse.json({ error: "Failed to validate deck" }, { status: 500 })
  }
}
