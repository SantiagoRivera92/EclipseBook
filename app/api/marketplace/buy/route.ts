// Buy a card from marketplace
import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { getDatabase } from "@/lib/db"
import { ObjectId } from "mongodb"

export async function POST(request: NextRequest) {
  const user = await getCurrentUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { listingId } = await request.json()

    if (!ObjectId.isValid(listingId)) {
      return NextResponse.json({ error: "Invalid listing ID" }, { status: 400 })
    }

    const db = await getDatabase()
    const listingsCollection = db.collection("marketplace")
    const collectionCollection = db.collection("collection")
    const usersCollection = db.collection("users")

    const session = db.client.startSession()

    try {
      await session.withTransaction(async () => {
        const listing = await listingsCollection.findOne({ _id: new ObjectId(listingId) }, { session })

        if (!listing) {
          throw new Error("Listing not found")
        }

        if (listing.sold) {
          throw new Error("Listing already sold")
        }

        if (listing.sellerId === user.userId) {
          throw new Error("Cannot buy your own listing")
        }

        const buyer = await usersCollection.findOne({ _id: new ObjectId(user.userId) }, { session })

        if (!buyer || buyer.credits < listing.price) {
          throw new Error("Insufficient credits")
        }

        const seller = await usersCollection.findOne({ _id: new ObjectId(listing.sellerId) }, { session })

        if (!seller) {
          throw new Error("Seller not found")
        }

        // Get the card and verify it exists and belongs to seller
        const card = await collectionCollection.findOne({ _id: listing.cardId, userId: listing.sellerId }, { session })

        if (!card) {
          throw new Error("Card not found or seller no longer owns it")
        }

        const now = new Date()

        // Transfer credits
        await usersCollection.updateOne(
          { _id: new ObjectId(user.userId) },
          { $inc: { credits: -listing.price }, $set: { updatedAt: now } },
          { session },
        )

        await usersCollection.updateOne(
          { _id: new ObjectId(listing.sellerId) },
          { $inc: { credits: listing.price }, $set: { updatedAt: now } },
          { session },
        )

        // Transfer card ownership
        await collectionCollection.updateOne(
          { _id: listing.cardId },
          {
            $set: {
              userId: user.userId,
              forSale: false,
              updatedAt: now,
            },
            $unset: { listingId: "" },
          },
          { session },
        )

        // Mark listing as sold
        await listingsCollection.updateOne(
          { _id: new ObjectId(listingId) },
          { $set: { sold: true, soldAt: now } },
          { session },
        )
      })

      return NextResponse.json({
        success: true,
        message: "Card purchased successfully",
      })
    } finally {
      await session.endSession()
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Failed to buy card"
    console.error("Buy card error:", errorMessage)
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}
