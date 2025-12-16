// Claim daily credits for users
import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { getDatabase } from "@/lib/db"
import { ObjectId } from "mongodb"
import { DAILY_CREDITS, DAILY_CLAIM_INTERVAL } from "@/lib/constants"

export async function POST(request: NextRequest) {
  const user = await getCurrentUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const db = await getDatabase()
    const usersCollection = db.collection("users")
    const notificationsCollection = db.collection("notifications")

    const userDoc = await usersCollection.findOne({ _id: new ObjectId(user.userId) })

    if (!userDoc) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const now = new Date()
    const lastClaim = userDoc.lastCreditClaim ? new Date(userDoc.lastCreditClaim) : new Date(0)
    const timeSinceLastClaim = now.getTime() - lastClaim.getTime()

    if (timeSinceLastClaim < DAILY_CLAIM_INTERVAL) {
      const hoursUntilNextClaim = Math.ceil((DAILY_CLAIM_INTERVAL - timeSinceLastClaim) / (1000 * 60 * 60))
      return NextResponse.json(
        {
          error: `Already claimed today. Try again in ${hoursUntilNextClaim} hours`,
          canClaimAt: new Date(lastClaim.getTime() + DAILY_CLAIM_INTERVAL),
        },
        { status: 400 },
      )
    }

    // Award credits
    const result = await usersCollection.updateOne(
      { _id: new ObjectId(user.userId) },
      {
        $inc: { credits: DAILY_CREDITS },
        $set: { lastCreditClaim: now, updatedAt: now },
      },
    )

    // Create notification
    await notificationsCollection.insertOne({
      userId: user.userId,
      type: "daily-credits",
      title: "Daily Credits",
      message: `You claimed ${DAILY_CREDITS} credits!`,
      read: false,
      createdAt: now,
    })

    return NextResponse.json({
      success: true,
      creditsAwarded: DAILY_CREDITS,
      newBalance: userDoc.credits + DAILY_CREDITS,
      nextClaimAt: new Date(now.getTime() + DAILY_CLAIM_INTERVAL),
    })
  } catch (error) {
    console.error("Daily claim error:", error instanceof Error ? error.message : "Unknown error")
    return NextResponse.json({ error: "Failed to claim credits" }, { status: 500 })
  }
}
