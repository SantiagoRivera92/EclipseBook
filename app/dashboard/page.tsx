"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Navigation } from "@/components/layout/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Package, Layers, Trophy, ShoppingCart, Gift, TrendingUp, Calendar } from "lucide-react"

export default function DashboardPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalCards: 0,
    totalDecks: 0,
    winStreak: 0,
    lastLogin: null as Date | null,
    canClaimDaily: false,
  })

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [userRes, statsRes] = await Promise.all([
          fetch("/api/user/profile", { credentials: "include" }),
          fetch("/api/user/stats", { credentials: "include" }),
        ])

        if (!userRes.ok) {
          console.log("User not authenticated, redirecting to home.")
          router.push("/")
          return
        }

        if (userRes.ok) {
          const userData = await userRes.json()
          setUser(userData)
        }

        if (statsRes.ok) {
          const statsData = await statsRes.json()
          setStats(statsData)
        }
      } catch (error) {
        console.error("Failed to fetch data:", error)
        router.push("/")
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [router])

  const handleClaimDaily = async () => {
    try {
      const res = await fetch("/api/credits/claim-daily", {
        method: "POST",
        credentials: "include",
      })
      if (res.ok) {
        const data = await res.json()
        setUser({ ...user, credits: data.credits })
        setStats({ ...stats, canClaimDaily: false })
      }
    } catch (error) {
      console.error("Failed to claim daily:", error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation user={user} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Welcome back, {user.username}</h1>
        </div>

        {stats.canClaimDaily && (
          <Card className="mb-8 border-primary bg-primary/5">
            <CardContent className="flex items-center justify-between p-6">
              <div className="flex items-center gap-4">
                <div>
                  <h3 className="font-semibold text-lg">Daily Bonus Available!</h3>
                  <p className="text-sm text-muted-foreground">Claim your 25 credits</p>
                </div>
              </div>
              <Button onClick={handleClaimDaily} className="bg-primary text-primary-foreground">
                Claim Now
              </Button>
            </CardContent>
          </Card>
        )}

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Cards</p>
                  <p className="text-2xl font-bold">{stats.totalCards}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Decks Built</p>
                  <p className="text-2xl font-bold">{stats.totalDecks}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Win Streak</p>
                  <p className="text-2xl font-bold">{stats.winStreak}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Credits</p>
                  <p className="text-2xl font-bold">{user.credits}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Link href="/packs">
            <Card className="cursor-pointer hover:border-primary transition-colors h-full">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div>
                    <CardTitle>Open Packs</CardTitle>
                  </div>
                </div>
              </CardHeader>
            </Card>
          </Link>

          <Link href="/decks">
            <Card className="cursor-pointer hover:border-primary transition-colors h-full">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div>
                    <CardTitle>Deck Builder</CardTitle>
                  </div>
                </div>
              </CardHeader>
            </Card>
          </Link>

          <Link href="/play">
            <Card className="cursor-pointer hover:border-primary transition-colors h-full">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div>
                    <CardTitle>Play</CardTitle>
                  </div>
                </div>
              </CardHeader>
            </Card>
          </Link>

          <Link href="/marketplace">
            <Card className="cursor-pointer hover:border-primary transition-colors h-full">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div>
                    <CardTitle>Marketplace</CardTitle>
                  </div>
                </div>
              </CardHeader>
            </Card>
          </Link>

          <Link href="/collection">
            <Card className="cursor-pointer hover:border-primary transition-colors h-full">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div>
                    <CardTitle>Collection</CardTitle>
                  </div>
                </div>
              </CardHeader>
            </Card>
          </Link>

          <Link href="/tournaments">
            <Card className="cursor-pointer hover:border-primary transition-colors h-full">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div>
                    <CardTitle>Tournaments</CardTitle>
                  </div>
                </div>
              </CardHeader>
            </Card>
          </Link>
        </div>

      </main>
    </div>
  )
}
