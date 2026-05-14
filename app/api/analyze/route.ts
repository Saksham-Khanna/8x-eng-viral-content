import { NextRequest, NextResponse } from "next/server"

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY
const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"

const ANALYSIS_PROMPT = `You are an expert social media strategist and viral content analyst with deep knowledge of TikTok, Instagram Reels, and YouTube Shorts algorithms.

Analyze this content and return ONLY a raw JSON object — no markdown, no code fences, no explanation. Your entire response must be valid JSON parseable by JSON.parse().

Return this exact structure:
{
  "viralityScore": <integer 0-100>,
  "scoreLabel": "<one of: Viral Ready|Strong Potential|Needs Work|Major Revamp Needed>",
  "breakdown": {
    "hookStrength": <0-100>,
    "pacing": <0-100>,
    "thumbnailRating": <0-100>,
    "captionOptimization": <0-100>,
    "emotionalAppeal": <0-100>,
    "trendAlignment": <0-100>
  },
  "hookAnalysis": {
    "rating": "<one of: Weak|Moderate|Strong|Exceptional>",
    "summary": "<2-3 sentence analysis of the opening hook and first impression>",
    "suggestions": ["<specific actionable suggestion>", "<specific actionable suggestion>", "<specific actionable suggestion>"]
  },
  "captionSuggestions": {
    "issues": ["<issue 1>", "<issue 2>", "<issue 3>"],
    "rewrittenCaption": "<optimized caption under 150 chars with emoji and CTA>",
    "hashtagRecommendations": ["#tag1", "#tag2", "#tag3", "#tag4", "#tag5"]
  },
  "trendingAudio": [
    {"name": "<trending audio name>", "uses": "<e.g. 2.1M>", "trend": "<one of: ↑ Hot|🔥 Peak|↑ Rising|→ Steady>"},
    {"name": "<trending audio name>", "uses": "<e.g. 890K>", "trend": "<trend label>"},
    {"name": "<trending audio name>", "uses": "<e.g. 4.3M>", "trend": "<trend label>"}
  ],
  "competitorInsights": "<2-3 sentences comparing content patterns of top performers in this niche vs this submission>",
  "actionPlan": ["<top priority action>", "<second priority action>", "<third priority action>", "<fourth priority action>"]
}`

export async function POST(req: NextRequest) {
  try {
    if (!OPENROUTER_API_KEY) {
      return NextResponse.json({ error: "OPENROUTER_API_KEY not configured" }, { status: 500 })
    }

    const body = await req.json()
    const { base64, mimeType, caption } = body

    if (!base64 || !mimeType) {
      return NextResponse.json({ error: "Missing base64 or mimeType" }, { status: 400 })
    }

    const prompt = caption
      ? `${ANALYSIS_PROMPT}\n\nCaption provided by creator: "${caption}"`
      : `${ANALYSIS_PROMPT}\n\nNo caption was provided — suggest one from scratch based on the content.`

    const openRouterBody = {
      model: "google/gemini-2.0-flash-001",
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: prompt },
            { 
              type: "image_url", 
              image_url: { 
                url: `data:${mimeType};base64,${base64}` 
              } 
            },
          ],
        },
      ],
      response_format: { type: "json_object" }
    }

    const res = await fetch(OPENROUTER_URL, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
        "HTTP-Referer": "https://goviral-analyzer.vercel.app", // Optional but good for OpenRouter
        "X-Title": "GoViral Analyzer"
      },
      body: JSON.stringify(openRouterBody),
    })

    if (!res.ok) {
      const status = res.status
      let errText = ""
      try {
        errText = await res.text()
      } catch (e) {
        errText = "Could not read error response"
      }
      
      console.error(`[analyze] OpenRouter error (${status}):`, errText)
      
      if (status === 429) {
        return NextResponse.json({ 
          error: "RATE_LIMIT_REACHED",
          message: "OpenRouter rate limit reached. Please try again in a few seconds." 
        }, { status: 429 })
      }

      if (status === 413) {
        return NextResponse.json({ 
          error: "PAYLOAD_TOO_LARGE",
          message: "The uploaded file is too large for the AI service. Please try a smaller or more compressed file." 
        }, { status: 413 })
      }

      // Return the actual error message from OpenRouter if possible
      let message = "The AI provider returned an error."
      try {
        const parsed = JSON.parse(errText)
        if (parsed.error?.message) message = parsed.error.message
      } catch (e) {
        // Not JSON, use short snippet of text
        if (errText.length > 0) message = errText.substring(0, 150)
      }
      
      return NextResponse.json({ 
        error: `AI Service Error (${status})`,
        message: message
      }, { status: 502 })
    }

    const data = await res.json()
    
    if (data.error) {
      console.error("[analyze] OpenRouter API reported error:", data.error)
      return NextResponse.json({ 
        error: "AI_PROVIDER_ERROR",
        message: data.error.message || "AI Service Error" 
      }, { status: 502 })
    }

    const rawText = data.choices?.[0]?.message?.content ?? ""
    
    if (!rawText) {
      console.error("[analyze] Empty response from OpenRouter:", data)
      return NextResponse.json({ error: "Empty response from AI service" }, { status: 502 })
    }

    // Robust JSON extraction
    let clean = rawText.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/m, "").trim()
    const start = clean.indexOf("{")
    const end = clean.lastIndexOf("}")
    if (start !== -1 && end !== -1) {
      clean = clean.slice(start, end + 1)
    }

    const result = JSON.parse(clean)
    return NextResponse.json(result)
  } catch (err) {
    console.error("[analyze] Error:", err)
    return NextResponse.json({ error: "Analysis failed. Please try again." }, { status: 500 })
  }
}
