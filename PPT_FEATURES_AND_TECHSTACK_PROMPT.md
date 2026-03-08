# AI Prompt: Create a PPT for KhethAi – Features + Tech Stack

Copy the prompt below and paste it into ChatGPT, Gemini, Claude, or any AI that can generate slide content or PowerPoint outlines.

---

## PROMPT (copy from here)

Create a professional PowerPoint presentation (outline or slide-by-slide content) for **KhethAi – Smart Farming, Better Harvest**, an AI-powered PWA for Indian farmers. The deck must cover **(1) all implemented features** and **(2) the complete tech stack** used to build the app. Make it suitable for stakeholders, investors, or a project demo.

---

### Part A: Title & overview (1–2 slides)

- **App name:** KhethAi  
- **Tagline:** Smart Farming, Better Harvest  
- **Purpose:** AI-powered crop disease diagnosis and farming support PWA for small-holder farmers in rural India.  
- **Design goals:** Offline-first, village-ready (low-spec devices, 3G), multi-language (English, Hindi, Telugu).

---

### Part B: Tech stack (dedicated slides)

Use one slide per category (or one “Tech Stack” slide with clear sections).

**Frontend & framework**
- **Next.js 14** (App Router) – SSR, API routes, file-based routing  
- **React 18** – UI components  
- **TypeScript** – Type safety across the app  
- **Tailwind CSS** – Styling, dark theme, responsive layout  
- **Framer Motion** – Animations and transitions  
- **Lucide React** – Icons  

**PWA & offline**
- **Service Worker** (custom `sw.js`) – Cache-first strategy for assets and pages  
- **IndexedDB** via **idb** – Client-side DB (user profile, cache, sync queue)  
- **Web App Manifest** – Installable PWA, app-like experience on mobile  

**Maps**
- **Leaflet** + **react-leaflet** – Interactive farm map (center, boundary, crop zones)  

**Backend / APIs (Next.js API routes)**
- **Auth:** Phone OTP – in-memory or **Upstash Redis** (serverless-friendly) for OTP store; **AWS SNS** for SMS; JWT-style token (30 days)  
- **AI:** **Groq** (vision/chat) and/or **AWS Bedrock** (Nova Lite) – crop image analysis and farming chat  
- **Weather:** **OpenWeatherMap** API – current + 7-day forecast  
- **Mandi:** **Data.gov.in (AGMARKNET)** – live crop prices by category and state  

**Infrastructure & deploy**
- **Vercel / Netlify** (or any Node host) – serverless deploy  
- **Upstash Redis** – persistent OTP store so login works across serverless instances (free tier)  
- **Environment variables** – AWS keys, Groq, OpenWeather, Data.gov.in, Upstash (no secrets in code)  

**i18n**
- Custom React context + JSON translation files  
- **English, Hindi, Telugu** – all screens (login, dashboard, crop doctor, weather, mandi, farm, chat, schemes, bottom nav)  
- Language persisted in `localStorage`; no app restart needed  

**Summary line for tech slide:** Next.js 14 + TypeScript + Tailwind + PWA + Leaflet + Groq/Bedrock + OpenWeather + Data.gov.in + AWS SNS + Upstash Redis.

---

### Part C: Implemented features (one feature per slide or logical group)

1. **Authentication (Phone OTP)**  
   - 10-digit Indian phone number; 6-digit OTP via AWS SNS SMS (or on-screen demo if SMS not configured).  
   - OTP stored in Upstash Redis (or in-memory fallback) so verification works on serverless.  
   - JWT valid 30 days; 3 wrong attempts then re-request OTP; OTP expires in 5 minutes.  

2. **Multi-language (i18n)**  
   - English, Hindi, Telugu across the entire app (splash, login, dashboard, crop doctor, weather, mandi, farm, chat, schemes, bottom nav).  
   - Language switcher (e.g. next to logout); selection saved; no restart.  

3. **AI Crop Doctor**  
   - Upload or capture photo; client-side resize/compress for phone (avoids 413 on serverless).  
   - AI returns: disease name, confidence, crop, severity (low/moderate/severe), description, symptoms, treatment (immediate, organic, chemical, prevention).  
   - Scan history (last 20) with thumbnails; stored in localStorage.  
   - Powered by Groq or AWS Bedrock.  

4. **AI Chat (Farming assistant)**  
   - Text chat with AI (Groq or AWS Bedrock); suggested questions in local language.  
   - Voice input in multiple Indian languages (Hindi, Telugu, Tamil, Kannada, etc.).  
   - Chat history and saved threads per provider.  

5. **Weather**  
   - Current weather + 7-day forecast; location-based (geolocation or default).  
   - Temp, feels-like, humidity, wind, visibility, sunrise/sunset; daily min/max, conditions, rain chance.  
   - OpenWeatherMap API.  

6. **Mandi (Market) prices**  
   - Live crop prices from Data.gov.in (AGMARKNET).  
   - Filters: category (Cereals, Pulses, Vegetables, Fruits, Spices, Oilseeds), state (All India + major states).  
   - Min/max/modal price, change %, market, date; search; refresh.  
   - All labels translated (i18n).  

7. **My Farm**  
   - Farm profile: total area (acres/hectares), location.  
   - Interactive Leaflet map: set center, draw boundary, save; crop zones with name, crop, area, planting/harvest dates, health (healthy/attention/critical), notes.  
   - Add/edit/delete zones; data in localStorage.  

8. **Government schemes**  
   - Curated schemes: name, benefit, description, eligibility, how to apply, official link.  
   - Examples: PM-KISAN, PMFBY, KCC, etc.; expandable cards; “Visit Official Website” CTA.  
   - Section headers translated (Eligibility, How to apply).  

9. **Offline-first PWA**  
   - Service worker caches assets and key pages; works without internet.  
   - Offline indicator; dedicated offline fallback page.  
   - Installable as app; village-ready: 48px+ touch targets, high contrast, icon-heavy UI.  

10. **Village-ready UX**  
    - Low-spec and 3G friendly; bottom nav (Home, Scan, AI Chat, Market, Farm); all nav labels translated.  
    - Large touch targets; readable fonts; minimal payload where possible.  

---

### Part D: Closing

- **Summary slide:** “Why KhethAi” – diagnosis, live prices, weather, schemes, offline, local language, one app.  
- **Tech summary:** One line or a small diagram: Next.js + TypeScript + Tailwind + PWA + Leaflet + Groq/Bedrock + OpenWeather + Data.gov.in + AWS SNS + Upstash Redis.  

**Tone and format**
- Short bullet points per slide; no long paragraphs.  
- One icon or visual idea per slide (e.g. phone for auth, leaf for crop doctor, cloud for weather, server/box for tech stack).  
- Optional: suggest a color palette (greens/earth tones + one accent e.g. amber for mandi, blue for weather).  

---

## END PROMPT

---

**How to use**
- **ChatGPT / Claude / Gemini:** Paste the prompt and ask for “slide-by-slide bullet points” or “outline for PowerPoint”; then copy into PowerPoint or Google Slides.  
- **Gamma, Beautiful.ai, Canva:** Use the same prompt; ask for a deck on “KhethAi app – features and tech stack.”
