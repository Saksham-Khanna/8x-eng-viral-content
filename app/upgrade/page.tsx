"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Navigation } from "@/components/navigation"
import { Button } from "@/components/ui/button"
import { CheckCircle, Sparkles, Zap, Shield, CreditCard, Clock, Lock, ArrowRight } from "lucide-react"
import { useSubscription } from "@/contexts/subscription-context"
import { useAuth } from "@/contexts/auth-context"
import { toast } from "sonner"

export default function UpgradePage() {
  const { isPro, tier, upgradeToPro, downgradeToFree, isLoading: subLoading } = useSubscription()
  const { user, isLoading: authLoading } = useAuth()
  const router = useRouter()
  const [isProcessing, setIsProcessing] = useState(false)

  const handleUpgrade = async () => {
    if (!user) {
      router.push("/auth/signup?returnUrl=/upgrade")
      return
    }

    // Stripe coming soon — show user-friendly message
    toast.info("💳 Stripe payments coming soon!", {
      description: "Secure payment processing via Stripe is in progress. You'll be notified as soon as upgrade is available.",
      duration: 6000,
    })
  }

  const handleDowngrade = async () => {
    setIsProcessing(true)
    try {
      await downgradeToFree()
      toast.success("You've been downgraded to the Free plan.")
    } catch (error) {
      toast.error("Failed to downgrade. Please try again.")
      console.error(error)
    } finally {
      setIsProcessing(false)
    }
  }

  // Show current subscription if Pro
  if (isPro && !subLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="flex items-center justify-center px-4 py-16 min-h-[calc(100vh-80px)]">
          <div className="max-w-2xl w-full">
            <div className="text-center mb-12">
              <div className="mb-6 flex justify-center">
                <div className="w-16 h-16 rounded-full bg-cyan-400/10 flex items-center justify-center border border-cyan-400/20">
                  <CheckCircle className="w-8 h-8 text-cyan-400" />
                </div>
              </div>
              <h1 className="text-5xl font-light tracking-tight mb-4">
                You're a <span className="font-semibold text-cyan-400">Pro</span> member
              </h1>
              <p className="text-xl text-muted-foreground font-light">
                Thank you for upgrading! You have access to all Pro features.
              </p>
            </div>

            <div className="border-2 border-cyan-400/20 rounded-2xl p-8 bg-card/50 mb-8">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="text-sm text-cyan-400 font-medium mb-1">Current Plan</div>
                  <div className="text-2xl font-bold flex items-center gap-2">
                    <Sparkles className="w-5 h-5" />
                    Pro Plan
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-muted-foreground mb-1">Status</div>
                  <div className="font-medium text-cyan-400 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                    Active
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-border">
                <h4 className="text-sm font-medium mb-3">Your Pro benefits:</h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-cyan-400 shrink-0" />
                    Unlimited AI-powered virality analysis
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-cyan-400 shrink-0" />
                    Priority support
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-cyan-400 shrink-0" />
                    Advanced analytics & insights
                  </li>
                </ul>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" asChild>
                <Link href="/profile">Manage Account</Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={handleDowngrade}
                disabled={isProcessing}
              >
                {isProcessing ? "Processing..." : "Downgrade to Free"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Show pricing for free / unauthenticated users
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="flex items-center justify-center px-4 py-16 min-h-[calc(100vh-80px)]">
        <div className="max-w-4xl w-full space-y-16">
          {/* Header */}
          <div className="text-center space-y-4">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium border border-primary/20">
              <Sparkles className="w-4 h-4" />
              Simple, transparent pricing
            </div>
            <h1 className="text-5xl sm:text-6xl font-light tracking-tight">
              Go further with <span className="font-semibold text-cyan-400">Pro</span>
            </h1>
            <p className="text-xl text-muted-foreground font-light max-w-xl mx-auto">
              Unlock unlimited analysis, deep insights, and priority support for serious creators.
            </p>
          </div>

          {/* Pricing Cards */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Free Plan */}
            <div className="border border-border/50 rounded-2xl p-8 bg-card/50 flex flex-col">
              <div className="mb-6">
                <h3 className="text-base font-semibold text-muted-foreground mb-1 uppercase tracking-widest text-xs">Free</h3>
                <div className="flex items-baseline gap-1 mt-3">
                  <span className="text-5xl font-black tracking-tighter">$0</span>
                  <span className="text-muted-foreground">/month</span>
                </div>
                <p className="text-sm text-muted-foreground mt-2">Get started with core features. No card required.</p>
              </div>

              <ul className="space-y-3 mb-8 flex-1">
                {[
                  "5 analyses per month",
                  "Core virality score",
                  "Hook & pacing analysis",
                  "Caption suggestions",
                ].map((f) => (
                  <li key={f} className="flex items-center gap-3 text-sm text-muted-foreground">
                    <CheckCircle className="w-4 h-4 text-muted-foreground/40 shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>

              <Button variant="outline" className="w-full" disabled>
                Current Plan
              </Button>
            </div>

            {/* Pro Plan */}
            <div className="relative border-2 border-cyan-400/30 rounded-2xl p-8 bg-card/50 flex flex-col overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-400/5 via-transparent to-transparent pointer-events-none" />
              
              <div className="absolute -top-px left-8 right-8 h-px bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent" />
              
              <div className="absolute top-4 right-4 bg-cyan-400/10 text-cyan-400 px-3 py-1 rounded-full text-xs font-black border border-cyan-400/20 uppercase tracking-widest">
                Recommended
              </div>

              <div className="mb-6">
                <h3 className="text-base font-semibold text-cyan-400 mb-1 uppercase tracking-widest text-xs flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  Pro
                </h3>
                <div className="flex items-baseline gap-1 mt-3">
                  <span className="text-5xl font-black tracking-tighter">$9.99</span>
                  <span className="text-muted-foreground">/month</span>
                </div>
                <p className="text-sm text-muted-foreground mt-2">Everything you need to grow virally.</p>
              </div>

              <ul className="space-y-3 mb-8 flex-1">
                {[
                  { icon: Zap, text: "Unlimited AI analyses" },
                  { icon: Shield, text: "Deep transcript & audio analysis" },
                  { icon: Sparkles, text: "Visual timeline breakdown" },
                  { icon: CheckCircle, text: "Priority AI processing" },
                  { icon: CheckCircle, text: "Advanced analytics & history" },
                ].map(({ icon: Icon, text }) => (
                  <li key={text} className="flex items-center gap-3 text-sm font-medium">
                    <Icon className="w-4 h-4 text-cyan-400 shrink-0" />
                    {text}
                  </li>
                ))}
              </ul>

              <Button
                className="w-full h-12 font-bold gap-2 bg-cyan-500 hover:bg-cyan-400 text-black shadow-lg shadow-cyan-500/20 transition-all"
                size="lg"
                onClick={handleUpgrade}
                disabled={isProcessing || authLoading || subLoading}
              >
                {isProcessing ? "Processing..." : (
                  <>
                    {user ? "Upgrade to Pro" : "Get Started"}
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </Button>

              {!user && (
                <p className="text-xs text-center text-muted-foreground mt-3">
                  <Link href="/auth/login" className="underline hover:text-foreground transition-colors">Sign in</Link> to upgrade
                </p>
              )}
            </div>
          </div>

          {/* Stripe Coming Soon Banner (shown to logged-in users) */}
          {user && (
            <div className="rounded-2xl border border-sky-400/20 bg-sky-400/5 p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-sky-400/10 flex items-center justify-center border border-sky-400/20 shrink-0">
                <CreditCard className="w-6 h-6 text-sky-400" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-black text-sm uppercase tracking-widest text-sky-400">Stripe Payments — Coming Soon</h3>
                  <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-sky-400/60 border border-sky-400/20 px-2 py-0.5 rounded-full">
                    <Clock className="w-3 h-3" /> In Progress
                  </span>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  We're integrating <strong className="text-foreground">Stripe</strong> for secure, one-click payments. Once live, upgrading to Pro will take seconds — with full invoice support and easy cancellation.
                </p>
              </div>
              <div className="flex items-center gap-1.5 text-sky-400/50 shrink-0">
                <Lock className="w-3.5 h-3.5" />
                <span className="text-[10px] font-bold uppercase tracking-widest">Secure</span>
              </div>
            </div>
          )}

          {/* Footer Note */}
          {!user && (
            <div className="text-center text-sm text-muted-foreground">
              <p>This is a demo. No real payment is processed at this time.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
