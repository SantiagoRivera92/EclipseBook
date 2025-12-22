import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/db"
import { createToken, setAuthCookie } from "@/lib/auth"
import { CREDITS_ON_SIGNUP } from "@/lib/constants"

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code")
  const state = request.nextUrl.searchParams.get("state")

  if (!code) {
    return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/?error=no_code`)
  }

  if (!state) {
    console.error("Missing state parameter")
    return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/?error=invalid_state`)
  }

  const db = await getDatabase()

  // Validate state from database
  const stateDoc = await db.collection("oauth_states").findOne({
    state,
    expiresAt: { $gt: new Date() },
  })

  if (!stateDoc) {
    console.error("Invalid or expired state parameter")
    return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/?error=invalid_state`)
  }

  // Delete state after one-time use
  await db.collection("oauth_states").deleteOne({ state })

  try {
    // Exchange code for access token with Discord
    const tokenResponse = await fetch("https://discord.com/api/oauth2/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: process.env.DISCORD_CLIENT_ID || "",
        client_secret: process.env.DISCORD_CLIENT_SECRET || "",
        grant_type: "authorization_code",
        code,
        redirect_uri: `${process.env.NEXTAUTH_URL}/api/auth/discord/callback`,
      }),
    })

    const tokenData = await tokenResponse.json()

    if (!tokenData.access_token) {
      console.error("Discord token exchange failed")
      return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/?error=auth_failed`)
    }

    // Fetch user info from Discord
    const userResponse = await fetch("https://discord.com/api/users/@me", {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    })

    const discordUser = await userResponse.json()

    // Find or create user in MongoDB
    const usersCollection = db.collection("users")

    let user = await usersCollection.findOne({ discordId: discordUser.id })

    if (!user) {
      user = {
        _id: discordUser.id,
        discordId: discordUser.id,
        username: discordUser.username,
        avatar: `https://cdn.discordapp.com/avatars/${discordUser.id}/${discordUser.avatar}.png`,
        credits: CREDITS_ON_SIGNUP,
        ladderWins: 0,
        ladderLosses: 0,
        ladderWinStreak: 0,
        lastCreditClaim: new Date(),
        isAdmin: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
      const result = await usersCollection.insertOne(user)
      user._id = result.insertedId
    }

    const token = await createToken({
      userId: user._id.toString(),
      discordId: user.discordId,
      isAdmin: user.isAdmin || false,
    })

    await setAuthCookie(token)
    return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/dashboard`)
  } catch (error) {
    console.error("Discord auth error:", error instanceof Error ? error.message : "Unknown error")
    return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/?error=auth_failed`)
  }
}
