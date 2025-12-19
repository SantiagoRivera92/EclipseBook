// Buy cards from marketplace (streamlined for quantity-based trading)
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
    const { listingId, quantity } = await request.json()

    if (!ObjectId.isValid(listingId) || !quantity || quantity <= 0) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 })
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

        const availableQuantity = listing.quantity - (listing.soldQuantity || 0)

        if (availableQuantity < quantity) {
          throw new Error(`Only ${availableQuantity} copies available`)
        }

        const totalPrice = listing.price * quantity

        const buyer = await usersCollection.findOne({ discordId: user.userId }, { session })

        if (!buyer || buyer.credits < totalPrice) {
          throw new Error("Insufficient credits")
        }

        const seller = await usersCollection.findOne({ discordId: listing.sellerId }, { session })

        if (!seller) {
          throw new Error("Seller not found")
        }

        const now = new Date()

        // Transfer credits
        await usersCollection.updateOne(
          { discordId: user.userId },
          { $inc: { credits: -totalPrice }, $set: { updatedAt: now } },
          { session },
        )

        await usersCollection.updateOne(
          { discordId: listing.sellerId },
          { $inc: { credits: totalPrice }, $set: { updatedAt: now } },
          { session },
        )

        // Add cards to buyer's collection
        const buyerCollection = await collectionCollection.findOne({ userId: user.userId }, { session })

        if (!buyerCollection) {
          // Create new collection
          await collectionCollection.insertOne(
            {
              userId: user.userId,
              collection: [
                {
                  password: listing.cardCode,
                  copies: {
                    Common: listing.rarity === "Common" ? quantity : 0,
                    Rare: listing.rarity === "Rare" ? quantity : 0,
                    "Super Rare": listing.rarity === "Super Rare" ? quantity : 0,
                    "Ultra Rare": listing.rarity === "Ultra Rare" ? quantity : 0,
                    "Secret Rare": listing.rarity === "Secret Rare" ? quantity : 0,
                    "Ultimate Rare": listing.rarity === "Ultimate Rare" ? quantity : 0,
                  },
                },
              ],
              createdAt: now,
              updatedAt: now,
            },
            { session },
          )
        } else {
          const cardEntry = buyerCollection.collection?.find((entry: any) => entry.password === listing.cardCode)

          if (!cardEntry) {
            // Add new card entry
            await collectionCollection.updateOne(
              { userId: user.userId },
              {
                $push: {
                  collection: {
                    password: listing.cardCode,
                    copies: {
                      Common: listing.rarity === "Common" ? quantity : 0,
                      Rare: listing.rarity === "Rare" ? quantity : 0,
                      "Super Rare": listing.rarity === "Super Rare" ? quantity : 0,
                      "Ultra Rare": listing.rarity === "Ultra Rare" ? quantity : 0,
                      "Secret Rare": listing.rarity === "Secret Rare" ? quantity : 0,
                      "Ultimate Rare": listing.rarity === "Ultimate Rare" ? quantity : 0,
                    },
                  },
                },
                $set: { updatedAt: now },
              },
              { session },
            )
          } else {
            // Increment existing entry
            await collectionCollection.updateOne(
              { userId: user.userId, "collection.password": listing.cardCode },
              {
                $inc: { [`collection.$.copies.${listing.rarity}`]: quantity },
                $set: { updatedAt: now },
              },
              { session },
            )
          }
        }

        // Update listing
        const newSoldQuantity = (listing.soldQuantity || 0) + quantity
        const allSold = newSoldQuantity >= listing.quantity

        await listingsCollection.updateOne(
          { _id: new ObjectId(listingId) },
          {
            $set: {
              soldQuantity: newSoldQuantity,
              sold: allSold,
              ...(allSold && { soldAt: now }),
            },
          },
          { session },
        )

        // If listing is fully sold or expires, return unsold cards to seller
        if (allSold) {
          // All sold, no need to return anything
        }
      })

      return NextResponse.json({
        success: true,
        message: `Purchased ${quantity} card(s) successfully`,
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
