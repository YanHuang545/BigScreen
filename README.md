# BigScreen

A Beijing commercial-cryptography operations center. It gives a duty officer one place to see whether each district is keeping up with crypto evaluation filings, whether monitored systems are online, and which security incidents still need a person to act.

The same product exists twice. A 1920×1080 wall display is for a command room. A WeChat mini program is the same board on a phone, with an admin tab so the numbers can be corrected without a desktop.

## What an operator sees

The city is not only the 16 administrative districts. The board also tracks business hubs that sit inside those districts: Guomao, CBD, Financial Street, Zhongguancun, Wangjing, Lize, Yizhuang, Sanlitun, Wangfujing, and Xidan. Lize is a business area inside Fengtai, not its own district. Selecting a hub still shows that hub’s name, while weather is taken from the parent district.

**Overview.** Six numbers for the selected area: connected organizations, monitored information systems, crypto devices and services, filing completion, system online rate, and device online rate. The header shows temperature, sky, and wind for that place.

**Districts.** A tour of the whole city, the 16 districts, and the 10 hubs. On the wall display this is the center map. In the mini program it is a chip list with a two-second auto tour.

**Trends.** Three series, switchable by month from December 2025 through April 2026:

- Crypto evaluation filings: filed, in testing, passed, failed
- Information systems: online, offline, online rate
- Crypto resources: connected devices, online rate

**Events.** Six sample incidents move through a fixed workflow: not handled, in progress, then closed. The button label changes with the state (`处置` then `再次证明`, then the button disappears).

**Details.** Separate lists for filings, systems, and devices: organization, level, status, and the latest update.

**Weather.** Live conditions come from Open-Meteo. The wall display asks the Express API. The mini program asks the cloud function, which caches the result for ten minutes. If the network call fails, the screen keeps a generated sample so the board never goes blank.

## Why it is split this way

The wall display has to stay readable from across a room, so the Vue app draws a fixed 1920×1080 stage and scales it to the browser window. Charts are ECharts. The selected district is shared, so the filing chart, the system chart, the map, and the weather header all move together.

The phone cannot host MySQL or a long-running Express process. The mini program keeps the same city model and the same event workflow, and stores documents in WeChat CloudBase (`cities`, `series`, `events`, `details`, `weather_cache`). The client never talks to the database directly. A single cloud function, `crypto`, reads and writes those collections and calls the weather API. If cloud is not configured, the app still opens from `miniprogram/data/dashboard.js`. That file is a JavaScript module on purpose: requiring a `.json` file fails on a real device and leaves the city picker with only Dongcheng.

The bottom bar has five tabs, which is the WeChat limit: Overview, Districts, Trends, Events, and Admin. The read-only detail lists are opened from Admin.

## Stack

| Piece | Role |
| --- | --- |
| `frontend/` | Vue 3, Vite, ECharts wall display |
| `backend/` | Express API, mysql2, Open-Meteo weather |
| `admin/` | Static editor for metrics, events, trend points, and detail rows |
| `miniprogram/` | Native WeChat mini program |
| `cloudfunctions/crypto` | CloudBase access, seeding, and weather cache |
| `shared/` | District list shared by the weather code |

MySQL database name: `crypto_screen`. Schema and seed data live in `backend/schema.sql` and `backend/sampleData.js`.

## Run the wall display

```bash
cd backend
npm install
# set the MySQL account in backend/config.js
npm run seed
npm start
```

```bash
cd frontend
npm install
npm run dev
```

Board: http://127.0.0.1:5173/

Admin: http://127.0.0.1:3000/admin/

Saving a city, an event, a trend group, or a detail row in admin updates MySQL. Refresh the board to see it.

## Run the mini program

Open this repository in WeChat DevTools. `project.config.json` is the project file.

1. Sign in with a real mini program AppID. Test numbers and mini-game AppIDs cannot turn on CloudBase.
2. Use the existing cloud environment. Do not create a second one.
3. Right-click `cloudfunctions/crypto` and choose upload and deploy with remote npm install.
4. On Overview, tap **刷新**. The source line should change from the local sample to the cloud database. The first successful read seeds the collections.

For real-device debugging, set the debug base library to **3.11.3**. This phone’s WeChat is on the 3.11 line. A newer debug library fails to create the page webview and the phone stays white. Do not pull to refresh during a debug session; use the Refresh control on Overview. The green vConsole badge is injected by DevTools and is not part of the app.

Admin edits in the mini program update the in-memory sample immediately. After a cloud refresh, the same save buttons also write the cloud collections, so Overview, Trends, and Events stay in sync.

## What this is not

The sample incidents and KPIs are generated operations data for the demo, not a live feed from a regulator. The interesting part is the product shape: one city model, two clients, a command-room layout that still works on a phone, and a write path that does not depend on the wall display being open.
