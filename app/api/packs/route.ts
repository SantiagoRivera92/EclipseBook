// Get available card packs
import { NextResponse } from "next/server"
import { getDatabase } from "@/lib/db"

export async function GET() {
  try {
    const db = await getDatabase()
    const packsCollection = db.collection("card_packs")

    const packs = await packsCollection.find({}).toArray()

    return NextResponse.json(packs)
  } catch (error) {
    console.error("Get packs error:", error)
    return NextResponse.json({ error: "Failed to fetch packs" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const { name, price, cardPool, slotRatios } = await request.json()

    // Validate slot ratios add up to exactly 1
    const total = slotRatios.reduce((sum: number, r: any) => sum + r.chance, 0)
    if (Math.abs(total - 1) > 0.0001) {
      return NextResponse.json(
        { error: "Slot ratios must add up to exactly 1. Current total: " + total },
        { status: 400 },
      )
    }

    // Calculate average dust value
    const averageDustValue = slotRatios.reduce((sum: number, r: any) => sum + r.chance * r.dv, 0) * 8

    // Validate price is greater than average dust value
    if (price <= averageDustValue) {
      return NextResponse.json(
        {
          error: `Pack price (${price}) must be greater than average dust value (${averageDustValue.toFixed(2)})`,
        },
        { status: 400 },
      )
    }

    const db = await getDatabase()
    const packsCollection = db.collection("card_packs")

    const result = await packsCollection.insertOne({
      name,
      price,
      cardPool,
      slotRatios,
      averageDustValue,
      createdAt: new Date(),
    })

    return NextResponse.json({
      _id: result.insertedId,
      name,
      price,
      cardPool,
      slotRatios,
      averageDustValue,
    })
  } catch (error) {
    console.error("Create pack error:", error)
    return NextResponse.json({ error: "Failed to create pack" }, { status: 500 })
  }
}
