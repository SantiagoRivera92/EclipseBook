"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"

interface Trophy {
  _id: string
  type: string
  title: string
  description: string
  earnedAt: string
}

interface UserProfile {
  _id: string
  username: string
  avatar: string
  cardArtId?: string
  bio?: string
  credits: number
  ladderWins: number
  ladderLosses: number
  ladderWinStreak: number
}

export function UserProfile({ userId, isCurrentUser }: { userId: string; isCurrentUser?: boolean }) {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [trophies, setTrophies] = useState<Trophy[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const response = await fetch(`/api/user/profile/${userId}`)
        const data = await response.json()
        setProfile(data)
      } catch (error) {
        toast.error("Failed to load profile")
      }
    }

    const loadTrophies = async () => {
      try {
        const response = await fetch("/api/trophies")
        const data = await response.json()
        setTrophies(data)
      } catch (error) {
        console.error("Failed to load trophies:", error)
      }
    }

    loadProfile()
    if (isCurrentUser) {
      loadTrophies()
    }

    setIsLoading(false)
  }, [userId, isCurrentUser])

  if (isLoading) {
    return <div>Loading...</div>
  }

  if (!profile) {
    return <div>Profile not found</div>
  }

  const winRate =
    profile.ladderWins + profile.ladderLosses > 0
      ? ((profile.ladderWins / (profile.ladderWins + profile.ladderLosses)) * 100).toFixed(1)
      : "N/A"

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex items-start gap-6">
          <Avatar className="h-20 w-20">
            <AvatarImage src={profile.avatar || "/placeholder.svg"} />
            <AvatarFallback>{profile.username[0]}</AvatarFallback>
          </Avatar>

          <div className="flex-1">
            <h1 className="text-3xl font-bold">{profile.username}</h1>
            {profile.bio && <p className="mt-2 text-sm text-muted-foreground">{profile.bio}</p>}

            <div className="mt-4 grid grid-cols-3 gap-4">
              <div>
                <p className="text-xs text-muted-foreground">Wins</p>
                <p className="text-lg font-semibold">{profile.ladderWins}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Win Rate</p>
                <p className="text-lg font-semibold">{winRate}%</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Current Streak</p>
                <p className="text-lg font-semibold">{profile.ladderWinStreak}</p>
              </div>
            </div>
          </div>

          {isCurrentUser && <Button>Edit Profile</Button>}
        </div>
      </Card>

      {trophies.length > 0 && (
        <Card className="p-6">
          <h2 className="text-lg font-semibold">Trophies</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {trophies.map((trophy) => (
              <Badge key={trophy._id} variant="secondary">
                {trophy.title}
              </Badge>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}
