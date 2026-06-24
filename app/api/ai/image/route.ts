import OpenAI from "openai";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  const body = await request.json() as { prompt?: string };
  if (!body.prompt || body.prompt.length > 4000) return NextResponse.json({ ok: false, error: "A valid prompt is required." }, { status: 400 });
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({ ok: true, data: { mode: "mock", prompt: body.prompt, message: "Image generation is ready when OPENAI_API_KEY is configured." } });
  }
  try {
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const result = await client.images.generate({ model: "gpt-image-1", prompt: body.prompt, size: "1024x1024" });
    return NextResponse.json({ ok: true, data: { mode: "live", imageBase64: result.data?.[0]?.b64_json } });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Image generation failed" }, { status: 502 });
  }
}
