// Marketplace auctions API
import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { getDatabase } from "@/lib/db"
import { ObjectId } from "mongodb"
import { MARKETPLACE_AUCTION_EXPIRY } from "@/lib/constants"

export async function GET(request: NextRequest) {
  try {
    const db = await getDatabase()
    const auctionsCollection = db.collection("marketplace")
    const now = new Date()

    // Process expired auctions
    const expiredAuctions = await auctionsCollection
      .find({ type: "auction", expiresAt: { $lt: now }, sold: false })
      .toArray()

    for (const auction of expiredAuctions) {
      if (auction.bids && auction.bids.length > 0) {
        const highestBid = auction.bids[auction.bids.length - 1]

        // Transfer card and credits
        const collectionCollection = db.collection("collection")
        const usersCollection = db.collection("users")

        await collectionCollection.updateOne(
          { _id: auction.cardId },
          { $set: { userId: highestBid.bidderId, forSale: false } },
        )

        await usersCollection.updateOne(
          { _id: new ObjectId(auction.sellerId) },
          { $inc: { credits: highestBid.amount } },
        )

        // Remove bid credits from bidders and refund non-winning bids
        for (let i = 0; i < auction.bids.length - 1; i++) {
          const bid = auction.bids[i]
          await usersCollection.updateOne({ _id: new ObjectId(bid.bidderId) }, { $inc: { credits: bid.amount } })
        }

        await auctionsCollection.updateOne(
          { _id: auction._id },
          { $set: { sold: true, soldAt: now, winner: highestBid.bidderId } },
        )
      } else {
        // No bids, just expire it
        await auctionsCollection.updateOne({ _id: auction._id }, { $set: { sold: true, soldAt: now } })
      }
    }

    const auctions = await auctionsCollection.find({ type: "auction", sold: false }).sort({ createdAt: -1 }).toArray()

    return NextResponse.json(auctions)
  } catch (error) {
    console.error("Get auctions error:", error)
    return NextResponse.json({ error: "Failed to fetch auctions" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { cardId, startingBid } = await request.json()

    if (!startingBid || startingBid <= 0) {
      return NextResponse.json({ error: "Invalid starting bid" }, { status: 400 })
    }

    const db = await getDatabase()
    const collectionCollection = db.collection("collection")
    const auctionsCollection = db.collection("marketplace")

    // Verify card belongs to user
    const card = await collectionCollection.findOne({ _id: new ObjectId(cardId), userId: user.userId })

    if (!card) {
      return NextResponse.json({ error: "Card not found" }, { status: 404 })
    }

    const now = new Date()
    const expiresAt = new Date(now.getTime() + MARKETPLACE_AUCTION_EXPIRY)

    // Create auction
    const result = await auctionsCollection.insertOne({
      cardId: new ObjectId(cardId),
      sellerId: user.userId,
      startingBid,
      type: "auction",
      bids: [],
      expiresAt,
      sold: false,
      createdAt: now,
    })

    // Mark card as for sale
    await collectionCollection.updateOne(
      { _id: new ObjectId(cardId) },
      { $set: { forSale: true, auctionId: result.insertedId } },
    )

    return NextResponse.json({
      _id: result.insertedId,
      cardId,
      startingBid,
      expiresAt,
    })
  } catch (error) {
    console.error("Create auction error:", error)
    return NextResponse.json({ error: "Failed to create auction" }, { status: 500 })
  }
}
