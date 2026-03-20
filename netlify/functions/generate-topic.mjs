export default async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({ error: "API key not configured" }), {
      status: 500, headers: { "Content-Type": "application/json" }
    });
  }

  try {
    const body = await req.json();
    const topic = body.topic;
    if (!topic) {
      return new Response(JSON.stringify({ error: "No topic provided" }), {
        status: 400, headers: { "Content-Type": "application/json" }
      });
    }

    console.log("Generating topic for:", topic);

    const prompt = "You are helping build a personal encyclopedia for someone named Ally. She asked about the following topic or question. Generate a JSON encyclopedia entry for it.\n\nTopic/Question: \"" + topic + "\"\n\nRespond with ONLY valid JSON (no markdown, no backticks, no preamble) in this exact format:\n{\n  \"title\": \"Short catchy title (3-6 words)\",\n  \"category\": \"Pick the best fit: Creative Projects, Web Dev, Content & Media, Writing, Personal Universe, Travel, Crafting, Entertainment, Personal, Wellness, History, Core Identity, Work, Productivity, Science & Curiosity, Gaming, Personal Growth, or Random Curiosity\",\n  \"icon\": \"One emoji that fits\",\n  \"description\": \"One sentence description (under 150 chars)\",\n  \"fullContent\": [\"Paragraph 1 (3-4 sentences)\", \"Paragraph 2 (3-4 sentences)\", \"Paragraph 3 (3-4 sentences)\"],\n  \"takeaways\": [\"Takeaway 1\", \"Takeaway 2\", \"Takeaway 3\"],\n  \"details\": [\"Detail 1\", \"Detail 2\", \"Detail 3\", \"Detail 4\"],\n  \"tags\": [\"Tag1\", \"Tag2\", \"Tag3\", \"Tag4\"]\n}\n\nWrite in a casual, warm, slightly humorous tone. No em-dashes.";

    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1000,
        messages: [{ role: "user", content: prompt }]
      })
    });

    const data = await res.json();
    console.log("API response status:", res.status);

    if (!res.ok) {
      console.log("API error:", JSON.stringify(data));
      return new Response(JSON.stringify({ error: "API error", details: data }), {
        status: 500, headers: { "Content-Type": "application/json" }
      });
    }

    const text = data.content.map(i => i.text || "").join("\n");
    const clean = text.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(clean);

    return new Response(JSON.stringify(parsed), {
      status: 200, headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Error:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { "Content-Type": "application/json" }
    });
  }
};
