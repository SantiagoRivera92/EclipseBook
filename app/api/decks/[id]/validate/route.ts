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

    const userCollection = await collectionCollection.findOne({ userId: user.userId })

    if (!userCollection) {
      return NextResponse.json({ error: "Collection not found" }, { status: 404 })
    }

    const missingCards: Array<{ cardCode: number; needed: number; owned: number }> = []

    // Check main deck
    for (const card of deck.mainDeck) {
      const cardEntry = userCollection.collection?.find((entry: any) => entry.password === card.cardCode)

      if (!cardEntry) {
        missingCards.push({
          cardCode: card.cardCode,
          needed: card.count,
          owned: 0,
        })
        continue
      }

      // Count total copies across all rarities
      const totalOwned = Object.values(cardEntry.copies).reduce((sum: number, count: any) => sum + count, 0)

      if (totalOwned < card.count) {
        missingCards.push({
          cardCode: card.cardCode,
          needed: card.count,
          owned: totalOwned,
        })
      }
    }

    // Check extra deck
    for (const card of deck.extraDeck) {
      const cardEntry = userCollection.collection?.find((entry: any) => entry.password === card.cardCode)

      if (!cardEntry) {
        missingCards.push({
          cardCode: card.cardCode,
          needed: card.count,
          owned: 0,
        })
        continue
      }

      // Count total copies across all rarities
      const totalOwned = Object.values(cardEntry.copies).reduce((sum: number, count: any) => sum + count, 0)

      if (totalOwned < card.count) {
        missingCards.push({
          cardCode: card.cardCode,
          needed: card.count,
          owned: totalOwned,
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
