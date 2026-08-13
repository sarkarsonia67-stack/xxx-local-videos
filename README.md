# Fetcher Updated Complete ZIP

## Run
1. Install Node.js 18+.
2. Extract ZIP.
3. Run `npm install`.
4. Run `npm start`.
5. Open `http://localhost:3000`.
6. Admin: `http://localhost:3000/admin`
7. Default admin password: `850931@`

## Included
- Separate Admin URL/dashboard
- Admin login/logout
- User/video/bank/earning tables
- Video approve/reject
- Bank approve/reject
- User 30-day-view/earning summary UI
- Transfer action UI
- Ads settings
- Admin password change
- Responsive video home page
- Search by title/hashtag
- 2-column video cards
- Watch modal, views, likes, comments
- Firebase project configuration endpoint

## Production note
This ZIP is a runnable starter/demo and stores demo state in browser localStorage.
For real production deployment, migrate authentication, videos, comments, bank data,
earnings and payouts to Firebase Auth + Realtime Database + Firebase Storage with
Firebase Security Rules/custom claims. Never expose service-account credentials in frontend.
