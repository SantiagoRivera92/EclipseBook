"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"

interface CreditDistributionFormProps {
  toAll?: boolean
}

export function CreditDistributionForm({ toAll = false }: CreditDistributionFormProps) {
  const { toast } = useToast()
  const [targetUser, setTargetUser] = useState("")
  const [creditAmount, setCreditAmount] = useState("")
  const [creditReason, setCreditReason] = useState("")

  const handleDistributeCredits = async () => {
    try {
      const res = await fetch("/api/admin/credits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetAll: toAll,
          targetUserId: toAll ? undefined : targetUser,
          amount: Number.parseInt(creditAmount),
          reason: creditReason,
        }),
      })

      const data = await res.json()

      if (res.ok) {
        toast({
          title: "Credits distributed",
          description: toAll
            ? `Successfully distributed ${creditAmount} credits to ${data.affectedUsers} players`
            : `Successfully distributed ${creditAmount} credits`,
        })
        setTargetUser("")
        setCreditAmount("")
        setCreditReason("")
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to distribute credits",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Failed to distribute credits:", error)
      toast({
        title: "Error",
        description: "Failed to distribute credits",
        variant: "destructive",
      })
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{toAll ? "Give Credits to All Players" : "Give Credits to Specific Player"}</CardTitle>
        <CardDescription>
          {toAll ? "Award credits to every user in the system" : "Award credits to an individual user"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!toAll && (
          <div>
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              placeholder="Enter username"
              value={targetUser}
              onChange={(e) => setTargetUser(e.target.value)}
            />
          </div>
        )}
        <div>
          <Label htmlFor={toAll ? "amount-all" : "amount"}>{toAll ? "Amount per Player" : "Amount"}</Label>
          <Input
            id={toAll ? "amount-all" : "amount"}
            type="number"
            placeholder={toAll ? "50" : "100"}
            value={creditAmount}
            onChange={(e) => setCreditAmount(e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor={toAll ? "reason-all" : "reason"}>Reason</Label>
          <Textarea
            id={toAll ? "reason-all" : "reason"}
            placeholder="Reason for awarding credits..."
            value={creditReason}
            onChange={(e) => setCreditReason(e.target.value)}
          />
        </div>
        <Button
          className={toAll ? "w-full bg-transparent" : "w-full"}
          variant={toAll ? "outline" : "default"}
          onClick={handleDistributeCredits}
        >
          {toAll ? "Give to All Players" : "Give Credits"}
        </Button>
      </CardContent>
    </Card>
  )
}
