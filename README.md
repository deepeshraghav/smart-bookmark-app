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

## Challenges Faced and Solutions

### 1. OAuth redirect worked locally but failed after deployment

**Problem:**
After deploying the app to Vercel, selecting a Google account redirected back to the login page instead of the dashboard.

**Cause:**
The redirect URL in the login function was hardcoded to `http://localhost:3000/auth/callback`, which only works in local development and not in production.

**Solution:**
Updated the redirect URL to use a dynamic origin:

```
redirectTo: `${window.location.origin}/auth/callback`
```

This ensures the correct redirect URL is used automatically in both local and production environments.

---

### 2. Supabase authentication failed due to missing production redirect URLs

**Problem:**
Even after deployment, authentication failed and users were redirected back to the login page.

**Cause:**
The deployed Vercel domain was not added to Supabase Authentication URL Configuration.

**Solution:**
Added the production domain in Supabase under Authentication → URL Configuration:

* Site URL: `https://smart-bookmark-app-gamma-sage.vercel.app`
* Redirect URL: `https://smart-bookmark-app-gamma-sage.vercel.app/auth/callback`

This allowed Supabase to properly authorize and redirect users after login.


## Author

Deepesh Raghav

## License

MIT
