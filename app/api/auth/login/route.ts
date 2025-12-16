// Login endpoint that redirects to Discord OAuth
import { NextResponse } from "next/server"

export function GET() {
  return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/api/auth/discord/initiate`)
}
