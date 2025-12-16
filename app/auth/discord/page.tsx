"use client"

import { useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Suspense } from "react"

function DiscordAuthContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const error = searchParams.get("error")

  useEffect(() => {
    const authenticate = async () => {
      if (error) {
        console.error("Discord auth error:", error)
        router.push(`/?error=discord_${error}`)
        return
      }

      // The actual OAuth redirect from Discord will hit this page with the code param
      // Next.js GET request to /api/auth/discord will be made by the Discord redirect
      // We just show loading and wait for the server to redirect us
      setTimeout(() => {
        console.log("Auth redirect should have happened by now")
        router.push("/")
      }, 3000)
    }

    authenticate()
  }, [error, router])

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-slate-950 to-slate-900">
      <div className="text-white text-center">
        <h1 className="text-2xl font-bold mb-4">Authenticating with Discord...</h1>
        <p className="text-slate-300">Please wait while we log you in.</p>
      </div>
    </div>
  )
}

export default function DiscordAuthPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <DiscordAuthContent />
    </Suspense>
  )
}
