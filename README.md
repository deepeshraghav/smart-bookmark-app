# Smart Bookmark App

A production-ready bookmark management application built with **Next.js 14+**, **TypeScript**, **Supabase**, and **Tailwind CSS**. Features real-time synchronization across browser tabs and devices.

## Features

- ✅ **Google OAuth Authentication** - Secure login via Google
- ✅ **Real-time Sync** - Bookmarks update instantly across all tabs/devices
- ✅ **Create Bookmarks** - Add title and URL
- ✅ **Delete Bookmarks** - Remove bookmarks with one click
- ✅ **Responsive Design** - Clean, minimal UI with Tailwind CSS
- ✅ **Row-Level Security** - Users can only access their own bookmarks
- ✅ **Production Ready** - Deployable on Vercel

## Tech Stack

- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth (Google OAuth)
- **Real-time**: Supabase Realtime (WebSocket subscriptions)
- **Styling**: Tailwind CSS
- **Deployment**: Vercel

## Prerequisites

- Node.js 18+ and npm/yarn
- Supabase account (free tier available at https://supabase.com)
- Google OAuth credentials (from Google Cloud Console)
- Vercel account (for deployment)

## Setup Instructions

### 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign up/log in
2. Click **"New Project"**
3. Enter project details:
   - **Name**: smart-bookmark-app
   - **Database Password**: Create a strong password
   - **Region**: Select your region
4. Click **"Create new project"** and wait for provisioning (2-3 minutes)

### 2. Configure Database

1. In Supabase, go to **SQL Editor** in the left sidebar
2. Click **"New Query"**
3. Copy and paste the entire content from `supabase/migrations/001_create_bookmarks.sql`
4. Click **"Run"**
5. Verify the table was created (check **Tables** in the left sidebar)

### 3. Setup Google OAuth Provider

#### In Google Cloud Console:

1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Create a new project (or select existing)
3. Enable the **Google+ API**:
   - Search for "Google+ API"
   - Click **"Enable"**
4. Create OAuth credentials:
   - Go to **Credentials** → **Create Credentials** → **OAuth 2.0 Client ID**
   - Choose **Web application**
   - Under **Authorized redirect URIs**, add:
     - `http://localhost:3000/auth/callback` (local development)
     - `https://your-vercel-domain.vercel.app/auth/callback` (production)
   - Copy the **Client ID** and **Client Secret**

#### In Supabase:

1. Go to **Authentication** → **Providers**
2. Click **Google**
3. Paste your Google **Client ID**
4. Paste your Google **Client Secret**
5. Click **Save**

### 4. Get Supabase Credentials

1. In Supabase, go to **Settings** → **API**
2. Copy:
   - **Project URL** (NEXT_PUBLIC_SUPABASE_URL)
   - **Anon Public** key (NEXT_PUBLIC_SUPABASE_ANON_KEY)

### 5. Configure Environment Variables

1. Clone/create the project locally
2. Create `.env.local` file in the project root:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
   ```
3. Replace with your actual Supabase credentials from Step 4

**Important**: The `NEXT_PUBLIC_` prefix means these are public values. Do NOT include secret keys here.

### 6. Install Dependencies

```bash
npm install
```

### 7. Run Locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
smart-bookmark-app/
├── app/
│   ├── auth/
│   │   └── callback/
│   │       └── route.ts          # OAuth callback handler
│   ├── dashboard/
│   │   └── page.tsx              # Protected dashboard page
│   ├── globals.css               # Global styles
│   ├── layout.tsx                # Root layout
│   └── page.tsx                  # Login page
├── components/
│   ├── Navbar.tsx                # Navigation with logout
│   ├── BookmarkForm.tsx          # Form to add bookmarks
│   └── BookmarkList.tsx          # List with real-time updates
├── lib/
│   └── supabase.ts               # Supabase client
├── supabase/
│   └── migrations/
│       └── 001_create_bookmarks.sql
├── public/
├── .env.example                  # Environment variables template
├── .env.local                    # (Create manually) Actual values
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── next.config.js
└── README.md
```

## How It Works

### Authentication Flow

1. User visits the app → Redirected to login page
2. User clicks "Sign in with Google"
3. Google OAuth redirect → Supabase handles authentication
4. Callback route `/auth/callback` exchanges code for session
5. User redirected to `/dashboard`
6. Session persisted in browser storage

### Real-time Bookmark Updates

1. **BookmarkList.tsx** subscribes to Realtime channel on component mount
2. When a bookmark is added/deleted, Supabase triggers a postgres_changes event
3. Component receives event and updates state instantly
4. No page refresh needed
5. Works across multiple tabs/windows

### Database Security

- **Row Level Security (RLS)** ensures users can only access their own bookmarks
- Policies enforce:
  - SELECT: `auth.uid() = user_id`
  - INSERT: `auth.uid() = user_id`
  - DELETE: `auth.uid() = user_id`
- Even if someone gets the anon key, they cannot access other users' data

## Deployment to Vercel

### 1. Push Code to GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/username/smart-bookmark-app.git
git push -u origin main
```

### 2. Deploy to Vercel

1. Go to [vercel.com](https://vercel.com)
2. Click **"New Project"**
3. Import your GitHub repository
4. In **Environment Variables**:
   - Add `NEXT_PUBLIC_SUPABASE_URL`
   - Add `NEXT_PUBLIC_SUPABASE_ANON_KEY`
5. Click **"Deploy"**

### 3. Update Google OAuth Redirect URIs

1. Get your Vercel deployment URL (format: `https://xxx.vercel.app`)
2. In Google Cloud Console:
   - Go to **Credentials** → Select your OAuth app
   - Add to **Authorized redirect URIs**:
     ```
     https://your-vercel-domain.vercel.app/auth/callback
     ```
3. Click **Save**

### 4. Test Production

Visit your Vercel URL and test:
- Google login
- Add a bookmark
- Delete a bookmark
- Open in multiple tabs and verify real-time sync

## Development Tips

### Local Testing with Real-time

To test real-time sync locally:

1. Open http://localhost:3000 in two browser tabs
2. Log in with the same Google account in both tabs
3. Add a bookmark in tab 1
4. Watch it appear instantly in tab 2 without refresh

### Debugging

Enable Supabase logs in browser console:

```typescript
// Add to lib/supabase.ts
supabase.auth.onAuthStateChange((event, session) => {
  console.log('Auth event:', event)
  console.log('Session:', session)
})
```

### Common Issues

**"Missing environment variables"**
- Check `.env.local` has correct values
- Restart dev server after adding env vars

**"OAuth redirect URI mismatch"**
- Verify redirect URI in Google Cloud Console matches your app URL
- For localhost: `http://localhost:3000/auth/callback`
- For production: `https://yourdomain.vercel.app/auth/callback`

**"Real-time not working"**
- Verify RLS policies are enabled on `bookmarks` table
- Check browser console for WebSocket connection errors
- Ensure `supabase_realtime` publication includes the `bookmarks` table

## Security Considerations

1. ✅ No secrets in frontend (only public ANON_KEY)
2. ✅ RLS protects database at row level
3. ✅ OAuth prevents unauthorized access
4. ✅ Session management via Supabase
5. ✅ CORS configured by Supabase automatically
6. ✅ Type-safe with TypeScript

## Performance

- Real-time updates via WebSocket (no polling)
- Indexed queries on `user_id` and `created_at`
- Efficient component re-renders
- Lazy loading with Next.js

## Code Quality

- TypeScript with strict mode enabled
- No `any` types
- Proper error handling
- Async/await patterns
- ESLint ready

## Support

For issues:

1. Check Supabase logs: **Logs** → **API**
2. Check browser console for errors
3. Verify environment variables
4. Check RLS policies in Supabase UI

## License

MIT

## Next Steps

- Add bookmark editing feature
- Add bookmark categories/tags
- Add search functionality
- Add bookmark sharing
- Add import/export features
- Dark mode toggle
