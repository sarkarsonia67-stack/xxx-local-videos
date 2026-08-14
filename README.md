# Fetcher

Firebase video platform starter with `/admin` panel.

## Setup
1. Replace Firebase configuration in `js/firebase-config.js` if required.
2. Enable Email/Password Authentication.
3. Enable Realtime Database and Storage.
4. Deploy the rules in `firebase/database.rules.json` and `firebase/storage.rules`.
5. Create the first admin user through Firebase Authentication, then set that user's Realtime Database `role` to `admin`.
6. Open `admin/index.html` for the admin panel.

## Important
The requested password `850931@` is not hard-coded into the frontend. Create/change the admin credential through Firebase Authentication.

## Admin
- `/admin/index.html`
- `/admin/dashboard.html`
- `/admin/users.html`
- `/admin/videos.html`
- `/admin/banks.html`
- `/admin/earnings.html`
- `/admin/ads.html`
- `/admin/settings.html`
