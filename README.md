# Smart Bookmark App

A full-stack bookmark management application built with Next.js, Supabase, and Google OAuth. Users can securely log in, add bookmarks, and access them from any device with real-time synchronization.

## Live Demo

https://smart-bookmark-app-gamma-sage.vercel.app

## Features

* Google OAuth authentication (Supabase Auth)
* Add and delete bookmarks
* Secure user-specific data using Row Level Security (RLS)
* Real-time database sync using Supabase
* Persistent login sessions
* Fully responsive UI
* Deployed on Vercel

## Tech Stack

* Frontend: Next.js 16 (App Router), TypeScript, Tailwind CSS
* Backend: Supabase (PostgreSQL, Auth, Realtime)
* Authentication: Google OAuth via Supabase
* Deployment: Vercel

## How It Works

1. User signs in with Google
2. Supabase authenticates and creates a session
3. User is redirected to dashboard
4. Bookmarks are stored securely in Supabase database
5. Each user can only access their own bookmarks

## Project Structure

```
app/
 ├── auth/callback        # OAuth callback handler
 ├── dashboard            # Protected dashboard page
 └── page.tsx             # Login page

components/
 ├── BookmarkForm.tsx
 ├── BookmarkList.tsx
 └── Navbar.tsx

lib/
 └── supabase/client.ts   # Supabase client

```

## Environment Variables

Create a `.env.local` file:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Run Locally

```
npm install
npm run dev
```

## Deployment

The app is deployed using Vercel.

Environment variables are configured in the Vercel dashboard.

## Author

Deepesh Raghav

## License

MIT
