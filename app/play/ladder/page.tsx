"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Navigation } from "@/components/layout/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { LadderQueue } from "@/components/multiplayer/ladder-queue"
import { Loader2, Trophy } from "lucide-react"
import { toast } from "sonner"

export default function LadderPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [decks, setDecks] = useState<any[]>([])
  const [selectedDeck, setSelectedDeck] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [userRes, decksRes] = await Promise.all([fetch("/api/user/profile"), fetch("/api/decks")])

        if (userRes.ok) {
          const userData = await userRes.json()
          setUser(userData)
        }

        if (decksRes.ok) {
          const decksData = await decksRes.json()
          setDecks(decksData)
        }
      } catch (error) {
        console.error("Failed to fetch data:", error)
        toast.error("Failed to load data")
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    )
  }

  if (!user) {
    router.push("/auth/login")
    return null
  }

  const winRate =
    user.ladderWins + user.ladderLosses > 0
      ? ((user.ladderWins / (user.ladderWins + user.ladderLosses)) * 100).toFixed(1)
      : "0.0"

  return (
    <div className="min-h-screen bg-background">
      <Navigation user={user} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Ranked Ladder</h1>
          <p className="text-muted-foreground">Compete in best-of-3 matches to climb the ranks</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Select Your Deck</CardTitle>
                <CardDescription>Choose a deck to use in ranked matches</CardDescription>
              </CardHeader>
              <CardContent>
                {decks.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground mb-4">You don't have any decks yet</p>
                    <Button onClick={() => router.push("/decks/builder")}>Create a Deck</Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {decks.map((deck) => (
                      <button
                        key={deck.deckId}
                        onClick={() => setSelectedDeck(deck.deckId)}
                        className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                          selectedDeck === deck.deckId
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/50"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-semibold">{deck.name}</h3>
                            <p className="text-sm text-muted-foreground">
                              {deck.mainDeck.length} Main / {deck.extraDeck.length} Extra
                            </p>
                          </div>
                          {selectedDeck === deck.deckId && <Badge>Selected</Badge>}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {selectedDeck && <LadderQueue deckId={selectedDeck} />}
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Your Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Win Rate</span>
                  <span className="font-semibold">{winRate}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Current Streak</span>
                  <span className="font-semibold text-primary">{user.ladderWinStreak || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Wins</span>
                  <span className="font-semibold">{user.ladderWins || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Losses</span>
                  <span className="font-semibold">{user.ladderLosses || 0}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-amber-500" />
                  Rewards
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">Win matches to earn credits based on your win streak!</p>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Streak 1-5:</span>
                    <span className="font-semibold">1-5 credits</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Streak 6-10:</span>
                    <span className="font-semibold">6-10 credits</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Streak 11+:</span>
                    <span className="font-semibold text-primary">11-20 credits (max)</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}