<div align="center">
  <h1>AlphaScope</h1>
  <p><b>NSE Intelligence Terminal — Dual-Signal Alpha Detection with AI-Powered Analysis</b></p>

  [![Status: Live](https://img.shields.io/badge/Status-Live-success?style=for-the-badge)](https://alphascope.netlify.app/)
  [![Hackathon: ET AI](https://img.shields.io/badge/ET%20AI%20Hackathon%202026-PS6-blue?style=for-the-badge)](https://alphascope.netlify.app/)
  [![Stack: Node.js & Groq](https://img.shields.io/badge/Stack-HTML%20%7C%20Node.js%20%7C%20Groq-informational?style=for-the-badge)](#tech-stack)
  [![Deploy: Netlify](https://img.shields.io/badge/Deployed-Netlify-00C7B7?style=for-the-badge)](https://alphascope.netlify.app/)

  <br />
  <a href="https://alphascope.netlify.app/">View Live Demo</a>
  ·
  <a href="#features">Explore Features</a>
  ·
  <a href="#getting-started">Getting Started</a>
</div>

---

## 📌 Overview

**AlphaScope** is a modern, web-based terminal built for the Indian investor. Originally developed for the **ET AI Hackathon 2026 (PS6 — AI for the Indian Investor)**, it cross-validates two independent signal sources to surface high-conviction trade setups on NSE stocks.

By combining traditional quantitative analysis with large language models, AlphaScope reduces noise and democratizes institutional-grade signal detection for retail investors.

---

## 🚀 Core Mechanics

AlphaScope utilizes a dual-agent architecture to identify high-probability setups:

1. **Chart Pattern Agent:** Algorithmic detection of technical setups including 52-week breakouts, golden crosses, Bollinger Band squeezes, and support tests based on historical win rates.
2. **Opportunity Radar Agent:** Heuristic scoring of fundamental and market events such as institutional bulk deals, earnings momentum, and sector-specific catalysts.
3. **Alpha Fusion Engine:** Surfaces only the highest conviction stocks where both quantitative agents trigger simultaneously.
4. **AI Briefs:** Integrates with the Groq API (powered by `llama-3.3-70b-versatile`) to generate concise, human-readable market summaries based on the raw quantitative data.

---

## ✨ Key Features

- **Live NSE Prices:** Real-time data pulled from Yahoo Finance on every request—no stale quotes.
- **Global Macro Tracking:** Live tickers for Gold, Silver, Crude Oil, USD/INR, Bitcoin, and India VIX.
- **Sector Heatmap:** Visual representation of market performance across 8 major sectors.
- **Deep Search:** Instant fundamental and technical analysis for any supported NSE stock.
- **Persistent Watchlists:** Server-side stored bookmarks that persist across sessions.
- **Adaptive UI:** Fully responsive design with user-togglable Dark and Light modes.
- **Background Refresh:** Automated signal scanning every 30 minutes.

---

## 🛠️ Tech Stack

| Component | Technology |
|---|---|
| **Frontend** | Vanilla HTML, CSS, JavaScript |
| **Backend** | Netlify Functions (Serverless Node.js) |
| **Authentication** | Custom implementation using bcrypt & JWT |
| **Data Provider** | Yahoo Finance API |
| **AI Integration** | Groq API (`llama-3.3-70b-versatile`) |
| **Deployment** | Netlify |

---

## 📁 Project Architecture

```text
alphascope/
├── netlify.toml                    # Build configuration and routing rules
├── package.json                    # Project dependencies
├── .env.example                    # Template for required environment variables
│
├── netlify/functions/              # Serverless Backend
│   ├── auth.js                     # Registration and login handlers
│   ├── utils.js                    # JWT, bcrypt, and CORS utilities
│   ├── db.js                       # File-based user and bookmark storage
│   ├── stocks.js                   # Yahoo Finance integration and search
│   ├── analysis.js                 # Technical analysis and AI brief generation
│   ├── signals.js                  # Global market scan engine
│   ├── market.js                   # Macro indicators (Indices, Commodities, Crypto)
│   └── bookmarks.js                # Watchlist management API
│
└── public/                         # Frontend Assets
    ├── index.html                  # Authentication Portal
    ├── css/main.css                # Global design system
    ├── js/app.js                   # Core client-side logic
    └── pages/
        ├── dashboard.html          # Main terminal interface
        ├── stock.html              # Individual stock deep-dive
        └── bookmarks.html          # User watchlist
```

---

## 🚦 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- Netlify CLI (`npm install -g netlify-cli`)

### Local Development

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Vishwajeet2005/AlphaScope.git
   cd AlphaScope
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure environment variables:**
   - Copy `.env.example` to `.env`
   - Add your `GROQ_API_KEY` for AI features (optional, the app will fallback to template text if missing).
   - Set a secure `JWT_SECRET`.

4. **Start the local development server:**
   ```bash
   npm run dev
   ```
   The application will be available at `http://localhost:8888`.

---

## 🌍 Impact Model

India has over 14 crore Demat accounts, yet many retail investors lack access to professional-grade tools, relying heavily on informal tips. AlphaScope bridges this gap by automatically surfacing 3–8 confirmed dual-signal setups daily from liquid NSE stocks. 

By operating entirely on open data with zero proprietary data costs, AlphaScope democratizes the kind of signal detection historically reserved for institutional trading desks.

---
<div align="center">
  <small>Built for the ET AI Hackathon 2026</small>
</div>
