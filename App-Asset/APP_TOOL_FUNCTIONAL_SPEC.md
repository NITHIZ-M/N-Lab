# App Functional Specification — What Every Tool Actually Does
**Purpose of this file:** a precise, tool-by-tool description of the job each feature performs, its exact step-by-step flow, what editing/options it must offer, and how it previews and saves output. Give this to the Gemini agent as the functional source of truth — it defines *behavior*, while the earlier UI/architecture file defines *how it's built*.

**The one flow every tool follows (memorize this shape):**
```
SELECT → CONFIGURE/EDIT → PREVIEW → NAME → SAVE (safely) → RESULT ACTIONS
```
Every tool spec below is just this shape filled in with its own details. If a tool can't be described this way, it's missing a step — fix that before building it.

---

## 0. UNIVERSAL RULES (apply to every tool — don't repeat these per file, but every tool obeys them)

**Selecting input**
- Use the system Photo Picker / file picker (SAF) — never ask for broad storage permission.
- Show file name, thumbnail, size, and type for every selected item before proceeding.
- Enforce the tool's min/max file count and supported types up front, with a clear message if violated (e.g., "Select at least 2 PDFs to merge").
- Let the user reorder or remove selected items before continuing (drag-and-drop for multi-file tools).

**Configuring / editing**
- Show sensible defaults so a user can hit "Continue" with zero taps for a basic job.
- Put rarely-used controls under "Advanced" (collapsed by default).
- Every destructive or hard-to-reverse option (permanently delete pages, overwrite metadata, strip password) needs its own confirmation, separate from the final save.

**Preview**
- Every tool must show a **before/after or live preview** prior to committing — never process blind. Preview types:
  - Image tools → live thumbnail that updates as sliders/crop move.
  - PDF tools → page thumbnail strip, updates to reflect merge/split/rotate order.
  - Audio tools → waveform with a draggable trim range and a play button.
  - Video tools → scrubber + frame filmstrip with in/out markers and a play button.

**Naming**
- Auto-generate a clear default name: `<OriginalName>_<operation>_<yyyyMMdd-HHmmss>.<ext>` (e.g., `Invoice_compressed_20260922-114500.pdf`) — never a generic reused name like `output.pdf`.
- Let the user edit the name inline before saving (validate against illegal filename characters).

**Safe saving (this is the part most apps get wrong)**
1. **Never overwrite the original file.** Always write a new file.
2. **Never overwrite an existing output silently.** If the chosen name already exists, auto-suffix (`_1`, `_2`…) or ask.
3. **Process into a temp/cache location first**, verify the output is valid (non-zero size, opens correctly / passes a basic integrity check), and only then move it to the final destination. If processing fails or is cancelled partway, the partial file must never appear in the user's output folder or history.
4. **Save via MediaStore or a user-chosen SAF folder** — respects scoped storage, shows up correctly in the system Files app / Gallery.
5. **Write, then verify, then log to History** — never log a history entry before the file is confirmed written.
6. **Always offer the same three result actions:** Save/Download, Share, Open — plus "Process another" to immediately reuse the same tool.
7. **Every successful job is recorded to History** with: tool used, input→output size, timestamp, and a link to the file (so it still works even if the file is later moved, showing "file not found" gracefully rather than crashing).

**Cancel & recover**
- Every processing screen has a visible Cancel button. Cancelling must leave zero partial output and zero half-written history entries.
- If the app is killed mid-job (OS memory pressure), a long job continues via a background worker + notification; a short job simply fails cleanly and the user is told to retry.

---

## 1. IMAGE TOOLS

### 1.1 Image → PDF
**Job:** turn one or more images into a single PDF, one image per page (by default).
- **Select:** pick N images from device storage (any order).
- **Edit per image (before combining):** crop, rotate 90°/180°/270°, resize/scale, brightness/contrast, black-and-white/grayscale filter (useful for scanned docs), reorder pages by drag, remove a page.
- **Global options:** page size (A4/Letter/Fit-to-image), orientation, margin, image quality/compression level, page numbering on/off.
- **Preview:** scrollable page-thumbnail strip reflecting the final PDF order and each edit.
- **Name & Save:** as per Universal Rules. Output is a single `.pdf`.

### 1.2 PDF → Image / JPG
**Job:** export each page of a PDF (or a selected page range) as a separate image file.
- **Select:** one PDF.
- **Edit/Options:** page range (all / custom range / specific pages via thumbnail multi-select), output format (JPG/PNG/WebP), resolution/DPI, image quality slider (for JPG).
- **Preview:** thumbnail grid of every page that will be exported, with a checkbox per page.
- **Name & Save:** since this produces multiple files, save as `<OriginalName>_page1.jpg`, `_page2.jpg`, etc., inside a single new folder named after the source file — never dump loose numbered files into a shared folder.

### 1.3 Image Compressor
**Job:** reduce file size of one or more images with minimal visible quality loss.
- **Select:** 1–N images (batch supported).
- **Edit/Options:** quality slider (with live "estimated size" readout), or a **target size** mode ("compress to under 200 KB") that iterates quality automatically, resize-to-dimension option, "strip EXIF/location metadata" toggle (default ON for privacy).
- **Preview:** side-by-side original vs. compressed thumbnail with both file sizes shown.
- **Name & Save:** batch jobs show one progress bar for all files; each output keeps the original name + `_compressed` suffix; a summary screen shows total space saved.

### 1.4 Resize / Crop / Rotate
**Job:** standalone geometry edits when the user isn't also converting format.
- **Select:** 1 image (or batch, same settings applied to all).
- **Edit/Options:** crop (free-form + fixed ratios: 1:1, 4:3, 16:9, custom), resize by pixels/percentage (with "lock aspect ratio" toggle), rotate by 90° steps or a free-angle straighten slider, flip horizontal/vertical.
- **Preview:** live on-canvas crop handles / rotation preview.
- **Name & Save:** standard.

### 1.5 Format Converter (JPG ⇄ PNG ⇄ WebP ⇄ HEIC)
**Job:** convert an image's file format, optionally re-compressing.
- **Select:** 1–N images.
- **Edit/Options:** target format, quality (for lossy formats), "keep transparency" note when converting to a format that doesn't support alpha (JPG) — warn before proceeding.
- **Preview:** before/after thumbnail with both file sizes and formats labeled.
- **Name & Save:** standard, extension matches new format.

### 1.6 Document Scanner (camera → clean PDF/image)
**Job:** photograph a physical document and produce a clean, cropped, perspective-corrected scan.
- **Select:** capture via camera (or pick an existing photo of a document).
- **Edit/Options:** auto-detected edge outline (user can drag corners to correct), auto perspective-correction, filter mode (Color / Grayscale / Black & White / Original), multi-page scan (keep adding pages before finishing), page reorder/delete.
- **Preview:** each captured page shown as a thumbnail in the running scan session before final export.
- **Name & Save:** output as PDF (default) or individual images; standard save rules apply.

### 1.7 Watermark / Text-on-Image
**Job:** stamp text or a logo image onto one or more images.
- **Select:** 1–N images + watermark content (typed text, or pick a logo image).
- **Edit/Options:** position (9-point grid or drag-to-place), opacity, font/size/color (for text), tile-repeat toggle (for anti-copy watermarking).
- **Preview:** live on-canvas overlay.
- **Name & Save:** standard, batch supported (same watermark applied to all selected).

### 1.8 OCR — Image to Text
**Job:** extract editable text from a photo or scanned image.
- **Select:** 1 image.
- **Edit/Options:** language selection (download language pack if needed), region-select (OCR only a cropped area) vs. full image.
- **Preview:** recognized text shown editable side-by-side (or below) the source image so the user can correct misreads before saving.
- **Name & Save:** save as `.txt`, or "Copy to clipboard," or "Export as searchable PDF" (image + invisible text layer).

---

## 2. PDF TOOLS

### 2.1 Merge PDF
**Job:** combine multiple PDFs into one.
- **Select:** 2+ PDFs.
- **Edit/Options:** drag to reorder files, remove a file, optional page-range per file (merge only pages 2–5 of file B, for example).
- **Preview:** combined page-thumbnail strip in final order, updates live as files are reordered.
- **Name & Save:** standard.

### 2.2 Split PDF
**Job:** break one PDF into multiple PDFs.
- **Select:** 1 PDF.
- **Edit/Options:** split mode — by fixed page count ("every 5 pages"), by custom ranges (page 1–3, 4–10…), or by manually selected split points on the thumbnail strip.
- **Preview:** thumbnail strip with visual split markers the user can drag.
- **Name & Save:** outputs go into one new folder, named `<OriginalName>_part1.pdf`, `_part2.pdf`, etc.

### 2.3 Rotate PDF
**Job:** fix page orientation.
- **Select:** 1 PDF.
- **Edit/Options:** rotate all pages, or select specific pages from the thumbnail grid and rotate only those (90°/180°/270°).
- **Preview:** thumbnail grid reflecting rotation live.
- **Name & Save:** standard.

### 2.4 Rearrange / Delete Pages
**Job:** reorder or remove pages within one PDF.
- **Select:** 1 PDF.
- **Edit/Options:** drag-and-drop thumbnail grid to reorder; tap a page to mark for deletion (with an undo before final save).
- **Preview:** live thumbnail grid.
- **Name & Save:** standard.

### 2.5 Compress PDF
**Job:** reduce file size (mainly by re-compressing embedded images and removing redundant data).
- **Select:** 1 PDF.
- **Edit/Options:** compression level (Low/Medium/High, with an estimated resulting size for each).
- **Preview:** original vs. estimated compressed size shown before running; final screen shows actual before/after.
- **Name & Save:** standard.

### 2.6 Protect / Unlock PDF
**Job:** add or remove a password.
- **Select:** 1 PDF.
- **Protect — Edit/Options:** set open-password and/or a separate permissions-password (restrict printing/copying/editing independently).
- **Unlock — Edit/Options:** enter the current password to remove it (only works if the user has the password — this is not a password-cracker).
- **Preview:** none needed (no visual change) — show a clear confirmation summary of what was set/removed instead.
- **Name & Save:** standard. Passwords are never logged or stored — held only in memory (`CharArray`) for the duration of the operation.

### 2.7 Watermark PDF
**Job:** stamp text/logo/diagonal watermark across pages.
- Same options as Image Watermark (1.7), applied per-page with a "apply to: all pages / range" choice.
- **Preview:** live on a sample page in the thumbnail strip.
- **Name & Save:** standard.

### 2.8 Page Numbers
**Job:** add numbering to pages.
- **Edit/Options:** position (corner selection), format (`1`, `Page 1`, `1 of N`), starting number, font/size.
- **Preview:** live on thumbnail strip.
- **Name & Save:** standard.

### 2.9 Signature
**Job:** add a hand-drawn or typed signature to a PDF at a chosen position.
- **Select:** 1 PDF + draw/type the signature (or reuse a saved signature).
- **Edit/Options:** drag to position and resize on the target page, choose which page(s).
- **Preview:** live placement on the page.
- **Name & Save:** standard. Note in-app that this is a visual signature image, not a legally certified digital signature.

### 2.10 Metadata Editor
**Job:** view/edit a PDF's title, author, subject, keywords; optionally strip all metadata.
- **Edit/Options:** editable fields, plus a one-tap "Remove all metadata" for privacy.
- **Preview:** current vs. new values shown side-by-side.
- **Name & Save:** standard.

### 2.11 Extract Images from PDF
**Job:** pull every embedded image out of a PDF as separate files.
- **Select:** 1 PDF.
- **Edit/Options:** choose which pages to extract from; output format (keep original / convert to JPG/PNG).
- **Preview:** thumbnail grid of images found before extracting.
- **Name & Save:** into one new folder, `<OriginalName>_img1.jpg` etc.

### 2.12 PDF OCR (scanned PDF → searchable PDF)
**Job:** add an invisible, selectable text layer over a scanned/image-based PDF.
- **Select:** 1 PDF.
- **Edit/Options:** language selection, page range.
- **Preview:** show recognized text over one sample page so the user can sanity-check accuracy before running the full document.
- **Name & Save:** outputs a new searchable PDF (original scan images untouched, just an added text layer).

### 2.13 Repair PDF
**Job:** attempt to fix a corrupted/unreadable PDF.
- **Select:** 1 PDF that fails to open normally.
- **Edit/Options:** none — automatic best-effort repair.
- **Preview:** show whether the repaired file now renders correctly (thumbnail check) before letting the user save it.
- **Name & Save:** standard; clearly state repair isn't guaranteed to recover 100% of content.

---

## 3. AUDIO TOOLS

### 3.1 Trim / Cut Audio
**Job:** keep only a selected time range of an audio file.
- **Select:** 1 audio file.
- **Edit/Options:** waveform with draggable start/end markers, numeric time entry as an alternative to dragging, fade-in/fade-out toggle at the cut points.
- **Preview:** play button that loops just the selected range.
- **Name & Save:** standard.

### 3.2 Merge / Join Audio
**Job:** combine multiple audio clips into one, in sequence.
- **Select:** 2+ audio files.
- **Edit/Options:** drag to reorder, optional short crossfade between clips, silence gap duration between clips.
- **Preview:** combined waveform strip in final order, playable.
- **Name & Save:** standard.

### 3.3 Convert Format
**Job:** change container/codec (MP3 ⇄ WAV ⇄ M4A/AAC ⇄ OGG).
- **Select:** 1–N audio files.
- **Edit/Options:** target format, bitrate/quality (for lossy targets).
- **Preview:** shows resulting estimated size/duration; playable before/after.
- **Name & Save:** standard, batch supported.

### 3.4 Compress / Reduce Size
**Job:** lower bitrate to shrink file size.
- Same shape as Image Compressor (3.1-style quality slider or target-size mode).
- **Name & Save:** standard.

### 3.5 Extract Audio from Video
**Job:** pull just the audio track out of a video file.
- **Select:** 1 video.
- **Edit/Options:** output format (MP3/M4A/WAV), trim range (optional — extract only part of the video's audio).
- **Preview:** playable audio preview before saving.
- **Name & Save:** standard, output extension matches chosen format.

### 3.6 Normalize / Adjust Volume
**Job:** even out loudness or boost/reduce volume.
- **Select:** 1 audio file.
- **Edit/Options:** auto-normalize (one tap, target loudness standard) or manual gain slider (with a clipping warning if pushed too high).
- **Preview:** waveform amplitude updates live; playable.
- **Name & Save:** standard.

### 3.7 Voice Recorder
**Job:** record audio directly in-app.
- **Edit/Options during recording:** pause/resume, live level meter, live elapsed time.
- **After recording:** immediately offers Trim before saving (chains into 3.1).
- **Preview:** playback before final save.
- **Name & Save:** standard, default name includes timestamp.

### 3.8 Speech-to-Text (Transcription)
**Job:** convert spoken audio into text.
- **Select:** 1 audio file (or a live recording).
- **Edit/Options:** language selection.
- **Preview:** transcript shown editable, synced to an audio scrubber so the user can jump to a spot and correct a word.
- **Name & Save:** save as `.txt`, or copy to clipboard.

### 3.9 Text-to-Speech
**Job:** turn typed text into a spoken audio file.
- **Select:** none — user types/pastes text.
- **Edit/Options:** voice, language, speaking rate/pitch.
- **Preview:** play button to preview before exporting.
- **Name & Save:** exports as `.mp3`/`.wav`.

### 3.10 Set as Ringtone/Notification
**Job:** quick shortcut to assign an audio file (usually a trimmed clip) as the device ringtone or a notification sound.
- **Select:** 1 (short) audio file.
- **Edit/Options:** none beyond ensuring it's trimmed to a reasonable length first (chain from 3.1 if too long).
- **Name & Save:** uses `RingtoneManager` to register the file with the system — explain this is a system-level save, distinct from normal export.

---

## 4. VIDEO TOOLS

### 4.1 Trim / Cut Video
**Job:** keep a selected time range of a video.
- **Select:** 1 video.
- **Edit/Options:** frame-thumbnail filmstrip with draggable in/out markers, numeric time entry, frame-accurate nudging (±1 frame buttons).
- **Preview:** scrubbable player showing the trimmed range only.
- **Name & Save:** standard.

### 4.2 Merge Video
**Job:** join multiple video clips in sequence.
- **Select:** 2+ videos.
- **Edit/Options:** drag to reorder, warn if resolutions/frame rates differ (auto-normalize to the first clip's settings, tell the user this is happening).
- **Preview:** combined filmstrip in order, playable.
- **Name & Save:** standard.

### 4.3 Compress Video
**Job:** reduce file size by re-encoding at a lower bitrate/resolution.
- **Select:** 1–N videos.
- **Edit/Options:** quality preset (Low/Medium/High) or target size mode, resolution cap (e.g., limit to 720p), frame rate cap.
- **Preview:** estimated resulting size shown before running; before/after comparison after.
- **Name & Save:** standard, batch supported (processed sequentially with one overall progress indicator).

### 4.4 Convert Format
**Job:** change container/codec (MP4/MKV/WebM/MOV/AVI).
- **Select:** 1–N videos.
- **Edit/Options:** target format, codec choice if relevant, quality.
- **Name & Save:** standard.

### 4.5 Rotate / Crop Video
**Job:** fix orientation or reframe.
- **Select:** 1 video.
- **Edit/Options:** rotate 90° steps, crop rectangle (draggable on a video frame), aspect-ratio presets (9:16 for reels, 1:1, 16:9).
- **Preview:** scrubbable player reflecting the crop/rotation live.
- **Name & Save:** standard.

### 4.6 Mute / Replace Audio
**Job:** remove the original audio track, or swap it for a different audio file.
- **Select:** 1 video (+ 1 audio file if replacing).
- **Edit/Options:** mute entirely, or replace with sync offset control (nudge new audio earlier/later against the video).
- **Preview:** playable with the new/no audio.
- **Name & Save:** standard.

### 4.7 Speed Change
**Job:** slow-motion or fast-forward effect.
- **Select:** 1 video.
- **Edit/Options:** speed multiplier slider (e.g., 0.25×–4×), "keep pitch" toggle for the audio track if not muted.
- **Preview:** scrubbable preview at the new speed.
- **Name & Save:** standard.

### 4.8 Watermark / Text Overlay on Video
**Job:** stamp text/logo onto video, for the whole duration or a chosen time range.
- Same options as Image Watermark (1.7), plus a time-range control for when it appears.
- **Preview:** scrub to any point to confirm the overlay looks right.
- **Name & Save:** standard.

### 4.9 Extract Frame as Image
**Job:** grab a single still frame from a video.
- **Select:** 1 video, scrub to the desired frame.
- **Edit/Options:** output format (JPG/PNG), optional crop before saving.
- **Preview:** the exact frame, full-size, before saving.
- **Name & Save:** standard, output is an image file.

### 4.10 Export as GIF
**Job:** convert a trimmed video segment into an animated GIF.
- **Select:** 1 video, trim to the segment to convert (chains from 4.1).
- **Edit/Options:** output resolution/width, frame rate, loop toggle, estimated file-size warning (GIFs get large fast).
- **Preview:** live GIF preview before saving.
- **Name & Save:** standard, `.gif` output.

### 4.11 Subtitle Burn-in
**Job:** permanently overlay `.srt` subtitles onto the video image.
- **Select:** 1 video + 1 `.srt` file.
- **Edit/Options:** font/size/color/position, timing offset nudge if subtitles are out of sync.
- **Preview:** scrubbable player showing subtitles as they'll appear.
- **Name & Save:** standard.

---

## 5. DOCUMENT TOOLS (cross-cutting, not tied to one media type)

### 5.1 Scan to PDF
Same as 1.6 (Document Scanner) — listed here too since users will look for it under "Document Tools" as well as "Image Tools." Both entry points should route to the same feature (data-driven registry, one implementation, two menu placements).

### 5.2 Text/Notes to PDF
**Job:** turn typed text into a formatted PDF document.
- **Select:** none — user types/pastes text (or imports a `.txt`).
- **Edit/Options:** basic formatting (font, size, alignment), page size, header/footer text.
- **Preview:** live paginated preview.
- **Name & Save:** standard.

### 5.3 File Compressor (Zip/Unzip)
**Job:** general-purpose archive creation and extraction, not tied to media type — useful for exporting a whole History bundle or bundling multiple output files to share at once.
- **Select:** 1+ files/folders to zip, or 1 archive to unzip.
- **Edit/Options:** archive name, password-protect the zip (optional).
- **Preview:** file list inside the archive (for unzip, before extracting).
- **Name & Save:** standard.

### 5.4 Batch Rename
**Job:** rename many files at once using a pattern.
- **Select:** N files.
- **Edit/Options:** pattern with tokens (`{name}`, `{index}`, `{date}`), live preview list showing old → new name for every file before applying.
- **Name & Save:** applies renames only after explicit confirm; never silently overwrite a name collision — auto-suffix instead.

### 5.5 QR Code / Barcode — Scan & Generate
**Job:** read a QR/barcode from the camera or an image, and generate a new one from text/URL.
- **Scan — Select:** camera live view or pick an image containing a code.
- **Generate — Edit/Options:** input text/URL/Wi-Fi credentials/contact card, code style (size, color, embedded logo).
- **Preview:** live scan result, or live-updating generated code image.
- **Name & Save:** scanned result → copy/open link; generated code → save as PNG.

---

## 6. HOW TOOLS SHARE CODE (so this spec maps cleanly onto the architecture)

Every tool above reduces to the same four-stage contract:
```kotlin
interface ToolWorkflow<Input, Options, Output> {
    fun validateInput(input: Input): ValidationResult
    fun defaultOptions(input: Input): Options
    fun preview(input: Input, options: Options): Flow<PreviewState>   // live-updating
    fun process(input: Input, options: Options): Flow<ProcessState<Output>> // Progress/Success/Failure
}
```
Register each tool as one `ToolDefinition` (id, family, accepted types, min/max file count, the workflow implementation, icon/category) in the central registry from the UI-overhaul doc — this spec is the *content* for that registry, not a separate system.

**End of file.**
