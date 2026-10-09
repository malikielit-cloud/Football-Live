# 📡 Streaming Setup & Facebook Live Guide

## 1. Facebook Live Producer Setup

1. Open [Facebook Live Producer](https://www.facebook.com/live/producer/).
2. Under **Select a video source**, select **Streaming software**.
3. Under **Stream setup**:
   - **Server URL**: `rtmps://live-api-s.facebook.com:443/rtmp/`
   - **Stream Key**: Copy your unique Stream Key (e.g. `FB-1234567890-abcdef`).
   - Toggle **Persistent Stream Key** ON if you want to reuse this key for upcoming matches.
4. Under **Settings > Stream**:
   - Enable **Embed video** (optional).
   - Check **End broadcast when stream ends**.
5. Set match title (e.g., `🏆 Live Football: Phnom Penh Crown vs Visakha FC`) and select your Facebook Page.

---

## 2. Option A: Zero-PC Streaming via Phone A (Larix Broadcaster) — Recommended

**Larix Broadcaster** is a free, high-performance broadcast app available for iOS and Android that supports hardware-accelerated H.264/HEVC encoding and **Web URL Overlays**.

### Step 1: Install Larix Broadcaster
- Download **Larix Broadcaster** from the [Google Play Store](https://play.google.com/store/apps/details?id=com.wmspanel.larix_broadcaster) or [Apple App Store](https://apps.apple.com/app/larix-broadcaster/id1042474385).

### Step 2: Configure Facebook Live RTMPS Target
1. Open Larix Broadcaster and tap the **Gear (Settings)** icon.
2. Tap **Connections** > **New Connection**.
3. Enter:
   - **Name**: `Facebook Live Match`
   - **URL**: `rtmps://live-api-s.facebook.com:443/rtmp/<YOUR_STREAM_KEY>`
4. Tap **Save**.

### Step 3: Add Real-Time Scoreboard Web Overlay
1. In Larix Settings, tap **Overlays** > **Web Layers** (or tap **Layers** on the main camera viewfinder).
2. Tap **Add Web Layer**.
3. Enter your live overlay URL:
   ```
   https://<your-render-domain>.onrender.com/overlay?matchId=match-live-01
   ```
4. Set Layer size to **1280 x 720** (100% full screen coverage).
5. Verify the scoreboard appears seamlessly on the live camera preview with a transparent background!

### Step 4: Recommended Encoding Settings
- **Video**: 1280x720 (720p HD)
- **FPS**: 30 fps
- **Bitrate**: 2500 – 3000 Kbps (ensure a minimum 4G/5G upload speed of 5 Mbps)
- **Keyframe Interval**: 2 seconds (mandatory for Facebook Live)
- **Audio**: AAC, 44.1 kHz, 128 Kbps stereo.

### Step 5: Go Live!
Tap the big red **Broadcast** button in Larix. Within 3 seconds, video with burned-in scoreboard graphics appears on Facebook Live Producer. Click **Go Live** on Facebook!

---

## 3. Option B: In-Browser Studio (Built-in Web Studio)

1. On Phone A, open Chrome or Safari and navigate to:
   ```
   https://<your-render-domain>.onrender.com/studio
   ```
2. Grant permissions for Camera and Microphone.
3. Select **Back Camera** and preset **720p HD**.
4. The canvas composite engine renders the live camera background and overlays the sports scoreboard.
5. Tap **Pair Phone B** to display the QR Code.

---

## 4. Option C: OBS Studio Fallback on PC (Workstation Setup)

If you have a laptop or desktop PC available near the pitch:

1. Connect Phone A to your PC as a camera source using:
   - **DroidCam OBS** (USB / Wi-Fi) or **VDO.ninja** (browser-to-browser WebRTC link).
2. Open **OBS Studio**:
   - In **Sources**, click **+** > **Video Capture Device** (Select Phone A / DroidCam).
   - Click **+** > **Browser**:
     - **URL**: `https://<your-render-domain>.onrender.com/overlay?matchId=match-live-01`
     - **Width**: `1280`
     - **Height**: `720`
     - **Custom CSS**:
       ```css
       body { background-color: rgba(0, 0, 0, 0); margin: 0px auto; overflow: hidden; }
       ```
3. In OBS **Settings > Stream**:
   - **Service**: Facebook Live
   - **Server**: Default
   - **Stream Key**: Paste your Facebook Stream Key
4. Click **Start Streaming** in OBS Studio.

---

## 5. Phone B Pairing Instructions

1. On Phone B, open Safari or Chrome.
2. Either scan the QR code displayed on Phone A, or navigate to:
   ```
   https://<your-render-domain>.onrender.com/remote
   ```
3. Enter the 6-digit Pairing Code displayed on Phone A (e.g., `889922`).
4. You are now securely paired! Tap **+ GOAL** or **START CLOCK**, and Phone A updates in under 50 milliseconds!
