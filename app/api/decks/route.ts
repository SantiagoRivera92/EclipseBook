// Deck management endpoints
import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { getDatabase } from "@/lib/db"
import { validateDeck, type Deck } from "@/lib/deck-builder/validation"
import { DeckUpdateSchema } from "@/lib/schemas/validation"

export async function GET(request: NextRequest) {
  const user = await getCurrentUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const db = await getDatabase()
    const decksCollection = db.collection("decks")

    const decks = await decksCollection.find({ userId: user.userId }).sort({ updatedAt: -1 }).toArray()

    return NextResponse.json(decks)
  } catch (error) {
    console.error("Get decks error:", error instanceof Error ? error.message : "Unknown error")
    return NextResponse.json({ error: "Failed to fetch decks" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = await request.json()

    const validation = DeckUpdateSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        {
          error: "Invalid input",
          details: validation.error.errors,
        },
        { status: 400 },
      )
    }

    const { name, mainDeck, extraDeck, sideDeck } = validation.data

    const deck: Deck = {
      userId: user.userId,
      name,
      mainDeck: mainDeck || [],
      extraDeck: extraDeck || [],
      sideDeck: sideDeck || [],
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    // Validate deck
    const deckValidation = validateDeck(deck)

    if (!deckValidation.valid) {
      return NextResponse.json({ error: deckValidation.errors[0], errors: deckValidation.errors }, { status: 400 })
    }

    const db = await getDatabase()
    const decksCollection = db.collection("decks")

    const result = await decksCollection.insertOne(deck)

    return NextResponse.json({
      _id: result.insertedId,
      ...deck,
    })
  } catch (error) {
    console.error("Create deck error:", error instanceof Error ? error.message : "Unknown error")
    return NextResponse.json({ error: "Failed to create deck" }, { status: 500 })
  }
}
