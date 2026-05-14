# AI Development Log — GoViral: AI Content Virality Analyzer
> Tool: Claude (claude.ai)
> Project: 8x Social Challenge — Go Viral Clone
> Date: May 2026

---

## Prompt

I want to build a web app that lets creators upload a video or image and get an AI-powered virality score. The reference app is "Go Viral: AI Creator Assistant" with 59M+ views. Key features needed:
- Video or image upload
- Virality score 0-100 with breakdown
- Hook analysis (first 3 seconds)
- Caption optimization suggestions
- Competitor content comparison
- Trending audio/hashtag recommendations

What's the best AI model to use for video analysis, and what's the overall architecture I should go with?

## Response

For video and image analysis, **Gemini 1.5 Pro or Gemini 2.0 Flash** is the strongest choice here — it supports native multimodal input, meaning you can pass the raw video file directly to the API without any transcription step. This is critical for hook analysis (you actually need the model to "watch" the first 3 seconds) and thumbnail/visual scoring.

Recommended architecture:
- **Frontend**: React SPA — fast to build, easy to demo
- **AI layer**: Google Gemini 2.0 Flash via REST API (multimodal, generous free tier)
- **No backend needed** for MVP — call Gemini directly from the browser with a prompt that asks for structured JSON output

The key insight is that Gemini can receive a base64-encoded video file and analyze motion, pacing, visual composition, and text overlays all in a single API call. GPT-4o has vision but weaker video support. Claude is strong on text but doesn't process raw video. Gemini wins for this use case.

For the prompt design, ask Gemini to return a strict JSON schema so you can map the output directly to UI components — score, breakdown object, hook analysis, caption suggestions, etc.

---

## Prompt

Great. Now help me design the data schema for what Gemini should return. I need it to power: a score ring, breakdown bars for 6 sub-scores, hook analysis with suggestions, caption rewrite, hashtag list, trending audio recommendations, and competitor insights. Make the JSON schema explicit so I can use it in my prompt.

## Response

Here's the schema to use in your Gemini prompt:

```json
{
  "viralityScore": "<integer 0-100>",
  "breakdown": {
    "hookStrength": "<0-100>",
    "pacing": "<0-100>",
    "thumbnailRating": "<0-100>",
    "captionOptimization": "<0-100>",
    "emotionalAppeal": "<0-100>",
    "trendAlignment": "<0-100>"
  },
  "hookAnalysis": {
    "rating": "<Weak|Moderate|Strong|Exceptional>",
    "summary": "<2-3 sentence analysis>",
    "suggestions": ["<suggestion 1>", "<suggestion 2>", "<suggestion 3>"]
  },
  "captionSuggestions": {
    "issues": ["<issue 1>", "<issue 2>", "<issue 3>"],
    "rewrittenCaption": "<optimized caption under 150 chars>",
    "hashtagRecommendations": ["#tag1", "#tag2", "#tag3", "#tag4", "#tag5"]
  },
  "trendingAudio": [
    {"name": "<audio name>", "uses": "<e.g. 1.2M>", "trend": "<↑ Hot|🔥 Peak|↑ Rising>"}
  ],
  "competitorInsights": "<2-3 sentences>",
  "actionPlan": ["<action 1>", "<action 2>", "<action 3>", "<action 4>"]
}
```

Include this in your system prompt and tell the model: "Return ONLY a JSON object. No markdown fences, no preamble, no explanation." Then wrap the parse in try/catch since LLMs occasionally slip a backtick in.

---

## Prompt

How do I convert a user-uploaded File object to base64 in React so I can send it to the Gemini API? And what does the actual fetch call look like for a multimodal request with an image or video file?

## Response

Use a FileReader wrapped in a Promise:

```javascript
const toBase64 = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(",")[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
```

Then the Gemini fetch:

```javascript
const base64 = await toBase64(file);

const response = await fetch(
  `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${API_KEY}`,
  {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{
        parts: [
          { inline_data: { mime_type: file.type, data: base64 } },
          { text: YOUR_PROMPT }
        ]
      }],
      generationConfig: { temperature: 0.7, maxOutputTokens: 1500 }
    })
  }
);

const data = await response.json();
const text = data.candidates[0].content.parts[0].text;
const result = JSON.parse(text.replace(/```json|```/g, "").trim());
```

One thing to watch: `file.type` must be a valid MIME type Gemini accepts. For video: `video/mp4`, `video/quicktime`. For images: `image/jpeg`, `image/png`, `image/webp`. Gemini will error on unsupported types, so you may want to validate before sending.

---

## Prompt

Build me the upload component. I want drag-and-drop support, a file input fallback, a preview that shows the video or image after selection, and a caption textarea below it. Use React hooks. Keep it clean.

## Response

```jsx
function UploadZone({ onFile }) {
  const [preview, setPreview] = useState(null);
  const [file, setFile] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [caption, setCaption] = useState("");
  const fileRef = useRef();

  const handleFile = (f) => {
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  return (
    <div>
      <div
        onClick={() => fileRef.current.click()}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files[0]); }}
        style={{
          border: `2px dashed ${dragOver ? "#000" : "#ccc"}`,
          borderRadius: 12,
          padding: "2rem",
          cursor: "pointer",
          textAlign: "center",
          background: dragOver ? "#f5f5f5" : "transparent"
        }}
      >
        {preview ? (
          file.type.startsWith("video/")
            ? <video src={preview} controls muted style={{ maxWidth: "100%", maxHeight: 220, borderRadius: 8 }} />
            : <img src={preview} style={{ maxWidth: "100%", maxHeight: 220, borderRadius: 8, objectFit: "cover" }} />
        ) : (
          <p>Drop video or image here, or click to browse</p>
        )}
      </div>
      <input ref={fileRef} type="file" accept="video/*,image/*" style={{ display: "none" }}
        onChange={(e) => handleFile(e.target.files[0])} />
      <textarea
        value={caption}
        onChange={(e) => setCaption(e.target.value)}
        placeholder="Paste your caption here (optional)..."
        rows={3}
        style={{ width: "100%", marginTop: 12, padding: "10px 12px", borderRadius: 8, fontSize: 14, border: "1px solid #ddd", resize: "vertical" }}
      />
      <button onClick={() => onFile(file, caption)} disabled={!file}
        style={{ marginTop: 12, width: "100%", padding: 12, background: "#000", color: "#fff", border: "none", borderRadius: 8, fontSize: 15, fontWeight: 600, cursor: "pointer" }}>
        Analyze Viral Potential
      </button>
    </div>
  );
}
```

This handles the drag, drop, click-to-browse, and preview in one component. Pass `onFile` as a callback to trigger the Gemini call from the parent.

---

## Prompt

Now build the score display components. I need: (1) an animated SVG ring that fills up to the score value, colored green/amber/red based on the score. (2) horizontal progress bars for each of the 6 breakdown scores with label and number. Make them animate in when the result loads.

## Response

**Score Ring:**

```jsx
function ScoreRing({ score, size = 120, stroke = 12 }) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  const color = score >= 75 ? "#22c55e" : score >= 50 ? "#f59e0b" : "#ef4444";

  return (
    <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#e5e7eb" strokeWidth={stroke} />
      <circle
        cx={size/2} cy={size/2} r={r} fill="none"
        stroke={color} strokeWidth={stroke}
        strokeDasharray={circ}
        strokeDashoffset={offset}
        strokeLinecap="round"
        style={{ transition: "stroke-dashoffset 1.2s cubic-bezier(0.4,0,0.2,1)" }}
      />
      <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle"
        style={{ transform: "rotate(90deg)", transformOrigin: "50% 50%", fontSize: size * 0.22, fontWeight: 700, fill: color }}>
        {score}
      </text>
    </svg>
  );
}
```

The CSS transition on `strokeDashoffset` handles the animation automatically when the component mounts with the score value.

**Breakdown Bar:**

```jsx
function MiniBar({ label, value }) {
  const color = value >= 75 ? "#22c55e" : value >= 50 ? "#f59e0b" : "#ef4444";
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 4, color: "#666" }}>
        <span>{label}</span>
        <span style={{ fontWeight: 600, color }}>{value}</span>
      </div>
      <div style={{ height: 6, borderRadius: 99, background: "#f0f0f0", overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${value}%`, background: color, borderRadius: 99, transition: "width 1s ease" }} />
      </div>
    </div>
  );
}
```

Use it like: `<MiniBar label="Hook Strength" value={result.breakdown.hookStrength} />`

---

## Prompt

The JSON parse is failing sometimes when Gemini returns markdown code fences around the JSON even though I told it not to. How do I make the parse more robust?

## Response

This is a common issue — even with explicit instructions, models sometimes wrap output in backticks. A few layers of defense:

```javascript
function safeParseGeminiJSON(text) {
  // Strip markdown fences (```json ... ``` or ``` ... ```)
  let clean = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
  
  // If there's still a leading/trailing fence, strip again
  clean = clean.replace(/```/g, "").trim();
  
  // Find the first { and last } in case there's stray text
  const start = clean.indexOf("{");
  const end = clean.lastIndexOf("}");
  if (start !== -1 && end !== -1) {
    clean = clean.slice(start, end + 1);
  }
  
  return JSON.parse(clean);
}
```

Wrap in try/catch and fall back to showing an error state if parsing still fails. Also bump your prompt to say: "Respond with raw JSON only. Do not use markdown. Do not use code fences. Your entire response must be parseable by JSON.parse()."

---

## Prompt

I need a demo mode for when there's no API key — so I can show the full UI during the Loom walkthrough without making live API calls. Add a mock result object and a toggle to use it. The mock data should look realistic.

## Response

Add a `MOCK_RESULT` constant at the top of your file:

```javascript
const MOCK_RESULT = {
  viralityScore: 73,
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
    summary: "Your opening 3 seconds creates curiosity with a bold visual statement. The text overlay appears quickly, but the transition feels slightly rushed — viewers may not register your core message before scrolling.",
    suggestions: [
      "Start with a face close-up or reaction shot to trigger mirror neurons",
      "Add a pattern interrupt — an unexpected sound or color flash in frame 1",
      "Put your boldest claim or number in the first 2 seconds as on-screen text",
    ],
  },
  captionSuggestions: {
    issues: [
      "Too long — TikTok captions over 150 chars get truncated",
      "No question to drive comments",
      "Missing a CTA above the fold",
    ],
    rewrittenCaption: "POV: I tested every viral trick for 30 days 👀 The results shocked me. Which one would you try first? 👇",
    hashtagRecommendations: ["#viral", "#contentcreator", "#growthhacks", "#fyp", "#socialmediatips"],
  },
  trendingAudio: [
    { name: "original sound - lowkey.wav", uses: "2.1M", trend: "↑ Hot" },
    { name: "bad idea right? - Olivia Rodrigo", uses: "890K", trend: "↑ Rising" },
    { name: "Luther - Kendrick Lamar", uses: "4.3M", trend: "🔥 Peak" },
  ],
  competitorInsights: "Top performing content in your niche averages 8-12 cuts per minute with 2-3 text overlays. Your video has 4 cuts/min — consider faster pacing to match viewer expectations. Competitors consistently use duet/stitch formats for 40% higher engagement.",
  actionPlan: [
    "Re-cut your hook to lead with the most surprising moment",
    "Add trending audio from the list below to 3x your distribution reach",
    "Shorten caption and add a question to drive comment engagement",
    "Test a split-screen or reaction format for your next post",
  ],
};
```

Then in your analyze function:

```javascript
const analyze = async () => {
  setLoading(true);
  try {
    if (useMock || API_KEY === "YOUR_KEY_HERE") {
      await new Promise(r => setTimeout(r, 2200)); // simulate loading
      setResult(MOCK_RESULT);
    } else {
      const data = await analyzeWithGemini(file, caption);
      setResult(data);
    }
  } catch (e) {
    setError(e.message);
  } finally {
    setLoading(false);
  }
};
```

Add a checkbox in your header: `<input type="checkbox" checked={useMock} onChange={e => setUseMock(e.target.checked)} /> Demo mode`

---

## Prompt

The results layout needs polishing. Right now everything is in one column and looks cramped. How should I structure the results page? I have: score ring + breakdown, hook analysis, caption suggestions, trending audio, competitor insights, action plan.

## Response

Use a two-column CSS grid with `repeat(auto-fit, minmax(260px, 1fr))` so it collapses to single column on mobile. Group the sections like this:

**Full width (top):**
- Score hero card: ring on the left, breakdown bars on the right (flexbox with `flex-wrap: wrap`)

**Two-column grid (middle):**
- Left: Hook Analysis card
- Right: Caption Optimization card

**Two-column grid (bottom):**
- Left: Trending Audio card
- Right: Competitor Insights + Action Plan card

**Full width (bottom, conditional):**
- Content preview (your uploaded video/image)

```jsx
{/* Score hero - full width */}
<Card style={{ display: "flex", alignItems: "center", gap: "2rem", flexWrap: "wrap", marginBottom: "1rem" }}>
  <ScoreRing score={result.viralityScore} size={130} stroke={12} />
  <div style={{ flex: 1, minWidth: 220 }}>
    {Object.entries(result.breakdown).map(([k, v]) => (
      <MiniBar key={k} label={k.replace(/([A-Z])/g, " $1")} value={v} />
    ))}
  </div>
</Card>

{/* Two column grids */}
<div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "1rem", marginBottom: "1rem" }}>
  <HookAnalysisCard data={result.hookAnalysis} />
  <CaptionCard data={result.captionSuggestions} />
</div>

<div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "1rem" }}>
  <TrendingAudioCard data={result.trendingAudio} />
  <CompetitorCard insights={result.competitorInsights} plan={result.actionPlan} />
</div>
```

This layout hits both desktop (2 columns) and mobile (1 column) without any media queries.

---

## Prompt

Final check — what are the most likely reasons a judge would dock points on this submission, and what should I fix before submitting?

## Response

Most likely deductions and fixes:

**1. API key exposed in source code** — If you hardcode the Gemini key and push to GitHub, it's public. Either use an environment variable (`import.meta.env.VITE_GEMINI_KEY`) or make sure demo mode works without a key, and document in README that users bring their own key.

**2. No loading state feedback** — If the API call takes 5-8 seconds and there's no spinner or progress message, judges will think the app is broken. Add a visible loading indicator with a message like "Gemini is analyzing your content..."

**3. Error handling is silent** — If the API fails, show a visible error message. Judges will test edge cases.

**4. No mobile layout** — The scoring criteria mentions UX clarity. Test on a narrow viewport and make sure nothing overflows. The `auto-fit` grid helps but check text truncation on cards.

**5. Caption in results doesn't show if no caption was provided** — Either hide the caption issues section or show a default message like "No caption provided — here's what we'd suggest for this content."

**6. README doesn't explain setup** — Add a short section: "1. Get a Gemini API key at aistudio.google.com. 2. Add it to the top of App.jsx. 3. npm install && npm run dev."

**7. AI logs missing** — Create `/ai-logs/build-log.md` with your development conversation. Judges actively check this folder.

Fix items 1, 2, and 3 before anything else — they're functional gaps that will be visible in the Loom walkthrough.

---
