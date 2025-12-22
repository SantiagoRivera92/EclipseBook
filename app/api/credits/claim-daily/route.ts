// Claim daily credits for users
import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { getDatabase } from "@/lib/db"
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

    const userDoc = await usersCollection.findOne({ discordId: user.userId })

    if (!userDoc) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const lastCreditClaim = userDoc.lastCreditClaim as Date
    const now = new Date();
    let canClaimCredits = false;
    if (!lastCreditClaim || (now.getTime() - new Date(lastCreditClaim).getTime()) >= 24 * 60 * 60 * 1000) {
        canClaimCredits = true;
    }

    if (!canClaimCredits) {
      return NextResponse.json(
        {
          error: `Already claimed today. Try again later.`,
          canClaimAt: new Date(lastCreditClaim.getTime() + DAILY_CLAIM_INTERVAL),
        },
        { status: 400 },
      )
    }

    // Award credits
    const result = await usersCollection.updateOne(
      { discordId: user.userId },
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
