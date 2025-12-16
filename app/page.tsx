"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function Home() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem("auth_token")
      if (token) {
        try {
          const res = await fetch("/api/user/profile", {
            headers: { Authorization: `Bearer ${token}` },
          })
          if (res.ok) {
            const data = await res.json()
            setUser(data)
          }
        } catch (error) {
          console.error("Failed to fetch user:", error)
        }
      }
      setLoading(false)
    }
    fetchUser()
  }, [])

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-950 to-slate-900 text-white">
        <nav className="flex justify-between items-center px-8 py-6 border-b border-slate-800">
          <h1 className="text-2xl font-bold text-amber-400">EclipseBook</h1>
          <a href="/api/auth/discord/initiate">
            <Button className="bg-amber-500 hover:bg-amber-600 text-black font-semibold">Login with Discord</Button>
          </a>
        </nav>

        <main className="max-w-6xl mx-auto px-8 py-24">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-bold mb-4 text-balance">Competitive Card Gaming Redefined</h2>
            <p className="text-xl text-slate-300 mb-8 text-balance">
              Build your collection, master the ladder, and trade with the community
            </p>
            <a href="/api/auth/discord/initiate">
              <Button size="lg" className="bg-amber-500 hover:bg-amber-600 text-black font-bold text-lg px-8">
                Start Playing Now
              </Button>
            </a>
          </div>

          <div className="grid md:grid-cols-3 gap-6 mt-16">
            <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
              <h3 className="text-xl font-bold text-amber-400 mb-2">Climb the Ladder</h3>
              <p className="text-slate-300">
                Compete against players worldwide. Earn credits with winning streaks and prove your skill.
              </p>
            </div>
            <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
              <h3 className="text-xl font-bold text-amber-400 mb-2">Build Your Collection</h3>
              <p className="text-slate-300">
                Open card packs, build powerful decks, and unlock trophies by mastering different strategies.
              </p>
            </div>
            <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
              <h3 className="text-xl font-bold text-amber-400 mb-2">Trade & Market</h3>
              <p className="text-slate-300">
                List your cards for sale or run auctions. Build your collection through smart trading.
              </p>
            </div>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 to-slate-900 text-white">
      <nav className="flex justify-between items-center px-8 py-6 border-b border-slate-800">
        <h1 className="text-2xl font-bold text-amber-400">EclipseBook</h1>
        <div className="flex gap-4 items-center">
          <span className="text-amber-400 font-bold">{user.credits} Credits</span>
          <Link href="/profile">
            <Button variant="outline">Profile</Button>
          </Link>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-8 py-12">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link href="/packs">
            <div className="bg-gradient-to-br from-amber-600 to-amber-700 rounded-lg p-6 cursor-pointer hover:shadow-lg transition-all h-full">
              <h3 className="text-lg font-bold mb-2">Open Packs</h3>
              <p className="text-sm text-amber-100">Expand your collection</p>
            </div>
          </Link>

          <Link href="/decks">
            <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg p-6 cursor-pointer hover:shadow-lg transition-all h-full">
              <h3 className="text-lg font-bold mb-2">Deck Builder</h3>
              <p className="text-sm text-blue-100">Create powerful decks</p>
            </div>
          </Link>

          <Link href="/ladder">
            <div className="bg-gradient-to-br from-purple-600 to-purple-700 rounded-lg p-6 cursor-pointer hover:shadow-lg transition-all h-full">
              <h3 className="text-lg font-bold mb-2">Ladder</h3>
              <p className="text-sm text-purple-100">Climb the rankings</p>
            </div>
          </Link>

          <Link href="/marketplace">
            <div className="bg-gradient-to-br from-green-600 to-green-700 rounded-lg p-6 cursor-pointer hover:shadow-lg transition-all h-full">
              <h3 className="text-lg font-bold mb-2">Marketplace</h3>
              <p className="text-sm text-green-100">Trade with players</p>
            </div>
          </Link>
        </div>

        <div className="mt-12 bg-slate-800/50 border border-slate-700 rounded-lg p-8">
          <h2 className="text-2xl font-bold mb-4">Welcome, {user.username}</h2>
          <p className="text-slate-300">
            You have {user.credits} credits available. Claim your daily bonus or browse the marketplace to find new
            cards.
          </p>
        </div>
      </main>
    </div>
  )
}
