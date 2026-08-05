import { Bike, Leaf, MapPinned } from 'lucide-react'
import { Link } from 'react-router'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

const features = [
  {
    title: 'Fast Delivery',
    description: 'Hot meals at your door with optimized courier routes.',
    icon: Bike,
  },
  {
    title: 'Fresh Ingredients',
    description: 'Partner kitchens focused on quality, flavor, and care.',
    icon: Leaf,
  },
  {
    title: 'Live Tracking',
    description: 'Follow every order from kitchen prep to delivery.',
    icon: MapPinned,
  },
]

export function HomePage() {
  return (
    <div className="space-y-14">
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-orange-50 via-white to-emerald-50 px-6 py-14 dark:from-slate-900 dark:via-slate-950 dark:to-emerald-950 sm:px-10">
        <div className="relative z-10 max-w-2xl space-y-5">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">FoodOrder</p>
          <h1 className="text-4xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-5xl">
            Delicious Food Delivered Fast
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-300">
            Fresh meals from your favorite restaurants.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link to="/menu">Browse Menu</Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link to="/track">Track Order</Link>
            </Button>
          </div>
          <p className="text-sm text-slate-500">Delicious. Fast. Delivered.</p>
        </div>
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-10 bottom-0 h-56 w-56 rounded-full bg-primary/15 blur-2xl sm:h-72 sm:w-72"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute right-8 top-8 h-40 w-40 rounded-full bg-accent/20 blur-xl"
        />
      </section>

      <section className="grid gap-5 md:grid-cols-3">
        {features.map((feature) => (
          <Card key={feature.title} className="transition hover:-translate-y-0.5 hover:shadow-md">
            <CardHeader>
              <feature.icon className="mb-2 h-8 w-8 text-primary" aria-hidden="true" />
              <CardTitle>{feature.title}</CardTitle>
              <CardDescription>{feature.description}</CardDescription>
            </CardHeader>
            <CardContent />
          </Card>
        ))}
      </section>
    </div>
  )
}
