# UniVote frontend

Next.js frontend for the UniVote API in `../univote-back`.

## Run locally

1. Install dependencies with `npm install`.
2. Copy `.env.example` to `.env.local`. Set `NEXT_PUBLIC_API_URL` to the backend API URL; the local default is `http://localhost:3001/api/v1`.
3. Keep `NEXT_PUBLIC_DEMO_MODE=false` to use the backend for sign-in and student registration. Set it to `true` only to use the browser-based demonstration accounts and sample data.
4. Start the frontend with `npm run dev` and open [http://localhost:3000](http://localhost:3000).

Start the backend separately; setup instructions are in `../univote-back/README.md`. The database schema must be deployed and an administrator account bootstrapped before staff can sign in. The backend returns OTP codes only in development; a production OTP delivery provider and a reviewed election deployment are required before running a real election.

## Scripts

- `npm run dev`: start the development server.
- `npm run build`: create a production build.
- `npm run start`: serve a production build.
- `npm run lint`: run ESLint.
