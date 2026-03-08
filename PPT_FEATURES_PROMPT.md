# AI Prompt: Create a PPT for KhethAi Farm App Features

Copy the prompt below and paste it into ChatGPT, Gemini, Claude, or any AI that can generate slide content or PowerPoint outlines.

---

## PROMPT (copy from here)

Create a professional PowerPoint presentation (outline or slide-by-slide content) for **KhethAi – Smart Farming, Better Harvest**, an AI-powered PWA for Indian farmers. The deck should cover **all implemented features** in a clear, visual way suitable for stakeholders or investors.

### App overview (use for title + intro slides)
- **Name:** KhethAi
- **Tagline:** Smart Farming, Better Harvest
- **Purpose:** AI-powered crop disease diagnosis and farming support PWA for small-holder farmers in rural India
- **Tech:** Next.js 14, TypeScript, Tailwind CSS, PWA (offline-first), multi-language (EN/Hindi/Telugu)

### Slides to include – one feature per slide (or logical grouping)

1. **Authentication (Phone OTP)**
   - Login/register with 10-digit Indian phone number
   - 6-digit OTP sent via AWS SNS SMS (with demo fallback when SMS is not configured)
   - JWT token valid for 30 days; 3 OTP attempts before lockout; OTP expires in 5 minutes

2. **Multi-language support (i18n)**
   - English, Hindi, Telugu (extensible)
   - Language switcher in header; all UI labels, buttons, and messages translated
   - No app restart needed when switching language

3. **AI Crop Doctor**
   - Upload or capture photo of diseased crop
   - AI diagnosis returns: disease name, confidence score, affected crop part, severity (low/moderate/severe)
   - Treatment plan: immediate actions, organic options, chemical options, prevention tips
   - Scan history saved locally (last 20 scans) with thumbnails and results

4. **AI Chat (Farming assistant)**
   - Chat with AI for farming questions (Groq or AWS Bedrock)
   - Voice input support (multiple Indian languages: Hindi, Telugu, Tamil, Kannada, etc.)
   - Chat history and saved threads per provider
   - Multilingual voice recognition and conversation

5. **Weather**
   - 7-day weather forecast by location
   - Current weather: temperature, feels-like, humidity, wind speed, visibility, sunrise/sunset
   - Daily: max/min temp, conditions, rain chance, icons (sun, clouds, rain, etc.)
   - Uses OpenWeatherMap API; location-based

6. **Mandi (Market) Prices**
   - Live crop prices from Data.gov.in (AGMARKNET)
   - Filter by category: Cereals, Pulses, Vegetables, Fruits, Spices, Oilseeds
   - Filter by state (All India + major states)
   - Shows min, max, modal price, change %, market name, date
   - Refresh and search

7. **My Farm**
   - Farm profile: total area (acres/hectares), location
   - Interactive map: set center, draw farm boundary, save
   - Crop zones: name, crop type, area, planting date, expected harvest, health (healthy/attention/critical), notes
   - Add/edit/delete zones; data persisted locally

8. **Government Schemes**
   - Curated list of schemes with: name, benefit, description, eligibility, how to apply, official link
   - Examples: PM-KISAN, PMFBY (crop insurance), and others
   - Expandable cards with icons and clear CTAs to apply

9. **Offline-first PWA**
   - Works without internet: service worker caches assets and pages
   - Offline indicator when connectivity is lost
   - Dedicated offline fallback page
   - Village-ready: 48px+ touch targets, high contrast, icon-heavy UI
   - Installable as app on phone

10. **Village-ready UX**
    - Designed for low-spec devices and 3G networks
    - Large touch targets, readable fonts, minimal data usage
    - Bottom navigation for main sections (Dashboard, Crop Doctor, Weather, Mandi, Farm, etc.)

### Tone and format
- Use short bullet points per slide; avoid long paragraphs
- Include a “Key takeaway” or “Benefit” line per feature where helpful
- Suggest one simple icon or visual idea per slide (e.g., phone for auth, leaf for crop doctor, cloud for weather)
- Add a closing slide: “Summary” or “Why KhethAi” tying all features to farmer value (diagnosis, prices, weather, schemes, offline access, local language)

### Optional
- If the tool supports it, suggest a color palette: greens and earth tones to match a farming brand, with one accent (e.g., amber for mandi, blue for weather).

---

## END PROMPT

---

Use this prompt in:
- **ChatGPT / Claude / Gemini:** Ask for “slide-by-slide content” or “bullet points for each slide”; then paste into PowerPoint or Google Slides.
- **Gamma, Beautiful.ai, etc.:** Paste the feature list and ask for a deck on “KhethAi app features.”
- **Canva:** Use the bullets as text for each slide and pick icons from the list above.
