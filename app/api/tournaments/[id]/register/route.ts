// Register for a tournament
import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { getDatabase } from "@/lib/db"
import { ObjectId } from "mongodb"

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const user = await getCurrentUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const db = await getDatabase()
    const tournamentsCollection = db.collection("tournaments")
    const usersCollection = db.collection("users")

    const tournament = await tournamentsCollection.findOne({ _id: new ObjectId(params.id) })

    if (!tournament) {
      return NextResponse.json({ error: "Tournament not found" }, { status: 404 })
    }

    if (tournament.status !== "registration") {
      return NextResponse.json({ error: "Registration closed" }, { status: 400 })
    }

    if (new Date() > new Date(tournament.registrationDeadline)) {
      return NextResponse.json({ error: "Registration deadline passed" }, { status: 400 })
    }

    if (tournament.registeredPlayers.includes(user.userId)) {
      return NextResponse.json({ error: "Already registered" }, { status: 400 })
    }

    const userDoc = await usersCollection.findOne({ _id: new ObjectId(user.userId) })

    if (userDoc.credits < tournament.entryFee) {
      return NextResponse.json({ error: "Insufficient credits" }, { status: 400 })
    }

    // Deduct entry fee
    await usersCollection.updateOne({ _id: new ObjectId(user.userId) }, { $inc: { credits: -tournament.entryFee } })

    // Add player to tournament
    const result = await tournamentsCollection.updateOne(
      { _id: new ObjectId(params.id) },
      { $push: { registeredPlayers: user.userId } },
    )

    return NextResponse.json({
      success: true,
      message: "Registered for tournament",
      playersRegistered: tournament.registeredPlayers.length + 1,
    })
  } catch (error) {
    console.error("Register tournament error:", error)
    return NextResponse.json({ error: "Failed to register" }, { status: 500 })
  }
}
