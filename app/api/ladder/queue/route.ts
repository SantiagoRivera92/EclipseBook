// Ladder matchmaking queue
import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { getDatabase } from "@/lib/db"

export async function POST(request: NextRequest) {
  const user = await getCurrentUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { deckId } = body

    if (!deckId) {
      return NextResponse.json({ error: "Deck ID required" }, { status: 400 })
    }

    console.log(deckId)
    const db = await getDatabase()
    const ladderQueueCollection = db.collection("ladder_queue")
    const usersCollection = db.collection("users")
    const decksCollection = db.collection("decks")

    const deck = await decksCollection.findOne({
      deckId: deckId,
      userId: user.userId,
    })

    if (!deck) {
      console.error("Deck not found or not owned by user:", deckId)
      return NextResponse.json({ error: "Deck not found or not owned by you" }, { status: 404 })
    }

    // Check if user already in queue
    const existing = await ladderQueueCollection.findOne({ userId: user.userId })
    if (existing) {
      return NextResponse.json({ error: "Already in queue" }, { status: 400 })
    }

    const userDoc = await usersCollection.findOne({ discordId: user.userId })

    await ladderQueueCollection.insertOne({
      userId: user.userId,
      username: userDoc?.username,
      deckId: deckId,
      queuedAt: new Date(),
    })

    const queuedPlayers = await ladderQueueCollection.find({}).sort({ queuedAt: 1 }).toArray()

    if (queuedPlayers.length >= 2) {
      const player1 = queuedPlayers[0]
      const player2 = queuedPlayers[1]

      // Create match
      const matchesCollection = db.collection("ladder_matches")

      const matchResult = await matchesCollection.insertOne({
        player1Id: player1.userId,
        player2Id: player2.userId,
        player1DeckId: player1.deckId,
        player2DeckId: player2.deckId,
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

export async function GET(request: NextRequest) {
  const user = await getCurrentUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const db = await getDatabase()
    const ladderQueueCollection = db.collection("ladder_queue")

    const queueEntry = await ladderQueueCollection.findOne({ userId: user.userId })

    if (!queueEntry) {
      return NextResponse.json({ inQueue: false })
    }

    // Check if a match was found
    const matchesCollection = db.collection("ladder_matches")
    const match = await matchesCollection.findOne({
      $or: [{ player1Id: user.userId }, { player2Id: user.userId }],
      status: "pending",
      createdAt: { $gte: new Date(Date.now() - 60000) }, // Only check recent matches (last minute)
    })

    if (match) {
      // Clean up queue entry
      await ladderQueueCollection.deleteOne({ userId: user.userId })

      const opponentId = match.player1Id === user.userId ? match.player2Id : match.player1Id
      const usersCollection = db.collection("users")
      const opponent = await usersCollection.findOne({ discordId: opponentId })

      return NextResponse.json({
        inQueue: false,
        matchFound: true,
        matchId: match._id,
        opponent: opponent?.username,
      })
    }

    // Still in queue
    const allQueued = await ladderQueueCollection.find({}).sort({ queuedAt: 1 }).toArray()
    const position = allQueued.findIndex((p) => p.userId === user.userId) + 1

    return NextResponse.json({
      inQueue: true,
      matchFound: false,
      queuePosition: position,
      totalInQueue: allQueued.length,
    })
  } catch (error) {
    console.error("Queue status error:", error)
    return NextResponse.json({ error: "Failed to get queue status" }, { status: 500 })
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