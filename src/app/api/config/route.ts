import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    hasGeminiKey: Boolean(process.env.GEMINI_API_KEY),
    hasYouTubeKey: Boolean(process.env.YOUTUBE_API_KEY),
  });
}
