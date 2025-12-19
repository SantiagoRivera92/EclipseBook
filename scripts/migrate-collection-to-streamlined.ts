// Migration script to convert old collection system to new streamlined system
// OLD: Multiple documents per user, one per card copy with originalOwner tracking
// NEW: Single document per user with card counts by rarity
import { getDatabase } from "@/lib/db"

async function migrateCollectionToStreamlined() {
  const db = await getDatabase()
  const oldCollection = db.collection("collection")
  const newCollection = db.collection("user_collections")

  console.log("Starting collection migration...")

  // Get all unique user IDs from old collection
  const userIds = await oldCollection.distinct("userId")
  console.log(`Found ${userIds.length} users with collections`)

  let migratedUsers = 0

  for (const userId of userIds) {
    try {
      // Get all cards for this user
      const userCards = await oldCollection.find({ userId }).toArray()

      // Build the new collection structure
      const cardMap = new Map<
        number,
        {
          Common: number
          Rare: number
          "Super Rare": number
          "Ultra Rare": number
          "Secret Rare": number
          "Ultimate Rare": number
        }
      >()

      for (const card of userCards) {
        const password = card.cardCode
        const rarity = card.rarity

        if (!cardMap.has(password)) {
          cardMap.set(password, {
            Common: 0,
            Rare: 0,
            "Super Rare": 0,
            "Ultra Rare": 0,
            "Secret Rare": 0,
            "Ultimate Rare": 0,
          })
        }

        const copies = cardMap.get(password)!

        // Increment the count for this rarity
        if (rarity in copies) {
          copies[rarity as keyof typeof copies]++
        } else {
          console.warn(`Unknown rarity "${rarity}" for card ${password}, treating as Common`)
          copies.Common++
        }
      }

      // Convert map to array format
      const collection = Array.from(cardMap.entries()).map(([password, copies]) => ({
        password,
        copies,
      }))

      // Insert or update the user's collection
      await newCollection.updateOne(
        { userId },
        {
          $set: {
            userId,
            collection,
            updatedAt: new Date(),
          },
          $setOnInsert: {
            createdAt: new Date(),
          },
        },
        { upsert: true },
      )

      migratedUsers++
      console.log(`Migrated user ${migratedUsers}/${userIds.length}: ${userId} (${userCards.length} cards)`)
    } catch (error) {
      console.error(`Error migrating user ${userId}:`, error)
    }
  }

  console.log(`\nMigration complete!`)
  console.log(`Successfully migrated ${migratedUsers} users`)
  console.log(`\nOLD collection remains intact. To complete migration:`)
  console.log(`1. Verify new collection works correctly`)
  console.log(`2. Rename 'collection' to 'collection_backup'`)
  console.log(`3. Rename 'user_collections' to 'collection'`)
  console.log(`4. Delete 'collection_backup' when confident`)
}

// Run migration
migrateCollectionToStreamlined()
  .then(() => {
    console.log("Migration script finished")
    process.exit(0)
  })
  .catch((error) => {
    console.error("Migration failed:", error)
    process.exit(1)
  })
