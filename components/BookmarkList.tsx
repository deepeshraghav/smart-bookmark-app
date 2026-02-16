'use client'

import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'

interface Bookmark {
  id: string
  title: string
  url: string
  created_at: string
}

interface BookmarkListProps {
  onRefresh: () => void
  refreshTrigger: number
}

export default function BookmarkList({
  refreshTrigger,
}: BookmarkListProps) {
  const supabase = createClient()
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch bookmarks
  const fetchBookmarks = async () => {
    try {
      setError(null)

      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        setError('You must be logged in')
        return
      }

      try {
        const { data, error: fetchError } = await supabase
          .from('bookmarks')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })

        if (fetchError) {
          console.warn('Database not ready:', fetchError.message)
          setBookmarks([])
        } else {
          setBookmarks(data || [])
        }
      } catch (dbErr) {
        console.warn('Database unavailable, showing empty list')
        setBookmarks([])
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to fetch bookmarks'
      setError(errorMessage)
      console.error('Fetch bookmarks error:', err)
    } finally {
      setIsLoading(false)
    }
  }

  // Initial fetch
  useEffect(() => {
    fetchBookmarks()
  }, [refreshTrigger])

  // Set up real-time subscription
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event: any, session: any) => {
      if (session?.user) {
        // Subscribe to bookmarks changes for current user
        const channel = supabase
          .channel(`bookmarks:${session.user.id}`)
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'bookmarks',
              filter: `user_id=eq.${session.user.id}`,
            },
            (payload: any) => {
              if (payload.eventType === 'INSERT') {
                setBookmarks((prev) => [payload.new as Bookmark, ...prev])
              } else if (payload.eventType === 'DELETE') {
                setBookmarks((prev) =>
                  prev.filter((b) => b.id !== payload.old.id)
                )
              }
            }
          )
          .subscribe()

        return () => {
          supabase.removeChannel(channel)
        }
      }
      return undefined
    })

    return () => {
      subscription?.unsubscribe()
    }
  }, [])

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-8 border border-gray-200 text-center">
        <p className="text-gray-500">Loading bookmarks...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
        <div className="p-4 bg-red-50 text-red-700 rounded-lg text-sm">
          {error}
        </div>
        <button
          onClick={fetchBookmarks}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Try Again
        </button>
      </div>
    )
  }

  if (bookmarks.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-8 border border-gray-200 text-center">
        <p className="text-gray-500 text-lg">📭 No bookmarks yet</p>
        <p className="text-gray-400 text-sm mt-2">
          Add your first bookmark above to get started!
        </p>
      </div>
    )
  }

  const handleDelete = async (id: string) => {
    try {
      const { error: deleteError } = await supabase
        .from('bookmarks')
        .delete()
        .eq('id', id)

      if (deleteError) {
        throw deleteError
      }

      // Update local state immediately for better UX
      setBookmarks((prev) => prev.filter((b) => b.id !== id))
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to delete bookmark'
      console.error('Delete bookmark error:', err)
      alert(errorMessage)
    }
  }

  return (
    <div className="space-y-3">
      {bookmarks.map((bookmark) => (
        <div
          key={bookmark.id}
          className="bg-white rounded-lg shadow-sm p-4 border border-gray-200 hover:shadow-md transition-shadow flex justify-between items-start gap-4"
        >
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 break-words">
              {bookmark.title}
            </h3>
            <a
              href={bookmark.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-600 hover:text-blue-800 break-all"
            >
              {bookmark.url}
            </a>
            <p className="text-xs text-gray-400 mt-2">
              {new Date(bookmark.created_at).toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
          </div>
          <button
            onClick={() => handleDelete(bookmark.id)}
            className="px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors text-sm font-medium whitespace-nowrap"
          >
            Delete
          </button>
        </div>
      ))}
    </div>
  )
}
