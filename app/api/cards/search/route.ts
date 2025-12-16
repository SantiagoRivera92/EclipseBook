// Search cards by name from cards.cdb SQLite database
import { type NextRequest, NextResponse } from "next/server"
import { searchCardsByName } from "@/lib/cards-db"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const query = searchParams.get("q") || ""
    const limit = Number.parseInt(searchParams.get("limit") || "200")
    const offset = Number.parseInt(searchParams.get("offset") || "0")

    if (!query || query.length < 2) {
      return NextResponse.json([])
    }

    // Search cards from SQLite database
    const cards = searchCardsByName(query, limit, offset)

    return NextResponse.json(cards)
  } catch (error) {
    console.error("Card search error:", error)
    return NextResponse.json({ error: "Failed to search cards" }, { status: 500 })
  }
}

