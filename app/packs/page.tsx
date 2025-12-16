"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Navigation } from "@/components/layout/navigation"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Package, Sparkles } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"

interface Pack {
  _id: string
  name: string
  description: string
  price: number
  cardCount: number
  imageUrl?: string
}

interface PulledCard {
  name: string
  rarity: string
  imageUrl?: string
  canDust: boolean
  dustValue?: number
}

export default function PacksPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [packs, setPacks] = useState<Pack[]>([])
  const [loading, setLoading] = useState(true)
  const [opening, setOpening] = useState(false)
  const [pulledCards, setPulledCards] = useState<PulledCard[]>([])
  const [showResults, setShowResults] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [userRes, packsRes] = await Promise.all([fetch("/api/user/profile"), fetch("/api/packs")])

        if (!userRes.ok) {
          router.push("/")
          return
        }

        if (userRes.ok) setUser(await userRes.json())
        if (packsRes.ok) setPacks(await packsRes.json())
      } catch (error) {
        console.error("Failed to fetch data:", error)
        router.push("/")
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [router])

  const handleOpenPack = async (packId: string, price: number) => {
    if (user.credits < price) return

    setOpening(true)

    try {
      const res = await fetch("/api/packs/open", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ packId }),
      })

      if (res.ok) {
        const data = await res.json()
        setPulledCards(data.cards)
        setUser({ ...user, credits: data.newCredits })
        setShowResults(true)
      }
    } catch (error) {
      console.error("Failed to open pack:", error)
    } finally {
      setOpening(false)
    }
  }

  const handleDustCard = async (cardId: string) => {
    try {
      const res = await fetch("/api/cards/dust", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ cardId }),
      })

      if (res.ok) {
        const data = await res.json()
        setUser({ ...user, credits: data.newCredits })
        setPulledCards(pulledCards.filter((card: any) => card._id !== cardId))
      }
    } catch (error) {
      console.error("Failed to dust card:", error)
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
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Card Packs</h1>
          <p className="text-muted-foreground">Open packs to expand your collection</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {packs.map((pack) => (
            <Card key={pack._id} className="overflow-hidden">
              <CardHeader>
                <div className="aspect-video bg-gradient-to-br from-primary/20 to-purple-500/20 rounded-lg flex items-center justify-center mb-4">
                  <Package className="h-16 w-16 text-primary" />
                </div>
                <CardTitle>{pack.name}</CardTitle>
                <CardDescription>{pack.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <Badge variant="secondary">{pack.cardCount} cards</Badge>
                  <span className="text-2xl font-bold text-primary">{pack.price} credits</span>
                </div>
              </CardContent>
              <CardFooter>
                <Button
                  className="w-full"
                  onClick={() => handleOpenPack(pack._id, pack.price)}
                  disabled={user.credits < pack.price || opening}
                >
                  {opening ? "Opening..." : user.credits < pack.price ? "Not Enough Credits" : "Open Pack"}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </main>

      <Dialog open={showResults} onOpenChange={setShowResults}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Pack Opened!
            </DialogTitle>
            <DialogDescription>Here are your new cards</DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
            {pulledCards.map((card, index) => (
              <div key={index} className="space-y-2">
                <Card className="overflow-hidden">
                  <div className="aspect-[2/3] bg-gradient-to-br from-primary/10 to-purple-500/10 flex items-center justify-center">
                    <span className="text-4xl">🃏</span>
                  </div>
                  <CardContent className="p-3">
                    <p className="font-semibold text-sm truncate">{card.name}</p>
                    <Badge variant="outline" className="mt-1 text-xs">
                      {card.rarity}
                    </Badge>
                  </CardContent>
                </Card>
                {card.canDust && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full bg-transparent"
                    onClick={() => handleDustCard((card as any)._id)}
                  >
                    Dust for {card.dustValue}
                  </Button>
                )}
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
