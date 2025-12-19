// Get available card packs
import { NextResponse } from "next/server"
import { getDatabase } from "@/lib/db"

export async function GET() {
  try {
    const db = await getDatabase()
    const packsCollection = db.collection("card_packs")

    const packs = await packsCollection.find({}).toArray()
    // Just in case lol
    for (const pack of packs) {
      for (const card of pack.cardPool) {
        card.imageUrl = `https://images.ygoprodeck.com/images/cards/${card.code}.jpg`
      }
    }
    return NextResponse.json(packs)
  } catch (error) {
    console.error("Get packs error:", error)
    return NextResponse.json({ error: "Failed to fetch packs" }, { status: 500 })
  }
}

// POST endpoint removed - use /api/admin/packs instead
