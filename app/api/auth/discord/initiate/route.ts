// Generate state and redirect to Discord OAuth
import { NextResponse } from "next/server"
import { randomBytes } from "crypto"
import { getDatabase } from "@/lib/db"

export async function GET() {
  const state = randomBytes(32).toString("hex")

  // Store state in database with 10-minute expiration
  const db = await getDatabase()
  await db.collection("oauth_states").insertOne({
    state,
    createdAt: new Date(),
    expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
  })

  const clientId = process.env.DISCORD_CLIENT_ID
  const redirectUri = `${process.env.NEXTAUTH_URL}/api/auth/discord/callback`
  const scopes = ["identify"]

  const discordAuthUrl = new URL("https://discord.com/api/oauth2/authorize")
  discordAuthUrl.searchParams.set("client_id", clientId || "")
  discordAuthUrl.searchParams.set("redirect_uri", redirectUri)
  discordAuthUrl.searchParams.set("response_type", "code")
  discordAuthUrl.searchParams.set("scope", scopes.join(" "))
  discordAuthUrl.searchParams.set("state", state)

  return NextResponse.redirect(discordAuthUrl.toString())
}
