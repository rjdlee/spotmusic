# Context-Adaptive Playback Explorer

An experimental Next.js app that explores context-aware music playback. It collects user signals (time of day, mood, location, energy, etc.), sends them to Gemini to generate YouTube search parameters, and plays back results via the YouTube IFrame API. The goal is to prototype how generative models can steer discovery and queue management in a music experience.

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```
2. Create a `.env.local` file with the required API keys:
   ```bash
   GEMINI_API_KEY=your_key_here
   YOUTUBE_API_KEY=your_key_here
   NEXT_PUBLIC_SITE_URL=https://your-domain.com
   ```
3. Start the dev server:
   ```bash
   npm run dev
   ```
4. Visit `http://localhost:3000`.

## Tech Stack

* Next.js 14 + React 18 (App Router)
* TypeScript
* Tailwind CSS
* @google/genai (Gemini)
* YouTube Data API + IFrame Player API
* TanStack Query + Radix UI (supporting UI/async state)

## Demo

[/Users/richardlee/src/spotmusic/docs/product-screenshot.png](/Users/richardlee/src/spotmusic/docs/product-screenshot.png)