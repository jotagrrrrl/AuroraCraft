import { Link } from 'react-router'
import { Blocks, ArrowLeft, ShieldAlert } from 'lucide-react'

export default function ForgotPasswordPage() {
  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mb-4 inline-flex rounded-xl bg-primary/10 p-3">
            <Blocks className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-text">Reset your password</h1>
        </div>

        <div className="rounded-lg border border-border bg-surface p-6 text-center">
          <div className="mx-auto mb-4 inline-flex rounded-xl bg-warning/10 p-3">
            <ShieldAlert className="h-6 w-6 text-warning" />
          </div>
          <p className="text-sm font-medium text-text">
            Password reset via email is not available yet
          </p>
          <p className="mt-2 text-sm text-text-muted">
            Please contact a platform administrator to reset your password.
          </p>
          <Link
            to="/login"
            className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-primary hover:text-primary-hover"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to sign in
          </Link>
        </div>
      </div>
    </div>
  )
}
