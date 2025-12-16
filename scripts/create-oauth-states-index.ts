// Create index for automatic cleanup of expired OAuth states
import { getDatabase } from "@/lib/db"

async function createOAuthStatesIndex() {
  const db = await getDatabase()

  // Create TTL index to auto-delete expired states
  await db.collection("oauth_states").createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 })

  console.log("OAuth states TTL index created successfully")
}

createOAuthStatesIndex().catch(console.error)
