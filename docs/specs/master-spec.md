# 📌 **Overall MVP Spec — Spotify-Powered Recommendations + YouTube IFrame Playback**

## 🎯 **Goal**

Build a web application that:

* **Gathers device context** (mic, camera, time, weather, location),
* **Uses an LLM to translate context into Spotify recommendation parameters**,
* **Fetches Spotify recommendations**,
* **Maps recommended tracks to YouTube videos**,
* **Plays back music using YouTube’s IFrame Player API**, with programmatic queueing and control,
* **Maintains a short queue and adapts playback based on context changes**.

Spotify provides the data backbone (search, recommendations, audio features) and YouTube provides the playback engine.

---

## 🧠 **Architecture Overview**

```
[Sensors + Time + Weather + Location]
            ↓
     Context Normalizer
            ↓
      Prompt Builder → LLM
            ↓
   Structured Spotify Params
            ↓
   Spotify Recommendations API
            ↓
  Recommended Track Metadata
            ↓
Spotify → YouTube Mapping (search)
            ↓
 YouTube Data API search → video IDs
            ↓
   YouTube IFrame Player (queue + control)
            ↓
Playback Control + Polling Loop
```

---

## 📌 **1) Context Gathering**

Your app collects:

* **Microphone features** (ambient volume, detected activity),
* **Camera features** (brightness or motion — optional & opt-in),
* **Time of day** (morning, afternoon, night),
* **Weather** (via external weather API),
* **Location** (to contextualize environment).

### ⏰ Time of Day Sensor

* Derive local time from the user agent (device clock + timezone offset) so the sensor works offline or when other APIs are restricted.
* Normalize the raw timestamp into semantic buckets (e.g., dawn, morning, midday, afternoon, evening, night) using configurable cutoff hours.
* Emit a descriptor like “late evening” or “early afternoon” that feeds into the context normalizer alongside other signals.
* Flag significant transitions (e.g., day → night) to trigger a context refresh without waiting for other sensors.

### 🎙️ Microphone Sensor

* Request microphone permission on demand and clearly explain why the signal is needed; handle denial with a quiet fallback path.
* Use the Web Audio API (`getUserMedia` + `AudioContext`) to sample ambient volume without storing or transmitting raw audio.
* Compute lightweight features like RMS volume and optional noise classification (quiet, moderate, loud) over rolling windows.
* Emit a descriptor such as “noisy cafe” or “quiet room” and surface significant shifts to the context normalizer.

These signals are normalized into semantic descriptors (e.g., “evening walk, cool and cloudy, slightly noisy environment”).

---

## 🧠 **2) LLM Prompt & Schema for Recommendation Params**

Craft an LLM prompt that accepts the normalized context and outputs **only structured Spotify recommendation parameters**, matching Spotify’s recommendation API schema:

```json
{
  "seed_genres": ["..."],
  "seed_artists": ["..."],
  "seed_tracks": ["..."],
  "target_energy": 0.0–1.0,
  "target_valence": 0.0–1.0,
  "target_tempo": number
}
```

This ensures the LLM focuses on producing valid, **bounded recommendation parameters** suited for calls to:

```
GET /v1/recommendations?
  seed_artists=...&
  seed_genres=...&
  seed_tracks=...&
  target_energy=...&
  target_valence=...&
  target_tempo=...
```

Spotify’s Recommendations endpoint returns a set of tracks based on those parameters. ([Spotify for Developers][1])

---

## 📡 **3) Spotify Recommendations API Usage**

* Use OAuth with the required scopes to call Spotify’s Recommendations API.
* Supply the structured parameters produced by the LLM.
* Store the returned list of recommended tracks (track metadata and artists).

---

## 🔄 **4) Mapping Spotify Tracks to YouTube Video IDs**

Since direct playback via Spotify isn’t available, you must **resolve each recommended Spotify track into a corresponding YouTube video** (typically a music video or audio-only upload) using the **YouTube Data API** search:

```
GET https://www.googleapis.com/youtube/v3/search
  ?part=snippet
  &q=<artist + track name>
  &type=video
  &key=<YOUR_API_KEY>
```

YouTube’s search API returns results including the video IDs you need to play music via the IFrame Player. The `q` parameter may combine artist and title to narrow results. ([Google for Developers][2])

* Select the most relevant result from the search response for each track.
* Collect those video IDs to use with the YouTube IFrame Player API.

---

## ▶️ **5) YouTube IFrame Player Playback**

Embed and control the YouTube player DOM element using the IFrame Player API:

```html
<script src="https://www.youtube.com/iframe_api"></script>
<div id="player"></div>
```

Once loaded, instantiate a `YT.Player` to control playback. The IFrame API allows you to:

* **Load and cue individual videos or playlists**,
* **Play, pause, stop**, etc.,
* **Listen for state changes** such as video end to trigger queue advances. ([Google for Developers][3])

### **Queueing**

You can queue multiple video IDs using the playlist methods:

* `loadPlaylist({ list: [...videoIds], index: 0 })`
* `cuePlaylist({ list: [...videoIds], index: 0 })`

This loads a list of video IDs in the order they should play. Note that some developers have reported edge cases with playlist functions sometimes requiring careful handling due to inconsistent behavior in some browsers. ([Stack Overflow][4])

---

## 🎵 **6) Queue + Playback Control Logic**

Maintain a short virtual queue of video IDs:

* Insert the first **N** YouTube video IDs into the player via `loadPlaylist`.
* Listen for `onStateChange` events to detect when a video ends.
* When nearing the end of the queue or when context significantly changes, regenerate recommendations and refill the queue.

Supported controls:

* `player.playVideo()` —
* `player.pauseVideo()` —
* `player.nextVideo()` — skip forward in the playlist.
* `player.seekTo()` — skip within a video.
* Event listener for state changes to trigger queue management. ([Google for Developers][3])

---

## 📋 **7) UI Requirements (Minimal MVP)**

A simplified interface with:

* **Login** via Spotify OAuth,
* **Now Playing** display (current song and video),
* **Controls:** Play/Pause, Skip Next,
* **Context status** indicators (current inferred context),
* Option to **refresh recommendations** manually,
* Optional **fallback UI** if no matching YouTube results.

---

## 🔁 **8) Sync & Adaptive Loop**

Every ~5 seconds or on state changes:

* Poll playback state via the IFrame API (use events where possible),
* If queue is low or context changed, **trigger the LLM pipeline** again:

  1. Generate new recommendation parameters,
  2. Fetch new recommended tracks from Spotify,
  3. Resolve them to YouTube video IDs,
  4. Update the YouTube player’s queue.

This keeps playback adapted to real-time context.

---

## 🚫 **9) Limitations & Fallbacks**

* YouTube search results can vary and may not always perfectly match the audio you want; fuzzy matching logic or multiple search passes can help improve accuracy.
* The YouTube Data API has quotas; caching search results or limiting requests conserves quota.
* The IFrame API may have some inconsistencies with playlist control — you may need logic to recover from `cuePlaylist`/`loadPlaylist` edge cases. ([Stack Overflow][4])

## 🔄 **11) Acceptance Criteria**

The MVP is successful when:

* A user logs in with Spotify, authorizes data use,
* Context is gathered and fed to the LLM,
* Valid Spotify recommendation parameters are produced,
* YouTube video IDs matching Spotify tracks are found for playback,
* The YouTube IFrame player plays queued songs,
* Playback reacts to context changes via the adaptive pipeline.
