import { NextRequest, NextResponse } from "next/server"

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY
const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"

const ANALYSIS_PROMPT = `You are an expert social media strategist and viral content analyst for platforms like TikTok, Instagram Reels, and YouTube Shorts.
Analyze this content and return ONLY a raw JSON object — no markdown, no code fences, no explanation. Your entire response must be valid JSON parseable by JSON.parse().

Include these fields:
1. "score": number (0-100)
2. "breakdown": { "hook": number, "pacing": number, "visuals": number, "emotionalAppeal": number }
3. "hookAnalysis": { "rating": string, "feedback": string }
4. "actionPlan": string[] (3-4 specific steps)
5. "captionSuggestions": { "hook": string, "body": string, "hashtags": string[] }
6. "transcriptAnalysis": { "strengths": string[], "improvements": string[] }
7. "timeline": { "timestamp": string, "description": string, "impact": "positive" | "negative" }[] (2-3 key moments)

Be critical but constructive. Focus on what makes content go viral: high retention, emotional resonance, and clear value or entertainment.`

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
        "HTTP-Referer": "https://goviral-analyzer.vercel.app",
        "X-Title": "Viral Analyzer"
      },
      body: JSON.stringify(openRouterBody)
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

      let message = "The AI provider returned an error."
      try {
        const parsed = JSON.parse(errText)
        if (parsed.error?.message) message = parsed.error.message
      } catch (e) {
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
    console.log("[analyze] Raw Response:", rawText)

    let clean = rawText.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/m, "").trim()
    const start = clean.indexOf("{")
    const end = clean.lastIndexOf("}")
    if (start !== -1 && end !== -1) {
      clean = clean.slice(start, end + 1)
    }

    try {
      const result = JSON.parse(clean)
      return NextResponse.json(result)
    } catch (parseErr) {
      console.error("[analyze] JSON Parse Error:", parseErr, "Cleaned Text:", clean)
      return NextResponse.json({ error: "Failed to parse AI response. The model might not have followed the JSON format." }, { status: 500 })
    }
  } catch (err) {
    console.error("[analyze] Error:", err)
    return NextResponse.json({ error: "Analysis failed. Please try again." }, { status: 500 })
  }
}
