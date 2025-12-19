// Marketplace auctions API (streamlined for quantity-based trading)
import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { getDatabase } from "@/lib/db"
import { MARKETPLACE_AUCTION_EXPIRY } from "@/lib/constants"
import { getCardByCode } from "@/lib/cards-db"

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

        // Transfer cards and credits
        const collectionCollection = db.collection("collection")
        const usersCollection = db.collection("users")

        // Add cards to winner's collection
        const winnerCollection = await collectionCollection.findOne({ userId: highestBid.bidderId })

        if (winnerCollection) {
          const cardEntry = winnerCollection.collection?.find((entry: any) => entry.password === auction.cardCode)

          if (!cardEntry) {
            await collectionCollection.updateOne(
              { userId: highestBid.bidderId },
              {
                $push: {
                  collection: {
                    password: auction.cardCode,
                    copies: {
                      Common: auction.rarity === "Common" ? auction.quantity : 0,
                      Rare: auction.rarity === "Rare" ? auction.quantity : 0,
                      "Super Rare": auction.rarity === "Super Rare" ? auction.quantity : 0,
                      "Ultra Rare": auction.rarity === "Ultra Rare" ? auction.quantity : 0,
                      "Secret Rare": auction.rarity === "Secret Rare" ? auction.quantity : 0,
                      "Ultimate Rare": auction.rarity === "Ultimate Rare" ? auction.quantity : 0,
                    },
                  },
                },
                $set: { updatedAt: now },
              },
            )
          } else {
            await collectionCollection.updateOne(
              { userId: highestBid.bidderId, "collection.password": auction.cardCode },
              {
                $inc: { [`collection.$.copies.${auction.rarity}`]: auction.quantity },
                $set: { updatedAt: now },
              },
            )
          }
        }

        // Give seller credits
        await usersCollection.updateOne(
          { discordId: auction.sellerId },
          { $inc: { credits: highestBid.amount }, $set: { updatedAt: now } },
        )

        // Refund non-winning bids
        for (let i = 0; i < auction.bids.length - 1; i++) {
          const bid = auction.bids[i]
          await usersCollection.updateOne(
            { discordId: bid.bidderId },
            { $inc: { credits: bid.amount }, $set: { updatedAt: now } },
          )
        }

        await auctionsCollection.updateOne(
          { _id: auction._id },
          { $set: { sold: true, soldAt: now, winner: highestBid.bidderId } },
        )
      } else {
        // No bids, return cards to seller
        const collectionCollection = db.collection("collection")
        const sellerCollection = await collectionCollection.findOne({ userId: auction.sellerId })

        if (sellerCollection) {
          const cardEntry = sellerCollection.collection?.find((entry: any) => entry.password === auction.cardCode)

          if (!cardEntry) {
            await collectionCollection.updateOne(
              { userId: auction.sellerId },
              {
                $push: {
                  collection: {
                    password: auction.cardCode,
                    copies: {
                      Common: auction.rarity === "Common" ? auction.quantity : 0,
                      Rare: auction.rarity === "Rare" ? auction.quantity : 0,
                      "Super Rare": auction.rarity === "Super Rare" ? auction.quantity : 0,
                      "Ultra Rare": auction.rarity === "Ultra Rare" ? auction.quantity : 0,
                      "Secret Rare": auction.rarity === "Secret Rare" ? auction.quantity : 0,
                      "Ultimate Rare": auction.rarity === "Ultimate Rare" ? auction.quantity : 0,
                    },
                  },
                },
                $set: { updatedAt: now },
              },
            )
          } else {
            await collectionCollection.updateOne(
              { userId: auction.sellerId, "collection.password": auction.cardCode },
              {
                $inc: { [`collection.$.copies.${auction.rarity}`]: auction.quantity },
                $set: { updatedAt: now },
              },
            )
          }
        }

        await auctionsCollection.updateOne({ _id: auction._id }, { $set: { sold: true, soldAt: now } })
      }
    }

    const auctions = await auctionsCollection.find({ type: "auction", sold: false }).sort({ createdAt: -1 }).toArray()

    // Enrich auctions with card names and images
    const enrichedAuctions = auctions.map((auction) => {
      const cardInfo = getCardByCode(auction.cardCode)
      return {
        ...auction,
        cardName: cardInfo ? cardInfo.name : "Unknown Card",
        imageUrl: `https://images.ygoprodeck.com/images/cards/${auction.cardCode}.jpg`,
      }
    })

    return NextResponse.json(enrichedAuctions)
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
    const { cardCode, rarity, quantity, startingBid } = await request.json()

    if (!cardCode || !rarity || !quantity || !startingBid || quantity <= 0 || startingBid <= 0) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 })
    }

    const db = await getDatabase()
    const collectionCollection = db.collection("collection")
    const auctionsCollection = db.collection("marketplace")

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
        { error: `Not enough copies. You have ${ownedCopies} but tried to auction ${quantity}` },
        { status: 400 },
      )
    }

    const now = new Date()
    const expiresAt = new Date(now.getTime() + MARKETPLACE_AUCTION_EXPIRY)

    // Create auction
    const result = await auctionsCollection.insertOne({
      cardCode,
      rarity,
      quantity,
      sellerId: user.userId,
      startingBid,
      type: "auction",
      bids: [],
      expiresAt,
      sold: false,
      createdAt: now,
    })

    // Decrement user's collection (reserve the cards for auction)
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
      startingBid,
      expiresAt,
    })
  } catch (error) {
    console.error("Create auction error:", error)
    return NextResponse.json({ error: "Failed to create auction" }, { status: 500 })
  }
}
