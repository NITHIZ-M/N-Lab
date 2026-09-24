# Feature Gap Analysis & Free/Offline Library Guide
**For: your Kotlin media-toolkit app (Image · PDF · Audio · Video)**
**Scope:** what's likely missing, what would make it "complete," and exactly which free, offline-capable libraries to add and how to wire them in.

Everything recommended below is **free, works fully offline, and has no per-use/API-key cost**. Where a library has GPL/AGPL terms that affect distribution, that's flagged explicitly so you can decide before adding it.

---

## PART 1 — DEEP-DIVE AUDIT FRAMEWORK (do this first)

Before adding anything, have the Gemini agent answer these about your **current** code, so recommendations map onto reality instead of guesswork:

1. **Image module:** Which operations exist today (to-PDF, resize, crop, rotate, compress, filters)? What decodes bitmaps — platform `BitmapFactory` or a library? Any EXIF handling? Any memory issues on large images (>20MP)?
2. **PDF module:** Is a library already used (iText? PdfBox? Android's own `PdfDocument`/`PdfRenderer`)? Can it merge/split/rotate/compress, or only render?
3. **Audio module:** What backs it — `MediaRecorder`/`MediaCodec`, or a wrapper library? Can it trim, mix, or only play/record?
4. **Video module:** **Critical — check this first.** If it uses `FFmpegKit` (`com.arthenica:ffmpeg-kit-*`), note that **FFmpegKit was officially retired on Jan 6, 2025, and its binaries were pulled from Maven Central on Apr 1, 2025** — the dependency can no longer be resolved for new builds. If your project still references it, it's either already broken or pinned to a stale cached artifact. This is the single most urgent thing to fix (see Part 3.4).
5. **Cross-cutting:** Is there a shared file-picking layer? A shared history/DB? Any background-processing (WorkManager/Service) for long jobs, or does everything run on the UI thread / plain coroutine tied to the Activity (which dies on rotation/backgrounding)?

Have the agent produce a short table: *Feature → Current implementation → Library used → Works offline? → Risk*. Everything below builds on that table.

---

## PART 2 — WHAT A "COMPLETE" VERSION NEEDS (gap analysis)

Most single-purpose PDF/image/audio/video apps stop at "convert and export." What turns yours into a genuinely complete, sticky, professional toolkit is (a) **cross-family workflows** most apps don't offer since they're single-purpose, and (b) **finishing details** users expect from any serious tool. Grouped by category:

### 2.1 Image tools — likely missing
- **Batch processing** — apply one operation (compress/resize/watermark) to many images at once with one progress bar, not one-by-one.
- **OCR (image/PDF → editable text)** — huge differentiator, and fully free/offline via ML Kit (Part 3.2).
- **Document scanner mode** — auto-detect page edges, perspective-correct, and produce a clean scanned PDF from a camera shot (ML Kit Document Scanner does this out of the box).
- **Background removal** — on-device via ML Kit Selfie Segmentation (people) — full image-subject segmentation needs a custom TFLite model (optional, heavier).
- **Collage / multi-image grid maker.**
- **EXIF viewer/stripper** — privacy feature (remove GPS/location before sharing).
- **Format conversion both ways** — HEIC→JPG is commonly missing (Android's built-in `BitmapFactory` on API 28+ decodes HEIC natively; encoding back to HEIC needs `HeifWriter`).

### 2.2 PDF tools — likely missing
- **OCR a scanned PDF → searchable PDF** (text layer overlay).
- **Fill PDF forms** (AcroForm field filling) — common enterprise ask.
- **Redaction** (true redaction = remove content, not just draw a black box) — a real gap in most free PDF apps.
- **Compare two PDFs** (page-by-page visual diff).
- **PDF → editable text/Markdown extraction** for reuse.
- **Bookmarks/outline editor.**
- **e-Signature capture drawn on a canvas** (you already have this per the reference screenshots — extend to placing it at a tapped position on a page, not just an overlay).

### 2.3 Audio tools — likely missing
- **Waveform visualizer with tap-to-trim** — most "audio trim" tools without a waveform feel broken to users.
- **Noise reduction / normalize volume.**
- **Format conversion** (M4A/AAC/OGG/WAV/MP3) — needs a decoder set (Part 3.4).
- **Silence auto-detection/trim** (great for voice notes).
- **Text-to-speech export** and **Speech-to-text transcription** — both free & fully offline via Android's built-in TTS engine and ML Kit / on-device speech.
- **Ringtone/notification-sound export shortcut** (`RingtoneManager`).

### 2.4 Video tools — likely missing
- **Waveform + timeline scrubbing UI** for trim (Media3 `Transformer` handles the encode; you build the UI).
- **Frame-accurate thumbnail filmstrip** for the trim UI (`MediaMetadataRetriever.getFrameAtTime`).
- **Extract frame as image / GIF export.**
- **Watermark/text overlay on video** (Media3 Transformer supports custom `Effect`s including overlays).
- **Speed ramp / reverse** (Transformer effects).
- **Subtitle burn-in** from an `.srt` file.
- **Audio replace/mute track.**

### 2.5 Cross-cutting features that make it feel "complete"
- **Unified "Quick Start": drop any file → app detects type → suggests the right tools** (you already planned this).
- **Universal in-app file/document viewer** (open any output immediately without leaving the app) — you already have FileVault as a separate project; consider whether a lightweight viewer belongs here too, or stays a hand-off to FileVault.
- **Batch queue** — chain operations (e.g., "compress these 5 images → merge into 1 PDF" in one queue) instead of forcing single-step round-trips.
- **Widgets / App Shortcuts / Quick Settings Tile** — long-press app icon → "New Scan", "Merge PDF" static shortcuts; a Quick Settings tile for "Quick Scan."
- **Share-target integration** — appear in Android's share sheet so other apps can send files straight into your tools (you likely have some of this already; extend it to every tool, not just import).
- **Cloud-free backup/export bundle** — "Export all history as a zip" for users who want a manual backup (still offline — no server).
- **Search across processed files' content** — e.g., search PDF text extracted via OCR (local index, e.g. SQLite FTS5 via Room).
- **Automation via Tasker/Shortcuts intents** (power-user feature, optional) — expose a documented `Intent` API so tools can be triggered from other automation apps entirely offline.
- **Home-screen widget showing storage saved / recent files.**

---

## PART 3 — LIBRARIES: WHAT TO GET, WHERE, AND HOW TO CONFIGURE

All of these are **free and offline**. Add via Gradle version catalog (`gradle/libs.versions.toml`). License is noted so you can sanity-check before shipping.

### 3.1 Image

| Need | Library | Source | License | Notes |
|---|---|---|---|---|
| Image loading/caching | **Coil 3** | `io.coil-kt.coil3:coil-compose` | Apache 2.0 | Compose-native, replaces Glide for new UI |
| Compression | **Compressor** (or roll your own with `Bitmap.compress` + `BitmapFactory.Options.inSampleSize`) | `id.zelory:compressor` (GitHub) | Apache 2.0 | Thin wrapper; easy to vendor yourself too |
| EXIF read/strip | **androidx.exifinterface** | `androidx.exifinterface:exifinterface` | Apache 2.0 | Official AndroidX artifact — use this, not a third-party one |
| HEIC encode | **androidx.heifwriter** | `androidx.heifwriter:heifwriter` | Apache 2.0 | Decode HEIC is already native via `BitmapFactory` on API 28+ |
| Document scan (edge detect, perspective correction) | **ML Kit Document Scanner API** | `com.google.android.gms:play-services-mlkit-document-scanner` | Free, on-device UI flow (Google Play services required) | Give it an Intent, get a cropped scan back — very little code |
| Background/selfie segmentation | **ML Kit Selfie Segmentation** | `com.google.mlkit:segmentation-selfie` | Free, fully on-device | Good for portrait cutouts; full subject cutout needs a custom TFLite model |

**Config:** add `google-services` / Play services BOM only if you don't already have it (Document Scanner needs Google Play services present — it still runs the actual scanning on-device, no network call, but the API surface is delivered as a Play Services module).

### 3.2 OCR / Text (covers Image + PDF + Audio-transcription features)

| Need | Library | Source | License |
|---|---|---|---|
| Text recognition (Latin + CJK + Devanagari variants) | **ML Kit Text Recognition v2** | `com.google.mlkit:text-recognition`, plus script-specific artifacts (`text-recognition-chinese`, `text-recognition-devanagari`, etc.) | Free, on-device, offline after first model download (models are bundled/downloaded once, then cached — no per-call network) |
| Speech-to-text (audio transcription) | **Android `SpeechRecognizer` with `RecognitionService` offline models**, or **ML Kit** (limited) | Platform API (`android.speech`) | Free — check "offline speech recognition" is downloaded in device settings; fully on-device once installed |
| Text-to-speech | **Android `TextToSpeech`** | Platform API | Free, on-device |

**Config:**
```kotlin
// libs.versions.toml
mlkit-text-recognition = "16.0.1"
```
```kotlin
implementation("com.google.mlkit:text-recognition:16.0.1")
```
Add `ML Kit` model as a Play Store "on-demand" dependency so the model downloads once on first use and is cached — this keeps your APK small while remaining 100% offline after that first download (no per-request network calls, no API key, no cost).

### 3.3 PDF

| Need | Library | Source | License | Notes |
|---|---|---|---|---|
| Read/write/merge/split/rotate/forms/redaction | **PdfBox-Android** | `com.tom-roush:pdfbox-android` | **Apache 2.0** | Actively maintained Android port of Apache PdfBox; this is your safest general-purpose engine |
| Render pages to bitmap (for thumbnails/preview) | **Android `PdfRenderer`** | Platform API (`android.graphics.pdf`) | Free | Use for preview; use PdfBox-Android for editing |
| ⚠️ Avoid for commercial apps unless reviewed | **iText 7 / iText 5** | — | **AGPL 3.0 (free tier)** — AGPL requires you to open-source your *entire app* if distributed, unless you buy a commercial license | Do **not** add iText unless you've deliberately accepted AGPL or bought a license. PdfBox-Android avoids this entirely. |

**Config:**
```kotlin
implementation("com.tom-roush:pdfbox-android:2.0.27.0")
```
```kotlin
// Once, before any PDFBox call (e.g. in Application.onCreate):
PDFBoxResourceLoader.init(applicationContext)
```

### 3.4 Audio & Video — the critical one

**⚠️ Do not add `com.arthenica:ffmpeg-kit-*`.** It was retired January 6, 2025, and Maven Central removed the binaries April 1, 2025 — the dependency no longer resolves for new projects. If your existing project still has it working, it's on a locally cached artifact that will break the moment cache is cleared or a new machine builds it.

**Two real options, both free and offline:**

| Option | What it is | License | When to use |
|---|---|---|---|
| **Recommended: AndroidX Media3 Transformer + ExoPlayer** | Google's own Jetpack library for transcoding, trimming, cropping, effects, overlays, speed change, audio extraction/mixing. Built on hardware `MediaCodec` + OpenGL. | Apache 2.0 | Use this as your primary engine — it's official, actively developed, and needs no native binary download |
| **Community-maintained FFmpegKit fork** (`dev.ffmpegkit-maintained:ffmpeg-kit-*` or similar forks) | Drop-in continuation of the old FFmpegKit — same API/package, same artifact names, just a different Maven group ID; kept updated for new Android SDKs | Base builds: **LGPL 3.0**; `-gpl` variants (x264/x265 encoders etc.): **GPL 3.0** (copyleft — affects your app's licensing if you ship those variants) | Only if you need an FFmpeg filter/codec that Media3 doesn't cover (e.g. certain exotic containers/filters). Stick to the LGPL variant if at all possible; GPL variants require your app to also be GPL-compatible if distributed. |

**Recommendation for your app:** build the video/audio pipeline on **Media3 Transformer** first (covers trim/merge/compress/speed/mute/overlay/extract-audio/format-convert — i.e., everything in your feature list in Part 2.4). Only reach for the FFmpeg fork if a specific format/filter genuinely isn't covered — and if so, use the plain (non-GPL) variant.

**Config (Media3):**
```kotlin
// libs.versions.toml
media3 = "1.5.1" // check for the latest stable when you implement

implementation("androidx.media3:media3-transformer:$media3")
implementation("androidx.media3:media3-exoplayer:$media3")
implementation("androidx.media3:media3-ui:$media3")
implementation("androidx.media3:media3-effect:$media3")
```
```kotlin
val editedMediaItem = EditedMediaItem.Builder(MediaItem.fromUri(inputUri))
    .setEffects(Effects(audioProcessors, videoEffects))
    .build()
Transformer.Builder(context)
    .addListener(myListener)
    .build()
    .start(editedMediaItem, outputPath)
```
Run inside a `Worker`/foreground `Service` (per the earlier UI-overhaul doc §6) so long transcodes survive backgrounding.

**Waveform for audio trim UI:** since there's no single dominant free waveform library right now, extract PCM samples yourself via `MediaExtractor` + `MediaCodec` (or `AudioRecord` for live capture) and draw the amplitude with a custom Compose `Canvas` — a few hundred lines, no dependency, no license concerns, and it stays fast because it only touches the decoded samples once.

### 3.5 Storage, DB, background work (reinforces the earlier architecture doc)
| Need | Library | License |
|---|---|---|
| Local DB (history, favorites, full-text search index) | **Room** (+ FTS4/FTS5 for search) | Apache 2.0 |
| Preferences | **DataStore** | Apache 2.0 |
| Background/long jobs | **WorkManager** | Apache 2.0 |
| Zip export for "backup all history" | **java.util.zip** (built into the JDK) | — | No library needed |

### 3.6 Nice-to-have polish libraries (all free/offline)
| Need | Library | License |
|---|---|---|
| Lottie success/empty-state animations | **Lottie for Android** (`com.airbnb.android:lottie-compose`) | Apache 2.0 |
| Biometric app-lock (optional Settings toggle) | **androidx.biometric** | Apache 2.0 |
| Licenses screen (auto-generated) | **AboutLibraries** | Apache 2.0 |
| Baseline profile / startup speed | **androidx.profileinstaller** + Macrobenchmark | Apache 2.0 |

---

## PART 4 — SETTINGS TO ADD (so the new features are configurable, per your "free/offline, full config" ask)

Add these to the Settings screen from the UI-overhaul doc (§5.5), grouped under existing sections:

- **Workflow →** "OCR language packs" (download/manage ML Kit script models), "Default video export quality/codec," "Default audio export format."
- **Workflow →** "Batch processing: max parallel jobs" (protects low-RAM devices).
- **Privacy →** "Strip EXIF/location on share" (default ON), "Auto-transcribe voice notes" (default OFF — opt-in since it's a heavier on-device job).
- **Ecosystem →** "Manage offline models" screen listing every downloaded ML Kit / speech model with size and a delete button (users on limited storage will want this).
- **Advanced (new section) →** "Preferred video engine: Media3 (default) / FFmpeg (if bundled)" — only show if you actually add the FFmpeg fork.

---

## PART 5 — SUGGESTED BUILD ORDER

1. **Fix the video/audio engine first** (Part 3.4) — this is likely already broken or about to break; everything else is additive.
2. Wire in **PdfBox-Android** for real PDF editing if not already present.
3. Add **ML Kit Text Recognition** → unlocks OCR-to-searchable-PDF and image-to-text, your biggest differentiators for the least code.
4. Add **ML Kit Document Scanner** → elevates "Image → PDF" from a raw photo dump to an actual scanning experience.
5. Layer in the cross-cutting features (Part 2.5): Quick Start, batch queue, share-target, shortcuts.
6. Polish pass: Lottie states, biometric lock, Licenses screen, Settings additions from Part 4.

---

## PART 6 — LICENSE SUMMARY (quick reference for your Licenses screen / THIRD_PARTY_NOTICES.md)

| Library | License | Copyleft risk |
|---|---|---|
| Coil, Compressor, exifinterface, heifwriter, PdfBox-Android, Media3, Room, DataStore, WorkManager, Lottie, AboutLibraries, biometric, profileinstaller | Apache 2.0 | None |
| ML Kit (Text Recognition, Document Scanner, Selfie Segmentation) | Free to use, Google-provided SDK terms | None (not open-source but free/offline; review Google's ML Kit terms of service) |
| FFmpeg fork — base variants | LGPL 3.0 | Low — dynamic linking is fine, don't statically embed and modify without complying |
| FFmpeg fork — `-gpl` variants (x264/x265 etc.) | GPL 3.0 | **High** — avoid unless you're prepared for GPL obligations |
| iText | AGPL 3.0 (or paid) | **Highest — avoid entirely for this app** |

**End of file.**
