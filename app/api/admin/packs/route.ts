import { ObjectId } from "mongodb"
// Update a pack by _id (slug)
export async function PUT(request: NextRequest) {
  const user = await getCurrentUser()
  if (!user || !user.isAdmin) {
    return NextResponse.json({ error: "Unauthorized - Admin only" }, { status: 403 })
  }
  try {
    const body = await request.json()
    const { _id, ...updateData } = body
    if (!_id) {
      return NextResponse.json({ error: "Missing pack _id" }, { status: 400 })
    }
    // Validate slot ratios add up to exactly 1
    if (!validateSlotRatios(updateData.slotRatios)) {
      const total = updateData.slotRatios.reduce((sum: any, r: { chance: any }) => sum + r.chance, 0)
      return NextResponse.json(
        { error: `Slot ratios must add up to exactly 1. Current total: ${total.toFixed(4)}` },
        { status: 400 },
      )
    }
    // Calculate average dust value
    const averageDustValue = updateData.slotRatios.reduce((sum: number, r: { chance: number; dv: number }) => sum + r.chance * r.dv, 0) * 8
    if (updateData.price <= averageDustValue) {
      return NextResponse.json(
        {
          error: `Pack price (${updateData.price}) must be greater than average dust value (${averageDustValue.toFixed(2)})`,
        },
        { status: 400 },
      )
    }
    // Validate card pool structure
    if (!Array.isArray(updateData.cardPool) || updateData.cardPool.length === 0) {
      return NextResponse.json({ error: "Card pool must be a non-empty array" }, { status: 400 })
    }
    for (const card of updateData.cardPool) {
      if (!card.code || !Array.isArray(card.rarities) || card.rarities.length === 0) {
        return NextResponse.json(
          { error: "Each card in pool must have a code and at least one rarity" },
          { status: 400 },
        )
      }
      for (const rarity of card.rarities) {
        if (!updateData.slotRatios.some((sr: any) => sr.rarity === rarity)) {
          return NextResponse.json(
            { error: `Card ${card.code} has rarity "${rarity}" which is not in slot ratios` },
            { status: 400 },
          )
        }
      }
    }
    for (const slotRatio of updateData.slotRatios) {
      const hasCard = updateData.cardPool.some((card: any) => card.rarities.includes(slotRatio.rarity))
      if (!hasCard) {
        return NextResponse.json(
          { error: `No cards found for rarity "${slotRatio.rarity}" in card pool` },
          { status: 400 },
        )
      }
    }
    // Validate with schema
    const packData = { ...updateData, _id, averageDustValue }
    const validation = CardPackSchema.safeParse(packData)
    if (!validation.success) {
      return NextResponse.json(
        {
          error: "Invalid pack data",
          details: validation.error.errors,
        },
        { status: 400 },
      )
    }
    const db = await getDatabase()
    const packsCollection = db.collection("card_packs")
    const result = await packsCollection.updateOne({ _id }, { $set: packData })
    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "Pack not found" }, { status: 404 })
    }
    return NextResponse.json({ success: true, pack: packData })
  } catch (error) {
    console.error("Admin pack update error:", error instanceof Error ? error.message : "Unknown error")
    return NextResponse.json({ error: "Failed to update pack" }, { status: 500 })
  }
}

// Delete a pack by _id (slug)
export async function DELETE(request: NextRequest) {
  const user = await getCurrentUser()
  if (!user || !user.isAdmin) {
    return NextResponse.json({ error: "Unauthorized - Admin only" }, { status: 403 })
  }
  try {
    const { _id } = await request.json()
    if (!_id) {
      return NextResponse.json({ error: "Missing pack _id" }, { status: 400 })
    }
    const db = await getDatabase()
    const packsCollection = db.collection("card_packs")
    const result = await packsCollection.deleteOne({ _id })
    if (result.deletedCount === 0) {
      return NextResponse.json({ error: "Pack not found" }, { status: 404 })
    }
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Admin pack delete error:", error instanceof Error ? error.message : "Unknown error")
    return NextResponse.json({ error: "Failed to delete pack" }, { status: 500 })
  }
}
// Admin endpoint to create card packs
import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { getDatabase } from "@/lib/db"
import { CardPackSchema, validateSlotRatios } from "@/lib/schemas/index"

export async function POST(request: NextRequest) {
  const user = await getCurrentUser()

  if (!user || !user.isAdmin) {
    return NextResponse.json({ error: "Unauthorized - Admin only" }, { status: 403 })
  }

  try {
    const body = await request.json()

    // Validate slot ratios add up to exactly 1
    if (!validateSlotRatios(body.slotRatios)) {
      const total = body.slotRatios.reduce((sum: number, r: any) => sum + r.chance, 0)
      return NextResponse.json(
        { error: `Slot ratios must add up to exactly 1. Current total: ${total.toFixed(4)}` },
        { status: 400 },
      )
    }

    // Calculate average dust value
    const averageDustValue = body.slotRatios.reduce((sum: number, r: any) => sum + r.chance * r.dv, 0) * 8

    // Validate price is greater than average dust value
    if (body.price <= averageDustValue) {
      return NextResponse.json(
        {
          error: `Pack price (${body.price}) must be greater than average dust value (${averageDustValue.toFixed(2)})`,
        },
        { status: 400 },
      )
    }

    // Validate card pool structure
    if (!Array.isArray(body.cardPool) || body.cardPool.length === 0) {
      return NextResponse.json({ error: "Card pool must be a non-empty array" }, { status: 400 })
    }

    // Validate each card in pool has code and rarities
    for (const card of body.cardPool) {
      if (!card.code || !Array.isArray(card.rarities) || card.rarities.length === 0) {
        return NextResponse.json(
          { error: "Each card in pool must have a code and at least one rarity" },
          { status: 400 },
        )
      }

      // Validate that all rarities in card pool exist in slot ratios
      for (const rarity of card.rarities) {
        if (!body.slotRatios.some((sr: any) => sr.rarity === rarity)) {
          return NextResponse.json(
            { error: `Card ${card.code} has rarity "${rarity}" which is not in slot ratios` },
            { status: 400 },
          )
        }
      }
    }

    // Validate that each rarity in slot ratios has at least one card
    for (const slotRatio of body.slotRatios) {
      const hasCard = body.cardPool.some((card: any) => card.rarities.includes(slotRatio.rarity))
      if (!hasCard) {
        return NextResponse.json(
          { error: `No cards found for rarity "${slotRatio.rarity}" in card pool` },
          { status: 400 },
        )
      }
    }


    // Set _id as a slugified version of the pack name
    function slugify(str: string) {
      return str
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)+/g, "")
    }

    const packData: any = {
      _id: slugify(body.name),
      name: body.name,
      description: body.description || "",
      price: body.price,
      cardPool: body.cardPool,
      slotRatios: body.slotRatios,
      averageDustValue,
      createdAt: new Date(),
    }

    // Validate with schema
    const validation = CardPackSchema.safeParse(packData)
    if (!validation.success) {
      return NextResponse.json(
        {
          error: "Invalid pack data",
          details: validation.error.errors,
        },
        { status: 400 },
      )
    }

    const db = await getDatabase()
    const packsCollection = db.collection("card_packs")

    const result = await packsCollection.insertOne(packData)

    return NextResponse.json({
      success: true,
      pack: {
        _id: result.insertedId,
        ...packData,
      },
    })
  } catch (error) {
    console.error("Admin pack creation error:", error instanceof Error ? error.message : "Unknown error")
    return NextResponse.json({ error: "Failed to create pack" }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  const user = await getCurrentUser()

  if (!user || !user.isAdmin) {
    return NextResponse.json({ error: "Unauthorized - Admin only" }, { status: 403 })
  }

  try {
    const db = await getDatabase()
    const packsCollection = db.collection("card_packs")

    const packs = await packsCollection.find({}).toArray()

    return NextResponse.json(packs)
  } catch (error) {
    console.error("Get packs error:", error instanceof Error ? error.message : "Unknown error")
    return NextResponse.json({ error: "Failed to fetch packs" }, { status: 500 })
  }
}

