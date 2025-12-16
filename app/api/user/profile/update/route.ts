// Update user profile
import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { getDatabase } from "@/lib/db"
import { ObjectId } from "mongodb"
import { ProfileUpdateSchema } from "@/lib/schemas/validation"
import { sanitizeBio } from "@/lib/utils/sanitize"

export async function PUT(request: NextRequest) {
  const user = await getCurrentUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = await request.json()

    const validation = ProfileUpdateSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        {
          error: "Invalid input",
          details: validation.error.errors,
        },
        { status: 400 },
      )
    }

    const { cardArtId, bio } = validation.data

    const db = await getDatabase()
    const usersCollection = db.collection("users")

    const sanitizedBio = bio ? sanitizeBio(bio) : undefined

    const updateData: any = {
      updatedAt: new Date(),
    }

    if (cardArtId !== undefined) updateData.cardArtId = cardArtId
    if (sanitizedBio !== undefined) updateData.bio = sanitizedBio

    const result = await usersCollection.updateOne({ _id: new ObjectId(user.userId) }, { $set: updateData })

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      message: "Profile updated",
      updated: { cardArtId, bio: sanitizedBio },
    })
  } catch (error) {
    console.error("Update profile error:", error instanceof Error ? error.message : "Unknown error")
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 })
  }
}
