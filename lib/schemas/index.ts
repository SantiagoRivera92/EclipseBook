// Validation schemas for the application
import { z } from "zod"

export const UserSchema = z.object({
  _id: z.string().optional(),
  discordId: z.string(),
  username: z.string(),
  avatar: z.string().url().optional(),
  credits: z.number().int().min(0),
  lastCreditClaim: z.date(),
  createdAt: z.date(),
  updatedAt: z.date(),
})

export type User = z.infer<typeof UserSchema>

export const CardPackSchema = z.object({
  _id: z.string().optional(),
  name: z.string(),
  description: z.string().optional(),
  price: z.number().int().positive(),
  cardPool: z.array(
    z.object({
      code: z.number().int().positive(),
      rarities: z.array(z.string()),
    }),
  ),
  slotRatios: z.array(
    z.object({
      rarity: z.string(),
      chance: z.number().min(0).max(1),
      dv: z.number().int().positive(),
    }),
  ),
  averageDustValue: z.number().positive(),
  createdAt: z.date().optional(),
})

export type CardPack = z.infer<typeof CardPackSchema>

// Validate that slot ratios add up to 1
export function validateSlotRatios(ratios: any[]): boolean {
  const total = ratios.reduce((sum, r) => sum + r.chance, 0)
  return Math.abs(total - 1) < 0.0001
}

export const CollectionCardSchema = z.object({
  _id: z.string().optional(),
  userId: z.string(),
  cardCode: z.number(),
  rarity: z.string(),
  dustValue: z.number().int().positive(),
  packName: z.string(),
  originalOwner: z.string(),
  createdAt: z.date(),
})

export type CollectionCard = z.infer<typeof CollectionCardSchema>

export const MarketplaceListing = z.object({
  _id: z.string().optional(),
  cardId: z.string(),
  sellerId: z.string(),
  price: z.number().int().positive(),
  type: z.enum(["listing", "auction"]),
  expiresAt: z.date(),
  auctionBids: z
    .array(
      z.object({
        bidderId: z.string(),
        amount: z.number().int().positive(),
        bidAt: z.date(),
      }),
    )
    .optional(),
  sold: z.boolean().default(false),
})

export type MarketplaceListing = z.infer<typeof MarketplaceListing>
