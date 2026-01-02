export {};

declare global {
  interface Window {
    YT?: YouTubeApi;
    onYouTubeIframeAPIReady?: () => void;
  }

  interface YouTubePlayer {
    destroy(): void;
    cueVideoById(videoId: string): void;
    loadVideoById(videoId: string): void;
    getVideoData?: () => { video_id?: string };
  }

  interface YouTubePlayerOptions {
    height?: string;
    width?: string;
    videoId?: string;
    playerVars?: Record<string, unknown>;
    events?: {
      onReady?: (event: { target: YouTubePlayer }) => void;
      onStateChange?: (event: { data: number; target?: YouTubePlayer }) => void;
      onError?: (event: { data: number }) => void;
    };
  }

  interface YouTubeApi {
    Player: new (
      elementId: string | HTMLElement,
      options: YouTubePlayerOptions,
    ) => YouTubePlayer;
  }
}
