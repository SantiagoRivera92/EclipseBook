"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Navigation } from "@/components/layout/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Trophy, TrendingUp, Calendar, Award } from "lucide-react"

export default function ProfilePage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [stats, setStats] = useState<any>(null)
  const [trophies, setTrophies] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem("auth_token")
      if (!token) {
        router.push("/")
        return
      }

      try {
        const [userRes, statsRes, trophiesRes] = await Promise.all([
          fetch("/api/user/profile", { headers: { Authorization: `Bearer ${token}` } }),
          fetch("/api/user/stats", { headers: { Authorization: `Bearer ${token}` } }),
          fetch("/api/user/trophies", { headers: { Authorization: `Bearer ${token}` } }),
        ])

        if (userRes.ok) setUser(await userRes.json())
        if (statsRes.ok) setStats(await statsRes.json())
        if (trophiesRes.ok) setTrophies(await trophiesRes.json())
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

  return (
    <div className="min-h-screen bg-background">
      <Navigation user={user} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 space-y-6">
            <Card>
              <CardHeader className="text-center">
                <Avatar className="h-32 w-32 mx-auto mb-4">
                  <AvatarImage src={user.avatarUrl || "/placeholder.svg"} />
                  <AvatarFallback className="text-4xl">{user.username[0].toUpperCase()}</AvatarFallback>
                </Avatar>
                <CardTitle className="text-2xl">{user.username}</CardTitle>
                <CardDescription>Member since {new Date(user.createdAt).toLocaleDateString()}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Credits</span>
                    <span className="font-bold text-primary">{user.credits}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total Cards</span>
                    <span className="font-semibold">{stats?.totalCards || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total Decks</span>
                    <span className="font-semibold">{stats?.totalDecks || 0}</span>
                  </div>
                </div>
                <Button className="w-full mt-4">Change Avatar</Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5 text-primary" />
                  Achievements
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Badge variant="outline" className="w-full justify-start py-2">
                    First Win
                  </Badge>
                  <Badge variant="outline" className="w-full justify-start py-2">
                    Pack Opener
                  </Badge>
                  <Badge variant="outline" className="w-full justify-start py-2">
                    Deck Builder
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Statistics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <TrendingUp className="h-8 w-8 mx-auto mb-2 text-primary" />
                    <p className="text-2xl font-bold">{stats?.winStreak || 0}</p>
                    <p className="text-sm text-muted-foreground">Win Streak</p>
                  </div>
                  <div className="text-center">
                    <Trophy className="h-8 w-8 mx-auto mb-2 text-amber-500" />
                    <p className="text-2xl font-bold">{stats?.totalWins || 0}</p>
                    <p className="text-sm text-muted-foreground">Total Wins</p>
                  </div>
                  <div className="text-center">
                    <Calendar className="h-8 w-8 mx-auto mb-2 text-blue-500" />
                    <p className="text-2xl font-bold">{stats?.totalMatches || 0}</p>
                    <p className="text-sm text-muted-foreground">Matches</p>
                  </div>
                  <div className="text-center">
                    <Award className="h-8 w-8 mx-auto mb-2 text-green-500" />
                    <p className="text-2xl font-bold">
                      {stats?.totalMatches > 0 ? Math.round((stats.totalWins / stats.totalMatches) * 100) : 0}%
                    </p>
                    <p className="text-sm text-muted-foreground">Win Rate</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-primary" />
                  Tournament Trophies
                </CardTitle>
                <CardDescription>Your competitive achievements</CardDescription>
              </CardHeader>
              <CardContent>
                {trophies.length === 0 ? (
                  <div className="text-center py-12">
                    <Trophy className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-lg font-semibold mb-2">No trophies yet</p>
                    <p className="text-muted-foreground">Win tournaments to earn trophies</p>
                  </div>
                ) : (
                  <div className="grid md:grid-cols-2 gap-4">
                    {trophies.map((trophy, index) => (
                      <Card key={index} className="bg-gradient-to-br from-primary/5 to-purple-500/5">
                        <CardContent className="p-4">
                          <div className="flex items-center gap-3">
                            <Trophy className="h-10 w-10 text-primary" />
                            <div>
                              <p className="font-semibold">{trophy.tournamentName}</p>
                              <p className="text-xs text-muted-foreground">
                                {new Date(trophy.wonAt).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
