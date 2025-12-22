import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { getDatabase } from "@/lib/db"
import { ObjectId } from "mongodb"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const user = await getCurrentUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const resolvedParams = await params

  try {
    if (!ObjectId.isValid(resolvedParams.id)) {
      return NextResponse.json({ error: "Invalid match ID" }, { status: 400 })
    }

    const db = await getDatabase()
    const matchesCollection = db.collection("ladder_matches")
    const usersCollection = db.collection("users")

    const match = await matchesCollection.findOne({ _id: new ObjectId(resolvedParams.id) })

    if (!match) {
      return NextResponse.json({ error: "Match not found" }, { status: 404 })
    }

    // Verify user is a participant
    if (match.player1Id !== user.userId && match.player2Id !== user.userId) {
      return NextResponse.json({ error: "You are not a participant in this match" }, { status: 403 })
    }

    // Get player usernames
    const player1 = await usersCollection.findOne({ discordId: match.player1Id })
    const player2 = await usersCollection.findOne({ discordId: match.player2Id })

    return NextResponse.json({
      ...match,
      player1Username: player1?.username,
      player2Username: player2?.username,
    })
  } catch (error) {
    console.error("Get match error:", error)
    return NextResponse.json({ error: "Failed to get match" }, { status: 500 })
  }
}