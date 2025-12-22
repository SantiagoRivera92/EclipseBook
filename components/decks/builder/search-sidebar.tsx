"use client"

import type React from "react"
import { useState } from "react"
import { Search, ChevronDown, ChevronUp, FilterX } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { BuilderCard } from "./builder-card"
import type { Card, DeckSection, FilterState } from "./types"
import { MONSTER_CARD_TYPES, SPELL_TYPES, TRAP_TYPES, ATTRIBUTES, RACES } from "./types"
import { cn } from "@/lib/utils"

interface SearchSidebarProps {
  searchQuery: string
  onSearchChange: (value: string) => void
  filters: FilterState
  onFilterChange: (filters: FilterState) => void
  filteredCards: Card[]
  onInteract: (e: React.MouseEvent, card: Card, source: DeckSection) => void
  cardsInDeckCount: Record<number, number>
}

export function SearchSidebar({
  searchQuery,
  onSearchChange,
  filters,
  onFilterChange,
  filteredCards,
  onInteract,
  cardsInDeckCount,
}: SearchSidebarProps) {
  const [showFilters, setShowFilters] = useState(false)

  const resetFilters = () => {
    onFilterChange({
      cardType: null,
      monsterCardType: null,
      race: null,
      monsterType: null,
      attribute: null,
      spellType: null,
      trapType: null,
      level: null,
      atk: "",
      def: "",
    })
  }

  return (
    <div className="w-full lg:w-[360px] flex flex-col gap-4 sticky top-20 h-[calc(100vh-120px)]">
      <div className="bg-card border border-border rounded-xl overflow-hidden flex flex-col shadow-sm h-full">
        <div className="p-4 space-y-3 bg-muted/30 border-b border-border">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search card name..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-9 bg-background border-border text-foreground h-10"
            />
          </div>

          <Button
            variant="secondary"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className="w-full flex items-center justify-between h-9 px-3 rounded-md"
          >
            <span className="text-xs font-bold uppercase tracking-wide">
              {showFilters ? "Hide filters" : "More filters"}
            </span>
            {showFilters ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </div>

        <div
          className={cn(
            "overflow-y-auto transition-all duration-300",
            showFilters ? "max-h-[60%] border-b border-border" : "max-h-0",
          )}
        >
          <div className="p-4 space-y-4 bg-background">
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Card Type</label>
              <Select
                value={filters.cardType || "all"}
                onValueChange={(val) => onFilterChange({ ...filters, cardType: val === "all" ? null : (val as any) })}
              >
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="Monster">Monster</SelectItem>
                  <SelectItem value="Spell">Spell</SelectItem>
                  <SelectItem value="Trap">Trap</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Monster Filters */}
            {filters.cardType === "Monster" && (
              <div className="space-y-4 animate-in fade-in slide-in-from-top-1 duration-200">
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
                    Card Type
                  </label>
                  <Select
                    value={filters.monsterCardType || "all"}
                    onValueChange={(val) => onFilterChange({ ...filters, monsterCardType: val === "all" ? null : val })}
                  >
                    <SelectTrigger className="h-9 text-xs">
                      <SelectValue placeholder="Any" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Any</SelectItem>
                      {MONSTER_CARD_TYPES.map((t) => (
                        <SelectItem key={t} value={t}>
                          {t}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Type</label>
                  <Select
                    value={filters.race || "all"}
                    onValueChange={(val) => onFilterChange({ ...filters, race: val === "all" ? null : val })}
                  >
                    <SelectTrigger className="h-9 text-xs">
                      <SelectValue placeholder="Any Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Any Type</SelectItem>
                      {RACES.map((r) => (
                        <SelectItem key={r} value={r}>
                          {r}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
                      Attribute
                    </label>
                    <Select
                      value={filters.attribute || "all"}
                      onValueChange={(val) => onFilterChange({ ...filters, attribute: val === "all" ? null : val })}
                    >
                      <SelectTrigger className="h-9 text-xs">
                        <SelectValue placeholder="Any" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Any</SelectItem>
                        {ATTRIBUTES.map((a) => (
                          <SelectItem key={a} value={a}>
                            {a}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
                      Level/Rank
                    </label>
                    <Input
                      type="number"
                      placeholder="1-12"
                      value={filters.level || ""}
                      onChange={(e) =>
                        onFilterChange({ ...filters, level: e.target.value ? Number(e.target.value) : null })
                      }
                      className="h-9 text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">ATK</label>
                    <Input
                      placeholder="e.g. 2500"
                      value={filters.atk}
                      onChange={(e) => onFilterChange({ ...filters, atk: e.target.value })}
                      className="h-9 text-xs"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">DEF</label>
                    <Input
                      placeholder="e.g. 2100"
                      value={filters.def}
                      onChange={(e) => onFilterChange({ ...filters, def: e.target.value })}
                      className="h-9 text-xs"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Spell/Trap Filters */}
            {(filters.cardType === "Spell" || filters.cardType === "Trap") && (
              <div className="space-y-1.5 animate-in fade-in slide-in-from-top-1 duration-200">
                <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Type</label>
                <Select
                  value={(filters.cardType === "Spell" ? filters.spellType : filters.trapType) || "all"}
                  onValueChange={(val) =>
                    onFilterChange({
                      ...filters,
                      [filters.cardType === "Spell" ? "spellType" : "trapType"]: val === "all" ? null : val,
                    })
                  }
                >
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue placeholder="Any" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Any</SelectItem>
                    {(filters.cardType === "Spell" ? SPELL_TYPES : TRAP_TYPES).map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <Button
              variant="ghost"
              size="sm"
              onClick={resetFilters}
              className="w-full text-[10px] font-bold tracking-wider uppercase gap-2 hover:bg-destructive/5 hover:text-destructive"
            >
              <FilterX className="h-3 w-3" /> Clear Filters
            </Button>
          </div>
        </div>

        {/* Results Area */}
        <div className="flex-1 bg-background overflow-hidden flex flex-col min-h-0">
          <div className="p-4 grid grid-cols-3 gap-2 overflow-y-auto h-full content-start">
            {searchQuery.length >= 2 ? (
              filteredCards.length > 0 ? (
                filteredCards.map((card, i) => (
                  <BuilderCard
                    key={`search-${card.cardCode}-${i}`}
                    card={card}
                    section="search"
                    onInteract={onInteract}
                    countInDeck={cardsInDeckCount[card.cardCode] || 0}
                  />
                ))
              ) : (
                <div className="col-span-full py-12 text-center">
                  <p className="text-muted-foreground text-xs italic">No results found</p>
                </div>
              )
            ) : (
              <div className="col-span-full py-16 text-center space-y-3">
                <Search className="h-8 w-8 text-muted/30 mx-auto" />
                <p className="text-muted-foreground text-[11px] font-medium uppercase tracking-widest">
                  Type to search
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
