// Open a card pack
import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { getDatabase } from "@/lib/db"
import { ObjectId } from "mongodb"
import { getCardByCode } from "@/lib/cards-db"

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
    let { packId, quantity } = await request.json()
    quantity = Math.max(1, Math.min(Number(quantity) || 1, 100))

    const db = await getDatabase()
    const usersCollection = db.collection("users")
    const packsCollection = db.collection("card_packs")
    const collectionCollection = db.collection("collection")

    // Get user and pack
    const userDoc = await usersCollection.findOne({ discordId: user.userId })
    const packDoc = await packsCollection.findOne({ _id: packId })

    if (!userDoc) {
      console.log("User document not found for userId:", user.userId)
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    if (!packDoc) {
      console.log("Pack document not found for packId:", packId)
      return NextResponse.json({ error: "Pack not found" }, { status: 404 })
    }

    // Check if user has enough credits for the requested quantity
    const totalPrice = packDoc.price * quantity
    if (userDoc.credits < totalPrice) {
      console.log("Insufficient credits for userId:", user.userId)
      return NextResponse.json({ error: "Insufficient credits" }, { status: 400 })
    }

    // Generate cards for each pack
    const pulledCards: CardData[] = []
    for (let packNum = 0; packNum < quantity; packNum++) {
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
          (card: any) => card.rarities && card.rarities.includes(selectedRarity.rarity),
        )
        if (cardsWithRarity.length > 0) {
          const randomCard = cardsWithRarity[Math.floor(Math.random() * cardsWithRarity.length)]
          pulledCards.push({
            code: randomCard.code,
            rarity: selectedRarity.rarity,
          })
        }
      }
    }

    // Deduct credits
    await usersCollection.updateOne(
      { discordId: user.userId },
      {
        $inc: { credits: -totalPrice },
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

      // Get card name from SQLite
      const cardInfo = getCardByCode(card.code)

      insertedCards.push({
        _id: result.insertedId,
        cardCode: card.code,
        rarity: card.rarity,
        name: cardInfo ? cardInfo.name : "Unknown Card",
        imageUrl: `https://images.ygoprodeck.com/images/cards/${card.code}.jpg`,
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