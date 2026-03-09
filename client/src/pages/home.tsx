import { Link } from 'react-router'
import { Blocks, Sparkles, Shield, Puzzle, Code2, FolderKanban, ArrowRight } from 'lucide-react'

const features = [
  {
    icon: Sparkles,
    title: 'AI Chat Workspace',
    description: 'A built-in chat workspace for planning your plugins, ready to connect to AI providers for code generation.',
  },
  {
    icon: FolderKanban,
    title: 'Project Management',
    description: 'Create, organize, and manage your plugin projects with a clean dashboard, search, and sorting.',
  },
  {
    icon: Blocks,
    title: 'Multi-Platform Support',
    description: 'Configure projects for Paper, Spigot, Bukkit, Velocity, and more. Choose Java or Kotlin with Maven or Gradle.',
  },
  {
    icon: Code2,
    title: 'Developer-First UI',
    description: 'A clean, dark-mode interface designed for developers. Minimal clutter, fast interactions, professional aesthetics.',
  },
  {
    icon: Shield,
    title: 'Secure Authentication',
    description: 'Industry-standard security with Argon2 password hashing, session-based auth, and role-based access control.',
  },
  {
    icon: Puzzle,
    title: 'Extensible Architecture',
    description: 'Built with a modular bridge system designed for AI code generation, compilation, and third-party integrations.',
  },
]

export default function HomePage() {
  return (
    <div>
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent" />
        <div className="relative mx-auto max-w-7xl px-4 py-24 sm:px-6 sm:py-32 lg:py-40">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-surface px-4 py-1.5 text-sm text-text-muted">
              <Sparkles className="h-4 w-4 text-primary" />
              AI-Powered Minecraft Plugin Development
            </div>
            <h1 className="text-4xl font-bold tracking-tight text-text sm:text-5xl lg:text-6xl">
              Build Minecraft Plugins{' '}
              <span className="bg-gradient-to-r from-primary to-blue-400 bg-clip-text text-transparent">
                with AI
              </span>
            </h1>
            <p className="mt-6 text-lg text-text-muted sm:text-xl">
              AuroraCraft is a modern platform for creating Minecraft plugins.
              Manage your projects, configure your stack, and chat with an AI assistant to plan and develop your plugins.
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link
                to="/register"
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-hover"
              >
                Start Building
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/docs"
                className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface px-6 py-3 text-sm font-medium text-text transition-colors hover:bg-surface-hover"
              >
                Read the Docs
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="border-t border-border">
        <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-text">
              A solid foundation for plugin development
            </h2>
            <p className="mt-4 text-text-muted">
              Project management, AI assistance, and a modern workspace — with more features on the way.
            </p>
          </div>
          <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="group rounded-xl border border-border bg-surface p-6 transition-colors hover:border-border-bright hover:bg-surface-hover"
              >
                <div className="mb-4 inline-flex rounded-lg bg-primary/10 p-2.5">
                  <feature.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="text-base font-semibold text-text">{feature.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-text-muted">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="border-t border-border">
        <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6">
          <div className="rounded-2xl border border-border bg-gradient-to-br from-surface to-surface-hover p-12 text-center">
            <h2 className="text-3xl font-bold tracking-tight text-text">
              Ready to get started?
            </h2>
            <p className="mt-4 text-text-muted">
              Create a free account and start managing your Minecraft plugin projects.
            </p>
            <Link
              to="/register"
              className="mt-8 inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-hover"
            >
              Create Your Account
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
