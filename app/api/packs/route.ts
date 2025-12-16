// Get available card packs
import { NextResponse } from "next/server"
import { getDatabase } from "@/lib/db"

export async function GET() {
  try {
    const db = await getDatabase()
    const packsCollection = db.collection("card_packs")

    const packs = await packsCollection.find({}).toArray()

    return NextResponse.json(packs)
  } catch (error) {
    console.error("Get packs error:", error)
    return NextResponse.json({ error: "Failed to fetch packs" }, { status: 500 })
  }
}

// POST endpoint removed - use /api/admin/packs instead
