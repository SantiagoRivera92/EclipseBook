"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Navigation } from "@/components/layout/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Shield, DollarSign, Package, Trophy } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export default function AdminPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  // Credit distribution state
  const [targetUser, setTargetUser] = useState("")
  const [creditAmount, setCreditAmount] = useState("")
  const [creditReason, setCreditReason] = useState("")

  // Pack creation state
  const [packName, setPackName] = useState("")
  const [packDescription, setPackDescription] = useState("")
  const [packPrice, setPackPrice] = useState("")

  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem("auth_token")
      if (!token) {
        router.push("/")
        return
      }

      try {
        const userRes = await fetch("/api/user/profile", {
          headers: { Authorization: `Bearer ${token}` },
        })

        if (userRes.ok) {
          const userData = await userRes.json()
          if (!userData.isAdmin) {
            router.push("/dashboard")
            return
          }
          setUser(userData)
        }
      } catch (error) {
        console.error("Failed to fetch data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [router])

  const handleDistributeCredits = async (toAll: boolean) => {
    const token = localStorage.getItem("auth_token")
    try {
      const res = await fetch("/api/admin/credits", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          toAll,
          username: toAll ? undefined : targetUser,
          amount: Number.parseInt(creditAmount),
          reason: creditReason,
        }),
      })

      if (res.ok) {
        toast({
          title: "Credits distributed",
          description: `Successfully distributed ${creditAmount} credits`,
        })
        setTargetUser("")
        setCreditAmount("")
        setCreditReason("")
      }
    } catch (error) {
      console.error("Failed to distribute credits:", error)
    }
  }

  const handleCreatePack = async () => {
    const token = localStorage.getItem("auth_token")
    try {
      const res = await fetch("/api/admin/packs", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: packName,
          description: packDescription,
          price: Number.parseInt(packPrice),
        }),
      })

      if (res.ok) {
        toast({
          title: "Pack created",
          description: `${packName} has been created successfully`,
        })
        setPackName("")
        setPackDescription("")
        setPackPrice("")
      }
    } catch (error) {
      console.error("Failed to create pack:", error)
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

  return (
    <div className="min-h-screen bg-background">
      <Navigation user={user} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 flex items-center gap-3">
          <Shield className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">Admin Panel</h1>
            <p className="text-muted-foreground">Manage EclipseBook</p>
          </div>
        </div>

        <Tabs defaultValue="credits" className="space-y-6">
          <TabsList>
            <TabsTrigger value="credits" className="gap-2">
              <DollarSign className="h-4 w-4" />
              Credits
            </TabsTrigger>
            <TabsTrigger value="packs" className="gap-2">
              <Package className="h-4 w-4" />
              Packs
            </TabsTrigger>
            <TabsTrigger value="tournaments" className="gap-2">
              <Trophy className="h-4 w-4" />
              Tournaments
            </TabsTrigger>
          </TabsList>

          <TabsContent value="credits">
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Give Credits to Specific Player</CardTitle>
                  <CardDescription>Award credits to an individual user</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="username">Username</Label>
                    <Input
                      id="username"
                      placeholder="Enter username"
                      value={targetUser}
                      onChange={(e) => setTargetUser(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="amount">Amount</Label>
                    <Input
                      id="amount"
                      type="number"
                      placeholder="100"
                      value={creditAmount}
                      onChange={(e) => setCreditAmount(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="reason">Reason</Label>
                    <Textarea
                      id="reason"
                      placeholder="Reason for awarding credits..."
                      value={creditReason}
                      onChange={(e) => setCreditReason(e.target.value)}
                    />
                  </div>
                  <Button className="w-full" onClick={() => handleDistributeCredits(false)}>
                    Give Credits
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Give Credits to All Players</CardTitle>
                  <CardDescription>Award credits to every user in the system</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="amount-all">Amount per Player</Label>
                    <Input
                      id="amount-all"
                      type="number"
                      placeholder="50"
                      value={creditAmount}
                      onChange={(e) => setCreditAmount(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="reason-all">Reason</Label>
                    <Textarea
                      id="reason-all"
                      placeholder="Reason for awarding credits..."
                      value={creditReason}
                      onChange={(e) => setCreditReason(e.target.value)}
                    />
                  </div>
                  <Button
                    className="w-full bg-transparent"
                    variant="outline"
                    onClick={() => handleDistributeCredits(true)}
                  >
                    Give to All Players
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="packs">
            <Card>
              <CardHeader>
                <CardTitle>Create New Card Pack</CardTitle>
                <CardDescription>Add a new pack for players to purchase</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="pack-name">Pack Name</Label>
                  <Input
                    id="pack-name"
                    placeholder="Enter pack name"
                    value={packName}
                    onChange={(e) => setPackName(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="pack-description">Description</Label>
                  <Textarea
                    id="pack-description"
                    placeholder="Describe the pack..."
                    value={packDescription}
                    onChange={(e) => setPackDescription(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="pack-price">Price (credits)</Label>
                  <Input
                    id="pack-price"
                    type="number"
                    placeholder="100"
                    value={packPrice}
                    onChange={(e) => setPackPrice(e.target.value)}
                  />
                </div>
                <Button className="w-full" onClick={handleCreatePack}>
                  Create Pack
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="tournaments">
            <Card>
              <CardHeader>
                <CardTitle>Create Tournament</CardTitle>
                <CardDescription>Set up a new competitive tournament</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="tournament-name">Tournament Name</Label>
                  <Input id="tournament-name" placeholder="Enter tournament name" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="entry-fee">Entry Fee (credits)</Label>
                    <Input id="entry-fee" type="number" placeholder="100" />
                  </div>
                  <div>
                    <Label htmlFor="max-players">Max Players</Label>
                    <Input id="max-players" type="number" placeholder="16" />
                  </div>
                </div>
                <div>
                  <Label htmlFor="start-date">Start Date & Time</Label>
                  <Input id="start-date" type="datetime-local" />
                </div>
                <Button className="w-full">Create Tournament</Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
