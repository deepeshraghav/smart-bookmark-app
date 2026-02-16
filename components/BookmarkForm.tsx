'use client'

import { createClient } from '@/lib/supabase/client'
import { useState } from 'react'

interface BookmarkFormProps {
  onBookmarkAdded: () => void
}

export default function BookmarkForm({ onBookmarkAdded }: BookmarkFormProps) {
  const supabase = createClient()
  const [title, setTitle] = useState('')
  const [url, setUrl] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!title.trim() || !url.trim()) {
      setError('Please fill in both fields')
      return
    }

    try {
      setIsLoading(true)

      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        setError('You must be logged in to add bookmarks')
        return
      }

      const { error: insertError } = await supabase
        .from('bookmarks')
        .insert([
          {
            user_id: user.id,
            title: title.trim(),
            url: url.trim(),
          },
        ])

      if (insertError) {
        throw insertError
      }

      setTitle('')
      setUrl('')
      onBookmarkAdded()
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to add bookmark'
      setError(errorMessage)
      console.error('Add bookmark error:', err)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white rounded-lg shadow-sm p-6 border border-gray-200"
    >
      <div className="space-y-4">
        {error && (
          <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm">
            {error}
          </div>
        )}

        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
            Title
          </label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., React Docs"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isLoading}
          />
        </div>

        <div>
          <label htmlFor="url" className="block text-sm font-medium text-gray-700 mb-1">
            URL
          </label>
          <input
            id="url"
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isLoading}
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors font-medium"
        >
          {isLoading ? 'Adding...' : 'Add Bookmark'}
        </button>
      </div>
    </form>
  )
}
