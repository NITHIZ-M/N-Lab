<div align="center">

  <img src="App-Asset/App_Logo.jpg" alt="N-Lab Logo" width="120" style="border-radius: 24px; box-shadow: 0 8px 24px rgba(79,70,229,0.3);" />

  <h1>🚀 N-Lab Studio</h1>

  <p align="center">
    <b>Next-Generation, 100% Private, Client-Side Media & Document Engine</b>
  </p>

  <p align="center">
    <a href="https://reactjs.org"><img src="https://img.shields.io/badge/React-18.3-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React 18" /></a>
    <a href="https://www.typescriptlang.org"><img src="https://img.shields.io/badge/TypeScript-5.5-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" /></a>
    <a href="https://vitejs.dev"><img src="https://img.shields.io/badge/Vite-5.4-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="Vite 5" /></a>
    <a href="https://capacitorjs.com"><img src="https://img.shields.io/badge/Capacitor-8.5-119EFF?style=for-the-badge&logo=capacitor&logoColor=white" alt="Capacitor 8" /></a>
    <a href="#"><img src="https://img.shields.io/badge/Version-2.1.1-10B981?style=for-the-badge" alt="Version 2.1.1" /></a>
    <a href="#"><img src="https://img.shields.io/badge/Privacy-100%25_Offline-F59E0B?style=for-the-badge&logo=shield" alt="100% Private" /></a>
  </p>

  <p align="center">
    <i>Process photos, edit PDFs, trim waveforms, adjust video clips & synthesize audio locally — zero cloud server uploads.</i>
  </p>

</div>

---

## 📑 Table of Contents

- [Overview](#-overview)
- [Key Features](#-key-features)
  - [🖼️ Image & Graphic Studio](#️-image--graphic-studio)
  - [📄 PDF Document Studio](#-pdf-document-studio)
  - [🎵 Audio & Sound Lab](#-audio--sound-lab)
  - [🎬 Video & Motion Studio](#-video--motion-studio)
  - [🎨 User Experience & Controls](#-user-experience--controls)
- [Architecture & Tech Stack](#-architecture--tech-stack)
- [Getting Started](#-getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation & Local Dev](#installation--local-dev)
  - [Production Web Build](#production-web-build)
  - [Android APK Build](#android-apk-build)
- [Pre-Push & GitHub Security Checklist](#-pre-push--github-security-checklist)
- [Project Directory Structure](#-project-directory-structure)
- [License & Credits](#-license--credits)

---

## 🌟 Overview

**N-Lab Studio** is an ultra-fast, privacy-first, cross-platform media & document processing suite available as a Progressive Web App (PWA) and native Android app. 

Unlike traditional online converters that upload confidential files to external servers, **N-Lab Studio executes 100% of its operations on your device** using HTML5 APIs, Web Audio, WebAssembly, and modern JavaScript engines.

---

## ✨ Key Features

### 🖼️ Image & Graphic Studio
- **Interactive Cropper**: Freehand and fixed aspect ratio cropping (`1:1`, `4:3`, `16:9`, `9:16`).
- **Smart Image Resizer**: Custom pixel dimensions with aspect ratio lock.
- **Precision Compressor**: Dynamic quality percentage slider (`10% - 100%`).
- **Image Converter**: Instant conversion between `PNG`, `JPEG`, and `WebP`.
- **Image Rotator**: Instant 90°, 180°, and 270° orientation adjustments.
- **Text-to-PDF**: Combine single or multiple images into formatted PDF files.

### 📄 PDF Document Studio
- **PDF Merger & Splitter**: Merge multiple document files or extract custom page ranges.
- **Custom Watermarker**: Stamp personalized text watermarks across PDF pages.
- **PDF Protect / Encrypt**: Apply security restrictions and password locks.
- **Page Image Extractor**: Render PDF pages into high-resolution standalone images.

### 🎵 Audio & Sound Lab
- **Waveform Trim Selector**: Visual waveform trim editor with millisecond accuracy.
- **Volume & Gain Booster**: Boost quiet audio streams up to `300%`.
- **Speed Shift & EQ**: Change playback rate without pitch degradation and apply audio filters.
- **Audio Reverser & Joiner**: Reverse audio tracks or merge multiple sound clips.
- **Text-To-Speech (TTS)**: Offline Speech synthesis engine converting text prompts to audio files.

### 🎬 Video & Motion Studio
- **Video Trimmer & Merger**: Cut unwanted video segments or join multiple clips.
- **Video Rotator & Cropper**: Adjust orientation and aspect ratios for social media formats.
- **Animated GIF Generator**: Convert video clips into smooth animated GIFs.
- **Frame Grabber**: Extract high-definition still frames from any timestamp.

### 🎨 User Experience & Controls
- **Pure White Splash Launch Screen**: Fast, flicker-free app boot with logo zoom animation.
- **Sections vs List Catalog Modes**: Optimized visual category sections and compact flat list toggles.
- **Persistent Starred Favorites**: Pin frequently used tools across app sessions.
- **Placeholder Name Suggestions**: Clean, customizable file naming hints (`"yourname"`, `"your@gmail.com"`).
- **Dark & Light Glassmorphism UI**: High-contrast, hardware-accelerated aesthetic theme modes.

---

## 🛠️ Architecture & Tech Stack

| Layer | Technologies Used | Purpose |
| :--- | :--- | :--- |
| **Frontend UI** | `React 18`, `TypeScript 5.5` | Type-safe, component-driven reactive interface |
| **Build Tool** | `Vite 5` | Ultra-fast HMR & production bundler |
| **Icons & Style** | `Lucide React`, `CSS Tokens` | Glassmorphism UI & responsive themes |
| **PDF Processing** | `pdf-lib`, `pdfjs-dist` | In-browser PDF generation & manipulation |
| **Audio Core** | `Web Audio API` | Real-time waveform rendering & audio DSP |
| **Native Bridge** | `Capacitor 8` | Android native runtime bridge & file system integration |

---

## 🚀 Getting Started

### Prerequisites
- **Node.js**: `v18.0.0` or higher
- **npm**: `v9.0.0` or higher
- **Android Studio / JDK 17** (Only required for compiling Android APK binaries)

### Installation & Local Dev

```bash
# 1. Clone repository
git clone https://github.com/your-username/N-Lab.git

# 2. Navigate to project root
cd N-Lab

# 3. Install dependencies
npm install

# 4. Launch development server
npm run dev
```

Open `http://localhost:5173` in your web browser.

### Production Web Build

```bash
# Type-check TypeScript & build production distribution
npm run build
```

The output files will be generated inside the `dist/` directory.

### Android APK Build

```bash
# 1. Build web bundle & sync Capacitor assets
npm run build
npx cap sync android

# 2. Compile release APK with Gradle
cd android
.\gradlew.bat assembleRelease
```

The compiled release APK will be generated at: `android/app/build/outputs/apk/release/app-release.apk`.

---

## 🔒 Pre-Push & GitHub Security Checklist

Before committing and pushing code to GitHub, ensure these standards are met:

- [x] **No Secret Keys in Git**: Ensure keystores (`*.jks`, `nlab-release-key.jks`) and `.env` files are ignored in `.gitignore`.
- [x] **Clean `.gitignore`**: Exclude `node_modules/`, `dist/`, build logs, and temporary cache folders.
- [x] **Type Safety**: Run `npm run lint` or `npx tsc --noEmit` to verify zero TypeScript errors.
- [x] **Version Consistency**: Verify version numbers in `package.json`, `android/app/build.gradle`, and UI components match.

---

## 📂 Project Directory Structure

```
N-Lab/
├── android/                    # Capacitor Android native project & Gradle build files
├── App-Asset/                  # Application logos, splash art & brand assets
├── public/                     # Static web assets & favicons
├── src/
│   ├── components/             # Reusable UI components (ToolRow, HeroCard, NavBars)
│   ├── data/                   # Tool registry definitions & catalog mappings
│   ├── services/
│   │   ├── mediaEngine/        # Client-side Image, PDF, Audio & Video processors
│   │   ├── downloadService.ts  # Native file download & share handlers
│   │   └── storageService.ts   # Persistent favorites & preferences storage
│   ├── types/                  # TypeScript interfaces & enums
│   ├── views/                  # Primary app views (HomeScreen, ToolsScreen, Workspace, Settings)
│   ├── App.tsx                 # Main router layout
│   └── index.css               # Global design tokens, dark/light themes & animations
├── index.html                  # HTML entry point with white splash keyframes
├── package.json                # Project dependencies & scripts
├── capacitor.config.json       # Capacitor app configuration
└── README.md                   # Project documentation
```

---

## 📄 License & Credits

Distributed under the **MIT License**. See `LICENSE` for details.

Developed with ❤️ by **NITHISH**.

*100% Offline • Private • Powerful*
