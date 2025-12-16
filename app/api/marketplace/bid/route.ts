// Place bid on auction
import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { getDatabase } from "@/lib/db"
import { ObjectId } from "mongodb"
import { BidSchema } from "@/lib/schemas/validation"

export async function POST(request: NextRequest) {
  const user = await getCurrentUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = await request.json()

    const validation = BidSchema.safeParse({ ...body, auctionId: body.auctionId, amount: body.bidAmount })
    if (!validation.success) {
      return NextResponse.json(
        {
          error: "Invalid input",
          details: validation.error.errors,
        },
        { status: 400 },
      )
    }

    const { auctionId, amount: bidAmount } = validation.data

    const db = await getDatabase()
    const auctionsCollection = db.collection("marketplace")
    const usersCollection = db.collection("users")

    const session = db.client.startSession()

    try {
      await session.withTransaction(async () => {
        const auction = await auctionsCollection.findOne({ _id: new ObjectId(auctionId) }, { session })

        if (!auction || auction.sold) {
          throw new Error("Auction not found or already sold")
        }

        if (auction.sellerId === user.userId) {
          throw new Error("Cannot bid on your own auction")
        }

        const bidder = await usersCollection.findOne({ _id: new ObjectId(user.userId) }, { session })

        if (!bidder || bidder.credits < bidAmount) {
          throw new Error("Insufficient credits")
        }

        // Check if bid is higher than current highest
        const minBidAmount =
          auction.bids && auction.bids.length > 0
            ? auction.bids[auction.bids.length - 1].amount + 1
            : auction.startingBid

        if (bidAmount < minBidAmount) {
          throw new Error(`Bid must be at least ${minBidAmount}`)
        }

        const now = new Date()

        // If user has previous bid, refund it
        if (auction.bids && auction.bids.length > 0) {
          const previousBid = auction.bids.find((b: any) => b.bidderId === user.userId)
          if (previousBid) {
            await usersCollection.updateOne(
              { _id: new ObjectId(user.userId) },
              { $inc: { credits: previousBid.amount } },
              { session },
            )

            // Remove previous bid
            await auctionsCollection.updateOne(
              { _id: new ObjectId(auctionId) },
              { $pull: { bids: { bidderId: user.userId } } },
              { session },
            )
          }
        }

        // Deduct bid amount from bidder
        await usersCollection.updateOne(
          { _id: new ObjectId(user.userId) },
          { $inc: { credits: -bidAmount }, $set: { updatedAt: now } },
          { session },
        )

        // Add bid to auction
        await auctionsCollection.updateOne(
          { _id: new ObjectId(auctionId) },
          {
            $push: {
              bids: {
                bidderId: user.userId,
                amount: bidAmount,
                bidAt: now,
              },
            },
          },
          { session },
        )
      })

      return NextResponse.json({
        success: true,
        bidAmount,
      })
    } finally {
      await session.endSession()
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Failed to place bid"
    console.error("Place bid error:", errorMessage)
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}
