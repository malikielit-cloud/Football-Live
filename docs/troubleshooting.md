# 🔧 Troubleshooting Guide / មគ្គុទ្ទេសក៍ដោះស្រាយបញ្ហា

## 1. Network & Connectivity Issues

### Phone B cannot connect to Phone A (Pairing Code Error)
- **Symptom**: Phone B enters pairing code and receives `Invalid or expired 6-digit pairing code`.
- **Causes & Solution**:
  1. Pairing code has expired: Pairing codes expire after 4 to 24 hours. Click **Reload / Refresh Code** on Phone A to generate a fresh 6-digit code.
  2. Typo in code: Verify that no spaces are entered before or after the 6-digit code.
  3. Ensure Phone B has active internet access (Wi-Fi or 4G/5G).

### Latency is higher than 200ms
- **Symptom**: Phone B score updates take >0.5s to appear on Phone A.
- **Causes & Solution**:
  1. Check mobile connection speed: Football pitch locations often experience cell tower congestion. Switch Phone A or Phone B to 5G or dedicated pitch Wi-Fi.
  2. Verify Render region: Deploy the Render Web Service to the geographic region closest to your match venue (e.g. Singapore or Oregon).

---

## 2. Facebook Live Stream Issues

### Facebook Live Producer shows "Waiting for live video..."
- **Symptom**: Larix Broadcaster or OBS Studio is streaming, but Facebook Producer does not detect incoming video.
- **Causes & Solution**:
  1. Verify the RTMPS URL: Facebook requires `rtmps://live-api-s.facebook.com:443/rtmp/` (ensure `s` is present in `rtmps`).
  2. Verify Stream Key: Ensure the Stream Key was copied accurately and has not expired (if not using Persistent Stream Key).
  3. Keyframe Interval: In Larix or OBS, set Keyframe Interval to strictly **2 seconds**. Facebook Live drops streams that exceed 4s keyframe intervals.

### Stream Buffers or Drops Frames
- **Symptom**: Stream stutters or drops frames on Facebook.
- **Causes & Solution**:
  1. Lower video bitrate: In Larix Broadcaster or OBS, drop the video bitrate from 3000 kbps to 1800–2200 kbps.
  2. Switch from 720p 60fps to 720p 30fps.
  3. Change resolution preset to **480p SD** if upload bandwidth is below 3 Mbps.

---

## 3. Scoreboard & Graphic Overlay Issues

### Scoreboard background is black instead of transparent in OBS
- **Symptom**: In OBS Studio, the browser source shows a black box covering the camera video.
- **Causes & Solution**:
  1. Open the Browser Source properties in OBS.
  2. In the **Custom CSS** field, add:
     ```css
     body { background-color: rgba(0, 0, 0, 0); margin: 0px auto; overflow: hidden; }
     ```
  3. Check the box **Shutdown source when not visible** (leave unchecked during active matches).

### Khmer or Arabic Fonts Look Broken / Not Rendered
- **Symptom**: Khmer letters show square boxes or Arabic text is disconnected.
- **Causes & Solution**:
  1. The app imports Google Fonts `Kantumruy Pro` and standard Unicode UTF-8 font stacks.
  2. Ensure Phone A's browser or Larix WebView has internet access during initial load so web fonts load from Google Fonts CDN.

---

## 4. Google Sheets Database Issues

### Error: `429 Too Many Requests (Quota exceeded)`
- **Symptom**: Server console outputs Google Sheets API rate limit warnings.
- **Causes & Solution**:
  1. Google Sheets API allows 100 requests per 100 seconds per project.
  2. Our system implements an automatic batching queue and exponential backoff retry. It never writes per frame.
  3. If quota errors persist, use the default persistent file adapter (`DB_ADAPTER=file`) which eliminates all Google API quota limits!
