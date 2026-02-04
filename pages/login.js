import { useState } from 'react'
import { useRouter } from 'next/router'
import { setCookie } from 'cookies-next'

export default function Login() {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    // Check password against environment variable
    const res = await fetch('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password })
    })

    if (res.ok) {
      setCookie('voozaa_auth', 'authenticated', { maxAge: 60 * 60 * 24 * 30 }) // 30 days
      router.push('/')
    } else {
      setError('Falsches Passwort')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-blue-700">🎰 VooZaa</h1>
          <p className="text-gray-500 mt-2">Device Tracking System</p>
        </div>
        
        <form onSubmit={handleLogin}>
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Passwort
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Passwort eingeben..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
              autoFocus
            />
          </div>
          
          {error && (
            <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}
          
          <button
            type="submit"
            disabled={loading || !password}
            className={`w-full py-3 rounded-lg font-semibold text-lg transition-all ${
              loading || !password
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {loading ? 'Prüfe...' : 'Anmelden'}
          </button>
        </form>
        
        <p className="text-center text-gray-400 text-xs mt-6">
          © {new Date().getFullYear()} VooZaa Tracking
        </p>
      </div>
    </div>
  )
}
