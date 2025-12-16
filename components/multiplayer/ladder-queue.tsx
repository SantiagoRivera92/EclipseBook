"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"

export function LadderQueue() {
  const [isQueued, setIsQueued] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [queuePosition, setQueuePosition] = useState(0)
  const [matchId, setMatchId] = useState<string | null>(null)

  const handleQueue = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/ladder/queue", {
        method: "POST",
      })

      const data = await response.json()

      if (!response.ok) {
        toast.error(data.error || "Failed to queue")
        return
      }

      if (data.matchFound) {
        toast.success(`Found opponent: ${data.opponent}`)
        setMatchId(data.matchId)
      } else {
        toast.info(`Queued for ladder. Position: ${data.queuePosition}`)
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
      toast.success("Left queue")
    } catch (error) {
      toast.error("Failed to leave queue")
    } finally {
      setIsLoading(false)
    }
  }

  if (matchId) {
    return (
      <Card className="p-6">
        <h2 className="text-lg font-semibold">Match Found!</h2>
        <Button className="mt-4 w-full">Enter Match</Button>
      </Card>
    )
  }

  return (
    <Card className="p-6">
      <h2 className="text-lg font-semibold">Ranked Ladder</h2>
      <p className="mt-2 text-sm text-muted-foreground">Best of 3 format. Win to earn credits equal to your streak.</p>

      {isQueued ? (
        <div className="mt-4 space-y-4">
          <p className="text-sm">
            Queue Position: <span className="font-semibold">{queuePosition}</span>
          </p>
          <Button onClick={handleLeaveQueue} disabled={isLoading} variant="outline" className="w-full bg-transparent">
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Leave Queue
          </Button>
        </div>
      ) : (
        <Button onClick={handleQueue} disabled={isLoading} className="mt-4 w-full">
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Join Ranked Ladder
        </Button>
      )}
    </Card>
  )
}
