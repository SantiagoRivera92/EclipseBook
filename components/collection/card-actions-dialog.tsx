"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

interface CardActionsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  card: {
    cardCode: number
    name: string
    rarities: Array<{
      rarity: string
      count: number
      dustValue: number
    }>
  } | null
  onDust: (cardCode: number, rarity: string, quantity: number) => Promise<void>
  onUpdateCard: (cardCode: number) => void
}

export function CardActionsDialog({ open, onOpenChange, card, onDust, onUpdateCard }: CardActionsDialogProps) {
  const [dusting, setDusting] = useState(false)
  const [dustError, setDustError] = useState<string | null>(null)
  const [dustSuccess, setDustSuccess] = useState<string | null>(null)
  const [dustDialog, setDustDialog] = useState<{ rarity: any; open: boolean }>({ rarity: null, open: false })
  const [qty, setQty] = useState(1)
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean,
    rarity: any | null,
    type: 'all' | 'keep3' | null
  }>({ open: false, rarity: null, type: null })

  const handleDust = async (rarity: any, quantity: number) => {
    if (!card) return

    setDusting(true)
    setDustError(null)
    setDustSuccess(null)

    try {
      await onDust(card.cardCode, rarity.rarity, quantity)
      setDustSuccess(`Dusted ${quantity} ${rarity.rarity} for ${rarity.dustValue * quantity} credits!`)

      if (rarity.count - quantity <= 0) {
        setDustDialog({ rarity: null, open: false })
        const remainingRarities = card.rarities.filter((r) => {
          if (r.rarity === rarity.rarity) return r.count - quantity > 0
          return true
        })
        if (remainingRarities.length === 0) {
          onOpenChange(false)
        }
      }

      setTimeout(() => {
        onUpdateCard(card.cardCode)
      }, 100)
    } catch (error) {
      setDustError("Failed to dust cards")
    } finally {
      setDusting(false)
    }
  }

  if (!card) return null

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{card.name}</DialogTitle>
            <DialogDescription>Dust cards to earn credits</DialogDescription>
          </DialogHeader>
          <div className="space-y-6 overflow-y-auto">
            {dustError && <div className="text-red-500 text-xs mb-2">{dustError}</div>}
            {dustSuccess && <div className="text-green-600 text-xs mb-2">{dustSuccess}</div>}

            {card.rarities.map((rarity, idx) => (
              <Card key={`${rarity.rarity}-${idx}`} className="p-3 flex flex-col gap-2">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <Badge>{rarity.rarity}</Badge>
                      <span className="text-xs text-muted-foreground">x{rarity.count}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">Dust Value:</span>
                      <span className="text-xs">{rarity.dustValue} per card</span>
                    </div>
                  </div>
                  <div className="flex flex-row gap-2 mt-2 sm:mt-0">
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={dusting || rarity.count === 0}
                      onClick={() => {
                        setQty(Math.min(rarity.count, 1))
                        setDustDialog({ rarity, open: true })
                      }}
                    >
                      Dust
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      disabled={dusting || rarity.count === 0}
                      onClick={() => setConfirmDialog({ open: true, rarity, type: 'all' })}
                    >
                      Dust All
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      disabled={dusting || rarity.count < 4}
                      onClick={() => setConfirmDialog({ open: true, rarity, type: 'keep3' })}
                    >
                      Dust All (Keep 3)
                    </Button>
                  </div>
                      {/* Confirmation Dialog for Dust All / Dust All (Keep 3) */}
                      <Dialog open={confirmDialog.open} onOpenChange={open => setConfirmDialog(d => ({ ...d, open }))}>
                        <DialogContent className="max-w-xs">
                          <DialogHeader>
                            <DialogTitle>Confirm Dusting</DialogTitle>
                            <DialogDescription>
                              {confirmDialog.rarity && confirmDialog.type === 'all' && (
                                <>
                                  Are you sure you want to dust <b>all {confirmDialog.rarity.count} copies</b> of <b>{card.name} ({confirmDialog.rarity.rarity})</b>?
                                  <br />
                                  This cannot be undone.
                                </>
                              )}
                              {confirmDialog.rarity && confirmDialog.type === 'keep3' && (
                                <>
                                  Are you sure you want to dust <b>{confirmDialog.rarity.count - 3} copies</b> of <b>{card.name} ({confirmDialog.rarity.rarity})</b> and keep 3?
                                  <br />
                                  This cannot be undone.
                                </>
                              )}
                            </DialogDescription>
                          </DialogHeader>
                          <div className="flex flex-row gap-2 mt-4">
                            <Button
                              variant="outline"
                              onClick={() => setConfirmDialog({ open: false, rarity: null, type: null })}
                              disabled={dusting}
                            >
                              Cancel
                            </Button>
                            <Button
                              variant="destructive"
                              onClick={async () => {
                                if (!confirmDialog.rarity) return
                                setConfirmDialog({ open: false, rarity: null, type: null })
                                if (confirmDialog.type === 'all') {
                                  await handleDust(confirmDialog.rarity, confirmDialog.rarity.count)
                                } else if (confirmDialog.type === 'keep3') {
                                  await handleDust(confirmDialog.rarity, confirmDialog.rarity.count - 3)
                                }
                              }}
                              disabled={dusting}
                            >
                              Confirm
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                </div>
              </Card>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={dustDialog.open} onOpenChange={(open) => setDustDialog((d) => ({ ...d, open }))}>
        <DialogContent className="max-w-xs">
          <DialogHeader>
            <DialogTitle>Dust Cards</DialogTitle>
            <DialogDescription>
              {dustDialog.rarity && (
                <>
                  How many <b>{dustDialog.rarity.rarity}</b> copies would you like to dust?
                  <br />
                  <span className="text-xs text-muted-foreground">
                    Dust value: {dustDialog.rarity.dustValue} per card. Max: {dustDialog.rarity.count}
                  </span>
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          {dustDialog.rarity && (
            <form
              onSubmit={(e) => {
                e.preventDefault()
                if (qty > 0 && qty <= dustDialog.rarity.count) {
                  handleDust(dustDialog.rarity, qty)
                }
              }}
              className="flex flex-col gap-4"
            >
              <input
                type="number"
                min={1}
                max={dustDialog.rarity.count}
                value={qty}
                onChange={(e) => {
                  const val = Number(e.target.value)
                  setQty(isNaN(val) ? 1 : val)
                }}
                className="border rounded px-2 py-1 text-center text-sm"
                disabled={dusting}
              />
              <Button type="submit" disabled={dusting || qty <= 0 || qty > dustDialog.rarity.count}>
                {dusting ? "Dusting..." : `Dust for ${dustDialog.rarity.dustValue * qty} Credits`}
              </Button>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
