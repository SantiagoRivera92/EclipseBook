// Dust (convert) cards for credits - optional and unrestricted
import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { getDatabase } from "@/lib/db"
import { ObjectId } from "mongodb"

export async function POST(request: NextRequest) {
  const user = await getCurrentUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }


  console.log(user);
  
  try {
    const { cardIds } = await request.json()

    if (!Array.isArray(cardIds) || cardIds.length === 0) {
      return NextResponse.json({ error: "Invalid card IDs" }, { status: 400 })
    }

    const db = await getDatabase()
    const collectionCollection = db.collection("collection")
    const usersCollection = db.collection("users")

    let totalDustValue = 0

    for (const cardId of cardIds) {
      const card = await collectionCollection.findOne({ _id: new ObjectId(cardId) })

      if (!card || card.userId !== user.userId) {
        continue
      }

      totalDustValue += card.dustValue
      var maxTries = 3
      // Remove the card from collection
      let deleteResult = await collectionCollection.deleteOne({ _id: new ObjectId(cardId) })
      while (deleteResult.deletedCount === 0 && maxTries > 0) {
        // Wait 500ms and try again
        console.log(`Retrying deletion for cardId: ${cardId} after 500ms`)
        await new Promise(res => setTimeout(res, 500))
        deleteResult = await collectionCollection.deleteOne({ _id: new ObjectId(cardId) })
        maxTries--
      }
    }

    if (totalDustValue > 0) {
      // Give user credits
      await usersCollection.updateOne(
        { discordId: user.userId },
        {
          $inc: { credits: totalDustValue },
          $set: { updatedAt: new Date() },
        },
      )
    }

    return NextResponse.json({
      success: true,
      creditsEarned: totalDustValue,
    })
  } catch (error) {
    console.error("Dust cards error:", error)
    return NextResponse.json({ error: "Failed to dust cards" }, { status: 500 })
  }
}
