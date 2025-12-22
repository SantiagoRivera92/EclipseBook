"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"

export default function Home() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [pushing, setPushing] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const userRes = await fetch("/api/user/profile")
        if (userRes.ok){
          router.push("/dashboard")
          setPushing(true)
        } 
      } catch (error) {
        console.error("Failed to fetch data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [router])

  if (loading || pushing) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 to-slate-900 text-white">
      <nav className="flex justify-between items-center px-8 py-6 border-b border-slate-800">
        <h1 className="text-2xl font-bold text-amber-400">EclipseBook</h1>
        <div className="flex gap-4 items-center">
          <a href="/api/auth/discord/initiate">
            <Button className="bg-amber-500 hover:bg-amber-600 text-black font-semibold">Login with Discord</Button>
          </a>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-8 py-12">
        <>
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
              <h3 className="text-xl font-bold text-amber-400 mb-2">Climb the ladder</h3>
              <p className="text-slate-300">
                Compete against players worldwide. Earn credits with winning streaks and prove your skill.
              </p>
            </div>
            <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
              <h3 className="text-xl font-bold text-amber-400 mb-2">Build your collection</h3>
              <p className="text-slate-300">
                Open card packs, build powerful decks, and unlock trophies by mastering different strategies.
              </p>
            </div>
            <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
              <h3 className="text-xl font-bold text-amber-400 mb-2">Dust your excess cards</h3>
              <p className="text-slate-300">
                Dusting cards you don't need earns you credits to spend on new packs.
              </p>
            </div>
          </div>
        </>
      </main>
    </div>
  )
}
