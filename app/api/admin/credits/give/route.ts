// Admin endpoint to give credits to players
import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { getDatabase } from "@/lib/db"
import { ObjectId } from "mongodb"
import { AdminCreditsSchema } from "@/lib/schemas/validation"

export async function POST(request: NextRequest) {
  const user = await getCurrentUser()

  if (!user || !user.isAdmin) {
    return NextResponse.json({ error: "Unauthorized - Admin only" }, { status: 403 })
  }

  try {
    const body = await request.json()

    const validation = AdminCreditsSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        {
          error: "Invalid input",
          details: validation.error.errors,
        },
        { status: 400 },
      )
    }

    const { targetUserId, amount, reason, targetAll } = validation.data

    const db = await getDatabase()
    const usersCollection = db.collection("users")
    const notificationsCollection = db.collection("notifications")
    const auditLogCollection = db.collection("audit_logs")
    const now = new Date()

    if (targetAll) {
      // Give credits to all players
      const result = await usersCollection.updateMany(
        {},
        {
          $inc: { credits: amount },
          $set: { updatedAt: now },
        },
      )

      // Notify all users
      const allUsers = await usersCollection.find({}).toArray()
      const notifications = allUsers.map((u: any) => ({
        userId: u._id.toString(),
        type: "admin-credits",
        title: "Admin Award",
        message: `You received ${amount} credits! Reason: ${reason}`,
        read: false,
        createdAt: now,
      }))

      if (notifications.length > 0) {
        await notificationsCollection.insertMany(notifications)
      }

      // Log action
      await auditLogCollection.insertOne({
        adminId: user.userId,
        action: "give-credits-all",
        amount,
        reason,
        affectedUsers: result.modifiedCount,
        createdAt: now,
      })

      return NextResponse.json({
        success: true,
        affectedUsers: result.modifiedCount,
        totalCreditsGiven: amount * result.modifiedCount,
      })
    } else {
      // Give credits to specific user
      if (!targetUserId) {
        return NextResponse.json({ error: "Target user ID required" }, { status: 400 })
      }

      if (!ObjectId.isValid(targetUserId)) {
        return NextResponse.json({ error: "Invalid user ID format" }, { status: 400 })
      }

      const targetUser = await usersCollection.findOne({ _id: new ObjectId(targetUserId) })

      if (!targetUser) {
        return NextResponse.json({ error: "Target user not found" }, { status: 404 })
      }

      await usersCollection.updateOne(
        { _id: new ObjectId(targetUserId) },
        {
          $inc: { credits: amount },
          $set: { updatedAt: now },
        },
      )

      // Notify user
      await notificationsCollection.insertOne({
        userId: targetUserId,
        type: "admin-credits",
        title: "Admin Award",
        message: `You received ${amount} credits! Reason: ${reason}`,
        read: false,
        createdAt: now,
      })

      // Log action
      await auditLogCollection.insertOne({
        adminId: user.userId,
        action: "give-credits-user",
        targetUserId,
        amount,
        reason,
        createdAt: now,
      })

      return NextResponse.json({
        success: true,
        newBalance: targetUser.credits + amount,
      })
    }
  } catch (error) {
    console.error("Admin credits error:", error instanceof Error ? error.message : "Unknown error")
    return NextResponse.json({ error: "Failed to give credits" }, { status: 500 })
  }
}
