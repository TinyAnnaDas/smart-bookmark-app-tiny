import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function BookmarksApp({ session }) {
  const [bookmarks, setBookmarks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [newUrl, setNewUrl] = useState('');

  useEffect(() => {
    async function loadBookmarks() {
      setLoading(true);
      setErrorMessage('');

      const { data, error } = await supabase
        .from('bookmarks')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading bookmarks:', error.message);
        setErrorMessage('Failed to load bookmarks');
      } else {
        setBookmarks(data || []);
      }

      setLoading(false);
    }

    loadBookmarks();
  }, [session.user.id]);

  useEffect(() => {
    if (!session?.user?.id) return;

    const channel = supabase
      .channel('bookmarks-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'bookmarks',
          // optional: filter server-side
          // filter: `user_id=eq.${session.user.id}`,
        },
        (payload) => {
          const newBookmark = payload.new;

          // Ensure it belongs to this user (extra safety)
          if (newBookmark.user_id !== session.user.id) return;

          setBookmarks((current) => {
            // avoid duplicates if this client also inserted it
            const exists = current.some((b) => b.id === newBookmark.id);
            if (exists) return current;
            return [newBookmark, ...current];
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'bookmarks',
        },
        (payload) => {
          const deletedBookmark = payload.old;

          setBookmarks((current) =>
            current.filter((b) => b.id !== deletedBookmark.id)
          );
        }
      )
      .subscribe((status) => {
        console.log('Realtime subscription status:', status);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [session?.user?.id, setBookmarks]);

  async function handleAddBookmark(event) {
    event.preventDefault();
    setErrorMessage('');

    const trimmedTitle = newTitle.trim();
    const trimmedUrl = newUrl.trim();

    if (!trimmedTitle || !trimmedUrl) {
      setErrorMessage('Title and URL are required');
      return;
    }

    const { data, error } = await supabase
      .from('bookmarks')
      .insert([
        {
          title: trimmedTitle,
          url: trimmedUrl,
          user_id: session.user.id,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error('Error adding bookmark:', error.message);
      setErrorMessage('Failed to add bookmark');
      return;
    }

    // Prepend the new bookmark to the list
    setBookmarks((current) => [data, ...current]);
    setNewTitle('');
    setNewUrl('');
  }

  async function handleDeleteBookmark(id) {
    setErrorMessage('');

    const { error } = await supabase
      .from('bookmarks')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting bookmark:', error.message);
      setErrorMessage('Failed to delete bookmark');
      return;
    }

    setBookmarks((current) => current.filter((b) => b.id !== id));
  }


  if (loading) {
    return (
      <section className="mt-4">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 sm:p-7">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full border-2 border-slate-700 border-t-indigo-400 animate-spin" />
            <div className="space-y-1">
              <p className="text-sm font-medium text-slate-100">Loading bookmarks…</p>
              <p className="text-xs text-slate-500">
                Fetching your latest saved links from Supabase.
              </p>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="mt-4 space-y-6 lg:space-y-0 lg:grid lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1.35fr)] lg:gap-6">
      <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 sm:p-6 space-y-5 shadow-sm shadow-slate-950/40">
        <div className="space-y-1">
          <h2 className="text-sm font-semibold tracking-tight text-slate-100">
            Add a new bookmark
          </h2>
          <p className="text-xs text-slate-500">
            Give it a clear title and a valid URL so you can find it quickly later.
          </p>
        </div>

        <form onSubmit={handleAddBookmark} className="space-y-4">
          <div className="space-y-3">
            <div className="space-y-1.5">
              <label
                htmlFor="bookmark-title"
                className="block text-xs font-medium text-slate-300"
              >
                Title
              </label>
              <input
                id="bookmark-title"
                type="text"
                placeholder="Article, tool, or resource name"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="block w-full rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm text-slate-50 placeholder-slate-500 shadow-inner shadow-slate-950/40 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="bookmark-url"
                className="block text-xs font-medium text-slate-300"
              >
                URL
              </label>
              <input
                id="bookmark-url"
                type="url"
                placeholder="https://example.com"
                value={newUrl}
                onChange={(e) => setNewUrl(e.target.value)}
                className="block w-full rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm text-slate-50 placeholder-slate-500 shadow-inner shadow-slate-950/40 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
            </div>
          </div>

          {errorMessage && (
            <p className="rounded-lg border border-rose-900/70 bg-rose-950/40 px-3 py-2 text-xs font-medium text-rose-300">
              {errorMessage}
            </p>
          )}

          <div className="flex items-center justify-between gap-3 pt-1">
            <p className="text-[11px] text-slate-500">
              Press <span className="rounded-md bg-slate-900 px-1.5 py-0.5 text-[10px] font-mono">Enter</span> to save your bookmark.
            </p>
            <button
              type="submit"
              className="inline-flex items-center justify-center rounded-lg bg-indigo-500 px-3.5 py-1.5 text-xs font-medium text-white shadow-sm shadow-indigo-500/40 transition hover:bg-indigo-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
            >
              Add bookmark
            </button>
          </div>
        </form>
      </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 sm:p-5 shadow-sm shadow-slate-950/40">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div className="space-y-0.5">
            <h2 className="text-sm font-semibold tracking-tight text-slate-100">
              Saved bookmarks
            </h2>
            <p className="text-[11px] text-slate-500">
              {bookmarks.length === 0
                ? 'You have no bookmarks yet.'
                : `${bookmarks.length} bookmarked link${bookmarks.length === 1 ? '' : 's'}.`}
            </p>
          </div>
        </div>

        {bookmarks.length === 0 ? (
          <div className="mt-4 flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-slate-800 bg-slate-950/40 px-4 py-10 text-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-900/80 text-slate-400">
              <span className="text-lg">🔖</span>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-slate-100">
                No bookmarks yet
              </p>
              <p className="text-xs text-slate-500">
                Start by adding a link you want to keep close. It will appear here instantly.
              </p>
            </div>
          </div>
        ) : (
          <ul className="mt-2 max-h-[460px] space-y-1.5 overflow-y-auto pr-1">
            {bookmarks.map((bookmark) => (
              <li
                key={bookmark.id}
                className="group flex items-start justify-between gap-3 rounded-xl border border-slate-800 bg-slate-950/50 px-3.5 py-2.5 text-sm transition hover:border-slate-700 hover:bg-slate-900/80"
              >
                <div className="min-w-0 space-y-0.5">
                  <a
                    href={bookmark.url}
                    target="_blank"
                    rel="noreferrer"
                    className="block truncate font-medium text-slate-50 hover:text-indigo-300"
                  >
                    {bookmark.title}
                  </a>
                  <p className="truncate text-[11px] text-slate-500">
                    {bookmark.url}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleDeleteBookmark(bookmark.id)}
                  className="ml-1 inline-flex flex-shrink-0 items-center rounded-lg border border-transparent px-2 py-1 text-[11px] font-medium text-rose-300 opacity-70 transition hover:border-rose-900/80 hover:bg-rose-950/50 hover:opacity-100"
                >
                  Delete
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}