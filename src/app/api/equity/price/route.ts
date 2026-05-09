import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth";
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();

export const GET = withAuth(async (req: NextRequest) => {
  const ticker = new URL(req.url).searchParams.get("ticker") ?? "CVS";

  try {
    const response = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 256,
      tools: [{ type: "web_search_20250305" as "web_search_20250305", name: "web_search" }],
      messages: [{
        role: "user",
        content: `What is the current stock price of ${ticker}? Respond ONLY with valid JSON: {"price": 87.45, "asOf": "May 8 2025"}. No other text.`,
      }],
    });

    const textBlock = response.content.find((b) => b.type === "text");
    if (textBlock && textBlock.type === "text") {
      const clean = textBlock.text.replace(/```[a-z]*/g, "").replace(/```/g, "").trim();
      const parsed = JSON.parse(clean);
      if (parsed.price && !isNaN(parsed.price)) {
        const price = parseFloat(parsed.price);
        if (price > 0 && price < 100000) {
          return NextResponse.json({ price, source: "live", asOf: parsed.asOf ?? null });
        }
      }
    }
  } catch {
    // fall through to fallback
  }

  return NextResponse.json({ price: 87.37, source: "fallback", asOf: null });
});
