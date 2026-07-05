# Shohoj Hishab (সহজ হিসাব) — Unit & Land Converter

A cozy, bilingual (Bengali & English) Android app for converting Bangladeshi land measurements and everyday units, with a built-in calculator and live currency rates.

> Published on the Google Play Store · App ID `com.linkon.shohojhishab`

## Features

- **🌾 Land converter (core feature):** All Bangladeshi land units — shotok (decimal), katha, bigha, kani, chotak, ojutangsho, gonda, kora, kranti, til, keyar, poa — with a **region selector** (Dhaka standard, Chattogram, Sylhet, Khulna-Barishal, Rajshahi-Rangpur), since land units differ regionally. Also supports Indian and Pakistani units.
- **Traditional breakdown:** results shown as "X bigha Y katha Z chotak", the way land is actually described.
- **📏 General converter:** length, weight, temperature, area, volume, speed, time, data — including traditional units (haat, gaz, tola, seer, mon).
- **💱 Currency converter:** live exchange rates with automatic updates and offline fallback.
- **🧮 Built-in calculator:** type expressions directly in the input, or use a bottom-sheet keypad.
- **Bilingual UI** with Bengali numerals (০-৯) and lakh/crore formatting.
- **Offline-capable**, no accounts, no ads, no data collection.

## Tech stack

- **Frontend:** React 19 + TypeScript + Vite
- **Styling:** Tailwind CSS
- **Native wrapper:** Capacitor (Android)
- **Currency data:** open.er-api.com (keyless exchange-rate API)

## Development

```bash
npm install
npm run dev        # run in browser at localhost:3000
npm run build      # build for production
npx cap sync       # sync web build into the Android project
```

To open the native Android project in Android Studio:

```bash
npx cap open android
```

## Author

**Ashraful Islam** — [GitHub: @ailinkon](https://github.com/ailinkon)

## License

© 2026 Ashraful Islam. All rights reserved.
