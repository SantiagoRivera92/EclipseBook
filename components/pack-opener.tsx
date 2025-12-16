"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"

interface Pack {
  _id: string
  name: string
  price: number
  slotRatios: any[]
}

export function PackOpener() {
  const [packs, setPacks] = useState<Pack[]>([])
  const [selectedPack, setSelectedPack] = useState<Pack | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [credits, setCredits] = useState(0)

  useEffect(() => {
    const loadPacks = async () => {
      try {
        const response = await fetch("/api/packs")
        const data = await response.json()
        setPacks(data)
      } catch (error) {
        toast.error("Failed to load packs")
      }
    }

    const loadCredits = async () => {
      try {
        const response = await fetch("/api/user/profile")
        const data = await response.json()
        setCredits(data.credits)
      } catch (error) {
        console.error("Failed to load credits:", error)
      }
    }

    loadPacks()
    loadCredits()
  }, [])

  const handleOpenPack = async (pack: Pack) => {
    if (credits < pack.price) {
      toast.error("Insufficient credits")
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch("/api/packs/open", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ packId: pack._id }),
      })

      const data = await response.json()

      if (!response.ok) {
        toast.error(data.error || "Failed to open pack")
        return
      }

      toast.success(`Opened pack! ${data.cardsAdded} cards added to collection`)
      setCredits(credits - pack.price)
      setSelectedPack(null)
    } catch (error) {
      toast.error("Failed to open pack")
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Card Packs</h2>
      <div className="grid gap-4 md:grid-cols-2">
        {packs.map((pack) => (
          <Card key={pack._id} className="p-4">
            <h3 className="font-semibold">{pack.name}</h3>
            <p className="text-sm text-muted-foreground">{pack.price} credits</p>
            <p className="mt-2 text-xs text-muted-foreground">8 slots</p>
            <Button
              onClick={() => handleOpenPack(pack)}
              disabled={isLoading || credits < pack.price}
              className="mt-4 w-full"
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Open Pack
            </Button>
          </Card>
        ))}
      </div>
    </div>
  )
}
