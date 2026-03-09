import { Cpu } from 'lucide-react'

export default function AdminAIRuntimePage() {
  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight text-text">AI Runtime</h1>
      <p className="mt-1 text-sm text-text-muted">Configure AI model settings and runtime parameters</p>

      <div className="mt-6 rounded-xl border border-border bg-surface p-6">
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <div className="rounded-2xl bg-primary/10 p-4">
            <Cpu className="h-8 w-8 text-primary" />
          </div>
          <h2 className="mt-4 text-lg font-semibold text-text">AI Runtime not configured</h2>
          <p className="mt-1 max-w-sm text-sm text-text-muted">
            Model configuration will be available once an AI bridge (OpenCode, Claude Code, or a local model) is connected to the platform.
          </p>
          <div className="mt-4 inline-flex items-center gap-2 rounded-lg border border-border bg-background px-4 py-2">
            <div className="h-2 w-2 rounded-full bg-warning" />
            <span className="text-sm text-text-muted">Awaiting bridge connection</span>
          </div>
        </div>
      </div>
    </div>
  )
}
