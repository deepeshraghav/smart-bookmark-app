'use client'

import { useSearchParams } from 'next/navigation'
import Link from 'next/link'

export default function AuthErrorPage() {
  const searchParams = useSearchParams()
  const error = searchParams.get('error')

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-lg shadow p-6 max-w-md w-full text-center">
        <h1 className="text-xl font-semibold text-gray-900 mb-2">Authentication Error</h1>
        <p className="text-gray-600 text-sm mb-4">{error || 'Something went wrong during sign in.'}</p>
        <Link href="/" className="text-blue-600 hover:underline">Return to home</Link>
      </div>
    </div>
  )
}
