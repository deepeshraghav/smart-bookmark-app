# Architecture & API Documentation

## System Architecture

```
┌─────────────┐
│   Browser   │
│  (Next.js)  │
└──────┬──────┘
       │
       ├─────────────────────┐
       │                     │
   ┌───▼────┐           ┌────▼─────┐
   │  Auth  │           │  Realtime│
   │Callback│           │WebSocket │
   └────────┘           └──────────┘
       │                     │
       │    ┌────────────────┘
       │    │
       └────┼─────────────────────────┐
            │                         │
       ┌────▼──────────────────────┐  │
       │   Supabase Auth           │  │
       │  (Google OAuth Provider)  │  │
       └────────────────────────────┘  │
                                       │
                                   ┌───▼──────────────┐
                                   │  Supabase        │
                                   │  PostgreSQL DB   │
                                   │  + RLS Policies  │
                                   └──────────────────┘
```

## Component Hierarchy

```
RootLayout
├── LoginPage (app/page.tsx)
│   └── "Sign in with Google" button
│
└── DashboardPage (app/dashboard/page.tsx)
    ├── Navbar
    │   └── Logout button
    │
    ├── BookmarkForm
    │   └── Input: title, url
    │   └── Event: onBookmarkAdded
    │
    └── BookmarkList
        └── Real-time subscription
        └── Display bookmarks
        └── Delete buttons
```

## Data Flow

### Adding a Bookmark

```
User fills form
    ↓
Click "Add Bookmark"
    ↓
BookmarkForm.handleSubmit()
    ↓
supabase.from('bookmarks').insert({
  user_id: session.user.id,
  title: input,
  url: input
})
    ↓
Supabase RLS checks: auth.uid() = user_id ✓
    ↓
INSERT successful
    ↓
Realtime broadcasts: postgres_changes event
    ↓
BookmarkList receives event
    ↓
setBookmarks([newBookmark, ...prev])
    ↓
UI updates instantly (all tabs)
```

### Deleting a Bookmark

```
User clicks "Delete" button
    ↓
BookmarkList.handleDelete(id)
    ↓
supabase.from('bookmarks').delete().eq('id', id)
    ↓
Supabase RLS checks: auth.uid() = user_id ✓
    ↓
DELETE successful
    ↓
Realtime broadcasts: postgres_changes event
    ↓
BookmarkList receives event
    ↓
setBookmarks(prev => prev.filter(b => b.id !== id))
    ↓
UI updates instantly (all tabs)
```

### Real-time Synchronization

```
BookmarkList mounts
    ↓
useEffect with auth state listener
    ↓
Subscribe to channel: `bookmarks:${user.id}`
    ↓
Listen for postgres_changes events:
  - schema: 'public'
  - table: 'bookmarks'
  - filter: user_id = current user
    ↓
When INSERT event received:
  setBookmarks(prev => [newBookmark, ...prev])
    ↓
When DELETE event received:
  setBookmarks(prev => prev.filter(b => b.id !== event.id))
    ↓
Component cleanup: unsubscribe from channel
```

## Database Schema

### bookmarks Table

```sql
CREATE TABLE bookmarks (
  id UUID PRIMARY KEY,                    -- Unique identifier
  user_id UUID REFERENCES auth.users,     -- Owner of bookmark
  title TEXT NOT NULL,                    -- Bookmark title
  url TEXT NOT NULL,                      -- Bookmark URL
  created_at TIMESTAMP DEFAULT now()      -- Created timestamp
);
```

### Indexes

```sql
-- Fast user lookups
CREATE INDEX bookmarks_user_id_idx ON bookmarks(user_id);

-- Fast ordering by date
CREATE INDEX bookmarks_created_at_idx ON bookmarks(created_at DESC);
```

### Row Level Security Policies

```sql
-- SELECT: User can view only their own
SELECT: auth.uid() = user_id

-- INSERT: User can create only their own
INSERT: auth.uid() = user_id

-- DELETE: User can delete only their own
DELETE: auth.uid() = user_id

-- UPDATE: Not enabled (feature not used)
```

## API Routes

### GET /auth/callback

**Purpose**: OAuth callback handler

**Request**: `GET /auth/callback?code=xxx`

**Response**: 
- Success: Redirect to `/dashboard`
- Failure: Redirect to `/auth-error?error=xxx`

**Logic**:
1. Extract authorization `code` from query
2. Call `exchangeCodeForSession(code)`
3. Supabase stores session in browser
4. Redirect to dashboard

---

### POST /dashboard (implicit)

**Purpose**: Dashboard page (client-side protected)

**Auth Check**:
```typescript
const { data: { session } } = await supabase.auth.getSession()
if (!session?.user) router.push('/') // Redirect to login
```

---

## Supabase Operations

### Authentication

```typescript
// Sign in with Google
await supabase.auth.signInWithOAuth({
  provider: 'google',
  options: {
    redirectTo: `${window.location.origin}/auth/callback`
  }
})

// Get current session
const { data: { session } } = await supabase.auth.getSession()

// Get current user
const { data: { user } } = await supabase.auth.getUser()

// Sign out
await supabase.auth.signOut()

// Listen to auth changes
supabase.auth.onAuthStateChange((event, session) => {
  // event: 'INITIAL_SESSION', 'SIGNED_IN', 'SIGNED_OUT', etc
})
```

### Bookmarks Operations

```typescript
// Get all user bookmarks
const { data, error } = await supabase
  .from('bookmarks')
  .select('*')
  .eq('user_id', userId)
  .order('created_at', { ascending: false })

// Add bookmark
const { error } = await supabase
  .from('bookmarks')
  .insert([{
    user_id: userId,
    title: 'My Title',
    url: 'https://example.com'
  }])

// Delete bookmark
const { error } = await supabase
  .from('bookmarks')
  .delete()
  .eq('id', bookmarkId)
```

### Real-time Subscriptions

```typescript
const channel = supabase
  .channel(`bookmarks:${userId}`)
  .on(
    'postgres_changes',
    {
      event: '*',
      schema: 'public',
      table: 'bookmarks',
      filter: `user_id=eq.${userId}`
    },
    (payload) => {
      // payload.eventType: 'INSERT', 'DELETE', 'UPDATE'
      // payload.new: new record
      // payload.old: old record
    }
  )
  .subscribe()

// Cleanup
supabase.removeChannel(channel)
```

## File Structure & Responsibilities

### `/app/layout.tsx`
- Root layout wrapper
- Metadata configuration
- CSS imports

### `/app/page.tsx`
- Login page
- Google OAuth button
- Redirect if already logged in

### `/app/auth/callback/route.ts`
- Handle OAuth callback
- Exchange code for session
- Redirect logic

### `/app/dashboard/page.tsx`
- Protected page (auth check)
- User state management
- Renders components

### `/components/Navbar.tsx`
- Display user email
- Logout button

### `/components/BookmarkForm.tsx`
- Input form for new bookmark
- Validation
- Insert to database

### `/components/BookmarkList.tsx`
- Fetch bookmarks
- Real-time subscription
- Delete functionality
- Empty state

### `/lib/supabase.ts`
- Single Supabase client instance
- Environment variable validation
- Client configuration

## Security Model

### Authentication
- ✅ Google OAuth handled by Supabase
- ✅ Session stored securely in browser
- ✅ Auto-refresh tokens enabled

### Authorization
- ✅ Row Level Security enforced on database
- ✅ Users can only see their own bookmarks
- ✅ Cannot bypass RLS via API key

### Data Protection
- ✅ Credentials never sent from frontend
- ✅ Only public ANON_KEY used in frontend
- ✅ HTTPS enforced (Vercel)
- ✅ CORS handled by Supabase

## Performance Considerations

### Database
- Indexes on `user_id` and `created_at` for fast queries
- RLS filtering happens at database level
- Pagination not needed (users rarely have 1000+ bookmarks)

### Real-time
- WebSocket connection for instant updates
- No polling = minimal server load
- Event-driven architecture

### Frontend
- Client-side rendering for interactivity
- Minimal state updates (only affected bookmark)
- Tailwind for CSS (no extra downloads)

## Error Handling

### Auth Errors
- Invalid OAuth code → Redirect to error page
- Session expired → Redirect to login
- Unauthorized action → Show user message

### Data Errors
- Database constraint violated → Show error message
- Network error → Retry logic
- RLS violation → User can't see data

### User Feedback
- Loading states on buttons
- Error messages in alert/banner
- Success implicit (UI updates)

## Testing Checklist

### Local Testing
- [ ] Google login works
- [ ] Bookmark added successfully
- [ ] Bookmark appears in list
- [ ] Bookmark deleted successfully
- [ ] Real-time sync works (2 tabs)
- [ ] Logout works
- [ ] Session persists on refresh

### Production Testing
- [ ] Deploy to Vercel succeeds
- [ ] Google login from production domain works
- [ ] OAuth callback succeeds
- [ ] Bookmarks save to production database
- [ ] Real-time works in production
- [ ] CORS not blocking requests

## Monitoring

### Supabase Logs
- Path: **Logs** → **API**
- View all API calls, errors, performance

### Network Tab (Browser DevTools)
- Check WebSocket connections to Supabase
- Monitor auth requests

### Browser Console
- Check for JavaScript errors
- View auth state changes

## Deployment Checklist

Before deploying to Vercel:

- [ ] Environment variables configured
- [ ] Google OAuth credentials created
- [ ] Supabase project created
- [ ] Database table created
- [ ] RLS policies enabled
- [ ] Google provider configured in Supabase
- [ ] Code pushed to GitHub
- [ ] Local testing passed

Before using in production:

- [ ] Vercel deployment successful
- [ ] Google OAuth redirect URI updated
- [ ] Production OAuth tested
- [ ] Real-time sync tested
- [ ] Error handling tested
- [ ] HTTPS verified
- [ ] Backups configured (Supabase)
