"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Navigation } from "@/components/layout/navigation"
import { Button } from "@/components/ui/button"
import { Plus, Layers } from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { DeckCard } from "@/components/decks/deck-card"
import { EmptyState } from "@/components/shared/empty-state"
import { PageHeader } from "@/components/shared/page-header"
import { LoadingSpinner } from "@/components/shared/loading-spinner"

interface Deck {
  _id: string
  name: string
  mainDeckCount: number
  extraDeckCount: number
  sideDeckCount: number
  canUse: boolean
  lastModified: string
}

export default function DecksPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [decks, setDecks] = useState<Deck[]>([])
  const [loading, setLoading] = useState(true)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [userRes, decksRes] = await Promise.all([fetch("/api/user/profile"), fetch("/api/decks")])

        if (!userRes.ok) {
          router.push("/")
          return
        }

        if (userRes.ok) setUser(await userRes.json())
        if (decksRes.ok) setDecks(await decksRes.json())
      } catch (error) {
        console.error("Failed to fetch data:", error)
        router.push("/")
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [router])

  const handleDelete = async () => {
    if (!deleteId) return

    try {
      const res = await fetch(`/api/decks/${deleteId}`, {
        method: "DELETE",
      })

      if (res.ok) {
        setDecks(decks.filter((deck) => deck._id !== deleteId))
      }
    } catch (error) {
      console.error("Failed to delete deck:", error)
    } finally {
      setDeleteId(null)
    }
  }

  if (loading) {
    return <LoadingSpinner />
  }

  if (!user) return null

  return (
    <div className="min-h-screen bg-background">
      <Navigation user={user} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <PageHeader
          title="My Decks"
          description="Build and manage your decks"
          action={
            <Link href="/decks/builder">
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                New Deck
              </Button>
            </Link>
          }
        />

        {decks.length === 0 ? (
          <EmptyState
            icon={Layers}
            title="No decks yet"
            description="Create your first deck to start dueling"
            action={
              <Link href="/decks/builder">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Deck
                </Button>
              </Link>
            }
          />
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {decks.map((deck) => (
              <DeckCard key={deck._id} deck={deck} onDelete={() => setDeleteId(deck._id)} />
            ))}
          </div>
        )}
      </main>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Deck</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this deck? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
