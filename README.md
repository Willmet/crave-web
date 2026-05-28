# Crave 食遇 — Web App

Single-file vanilla JS web app mirroring the RN app's Step 1-3 flow:

1. **定位** — browser Geolocation API + Leaflet (OpenStreetMap tiles)
2. **菜系轉盤** — auto-detect 22 dish categories via Google Places API (New) in area, CSS `conic-gradient` wheel + transform animation
3. **餐廳清單** — Top 3-5 by algo_v1 (port of `lib/algo.ts`); 情境 chip filter row

Click a restaurant card → opens Google Maps with that place pre-loaded.

## Usage

### Local
Open `index.html` directly in a browser (file:// works for everything except geolocation on some browsers — use HTTPS for full geolocation support).

### GitHub Pages
Enable Pages on this repo (Crave-app) → Settings → Pages → Source = `main` branch, `/docs` folder.
URL becomes `https://<owner>.github.io/Crave-app/` once deployed.

### Google Places API key
First load prompts for API key (stored in browser `localStorage`, not transmitted anywhere).

To pre-load via URL (handy for transferring to a new device):
```
https://<owner>.github.io/Crave-app/#key=AIzaSy...
```
The key is stripped from the URL after loading (history.replaceState).

## Limits

- Geolocation needs HTTPS on iOS Safari (Pages provides this).
- 22 parallel `searchNearby` calls per area detection — quota usage spike. The GCP project's $300/mo budget alert is in place.
- No offline mode. No persistence beyond API key.
- 情境 chip is **display only** in v1 (project_crave.md A9) — does not filter the candidate pool. Future-algo seed lines are logged to browser console.
