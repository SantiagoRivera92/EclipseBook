// Get user's card collection
import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { getDatabase } from "@/lib/db"
import { getCardByCode } from "@/lib/cards-db"

export async function GET(request: NextRequest) {
  const user = await getCurrentUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const db = await getDatabase()
    const collectionCollection = db.collection("collection")
    const usersCollection = db.collection("users")

    const collection = await collectionCollection.find({ userId: user.userId }).sort({ createdAt: -1 }).toArray()

    // Gather all unique originalOwner IDs
    const ownerIds = Array.from(new Set(collection.map(card => card.originalOwner).filter(Boolean)))
    const owners = await usersCollection.find({ discordId: { $in: ownerIds } }).toArray()
    const ownerMap = Object.fromEntries(owners.map(u => [u.discordId, u.username || u.discordId]))

    // Group by cardCode, rarity, dustValue, originalOwner, packName
    const grouped: Record<string, any> = {}

    for (const card of collection) {
      const groupKey = [card.cardCode, card.rarity, card.dustValue, card.originalOwner, card.packName].join("|")
      if (!grouped[groupKey]) {
        const cardInfo = getCardByCode(card.cardCode)
        grouped[groupKey] = {
          cardCode: card.cardCode,
          name: cardInfo ? cardInfo.name : "Unknown Card",
          imageUrl: `https://images.ygoprodeck.com/images/cards/${card.cardCode}.jpg`,
          rarity: card.rarity,
          dustValue: card.dustValue,
          originalOwner: ownerMap[card.originalOwner] || card.originalOwner,
          packName: card.packName,
          copies: [],
          count: 0,
        }
      }
      grouped[groupKey].copies.push({ ...card, originalOwner: ownerMap[card.originalOwner] || card.originalOwner })
      grouped[groupKey].count += 1
    }

    // Sort copies by dustValue descending
    for (const group of Object.values(grouped)) {
      group.copies.sort((a: any, b: any) => (b.dustValue || 0) - (a.dustValue || 0))
    }

    return NextResponse.json(Object.values(grouped))
  } catch (error) {
    console.error("Get collection error:", error)
    return NextResponse.json({ error: "Failed to fetch collection" }, { status: 500 })
  }
}
