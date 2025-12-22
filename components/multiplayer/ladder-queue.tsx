"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"

interface LadderQueueProps {
  deckId: string
}

export function LadderQueue({ deckId }: LadderQueueProps) {
  const router = useRouter()
  const [isQueued, setIsQueued] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [queuePosition, setQueuePosition] = useState(0)
  const [totalInQueue, setTotalInQueue] = useState(0)
  const [matchId, setMatchId] = useState<string | null>(null)
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (isQueued && !matchId) {
      pollingIntervalRef.current = setInterval(async () => {
        try {
          const response = await fetch("/api/ladder/queue")
          const data = await response.json()

          if (data.matchFound) {
            toast.success(`Match found! Opponent: ${data.opponent}`)
            setMatchId(data.matchId)
            setIsQueued(false)
            if (pollingIntervalRef.current) {
              clearInterval(pollingIntervalRef.current)
            }
          } else if (data.inQueue) {
            setQueuePosition(data.queuePosition)
            setTotalInQueue(data.totalInQueue)
          } else {
            // No longer in queue
            setIsQueued(false)
            if (pollingIntervalRef.current) {
              clearInterval(pollingIntervalRef.current)
            }
          }
        } catch (error) {
          console.error("Queue polling error:", error)
        }
      }, 2000) // Poll every 2 seconds

      return () => {
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current)
        }
      }
    }
  }, [isQueued, matchId])

  const handleQueue = async () => {
    if (!deckId) {
      toast.error("Please select a deck first")
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch("/api/ladder/queue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deckId }),
      })

      const data = await response.json()

      if (!response.ok) {
        toast.error(data.error || "Failed to queue")
        return
      }

      if (data.matchFound) {
        toast.success(`Match found! Opponent: ${data.opponent}`)
        setMatchId(data.matchId)
      } else {
        toast.success("Joined ladder queue")
        setIsQueued(true)
        setQueuePosition(data.queuePosition)
      }
    } catch (error) {
      toast.error("Failed to queue")
    } finally {
      setIsLoading(false)
    }
  }

  const handleLeaveQueue = async () => {
    setIsLoading(true)
    try {
      await fetch("/api/ladder/queue", { method: "DELETE" })
      setIsQueued(false)
      setQueuePosition(0)
      setTotalInQueue(0)
      toast.success("Left queue")
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current)
      }
    } catch (error) {
      toast.error("Failed to leave queue")
    } finally {
      setIsLoading(false)
    }
  }

  const handleEnterMatch = () => {
    if (matchId) {
      router.push(`/play/match/${matchId}`)
    }
  }

  if (matchId) {
    return (
      <Card className="p-6">
        <h2 className="text-lg font-semibold">Match Found!</h2>
        <p className="mt-2 text-sm text-muted-foreground">Your match is ready to begin</p>
        <Button className="mt-4 w-full" onClick={handleEnterMatch}>
          Enter Match
        </Button>
      </Card>
    )
  }

  return (
    <Card className="p-6">
      <h2 className="text-lg font-semibold">Ranked Ladder Queue</h2>
      <p className="mt-2 text-sm text-muted-foreground">Best of 3 format. Win to earn credits equal to your streak.</p>

      {isQueued ? (
        <div className="mt-4 space-y-4">
          <div className="flex items-center justify-center gap-2">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
            <p className="text-sm font-medium">Searching for opponent...</p>
          </div>
          <div className="rounded-lg bg-muted p-3">
            <p className="text-sm text-center">
              Position in queue: <span className="font-semibold text-primary">{queuePosition}</span> / {totalInQueue}
            </p>
          </div>
          <Button onClick={handleLeaveQueue} disabled={isLoading} variant="outline" className="w-full bg-transparent">
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Leave Queue
          </Button>
        </div>
      ) : (
        <Button onClick={handleQueue} disabled={isLoading || !deckId} className="mt-4 w-full">
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {deckId ? "Join Ranked Ladder" : "Select a deck to queue"}
        </Button>
      )}
    </Card>
  )
}