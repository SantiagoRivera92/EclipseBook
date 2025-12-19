"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Navigation } from "@/components/layout/navigation"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Package } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { RARITY_ABBREVIATIONS, RARITY_ICONS } from "@/lib/constants"

interface Pack {
  _id: string
  name: string
  description: string
  price: number
  cardPool: any[]
  headerImageUrl?: string
}


interface PulledCard {
  _id?: string
  name: string
  rarity: string
  imageUrl?: string
  dustValue?: number
}

// Rarity order for sorting
const RARITY_ORDER = [
  "Ultimate Rare",
  "Secret Rare",
  "Ultra Rare",
  "Super Rare",
  "Rare",
  "Common",
]

import { useRef as useReactRef } from "react"

export default function PacksPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [packs, setPacks] = useState<Pack[]>([])
  const [loading, setLoading] = useState(true)
  const [opening, setOpening] = useState(false)

  const [pulledCards, setPulledCards] = useState<PulledCard[]>([])
  const [showResults, setShowResults] = useState(false)
  const blockNavRef = useReactRef(false)

  interface GroupedCard {
    key: string
    name: string
    rarity: string
    imageUrl?: string
    dustValue?: number
    canDust?: boolean
    count: number
    ids: string[]
  }

  // Group identical cards (same dustValue, originalOwner, pack, rarity)
  function groupCards(cards: PulledCard[]): GroupedCard[] {
    const map = new Map<string, GroupedCard>()
    for (const card of cards) {
      const key = [card.name, card.rarity, card.dustValue].join("|")
      if (!map.has(key)) {
        map.set(key, {
          key,
          name: card.name,
          rarity: card.rarity,
          imageUrl: card.imageUrl,
          dustValue: card.dustValue,
          count: 1,
          ids: card._id ? [card._id] : [],
        })
      } else {
        const g = map.get(key)!
        g.count++
        if (card._id) g.ids.push(card._id)
      }
    }
    return Array.from(map.values())
  }

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

  const [packQuantities, setPackQuantities] = useState<{ [packId: string]: number }>({})

  // Block navigation while opening packs
  useEffect(() => {
    if (!opening) return;
    const beforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
      return '';
    };
    window.addEventListener('beforeunload', beforeUnload);
    blockNavRef.current = true;
    window.addEventListener('popstate', beforeUnload);
    return () => {
      window.removeEventListener('beforeunload', beforeUnload);
      window.removeEventListener('popstate', beforeUnload);
      blockNavRef.current = false;
    };
  }, [opening, router]);

  const handleOpenPack = async (packId: string, price: number) => {
    const quantity = Math.max(1, Math.min(packQuantities[packId] || 1, 100))
    if (user.credits < price * quantity) return

    setOpening(true)

    try {
      const res = await fetch("/api/packs/open", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ packId, quantity }),
      })

      if (res.ok) {
        const data = await res.json()
        let cards: PulledCard[] = data.cards
        if (cards.length > 0 && !('packIndex' in cards[0])) {
          const packSize = packs.find(p => p._id === packId)?.cardPool.length || 8
          cards = cards.map((card, i) => ({ ...card, packIndex: Math.floor(i / packSize) }))
        }
        setPulledCards(cards)
        let credits = user.credits - data.creditsCost
        setUser({ ...user, credits: credits })
        setShowResults(true)
      }
    } catch (error) {
      console.error("Failed to open pack:", error)
    } finally {
      setOpening(false)
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
    <div className="min-h-screen bg-background relative">
      {opening && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="flex flex-col items-center gap-4">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-primary"></div>
            <span className="text-white text-lg font-semibold">Opening packs...</span>
          </div>
        </div>
      )}
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
                <div className="aspect-video bg-gradient-to-br from-primary/20 to-purple-500/20 rounded-lg flex items-center justify-center mb-4 overflow-hidden">
                  {pack.headerImageUrl ? (
                    <img
                      src={pack.headerImageUrl}
                      alt={pack.name}
                      className="object-contain h-full w-full"
                      loading="lazy"
                    />
                  ) : (
                    <Package className="h-16 w-16 text-primary" />
                  )}
                </div>
                <CardTitle>{pack.name}</CardTitle>
                <CardDescription>{pack.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <Badge variant="secondary">{pack.cardPool.length} cards</Badge>
                  <span className="text-2xl font-bold text-primary">{pack.price} credits</span>
                </div>
              </CardContent>
              <CardFooter className="flex flex-col gap-2">
                <div className="flex items-center gap-2 w-full">
                  <label htmlFor={`quantity-${pack._id}`} className="text-xs">Qty:</label>
                  <input
                    id={`quantity-${pack._id}`}
                    type="number"
                    min={1}
                    max={100}
                    value={packQuantities[pack._id] || 1}
                    onChange={e => setPackQuantities(q => ({ ...q, [pack._id]: Math.max(1, Math.min(100, Number(e.target.value) || 1)) }))}
                    className="w-16 border rounded px-2 py-1 text-center text-sm"
                    disabled={opening}
                  />
                  <span className="text-xs text-muted-foreground">(max 100)</span>
                </div>
                <Button
                  className="w-full"
                  onClick={() => handleOpenPack(pack._id, pack.price)}
                  disabled={user.credits < pack.price * (packQuantities[pack._id] || 1) || opening}
                >
                  {opening ? "Opening..." : user.credits < pack.price * (packQuantities[pack._id] || 1) ? "Not Enough Credits" : `Open ${packQuantities[pack._id] || 1} Pack${(packQuantities[pack._id] || 1) > 1 ? 's' : ''}`}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </main>

      <Dialog open={showResults} onOpenChange={setShowResults}>
        <DialogContent className="max-h-[90vh] min-h-[60vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {pulledCards.length / 8 === 1
                ? "1 Pack Opened!"
                : `${pulledCards.length / 8} Packs Opened!`}
            </DialogTitle>
            <DialogDescription>
              Here are your cards
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-5 gap-4">
            {[...pulledCards]
              .sort((a, b) => {
                const rarityA = RARITY_ORDER.indexOf(a.rarity);
                const rarityB = RARITY_ORDER.indexOf(b.rarity);
                if (rarityA !== rarityB) return rarityA - rarityB;
                return a.name.localeCompare(b.name);
              })
              .map((card, i) => {
                const icon = RARITY_ICONS[card.rarity];
                const abbr = RARITY_ABBREVIATIONS[card.rarity] || card.rarity.charAt(0);

                return (
                  <div key={card._id || card.name + i} className="flex flex-col items-center">
                    <div className="relative aspect-[2/3] w-full from-primary/10 to-purple-500/10 flex flex-col rounded-lg overflow-hidden hover:scale-102 transition-transform duration-200">
                      <div
                        className="w-7 h-7 m-1 flex items-center justify-center rounded-full text-xs font-bold shadow mt-2 ml-2 self-start"
                        style={{ backgroundColor: icon?.color, color: icon?.textColor }}
                      >
                        {abbr}
                      </div>
                      <img
                        src={card.imageUrl || "/placeholder.svg"}
                        alt={card.name}
                        className="w-full h-full object-contain transition-transform duration-200"
                        loading="lazy"
                      />
                    </div>
                  </div>
                );
              })}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
