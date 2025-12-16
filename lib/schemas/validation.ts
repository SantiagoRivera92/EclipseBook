import { z } from "zod"

export const MarketplaceListingSchema = z.object({
  cardId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid card ID"),
  price: z.number().int().positive().max(1000000, "Price too high"),
})

export const ProfileUpdateSchema = z.object({
  cardArtId: z.string().optional(),
  bio: z.string().max(500, "Bio too long").optional(),
})

export const AdminCreditsSchema = z.object({
  targetUserId: z
    .string()
    .regex(/^[0-9a-fA-F]{24}$/, "Invalid user ID")
    .optional(),
  amount: z.number().int().positive().max(1000000, "Amount too high"),
  reason: z.string().min(3, "Reason required").max(500),
  targetAll: z.boolean().optional(),
})

export const DeckUpdateSchema = z.object({
  name: z.string().min(1).max(50),
  mainDeck: z.array(
    z.object({
      cardCode: z.number().int().positive(),
      count: z.number().int().positive().max(3),
    }),
  ),
  extraDeck: z.array(
    z.object({
      cardCode: z.number().int().positive(),
      count: z.number().int().positive().max(3),
    }),
  ),
  sideDeck: z.array(
    z.object({
      cardCode: z.number().int().positive(),
      count: z.number().int().positive().max(3),
    }),
  ),
})

export const BidSchema = z.object({
  auctionId: z.string().regex(/^[0-9a-fA-F]{24}$/),
  amount: z.number().int().positive().max(1000000),
})

export const MatchCompleteSchema = z.object({
  winnerId: z.string().regex(/^[0-9a-fA-F]{24}$/),
  matchType: z.enum(["ladder", "tournament", "elimination"]),
})
