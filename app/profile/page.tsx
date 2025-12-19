"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Navigation } from "@/components/layout/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { LoadingSpinner } from "@/components/shared/loading-spinner"

export default function ProfilePage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [userRes] = await Promise.all([fetch("/api/user/profile")])

        if (userRes.ok) setUser(await userRes.json())
        else router.push("/")
      } catch (error) {
        console.error("Failed to fetch data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [router])

  if (loading) {
    return <LoadingSpinner />
  }

  if (!user) return null

  return (
    <div className="min-h-screen bg-background">
      <Navigation user={user} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mx-auto my-auto max-w-4xl">
          <Card>
            <CardHeader className="text-center">
              <Avatar className="h-32 w-32 mx-auto mb-4">
                <AvatarImage src={user.avatarUrl || "/placeholder.svg"} />
                <AvatarFallback className="text-4xl">{user.username[0].toUpperCase()}</AvatarFallback>
              </Avatar>
              <CardTitle className="text-2xl">{user.username}</CardTitle>
              <CardDescription>Member since {new Date(user.createdAt).toLocaleDateString()}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Credits</span>
                  <span className="font-bold text-primary">{user.credits}</span>
                </div>
              </div>
              <Button className="w-full mt-4">Change Avatar</Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
