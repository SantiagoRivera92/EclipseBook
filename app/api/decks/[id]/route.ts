// Get, update, delete deck
import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { getDatabase } from "@/lib/db"
import { validateDeck, type Deck } from "@/lib/deck-builder/validation"
import { DeckUpdateSchema } from "@/lib/schemas/validation"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const user = await getCurrentUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const resolvedParams = await params
  try {
    const db = await getDatabase()
    const decksCollection = db.collection("decks")

    const deck = await decksCollection.findOne({
      deckId: resolvedParams.id,
      userId: user.userId,
    })

    if (!deck) {
      return NextResponse.json({ error: "Deck not found" }, { status: 404 })
    }

    return NextResponse.json(deck)
  } catch (error) {
    console.error("Get deck error:", error instanceof Error ? error.message : "Unknown error")
    return NextResponse.json({ error: "Failed to fetch deck" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params: params }: { params: { id: string } }) {
  const user = await getCurrentUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const resolvedParams = await params
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

    const updatedDeck: Deck = {
      _id: resolvedParams.id,
      deckId: resolvedParams.id,
      userId: user.userId,
      name,
      mainDeck: mainDeck || [],
      extraDeck: extraDeck || [],
      sideDeck: sideDeck || [],
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    // Validate deck
    const deckValidation = validateDeck(updatedDeck)

    if (!deckValidation.valid) {
      return NextResponse.json({ error: deckValidation.errors[0], errors: deckValidation.errors }, { status: 400 })
    }

    const db = await getDatabase()
    const decksCollection = db.collection("decks")

    const result = await decksCollection.updateOne(
      {
        deckId: resolvedParams.id,
        userId: user.userId,
      },
      {
        $set: {
          name,
          mainDeck,
          extraDeck,
          sideDeck,
          updatedAt: new Date(),
        },
      },
    )

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "Deck not found or you don't own it" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      message: "Deck updated successfully",
    })
  } catch (error) {
    console.error("Update deck error:", error instanceof Error ? error.message : "Unknown error")
    return NextResponse.json({ error: "Failed to update deck" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const user = await getCurrentUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const resolvedParams = await params
  try {

    const db = await getDatabase()
    const decksCollection = db.collection("decks")

    console.log("Attempting to delete deck with ID:", resolvedParams.id, "for user:", user.userId)
    const result = await decksCollection.deleteOne({
      deckId: resolvedParams.id,
      userId: user.userId,
    })

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: "Deck not found or you don't own it" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      message: "Deck deleted successfully",
    })
  } catch (error) {
    console.error("Delete deck error:", error instanceof Error ? error.message : "Unknown error")
    return NextResponse.json({ error: "Failed to delete deck" }, { status: 500 })
  }
}
