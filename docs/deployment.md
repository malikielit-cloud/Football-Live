# 🚀 Deployment Guide: GitHub & Render

## 1. GitHub Setup Guide

### Step 1: Initialize Git Repository
Run the following in the project root:
```bash
git init
git add .
git commit -m "feat: Initial commit of Pro Football Live Studio v2"
```

### Step 2: Push to GitHub
1. Create a new repository on [GitHub](https://github.com/new) named `pro-football-live-studio`.
2. Connect your local repository and push:
```bash
git remote add origin https://github.com/<your-username>/pro-football-live-studio.git
git branch -M main
git push -u origin main
```

---

## 2. Render Deployment Guide

### Option A: Automatic Blueprint Deployment (`render.yaml`)
1. Log in to your [Render Dashboard](https://dashboard.render.com/).
2. Click **Blueprints** > **New Blueprint Instance**.
3. Select your `pro-football-live-studio` repository.
4. Render will parse `render.yaml` and configure the Web Service with build commands and environment variables automatically.
5. Click **Apply**.

### Option B: Manual Web Service Creation
1. Click **New +** > **Web Service**.
2. Connect your GitHub repository.
3. Configure the service:
   - **Name**: `pro-football-live-studio`
   - **Region**: Oregon (US West) or closest to your broadcast location
   - **Branch**: `main`
   - **Runtime**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm run start`
   - **Plan**: `Free`
4. Add the following **Environment Variables**:
   | Variable | Value | Description |
   | :--- | :--- | :--- |
   | `NODE_ENV` | `production` | Production mode |
   | `PORT` | `10000` | Port assigned by Render |
   | `JWT_SECRET` | *(Random 32+ character string)* | Secret for auth tokens |
   | `DB_ADAPTER` | `file` or `sheets` | Set to `sheets` if using Google Sheets |
   | `GOOGLE_SHEET_ID` | *(Your Google Sheet ID)* | Optional if using Sheets |
   | `GOOGLE_SERVICE_ACCOUNT_EMAIL` | `sa@project.iam.gserviceaccount.com` | Optional if using Sheets |
   | `GOOGLE_PRIVATE_KEY` | `"-----BEGIN PRIVATE KEY-----\n..."` | Optional if using Sheets |
   | `FACEBOOK_RTMPS_URL` | `rtmps://live-api-s.facebook.com:443/rtmp/` | Facebook Live RTMPS Endpoint |
   | `FACEBOOK_STREAM_KEY` | *(Your Facebook Stream Key)* | Secure Stream Key |
   | `ADMIN_EMAIL` | `admin@profootball.live` | Default Director email |
   | `ADMIN_PASSWORD` | *(Strong Director Password)* | Default Director password |

5. Click **Create Web Service**. Render will build both client and server and launch the unified HTTPS/WSS service.

---

## 3. Render Free Tier Sleep & State Recovery Strategy

> [!NOTE]
> On the free tier, Render web services enter a sleep state after 15 minutes without incoming HTTP traffic.

Our architecture is specifically engineered to handle this gracefully:
1. **Periodic Snapshot Persistence**: Every 15 seconds during active matches, `MatchService` writes a state snapshot to `server/data/db.json` and optionally syncs snapshots to the `MatchSessions` Google Sheet.
2. **Cold-Start Restoration**: When an operator opens the app or enters a pairing code, Render wakes up. During bootstrap, the server automatically reads snapshots and restores the exact score, period, elapsed clock, team colors, and scenes into memory.
3. **Client Exponential Reconnect**: The Socket.IO client automatically detects disconnection, displays an offline indicator on Phone B, and resumes with `REQUEST_SYNC` upon server wake-up without dropping state or duplicating scores.

---

## 4. Google Sheets Database Configuration

If choosing `DB_ADAPTER=sheets`:

1. **Create Google Spreadsheet**:
   - Create a blank Google Sheet in Google Drive. Copy the Spreadsheet ID from the URL:
     `https://docs.google.com/spreadsheets/d/<SPREADSHEET_ID>/edit`
2. **Setup Google Cloud Service Account**:
   - Go to [Google Cloud Console](https://console.cloud.google.com/).
   - Create a project and enable the **Google Sheets API**.
   - Create a **Service Account** under IAM & Admin > Service Accounts.
   - Click **Keys** > **Add Key** > **Create new key (JSON)**. Download the key file.
3. **Grant Access**:
   - Open your Google Spreadsheet and click **Share**.
   - Paste the Service Account's email (e.g. `football-studio-sa@...iam.gserviceaccount.com`) as **Editor**.
4. **Initialize Sheets Schemas**:
   - Add your Google credentials to `.env`.
   - Run the automated setup script:
     ```bash
     npm run setup:db
     ```
   - This script automatically creates and formats all 12 sheets:
     `Users`, `Tournaments`, `Teams`, `Players`, `Matches`, `MatchSessions`, `MatchEvents`, `Sponsors`, `SponsorSchedules`, `ScoreHistory`, `AuditLogs`, `AppSettings`.
