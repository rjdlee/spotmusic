import Script from "next/script";
import PlaybackDashboard from "./components/PlaybackDashboard";
import { siteConfig, siteUrl } from "./lib/seo";

export default function Home() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: siteConfig.name,
    url: siteUrl,
    description: siteConfig.description,
    publisher: {
      "@type": "Organization",
      name: siteConfig.name,
    },
  };

  return (
    <>
      <h1 className="sr-only">Spotmusic AI Music DJ</h1>
      <PlaybackDashboard />
      <Script
        id="spotmusic-jsonld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </>
  );
}
