const fallbackUrl = "https://spotmusic.ai";
const rawUrl = process.env.NEXT_PUBLIC_SITE_URL ?? fallbackUrl;

export const siteUrl = rawUrl.replace(/\/+$/, "");

export const siteConfig = {
  name: "Spotmusic",
  description:
    "Spotmusic is the AI Music DJ that builds adaptive mixes, reads the room, and keeps every session flowing.",
};
