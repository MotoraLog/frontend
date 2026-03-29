# Frontend

This workspace contains the mobile frontend for the vehicle maintenance MVP.
The application is built with Expo, React Native, TypeScript, and React Navigation,
and it integrates with the backend API for authentication, vehicles, fuel entries,
maintenance entries, reminders, and odometer updates.

## Stack

- Expo SDK 54
- React Native 0.81
- React 19
- TypeScript
- React Navigation
- Axios
- Expo Secure Store with web fallback to localStorage

## Project Layout

The main frontend application lives in [mobile](mobile).

High-level structure:

```text
frontend/
	README.md
	README.pt-BR.md
	mobile/
		App.tsx
		index.ts
		app.json
		.env
		.env.example
		src/
			components/
			context/
			lib/
			navigation/
			screens/
```

Important directories inside [mobile/src](mobile/src):

- [mobile/src/components](mobile/src/components)
	- Shared UI building blocks.
	- Currently includes the screen wrapper used across the app.

- [mobile/src/context](mobile/src/context)
	- Global state and providers.
	- [mobile/src/context/AuthContext.tsx](mobile/src/context/AuthContext.tsx): session bootstrap, sign-in, sign-out, current user.
	- [mobile/src/context/ToastContext.tsx](mobile/src/context/ToastContext.tsx): transient success/info/error notifications.

- [mobile/src/lib](mobile/src/lib)
	- Core application helpers and API integration.
	- [mobile/src/lib/api.ts](mobile/src/lib/api.ts): Axios client, auth header injection, refresh-token flow, API error parsing.
	- [mobile/src/lib/authStorage.ts](mobile/src/lib/authStorage.ts): token persistence using Secure Store on native and localStorage on web.
	- [mobile/src/lib/input.ts](mobile/src/lib/input.ts): formatting and parsing helpers for currency, odometer, decimals, and plate input.
	- [mobile/src/lib/services.ts](mobile/src/lib/services.ts): API service methods grouped by domain.
	- [mobile/src/lib/types.ts](mobile/src/lib/types.ts): API response and entity types.

- [mobile/src/navigation](mobile/src/navigation)
	- App stack definitions and navigation setup.
	- [mobile/src/navigation/AppNavigator.tsx](mobile/src/navigation/AppNavigator.tsx): authenticated and unauthenticated navigation trees.
	- [mobile/src/navigation/types.ts](mobile/src/navigation/types.ts): navigation param typing.

- [mobile/src/screens](mobile/src/screens)
	- Feature screens.
	- Auth: login.
	- Vehicles: list, create/update form, detail.
	- Records: fuel, maintenance, reminders.
	- Utility: dashboard and profile.

## Current Features

- Authentication with backend login and token refresh.
- Vehicle CRUD.
- Manual odometer update.
- Fuel entry creation and listing.
- Maintenance entry creation and listing.
- Reminder creation and listing.
- Search, pagination, pull-to-refresh, and toast feedback.
- Web support through Expo web.

## Prerequisites

- Node.js 20+
- npm
- Running backend API

Optional:

- Android emulator
- iOS simulator on macOS
- Expo Go on a physical device

## Environment Variables

The frontend uses [mobile/.env.example](mobile/.env.example) as reference.

Required variable:

```env
EXPO_PUBLIC_API_URL=http://localhost:3000
```

Notes:

- The frontend automatically appends `/api` if needed.
- For web usage, the backend must allow the frontend origin via CORS.

## Backend Dependency

This frontend expects the backend repository to be running.

Important backend expectations:

- API base URL available at `/api`
- Auth endpoints enabled
- Database configured
- CORS configured for web access

If you are running the frontend in the browser, make sure the backend allows the web origin, for example:

```env
CORS_ALLOWED_ORIGINS=http://localhost:8081,http://localhost:19006
```

## Setup

From the frontend root:

```bash
cd mobile
npm install
```

Create the local environment file:

```bash
cp .env.example .env
```

Then adjust `EXPO_PUBLIC_API_URL` to your backend host.

## Running the App

Start Expo:

```bash
cd mobile
npm run start
```

Platform-specific commands:

- Web:

```bash
cd mobile
npm run web
```

- Android:

```bash
cd mobile
npm run android
```

- iOS:

```bash
cd mobile
npm run ios
```

If you need a clean Expo cache:

```bash
cd mobile
npx expo start -c
```

## Type Checking

Run TypeScript validation:

```bash
cd mobile
npx tsc --noEmit
```

## Main User Flows

1. Sign in with backend credentials.
2. Open the vehicle list.
3. Create or edit a vehicle.
4. Open vehicle details.
5. Add fuel entries, maintenance entries, or reminders.
6. Update odometer when needed.

## Odometer Rules

- Vehicle create/edit accepts odometer input.
- Manual odometer update does not allow regression.
- Fuel and maintenance entries can be created with odometer values lower than the current vehicle odometer.
- Fuel and maintenance only update the vehicle odometer when the informed value is higher than the current one.

## Notes for Web Usage

- Authentication storage uses localStorage on web.
- Native builds use Expo Secure Store.
- After changing `.env`, restart Expo.

## Troubleshooting

- CORS errors on web:
	- Check backend `CORS_ALLOWED_ORIGINS`.
	- Restart the backend after environment changes.

- Authentication errors:
	- Confirm `EXPO_PUBLIC_API_URL` points to the correct backend.
	- Confirm the backend is reachable in the browser.

- Environment changes not applied:
	- Restart Expo.
	- If needed, clear cache with `npx expo start -c`.

- Type errors:
	- Run `npx tsc --noEmit` inside [mobile](mobile).

## Related Files

- [MVP_Frontend.md](MVP_Frontend.md)
- [mobile/package.json](mobile/package.json)
- [mobile/.env.example](mobile/.env.example)
