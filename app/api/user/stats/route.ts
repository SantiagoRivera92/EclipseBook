// Get user stats
import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { getDatabase } from "@/lib/db"

export async function GET(request: NextRequest) {
    const user = await getCurrentUser()

    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const db = await getDatabase()
    const usersCollection = db.collection("users")

    const profile = await usersCollection.findOne({ discordId: user.userId })

    if (!profile) {
        return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const lastCreditClaim = profile.lastCreditClaim as Date
    const now = new Date();
    let canClaimCredits = false;
    if (!lastCreditClaim || (now.getTime() - new Date(lastCreditClaim).getTime()) >= 24 * 60 * 60 * 1000) {
        canClaimCredits = true;
    }

    const collection = db.collection("collection")
    const userCollection = await collection.findOne({ userId: user.userId })
    let totalCards = 0;
    if (userCollection) {
        for (const card of userCollection.collection) {
            const copies = card.copies as Record<string, number>;
            const sum = Object.values(copies).reduce((acc: number, val: number) => acc + val as number, 0);
            totalCards += sum;
        }
    }

    if (!profile) {
        return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    //TODO: Add total decks and win streak to the response dict
    
    const responseDict = {
        totalCards: totalCards,
        canClaimDaily: canClaimCredits,
    }

    return NextResponse.json(responseDict)
}
