# 🏟️ Pro Football Live Studio — Version 2

## Mobile Camera + Real-Time Remote Control + Low-Cost Facebook Live
### ប្រព័ន្ធផ្សាយផ្ទាល់ការប្រកួតបាល់ទាត់អាជីព ដោយប្រើទូរស័ព្ទដៃពីរគ្រឿង

---

## 🌟 Overview / ទិដ្ឋភាពទូទៅ

**English:**  
Pro Football Live Studio v2 is an enterprise-grade, cost-effective live football broadcasting system engineered specifically for mobile productions. Utilizing two smartphones:
- **Phone A (Camera & Studio)**: High-definition 720p 30fps video capture, real-time sports broadcast graphics composite, and direct RTMPS transmission.
- **Phone B (Remote Control)**: Web-based, zero-install touch control panel for live scores, match clock, yellow/red cards, scenes, sponsors, and multilingual scrolling tickers.

**ខ្មែរ:**  
Pro Football Live Studio v2 គឺជាប្រព័ន្ធផ្សាយផ្ទាល់ការប្រកួតបាល់ទាត់កម្រិតអាជីពដែលបង្កើតឡើងសម្រាប់ការផ្សាយតាមទូរស័ព្ទដៃដោយចំណាយតិចបំផុត៖
- **Phone A (Camera & Studio)**: ថតវីដេអូកម្រិត 720p 30fps បញ្ចូលក្រាហ្វិកពិន្ទុផ្ទាល់ និងបញ្ជូនទៅ Facebook Live។
- **Phone B (Remote Control)**: ផ្ទាំងបញ្ជាតាម Web Browser មិនបាច់ដំឡើង App សម្រាប់បូកពិន្ទុ បញ្ជាម៉ោង ដាក់កាត និងផ្លាស់ប្តូរ Sponsor។

---

## 🏗️ Architecture / ស្ថាបត្យកម្ម

```
pro-football-live-studio/
├── client/                     # Vite + React 18 + TypeScript SPA
│   ├── src/pages/             # StudioPage (Phone A), RemotePage (Phone B), OverlayPage (OBS/Larix)
│   ├── src/features/          # Scoreboard, live-studio, remote-control, tournament, sponsors
│   └── src/lib/               # Canvas compositing engine, Socket.io client, API
├── server/                     # Node.js + Express + TypeScript + Socket.IO
│   ├── src/routes/            # REST API (auth, matches, tournaments, sponsors, stream)
│   ├── src/websocket/         # Real-time room handling, idempotency store, authoritative state
│   ├── src/database/          # Google Sheets API adapter + JSON persistent snapshot fallback
│   └── src/auth/              # JWT, bcrypt, pairing code manager
├── shared/                     # Shared TypeScript contracts, Zod schemas, socket events
├── scripts/                    # setup-database.ts (creates all 12 sheets)
├── docs/                      # architecture.md, streaming-setup.md, deployment.md, testing.md
└── render.yaml                 # Blueprint for Render cloud hosting
```

---

## 🚀 Quick Start / ការចាប់ផ្តើម

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

### 3. Initialize Database
```bash
npm run setup:db
```

### 4. Build Monorepo
```bash
npm run build
```

### 5. Start Development Server
```bash
npm run dev
```
- Client runs at: `http://localhost:3000`
- Server API & WebSocket runs at: `http://localhost:5000`

---

## 📱 Two-Phone Workflow / របៀបប្រើប្រាស់ទូរស័ព្ទពីរគ្រឿង

### Step 1: Phone A (Camera & Studio)
1. Open `http://<your-server-ip>:3000/studio` on **Phone A**.
2. Allow camera and microphone permissions.
3. Select **Back Camera** and **720p HD**.
4. Tap **Pair Phone B** to display the QR Code and 6-digit pairing code.

### Step 2: Phone B (Remote Control)
1. Open `http://<your-server-ip>:3000/remote` on **Phone B** (or scan Phone A's QR Code).
2. Enter the 6-digit pairing code (e.g. `889922`).
3. Tap **+ GOAL** or **START CLOCK** — Phone A updates instantly in under 50ms!

### Step 3: Stream to Facebook Live
- **Option 1 (Zero PC)**: Run **Larix Broadcaster** on Phone A, add Facebook Live RTMPS destination, and add your web overlay URL (`https://<domain>/overlay?matchId=xyz`) as a **Web Layer**.
- **Option 2 (PC Fallback)**: In **OBS Studio**, add Phone A video and add `https://<domain>/overlay?matchId=xyz` as a **Browser Source** (1280x720).

---

## 📚 Technical Documentation / ឯកសារបច្ចេកទេស

- [Architecture & Feasibility Study](docs/architecture.md)
- [Streaming & Facebook Live Setup Guide](docs/streaming-setup.md)
- [GitHub & Render Deployment Guide](docs/deployment.md)
- [Testing & Acceptance Criteria](docs/testing.md)

---

## 🛡️ Security & Reliability

- **Authoritative Server State**: Clock and scores are computed server-side to prevent client drift.
- **Idempotency Protection**: Command deduplication ensures duplicate packets never award duplicate goals.
- **Short-Lived 6-Digit Pairing Codes**: Authenticates Phone B securely without exposing permanent credentials.
- **Render Sleep Resiliency**: Periodic snapshots saved every 15s to surviving storage with auto-restore on wake-up.
