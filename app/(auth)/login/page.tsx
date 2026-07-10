'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { ArrowRight } from 'lucide-react'

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
    <div className="min-h-screen bg-gray-50 text-gray-900 flex flex-col">
      <header className="bg-white border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <a href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center font-bold text-sm text-white">A</div>
            <div>
              <div className="font-semibold text-sm leading-tight text-gray-900">Akoben Rentals</div>
              <div className="text-[10px] text-gray-400 leading-tight">Cape Coast, Ghana</div>
            </div>
          </a>
          <span className="text-xs text-gray-400 font-medium">Staff Portal</span>
        </div>
      </header>

      <div className="flex-1 flex items-center justify-center px-6 py-16">
        <div className="w-full max-w-sm bg-white rounded-xl border border-gray-200 p-8">
          <p className="text-xs uppercase tracking-wide text-blue-600 font-semibold mb-2">
            Cape Coast, Ghana
          </p>
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Sign in</h1>

          <form onSubmit={handleLogin} className="space-y-4">
            {error && (
              <div className="text-sm px-4 py-3 rounded-lg border border-red-200 bg-red-50 text-red-700">
                {error}
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="••••••••"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full inline-flex items-center justify-center gap-1.5 bg-blue-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors mt-2"
            >
              {loading ? 'Signing in…' : <>Sign In <ArrowRight size={15} /></>}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
