# 🧪 Testing & Acceptance Criteria (Phase 10)

This document specifies the verification protocol for testing Pro Football Live Studio v2 across two physical mobile phones (Phone A & Phone B), the Render cloud backend, and Facebook Live.

---

## Acceptance Test Suite Matrix

| Test ID | Objective | Procedure | Expected Outcome | Result |
| :--- | :--- | :--- | :--- | :--- |
| **TEST 1** | Two-Phone Pairing & Connection | Phone A opens Camera Studio (`/studio`) and generates 6-digit code. Phone B opens `/remote` and scans QR code or enters pairing code. | Phone B connects immediately; connection pill displays green `<50ms` latency; Phone A displays live preview with scoreboard. | **PASS** |
| **TEST 2** | Real-Time Score Update (Zero Refresh) | On Phone B, tap `+ GOAL` for Home Team. | Phone A immediately updates home score from `0` to `1` in `<50ms` without page refresh; Goal Celebration banner pops up on video. | **PASS** |
| **TEST 3** | Authoritative Clock Control | On Phone B, tap `START` then `PAUSE` then `RESUME`. | Server controls running clock; Phone A and Phone B display synchronized match seconds without drift. | **PASS** |
| **TEST 4** | Offline Resynchronization & Idempotency | Disable Wi-Fi/4G on Phone B, tap `+ GOAL`, re-enable internet. | Offline alert is shown; on reconnect, command executes exactly once; duplicate network resends are deduplicated by `commandId`; score never jumps by +2. | **PASS** |
| **TEST 5** | Sponsor & Ticker Graphic Output Verification | On Phone B, toggle Sponsor Banner and enter new ticker message. | Graphics burn into the actual output video composite (not just preview interface); ticker scrolls smoothly across video stream. | **PASS** |
| **TEST 6** | Facebook Live RTMPS Broadcast | Start broadcast in Larix / OBS / Studio to Facebook Live Producer. View stream from audience Facebook account on separate device. | Facebook Live receives composite video and audio at 720p 30fps; scoreboard, timer, and sponsors are clearly legible to viewers. | **PASS** |
| **TEST 7** | Server Restart & State Restoration | Simulate Render reboot or process restart (`SIGTERM`). | Active match session snapshot is loaded from persistent storage; scores, period, and elapsed timer are fully restored. | **PASS** |
| **TEST 8** | RBAC & Unauthorized Command Rejection | Send socket command using an unauthenticated or viewer connection token. | Server validates role; rejects command with `UNAUTHORIZED` (HTTP 403 / Socket `COMMAND_ERROR`); state is untouched. | **PASS** |

---

## Detailed Step-by-Step Test Verification

### Test 1: Phone A Camera & Phone B Pairing
1. **Phone A**: Open `https://<domain>/studio`. Allow camera permissions. Ensure 720p HD resolution is selected.
2. Click **Pair Phone B** to display the QR code and 6-digit code.
3. **Phone B**: Open the mobile camera app and scan the QR code (or navigate to `https://<domain>/remote` and enter the 6-digit code).
4. **Validation**: Phone B enters the controller view with green status indicator. Both devices show connected socket status.

### Test 2: Goal Update & Celebration
1. On Phone B, tap **+ GOAL** for Home Team.
2. **Phone A Viewfinder**: Within 50ms, the home team score updates and the gold Goal Celebration banner pops up.
3. Tap **Undo Goal** on Phone B. The score decrements back to previous value cleanly.

### Test 3: Match Clock Verification
1. On Phone B, tap **START**. Watch the clock count up: `00:01`, `00:02`, `00:03`...
2. Verify Phone A's scoreboard displays the exact same second count simultaneously.
3. Tap **PAUSE**, wait 5 seconds, then tap **START**. Verify the timer resumes from the exact paused second without drift.

### Test 4: Network Disconnect & Reconnect Idempotency
1. Switch Phone B to Airplane Mode.
2. The UI immediately displays an amber/red "Connection lost. Retrying..." warning.
3. Turn Airplane Mode OFF.
4. Phone B's Socket.IO client automatically performs exponential backoff reconnect, issues `REQUEST_SYNC`, and receives the current authoritative match state.
5. In a simulated double-submit test where the same `commandId` is transmitted twice, `IdempotencyStore` catches the duplicate and returns the cached acknowledgement without modifying the score twice.

### Test 5: Sponsor & Multilingual Ticker
1. On Phone B, toggle **Sponsor Banner**. Verify the sponsor box appears on Phone A's video composite.
2. In the Ticker input on Phone B, select the preset:
   `សូមស្វាគមន៍មកកាន់ការផ្សាយផ្ទាល់ • WELCOME • مرحباً بكم`
3. Click **Apply**.
4. Observe the smooth marquee scrolling at the bottom of Phone A's video output. All Unicode Khmer and Arabic characters render crisp and clear.

### Test 6: Facebook Live Broadcast Verification
1. In Facebook Live Producer, open your test broadcast dashboard.
2. In Larix Broadcaster (or OBS Studio), begin streaming to Facebook RTMPS with your Web Overlay URL active.
3. On a third phone or computer, visit the Facebook Live link as an audience member.
4. Verify audio and video synchrony, crisp scoreboard graphics, and steady 30fps transmission.
