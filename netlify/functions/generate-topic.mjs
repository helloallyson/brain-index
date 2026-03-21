const PROMPT_BASE = `You are helping build a personal encyclopedia for someone named Ally. Generate a JSON encyclopedia entry based on the input provided.

Respond with ONLY valid JSON (no markdown, no backticks, no preamble) in this exact format:
{
  "title": "Short catchy title (3-6 words)",
  "category": "Pick the best fit: Creative Projects, Web Dev, Content & Media, Writing, Personal Universe, Travel, Crafting, Entertainment, Personal, Wellness, History, Core Identity, Work, Productivity, Science & Curiosity, Gaming, Personal Growth, Random Curiosity, Food & Drink, Technology, Design, Money & Finance, Relationships, or Nature & Animals",
  "icon": "One emoji that fits",
  "description": "One sentence description (under 150 chars)",
  "fullContent": ["Paragraph 1 (3-4 sentences)", "Paragraph 2 (3-4 sentences)", "Paragraph 3 (3-4 sentences)"],
  "takeaways": ["Takeaway 1", "Takeaway 2", "Takeaway 3"],
  "details": ["Detail 1", "Detail 2", "Detail 3", "Detail 4"],
  "tags": ["Tag1", "Tag2", "Tag3", "Tag4"]
}

Write in a casual, warm, slightly humorous tone. No em-dashes.`;

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
    const { topic, url, image } = body;

    let messages;

    if (url) {
      // URL MODE: fetch the page and extract content
      console.log("Fetching URL:", url);
      let pageContent = "";
      try {
        const pageRes = await fetch(url, {
          headers: { "User-Agent": "Mozilla/5.0 (compatible; BrainIndex/1.0)" }
        });
        const html = await pageRes.text();
        // Strip HTML tags, scripts, styles to get text
        pageContent = html
          .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
          .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
          .replace(/<[^>]+>/g, " ")
          .replace(/\s+/g, " ")
          .trim()
          .slice(0, 8000); // Limit to avoid token overflow
      } catch (e) {
        console.error("Fetch error:", e.message);
        return new Response(JSON.stringify({ error: "Could not fetch that URL" }), {
          status: 400, headers: { "Content-Type": "application/json" }
        });
      }

      messages = [{
        role: "user",
        content: PROMPT_BASE + "\n\nHere is content extracted from a webpage (" + url + "):\n\n" + pageContent + "\n\nCreate an encyclopedia entry summarizing the key information from this page."
      }];

    } else if (image) {
      // IMAGE MODE: send image to Claude vision
      console.log("Processing image");
      const mediaType = image.startsWith("/9j/") ? "image/jpeg" : "image/png";

      messages = [{
        role: "user",
        content: [
          {
            type: "image",
            source: { type: "base64", media_type: mediaType, data: image }
          },
          {
            type: "text",
            text: PROMPT_BASE + "\n\nLook at this image. Identify what it shows and create an encyclopedia entry about it. If it's a product, explain what it is. If it's a place, describe it. If it's text/article, summarize it. If it's food, describe the dish. Whatever it is, make a great encyclopedia entry about it."
          }
        ]
      }];

    } else if (topic) {
      // TEXT MODE: original behavior
      console.log("Generating topic for:", topic);
      messages = [{
        role: "user",
        content: PROMPT_BASE + '\n\nTopic/Question: "' + topic + '"'
      }];

    } else {
      return new Response(JSON.stringify({ error: "No input provided" }), {
        status: 400, headers: { "Content-Type": "application/json" }
      });
    }

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
        messages: messages
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
