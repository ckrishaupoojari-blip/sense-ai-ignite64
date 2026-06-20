# 🔥 SenseAI — Emergency Communication Resilience Platform

**Live Application:** https://sense-ai-ignite64.vercel.app/

Built for **IGNITE64 Global AI Hackathon 2026** — Telecom AI Track
Solo Builder: Krisha Udayaprakash Poojari

---

## The Problem

In June 2026, a building fire in New Delhi killed 21 people, including foreign nationals. Communication systems collapsed exactly when they were needed most — WiFi lost power, mobile networks became congested. SenseAI is built to solve exactly that failure: ensuring critical safety information reaches people even when telecom infrastructure fails during a crisis.

## Core Features

- **AI-Powered Building Risk Map** — Real Mumbai buildings scored on fire risk, with live Gemini AI-generated risk briefs (rule-based fallback included for reliability)
- **Offline-First Evacuation Navigator** — Real floor plan (SIES GST, Mumbai), Dijkstra's algorithm routing, fully functional with zero internet connectivity
- **Multi-Agency Real-Time Dispatch** — Live coordination between fire brigade, hospitals, and embassies via Firebase real-time sync

## Tech Stack

React (Vite) · Tailwind CSS · Firebase Firestore · Google Gemini API · React-Leaflet · Service Worker (PWA) · Vercel

## Getting Started

```bash
npm install
npm run dev
```

Create a `.env` file based on `.env.example` with your own Firebase and Gemini API keys.

## AI Tools Disclosure

- **Google Gemini API** — core product feature, live AI-generated risk assessments
- **Claude (Anthropic)** — development and planning assistant during the build

## License

Built for educational and hackathon purposes.
