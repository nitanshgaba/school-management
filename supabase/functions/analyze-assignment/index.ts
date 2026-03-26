const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, content-type",
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }
  try {
    const { text } = await req.json()
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + (Deno.env.get("GROQ_API_KEY") || ""),
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        max_tokens: 1000,
        messages: [
          {
            role: "system",
            content: "You are an academic evaluator. Analyze the student assignment and respond ONLY with a valid JSON object, no markdown, no explanation. JSON format: {score: number 0-100, summary: string, strengths: [string, string, string], weaknesses: [string, string, string], suggestions: [string, string, string]}"
          },
          {
            role: "user",
            content: "Analyze this student assignment:\n\n" + text.slice(0, 8000)
          }
        ]
      })
    })
    const data = await response.json()
    console.log("Groq response:", JSON.stringify(data))
    const raw = data.choices?.[0]?.message?.content || "{}"
    const clean = raw.replace(/```json|```/g, "").trim()
    return new Response(clean, { headers: { ...corsHeaders, "Content-Type": "application/json" } })
  } catch(e) {
    console.error("Error:", e.message)
    return new Response(JSON.stringify({ error: e.message }), { headers: { ...corsHeaders, "Content-Type": "application/json" } })
  }
})
