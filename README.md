# 📦 eBay Snap Lister

**Snap a photo → AI creates your eBay listing in seconds.**

Take a photo of any item, add an optional voice note, and get a complete eBay listing with AI-generated title, description, item specifics, and a suggested price — all based on real-time eBay market data.

---

## ✨ Features

- 📸 **Photo Capture** — Rear camera on mobile, or upload from library
- 🤖 **AI Analysis** — Gemini 2.5 Flash identifies item, condition, specs, and writes the listing
- 🎤 **Voice Notes** — Add extra details via browser speech recognition
- 💰 **Price Research** — Live eBay pricing via Browse API + AI estimate range
- ✏️ **Editable Draft** — Review and edit every field before publishing
- 📋 **One-Tap Copy** — Copy the full formatted listing to clipboard

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- [Supabase CLI](https://supabase.com/docs/guides/cli)
- Supabase project (free tier works)
- OpenRouter API key (for Gemini 2.5 Flash vision)
- eBay Developer account (for Browse API)

### 1. Install dependencies

```bash
npm install
```

### 2. Set up environment variables

```bash
cp .env.example .env
```

Edit `.env` with your Supabase project URL and anon key:

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### 3. Link your Supabase project

```bash
supabase login
supabase link --project-ref your-project-id
```

### 4. Set Edge Function secrets

```bash
supabase secrets set OPENROUTER_API_KEY=your-openrouter-key
supabase secrets set EBAY_CLIENT_ID=your-ebay-client-id
supabase secrets set EBAY_CLIENT_SECRET=your-ebay-client-secret
```

### 5. Deploy Edge Functions

```bash
supabase functions deploy analyze-item
supabase functions deploy get-price
supabase functions deploy transcribe-audio
```

### 6. Run locally

```bash
npm run dev
```

---

## 🔑 Required Secrets

| Secret | Where to get it |
|--------|----------------|
| `OPENROUTER_API_KEY` | [openrouter.ai/keys](https://openrouter.ai/keys) |
| `EBAY_CLIENT_ID` | [developer.ebay.com](https://developer.ebay.com) → My Apps |
| `EBAY_CLIENT_SECRET` | [developer.ebay.com](https://developer.ebay.com) → My Apps |

---

## 🌐 Deploy to Lovable

1. Import this repo into [Lovable](https://lovable.dev)
2. Set the environment variables in Lovable project settings
3. Lovable will automatically deploy the frontend

---

## 🏗️ Architecture

```
Frontend (React + Vite)
    ↓
Supabase Edge Functions (Deno)
    ↓
├── analyze-item → OpenRouter Gemini 2.5 Flash (vision)
├── get-price → eBay Browse API
└── transcribe-audio → OpenRouter Whisper (fallback)
```

### App Flow

```
Step 1: Photo Capture
    ↓
Step 2: AI Analysis + Voice Note
    ↓
Step 3: Price Research (auto-triggers)
    ↓
Step 4: Review Draft + Copy to Clipboard
```

---

## 🛠️ Tech Stack

- **Frontend:** React 19 + TypeScript + Vite
- **UI:** shadcn/ui + Tailwind CSS v4
- **Backend:** Supabase Edge Functions (Deno)
- **AI:** OpenRouter → Google Gemini 2.5 Flash
- **Pricing:** eBay Browse API v1

---

## 📱 Mobile-First

Designed for iPhone and Android browsers. The photo capture uses `capture="environment"` to open the rear camera directly. Works as a PWA.

---

## 📁 Project Structure

```
ebay-snap-lister/
├── src/
│   ├── App.tsx                    # Main app with step routing
│   ├── main.tsx
│   ├── index.css
│   ├── components/
│   │   ├── PhotoCapture.tsx       # Camera + file upload
│   │   ├── AnalysisLoader.tsx     # Full-screen loading overlay
│   │   ├── VoiceNote.tsx          # Speech recognition
│   │   ├── PriceCard.tsx          # AI + eBay price display
│   │   ├── ListingDraft.tsx       # Editable listing form
│   │   └── CopyButton.tsx         # Format + clipboard copy
│   ├── lib/
│   │   └── utils.ts               # cn() helper
│   └── types/
│       └── listing.ts             # TypeScript interfaces
├── supabase/
│   └── functions/
│       ├── analyze-item/          # Gemini vision analysis
│       ├── get-price/             # eBay live pricing
│       └── transcribe-audio/      # Whisper transcription
├── .env.example
├── components.json                # shadcn config
└── README.md
```
