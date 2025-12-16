// Discord OAuth callback handler
import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/db"
import { createToken } from "@/lib/auth"
import { CREDITS_ON_SIGNUP } from "@/lib/constants"
import { randomBytes } from "crypto"

const stateStore = new Map<string, { created: number }>()

// Clean up old states every hour
setInterval(() => {
  const now = Date.now()
  for (const [key, value] of stateStore.entries()) {
    if (now - value.created > 600000) {
      // 10 minutes
      stateStore.delete(key)
    }
  }
}, 3600000)

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code")
  const state = request.nextUrl.searchParams.get("state")

  if (!code) {
    return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/?error=no_code`)
  }

  if (!state || !stateStore.has(state)) {
    return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/?error=invalid_state`)
  }

  stateStore.delete(state) // One-time use

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
        redirect_uri: `${process.env.NEXTAUTH_URL}/api/auth/discord`,
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
    const db = await getDatabase()
    const usersCollection = db.collection("users")

    let user = await usersCollection.findOne({ discordId: discordUser.id })

    if (!user) {
      // New user - give signup credits and set last claim time
      user = {
        _id: discordUser.id,
        discordId: discordUser.id,
        username: discordUser.username,
        avatar: `https://cdn.discordapp.com/avatars/${discordUser.id}/${discordUser.avatar}.png`,
        credits: CREDITS_ON_SIGNUP,
        lastCreditClaim: new Date(),
        isAdmin: false, // Default to non-admin
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

    const response = NextResponse.redirect(`${process.env.NEXTAUTH_URL}/dashboard`)
    response.cookies.set("auth-token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60,
    })

    return response
  } catch (error) {
    console.error("Discord auth error:", error instanceof Error ? error.message : "Unknown error")
    return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/?error=auth_failed`)
  }
}

export async function POST(request: NextRequest) {
  const state = randomBytes(32).toString("hex")
  stateStore.set(state, { created: Date.now() })

  return NextResponse.json({ state })
}
