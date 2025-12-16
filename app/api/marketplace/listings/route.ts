// Marketplace listings API
import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { getDatabase } from "@/lib/db"
import { ObjectId } from "mongodb"
import { MARKETPLACE_LISTING_EXPIRY } from "@/lib/constants"
import { MarketplaceListingSchema } from "@/lib/schemas/validation"

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

    return NextResponse.json(listings)
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

    const validation = MarketplaceListingSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        {
          error: "Invalid input",
          details: validation.error.errors,
        },
        { status: 400 },
      )
    }

    const { cardId, price } = validation.data

    const db = await getDatabase()
    const collectionCollection = db.collection("collection")
    const listingsCollection = db.collection("marketplace")

    // Verify card belongs to user
    const card = await collectionCollection.findOne({ _id: new ObjectId(cardId), userId: user.userId })

    if (!card) {
      return NextResponse.json({ error: "Card not found or you don't own it" }, { status: 404 })
    }

    if (card.forSale) {
      return NextResponse.json({ error: "Card is already listed for sale" }, { status: 400 })
    }

    const now = new Date()
    const expiresAt = new Date(now.getTime() + MARKETPLACE_LISTING_EXPIRY)

    // Create listing
    const result = await listingsCollection.insertOne({
      cardId: new ObjectId(cardId),
      sellerId: user.userId,
      price,
      type: "listing",
      expiresAt,
      sold: false,
      createdAt: now,
    })

    // Mark card as for sale
    await collectionCollection.updateOne(
      { _id: new ObjectId(cardId) },
      { $set: { forSale: true, listingId: result.insertedId } },
    )

    return NextResponse.json({
      _id: result.insertedId,
      cardId,
      price,
      expiresAt,
    })
  } catch (error) {
    console.error("Create listing error:", error instanceof Error ? error.message : "Unknown error")
    return NextResponse.json({ error: "Failed to create listing" }, { status: 500 })
  }
}
