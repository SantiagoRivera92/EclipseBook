"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"

export function AdminCreditsPanel() {
  const [selectedTab, setSelectedTab] = useState("specific")
  const [targetUserId, setTargetUserId] = useState("")
  const [amount, setAmount] = useState("")
  const [reason, setReason] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleGiveCredits = async () => {
    if (!amount || !reason) {
      toast.error("Please fill in all fields")
      return
    }

    if (selectedTab === "specific" && !targetUserId) {
      toast.error("Please enter a user ID")
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch("/api/admin/credits/give", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetUserId: selectedTab === "specific" ? targetUserId : null,
          amount: Number.parseInt(amount),
          reason,
          targetAll: selectedTab === "all",
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        toast.error(data.error || "Failed to give credits")
        return
      }

      toast.success(`Successfully gave ${amount} credits`)
      setAmount("")
      setReason("")
      setTargetUserId("")
    } catch (error) {
      toast.error("Failed to give credits")
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="p-6">
      <h2 className="mb-4 text-lg font-semibold">Award Credits</h2>
      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="mb-4 grid w-full grid-cols-2">
          <TabsTrigger value="specific">Specific User</TabsTrigger>
          <TabsTrigger value="all">All Players</TabsTrigger>
        </TabsList>

        <TabsContent value="specific" className="space-y-4">
          <div>
            <Label>User ID</Label>
            <Input placeholder="Enter user ID" value={targetUserId} onChange={(e) => setTargetUserId(e.target.value)} />
          </div>
          <div>
            <Label>Credits Amount</Label>
            <Input type="number" placeholder="Amount" value={amount} onChange={(e) => setAmount(e.target.value)} />
          </div>
          <div>
            <Label>Reason</Label>
            <Textarea
              placeholder="Why are you giving these credits?"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </div>
          <Button onClick={handleGiveCredits} disabled={isLoading} className="w-full">
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Give Credits
          </Button>
        </TabsContent>

        <TabsContent value="all" className="space-y-4">
          <div className="rounded-lg bg-amber-50 p-3 text-sm text-amber-900 dark:bg-amber-950 dark:text-amber-100">
            This will give credits to ALL players. Make sure you&apos;re certain about this action.
          </div>
          <div>
            <Label>Credits Amount</Label>
            <Input
              type="number"
              placeholder="Amount per player"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>
          <div>
            <Label>Reason</Label>
            <Textarea
              placeholder="Why are you giving these credits?"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </div>
          <Button onClick={handleGiveCredits} disabled={isLoading} variant="destructive" className="w-full">
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Give Credits to All Players
          </Button>
        </TabsContent>
      </Tabs>
    </Card>
  )
}
