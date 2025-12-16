// Tournament management
import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { getDatabase } from "@/lib/db"
import { ObjectId } from "mongodb"

export async function GET(request: NextRequest) {
  try {
    const db = await getDatabase()
    const tournamentsCollection = db.collection("tournaments")

    const tournaments = await tournamentsCollection.find({}).sort({ startDate: 1 }).toArray()

    return NextResponse.json(tournaments)
  } catch (error) {
    console.error("Get tournaments error:", error)
    return NextResponse.json({ error: "Failed to fetch tournaments" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    // Check if user is admin
    const db = await getDatabase()
    const usersCollection = db.collection("users")

    const userDoc = await usersCollection.findOne({ _id: new ObjectId(user.userId) })

    if (!userDoc?.isAdmin) {
      return NextResponse.json({ error: "Admin only" }, { status: 403 })
    }

    const { name, bracketType, entryFee, maxPlayers, registrationDeadline, startDate } = await request.json()

    const tournamentsCollection = db.collection("tournaments")

    const result = await tournamentsCollection.insertOne({
      name,
      organizerId: user.userId,
      bracketType,
      entryFee,
      maxPlayers,
      registeredPlayers: [],
      status: "registration",
      registrationDeadline: new Date(registrationDeadline),
      startDate: new Date(startDate),
      createdAt: new Date(),
    })

    return NextResponse.json({
      _id: result.insertedId,
      name,
      bracketType,
      entryFee,
      maxPlayers,
    })
  } catch (error) {
    console.error("Create tournament error:", error)
    return NextResponse.json({ error: "Failed to create tournament" }, { status: 500 })
  }
}
