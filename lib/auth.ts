// Authentication utilities with Discord OAuth

import { JWTPayload, jwtVerify, SignJWT } from "jose"
import { cookies } from "next/headers"

if (!process.env.NEXTAUTH_SECRET) {
  throw new Error("NEXTAUTH_SECRET environment variable must be set for security")
}

const secret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET)

export interface TokenPayload extends JWTPayload {
  userId: string
  discordId: string
  isAdmin?: boolean // Add admin flag to JWT to avoid TOCTOU attacks
}

export async function createToken(payload: TokenPayload): Promise<string> {
  const token = await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(secret)

  return token
}

export async function verifyToken(token: string): Promise<TokenPayload | null> {
  try {
    const verified = await jwtVerify(token, secret)
    return verified.payload as TokenPayload
  } catch (err) {
    return null
  }
}

export async function setAuthCookie(token: string): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.set("auth-token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 30 * 24 * 60 * 60,
  })
}

export async function getAuthCookie(): Promise<string | undefined> {
  const cookieStore = await cookies()
  return cookieStore.get("auth-token")?.value
}

export async function clearAuthCookie(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete("auth-token")
}

export async function getCurrentUser(): Promise<TokenPayload | null> {
  const token = await getAuthCookie()
  if (!token) return null
  return verifyToken(token)
}
