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
    const collectionCollection = db.collection("collection")
    const collection = await collectionCollection.findOne({ userId: user.userId })
    if (!collection) {
      return NextResponse.json({ error: "User has no collection" }, { status: 404 })
    }
    
    const decksCollection = db.collection("decks")
    const decks = await decksCollection.find({ userId: user.userId }).sort({ updatedAt: -1 }).toArray()
    for (const deck of decks) {
      // Count card occurrences in the deck (main, extra, side)
      const cardCounts: Record<string, number> = {};
      const allCards = [...(deck.mainDeck || []), ...(deck.extraDeck || []), ...(deck.sideDeck || [])];
      for (const cardCode of allCards) {
        cardCounts[cardCode] = (cardCounts[cardCode] || 0) + 1;
      }

      // Print the list of all passwords in the collection
      if (Array.isArray(collection.collection)) {
        const allPasswords = collection.collection.map((entry: any) => entry.password);
      }

      // Use collection.collection[cardCode]?.Common for available copies
      let canUse = true;
      for (const cardCode in cardCounts) {
        // Find the card entry in the collection array by matching the 'password' field
        let cardEntry: any;
        for (const card of collection.collection) {
          if (card.password == cardCode) {
            cardEntry = card;
            break;
          }
        }
        if (!cardEntry){
          canUse=false;
          break;
        }

        const available =
          (cardEntry.copies["Common"] || 0) +
          (cardEntry.copies["Rare"] || 0) +
          (cardEntry.copies["Super Rare"] || 0) +
          (cardEntry.copies["Ultra Rare"] || 0) +
          (cardEntry.copies["Secret Rare"] || 0) +
          (cardEntry.copies["Ultimate Rare"] || 0);

        if (available < cardCounts[cardCode]) {
          canUse = false;
          break;
        }
      }
      deck.canUse = canUse;
      if (canUse){
      }
    }
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

    const deck: Omit<Deck, "_id"> = {
      deckId: user.userId + "-" + Date.now().toString(),
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
