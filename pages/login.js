import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { setCookie, getCookie } from 'cookies-next'

export default function Login() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(true)

  // Check if already authenticated
  useEffect(() => {
    const auth = getCookie('voozaa_auth')
    if (auth === 'authenticated') {
      window.location.href = '/'
    } else {
      setIsLoading(false)
    }
  }, [])

  const handleSubmit = (e) => {
    e.preventDefault()
    
    // Password check - change 'voozaa2024' to your password
    if (password === 'voozaa2024') {
      setCookie('voozaa_auth', 'authenticated', { maxAge: 60 * 60 * 24 * 30 }) // 30 days
      window.location.href = '/'
    } else {
      setError('Falsches Passwort!')
      setPassword('')
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">🎰</div>
          <div className="text-xl font-semibold text-blue-600">VooZaa Tracking</div>
          <div className="text-gray-500 mt-2">Lädt...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="text-5xl mb-4">🎰</div>
          <h1 className="text-2xl font-bold text-gray-800">VooZaa Tracking</h1>
          <p className="text-gray-500 mt-2">Bitte melde dich an</p>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Passwort
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              placeholder="Passwort eingeben..."
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
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-all"
          >
            Anmelden
          </button>
        </form>
      </div>
    </div>
  )
}
