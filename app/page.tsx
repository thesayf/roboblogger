import Link from 'next/link'
import { SignInButton, SignUpButton } from '@clerk/nextjs'
import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'

export default async function HomePage() {
  const { userId } = await auth()

  // Redirect authenticated users to the app
  if (userId) {
    redirect('/app')
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Navigation */}
      <nav className="border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="text-2xl text-gray-900" style={{ fontFamily: "Lora, Georgia, serif" }}>
            Daybook
          </Link>
          <div className="flex gap-6">
            <Link href="/about" className="text-sm font-mono text-gray-600 hover:text-gray-900">
              About
            </Link>
            <Link href="/pricing" className="text-sm font-mono text-gray-600 hover:text-gray-900">
              Pricing
            </Link>
            <Link href="/blog" className="text-sm font-mono text-gray-600 hover:text-gray-900">
              Blog
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section - Centered */}
      <section className="flex-1 flex items-center justify-center px-6">
        <div className="max-w-4xl text-center">
          <h1 className="text-7xl text-gray-900 mb-6" style={{ fontFamily: "Lora, Georgia, serif" }}>
            Daybook
          </h1>
          <p className="text-2xl text-gray-700 mb-12 leading-relaxed" style={{ fontFamily: "Lora, Georgia, serif" }}>
            Plan your day in plain text
          </p>

          {/* CTA with Clerk Sign Up Modal */}
          <div className="space-y-4 mb-8">
            <SignUpButton mode="modal">
              <button className="inline-block px-8 py-4 bg-gray-900 text-white font-mono text-lg hover:bg-gray-800 transition-colors cursor-pointer">
                Get Started
              </button>
            </SignUpButton>
          </div>

          <div className="space-y-3">
            <p className="text-sm text-gray-600" style={{ fontFamily: "Inter, monospace" }}>
              Already have an account?{' '}
              <SignInButton mode="modal">
                <button className="underline hover:text-gray-900 cursor-pointer">
                  Sign in
                </button>
              </SignInButton>
            </p>
            <p className="text-sm text-gray-500 font-mono">
              No credit card required • Free to start
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-8 text-center text-sm text-gray-500 font-mono">
          © 2025 Daybook. Fast, keyboard-first productivity.
        </div>
      </footer>
    </div>
  )
}
