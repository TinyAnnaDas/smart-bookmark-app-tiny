'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import BookmarksApp from '@/components/BookMarksApp';

export default function Home() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function loadSession() {
      const { data, error } = await supabase.auth.getSession();
      if (!mounted) return;

      if (error) {
        console.error('Error getting session:', error.message);
      }
      setSession(data?.session ?? null);
      setLoading(false);
    }

    loadSession();

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, newSession) => {
        if (!mounted) return;
        setSession(newSession);
      }
    );

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  async function handleSignIn() {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: 'http://localhost:3000' },
    });
  }

  async function handleSignOut() {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Error signing out:', error.message);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-950 text-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 rounded-full border-2 border-slate-600 border-t-indigo-400 animate-spin" />
          <p className="text-sm text-slate-400">Loading your bookmarks…</p>
        </div>
      </main>
    );
  }

  if (!session) {
    return (
      <main className="min-h-screen bg-slate-950 text-slate-50 flex items-center justify-center px-4">
        <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900/80 shadow-2xl shadow-slate-900/60 p-6 sm:p-8 space-y-6">
          <header className="space-y-2">
            <p className="inline-flex items-center gap-2 rounded-full border border-slate-800/80 bg-slate-900/80 px-3 py-1 text-xs font-medium uppercase tracking-wide text-slate-400">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400" />
              Smart bookmarking, zero clutter
            </p>
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-slate-50">
              Smart Bookmark App
            </h1>
            <p className="text-sm text-slate-400">
              Save, organize, and revisit your most important links in one clean, focused workspace.
            </p>
          </header>

          <div className="space-y-3 rounded-xl border border-slate-800/80 bg-slate-950/60 px-4 py-3 text-xs text-slate-400">
            <p className="font-medium text-slate-300">What you get</p>
            <ul className="space-y-1.5">
              <li className="flex items-start gap-2">
                <span className="mt-1 h-1.5 w-1.5 rounded-full bg-indigo-400" />
                <span>Fast capture for new links with titles.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 h-1.5 w-1.5 rounded-full bg-indigo-400" />
                <span>Clean reading-friendly list with one-click open.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 h-1.5 w-1.5 rounded-full bg-indigo-400" />
                <span>Secure sync tied to your Google account.</span>
              </li>
            </ul>
          </div>

          <button
            type="button"
            onClick={handleSignIn}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-50 px-4 py-2.5 text-sm font-medium text-slate-950 shadow-sm shadow-slate-900/40 transition hover:bg-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
          >
            <span className="inline-flex h-5 w-5 items-center justify-center rounded bg-white text-[10px] font-semibold text-slate-900 shadow-sm">
              G
            </span>
            <span>Sign in with Google</span>
          </button>

          <p className="text-[11px] text-slate-500">
            By continuing you agree to store your bookmarks securely with Supabase. You can sign out at any time
            from within the app.
          </p>
        </div>
      </main>
    );
  }

  const userEmail = session.user.email;

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50">
      <div className="mx-auto flex min-h-screen max-w-6xl flex-col px-4 pb-8 pt-4 sm:px-6 sm:pt-8 lg:px-8">
        <header className="mb-4 flex flex-col gap-4 border-b border-slate-800 pb-4 sm:mb-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-800/80 bg-slate-900/80 px-3 py-1 text-[11px] font-medium uppercase tracking-wide text-slate-400">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400" />
              Smart Bookmark App
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-slate-50">
                Your saved links
              </h1>
              <p className="text-sm text-slate-400">
                Capture new bookmarks in seconds and keep your reading queue organized.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-800 bg-slate-900/60 px-3 py-2 text-xs sm:text-sm">
            <div className="min-w-0">
              <p className="truncate font-medium text-slate-100">{userEmail}</p>
              <p className="text-[11px] text-slate-500">Signed in with Google</p>
            </div>
            <button
              type="button"
              onClick={handleSignOut}
              className="inline-flex items-center justify-center rounded-lg border border-slate-700 bg-slate-900/80 px-3 py-1.5 text-xs font-medium text-slate-200 transition hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
            >
              Sign out
            </button>
          </div>
        </header>

        <section className="flex-1 pb-4">
          <BookmarksApp session={session} />
        </section>
      </div>
    </main>
  );
}