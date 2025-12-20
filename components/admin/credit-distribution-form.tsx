"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { Loader2, User, Users } from "lucide-react"

interface CreditDistributionFormProps {
  toAll?: boolean
}

export function CreditDistributionForm({ toAll = false }: CreditDistributionFormProps) {
  const { toast } = useToast()
  const [targetUserId, setTargetUserId] = useState("")
  const [amount, setAmount] = useState("")
  const [reason, setReason] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleGiveCredits = async () => {
    if (!amount || !reason) {
      toast({
        title: "Missing fields",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      return
    }

    if (!toAll && !targetUserId) {
      toast({
        title: "Missing user ID",
        description: "Please enter a user ID",
        variant: "destructive",
      })
      return
    }

    const amountNum = Number.parseInt(amount)
    if (isNaN(amountNum) || amountNum <= 0) {
      toast({
        title: "Invalid amount",
        description: "Please enter a valid amount greater than 0",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch("/api/admin/credits/give", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetUserId: toAll ? null : targetUserId,
          amount: amountNum,
          reason,
          targetAll: toAll,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        toast({
          title: "Error",
          description: data.error || "Failed to give credits",
          variant: "destructive",
        })
        return
      }

      toast({
        title: "Success",
        description: toAll
          ? `Successfully gave ${amount} credits to all players`
          : `Successfully gave ${amount} credits`,
      })

      setAmount("")
      setReason("")
      setTargetUserId("")
    } catch (error) {
      console.error("Failed to give credits:", error)
      toast({
        title: "Error",
        description: "Failed to give credits",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {toAll ? <Users className="h-5 w-5" /> : <User className="h-5 w-5" />}
          {toAll ? "Give Credits to All Players" : "Give Credits to Specific User"}
        </CardTitle>
        <CardDescription>
          {toAll ? "Award credits to every player in the system" : "Award credits to a specific user by their user ID"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {toAll && (
          <div className="rounded-lg bg-amber-50 p-3 text-sm text-amber-900 dark:bg-amber-950 dark:text-amber-100">
            Warning: This will give credits to ALL players. Make sure you are certain about this action.
          </div>
        )}

        {!toAll && (
          <div>
            <Label htmlFor="user-id">User ID</Label>
            <Input
              id="user-id"
              placeholder="Enter user ID"
              value={targetUserId}
              onChange={(e) => setTargetUserId(e.target.value)}
              disabled={isLoading}
            />
          </div>
        )}

        <div>
          <Label htmlFor="amount">{toAll ? "Credits Amount (per player)" : "Credits Amount"}</Label>
          <Input
            id="amount"
            type="number"
            placeholder="Amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            disabled={isLoading}
          />
        </div>

        <div>
          <Label htmlFor="reason">Reason</Label>
          <Textarea
            id="reason"
            placeholder="Why are you giving these credits?"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            disabled={isLoading}
            rows={3}
          />
        </div>

        <Button
          onClick={handleGiveCredits}
          disabled={isLoading}
          variant={toAll ? "destructive" : "default"}
          className="w-full"
        >
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {toAll ? "Give Credits to All Players" : "Give Credits"}
        </Button>
      </CardContent>
    </Card>
  )
}
