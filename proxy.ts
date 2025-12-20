import { type NextRequest, NextResponse } from "next/server"
import { verifyToken } from "@/lib/auth"
import { getDatabase } from "@/lib/db"

// Rate limiting store (in production, use Redis or similar)
const rateLimitStore = new Map<string, { count: number; resetAt: number }>()

const RATE_LIMIT_WINDOW = 60000 // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 60 // 60 requests per minute

function rateLimit(identifier: string): boolean {
  const now = Date.now()
  const record = rateLimitStore.get(identifier)

  if (!record || now > record.resetAt) {
    rateLimitStore.set(identifier, { count: 1, resetAt: now + RATE_LIMIT_WINDOW })
    return true
  }

  if (record.count >= RATE_LIMIT_MAX_REQUESTS) {
    return false
  }

  record.count++
  return true
}

// Clean up old entries periodically
setInterval(() => {
  const now = Date.now()
  for (const [key, value] of rateLimitStore.entries()) {
    if (now > value.resetAt) {
      rateLimitStore.delete(key)
    }
  }
}, RATE_LIMIT_WINDOW)

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  // Apply rate limiting to API routes
  if (pathname.startsWith("/api/")) {
    const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown"
    const identifier = `${ip}:${pathname}`

    if (!rateLimit(identifier)) {
      return NextResponse.json({ error: "Too many requests. Please try again later." }, { status: 429 })
    }

    // Skip rate limit check for auth routes
    if (pathname.startsWith("/api/auth/")) {
      return NextResponse.next()
    }

    // Verify authentication for protected API routes
    const token = request.cookies.get("auth-token")?.value

    if (token) {
      const payload = await verifyToken(token)
      if (!payload) {
        return NextResponse.json({ error: "Invalid or expired token" }, { status: 401 })
      }
    }
  }

  // Protect admin routes
  if (pathname.startsWith("/admin")) {
    const token = request.cookies.get("auth-token")?.value

    if (!token) {
      return NextResponse.redirect(new URL("/", request.url))
    }

    const payload = await verifyToken(token)
    if (!payload) {
      return NextResponse.redirect(new URL("/dashboard", request.url))
    }

    // Check database for current admin status (JWT might be stale)
    const db = await getDatabase()
    const usersCollection = db.collection("users")
    const user = await usersCollection.findOne(
      { discordId: payload.userId },
      { projection: { isAdmin: 1 } }
    )

    if (!user || !user.isAdmin) {
      return NextResponse.redirect(new URL("/dashboard", request.url))
    }
  }

  // Protect authenticated pages
  const protectedPaths = ["/collection", "/dashboard", "/decks", "/help", "/packs", "/play", "/profile", "/tournaments"]
  if (protectedPaths.some((path) => pathname.startsWith(path))) {
    const token = request.cookies.get("auth-token")?.value

    if (!token) {
      return NextResponse.redirect(new URL("/", request.url))
    }

    const payload = await verifyToken(token)
    if (!payload) {
      return NextResponse.redirect(new URL("/", request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    "/api/:path*",
    "/dashboard/:path*",
    "/admin/:path*",
    "/decks/:path*",
    "/collection/:path*",
    "/packs/:path*",
    "/play/:path*",
    "/profile/:path*",
    "/help/:path*",
  ],
}
