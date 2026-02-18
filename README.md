This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.js`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Problems I ran into and how I solved them

### 1. Learning Supabase from scratch
I had never used Supabase before. To get a basic understanding of Auth, Database, and Realtime, I followed a 1.5 hour crash course: [Supabase Crash Course](https://www.youtube.com/watch?v=kyphLGnSz6Q&t=408s). That gave me enough context to set up the project, RLS policies, and realtime subscriptions.

### 2. Vercel deployment: shared URL not accessible to others
After deploying, the live URL worked for the Vercel account owner, but when someone else (or another browser/account) opened the link, they were prompted to "Sign in with Vercel" or saw a request-for-access screen. **Cause:** Deployment Protection was enabled with "Vercel Authentication", so only logged-in Vercel users could access the deployment. **Fix:** I went to **Dashboard → Project → Settings → Deployment Protection** and **disabled** "Vercel Authentication". After that, the shared URL was publicly accessible.

### 3. Bookmark added twice on add
When adding a bookmark, it sometimes appeared twice in the list. **Cause:** The bookmark list state was updated in two places: (1) in the add-bookmark handler after a successful insert, and (2) in the Realtime `useEffect` when it received the `INSERT` event from Supabase. Both ran for the same insert, so the list got the new item twice. **Fix:** I removed the state update from the handler and relied only on the Realtime subscription to update the list. The handler now just clears the form; the Realtime event adds the new bookmark to the UI (and keeps other tabs in sync).
