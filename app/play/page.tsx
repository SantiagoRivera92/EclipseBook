"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Navigation } from "@/components/layout/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Trophy, Zap, TrendingUp } from "lucide-react"

export default function PlayPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [stats, setStats] = useState({
    totalWins: 0,
    totalLosses: 0,
    winStreak: 0,
    eliminationWins: 0,
    tournamentWins: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const userRes = await fetch("/api/user/profile")

        if (userRes.ok) {
          const userData = await userRes.json()
          setUser(userData)
          setStats({
            totalWins: userData.ladderWins || 0,
            totalLosses: userData.ladderLosses || 0,
            winStreak: userData.ladderWinStreak || 0,
            eliminationWins: 0, // TODO: Add elimination stats
            tournamentWins: 0, // TODO: Add tournament stats
          })
        }
      } catch (error) {
        console.error("Failed to fetch data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [router])

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!user) return null

  const winRate =
    stats.totalWins + stats.totalLosses > 0
      ? ((stats.totalWins / (stats.totalWins + stats.totalLosses)) * 100).toFixed(1)
      : "0.0"

  return (
    <div className="min-h-screen bg-background">
      <Navigation user={user} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Play</h1>
          <p className="text-muted-foreground">Choose your game mode and start dueling</p>
        </div>

        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Win Streak</p>
                <p className="text-3xl font-bold text-primary">{stats.winStreak}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Win Rate</p>
                <p className="text-3xl font-bold">{winRate}%</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Total Wins</p>
                <p className="text-3xl font-bold">{stats.totalWins}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Tournaments Won</p>
                <p className="text-3xl font-bold text-primary">{stats.tournamentWins}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <Card className="hover:border-primary transition-colors cursor-pointer">
            <CardHeader>
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-purple-500/10 rounded-lg">
                  <TrendingUp className="h-8 w-8 text-purple-500" />
                </div>
                <Badge>Ranked</Badge>
              </div>
              <CardTitle>Ladder</CardTitle>
              <CardDescription>Climb the ranks in competitive best-of-3 matches</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Rewards:</span>
                  <span className="font-semibold">Credits based on streak</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Entry Cost:</span>
                  <span className="font-semibold text-green-500">Free</span>
                </div>
              </div>
              <Link href="/play/ladder">
                <Button className="w-full">Enter Ladder</Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="hover:border-primary transition-colors cursor-pointer">
            <CardHeader>
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-amber-500/10 rounded-lg">
                  <Zap className="h-8 w-8 text-amber-500" />
                </div>
                <Badge variant="secondary">8 Players</Badge>
              </div>
              <CardTitle>Elimination</CardTitle>
              <CardDescription>Fast-paced single-elimination tournaments</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">1st Place:</span>
                  <span className="font-semibold text-primary">200 credits</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Entry Cost:</span>
                  <span className="font-semibold">50 credits</span>
                </div>
              </div>
              <Link href="/play/elimination">
                <Button className="w-full" disabled={user.credits < 50}>
                  {user.credits < 50 ? "Not Enough Credits" : "Enter Elimination"}
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="hover:border-primary transition-colors cursor-pointer">
            <CardHeader>
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-blue-500/10 rounded-lg">
                  <Trophy className="h-8 w-8 text-blue-500" />
                </div>
                <Badge variant="outline">Premium</Badge>
              </div>
              <CardTitle>Tournaments</CardTitle>
              <CardDescription>Compete in scheduled events for big prizes</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Rewards:</span>
                  <span className="font-semibold">Prize pool + Trophies</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Entry Cost:</span>
                  <span className="font-semibold">Varies</span>
                </div>
              </div>
              <Link href="/tournaments">
                <Button className="w-full bg-transparent" variant="outline">
                  View Tournaments
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}