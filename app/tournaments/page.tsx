"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Navigation } from "@/components/layout/navigation"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Trophy, Calendar, DollarSign, Clock } from "lucide-react"

interface Tournament {
  _id: string
  name: string
  type: "swiss" | "double-elimination"
  entryFee: number
  maxPlayers: number
  currentPlayers: number
  prizePool: number
  startDate: string
  status: "open" | "in-progress" | "completed"
}

export default function TournamentsPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [tournaments, setTournaments] = useState<Tournament[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [userRes, tournamentsRes] = await Promise.all([
          fetch("/api/user/profile" ),
          fetch("/api/tournaments"),
        ])

        if (userRes.ok) setUser(await userRes.json())
        if (tournamentsRes.ok) setTournaments(await tournamentsRes.json())
      } catch (error) {
        console.error("Failed to fetch data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [router])

  const handleJoinTournament = async (tournamentId: string, entryFee: number) => {
    if (user.credits < entryFee) return
    try {
      const res = await fetch("/api/tournaments/join", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ tournamentId }),
      })

      if (res.ok) {
        const data = await res.json()
        setUser({ ...user, credits: data.newCredits })
        setTournaments(
          tournaments.map((t) => (t._id === tournamentId ? { ...t, currentPlayers: t.currentPlayers + 1 } : t)),
        )
      }
    } catch (error) {
      console.error("Failed to join tournament:", error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!user) return null

  const openTournaments = tournaments.filter((t) => t.status === "open")
  const activeTournaments = tournaments.filter((t) => t.status === "in-progress")
  const completedTournaments = tournaments.filter((t) => t.status === "completed")

  return (
    <div className="min-h-screen bg-background">
      <Navigation user={user} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Tournaments</h1>
          <p className="text-muted-foreground">Compete in organized events for big prizes</p>
        </div>

        {openTournaments.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-4">Open for Registration</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {openTournaments.map((tournament) => (
                <Card key={tournament._id} className="flex flex-col">
                  <CardHeader>
                    <div className="flex items-start justify-between mb-2">
                      <Trophy className="h-8 w-8 text-primary" />
                      <Badge variant={tournament.type === "swiss" ? "default" : "secondary"}>
                        {tournament.type === "swiss" ? "Swiss" : "Double Elim"}
                      </Badge>
                    </div>
                    <CardTitle>{tournament.name}</CardTitle>
                    <CardDescription>
                      {tournament.currentPlayers}/{tournament.maxPlayers} players registered
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex-1">
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-sm">
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Entry Fee:</span>
                        <span className="font-semibold">{tournament.entryFee} credits</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Trophy className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Prize Pool:</span>
                        <span className="font-semibold text-primary">{tournament.prizePool} credits</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Starts:</span>
                        <span className="font-semibold">{new Date(tournament.startDate).toLocaleString()}</span>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button
                      className="w-full"
                      onClick={() => handleJoinTournament(tournament._id, tournament.entryFee)}
                      disabled={
                        user.credits < tournament.entryFee || tournament.currentPlayers >= tournament.maxPlayers
                      }
                    >
                      {tournament.currentPlayers >= tournament.maxPlayers
                        ? "Full"
                        : user.credits < tournament.entryFee
                          ? "Not Enough Credits"
                          : "Join Tournament"}
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </div>
        )}

        {activeTournaments.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-4">In Progress</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {activeTournaments.map((tournament) => (
                <Card key={tournament._id}>
                  <CardHeader>
                    <div className="flex items-start justify-between mb-2">
                      <Clock className="h-8 w-8 text-amber-500" />
                      <Badge variant="outline">Live</Badge>
                    </div>
                    <CardTitle>{tournament.name}</CardTitle>
                    <CardDescription>{tournament.currentPlayers} players competing</CardDescription>
                  </CardHeader>
                  <CardFooter>
                    <Button variant="outline" className="w-full bg-transparent">
                      View Bracket
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </div>
        )}

        {completedTournaments.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold mb-4">Completed</h2>
            <div className="space-y-4">
              {completedTournaments.map((tournament) => (
                <Card key={tournament._id}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-lg">{tournament.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          Completed on {new Date(tournament.startDate).toLocaleDateString()}
                        </p>
                      </div>
                      <Button variant="outline">View Results</Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {tournaments.length === 0 && (
          <Card className="p-12 text-center">
            <Trophy className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No tournaments available</h3>
            <p className="text-muted-foreground">Check back later for upcoming events</p>
          </Card>
        )}
      </main>
    </div>
  )
}
