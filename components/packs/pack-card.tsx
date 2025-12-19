"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Package } from "lucide-react"

interface PackCardProps {
  pack: {
    _id: string
    name: string
    description: string
    price: number
    cardCount: number
    headerImageUrl?: string
  }
  userCredits: number
  opening: boolean
  onOpen: (packId: string, price: number) => void
}

export function PackCard({ pack, userCredits, opening, onOpen }: PackCardProps) {
  const [quantity, setQuantity] = useState(1)

  return (
    <Card className="overflow-hidden border-4 border-amber-700 shadow-[0_0_20px_rgba(251,191,36,0.3)] bg-gradient-to-b from-slate-800 to-slate-900 hover:shadow-[0_0_30px_rgba(251,191,36,0.5)] transition-all hover:scale-105">
      <CardHeader className="p-0">
        {pack.headerImageUrl ? (
          <div className="aspect-video relative overflow-hidden border-b-4 border-amber-700">
            <img
              src={pack.headerImageUrl || "/placeholder.svg"}
              alt={pack.name}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-transparent"></div>
          </div>
        ) : (
          <div className="aspect-video bg-gradient-to-br from-amber-900/40 via-orange-900/40 to-yellow-900/40 rounded-t-lg flex items-center justify-center border-b-4 border-amber-700 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent animate-pulse"></div>
            <Package className="h-20 w-20 text-amber-400 drop-shadow-[0_0_10px_rgba(251,191,36,0.5)] relative z-10" />
          </div>
        )}
        <div className="p-4">
          <CardTitle className="text-2xl font-black text-amber-300 drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)] [text-shadow:_1px_1px_0_rgb(139_69_19)]">
            {pack.name}
          </CardTitle>
          <CardDescription className="text-slate-300 mt-2 font-medium">{pack.description}</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <div className="flex items-center justify-between">
          <Badge className="bg-gradient-to-r from-blue-600 to-blue-800 border-2 border-blue-400 text-white font-bold shadow-lg px-3 py-1">
            {pack.cardCount} cards
          </Badge>
          <span className="text-3xl font-black text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.8)] [text-shadow:_1px_1px_0_rgb(139_69_19),_2px_2px_0_rgb(101_51_15)]">
            {pack.price}
          </span>
        </div>
      </CardContent>
      <CardFooter className="flex flex-col gap-2 p-4 bg-gradient-to-b from-slate-900 to-slate-950 border-t-2 border-amber-800">
        <div className="flex items-center gap-2 w-full">
          <label htmlFor={`quantity-${pack._id}`} className="text-sm font-bold text-amber-200">
            Qty:
          </label>
          <input
            id={`quantity-${pack._id}`}
            type="number"
            min={1}
            max={100}
            value={quantity}
            onChange={(e) => setQuantity(Math.max(1, Math.min(100, Number(e.target.value) || 1)))}
            className="w-16 border-2 border-amber-700 bg-slate-800 text-amber-100 rounded px-2 py-1 text-center text-sm font-bold focus:border-amber-500 focus:ring-2 focus:ring-amber-500/50"
            disabled={opening}
          />
          <span className="text-xs text-slate-400 font-semibold">(max 100)</span>
        </div>
        <Button
          className="w-full bg-gradient-to-b from-amber-500 to-amber-700 hover:from-amber-400 hover:to-amber-600 text-slate-900 font-black text-lg border-4 border-amber-800 shadow-[0_4px_0_rgb(120,53,15)] hover:shadow-[0_2px_0_rgb(120,53,15)] active:shadow-none hover:translate-y-[2px] active:translate-y-[4px] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none disabled:translate-y-0"
          onClick={() => onOpen(pack._id, pack.price)}
          disabled={userCredits < pack.price * quantity || opening}
        >
          {opening
            ? "OPENING..."
            : userCredits < pack.price * quantity
              ? "NOT ENOUGH CREDITS"
              : `OPEN ${quantity} PACK${quantity > 1 ? "S" : ""}`}
        </Button>
      </CardFooter>
    </Card>
  )
}
