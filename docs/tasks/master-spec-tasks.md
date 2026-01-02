# 📌 Master Spec Task List

This tracker captures the MVP work items from `docs/specs/master-spec.md`, organized by concern with status and relevant notes so the team can monitor progress.

## 1. Bootstrap

| Task | Status | Notes |
| --- | --- | --- |
| Set up a new NextJS project. | Done | |
| Web UI (minimal): surface semantic context descriptors (e.g., “Evening walk, cloudy”) plus now playing/device info. | Not started | Use clean typography to keep UI attractive yet minimal. |
| Web UI (minimal): add Skip, Pause, and Refresh recommendation controls connected to playback hooks. | Not started | Match control styling to the rest of the experience. |
| Integrate the basic Youtube iFrame Player with API Player. | Done | Load the iFrame API script, initialize `YT.Player` with a placeholder video ID, and wire basic events (`onReady`, `onStateChange`) for playback status. |

## 2. Spotify Recommendations API (FUCKED - SPotify is locked down to new apps)

| Task | Status | Notes |
| --- | --- | --- |
| Build the request builder that converts LLM output into `GET /v1/recommendations` query parameters. | Not started | Keep query composition transparent for debugging. |
| Parse and store returned tracks for queue consumption. | Not started | Include metadata needed by playback controls. |

## 3. Youtube Search API

| Task | Status | Notes |
| --- | --- | --- |
| Spotify → YouTube mapping (search). | Not started | | (FUCKED)
| YouTube Data API search → video IDs. | Done | |

## 4. Context Gathering

| Task | Status | Notes |
| --- | --- | --- |
| Phase sensors in the prescribed order: 1) time of day, 2) location, 3) microphone (ambient noise), 4) camera (brightness/motion), 5) weather API. | Not started | Track phase completion so downstream code can rely on each signal. |
| Normalize raw signals into the semantic context object and store them in shared state, verifying updates as each phase completes. | Not started | Validation should show context evolves as phases go live. |
| Identify permissions prompts/user confirmations for microphone, camera, weather, and location access. | Not started | Document any required UX flow. |

## 5. Queue + Playback Control

| Task | Status | Notes |
| --- | --- | --- |
| Maintain a virtual queue of the next three tracks and post them via `POST /me/player/queue`. | Not started | Queue depth must stay at three for MVP feel. |
| Synchronize playback state every ~5 seconds via `GET /me/player/currently-playing`, updating UI and internal state. | Not started | Use this loop to refresh UI context as well. |
| Provide Skip, Play/Pause, and Refresh controls wired to the appropriate Youtube endpoints. | Not started | Buttons should call `POST /me/player/next`, `PUT /me/player/play`, `PUT /me/player/pause`, and trigger recommendation refresh. | (FUCKED)
| Trigger new recommendations when the queue drops below three tracks or context shifts. | Not started | Tie context shift detection to the shared state. |

## 6. Deterministic Pipeline for Evaluation

| Task | Status | Notes |
| --- | --- | --- |
| Create a deterministic pipeline where the user er parameters from the frontend to add songs to the queue. | Done | This lets us test without using an LLM yet. |

## 7. LLM Prompt & Output Schema (Gemini)

| Task | Status | Notes |
| --- | --- | --- |
| Template the prompt using normalized context so the LLM emits Youtube-friendly recommendation parameters. | Not started | Keep instructions aligned with semantic descriptors. |
| Enforce schema rules: at least one seed plus numeric targets within Youtube ranges, with clear MVP validation feedback. | Not started | Feedback should be immediate enough to guide retries. |
| Cache or fetch Youtube’s genre seed list (`GET /recommendations/available-genre-seeds`) to help the LLM pick valid seeds. | Not started | Refresh on demand or periodically as needed. |

## 8. Timers, Thresholds & Refresh Logic

| Task | Status | Notes |
| --- | --- | --- |
| Implement the ≈5-second polling loop that drives playback sync and queue refills. | Not started | Loop should be resilient to slow network responses. |
| Define context-shift thresholds (ambient noise, lighting, etc.) to trigger new LLM prompts. | Not started | Thresholds should be documented for future tuning. |
| Monitor queue depth and call the recommendation pipeline when tracks drop below the target count. | Not started | Keep the queue depth logic aligned with section 5 requirements. |
