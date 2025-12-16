// Get user's card collection
import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { getDatabase } from "@/lib/db"

export async function GET(request: NextRequest) {
  const user = await getCurrentUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const db = await getDatabase()
    const collectionCollection = db.collection("collection")

    const collection = await collectionCollection.find({ userId: user.userId }).sort({ createdAt: -1 }).toArray()

    // Group by card code and count
    const grouped: Record<string, any> = {}

    for (const card of collection) {
      if (!grouped[card.cardCode]) {
        grouped[card.cardCode] = {
          cardCode: card.cardCode,
          copies: [],
          count: 0,
          rarities: {},
        }
      }

      grouped[card.cardCode].copies.push(card)
      grouped[card.cardCode].count += 1
      grouped[card.cardCode].rarities[card.rarity] = (grouped[card.cardCode].rarities[card.rarity] || 0) + 1
    }

    return NextResponse.json(Object.values(grouped))
  } catch (error) {
    console.error("Get collection error:", error)
    return NextResponse.json({ error: "Failed to fetch collection" }, { status: 500 })
  }
}
