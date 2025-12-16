// Join or create elimination bracket
import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { getDatabase } from "@/lib/db"
import { ObjectId } from "mongodb"
import { ELIMINATION_CONFIG } from "@/lib/matchmaking/elimination"

export async function POST(request: NextRequest) {
  const user = await getCurrentUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const db = await getDatabase()
    const bracketsCollection = db.collection("elimination_brackets")
    const usersCollection = db.collection("users")

    const userDoc = await usersCollection.findOne({ _id: new ObjectId(user.userId) })

    if (!userDoc || userDoc.credits < ELIMINATION_CONFIG.ENTRY_COST) {
      return NextResponse.json({ error: "Insufficient credits" }, { status: 400 })
    }

    // Find open bracket
    const bracket = await bracketsCollection.findOne({
      status: "waiting",
      players: { $size: { $lt: ELIMINATION_CONFIG.MAX_PLAYERS } },
    })

    if (!bracket) {
      // Create new bracket
      const result = await bracketsCollection.insertOne({
        players: [user.userId],
        bracket: [],
        status: "waiting",
        winners: { first: "", second: "", third: "", fourth: "" },
        createdAt: new Date(),
      })

      // Deduct entry fee
      await usersCollection.updateOne(
        { _id: new ObjectId(user.userId) },
        { $inc: { credits: -ELIMINATION_CONFIG.ENTRY_COST } },
      )

      return NextResponse.json({
        bracketId: result.insertedId,
        message: "Bracket created, waiting for players",
        playersNeeded: ELIMINATION_CONFIG.MAX_PLAYERS - 1,
      })
    } else {
      // Join existing bracket
      bracket.players.push(user.userId)

      // Deduct entry fee
      await usersCollection.updateOne(
        { _id: new ObjectId(user.userId) },
        { $inc: { credits: -ELIMINATION_CONFIG.ENTRY_COST } },
      )

      if (bracket.players.length === ELIMINATION_CONFIG.MAX_PLAYERS) {
        // Start bracket
        const { generateEliminationBracket } = require("@/lib/matchmaking/elimination")
        const generatedBracket = generateEliminationBracket(bracket.players)

        await bracketsCollection.updateOne(
          { _id: bracket._id },
          { $set: { bracket: generatedBracket, status: "in-progress" } },
        )

        return NextResponse.json({
          bracketId: bracket._id,
          message: "Bracket filled, starting now!",
          status: "in-progress",
        })
      } else {
        await bracketsCollection.updateOne({ _id: bracket._id }, { $set: { players: bracket.players } })

        return NextResponse.json({
          bracketId: bracket._id,
          message: "Joined bracket",
          playersNeeded: ELIMINATION_CONFIG.MAX_PLAYERS - bracket.players.length,
        })
      }
    }
  } catch (error) {
    console.error("Join elimination error:", error)
    return NextResponse.json({ error: "Failed to join elimination" }, { status: 500 })
  }
}
