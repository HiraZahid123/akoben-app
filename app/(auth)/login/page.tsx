'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })

      if (error) {
        setError(error.message || 'Invalid email or password')
        setLoading(false)
        return
      }

      if (data.session) {
        // Hard navigate so the server middleware picks up the new session cookie
        window.location.href = '/dashboard'
      } else {
        setError('Login succeeded but no session was created. Please try again.')
        setLoading(false)
      }
    } catch (err: any) {
      setError(err?.message || 'Something went wrong. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#f6f1e7] text-[#161311] flex flex-col">
      <header className="border-b border-[#161311]/15">
        <div className="max-w-6xl mx-auto px-6 md:px-10 h-16 flex items-center justify-between">
          <a href="/" className="font-display text-lg tracking-tight">Akoben</a>
          <span className="text-xs uppercase tracking-[0.18em] text-[#161311]/50">Staff Portal</span>
        </div>
      </header>

      <div className="flex-1 flex items-center justify-center px-6 py-16">
        <div className="w-full max-w-sm">
          <p className="text-xs uppercase tracking-[0.25em] text-[#8a5a34] font-medium mb-3">
            Cape Coast, Ghana
          </p>
          <h1 className="font-display text-4xl mb-8">Sign in</h1>

          <form onSubmit={handleLogin} className="space-y-5">
            {error && (
              <div className="text-sm px-4 py-3 border border-red-800/30 bg-red-800/5 text-red-800">
                {error}
              </div>
            )}
            <div>
              <label className="block text-xs uppercase tracking-[0.14em] text-[#161311]/60 mb-1.5">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full bg-transparent border-b border-[#161311]/30 px-1 py-2 text-sm focus:outline-none focus:border-[#161311] transition-colors"
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label className="block text-xs uppercase tracking-[0.14em] text-[#161311]/60 mb-1.5">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full bg-transparent border-b border-[#161311]/30 px-1 py-2 text-sm focus:outline-none focus:border-[#161311] transition-colors"
                placeholder="••••••••"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full border border-[#161311] py-2.5 text-xs uppercase tracking-[0.18em] font-medium hover:bg-[#161311] hover:text-[#f6f1e7] disabled:opacity-50 transition-colors mt-2"
            >
              {loading ? 'Signing in…' : 'Sign In →'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
