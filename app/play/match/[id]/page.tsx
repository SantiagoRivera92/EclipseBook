"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Navigation } from "@/components/layout/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Loader2, Heart, Shield, Swords } from "lucide-react"
import { toast } from "sonner"
import { use } from "react"

interface GameState {
  player1: {
    id: string
    username: string
    lp: number
    hand: number[]
    deck: number
    grave: number
    removed: number
    mzone: (number | null)[]
    szone: (number | null)[]
  }
  player2: {
    id: string
    username: string
    lp: number
    hand: number
    deck: number
    grave: number
    removed: number
    mzone: (number | null)[]
    szone: (number | null)[]
  }
  currentPlayer: string
  phase: string
  gamesWon: {
    player1: number
    player2: number
  }
}

export default function MatchPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [match, setMatch] = useState<any>(null)
  const [gameState, setGameState] = useState<GameState | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [userRes, matchRes] = await Promise.all([
          fetch("/api/user/profile"),
          fetch(`/api/match/${resolvedParams.id}`),
        ])

        if (userRes.ok) {
          const userData = await userRes.json()
          setUser(userData)
        }

        if (matchRes.ok) {
          const matchData = await matchRes.json()
          setMatch(matchData)

          // Initialize game state
          setGameState({
            player1: {
              id: matchData.player1Id,
              username: matchData.player1Username,
              lp: 8000,
              hand: [],
              deck: 40,
              grave: 0,
              removed: 0,
              mzone: new Array(7).fill(null),
              szone: new Array(8).fill(null),
            },
            player2: {
              id: matchData.player2Id,
              username: matchData.player2Username,
              lp: 8000,
              hand: 0,
              deck: 40,
              grave: 0,
              removed: 0,
              mzone: new Array(7).fill(null),
              szone: new Array(8).fill(null),
            },
            currentPlayer: matchData.player1Id,
            phase: "draw",
            gamesWon: {
              player1: 0,
              player2: 0,
            },
          })
        } else {
          toast.error("Match not found")
          router.push("/play")
        }
      } catch (error) {
        console.error("Failed to fetch match:", error)
        toast.error("Failed to load match")
        router.push("/play")
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [resolvedParams.id, router])

  const handleSurrender = async () => {
    try {
      const winnerId = user.userId === match.player1Id ? match.player2Id : match.player1Id

      const response = await fetch(`/api/match/${resolvedParams.id}/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          winnerId,
          matchType: "ladder",
        }),
      })

      if (response.ok) {
        toast.success("Match ended")
        router.push("/play")
      } else {
        toast.error("Failed to end match")
      }
    } catch (error) {
      toast.error("Failed to end match")
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    )
  }

  if (!user || !match || !gameState) return null

  const isPlayer1 = user.userId === match.player1Id
  const playerState = isPlayer1 ? gameState.player1 : gameState.player2
  const opponentState = isPlayer1 ? gameState.player2 : gameState.player1

  return (
    <div className="min-h-screen bg-background">
      <Navigation user={user} />

      <main className="max-w-[1600px] mx-auto px-4 py-4">
        {/* Match Header */}
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Badge variant="outline">Best of 3</Badge>
            <div className="flex items-center gap-2">
              <span className="font-semibold">{gameState.player1.username}</span>
              <span className="text-2xl font-bold text-primary">{gameState.gamesWon.player1}</span>
              <span className="text-muted-foreground">-</span>
              <span className="text-2xl font-bold text-primary">{gameState.gamesWon.player2}</span>
              <span className="font-semibold">{gameState.player2.username}</span>
            </div>
          </div>
          <Button variant="destructive" onClick={handleSurrender}>
            Surrender
          </Button>
        </div>

        {/* Game Board */}
        <div className="space-y-4">
          {/* Opponent Area */}
          <Card className="p-4 bg-card/50">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <Badge variant="secondary">{opponentState.username}</Badge>
                <div className="flex items-center gap-2">
                  <Heart className="h-4 w-4 text-red-500" />
                  <span className="font-bold text-lg">{opponentState.lp}</span>
                </div>
              </div>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span>Deck: {opponentState.deck}</span>
                <span>Hand: {opponentState.hand}</span>
                <span>GY: {opponentState.grave}</span>
              </div>
            </div>

            {/* Opponent Field */}
            <div className="space-y-3">
              {/* Monster Zones */}
              <div className="flex gap-2 justify-center">
                {opponentState.mzone.map((card, idx) => (
                  <div
                    key={`opp-mz-${idx}`}
                    className="w-16 h-20 rounded border-2 border-dashed border-muted-foreground/30 flex items-center justify-center text-xs text-muted-foreground"
                  >
                    {card ? (
                      <div className="w-full h-full bg-primary/20 rounded flex items-center justify-center">
                        <Shield className="h-8 w-8" />
                      </div>
                    ) : (
                      `M${idx + 1}`
                    )}
                  </div>
                ))}
              </div>

              {/* Spell/Trap Zones */}
              <div className="flex gap-2 justify-center">
                {opponentState.szone.map((card, idx) => (
                  <div
                    key={`opp-sz-${idx}`}
                    className="w-16 h-20 rounded border-2 border-dashed border-muted-foreground/30 flex items-center justify-center text-xs text-muted-foreground"
                  >
                    {card ? <div className="w-full h-full bg-purple-500/20 rounded" /> : `S${idx + 1}`}
                  </div>
                ))}
              </div>
            </div>
          </Card>

          {/* Battle Phase Indicator */}
          <div className="text-center py-2">
            <Badge className="text-lg px-4 py-2">{gameState.phase.toUpperCase()} PHASE</Badge>
          </div>

          {/* Player Area */}
          <Card className="p-4 bg-card border-2 border-primary/50">
            {/* Player Field */}
            <div className="space-y-3 mb-4">
              {/* Spell/Trap Zones */}
              <div className="flex gap-2 justify-center">
                {playerState.szone.map((card, idx) => (
                  <button
                    key={`player-sz-${idx}`}
                    className="w-16 h-20 rounded border-2 border-dashed border-muted-foreground/30 hover:border-primary transition-colors flex items-center justify-center text-xs text-muted-foreground"
                  >
                    {card ? <div className="w-full h-full bg-purple-500/20 rounded" /> : `S${idx + 1}`}
                  </button>
                ))}
              </div>

              {/* Monster Zones */}
              <div className="flex gap-2 justify-center">
                {playerState.mzone.map((card, idx) => (
                  <button
                    key={`player-mz-${idx}`}
                    className="w-16 h-20 rounded border-2 border-dashed border-muted-foreground/30 hover:border-primary transition-colors flex items-center justify-center text-xs text-muted-foreground"
                  >
                    {card ? (
                      <div className="w-full h-full bg-primary/20 rounded flex items-center justify-center">
                        <Swords className="h-8 w-8" />
                      </div>
                    ) : (
                      `M${idx + 1}`
                    )}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Badge>{playerState.username}</Badge>
                <div className="flex items-center gap-2">
                  <Heart className="h-5 w-5 text-red-500" />
                  <span className="font-bold text-xl">{playerState.lp}</span>
                </div>
              </div>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span>Deck: {playerState.deck}</span>
                <span>GY: {playerState.grave}</span>
                <span>Removed: {playerState.removed}</span>
              </div>
            </div>
          </Card>

          {/* Player Hand */}
          <Card className="p-4">
            <div className="flex gap-2 justify-center">
              {Array.isArray(playerState.hand) && playerState.hand.every(card => typeof card === 'number') ? (
                playerState.hand.length === 0 ? (
                  <p className="text-muted-foreground text-sm py-4">No cards in hand</p>
                ) : (
                  playerState.hand.map((cardCode, idx) => (
                    <button
                      key={`hand-${idx}`}
                      className="w-20 h-28 rounded border-2 border-primary/50 hover:border-primary hover:-translate-y-2 transition-all bg-gradient-to-b from-primary/10 to-primary/30 flex items-center justify-center"
                    >
                      <span className="text-xs font-mono">{cardCode}</span>
                    </button>
                  ))
                )
              ) : null}
            </div>
          </Card>

          {/* Action Buttons */}
          <div className="flex gap-2 justify-center">
            <Button disabled>Draw Phase</Button>
            <Button disabled>Main Phase</Button>
            <Button disabled>Battle Phase</Button>
            <Button disabled>End Phase</Button>
          </div>
        </div>
      </main>
    </div>
  )
}