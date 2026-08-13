# Fetcher v4 — Firebase Connected

## Firebase features now connected
- Firebase Authentication: email/password Signup + Login + Logout
- Realtime Database: users, videos, comments, views, likes, bank requests
- Firebase Storage: video upload with progress bar
- Approved/public videos are read from Realtime Database
- Video approval status is stored in Realtime Database
- Bank verification is stored in Realtime Database

## Your Firebase project
Project ID: xxx-videos-2582e
Realtime Database: https://xxx-videos-2582e-default-rtdb.europe-west1.firebasedatabase.app
Storage bucket: xxx-videos-2582e.firebasestorage.app

## Before first use
In Firebase Console:
1. Authentication -> Sign-in method -> enable Email/Password.
2. Realtime Database -> create/enable the database.
3. Storage -> enable Firebase Storage.
4. Apply `database.rules.json` as Realtime Database rules.
5. Apply `storage.rules` as Storage rules.
6. Create an admin user through Firebase Authentication.
7. In Realtime Database, add:
   admins
     ADMIN_FIREBASE_UID
       true

Do NOT use the old `850931@` client-side password as real production security. Admin access should be controlled by the `admins/{uid}: true` database claim/rule and, for a production admin panel, preferably Firebase custom claims/server-side authorization.

## Run locally
npm install
npm start

Open:
http://localhost:3000
Admin:
http://localhost:3000/admin

## Important
Firebase API keys used by web apps are normally public identifiers. Security comes from Firebase Authentication and Security Rules. Never put a Firebase service-account private key in this project.

The included admin page is still a starter UI and should be updated to use Firebase Auth + admin UID/custom claims for secure moderation actions. The user-facing app is fully wired to Firebase Auth, Realtime Database and Storage.
