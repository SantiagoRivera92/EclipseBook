// Open a card pack
import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { getDatabase } from "@/lib/db"
import { ObjectId } from "mongodb"

interface CardData {
  code: number
  rarity: string
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { packId } = await request.json()

    const db = await getDatabase()
    const usersCollection = db.collection("users")
    const packsCollection = db.collection("card_packs")
    const collectionCollection = db.collection("collection")

    // Get user and pack
    const userDoc = await usersCollection.findOne({ _id: new ObjectId(user.userId) })
    const packDoc = await packsCollection.findOne({ _id: new ObjectId(packId) })

    if (!userDoc) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    if (!packDoc) {
      return NextResponse.json({ error: "Pack not found" }, { status: 404 })
    }

    // Check if user has enough credits
    if (userDoc.credits < packDoc.price) {
      return NextResponse.json({ error: "Insufficient credits" }, { status: 400 })
    }

    // Generate 8 cards based on slot ratios
    const pulledCards: CardData[] = []

    for (let i = 0; i < 8; i++) {
      const random = Math.random()
      let accumulated = 0
      let selectedRarity = packDoc.slotRatios[0]

      for (const ratio of packDoc.slotRatios) {
        accumulated += ratio.chance
        if (random <= accumulated) {
          selectedRarity = ratio
          break
        }
      }

      // Pick random card with this rarity from card pool
      const cardsWithRarity = packDoc.cardPool.filter(
        (cardCode: number) => getCardRarity(cardCode) === selectedRarity.rarity,
      )

      if (cardsWithRarity.length > 0) {
        const randomCard = cardsWithRarity[Math.floor(Math.random() * cardsWithRarity.length)]
        pulledCards.push({
          code: randomCard,
          rarity: selectedRarity.rarity,
        })
      }
    }

    // Deduct credits
    await usersCollection.updateOne(
      { _id: new ObjectId(user.userId) },
      {
        $inc: { credits: -packDoc.price },
        $set: { updatedAt: new Date() },
      },
    )

    const now = new Date()
    const insertedCards = []

    for (const card of pulledCards) {
      // Add to collection - no automatic dusting
      const result = await collectionCollection.insertOne({
        userId: user.userId,
        cardCode: card.code,
        rarity: card.rarity,
        dustValue: packDoc.slotRatios.find((r: any) => r.rarity === card.rarity)?.dv || 1,
        packName: packDoc.name,
        originalOwner: user.userId,
        createdAt: now,
      })

      insertedCards.push({
        _id: result.insertedId,
        cardCode: card.code,
        rarity: card.rarity,
      })
    }

    return NextResponse.json({
      cards: insertedCards,
      creditsCost: packDoc.price,
    })
  } catch (error) {
    console.error("Open pack error:", error)
    return NextResponse.json({ error: "Failed to open pack" }, { status: 500 })
  }
}

function getCardRarity(cardCode: number): string {
  // This would typically look up the rarity from a card database
  // For now, return based on code pattern
  return "Common"
}
