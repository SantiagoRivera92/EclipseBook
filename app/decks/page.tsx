"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Navigation } from "@/components/layout/navigation"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Plus, Layers, Edit, Trash2 } from "lucide-react"
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
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!user) return null

  return (
    <div className="min-h-screen bg-background">
      <Navigation user={user} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">My Decks</h1>
            <p className="text-muted-foreground">Build and manage your decks</p>
          </div>
          <Link href="/decks/builder">
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              New Deck
            </Button>
          </Link>
        </div>

        {decks.length === 0 ? (
          <Card className="p-12 text-center">
            <Layers className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No decks yet</h3>
            <p className="text-muted-foreground mb-4">Create your first deck to start dueling</p>
            <Link href="/decks/builder">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Deck
              </Button>
            </Link>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {decks.map((deck) => (
              <Card key={deck._id} className="flex flex-col">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="line-clamp-1">{deck.name}</CardTitle>
                      <CardDescription className="mt-1">
                        Last modified: {new Date(deck.lastModified).toLocaleDateString()}
                      </CardDescription>
                    </div>
                    {deck.canUse ? (
                      <Badge variant="default">Ready</Badge>
                    ) : (
                      <Badge variant="destructive">Missing Cards</Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="flex-1">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Main Deck:</span>
                      <span className="font-semibold">{deck.mainDeckCount} cards</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Extra Deck:</span>
                      <span className="font-semibold">{deck.extraDeckCount} cards</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Side Deck:</span>
                      <span className="font-semibold">{deck.sideDeckCount} cards</span>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex gap-2">
                  <Link href={`/decks/builder/${deck._id}`} className="flex-1">
                    <Button variant="outline" className="w-full gap-2 bg-transparent">
                      <Edit className="h-4 w-4" />
                      Edit
                    </Button>
                  </Link>
                  <Button variant="destructive" size="icon" onClick={() => setDeleteId(deck._id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </CardFooter>
              </Card>
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
