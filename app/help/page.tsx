"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Navigation } from "@/components/layout/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Package, Layers, ShoppingCart, Trophy, User, Sparkles } from "lucide-react"

export default function HelpPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const userRes = await fetch("/api/user/profile")

        if (!userRes.ok) {
          router.push("/")
          return
        }

        if (userRes.ok) setUser(await userRes.json())
      } catch (error) {
        console.error("Failed to fetch data:", error)
        router.push("/")
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [router])

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

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Help & Guide</h1>
          <p className="text-muted-foreground">Learn how to use EclipseBook and master the game</p>
        </div>

        <div className="space-y-6">
          {/* Getting Started */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                Getting Started
              </CardTitle>
              <CardDescription>The basics of EclipseBook</CardDescription>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="intro">
                  <AccordionTrigger>What is EclipseBook?</AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    EclipseBook is a competitive card gaming platform where you can collect cards, build decks, and
                    compete against other players. Build your collection through card packs, manage your decks, and
                    trade cards with other players through the marketplace.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="credits">
                  <AccordionTrigger>What are Credits?</AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    Credits are the in-game currency used to purchase card packs, buy cards from the marketplace, and
                    participate in competitive matches. You can earn credits by claiming your daily bonus, playing
                    matches, selling cards, or dusting unwanted cards for credits.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="daily">
                  <AccordionTrigger>How do I claim daily credits?</AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    Visit your Profile page and click the "Claim Daily Credits" button. This is available once every 24
                    hours and provides you with credits to help grow your collection.
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>

          {/* Collection & Cards */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5 text-primary" />
                Collection & Card Packs
              </CardTitle>
              <CardDescription>Managing your card collection</CardDescription>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="open-packs">
                  <AccordionTrigger>How do I open card packs?</AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    Navigate to the Packs page from the dashboard. Each pack shows its price and how many cards it
                    contains. You can choose the quantity of packs to open (up to 100 at once) by adjusting the quantity
                    input. Click "Open Pack" if you have enough credits. Opening multiple packs at once will show you
                    all the cards you received, organized by rarity.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="rarities">
                  <AccordionTrigger>What are the card rarities?</AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    Cards come in six rarity levels: Common, Rare, Super Rare, Ultra Rare, Secret Rare, and Ultimate
                    Rare. Higher rarity cards are more powerful and harder to obtain. Each rarity has a different dust
                    value when you choose to dust them for credits.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="view-collection">
                  <AccordionTrigger>How do I view my collection?</AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    Go to the Collection page from the navigation menu. Here you can see all the cards you own. Click on
                    any card to see how many copies you have of each rarity. You can search for specific cards using the
                    search bar at the top of the page.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="dust">
                  <AccordionTrigger>What is dusting?</AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    Dusting is the process of converting unwanted cards into credits. Each card rarity has a different
                    dust value. To dust cards, go to your Collection, click on a card, and select which rarity and how
                    many copies you want to dust. You'll receive credits immediately. This is useful for getting rid of
                    extra copies or cards you don't need.
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>

          {/* Deck Building */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Layers className="h-5 w-5 text-primary" />
                Deck Building
              </CardTitle>
              <CardDescription>Creating and managing your decks</CardDescription>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="create-deck">
                  <AccordionTrigger>How do I create a deck?</AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    Go to the Decks page and click "New Deck" or "Create Deck". You'll be taken to the deck builder
                    where you can add cards from your collection to your Main Deck, Extra Deck, and Side Deck. Give your
                    deck a name and save it when you're ready.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="deck-validation">
                  <AccordionTrigger>What does "Ready" vs "Missing Cards" mean?</AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    A deck marked as "Ready" means you own all the cards needed to use that deck in matches. If a deck
                    shows "Missing Cards", it means you've added cards to the deck list that you don't currently own in
                    your collection. You'll need to acquire those cards before you can use that deck in competitive
                    play.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="edit-deck">
                  <AccordionTrigger>Can I edit or delete decks?</AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    Yes. On the Decks page, each deck has an "Edit" button to modify it and a trash icon to delete it.
                    Deleting a deck only removes the deck list, not the cards from your collection. You can create as
                    many decks as you want.
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>

          {/* Marketplace */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5 text-primary" />
                Marketplace
              </CardTitle>
              <CardDescription>Trading cards with other players</CardDescription>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="marketplace-overview">
                  <AccordionTrigger>What is the Marketplace?</AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    The Marketplace is where players can buy and sell cards with each other. You can find specific cards
                    you need for your decks or sell cards you don't want. The marketplace has two sections: Listings
                    (fixed price) and Auctions (bidding).
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="buy-cards">
                  <AccordionTrigger>How do I buy cards?</AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    Go to the Marketplace page. In the Listings tab, you can see cards available for immediate purchase
                    at fixed prices. Click "Buy Now" if you have enough credits. For Auctions, you can place bids that
                    are higher than the current bid. Use the search bar to find specific cards you're looking for.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="sell-cards">
                  <AccordionTrigger>How do I sell my cards?</AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    From your Collection page, click on a card to view your copies by rarity. Each rarity has a "Sell"
                    button. You can choose to create a fixed-price listing or start an auction. Set your price and
                    expiration time, and other players will be able to purchase or bid on your card.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="auctions">
                  <AccordionTrigger>How do auctions work?</AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    Auctions allow players to bid on cards. Each bid must be higher than the current bid. When the
                    auction expires, the highest bidder wins the card and it's automatically added to their collection.
                    If you're outbid, your credits are returned to you.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="listings-expire">
                  <AccordionTrigger>What happens when a listing expires?</AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    Both listings and auctions have expiration dates. When a listing expires without being sold, the
                    card is automatically returned to the seller's collection. For auctions, if there are no bids, the
                    card is returned. If there are bids, the highest bidder wins.
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>

          {/* Competitive Play */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-primary" />
                Competitive Play
              </CardTitle>
              <CardDescription>Ladder matches and tournaments</CardDescription>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="ladder">
                  <AccordionTrigger>What is the Ladder?</AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    The Ladder is the competitive ranking system where you can play matches against other players to
                    climb the leaderboard. Winning matches increases your rank and can earn you credits and rewards.
                    Select a deck marked as "Ready" to join the ladder queue.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="matchmaking">
                  <AccordionTrigger>How does matchmaking work?</AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    When you queue for a ladder match, the system pairs you with another player of similar skill level.
                    Once matched, you'll compete in a duel using your selected deck. Make sure your deck is marked as
                    "Ready" before joining the queue.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="win-rewards">
                  <AccordionTrigger>What do I get for winning matches?</AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    Winning ladder matches increases your rank on the leaderboard and can earn you credits. Win streaks
                    provide bonus rewards. Your win rate and total wins are tracked in your profile statistics.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="tournaments">
                  <AccordionTrigger>Are there tournaments?</AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    Yes, tournaments are available through the Elimination mode. These are bracket-style competitions
                    where winning earns you trophies that are displayed on your profile. Check back regularly for new
                    tournament opportunities.
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>

          {/* Profile & Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                Profile & Statistics
              </CardTitle>
              <CardDescription>Track your progress</CardDescription>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="profile">
                  <AccordionTrigger>What's on my profile?</AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    Your profile shows your username, avatar, member since date, and current credits. It also displays
                    statistics including your win streak, total wins, total matches played, and win rate percentage. You
                    can view your tournament trophies earned through gameplay.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="stats">
                  <AccordionTrigger>How are statistics calculated?</AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    Your win rate is calculated as your total wins divided by total matches played. Win streak tracks
                    consecutive victories. All competitive matches contribute to your statistics. You can view detailed
                    stats including total cards owned and total decks created.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="trophies">
                  <AccordionTrigger>How do I earn trophies?</AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    Trophies are earned by winning tournaments in Elimination mode. Each tournament victory adds a
                    trophy to your profile with the tournament name and date won. Trophies are permanent achievements
                    that showcase your competitive success.
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>

          {/* Tips & Strategy */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                Tips & Strategy
              </CardTitle>
              <CardDescription>Helpful advice for new players</CardDescription>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="start-tips">
                  <AccordionTrigger>Tips for getting started</AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    Start by claiming your daily credits regularly. Open a few packs to build an initial collection.
                    Create a simple deck with the cards you have and try a few ladder matches to get a feel for the
                    game. Don't dust cards immediately - you might need them for decks later.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="collection-tips">
                  <AccordionTrigger>How should I manage my collection?</AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    Keep at least one copy of each card before dusting extras. Focus on collecting cards for specific
                    deck strategies rather than trying to get everything. Use the marketplace to find specific cards you
                    need instead of relying only on packs. Dust only cards you're certain you won't use.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="credit-tips">
                  <AccordionTrigger>Best ways to earn credits</AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    Claim your daily credits every day - this is your most reliable source. Win ladder matches to earn
                    credits and build win streaks for bonuses. Sell valuable cards you don't need on the marketplace.
                    Dust extra copies of cards you already have three or more of.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="deck-tips">
                  <AccordionTrigger>Deck building tips</AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    Start with a focused strategy - don't try to include too many different card types. Build your deck
                    around cards you actually own so it's marked as "Ready". Test your deck in ladder matches and adjust
                    based on what works. Save multiple deck versions to try different strategies.
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}