"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"

interface CreditsWidgetProps {
  credits: number
  onCreditsUpdate: (newCredits: number) => void
}

export function CreditsWidget({ credits, onCreditsUpdate }: CreditsWidgetProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [nextClaimTime, setNextClaimTime] = useState<Date | null>(null)

  useEffect(() => {
    // Check if user can claim daily credits
    const checkClaimStatus = async () => {
      try {
        const response = await fetch("/api/user/profile")
        const user = await response.json()

        if (user.lastCreditClaim) {
          const lastClaim = new Date(user.lastCreditClaim)
          const nextClaim = new Date(lastClaim.getTime() + 24 * 60 * 60 * 1000)
          if (nextClaim > new Date()) {
            setNextClaimTime(nextClaim)
          }
        }
      } catch (error) {
        console.error("Failed to check claim status:", error)
      }
    }

    checkClaimStatus()
  }, [])

  const handleClaimDaily = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/credits/claim-daily", {
        method: "POST",
      })

      const data = await response.json()

      if (!response.ok) {
        toast.error(data.error || "Failed to claim credits")
        return
      }

      toast.success(`Claimed ${data.creditsAwarded} credits!`)
      onCreditsUpdate(data.newBalance)
      setNextClaimTime(new Date(Date.now() + 24 * 60 * 60 * 1000))
    } catch (error) {
      toast.error("Failed to claim credits")
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  const canClaim = !nextClaimTime || nextClaimTime <= new Date()

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Credits</p>
          <p className="text-2xl font-bold">{credits}</p>
        </div>
        <Button onClick={handleClaimDaily} disabled={!canClaim || isLoading} size="sm">
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {canClaim ? "Claim Daily" : "Claimed Today"}
        </Button>
      </div>
      {nextClaimTime && nextClaimTime > new Date() && (
        <p className="mt-2 text-xs text-muted-foreground">Next claim: {nextClaimTime.toLocaleString()}</p>
      )}
    </Card>
  )
}
