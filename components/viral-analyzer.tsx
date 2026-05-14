"use client"

import { useState, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Upload, Flame, Zap, Music, Users, ListChecks,
  RotateCcw, AlertCircle, CheckCircle2, XCircle, ArrowRight,
} from "lucide-react"
import { cn } from "@/lib/utils"

// ─── Types ───────────────────────────────────────────────────────────────────

interface BreakdownScores {
  hookStrength: number
  pacing: number
  thumbnailRating: number
  captionOptimization: number
  emotionalAppeal: number
  trendAlignment: number
}

interface AnalysisResult {
  viralityScore: number
  scoreLabel: string
  breakdown: BreakdownScores
  hookAnalysis: {
    rating: "Weak" | "Moderate" | "Strong" | "Exceptional"
    summary: string
    suggestions: string[]
  }
  captionSuggestions: {
    issues: string[]
    rewrittenCaption: string
    hashtagRecommendations: string[]
  }
  trendingAudio: { name: string; uses: string; trend: string }[]
  competitorInsights: string
  actionPlan: string[]
}

// ─── Mock data for demo mode ──────────────────────────────────────────────────

const MOCK_RESULT: AnalysisResult = {
  viralityScore: 73,
  scoreLabel: "Strong Potential",
  breakdown: {
    hookStrength: 82,
    pacing: 68,
    thumbnailRating: 71,
    captionOptimization: 65,
    emotionalAppeal: 79,
    trendAlignment: 74,
  },
  hookAnalysis: {
    rating: "Strong",
    summary:
      "Your opening 3 seconds creates strong curiosity with a bold visual statement. The text overlay appears quickly, but the transition feels slightly rushed — viewers may not register your core message before scrolling.",
    suggestions: [
      "Start with a face close-up or reaction shot to trigger mirror neurons",
      "Add a pattern interrupt — an unexpected sound or color flash in frame 1",
      "Put your boldest claim or key number in the first 2 seconds as on-screen text",
    ],
  },
  captionSuggestions: {
    issues: [
      "Too long — TikTok captions over 150 chars get truncated in feed",
      "No question to drive comment engagement",
      "Missing a CTA above the fold",
    ],
    rewrittenCaption:
      "POV: I tested every viral trick for 30 days 👀 The results shocked me. Which one would you try first? 👇",
    hashtagRecommendations: [
      "#viral",
      "#contentcreator",
      "#growthhacks",
      "#fyp",
      "#socialmediatips",
    ],
  },
  trendingAudio: [
    { name: "original sound – lowkey.wav", uses: "2.1M", trend: "↑ Hot" },
    { name: "bad idea right? – Olivia Rodrigo", uses: "890K", trend: "↑ Rising" },
    { name: "Luther – Kendrick Lamar", uses: "4.3M", trend: "🔥 Peak" },
  ],
  competitorInsights:
    "Top performing content in your niche averages 8–12 cuts per minute with 2–3 text overlays. Your video sits at ~4 cuts/min — faster pacing could match viewer expectations. Competitors consistently use duet/stitch formats for 40% higher engagement.",
  actionPlan: [
    "Re-cut your hook to lead with the most surprising or emotional moment",
    "Add trending audio from the recommendations below to 3× your distribution reach",
    "Shorten caption to under 150 chars and add a direct question to drive comments",
    "Test a split-screen or reaction format for your next post in this series",
  ],
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function scoreColor(v: number) {
  if (v >= 75) return "text-emerald-400"
  if (v >= 50) return "text-amber-400"
  return "text-rose-400"
}

function barColor(v: number) {
  if (v >= 75) return "bg-emerald-500"
  if (v >= 50) return "bg-amber-500"
  return "bg-rose-500"
}

function hookBadgeClass(rating: string) {
  if (rating === "Exceptional" || rating === "Strong")
    return "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
  if (rating === "Moderate")
    return "bg-amber-500/15 text-amber-400 border border-amber-500/30"
  return "bg-rose-500/15 text-rose-400 border border-rose-500/30"
}

function toBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve((reader.result as string).split(",")[1])
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function ScoreRing({ score }: { score: number }) {
  const size = 140
  const stroke = 12
  const r = (size - stroke) / 2
  const circ = 2 * Math.PI * r
  const offset = circ - (score / 100) * circ
  const color =
    score >= 75 ? "#34d399" : score >= 50 ? "#fbbf24" : "#f87171"

  return (
    <svg
      width={size}
      height={size}
      style={{ transform: "rotate(-90deg)", flexShrink: 0 }}
    >
      <circle
        cx={size / 2} cy={size / 2} r={r}
        fill="none" stroke="currentColor"
        strokeWidth={stroke}
        className="text-border"
      />
      <circle
        cx={size / 2} cy={size / 2} r={r}
        fill="none" stroke={color}
        strokeWidth={stroke}
        strokeDasharray={circ}
        strokeDashoffset={offset}
        strokeLinecap="round"
        style={{ transition: "stroke-dashoffset 1.2s cubic-bezier(0.4,0,0.2,1)" }}
      />
      <text
        x="50%" y="50%"
        textAnchor="middle"
        dominantBaseline="middle"
        style={{
          transform: "rotate(90deg)",
          transformOrigin: "50% 50%",
          fontSize: 32,
          fontWeight: 700,
          fill: color,
          fontFamily: "inherit",
        }}
      >
        {score}
      </text>
    </svg>
  )
}

function MiniBar({ label, value }: { label: string; value: number }) {
  return (
    <div className="mb-3">
      <div className="flex justify-between text-sm mb-1.5">
        <span className="text-muted-foreground">{label}</span>
        <span className={cn("font-semibold tabular-nums", scoreColor(value))}>
          {value}
        </span>
      </div>
      <div className="h-1.5 rounded-full bg-border overflow-hidden">
        <div
          className={cn("h-full rounded-full transition-all duration-1000", barColor(value))}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function ViralAnalyzer() {
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [caption, setCaption] = useState("")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<AnalysisResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [demoMode, setDemoMode] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const handleFile = useCallback((f: File) => {
    const MAX_SIZE = 10 * 1024 * 1024 // 10MB
    if (f.size > MAX_SIZE) {
      setError("File is too large. Please upload a file smaller than 10MB.")
      setFile(null)
      setPreview(null)
      return
    }
    setFile(f)
    setResult(null)
    setError(null)
    if (preview) URL.revokeObjectURL(preview)
    setPreview(URL.createObjectURL(f))
  }, [preview])

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const f = e.dataTransfer.files[0]
    if (f) handleFile(f)
  }

  const analyze = async () => {
    if (!file && !demoMode) return
    setLoading(true)
    setError(null)
    setResult(null)

    try {
      if (demoMode || !file) {
        await new Promise((r) => setTimeout(r, 2000))
        setResult(MOCK_RESULT)
        return
      }

      const base64 = await toBase64(file)

      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          base64, 
          mimeType: file.type || (file.name.endsWith(".png") ? "image/png" : "image/jpeg"), 
          caption 
        }),
      })

      if (!res.ok) {
        const err = await res.json()
        if (err.error === "RATE_LIMIT_REACHED") {
          throw new Error("RATE_LIMIT_REACHED")
        }
        if (err.error === "PAYLOAD_TOO_LARGE") {
          throw new Error("PAYLOAD_TOO_LARGE")
        }
        throw new Error(err.message || err.error || "Analysis failed")
      }

      const data: AnalysisResult = await res.json()
      setResult(data)
    } catch (err) {
      if (err instanceof Error && err.message === "RATE_LIMIT_REACHED") {
        setError("GEMINI API rate limit reached. Please wait a minute or enable 'Demo Mode' above to continue testing the UI.")
      } else if (err instanceof Error && err.message === "PAYLOAD_TOO_LARGE") {
        setError("The file is too large for the AI to process. Please upload a smaller video or image (under 10MB).")
      } else {
        setError(err instanceof Error ? err.message : "Something went wrong")
      }
    } finally {
      setLoading(false)
    }
  }

  const reset = () => {
    setResult(null)
    setFile(null)
    setPreview(null)
    setCaption("")
    setError(null)
  }

  // ── Upload UI ──

  if (!result) {
    return (
      <div className="max-w-2xl mx-auto space-y-4">
        {/* Demo mode toggle */}
        <div className="flex items-center justify-end gap-2 text-sm text-muted-foreground">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={demoMode}
              onChange={(e) => setDemoMode(e.target.checked)}
              className="accent-primary"
            />
            Demo mode (no API key needed)
          </label>
        </div>

        <Card className="border-border/50">
          <CardContent className="pt-6 space-y-4">
            {/* Drop zone */}
            <div
              onClick={() => fileRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
              onDragLeave={() => setDragOver(false)}
              onDrop={onDrop}
              className={cn(
                "border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200",
                dragOver
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/50 hover:bg-muted/30"
              )}
            >
              {preview ? (
                <div className="space-y-3">
                  {file?.type.startsWith("video/") ? (
                    <video
                      src={preview}
                      controls
                      muted
                      className="max-w-full max-h-56 mx-auto rounded-lg object-cover"
                    />
                  ) : (
                    <img
                      src={preview}
                      alt="Preview"
                      className="max-w-full max-h-56 mx-auto rounded-lg object-cover"
                    />
                  )}
                  <p className="text-sm text-muted-foreground">
                    <span className="font-medium text-foreground">{file?.name}</span>
                    {" "}— click to change
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="w-14 h-14 mx-auto rounded-full bg-muted flex items-center justify-center">
                    <Upload className="w-6 h-6 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="font-medium text-base">Drop your video or image here</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      MP4, MOV, JPG, PNG — up to 10 MB
                    </p>
                  </div>
                  <p className="text-xs text-muted-foreground">or click to browse</p>
                </div>
              )}
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="video/*,image/*"
              className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
            />

            {/* Caption */}
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Caption{" "}
                <span className="text-muted-foreground font-normal">(optional — paste yours for optimization)</span>
              </label>
              <textarea
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="Add your caption here to get specific rewrite suggestions..."
                rows={3}
                className="w-full rounded-lg border border-border bg-input px-3 py-2.5 text-sm resize-none placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/50 transition"
              />
            </div>

            {/* CTA */}
            <Button
              onClick={analyze}
              disabled={!file && !demoMode}
              className="w-full h-12 text-base font-semibold gap-2"
              size="lg"
            >
              {loading ? (
                <>
                  <span className="animate-spin">⚙️</span>
                  Analyzing with GEMINI...
                </>
              ) : (
                <>
                  <Flame className="w-5 h-5" />
                  Analyze Viral Potential
                </>
              )}
            </Button>

            {error && (
              <div className="flex items-start gap-3 rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                {error}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    )
  }

  // ── Results UI ──

  const bd = result.breakdown
  const breakdownEntries: [string, number][] = [
    ["Hook Strength", bd.hookStrength],
    ["Pacing", bd.pacing],
    ["Thumbnail Rating", bd.thumbnailRating],
    ["Caption Optimization", bd.captionOptimization],
    ["Emotional Appeal", bd.emotionalAppeal],
    ["Trend Alignment", bd.trendAlignment],
  ]

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      {/* Header bar */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold tracking-tight">Your Virality Report</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            {demoMode ? "Demo content" : file?.name}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={reset} className="gap-2">
          <RotateCcw className="w-4 h-4" />
          Analyze another
        </Button>
      </div>

      {/* Score hero */}
      <Card className="border-border/50">
        <CardContent className="pt-6">
          <div className="flex items-center gap-8 flex-wrap">
            <div className="text-center space-y-2">
              <ScoreRing score={result.viralityScore} />
              <p className={cn("text-sm font-semibold", scoreColor(result.viralityScore))}>
                {result.scoreLabel}
              </p>
            </div>
            <div className="flex-1 min-w-[220px]">
              <p className="text-sm font-medium mb-4">Score breakdown</p>
              {breakdownEntries.map(([label, val]) => (
                <MiniBar key={label} label={label} value={val} />
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Two-column grid */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Hook Analysis */}
        <Card className="border-border/50">
          <CardHeader className="pb-3 pt-5 px-5">
            <CardTitle className="flex items-center gap-2 text-base">
              <Zap className="w-4 h-4 text-primary" />
              Hook Analysis
              <span className="text-xs text-muted-foreground font-normal">first 3 seconds</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="px-5 pb-5 space-y-4">
            <span
              className={cn(
                "inline-block px-3 py-1 rounded-full text-xs font-semibold",
                hookBadgeClass(result.hookAnalysis.rating)
              )}
            >
              {result.hookAnalysis.rating}
            </span>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {result.hookAnalysis.summary}
            </p>
            <ul className="space-y-2">
              {result.hookAnalysis.suggestions.map((s, i) => (
                <li key={i} className="flex gap-2 text-sm">
                  <ArrowRight className="w-3.5 h-3.5 mt-0.5 text-primary shrink-0" />
                  <span>{s}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Caption */}
        <Card className="border-border/50">
          <CardHeader className="pb-3 pt-5 px-5">
            <CardTitle className="flex items-center gap-2 text-base">
              <ListChecks className="w-4 h-4 text-primary" />
              Caption Optimization
            </CardTitle>
          </CardHeader>
          <CardContent className="px-5 pb-5 space-y-4">
            <ul className="space-y-1.5">
              {result.captionSuggestions.issues.map((issue, i) => (
                <li key={i} className="flex gap-2 text-sm text-muted-foreground">
                  <XCircle className="w-3.5 h-3.5 mt-0.5 text-rose-400 shrink-0" />
                  {issue}
                </li>
              ))}
            </ul>
            <div className="rounded-lg bg-muted/50 border border-border/50 px-4 py-3">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                Suggested caption
              </p>
              <p className="text-sm leading-relaxed">
                {result.captionSuggestions.rewrittenCaption}
              </p>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {result.captionSuggestions.hashtagRecommendations.map((tag, i) => (
                <span
                  key={i}
                  className="px-2.5 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20"
                >
                  {tag}
                </span>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Trending Audio */}
        <Card className="border-border/50">
          <CardHeader className="pb-3 pt-5 px-5">
            <CardTitle className="flex items-center gap-2 text-base">
              <Music className="w-4 h-4 text-primary" />
              Trending Audio Picks
            </CardTitle>
          </CardHeader>
          <CardContent className="px-5 pb-5 space-y-2">
            {result.trendingAudio.map((audio, i) => (
              <div
                key={i}
                className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg bg-muted/40 border border-border/40"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{audio.name}</p>
                  <p className="text-xs text-muted-foreground">{audio.uses} uses</p>
                </div>
                <span className="text-xs font-semibold text-emerald-400 whitespace-nowrap shrink-0">
                  {audio.trend}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Competitor + Action Plan */}
        <Card className="border-border/50">
          <CardHeader className="pb-3 pt-5 px-5">
            <CardTitle className="flex items-center gap-2 text-base">
              <Users className="w-4 h-4 text-primary" />
              Competitor Insights
            </CardTitle>
          </CardHeader>
          <CardContent className="px-5 pb-5 space-y-4">
            <p className="text-sm text-muted-foreground leading-relaxed">
              {result.competitorInsights}
            </p>
            <div>
              <p className="text-sm font-medium mb-2">Your action plan</p>
              <ol className="space-y-2">
                {result.actionPlan.map((action, i) => (
                  <li key={i} className="flex gap-2 text-sm">
                    <CheckCircle2 className="w-3.5 h-3.5 mt-0.5 text-primary shrink-0" />
                    {action}
                  </li>
                ))}
              </ol>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Content preview (if real upload) */}
      {preview && !demoMode && (
        <Card className="border-border/50">
          <CardContent className="pt-5 pb-5">
            <p className="text-sm font-medium mb-3">Analyzed content</p>
            {file?.type.startsWith("video/") ? (
              <video
                src={preview}
                controls
                className="w-full max-h-72 rounded-lg object-contain"
              />
            ) : (
              <img
                src={preview}
                alt="Uploaded content"
                className="w-full max-h-72 rounded-lg object-contain"
              />
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
