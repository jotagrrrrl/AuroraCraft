import { Globe } from 'lucide-react'

export default function CommunityPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6">
      <div className="mx-auto max-w-2xl text-center">
        <h1 className="text-3xl font-bold tracking-tight text-text sm:text-4xl">
          Community Creations
        </h1>
        <p className="mt-4 text-text-muted">
          Discover plugins built by the AuroraCraft community
        </p>
      </div>

      <div className="mt-16 flex flex-col items-center text-center">
        <div className="rounded-2xl bg-primary/10 p-4">
          <Globe className="h-8 w-8 text-primary" />
        </div>
        <h2 className="mt-4 text-lg font-semibold text-text">No community projects yet</h2>
        <p className="mt-1 max-w-sm text-sm text-text-muted">
          Community sharing is coming soon. Once available, you'll be able to browse and share plugins built with AuroraCraft.
        </p>
      </div>
    </div>
  )
}
