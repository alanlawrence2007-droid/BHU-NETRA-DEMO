# BHU-NETRA — Landslide Early Warning for India

> Know if your hillside is safe, before the rain decides for you.

BHU-NETRA is a landslide early warning web app for India's hill districts. It combines satellite rainfall data, ground-movement data and reports from nearby residents to warn people up to 24 hours ahead, and again in the final hour before a possible landslide. Every alert comes with a route to the nearest verified safe zone.

Built for **Smart India Hackathon 2026** (problem statement SIH26001).

**Live demo:** https://bhu-netra-demo-3smk.vercel.app/

> This is a working prototype built for a hackathon. The data shown in the demo is for demonstration only and must not be used for real safety decisions.

## The problem

Most warning systems only say that a whole district is at risk. They don't tell a family on a particular hillside what to do, and they rely on expensive ground sensors that most areas don't have.

## What BHU-NETRA does

- **24-hour outlook:** combines rainfall trends, soil moisture and terrain history into a day-ahead risk score for each hillside.
- **Under-1-hour nowcast:** escalates the alert when rainfall spikes on shifting ground and neighbours report cracks.
- **Safe route:** guides the user to the nearest verified safe zone and avoids roads that neighbours have marked as blocked.
- **No hardware sensors needed:** uses free satellite rainfall and ground-movement data.
- **Installable and offline-ready:** works as a Progressive Web App (PWA), so it can be installed on a phone or desktop and keeps working with poor signal.

## How it works

1. **Data comes in:** satellite rainfall and ground-movement data.
2. **Risk is scored:** a model trained on historical landslide records turns the data into a live risk level.
3. **Neighbours confirm:** citizen reports of cracks or movement sharpen the alert.
4. **You're notified:** push, SMS or a call, with a route to safety attached.

## Features

| Page | What it does |
| --- | --- |
| Dashboard | Risk for your saved location (next 24 hours and next 1 hour), recent alerts, quick actions |
| Live risk map | Every monitored hillside region marked as Stable, Watch or Warning |
| Alert history | Past alerts, filterable by 24-hour outlook or under-1-hour alerts |
| Safe route | Nearest verified shelter with distance and walking time; mark a road as blocked; "I'm safe / I need help" |
| Report a hazard | Report cracks, unusual sounds, muddy water or blocked roads, with a photo and map pin; works offline and uploads when signal returns |
| What-if simulator | Change rainfall, duration, soil moisture, slope and vegetation to see how risk changes (presets: Normal, Heavy Rain, Cloudburst, Saturated Soil, Road Cut) |
| Community map | Reports from people nearby |
| Authority dashboard | District-level view with 24-hour outlook, 1-hour nowcast and rainfall per region, plus a downloadable daily bulletin (JSON) |
| Settings | Dark/light theme, English and Hindi, push and SMS alerts, saved locations |

## Install as an app

1. Open the [live demo](https://bhu-netra-demo-3smk.vercel.app/) in Chrome.
2. Click the **Install** icon in the address bar (on a phone: menu, then **Add to Home screen**).
3. BHU-NETRA opens like a normal app, with its own icon.

## Tech stack

- Frontend: HTML, CSS, JavaScript (Progressive Web App with a service worker)
- Hosting: Vercel
- Built with the help of Claude

## Run it locally

```bash
git clone https://github.com/alanlawrence2007-droid/BHU-NETRA-DEMO.git
cd BHU-NETRA-DEMO
```

Open `index.html` in your browser. To test the install and offline features, serve the folder with a static server instead (for example `npx serve`), because service workers don't run from a plain file.

## Project structure

| File | Purpose |
| --- | --- |
| `index.html` | The whole app: pages, styles and logic |
| `manifest.json` | Makes the app installable (name, icons, theme) |
| `sw.js` | Service worker for offline support |
| `icon-192.png`, `icon-512.png` | App icons |

## Team

- **Alan Lawrence** — Team Leader, built the demo web app

## License

Add a license if you want others to reuse the code, for example MIT.
