import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { getCookie, deleteCookie } from 'cookies-next'
import dynamic from 'next/dynamic'

const VooZaaTracker = dynamic(() => import('../components/VooZaaTracker'), {
  ssr: false,
  loading: () => (
    <div style={{minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f0f4f8'}}>
      <div style={{textAlign: 'center'}}>
        <div style={{fontSize: '3rem', marginBottom: '1rem'}}>🎰</div>
        <div style={{fontSize: '1.5rem', fontWeight: 'bold', color: '#2563eb'}}>VooZaa Tracking</div>
        <div style={{color: '#6b7280', marginTop: '0.5rem'}}>Lädt...</div>
      </div>
    </div>
  )
})

export default function Home() {
  const router = useRouter()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const auth = getCookie('voozaa_auth')
    if (auth === 'authenticated') {
      setIsAuthenticated(true)
    } else {
      router.push('/login')
    }
    setIsLoading(false)
  }, [router])

  const handleLogout = () => {
    deleteCookie('voozaa_auth')
    router.push('/login')
  }

  if (isLoading) {
    return (
      <div style={{minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f0f4f8'}}>
        <div style={{textAlign: 'center'}}>
          <div style={{fontSize: '3rem', marginBottom: '1rem'}}>🎰</div>
          <div style={{fontSize: '1.5rem', fontWeight: 'bold', color: '#2563eb'}}>VooZaa Tracking</div>
          <div style={{color: '#6b7280', marginTop: '0.5rem'}}>Prüfe Anmeldung...</div>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  return <VooZaaTracker onLogout={handleLogout} />
}
