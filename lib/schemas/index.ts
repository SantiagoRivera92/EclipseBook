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
  headerImageUrl: z.string().optional(),
  price: z.number().int().positive(),
  cardPool: z.array(
    z.object({
      code: z.number().int().positive(),
      rarities: z.array(z.string()),
    }),
  ),
  averageDustValue: z.number().positive(),
  createdAt: z.date().optional(),
})

export type CardPack = z.infer<typeof CardPackSchema>

export const UserCollectionSchema = z.object({
  _id: z.string().optional(),
  userId: z.string(),
  collection: z.array(
    z.object({
      password: z.number(), // Card password (code)
      copies: z.object({
        Common: z.number().int().min(0).default(0),
        Rare: z.number().int().min(0).default(0),
        "Super Rare": z.number().int().min(0).default(0),
        "Ultra Rare": z.number().int().min(0).default(0),
        "Secret Rare": z.number().int().min(0).default(0),
        "Ultimate Rare": z.number().int().min(0).default(0),
      }),
    }),
  ),
  updatedAt: z.date(),
  createdAt: z.date(),
})

export type UserCollection = z.infer<typeof UserCollectionSchema>
