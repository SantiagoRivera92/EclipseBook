// Dust (convert) cards for credits - streamlined version
import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { getDatabase } from "@/lib/db"
import { RARITY_DUST_VALUES } from "@/lib/constants"

export async function POST(request: NextRequest) {
  const user = await getCurrentUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { cardCode, rarity, quantity } = await request.json()

    if (!cardCode || !rarity || !quantity || quantity <= 0) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 })
    }

    const db = await getDatabase()
    const collectionCollection = db.collection("collection")
    const usersCollection = db.collection("users")

    const userCollection = await collectionCollection.findOne({ userId: user.userId })

    if (!userCollection) {
      return NextResponse.json({ error: "Collection not found" }, { status: 404 })
    }

    // Find the card in collection
    const cardEntry = userCollection.collection?.find((entry: any) => entry.password === cardCode)

    if (!cardEntry) {
      return NextResponse.json({ error: "Card not found in collection" }, { status: 404 })
    }

    // Check if user has enough copies
    const currentCopies = cardEntry.copies[rarity] || 0
    if (currentCopies < quantity) {
      return NextResponse.json(
        { error: `Not enough copies. You have ${currentCopies} but tried to dust ${quantity}` },
        { status: 400 },
      )
    }

    // Calculate dust value
    const dustValuePerCard = RARITY_DUST_VALUES[rarity] || 5
    const totalDustValue = dustValuePerCard * quantity

    const now = new Date()

    // Decrement the card count
    await collectionCollection.updateOne(
      { userId: user.userId, "collection.password": cardCode },
      {
        $inc: { [`collection.$.copies.${rarity}`]: -quantity },
        $set: { updatedAt: now },
      },
    )

    // Give user credits
    await usersCollection.updateOne(
      { discordId: user.userId },
      {
        $inc: { credits: totalDustValue },
        $set: { updatedAt: now },
      },
    )

    // Remove card entry if all copies are 0
    const updatedCollection = await collectionCollection.findOne({ userId: user.userId })
    const updatedCardEntry = updatedCollection.collection?.find((entry: any) => entry.password === cardCode)

    if (updatedCardEntry) {
      const allZero = Object.values(updatedCardEntry.copies).every((count: any) => count === 0)
      if (allZero) {
        await collectionCollection.updateOne(
          { userId: user.userId },
          {
            $pull: { collection: { password: cardCode } },
            $set: { updatedAt: now },
          },
        )
      }
    }

    return NextResponse.json({
      success: true,
      creditsEarned: totalDustValue,
      quantityDusted: quantity,
    })
  } catch (error) {
    console.error("Dust cards error:", error)
    return NextResponse.json({ error: "Failed to dust cards" }, { status: 500 })
  }
}
