// Dust (convert) cards for credits - streamlined version
import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { getDatabase } from "@/lib/db"
import { RARITY_DUST_VALUES, RARITIES } from "@/lib/constants"

export async function POST(request: NextRequest) {
  const user = await getCurrentUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const db = await getDatabase()
    const collectionCollection = db.collection("collection")
    const usersCollection = db.collection("users")

    const userCollection = await collectionCollection.findOne({ userId: user.userId })

    if (!userCollection) {
      return NextResponse.json({ error: "Collection not found" }, { status: 404 })
    }

    var dustToAdd = 0;
    var quantityDusted = 0;

    for (const cardEntry of userCollection.collection) {
        var kept = 0;
        for (const rarity of [...RARITIES]) {
            const currentCopies = cardEntry.copies[rarity] || 0;
            if (kept < 3) {
                const toKeep = Math.min(3 - kept, currentCopies);
                kept += toKeep;
                const toDust = currentCopies - toKeep;
                if (toDust > 0) {
                    // Calculate dust value
                    const dustValuePerCard = RARITY_DUST_VALUES[rarity] || 5
                    const totalDustValue = dustValuePerCard * toDust
                    dustToAdd += totalDustValue
                }
                quantityDusted += currentCopies - toKeep;
                cardEntry.copies[rarity] = toKeep;
            } else {
                // Calculate dust value
                const dustValuePerCard = RARITY_DUST_VALUES[rarity] || 5
                const totalDustValue = dustValuePerCard * currentCopies
                dustToAdd += totalDustValue
                cardEntry.copies[rarity] = 0;
                quantityDusted += currentCopies;
            }
        }
    }   

    const totalDustValue = dustToAdd

    const now = new Date()

    // Replace the user's collection with the updated collection
    await collectionCollection.updateOne(
      { userId: user.userId },
      {
        $set: { collection: userCollection.collection, updatedAt: now },
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

    return NextResponse.json({
      success: true,
      creditsEarned: totalDustValue,
      quantityDusted: quantityDusted,
    })
  } catch (error) {
    console.error("Dust cards error:", error)
    return NextResponse.json({ error: "Failed to dust cards" }, { status: 500 })
  }
}
