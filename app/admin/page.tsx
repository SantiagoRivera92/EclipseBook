"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Navigation } from "@/components/layout/navigation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Shield, DollarSign, Package, Trophy } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { CreditDistributionForm } from "@/components/admin/credit-distribution-form"
import { PackForm } from "@/components/admin/pack-form"
import { LoadingSpinner } from "@/components/shared/loading-spinner"

export default function AdminPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [packs, setPacks] = useState<any[]>([])
  const [selectedPackId, setSelectedPackId] = useState<string | null>(null)

  // Fetch all packs for editing
  useEffect(() => {
    if (!user) return
    fetch("/api/admin/packs")
      .then((res) => res.json())
      .then((data) => setPacks(Array.isArray(data) ? data : []))
      .catch(() => setPacks([]))
  }, [user])

  useEffect(() => {
    const fetchData = async () => {
      try {
        const userRes = await fetch("/api/user/profile")

        if (userRes.ok) {
          const userData = await userRes.json()
          if (!userData.isAdmin) {
            router.push("/")
            return
          }
          setUser(userData)
        }
      } catch (error) {
        console.error("Failed to fetch data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [router])

  const handlePackSuccess = () => {
    setSelectedPackId(null)
    // Refresh pack list
    fetch("/api/admin/packs")
      .then((res) => res.json())
      .then((data) => setPacks(Array.isArray(data) ? data : []))
  }

  const handleSelectPack = (pack: any) => {
    setSelectedPackId(pack._id)
  }

  const handleNewPack = () => {
    setSelectedPackId(null)
  }

  const handleDeletePack = async () => {
    if (!selectedPackId) return
    if (!window.confirm("Are you sure you want to delete this pack? This cannot be undone.")) return
    const res = await fetch("/api/admin/packs", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ _id: selectedPackId }),
    })
    if (res.ok) {
      toast({ title: "Pack deleted" })
      setPacks(packs.filter((p) => p._id !== selectedPackId))
      handleNewPack()
    } else {
      toast({ title: "Error", description: "Failed to delete pack", variant: "destructive" })
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
        <div className="mb-8 flex items-center gap-3">
          <Shield className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">Admin Panel</h1>
            <p className="text-muted-foreground">Manage EclipseBook</p>
          </div>
        </div>

        <Tabs defaultValue="credits" className="space-y-6">
          <TabsList>
            <TabsTrigger value="credits" className="gap-2">
              <DollarSign className="h-4 w-4" />
              Credits
            </TabsTrigger>
            <TabsTrigger value="packs" className="gap-2">
              <Package className="h-4 w-4" />
              Packs
            </TabsTrigger>
            <TabsTrigger value="tournaments" className="gap-2">
              <Trophy className="h-4 w-4" />
              Tournaments
            </TabsTrigger>
          </TabsList>

          <TabsContent value="credits">
            <div className="grid md:grid-cols-2 gap-6">
              <CreditDistributionForm />
              <CreditDistributionForm toAll />
            </div>
          </TabsContent>

          <TabsContent value="packs">
            <PackForm
              selectedPackId={selectedPackId}
              packs={packs}
              onSuccess={handlePackSuccess}
              onSelectPack={handleSelectPack}
              onNewPack={handleNewPack}
              onDelete={handleDeletePack}
            />
          </TabsContent>

          <TabsContent value="tournaments">
            <div className="text-center text-muted-foreground py-12">Tournaments management coming soon</div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
