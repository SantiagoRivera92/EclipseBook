// Get user's card collection (streamlined version)
import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { getDatabase } from "@/lib/db"
import { getCardByCode } from "@/lib/cards-db"
import { RARITY_DUST_VALUES } from "@/lib/constants"

export async function GET(request: NextRequest) {
  const user = await getCurrentUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const db = await getDatabase()
    const collectionCollection = db.collection("collection")

    const userCollection = await collectionCollection.findOne({ userId: user.userId })

    if (!userCollection || !userCollection.collection) {
      return NextResponse.json([])
    }

    const cards = []

    for (const cardEntry of userCollection.collection) {
      const cardInfo = getCardByCode(cardEntry.password)
      const imageUrl = `https://images.ygoprodeck.com/images/cards/${cardEntry.password}.jpg`

      for (const [rarity, count] of Object.entries(cardEntry.copies)) {
        const countNumber = typeof count === "number" ? count : Number(count)
        if (countNumber > 0) {
          cards.push({
            cardCode: cardEntry.password,
            imageUrl,
            rarity,
            count: countNumber,
            dustValue: RARITY_DUST_VALUES[rarity] || 5,
            ...(cardInfo || {}),
          })
        }
      }
    }

    // Sort cards by name alphabetically
    cards.sort((a, b) => a.name.localeCompare(b.name))

    return NextResponse.json(cards)
  } catch (error) {
    console.error("Get collection error:", error)
    return NextResponse.json({ error: "Failed to fetch collection" }, { status: 500 })
  }
}
