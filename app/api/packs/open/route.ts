// Open a card pack (streamlined collection system)
import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { getDatabase } from "@/lib/db"
import { getCardByCode } from "@/lib/cards-db"
import { RARITY_DUST_VALUES, SLOT_RATIOS } from "@/lib/constants"

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

    const pulledCards: CardData[] = []
    for (let packNum = 0; packNum < quantity; packNum++) {
      for (let i = 0; i < 8; i++) {
        const random = Math.random()
        let accumulated = 0
        let selectedRarity = SLOT_RATIOS[0]
        for (const ratio of SLOT_RATIOS) {
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

    // Get or create user's collection
    let userCollection = await collectionCollection.findOne({ userId: user.userId })

    if (!userCollection) {
      // Create new collection for user
      await collectionCollection.insertOne({
        userId: user.userId,
        collection: [],
        createdAt: now,
        updatedAt: now,
      })
      userCollection = await collectionCollection.findOne({ userId: user.userId })
    }

    // Count the cards by password and rarity
    const cardCounts = new Map<number, Record<string, number>>()
    for (const card of pulledCards) {
      if (!cardCounts.has(card.code)) {
        cardCounts.set(card.code, {
          Common: 0,
          Rare: 0,
          "Super Rare": 0,
          "Ultra Rare": 0,
          "Secret Rare": 0,
          "Ultimate Rare": 0,
        })
      }
      const counts = cardCounts.get(card.code)!
      if (card.rarity in counts) {
        counts[card.rarity as keyof typeof counts]++
      }
    }

    // Update the collection with the new cards
    const updateOperations: any[] = []

    for (const [password, counts] of cardCounts.entries()) {
      for (const [rarity, count] of Object.entries(counts)) {
        if (count > 0) {
          updateOperations.push({
            updateOne: {
              filter: { userId: user.userId, "collection.password": password },
              update: {
                $inc: { [`collection.$.copies.${rarity}`]: count },
                $set: { updatedAt: now },
              },
            },
          })
        }
      }
    }

    // For cards not yet in collection, we need to add them
    for (const [password, counts] of cardCounts.entries()) {
      const existsInCollection = userCollection.collection?.some((entry: any) => entry.password === password)

      if (!existsInCollection) {
        await collectionCollection.updateOne(
          { userId: user.userId },
          {
            $push: {
              collection: {
                password,
                copies: counts,
              },
            },
            $set: { updatedAt: now },
          },
        )
      } else {
        // Update existing entry
        for (const [rarity, count] of Object.entries(counts)) {
          if (count > 0) {
            await collectionCollection.updateOne(
              { userId: user.userId, "collection.password": password },
              {
                $inc: { [`collection.$.copies.${rarity}`]: count },
                $set: { updatedAt: now },
              },
            )
          }
        }
      }
    }

    // Build response with pulled cards
    const insertedCards = []
    for (const card of pulledCards) {
      const cardInfo = getCardByCode(card.code)
      insertedCards.push({
        cardCode: card.code,
        rarity: card.rarity,
        name: cardInfo ? cardInfo.name : "Unknown Card",
        imageUrl: `https://images.ygoprodeck.com/images/cards/${card.code}.jpg`,
        dustValue: RARITY_DUST_VALUES[card.rarity] || 5,
      })
    }

    return NextResponse.json({
      cards: insertedCards,
      creditsCost: totalPrice,
      cardsAdded: pulledCards.length,
    })
  } catch (error) {
    console.error("Open pack error:", error)
    return NextResponse.json({ error: "Failed to open pack" }, { status: 500 })
  }
}
