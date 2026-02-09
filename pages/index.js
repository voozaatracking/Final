import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { getCookie, deleteCookie } from 'cookies-next'
import dynamic from 'next/dynamic'

const VooZaaTracker = dynamic(() => import('../components/VooZaaTracker'), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
      <div className="text-center">
        <div className="text-4xl mb-4">🎰</div>
        <div className="text-xl font-semibold text-blue-600">VooZaa Tracking</div>
        <div className="text-gray-500 mt-2">Lädt...</div>
      </div>
    </div>
  )
})

export default function Home() {
  const router = useRouter()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const checkAuth = () => {
      const auth = getCookie('voozaa_auth')
      if (auth === 'authenticated') {
        setIsAuthenticated(true)
        setIsLoading(false)
      } else {
        setIsLoading(false)
        window.location.href = '/login'
      }
    }
    
    // Delay to prevent rapid redirects
    const timer = setTimeout(checkAuth, 100)
    return () => clearTimeout(timer)
  }, [])

  const handleLogout = () => {
    deleteCookie('voozaa_auth')
    window.location.href = '/login'
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">🎰</div>
          <div className="text-xl font-semibold text-blue-600">VooZaa Tracking</div>
          <div className="text-gray-500 mt-2">Prüfe Anmeldung...</div>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">🎰</div>
          <div className="text-xl font-semibold text-blue-600">VooZaa Tracking</div>
          <div className="text-gray-500 mt-2">Weiterleitung zum Login...</div>
        </div>
      </div>
    )
  }

  return <VooZaaTracker onLogout={handleLogout} />
}
