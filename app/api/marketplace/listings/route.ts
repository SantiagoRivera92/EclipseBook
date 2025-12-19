// Marketplace listings API (streamlined for quantity-based trading)
import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { getDatabase } from "@/lib/db"
import { MARKETPLACE_LISTING_EXPIRY } from "@/lib/constants"
import { getCardByCode } from "@/lib/cards-db"

export async function GET(request: NextRequest) {
  try {
    const db = await getDatabase()
    const listingsCollection = db.collection("marketplace")
    const now = new Date()

    // Remove expired listings
    await listingsCollection.deleteMany({
      type: "listing",
      expiresAt: { $lt: now },
    })

    const listings = await listingsCollection.find({ type: "listing", sold: false }).sort({ createdAt: -1 }).toArray()

    // Enrich listings with card names and images
    const enrichedListings = listings.map((listing) => {
      const cardInfo = getCardByCode(listing.cardCode)
      return {
        ...listing,
        cardName: cardInfo ? cardInfo.name : "Unknown Card",
        imageUrl: `https://images.ygoprodeck.com/images/cards/${listing.cardCode}.jpg`,
      }
    })

    return NextResponse.json(enrichedListings)
  } catch (error) {
    console.error("Get listings error:", error instanceof Error ? error.message : "Unknown error")
    return NextResponse.json({ error: "Failed to fetch listings" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { cardCode, rarity, quantity, price } = body

    if (!cardCode || !rarity || !quantity || !price || quantity <= 0 || price <= 0) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 })
    }

    const db = await getDatabase()
    const collectionCollection = db.collection("collection")
    const listingsCollection = db.collection("marketplace")

    // Verify user owns enough copies
    const userCollection = await collectionCollection.findOne({ userId: user.userId })

    if (!userCollection) {
      return NextResponse.json({ error: "Collection not found" }, { status: 404 })
    }

    const cardEntry = userCollection.collection?.find((entry: any) => entry.password === cardCode)

    if (!cardEntry) {
      return NextResponse.json({ error: "Card not found in collection" }, { status: 404 })
    }

    const ownedCopies = cardEntry.copies[rarity] || 0

    if (ownedCopies < quantity) {
      return NextResponse.json(
        { error: `Not enough copies. You have ${ownedCopies} but tried to list ${quantity}` },
        { status: 400 },
      )
    }

    const now = new Date()
    const expiresAt = new Date(now.getTime() + MARKETPLACE_LISTING_EXPIRY)

    // Create listing
    const result = await listingsCollection.insertOne({
      cardCode,
      rarity,
      quantity,
      sellerId: user.userId,
      price,
      type: "listing",
      expiresAt,
      sold: false,
      soldQuantity: 0,
      createdAt: now,
    })

    // Decrement user's collection (reserve the cards for sale)
    await collectionCollection.updateOne(
      { userId: user.userId, "collection.password": cardCode },
      {
        $inc: { [`collection.$.copies.${rarity}`]: -quantity },
        $set: { updatedAt: now },
      },
    )

    return NextResponse.json({
      _id: result.insertedId,
      cardCode,
      rarity,
      quantity,
      price,
      expiresAt,
    })
  } catch (error) {
    console.error("Create listing error:", error instanceof Error ? error.message : "Unknown error")
    return NextResponse.json({ error: "Failed to create listing" }, { status: 500 })
  }
}
