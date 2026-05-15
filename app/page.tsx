import { Navigation } from "@/components/navigation"
import { ViralAnalyzer } from "@/components/viral-analyzer"
import { Flame, TrendingUp, Zap } from "lucide-react"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border/50">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent pointer-events-none" />
        <div className="container mx-auto px-6 pt-16 pb-6 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
            <Flame className="w-4 h-4" />
            AI-Powered Virality Scoring
          </div>
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight leading-tight mb-6">
            Will it{" "}
            <span className="text-primary">go viral?</span>
          </h1>
          <p className="text-lg sm:text-xl text-muted-foreground font-light leading-relaxed max-w-2xl mx-auto mb-4">
            Upload your video or image and get an AI-powered virality score with
            hook analysis, caption optimization, and actionable creator feedback.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground mt-8">
            <span className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" />
              Virality score 0–100
            </span>
            <span className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-primary" />
              Hook strength analysis
            </span>
            <span className="flex items-center gap-2">
              <Flame className="w-4 h-4 text-primary" />
              Caption &amp; hashtag optimizer
            </span>
          </div>
        </div>
      </section>

      {/* Analyzer */}
      <section className="container mx-auto px-6 py-4 pb-16">
        <ViralAnalyzer />
      </section>
    </div>
  )
}
