# Waste Collector System (Enhanced)

A mobile waste-collection management app for Admin, Driver and Resident roles.
Mobile: React Native + TypeScript + Expo SDK 54. API: Express + SQLite.

## What's improved in this version
- Login and resident registration validation with inline required-field errors and email/password checks.
- Password show/hide controls on login and registration.
- Fixed keyboard focus issue by using stable reusable form components and avoiding remounting form fields while typing.
- Resident registration includes a draggable/tappable home pin on the map.
- Residents can choose a house image from their gallery or take a photo with the camera.
- House photos upload to the API server and are stored under `server/uploads` (JPG/PNG/WEBP, up to 8 MB).
- Driver/Admin chat has a Messenger-style contact list, separate conversation screen, back navigation and 3-second message refresh.
- Reorganized code into screens, reusable components and service classes (OOP-oriented).
- Form validation runs on both mobile and API for required registration fields, email format, password length and GPS coordinate ranges.
- Reusable `FormField` components remain mounted while typing, preventing the previous keyboard-dismiss/focus-loss behavior.
- The Admin chat list shows Driver 1 and Driver 2 separately; each opens its own conversation and has a Back to chats action.

## Project structure
```text
Waste_Collector_System/
  mobile/
    App.tsx
    src/
      components/
        FormField.tsx
        HouseholdMapPicker.tsx
        UI.tsx
      screens/
        AuthScreen.tsx
        ChatScreen.tsx
      services/
        api.ts (ApiClient class)
        FormValidator.ts
        PhotoService.ts
      api.ts
      theme.ts
      types.ts
  server/
    src/
      db.js
      server.js
```

## Requirements
- Node.js 22 recommended
- npm
- Expo Go compatible with SDK 54
- Computer and phone connected to the same Wi-Fi for LAN testing

## 1. Configure mobile API address
Create `mobile/.env` (do not overwrite `.env.example`) and set your computer's current Wi-Fi IPv4:
```env
EXPO_PUBLIC_API_URL=http://YOUR_PC_IPV4:4000/api
```
Example only:
`EXPO_PUBLIC_API_URL=http://192.168.1.10:4000/api`

## 2. Start API server
```bash
cd server
npm install
npm run dev
```
API health test:
`http://YOUR_PC_IPV4:4000/api/health`

The API creates `waste_collector.db` on first run. Uploaded house photos are stored in `server/uploads`.

## 3. Start mobile app
Open a second terminal:
```bash
cd mobile
npm install
npx expo install expo-image-picker
npx expo start --clear
```
Scan the QR code using Expo Go. Keep the API terminal running while testing the app.

## Demo accounts
- Admin: `admin@wastecollector.local` / `Admin123!`
- Driver 1: `driver1@wastecollector.local` / `Driver123!`
- Driver 2: `driver2@wastecollector.local` / `Driver123!`
- Resident: `resident@wastecollector.local` / `Resident123!`

## Important
- Keep your existing `.env` and `server/waste_collector.db` when updating the project.
- The mobile `.env` file is intentionally not included in this ZIP. Create it with your own PC IPv4.
- Chat uses periodic polling, not a persistent WebSocket connection.
- Notifications are stored in the API feed; production remote push notifications still require Expo Push Service/device-token registration.
- Map pins are resident-submitted GPS coordinates; confirm them with residents/municipal staff before real use.
- For deployment, configure HTTPS, a strong JWT secret, backups, private image storage, access logging and stronger account recovery.
