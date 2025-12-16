// Get user trophies
import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { getDatabase } from "@/lib/db"

export async function GET(request: NextRequest) {
  const user = await getCurrentUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const db = await getDatabase()
    const trophiesCollection = db.collection("trophies")

    const trophies = await trophiesCollection.find({ userId: user.userId }).sort({ earnedAt: -1 }).toArray()

    return NextResponse.json(trophies)
  } catch (error) {
    console.error("Get trophies error:", error)
    return NextResponse.json({ error: "Failed to fetch trophies" }, { status: 500 })
  }
}
