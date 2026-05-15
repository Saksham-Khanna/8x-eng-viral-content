"use client"

import { useState, useCallback, useRef, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { 
  Upload, 
  Flame, 
  TrendingUp, 
  AlertCircle, 
  FileText, 
  Zap, 
  ListChecks, 
  Music, 
  ArrowRight, 
  XCircle, 
  RotateCcw,
  Play,
  Clock,
  CheckCircle2,
  ChevronRight,
  Info,
  Copy,
  Share2,
  Download,
  X,
  Sparkles
} from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

// ─── Types ────────────────────────────────────────────────────────────────────

type AnalysisResult = {
  score: number
  breakdown: {
    hook: number
    pacing: number
    visuals: number
    emotionalAppeal: number
  }
  hookAnalysis: {
    rating: string
    feedback: string
  }
  actionPlan: string[]
  captionSuggestions: {
    hook: string
    body: string
    hashtags: string[]
  }
  transcriptAnalysis: {
    strengths: string[]
    improvements: string[]
  }
  timeline: {
    timestamp: string
    description: string
    impact: "positive" | "negative"
  }[]
}

const MOCK_RESULT: AnalysisResult = {
  score: 84,
  breakdown: {
    hook: 92,
    pacing: 78,
    visuals: 85,
    emotionalAppeal: 81
  },
  hookAnalysis: {
    rating: "Strong",
    feedback: "Exceptional visual hook in the first 1.5 seconds. The high-contrast text and immediate movement will stop the scroll effectively."
  },
  actionPlan: [
    "Trim the 2-second dead space at the 5-second mark to maintain pacing",
    "Increase text size of the final CTA for better mobile readability",
    "Add a more aggressive color grade to make the visuals pop"
  ],
  captionSuggestions: {
    hook: "The secret trick I wish I knew earlier... 🤫",
    body: "You won't believe how simple this actually is. Save this for your next video!",
    hashtags: ["#contentcreator", "#viraltips", "#growth"]
  },
  transcriptAnalysis: {
    strengths: [
      "Clear and energetic voice-over",
      "Excellent use of trend-specific keywords"
    ],
    improvements: [
      "Slow down the intro by 0.5s for better clarity",
      "Add more emphasis on the final call to action"
    ]
  },
  timeline: [
    { timestamp: "0:01", description: "Visual hook: Pattern interrupt with bold text", impact: "positive" },
    { timestamp: "0:05", description: "Pacing dip: Too much dead air during transition", impact: "negative" },
    { timestamp: "0:12", description: "Climax: High emotional payoff with transition", impact: "positive" }
  ]
}

// ─── Utilities ────────────────────────────────────────────────────────────────

function toBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve((reader.result as string).split(",")[1])
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

function resizeImage(file: File, maxDim: number = 1200): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement("canvas")
        let width = img.width
        let height = img.height
        if (width > height) {
          if (width > maxDim) {
            height *= maxDim / width
            width = maxDim
          }
        } else {
          if (height > maxDim) {
            width *= maxDim / height
            height = maxDim
          }
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

// ─── Sub-components ───────────────────────────────────────────────────────────

function Switch({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50",
        checked ? "bg-primary" : "bg-input"
      )}
    >
      <span
        className={cn(
          "pointer-events-none block h-4 w-4 rounded-full bg-background shadow-lg ring-0 transition-transform",
          checked ? "translate-x-4" : "translate-x-0"
        )}
      />
    </button>
  )
}

function ScoreRing({ score }: { score: number }) {
  const [displayScore, setDisplayScore] = useState(0)
  
  useEffect(() => {
    const duration = 1500
    const start = 0
    const end = score
    const startTime = performance.now()

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime
      const progress = Math.min(elapsed / duration, 1)
      const easeOut = 1 - Math.pow(1 - progress, 3) 
      setDisplayScore(Math.floor(start + (end - start) * easeOut))

      if (progress < 1) {
        requestAnimationFrame(animate)
      }
    }

    requestAnimationFrame(animate)
  }, [score])

  const size = 160
  const stroke = 14
  const r = (size - stroke) / 2
  const circ = 2 * Math.PI * r
  const offset = circ - (displayScore / 100) * circ
  
  // Oceanic Frost palette
  const getScoreColor = (s: number) => {
    if (s >= 75) return "#22d3ee" // Cyan 400 — Viral Ready
    if (s >= 50) return "#38bdf8" // Sky 400 — Moderate
    return "#94a3b8" // Slate 400 — Needs Work
  }
  
  const color = getScoreColor(score)

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg
        width={size}
        height={size}
        style={{ transform: "rotate(-90deg)", flexShrink: 0, overflow: "visible" }}
      >
        <defs>
          <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>
        <circle
          cx={size / 2} cy={size / 2} r={r}
          fill="none" stroke="currentColor"
          strokeWidth={stroke}
          className="text-muted/20"
        />
        <circle
          cx={size / 2} cy={size / 2} r={r}
          fill="none" stroke={color}
          strokeWidth={stroke}
          strokeDasharray={circ}
          strokeDashoffset={offset}
          strokeLinecap="round"
          filter="url(#glow)"
          className="transition-all duration-300 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-4xl font-black tracking-tighter" style={{ color }}>{displayScore}</span>
        <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Score</span>
      </div>
    </div>
  )
}

function MiniBar({ label, value, tooltip }: { label: string; value: number; tooltip?: string }) {
  return (
    <div className="space-y-1.5 py-1">
      <div className="flex items-center justify-between group">
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-tight">{label}</span>
          {tooltip && (
            <div className="relative">
              <Info className="w-3 h-3 text-muted-foreground/50 cursor-help" />
              <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block w-48 p-2 bg-popover text-[10px] rounded border border-border shadow-lg z-50 text-popover-foreground">
                {tooltip}
              </div>
            </div>
          )}
        </div>
        <span className={cn("text-xs font-black tabular-nums", scoreColor(value))}>
          {value}
        </span>
      </div>
      <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
        <div 
          className={cn("h-full rounded-full transition-all duration-1000 ease-out", scoreBg(value))}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  )
}

function scoreColor(v: number) {
  if (v >= 75) return "text-cyan-400"
  if (v >= 50) return "text-sky-400"
  return "text-slate-400"
}

function scoreBg(v: number) {
  if (v >= 75) return "bg-cyan-400"
  if (v >= 50) return "bg-sky-400"
  return "bg-slate-400"
}

function hookBadgeClass(rating: string) {
  const r = rating.toLowerCase()
  // Positive ratings → Cyan
  if (r.includes("exceptional") || r.includes("strong") || r.includes("excellent") || r.includes("great") || r.includes("viral")) {
    return "bg-cyan-400/10 text-cyan-400 border-cyan-400/20"
  }
  // Mid ratings → Sky
  if (r.includes("good") || r.includes("moderate") || r.includes("fair") || r.includes("average")) {
    return "bg-sky-400/10 text-sky-400 border-sky-400/20"
  }
  // Low ratings → Slate (neutral, not alarming)
  return "bg-slate-400/10 text-slate-400 border-slate-400/20"
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function ViralAnalyzer() {
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<AnalysisResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [caption, setCaption] = useState("")
  const [demoMode, setDemoMode] = useState(false)
  const [showShareCard, setShowShareCard] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  // Memory leak cleanup
  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview)
    }
  }, [preview])

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
    const f = e.dataTransfer.files[0]
    if (f) handleFile(f)
  }

  const analyze = async () => {
    setLoading(true)
    setError(null)
    try {
      if (demoMode || !file) {
        await new Promise((r) => setTimeout(r, 2000))
        setResult(MOCK_RESULT)
        return
      }

      let base64 = ""
      if (file.type.startsWith("image/")) {
        base64 = await resizeImage(file)
      } else {
        base64 = await toBase64(file)
      }

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
        setError("GEMINI API rate limit reached. Please wait a minute before trying again.")
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
    setShowShareCard(false)
  }

  const copyCaption = () => {
    if (!result) return
    const fullCaption = `${result.captionSuggestions.hook}\n\n${result.captionSuggestions.body}\n\n${result.captionSuggestions.hashtags.join(" ")}`
    navigator.clipboard.writeText(fullCaption)
    toast.success("Caption copied to clipboard!")
  }

  if (!result) {
    return (
      <div suppressHydrationWarning className="max-w-2xl mx-auto space-y-6">
        <Card className="border-dashed border-2 border-border/50 bg-card/50 hover:bg-card/80 transition-colors cursor-pointer group relative overflow-hidden"
             onDragOver={(e) => e.preventDefault()}
             onDrop={onDrop}
             onClick={() => fileRef.current?.click()}>
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          


          <CardContent className="flex flex-col items-center justify-center py-16 text-center space-y-4">
            <input type="file" ref={fileRef} accept="video/*,image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f) }} />
            
            {preview ? (
              <div className="relative w-full max-w-[240px] aspect-video rounded-xl overflow-hidden border border-border shadow-2xl">
                {file?.type.startsWith("video/") ? (
                  <video src={preview} className="w-full h-full object-cover" muted />
                ) : (
                  <img src={preview} className="w-full h-full object-cover" alt="Preview" />
                )}
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Upload className="w-8 h-8 text-white" />
                </div>
              </div>
            ) : (
              <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Upload className="w-10 h-10 text-primary" />
              </div>
            )}

            <div className="space-y-1">
              <p className="font-bold text-lg tracking-tight">Drop your content here</p>
              <p className="text-sm text-muted-foreground">MP4, MOV, JPG, PNG — up to 10 MB</p>
            </div>
            {file && <p className="text-xs font-medium text-primary bg-primary/10 px-3 py-1 rounded-full">{file.name}</p>}
          </CardContent>
        </Card>

        <div className="space-y-4">
          <label className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Context (Optional)
          </label>
          <textarea
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="Paste your draft caption here for optimization..."
            rows={3}
            className="w-full rounded-xl border border-border/50 bg-card/50 px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
          />
        </div>

        <Button onClick={analyze} disabled={loading || !file} className="w-full h-14 text-lg font-bold gap-3 shadow-xl shadow-primary/20" size="lg">
          {loading ? (
            <><span className="animate-spin">⚙️</span> Analyzing with GEMINI...</>
          ) : (
            <><Flame className="w-6 h-6" /> Analyze Virality Potential</>
          )}
        </Button>

        {error && (
          <div className="flex items-start gap-3 rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-4 text-sm text-destructive animate-in fade-in slide-in-from-top-1">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <p className="font-medium">{error}</p>
          </div>
        )}
      </div>
    )
  }

  // ── Results UI ──

  return (
    <div suppressHydrationWarning className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-700 relative">
      {/* Share Modal */}
      {showShareCard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-6 overflow-y-auto">
          <div className="relative w-full max-w-lg animate-in zoom-in-95 duration-300">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setShowShareCard(false)}
              className="absolute -top-12 right-0 text-white hover:bg-white/20"
            >
              <X className="w-6 h-6" />
            </Button>
            
            <Card className="border-border/50 shadow-2xl overflow-hidden bg-background">
              <div className="bg-primary/10 px-6 py-4 border-b border-border/50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-cyan-400" />
                  <span className="font-black tracking-tighter uppercase">Viral Report</span>
                </div>
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">GEMINI AI</span>
              </div>
              <CardContent className="p-8 text-center space-y-8">
                <ScoreRing score={result.score} />
                <div className="space-y-2">
                  <h3 className="text-2xl font-black tracking-tighter uppercase">{result.hookAnalysis.rating} Potential</h3>
                  <p className="text-sm text-muted-foreground">This content is {result.score}% ready to go viral.</p>
                </div>
                <div className="space-y-3 pt-4 border-t border-border/50">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-cyan-400 text-left">Top Action Items</p>
                  {result.actionPlan.slice(0, 3).map((item, i) => (
                    <div key={i} className="flex gap-3 text-left bg-muted/50 p-3 rounded-xl">
                      <span className="text-cyan-400 font-black">0{i+1}</span>
                      <p className="text-xs font-bold leading-tight">{item}</p>
                    </div>
                  ))}
                </div>
                <div className="pt-4 flex items-center justify-center gap-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                  <span>#ViralAnalyzer</span>
                  <span>•</span>
                  <span>#8xEngineer</span>
                </div>
              </CardContent>
              <div className="p-4 bg-cyan-500 text-white text-center text-xs font-bold flex items-center justify-center gap-2">
                 Screenshot to share! <Download className="w-3 h-3" />
              </div>
            </Card>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black tracking-tighter">Analysis Complete</h2>
          <p className="text-sm text-muted-foreground font-medium uppercase tracking-widest mt-1">
            {demoMode ? "Sample Analysis Report" : `Report: ${file?.name}`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setShowShareCard(true)} className="rounded-xl border-border/50 hover:bg-muted font-bold gap-2">
            <Share2 className="w-4 h-4" />
            Share
          </Button>
          <Button variant="outline" onClick={reset} className="rounded-xl border-border/50 hover:bg-muted font-bold gap-2">
            <RotateCcw className="w-4 h-4" />
            Reset
          </Button>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Score Card */}
        <Card className="lg:col-span-1 border-border/50 bg-card/50 overflow-hidden relative min-h-[420px] flex flex-col">
          <div className="absolute top-0 right-0 p-4">
            <Sparkles className="w-6 h-6 text-cyan-400/20" />
          </div>
          <CardContent className="pt-12 pb-8 flex-1 flex flex-col items-center justify-center space-y-10">
            <div className="scale-110">
              <ScoreRing score={result.score} />
            </div>
            <div className="w-full space-y-4 pt-4">
              <MiniBar label="Hook" value={result.breakdown.hook} tooltip="The effectiveness of the first 3 seconds" />
              <MiniBar label="Pacing" value={result.breakdown.pacing} tooltip="Maintaining viewer attention throughout" />
              <MiniBar label="Visuals" value={result.breakdown.visuals} tooltip="Quality, lighting, and composition" />
              <MiniBar label="Emotional" value={result.breakdown.emotionalAppeal} tooltip="Connection with the audience" />
            </div>
          </CardContent>
        </Card>

        <div className="lg:col-span-2 space-y-6">
          {/* Timeline & Hook */}
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="border-border/50 bg-card/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-black uppercase tracking-widest text-cyan-400 flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Visual Timeline
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {result.timeline.map((item, i) => (
                  <div key={i} className="flex gap-3 relative group">
                    {i !== result.timeline.length - 1 && <div className="absolute left-[7px] top-4 bottom-[-16px] w-[2px] bg-border/50" />}
                    <div className={cn("w-4 h-4 rounded-full border-2 border-background z-10 shrink-0 mt-1 shadow-[0_0_8px_rgba(0,0,0,0.5)]", item.impact === "positive" ? "bg-cyan-400" : "bg-slate-400")} />
                    <div className="space-y-0.5">
                      <span className="text-[10px] font-black tabular-nums text-muted-foreground">{item.timestamp}</span>
                      <p className="text-sm font-medium leading-snug">{item.description}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="border-border/50 bg-card/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-black uppercase tracking-widest text-cyan-400 flex items-center gap-2">
                  <Zap className="w-4 h-4" />
                  Hook Rating
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className={cn("px-4 py-3 rounded-xl border font-black text-center text-xl shadow-inner", hookBadgeClass(result.hookAnalysis.rating))}>
                  {result.hookAnalysis.rating}
                </div>
                <p className="text-sm text-muted-foreground font-medium leading-relaxed italic">
                  "{result.hookAnalysis.feedback}"
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Action Plan */}
          <Card className="border-border/50 bg-cyan-400/5 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-10">
              <CheckCircle2 className="w-32 h-32 text-cyan-400" />
            </div>
            <CardHeader>
              <CardTitle className="text-sm font-black uppercase tracking-widest text-cyan-400 flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Strategic Action Plan
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid sm:grid-cols-2 gap-4">
                {result.actionPlan.map((step, i) => (
                  <div key={i} className="flex gap-3 p-3 rounded-xl bg-background/50 border border-border/50 hover:border-cyan-400/30 transition-colors group">
                    <span className="text-lg font-black text-cyan-400/40 shrink-0">{String(i + 1).padStart(2, '0')}</span>
                    <p className="text-sm font-bold leading-tight">{step}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Caption Suggestions */}
        <Card className="border-border/50 bg-card/50 relative overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-black uppercase tracking-widest text-cyan-400 flex items-center gap-2">
              <ListChecks className="w-4 h-4" />
              Caption Optimizer
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={copyCaption} className="h-8 rounded-lg font-bold gap-2 text-cyan-400 hover:text-cyan-400 hover:bg-cyan-400/10">
              <Copy className="w-3.5 h-3.5" />
              Copy
            </Button>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-muted/50 border border-border/50 space-y-4">
                <div className="space-y-1">
                  <span className="text-[10px] font-black uppercase tracking-widest text-cyan-400">Winning Hook</span>
                  <p className="text-sm font-bold">{result.captionSuggestions.hook}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">The Body</span>
                  <p className="text-sm text-muted-foreground leading-relaxed">{result.captionSuggestions.body}</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {result.captionSuggestions.hashtags.map((tag, i) => (
                  <span key={i} className="px-3 py-1 rounded-lg bg-cyan-400/10 text-cyan-400 text-xs font-black border border-cyan-400/20">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Transcript Analysis */}
        <Card className="border-border/50 bg-card/50">
          <CardHeader>
            <CardTitle className="text-sm font-black uppercase tracking-widest text-cyan-400 flex items-center gap-2">
              <Music className="w-4 h-4" />
              Script & Audio Analysis
            </CardTitle>
          </CardHeader>
          <CardContent className="grid sm:grid-cols-2 gap-6">
            <div className="space-y-3">
              <span className="text-[10px] font-black uppercase tracking-widest text-cyan-400 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Strengths
              </span>
              <ul className="space-y-2">
                {result.transcriptAnalysis.strengths.map((s, i) => (
                  <li key={i} className="flex gap-2 text-xs font-bold leading-tight group">
                    <ChevronRight className="w-3 h-3 mt-0.5 text-cyan-400 shrink-0 transition-transform group-hover:translate-x-1" />
                    {s}
                  </li>
                ))}
              </ul>
            </div>
            <div className="space-y-3">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> To Improve
              </span>
              <ul className="space-y-2">
                {result.transcriptAnalysis.improvements.map((s, i) => (
                  <li key={i} className="flex gap-2 text-xs font-bold leading-tight group">
                    <ChevronRight className="w-3 h-3 mt-0.5 text-slate-400 shrink-0 transition-transform group-hover:translate-x-1" />
                    {s}
                  </li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
