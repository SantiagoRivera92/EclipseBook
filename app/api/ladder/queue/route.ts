// Ladder matchmaking queue
import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { getDatabase } from "@/lib/db"
import { ObjectId } from "mongodb"

export async function POST(request: NextRequest) {
  const user = await getCurrentUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const db = await getDatabase()
    const ladderQueueCollection = db.collection("ladder_queue")
    const usersCollection = db.collection("users")

    // Check if user already in queue
    const existing = await ladderQueueCollection.findOne({ userId: user.userId })
    if (existing) {
      return NextResponse.json({ error: "Already in queue" }, { status: 400 })
    }

    const userDoc = await usersCollection.findOne({ _id: new ObjectId(user.userId) })

    // Add to queue
    const result = await ladderQueueCollection.insertOne({
      userId: user.userId,
      username: userDoc?.username,
      elo: calculateElo(userDoc?.ladderWins || 0, userDoc?.ladderLosses || 0),
      queuedAt: new Date(),
    })

    // Try to find opponent within 50 ELO points
    const queuedPlayers = await ladderQueueCollection.find({}).toArray()

    if (queuedPlayers.length >= 2) {
      const player1 = queuedPlayers[0]
      const player2 = queuedPlayers[queuedPlayers.length - 1]

      const eloDiff = Math.abs(player1.elo - player2.elo)

      if (eloDiff <= 50 || queuedPlayers.length > 5) {
        // Create match
        const matchesCollection = db.collection("ladder_matches")

        const matchResult = await matchesCollection.insertOne({
          player1Id: player1.userId,
          player2Id: player2.userId,
          status: "pending",
          format: "bo3",
          createdAt: new Date(),
        })

        // Remove from queue
        await ladderQueueCollection.deleteOne({ _id: player1._id })
        await ladderQueueCollection.deleteOne({ _id: player2._id })

        return NextResponse.json({
          matchFound: true,
          matchId: matchResult.insertedId,
          opponent: player2.username,
        })
      }
    }

    return NextResponse.json({
      matchFound: false,
      message: "Queued for ladder match",
      queuePosition: queuedPlayers.length,
    })
  } catch (error) {
    console.error("Ladder queue error:", error)
    return NextResponse.json({ error: "Failed to queue" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  const user = await getCurrentUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const db = await getDatabase()
    const ladderQueueCollection = db.collection("ladder_queue")

    await ladderQueueCollection.deleteOne({ userId: user.userId })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Leave queue error:", error)
    return NextResponse.json({ error: "Failed to leave queue" }, { status: 500 })
  }
}

function calculateElo(wins: number, losses: number): number {
  const total = wins + losses
  if (total === 0) return 1200
  return Math.round(1200 + (wins - losses) * 16)
}
