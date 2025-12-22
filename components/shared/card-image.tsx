"use client"

import { cn } from "@/lib/utils"
import { RARITY_ICONS, RARITY_DUST_VALUES } from "@/lib/constants"
import { ReducedRarity } from "@/lib/types"
import "@/styles/card-shine.css"

interface CardImageProps {
  // Card data
  name: string
  imageUrl?: string

  // Rarity display
  rarity?: string
  rarities?: ReducedRarity[]

  // Count display
  count?: number

  // Interaction
  onClick?: () => void

  // Layout options
  aspectRatio?: string

  // Additional styling
  className?: string
  imageClassName?: string
  showCount?: boolean
}

export function CardImage({
  name,
  imageUrl,
  rarity,
  rarities,
  count,
  onClick,
  aspectRatio = "813/1185",
  className,
  imageClassName,
  showCount = false,
}: CardImageProps) {
  const isClickable = !!onClick

  // Display multiple rarities if provided
  const displayRarities: ReducedRarity[] = rarities || (rarity ? [{ rarity: rarity, count: 1, dustValue: RARITY_DUST_VALUES[rarity] }] : [])
  const rarityIcons = rarity ? [RARITY_ICONS[rarity]] : [displayRarities.map(r => RARITY_ICONS[r.rarity])].flat()

  // Determine shiny effect class
  let shineClass = ""
  let shineOverlay = null
  if (rarity) {
    switch (rarity.toLowerCase()) {
      case "rare":
        shineClass = "card-shine card-shine--rare"
        shineOverlay = <div className="card-shine__effect" />
        break
      case "super rare":
        shineClass = "card-shine card-shine--super"
        shineOverlay = <div className="card-shine__effect" />
        break
      case "ultra rare":
        shineClass = "card-shine card-shine--ultra"
        shineOverlay = <>
          <div className="card-shine__effect" />
          <div className="card-shine__effect card-shine__effect--2" />
        </>
        break
      case "secret rare":
        shineClass = "card-shine card-shine--secret"
        shineOverlay = <div className="card-shine__effect" />
        break
      case "ultimate rare":
        shineClass = "card-shine card-shine--ultimate"
        shineOverlay = <>
          <div className="card-shine__effect" />
          <div className="card-shine__effect card-shine__effect--2" />
        </>
        break
      default:
        shineClass = "card-shine card-shine--common"
        shineOverlay = null
    }
  } else {
    // If no single rarity, determine highest rarity from rarities array
    if (displayRarities.length > 0) {
      // Define rarity order from lowest to highest
      const rarityOrder = [
        "common",
        "rare",
        "super rare",
        "ultra rare",
        "secret rare",
        "ultimate rare",
      ]
      // Find the highest rarity present
      const highestRarity = displayRarities
        .map(r => r.rarity)
        .sort((a, b) => rarityOrder.indexOf(b.toLowerCase()) - rarityOrder.indexOf(a.toLowerCase()))[0]

      switch (highestRarity?.toLowerCase()) {
        case "rare":
          shineClass = "card-shine card-shine--rare"
          shineOverlay = <div className="card-shine__effect" />
          break
        case "super rare":
          shineClass = "card-shine card-shine--super"
          shineOverlay = <div className="card-shine__effect" />
          break
        case "ultra rare":
          shineClass = "card-shine card-shine--ultra"
          shineOverlay = <>
            <div className="card-shine__effect" />
            <div className="card-shine__effect card-shine__effect--2" />
          </>
          break
        case "secret rare":
          shineClass = "card-shine card-shine--secret"
          shineOverlay = <div className="card-shine__effect" />
          break
        case "ultimate rare":
          shineClass = "card-shine card-shine--ultimate"
          shineOverlay = <>
            <div className="card-shine__effect" />
            <div className="card-shine__effect card-shine__effect--2" />
          </>
          break
        default:
          shineClass = "card-shine card-shine--common"
          shineOverlay = null
      }
    } else {
      shineClass = "card-shine card-shine--common"
      shineOverlay = null
    }
  }

  return (
    <div
      className={cn(
        "flex flex-col",
        isClickable && "cursor-pointer group",
        className,
      )}
      onClick={onClick}
    >
      {/* Card Image Container */}
      <div
        className={cn(
          shineClass,
          "relative w-full overflow-hidden",
          "bg-gradient-to-br from-primary/10 to-purple-500/10 rounded-lg",
          "hover:scale-102 transition-transform duration-200",
        )}
        style={{ aspectRatio }}
      >
        {/* Shiny overlay */}
        {shineOverlay}

        {rarityIcons.length > 0 && (
          <div className="absolute bottom-2 right-2 flex flex-row gap-1 z-10">
            {rarityIcons.map((r) => {
              return (
                <div
                  key={name + r.abbr}
                  className="w-7 h-7 flex items-center justify-center rounded-full text-xs font-bold shadow"
                  style={{ backgroundColor: r.color, color: r.textColor }}
                >
                  {r.abbr}
                </div>
              );
            })}
          </div>
        )}

        {imageUrl && (
          <img
            src={imageUrl || "/placeholder.svg"}
            alt={name}
            className={cn(
              "inset-0 w-full h-full object-cover",
              "object-contain",
              isClickable && "group-hover:scale-105 transition-transform",
              imageClassName,
            )}
            loading="lazy"
          />
        )}
      </div>

      {/* Count display for compact/card variants */}
      {showCount && count !== undefined && (
        <span className="text-xs mt-1 block">x{count}</span>
      )}
    </div>
  )
}
