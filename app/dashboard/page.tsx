'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import BookmarkForm from '@/components/BookmarkForm'
import BookmarkList from '@/components/BookmarkList'
import Navbar from '@/components/Navbar'
import { createClient } from '@/lib/supabase/client'

interface User {
  id: string
  email?: string
  user_metadata?: {
    email?: string
  }
}

export default function DashboardPage() {
  const router = useRouter()
  const supabase = createClient()
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  useEffect(() => {
    // Check if user is authenticated
    const checkAuth = async () => {
      try {
        console.log('📊 Dashboard: Checking authentication...')
        
        // Get the current session
        const { data, error } = await supabase.auth.getSession()
        
        console.log('Session check:', {
          hasSession: !!data?.session,
          error: error?.message,
        })

        if (error) {
          console.error('❌ Session check error:', error.message)
          setIsLoading(false)
          router.push('/')
          return
        }

        if (!data?.session) {
          console.log('⚠️ No active session, redirecting to login')
          setIsLoading(false)
          router.push('/')
          return
        }

        // User is authenticated
        const session = data.session
        console.log('✅ User authenticated:', session.user.email)
        
        setUser({
          id: session.user.id,
          email: session.user.email,
          user_metadata: session.user.user_metadata,
        })
        setIsLoading(false)
      } catch (error) {
        console.error('❌ Auth error:', error)
        setIsLoading(false)
        router.push('/')
      }
    }

    checkAuth()

    // Set up listener for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('🔔 Auth state changed:', event)
      
      if (session && session.user) {
        console.log('✅ Session active:', session.user.email)
        setUser({
          id: session.user.id,
          email: session.user.email,
          user_metadata: session.user.user_metadata,
        })
      } else {
        console.log('❌ Session lost')
        router.push('/')
      }
    })

    return () => {
      subscription?.unsubscribe()
    }
  }, [router])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500">Redirecting...</p>
        </div>
      </div>
    )
  }

  const userEmail = user.email || user.user_metadata?.email || 'User'

  const handleBookmarkAdded = () => {
    setRefreshTrigger((prev) => prev + 1)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar userEmail={userEmail} />

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        <div className="space-y-8">
          <BookmarkForm onBookmarkAdded={handleBookmarkAdded} />
          <BookmarkList
            onRefresh={handleBookmarkAdded}
            refreshTrigger={refreshTrigger}
          />
        </div>
      </main>
    </div>
  )
}
