// Complete a match and award results
import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { getDatabase } from "@/lib/db"
import { ObjectId } from "mongodb"
import { MatchCompleteSchema } from "@/lib/schemas/validation"

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const user = await getCurrentUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = await request.json()

    const validation = MatchCompleteSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        {
          error: "Invalid input",
          details: validation.error.errors,
        },
        { status: 400 },
      )
    }

    const { winnerId, matchType } = validation.data

    if (!ObjectId.isValid(params.id)) {
      return NextResponse.json({ error: "Invalid match ID" }, { status: 400 })
    }

    const db = await getDatabase()
    const usersCollection = db.collection("users")
    const trophiesCollection = db.collection("trophies")

    // Update match status
    if (matchType === "ladder") {
      const matchesCollection = db.collection("ladder_matches")
      const match = await matchesCollection.findOne({ _id: new ObjectId(params.id) })

      if (!match) {
        return NextResponse.json({ error: "Match not found" }, { status: 404 })
      }

      if (match.player1Id !== user.userId && match.player2Id !== user.userId) {
        return NextResponse.json({ error: "You are not a participant in this match" }, { status: 403 })
      }

      if (winnerId !== match.player1Id && winnerId !== match.player2Id) {
        return NextResponse.json({ error: "Winner must be a match participant" }, { status: 400 })
      }

      const loserId = winnerId === match.player1Id ? match.player2Id : match.player1Id
      const winnerDoc = await usersCollection.findOne({ _id: new ObjectId(winnerId) })

      // Award credits based on win streak
      const creditsEarned = Math.min(winnerDoc?.ladderWinStreak || 1, 20)

      await usersCollection.updateOne(
        { _id: new ObjectId(winnerId) },
        {
          $inc: {
            credits: creditsEarned,
            ladderWins: 1,
            ladderWinStreak: 1,
          },
        },
      )

      await usersCollection.updateOne(
        { _id: new ObjectId(loserId) },
        {
          $inc: { ladderLosses: 1 },
          $set: { ladderWinStreak: 0 },
        },
      )

      await matchesCollection.updateOne(
        { _id: new ObjectId(params.id) },
        { $set: { winnerId, loserId, status: "completed", completedAt: new Date() } },
      )

      return NextResponse.json({
        success: true,
        creditsEarned,
        matchType: "ladder",
      })
    } else if (matchType === "tournament") {
      // Award tournament trophies and credits
      const result = await trophiesCollection.insertOne({
        userId: winnerId,
        type: "tournament_win",
        title: "Tournament Winner",
        description: "Won a tournament bracket",
        earnedAt: new Date(),
      })

      return NextResponse.json({
        success: true,
        trophyId: result.insertedId,
        matchType: "tournament",
      })
    }

    return NextResponse.json({ error: "Invalid match type" }, { status: 400 })
  } catch (error) {
    console.error("Complete match error:", error instanceof Error ? error.message : "Unknown error")
    return NextResponse.json({ error: "Failed to complete match" }, { status: 500 })
  }
}
