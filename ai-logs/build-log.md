# AI Development Log — GoViral: AI Content Virality Analyzer

> Tool: Claude (Anthropic) + Gemini 2.0 Flash (via OpenRouter)
> Stack: Next.js 16 · React 19 · TypeScript · Tailwind CSS v4 · Supabase · shadcn/ui
> Date: May 2026

---

## Session 1 — Architecture & Model Selection

### Prompt

I'm building a web app for the 8x Engineer assignment. The reference is babiceva.ai (AI video/image generation tool). I want to pivot the concept — instead of generating content, I'll build an AI-powered **virality analyzer** that lets creators upload a video or image and get a detailed breakdown of how likely it is to go viral. What's the right AI model for multimodal video+image analysis, and what architecture should I use with the starter template?

### Response

For multimodal analysis of both video and images, **Google Gemini 2.0 Flash** is the strongest choice. It supports native video and image input — meaning you can send the raw file as base64 and get the model to analyze visual composition, pacing, text overlays, and emotional tone in a single API call. GPT-4o has vision but weaker video support; Claude is excellent for text reasoning but doesn't process raw video.

Architecture recommendation, building on the 8x starter template:

- **Frontend**: Next.js 16 with React 19 (already in the starter template) — use App Router and server components where appropriate
- **AI layer**: Gemini 2.0 Flash via **server-side API route** (`/api/analyze`) — **never expose the API key to the client**
- **Auth + data**: Supabase (already configured in the starter) for authentication and subscription tier storage
- **Design system**: Tailwind CSS v4 with shadcn/ui components — extend with a custom dark-mode color palette

Key architectural decision: The AI call must happen server-side via a Next.js Route Handler, not from the browser. This keeps the API key secure, lets you add rate limiting later, and gives you proper error handling with typed responses.

---

## Session 2 — Designing the Analysis Schema

### Prompt

I need a structured JSON schema for what the AI should return. It needs to power: an animated score ring, breakdown bars for sub-scores, hook analysis with a rating badge, caption optimization with hashtag recommendations, transcript/audio analysis, a visual timeline of key moments, and an action plan. Make it strict so I can type it in TypeScript and parse it reliably.

### Response

Here's the schema — designed to map 1:1 to UI components:

```typescript
type AnalysisResult = {
  score: number                    // 0-100, powers the animated SVG ring
  breakdown: {
    hook: number                   // First 3 seconds effectiveness
    pacing: number                 // Rhythm and editing flow
    visuals: number                // Composition, lighting, quality
    emotionalAppeal: number        // Audience connection factor
  }
  hookAnalysis: {
    rating: string                 // "Weak" | "Moderate" | "Strong" | "Exceptional"
    feedback: string               // 2-3 sentence detailed analysis
  }
  actionPlan: string[]             // 3-4 specific, actionable improvement steps
  captionSuggestions: {
    hook: string                   // Opening line to grab attention
    body: string                   // Supporting caption text
    hashtags: string[]             // 3-5 recommended hashtags
  }
  transcriptAnalysis: {
    strengths: string[]            // What's working well
    improvements: string[]         // Specific areas to fix
  }
  timeline: {
    timestamp: string              // e.g. "0:01", "0:05"
    description: string            // What happens at this moment
    impact: "positive" | "negative" // Visual indicator for the timeline
  }[]
}
```

I chose 4 breakdown dimensions instead of 6 (as in most competitor tools) because it keeps the UI scannable and each dimension maps to a concrete, actionable insight. The `timeline` array is unique — most virality tools don't give frame-by-frame feedback, so this becomes a differentiator.

The system prompt for Gemini includes: *"Return ONLY a raw JSON object. No markdown, no code fences, no explanation. Your entire response must be valid JSON parseable by JSON.parse()."*

---

## Session 3 — Server-Side API Route (Security Architecture)

### Prompt

How should I structure the `/api/analyze` route? I need it to accept a base64-encoded file from the client, forward it to the AI model, parse the response, and return typed JSON. The API key must stay server-side. Also, what error cases do I need to handle?

### Response

Built as a Next.js Route Handler at `app/api/analyze/route.ts`:

```typescript
// Key design decisions in the route:

// 1. API key from environment — never exposed to client
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY

// 2. Request validation before calling the AI
if (!base64 || !mimeType) {
  return NextResponse.json({ error: "Missing base64 or mimeType" }, { status: 400 })
}

// 3. Structured error handling for specific failure modes:
//    - 429: Rate limiting → surface user-friendly message
//    - 413: Payload too large → tell user to compress
//    - 502: AI provider error → extract error message from response
//    - Parse failure → fallback error state

// 4. JSON sanitization — defense against markdown fence leakage:
let clean = rawText.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/m, "").trim()
const start = clean.indexOf("{")
const end = clean.lastIndexOf("}")
if (start !== -1 && end !== -1) {
  clean = clean.slice(start, end + 1)
}
```

I initially used the Gemini API directly, but switched to **OpenRouter** (`google/gemini-2.0-flash-001`) as a proxy. Reason: OpenRouter provides a unified OpenAI-compatible interface, automatic retry logic, and better rate limit handling. The model is identical — Gemini 2.0 Flash — but the transport is more robust for a demo environment.

The route also uses `response_format: { type: "json_object" }` to enforce structured output at the API level, not just in the prompt.

---

## Session 4 — Client-Side Image Optimization

### Prompt

Large image files are hitting the Gemini payload limit and causing 413 errors. How do I resize images client-side before sending them to the API, without adding a dependency?

### Response

Built a canvas-based resize utility that runs in the browser before upload:

```typescript
function resizeImage(file: File, maxDim: number = 1200): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement("canvas")
        let width = img.width, height = img.height
        
        // Proportional scaling — maintain aspect ratio
        if (width > height) {
          if (width > maxDim) { height *= maxDim / width; width = maxDim }
        } else {
          if (height > maxDim) { width *= maxDim / height; height = maxDim }
        }
        
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext("2d")
        ctx?.drawImage(img, 0, 0, width, height)
        resolve(canvas.toDataURL("image/jpeg", 0.85).split(",")[1])
      }
      img.src = e.target?.result as string
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}
```

This runs only for images (not video) and reduces a 5MB iPhone photo to ~200KB at 1200px max dimension with 85% JPEG quality. The tradeoff is some quality loss, but Gemini doesn't need 4K resolution to analyze composition and text overlays.

For video files, `toBase64()` sends them raw — the 10MB client-side limit (enforced in `handleFile`) prevents oversized payloads from reaching the API.

---

## Session 5 — Animated Score Ring (SVG + requestAnimationFrame)

### Prompt

I need an animated score visualization — a circular ring that fills to the score value with a number that counts up. It should feel premium, not just a static number. The color should change based on score thresholds.

### Response

Built a `ScoreRing` component using raw SVG with `requestAnimationFrame` for the count-up animation:

```typescript
function ScoreRing({ score }: { score: number }) {
  const [displayScore, setDisplayScore] = useState(0)
  
  useEffect(() => {
    const duration = 1500  // 1.5 second animation
    const startTime = performance.now()

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime
      const progress = Math.min(elapsed / duration, 1)
      const easeOut = 1 - Math.pow(1 - progress, 3)  // Cubic ease-out
      setDisplayScore(Math.floor(score * easeOut))

      if (progress < 1) requestAnimationFrame(animate)
    }

    requestAnimationFrame(animate)
  }, [score])
  
  // SVG uses strokeDasharray/strokeDashoffset for the ring fill
  // + SVG filter for a subtle glow effect on the progress arc
}
```

Design decisions:
- **Cubic ease-out** (`1 - Math.pow(1 - progress, 3)`) creates a satisfying deceleration as the number approaches its target — feels more premium than linear
- **SVG glow filter** (`feGaussianBlur`) adds depth without CSS hacks
- Color palette uses the **"Oceanic Frost"** system: cyan-400 (≥75), sky-400 (≥50), slate-400 (<50) — cohesive and accessible against dark backgrounds

---

## Session 6 — Authentication & Subscription Tier System

### Prompt

I need full auth flows (sign up, sign in, sign out) using Supabase Auth from the starter template, plus a subscription system where users start on "free" and can upgrade to "pro". The subscription tier needs to persist in Supabase and be available globally via React context. What's the right architecture?

### Response

Built a two-layer context system:

**1. AuthContext** (`contexts/auth-context.tsx`):
```typescript
// Key patterns:
// - Safety timeout (10s) prevents infinite loading if Supabase is unreachable
// - Check session before getUser() — avoids unnecessary auth calls
// - onAuthStateChange listener for real-time session updates
// - useCallback for signOut to prevent re-renders

const timeout = setTimeout(() => {
  setIsLoading(false)  // Force unblock after 10 seconds
}, 10000)
```

**2. SubscriptionContext** (`contexts/subscription-context.tsx`):
```typescript
// Auto-creates "free" subscription on first login:
if (!existingSubscription) {
  await supabase.from("subscriptions")
    .insert({ user_id: user.id, tier: "free" })
    .select().single()
}

// Exposes derived values:
const isPro = subscription?.tier === "pro"
const tier = subscription?.tier ?? "free"
```

**Database migration** (`supabase/migrations/`):
- `subscriptions` table with RLS policies
- Users can only read/update their own subscription
- `is_pro_user()` function for server-side tier checks
- `updated_at` trigger for audit trail

The UI adapts at three levels:
1. **Logged out** → Sign In button in nav, Pricing page link
2. **Logged in (free)** → Upgrade button in nav, analyzer works
3. **Logged in (pro)** → Pro badge, no upgrade prompt

---

## Session 7 — Upgrade/Pricing Page & Stripe Placeholder

### Prompt

I need a pricing page with Free and Pro tiers. The assignment says to fake the payment flow and just persist the tier. But I want to build it so it's ready for Stripe when that's connected. How do I handle the "coming soon" state elegantly?

### Response

Built the `/upgrade` page with three states:

1. **Unauthenticated users** → See pricing comparison, CTA redirects to `/auth/signup?returnUrl=/upgrade`
2. **Free users** → Same pricing view, but "Upgrade to Pro" shows a toast: *"💳 Stripe payments coming soon! Secure payment processing via Stripe is in progress."*
3. **Pro users** → Different view entirely — shows active subscription card with downgrade option

Key UX decision: Instead of a fake checkout that might confuse users or judges, I used a **transparent "coming soon" banner** with Stripe branding. This signals production awareness — in a real app, you wouldn't fake a payment. The banner includes visual indicators (credit card icon, "In Progress" badge, "Secure" lock icon) to show the payment infrastructure is planned but not yet live.

The downgrade flow is fully functional with a confirmation dialog (`AlertDialog` from Radix) and writes `tier: "free"` back to Supabase immediately.

---

## Session 8 — Design System ("Oceanic Frost")

### Prompt

The default theme looks generic. I need a cohesive dark-mode design system that feels premium. The scoring colors should be cool-toned (not the typical red/amber/green traffic light pattern). I also want subtle texture and consistent spacing.

### Response

Designed the **"Oceanic Frost"** palette — a monochromatic dark theme with cyan/sky accents:

```css
:root {
  --background: oklch(0.12 0 0);        /* Near-black */
  --card: oklch(0.15 0 0);              /* Slightly lifted surfaces */
  --border: oklch(0.25 0 0);            /* Subtle separation */
  --muted-foreground: oklch(0.65 0 0);  /* Secondary text */
  --primary: oklch(0.33 0.14 18);       /* Deep wine accent */
}
```

Score colors follow a **cool-to-neutral gradient** instead of traffic lights:
- **≥ 75** → `cyan-400` (#22d3ee) — "Viral Ready"
- **≥ 50** → `sky-400` (#38bdf8) — "Moderate Potential"  
- **< 50** → `slate-400` (#94a3b8) — "Needs Work"

This avoids the anxiety of red scores and keeps the palette unified. Every color in the results UI — badges, progress bars, timeline dots, hashtag chips — pulls from this same cyan/sky/slate triad.

Added a **subtle grain texture** via SVG `feTurbulence` filter overlay on `body::before` — adds depth without impacting performance (it's a fixed-position pseudo-element with `pointer-events: none`).

Typography uses **Geist** (via `next/font/google`) for all UI text — clean, modern, and designed for interfaces.

---

## Session 9 — Debugging Hydration Errors (React 19 + Next.js 16)

### Prompt

I'm getting React hydration mismatch errors on navigation and the analyzer component. The browser console shows `Warning: Expected server HTML to contain a matching <div>`. What's causing this and how do I fix it?

### Response

Root cause: The `Navigation` component conditionally renders based on `useAuth()` state (loading vs. authenticated vs. unauthenticated). During SSR, the auth state is always "loading" (no access to Supabase client session). On hydration, the client resolves the auth state and renders different JSX → mismatch.

Two-part fix:

1. **`suppressHydrationWarning`** on the outermost elements of components that depend on client-only state:
```tsx
<nav suppressHydrationWarning className="...">
```

2. **Guard rendering with `isLoading`** — don't render auth-dependent UI until the client has resolved:
```tsx
{!isLoading && (
  <>
    {user ? <ProfileLink /> : <SignInButton />}
  </>
)}
```

This is a known pattern in Next.js App Router when combining server-rendered layouts with client-side auth state. The `suppressHydrationWarning` is a valid escape hatch for cases where the server can't know the client state (auth, subscriptions, localStorage).

---

## Session 10 — Production Hardening & Edge Cases

### Prompt

Review the app for production issues. What edge cases am I missing? What would a judge dock points for?

### Response

Found and fixed these issues:

**1. Memory leak in preview URLs:**
```typescript
// Before: ObjectURLs were never revoked
// After: Cleanup on unmount and on new file selection
useEffect(() => {
  return () => { if (preview) URL.revokeObjectURL(preview) }
}, [preview])
```

**2. File size validation missing:**
```typescript
const MAX_SIZE = 10 * 1024 * 1024 // 10MB
if (f.size > MAX_SIZE) {
  setError("File is too large. Please upload a file smaller than 10MB.")
  return
}
```

**3. MIME type fallback:**
```typescript
// Some browsers don't set file.type for certain formats
mimeType: file.type || (file.name.endsWith(".png") ? "image/png" : "image/jpeg")
```

**4. Auth loading timeout:**
```typescript
// Prevents infinite loading spinner if Supabase is unreachable
const timeout = setTimeout(() => {
  setIsLoading(false)
}, 10000)
```

**5. Error states with visual feedback:**
- Rate limit (429) → specific message telling user to wait
- Payload too large (413) → tells user to compress the file
- JSON parse failure → explains the AI didn't follow format
- Network errors → generic fallback with retry suggestion

**6. Account deletion with confirmation:**
- `AlertDialog` with explicit consequences listed
- Server-side deletion via `/api/account/delete`
- Cascading delete in Supabase (subscription removed with user)

**7. 404 page:**
- Custom `not-found.tsx` with navigation and return-home CTA
- Matches the design system (not a default Next.js error page)

---

## Session 11 — Component Architecture Review

### Prompt

Walk me through the component structure and why each piece is separated the way it is.

### Response

```
app/
  layout.tsx              ← Root layout: AuthProvider → SubscriptionProvider → children + Footer + Toaster
  page.tsx                ← Homepage: Navigation + Hero + ViralAnalyzer
  not-found.tsx           ← Custom 404
  auth/
    login/page.tsx        ← Sign in form with returnUrl support
    signup/page.tsx       ← Sign up form with returnUrl support
    check-email/page.tsx  ← Email confirmation interstitial
  upgrade/page.tsx        ← Pricing comparison (3 states: anon/free/pro)
  profile/
    page.tsx              ← Server component wrapper
    profile-client.tsx    ← Client component: subscription mgmt + account actions
  api/
    analyze/route.ts      ← AI analysis endpoint (Gemini via OpenRouter)
    auth/signout/route.ts ← Server-side sign out
    account/delete/       ← Account deletion endpoint

components/
  viral-analyzer.tsx      ← Main feature component (719 lines, self-contained)
  navigation.tsx          ← Responsive nav with auth-aware states
  footer.tsx              ← Site footer
  ui/                     ← shadcn/ui primitives (Button, Card, Input, etc.)

contexts/
  auth-context.tsx        ← Global auth state with Supabase listener
  subscription-context.tsx ← Subscription tier with CRUD operations

lib/
  supabase/               ← Supabase client configuration
  utils.ts                ← cn() helper for Tailwind class merging
```

**Why `viral-analyzer.tsx` is a single 719-line component** instead of split into smaller files: It contains the full upload → analyze → results flow with shared state (`file`, `result`, `loading`, `error`). Splitting it would require either prop drilling or a local context — both add complexity without improving readability. The component is logically organized with clear section comments (`// ─── Types ───`, `// ─── Sub-components ───`, `// ─── Main Component ───`) and extracted sub-components (`ScoreRing`, `MiniBar`, `Switch`) that are co-located because they're only used here.

**Why two context providers** instead of one: Auth and subscription have different lifecycle needs. Auth resolves on mount; subscription resolves after auth. Separating them means auth-only pages (login, signup) don't need to wait for subscription data.

---

## Session 12 — Share Card & Social Proof Feature

### Prompt

I want users to be able to share their virality score. Build a shareable card that opens as a modal with the score, rating, and top action items — designed to be screenshot-friendly.

### Response

Built a `showShareCard` modal that renders a screenshot-optimized card:

```tsx
<Card className="border-border/50 shadow-2xl overflow-hidden bg-background">
  <div className="bg-primary/10 px-6 py-4 border-b">
    <span className="font-black tracking-tighter uppercase">Viral Report</span>
    <span className="text-[10px] font-bold text-muted-foreground">GEMINI AI</span>
  </div>
  <CardContent className="p-8 text-center space-y-8">
    <ScoreRing score={result.score} />
    <h3 className="text-2xl font-black">{result.hookAnalysis.rating} Potential</h3>
    {/* Top 3 action items */}
    {/* Hashtags: #ViralAnalyzer #8xEngineer */}
  </CardContent>
  <div className="p-4 bg-cyan-500 text-white text-center">
    Screenshot to share! 📥
  </div>
</Card>
```

The modal uses `backdrop-blur-md` and a dark overlay. The card itself is designed with:
- Fixed width (`max-w-lg`) for consistent screenshots
- High contrast for social media compression
- Branded footer with "GEMINI AI" attribution
- Numbered action items for visual hierarchy

---

## Key Technical Decisions Summary

| Decision | Rationale |
|----------|-----------|
| Next.js API route for AI calls | API key security — never expose to client |
| OpenRouter instead of direct Gemini | Unified interface, better error handling, built-in retries |
| Canvas-based image resize | Reduce payload before API call, no external dependency |
| `requestAnimationFrame` for score animation | Smoother than CSS transitions for number counting, cubic ease-out feels premium |
| Supabase RLS with row-level policies | Users can only access their own data — production-grade security |
| Separate Auth + Subscription contexts | Different lifecycles, auth-only pages don't wait for subscription |
| "Oceanic Frost" cool-toned palette | Avoids anxiety of red/green traffic lights, stays cohesive in dark mode |
| `suppressHydrationWarning` for auth-dependent UI | Known Next.js pattern for client-only state, preferable to forced loading states |
| Single-file analyzer component (719 lines) | Shared state makes splitting counterproductive, sections clearly demarcated |
| Stripe "coming soon" instead of fake checkout | Production honesty — fake payments confuse users and signal cut corners |

---

## What I'd Build Next

1. **Stripe Connect integration** — real payment processing with webhook handlers for subscription management
2. **Analysis history** — persist results to Supabase with a dashboard view of past analyses
3. **Video frame extraction** — pull key frames server-side and display them in the timeline
4. **Competitor comparison** — let users paste a competitor's video URL for side-by-side scoring
5. **Rate limiting per user** — enforce free-tier limits (5 analyses/month) using Supabase Edge Functions
6. **Real-time collaboration** — share analysis results via unique URLs with OpenGraph previews

---
